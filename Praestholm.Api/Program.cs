using Microsoft.Extensions.Caching.Memory;
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

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Optional on Simply
// app.UseHttpsRedirection();

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapProjectsEndpoints();

app.MapFallbackToFile("index.html");

app.Run();