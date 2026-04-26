package africa.quantum.quantumtech.repository;

import africa.quantum.quantumtech.model.InventoryMeter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InventoryMeterRepository extends JpaRepository<InventoryMeter, Long> {

    boolean existsBySerialNumber(String serialNumber);

    Page<InventoryMeter> findAllByOrderByIdDesc(Pageable pageable);

    Page<InventoryMeter> findByStatusOrderByIdDesc(InventoryMeter.Status status, Pageable pageable);

    Optional<InventoryMeter> findBySerialNumber(String serialNumber);
}
