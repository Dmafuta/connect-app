package africa.quantum.quantumtech.controller;

import africa.quantum.quantumtech.model.AuditLog;
import africa.quantum.quantumtech.model.Meter;
import africa.quantum.quantumtech.model.Tenant;
import africa.quantum.quantumtech.model.User;
import africa.quantum.quantumtech.repository.MeterRepository;
import africa.quantum.quantumtech.repository.TenantRepository;
import africa.quantum.quantumtech.repository.UserRepository;
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
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/meters")
public class MeterController {

    private final MeterRepository  meterRepository;
    private final UserRepository   userRepository;
    private final TenantRepository tenantRepository;
    private final JwtUtil          jwtUtil;
    private final AuditService     auditService;

    public MeterController(MeterRepository meterRepository, UserRepository userRepository,
                           TenantRepository tenantRepository, JwtUtil jwtUtil,
                           AuditService auditService) {
        this.meterRepository  = meterRepository;
        this.userRepository   = userRepository;
        this.tenantRepository = tenantRepository;
        this.jwtUtil          = jwtUtil;
        this.auditService     = auditService;
    }

    private Tenant currentTenant() {
        return tenantRepository.findById(TenantContext.get())
                .orElseThrow(() -> new RuntimeException("Tenant context missing"));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    public Page<Meter> allMeters(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return meterRepository.findAllByTenantId(TenantContext.get(),
                PageRequest.of(page, size, Sort.by("id").descending()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    public ResponseEntity<Meter> getMeter(@PathVariable Long id) {
        return meterRepository.findByIdAndTenantId(id, TenantContext.get())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Customer's own meters */
    @GetMapping("/my")
    public ResponseEntity<List<Meter>> myMeters(@RequestHeader("Authorization") String authHeader) {
        String email = jwtUtil.extractEmail(authHeader.substring(7));
        User user = userRepository.findByEmailAndTenant(email, currentTenant()).orElseThrow();
        return ResponseEntity.ok(meterRepository.findByCustomerAndTenantId(user, TenantContext.get()));
    }

    /** Technician's assigned meters */
    @GetMapping("/assigned")
    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    public ResponseEntity<List<Meter>> assignedMeters(@RequestHeader("Authorization") String authHeader) {
        String email = jwtUtil.extractEmail(authHeader.substring(7));
        User tech = userRepository.findByEmailAndTenant(email, currentTenant()).orElseThrow();
        return ResponseEntity.ok(meterRepository.findByTechnicianAndTenantId(tech, TenantContext.get()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createMeter(@RequestHeader("Authorization") String authHeader,
                                         @RequestBody Map<String, String> body,
                                         HttpServletRequest request) {
        Tenant tenant = currentTenant();
        String serial = body.get("serialNumber");
        if (meterRepository.existsBySerialNumberAndTenantId(serial, tenant.getId())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Serial number already exists"));
        }
        Meter meter = new Meter();
        meter.setSerialNumber(serial);
        meter.setType(Meter.Type.valueOf(body.get("type")));
        if (body.containsKey("mode")) meter.setMode(Meter.Mode.valueOf(body.get("mode")));
        meter.setLocation(body.get("location"));
        meter.setTenant(tenant);
        if (body.containsKey("customerId") && !body.get("customerId").isBlank()) {
            userRepository.findById(Long.parseLong(body.get("customerId")))
                    .ifPresent(meter::setCustomer);
        }
        if (body.containsKey("technicianId") && !body.get("technicianId").isBlank()) {
            userRepository.findById(Long.parseLong(body.get("technicianId")))
                    .ifPresent(meter::setTechnician);
        }
        Meter saved = meterRepository.save(meter);
        auditService.log(tenant.getId(), request,
                jwtUtil.extractEmail(authHeader.substring(7)),
                jwtUtil.extractRole(authHeader.substring(7)),
                AuditLog.Action.METER_CREATED, "Meter", String.valueOf(saved.getId()),
                "Registered meter " + serial + " (" + saved.getType() + ")");
        return ResponseEntity.ok(saved);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Meter> updateMeter(@PathVariable Long id,
                                             @RequestBody Map<String, String> body,
                                             @RequestHeader("Authorization") String authHeader,
                                             HttpServletRequest request) {
        return meterRepository.findByIdAndTenantId(id, TenantContext.get()).map(m -> {
            if (body.containsKey("status"))   m.setStatus(Meter.Status.valueOf(body.get("status")));
            if (body.containsKey("location")) m.setLocation(body.get("location"));
            if (body.containsKey("customerId")) {
                if (body.get("customerId").isBlank()) {
                    m.setCustomer(null);
                } else {
                    userRepository.findById(Long.parseLong(body.get("customerId")))
                            .ifPresent(m::setCustomer);
                }
            }
            if (body.containsKey("technicianId")) {
                if (body.get("technicianId").isBlank()) {
                    m.setTechnician(null);
                } else {
                    userRepository.findById(Long.parseLong(body.get("technicianId")))
                            .ifPresent(m::setTechnician);
                }
            }
            Meter updated = meterRepository.save(m);
            auditService.log(TenantContext.get(), request,
                    jwtUtil.extractEmail(authHeader.substring(7)),
                    jwtUtil.extractRole(authHeader.substring(7)),
                    AuditLog.Action.METER_UPDATED, "Meter", String.valueOf(id),
                    "Updated meter " + m.getSerialNumber());
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteMeter(@PathVariable Long id,
                                            @RequestHeader("Authorization") String authHeader,
                                            HttpServletRequest request) {
        var meter = meterRepository.findByIdAndTenantId(id, TenantContext.get());
        if (meter.isEmpty()) return ResponseEntity.notFound().build();
        meter.get().setDeletedAt(LocalDateTime.now());
        meterRepository.save(meter.get());
        auditService.log(TenantContext.get(), request,
                jwtUtil.extractEmail(authHeader.substring(7)),
                jwtUtil.extractRole(authHeader.substring(7)),
                AuditLog.Action.METER_DELETED, "Meter", String.valueOf(id),
                "Soft-deleted meter " + meter.get().getSerialNumber());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/restore")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> restoreMeter(@PathVariable Long id,
                                             @RequestHeader("Authorization") String authHeader,
                                             HttpServletRequest request) {
        int rows = meterRepository.restoreById(id, TenantContext.get());
        if (rows == 0) return ResponseEntity.notFound().build();
        auditService.log(TenantContext.get(), request,
                jwtUtil.extractEmail(authHeader.substring(7)),
                jwtUtil.extractRole(authHeader.substring(7)),
                AuditLog.Action.METER_UPDATED, "Meter", String.valueOf(id),
                "Restored soft-deleted meter #" + id);
        return ResponseEntity.noContent().build();
    }
}
