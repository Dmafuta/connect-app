package africa.quantum.quantumtech.service;

import africa.quantum.quantumtech.repository.OtpRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * DB-backed rate limiter for OTP sends.
 *
 * Rules (no Redis needed — uses the existing otp_records table):
 *   • Max 3 OTPs per target per 10 minutes   (burst protection)
 *   • Max 10 OTPs per target per 24 hours    (daily cap)
 *
 * These limits are intentionally tight to protect AT SMS costs and prevent abuse.
 * Adjust via application.properties once configurable properties are needed.
 */
@Service
public class RateLimitService {

    private static final int  BURST_LIMIT        = 3;
    private static final long BURST_WINDOW_MINS  = 10;
    private static final int  DAILY_LIMIT        = 10;
    private static final long DAILY_WINDOW_HOURS = 24;

    private final OtpRepository otpRepository;

    public RateLimitService(OtpRepository otpRepository) {
        this.otpRepository = otpRepository;
    }

    /**
     * Checks whether a target (email or phone) is allowed to request a new OTP.
     *
     * @param target email address or phone number
     * @return a {@link RateLimitResult} indicating allowed/denied with a reason
     */
    public RateLimitResult check(String target) {
        Instant now = Instant.now();

        // Burst check — last 10 minutes
        long burstCount = otpRepository.countByTargetSince(
            target, now.minus(BURST_WINDOW_MINS, ChronoUnit.MINUTES)
        );
        if (burstCount >= BURST_LIMIT) {
            return RateLimitResult.denied(
                "Too many OTP requests. Please wait " + BURST_WINDOW_MINS +
                " minutes before requesting another code.",
                (int) (BURST_WINDOW_MINS * 60)   // Retry-After in seconds
            );
        }

        // Daily cap check — last 24 hours
        long dailyCount = otpRepository.countByTargetSince(
            target, now.minus(DAILY_WINDOW_HOURS, ChronoUnit.HOURS)
        );
        if (dailyCount >= DAILY_LIMIT) {
            return RateLimitResult.denied(
                "Daily OTP limit reached. Please try again after 24 hours.",
                (int) (DAILY_WINDOW_HOURS * 3600)
            );
        }

        return RateLimitResult.allowed();
    }

    // ── Result value object ───────────────────────────────────────────────────

    public record RateLimitResult(boolean permitted, String reason, int retryAfterSeconds) {

        public static RateLimitResult allowed() {
            return new RateLimitResult(true, null, 0);
        }

        public static RateLimitResult denied(String reason, int retryAfterSeconds) {
            return new RateLimitResult(false, reason, retryAfterSeconds);
        }
    }
}
