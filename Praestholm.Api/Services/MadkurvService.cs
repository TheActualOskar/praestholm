using Microsoft.EntityFrameworkCore;
using Praestholm.Api.Data;
using Praestholm.Api.Models;

namespace Praestholm.Api.Services;

/// <summary>Thrown when an action does not fit the basket's status; mapped to 409 with this message.</summary>
public class BasketConflictException(string message) : Exception(message);

public class MadkurvService
{
    private readonly BlogDbContext _db;

    public MadkurvService(BlogDbContext db) => _db = db;

    // ---------- Current basket ----------

    /// <summary>The open basket (not ordered); a new draft is created if there is none.</summary>
    public async Task<BasketDto> GetCurrentAsync(CancellationToken ct = default) =>
        await ToDtoAsync(await LoadCurrentAsync(ct), ct);

    private async Task<Basket> LoadCurrentAsync(CancellationToken ct)
    {
        var basket = await Baskets()
            .Where(b => b.Status != BasketStatus.Ordered)
            .OrderByDescending(b => b.Id)
            .FirstOrDefaultAsync(ct);

        if (basket is null)
        {
            basket = new Basket { Status = BasketStatus.Draft, CreatedAt = DateTime.UtcNow };
            _db.Baskets.Add(basket);
            await _db.SaveChangesAsync(ct);
        }

        return basket;
    }

    private IQueryable<Basket> Baskets() => _db.Baskets
        .Include(b => b.Recipes).ThenInclude(r => r.Recipe!).ThenInclude(r => r.Ingredients)
        .Include(b => b.Extras)
        .Include(b => b.Checks)
        .Include(b => b.Items)
        .AsSplitQuery();

    private async Task<Basket> LoadDraftAsync(CancellationToken ct)
    {
        var basket = await LoadCurrentAsync(ct);
        if (basket.Status != BasketStatus.Draft)
            throw new BasketConflictException("Madkurven er låst. Tryk “Ret igen” for at ændre den.");
        return basket;
    }

    public async Task<BasketDto> AddRecipeAsync(AddBasketRecipeRequest request, string? username, CancellationToken ct = default)
    {
        var basket = await LoadDraftAsync(ct);
        var recipe = await _db.Recipes.Include(r => r.Ingredients).FirstOrDefaultAsync(r => r.Id == request.RecipeId, ct)
            ?? throw new KeyNotFoundException("Opskriften findes ikke.");

        // Adding the same recipe twice keeps the existing line (idempotent "Læg i madkurv").
        if (basket.Recipes.All(r => r.RecipeId != recipe.Id))
        {
            basket.Recipes.Add(new BasketRecipe
            {
                RecipeId = recipe.Id,
                Recipe = recipe,
                RecipeTitle = recipe.Title,
                Servings = request.Servings ?? recipe.Servings ?? 4,
                Day = request.Day,
                Note = Clean(request.Note),
                AddedAt = DateTime.UtcNow,
                AddedBy = username,
            });
            await _db.SaveChangesAsync(ct);
        }

        return await ToDtoAsync(basket, ct);
    }

    public async Task<BasketDto> UpdateRecipeAsync(int id, UpdateBasketRecipeRequest request, CancellationToken ct = default)
    {
        var basket = await LoadDraftAsync(ct);
        var line = basket.Recipes.FirstOrDefault(r => r.Id == id) ?? throw new KeyNotFoundException("Retten er ikke i madkurven.");
        line.Servings = request.Servings;
        line.Day = request.Day;
        line.Note = Clean(request.Note);
        await _db.SaveChangesAsync(ct);
        return await ToDtoAsync(basket, ct);
    }

    public async Task<BasketDto> RemoveRecipeAsync(int id, CancellationToken ct = default)
    {
        var basket = await LoadDraftAsync(ct);
        var line = basket.Recipes.FirstOrDefault(r => r.Id == id) ?? throw new KeyNotFoundException("Retten er ikke i madkurven.");
        basket.Recipes.Remove(line);
        await _db.SaveChangesAsync(ct);
        return await ToDtoAsync(basket, ct);
    }

