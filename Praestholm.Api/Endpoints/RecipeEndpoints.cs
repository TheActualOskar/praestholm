using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Praestholm.Api.Models;
using Praestholm.Api.Services;

namespace Praestholm.Api.Endpoints;

public static class RecipeEndpoints
{
    public const string LoginRateLimitPolicy = "recipe-login";

    public static IEndpointRouteBuilder MapRecipeEndpoints(this IEndpointRouteBuilder app)
    {
        var config = app.ServiceProvider.GetRequiredService<IConfiguration>();
        var apiKeyFilter = new ApiKeyEndpointFilter(config);

        // ---- User login (cookie) ----

        app.MapPost("/api/recipes/login", async (LoginRequest request, HttpContext http, UserService users, CancellationToken ct) =>
            {
                if (string.IsNullOrWhiteSpace(request.Login) || string.IsNullOrEmpty(request.Password))
                    return Results.Unauthorized();

                var user = await users.VerifyAsync(request.Login, request.Password, ct);
                if (user is null)
                    return Results.Unauthorized();

                await AuthCookie.SignInAsync(http, user);

                return Results.NoContent();
            })
            .WithName("RecipeLogin")
            .WithOpenApi()
            .RequireRateLimiting(LoginRateLimitPolicy);

        app.MapPost("/api/recipes/logout", async (HttpContext http) =>
            {
                await http.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
                return Results.NoContent();
            })
            .WithName("RecipeLogout")
            .WithOpenApi();

        app.MapGet("/api/recipes/me", (ClaimsPrincipal user) =>
                Results.Ok(new { username = user.Identity?.Name }))
            .WithName("RecipeMe")
            .WithOpenApi()
            .RequireAuthorization();

        // ---- Read (logged-in user) ----

        app.MapGet("/api/recipes", async (RecipeService service, CancellationToken ct) =>
            {
                try
                {
                    return Results.Ok(await service.GetAllAsync(ct));
                }
                catch (Exception)
                {
                    return Results.Problem("An unexpected error occurred.");
                }
            })
            .WithName("GetRecipes")
            .WithOpenApi()
            .RequireAuthorization();

        app.MapGet("/api/recipes/{slug}", async (string slug, RecipeService service, CancellationToken ct) =>
            {
                try
                {
                    var recipe = await service.GetBySlugAsync(slug, ct);
                    return recipe is null ? Results.NotFound() : Results.Ok(recipe);
                }
                catch (Exception)
                {
                    return Results.Problem("An unexpected error occurred.");
                }
            })
            .WithName("GetRecipe")
            .WithOpenApi()
            .RequireAuthorization();

        // ---- Write (API key, used by the Obsidian sync) ----

        app.MapPut("/api/recipes/{slug}", async (string slug, UpsertRecipeRequest request, RecipeService service, CancellationToken ct) =>
            {
                var error = RecipeService.Validate(slug, request);
                if (error is not null) return Results.BadRequest(new { error });

                try
                {
                    var (recipe, created) = await service.UpsertAsync(slug, request, ct);
                    return created ? Results.Created($"/api/recipes/{recipe.slug}", recipe) : Results.Ok(recipe);
                }
                catch (Exception)
                {
                    return Results.Problem("An unexpected error occurred.");
                }
            })
            .WithName("UpsertRecipe")
            .WithOpenApi()
            .AddEndpointFilter(apiKeyFilter);

        app.MapDelete("/api/recipes/{slug}", async (string slug, RecipeService service, CancellationToken ct) =>
            {
                try
                {
                    return await service.DeleteAsync(slug, ct) ? Results.NoContent() : Results.NotFound();
                }
                catch (Exception)
                {
                    return Results.Problem("An unexpected error occurred.");
                }
            })
            .WithName("DeleteRecipe")
            .WithOpenApi()
            .AddEndpointFilter(apiKeyFilter);

        return app;
    }
}
