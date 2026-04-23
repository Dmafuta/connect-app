package africa.quantum.quantumtech.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "meter_readings")
public class MeterReading {

    public enum ReadingType { AUTOMATIC, MANUAL }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meter_id", nullable = false)
    private Meter meter;

    @Column(nullable = false)
    private Double value;

    private String unit; // kWh, m3, etc.

    @Enumerated(EnumType.STRING)
    private ReadingType readingType = ReadingType.AUTOMATIC;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recorded_by")
    private User recordedBy;

    private LocalDateTime readAt = LocalDateTime.now();

    // ── Getters & Setters ──────────────────────────────────────────────────────

    public Long getId() { return id; }
    public Meter getMeter() { return meter; }
    public void setMeter(Meter meter) { this.meter = meter; }
    public Double getValue() { return value; }
    public void setValue(Double value) { this.value = value; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public ReadingType getReadingType() { return readingType; }
    public void setReadingType(ReadingType readingType) { this.readingType = readingType; }
    public User getRecordedBy() { return recordedBy; }
    public void setRecordedBy(User recordedBy) { this.recordedBy = recordedBy; }
    public LocalDateTime getReadAt() { return readAt; }
    public void setReadAt(LocalDateTime readAt) { this.readAt = readAt; }
}
