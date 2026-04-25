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
        Tenant defaultTenant = seedTenant("QuantumConnect", "quantumconnect");

        seed("superadmin@quantum.local", "Admin@123",    "Super",    "Admin",    Role.SUPER_ADMIN, defaultTenant);
        seed("admin@quantum.local",      "Admin@123",    "Admin",    "User",     Role.ADMIN,       defaultTenant);
        seed("tech@quantum.local",       "Tech@123",     "Tech",     "User",     Role.TECHNICIAN,  defaultTenant);
        seed("customer@quantum.local",   "Customer@123", "Customer", "User",     Role.CUSTOMER,    defaultTenant);
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

    private void seed(String email, String password, String firstName, String lastName, Role role, Tenant tenant) {
        if (userRepository.existsByEmailAndTenant(email, tenant)) return;
        User u = new User();
        u.setEmail(email);
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
}
