package africa.quantum.quantumtech.controller;

import africa.quantum.quantumtech.model.Alert;
import africa.quantum.quantumtech.model.AuditLog;
import africa.quantum.quantumtech.model.Meter;
import africa.quantum.quantumtech.model.Tenant;
import africa.quantum.quantumtech.model.User;
import africa.quantum.quantumtech.notification.SmsService;
import africa.quantum.quantumtech.repository.AlertRepository;
import africa.quantum.quantumtech.repository.MeterRepository;
import africa.quantum.quantumtech.repository.TenantRepository;
import africa.quantum.quantumtech.repository.UserRepository;
import africa.quantum.quantumtech.security.JwtUtil;
import africa.quantum.quantumtech.security.TenantContext;
import africa.quantum.quantumtech.service.AlertEventService;
import africa.quantum.quantumtech.service.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    private final AlertRepository    alertRepository;
    private final MeterRepository    meterRepository;
    private final UserRepository     userRepository;
    private final TenantRepository   tenantRepository;
    private final JwtUtil            jwtUtil;
    private final SmsService         smsService;
    private final AuditService       auditService;
    private final AlertEventService  alertEventService;

    public AlertController(AlertRepository alertRepository,
                           MeterRepository meterRepository,
                           UserRepository userRepository,
                           TenantRepository tenantRepository,
                           JwtUtil jwtUtil,
                           SmsService smsService,
                           AuditService auditService,
                           AlertEventService alertEventService) {
        this.alertRepository   = alertRepository;
        this.meterRepository   = meterRepository;
        this.userRepository    = userRepository;
        this.tenantRepository  = tenantRepository;
        this.jwtUtil           = jwtUtil;
        this.smsService        = smsService;
        this.auditService      = auditService;
        this.alertEventService = alertEventService;
    }

    private Tenant currentTenant() {
        return tenantRepository.findById(TenantContext.get())
                .orElseThrow(() -> new RuntimeException("Tenant context missing"));
    }

    @GetMapping("/stream")
    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    public SseEmitter stream() {
        return alertEventService.subscribe(TenantContext.get());
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    public Page<Alert> activeAlerts(
            @RequestParam(defaultValue = "0")     int page,
            @RequestParam(defaultValue = "20")    int size,
            @RequestParam(defaultValue = "false") boolean all,
            @RequestParam(required = false)       Boolean resolved) {
        var pageable = PageRequest.of(page, size);
        if (all)                        return alertRepository.findByMeterTenantIdOrderByCreatedAtDesc(TenantContext.get(), pageable);
        if (Boolean.TRUE.equals(resolved)) return alertRepository.findByMeterTenantIdAndResolvedTrueOrderByCreatedAtDesc(TenantContext.get(), pageable);
        return alertRepository.findByMeterTenantIdAndResolvedFalseOrderByCreatedAtDesc(TenantContext.get(), pageable);
    }

    @GetMapping("/meter/{meterId}")
    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    public List<Alert> byMeter(@PathVariable Long meterId) {
        return alertRepository.findByMeterIdAndMeterTenantIdOrderByCreatedAtDesc(meterId, TenantContext.get());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    public ResponseEntity<?> createAlert(@RequestBody Map<String, String> body,
                                         @RequestHeader("Authorization") String authHeader,
                                         HttpServletRequest request) {
        Meter meter = meterRepository.findByIdAndTenantId(Long.parseLong(body.get("meterId")), TenantContext.get())
                .orElseThrow(() -> new RuntimeException("Meter not found"));
        Alert alert = new Alert();
        alert.setMeter(meter);
        alert.setAlertType(Alert.AlertType.valueOf(body.get("alertType")));
        alert.setSeverity(Alert.Severity.valueOf(body.getOrDefault("severity", "MEDIUM")));
        alert.setMessage(body.get("message"));
        Alert saved = alertRepository.save(alert);
        alertEventService.publish(TenantContext.get(), saved);

        // Notify customer whose meter triggered the alert
        User customer = meter.getCustomer();
        if (customer != null && customer.getPhone() != null && !customer.getPhone().isBlank()) {
            smsService.sendSms(customer.getPhone(),
                SmsService.alertCustomerSmsBody(
                    saved.getAlertType().name(), saved.getSeverity().name(), meter.getSerialNumber()));
        }

        // Notify assigned technician for HIGH and CRITICAL alerts
        boolean isUrgent = saved.getSeverity() == Alert.Severity.HIGH
                        || saved.getSeverity() == Alert.Severity.CRITICAL;
        User technician = meter.getTechnician();
        if (isUrgent && technician != null && technician.getPhone() != null && !technician.getPhone().isBlank()) {
            smsService.sendSms(technician.getPhone(),
                SmsService.alertTechnicianSmsBody(
                    saved.getAlertType().name(), saved.getSeverity().name(),
                    meter.getSerialNumber(), meter.getLocation()));
        }

        auditService.log(TenantContext.get(), request,
                jwtUtil.extractEmail(authHeader.substring(7)),
                jwtUtil.extractRole(authHeader.substring(7)),
                AuditLog.Action.ALERT_CREATED, "Alert", String.valueOf(saved.getId()),
                saved.getAlertType() + " (" + saved.getSeverity() + ") on meter " + meter.getSerialNumber());
        return ResponseEntity.ok(saved);
    }

    @PatchMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    public ResponseEntity<Alert> resolve(@PathVariable Long id,
                                         @RequestHeader("Authorization") String authHeader,
                                         HttpServletRequest request) {
        String email = jwtUtil.extractEmail(authHeader.substring(7));
        String role  = jwtUtil.extractRole(authHeader.substring(7));
        User resolver = userRepository.findByEmailAndTenant(email, currentTenant()).orElseThrow();
        return alertRepository.findByIdAndMeterTenantId(id, TenantContext.get()).map(a -> {
            a.setResolved(true);
            a.setResolvedBy(resolver);
            a.setResolvedAt(LocalDateTime.now());
            Alert saved = alertRepository.save(a);
            auditService.log(TenantContext.get(), request, email, role,
                    AuditLog.Action.ALERT_RESOLVED, "Alert", String.valueOf(id),
                    "Resolved " + a.getAlertType() + " alert on meter " + a.getMeter().getSerialNumber());
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }
}
