package africa.quantum.quantumtech.service;

import africa.quantum.quantumtech.model.AuditLog;
import africa.quantum.quantumtech.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Records an audit event.
     *
     * @param tenantId   the tenant context for this event
     * @param request    HTTP request — used to extract caller IP
     * @param actorEmail email of the user who performed the action
     * @param actorRole  role of the user who performed the action
     * @param action     the action performed
     * @param entityType the type of entity affected (e.g. "Meter", "User")
     * @param entityId   the ID of the affected entity (as string)
     * @param detail     a short human-readable description
     */
    public void log(Long tenantId, HttpServletRequest request,
                    String actorEmail, String actorRole,
                    AuditLog.Action action,
                    String entityType, String entityId, String detail) {
        String ip = Optional.ofNullable(request.getHeader("X-Forwarded-For"))
                .map(h -> h.split(",")[0].trim())
                .orElse(request.getRemoteAddr());

        AuditLog entry = new AuditLog();
        entry.setTenantId(tenantId);
        entry.setActorEmail(actorEmail);
        entry.setActorRole(actorRole);
        entry.setAction(action);
        entry.setEntityType(entityType);
        entry.setEntityId(entityId);
        entry.setDetail(detail);
        entry.setIpAddress(ip);
        auditLogRepository.save(entry);
    }
}
