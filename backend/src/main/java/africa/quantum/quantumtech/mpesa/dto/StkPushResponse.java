package africa.quantum.quantumtech.mpesa.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class StkPushResponse {

    @JsonProperty("MerchantRequestID")
    private String merchantRequestId;

    @JsonProperty("CheckoutRequestID")
    private String checkoutRequestId;

    @JsonProperty("ResponseCode")
    private String responseCode;

    @JsonProperty("ResponseDescription")
    private String responseDescription;

    @JsonProperty("CustomerMessage")
    private String customerMessage;

    public boolean isSuccess() {
        return "0".equals(responseCode);
    }

    public String getMerchantRequestId()    { return merchantRequestId; }
    public String getCheckoutRequestId()    { return checkoutRequestId; }
    public String getResponseCode()         { return responseCode; }
    public String getResponseDescription()  { return responseDescription; }
    public String getCustomerMessage()      { return customerMessage; }

    public void setMerchantRequestId(String v)   { this.merchantRequestId = v; }
    public void setCheckoutRequestId(String v)   { this.checkoutRequestId = v; }
    public void setResponseCode(String v)        { this.responseCode = v; }
    public void setResponseDescription(String v) { this.responseDescription = v; }
    public void setCustomerMessage(String v)     { this.customerMessage = v; }
}
