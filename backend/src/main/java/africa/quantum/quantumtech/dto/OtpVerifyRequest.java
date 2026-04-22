package africa.quantum.quantumtech.dto;

/**
 * Request to verify a submitted OTP.
 *
 * @param email   the email the OTP was sent to
 * @param purpose the same purpose used when sending (e.g. "VERIFY_EMAIL")
 * @param code    the 6-digit code submitted by the user
 */
public record OtpVerifyRequest(String email, String purpose, String code) {}
