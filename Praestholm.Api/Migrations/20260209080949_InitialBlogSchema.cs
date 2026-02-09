using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Praestholm.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialBlogSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BlogPosts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Slug = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Author = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Tags = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    PublishedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsPublished = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BlogPosts", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "BlogPosts",
                columns: new[] { "Id", "Author", "Content", "CreatedAt", "Description", "IsPublished", "PublishedAt", "Slug", "Tags", "Title", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, "Oskar Praestholm", "# Getting Started with Docker\n\nDocker has revolutionized the way we build, ship, and run applications. Instead of worrying about environment differences between development and production, Docker lets you package your application with everything it needs into a standardized unit called a **container**.\n\n## What is Docker?\n\nDocker is a platform that uses OS-level virtualization to deliver software in packages called containers. Containers are lightweight, standalone, and include everything needed to run a piece of software — the code, runtime, system tools, libraries, and settings.\n\n## Key Concepts\n\n### Images\nA Docker image is a read-only template with instructions for creating a container. Think of it as a blueprint. You can build your own images or use images published by others on Docker Hub.\n\n### Containers\nA container is a runnable instance of an image. You can create, start, stop, and delete containers using the Docker CLI. Each container is isolated from others and from the host machine.\n\n### Dockerfile\nA Dockerfile is a text file that contains instructions for building a Docker image. Here's a simple example:\n\n```dockerfile\nFROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nEXPOSE 3000\nCMD [\"node\", \"index.js\"]\n```\n\n## Getting Started\n\n1. **Install Docker** — Download Docker Desktop from [docker.com](https://docker.com)\n2. **Pull an image** — `docker pull nginx`\n3. **Run a container** — `docker run -d -p 8080:80 nginx`\n4. **View running containers** — `docker ps`\n\n## Docker Compose\n\nFor multi-container applications, Docker Compose lets you define and manage multiple services in a single `docker-compose.yml` file:\n\n```yaml\nservices:\n  web:\n    build: .\n    ports:\n      - \"3000:3000\"\n  db:\n    image: postgres:16\n    environment:\n      POSTGRES_PASSWORD: secret\n```\n\nRun everything with `docker compose up` and tear it down with `docker compose down`.\n\n## Why Use Docker?\n\n- **Consistency** — Same environment everywhere\n- **Isolation** — Each service runs independently\n- **Portability** — Run on any machine with Docker installed\n- **Scalability** — Easy to scale services up or down\n\nDocker is an essential tool in modern software development. Once you get comfortable with the basics, you'll find it hard to go back to developing without it.", new DateTime(2025, 1, 15, 12, 0, 0, 0, DateTimeKind.Utc), "A beginner-friendly introduction to Docker, covering containers, images, and how to get your first app running in a containerized environment.", true, new DateTime(2025, 1, 15, 12, 0, 0, 0, DateTimeKind.Utc), "getting-started-with-docker", "Docker,DevOps,Containers,Tutorial", "Getting Started with Docker", new DateTime(2025, 1, 15, 12, 0, 0, 0, DateTimeKind.Utc) },
                    { 2, "Oskar Praestholm", "# Building a Portfolio with React and .NET\n\nWhen I decided to build my portfolio site, I wanted it to reflect the technologies I work with daily. That meant combining a modern React frontend with a robust .NET backend — a stack I'm passionate about.\n\n## The Tech Stack\n\n- **Frontend:** React 19, TypeScript, Vite\n- **Backend:** ASP.NET Core 8 (Minimal APIs)\n- **Styling:** Custom CSS with glassmorphism design\n- **Deployment:** Docker\n\n## Architecture Decisions\n\n### Why Minimal APIs?\n\nASP.NET Core's Minimal APIs offer a clean, lightweight approach to building HTTP endpoints. For a portfolio site, we don't need the full ceremony of controllers, so Minimal APIs keep things simple:\n\n```csharp\napp.MapGet(\"/api/projects\", async (ProjectsService service) =>\n{\n    var projects = await service.GetProjectsAsync();\n    return Results.Ok(projects);\n});\n```\n\n### Why Vite?\n\nVite provides an incredibly fast development experience with hot module replacement (HMR). Combined with TypeScript and React, it makes frontend development a joy.\n\n### The GitHub Integration\n\nRather than manually maintaining a list of projects, the site pulls project data directly from GitHub's API. This means the portfolio stays up to date automatically. Projects tagged with a specific topic appear on the site, and featured projects get highlighted.\n\n## Design Philosophy\n\nThe design uses a dark theme with glassmorphism effects — frosted glass cards, subtle gradients, and an animated starfield background. The goal was to create something that feels modern and polished without being distracting.\n\n### Key Design Elements\n\n- **Glass cards** with `backdrop-filter: blur()` and semi-transparent backgrounds\n- **CSS custom properties** for consistent theming\n- **Responsive layout** that works on mobile and desktop\n- **Animated canvas background** with twinkling stars\n\n## Lessons Learned\n\n1. **Keep it simple** — A portfolio should showcase your work, not overwhelm visitors\n2. **Performance matters** — Lazy loading images and caching API responses make a big difference\n3. **Accessibility** — Semantic HTML, focus states, and reduced motion support are essential\n4. **Iterate** — The first version doesn't have to be perfect; ship and improve\n\nBuilding your own portfolio is one of the best ways to learn and demonstrate your skills. It's a project you own completely, and you can make it exactly what you want.", new DateTime(2025, 1, 20, 12, 0, 0, 0, DateTimeKind.Utc), "A look behind the scenes at how this portfolio site was built using React 19, TypeScript, and ASP.NET Core 8 — and the decisions that shaped it.", true, new DateTime(2025, 1, 20, 12, 0, 0, 0, DateTimeKind.Utc), "building-a-portfolio-with-react-and-dotnet", "React,.NET,TypeScript,Portfolio,Web Development", "Building a Portfolio with React and .NET", new DateTime(2025, 1, 20, 12, 0, 0, 0, DateTimeKind.Utc) },
                    { 3, "Oskar Praestholm", "# Understanding REST API Design\n\nDesigning a good REST API is about more than just making endpoints that return JSON. A well-designed API is intuitive, consistent, and easy to use. Here are the core principles I follow.\n\n## Resource-Oriented Design\n\nREST APIs should be organized around **resources** — the nouns in your system. Use plural nouns for collections:\n\n```\nGET    /api/users          → List all users\nGET    /api/users/42       → Get user 42\nPOST   /api/users          → Create a user\nPUT    /api/users/42       → Update user 42\nDELETE /api/users/42       → Delete user 42\n```\n\nAvoid verbs in URLs. The HTTP method already tells you the action.\n\n## HTTP Methods\n\nUse HTTP methods correctly:\n\n| Method | Purpose | Idempotent? |\n|--------|---------|-------------|\n| GET | Read a resource | Yes |\n| POST | Create a resource | No |\n| PUT | Update/replace a resource | Yes |\n| PATCH | Partial update | No |\n| DELETE | Remove a resource | Yes |\n\n## Status Codes\n\nUse appropriate HTTP status codes:\n\n- **200 OK** — Successful GET, PUT, PATCH\n- **201 Created** — Successful POST (include Location header)\n- **204 No Content** — Successful DELETE\n- **400 Bad Request** — Invalid input\n- **404 Not Found** — Resource doesn't exist\n- **409 Conflict** — Duplicate or conflicting state\n- **500 Internal Server Error** — Something went wrong on the server\n\n## Pagination\n\nFor collections that could be large, always paginate:\n\n```\nGET /api/posts?page=2&pageSize=10\n```\n\nReturn pagination metadata in the response:\n\n```json\n{\n  \"data\": [...],\n  \"page\": 2,\n  \"pageSize\": 10,\n  \"totalCount\": 47,\n  \"totalPages\": 5\n}\n```\n\n## Filtering and Sorting\n\nSupport filtering via query parameters:\n\n```\nGET /api/posts?author=oskar&tag=docker\nGET /api/posts?sort=createdAt&order=desc\n```\n\n## Error Responses\n\nUse a consistent error format:\n\n```json\n{\n  \"error\": {\n    \"code\": \"VALIDATION_ERROR\",\n    \"message\": \"Title is required\",\n    \"details\": [\n      { \"field\": \"title\", \"message\": \"Must not be empty\" }\n    ]\n  }\n}\n```\n\n## Versioning\n\nPlan for API evolution. Common strategies:\n\n- **URL versioning:** `/api/v1/users` (simplest)\n- **Header versioning:** `Accept: application/vnd.api.v1+json`\n- **Query parameter:** `/api/users?version=1`\n\nURL versioning is the most common and easiest to understand.\n\n## Summary\n\nA great REST API is:\n\n- **Consistent** — Same patterns everywhere\n- **Predictable** — Follows HTTP conventions\n- **Well-documented** — Developers can figure it out quickly\n- **Paginated** — Handles large datasets gracefully\n\nFollowing these principles makes your API a pleasure to work with — for your team and for external consumers.", new DateTime(2025, 1, 25, 12, 0, 0, 0, DateTimeKind.Utc), "Core principles of designing clean, consistent REST APIs — from resource naming and HTTP methods to status codes and pagination.", true, new DateTime(2025, 1, 25, 12, 0, 0, 0, DateTimeKind.Utc), "understanding-rest-api-design", "API,REST,Backend,Architecture,Best Practices", "Understanding REST API Design", new DateTime(2025, 1, 25, 12, 0, 0, 0, DateTimeKind.Utc) }
                });

            migrationBuilder.CreateIndex(
                name: "IX_BlogPosts_Slug",
                table: "BlogPosts",
                column: "Slug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BlogPosts");
        }
    }
}
