package africa.quantum.quantumtech.controller;

import africa.quantum.quantumtech.dto.AuthResponse;
import africa.quantum.quantumtech.dto.ErrorResponse;
import africa.quantum.quantumtech.dto.LoginRequest;
import africa.quantum.quantumtech.dto.RegisterRequest;
import africa.quantum.quantumtech.model.Role;
import africa.quantum.quantumtech.model.Tenant;
import africa.quantum.quantumtech.model.User;
import africa.quantum.quantumtech.notification.EmailService;
import africa.quantum.quantumtech.repository.TenantRepository;
import africa.quantum.quantumtech.repository.UserRepository;
import africa.quantum.quantumtech.security.JwtUtil;
import africa.quantum.quantumtech.security.TenantContext;
import africa.quantum.quantumtech.service.OtpService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authManager;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;
    private final OtpService otpService;

    @Value("${app.url}")
    private String appUrl;

    public AuthController(UserRepository userRepository,
                          TenantRepository tenantRepository,
                          PasswordEncoder passwordEncoder,
                          AuthenticationManager authManager,
                          JwtUtil jwtUtil,
                          EmailService emailService,
                          OtpService otpService) {
        this.userRepository   = userRepository;
        this.tenantRepository = tenantRepository;
        this.passwordEncoder  = passwordEncoder;
        this.authManager      = authManager;
        this.jwtUtil          = jwtUtil;
        this.emailService     = emailService;
        this.otpService       = otpService;
    }

    /** Register — creates account, sends email verification link + phone OTP if phone given. */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        Tenant tenant = tenantRepository.findByCode(request.tenantCode())
                .orElse(null);
        if (tenant == null || !tenant.isActive()) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Invalid or inactive organisation code"));
        }
        if (userRepository.existsByEmailAndTenant(request.email(), tenant)) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Email already registered"));
        }
        User user = new User();
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        if (request.firstName() != null) user.setFirstName(request.firstName());
        if (request.lastName()  != null) user.setLastName(request.lastName());
        if (request.phone()     != null) user.setPhone(request.phone());
        user.setRole(Role.CUSTOMER);
        user.setEmailVerified(false);
        user.setPhoneVerified(false);
        user.setTenant(tenant);
        userRepository.save(user);

        // Email: send one-time verification link
        boolean emailSent = false;
        try {
            otpService.sendEmailVerificationLink(user.getEmail(), appUrl);
            emailSent = true;
        } catch (Exception e) {
            // Log but don't fail registration — user can request resend later
        }

        // Phone: send OTP if phone number was provided
        boolean phoneSent = false;
        if (user.getPhone() != null && !user.getPhone().isBlank()) {
            try {
                otpService.sendOtpViaSms(user.getPhone(), "VERIFY_PHONE");
                phoneSent = true;
            } catch (Exception e) {
                // SMS failure doesn't block registration
            }
        }

        String msg = "Account created.";
        if (emailSent)  msg += " Check your email for a verification link.";
        if (phoneSent)  msg += " An OTP has been sent to your phone.";
        if (!emailSent) msg += " We couldn't send the verification email right now — please contact support.";

        return ResponseEntity.ok(Map.of(
            "email",     user.getEmail(),
            "phoneSent", phoneSent,
            "message",   msg
        ));
    }

    /** GET /api/auth/verify-email?token=...&email=... — called when user clicks the link. */
    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmailLink(@RequestParam String token, @RequestParam String email) {
        if (!otpService.verifyOtp(email, "VERIFY_EMAIL_LINK", token)) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Verification link is invalid or has expired."));
        }
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setEmailVerified(true);
        userRepository.save(user);

        try {
            emailService.sendEmail(
                user.getEmail(),
                "Welcome to QuantumConnect",
                emailService.welcomeBody(user.getEmail())
            );
        } catch (Exception ignored) {}

        return ResponseEntity.ok(Map.of("message", "Email verified successfully. You can now sign in."));
    }

    /** POST /api/auth/verify-phone — verifies OTP sent to phone number. */
    @PostMapping("/verify-phone")
    public ResponseEntity<?> verifyPhone(@RequestBody Map<String, String> body) {
        String phone = body.get("phone");
        String code  = body.get("code");
        if (phone == null || code == null) {
            return ResponseEntity.badRequest().body(new ErrorResponse("phone and code are required"));
        }
        if (!otpService.verifyOtp(phone, "VERIFY_PHONE", code)) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Invalid or expired OTP"));
        }
        userRepository.findByPhone(phone).ifPresent(u -> {
            u.setPhoneVerified(true);
            userRepository.save(u);
        });
        return ResponseEntity.ok(Map.of("message", "Phone number verified successfully."));
    }

    /** Public: resolve a tenant by org code so the frontend can validate before login. */
    @GetMapping("/tenant/resolve/{code}")
    public ResponseEntity<?> resolveTenant(@PathVariable String code) {
        return tenantRepository.findByCode(code)
                .filter(Tenant::isActive)
                .map(t -> Map.of("code", t.getCode(), "name", t.getName()))
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /** POST /api/auth/forgot-password — sends a reset link; always returns 200 to prevent enumeration. */
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String tenantCode = body.get("tenantCode");
        String email      = body.get("email");
        if (tenantCode != null && email != null) {
            tenantRepository.findByCode(tenantCode)
                    .filter(Tenant::isActive)
                    .ifPresent(tenant ->
                        userRepository.findByEmailAndTenant(email, tenant).ifPresent(user -> {
                            try {
                                otpService.sendPasswordResetLink(email, tenantCode, appUrl);
                            } catch (Exception ignored) {}
                        })
                    );
        }
        return ResponseEntity.ok(Map.of("message",
                "If that account exists, a password reset link has been sent to your email."));
    }

    /** POST /api/auth/reset-password — validates token and updates the password. */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String token       = body.get("token");
        String email       = body.get("email");
        String tenantCode  = body.get("tenantCode");
        String newPassword = body.get("newPassword");

        if (token == null || email == null || tenantCode == null || newPassword == null) {
            return ResponseEntity.badRequest().body(new ErrorResponse("All fields are required"));
        }
        if (newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Password must be at least 6 characters"));
        }

        String key = email + ":" + tenantCode;
        if (!otpService.verifyOtp(key, "PASSWORD_RESET_LINK", token)) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Reset link is invalid or has expired."));
        }

        Tenant tenant = tenantRepository.findByCode(tenantCode).orElse(null);
        if (tenant == null) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Invalid organisation code"));
        }

        User user = userRepository.findByEmailAndTenant(email, tenant)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Password reset successfully. You can now sign in."));
    }

    /**
     * Login — step 1: validate credentials, send OTP, return OTP_REQUIRED.
     * Step 2: POST /api/auth/verify-login-otp to exchange OTP for JWT.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Tenant tenant = tenantRepository.findByCode(request.tenantCode())
                .orElse(null);
        if (tenant == null || !tenant.isActive()) {
            return ResponseEntity.status(401).body(new ErrorResponse("Invalid or inactive organisation code"));
        }

        TenantContext.set(tenant.getId());
        try {
            authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password())
            );
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401).body(new ErrorResponse("Invalid email or password"));
        } finally {
            TenantContext.clear();
        }

        User user = userRepository.findByEmailAndTenant(request.email(), tenant).orElseThrow();
        if (!user.isEmailVerified()) {
            return ResponseEntity.status(403).body(new ErrorResponse(
                "Please verify your email before signing in. Check your inbox for the verification link."));
        }

        // Send OTP — email always, SMS if phone is registered
        try {
            otpService.sendOtpToBoth(user.getEmail(), user.getPhone(), "LOGIN_OTP");
        } catch (Exception e) {
            // If OTP delivery fails, still proceed so as not to lock users out;
            // log in production
        }

        return ResponseEntity.ok(Map.of(
                "status", "OTP_REQUIRED",
                "email",  user.getEmail(),
                "message", "A verification code has been sent to your email."
        ));
    }

    /** Login — step 2: verify OTP and return JWT. */
    @PostMapping("/verify-login-otp")
    public ResponseEntity<?> verifyLoginOtp(@RequestBody Map<String, String> body) {
        String email      = body.get("email");
        String code       = body.get("code");
        String tenantCode = body.get("tenantCode");

        if (email == null || code == null || tenantCode == null) {
            return ResponseEntity.badRequest().body(new ErrorResponse("email, code and tenantCode are required"));
        }

        if (!otpService.verifyOtp(email, "LOGIN_OTP", code)) {
            return ResponseEntity.status(401).body(new ErrorResponse("Invalid or expired verification code"));
        }

        Tenant tenant = tenantRepository.findByCode(tenantCode)
                .orElseThrow(() -> new RuntimeException("Tenant not found"));
        User user = userRepository.findByEmailAndTenant(email, tenant).orElseThrow();

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), tenant.getId());
        return ResponseEntity.ok(new AuthResponse(
                token, user.getEmail(), user.getRole().name(), user.getFullName(),
                tenant.getCode(), tenant.getName()
        ));
    }
}
