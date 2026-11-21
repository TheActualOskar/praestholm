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

        return recipes.Select(ToSummary).ToList();
    }

    public async Task<RecipeDto?> GetBySlugAsync(string slug, CancellationToken ct = default)
    {
        var recipe = await _db.Recipes.AsNoTracking().FirstOrDefaultAsync(r => r.Slug == slug, ct);
        return recipe is null ? null : ToDto(recipe);
    }

    /// <returns>The saved recipe and whether it was newly created.</returns>
    public async Task<(RecipeDto recipe, bool created)> UpsertAsync(
        string slug, UpsertRecipeRequest request, CancellationToken ct = default)
    {
        var recipe = await _db.Recipes.FirstOrDefaultAsync(r => r.Slug == slug, ct);
        var created = recipe is null;
        var now = DateTime.UtcNow;

        if (recipe is null)
        {
            recipe = new Recipe { Slug = slug, CreatedAt = now };
            _db.Recipes.Add(recipe);
        }

        recipe.Title = request.Title.Trim();
        recipe.SourceUrl = string.IsNullOrWhiteSpace(request.SourceUrl) ? null : request.SourceUrl.Trim();
        recipe.Servings = request.Servings;
        recipe.TotalMinutes = request.TotalMinutes;
        recipe.ActiveMinutes = request.ActiveMinutes;
        recipe.Tags = string.Join(",", (request.Tags ?? []).Select(t => t.Trim()).Where(t => t.Length > 0));
        recipe.FreezesWell = request.FreezesWell;
        recipe.KeepsDays = request.KeepsDays;
        recipe.Content = request.Content;
        recipe.UpdatedAt = now;

        await _db.SaveChangesAsync(ct);
        return (ToDto(recipe), created);
    }

    public async Task<bool> DeleteAsync(string slug, CancellationToken ct = default)
    {
        var recipe = await _db.Recipes.FirstOrDefaultAsync(r => r.Slug == slug, ct);
        if (recipe is null) return false;

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
        return null;
    }

    [GeneratedRegex("^(?=.{1,200}$)[a-z0-9]+(?:-[a-z0-9]+)*$")]
    private static partial Regex SlugRegex();

    private static string[] SplitTags(string tags) =>
        string.IsNullOrWhiteSpace(tags)
            ? []
            : tags.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

    private static RecipeSummaryDto ToSummary(Recipe r) => new(
        r.Id, r.Title, r.Slug, r.SourceUrl, r.Servings, r.TotalMinutes, r.ActiveMinutes,
        SplitTags(r.Tags), r.FreezesWell, r.KeepsDays, r.UpdatedAt);

    private static RecipeDto ToDto(Recipe r) => new(
        r.Id, r.Title, r.Slug, r.SourceUrl, r.Servings, r.TotalMinutes, r.ActiveMinutes,
        SplitTags(r.Tags), r.FreezesWell, r.KeepsDays, r.Content, r.CreatedAt, r.UpdatedAt);
}
