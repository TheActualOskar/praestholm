using Microsoft.EntityFrameworkCore;
using Praestholm.Api.Data;
using Praestholm.Api.Models;

namespace Praestholm.Api.Services;

public class BlogService
{
    private readonly BlogDbContext _db;

    public BlogService(BlogDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<BlogPostDto>> GetAllPublishedAsync(CancellationToken ct = default)
    {
        var posts = await _db.BlogPosts
            .Where(p => p.IsPublished)
            .OrderByDescending(p => p.PublishedAt)
            .ToListAsync(ct);

        return posts.Select(ToDto).ToList();
    }

    public async Task<BlogPostDto?> GetBySlugAsync(string slug, CancellationToken ct = default)
    {
        var post = await _db.BlogPosts
            .FirstOrDefaultAsync(p => p.Slug == slug && p.IsPublished, ct);

        return post is null ? null : ToDto(post);
    }

    public async Task<BlogPostDto> CreateAsync(CreateBlogPostRequest request, CancellationToken ct = default)
    {
        var post = new BlogPost
        {
            Title = request.Title,
            Slug = request.Slug,
            Description = request.Description,
            Content = request.Content,
            Author = request.Author,
            Tags = string.Join(",", request.Tags),
            IsPublished = request.IsPublished,
            PublishedAt = request.IsPublished ? DateTime.UtcNow : null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.BlogPosts.Add(post);
        await _db.SaveChangesAsync(ct);

        return ToDto(post);
    }

    public async Task<BlogPostDto?> UpdateAsync(int id, UpdateBlogPostRequest request, CancellationToken ct = default)
    {
        var post = await _db.BlogPosts.FindAsync(new object[] { id }, ct);
        if (post is null) return null;

        if (request.Title is not null) post.Title = request.Title;
        if (request.Slug is not null) post.Slug = request.Slug;
        if (request.Description is not null) post.Description = request.Description;
        if (request.Content is not null) post.Content = request.Content;
        if (request.Author is not null) post.Author = request.Author;
        if (request.Tags is not null) post.Tags = string.Join(",", request.Tags);
        if (request.IsPublished.HasValue)
        {
            post.IsPublished = request.IsPublished.Value;
            if (post.IsPublished && post.PublishedAt is null)
                post.PublishedAt = DateTime.UtcNow;
        }

        post.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return ToDto(post);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        var post = await _db.BlogPosts.FindAsync(new object[] { id }, ct);
        if (post is null) return false;

        _db.BlogPosts.Remove(post);
        await _db.SaveChangesAsync(ct);
        return true;
    }

    private static BlogPostDto ToDto(BlogPost post) => new(
        post.Id,
        post.Title,
        post.Slug,
        post.Description,
        post.Content,
        post.Author,
        string.IsNullOrWhiteSpace(post.Tags)
            ? Array.Empty<string>()
            : post.Tags.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries),
        post.PublishedAt,
        post.CreatedAt,
        post.UpdatedAt,
        post.IsPublished
    );
}
