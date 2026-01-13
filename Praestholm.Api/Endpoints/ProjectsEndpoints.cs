using Praestholm.Api.Services;

namespace Praestholm.Api.Endpoints;

public static class ProjectsEndpoints
{
    public static IEndpointRouteBuilder MapProjectsEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/projects", async (GitHubProjectsService service, CancellationToken ct) =>
            {
                try
                {
                    var projects = await service.GetProjectsAsync(ct);
                    return Results.Ok(projects);
                }
                catch (Exception ex)
                {
                    return Results.Problem(ex.Message);
                }
            })
            .WithName("GetProjects")
            .WithOpenApi();

        return app;
    }
}