package africa.quantum.quantumtech.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "otp_records", indexes = {
    @Index(name = "idx_otp_email", columnList = "email"),
    @Index(name = "idx_otp_code",  columnList = "email, code, used")
})
public class OtpRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false, length = 10)
    private String code;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant expiresAt;

    /** True once the OTP has been successfully verified. */
    @Column(nullable = false)
    private boolean used = false;

    /** Optional: tag what this OTP is for (e.g. "LOGIN", "PASSWORD_RESET", "VERIFY_EMAIL"). */
    @Column(length = 50)
    private String purpose;

    // ── Getters & setters ─────────────────────────────────────────────────────

    public Long getId() { return id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }

    public boolean isUsed() { return used; }
    public void setUsed(boolean used) { this.used = used; }

    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }
}
