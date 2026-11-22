namespace Praestholm.Api.Models;

public enum RecipeImportStatus
{
    /// <summary>Venter: waiting for the generator on the PC.</summary>
    Pending = 0,

    /// <summary>Behandles: claimed by a generator run.</summary>
    Processing = 1,

    /// <summary>Færdig: a draft recipe was created.</summary>
    Done = 2,

    /// <summary>Fejlet: the generator gave up; see Error.</summary>
    Failed = 3,
}

/// <summary>A recipe link waiting to be turned into a draft by the generator script.</summary>
public class RecipeImport
{
    public int Id { get; set; }
    public string Url { get; set; } = string.Empty;

    /// <summary>Wishes for the generator, e.g. "dobbelt portion, uden koriander".</summary>
    public string? Comment { get; set; }

    public RecipeImportStatus Status { get; set; }
    public string? Error { get; set; }

    /// <summary>Slug of the draft recipe once generated.</summary>
    public string? RecipeSlug { get; set; }

    public int Attempts { get; set; }
    public string? AddedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <param name="status">"venter", "behandles", "faerdig" or "fejlet".</param>
public record RecipeImportDto(
    int id, string url, string? comment, string status, string? error, string? recipeSlug,
    int attempts, string? addedBy, DateTime createdAt, DateTime updatedAt);

public record CreateRecipeImportRequest(string Url, string? Comment);

public record CompleteRecipeImportRequest(string RecipeSlug);

public record FailRecipeImportRequest(string Error);
