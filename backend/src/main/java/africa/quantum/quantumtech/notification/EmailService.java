package africa.quantum.quantumtech.notification;

import africa.quantum.quantumtech.model.NotificationLog;
import africa.quantum.quantumtech.repository.NotificationLogRepository;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;

@Service
public class EmailService implements NotificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final NotificationLogRepository notificationLogRepository;

    @Value("${notification.email.from}")
    private String fromAddress;

    @Value("${notification.email.from-name}")
    private String fromName;

    @Value("${app.url}")
    private String appUrl;

    public EmailService(JavaMailSender mailSender,
                        NotificationLogRepository notificationLogRepository) {
        this.mailSender                = mailSender;
        this.notificationLogRepository = notificationLogRepository;
    }

    /**
     * Sends an HTML email asynchronously and logs the result to the database.
     */
    @Async
    @Override
    public void sendEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(new InternetAddress(fromAddress, fromName));
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("Email sent to {} — subject: {}", to, subject);
            notificationLogRepository.save(
                NotificationLog.sent(NotificationLog.Channel.EMAIL, to, subject, htmlBody, null, null)
            );
        } catch (MessagingException | UnsupportedEncodingException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
            notificationLogRepository.save(
                NotificationLog.failed(NotificationLog.Channel.EMAIL, to, subject, htmlBody, e.getMessage())
            );
            throw new RuntimeException("Email delivery failed: " + e.getMessage(), e);
        }
    }

    // ── Convenience template builders ────────────────────────────────────────

    /** Wraps any content block in the branded QuantumConnect email shell. */
    public static String branded(String title, String preheader, String bodyHtml) {
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8"/>
              <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
              <title>%s</title>
            </head>
            <body style="margin:0;padding:0;background:#0f0f0f;font-family:'Segoe UI',Arial,sans-serif;">
              <!-- preheader (hidden preview text) -->
              <span style="display:none;font-size:1px;color:#0f0f0f;max-height:0;overflow:hidden;">%s</span>

              <table width="100%%" cellpadding="0" cellspacing="0" role="presentation">
                <tr><td align="center" style="padding:40px 16px;">

                  <!-- Card -->
                  <table width="600" cellpadding="0" cellspacing="0" role="presentation"
                         style="max-width:600px;width:100%%;background:#1a1a1a;border-top:3px solid #e60026;">

                    <!-- Header -->
                    <tr>
                      <td style="padding:32px 40px 24px;">
                        <table cellpadding="0" cellspacing="0" role="presentation">
                          <tr>
                            <td style="border:2px solid #e60026;border-radius:50%%;width:32px;height:32px;text-align:center;vertical-align:middle;">
                              <span style="display:block;width:20px;height:20px;border:2px solid rgba(255,255,255,0.3);border-radius:50%%;margin:4px auto;"></span>
                            </td>
                            <td style="padding-left:12px;font-size:16px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
                              QuantumConnect
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                      <td style="padding:0 40px 40px;">
                        %s
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="padding:24px 40px;border-top:1px solid #2a2a2a;">
                        <p style="margin:0;font-size:11px;color:#555;line-height:1.6;">
                          © %d QuantumConnect · Smart Metering Intelligence<br/>
                          This is an automated message — please do not reply directly to this email.
                        </p>
                      </td>
                    </tr>

                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(title, preheader, bodyHtml, java.time.Year.now().getValue());
    }

    /** OTP email body. */
    public static String otpBody(String otp, int expiryMinutes) {
        String body = """
            <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
              Your verification code
            </h1>
            <p style="margin:0 0 32px;font-size:14px;color:#888;line-height:1.6;">
              Use the code below to verify your identity. It expires in %d minutes.
            </p>

            <!-- OTP Box -->
            <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 32px;">
              <tr>
                <td style="background:#0f0f0f;border:1px solid #333;padding:24px 40px;text-align:center;">
                  <span style="font-size:42px;font-weight:800;letter-spacing:12px;color:#e60026;font-family:monospace;">
                    %s
                  </span>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:13px;color:#555;line-height:1.6;">
              If you didn't request this code, you can safely ignore this email.<br/>
              Do not share this code with anyone — QuantumConnect staff will never ask for it.
            </p>
            """.formatted(expiryMinutes, otp);

        return branded("Your QuantumConnect Verification Code",
                "Your one-time code is " + otp + " — valid for " + expiryMinutes + " minutes.", body);
    }

    /** Welcome email body sent after successful registration. */
    public String welcomeBody(String email) {
        String body = """
            <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
              Welcome to QuantumConnect.
            </h1>
            <p style="margin:0 0 24px;font-size:14px;color:#888;line-height:1.6;">
              Your account has been created for <strong style="color:#ccc;">%s</strong>.<br/>
              You now have access to our unified smart metering platform.
            </p>

            <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 32px;width:100%%;">
              <tr>
                <td style="background:#0f0f0f;border-left:3px solid #e60026;padding:16px 20px;">
                  <p style="margin:0;font-size:13px;color:#aaa;line-height:1.8;">
                    ✦ &nbsp;Monitor electricity, water &amp; gas in real time<br/>
                    ✦ &nbsp;AI-powered anomaly detection &amp; alerts<br/>
                    ✦ &nbsp;Predictive demand forecasting<br/>
                    ✦ &nbsp;Automated reporting &amp; compliance exports
                  </p>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 32px;font-size:13px;color:#555;line-height:1.6;">
              Get started by signing in to your dashboard and connecting your first meter.
            </p>

            <table cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td style="background:#e60026;padding:14px 32px;">
                  <a href="%s/auth"
                     style="font-size:13px;font-weight:700;color:#ffffff;text-decoration:none;
                            letter-spacing:1px;text-transform:uppercase;">
                    Open Dashboard →
                  </a>
                </td>
              </tr>
            </table>
            """.formatted(email);

        return branded("Welcome to QuantumConnect", "Your account is ready — start monitoring your utilities today.",
                body.formatted(appUrl));
    }

    /** Email address verification link email. */
    public static String emailVerificationBody(String verifyLink) {
        String body = """
            <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
              Verify your email address.
            </h1>
            <p style="margin:0 0 32px;font-size:14px;color:#888;line-height:1.6;">
              Click the button below to confirm your email address and activate your
              QuantumConnect account. This link expires in <strong style="color:#ccc;">24 hours</strong>
              and can only be used once.
            </p>

            <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 32px;">
              <tr>
                <td style="background:#e60026;padding:14px 32px;">
                  <a href="%s"
                     style="font-size:13px;font-weight:700;color:#ffffff;text-decoration:none;
                            letter-spacing:1px;text-transform:uppercase;">
                    Verify Email Address →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:12px;color:#555;line-height:1.6;">
              If the button doesn't work, copy and paste this link into your browser:<br/>
              <span style="color:#888;">%s</span>
            </p>
            <p style="margin:16px 0 0;font-size:12px;color:#555;">
              If you did not create a QuantumConnect account, you can safely ignore this email.
            </p>
            """.formatted(verifyLink, verifyLink);

        return branded("Verify your QuantumConnect email",
                "Click to verify your email address and activate your account.", body);
    }

    /** Password reset link email body. */
    public static String passwordResetBody(String resetLink) {
        String body = """
            <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
              Reset your password.
            </h1>
            <p style="margin:0 0 32px;font-size:14px;color:#888;line-height:1.6;">
              We received a request to reset the password for your account.
              Click the button below to choose a new password.
              This link expires in <strong style="color:#ccc;">1 hour</strong> and can only be used once.
            </p>

            <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 32px;">
              <tr>
                <td style="background:#e60026;padding:14px 32px;">
                  <a href="%s"
                     style="font-size:13px;font-weight:700;color:#ffffff;text-decoration:none;
                            letter-spacing:1px;text-transform:uppercase;">
                    Reset Password →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 16px;font-size:12px;color:#555;line-height:1.6;">
              If the button doesn't work, copy and paste this link into your browser:<br/>
              <span style="color:#888;">%s</span>
            </p>
            <p style="margin:0;font-size:12px;color:#555;">
              If you did not request a password reset, you can safely ignore this email.
              Your password will not be changed.
            </p>
            """.formatted(resetLink, resetLink);

        return branded("Reset your QuantumConnect password",
                "Reset your password — this link expires in 1 hour.", body);
    }

    /** Reading notification sent to the assigned customer after a reading is logged. */
    public static String readingNotificationBody(String serial, double value, String unit,
                                                  double previousValue, java.time.LocalDateTime readAt) {
        double delta = value - previousValue;
        String deltaStr = previousValue > 0
                ? String.format("%+.2f %s since last reading", delta, unit)
                : "First reading recorded";
        String body = """
            <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
              New meter reading recorded.
            </h1>
            <p style="margin:0 0 24px;font-size:14px;color:#888;line-height:1.6;">
              A reading has been logged for your meter <strong style="color:#ccc;">%s</strong>.
            </p>
            <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 24px;width:100%%;">
              <tr>
                <td style="background:#0f0f0f;border-left:3px solid #e60026;padding:16px 20px;">
                  <p style="margin:0 0 8px;font-size:28px;font-weight:800;color:#e60026;font-family:monospace;">
                    %.2f <span style="font-size:16px;color:#888;">%s</span>
                  </p>
                  <p style="margin:0;font-size:12px;color:#666;">%s</p>
                  <p style="margin:4px 0 0;font-size:11px;color:#555;">Recorded: %s</p>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:12px;color:#555;line-height:1.6;">
              If you believe this reading is incorrect, please contact your service provider.
            </p>
            """.formatted(serial, value, unit, deltaStr,
                readAt != null ? readAt.toString().replace("T", " ").substring(0, 16) : "just now");

        return branded("Meter Reading — " + serial,
                "A new reading of " + String.format("%.2f", value) + " " + unit + " has been recorded for " + serial, body);
    }

    /** Generic notification email body. */
    public static String notificationBody(String heading, String message) {
        String body = """
            <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
              %s
            </h1>
            <p style="margin:0 0 24px;font-size:14px;color:#888;line-height:1.8;">%s</p>
            """.formatted(heading, message);

        return branded(heading, message, body);
    }
}
