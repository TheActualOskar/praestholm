using System.Net;
using System.Security.Claims;
using Praestholm.Api.Models;
using Praestholm.Api.Services;

namespace Praestholm.Api.Endpoints;

/// <summary>Logged-in users invite others by email; the invitee signs up with the link.</summary>
public static class InviteEndpoints
{
    public const string SignupRateLimitPolicy = "signup";

    public static IEndpointRouteBuilder MapInviteEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/invites", async (
                CreateInviteRequest request, ClaimsPrincipal principal, HttpContext http,
                InviteService invites, EmailSender email, IConfiguration config, CancellationToken ct) =>
            {
                if (AuthCookie.UserId(principal) is not { } inviterId) return Results.Unauthorized();

                var (status, invite, token) = await invites.CreateAsync(inviterId, request.Email ?? "", ct);
                switch (status)
                {
                    case CreateInviteStatus.InvalidEmail:
                        return Results.BadRequest(new { error = "Emailen er ikke gyldig." });
                    case CreateInviteStatus.AlreadyUser:
                        return Results.Conflict(new { error = "Der findes allerede en bruger med den email." });
                    case CreateInviteStatus.InviterNotFound:
                        return Results.Unauthorized();
                }

                var baseUrl = config["PublicBaseUrl"]?.TrimEnd('/') is { Length: > 0 } configured
                    ? configured
                    : $"{http.Request.Scheme}://{http.Request.Host}";
                // Token in the fragment: browsers never send it to the server, so it stays out of access logs.
                var link = $"{baseUrl}/tilmeld#{token}";

                var inviterName = principal.Identity?.Name ?? "En bruger";
                var emailed = await email.TrySendAsync(
                    invite!.Email,
                    $"{inviterName} har inviteret dig til Praestholm",
                    InviteHtml(inviterName, link),
                    InviteText(inviterName, link),
                    ct);

                return Results.Ok(new CreateInviteResponse(invite.Email, emailed, link, invite.ExpiresAt));
            })
            .WithName("CreateInvite")
            .WithOpenApi()
            .RequireAuthorization();

        app.MapPost("/api/invites/lookup", async (InviteTokenRequest request, InviteService invites, CancellationToken ct) =>
                await invites.LookupAsync(request.Token, ct) is { } info ? Results.Ok(info) : Results.NotFound())
            .WithName("LookupInvite")
            .WithOpenApi()
            .RequireRateLimiting(SignupRateLimitPolicy);

        app.MapPost("/api/signup", async (SignupRequest request, HttpContext http, InviteService invites, CancellationToken ct) =>
            {
                var error = UserService.ValidateUsername(request.Username) ?? UserService.ValidatePassword(request.Password);
                if (error is not null) return Results.BadRequest(new { error });

                var (status, user) = await invites.AcceptAsync(request, ct);
                return status switch
                {
                    AcceptInviteStatus.InvalidOrExpired => Results.NotFound(new { error = "Invitationen er ugyldig eller udløbet." }),
                    AcceptInviteStatus.UsernameTaken => Results.Conflict(new { error = "Brugernavnet er taget." }),
                    AcceptInviteStatus.EmailTaken => Results.Conflict(new { error = "Der findes allerede en bruger med den email." }),
                    _ => await SignIn(http, user!),
                };
            })
            .WithName("Signup")
            .WithOpenApi()
            .RequireRateLimiting(SignupRateLimitPolicy);

        return app;
    }

    private static async Task<IResult> SignIn(HttpContext http, User user)
    {
        await AuthCookie.SignInAsync(http, user);
        return Results.NoContent();
    }

    private static string InviteText(string inviter, string link) =>
        $"""
        Hej!

        {inviter} har inviteret dig til opskrifterne på Praestholm.

        Opret din bruger her (linket virker i {InviteService.Lifetime.Days} dage og kun én gang):
        {link}
        """;

    private static string InviteHtml(string inviter, string link)
    {
        var who = WebUtility.HtmlEncode(inviter);
        var href = WebUtility.HtmlEncode(link);
        return $"""
            <div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#222">
              <p>Hej!</p>
              <p><strong>{who}</strong> har inviteret dig til opskrifterne på Praestholm.</p>
              <p><a href="{href}" style="display:inline-block;padding:10px 16px;border-radius:10px;background:#38d6c8;color:#111;font-weight:700;text-decoration:none">Opret bruger</a></p>
              <p style="color:#666;font-size:13px">Linket virker i {InviteService.Lifetime.Days} dage og kun én gang.<br>{href}</p>
            </div>
            """;
    }
}
