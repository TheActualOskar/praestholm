using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Praestholm.Api.Data;
using Praestholm.Api.Models;

namespace Praestholm.Api.Services;

public partial class RecipeService
{
    private readonly BlogDbContext _db;

    public RecipeService(BlogDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<RecipeSummaryDto>> GetAllAsync(CancellationToken ct = default)
    {
        var recipes = await _db.Recipes
            .AsNoTracking()
            .OrderBy(r => r.Title)
            .ToListAsync(ct);

        var names = await _db.RecipeIngredients
            .AsNoTracking()
            .OrderBy(i => i.Position)
            .Select(i => new { i.RecipeId, i.Name })
            .ToListAsync(ct);
        var namesByRecipe = names
            .GroupBy(n => n.RecipeId)
            .ToDictionary(g => g.Key, g => g.Select(n => n.Name).Distinct(StringComparer.OrdinalIgnoreCase).ToArray());

        return recipes.Select(r => ToSummary(r, namesByRecipe.GetValueOrDefault(r.Id, []))).ToList();
    }

    public async Task<RecipeDto?> GetBySlugAsync(string slug, CancellationToken ct = default)
    {
        var recipe = await _db.Recipes
            .AsNoTracking()
            .Include(r => r.Ingredients)
            .Include(r => r.Steps)
            .AsSplitQuery()
            .FirstOrDefaultAsync(r => r.Slug == slug, ct);
        return recipe is null ? null : ToDto(recipe);
    }

    /// <returns>The saved recipe and whether it was newly created.</returns>
    public async Task<(RecipeDto recipe, bool created)> UpsertAsync(
        string slug, UpsertRecipeRequest request, CancellationToken ct = default, string? username = null)
    {
        var recipe = await _db.Recipes
            .Include(r => r.Ingredients)
            .Include(r => r.Steps)
            .AsSplitQuery()
            .FirstOrDefaultAsync(r => r.Slug == slug, ct);
        var created = recipe is null;
        var now = DateTime.UtcNow;

        if (recipe is null)
        {
            recipe = new Recipe { Slug = slug, CreatedAt = now, CreatedBy = username };
            _db.Recipes.Add(recipe);
        }

        if (request.IsDraft is { } isDraft)
            recipe.IsDraft = isDraft;
        recipe.UpdatedBy = username;

        recipe.Title = request.Title.Trim();
        recipe.SourceUrl = Clean(request.SourceUrl);
        recipe.Cuisine = Clean(request.Cuisine)?.ToLowerInvariant();
        recipe.Servings = request.Servings;
        recipe.TotalMinutes = request.TotalMinutes;
        recipe.ActiveMinutes = request.ActiveMinutes;
        recipe.Tags = string.Join(",", (request.Tags ?? []).Select(t => t.Trim()).Where(t => t.Length > 0));
        recipe.FreezesWell = request.FreezesWell;
        recipe.KeepsDays = request.KeepsDays;
        recipe.Intro = Clean(request.Intro);
        recipe.Leftovers = Clean(request.Leftovers);
        recipe.Notes = Clean(request.Notes);

        // Replace ingredients and steps as a whole; removed rows are deleted as orphans.
        recipe.Ingredients.Clear();
        recipe.Ingredients.AddRange((request.Ingredients ?? []).Select((i, pos) => new RecipeIngredient
        {
            Position = pos,
            Section = Clean(i.section),
            Amount = i.amount,
            Unit = Clean(i.unit),
            Name = i.name.Trim(),
            Note = Clean(i.note),
        }));

        recipe.Steps.Clear();
        recipe.Steps.AddRange((request.Steps ?? []).Select((s, pos) => new RecipeStep
        {
            Position = pos,
            Section = Clean(s.section),
            Text = s.text.Trim(),
        }));

        recipe.UpdatedAt = now;

        await _db.SaveChangesAsync(ct);
        return (ToDto(recipe), created);
    }

    /// <summary>Creates a recipe with a slug derived from the title ("lasagne", "lasagne-2", …).</summary>
    public async Task<RecipeDto> CreateAsync(UpsertRecipeRequest request, string? username, CancellationToken ct = default)
    {
        var baseSlug = Slugify(request.Title);
        if (baseSlug.Length == 0) baseSlug = "opskrift";
        if (baseSlug.Length > 190) baseSlug = baseSlug[..190].TrimEnd('-');

        var taken = await _db.Recipes
            .Where(r => r.Slug == baseSlug || r.Slug.StartsWith(baseSlug + "-"))
            .Select(r => r.Slug)
            .ToListAsync(ct);

        var slug = baseSlug;
        for (var n = 2; taken.Contains(slug); n++)
            slug = $"{baseSlug}-{n}";

        var (recipe, _) = await UpsertAsync(slug, request, ct, username);
        return recipe;
    }

    /// <summary>Same rules as the Obsidian import: lowercase, æ/ø/å spelled out, dashes between words.</summary>
    public static string Slugify(string text)
    {
        var s = text.Trim().ToLowerInvariant()
            .Replace("æ", "ae").Replace("ø", "oe").Replace("å", "aa");
        var normalized = s.Normalize(System.Text.NormalizationForm.FormD);
        var ascii = new string(normalized
            .Where(c => System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c)
                        != System.Globalization.UnicodeCategory.NonSpacingMark)
            .ToArray());
        return NonSlugChars().Replace(ascii, "-").Trim('-');
    }

