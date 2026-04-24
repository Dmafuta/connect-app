package africa.quantum.quantumtech.controller;

import africa.quantum.quantumtech.model.Meter;
import africa.quantum.quantumtech.model.MeterReading;
import africa.quantum.quantumtech.model.User;
import africa.quantum.quantumtech.repository.MeterReadingRepository;
import africa.quantum.quantumtech.repository.MeterRepository;
import africa.quantum.quantumtech.repository.UserRepository;
import africa.quantum.quantumtech.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/readings")
public class MeterReadingController {

    private final MeterReadingRepository readingRepository;
    private final MeterRepository        meterRepository;
    private final UserRepository         userRepository;
    private final JwtUtil jwtUtil;

    public MeterReadingController(MeterReadingRepository readingRepository,
                                  MeterRepository meterRepository,
                                  UserRepository userRepository,
                                  JwtUtil jwtUtil) {
        this.readingRepository = readingRepository;
        this.meterRepository   = meterRepository;
        this.userRepository    = userRepository;
        this.jwtUtil           = jwtUtil;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','TECHNICIAN')")
    public List<MeterReading> allReadings() {
        return readingRepository.findAll();
    }

    @GetMapping("/meter/{meterId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','TECHNICIAN')")
    public List<MeterReading> byMeter(@PathVariable Long meterId) {
        return readingRepository.findByMeterIdOrderByReadAtDesc(meterId);
    }

    @GetMapping("/my")
    public ResponseEntity<List<MeterReading>> myReadings(@RequestHeader("Authorization") String authHeader) {
        String email = jwtUtil.extractEmail(authHeader.substring(7));
        User user = userRepository.findByEmail(email).orElseThrow();
        return ResponseEntity.ok(readingRepository.findByCustomerId(user.getId()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','TECHNICIAN')")
    public ResponseEntity<?> logReading(@RequestHeader("Authorization") String authHeader,
                                        @RequestBody Map<String, String> body) {
        Long meterId = Long.parseLong(body.get("meterId"));
        Meter meter  = meterRepository.findById(meterId).orElseThrow();
        String email = jwtUtil.extractEmail(authHeader.substring(7));
        User   recorder = userRepository.findByEmail(email).orElseThrow();

        MeterReading reading = new MeterReading();
        reading.setMeter(meter);
        reading.setValue(Double.parseDouble(body.get("value")));
        reading.setUnit(body.getOrDefault("unit", ""));
        reading.setReadingType(MeterReading.ReadingType.MANUAL);
        reading.setRecordedBy(recorder);

        return ResponseEntity.ok(readingRepository.save(reading));
    }
}
