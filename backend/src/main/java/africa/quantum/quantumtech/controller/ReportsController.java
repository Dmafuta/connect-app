package africa.quantum.quantumtech.controller;

import africa.quantum.quantumtech.model.Invoice;
import africa.quantum.quantumtech.model.Meter;
import africa.quantum.quantumtech.model.MeterReading;
import africa.quantum.quantumtech.repository.InvoiceRepository;
import africa.quantum.quantumtech.repository.MeterReadingRepository;
import africa.quantum.quantumtech.security.TenantContext;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reports")
@PreAuthorize("hasRole('ADMIN')")
public class ReportsController {

    private final MeterReadingRepository readingRepository;
    private final InvoiceRepository      invoiceRepository;

    public ReportsController(MeterReadingRepository readingRepository,
                             InvoiceRepository invoiceRepository) {
        this.readingRepository = readingRepository;
        this.invoiceRepository = invoiceRepository;
    }

    // ── Usage ─────────────────────────────────────────────────────────────────

    /**
     * GET /api/reports/usage?from=2024-01-01&to=2024-12-31
     * Per-meter consumption summary for the given date range.
     */
    @GetMapping("/usage")
    public ResponseEntity<List<Map<String, Object>>> usageReport(
            @RequestParam String from,
            @RequestParam String to) {

        LocalDateTime fromDt = LocalDate.parse(from).atStartOfDay();
        LocalDateTime toDt   = LocalDate.parse(to).atTime(23, 59, 59);

        List<MeterReading> readings = readingRepository
                .findByMeterTenantIdAndReadAtBetweenOrderByMeterIdAscReadAtAsc(
                        TenantContext.get(), fromDt, toDt);

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

    // ── Revenue ───────────────────────────────────────────────────────────────

    /**
     * GET /api/reports/revenue?months=12
     * Monthly paid vs unpaid invoice amounts for the last N months.
     */
    @GetMapping("/revenue")
    public ResponseEntity<List<Map<String, Object>>> revenueReport(
            @RequestParam(defaultValue = "12") int months) {

        Long tenantId = TenantContext.get();
        LocalDate startDate = LocalDate.now().minusMonths(months - 1).withDayOfMonth(1);
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM");

        // Pre-populate all months with zero values (ensures months with no data appear)
        Map<String, Map<String, Object>> byMonth = new LinkedHashMap<>();
        for (int i = months - 1; i >= 0; i--) {
            String key = LocalDate.now().minusMonths(i).format(fmt);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("month",  key);
            m.put("paid",   BigDecimal.ZERO);
            m.put("unpaid", BigDecimal.ZERO);
            byMonth.put(key, m);
        }

        List<Invoice> invoices = invoiceRepository.findByTenantIdAndIssuedAtAfter(tenantId, startDate);
        for (Invoice inv : invoices) {
            String key = inv.getIssuedAt().format(fmt);
            if (!byMonth.containsKey(key)) continue;
            Map<String, Object> m = byMonth.get(key);
            if (inv.getStatus() == Invoice.Status.PAID) {
                m.put("paid",   ((BigDecimal) m.get("paid")).add(inv.getAmount()));
            } else if (inv.getStatus() == Invoice.Status.UNPAID) {
                m.put("unpaid", ((BigDecimal) m.get("unpaid")).add(inv.getAmount()));
            }
        }

        return ResponseEntity.ok(new ArrayList<>(byMonth.values()));
    }

    // ── Top Consumers ─────────────────────────────────────────────────────────

    /**
     * GET /api/reports/top-consumers?from=&to=&limit=10
     * Customers ranked by total consumption in the date range.
     */
    @GetMapping("/top-consumers")
    public ResponseEntity<List<Map<String, Object>>> topConsumers(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam(defaultValue = "10") int limit) {

        LocalDateTime fromDt = LocalDate.parse(from).atStartOfDay();
        LocalDateTime toDt   = LocalDate.parse(to).atTime(23, 59, 59);

        List<MeterReading> readings = readingRepository
                .findByMeterTenantIdAndReadAtBetweenOrderByMeterIdAscReadAtAsc(
                        TenantContext.get(), fromDt, toDt);

        Map<Long, List<MeterReading>> byMeter = readings.stream()
                .collect(Collectors.groupingBy(r -> r.getMeter().getId(), LinkedHashMap::new, Collectors.toList()));

        // Accumulate consumption per customer
        Map<Long, Map<String, Object>> byCustomer = new LinkedHashMap<>();
        for (List<MeterReading> mrs : byMeter.values()) {
            if (mrs.size() < 2) continue;
            Meter m = mrs.get(0).getMeter();
            if (m.getCustomer() == null) continue;
            double consumption = mrs.get(mrs.size() - 1).getValue() - mrs.get(0).getValue();
            if (consumption <= 0) continue;
            Long customerId = m.getCustomer().getId();
            byCustomer.merge(customerId,
                new LinkedHashMap<>(Map.of(
                    "customerId",    customerId,
                    "customerName",  m.getCustomer().getFullName(),
                    "customerEmail", m.getCustomer().getEmail(),
                    "consumption",   consumption,
                    "meterCount",    1
                )),
                (existing, newEntry) -> {
                    existing.put("consumption", (double) existing.get("consumption") + consumption);
                    existing.put("meterCount",  (int)    existing.get("meterCount")  + 1);
                    return existing;
                });
        }

        List<Map<String, Object>> result = byCustomer.values().stream()
                .sorted(Comparator.comparingDouble((Map<String, Object> row) ->
                        (double) row.get("consumption")).reversed())
                .limit(limit)
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    // ── Invoice Aging ─────────────────────────────────────────────────────────

    /**
     * GET /api/reports/invoice-aging
     * Unpaid invoices bucketed by how many days they are overdue.
     */
    @GetMapping("/invoice-aging")
    public ResponseEntity<List<Map<String, Object>>> invoiceAging() {
        Long tenantId = TenantContext.get();
        LocalDate today = LocalDate.now();

        List<Invoice> unpaid = invoiceRepository.findByTenantIdAndStatus(tenantId, Invoice.Status.UNPAID);

        long currentCount  = 0; BigDecimal currentAmt  = BigDecimal.ZERO;
        long d1_30Count    = 0; BigDecimal d1_30Amt    = BigDecimal.ZERO;
        long d31_60Count   = 0; BigDecimal d31_60Amt   = BigDecimal.ZERO;
        long d60plusCount  = 0; BigDecimal d60plusAmt  = BigDecimal.ZERO;

        for (Invoice inv : unpaid) {
            long overdue = ChronoUnit.DAYS.between(inv.getDueAt(), today);
            if (overdue <= 0) {
                currentCount++;  currentAmt  = currentAmt.add(inv.getAmount());
            } else if (overdue <= 30) {
                d1_30Count++;    d1_30Amt    = d1_30Amt.add(inv.getAmount());
            } else if (overdue <= 60) {
                d31_60Count++;   d31_60Amt   = d31_60Amt.add(inv.getAmount());
            } else {
                d60plusCount++;  d60plusAmt  = d60plusAmt.add(inv.getAmount());
            }
        }

        return ResponseEntity.ok(List.of(
            Map.of("key", "current",    "label", "Not yet due",        "count", currentCount, "amount", currentAmt),
            Map.of("key", "days1_30",   "label", "1–30 days overdue",  "count", d1_30Count,   "amount", d1_30Amt),
            Map.of("key", "days31_60",  "label", "31–60 days overdue", "count", d31_60Count,  "amount", d31_60Amt),
            Map.of("key", "days60plus", "label", "60+ days overdue",   "count", d60plusCount, "amount", d60plusAmt)
        ));
    }
}
