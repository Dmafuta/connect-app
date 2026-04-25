package africa.quantum.quantumtech.controller;

import africa.quantum.quantumtech.model.Meter;
import africa.quantum.quantumtech.model.MeterReading;
import africa.quantum.quantumtech.repository.MeterReadingRepository;
import africa.quantum.quantumtech.security.TenantContext;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reports")
public class ReportsController {

    private final MeterReadingRepository readingRepository;

    public ReportsController(MeterReadingRepository readingRepository) {
        this.readingRepository = readingRepository;
    }

    /**
     * GET /api/reports/usage?from=2024-01-01&to=2024-12-31
     * Returns per-meter consumption summary for the given date range.
     */
    @GetMapping("/usage")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> usageReport(
            @RequestParam String from,
            @RequestParam String to) {

        LocalDateTime fromDt = LocalDate.parse(from).atStartOfDay();
        LocalDateTime toDt   = LocalDate.parse(to).atTime(23, 59, 59);

        List<MeterReading> readings = readingRepository
                .findByMeterTenantIdAndReadAtBetweenOrderByMeterIdAscReadAtAsc(
                        TenantContext.get(), fromDt, toDt);

        // Group by meter
        Map<Long, List<MeterReading>> byMeter = readings.stream()
                .collect(Collectors.groupingBy(r -> r.getMeter().getId(), LinkedHashMap::new, Collectors.toList()));

        List<Map<String, Object>> result = byMeter.values().stream().map(mrs -> {
            Meter m = mrs.get(0).getMeter();
            double firstVal = mrs.get(0).getValue();
            double lastVal  = mrs.get(mrs.size() - 1).getValue();

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("meterId",       m.getId());
            row.put("serialNumber",  m.getSerialNumber());
            row.put("type",          m.getType());
            row.put("location",      m.getLocation());
            row.put("customerName",  m.getCustomer() != null ? m.getCustomer().getFullName() : null);
            row.put("customerEmail", m.getCustomer() != null ? m.getCustomer().getEmail() : null);
            row.put("readingCount",  mrs.size());
            row.put("firstReading",  firstVal);
            row.put("lastReading",   lastVal);
            row.put("consumption",   lastVal - firstVal);
            row.put("unit",          mrs.get(0).getUnit());
            return row;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }
}
