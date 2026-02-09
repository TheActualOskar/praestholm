using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Praestholm.Api.Data;
using Praestholm.Api.Endpoints;
using Praestholm.Api.Services;

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

builder.Services.AddSingleton<GitHubProjectsService>();

builder.Services.AddDbContext<BlogDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("Blog")));
builder.Services.AddScoped<BlogService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}


app.UseHttpsRedirection();

app.UseDefaultFiles();
app.UseStaticFiles();

// Auto-apply EF Core migrations on startup (dev convenience)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<BlogDbContext>();
    try
    {
        db.Database.Migrate();
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<BlogDbContext>>();
        logger.LogWarning(ex, "Could not apply blog migrations. Ensure the database exists and is accessible.");
    }
}

app.MapProjectsEndpoints();
app.MapBlogEndpoints();

app.MapFallbackToFile("index.html");

app.Run();