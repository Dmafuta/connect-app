package africa.quantum.quantumtech.mpesa.service;

import africa.quantum.quantumtech.model.Invoice;
import africa.quantum.quantumtech.model.Tenant;
import africa.quantum.quantumtech.mpesa.config.MpesaConfig;
import africa.quantum.quantumtech.mpesa.dto.*;
import africa.quantum.quantumtech.mpesa.model.MpesaTransaction;
import africa.quantum.quantumtech.mpesa.repository.MpesaTransactionRepository;
import africa.quantum.quantumtech.notification.SmsService;
import africa.quantum.quantumtech.repository.InvoiceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;
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
    private final SmsService smsService;
    private final InvoiceRepository invoiceRepository;

    public MpesaService(MpesaConfig config,
                        RestTemplate restTemplate,
                        MpesaTransactionRepository transactionRepo,
                        SmsService smsService,
                        InvoiceRepository invoiceRepository) {
        this.config = config;
        this.restTemplate = restTemplate;
        this.transactionRepo = transactionRepo;
        this.smsService = smsService;
        this.invoiceRepository = invoiceRepository;
    }

    // ── OAuth Token ───────────────────────────────────────────────────────────

    /**
     * Fetches a fresh OAuth token using the platform (global) credentials.
     * Tokens expire in 1 hour; for production consider caching per-tenant.
     */
    public String getAccessToken() {
        return getAccessToken(config.getConsumerKey(), config.getConsumerSecret());
    }

    private String getAccessToken(String consumerKey, String consumerSecret) {
        String credentials = consumerKey + ":" + consumerSecret;
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
     * Initiates an STK Push using per-tenant Daraja credentials when configured,
     * falling back to the platform-level credentials in application.properties.
     * Persists a PENDING transaction and returns the Daraja response.
     */
    public StkPushResponse initiateStkPush(StkPushRequest request, Tenant tenant) {
        // Resolve credentials: prefer tenant-specific, fall back to platform config
        String shortcode = resolve(tenant != null ? tenant.getMpesaShortcode()       : null, config.getShortcode());
        String passkey   = resolve(tenant != null ? tenant.getMpesaPasskey()         : null, config.getPasskey());
        String ck        = resolve(tenant != null ? tenant.getMpesaConsumerKey()     : null, config.getConsumerKey());
        String cs        = resolve(tenant != null ? tenant.getMpesaConsumerSecret()  : null, config.getConsumerSecret());

        String token     = getAccessToken(ck, cs);
        String timestamp = LocalDateTime.now().format(TIMESTAMP_FMT);
        String password  = generatePassword(shortcode, passkey, timestamp);

        Map<String, Object> body = new HashMap<>();
        body.put("BusinessShortCode", shortcode);
        body.put("Password", password);
        body.put("Timestamp", timestamp);
        body.put("TransactionType", "CustomerPayBillOnline");
        body.put("Amount", request.getAmount().setScale(0, java.math.RoundingMode.HALF_UP).toPlainString());
        body.put("PartyA", normalisePhone(request.getPhoneNumber()));
        body.put("PartyB", shortcode);
        body.put("PhoneNumber", normalisePhone(request.getPhoneNumber()));
        // Use per-tenant callback URL if tenant has credentials; otherwise fall back to platform config
        String callbackUrl = (tenant != null && tenant.getCode() != null && !tenant.getCode().isBlank())
                ? config.getCallbackBaseUrl() + "/api/mpesa/callback/" + tenant.getCode()
                : config.getCallbackUrl();
        body.put("CallBackURL", callbackUrl);
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
            tx.setTenantId(tenant != null ? tenant.getId() : null);
            tx.setStatus(MpesaTransaction.TransactionStatus.PENDING);
            transactionRepo.save(tx);
            log.info("STK push initiated — checkoutRequestId={} tenant={}",
                    stkResponse.getCheckoutRequestId(), tenant != null ? tenant.getSlug() : "platform");
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

            // Reconcile with invoice if accountReference is "INV-{id}"
            reconcileInvoice(tx);

            // SMS confirmation to the paying phone number
            if (tx.getPhoneNumber() != null) {
                String amount = tx.getAmount() != null ? tx.getAmount().toPlainString() : "—";
                try {
                    smsService.sendSms("+" + tx.getPhoneNumber(),
                        SmsService.paymentConfirmedSmsBody(amount, tx.getMpesaReceiptNumber()));
                } catch (Exception e) {
                    log.warn("SMS confirmation failed for receipt {}: {}", tx.getMpesaReceiptNumber(), e.getMessage());
                }
            }
        } else {
            tx.setStatus(MpesaTransaction.TransactionStatus.FAILED);
            log.warn("Payment failed — resultCode={} desc={}", cb.getResultCode(), cb.getResultDesc());

            // SMS failure notice
            if (tx.getPhoneNumber() != null && tx.getAmount() != null) {
                try {
                    smsService.sendSms("+" + tx.getPhoneNumber(),
                        SmsService.paymentFailedSmsBody(tx.getAmount().toPlainString()));
                } catch (Exception e) {
                    log.warn("SMS failure notice failed: {}", e.getMessage());
                }
            }
        }

        transactionRepo.save(tx);
    }

    // ── C2B Register URL ──────────────────────────────────────────────────────

    /**
     * Registers the per-tenant confirmation and validation URLs on Safaricom Daraja.
     * Called automatically when a tenant saves their Daraja credentials in Settings.
     * Returns true on success, false on failure.
     */
    public boolean registerCallbackUrl(Tenant tenant, String appUrl) {
        try {
            String ck        = tenant.getMpesaConsumerKey();
            String cs        = tenant.getMpesaConsumerSecret();
            String shortcode = tenant.getMpesaShortcode();
            String token     = getAccessToken(ck, cs);

            String callbackUrl = appUrl + "/api/mpesa/callback/" + tenant.getCode();

            Map<String, Object> body = new HashMap<>();
            body.put("ShortCode", shortcode);
            body.put("ResponseType", "Completed");
            body.put("ConfirmationURL", callbackUrl);
            body.put("ValidationURL", callbackUrl);

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));

            String url = config.getBaseUrl() + "/mpesa/c2b/v1/registerurl";
            restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(body, headers), Map.class);

            log.info("Callback URL registered for tenant {} → {}", tenant.getCode(), callbackUrl);
            return true;
        } catch (Exception e) {
            log.error("Failed to register callback URL for tenant {}: {}", tenant.getCode(), e.getMessage());
            return false;
        }
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

    /** Returns transactions for a specific tenant — ADMIN view. */
    public List<MpesaTransaction> getTenantTransactions(Long tenantId) {
        return transactionRepo.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    /** Returns all transactions across all tenants — SUPER_ADMIN platform view. */
    public List<MpesaTransaction> getAllTransactions() {
        return transactionRepo.findAll();
    }

    // ── Invoice Reconciliation ────────────────────────────────────────────────

    private void reconcileInvoice(MpesaTransaction tx) {
        String ref = tx.getAccountReference();
        if (ref == null || !ref.startsWith("INV-")) return;
        try {
            Long invoiceId = Long.parseLong(ref.substring(4));
            Optional<Invoice> opt = invoiceRepository.findById(invoiceId);
            opt.ifPresent(inv -> {
                if (inv.getStatus() == Invoice.Status.UNPAID) {
                    inv.setStatus(Invoice.Status.PAID);
                    inv.setPaidAt(LocalDateTime.now());
                    invoiceRepository.save(inv);
                    log.info("Invoice #{} marked PAID via M-Pesa receipt {}",
                            invoiceId, tx.getMpesaReceiptNumber());
                }
            });
        } catch (NumberFormatException e) {
            log.warn("Could not parse invoice ID from accountReference: {}", ref);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Returns tenantValue if non-blank, otherwise globalValue. */
    private String resolve(String tenantValue, String globalValue) {
        return (tenantValue != null && !tenantValue.isBlank()) ? tenantValue : globalValue;
    }

    /** Base64(shortcode + passkey + timestamp) */
    private String generatePassword(String shortcode, String passkey, String timestamp) {
        String raw = shortcode + passkey + timestamp;
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
