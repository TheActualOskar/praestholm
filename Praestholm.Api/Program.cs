using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;
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
builder.Services.AddScoped<RecipeService>();

// Recipe login: cookie keys live in the DB so logins survive IIS app pool recycles.
builder.Services.AddDataProtection()
    .SetApplicationName("Praestholm")
    .PersistKeysToDbContext<BlogDbContext>();

builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "praestholm.recipes";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Strict;
        options.Cookie.SecurePolicy = builder.Environment.IsDevelopment()
            ? CookieSecurePolicy.SameAsRequest
            : CookieSecurePolicy.Always;
        options.ExpireTimeSpan = TimeSpan.FromDays(90);
        options.SlidingExpiration = true;
        // API-only: answer 401/403 instead of redirecting to a login page.
        options.Events.OnRedirectToLogin = ctx =>
        {
            ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
        options.Events.OnRedirectToAccessDenied = ctx =>
        {
            ctx.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy(RecipeEndpoints.LoginRateLimitPolicy, http =>
        RateLimitPartition.GetFixedWindowLimiter(
            http.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions { PermitLimit = 5, Window = TimeSpan.FromMinutes(1) }));
});

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

app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapProjectsEndpoints();
app.MapBlogEndpoints();
app.MapRecipeEndpoints();

app.MapFallbackToFile("index.html");

app.Run();