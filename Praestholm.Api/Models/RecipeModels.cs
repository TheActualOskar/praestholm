namespace Praestholm.Api.Models;

public class Recipe
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? SourceUrl { get; set; }

    /// <summary>Lowercase cuisine name, e.g. "italiensk", "thai", "malaysisk".</summary>
    public string? Cuisine { get; set; }

    public int? Servings { get; set; }
    public int? TotalMinutes { get; set; }
    public int? ActiveMinutes { get; set; }
    public string Tags { get; set; } = string.Empty;
    public bool FreezesWell { get; set; }
    public int? KeepsDays { get; set; }

    /// <summary>Markdown shown above the ingredients (planning notes, equipment).</summary>
    public string? Intro { get; set; }

    /// <summary>Markdown: what is typically left over and how to use it.</summary>
    public string? Leftovers { get; set; }

    /// <summary>Markdown: own changes and remarks.</summary>
    public string? Notes { get; set; }

    public List<RecipeIngredient> Ingredients { get; set; } = [];
    public List<RecipeStep> Steps { get; set; } = [];

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class RecipeIngredient
{
    public int Id { get; set; }
    public int RecipeId { get; set; }

    /// <summary>Order within the recipe (0-based).</summary>
    public int Position { get; set; }

    /// <summary>Optional sub-heading, e.g. "Mornaysauce" or "Til servering".</summary>
    public string? Section { get; set; }

    /// <summary>Amount for the recipe's servings; null for "salt og peber".</summary>
    public decimal? Amount { get; set; }

    public string? Unit { get; set; }
    public string Name { get; set; } = string.Empty;

    /// <summary>Preparation or alternatives, e.g. "finthakket" or "eller svinebov".</summary>
    public string? Note { get; set; }
}

public class RecipeStep
{
    public int Id { get; set; }
    public int RecipeId { get; set; }

    /// <summary>Order within the recipe (0-based); steps are numbered across sections.</summary>
    public int Position { get; set; }

    /// <summary>Optional sub-heading, e.g. "Samling" or "Dag 2 (morgen)".</summary>
    public string? Section { get; set; }

    public string Text { get; set; } = string.Empty;
}

public record IngredientDto(string? section, decimal? amount, string? unit, string name, string? note);

public record StepDto(string? section, string text);

public record RecipeSummaryDto(
    int id,
    string title,
    string slug,
    string? sourceUrl,
    string? cuisine,
    int? servings,
    int? totalMinutes,
    int? activeMinutes,
    string[] tags,
    bool freezesWell,
    int? keepsDays,
    DateTime updatedAt
);

public record RecipeDto(
    int id,
    string title,
    string slug,
    string? sourceUrl,
    string? cuisine,
    int? servings,
    int? totalMinutes,
    int? activeMinutes,
    string[] tags,
    bool freezesWell,
    int? keepsDays,
    string? intro,
    IngredientDto[] ingredients,
    StepDto[] steps,
    string? leftovers,
    string? notes,
    DateTime createdAt,
    DateTime updatedAt
);

/// <summary>Create-or-replace a recipe by slug. Ingredients and steps are replaced as a whole, in list order.</summary>
public record UpsertRecipeRequest(
    string Title,
    string? SourceUrl,
    string? Cuisine,
    int? Servings,
    int? TotalMinutes,
    int? ActiveMinutes,
    string[]? Tags,
    bool FreezesWell,
    int? KeepsDays,
    string? Intro,
    IngredientDto[]? Ingredients,
    StepDto[]? Steps,
    string? Leftovers,
    string? Notes
);
