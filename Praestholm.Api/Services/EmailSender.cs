using System.Net;
using System.Net.Mail;

namespace Praestholm.Api.Services;

/// <summary>
/// Sends mail over SMTP using the "Smtp" config section (e.g. Gmail with an app password:
/// Host=smtp.gmail.com, Port=587). If Host is empty, nothing is sent and callers fall back to showing the link.
/// </summary>
public class EmailSender
{
    private readonly IConfiguration _config;
    private readonly ILogger<EmailSender> _logger;

    public EmailSender(IConfiguration config, ILogger<EmailSender> logger)
    {
        _config = config;
        _logger = logger;
    }

    public bool IsConfigured => !string.IsNullOrWhiteSpace(_config["Smtp:Host"]);

    /// <returns>True if the mail was handed to the SMTP server.</returns>
    public async Task<bool> TrySendAsync(string to, string subject, string htmlBody, string textBody, CancellationToken ct = default)
    {
        if (!IsConfigured) return false;

        var section = _config.GetSection("Smtp");
        var username = section["Username"];
        var from = section["From"] ?? username;
        if (string.IsNullOrWhiteSpace(from))
        {
            _logger.LogWarning("Smtp:From (or Smtp:Username) is not set; not sending mail.");
            return false;
        }

        using var message = new MailMessage
        {
            From = new MailAddress(from, section["FromName"] ?? "Praestholm"),
            Subject = subject,
            Body = textBody,
        };
        message.To.Add(to);
        message.AlternateViews.Add(AlternateView.CreateAlternateViewFromString(htmlBody, null, "text/html"));

        using var client = new SmtpClient(section["Host"], section.GetValue("Port", 587))
        {
            EnableSsl = section.GetValue("EnableSsl", true),
            DeliveryMethod = SmtpDeliveryMethod.Network,
        };
        if (!string.IsNullOrEmpty(username))
            client.Credentials = new NetworkCredential(username, section["Password"]);

        try
        {
            await client.SendMailAsync(message, ct);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Could not send mail to {To}", to);
            return false;
        }
    }
}
