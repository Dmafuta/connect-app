package africa.quantum.quantumtech.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "tenants")
public class Tenant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    /** URL-safe identifier used internally */
    @Column(unique = true, nullable = false)
    private String slug;

    /** 6-digit numeric code (100001–999999) used by users at login */
    @Column(unique = true, nullable = false)
    private String code;

    @Column(nullable = false)
    private boolean active = true;

    private String contactEmail;
    private String contactPhone;

    // ── M-Pesa per-tenant Daraja credentials ─────────────────────────────────
    // Leave null to fall back to the platform-level credentials in application.properties
    @Column(name = "mpesa_shortcode")
    private String mpesaShortcode;

    @Column(name = "mpesa_consumer_key")
    private String mpesaConsumerKey;

    @Column(name = "mpesa_consumer_secret")
    private String mpesaConsumerSecret;

    @Column(name = "mpesa_passkey")
    private String mpesaPasskey;

    // ── M-Pesa Daraja registration status ────────────────────────────────────
    @Column(name = "mpesa_registered")
    private boolean mpesaRegistered = false;

    @Column(name = "mpesa_registered_at")
    private LocalDateTime mpesaRegisteredAt;

    // ── Billing: unit prices per meter type ───────────────────────────────────
    @Column(name = "water_unit_price", precision = 10, scale = 4)
    private BigDecimal waterUnitPrice = BigDecimal.ZERO;

    @Column(name = "electricity_unit_price", precision = 10, scale = 4)
    private BigDecimal electricityUnitPrice = BigDecimal.ZERO;

    @Column(name = "gas_unit_price", precision = 10, scale = 4)
    private BigDecimal gasUnitPrice = BigDecimal.ZERO;

    private LocalDateTime createdAt = LocalDateTime.now();

    // ── Getters & Setters ──────────────────────────────────────────────────────

    public Long getId() { return id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }

    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }

    public String getMpesaShortcode()                        { return mpesaShortcode; }
    public void setMpesaShortcode(String mpesaShortcode)     { this.mpesaShortcode = mpesaShortcode; }

    public String getMpesaConsumerKey()                      { return mpesaConsumerKey; }
    public void setMpesaConsumerKey(String v)                { this.mpesaConsumerKey = v; }

    public String getMpesaConsumerSecret()                   { return mpesaConsumerSecret; }
    public void setMpesaConsumerSecret(String v)             { this.mpesaConsumerSecret = v; }

    public String getMpesaPasskey()                          { return mpesaPasskey; }
    public void setMpesaPasskey(String v)                    { this.mpesaPasskey = v; }

    /** Returns true if this tenant has their own Daraja credentials configured. */
    public boolean hasMpesaCredentials() {
        return mpesaShortcode != null && !mpesaShortcode.isBlank()
            && mpesaConsumerKey != null && !mpesaConsumerKey.isBlank()
            && mpesaConsumerSecret != null && !mpesaConsumerSecret.isBlank()
            && mpesaPasskey != null && !mpesaPasskey.isBlank();
    }

    public boolean isMpesaRegistered()                               { return mpesaRegistered; }
    public void setMpesaRegistered(boolean mpesaRegistered)          { this.mpesaRegistered = mpesaRegistered; }

    public LocalDateTime getMpesaRegisteredAt()                      { return mpesaRegisteredAt; }
    public void setMpesaRegisteredAt(LocalDateTime mpesaRegisteredAt){ this.mpesaRegisteredAt = mpesaRegisteredAt; }

    public BigDecimal getWaterUnitPrice()                          { return waterUnitPrice; }
    public void setWaterUnitPrice(BigDecimal waterUnitPrice)       { this.waterUnitPrice = waterUnitPrice; }

    public BigDecimal getElectricityUnitPrice()                    { return electricityUnitPrice; }
    public void setElectricityUnitPrice(BigDecimal v)              { this.electricityUnitPrice = v; }

    public BigDecimal getGasUnitPrice()                            { return gasUnitPrice; }
    public void setGasUnitPrice(BigDecimal gasUnitPrice)           { this.gasUnitPrice = gasUnitPrice; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
