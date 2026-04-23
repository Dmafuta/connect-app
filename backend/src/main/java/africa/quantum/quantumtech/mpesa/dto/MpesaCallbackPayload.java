package africa.quantum.quantumtech.mpesa.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/**
 * Represents the callback payload sent by Safaricom Daraja after
 * the customer completes (or cancels) the STK push prompt.
 */
public class MpesaCallbackPayload {

    @JsonProperty("Body")
    private Body body;

    public Body getBody() { return body; }
    public void setBody(Body v) { this.body = v; }

    // ── Body ──────────────────────────────────────────────────────────────────

    public static class Body {
        @JsonProperty("stkCallback")
        private StkCallback stkCallback;

        public StkCallback getStkCallback() { return stkCallback; }
        public void setStkCallback(StkCallback v) { this.stkCallback = v; }
    }

    // ── StkCallback ───────────────────────────────────────────────────────────

    public static class StkCallback {
        @JsonProperty("MerchantRequestID")
        private String merchantRequestId;

        @JsonProperty("CheckoutRequestID")
        private String checkoutRequestId;

        @JsonProperty("ResultCode")
        private int resultCode;

        @JsonProperty("ResultDesc")
        private String resultDesc;

        @JsonProperty("CallbackMetadata")
        private CallbackMetadata callbackMetadata;

        public boolean isSuccess()               { return resultCode == 0; }
        public String getMerchantRequestId()     { return merchantRequestId; }
        public String getCheckoutRequestId()     { return checkoutRequestId; }
        public int getResultCode()               { return resultCode; }
        public String getResultDesc()            { return resultDesc; }
        public CallbackMetadata getCallbackMetadata() { return callbackMetadata; }

        public void setMerchantRequestId(String v)      { this.merchantRequestId = v; }
        public void setCheckoutRequestId(String v)      { this.checkoutRequestId = v; }
        public void setResultCode(int v)                { this.resultCode = v; }
        public void setResultDesc(String v)             { this.resultDesc = v; }
        public void setCallbackMetadata(CallbackMetadata v) { this.callbackMetadata = v; }
    }

    // ── CallbackMetadata ──────────────────────────────────────────────────────

    public static class CallbackMetadata {
        @JsonProperty("Item")
        private List<MetadataItem> items;

        public List<MetadataItem> getItems() { return items; }
        public void setItems(List<MetadataItem> v) { this.items = v; }

        /** Convenience: extract a named item's value as String */
        public String getValue(String name) {
            if (items == null) return null;
            return items.stream()
                    .filter(i -> name.equals(i.getName()))
                    .map(i -> i.getValue() != null ? i.getValue().toString() : null)
                    .findFirst()
                    .orElse(null);
        }
    }

    // ── MetadataItem ──────────────────────────────────────────────────────────

    public static class MetadataItem {
        @JsonProperty("Name")
        private String name;

        /** Value can be String, Number, or Long — kept as Object */
        @JsonProperty("Value")
        private Object value;

        public String getName()  { return name; }
        public Object getValue() { return value; }

        public void setName(String v)  { this.name = v; }
        public void setValue(Object v) { this.value = v; }
    }
}
