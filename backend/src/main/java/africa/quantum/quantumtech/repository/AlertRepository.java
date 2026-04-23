package africa.quantum.quantumtech.repository;

import africa.quantum.quantumtech.model.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AlertRepository extends JpaRepository<Alert, Long> {
    List<Alert> findByResolvedFalseOrderByCreatedAtDesc();
    List<Alert> findByMeterIdOrderByCreatedAtDesc(Long meterId);
    long countByResolvedFalse();
}
