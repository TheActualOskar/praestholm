namespace Praestholm.Api.Models;

public class Recipe
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? SourceUrl { get; set; }
    public int? Servings { get; set; }
    public int? TotalMinutes { get; set; }
    public int? ActiveMinutes { get; set; }
    public string Tags { get; set; } = string.Empty;
    public bool FreezesWell { get; set; }
    public int? KeepsDays { get; set; }

    /// <summary>Markdown body: ingredients, method, leftovers and notes.</summary>
    public string Content { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public record RecipeSummaryDto(
    int id,
    string title,
    string slug,
    string? sourceUrl,
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
    int? servings,
    int? totalMinutes,
    int? activeMinutes,
    string[] tags,
    bool freezesWell,
    int? keepsDays,
    string content,
    DateTime createdAt,
    DateTime updatedAt
);

/// <summary>Create-or-replace a recipe by slug (used by the Obsidian sync).</summary>
public record UpsertRecipeRequest(
    string Title,
    string? SourceUrl,
    int? Servings,
    int? TotalMinutes,
    int? ActiveMinutes,
    string[]? Tags,
    bool FreezesWell,
    int? KeepsDays,
    string Content
);
