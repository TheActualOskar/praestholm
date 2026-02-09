namespace Praestholm.Api.Models;

public class BlogPost
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public string Tags { get; set; } = string.Empty;
    public DateTime? PublishedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsPublished { get; set; }
}

public record BlogPostDto(
    int id,
    string title,
    string slug,
    string description,
    string content,
    string author,
    string[] tags,
    DateTime? publishedAt,
    DateTime createdAt,
    DateTime updatedAt,
    bool isPublished
);

public record CreateBlogPostRequest(
    string Title,
    string Slug,
    string Description,
    string Content,
    string Author,
    string[] Tags,
    bool IsPublished
);

public record UpdateBlogPostRequest(
    string? Title,
    string? Slug,
    string? Description,
    string? Content,
    string? Author,
    string[]? Tags,
    bool? IsPublished
);
