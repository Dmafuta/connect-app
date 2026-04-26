package africa.quantum.quantumtech.repository;

import africa.quantum.quantumtech.model.Invoice;
import africa.quantum.quantumtech.model.Meter;
import africa.quantum.quantumtech.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Page<Invoice> findByTenantIdOrderByIssuedAtDesc(Long tenantId, Pageable pageable);

    Page<Invoice> findByTenantIdAndStatusOrderByIssuedAtDesc(Long tenantId, Invoice.Status status, Pageable pageable);

    Page<Invoice> findByCustomerAndTenantIdOrderByIssuedAtDesc(User customer, Long tenantId, Pageable pageable);

    List<Invoice> findByMeterOrderByIssuedAtDesc(Meter meter);

    Optional<Invoice> findByReadingId(Long readingId);

    List<Invoice> findByTenantIdAndIssuedAtAfter(Long tenantId, java.time.LocalDate date);

    List<Invoice> findByTenantIdAndStatus(Long tenantId, Invoice.Status status);

    List<Invoice> findByTenantIdAndStatusAndDueAtBefore(Long tenantId, Invoice.Status status, java.time.LocalDate date);

    long countByTenantIdAndStatus(Long tenantId, Invoice.Status status);

    @Query("SELECT COALESCE(SUM(i.amount), 0) FROM Invoice i WHERE i.tenant.id = :tenantId AND i.status = 'UNPAID'")
    BigDecimal sumUnpaidByTenantId(@Param("tenantId") Long tenantId);

    @Query("SELECT COALESCE(SUM(i.amount), 0) FROM Invoice i WHERE i.tenant.id = :tenantId AND i.status = 'PAID'")
    BigDecimal sumPaidByTenantId(@Param("tenantId") Long tenantId);
}
