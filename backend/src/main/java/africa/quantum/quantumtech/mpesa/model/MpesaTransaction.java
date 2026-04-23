package africa.quantum.quantumtech.mpesa.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "mpesa_transactions")
public class MpesaTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String merchantRequestId;

    @Column(unique = true)
    private String checkoutRequestId;

    private String phoneNumber;

    @Column(precision = 12, scale = 2)
    private BigDecimal amount;

    private String accountReference;
    private String description;

    @Enumerated(EnumType.STRING)
    private TransactionStatus status = TransactionStatus.PENDING;

    private String resultCode;
    private String resultDesc;
    private String mpesaReceiptNumber;
    private String transactionDate;

    /** Optional: link to the platform user who initiated the payment */
    private Long userId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum TransactionStatus {
        PENDING, SUCCESS, FAILED, CANCELLED
    }

    // ── Getters & Setters ──────────────────────────────────────────────────────

    public Long getId()                          { return id; }
    public String getMerchantRequestId()         { return merchantRequestId; }
    public String getCheckoutRequestId()         { return checkoutRequestId; }
    public String getPhoneNumber()               { return phoneNumber; }
    public BigDecimal getAmount()                { return amount; }
    public String getAccountReference()          { return accountReference; }
    public String getDescription()               { return description; }
    public TransactionStatus getStatus()         { return status; }
    public String getResultCode()                { return resultCode; }
    public String getResultDesc()                { return resultDesc; }
    public String getMpesaReceiptNumber()        { return mpesaReceiptNumber; }
    public String getTransactionDate()           { return transactionDate; }
    public Long getUserId()                      { return userId; }
    public LocalDateTime getCreatedAt()          { return createdAt; }
    public LocalDateTime getUpdatedAt()          { return updatedAt; }

    public void setMerchantRequestId(String v)   { this.merchantRequestId = v; }
    public void setCheckoutRequestId(String v)   { this.checkoutRequestId = v; }
    public void setPhoneNumber(String v)         { this.phoneNumber = v; }
    public void setAmount(BigDecimal v)          { this.amount = v; }
    public void setAccountReference(String v)    { this.accountReference = v; }
    public void setDescription(String v)         { this.description = v; }
    public void setStatus(TransactionStatus v)   { this.status = v; }
    public void setResultCode(String v)          { this.resultCode = v; }
    public void setResultDesc(String v)          { this.resultDesc = v; }
    public void setMpesaReceiptNumber(String v)  { this.mpesaReceiptNumber = v; }
    public void setTransactionDate(String v)     { this.transactionDate = v; }
    public void setUserId(Long v)                { this.userId = v; }
}
