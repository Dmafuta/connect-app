package africa.quantum.quantumtech.controller;

import africa.quantum.quantumtech.dto.AuthResponse;
import africa.quantum.quantumtech.dto.ErrorResponse;
import africa.quantum.quantumtech.dto.LoginRequest;
import africa.quantum.quantumtech.dto.RegisterRequest;
import africa.quantum.quantumtech.model.Role;
import africa.quantum.quantumtech.model.User;
import africa.quantum.quantumtech.notification.EmailService;
import africa.quantum.quantumtech.repository.UserRepository;
import africa.quantum.quantumtech.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authManager;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          AuthenticationManager authManager,
                          JwtUtil jwtUtil,
                          EmailService emailService) {
        this.userRepository  = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authManager     = authManager;
        this.jwtUtil         = jwtUtil;
        this.emailService    = emailService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Email already registered"));
        }
        User user = new User();
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        if (request.firstName() != null) user.setFirstName(request.firstName());
        if (request.lastName()  != null) user.setLastName(request.lastName());
        if (request.phone()     != null) user.setPhone(request.phone());
        user.setRole(Role.CUSTOMER);
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        emailService.sendEmail(
            user.getEmail(),
            "Welcome to QuantumConnect",
            emailService.welcomeBody(user.getEmail())
        );
        return ResponseEntity.ok(new AuthResponse(token, user.getEmail(), user.getRole().name(), user.getFullName()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password())
            );
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401).body(new ErrorResponse("Invalid email or password"));
        }
        User user = userRepository.findByEmail(request.email()).orElseThrow();
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return ResponseEntity.ok(new AuthResponse(token, user.getEmail(), user.getRole().name(), user.getFullName()));
    }
}
