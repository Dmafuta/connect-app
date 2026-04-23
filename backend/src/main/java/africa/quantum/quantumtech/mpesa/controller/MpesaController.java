package africa.quantum.quantumtech.mpesa.controller;

import africa.quantum.quantumtech.mpesa.dto.MpesaCallbackPayload;
import africa.quantum.quantumtech.mpesa.dto.StkPushRequest;
import africa.quantum.quantumtech.mpesa.dto.StkPushResponse;
import africa.quantum.quantumtech.mpesa.model.MpesaTransaction;
import africa.quantum.quantumtech.mpesa.service.MpesaService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mpesa")
public class MpesaController {

    private static final Logger log = LoggerFactory.getLogger(MpesaController.class);

    private final MpesaService mpesaService;

    public MpesaController(MpesaService mpesaService) {
        this.mpesaService = mpesaService;
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
     * Safaricom calls this endpoint after the customer completes/cancels the prompt.
     * Must be publicly accessible (no JWT required).
     */
    @PostMapping("/callback")
    public ResponseEntity<String> callback(@RequestBody MpesaCallbackPayload payload) {
        try {
            mpesaService.handleCallback(payload);
        } catch (Exception e) {
            log.error("Callback processing error: {}", e.getMessage(), e);
        }
        // Always return 200 so Safaricom doesn't retry
        return ResponseEntity.ok("OK");
    }

    /**
     * GET /api/mpesa/transaction/{checkoutRequestId}
     * Poll this from the frontend to check payment status.
     * Requires authentication.
     */
    @GetMapping("/transaction/{checkoutRequestId}")
    public ResponseEntity<?> getTransaction(@PathVariable String checkoutRequestId) {
        try {
            MpesaTransaction tx = mpesaService.getTransaction(checkoutRequestId);
            return ResponseEntity.ok(tx);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * GET /api/mpesa/transactions/user/{userId}
     * Returns all transactions for a given user.
     * Requires authentication.
     */
    @GetMapping("/transactions/user/{userId}")
    public ResponseEntity<List<MpesaTransaction>> getUserTransactions(@PathVariable Long userId) {
        return ResponseEntity.ok(mpesaService.getUserTransactions(userId));
    }
}
