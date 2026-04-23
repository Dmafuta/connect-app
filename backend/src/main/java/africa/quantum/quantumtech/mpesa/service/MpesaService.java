package africa.quantum.quantumtech.mpesa.service;

import africa.quantum.quantumtech.mpesa.config.MpesaConfig;
import africa.quantum.quantumtech.mpesa.dto.*;
import africa.quantum.quantumtech.mpesa.model.MpesaTransaction;
import africa.quantum.quantumtech.mpesa.repository.MpesaTransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class MpesaService {

    private static final Logger log = LoggerFactory.getLogger(MpesaService.class);
    private static final DateTimeFormatter TIMESTAMP_FMT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private final MpesaConfig config;
    private final RestTemplate restTemplate;
    private final MpesaTransactionRepository transactionRepo;

    public MpesaService(MpesaConfig config,
                        RestTemplate restTemplate,
                        MpesaTransactionRepository transactionRepo) {
        this.config = config;
        this.restTemplate = restTemplate;
        this.transactionRepo = transactionRepo;
    }

    // ── OAuth Token ───────────────────────────────────────────────────────────

    /**
     * Fetches a fresh OAuth access token from Daraja.
     * Tokens expire in 1 hour; for production consider caching.
     */
    public String getAccessToken() {
        String credentials = config.getConsumerKey() + ":" + config.getConsumerSecret();
        String encoded = Base64.getEncoder()
                .encodeToString(credentials.getBytes(StandardCharsets.UTF_8));

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Basic " + encoded);

        String url = config.getBaseUrl() + "/oauth/v1/generate?grant_type=client_credentials";

        ResponseEntity<MpesaAuthResponse> response = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(headers), MpesaAuthResponse.class);

        if (response.getBody() == null || response.getBody().getAccessToken() == null) {
            throw new RuntimeException("Failed to obtain Mpesa access token");
        }
        return response.getBody().getAccessToken();
    }

    // ── STK Push ─────────────────────────────────────────────────────────────

    /**
     * Initiates an STK Push (Lipa Na Mpesa Online) to the customer's phone.
     * Persists a PENDING transaction and returns the Daraja response.
     */
    public StkPushResponse initiateStkPush(StkPushRequest request) {
        String token = getAccessToken();
        String timestamp = LocalDateTime.now().format(TIMESTAMP_FMT);
        String password = generatePassword(timestamp);

        Map<String, Object> body = new HashMap<>();
        body.put("BusinessShortCode", config.getShortcode());
        body.put("Password", password);
        body.put("Timestamp", timestamp);
        body.put("TransactionType", "CustomerPayBillOnline");
        body.put("Amount", request.getAmount().setScale(0, java.math.RoundingMode.HALF_UP).toPlainString());
        body.put("PartyA", normalisePhone(request.getPhoneNumber()));
        body.put("PartyB", config.getShortcode());
        body.put("PhoneNumber", normalisePhone(request.getPhoneNumber()));
        body.put("CallBackURL", config.getCallbackUrl());
        body.put("AccountReference", request.getAccountReference());
        body.put("TransactionDesc", request.getDescription());

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));

        String url = config.getBaseUrl() + "/mpesa/stkpush/v1/processrequest";

        ResponseEntity<StkPushResponse> response = restTemplate.exchange(
                url, HttpMethod.POST, new HttpEntity<>(body, headers), StkPushResponse.class);

        StkPushResponse stkResponse = response.getBody();
        if (stkResponse == null) {
            throw new RuntimeException("Empty response from Daraja STK push");
        }

        // Persist a PENDING transaction record
        if (stkResponse.isSuccess()) {
            MpesaTransaction tx = new MpesaTransaction();
            tx.setMerchantRequestId(stkResponse.getMerchantRequestId());
            tx.setCheckoutRequestId(stkResponse.getCheckoutRequestId());
            tx.setPhoneNumber(normalisePhone(request.getPhoneNumber()));
            tx.setAmount(request.getAmount());
            tx.setAccountReference(request.getAccountReference());
            tx.setDescription(request.getDescription());
            tx.setUserId(request.getUserId());
            tx.setStatus(MpesaTransaction.TransactionStatus.PENDING);
            transactionRepo.save(tx);
            log.info("STK push initiated — checkoutRequestId={}", stkResponse.getCheckoutRequestId());
        } else {
            log.warn("STK push rejected by Daraja — code={} desc={}",
                    stkResponse.getResponseCode(), stkResponse.getResponseDescription());
        }

        return stkResponse;
    }

    // ── Callback Handling ─────────────────────────────────────────────────────

    /**
     * Processes the asynchronous callback sent by Safaricom after the customer
     * completes or cancels the STK push prompt.
     */
    public void handleCallback(MpesaCallbackPayload payload) {
        MpesaCallbackPayload.StkCallback cb = payload.getBody().getStkCallback();
        String checkoutRequestId = cb.getCheckoutRequestId();

        MpesaTransaction tx = transactionRepo.findByCheckoutRequestId(checkoutRequestId)
                .orElseGet(() -> {
                    log.warn("Callback for unknown checkoutRequestId={}", checkoutRequestId);
                    MpesaTransaction unknown = new MpesaTransaction();
                    unknown.setCheckoutRequestId(checkoutRequestId);
                    unknown.setMerchantRequestId(cb.getMerchantRequestId());
                    return unknown;
                });

        tx.setResultCode(String.valueOf(cb.getResultCode()));
        tx.setResultDesc(cb.getResultDesc());

        if (cb.isSuccess()) {
            MpesaCallbackPayload.CallbackMetadata meta = cb.getCallbackMetadata();
            tx.setMpesaReceiptNumber(meta.getValue("MpesaReceiptNumber"));
            tx.setTransactionDate(meta.getValue("TransactionDate"));

            String amountStr = meta.getValue("Amount");
            if (amountStr != null && tx.getAmount() == null) {
                tx.setAmount(new BigDecimal(amountStr));
            }
            String phone = meta.getValue("PhoneNumber");
            if (phone != null && tx.getPhoneNumber() == null) {
                tx.setPhoneNumber(phone);
            }

            tx.setStatus(MpesaTransaction.TransactionStatus.SUCCESS);
            log.info("Payment successful — receipt={} checkoutRequestId={}",
                    tx.getMpesaReceiptNumber(), checkoutRequestId);
        } else {
            tx.setStatus(MpesaTransaction.TransactionStatus.FAILED);
            log.warn("Payment failed — resultCode={} desc={}", cb.getResultCode(), cb.getResultDesc());
        }

        transactionRepo.save(tx);
    }

    // ── Status Query ──────────────────────────────────────────────────────────

    /**
     * Queries transaction status directly from our database.
     * Call this from the frontend to poll for payment confirmation.
     */
    public MpesaTransaction getTransaction(String checkoutRequestId) {
        return transactionRepo.findByCheckoutRequestId(checkoutRequestId)
                .orElseThrow(() -> new RuntimeException("Transaction not found: " + checkoutRequestId));
    }

    /** Returns all transactions for a given user, most recent first. */
    public List<MpesaTransaction> getUserTransactions(Long userId) {
        return transactionRepo.findByUserIdOrderByCreatedAtDesc(userId);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Base64(shortcode + passkey + timestamp)
     */
    private String generatePassword(String timestamp) {
        String raw = config.getShortcode() + config.getPasskey() + timestamp;
        return Base64.getEncoder().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Ensures phone numbers start with 254 (Kenya).
     * Accepts: 0712345678, +254712345678, 254712345678
     */
    private String normalisePhone(String phone) {
        if (phone == null) return phone;
        phone = phone.trim().replaceAll("\\s+", "");
        if (phone.startsWith("+")) phone = phone.substring(1);
        if (phone.startsWith("0"))  phone = "254" + phone.substring(1);
        return phone;
    }
}
