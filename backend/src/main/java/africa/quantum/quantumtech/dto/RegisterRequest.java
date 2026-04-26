package africa.quantum.quantumtech.dto;

public record RegisterRequest(String tenantCode, String email, String password, String firstName, String lastName, String phone, String username) {}
