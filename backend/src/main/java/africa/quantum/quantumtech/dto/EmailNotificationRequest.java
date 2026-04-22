package africa.quantum.quantumtech.dto;

/**
 * Request to send an ad-hoc notification email (admin / system use).
 *
 * @param to      recipient email address
 * @param subject email subject line
 * @param heading bold heading shown in the email body
 * @param message body text (plain text; HTML-unsafe characters will be escaped)
 */
public record EmailNotificationRequest(String to, String subject, String heading, String message) {}
