package africa.quantum.quantumtech.notification;

import africa.quantum.quantumtech.model.NotificationLog;
import africa.quantum.quantumtech.repository.NotificationLogRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

/**
 * Africa's Talking SMS service.
 * Uses the AT REST API directly — no additional SDK needed.
 * Docs: https://developers.africastalking.com/docs/sms/sending
 */
@Service
public class SmsService {

    private static final Logger log = LoggerFactory.getLogger(SmsService.class);

    private static final String PRODUCTION_URL = "https://api.africastalking.com/version1/messaging";
    private static final String SANDBOX_URL    = "https://api.sandbox.africastalking.com/version1/messaging";

    private final RestTemplate               restTemplate;
    private final NotificationLogRepository  notificationLogRepository;
    private final ObjectMapper               objectMapper;

    @Value("${at.username}")
    private String username;

    @Value("${at.api-key}")
    private String apiKey;

    @Value("${at.sender-id}")
    private String senderId;

    @Value("${at.environment}")
    private String environment;

    public SmsService(RestTemplate restTemplate,
                      NotificationLogRepository notificationLogRepository,
                      ObjectMapper objectMapper) {
        this.restTemplate              = restTemplate;
        this.notificationLogRepository = notificationLogRepository;
        this.objectMapper              = objectMapper;
    }

    /**
     * Sends an SMS asynchronously via Africa's Talking and logs the result.
     *
     * @param to      recipient phone number in E.164 format (e.g. +254712345678)
     * @param message SMS body (keep under 160 chars for a single SMS)
     */
    @Async
    public void sendSms(String to, String message) {
        String url = "production".equalsIgnoreCase(environment) ? PRODUCTION_URL : SANDBOX_URL;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.set("apiKey", apiKey);
        headers.set("Accept", "application/json");

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("username", username);
        body.add("to", to);
        body.add("message", message);
        body.add("from", senderId);

        HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(body, headers);

        try {
            String rawResponse = restTemplate.postForObject(url, entity, String.class);
            log.info("SMS sent to {} via Africa's Talking [{}]: {}", to, environment, rawResponse);

            // Parse AT response to extract messageId and cost for logging
            String messageId = null;
            String cost      = null;
            try {
                JsonNode root       = objectMapper.readTree(rawResponse);
                JsonNode recipients = root.path("SMSMessageData").path("Recipients");
                if (recipients.isArray() && !recipients.isEmpty()) {
                    JsonNode first = recipients.get(0);
                    messageId = first.path("messageId").asText(null);
                    cost      = first.path("cost").asText(null);
                }
            } catch (Exception parseEx) {
                log.warn("Could not parse AT response for logging: {}", parseEx.getMessage());
            }

            notificationLogRepository.save(
                NotificationLog.sent(NotificationLog.Channel.SMS, to, null, message, messageId, cost)
            );

        } catch (Exception e) {
            log.error("Failed to send SMS to {} via Africa's Talking: {}", to, e.getMessage());
            notificationLogRepository.save(
                NotificationLog.failed(NotificationLog.Channel.SMS, to, null, message, e.getMessage())
            );
            throw new RuntimeException("SMS delivery failed: " + e.getMessage(), e);
        }
    }

    // ── SMS message templates ─────────────────────────────────────────────────

    public static String otpSmsBody(String otp, int expiryMinutes) {
        return "QuantumConnect: Your verification code is " + otp +
               ". Valid for " + expiryMinutes + " minutes. Do not share this code.";
    }

    public static String welcomeSmsBody() {
        return "Welcome to QuantumConnect! Your smart metering account is ready. " +
               "Sign in at quantumconnect.africa";
    }
}
