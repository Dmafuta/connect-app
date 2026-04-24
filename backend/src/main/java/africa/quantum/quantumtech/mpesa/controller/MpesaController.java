package africa.quantum.quantumtech.mpesa.controller;

import africa.quantum.quantumtech.mpesa.dto.MpesaCallbackPayload;
import africa.quantum.quantumtech.mpesa.dto.StkPushRequest;
import africa.quantum.quantumtech.mpesa.dto.StkPushResponse;
import africa.quantum.quantumtech.mpesa.model.MpesaTransaction;
import africa.quantum.quantumtech.mpesa.service.MpesaService;
import africa.quantum.quantumtech.repository.UserRepository;
import africa.quantum.quantumtech.security.JwtUtil;
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
    private final MpesaService   mpesaService;
    private final JwtUtil        jwtUtil;
    private final UserRepository userRepository;

    public MpesaController(MpesaService mpesaService, JwtUtil jwtUtil, UserRepository userRepository) {
        this.mpesaService   = mpesaService;
        this.jwtUtil        = jwtUtil;
        this.userRepository = userRepository;
    }

    /**
     * POST /api/mpesa/stk-push
     * Initiates an STK push to the customer's phone.
     * Requires authentication.
     */
    @PostMapping("/stk-push")
    public ResponseEntity<?> stkPush(@Valid @RequestBody StkPushRequest request) {
        try {
            StkPushResponse response = mpesaService.initiateStkPush(request);
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
     * POST /api/mpesa/callback
     * Safaricom calls this after customer completes/cancels the prompt.
     * Must be publicly accessible (no JWT required).
     */
    @PostMapping("/callback")
    public ResponseEntity<String> callback(@RequestBody MpesaCallbackPayload payload) {
        try {
            mpesaService.handleCallback(payload);
        } catch (Exception e) {
            log.error("Callback processing error: {}", e.getMessage(), e);
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
     * All transactions — admin/super-admin only.
     */
    @GetMapping("/transactions/all")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<List<MpesaTransaction>> getAllTransactions() {
        return ResponseEntity.ok(mpesaService.getAllTransactions());
    }
}
