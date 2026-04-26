package africa.quantum.quantumtech.mpesa.controller;

import africa.quantum.quantumtech.model.Invoice;
import africa.quantum.quantumtech.model.Tenant;
import africa.quantum.quantumtech.model.User;
import africa.quantum.quantumtech.mpesa.dto.MpesaCallbackPayload;
import africa.quantum.quantumtech.mpesa.dto.StkPushRequest;
import africa.quantum.quantumtech.mpesa.dto.StkPushResponse;
import africa.quantum.quantumtech.mpesa.model.MpesaTransaction;
import africa.quantum.quantumtech.mpesa.service.MpesaService;
import africa.quantum.quantumtech.repository.InvoiceRepository;
import africa.quantum.quantumtech.repository.TenantRepository;
import africa.quantum.quantumtech.repository.UserRepository;
import africa.quantum.quantumtech.security.JwtUtil;
import africa.quantum.quantumtech.security.TenantContext;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mpesa")
public class MpesaController {

    private static final Logger log = LoggerFactory.getLogger(MpesaController.class);
    private final MpesaService      mpesaService;
    private final JwtUtil           jwtUtil;
    private final UserRepository    userRepository;
    private final TenantRepository  tenantRepository;
    private final InvoiceRepository invoiceRepository;

    public MpesaController(MpesaService mpesaService, JwtUtil jwtUtil,
                           UserRepository userRepository, TenantRepository tenantRepository,
                           InvoiceRepository invoiceRepository) {
        this.mpesaService      = mpesaService;
        this.jwtUtil           = jwtUtil;
        this.userRepository    = userRepository;
        this.tenantRepository  = tenantRepository;
        this.invoiceRepository = invoiceRepository;
    }

    private Tenant currentTenant() {
        Long id = TenantContext.get();
        return id != null ? tenantRepository.findById(id).orElse(null) : null;
    }

