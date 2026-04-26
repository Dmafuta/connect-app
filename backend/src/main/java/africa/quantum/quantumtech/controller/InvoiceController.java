package africa.quantum.quantumtech.controller;

import africa.quantum.quantumtech.model.Invoice;
import africa.quantum.quantumtech.model.Tenant;
import africa.quantum.quantumtech.model.User;
import africa.quantum.quantumtech.repository.InvoiceRepository;
import africa.quantum.quantumtech.repository.TenantRepository;
import africa.quantum.quantumtech.repository.UserRepository;
import africa.quantum.quantumtech.security.JwtUtil;
import africa.quantum.quantumtech.security.TenantContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    private final InvoiceRepository  invoiceRepository;
    private final UserRepository     userRepository;
    private final TenantRepository   tenantRepository;
    private final JwtUtil            jwtUtil;

    public InvoiceController(InvoiceRepository invoiceRepository,
                             UserRepository userRepository,
                             TenantRepository tenantRepository,
                             JwtUtil jwtUtil) {
        this.invoiceRepository = invoiceRepository;
        this.userRepository    = userRepository;
        this.tenantRepository  = tenantRepository;
        this.jwtUtil           = jwtUtil;
    }

    private Tenant currentTenant() {
        return tenantRepository.findById(TenantContext.get())
                .orElseThrow(() -> new RuntimeException("Tenant context missing"));
    }

    /** All invoices for the tenant — ADMIN only, paginated, optional status filter */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Page<Invoice> allInvoices(
            @RequestParam(defaultValue = "0")    int page,
            @RequestParam(defaultValue = "20")   int size,
            @RequestParam(required = false)      String status) {
        Long tenantId = TenantContext.get();
        PageRequest pr = PageRequest.of(page, size, Sort.by("issuedAt").descending());
        if (status != null && !status.isBlank()) {
            return invoiceRepository.findByTenantIdAndStatusOrderByIssuedAtDesc(
                    tenantId, Invoice.Status.valueOf(status.toUpperCase()), pr);
        }
        return invoiceRepository.findByTenantIdOrderByIssuedAtDesc(tenantId, pr);
    }

    /** Customer's own invoices */
    @GetMapping("/my")
    public ResponseEntity<Page<Invoice>> myInvoices(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        String email = jwtUtil.extractEmail(authHeader.substring(7));
        Tenant tenant = currentTenant();
        User customer = userRepository.findByEmailAndTenant(email, tenant)
                .orElseThrow(() -> new RuntimeException("User not found"));
        PageRequest pr = PageRequest.of(page, size, Sort.by("issuedAt").descending());
        return ResponseEntity.ok(
                invoiceRepository.findByCustomerAndTenantIdOrderByIssuedAtDesc(customer, TenantContext.get(), pr));
    }

    /** Get single invoice — ADMIN sees any, CUSTOMER sees only their own */
    @GetMapping("/{id}")
    public ResponseEntity<?> getInvoice(@PathVariable Long id,
                                        @RequestHeader("Authorization") String authHeader) {
        String email = jwtUtil.extractEmail(authHeader.substring(7));
        String role  = jwtUtil.extractRole(authHeader.substring(7));
        return invoiceRepository.findById(id).map(inv -> {
            if (!inv.getTenant().getId().equals(TenantContext.get())) {
                return ResponseEntity.notFound().build();
            }
            if ("CUSTOMER".equals(role) && !inv.getCustomer().getEmail().equals(email)) {
                return ResponseEntity.status(403).build();
            }
            return ResponseEntity.ok(inv);
        }).orElse(ResponseEntity.notFound().build());
    }

    /** Mark invoice as PAID — ADMIN only */
    @PatchMapping("/{id}/mark-paid")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> markPaid(@PathVariable Long id) {
        return invoiceRepository.findById(id).map(inv -> {
            if (!inv.getTenant().getId().equals(TenantContext.get())) {
                return ResponseEntity.notFound().build();
            }
            inv.setStatus(Invoice.Status.PAID);
            inv.setPaidAt(LocalDateTime.now());
            return ResponseEntity.ok(invoiceRepository.save(inv));
        }).orElse(ResponseEntity.notFound().build());
    }

    /** Void an invoice — ADMIN only */
    @PatchMapping("/{id}/void")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> voidInvoice(@PathVariable Long id) {
        return invoiceRepository.findById(id).map(inv -> {
            if (!inv.getTenant().getId().equals(TenantContext.get())) {
                return ResponseEntity.notFound().build();
            }
            inv.setStatus(Invoice.Status.VOID);
            return ResponseEntity.ok(invoiceRepository.save(inv));
        }).orElse(ResponseEntity.notFound().build());
    }

    /** Summary counts for the dashboard — ADMIN only */
    @GetMapping("/summary")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> summary() {
        Long tenantId = TenantContext.get();
        return ResponseEntity.ok(Map.of(
                "unpaidCount",  invoiceRepository.countByTenantIdAndStatus(tenantId, Invoice.Status.UNPAID),
                "paidCount",    invoiceRepository.countByTenantIdAndStatus(tenantId, Invoice.Status.PAID),
                "unpaidAmount", invoiceRepository.sumUnpaidByTenantId(tenantId),
                "paidAmount",   invoiceRepository.sumPaidByTenantId(tenantId)
        ));
    }
}
