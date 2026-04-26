package africa.quantum.quantumtech.service;

import africa.quantum.quantumtech.model.*;
import africa.quantum.quantumtech.repository.InvoiceRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class BillingService {

    private final InvoiceRepository invoiceRepository;

    public BillingService(InvoiceRepository invoiceRepository) {
        this.invoiceRepository = invoiceRepository;
    }

    /**
     * Generate an invoice for the given reading.
     *
     * @param reading       the reading just saved
     * @param previousValue the previous meter reading value (0 if this is the first reading)
     * @param isFirstReading true when there was no prior reading — we skip billing (establishes baseline)
     * @return the saved Invoice, or null if skipped (first reading / no customer assigned)
     */
    public Invoice generateInvoice(MeterReading reading, double previousValue, boolean isFirstReading) {
        Meter meter = reading.getMeter();

        // No customer → nothing to bill
        if (meter.getCustomer() == null) return null;

        // First reading establishes the baseline; no consumption yet
        if (isFirstReading) return null;

        double consumption = reading.getValue() - previousValue;
        if (consumption <= 0) return null; // no-op or meter rollback already caught upstream

        Tenant tenant = meter.getTenant();
        BigDecimal unitPrice = resolveUnitPrice(tenant, meter.getType());
        BigDecimal consumptionBD = BigDecimal.valueOf(consumption).setScale(4, RoundingMode.HALF_UP);
        BigDecimal amount = unitPrice.multiply(consumptionBD).setScale(2, RoundingMode.HALF_UP);

        Invoice invoice = new Invoice();
        invoice.setTenant(tenant);
        invoice.setCustomer(meter.getCustomer());
        invoice.setMeter(meter);
        invoice.setReading(reading);
        invoice.setPreviousReading(previousValue);
        invoice.setCurrentReading(reading.getValue());
        invoice.setConsumption(consumption);
        invoice.setUnitPrice(unitPrice);
        invoice.setAmount(amount);
        // If unit price is zero the invoice is informational — mark VOID so it doesn't show as outstanding
        if (unitPrice.compareTo(BigDecimal.ZERO) == 0) {
            invoice.setStatus(Invoice.Status.VOID);
            invoice.setNotes("Unit price not configured — amount is zero.");
        }

        return invoiceRepository.save(invoice);
    }

    private BigDecimal resolveUnitPrice(Tenant tenant, Meter.Type type) {
        return switch (type) {
            case WATER       -> nvl(tenant.getWaterUnitPrice());
            case ELECTRICITY -> nvl(tenant.getElectricityUnitPrice());
            case GAS         -> nvl(tenant.getGasUnitPrice());
        };
    }

    private BigDecimal nvl(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }
}
