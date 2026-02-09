using Microsoft.EntityFrameworkCore;
using Praestholm.Api.Models;

namespace Praestholm.Api.Data;

public class BlogDbContext : DbContext
{
    public BlogDbContext(DbContextOptions<BlogDbContext> options) : base(options) { }

    public DbSet<BlogPost> BlogPosts => Set<BlogPost>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<BlogPost>(entity =>
        {
            entity.HasIndex(e => e.Slug).IsUnique();
            entity.Property(e => e.Content).HasColumnType("nvarchar(max)");
            entity.Property(e => e.Title).HasMaxLength(200);
            entity.Property(e => e.Slug).HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.Author).HasMaxLength(100);
            entity.Property(e => e.Tags).HasMaxLength(500);
        });

        var now = new DateTime(2025, 1, 15, 12, 0, 0, DateTimeKind.Utc);

        modelBuilder.Entity<BlogPost>().HasData(
            new BlogPost
            {
                Id = 2,
                Title = "Building a Portfolio with React and .NET",
                Slug = "building-a-portfolio-with-react-and-dotnet",
                Description = "A look behind the scenes at how this portfolio site was built using React 19, TypeScript, and ASP.NET Core 8 — and the decisions that shaped it.",
                Content = @"# Building a Portfolio with React and .NET

When I decided to build my portfolio site, I wanted it to reflect the technologies I work with daily. That meant combining a modern React frontend with a robust .NET backend — a stack I'm passionate about.

## The Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Backend:** ASP.NET Core 8 (Minimal APIs)
- **Styling:** Custom CSS with glassmorphism design
- **Deployment:** Docker

## Architecture Decisions

### Why Minimal APIs?

ASP.NET Core's Minimal APIs offer a clean, lightweight approach to building HTTP endpoints. For a portfolio site, we don't need the full ceremony of controllers, so Minimal APIs keep things simple:

```csharp
app.MapGet(""/api/projects"", async (ProjectsService service) =>
{
    var projects = await service.GetProjectsAsync();
    return Results.Ok(projects);
});
```

### Why Vite?

Vite provides an incredibly fast development experience with hot module replacement (HMR). Combined with TypeScript and React, it makes frontend development a joy.

### The GitHub Integration

Rather than manually maintaining a list of projects, the site pulls project data directly from GitHub's API. This means the portfolio stays up to date automatically. Projects tagged with a specific topic appear on the site, and featured projects get highlighted.

## Design Philosophy

The design uses a dark theme with glassmorphism effects — frosted glass cards, subtle gradients, and an animated starfield background. The goal was to create something that feels modern and polished without being distracting.

### Key Design Elements

- **Glass cards** with `backdrop-filter: blur()` and semi-transparent backgrounds
- **CSS custom properties** for consistent theming
- **Responsive layout** that works on mobile and desktop
- **Animated canvas background** with twinkling stars

## Lessons Learned

1. **Keep it simple** — A portfolio should showcase your work, not overwhelm visitors
2. **Performance matters** — Lazy loading images and caching API responses make a big difference
3. **Accessibility** — Semantic HTML, focus states, and reduced motion support are essential
4. **Iterate** — The first version doesn't have to be perfect; ship and improve

Building your own portfolio is one of the best ways to learn and demonstrate your skills. It's a project you own completely, and you can make it exactly what you want.",
                Author = "Oskar Praestholm",
                Tags = "React,.NET,TypeScript,Portfolio,Web Development",
                PublishedAt = now.AddDays(5),
                CreatedAt = now.AddDays(5),
                UpdatedAt = now.AddDays(5),
                IsPublished = true
            },
            new BlogPost
            {
                Id = 3,
                Title = "Understanding REST API Design",
                Slug = "understanding-rest-api-design",
                Description = "Core principles of designing clean, consistent REST APIs — from resource naming and HTTP methods to status codes and pagination.",
                Content = @"# Understanding REST API Design

Designing a good REST API is about more than just making endpoints that return JSON. A well-designed API is intuitive, consistent, and easy to use. Here are the core principles I follow.

## Resource-Oriented Design

REST APIs should be organized around **resources** — the nouns in your system. Use plural nouns for collections:

```
GET    /api/users          → List all users
GET    /api/users/42       → Get user 42
POST   /api/users          → Create a user
PUT    /api/users/42       → Update user 42
DELETE /api/users/42       → Delete user 42
```

Avoid verbs in URLs. The HTTP method already tells you the action.

## HTTP Methods

Use HTTP methods correctly:

| Method | Purpose | Idempotent? |
|--------|---------|-------------|
| GET | Read a resource | Yes |
| POST | Create a resource | No |
| PUT | Update/replace a resource | Yes |
| PATCH | Partial update | No |
| DELETE | Remove a resource | Yes |

## Status Codes

Use appropriate HTTP status codes:

- **200 OK** — Successful GET, PUT, PATCH
- **201 Created** — Successful POST (include Location header)
- **204 No Content** — Successful DELETE
- **400 Bad Request** — Invalid input
- **404 Not Found** — Resource doesn't exist
- **409 Conflict** — Duplicate or conflicting state
- **500 Internal Server Error** — Something went wrong on the server

## Pagination

For collections that could be large, always paginate:

```
GET /api/posts?page=2&pageSize=10
```

Return pagination metadata in the response:

```json
{
  ""data"": [...],
  ""page"": 2,
  ""pageSize"": 10,
  ""totalCount"": 47,
  ""totalPages"": 5
}
```

## Filtering and Sorting

Support filtering via query parameters:

```
GET /api/posts?author=oskar&tag=docker
GET /api/posts?sort=createdAt&order=desc
```

## Error Responses

Use a consistent error format:

```json
{
  ""error"": {
    ""code"": ""VALIDATION_ERROR"",
    ""message"": ""Title is required"",
    ""details"": [
      { ""field"": ""title"", ""message"": ""Must not be empty"" }
    ]
  }
}
```

## Versioning

Plan for API evolution. Common strategies:

- **URL versioning:** `/api/v1/users` (simplest)
- **Header versioning:** `Accept: application/vnd.api.v1+json`
- **Query parameter:** `/api/users?version=1`

URL versioning is the most common and easiest to understand.

## Summary

A great REST API is:

- **Consistent** — Same patterns everywhere
- **Predictable** — Follows HTTP conventions
- **Well-documented** — Developers can figure it out quickly
- **Paginated** — Handles large datasets gracefully

Following these principles makes your API a pleasure to work with — for your team and for external consumers.",
                Author = "Oskar Praestholm",
                Tags = "API,REST,Backend,Architecture,Best Practices",
                PublishedAt = now.AddDays(10),
                CreatedAt = now.AddDays(10),
                UpdatedAt = now.AddDays(10),
                IsPublished = true
            }
        );
    }
}
