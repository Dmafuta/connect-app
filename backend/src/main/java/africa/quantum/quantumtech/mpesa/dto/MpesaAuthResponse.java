package africa.quantum.quantumtech.mpesa.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class MpesaAuthResponse {

    @JsonProperty("access_token")
    private String accessToken;

    @JsonProperty("expires_in")
    private String expiresIn;

    public String getAccessToken() { return accessToken; }
    public String getExpiresIn()   { return expiresIn; }

    public void setAccessToken(String v) { this.accessToken = v; }
    public void setExpiresIn(String v)   { this.expiresIn = v; }
}
