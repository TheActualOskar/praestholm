using System.Security.Claims;
using Praestholm.Api.Models;
using Praestholm.Api.Services;

namespace Praestholm.Api.Endpoints;

/// <summary>
/// /api/recipe-imports: the "Til generering" queue. Logged-in users add, delete and retry links;
/// the generator on the PC (API key) claims them and reports the result.
/// </summary>
public static class RecipeImportEndpoints
{
    public static IEndpointRouteBuilder MapRecipeImportEndpoints(this IEndpointRouteBuilder app)
    {
        var config = app.ServiceProvider.GetRequiredService<IConfiguration>();
        var auth = new UserOrApiKeyEndpointFilter(new ApiKeyEndpointFilter(config));
        var group = app.MapGroup("/api/recipe-imports").AddEndpointFilter(auth).WithOpenApi();

        group.MapGet("", async (string? status, RecipeImportService s, CancellationToken ct) =>
        {
            var parsed = RecipeImportService.ParseStatus(status);
            if (status is not null && parsed is null) return Results.BadRequest(new { error = "Ukendt status." });
            return Results.Ok(await s.GetAllAsync(parsed, ct));
        });

        group.MapPost("", async (CreateRecipeImportRequest r, ClaimsPrincipal user, RecipeImportService s, CancellationToken ct) =>
            RecipeImportService.Validate(r) is { } error
                ? Results.BadRequest(new { error })
                : Results.Ok(await s.AddAsync(r, user.Identity?.Name, ct)));

        group.MapDelete("/{id:int}", async (int id, RecipeImportService s, CancellationToken ct) =>
            await s.DeleteAsync(id, ct) ? Results.NoContent() : Results.NotFound());

        group.MapPost("/{id:int}/retry", async (int id, RecipeImportService s, CancellationToken ct) =>
            OkOrConflict(await s.RetryAsync(id, ct), "Linket kan ikke prøves igen lige nu."));

        // ---- Generator (PC) ----

        group.MapPost("/{id:int}/claim", async (int id, RecipeImportService s, CancellationToken ct) =>
            OkOrConflict(await s.ClaimAsync(id, ct), "Linket venter ikke længere."));

        group.MapPost("/{id:int}/done", async (int id, CompleteRecipeImportRequest r, RecipeImportService s, CancellationToken ct) =>
            string.IsNullOrWhiteSpace(r.RecipeSlug) || r.RecipeSlug.Length > 200
                ? Results.BadRequest(new { error = "Mangler slug." })
                : OkOrConflict(await s.CompleteAsync(id, r.RecipeSlug.Trim(), ct), "Linket behandles ikke."));

        group.MapPost("/{id:int}/failed", async (int id, FailRecipeImportRequest r, RecipeImportService s, CancellationToken ct) =>
            OkOrConflict(await s.FailAsync(id, string.IsNullOrWhiteSpace(r.Error) ? "Ukendt fejl" : r.Error.Trim(), ct), "Linket behandles ikke."));

        return app;
    }

    private static IResult OkOrConflict(RecipeImportDto? item, string message) =>
        item is null ? Results.Conflict(new { error = message }) : Results.Ok(item);
}
