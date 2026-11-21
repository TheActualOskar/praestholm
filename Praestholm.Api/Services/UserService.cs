using System.Net.Mail;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Praestholm.Api.Data;
using Praestholm.Api.Models;

namespace Praestholm.Api.Services;

public class UserService
{
    public const int MinPasswordLength = 6;

    private readonly BlogDbContext _db;
    private readonly IPasswordHasher<User> _hasher;

    // Verified against when the login doesn't match a user, so a wrong username
    // takes as long as a wrong password and doesn't reveal which accounts exist.
    private static readonly string DummyHash = new PasswordHasher<User>().HashPassword(new User(), "not-a-real-password");

    public UserService(BlogDbContext db, IPasswordHasher<User> hasher)
    {
        _db = db;
        _hasher = hasher;
    }

    public static string? Validate(CreateUserRequest request) =>
        ValidateUsername(request.Username)
        ?? (IsValidEmail(request.Email) ? null : "Email is not valid.")
        ?? ValidatePassword(request.Password);

    public static string? ValidateUsername(string? username)
    {
        username = username?.Trim() ?? "";
        if (username.Length is < 2 or > 50) return "Brugernavnet skal være 2-50 tegn.";
        if (username.Contains('@')) return "Brugernavnet må ikke indeholde '@'.";
        return null;
    }

    public static string? ValidatePassword(string? password) =>
        (password ?? "").Length < MinPasswordLength
            ? $"Kodeordet skal være mindst {MinPasswordLength} tegn."
            : null;

    public static bool IsValidEmail(string? email)
    {
        email = email?.Trim() ?? "";
        return email.Length <= 256 && MailAddress.TryCreate(email, out var parsed) && parsed.Address == email;
    }

    /// <returns>The new user, or null if the username or email is taken.</returns>
    public async Task<UserDto?> CreateAsync(CreateUserRequest request, CancellationToken ct = default)
    {
        var username = request.Username.Trim();
        var email = NormalizeEmail(request.Email);

        if (await _db.Users.AnyAsync(u => u.Username == username || u.Email == email, ct))
            return null;

        var user = NewUser(username, email, request.Password);
        _db.Users.Add(user);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            return null; // Lost a race against the unique indexes.
        }

        return ToDto(user);
    }

    /// <summary>Builds a user with a hashed password. The caller adds it to the context and saves.</summary>
    public User NewUser(string username, string email, string password)
    {
        var user = new User { Username = username.Trim(), Email = NormalizeEmail(email), CreatedAt = DateTime.UtcNow };
        user.PasswordHash = _hasher.HashPassword(user, password);
        return user;
    }

    /// <summary>Looks up by username or email and checks the password.</summary>
    public async Task<User?> VerifyAsync(string login, string password, CancellationToken ct = default)
    {
        login = login.Trim();
        var email = NormalizeEmail(login);
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Username == login || u.Email == email, ct);

        if (user is null)
        {
            _hasher.VerifyHashedPassword(new User(), DummyHash, password);
            return null;
        }

        var result = _hasher.VerifyHashedPassword(user, user.PasswordHash, password);
        if (result == PasswordVerificationResult.Failed) return null;

        if (result == PasswordVerificationResult.SuccessRehashNeeded)
        {
            user.PasswordHash = _hasher.HashPassword(user, password);
            await _db.SaveChangesAsync(ct);
        }

        return user;
    }

    public async Task<IReadOnlyList<UserDto>> GetAllAsync(CancellationToken ct = default) =>
        (await _db.Users.AsNoTracking().OrderBy(u => u.Username).ToListAsync(ct)).Select(ToDto).ToList();

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default) =>
        await _db.Users.Where(u => u.Id == id).ExecuteDeleteAsync(ct) > 0;

    public static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();

    private static UserDto ToDto(User u) => new(u.Id, u.Username, u.Email, u.CreatedAt);
}
