package africa.quantum.quantumtech.mpesa.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public class StkPushRequest {

    /** Customer phone number in international format e.g. 254712345678 */
    @NotBlank(message = "Phone number is required")
    private String phoneNumber;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    private BigDecimal amount;

    /** Your internal reference e.g. invoice ID or account number */
    @NotBlank(message = "Account reference is required")
    private String accountReference;

    private String description = "Payment";

    /** Optional: ID of the authenticated user initiating the payment */
    private Long userId;

    public String getPhoneNumber()     { return phoneNumber; }
    public BigDecimal getAmount()      { return amount; }
    public String getAccountReference(){ return accountReference; }
    public String getDescription()     { return description; }
    public Long getUserId()            { return userId; }

    public void setPhoneNumber(String v)      { this.phoneNumber = v; }
    public void setAmount(BigDecimal v)       { this.amount = v; }
    public void setAccountReference(String v) { this.accountReference = v; }
    public void setDescription(String v)      { this.description = v; }
    public void setUserId(Long v)             { this.userId = v; }
}
