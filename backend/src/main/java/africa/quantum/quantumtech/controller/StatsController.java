package africa.quantum.quantumtech.controller;

import africa.quantum.quantumtech.model.Meter;
import africa.quantum.quantumtech.model.Role;
import africa.quantum.quantumtech.model.Tenant;
import africa.quantum.quantumtech.repository.AlertRepository;
import africa.quantum.quantumtech.repository.MeterReadingRepository;
import africa.quantum.quantumtech.repository.MeterRepository;
import africa.quantum.quantumtech.repository.TenantRepository;
import africa.quantum.quantumtech.repository.UserRepository;
import africa.quantum.quantumtech.security.TenantContext;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    private final UserRepository         userRepository;
    private final MeterRepository        meterRepository;
    private final AlertRepository        alertRepository;
    private final MeterReadingRepository readingRepository;
    private final TenantRepository       tenantRepository;

    public StatsController(UserRepository userRepository,
                           MeterRepository meterRepository,
                           AlertRepository alertRepository,
                           MeterReadingRepository readingRepository,
                           TenantRepository tenantRepository) {
        this.userRepository    = userRepository;
        this.meterRepository   = meterRepository;
        this.alertRepository   = alertRepository;
        this.readingRepository = readingRepository;
        this.tenantRepository  = tenantRepository;
    }

    @GetMapping
    public Map<String, Object> stats() {
        Long tenantId = TenantContext.get();

        // SUPER_ADMIN: platform-wide stats (no tenant scope)
        if (tenantId == null) {
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("tenantCount",    tenantRepository.count());
            result.put("userCount",      userRepository.count());
            result.put("customerCount",  userRepository.countByRole(Role.CUSTOMER));
            result.put("adminCount",     userRepository.countByRole(Role.ADMIN));
            result.put("technicianCount", userRepository.countByRole(Role.TECHNICIAN));
            result.put("activeUserCount", userRepository.countByActive(true));
            result.put("totalMeters",    meterRepository.count());
            result.put("activeMeters",   meterRepository.countByStatus(Meter.Status.ACTIVE));
            result.put("faultyMeters",   meterRepository.countByStatus(Meter.Status.FAULTY));
            result.put("waterMeters",    meterRepository.countByType(Meter.Type.WATER));
            result.put("electricityMeters", meterRepository.countByType(Meter.Type.ELECTRICITY));
            result.put("gasMeters",      meterRepository.countByType(Meter.Type.GAS));
            result.put("openAlerts",     alertRepository.countByResolvedFalse());
            result.put("resolvedAlerts", alertRepository.countByResolvedTrue());
            result.put("recentAlerts",   alertRepository.findByResolvedFalseOrderByCreatedAtDesc()
                    .stream().limit(5).toList());
            result.put("recentReadings", List.of());
            return result;
        }

        // Tenant-scoped stats
        Tenant tenant = tenantRepository.findById(tenantId).orElseThrow();

        Map<String, Object> result = new LinkedHashMap<>();

        // Users
        result.put("userCount",       userRepository.countByTenant(tenant));
        result.put("customerCount",   userRepository.countByTenantAndRole(tenant, Role.CUSTOMER));
        result.put("adminCount",      userRepository.countByTenantAndRole(tenant, Role.ADMIN));
        result.put("technicianCount", userRepository.countByTenantAndRole(tenant, Role.TECHNICIAN));
        result.put("activeUserCount", userRepository.countByTenantAndActive(tenant, true));

        // Meters
        result.put("totalMeters",       meterRepository.countByTenantId(tenantId));
        result.put("activeMeters",      meterRepository.countByTenantIdAndStatus(tenantId, Meter.Status.ACTIVE));
        result.put("faultyMeters",      meterRepository.countByTenantIdAndStatus(tenantId, Meter.Status.FAULTY));
        result.put("waterMeters",       meterRepository.countByTenantIdAndType(tenantId, Meter.Type.WATER));
        result.put("electricityMeters", meterRepository.countByTenantIdAndType(tenantId, Meter.Type.ELECTRICITY));
        result.put("gasMeters",         meterRepository.countByTenantIdAndType(tenantId, Meter.Type.GAS));

        // Alerts
        result.put("openAlerts",     alertRepository.countByMeterTenantIdAndResolvedFalse(tenantId));
        result.put("resolvedAlerts", alertRepository.countByMeterTenantIdAndResolvedTrue(tenantId));

        // Recent items
        result.put("recentAlerts",   alertRepository
                .findByMeterTenantIdAndResolvedFalseOrderByCreatedAtDesc(tenantId, PageRequest.of(0, 5))
                .getContent());
        result.put("recentReadings", readingRepository
                .findByMeterTenantIdOrderByReadAtDesc(tenantId, PageRequest.of(0, 5))
                .getContent());

        return result;
    }
}
