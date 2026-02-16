using Praestholm.Api.Models;
using Praestholm.Api.Services;

namespace Praestholm.Api.Endpoints;

public static class BlogEndpoints
{
    public static IEndpointRouteBuilder MapBlogEndpoints(this IEndpointRouteBuilder app)
    {
        var apiKeyFilter = new ApiKeyEndpointFilter(app.ServiceProvider.GetRequiredService<IConfiguration>());

        app.MapGet("/api/blog", async (BlogService service, CancellationToken ct) =>
            {
                try
                {
                    var posts = await service.GetAllPublishedAsync(ct);
                    return Results.Ok(posts);
                }
                catch (Exception ex)
                {
                    return Results.Problem(ex.Message);
                }
            })
            .WithName("GetBlogPosts")
            .WithOpenApi();

        app.MapGet("/api/blog/{slug}", async (string slug, BlogService service, CancellationToken ct) =>
            {
                try
                {
                    var post = await service.GetBySlugAsync(slug, ct);
                    return post is null ? Results.NotFound() : Results.Ok(post);
                }
                catch (Exception ex)
                {
                    return Results.Problem(ex.Message);
                }
            })
            .WithName("GetBlogPost")
            .WithOpenApi();

        app.MapPost("/api/blog", async (CreateBlogPostRequest request, BlogService service, CancellationToken ct) =>
            {
                try
                {
                    var post = await service.CreateAsync(request, ct);
                    return Results.Created($"/api/blog/{post.slug}", post);
                }
                catch (Exception ex)
                {
                    return Results.Problem(ex.Message);
                }
            })
            .WithName("CreateBlogPost")
            .WithOpenApi()
            .AddEndpointFilter(apiKeyFilter);

        app.MapPut("/api/blog/{id:int}", async (int id, UpdateBlogPostRequest request, BlogService service, CancellationToken ct) =>
            {
                try
                {
                    var post = await service.UpdateAsync(id, request, ct);
                    return post is null ? Results.NotFound() : Results.Ok(post);
                }
                catch (Exception ex)
                {
                    return Results.Problem(ex.Message);
                }
            })
            .WithName("UpdateBlogPost")
            .WithOpenApi()
            .AddEndpointFilter(apiKeyFilter);

        app.MapDelete("/api/blog/{id:int}", async (int id, BlogService service, CancellationToken ct) =>
            {
                try
                {
                    var deleted = await service.DeleteAsync(id, ct);
                    return deleted ? Results.NoContent() : Results.NotFound();
                }
                catch (Exception ex)
                {
                    return Results.Problem(ex.Message);
                }
            })
            .WithName("DeleteBlogPost")
            .WithOpenApi()
            .AddEndpointFilter(apiKeyFilter);

        return app;
    }
}

public class ApiKeyEndpointFilter : IEndpointFilter
{
    private readonly string _apiKey;

    public ApiKeyEndpointFilter(IConfiguration configuration)
    {
        _apiKey = configuration["ApiKey"]
            ?? throw new InvalidOperationException("ApiKey is not configured.");
    }

    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        if (!context.HttpContext.Request.Headers.TryGetValue("X-Api-Key", out var providedKey)
            || providedKey != _apiKey)
        {
            return Results.Unauthorized();
        }

        return await next(context);
    }
}
