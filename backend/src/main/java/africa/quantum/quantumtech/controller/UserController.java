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

    /** All users in the current tenant — SUPER_ADMIN only */
    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public Page<User> allUsers(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return userRepository.findAllByTenant(currentTenant(),
                PageRequest.of(page, size, Sort.by("id").descending()));
    }

    /** Customers list — ADMIN and above */
    @GetMapping("/customers")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public List<User> customers() {
        return userRepository.findAllByTenantAndRole(currentTenant(), Role.CUSTOMER);
    }

    /** Technicians list — ADMIN and above */
    @GetMapping("/technicians")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public List<User> technicians() {
        return userRepository.findAllByTenantAndRole(currentTenant(), Role.TECHNICIAN);
    }

    /** Get single user — scoped to current tenant */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        Tenant tenant = currentTenant();
        return userRepository.findById(id)
                .filter(u -> u.getTenant().getId().equals(tenant.getId()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Create user — SUPER_ADMIN / ADMIN (ADMIN cannot create SUPER_ADMIN or ADMIN) */
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<?> createUser(@RequestHeader("Authorization") String authHeader,
                                        @RequestBody Map<String, String> body,
                                        HttpServletRequest request) {
        String callerEmail = jwtUtil.extractEmail(authHeader.substring(7));
        String callerRole  = jwtUtil.extractRole(authHeader.substring(7));
        Role targetRole = Role.valueOf(body.getOrDefault("role", "CUSTOMER"));

        if (!"SUPER_ADMIN".equals(callerRole) &&
                (targetRole == Role.SUPER_ADMIN || targetRole == Role.ADMIN)) {
            return ResponseEntity.status(403).body(Map.of("message", "Insufficient privileges to create this role"));
        }

        Tenant tenant = currentTenant();
        String email = body.get("email");
        if (userRepository.existsByEmailAndTenant(email, tenant)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email already registered"));
        }
        User user = new User();
        user.setEmail(email);
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

    /** Update role / active status — SUPER_ADMIN only */
    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<User> updateUser(@PathVariable Long id,
                                           @RequestBody Map<String, String> body,
                                           @RequestHeader("Authorization") String authHeader,
                                           HttpServletRequest request) {
        String callerEmail = jwtUtil.extractEmail(authHeader.substring(7));
        Tenant tenant = currentTenant();
        return userRepository.findById(id).filter(u -> u.getTenant().getId().equals(tenant.getId())).map(u -> {
            if (body.containsKey("role"))      u.setRole(Role.valueOf(body.get("role")));
            if (body.containsKey("firstName")) u.setFirstName(body.get("firstName"));
            if (body.containsKey("lastName"))  u.setLastName(body.get("lastName"));
            if (body.containsKey("active")) {
                boolean active = Boolean.parseBoolean(body.get("active"));
                u.setActive(active);
                AuditLog.Action act = active ? AuditLog.Action.USER_ACTIVATED : AuditLog.Action.USER_DEACTIVATED;
                auditService.log(tenant.getId(), request, callerEmail, "SUPER_ADMIN", act,
                        "User", String.valueOf(id), (active ? "Activated" : "Deactivated") + " user " + u.getEmail());
            } else {
                auditService.log(tenant.getId(), request, callerEmail, "SUPER_ADMIN",
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
        return userRepository.findByEmailAndTenant(email, currentTenant())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Update own profile (firstName, lastName, phone) — any authenticated user */
    @PatchMapping("/me")
    public ResponseEntity<?> updateProfile(@RequestHeader("Authorization") String authHeader,
                                           @RequestBody Map<String, String> body) {
        String email = jwtUtil.extractEmail(authHeader.substring(7));
        return userRepository.findByEmailAndTenant(email, currentTenant()).map(u -> {
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
        return userRepository.findByEmailAndTenant(email, currentTenant()).map(u -> {
            if (!passwordEncoder.matches(body.get("currentPassword"), u.getPassword())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Current password is incorrect"));
            }
            u.setPassword(passwordEncoder.encode(body.get("newPassword")));
            userRepository.save(u);
            return ResponseEntity.ok(Map.of("message", "Password updated"));
        }).orElse(ResponseEntity.notFound().build());
    }

    /** Deleted users — SUPER_ADMIN only */
    @GetMapping("/deleted")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public List<User> deletedUsers() {
        return userRepository.findAllDeletedByTenantId(TenantContext.get());
    }

    /** Soft-delete a user — SUPER_ADMIN only */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id,
                                        @RequestHeader("Authorization") String authHeader,
                                        HttpServletRequest request) {
        String callerEmail = jwtUtil.extractEmail(authHeader.substring(7));
        Tenant tenant = currentTenant();
        return userRepository.findById(id)
                .filter(u -> u.getTenant().getId().equals(tenant.getId()))
                .map(u -> {
                    u.setDeletedAt(LocalDateTime.now());
                    userRepository.save(u);
                    auditService.log(tenant.getId(), request, callerEmail, "SUPER_ADMIN",
                            AuditLog.Action.USER_DELETED, "User", String.valueOf(id),
                            "Soft-deleted user " + u.getEmail());
                    return ResponseEntity.ok(Map.of("message", "User deleted"));
                }).orElse(ResponseEntity.notFound().build());
    }

    /** Restore a soft-deleted user — SUPER_ADMIN only */
    @PatchMapping("/{id}/restore")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> restoreUser(@PathVariable Long id,
                                         @RequestHeader("Authorization") String authHeader,
                                         HttpServletRequest request) {
        String callerEmail = jwtUtil.extractEmail(authHeader.substring(7));
        Tenant tenant = currentTenant();
        int updated = userRepository.restoreById(id, tenant.getId());
        if (updated == 0) return ResponseEntity.notFound().build();
        auditService.log(tenant.getId(), request, callerEmail, "SUPER_ADMIN",
                AuditLog.Action.USER_RESTORED, "User", String.valueOf(id), "Restored user id=" + id);
        return ResponseEntity.ok(Map.of("message", "User restored"));
    }
}
