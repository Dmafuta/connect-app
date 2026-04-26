package africa.quantum.quantumtech.controller;

import africa.quantum.quantumtech.model.AuditLog;
import africa.quantum.quantumtech.model.Role;
import africa.quantum.quantumtech.model.Tenant;
import africa.quantum.quantumtech.model.User;
import africa.quantum.quantumtech.repository.TenantRepository;
import africa.quantum.quantumtech.repository.UserRepository;
import africa.quantum.quantumtech.security.JwtUtil;
import africa.quantum.quantumtech.security.TenantContext;
import africa.quantum.quantumtech.mpesa.service.MpesaService;
import africa.quantum.quantumtech.service.AuditService;
import africa.quantum.quantumtech.service.OtpService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@RestController
@RequestMapping("/api/tenants")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class TenantController {

    private final TenantRepository tenantRepository;
    private final UserRepository   userRepository;
    private final AuditService     auditService;
    private final JwtUtil          jwtUtil;
    private final OtpService       otpService;
    private final PasswordEncoder  passwordEncoder;
    private final MpesaService     mpesaService;

    @Value("${app.url}")
    private String appUrl;

    public TenantController(TenantRepository tenantRepository,
                            UserRepository userRepository,
                            AuditService auditService,
                            JwtUtil jwtUtil,
                            OtpService otpService,
                            PasswordEncoder passwordEncoder,
                            MpesaService mpesaService) {
        this.tenantRepository = tenantRepository;
        this.userRepository   = userRepository;
        this.auditService     = auditService;
        this.jwtUtil          = jwtUtil;
        this.otpService       = otpService;
        this.passwordEncoder  = passwordEncoder;
        this.mpesaService     = mpesaService;
    }

    @GetMapping
    public Page<Tenant> all(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return tenantRepository.findAll(PageRequest.of(page, size, Sort.by("id").descending()));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, String> body,
                                    @RequestHeader("Authorization") String authHeader,
                                    HttpServletRequest request) {
        String name = body.get("name");
        String slug = body.get("slug");

        if (name == null || name.isBlank() || slug == null || slug.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "name and slug are required"));
        }
        if (!slug.matches("^[a-z0-9-]+$")) {
            return ResponseEntity.badRequest().body(Map.of("message", "slug must be lowercase letters, numbers, and hyphens only"));
        }
        if (tenantRepository.existsBySlug(slug)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Slug already taken"));
        }

        Tenant tenant = new Tenant();
        tenant.setName(name);
        tenant.setSlug(slug);
        tenant.setCode(generateUniqueCode());
        Tenant saved = tenantRepository.save(tenant);

        // Audit under the SUPER_ADMIN's own tenant context (platform-level action)
        auditService.log(jwtUtil.extractTenantId(authHeader.substring(7)), request,
                jwtUtil.extractEmail(authHeader.substring(7)), "SUPER_ADMIN",
                AuditLog.Action.TENANT_CREATED, "Tenant", String.valueOf(saved.getId()),
                "Created tenant '" + saved.getName() + "' (code: " + saved.getCode() + ")");
        return ResponseEntity.ok(saved);
    }

    /**
     * POST /api/tenants/{id}/invite-admin
     * Creates an ADMIN account for the given tenant and sends a set-password invite link.
     * SUPER_ADMIN only.
     */
    @PostMapping("/{id}/invite-admin")
    public ResponseEntity<?> inviteAdmin(@PathVariable Long id,
                                         @RequestBody Map<String, String> body,
                                         @RequestHeader("Authorization") String authHeader,
                                         HttpServletRequest request) {
        Tenant tenant = tenantRepository.findById(id).orElse(null);
        if (tenant == null) return ResponseEntity.notFound().build();

        String email     = body.get("email");
        String firstName = body.getOrDefault("firstName", "");
        String lastName  = body.getOrDefault("lastName", "");

        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "email is required"));
        }
        if (userRepository.existsByEmailAndTenant(email, tenant)) {
            return ResponseEntity.badRequest().body(Map.of("message", "An account with this email already exists for this tenant"));
        }

        User admin = new User();
        admin.setEmail(email);
        admin.setPassword(passwordEncoder.encode(UUID.randomUUID().toString())); // locked until invite is accepted
        admin.setFirstName(firstName);
        admin.setLastName(lastName);
        admin.setRole(Role.ADMIN);
        admin.setEmailVerified(true);
        admin.setPhoneVerified(true);
        admin.setTenant(tenant);
        userRepository.save(admin);

        try {
            otpService.sendPasswordResetLink(email, tenant.getCode(), appUrl);
        } catch (Exception e) {
            // Account is created; invite email failed — caller can retry via forgot-password
        }

        auditService.log(jwtUtil.extractTenantId(authHeader.substring(7)), request,
                jwtUtil.extractEmail(authHeader.substring(7)), "SUPER_ADMIN",
                AuditLog.Action.USER_CREATED, "User", String.valueOf(admin.getId()),
                "Invited admin '" + email + "' for tenant '" + tenant.getName() + "'");

        return ResponseEntity.ok(Map.of(
                "message", "Admin account created. An invite link has been sent to " + email + ".",
                "email", email
        ));
    }

    private String generateUniqueCode() {
        String code;
        do {
            code = String.valueOf(ThreadLocalRandom.current().nextInt(100001, 1000000));
        } while (tenantRepository.existsByCode(code));
        return code;
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id,
                                    @RequestBody Map<String, String> body,
                                    @RequestHeader("Authorization") String authHeader,
                                    HttpServletRequest request) {
        return tenantRepository.findById(id).map(t -> {
            if (body.containsKey("name"))   t.setName(body.get("name"));
            if (body.containsKey("active")) t.setActive(Boolean.parseBoolean(body.get("active")));
            Tenant saved = tenantRepository.save(t);
            auditService.log(jwtUtil.extractTenantId(authHeader.substring(7)), request,
                    jwtUtil.extractEmail(authHeader.substring(7)), "SUPER_ADMIN",
                    AuditLog.Action.TENANT_UPDATED, "Tenant", String.valueOf(id),
                    "Updated tenant '" + saved.getName() + "'");
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    /** Get own tenant settings — ADMIN only (SUPER_ADMIN has no tenant) */
    @GetMapping("/me")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Tenant> getMyTenant() {
        Long tenantId = TenantContext.get();
        if (tenantId == null) return ResponseEntity.notFound().build();
        return tenantRepository.findById(tenantId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Update own tenant settings (name, contactEmail, contactPhone) — ADMIN only */
    @PatchMapping("/me")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateMyTenant(@RequestBody Map<String, String> body,
                                             @RequestHeader("Authorization") String authHeader,
                                             HttpServletRequest request) {
        Long tenantId = TenantContext.get();
        if (tenantId == null) return ResponseEntity.notFound().build();
        return tenantRepository.findById(tenantId).map(t -> {
            if (body.containsKey("name"))               t.setName(body.get("name"));
            if (body.containsKey("contactEmail"))       t.setContactEmail(body.get("contactEmail"));
            if (body.containsKey("contactPhone"))       t.setContactPhone(body.get("contactPhone"));
            boolean mpesaCredentialsChanged = body.containsKey("mpesaShortcode")
                    || body.containsKey("mpesaConsumerKey")
                    || body.containsKey("mpesaConsumerSecret")
                    || body.containsKey("mpesaPasskey");

            if (body.containsKey("mpesaShortcode"))      t.setMpesaShortcode(body.get("mpesaShortcode"));
            if (body.containsKey("mpesaConsumerKey"))    t.setMpesaConsumerKey(body.get("mpesaConsumerKey"));
            if (body.containsKey("mpesaConsumerSecret")) t.setMpesaConsumerSecret(body.get("mpesaConsumerSecret"));
            if (body.containsKey("mpesaPasskey"))        t.setMpesaPasskey(body.get("mpesaPasskey"));
            if (body.containsKey("waterUnitPrice"))      t.setWaterUnitPrice(new BigDecimal(body.get("waterUnitPrice")));
            if (body.containsKey("electricityUnitPrice"))t.setElectricityUnitPrice(new BigDecimal(body.get("electricityUnitPrice")));
            if (body.containsKey("gasUnitPrice"))        t.setGasUnitPrice(new BigDecimal(body.get("gasUnitPrice")));
            tenantRepository.save(t);

            // Auto-register callback URL on Daraja when credentials are saved/changed
            if (mpesaCredentialsChanged && t.hasMpesaCredentials()) {
                try {
                    boolean registered = mpesaService.registerCallbackUrl(t, appUrl);
                    t.setMpesaRegistered(registered);
                    t.setMpesaRegisteredAt(registered ? LocalDateTime.now() : null);
                } catch (Exception ignored) {
                    // Registration failure is non-fatal — credentials are saved, admin can retry
                    t.setMpesaRegistered(false);
                }
                tenantRepository.save(t);
            }

            auditService.log(tenantId, request,
                    jwtUtil.extractEmail(authHeader.substring(7)),
                    jwtUtil.extractRole(authHeader.substring(7)),
                    AuditLog.Action.TENANT_UPDATED, "Tenant", String.valueOf(t.getId()),
                    "Updated tenant settings for '" + t.getName() + "'");
            return ResponseEntity.ok(t);
        }).orElse(ResponseEntity.notFound().build());
    }
}
