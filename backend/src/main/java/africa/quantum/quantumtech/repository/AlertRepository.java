package africa.quantum.quantumtech.repository;

import africa.quantum.quantumtech.model.Alert;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AlertRepository extends JpaRepository<Alert, Long> {
    List<Alert>  findByMeterTenantIdAndResolvedFalseOrderByCreatedAtDesc(Long tenantId);
    Page<Alert>  findByMeterTenantIdAndResolvedFalseOrderByCreatedAtDesc(Long tenantId, Pageable pageable);
    Page<Alert>  findByMeterTenantIdAndResolvedTrueOrderByCreatedAtDesc(Long tenantId, Pageable pageable);
    Page<Alert>  findByMeterTenantIdOrderByCreatedAtDesc(Long tenantId, Pageable pageable);
    List<Alert>  findByMeterIdAndMeterTenantIdOrderByCreatedAtDesc(Long meterId, Long tenantId);
    Optional<Alert> findByIdAndMeterTenantId(Long id, Long tenantId);
    long         countByMeterTenantIdAndResolvedFalse(Long tenantId);
    long         countByMeterTenantIdAndResolvedTrue(Long tenantId);

    // Legacy — unscoped
    List<Alert> findByResolvedFalseOrderByCreatedAtDesc();
    List<Alert> findByMeterIdOrderByCreatedAtDesc(Long meterId);
    long countByResolvedFalse();
    long countByResolvedTrue();
}
