package africa.quantum.quantumtech.repository;

import africa.quantum.quantumtech.model.MeterReading;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface MeterReadingRepository extends JpaRepository<MeterReading, Long> {
    List<MeterReading> findByMeterIdOrderByReadAtDesc(Long meterId);

    @Query("SELECT r FROM MeterReading r WHERE r.meter.customer.id = :customerId ORDER BY r.readAt DESC")
    List<MeterReading> findByCustomerId(@Param("customerId") Long customerId);
}
