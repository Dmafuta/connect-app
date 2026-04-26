package africa.quantum.quantumtech.controller;

import africa.quantum.quantumtech.model.AuditLog;
import africa.quantum.quantumtech.model.Role;
import africa.quantum.quantumtech.model.Tenant;
import africa.quantum.quantumtech.model.User;
import africa.quantum.quantumtech.repository.TenantRepository;
import africa.quantum.quantumtech.repository.UserRepository;
import africa.quantum.quantumtech.security.JwtUtil;
import africa.quantum.quantumtech.security.TenantContext;
import africa.quantum.quantumtech.service.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository   userRepository;
    private final TenantRepository tenantRepository;
    private final PasswordEncoder  passwordEncoder;
    private final JwtUtil          jwtUtil;
    private final AuditService     auditService;

    public UserController(UserRepository userRepository, TenantRepository tenantRepository,
                          PasswordEncoder passwordEncoder, JwtUtil jwtUtil,
                          AuditService auditService) {
        this.userRepository   = userRepository;
        this.tenantRepository = tenantRepository;
        this.passwordEncoder  = passwordEncoder;
        this.jwtUtil          = jwtUtil;
        this.auditService     = auditService;
    }

    private Tenant currentTenant() {
        return tenantRepository.findById(TenantContext.get())
                .orElseThrow(() -> new RuntimeException("Tenant context missing"));
    }

    /** Find the current user by email, supporting both tenant-scoped and platform (SUPER_ADMIN) users. */
    private java.util.Optional<User> findCurrentUser(String email) {
        Long tenantId = TenantContext.get();
        if (tenantId == null) {
            return userRepository.findByEmailAndTenantIsNull(email);
        }
        return userRepository.findByEmailAndTenant(email, currentTenant());
    }

    /** All users in the current tenant — ADMIN only (SUPER_ADMIN excluded by design) */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Page<User> allUsers(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return userRepository.findAllByTenantAndRoleNot(currentTenant(), Role.SUPER_ADMIN,
                PageRequest.of(page, size, Sort.by("id").descending()));
    }

    /** Customers list — ADMIN only */
    @GetMapping("/customers")
    @PreAuthorize("hasRole('ADMIN')")
    public List<User> customers() {
        return userRepository.findAllByTenantAndRole(currentTenant(), Role.CUSTOMER);
    }

    /** Technicians list — ADMIN only */
    @GetMapping("/technicians")
    @PreAuthorize("hasRole('ADMIN')")
    public List<User> technicians() {
        return userRepository.findAllByTenantAndRole(currentTenant(), Role.TECHNICIAN);
    }

    /** Get single user — scoped to current tenant */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        Tenant tenant = currentTenant();
        return userRepository.findById(id)
                .filter(u -> u.getTenant() != null && u.getTenant().getId().equals(tenant.getId()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Create user — ADMIN only (can only create CUSTOMER or TECHNICIAN) */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createUser(@RequestHeader("Authorization") String authHeader,
                                        @RequestBody Map<String, String> body,
                                        HttpServletRequest request) {
        String callerEmail = jwtUtil.extractEmail(authHeader.substring(7));
        String callerRole  = jwtUtil.extractRole(authHeader.substring(7));
        Role targetRole = Role.valueOf(body.getOrDefault("role", "CUSTOMER"));

        if (targetRole == Role.SUPER_ADMIN || targetRole == Role.ADMIN) {
            return ResponseEntity.status(403).body(Map.of("message", "Insufficient privileges to create this role"));
        }

        Tenant tenant = currentTenant();
        String email    = body.get("email");
        String username = body.get("username");

        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "email is required"));
        }
        if (username == null || username.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "username is required"));
        }
        if (!username.matches("^[a-zA-Z0-9._-]{3,30}$")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username must be 3–30 characters: letters, numbers, dots, underscores, hyphens only"));
        }
        if (userRepository.existsByEmailAndTenant(email, tenant)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email already registered"));
        }
        if (userRepository.existsByUsernameAndTenant(username, tenant)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username already taken"));
        }
        User user = new User();
        user.setEmail(email);
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(body.getOrDefault("password", "ChangeMe123!")));
        user.setFirstName(body.getOrDefault("firstName", ""));
        user.setLastName(body.getOrDefault("lastName", ""));
        user.setPhone(body.get("phone"));
        user.setRole(targetRole);
        user.setTenant(tenant);
        userRepository.save(user);

        auditService.log(tenant.getId(), request, callerEmail, callerRole,
                AuditLog.Action.USER_CREATED, "User", String.valueOf(user.getId()),
                "Created user " + email + " with role " + targetRole);
        return ResponseEntity.ok(user);
    }

    /** Update role / active status — ADMIN only */
    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUser(@PathVariable Long id,
                                        @RequestBody Map<String, String> body,
                                        @RequestHeader("Authorization") String authHeader,
                                        HttpServletRequest request) {
        String callerEmail = jwtUtil.extractEmail(authHeader.substring(7));
        String callerRole  = jwtUtil.extractRole(authHeader.substring(7));
        Tenant tenant = currentTenant();

        // Guard: ADMIN cannot elevate a user to ADMIN or SUPER_ADMIN
        if (body.containsKey("role")) {
            try {
                Role newRole = Role.valueOf(body.get("role"));
                if (newRole == Role.SUPER_ADMIN || newRole == Role.ADMIN) {
                    return ResponseEntity.status(403).body(Map.of("message", "Cannot assign SUPER_ADMIN or ADMIN role"));
                }
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid role value"));
            }
        }

        // Validate username before touching the DB
        if (body.containsKey("username")) {
            String newUsername = body.get("username");
            if (newUsername == null || newUsername.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Username cannot be blank"));
            }
            if (!newUsername.matches("^[a-zA-Z0-9._-]{3,30}$")) {
                return ResponseEntity.badRequest().body(Map.of("message", "Username must be 3–30 characters: letters, numbers, dots, underscores, hyphens only"));
            }
            // Uniqueness check: skip if unchanged (compare against target user)
            boolean taken = userRepository.findById(id)
                    .filter(u -> u.getTenant() != null && u.getTenant().getId().equals(tenant.getId()))
                    .map(u -> !newUsername.equals(u.getUsername()) && userRepository.existsByUsernameAndTenant(newUsername, tenant))
                    .orElse(false);
            if (taken) return ResponseEntity.badRequest().body(Map.of("message", "Username already taken"));
        }

        return userRepository.findById(id)
                .filter(u -> u.getTenant() != null && u.getTenant().getId().equals(tenant.getId()))
                .map(u -> {
            if (body.containsKey("role"))      u.setRole(Role.valueOf(body.get("role")));
            if (body.containsKey("username"))  u.setUsername(body.get("username"));
            if (body.containsKey("firstName")) u.setFirstName(body.get("firstName"));
            if (body.containsKey("lastName"))  u.setLastName(body.get("lastName"));
            if (body.containsKey("active")) {
                boolean active = Boolean.parseBoolean(body.get("active"));
                u.setActive(active);
                AuditLog.Action act = active ? AuditLog.Action.USER_ACTIVATED : AuditLog.Action.USER_DEACTIVATED;
                auditService.log(tenant.getId(), request, callerEmail, callerRole, act,
                        "User", String.valueOf(id), (active ? "Activated" : "Deactivated") + " user " + u.getEmail());
            } else {
                auditService.log(tenant.getId(), request, callerEmail, callerRole,
                        AuditLog.Action.USER_UPDATED, "User", String.valueOf(id),
                        "Updated user " + u.getEmail());
            }
            return ResponseEntity.ok(userRepository.save(u));
        }).orElse(ResponseEntity.notFound().build());
    }

    /** Me — any authenticated user */
    @GetMapping("/me")
    public ResponseEntity<User> me(@RequestHeader("Authorization") String authHeader) {
        String email = jwtUtil.extractEmail(authHeader.substring(7));
        return findCurrentUser(email).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Update own profile (firstName, lastName, phone) — any authenticated user */
    @PatchMapping("/me")
    public ResponseEntity<?> updateProfile(@RequestHeader("Authorization") String authHeader,
                                           @RequestBody Map<String, String> body) {
        String email = jwtUtil.extractEmail(authHeader.substring(7));
        return findCurrentUser(email).map(u -> {
            if (body.containsKey("firstName")) u.setFirstName(body.get("firstName"));
            if (body.containsKey("lastName"))  u.setLastName(body.get("lastName"));
            if (body.containsKey("phone"))     u.setPhone(body.get("phone"));
            return ResponseEntity.ok(userRepository.save(u));
        }).orElse(ResponseEntity.notFound().build());
    }

    /** Change own password — any authenticated user */
    @PatchMapping("/me/password")
    public ResponseEntity<?> changePassword(@RequestHeader("Authorization") String authHeader,
                                            @RequestBody Map<String, String> body) {
        String email = jwtUtil.extractEmail(authHeader.substring(7));
        return findCurrentUser(email).map(u -> {
            if (!passwordEncoder.matches(body.get("currentPassword"), u.getPassword())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Current password is incorrect"));
            }
            u.setPassword(passwordEncoder.encode(body.get("newPassword")));
            userRepository.save(u);
            return ResponseEntity.ok(Map.of("message", "Password updated"));
        }).orElse(ResponseEntity.notFound().build());
    }

    /** Deleted users — ADMIN only */
    @GetMapping("/deleted")
    @PreAuthorize("hasRole('ADMIN')")
    public List<User> deletedUsers() {
        return userRepository.findAllDeletedByTenantId(TenantContext.get());
    }

    /** Soft-delete a user — ADMIN only */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id,
                                        @RequestHeader("Authorization") String authHeader,
                                        HttpServletRequest request) {
        String callerEmail = jwtUtil.extractEmail(authHeader.substring(7));
        String callerRole  = jwtUtil.extractRole(authHeader.substring(7));
        Tenant tenant = currentTenant();
        return userRepository.findById(id)
                .filter(u -> u.getTenant() != null && u.getTenant().getId().equals(tenant.getId()))
                .map(u -> {
                    u.setDeletedAt(LocalDateTime.now());
                    userRepository.save(u);
                    auditService.log(tenant.getId(), request, callerEmail, callerRole,
                            AuditLog.Action.USER_DELETED, "User", String.valueOf(id),
                            "Soft-deleted user " + u.getEmail());
                    return ResponseEntity.ok(Map.of("message", "User deleted"));
                }).orElse(ResponseEntity.notFound().build());
    }

    /** Restore a soft-deleted user — ADMIN only */
    @PatchMapping("/{id}/restore")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> restoreUser(@PathVariable Long id,
                                         @RequestHeader("Authorization") String authHeader,
                                         HttpServletRequest request) {
        String callerEmail = jwtUtil.extractEmail(authHeader.substring(7));
        String callerRole  = jwtUtil.extractRole(authHeader.substring(7));
        Tenant tenant = currentTenant();
        int updated = userRepository.restoreById(id, tenant.getId());
        if (updated == 0) return ResponseEntity.notFound().build();
        auditService.log(tenant.getId(), request, callerEmail, callerRole,
                AuditLog.Action.USER_RESTORED, "User", String.valueOf(id), "Restored user id=" + id);
        return ResponseEntity.ok(Map.of("message", "User restored"));
    }
}
