package africa.quantum.quantumtech.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "quantum_inventory")
public class InventoryMeter {

    public enum Status { AVAILABLE, ALLOCATED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String serialNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Meter.Type type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Meter.Mode mode = Meter.Mode.SMART;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.AVAILABLE;

    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id")
    private Tenant allocatedTo;

    private LocalDateTime addedAt = LocalDateTime.now();
    private LocalDateTime allocatedAt;

    // ── Getters & Setters ──────────────────────────────────────────────────────

    public Long getId() { return id; }

    public String getSerialNumber() { return serialNumber; }
    public void setSerialNumber(String serialNumber) { this.serialNumber = serialNumber; }

    public Meter.Type getType() { return type; }
    public void setType(Meter.Type type) { this.type = type; }

    public Meter.Mode getMode() { return mode; }
    public void setMode(Meter.Mode mode) { this.mode = mode; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public Tenant getAllocatedTo() { return allocatedTo; }
    public void setAllocatedTo(Tenant allocatedTo) { this.allocatedTo = allocatedTo; }

    public LocalDateTime getAddedAt() { return addedAt; }
    public LocalDateTime getAllocatedAt() { return allocatedAt; }
    public void setAllocatedAt(LocalDateTime allocatedAt) { this.allocatedAt = allocatedAt; }
}
