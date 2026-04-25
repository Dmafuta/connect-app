package africa.quantum.quantumtech.controller;

import africa.quantum.quantumtech.model.AuditLog;
import africa.quantum.quantumtech.model.Tenant;
import africa.quantum.quantumtech.repository.TenantRepository;
import africa.quantum.quantumtech.security.JwtUtil;
import africa.quantum.quantumtech.security.TenantContext;
import africa.quantum.quantumtech.service.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

@RestController
@RequestMapping("/api/tenants")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class TenantController {

    private final TenantRepository tenantRepository;
    private final AuditService     auditService;
    private final JwtUtil          jwtUtil;

    public TenantController(TenantRepository tenantRepository,
                            AuditService auditService,
                            JwtUtil jwtUtil) {
        this.tenantRepository = tenantRepository;
        this.auditService     = auditService;
        this.jwtUtil          = jwtUtil;
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

    /** Get own tenant settings — ADMIN and SUPER_ADMIN */
    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<Tenant> getMyTenant() {
        return tenantRepository.findById(TenantContext.get())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Update own tenant settings (name, contactEmail, contactPhone) — ADMIN and SUPER_ADMIN */
    @PatchMapping("/me")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<?> updateMyTenant(@RequestBody Map<String, String> body,
                                             @RequestHeader("Authorization") String authHeader,
                                             HttpServletRequest request) {
        return tenantRepository.findById(TenantContext.get()).map(t -> {
            if (body.containsKey("name"))         t.setName(body.get("name"));
            if (body.containsKey("contactEmail")) t.setContactEmail(body.get("contactEmail"));
            if (body.containsKey("contactPhone")) t.setContactPhone(body.get("contactPhone"));
            Tenant saved = tenantRepository.save(t);
            auditService.log(TenantContext.get(), request,
                    jwtUtil.extractEmail(authHeader.substring(7)),
                    jwtUtil.extractRole(authHeader.substring(7)),
                    AuditLog.Action.TENANT_UPDATED, "Tenant", String.valueOf(saved.getId()),
                    "Updated tenant settings for '" + saved.getName() + "'");
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }
}
