package africa.quantum.quantumtech.dto;

/**
 * Request to send an OTP to an email address.
 *
 * @param email   the recipient's email
 * @param purpose one of: LOGIN | VERIFY_EMAIL | PASSWORD_RESET
 */
public record OtpRequest(String email, String purpose) {}
