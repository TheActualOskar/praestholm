using System.Security.Claims;
using Praestholm.Api.Models;
using Praestholm.Api.Services;

namespace Praestholm.Api.Endpoints;

/// <summary>Madkurv (weekly basket) and the household lists. Logged-in users or the API key (PC worker).</summary>
public static class MadkurvEndpoints
{
    private static readonly Dictionary<string, HouseholdListKind> ListKinds = new()
    {
        ["faste-varer"] = HouseholdListKind.Staple,
        ["oensker"] = HouseholdListKind.Wish,
        ["beholdning"] = HouseholdListKind.Pantry,
        ["krydderiskab"] = HouseholdListKind.Spice,
    };

    public static IEndpointRouteBuilder MapMadkurvEndpoints(this IEndpointRouteBuilder app)
    {
        var config = app.ServiceProvider.GetRequiredService<IConfiguration>();
        var auth = new UserOrApiKeyEndpointFilter(new ApiKeyEndpointFilter(config));

        var basket = app.MapGroup("/api/madkurv").AddEndpointFilter(auth).WithOpenApi();

        basket.MapGet("", (MadkurvService s, CancellationToken ct) => Run(() => s.GetCurrentAsync(ct)));

        basket.MapPost("/retter", async (AddBasketRecipeRequest r, ClaimsPrincipal user, MadkurvService s, CancellationToken ct) =>
            ValidRecipeLine(r.Servings ?? 1, r.Day, r.Note) is { } error
                ? Results.BadRequest(new { error })
                : await Run(() => s.AddRecipeAsync(r, user.Identity?.Name, ct)));

        basket.MapPut("/retter/{id:int}", async (int id, UpdateBasketRecipeRequest r, MadkurvService s, CancellationToken ct) =>
            ValidRecipeLine(r.Servings, r.Day, r.Note) is { } error
                ? Results.BadRequest(new { error })
                : await Run(() => s.UpdateRecipeAsync(id, r, ct)));

        basket.MapDelete("/retter/{id:int}", (int id, MadkurvService s, CancellationToken ct) => Run(() => s.RemoveRecipeAsync(id, ct)));

        basket.MapPost("/ekstra", async (ItemRequest r, ClaimsPrincipal user, MadkurvService s, CancellationToken ct) =>
            MadkurvService.ValidateItem(r) is { } error
                ? Results.BadRequest(new { error })
                : await Run(() => s.AddExtraAsync(r, user.Identity?.Name, ct)));

        basket.MapDelete("/ekstra/{id:int}", (int id, MadkurvService s, CancellationToken ct) => Run(() => s.RemoveExtraAsync(id, ct)));

        basket.MapPut("/har", async (CheckRequest r, MadkurvService s, CancellationToken ct) =>
            string.IsNullOrEmpty(r.Key) || r.Key.Length > 250
                ? Results.BadRequest(new { error = "Ugyldig vare." })
                : await Run(() => s.SetCheckAsync(r, ct)));

        basket.MapPut("/faste-varer/{stapleId:int}", (int stapleId, StapleChoiceRequest r, MadkurvService s, CancellationToken ct) =>
            Run(() => s.SetStapleChoiceAsync(stapleId, r.Buy, ct)));
        basket.MapPost("/faste-varer/resten", (AllStaplesRequest r, MadkurvService s, CancellationToken ct) =>
            Run(() => s.SetRemainingStaplesAsync(r.Buy, ct)));

        basket.MapPost("/klar", (MadkurvService s, CancellationToken ct) => Run(() => s.LockAsync(ct)));
        basket.MapPost("/ret-igen", (MadkurvService s, CancellationToken ct) => Run(() => s.ReopenAsync(ct)));
        basket.MapPost("/toem", (MadkurvService s, CancellationToken ct) => Run(() => s.ClearAsync(ct)));
        basket.MapPost("/bestilt", (MarkOrderedRequest r, MadkurvService s, CancellationToken ct) => Run(() => s.MarkOrderedAsync(r, ct)));

        basket.MapGet("/historik", (MadkurvService s, CancellationToken ct) => Run(() => s.GetHistoryAsync(ct)));
        basket.MapGet("/{id:int}", async (int id, MadkurvService s, CancellationToken ct) =>
            await s.GetByIdAsync(id, ct) is { } b ? Results.Ok(b) : Results.NotFound());
        basket.MapPost("/{id:int}/gentag", (int id, ClaimsPrincipal user, MadkurvService s, CancellationToken ct) =>
            Run(() => s.CopyRecipesAsync(id, user.Identity?.Name, ct)));

        // ---- Household lists: /api/lister/{faste-varer|oensker|beholdning} ----

        var lists = app.MapGroup("/api/lister/{list}").AddEndpointFilter(auth).WithOpenApi();

        lists.MapGet("", async (string list, MadkurvService s, CancellationToken ct) =>
            ListKinds.TryGetValue(list, out var kind) ? await Run(() => s.GetListAsync(kind, ct)) : Results.NotFound());

        lists.MapPost("", async (string list, ItemRequest r, ClaimsPrincipal user, MadkurvService s, CancellationToken ct) =>
        {
            if (!ListKinds.TryGetValue(list, out var kind)) return Results.NotFound();
            if (MadkurvService.ValidateItem(r) is { } error) return Results.BadRequest(new { error });
            return await Run(() => s.AddItemAsync(kind, r, user.Identity?.Name, ct));
        });

        app.MapPost("/api/lister/krydderiskab/forslag", (ClaimsPrincipal user, MadkurvService s, CancellationToken ct) =>
                Run(() => s.AddSpiceSuggestionsAsync(user.Identity?.Name, ct)))
            .AddEndpointFilter(auth)
            .WithOpenApi();

        lists.MapPut("/{id:int}", async (string list, int id, ItemRequest r, MadkurvService s, CancellationToken ct) =>
        {
            if (!ListKinds.TryGetValue(list, out var kind)) return Results.NotFound();
            if (MadkurvService.ValidateItem(r) is { } error) return Results.BadRequest(new { error });
            return await s.UpdateItemAsync(kind, id, r, ct) is { } item ? Results.Ok(item) : Results.NotFound();
        });

        lists.MapDelete("/{id:int}", async (string list, int id, MadkurvService s, CancellationToken ct) =>
            ListKinds.TryGetValue(list, out var kind) && await s.DeleteItemAsync(kind, id, ct)
                ? Results.NoContent()
                : Results.NotFound());

        return app;
    }

    private static string? ValidRecipeLine(int servings, int? day, string? note)
    {
        if (servings is < 1 or > 100) return "Portioner skal være mellem 1 og 100.";
        if (day is < 0 or > 6) return "Ugyldig dag.";
        if (note is { Length: > 200 }) return "Noten er for lang (højst 200 tegn).";
        return null;
    }

    /// <summary>Maps service exceptions to HTTP results; hides other errors.</summary>
    private static async Task<IResult> Run<T>(Func<Task<T>> action)
    {
        try
        {
            return Results.Ok(await action());
        }
        catch (BasketConflictException e)
        {
            return Results.Conflict(new { error = e.Message });
        }
        catch (KeyNotFoundException e)
        {
            return Results.NotFound(new { error = e.Message });
        }
        catch (Exception)
        {
            return Results.Problem("An unexpected error occurred.");
        }
    }
}
