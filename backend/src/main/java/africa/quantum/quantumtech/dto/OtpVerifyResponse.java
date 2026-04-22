package africa.quantum.quantumtech.dto;

/**
 * Response after OTP verification.
 *
 * @param verified true if the OTP matched and was not expired
 * @param message  human-readable result
 */
public record OtpVerifyResponse(boolean verified, String message) {}
