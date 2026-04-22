package africa.quantum.quantumtech.repository;

import africa.quantum.quantumtech.model.NotificationLog;
import africa.quantum.quantumtech.model.NotificationLog.Channel;
import africa.quantum.quantumtech.model.NotificationLog.Status;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface NotificationLogRepository extends JpaRepository<NotificationLog, Long> {

    /** All logs for a specific recipient (email or phone), newest first. */
    Page<NotificationLog> findByRecipientOrderByCreatedAtDesc(String recipient, Pageable pageable);

    /** All logs for a channel (EMAIL / SMS), newest first. */
    Page<NotificationLog> findByChannelOrderByCreatedAtDesc(Channel channel, Pageable pageable);

    /** All logs for a given status. */
    Page<NotificationLog> findByStatusOrderByCreatedAtDesc(Status status, Pageable pageable);

    /** Logs within a time window. */
    List<NotificationLog> findByCreatedAtBetweenOrderByCreatedAtDesc(Instant from, Instant to);

    /** Count sent vs failed per channel — useful for a statistics dashboard. */
    @Query("""
        SELECT n.channel, n.status, COUNT(n)
        FROM NotificationLog n
        WHERE n.createdAt >= :since
        GROUP BY n.channel, n.status
        """)
    List<Object[]> countByChannelAndStatusSince(@Param("since") Instant since);
}
