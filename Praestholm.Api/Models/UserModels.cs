namespace Praestholm.Api.Models;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;

    /// <summary>ASP.NET Core Identity PBKDF2 hash (salt and iteration count included). Never the plain password.</summary>
    public string PasswordHash { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
}

public record UserDto(int id, string username, string email, DateTime createdAt);

/// <summary>Create a user directly (API key only). Everyone else joins through an invite.</summary>
public record CreateUserRequest(string Username, string Email, string Password);

/// <summary><c>Login</c> is either the username or the email.</summary>
public record LoginRequest(string Login, string Password);

public class Invite
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;

    /// <summary>SHA-256 (hex) of the token in the invite link. The token itself is never stored.</summary>
    public string TokenHash { get; set; } = string.Empty;

    public int InvitedByUserId { get; set; }
    public User? InvitedBy { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime? AcceptedAt { get; set; }
}

public record CreateInviteRequest(string Email);

public record CreateInviteResponse(string email, bool emailed, string inviteUrl, DateTime expiresAt);

public record InviteTokenRequest(string Token);

public record InviteInfoDto(string email, string invitedBy, DateTime expiresAt);

public record SignupRequest(string Token, string Username, string Password);