    public async Task<BasketDto> AddExtraAsync(ItemRequest request, string? username, CancellationToken ct = default)
    {
        var basket = await LoadDraftAsync(ct);
        basket.Extras.Add(new BasketExtra
        {
            Name = request.Name.Trim(),
            Amount = request.Amount,
            Unit = Clean(request.Unit),
            Note = Clean(request.Note),
            AddedBy = username,
        });
        await _db.SaveChangesAsync(ct);
        return await ToDtoAsync(basket, ct);
    }

    public async Task<BasketDto> RemoveExtraAsync(int id, CancellationToken ct = default)
    {
        var basket = await LoadDraftAsync(ct);
        var extra = basket.Extras.FirstOrDefault(e => e.Id == id) ?? throw new KeyNotFoundException("Varen er ikke i madkurven.");
        basket.Extras.Remove(extra);
        await _db.SaveChangesAsync(ct);
        return await ToDtoAsync(basket, ct);
    }

    /// <summary>"Har det" toggle. Works on the live list (draft) and on the snapshot (locked, until ordered).</summary>
    public async Task<BasketDto> SetCheckAsync(CheckRequest request, CancellationToken ct = default)
    {
        var basket = await LoadCurrentAsync(ct);
        if (basket.Status == BasketStatus.Draft)
        {
            var check = basket.Checks.FirstOrDefault(c => c.Key == request.Key);
            if (check is null) basket.Checks.Add(new BasketCheck { Key = request.Key, Have = request.Have });
            else check.Have = request.Have;
        }
        else
        {
            var item = basket.Items.FirstOrDefault(i => i.Key == request.Key) ?? throw new KeyNotFoundException("Varen findes ikke.");
            item.Have = request.Have;
        }

        await _db.SaveChangesAsync(ct);
        return await ToDtoAsync(basket, ct);
    }

    // ---------- Lifecycle ----------

    /// <summary>Kladde -> Klar: freezes the shopping list and takes the open wishes.</summary>
    public async Task<BasketDto> LockAsync(CancellationToken ct = default)
    {
        var basket = await LoadDraftAsync(ct);
        var items = await ComputeItemsAsync(basket, ct);
        if (items.Count == 0)
            throw new BasketConflictException("Madkurven er tom.");

        basket.Items.Clear();
        basket.Items.AddRange(items.Select((i, pos) => new BasketItem
        {
            Position = pos,
            Key = i.key,
            Name = i.name,
            Amount = i.amount,
            Unit = i.unit,
            Sources = string.Join(", ", i.sources),
            Note = i.note,
            Have = i.have,
            FromPantry = i.fromPantry,
            Ignored = i.ignored,
        }));

        await _db.HouseholdItems
            .Where(w => w.Kind == HouseholdListKind.Wish && w.BasketId == null)
            .UpdateEachAsync(w => w.BasketId = basket.Id, ct);

        basket.Status = BasketStatus.Ready;
        basket.LockedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return await ToDtoAsync(basket, ct);
    }

    /// <summary>Klar/Fyldt -> Kladde: drops the snapshot but keeps the "har det" choices.</summary>
    public async Task<BasketDto> ReopenAsync(CancellationToken ct = default)
    {
        var basket = await LoadCurrentAsync(ct);
        if (basket.Status == BasketStatus.Draft) return await ToDtoAsync(basket, ct);

        foreach (var item in basket.Items.Where(i => i.Have != i.FromPantry))
        {
            var check = basket.Checks.FirstOrDefault(c => c.Key == item.Key);
            if (check is null) basket.Checks.Add(new BasketCheck { Key = item.Key, Have = item.Have });
            else check.Have = item.Have;
        }

        basket.Items.Clear();
        await _db.HouseholdItems
            .Where(w => w.Kind == HouseholdListKind.Wish && w.BasketId == basket.Id)
            .UpdateEachAsync(w => w.BasketId = null, ct);

        basket.Status = BasketStatus.Draft;
        basket.LockedAt = null;
        await _db.SaveChangesAsync(ct);
        return await ToDtoAsync(basket, ct);
    }

