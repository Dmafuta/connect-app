package africa.quantum.quantumtech.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_tenant_created", columnList = "tenant_id, created_at DESC"),
    @Index(name = "idx_audit_actor",          columnList = "actor_email")
})
public class AuditLog {

    public enum Action {
        // User actions
        USER_CREATED, USER_UPDATED, USER_ACTIVATED, USER_DEACTIVATED, USER_DELETED, USER_RESTORED,
        // Meter actions
        METER_CREATED, METER_UPDATED, METER_DELETED,
        // Reading actions
        READING_LOGGED,
        // Alert actions
        ALERT_CREATED, ALERT_RESOLVED,
        // Tenant actions
        TENANT_CREATED, TENANT_UPDATED,
        // Auth actions
        PASSWORD_CHANGED, PASSWORD_RESET_REQUESTED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = true)
    private Long tenantId;

    @Column(name = "actor_email", nullable = false)
    private String actorEmail;

    @Column(name = "actor_role")
    private String actorRole;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Action action;

    @Column(name = "entity_type")
    private String entityType;

    @Column(name = "entity_id")
    private String entityId;

    @Column(length = 500)
    private String detail;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // ── Getters & Setters ──────────────────────────────────────────────────────

    public Long getId()                   { return id; }
    public Long getTenantId()             { return tenantId; }
    public void setTenantId(Long v)       { this.tenantId = v; }
    public String getActorEmail()         { return actorEmail; }
    public void setActorEmail(String v)   { this.actorEmail = v; }
    public String getActorRole()          { return actorRole; }
    public void setActorRole(String v)    { this.actorRole = v; }
    public Action getAction()             { return action; }
    public void setAction(Action v)       { this.action = v; }
    public String getEntityType()         { return entityType; }
    public void setEntityType(String v)   { this.entityType = v; }
    public String getEntityId()           { return entityId; }
    public void setEntityId(String v)     { this.entityId = v; }
    public String getDetail()             { return detail; }
    public void setDetail(String v)       { this.detail = v; }
    public String getIpAddress()          { return ipAddress; }
    public void setIpAddress(String v)    { this.ipAddress = v; }
    public LocalDateTime getCreatedAt()   { return createdAt; }
}
