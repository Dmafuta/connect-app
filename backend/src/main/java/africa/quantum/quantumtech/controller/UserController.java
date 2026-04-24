package africa.quantum.quantumtech.controller;

import africa.quantum.quantumtech.model.Role;
import africa.quantum.quantumtech.model.User;
import africa.quantum.quantumtech.repository.UserRepository;
import africa.quantum.quantumtech.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public UserController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository  = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil         = jwtUtil;
    }

    /** All users — SUPER_ADMIN only */
    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public List<User> allUsers() {
        return userRepository.findAll();
    }

    /** Customers list — ADMIN and above */
    @GetMapping("/customers")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public List<User> customers() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.CUSTOMER)
                .toList();
    }

    /** Technicians list — ADMIN and above */
    @GetMapping("/technicians")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public List<User> technicians() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.TECHNICIAN)
                .toList();
    }

    /** Get single user */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Create user with any role — SUPER_ADMIN / ADMIN */
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<?> createUser(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email already registered"));
        }
        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(body.getOrDefault("password", "ChangeMe123!")));
        user.setFirstName(body.getOrDefault("firstName", ""));
        user.setLastName(body.getOrDefault("lastName", ""));
        user.setPhone(body.get("phone"));
        user.setRole(Role.valueOf(body.getOrDefault("role", "CUSTOMER")));
        userRepository.save(user);
        return ResponseEntity.ok(user);
    }

    /** Update role / active status — SUPER_ADMIN only */
    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return userRepository.findById(id).map(u -> {
            if (body.containsKey("role"))   u.setRole(Role.valueOf(body.get("role")));
            if (body.containsKey("active")) u.setActive(Boolean.parseBoolean(body.get("active")));
            if (body.containsKey("firstName")) u.setFirstName(body.get("firstName"));
            if (body.containsKey("lastName"))  u.setLastName(body.get("lastName"));
            return ResponseEntity.ok(userRepository.save(u));
        }).orElse(ResponseEntity.notFound().build());
    }

    /** Me — any authenticated user */
    @GetMapping("/me")
    public ResponseEntity<User> me(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        String email = jwtUtil.extractEmail(token);
        return userRepository.findByEmail(email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Change own password — any authenticated user */
    @PatchMapping("/me/password")
    public ResponseEntity<?> changePassword(@RequestHeader("Authorization") String authHeader,
                                            @RequestBody Map<String, String> body) {
        String email = jwtUtil.extractEmail(authHeader.substring(7));
        return userRepository.findByEmail(email).map(u -> {
            if (!passwordEncoder.matches(body.get("currentPassword"), u.getPassword())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Current password is incorrect"));
            }
            u.setPassword(passwordEncoder.encode(body.get("newPassword")));
            userRepository.save(u);
            return ResponseEntity.ok(Map.of("message", "Password updated"));
        }).orElse(ResponseEntity.notFound().build());
    }
}