    /// <summary>
    /// "Tøm madkurv": removes all dishes, extras and "har det" choices. A locked basket is unlocked first
    /// (snapshot dropped, wishes released). Wishes and staples are shared lists and stay.
    /// </summary>
    public async Task<BasketDto> ClearAsync(CancellationToken ct = default)
    {
        var basket = await LoadCurrentAsync(ct);
        if (basket.Status != BasketStatus.Draft)
        {
            basket.Items.Clear();
            await _db.HouseholdItems
                .Where(w => w.Kind == HouseholdListKind.Wish && w.BasketId == basket.Id)
                .UpdateEachAsync(w => w.BasketId = null, ct);
            basket.Status = BasketStatus.Draft;
            basket.LockedAt = null;
        }

        basket.Recipes.Clear();
        basket.Extras.Clear();
        basket.Checks.Clear();
        await _db.SaveChangesAsync(ct);
        return await ToDtoAsync(basket, ct);
    }

    /// <summary>Klar/Fyldt -> Bestilt. The next GET opens a fresh draft.</summary>
    public async Task<BasketDto> MarkOrderedAsync(MarkOrderedRequest request, CancellationToken ct = default)
    {
        var basket = await LoadCurrentAsync(ct);
        if (basket.Status == BasketStatus.Draft)
            throw new BasketConflictException("Gør madkurven klar til bestilling først.");

        basket.Status = BasketStatus.Ordered;
        basket.OrderedAt = DateTime.UtcNow;
        basket.DeliveryDate = request.DeliveryDate;
        await _db.SaveChangesAsync(ct);
        return await ToDtoAsync(basket, ct);
    }

    // ---------- History ----------

    public async Task<IReadOnlyList<BasketSummaryDto>> GetHistoryAsync(CancellationToken ct = default)
    {
        var baskets = await _db.Baskets
            .AsNoTracking()
            .Where(b => b.Status == BasketStatus.Ordered)
            .OrderByDescending(b => b.OrderedAt)
            .Take(52)
            .Select(b => new
            {
                b.Id, b.Status, b.CreatedAt, b.OrderedAt, b.DeliveryDate,
                Recipes = b.Recipes.OrderBy(r => r.Id).Select(r => r.RecipeTitle).ToList(),
                ItemCount = b.Items.Count(i => !i.Have),
            })
            .ToListAsync(ct);

        return baskets
            .Select(b => new BasketSummaryDto(b.Id, StatusName(b.Status), b.CreatedAt, b.OrderedAt, b.DeliveryDate, b.Recipes.ToArray(), b.ItemCount))
            .ToList();
    }

