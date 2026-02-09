using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Praestholm.Api.Migrations
{
    /// <inheritdoc />
    public partial class RemoveDockerPost : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "BlogPosts",
                keyColumn: "Id",
                keyValue: 1);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "BlogPosts",
                columns: new[] { "Id", "Author", "Content", "CreatedAt", "Description", "IsPublished", "PublishedAt", "Slug", "Tags", "Title", "UpdatedAt" },
                values: new object[] { 1, "Oskar Praestholm", "# Getting Started with Docker\n\nDocker has revolutionized the way we build, ship, and run applications. Instead of worrying about environment differences between development and production, Docker lets you package your application with everything it needs into a standardized unit called a **container**.\n\n## What is Docker?\n\nDocker is a platform that uses OS-level virtualization to deliver software in packages called containers. Containers are lightweight, standalone, and include everything needed to run a piece of software — the code, runtime, system tools, libraries, and settings.\n\n## Key Concepts\n\n### Images\nA Docker image is a read-only template with instructions for creating a container. Think of it as a blueprint. You can build your own images or use images published by others on Docker Hub.\n\n### Containers\nA container is a runnable instance of an image. You can create, start, stop, and delete containers using the Docker CLI. Each container is isolated from others and from the host machine.\n\n### Dockerfile\nA Dockerfile is a text file that contains instructions for building a Docker image. Here's a simple example:\n\n```dockerfile\nFROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nEXPOSE 3000\nCMD [\"node\", \"index.js\"]\n```\n\n## Getting Started\n\n1. **Install Docker** — Download Docker Desktop from [docker.com](https://docker.com)\n2. **Pull an image** — `docker pull nginx`\n3. **Run a container** — `docker run -d -p 8080:80 nginx`\n4. **View running containers** — `docker ps`\n\n## Docker Compose\n\nFor multi-container applications, Docker Compose lets you define and manage multiple services in a single `docker-compose.yml` file:\n\n```yaml\nservices:\n  web:\n    build: .\n    ports:\n      - \"3000:3000\"\n  db:\n    image: postgres:16\n    environment:\n      POSTGRES_PASSWORD: secret\n```\n\nRun everything with `docker compose up` and tear it down with `docker compose down`.\n\n## Why Use Docker?\n\n- **Consistency** — Same environment everywhere\n- **Isolation** — Each service runs independently\n- **Portability** — Run on any machine with Docker installed\n- **Scalability** — Easy to scale services up or down\n\nDocker is an essential tool in modern software development. Once you get comfortable with the basics, you'll find it hard to go back to developing without it.", new DateTime(2025, 1, 15, 12, 0, 0, 0, DateTimeKind.Utc), "A beginner-friendly introduction to Docker, covering containers, images, and how to get your first app running in a containerized environment.", true, new DateTime(2025, 1, 15, 12, 0, 0, 0, DateTimeKind.Utc), "getting-started-with-docker", "Docker,DevOps,Containers,Tutorial", "Getting Started with Docker", new DateTime(2025, 1, 15, 12, 0, 0, 0, DateTimeKind.Utc) });
        }
    }
}
