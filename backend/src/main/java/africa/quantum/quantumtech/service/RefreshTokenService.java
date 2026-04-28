package africa.quantum.quantumtech.service;

import africa.quantum.quantumtech.model.RefreshToken;
import africa.quantum.quantumtech.model.User;
import africa.quantum.quantumtech.repository.RefreshTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

@Service
public class RefreshTokenService {

    @Value("${jwt.refresh-expiry-days:7}")
    private int refreshExpiryDays;

    private final RefreshTokenRepository repo;

    public RefreshTokenService(RefreshTokenRepository repo) {
        this.repo = repo;
    }

    public record RotationResult(String email, String role, Long tenantId, String newRefreshToken) {}

    @Transactional
    public RefreshToken create(User user) {
        RefreshToken rt = new RefreshToken();
        rt.setToken(UUID.randomUUID().toString());
        rt.setUser(user);
        rt.setExpiresAt(Instant.now().plus(refreshExpiryDays, ChronoUnit.DAYS));
        return repo.save(rt);
    }

    /**
     * Validates the refresh token, rotates it (revoke old, create new), and returns
     * the user details needed to issue a new access token — all within a single transaction
     * to avoid LazyInitializationException with open-in-view=false.
     */
    @Transactional
    public Optional<RotationResult> validateAndRotate(String tokenValue) {
        return repo.findByToken(tokenValue)
                .filter(rt -> !rt.isRevoked() && rt.getExpiresAt().isAfter(Instant.now()))
                .map(rt -> {
                    User user = rt.getUser();                            // safe — session open
                    Long tenantId = user.getTenant() != null ? user.getTenant().getId() : null;
                    String email = user.getEmail();
                    String role  = user.getRole().name();
                    rt.setRevoked(true);
                    repo.save(rt);
                    RefreshToken newRt = create(user);
                    return new RotationResult(email, role, tenantId, newRt.getToken());
                });
    }

    @Transactional
    public void revoke(String token) {
        repo.findByToken(token).ifPresent(rt -> {
            rt.setRevoked(true);
            repo.save(rt);
        });
    }

    public void revokeAllForUser(User user) {
        repo.deleteByUser(user);
    }
}
