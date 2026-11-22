using Microsoft.EntityFrameworkCore;
using Praestholm.Api.Data;
using Praestholm.Api.Models;

namespace Praestholm.Api.Services;

/// <summary>
/// Queue of recipe links. The site adds links; the generator on the PC claims them,
/// creates a draft recipe and reports back.
/// </summary>
public class RecipeImportService
{
    private readonly BlogDbContext _db;

    public RecipeImportService(BlogDbContext db) => _db = db;

    public async Task<IReadOnlyList<RecipeImportDto>> GetAllAsync(RecipeImportStatus? status, CancellationToken ct = default)
    {
        var query = _db.RecipeImports.AsNoTracking();
        if (status is { } s) query = query.Where(i => i.Status == s);
        var items = await query.OrderByDescending(i => i.CreatedAt).Take(200).ToListAsync(ct);
        return items.Select(ToDto).ToList();
    }

    public async Task<RecipeImportDto> AddAsync(CreateRecipeImportRequest request, string? username, CancellationToken ct = default)
    {
        var url = request.Url.Trim();

        // The same link twice while it is still waiting: keep the first.
        var existing = await _db.RecipeImports.FirstOrDefaultAsync(
            i => i.Url == url && (i.Status == RecipeImportStatus.Pending || i.Status == RecipeImportStatus.Processing), ct);
        if (existing is not null) return ToDto(existing);

        var now = DateTime.UtcNow;
        var item = new RecipeImport
        {
            Url = url,
            Comment = string.IsNullOrWhiteSpace(request.Comment) ? null : request.Comment.Trim(),
            Status = RecipeImportStatus.Pending,
            AddedBy = username,
            CreatedAt = now,
            UpdatedAt = now,
        };
        _db.RecipeImports.Add(item);
        await _db.SaveChangesAsync(ct);
        return ToDto(item);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        var item = await _db.RecipeImports.FindAsync([id], ct);
        if (item is null) return false;
        _db.RecipeImports.Remove(item);
        await _db.SaveChangesAsync(ct);
        return true;
    }

    /// <summary>Failed (or stuck processing) -> waiting again.</summary>
    public async Task<RecipeImportDto?> RetryAsync(int id, CancellationToken ct = default) =>
        await TransitionAsync(id, [RecipeImportStatus.Failed, RecipeImportStatus.Processing], item =>
        {
            item.Status = RecipeImportStatus.Pending;
            item.Error = null;
        }, ct);

    /// <summary>Generator takes a waiting link; null if it is gone or already taken.</summary>
    public async Task<RecipeImportDto?> ClaimAsync(int id, CancellationToken ct = default) =>
        await TransitionAsync(id, [RecipeImportStatus.Pending], item =>
        {
            item.Status = RecipeImportStatus.Processing;
            item.Attempts++;
        }, ct);

    public async Task<RecipeImportDto?> CompleteAsync(int id, string recipeSlug, CancellationToken ct = default) =>
        await TransitionAsync(id, [RecipeImportStatus.Processing], item =>
        {
            item.Status = RecipeImportStatus.Done;
            item.RecipeSlug = recipeSlug;
            item.Error = null;
        }, ct);

    public async Task<RecipeImportDto?> FailAsync(int id, string error, CancellationToken ct = default) =>
        await TransitionAsync(id, [RecipeImportStatus.Processing], item =>
        {
            item.Status = RecipeImportStatus.Failed;
            item.Error = error.Length > 1000 ? error[..1000] : error;
        }, ct);

    private async Task<RecipeImportDto?> TransitionAsync(
        int id, RecipeImportStatus[] from, Action<RecipeImport> apply, CancellationToken ct)
    {
        var item = await _db.RecipeImports.FindAsync([id], ct);
        if (item is null || !from.Contains(item.Status)) return null;
        apply(item);
        item.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return ToDto(item);
    }

    public static string? Validate(CreateRecipeImportRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Url) || request.Url.Length > 500
            || !Uri.TryCreate(request.Url.Trim(), UriKind.Absolute, out var uri)
            || (uri.Scheme != Uri.UriSchemeHttps && uri.Scheme != Uri.UriSchemeHttp))
            return "Indsæt et link, der starter med https://";
        if (request.Comment is { Length: > 500 })
            return "Kommentaren er for lang (højst 500 tegn).";
        return null;
    }

    public static RecipeImportStatus? ParseStatus(string? status) => status switch
    {
        "venter" => RecipeImportStatus.Pending,
        "behandles" => RecipeImportStatus.Processing,
        "faerdig" => RecipeImportStatus.Done,
        "fejlet" => RecipeImportStatus.Failed,
        _ => null,
    };

    private static string StatusName(RecipeImportStatus s) => s switch
    {
        RecipeImportStatus.Pending => "venter",
        RecipeImportStatus.Processing => "behandles",
        RecipeImportStatus.Done => "faerdig",
        _ => "fejlet",
    };

    private static RecipeImportDto ToDto(RecipeImport i) => new(
        i.Id, i.Url, i.Comment, StatusName(i.Status), i.Error, i.RecipeSlug, i.Attempts, i.AddedBy, i.CreatedAt, i.UpdatedAt);
}
