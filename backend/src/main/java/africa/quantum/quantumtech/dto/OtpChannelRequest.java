package africa.quantum.quantumtech.dto;

/**
 * Request to send an OTP via a specific channel.
 *
 * @param target  email address OR phone number (E.164) depending on channel
 * @param purpose LOGIN | VERIFY_EMAIL | PASSWORD_RESET
 * @param channel EMAIL | SMS  (defaults to EMAIL if omitted)
 */
public record OtpChannelRequest(String target, String purpose, String channel) {}
