package africa.quantum.quantumtech.controller;

import africa.quantum.quantumtech.model.Meter;
import africa.quantum.quantumtech.model.User;
import africa.quantum.quantumtech.repository.MeterRepository;
import africa.quantum.quantumtech.repository.UserRepository;
import africa.quantum.quantumtech.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/meters")
public class MeterController {

    private final MeterRepository meterRepository;
    private final UserRepository  userRepository;
    private final JwtUtil jwtUtil;

    public MeterController(MeterRepository meterRepository, UserRepository userRepository, JwtUtil jwtUtil) {
        this.meterRepository = meterRepository;
        this.userRepository  = userRepository;
        this.jwtUtil         = jwtUtil;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','TECHNICIAN')")
    public List<Meter> allMeters() {
        return meterRepository.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','TECHNICIAN')")
    public ResponseEntity<Meter> getMeter(@PathVariable Long id) {
        return meterRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Customer's own meters */
    @GetMapping("/my")
    public ResponseEntity<List<Meter>> myMeters(@RequestHeader("Authorization") String authHeader) {
        String email = jwtUtil.extractEmail(authHeader.substring(7));
        User user = userRepository.findByEmail(email).orElseThrow();
        return ResponseEntity.ok(meterRepository.findByCustomer(user));
    }

    /** Technician's assigned meters */
    @GetMapping("/assigned")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','TECHNICIAN')")
    public ResponseEntity<List<Meter>> assignedMeters(@RequestHeader("Authorization") String authHeader) {
        String email = jwtUtil.extractEmail(authHeader.substring(7));
        User tech = userRepository.findByEmail(email).orElseThrow();
        return ResponseEntity.ok(meterRepository.findByTechnician(tech));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<?> createMeter(@RequestBody Map<String, String> body) {
        String serial = body.get("serialNumber");
        if (meterRepository.existsBySerialNumber(serial)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Serial number already exists"));
        }
        Meter meter = new Meter();
        meter.setSerialNumber(serial);
        meter.setType(Meter.Type.valueOf(body.get("type")));
        meter.setLocation(body.get("location"));
        if (body.containsKey("customerId")) {
            userRepository.findById(Long.parseLong(body.get("customerId")))
                    .ifPresent(meter::setCustomer);
        }
        return ResponseEntity.ok(meterRepository.save(meter));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<Meter> updateMeter(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return meterRepository.findById(id).map(m -> {
            if (body.containsKey("status"))   m.setStatus(Meter.Status.valueOf(body.get("status")));
            if (body.containsKey("location")) m.setLocation(body.get("location"));
            if (body.containsKey("customerId")) {
                userRepository.findById(Long.parseLong(body.get("customerId")))
                        .ifPresent(m::setCustomer);
            }
            if (body.containsKey("technicianId")) {
                if (body.get("technicianId").isBlank()) {
                    m.setTechnician(null);
                } else {
                    userRepository.findById(Long.parseLong(body.get("technicianId")))
                            .ifPresent(m::setTechnician);
                }
            }
            return ResponseEntity.ok(meterRepository.save(m));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> deleteMeter(@PathVariable Long id) {
        meterRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
