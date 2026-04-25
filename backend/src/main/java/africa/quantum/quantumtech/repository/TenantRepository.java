package africa.quantum.quantumtech.repository;

import africa.quantum.quantumtech.model.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TenantRepository extends JpaRepository<Tenant, Long> {
    Optional<Tenant> findBySlug(String slug);
    boolean existsBySlug(String slug);
    Optional<Tenant> findByCode(String code);
    boolean existsByCode(String code);
}
