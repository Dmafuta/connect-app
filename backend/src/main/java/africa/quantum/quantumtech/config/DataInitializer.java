package africa.quantum.quantumtech.config;

import africa.quantum.quantumtech.model.Role;
import africa.quantum.quantumtech.model.User;
import africa.quantum.quantumtech.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        seed("superadmin@quantum.local", "Admin@123",    "Super",    "Admin",    Role.SUPER_ADMIN);
        seed("admin@quantum.local",      "Admin@123",    "Admin",    "User",     Role.ADMIN);
        seed("tech@quantum.local",       "Tech@123",     "Tech",     "User",     Role.TECHNICIAN);
        seed("customer@quantum.local",   "Customer@123", "Customer", "User",     Role.CUSTOMER);
    }

    private void seed(String email, String password, String firstName, String lastName, Role role) {
        if (userRepository.existsByEmail(email)) return;
        User u = new User();
        u.setEmail(email);
        u.setPassword(passwordEncoder.encode(password));
        u.setFirstName(firstName);
        u.setLastName(lastName);
        u.setRole(role);
        userRepository.save(u);
        System.out.printf("[DataInitializer] Created %s (%s)%n", email, role);
    }
}