    /**
     * POST /api/mpesa/stk-push
     * Initiates an STK push to the customer's phone.
     * Requires authentication.
     */
    @PostMapping("/stk-push")
    public ResponseEntity<?> stkPush(@Valid @RequestBody StkPushRequest request) {
        try {
            StkPushResponse response = mpesaService.initiateStkPush(request, currentTenant());
            if (response.isSuccess()) {
                return ResponseEntity.ok(Map.of(
                        "message", "STK push sent. Please check your phone.",
                        "checkoutRequestId", response.getCheckoutRequestId(),
                        "merchantRequestId", response.getMerchantRequestId(),
                        "customerMessage", response.getCustomerMessage()
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "Failed to initiate payment",
                        "detail", response.getResponseDescription()
                ));
            }
        } catch (Exception e) {
            log.error("STK push error: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "message", "Payment initiation failed. Please try again."
            ));
        }
    }

    /**
     * POST /api/mpesa/pay-invoice/{invoiceId}
     * Initiates an STK push to pay a specific invoice.
     * Customers can only pay their own invoices. ADMIN can pay any.
     */
    @PostMapping("/pay-invoice/{invoiceId}")
    public ResponseEntity<?> payInvoice(@PathVariable Long invoiceId,
                                         @RequestBody(required = false) Map<String, String> body,
                                         @RequestHeader("Authorization") String authHeader) {
        String email = jwtUtil.extractEmail(authHeader.substring(7));
        String role  = jwtUtil.extractRole(authHeader.substring(7));
        Tenant tenant = currentTenant();

        Invoice invoice = invoiceRepository.findById(invoiceId).orElse(null);
        if (invoice == null || !invoice.getTenant().getId().equals(tenant != null ? tenant.getId() : -1L)) {
            return ResponseEntity.notFound().build();
        }
        if ("CUSTOMER".equals(role) && !invoice.getCustomer().getEmail().equals(email)) {
            return ResponseEntity.status(403).build();
        }
        if (invoice.getStatus() != Invoice.Status.UNPAID) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invoice #" + invoiceId + " is already " + invoice.getStatus().name().toLowerCase()));
        }

        // Resolve phone: request body → customer's profile phone
        String phone = (body != null) ? body.get("phone") : null;
        if (phone == null || phone.isBlank()) {
            phone = invoice.getCustomer().getPhone();
        }
        if (phone == null || phone.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Phone number is required to initiate payment"));
        }

        User caller = userRepository.findByEmail(email).orElse(null);
        StkPushRequest req = new StkPushRequest();
        req.setPhoneNumber(phone);
        req.setAmount(invoice.getAmount());
        req.setAccountReference("INV-" + invoiceId);
        req.setDescription("Invoice #" + invoiceId);
        req.setUserId(caller != null ? caller.getId() : null);

        try {
            StkPushResponse response = mpesaService.initiateStkPush(req, tenant);
            if (response.isSuccess()) {
                return ResponseEntity.ok(Map.of(
                        "message", "STK push sent. Please check your phone.",
                        "checkoutRequestId", response.getCheckoutRequestId(),
                        "merchantRequestId", response.getMerchantRequestId(),
                        "customerMessage", response.getCustomerMessage()
                ));
            }
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Failed to initiate payment",
                    "detail",  response.getResponseDescription()
            ));
        } catch (Exception e) {
            log.error("Pay-invoice STK push error for invoice #{}: {}", invoiceId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Payment initiation failed. Please try again."));
        }
    }

    /**
     * POST /api/mpesa/callback/{tenantCode}
     * Per-tenant STK push and C2B callback — Safaricom calls this after the customer
     * completes or cancels the prompt. Must be publicly accessible (no JWT required).
     */
    @PostMapping("/callback/{tenantCode}")
    public ResponseEntity<String> tenantCallback(@PathVariable String tenantCode,
                                                  @RequestBody MpesaCallbackPayload payload) {
        try {
            mpesaService.handleCallback(payload);
        } catch (Exception e) {
            log.error("Callback processing error for tenant {}: {}", tenantCode, e.getMessage(), e);
        }
        return ResponseEntity.ok("OK");
    }

    /**
     * POST /api/mpesa/callback
     * Legacy platform-level callback (kept for backward compatibility and Quantum's own subscription).
     */
    @PostMapping("/callback")
    public ResponseEntity<String> platformCallback(@RequestBody MpesaCallbackPayload payload) {
        try {
            mpesaService.handleCallback(payload);
        } catch (Exception e) {
            log.error("Platform callback processing error: {}", e.getMessage(), e);
        }
        return ResponseEntity.ok("OK");
    }

    /**
     * GET /api/mpesa/transaction/{checkoutRequestId}
     * Poll to check payment status. Requires authentication.
     */
    @GetMapping("/transaction/{checkoutRequestId}")
    public ResponseEntity<?> getTransaction(@PathVariable String checkoutRequestId) {
        try {
            return ResponseEntity.ok(mpesaService.getTransaction(checkoutRequestId));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * GET /api/mpesa/transactions/user/{userId}
     * Customers can only fetch their own transactions.
     * Admins and super-admins can fetch any user's transactions.
     */
    @GetMapping("/transactions/user/{userId}")
    public ResponseEntity<List<MpesaTransaction>> getUserTransactions(
            @PathVariable Long userId,
            @RequestHeader("Authorization") String authHeader) {
        String email = jwtUtil.extractEmail(authHeader.substring(7));
        String role  = jwtUtil.extractRole(authHeader.substring(7));

        boolean isAdmin = "SUPER_ADMIN".equals(role) || "ADMIN".equals(role);
        if (!isAdmin) {
            Long callerId = userRepository.findByEmail(email)
                    .map(u -> u.getId()).orElse(-1L);
            if (!callerId.equals(userId)) {
                return ResponseEntity.status(403).build();
            }
        }
        return ResponseEntity.ok(mpesaService.getUserTransactions(userId));
    }

    /**
     * GET /api/mpesa/transactions/all
     * ADMIN: returns transactions for their tenant only.
     * SUPER_ADMIN: returns all transactions across the platform.
     */
    @GetMapping("/transactions/all")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<List<MpesaTransaction>> getAllTransactions(
            @RequestHeader("Authorization") String authHeader) {
        String role = jwtUtil.extractRole(authHeader.substring(7));
        if ("SUPER_ADMIN".equals(role)) {
            return ResponseEntity.ok(mpesaService.getAllTransactions());
        }
        Long tenantId = TenantContext.get();
        return ResponseEntity.ok(tenantId != null
                ? mpesaService.getTenantTransactions(tenantId)
                : List.of());
    }
}
