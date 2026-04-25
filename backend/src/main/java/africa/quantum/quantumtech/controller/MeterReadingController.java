package africa.quantum.quantumtech.controller;

import africa.quantum.quantumtech.model.AuditLog;
import africa.quantum.quantumtech.model.Meter;
import africa.quantum.quantumtech.model.MeterReading;
import africa.quantum.quantumtech.model.Tenant;
import africa.quantum.quantumtech.model.User;
import africa.quantum.quantumtech.repository.MeterReadingRepository;
import africa.quantum.quantumtech.repository.MeterRepository;
import africa.quantum.quantumtech.notification.EmailService;
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
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/readings")
public class MeterReadingController {

    private final MeterReadingRepository readingRepository;
    private final MeterRepository        meterRepository;
    private final UserRepository         userRepository;
    private final TenantRepository       tenantRepository;
    private final JwtUtil                jwtUtil;
    private final AuditService           auditService;
    private final EmailService           emailService;

    public MeterReadingController(MeterReadingRepository readingRepository,
                                  MeterRepository meterRepository,
                                  UserRepository userRepository,
                                  TenantRepository tenantRepository,
                                  JwtUtil jwtUtil,
                                  AuditService auditService,
                                  EmailService emailService) {
        this.readingRepository = readingRepository;
        this.meterRepository   = meterRepository;
        this.userRepository    = userRepository;
        this.tenantRepository  = tenantRepository;
        this.jwtUtil           = jwtUtil;
        this.auditService      = auditService;
        this.emailService      = emailService;
    }

    private Tenant currentTenant() {
        return tenantRepository.findById(TenantContext.get())
                .orElseThrow(() -> new RuntimeException("Tenant context missing"));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','TECHNICIAN')")
    public Page<MeterReading> allReadings(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return readingRepository.findByMeterTenantIdOrderByReadAtDesc(TenantContext.get(),
                PageRequest.of(page, size));
    }

    @GetMapping("/meter/{meterId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','TECHNICIAN')")
    public List<MeterReading> byMeter(@PathVariable Long meterId) {
        return readingRepository.findByMeterIdAndMeterTenantIdOrderByReadAtDesc(meterId, TenantContext.get());
    }

    @GetMapping("/my")
    public ResponseEntity<List<MeterReading>> myReadings(@RequestHeader("Authorization") String authHeader) {
        String email = jwtUtil.extractEmail(authHeader.substring(7));
        User user = userRepository.findByEmailAndTenant(email, currentTenant()).orElseThrow();
        return ResponseEntity.ok(readingRepository.findByCustomerIdAndTenantId(user.getId(), TenantContext.get()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','TECHNICIAN')")
    public ResponseEntity<?> logReading(@RequestHeader("Authorization") String authHeader,
                                        @RequestBody Map<String, String> body,
                                        HttpServletRequest request) {
        Long meterId = Long.parseLong(body.get("meterId"));
        Meter meter  = meterRepository.findByIdAndTenantId(meterId, TenantContext.get())
                .orElseThrow(() -> new RuntimeException("Meter not found"));
        String email    = jwtUtil.extractEmail(authHeader.substring(7));
        String role     = jwtUtil.extractRole(authHeader.substring(7));
        User   recorder = userRepository.findByEmailAndTenant(email, currentTenant()).orElseThrow();

        double newValue = Double.parseDouble(body.get("value"));
        double previousValue = readingRepository
                .findFirstByMeterIdAndMeterTenantIdOrderByReadAtDesc(meterId, TenantContext.get())
                .map(prev -> {
                    if (newValue < prev.getValue()) {
                        throw new IllegalArgumentException(
                                "Reading value " + newValue + " is less than the previous reading "
                                + prev.getValue() + " for this meter.");
                    }
                    return prev.getValue();
                })
                .orElse(0.0);

        MeterReading reading = new MeterReading();
        reading.setMeter(meter);
        reading.setValue(newValue);
        reading.setUnit(body.getOrDefault("unit", ""));
        reading.setReadingType(MeterReading.ReadingType.MANUAL);
        reading.setRecordedBy(recorder);

        MeterReading saved = readingRepository.save(reading);
        auditService.log(TenantContext.get(), request, email, role,
                AuditLog.Action.READING_LOGGED, "MeterReading", String.valueOf(saved.getId()),
                "Logged reading " + saved.getValue() + " " + saved.getUnit()
                        + " for meter " + meter.getSerialNumber());

        // Notify assigned customer by email
        if (meter.getCustomer() != null) {
            try {
                emailService.sendEmail(
                        meter.getCustomer().getEmail(),
                        "New meter reading — " + meter.getSerialNumber(),
                        EmailService.readingNotificationBody(
                                meter.getSerialNumber(), saved.getValue(), saved.getUnit(),
                                previousValue, saved.getReadAt())
                );
            } catch (Exception ignored) {}
        }

        return ResponseEntity.ok(saved);
    }
}
