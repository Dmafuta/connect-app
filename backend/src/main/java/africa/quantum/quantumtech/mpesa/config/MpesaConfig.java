package africa.quantum.quantumtech.mpesa.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "mpesa")
public class MpesaConfig {

    private String consumerKey;
    private String consumerSecret;
    private String passkey;
    private String shortcode;
    private String callbackUrl;
    private String callbackBaseUrl; // base URL for per-tenant callbacks, e.g. https://api.quantumconnect.africa
    private String environment; // sandbox | production

    public String getBaseUrl() {
        return "sandbox".equalsIgnoreCase(environment)
                ? "https://sandbox.safaricom.co.ke"
                : "https://api.safaricom.co.ke";
    }

    public String getConsumerKey()          { return consumerKey; }
    public String getConsumerSecret()       { return consumerSecret; }
    public String getPasskey()              { return passkey; }
    public String getShortcode()            { return shortcode; }
    public String getCallbackUrl()          { return callbackUrl; }
    public String getCallbackBaseUrl()      { return callbackBaseUrl; }
    public String getEnvironment()          { return environment; }

    public void setConsumerKey(String consumerKey)             { this.consumerKey = consumerKey; }
    public void setConsumerSecret(String consumerSecret)       { this.consumerSecret = consumerSecret; }
    public void setPasskey(String passkey)                     { this.passkey = passkey; }
    public void setShortcode(String shortcode)                 { this.shortcode = shortcode; }
    public void setCallbackUrl(String callbackUrl)             { this.callbackUrl = callbackUrl; }
    public void setCallbackBaseUrl(String callbackBaseUrl)     { this.callbackBaseUrl = callbackBaseUrl; }
    public void setEnvironment(String environment)             { this.environment = environment; }
}
