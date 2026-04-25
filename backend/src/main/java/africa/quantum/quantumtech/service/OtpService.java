package africa.quantum.quantumtech.service;

import africa.quantum.quantumtech.model.OtpRecord;
import africa.quantum.quantumtech.notification.EmailService;
import africa.quantum.quantumtech.notification.SmsService;
import africa.quantum.quantumtech.repository.OtpRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

@Service
public class OtpService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final OtpRepository otpRepository;
    private final EmailService  emailService;
    private final SmsService    smsService;

    @Value("${otp.expiry.minutes:5}")
    private int expiryMinutes;

    @Value("${otp.length:6}")
    private int otpLength;

    public OtpService(OtpRepository otpRepository,
                      EmailService emailService,
                      SmsService smsService) {
        this.otpRepository = otpRepository;
        this.emailService  = emailService;
        this.smsService    = smsService;
    }

    /**
     * Send OTP via EMAIL (default).
     *
     * @param email   recipient email address
     * @param purpose LOGIN | VERIFY_EMAIL | PASSWORD_RESET
     */
    @Transactional
    public void sendOtp(String email, String purpose) {
        String code = createAndPersistOtp(email, purpose);
        emailService.sendEmail(
            email,
            "Your QuantumConnect verification code",
            EmailService.otpBody(code, expiryMinutes)
        );
    }

    /**
     * Send OTP via SMS through Africa's Talking.
     *
     * @param phone   recipient phone number in E.164 format (e.g. +254712345678)
     * @param purpose LOGIN | VERIFY_EMAIL | PASSWORD_RESET
     */
    @Transactional
    public void sendOtpViaSms(String phone, String purpose) {
        String code = createAndPersistOtp(phone, purpose);
        smsService.sendSms(phone, SmsService.otpSmsBody(code, expiryMinutes));
    }

    /**
     * Generates a UUID token, stores it, and sends a verification link to the email.
     * The link points to the frontend /verify-email page with token + email as query params.
     * Token expires in 24 hours and is consumed on first use.
     *
     * @param email   recipient email address
     * @param appUrl  frontend base URL (e.g. https://quantumconnect.africa)
     */
    @Transactional
    public void sendEmailVerificationLink(String email, String appUrl) {
        String token = UUID.randomUUID().toString();

        otpRepository.invalidatePrevious(email, "VERIFY_EMAIL_LINK");

        OtpRecord record = new OtpRecord();
        record.setEmail(email);
        record.setCode(token);
        record.setPurpose("VERIFY_EMAIL_LINK");
        record.setCreatedAt(Instant.now());
        record.setExpiresAt(Instant.now().plus(24, ChronoUnit.HOURS));
        otpRepository.save(record);

        String link = appUrl + "/verify-email?token=" + token + "&email=" + email;
        emailService.sendEmail(
            email,
            "Verify your QuantumConnect email address",
            EmailService.emailVerificationBody(link)
        );
    }

    /**
     * Generates a UUID token scoped to the tenant, stores it, and sends a password reset link.
     * Token expires in 1 hour and is consumed on first use.
     * The OTP key is {@code email:tenantCode} so resets are isolated per tenant.
     *
     * @param email      recipient email address
     * @param tenantCode the tenant's 6-digit org code
     * @param appUrl     frontend base URL
     */
    @Transactional
    public void sendPasswordResetLink(String email, String tenantCode, String appUrl) {
        String key   = email + ":" + tenantCode;
        String token = UUID.randomUUID().toString();

        otpRepository.invalidatePrevious(key, "PASSWORD_RESET_LINK");

        OtpRecord record = new OtpRecord();
        record.setEmail(key);
        record.setCode(token);
        record.setPurpose("PASSWORD_RESET_LINK");
        record.setCreatedAt(Instant.now());
        record.setExpiresAt(Instant.now().plus(1, ChronoUnit.HOURS));
        otpRepository.save(record);

        String link = appUrl + "/reset-password?token=" + token
                + "&email=" + java.net.URLEncoder.encode(email, java.nio.charset.StandardCharsets.UTF_8)
                + "&tenant=" + tenantCode;
        emailService.sendEmail(
            email,
            "Reset your QuantumConnect password",
            EmailService.passwordResetBody(link)
        );
    }

    /**
     * Send the SAME OTP code to both email and SMS (if phone is provided).
     * Verification is always done against the email target.
     *
     * @param email   recipient email address
     * @param phone   recipient phone in E.164 format — nullable, SMS skipped if blank
     * @param purpose LOGIN | VERIFY_EMAIL | PASSWORD_RESET
     */
    @Transactional
    public void sendOtpToBoth(String email, String phone, String purpose) {
        String code = createAndPersistOtp(email, purpose);
        emailService.sendEmail(
            email,
            "Your QuantumConnect verification code",
            EmailService.otpBody(code, expiryMinutes)
        );
        if (phone != null && !phone.isBlank()) {
            try {
                smsService.sendSms(phone, SmsService.otpSmsBody(code, expiryMinutes));
            } catch (Exception e) {
                // SMS failure should not block the flow — email was already sent
            }
        }
    }

    /**
     * Verify an OTP regardless of the channel it was sent through.
     * The {@code target} is the email or phone number the OTP was issued to.
     *
     * @return true if valid — code is consumed immediately on success
     */
    @Transactional
    public boolean verifyOtp(String target, String purpose, String code) {
        Optional<OtpRecord> opt = otpRepository.findValid(target, purpose, code, Instant.now());
        if (opt.isEmpty()) return false;

        OtpRecord record = opt.get();
        record.setUsed(true);
        otpRepository.save(record);
        return true;
    }

    // ── Housekeeping ──────────────────────────────────────────────────────────

    /** Purge used/expired OTP records every hour to keep the table lean. */
    @Scheduled(fixedRate = 3_600_000)
    @Transactional
    public void purgeExpired() {
        otpRepository.deleteExpiredBefore(Instant.now().minus(1, ChronoUnit.HOURS));
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /** Invalidates previous codes, generates a new one and persists it. */
    private String createAndPersistOtp(String target, String purpose) {
        otpRepository.invalidatePrevious(target, purpose);

        String code = generateCode();

        OtpRecord record = new OtpRecord();
        record.setEmail(target);        // reusing email field for phone when channel=SMS
        record.setCode(code);
        record.setPurpose(purpose);
        record.setCreatedAt(Instant.now());
        record.setExpiresAt(Instant.now().plus(expiryMinutes, ChronoUnit.MINUTES));
        otpRepository.save(record);

        return code;
    }

    private String generateCode() {
        int bound = (int) Math.pow(10, otpLength);
        return String.format("%0" + otpLength + "d", RANDOM.nextInt(bound));
    }
}
