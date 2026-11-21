using Praestholm.Api.Models;
using Praestholm.Api.Services;

namespace Praestholm.Api.Endpoints;

/// <summary>User admin. API key only: there is no public sign-up.</summary>
public static class UserEndpoints
{
    public static IEndpointRouteBuilder MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        var config = app.ServiceProvider.GetRequiredService<IConfiguration>();
        var apiKeyFilter = new ApiKeyEndpointFilter(config);

        app.MapGet("/api/users", async (UserService service, CancellationToken ct) =>
                Results.Ok(await service.GetAllAsync(ct)))
            .WithName("ListUsers")
            .WithOpenApi()
            .AddEndpointFilter(apiKeyFilter);

        app.MapPost("/api/users", async (CreateUserRequest request, UserService service, CancellationToken ct) =>
            {
                var error = UserService.Validate(request);
                if (error is not null) return Results.BadRequest(new { error });

                var user = await service.CreateAsync(request, ct);
                return user is null
                    ? Results.Conflict(new { error = "Username or email is already in use." })
                    : Results.Created($"/api/users/{user.id}", user);
            })
            .WithName("CreateUser")
            .WithOpenApi()
            .AddEndpointFilter(apiKeyFilter);

        app.MapDelete("/api/users/{id:int}", async (int id, UserService service, CancellationToken ct) =>
                await service.DeleteAsync(id, ct) ? Results.NoContent() : Results.NotFound())
            .WithName("DeleteUser")
            .WithOpenApi()
            .AddEndpointFilter(apiKeyFilter);

        return app;
    }
}
