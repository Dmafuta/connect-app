package africa.quantum.quantumtech.repository;

import africa.quantum.quantumtech.model.MeterReading;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface MeterReadingRepository extends JpaRepository<MeterReading, Long> {
    List<MeterReading> findByMeterTenantIdOrderByReadAtDesc(Long tenantId);
    Page<MeterReading> findByMeterTenantIdOrderByReadAtDesc(Long tenantId, Pageable pageable);

    List<MeterReading> findByMeterIdAndMeterTenantIdOrderByReadAtDesc(Long meterId, Long tenantId);

    @Query("SELECT r FROM MeterReading r WHERE r.meter.customer.id = :customerId AND r.meter.tenant.id = :tenantId ORDER BY r.readAt DESC")
    List<MeterReading> findByCustomerIdAndTenantId(@Param("customerId") Long customerId, @Param("tenantId") Long tenantId);

    Optional<MeterReading> findFirstByMeterIdAndMeterTenantIdOrderByReadAtDesc(Long meterId, Long tenantId);

    // Legacy — unscoped, kept for internal/migration use only
    List<MeterReading> findByMeterIdOrderByReadAtDesc(Long meterId);

    @Query("SELECT r FROM MeterReading r WHERE r.meter.customer.id = :customerId ORDER BY r.readAt DESC")
    List<MeterReading> findByCustomerId(@Param("customerId") Long customerId);

    // Reports: all readings in a date range, ordered by meter + time
    List<MeterReading> findByMeterTenantIdAndReadAtBetweenOrderByMeterIdAscReadAtAsc(
            Long tenantId, LocalDateTime from, LocalDateTime to);
}