    [GeneratedRegex("[^a-z0-9]+")]
    private static partial Regex NonSlugChars();

    public async Task<bool> DeleteAsync(string slug, CancellationToken ct = default)
    {
        var recipe = await _db.Recipes.FirstOrDefaultAsync(r => r.Slug == slug, ct);
        if (recipe is null) return false;

        // A draft madkurv drops the dish; locked/ordered baskets keep it (title + snapshot) for history.
        var draftLines = await _db.BasketRecipes
            .Where(l => l.RecipeId == recipe.Id
                        && _db.Baskets.Any(b => b.Id == l.BasketId && b.Status == BasketStatus.Draft))
            .ToListAsync(ct);
        _db.BasketRecipes.RemoveRange(draftLines);

        _db.Recipes.Remove(recipe);
        await _db.SaveChangesAsync(ct);
        return true;
    }

    /// <summary>Validates a request; returns an error message or null.</summary>
    public static string? Validate(string slug, UpsertRecipeRequest request)
    {
        if (!SlugRegex().IsMatch(slug))
            return "Slug must be lowercase letters, digits and dashes (max 200).";
        if (string.IsNullOrWhiteSpace(request.Title) || request.Title.Length > 200)
            return "Title is required (max 200 characters).";
        if (request.SourceUrl is { Length: > 500 })
            return "SourceUrl is too long (max 500).";
        if (request.SourceUrl is { Length: > 0 } url
            && !(Uri.TryCreate(url, UriKind.Absolute, out var uri) && (uri.Scheme == "https" || uri.Scheme == "http")))
            return "SourceUrl must be an absolute http(s) URL.";
        if (request.Tags is not null && string.Join(",", request.Tags).Length > 500)
            return "Tags are too long (max 500 characters in total).";
        if (request.Tags is not null && request.Tags.Any(t => t.Contains(',')))
            return "Tags must not contain commas.";
        if (request.Cuisine is { Length: > 50 })
            return "Cuisine is too long (max 50 characters).";
        if (request.Servings is < 1 or > 1000)
            return "Servings must be between 1 and 1000.";
        if (request.TotalMinutes is < 0 || request.ActiveMinutes is < 0 || request.KeepsDays is < 0)
            return "Times and days must not be negative.";
        if (request.Intro is { Length: > MaxMarkdown } || request.Leftovers is { Length: > MaxMarkdown }
            || request.Notes is { Length: > MaxMarkdown })
            return $"Intro, leftovers and notes are limited to {MaxMarkdown} characters each.";

        var ingredients = request.Ingredients ?? [];
        if (ingredients.Length > MaxRows)
            return $"At most {MaxRows} ingredients.";
        foreach (var i in ingredients)
        {
            if (i is null || string.IsNullOrWhiteSpace(i.name) || i.name.Length > 200)
                return "Every ingredient needs a name (max 200 characters).";
            if (i.amount is < 0 or >= 1_000_000)
                return $"Invalid amount for \"{i.name}\".";
            if (i.unit is { Length: > 30 } || i.note is { Length: > 200 } || i.section is { Length: > 100 })
                return $"Unit, note or section too long for \"{i.name}\".";
        }

        var steps = request.Steps ?? [];
        if (steps.Length > MaxRows)
            return $"At most {MaxRows} steps.";
        foreach (var st in steps)
        {
            if (st is null || string.IsNullOrWhiteSpace(st.text) || st.text.Length > 2000)
                return "Every step needs text (max 2000 characters).";
            if (st.section is { Length: > 100 })
                return "Step section is too long (max 100 characters).";
        }

        return null;
    }

    private const int MaxRows = 100;
    private const int MaxMarkdown = 20_000;

    private static string? Clean(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    [GeneratedRegex("^(?=.{1,200}$)[a-z0-9]+(?:-[a-z0-9]+)*$")]
    private static partial Regex SlugRegex();

    private static string[] SplitTags(string tags) =>
        string.IsNullOrWhiteSpace(tags)
            ? []
            : tags.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

    private static RecipeSummaryDto ToSummary(Recipe r, string[] ingredientNames) => new(
        r.Id, r.Title, r.Slug, r.SourceUrl, r.Cuisine, r.Servings, r.TotalMinutes, r.ActiveMinutes,
        SplitTags(r.Tags), r.FreezesWell, r.KeepsDays, r.IsDraft, r.CreatedAt, r.UpdatedAt, ingredientNames);

    private static RecipeDto ToDto(Recipe r) => new(
        r.Id, r.Title, r.Slug, r.SourceUrl, r.Cuisine, r.Servings, r.TotalMinutes, r.ActiveMinutes,
        SplitTags(r.Tags), r.FreezesWell, r.KeepsDays, r.Intro,
        r.Ingredients.OrderBy(i => i.Position)
            .Select(i => new IngredientDto(i.Section, i.Amount, i.Unit, i.Name, i.Note)).ToArray(),
        r.Steps.OrderBy(s => s.Position)
            .Select(s => new StepDto(s.Section, s.Text)).ToArray(),
        r.Leftovers, r.Notes, r.IsDraft, r.CreatedBy, r.UpdatedBy, r.CreatedAt, r.UpdatedAt);
}
