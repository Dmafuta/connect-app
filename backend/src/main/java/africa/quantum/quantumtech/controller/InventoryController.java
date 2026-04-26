package africa.quantum.quantumtech.controller;

import africa.quantum.quantumtech.model.AuditLog;
import africa.quantum.quantumtech.model.InventoryMeter;
import africa.quantum.quantumtech.model.Meter;
import africa.quantum.quantumtech.model.Tenant;
import africa.quantum.quantumtech.repository.InventoryMeterRepository;
import africa.quantum.quantumtech.repository.MeterRepository;
import africa.quantum.quantumtech.repository.TenantRepository;
import africa.quantum.quantumtech.security.JwtUtil;
import africa.quantum.quantumtech.service.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class InventoryController {

    private final InventoryMeterRepository inventoryRepo;
    private final MeterRepository          meterRepository;
    private final TenantRepository         tenantRepository;
    private final JwtUtil                  jwtUtil;
    private final AuditService             auditService;

    public InventoryController(InventoryMeterRepository inventoryRepo,
                               MeterRepository meterRepository,
                               TenantRepository tenantRepository,
                               JwtUtil jwtUtil,
                               AuditService auditService) {
        this.inventoryRepo  = inventoryRepo;
        this.meterRepository = meterRepository;
        this.tenantRepository = tenantRepository;
        this.jwtUtil        = jwtUtil;
        this.auditService   = auditService;
    }

    /** List all inventory meters — paginated. Optional ?status=AVAILABLE filter. */
    @GetMapping
    public Page<InventoryMeter> list(
            @RequestParam(defaultValue = "0")   int page,
            @RequestParam(defaultValue = "20")  int size,
            @RequestParam(required = false)     String status) {
        PageRequest pr = PageRequest.of(page, size, Sort.by("id").descending());
        if (status != null && !status.isBlank()) {
            return inventoryRepo.findByStatusOrderByIdDesc(
                    InventoryMeter.Status.valueOf(status.toUpperCase()), pr);
        }
        return inventoryRepo.findAllByOrderByIdDesc(pr);
    }

    /** Add a meter to Quantum's inventory. */
    @PostMapping
    public ResponseEntity<?> add(@RequestBody Map<String, String> body,
                                 @RequestHeader("Authorization") String authHeader,
                                 HttpServletRequest request) {
        String serial = body.get("serialNumber");
        if (serial == null || serial.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "serialNumber is required"));
        }
        if (inventoryRepo.existsBySerialNumber(serial)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Serial number already in inventory"));
        }

        InventoryMeter inv = new InventoryMeter();
        inv.setSerialNumber(serial);
        inv.setType(Meter.Type.valueOf(body.getOrDefault("type", "ELECTRICITY")));
        inv.setMode(Meter.Mode.valueOf(body.getOrDefault("mode", "SMART")));
        inventoryRepo.save(inv);

        auditService.log(null, request,
                jwtUtil.extractEmail(authHeader.substring(7)), "SUPER_ADMIN",
                AuditLog.Action.METER_CREATED, "InventoryMeter", String.valueOf(inv.getId()),
                "Added meter " + serial + " to Quantum inventory");

        return ResponseEntity.ok(inv);
    }

    /**
     * Allocate an inventory meter to a tenant.
     * Creates a Meter record in the tenant's scope and marks the inventory entry ALLOCATED.
     */
    @PostMapping("/{id}/allocate")
    public ResponseEntity<?> allocate(@PathVariable Long id,
                                      @RequestBody Map<String, String> body,
                                      @RequestHeader("Authorization") String authHeader,
                                      HttpServletRequest request) {
        InventoryMeter inv = inventoryRepo.findById(id).orElse(null);
        if (inv == null) return ResponseEntity.notFound().build();
        if (inv.getStatus() == InventoryMeter.Status.ALLOCATED) {
            return ResponseEntity.badRequest().body(Map.of("message", "Meter is already allocated"));
        }

        String tenantIdStr = body.get("tenantId");
        if (tenantIdStr == null || tenantIdStr.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "tenantId is required"));
        }
        Tenant tenant = tenantRepository.findById(Long.parseLong(tenantIdStr)).orElse(null);
        if (tenant == null) return ResponseEntity.badRequest().body(Map.of("message", "Tenant not found"));

        if (meterRepository.existsBySerialNumberAndTenantId(inv.getSerialNumber(), tenant.getId())) {
            return ResponseEntity.badRequest().body(Map.of("message", "This meter is already registered for that tenant"));
        }

        // Create the Meter record in the tenant's scope
        Meter meter = new Meter();
        meter.setSerialNumber(inv.getSerialNumber());
        meter.setType(inv.getType());
        meter.setMode(inv.getMode());
        meter.setTenant(tenant);
        meterRepository.save(meter);

        // Mark inventory entry as allocated
        inv.setStatus(InventoryMeter.Status.ALLOCATED);
        inv.setAllocatedTo(tenant);
        inv.setAllocatedAt(LocalDateTime.now());
        inventoryRepo.save(inv);

        String callerEmail = jwtUtil.extractEmail(authHeader.substring(7));
        auditService.log(null, request, callerEmail, "SUPER_ADMIN",
                AuditLog.Action.METER_CREATED, "Meter", String.valueOf(meter.getId()),
                "Allocated meter " + inv.getSerialNumber() + " to tenant '" + tenant.getName() + "'");

        return ResponseEntity.ok(Map.of(
                "message", "Meter allocated successfully",
                "meterId", meter.getId(),
                "tenant", tenant.getName()
        ));
    }
}
