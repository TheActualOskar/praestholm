namespace Praestholm.Api.Models;

public record GithubSearchResult(List<GithubRepoItem> Items);

public record GithubRepoItem(
    string? Name,
    string? Full_Name,
    string? Html_Url,
    string? Description,
    int Stargazers_Count,
    int Forks_Count,
    string? Language,
    string? Updated_At
);

public record ProjectDto(
    string title,
    string repo,
    string htmlUrl,
    string description,
    int stars,
    int forks,
    string language,
    IReadOnlyList<string> topLanguages,
    string updatedAt,
    bool isFeatured
);
