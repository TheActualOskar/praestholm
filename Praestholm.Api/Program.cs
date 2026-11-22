using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using System.Security.Claims;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Praestholm.Api.Data;
using Praestholm.Api.Endpoints;
using Praestholm.Api.Models;
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
builder.Services.AddScoped<MadkurvService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<InviteService>();
builder.Services.AddSingleton<EmailSender>();
builder.Services.AddSingleton<IPasswordHasher<User>, PasswordHasher<User>>();

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
        // Cookies from the old shared-password login carry no user id: make those people log in again.
        options.Events.OnValidatePrincipal = async ctx =>
        {
            if (ctx.Principal?.FindFirst(ClaimTypes.NameIdentifier) is null)
            {
                ctx.RejectPrincipal();
                await ctx.HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            }
        };
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
    options.AddPolicy(InviteEndpoints.SignupRateLimitPolicy, http =>
        RateLimitPartition.GetFixedWindowLimiter(
            http.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions { PermitLimit = 10, Window = TimeSpan.FromMinutes(1) }));
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

// Remove the former temporary bootstrap login (oskar / 123456) if it still exists.
// It is identified by its placeholder email, so a real account named "oskar" is never touched.
using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<BlogDbContext>();
        var bootstrap = db.Users.FirstOrDefault(u => u.Email == "bootstrap@praestholm.invalid");
        if (bootstrap is not null)
        {
            db.Users.Remove(bootstrap);
            db.SaveChanges();
        }
    }
    catch (Exception ex)
    {
        scope.ServiceProvider.GetRequiredService<ILogger<BlogDbContext>>()
            .LogWarning(ex, "Could not remove the temporary bootstrap user.");
    }
}

app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapProjectsEndpoints();
app.MapBlogEndpoints();
app.MapRecipeEndpoints();
app.MapMadkurvEndpoints();
app.MapUserEndpoints();
app.MapInviteEndpoints();

app.MapFallbackToFile("index.html");

app.Run();