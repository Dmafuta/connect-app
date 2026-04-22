package africa.quantum.quantumtech.controller;

import africa.quantum.quantumtech.dto.EmailNotificationRequest;
import africa.quantum.quantumtech.dto.ErrorResponse;
import africa.quantum.quantumtech.dto.OtpChannelRequest;
import africa.quantum.quantumtech.dto.OtpRequest;
import africa.quantum.quantumtech.dto.OtpVerifyRequest;
import africa.quantum.quantumtech.dto.OtpVerifyResponse;
import africa.quantum.quantumtech.dto.RateLimitResponse;
import africa.quantum.quantumtech.dto.SmsRequest;
import africa.quantum.quantumtech.notification.EmailService;
import africa.quantum.quantumtech.notification.SmsService;
import africa.quantum.quantumtech.service.OtpService;
import africa.quantum.quantumtech.service.RateLimitService;
import africa.quantum.quantumtech.service.RateLimitService.RateLimitResult;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private static final Set<String> ALLOWED_PURPOSES =
        Set.of("LOGIN", "VERIFY_EMAIL", "PASSWORD_RESET");

    private final OtpService       otpService;
    private final EmailService     emailService;
    private final SmsService       smsService;
    private final RateLimitService rateLimitService;

    public NotificationController(OtpService otpService,
                                  EmailService emailService,
                                  SmsService smsService,
                                  RateLimitService rateLimitService) {
        this.otpService       = otpService;
        this.emailService     = emailService;
        this.smsService       = smsService;
        this.rateLimitService = rateLimitService;
    }

    // ════════════════════════════════════════════════════════════════════════
    // OTP — EMAIL  (public)
    // ════════════════════════════════════════════════════════════════════════

    /**
     * POST /api/notifications/otp/send
     * Generates a 6-digit OTP and emails it to the provided address.
     */
    @PostMapping("/otp/send")
    public ResponseEntity<?> sendOtp(@RequestBody OtpRequest request) {
        if (request.email() == null || request.email().isBlank()) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Email is required"));
        }
        String purpose = normalisePurpose(request.purpose());
        if (purpose == null) {
            return ResponseEntity.badRequest()
                .body(new ErrorResponse("Invalid purpose. Allowed: " + ALLOWED_PURPOSES));
        }
        RateLimitResult limit = rateLimitService.check(request.email());
        if (!limit.permitted()) return rateLimitResponse(limit);

        otpService.sendOtp(request.email(), purpose);
        return ResponseEntity.ok(new OtpVerifyResponse(false, "OTP sent to " + request.email()));
    }

    /**
     * POST /api/notifications/otp/verify
     * Validates an OTP submitted by the user (email or phone).
     */
    @PostMapping("/otp/verify")
    public ResponseEntity<OtpVerifyResponse> verifyOtp(@RequestBody OtpVerifyRequest request) {
        if (request.email() == null || request.code() == null) {
            return ResponseEntity.badRequest()
                .body(new OtpVerifyResponse(false, "email and code are required"));
        }
        String purpose = normalisePurpose(request.purpose());
        if (purpose == null) purpose = "VERIFY_EMAIL";

        boolean valid = otpService.verifyOtp(request.email(), purpose, request.code());
        if (valid) {
            return ResponseEntity.ok(new OtpVerifyResponse(true, "Verification successful"));
        }
        return ResponseEntity.badRequest()
            .body(new OtpVerifyResponse(false, "Invalid or expired OTP"));
    }

    // ════════════════════════════════════════════════════════════════════════
    // OTP — SMS via Africa's Talking  (public)
    // ════════════════════════════════════════════════════════════════════════

    /**
     * POST /api/notifications/otp/send-sms
     * Generates a 6-digit OTP and sends it via SMS (Africa's Talking).
     * Body: { "target": "+254712345678", "purpose": "VERIFY_EMAIL" }
     */
    @PostMapping("/otp/send-sms")
    public ResponseEntity<?> sendOtpViaSms(@RequestBody OtpChannelRequest request) {
        if (request.target() == null || request.target().isBlank()) {
            return ResponseEntity.badRequest().body(new ErrorResponse("target phone number is required"));
        }
        if (!request.target().startsWith("+")) {
            return ResponseEntity.badRequest()
                .body(new ErrorResponse("Phone number must be in E.164 format, e.g. +254712345678"));
        }
        String purpose = normalisePurpose(request.purpose());
        if (purpose == null) purpose = "VERIFY_EMAIL";

        RateLimitResult limit = rateLimitService.check(request.target());
        if (!limit.permitted()) return rateLimitResponse(limit);

        otpService.sendOtpViaSms(request.target(), purpose);
        return ResponseEntity.ok(new OtpVerifyResponse(false, "OTP sent via SMS to " + request.target()));
    }

    /**
     * POST /api/notifications/otp/send-channel
     * Sends OTP via EMAIL or SMS based on the "channel" field.
     *
     * Body: { "target": "user@email.com OR +254712345678", "purpose": "LOGIN", "channel": "EMAIL|SMS" }
     */
    @PostMapping("/otp/send-channel")
    public ResponseEntity<?> sendOtpByChannel(@RequestBody OtpChannelRequest request) {
        if (request.target() == null || request.target().isBlank()) {
            return ResponseEntity.badRequest().body(new ErrorResponse("target is required"));
        }
        String purpose = normalisePurpose(request.purpose());
        if (purpose == null) purpose = "VERIFY_EMAIL";

        String channel = request.channel() == null ? "EMAIL" : request.channel().toUpperCase();

        RateLimitResult limit = rateLimitService.check(request.target());
        if (!limit.permitted()) return rateLimitResponse(limit);

        switch (channel) {
            case "SMS" -> {
                if (!request.target().startsWith("+")) {
                    return ResponseEntity.badRequest()
                        .body(new ErrorResponse("Phone number must be in E.164 format, e.g. +254712345678"));
                }
                otpService.sendOtpViaSms(request.target(), purpose);
                return ResponseEntity.ok(new OtpVerifyResponse(false, "OTP sent via SMS to " + request.target()));
            }
            case "EMAIL" -> {
                otpService.sendOtp(request.target(), purpose);
                return ResponseEntity.ok(new OtpVerifyResponse(false, "OTP sent via email to " + request.target()));
            }
            default -> {
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Invalid channel. Allowed: EMAIL, SMS"));
            }
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // Direct SMS  (authenticated — JWT required)
    // ════════════════════════════════════════════════════════════════════════

    /**
     * POST /api/notifications/sms/send
     * Sends an ad-hoc SMS via Africa's Talking. Requires a valid JWT.
     * Body: { "to": "+254712345678", "message": "Hello from QuantumConnect!" }
     */
    @PostMapping("/sms/send")
    public ResponseEntity<?> sendSms(@RequestBody SmsRequest request) {
        if (request.to() == null || request.message() == null) {
            return ResponseEntity.badRequest()
                .body(new ErrorResponse("to and message are required"));
        }
        if (!request.to().startsWith("+")) {
            return ResponseEntity.badRequest()
                .body(new ErrorResponse("Phone number must be in E.164 format, e.g. +254712345678"));
        }
        if (request.message().length() > 160) {
            return ResponseEntity.badRequest()
                .body(new ErrorResponse("Message exceeds 160 characters — it will be split into multiple SMS segments"));
        }
        smsService.sendSms(request.to(), request.message());
        return ResponseEntity.ok(new OtpVerifyResponse(true, "SMS queued for delivery to " + request.to()));
    }

    // ════════════════════════════════════════════════════════════════════════
    // Direct Email  (authenticated — JWT required)
    // ════════════════════════════════════════════════════════════════════════

    /**
     * POST /api/notifications/email/send
     * Sends a branded notification email. Requires a valid JWT.
     */
    @PostMapping("/email/send")
    public ResponseEntity<?> sendEmail(@RequestBody EmailNotificationRequest request) {
        if (request.to() == null || request.subject() == null || request.message() == null) {
            return ResponseEntity.badRequest()
                .body(new ErrorResponse("to, subject, and message are required"));
        }
        String heading = request.heading() != null ? request.heading() : request.subject();
        emailService.sendEmail(
            request.to(),
            request.subject(),
            EmailService.notificationBody(heading, request.message())
        );
        return ResponseEntity.ok(new OtpVerifyResponse(true, "Email queued for delivery to " + request.to()));
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private String normalisePurpose(String raw) {
        if (raw == null || raw.isBlank()) return "VERIFY_EMAIL";
        String upper = raw.toUpperCase();
        return ALLOWED_PURPOSES.contains(upper) ? upper : null;
    }

    /** Builds a 429 Too Many Requests response with a Retry-After header. */
    private ResponseEntity<RateLimitResponse> rateLimitResponse(RateLimitResult limit) {
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.RETRY_AFTER, String.valueOf(limit.retryAfterSeconds()));
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
            .headers(headers)
            .body(new RateLimitResponse(limit.reason(), limit.retryAfterSeconds()));
    }
}