    public async Task<BasketDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var basket = await Baskets().FirstOrDefaultAsync(b => b.Id == id, ct);
        return basket is null ? null : await ToDtoAsync(basket, ct);
    }

    /// <summary>"Gentag": copies the recipes of an earlier basket into the current draft.</summary>
    public async Task<BasketDto> CopyRecipesAsync(int fromId, string? username, CancellationToken ct = default)
    {
        var basket = await LoadDraftAsync(ct);
        var source = await _db.BasketRecipes
            .Include(r => r.Recipe!).ThenInclude(r => r.Ingredients)
            .Where(r => r.BasketId == fromId && r.RecipeId != null)
            .OrderBy(r => r.Id)
            .ToListAsync(ct);

        foreach (var line in source.Where(s => basket.Recipes.All(r => r.RecipeId != s.RecipeId)))
        {
            basket.Recipes.Add(new BasketRecipe
            {
                RecipeId = line.RecipeId,
                Recipe = line.Recipe,
                RecipeTitle = line.Recipe!.Title,
                Servings = line.Servings,
                Note = line.Note,
                AddedAt = DateTime.UtcNow,
                AddedBy = username,
            });
        }

        await _db.SaveChangesAsync(ct);
        return await ToDtoAsync(basket, ct);
    }

    // ---------- Household lists ----------

    public async Task<IReadOnlyList<HouseholdItemDto>> GetListAsync(HouseholdListKind kind, CancellationToken ct = default)
    {
        var items = await _db.HouseholdItems
            .AsNoTracking()
            .Where(i => i.Kind == kind && (kind != HouseholdListKind.Wish || i.BasketId == null))
            .OrderBy(i => i.Name)
            .ToListAsync(ct);
        return items.Select(ToDto).ToList();
    }

    public async Task<HouseholdItemDto> AddItemAsync(HouseholdListKind kind, ItemRequest request, string? username, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var item = new HouseholdItem
        {
            Kind = kind,
            Name = request.Name.Trim(),
            Amount = request.Amount,
            Unit = Clean(request.Unit),
            Note = Clean(request.Note),
            Active = request.Active ?? true,
            AddedBy = username,
            CreatedAt = now,
            UpdatedAt = now,
        };
        _db.HouseholdItems.Add(item);
        await _db.SaveChangesAsync(ct);
        return ToDto(item);
    }

    public async Task<HouseholdItemDto?> UpdateItemAsync(HouseholdListKind kind, int id, ItemRequest request, CancellationToken ct = default)
    {
        var item = await _db.HouseholdItems.FirstOrDefaultAsync(i => i.Id == id && i.Kind == kind, ct);
        if (item is null) return null;
        item.Name = request.Name.Trim();
        item.Amount = request.Amount;
        item.Unit = Clean(request.Unit);
        item.Note = Clean(request.Note);
        if (request.Active is { } active) item.Active = active;
        item.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return ToDto(item);
    }

    public async Task<bool> DeleteItemAsync(HouseholdListKind kind, int id, CancellationToken ct = default)
    {
        var item = await _db.HouseholdItems.FirstOrDefaultAsync(i => i.Id == id && i.Kind == kind, ct);
        if (item is null) return false;
        _db.HouseholdItems.Remove(item);
        await _db.SaveChangesAsync(ct);
        return true;
    }

    /// <summary>Starter set for the krydderiskab; all ticked (ignored).</summary>
    public static readonly string[] SpiceSuggestions =
    [
        "salt", "peber", "smør", "olie", "hvedemel", "sukker",
        "oregano", "timian", "paprika", "spidskommen", "kanel", "karry", "chilipulver", "chiliflager",
        "cayennepeber", "gurkemeje", "laurbærblade", "muskatnød", "garam masala", "stjerneanis",
        "stødt koriander", "kardemomme", "nelliker", "allehånde",
    ];

    /// <summary>Adds the suggestions that are not on the krydderiskab yet.</summary>
    public async Task<IReadOnlyList<HouseholdItemDto>> AddSpiceSuggestionsAsync(string? username, CancellationToken ct = default)
    {
        var existing = (await _db.HouseholdItems
                .Where(i => i.Kind == HouseholdListKind.Spice)
                .Select(i => i.Name)
                .ToListAsync(ct))
            .Select(ShoppingListBuilder.NormalizeName)
            .ToHashSet();

        var now = DateTime.UtcNow;
        foreach (var name in SpiceSuggestions.Where(n => !existing.Contains(n)))
        {
            _db.HouseholdItems.Add(new HouseholdItem
            {
                Kind = HouseholdListKind.Spice, Name = name, Active = true, AddedBy = username, CreatedAt = now, UpdatedAt = now,
            });
        }

        await _db.SaveChangesAsync(ct);
        return await GetListAsync(HouseholdListKind.Spice, ct);
    }

    public static string? ValidateItem(ItemRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Length > 200) return "Skriv et navn (højst 200 tegn).";
        if (request.Amount is < 0 or >= 1_000_000) return "Ugyldig mængde.";
        if (request.Unit is { Length: > 30 } || request.Note is { Length: > 200 }) return "Enhed eller note er for lang.";
        return null;
    }

    // ---------- Mapping ----------

    private async Task<List<ShoppingItemDto>> ComputeItemsAsync(Basket basket, CancellationToken ct)
    {
        var lines = new List<ShoppingLine>();

        foreach (var line in basket.Recipes.Where(r => r.Recipe is not null).OrderBy(r => r.Id))
        {
            var recipe = line.Recipe!;
            var factor = recipe.Servings is > 0 ? (decimal)line.Servings / recipe.Servings.Value : 1m;
            foreach (var i in recipe.Ingredients.OrderBy(i => i.Position))
                lines.Add(new ShoppingLine(i.Name, i.Amount * factor, i.Unit, recipe.Title));
        }

        var lists = await _db.HouseholdItems
            .AsNoTracking()
            .Where(i => (i.Kind == HouseholdListKind.Staple && i.Active)
                        || (i.Kind == HouseholdListKind.Wish && (i.BasketId == null || i.BasketId == basket.Id))
                        || i.Kind == HouseholdListKind.Pantry
                        || (i.Kind == HouseholdListKind.Spice && i.Active))
            .ToListAsync(ct);

        lines.AddRange(lists.Where(i => i.Kind == HouseholdListKind.Staple).Select(i => new ShoppingLine(i.Name, i.Amount, i.Unit, "Fast vare")));
        lines.AddRange(lists.Where(i => i.Kind == HouseholdListKind.Wish).Select(i => new ShoppingLine(i.Name, i.Amount, i.Unit, "Ønske")));
        lines.AddRange(basket.Extras.OrderBy(e => e.Id).Select(e => new ShoppingLine(e.Name, e.Amount, e.Unit, "Ekstra")));

        var pantry = lists.Where(i => i.Kind == HouseholdListKind.Pantry).Select(i => (i.Name, i.Amount, i.Unit));
        var checks = basket.Checks.ToDictionary(c => c.Key, c => c.Have);
        var ignore = lists.Where(i => i.Kind == HouseholdListKind.Spice).Select(i => (i.Id, i.Name));
        return ShoppingListBuilder.Build(lines, pantry, checks, ignore);
    }

    private async Task<BasketDto> ToDtoAsync(Basket basket, CancellationToken ct)
    {
        var items = basket.Status == BasketStatus.Draft
            ? await ComputeItemsAsync(basket, ct)
            : basket.Items.OrderBy(i => i.Position)
                .Select(i => new ShoppingItemDto(i.Key, i.Name, i.Amount, i.Unit,
                    i.Sources.Split(", ", StringSplitOptions.RemoveEmptyEntries), i.Note, i.Have, i.FromPantry, i.Ignored))
                .ToList();

        var wishes = await _db.HouseholdItems
            .AsNoTracking()
            .Where(w => w.Kind == HouseholdListKind.Wish
                        && (basket.Status == BasketStatus.Draft ? w.BasketId == null : w.BasketId == basket.Id))
            .OrderBy(w => w.CreatedAt)
            .ToListAsync(ct);

        return new BasketDto(
            basket.Id,
            StatusName(basket.Status),
            basket.CreatedAt,
            basket.LockedAt,
            basket.OrderedAt,
            basket.DeliveryDate,
            basket.Recipes.OrderBy(r => r.Day ?? 7).ThenBy(r => r.Id)
                .Select(r => new BasketRecipeDto(r.Id, r.RecipeId, r.Recipe?.Slug, r.Recipe?.Title ?? r.RecipeTitle,
                    r.Servings, r.Recipe?.Servings, r.Day, r.Note, r.AddedBy))
                .ToArray(),
            basket.Extras.OrderBy(e => e.Id).Select(e => new BasketExtraDto(e.Id, e.Name, e.Amount, e.Unit, e.Note, e.AddedBy)).ToArray(),
            wishes.Select(ToDto).ToArray(),
            items.ToArray());
    }

    private static HouseholdItemDto ToDto(HouseholdItem i) =>
        new(i.Id, i.Name, i.Amount, i.Unit, i.Note, i.Active, i.AddedBy, i.UpdatedAt);

    public static string StatusName(BasketStatus status) => status switch
    {
        BasketStatus.Draft => "kladde",
        BasketStatus.Ready => "klar",
        BasketStatus.Filled => "fyldt",
        _ => "bestilt",
    };

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}

internal static class QueryableExtensions
{
    /// <summary>Loads the (few) matching rows and changes them; saved by the caller's next SaveChanges.</summary>
    public static async Task UpdateEachAsync(this IQueryable<HouseholdItem> query, Action<HouseholdItem> apply, CancellationToken ct)
    {
        foreach (var item in await query.ToListAsync(ct)) apply(item);
    }
}
