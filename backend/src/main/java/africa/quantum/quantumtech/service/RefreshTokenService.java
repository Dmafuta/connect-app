package africa.quantum.quantumtech.service;

import africa.quantum.quantumtech.model.RefreshToken;
import africa.quantum.quantumtech.model.User;
import africa.quantum.quantumtech.repository.RefreshTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

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

    public RefreshToken create(User user) {
        RefreshToken rt = new RefreshToken();
        rt.setToken(UUID.randomUUID().toString());
        rt.setUser(user);
        rt.setExpiresAt(Instant.now().plus(refreshExpiryDays, ChronoUnit.DAYS));
        return repo.save(rt);
    }

    public Optional<RefreshToken> validate(String token) {
        return repo.findByToken(token)
                .filter(rt -> !rt.isRevoked() && rt.getExpiresAt().isAfter(Instant.now()));
    }

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
