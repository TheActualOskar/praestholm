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
                Id = 4,
                Title = "My Master's Thesis: Query-Based Subscription for IoT Data Streams",
                Slug = "masters-thesis-query-based-subscription-iot",
                Description = "A summary of my master's thesis on designing a query-based subscription model for managing IoT data streams, featuring a custom MQTT broker, Neo4j metadata graph, and SmartFilter mechanism.",
                Content = @"# My Master's Thesis: Query-Based Subscription for IoT Data Streams

In June 2025 I completed my master's thesis in Software Engineering at the University of Southern Denmark (SDU), supervised by Aslak Johansen. The thesis investigates whether a **query-based subscription (QBS) model** can provide a more scalable and flexible alternative to the traditional query-loop approach for managing IoT data streams.

## The Problem

In dynamic IoT environments, new devices and data streams can appear at any time. Traditional systems rely on a **query-loop** approach where clients continuously poll for new data sources. Every time a new sensor is added, the query must be updated to include it. This leads to inefficiencies, increased development complexity, and a constant need for manual intervention as the system grows.

The thesis asks: *what if the system could automatically push relevant data streams to clients as they appear, based on declarative subscriptions?*

## The Approach

The proposed solution flips the model from **pull to push**. Instead of clients repeatedly querying for new sources, they subscribe once using metadata-driven queries, and the system automatically routes matching data streams as they become available.

### Key Technologies

- **MQTT** for real-time data exchange between the broker and clients
- **Neo4j** graph database for storing and querying IoT metadata (devices, rooms, sensor types, and their relationships)
- **Akka.NET** actor framework for building a modular, concurrent custom broker
- **Cypher** queries for defining flexible, graph-based subscriptions

## System Architecture

The system is built around a **custom MQTT broker** structured using an actor-based model. Each actor handles a specific responsibility:

- **PackageListener** receives incoming MQTT packets and routes them to the appropriate handler
- **PublishHandler** extracts payloads and forwards them to the MessageRouter
- **SubscribeHandler** evaluates whether a subscription targets a static topic or a dynamic virtual topic
- **VirtualTopicValidator** manages metadata-aware subscriptions by matching new data streams against precomputed label sets
- **MessageRouter** delivers data to all matching subscribers
- **EventNotifier** pushes real-time updates via WebSocket

### The SmartFilter Mechanism

A core innovation is the **SmartFilter**. Instead of evaluating the full Cypher query every time new data arrives, the system runs the query once at subscription time and extracts a set of *expected labels* (e.g., sensor type = ""temperature"", room = ""Room-A""). New data streams are then matched against these labels at runtime, avoiding repeated database queries.

This shifts the cost from runtime to subscription time, making message routing fast and lightweight while still supporting expressive metadata-based filtering.

### Graph-Based Metadata Model

The metadata is stored as a **labeled property graph** in Neo4j. IoT devices are nodes linked to their data streams, rooms, buildings, and sensor types. This allows users to write a single Cypher query like *""give me all temperature streams in Building 42""* and have the system automatically create a virtual topic that follows matching data streams, including ones added in the future.

## Evaluation and Results

The QBS model was compared against the traditional query-loop (QL) approach across latency, memory usage, and CPU behavior with 10 to 4,000 concurrent queries.

**Key findings:**

- **Stable latency:** QBS averaged ~2 seconds end-to-end latency, consistent across all workloads, with no added overhead once SmartFilters were registered
- **CPU behavior:** QBS showed event-driven CPU load variance, while QL maintained steady polling cycles with uniform resource consumption
- **Memory trade-off:** QBS uses more memory upfront for SmartFilter construction (~167-171 MB) but stabilizes, while QL starts lighter (~2.5 MB) but grows less predictably with active queries
- **Best suited for:** Systems with long-lived subscriptions and high message throughput per topic

While the results were not conclusive enough to declare QBS definitively superior, the system demonstrates **technical feasibility** and shows clear architectural benefits for certain workload profiles.

