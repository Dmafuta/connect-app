package africa.quantum.quantumtech.dto;

public record AuthResponse(String token, String refreshToken, String email, String role, String fullName, String tenantCode, String tenantName) {}
