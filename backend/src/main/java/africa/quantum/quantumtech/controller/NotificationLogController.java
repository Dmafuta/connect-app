package africa.quantum.quantumtech.controller;

import africa.quantum.quantumtech.model.NotificationLog;
import africa.quantum.quantumtech.model.NotificationLog.Channel;
import africa.quantum.quantumtech.model.NotificationLog.Status;
import africa.quantum.quantumtech.repository.NotificationLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

/**
 * Read-only API for querying the notification audit log.
 * All endpoints require a valid JWT.
 *
 * GET /api/logs/notifications              → all logs (paginated)
 * GET /api/logs/notifications/recipient/{target} → logs for a specific email/phone
 * GET /api/logs/notifications/channel/{channel}  → EMAIL or SMS logs
 * GET /api/logs/notifications/failed       → failed deliveries
 * GET /api/logs/notifications/stats        → sent vs failed counts per channel (last 30 days)
 */
@RestController
@RequestMapping("/api/logs/notifications")
public class NotificationLogController {

    private final NotificationLogRepository repo;

    public NotificationLogController(NotificationLogRepository repo) {
        this.repo = repo;
    }

    /** All logs, newest first — paginated. */
    @GetMapping
    public Page<NotificationLog> all(
        @RequestParam(defaultValue = "0")  int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        return repo.findAll(pageable);
    }

    /** Logs for a specific recipient (email address or phone number). */
    @GetMapping("/recipient/{target}")
    public Page<NotificationLog> byRecipient(
        @PathVariable String target,
        @RequestParam(defaultValue = "0")  int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return repo.findByRecipientOrderByCreatedAtDesc(target, PageRequest.of(page, size));
    }

    /** Logs filtered by channel: EMAIL or SMS. */
    @GetMapping("/channel/{channel}")
    public ResponseEntity<?> byChannel(
        @PathVariable String channel,
        @RequestParam(defaultValue = "0")  int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        try {
            Channel ch = Channel.valueOf(channel.toUpperCase());
            return ResponseEntity.ok(
                repo.findByChannelOrderByCreatedAtDesc(ch, PageRequest.of(page, size))
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid channel. Use EMAIL or SMS"));
        }
    }

    /** All failed deliveries. */
    @GetMapping("/failed")
    public Page<NotificationLog> failed(
        @RequestParam(defaultValue = "0")  int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return repo.findByStatusOrderByCreatedAtDesc(Status.FAILED, PageRequest.of(page, size));
    }

    /** Stats: sent vs failed per channel for the last N days (default 30). */
    @GetMapping("/stats")
    public ResponseEntity<List<Map<String, Object>>> stats(
        @RequestParam(defaultValue = "30") int days
    ) {
        Instant since = Instant.now().minus(days, ChronoUnit.DAYS);
        List<Object[]> raw = repo.countByChannelAndStatusSince(since);
        List<Map<String, Object>> result = raw.stream()
            .map(r -> Map.<String, Object>of(
                "channel", r[0].toString(),
                "status",  r[1].toString(),
                "count",   r[2]
            ))
            .toList();
        return ResponseEntity.ok(result);
    }
}
