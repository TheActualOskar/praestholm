namespace Praestholm.Api.Models;

/// <summary>Lifecycle of a madkurv. There is at most one basket that is not <see cref="Ordered"/>.</summary>
public enum BasketStatus
{
    /// <summary>Kladde: being planned; recipes and extras can change.</summary>
    Draft = 0,

    /// <summary>Klar: locked, the shopping list is snapshotted and waits to be put in the nemlig cart.</summary>
    Ready = 1,

    /// <summary>Fyldt: the PC has filled the nemlig cart (step 5).</summary>
    Filled = 2,

    /// <summary>Bestilt: checked out on nemlig; a new draft opens.</summary>
    Ordered = 3,
}

public class Basket
{
    public int Id { get; set; }
    public BasketStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LockedAt { get; set; }
    public DateTime? OrderedAt { get; set; }
    public DateOnly? DeliveryDate { get; set; }

    public List<BasketRecipe> Recipes { get; set; } = [];
    public List<BasketExtra> Extras { get; set; } = [];

    /// <summary>"Har det" choices made before the basket was locked, keyed by shopping item key.</summary>
    public List<BasketCheck> Checks { get; set; } = [];

    /// <summary>The shopping list frozen when the basket was locked; empty while it is a draft.</summary>
    public List<BasketItem> Items { get; set; } = [];
}

public class BasketRecipe
{
    public int Id { get; set; }
    public int BasketId { get; set; }

    /// <summary>Null if the recipe has since been deleted.</summary>
    public int? RecipeId { get; set; }
    public Recipe? Recipe { get; set; }

    /// <summary>Title at the time it was added, so history survives recipe deletion.</summary>
    public string RecipeTitle { get; set; } = string.Empty;

    public int Servings { get; set; }

    /// <summary>0 = Monday … 6 = Sunday; null = not planned to a day.</summary>
    public int? Day { get; set; }

    public string? Note { get; set; }
    public DateTime AddedAt { get; set; }
    public string? AddedBy { get; set; }
}

/// <summary>One-off item for this basket only ("køkkenrulle").</summary>
public class BasketExtra
{
    public int Id { get; set; }
    public int BasketId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal? Amount { get; set; }
    public string? Unit { get; set; }
    public string? Note { get; set; }
    public string? AddedBy { get; set; }
}

public class BasketCheck
{
    public int Id { get; set; }
    public int BasketId { get; set; }
    public string Key { get; set; } = string.Empty;

    /// <summary>True = we have it, skip; false = buy it even though the pantry says we have it.</summary>
    public bool Have { get; set; }
}

public class BasketItem
{
    public int Id { get; set; }
    public int BasketId { get; set; }
    public int Position { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal? Amount { get; set; }
    public string? Unit { get; set; }

    /// <summary>Comma-separated sources, e.g. "Lasagne, Spaghetti bolognese" or "Fast vare".</summary>
    public string Sources { get; set; } = string.Empty;

    public string? Note { get; set; }
    public bool Have { get; set; }
    public bool FromPantry { get; set; }
}

public enum HouseholdListKind
{
    /// <summary>Faste varer: bought with every order.</summary>
    Staple = 0,

    /// <summary>Ønsker: wanted in the next order, then cleared.</summary>
    Wish = 1,

    /// <summary>Beholdning: already at home; subtracted from the shopping list.</summary>
    Pantry = 2,
}

public class HouseholdItem
{
    public int Id { get; set; }
    public HouseholdListKind Kind { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal? Amount { get; set; }
    public string? Unit { get; set; }
    public string? Note { get; set; }

    /// <summary>Staples can be paused without deleting them.</summary>
    public bool Active { get; set; } = true;

    /// <summary>Wishes: the basket that used it. Null = still open.</summary>
    public int? BasketId { get; set; }

    public string? AddedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

// ---------- DTOs ----------

public record BasketRecipeDto(int id, int? recipeId, string? slug, string title, int servings, int? recipeServings, int? day, string? note, string? addedBy);

public record BasketExtraDto(int id, string name, decimal? amount, string? unit, string? note, string? addedBy);

/// <param name="key">Stable id of the merged item (name|unit group); used for "har det".</param>
/// <param name="fromPantry">The pantry covers it (shown under "Har allerede").</param>
public record ShoppingItemDto(string key, string name, decimal? amount, string? unit, string[] sources, string? note, bool have, bool fromPantry);

/// <param name="status">"kladde", "klar", "fyldt" or "bestilt".</param>
public record BasketDto(
    int id,
    string status,
    DateTime createdAt,
    DateTime? lockedAt,
    DateTime? orderedAt,
    DateOnly? deliveryDate,
    BasketRecipeDto[] recipes,
    BasketExtraDto[] extras,
    HouseholdItemDto[] wishes,
    ShoppingItemDto[] items
);

public record BasketSummaryDto(int id, string status, DateTime createdAt, DateTime? orderedAt, DateOnly? deliveryDate, string[] recipes, int itemCount);

public record HouseholdItemDto(int id, string name, decimal? amount, string? unit, string? note, bool active, string? addedBy, DateTime updatedAt);

public record AddBasketRecipeRequest(int RecipeId, int? Servings, int? Day, string? Note);

public record UpdateBasketRecipeRequest(int Servings, int? Day, string? Note);

public record ItemRequest(string Name, decimal? Amount, string? Unit, string? Note, bool? Active = null);

public record CheckRequest(string Key, bool Have);

public record MarkOrderedRequest(DateOnly? DeliveryDate);
