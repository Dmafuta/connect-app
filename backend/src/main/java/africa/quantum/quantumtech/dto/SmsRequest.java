package africa.quantum.quantumtech.dto;

/**
 * Request to send an SMS notification.
 *
 * @param to      recipient phone number in E.164 format, e.g. +254712345678
 * @param message the SMS body text (max 160 chars for single SMS)
 */
public record SmsRequest(String to, String message) {}
