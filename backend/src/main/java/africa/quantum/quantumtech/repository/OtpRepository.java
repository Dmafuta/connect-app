package africa.quantum.quantumtech.repository;

import africa.quantum.quantumtech.model.OtpRecord;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface OtpRepository extends JpaRepository<OtpRecord, Long> {

    /**
     * Find the latest unused, non-expired OTP for a given email + purpose.
     * Uses Pageable(limit=1) instead of LIMIT in JPQL for portability.
     */
    @Query("""
        SELECT o FROM OtpRecord o
        WHERE o.email = :email
          AND o.purpose = :purpose
          AND o.code = :code
          AND o.used = false
          AND o.expiresAt > :now
        ORDER BY o.createdAt DESC
        """)
    List<OtpRecord> findValid(
        @Param("email")   String email,
        @Param("purpose") String purpose,
        @Param("code")    String code,
        @Param("now")     Instant now,
        Pageable pageable
    );

    default Optional<OtpRecord> findValid(String email, String purpose, String code, Instant now) {
        List<OtpRecord> results = findValid(email, purpose, code, now, Pageable.ofSize(1));
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    /** Invalidate all previous unused OTPs for the same email + purpose
     *  before issuing a new one (prevents replay with stale codes). */
    @Modifying
    @Query("""
        UPDATE OtpRecord o
        SET o.used = true
        WHERE o.email = :email
          AND o.purpose = :purpose
          AND o.used = false
        """)
    void invalidatePrevious(
        @Param("email")   String email,
        @Param("purpose") String purpose
    );

    /** Clean up expired / used records older than a given time. */
    @Modifying
    @Query("DELETE FROM OtpRecord o WHERE o.expiresAt < :before OR o.used = true")
    void deleteExpiredBefore(@Param("before") Instant before);

    /** Count how many OTPs were issued to a target since a given time (rate limiting). */
    @Query("""
        SELECT COUNT(o) FROM OtpRecord o
        WHERE o.email = :target
          AND o.createdAt >= :since
        """)
    long countByTargetSince(@Param("target") String target, @Param("since") Instant since);
}
