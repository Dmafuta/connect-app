package africa.quantum.quantumtech.dto;

/**
 * Response body returned with HTTP 429 Too Many Requests.
 *
 * @param message        human-readable explanation
 * @param retryAfterSeconds how many seconds the client should wait before retrying
 */
public record RateLimitResponse(String message, int retryAfterSeconds) {}
