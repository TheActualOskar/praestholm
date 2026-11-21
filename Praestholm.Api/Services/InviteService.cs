using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Praestholm.Api.Data;
using Praestholm.Api.Models;

namespace Praestholm.Api.Services;

public enum CreateInviteStatus { Created, InvalidEmail, AlreadyUser, InviterNotFound }

public enum AcceptInviteStatus { Accepted, InvalidOrExpired, UsernameTaken, EmailTaken }

public class InviteService
{
    public static readonly TimeSpan Lifetime = TimeSpan.FromDays(7);

    private readonly BlogDbContext _db;
    private readonly UserService _users;

    public InviteService(BlogDbContext db, UserService users)
    {
        _db = db;
        _users = users;
    }

    /// <returns>On success, the raw token for the link (only returned here, never stored).</returns>
    public async Task<(CreateInviteStatus status, Invite? invite, string? token)> CreateAsync(
        int inviterId, string email, CancellationToken ct = default)
    {
        if (!UserService.IsValidEmail(email)) return (CreateInviteStatus.InvalidEmail, null, null);
        email = UserService.NormalizeEmail(email);

        // The cookie alone isn't enough: the inviter must still exist in the DB.
        var inviter = await _db.Users.FirstOrDefaultAsync(u => u.Id == inviterId, ct);
        if (inviter is null) return (CreateInviteStatus.InviterNotFound, null, null);

        if (await _db.Users.AnyAsync(u => u.Email == email, ct))
            return (CreateInviteStatus.AlreadyUser, null, null);

        // Re-inviting the same address replaces any earlier unused link.
        await _db.Invites.Where(i => i.Email == email && i.AcceptedAt == null).ExecuteDeleteAsync(ct);

        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
            .TrimEnd('=').Replace('+', '-').Replace('/', '_');
        var now = DateTime.UtcNow;

        var invite = new Invite
        {
            Email = email,
            TokenHash = Hash(token),
            InvitedBy = inviter,
            CreatedAt = now,
            ExpiresAt = now + Lifetime,
        };
        _db.Invites.Add(invite);
        await _db.SaveChangesAsync(ct);

        return (CreateInviteStatus.Created, invite, token);
    }

    public async Task<InviteInfoDto?> LookupAsync(string token, CancellationToken ct = default)
    {
        var invite = await FindOpenAsync(token, ct);
        return invite is null ? null : new InviteInfoDto(invite.Email, invite.InvitedBy!.Username, invite.ExpiresAt);
    }

    /// <summary>Creates the user and uses up the invite in one save.</summary>
    public async Task<(AcceptInviteStatus status, User? user)> AcceptAsync(
        SignupRequest request, CancellationToken ct = default)
    {
        var invite = await FindOpenAsync(request.Token, ct);
        if (invite is null) return (AcceptInviteStatus.InvalidOrExpired, null);

        var username = request.Username.Trim();
        if (await _db.Users.AnyAsync(u => u.Username == username, ct))
            return (AcceptInviteStatus.UsernameTaken, null);
        if (await _db.Users.AnyAsync(u => u.Email == invite.Email, ct))
            return (AcceptInviteStatus.EmailTaken, null);

        var user = _users.NewUser(username, invite.Email, request.Password);
        _db.Users.Add(user);
        invite.AcceptedAt = DateTime.UtcNow;

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            // A parallel signup grabbed the username or email first.
            return (AcceptInviteStatus.UsernameTaken, null);
        }

        return (AcceptInviteStatus.Accepted, user);
    }

    private async Task<Invite?> FindOpenAsync(string? token, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(token) || token.Length > 100) return null;
        var hash = Hash(token.Trim());
        var now = DateTime.UtcNow;

        return await _db.Invites
            .Include(i => i.InvitedBy)
            .FirstOrDefaultAsync(i => i.TokenHash == hash && i.AcceptedAt == null && i.ExpiresAt > now, ct);
    }

    private static string Hash(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token))).ToLowerInvariant();
}
