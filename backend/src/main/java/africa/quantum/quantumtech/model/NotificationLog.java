package africa.quantum.quantumtech.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "notification_logs", indexes = {
    @Index(name = "idx_notif_recipient", columnList = "recipient"),
    @Index(name = "idx_notif_channel",   columnList = "channel"),
    @Index(name = "idx_notif_status",    columnList = "status"),
    @Index(name = "idx_notif_created",   columnList = "created_at")
})
public class NotificationLog {

    public enum Channel { EMAIL, SMS }
    public enum Status  { SENT, FAILED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** EMAIL or SMS */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Channel channel;

    /** Email address or phone number */
    @Column(nullable = false)
    private String recipient;

    /** Email subject line (null for SMS) */
    @Column(length = 255)
    private String subject;

    /** First 500 chars of the message body */
    @Column(length = 500)
    private String messagePreview;

    /** SENT or FAILED */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Status status;

    /** Africa's Talking messageId for SMS, or SMTP message-id for email */
    @Column(length = 255)
    private String providerMessageId;

    /** Delivery cost reported by AT (e.g. "KES 0.8000") — null for email */
    @Column(length = 50)
    private String cost;

    /** Error message when status = FAILED */
    @Column(length = 1000)
    private String errorMessage;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    // ── Getters & setters ─────────────────────────────────────────────────────

    public Long getId() { return id; }

    public Channel getChannel() { return channel; }
    public void setChannel(Channel channel) { this.channel = channel; }

    public String getRecipient() { return recipient; }
    public void setRecipient(String recipient) { this.recipient = recipient; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getMessagePreview() { return messagePreview; }
    public void setMessagePreview(String messagePreview) { this.messagePreview = messagePreview; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public String getProviderMessageId() { return providerMessageId; }
    public void setProviderMessageId(String providerMessageId) { this.providerMessageId = providerMessageId; }

    public String getCost() { return cost; }
    public void setCost(String cost) { this.cost = cost; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    // ── Builder-style factory methods ─────────────────────────────────────────

    public static NotificationLog sent(Channel channel, String recipient,
                                       String subject, String messagePreview,
                                       String providerMessageId, String cost) {
        NotificationLog log = new NotificationLog();
        log.channel           = channel;
        log.recipient         = recipient;
        log.subject           = subject;
        log.messagePreview    = preview(messagePreview);
        log.status            = Status.SENT;
        log.providerMessageId = providerMessageId;
        log.cost              = cost;
        log.createdAt         = Instant.now();
        return log;
    }

    public static NotificationLog failed(Channel channel, String recipient,
                                         String subject, String messagePreview,
                                         String errorMessage) {
        NotificationLog log = new NotificationLog();
        log.channel        = channel;
        log.recipient      = recipient;
        log.subject        = subject;
        log.messagePreview = preview(messagePreview);
        log.status         = Status.FAILED;
        log.errorMessage   = errorMessage != null && errorMessage.length() > 1000
                             ? errorMessage.substring(0, 1000) : errorMessage;
        log.createdAt      = Instant.now();
        return log;
    }

    private static String preview(String text) {
        if (text == null) return null;
        // Strip HTML tags for cleaner preview storage
        String plain = text.replaceAll("<[^>]*>", "").replaceAll("\\s+", " ").trim();
        return plain.length() > 500 ? plain.substring(0, 500) : plain;
    }
}
