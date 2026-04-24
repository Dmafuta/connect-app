package africa.quantum.quantumtech.controller;

import africa.quantum.quantumtech.model.Alert;
import africa.quantum.quantumtech.model.Meter;
import africa.quantum.quantumtech.model.User;
import africa.quantum.quantumtech.notification.SmsService;
import africa.quantum.quantumtech.repository.AlertRepository;
import africa.quantum.quantumtech.repository.MeterRepository;
import africa.quantum.quantumtech.repository.UserRepository;
import africa.quantum.quantumtech.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    private final AlertRepository alertRepository;
    private final MeterRepository meterRepository;
    private final UserRepository  userRepository;
    private final JwtUtil         jwtUtil;
    private final SmsService      smsService;

    public AlertController(AlertRepository alertRepository,
                           MeterRepository meterRepository,
                           UserRepository userRepository,
                           JwtUtil jwtUtil,
                           SmsService smsService) {
        this.alertRepository = alertRepository;
        this.meterRepository = meterRepository;
        this.userRepository  = userRepository;
        this.jwtUtil         = jwtUtil;
        this.smsService      = smsService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','TECHNICIAN')")
    public List<Alert> activeAlerts() {
        return alertRepository.findByResolvedFalseOrderByCreatedAtDesc();
    }

    @GetMapping("/meter/{meterId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','TECHNICIAN')")
    public List<Alert> byMeter(@PathVariable Long meterId) {
        return alertRepository.findByMeterIdOrderByCreatedAtDesc(meterId);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','TECHNICIAN')")
    public ResponseEntity<?> createAlert(@RequestBody Map<String, String> body) {
        Meter meter = meterRepository.findById(Long.parseLong(body.get("meterId"))).orElseThrow();
        Alert alert = new Alert();
        alert.setMeter(meter);
        alert.setAlertType(Alert.AlertType.valueOf(body.get("alertType")));
        alert.setSeverity(Alert.Severity.valueOf(body.getOrDefault("severity", "MEDIUM")));
        alert.setMessage(body.get("message"));
        Alert saved = alertRepository.save(alert);

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

        return ResponseEntity.ok(saved);
    }

    @PatchMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','TECHNICIAN')")
    public ResponseEntity<Alert> resolve(@PathVariable Long id,
                                         @RequestHeader("Authorization") String authHeader) {
        String email = jwtUtil.extractEmail(authHeader.substring(7));
        User resolver = userRepository.findByEmail(email).orElseThrow();
        return alertRepository.findById(id).map(a -> {
            a.setResolved(true);
            a.setResolvedBy(resolver);
            a.setResolvedAt(LocalDateTime.now());
            return ResponseEntity.ok(alertRepository.save(a));
        }).orElse(ResponseEntity.notFound().build());
    }
}
