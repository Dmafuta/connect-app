package africa.quantum.quantumtech.repository;

import africa.quantum.quantumtech.model.Role;
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

public interface UserRepository extends JpaRepository<User, Long> {
    // Tenant-scoped lookups (preferred for all authenticated operations)
    Optional<User> findByEmailAndTenant(String email, Tenant tenant);
    boolean existsByEmailAndTenant(String email, Tenant tenant);
    Optional<User> findByUsernameAndTenant(String username, Tenant tenant);
    boolean existsByUsernameAndTenant(String username, Tenant tenant);
    List<User> findAllByTenant(Tenant tenant);
    Page<User> findAllByTenant(Tenant tenant, Pageable pageable);
    Page<User> findAllByTenantAndRoleNot(Tenant tenant, Role role, Pageable pageable);
    List<User> findAllByTenantAndRole(Tenant tenant, Role role);
    Page<User> findAllByTenantAndRole(Tenant tenant, Role role, Pageable pageable);

    long countByTenant(Tenant tenant);
    long countByTenantAndRole(Tenant tenant, Role role);
    long countByTenantAndActive(Tenant tenant, boolean active);

    // Non-scoped lookups — used by Spring Security and OTP flows (Phase 2 will scope these)
    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);
    boolean existsByEmail(String email);

    // Platform-level lookups for SUPER_ADMIN (tenant IS NULL)
    Optional<User> findByEmailAndTenantIsNull(String email);
    boolean existsByEmailAndTenantIsNull(String email);

    /** Migration helper: detaches an existing SUPER_ADMIN from any tenant (run on startup). */
    @Modifying
    @Transactional
    @Query(value = "UPDATE users SET tenant_id = NULL WHERE email = :email AND role = 'SUPER_ADMIN' AND tenant_id IS NOT NULL", nativeQuery = true)
    void detachSuperAdminFromTenant(@Param("email") String email);

    // Platform-wide counts (no tenant filter)
    long countByRole(africa.quantum.quantumtech.model.Role role);
    long countByActive(boolean active);

    @Query(value = "SELECT * FROM users WHERE tenant_id = :tenantId AND deleted_at IS NOT NULL ORDER BY deleted_at DESC", nativeQuery = true)
    List<User> findAllDeletedByTenantId(@Param("tenantId") Long tenantId);

    @Modifying
    @Transactional
    @Query(value = "UPDATE users SET deleted_at = NULL WHERE id = :id AND tenant_id = :tenantId", nativeQuery = true)
    int restoreById(@Param("id") Long id, @Param("tenantId") Long tenantId);
}
