package africa.quantum.quantumtech.controller;

import africa.quantum.quantumtech.model.AuditLog;
import africa.quantum.quantumtech.repository.AuditLogRepository;
import africa.quantum.quantumtech.security.TenantContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/audit")
@PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
public class AuditController {

    private final AuditLogRepository auditLogRepository;

    public AuditController(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @GetMapping
    public Page<AuditLog> logs(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "50") int size) {
        return auditLogRepository.findByTenantIdOrderByCreatedAtDesc(
                TenantContext.get(), PageRequest.of(page, size));
    }
}
