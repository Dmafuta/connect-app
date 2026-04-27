package africa.quantum.quantumtech.config;

import africa.quantum.quantumtech.model.Role;
import africa.quantum.quantumtech.model.Tenant;
import africa.quantum.quantumtech.model.User;
import africa.quantum.quantumtech.repository.TenantRepository;
import africa.quantum.quantumtech.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.concurrent.ThreadLocalRandom;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           TenantRepository tenantRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository   = userRepository;
        this.tenantRepository = tenantRepository;
        this.passwordEncoder  = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // SUPER_ADMIN is a platform-level account — no tenant
        seedSuperAdmin("dennis@quantumconnect.africa", "Admin@123", "Dennis", "Mafuta");

        // Demo tenant with tenant-scoped users
        Tenant defaultTenant = seedTenant("QuantumConnect", "quantumconnect");
        seed("admin@quantum.local",      "Admin@123",    "Admin",    "User",     Role.ADMIN,       defaultTenant, "admin");
        seed("tech@quantum.local",       "Tech@123",     "Tech",     "User",     Role.TECHNICIAN,  defaultTenant, "tech.user");
        seed("customer@quantum.local",   "Customer@123", "Customer", "User",     Role.CUSTOMER,    defaultTenant, "customer.user");
        // Backfill usernames for any existing users that were seeded before the username feature
        backfillUsernames(defaultTenant);
    }

    private void seedSuperAdmin(String email, String password, String firstName, String lastName) {
        // Migrate: if SUPER_ADMIN was previously seeded with a tenant, detach to platform-level
        userRepository.detachSuperAdminFromTenant(email);
        if (userRepository.existsByEmailAndTenantIsNull(email)) return;
        User u = new User();
        u.setEmail(email);
        u.setPassword(passwordEncoder.encode(password));
        u.setFirstName(firstName);
        u.setLastName(lastName);
        u.setRole(Role.SUPER_ADMIN);
        u.setEmailVerified(true);
        u.setPhoneVerified(true);
        u.setTenant(null);
        userRepository.save(u);
        System.out.printf("[DataInitializer] Created SUPER_ADMIN (%s) — platform-level (no tenant)%n", email);
    }

    private Tenant seedTenant(String name, String slug) {
        return tenantRepository.findBySlug(slug).orElseGet(() -> {
            Tenant t = new Tenant();
            t.setName(name);
            t.setSlug(slug);
            t.setCode(generateUniqueCode());
            Tenant saved = tenantRepository.save(t);
            System.out.printf("[DataInitializer] Created tenant '%s' (slug: %s, code: %s)%n", name, slug, saved.getCode());
            return saved;
        });
    }

    private String generateUniqueCode() {
        String code;
        do {
            code = String.valueOf(ThreadLocalRandom.current().nextInt(100001, 1000000));
        } while (tenantRepository.existsByCode(code));
        return code;
    }

    private void seed(String email, String password, String firstName, String lastName, Role role, Tenant tenant, String username) {
        if (userRepository.existsByEmailAndTenant(email, tenant)) return;
        User u = new User();
        u.setEmail(email);
        u.setUsername(username);
        u.setPassword(passwordEncoder.encode(password));
        u.setFirstName(firstName);
        u.setLastName(lastName);
        u.setRole(role);
        u.setEmailVerified(true);
        u.setPhoneVerified(true);
        u.setTenant(tenant);
        userRepository.save(u);
        System.out.printf("[DataInitializer] Created %s (%s) in tenant '%s'%n", email, role, tenant.getSlug());
    }

    /** Assign usernames to existing users that pre-date the username feature. */
    private void backfillUsernames(Tenant tenant) {
        userRepository.findAllByTenant(tenant).forEach(u -> {
            if (u.getUsername() != null && !u.getUsername().isBlank()) return;
            // Derive a base username from email local-part, sanitized
            String base = u.getEmail().split("@")[0].replaceAll("[^a-zA-Z0-9._-]", ".").toLowerCase();
            if (base.length() < 3) base = base + "_usr";
            if (base.length() > 30) base = base.substring(0, 30);
            String candidate = base;
            int suffix = 2;
            while (userRepository.existsByUsernameAndTenant(candidate, tenant)) {
                candidate = base.substring(0, Math.min(base.length(), 27)) + suffix;
                suffix++;
            }
            u.setUsername(candidate);
            userRepository.save(u);
            System.out.printf("[DataInitializer] Backfilled username '%s' for %s%n", candidate, u.getEmail());
        });
    }
}
