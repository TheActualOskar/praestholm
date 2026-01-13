using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddMemoryCache();

builder.Services.AddHttpClient("github", client =>
{
    client.BaseAddress = new Uri("https://api.github.com/");
    client.DefaultRequestHeaders.UserAgent.ParseAdd("PraestholmPortfolio");
    client.DefaultRequestHeaders.Accept.ParseAdd("application/vnd.github+json");
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.MapGet("/api/projects", async (
    IMemoryCache cache,
    IHttpClientFactory httpFactory,
    IConfiguration config) =>
{
    var user = config["GitHub:User"];
    var portfolioTopic = config["GitHub:PortfolioTopic"] ?? "portfolio";
    var featuredTopic = config["GitHub:FeaturedTopic"] ?? "featured";
    var cacheMinutes = config.GetValue("GitHub:CacheMinutes", 360);

    if (string.IsNullOrWhiteSpace(user))
        return Results.Problem("GitHub:User is missing in configuration.");

    return await cache.GetOrCreateAsync("projects_v1", async entry =>
    {
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(cacheMinutes);

        var token = config["GitHub:Token"];
        var client = httpFactory.CreateClient("github");
        if (!string.IsNullOrWhiteSpace(token))
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        static string BuildSearchUrl(string user, string topic) =>
            $"search/repositories?q=user:{Uri.EscapeDataString(user)}+topic:{Uri.EscapeDataString(topic)}+fork:false+archived:false&sort=updated&per_page=100";

        var portfolioResp = await client.GetAsync(BuildSearchUrl(user, portfolioTopic));
        if (!portfolioResp.IsSuccessStatusCode)
            return Results.Problem($"GitHub portfolio search failed: {(int)portfolioResp.StatusCode}");

        var portfolioJson = await portfolioResp.Content.ReadAsStringAsync();
        var portfolio = JsonSerializer.Deserialize<GithubSearchResult>(
            portfolioJson,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
        );

        var featuredSet = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        var featuredResp = await client.GetAsync(BuildSearchUrl(user, featuredTopic));
        if (featuredResp.IsSuccessStatusCode)
        {
            var featuredJson = await featuredResp.Content.ReadAsStringAsync();
            var featured = JsonSerializer.Deserialize<GithubSearchResult>(
                featuredJson,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
            );

            if (featured?.Items != null)
            {
                foreach (var r in featured.Items)
                    if (!string.IsNullOrWhiteSpace(r.Full_Name))
                        featuredSet.Add(r.Full_Name);
            }
        }

        var items = portfolio?.Items ?? new List<GithubRepoItem>();

        var results = items.Select(r => new ProjectDto(
            title: r.Name ?? "",
            repo: r.Name ?? "",
            htmlUrl: r.Html_Url ?? "",
            description: r.Description ?? "",
            stars: r.Stargazers_Count,
            forks: r.Forks_Count,
            language: r.Language ?? "",
            updatedAt: r.Updated_At ?? "",
            isFeatured: !string.IsNullOrWhiteSpace(r.Full_Name) && featuredSet.Contains(r.Full_Name)
        )).ToList();

        return Results.Ok(results);
    });
})
.WithName("GetProjects")
.WithOpenApi();

app.Run();

record GithubSearchResult(List<GithubRepoItem> Items);

record GithubRepoItem(
    string? Name,
    string? Full_Name,
    string? Html_Url,
    string? Description,
    int Stargazers_Count,
    int Forks_Count,
    string? Language,
    string? Updated_At
);

record ProjectDto(
    string title,
    string repo,
    string htmlUrl,
    string description,
    int stars,
    int forks,
    string language,
    string updatedAt,
    bool isFeatured
);
