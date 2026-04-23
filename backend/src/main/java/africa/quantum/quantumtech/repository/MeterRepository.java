package africa.quantum.quantumtech.repository;

import africa.quantum.quantumtech.model.Meter;
import africa.quantum.quantumtech.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MeterRepository extends JpaRepository<Meter, Long> {
    List<Meter> findByCustomer(User customer);
    List<Meter> findByCustomerId(Long customerId);
    boolean existsBySerialNumber(String serialNumber);
}
