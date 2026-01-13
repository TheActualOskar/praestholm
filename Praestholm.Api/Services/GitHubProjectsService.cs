using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using Praestholm.Api.Models;

namespace Praestholm.Api.Services;

public sealed class GitHubProjectsService
{
    private readonly IMemoryCache _cache;
    private readonly IHttpClientFactory _httpFactory;
    private readonly IConfiguration _config;

    public GitHubProjectsService(IMemoryCache cache, IHttpClientFactory httpFactory, IConfiguration config)
    {
        _cache = cache;
        _httpFactory = httpFactory;
        _config = config;
    }

    public async Task<IReadOnlyList<ProjectDto>> GetProjectsAsync(CancellationToken ct = default)
    {
        var user = _config["GitHub:User"];
        var portfolioTopic = _config["GitHub:PortfolioTopic"] ?? "portfolio";
        var featuredTopic = _config["GitHub:FeaturedTopic"] ?? "featured";
        var cacheMinutes = _config.GetValue("GitHub:CacheMinutes", 360);

        if (string.IsNullOrWhiteSpace(user))
            throw new InvalidOperationException("GitHub:User is missing in configuration.");

        return await _cache.GetOrCreateAsync("projects_v1", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(cacheMinutes);

            var token = _config["GitHub:Token"];
            var client = _httpFactory.CreateClient("github");
            if (!string.IsNullOrWhiteSpace(token))
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            static string BuildSearchUrl(string user, string topic) =>
                $"search/repositories?q=user:{Uri.EscapeDataString(user)}+topic:{Uri.EscapeDataString(topic)}+fork:false+archived:false&sort=updated&per_page=100";

            var portfolioResp = await client.GetAsync(BuildSearchUrl(user, portfolioTopic), ct);
            portfolioResp.EnsureSuccessStatusCode();

            var portfolioJson = await portfolioResp.Content.ReadAsStringAsync(ct);
            var portfolio = JsonSerializer.Deserialize<GithubSearchResult>(
                portfolioJson,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
            );

            var featuredSet = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            var featuredResp = await client.GetAsync(BuildSearchUrl(user, featuredTopic), ct);
            if (featuredResp.IsSuccessStatusCode)
            {
                var featuredJson = await featuredResp.Content.ReadAsStringAsync(ct);
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

            return (IReadOnlyList<ProjectDto>)results;
        }) ?? Array.Empty<ProjectDto>();
    }
}
