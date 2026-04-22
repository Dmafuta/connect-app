package africa.quantum.quantumtech.notification;

/**
 * Notification facade — extensible to SMS, WhatsApp, and Telegram.
 * Only email is implemented for now; add channel implementations as needed.
 */
public interface NotificationService {

    /** Send a plain-text or HTML email. */
    void sendEmail(String to, String subject, String htmlBody);

    // ── Stubs for future channels ────────────────────────────────────────────

    /** Send an SMS via Twilio / Africa's Talking / etc. */
    default void sendSms(String toPhoneNumber, String message) {
        throw new UnsupportedOperationException("SMS notifications not yet configured.");
    }

    /** Send a WhatsApp message via Twilio WhatsApp API. */
    default void sendWhatsApp(String toPhoneNumber, String message) {
        throw new UnsupportedOperationException("WhatsApp notifications not yet configured.");
    }

    /** Send a Telegram message via Bot API. */
    default void sendTelegram(String chatId, String message) {
        throw new UnsupportedOperationException("Telegram notifications not yet configured.");
    }
}