## Lessons Learned

1. **Protocol compliance matters** — Early reliance on the permissive Mosquitto test client masked missing MQTT features (like keep-alive handling) that only surfaced with stricter clients later
2. **Actor boundaries need discipline** — The modular actor design provided clarity, but components like the MessageRouter accumulated too many responsibilities under load
3. **SmartFilters trade flexibility for performance** — The approach works well when subscriptions are stable, but struggles when they change frequently
4. **Custom brokers are powerful but demanding** — Full control over metadata, queries, and subscriptions came at the cost of development complexity and ecosystem maturity

## Looking Forward

Future work includes revisiting the broker architecture to reduce latency, adding proper MQTT keep-alive support, introducing load balancing, and conducting evaluations in isolated test environments at larger scale.

The thesis establishes a foundation for **adaptive, declarative IoT data integration** — a step toward systems where developers describe what data they need, and the infrastructure handles the rest.",
                Author = "Oskar Praestholm",
                Tags = "IoT,MQTT,Thesis,Software Engineering,.NET",
                PublishedAt = now.AddDays(30),
                CreatedAt = now.AddDays(30),
                UpdatedAt = now.AddDays(30),
                IsPublished = true
            },
            new BlogPost
            {
                Id = 5,
                Title = "My Bachelor's Thesis: Scaling and Resource-Optimization with Docker",
                Slug = "bachelors-thesis-scaling-resource-optimization-docker",
                Description = "A summary of my bachelor's thesis on modernizing Vitec Aloc's Booking system by replacing virtual machines with Docker containers, achieving 93.75% less disk usage and improved maintainability.",
                Content = @"# My Bachelor's Thesis: Scaling and Resource-Optimization with Docker

In June 2023 I completed my bachelor's project in Software Engineering at the University of Southern Denmark (SDU), together with Jeppe Stenstrup Lauridsen. The project was done in collaboration with Vitec Aloc and focused on modernizing their internal Booking system by replacing virtual machines with Docker containers.

## The Problem

Vitec Aloc is a software company that develops investment management solutions. Their developers rely on an internal **Booking system** to spin up isolated test environments where they can install and test their product, PORTMAN, against customer configurations.

The existing system was built on **SCVMM** (System Center Virtual Machine Manager), which managed full Windows virtual machines. Each VM came with a complete Windows installation and a preset resource allocation — whether the developer needed all those resources or not. This led to several problems:

- **Wasted resources** — VMs consumed around 40 GB of disk space each for a full Windows installation, and developers would over-allocate memory to avoid build failures
- **Frequent downtime** — The SCVMM database would fall out of sync every ~3 weeks, requiring a full physical restart of the server
- **High maintenance cost** — The Booking Server was built on old Java code that nobody wanted to touch, with Jenkins jobs patched in as workarounds for recurring failures
- **No resilience** — When something broke, it stayed broken until someone manually intervened

The thesis asked: *can we scale and optimize the resource usage in Vitec's Booking system with Docker, and further make it maintainable and resilient towards failure?*

## The Approach

We proposed replacing the VM-based system with **Docker containers** running on Windows Server Core. Instead of provisioning an entire virtual machine for each test slot, we would build lightweight Docker Images containing only the PORTMAN installer, and spin up containers on demand.

### Key Technologies

- **Docker** for containerization on Windows Server Core
- **ASP.NET Core** with Blazor for a full-stack C# solution
- **Entity Framework Core** with MSSQL for data persistence
- **MediatR** for implementing the CQRS pattern (commands and queries)
- **Clean Architecture** for maintainable, layered code structure
- **MudBlazor** for the admin dashboard UI
- **NUnit** and **FluentAssertions** for testing

## System Architecture

The system was designed around a central **Booking Server** that communicates with the Docker Daemon, a database, a fileserver, and the GUI. The server handles the full container lifecycle: downloading installation files, building Docker Images, creating and managing containers.

### The Pipeline

A key challenge was building Docker Images dynamically. The PORTMAN installation file needed to be copied into the image, but network policies prevented Docker from accessing the company fileserver directly during builds. We solved this by downloading the installer locally first, then using Docker build arguments to inject it into a generic Dockerfile:

The Dockerfile was kept minimal — base it on Windows Server Core, set the shell to PowerShell, copy the installer, and run it with the target database as a parameter. This allowed every PORTMAN version and branch to share the same Dockerfile template.

### Clean Architecture and CQRS

Midway through the project, Vitec Aloc requested we adopt **Clean Architecture** to ensure long-term maintainability. This restructured the codebase into distinct layers (Domain, Application, Infrastructure, Presentation) with clear dependency rules.

We used **MediatR** to implement the CQRS pattern, separating commands (create container, start container, build image) from queries (get container info, list all containers). Each operation became a self-contained handler with its dependencies injected, making the code modular and testable.

### Availability Tactics

To address the resilience problems of the old system, we implemented **health checks** using ASP.NET Core's built-in health check framework:

- **MSSQL Database check** — Verifies the database is reachable
- **Fileserver check** — Ensures the installation file server is accessible
- **Docker Daemon check** — Confirms the Docker client can communicate with the daemon
- **Database/Docker sync check** — Compares container statuses in the database against actual Docker Daemon state, flagging mismatches

If any dependency was unavailable, the system would gracefully limit operations rather than crash. An admin dashboard displayed all health check results with a polling interval, giving maintainers a real-time overview of system health.

## Development Process

We worked in **two iterations**. The first was a proof of concept: get Docker running with Windows containers, prove we could create, start, pause, stop, and remove containers programmatically through C#. The second iteration built the full Booking system with Clean Architecture, the database layer, the Blazor GUI, and availability tactics.

The mid-project switch to Clean Architecture was a significant pivot that cost us time, but it was the right decision for the codebase's future. It also taught us an important lesson about stakeholder communication — had we confirmed the architectural requirements earlier, we could have avoided the rework.

## Results

**Key findings:**

- **93.75% disk reduction** — Docker containers using Windows Server Core consumed only ~2.5 GB compared to ~40 GB for full VM installations
- **Improved maintainability** — Clean Architecture and the CQRS pattern made the codebase modular and approachable for Vitec Aloc's own developers
- **Better resilience** — Health checks provided continuous monitoring and prevented the system from operating on a faulty foundation
- **Pausable containers** — Unlike VMs that always consumed resources, Docker containers could be paused over weekends without constant resource usage

Scalability was scoped out due to time constraints — the system is stateful (tied to a single Docker Daemon), and true horizontal scaling would require an orchestrator like Kubernetes. This remains as future work.

## Lessons Learned

1. **Clarify architecture early** — The late switch to Clean Architecture was valuable but costly. Confirming technical requirements with stakeholders upfront saves time
2. **Docker on Windows has quirks** — The Docker.DotNet library couldn't build images the way we needed, so we had to shell out to `docker build` via `System.Diagnostics.Process`
3. **Network policies matter** — Corporate network restrictions blocked our initial Dockerfile approach, forcing a workaround with local file downloads
4. **Test what you build** — We missed testing the image build functionality in our first iteration, which was the one feature that couldn't use the Docker.DotNet library. Earlier testing would have caught this gap sooner
5. **Containers are not VMs** — The shift from virtual machines to containers required rethinking resource allocation, lifecycle management, and how installation processes work

## Looking Forward

Future work includes adding Kubernetes for horizontal scalability, implementing logging for real-time debugging, expanding test coverage, and adding support for all of Vitec Aloc's products beyond PORTMAN. With those additions, the system could serve as a full replacement for the existing Booking server.",
                Author = "Oskar Praestholm",
                Tags = "Docker,.NET,Blazor,Clean Architecture,Bachelor Thesis",
                PublishedAt = now.AddDays(35),
                CreatedAt = now.AddDays(35),
                UpdatedAt = now.AddDays(35),
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
