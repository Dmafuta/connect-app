package africa.quantum.quantumtech.repository;

import africa.quantum.quantumtech.model.Meter;
import africa.quantum.quantumtech.model.Tenant;
import africa.quantum.quantumtech.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

public interface MeterRepository extends JpaRepository<Meter, Long> {
    List<Meter> findAllByTenantId(Long tenantId);
    Page<Meter> findAllByTenantId(Long tenantId, Pageable pageable);
    Optional<Meter> findByIdAndTenantId(Long id, Long tenantId);
    List<Meter> findByCustomerAndTenantId(User customer, Long tenantId);
    List<Meter> findByTechnicianAndTenantId(User technician, Long tenantId);
    boolean existsBySerialNumberAndTenantId(String serialNumber, Long tenantId);

    @Modifying
    @Transactional
    @Query(value = "UPDATE meters SET deleted_at = NULL WHERE id = :id AND tenant_id = :tenantId", nativeQuery = true)
    int restoreById(@Param("id") Long id, @Param("tenantId") Long tenantId);

    long countByTenantId(Long tenantId);
    long countByTenantIdAndStatus(Long tenantId, Meter.Status status);
    long countByTenantIdAndType(Long tenantId, Meter.Type type);

    // Platform-wide (no tenant filter)
    long countByStatus(Meter.Status status);
    long countByType(Meter.Type type);

    // Legacy — kept for DataInitializer / internal use only
    List<Meter> findByCustomer(User customer);
    List<Meter> findByCustomerId(Long customerId);
    List<Meter> findByTechnician(User technician);
    boolean existsBySerialNumber(String serialNumber);
}
