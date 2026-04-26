package africa.quantum.quantumtech.service;

import africa.quantum.quantumtech.model.Invoice;
import africa.quantum.quantumtech.model.Tenant;
import africa.quantum.quantumtech.model.User;
import africa.quantum.quantumtech.notification.EmailService;
import africa.quantum.quantumtech.notification.SmsService;
import africa.quantum.quantumtech.repository.InvoiceRepository;
import africa.quantum.quantumtech.repository.TenantRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class InvoiceReminderService {

    private static final Logger log = LoggerFactory.getLogger(InvoiceReminderService.class);
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("d MMM yyyy");

    private final InvoiceRepository invoiceRepository;
    private final TenantRepository  tenantRepository;
    private final EmailService      emailService;
    private final SmsService        smsService;

    public InvoiceReminderService(InvoiceRepository invoiceRepository,
                                  TenantRepository tenantRepository,
                                  EmailService emailService,
                                  SmsService smsService) {
        this.invoiceRepository = invoiceRepository;
        this.tenantRepository  = tenantRepository;
        this.emailService      = emailService;
        this.smsService        = smsService;
    }

    /**
     * Runs every day at 08:00 server time.
     * Finds all UNPAID invoices past their due date and sends email + SMS reminders.
     */
    @Scheduled(cron = "0 0 8 * * *")
    public void sendOverdueReminders() {
        LocalDate today = LocalDate.now();
        List<Tenant> tenants = tenantRepository.findAll();
        int totalSent = 0;

        for (Tenant tenant : tenants) {
            List<Invoice> overdue = invoiceRepository
                    .findByTenantIdAndStatusAndDueAtBefore(tenant.getId(), Invoice.Status.UNPAID, today);

            if (overdue.isEmpty()) continue;

            // Group overdue invoices by customer
            Map<Long, List<Invoice>> byCustomer = overdue.stream()
                    .collect(Collectors.groupingBy(inv -> inv.getCustomer().getId()));

            for (List<Invoice> invoices : byCustomer.values()) {
                User customer = invoices.get(0).getCustomer();

                // Email reminder
                try {
                    emailService.sendEmail(
                            customer.getEmail(),
                            "Payment reminder — " + invoices.size() + " overdue invoice" + (invoices.size() > 1 ? "s" : ""),
                            buildEmailBody(customer, invoices, tenant)
                    );
                    totalSent++;
                } catch (Exception e) {
                    log.warn("Overdue email failed for {} (tenant {}): {}", customer.getEmail(), tenant.getCode(), e.getMessage());
                }

                // SMS reminder (only if phone is set)
                if (customer.getPhone() != null && !customer.getPhone().isBlank()) {
                    try {
                        smsService.sendSms(customer.getPhone(), buildSmsBody(invoices, tenant));
                    } catch (Exception e) {
                        log.warn("Overdue SMS failed for {} (tenant {}): {}", customer.getPhone(), tenant.getCode(), e.getMessage());
                    }
                }
            }

            log.info("Overdue reminders sent for tenant {} — {} customer(s), {} invoice(s)",
                    tenant.getCode(), byCustomer.size(), overdue.size());
        }

        log.info("Daily overdue reminder run complete — {} email(s) sent across {} tenant(s)", totalSent, tenants.size());
    }

    // ── Template builders ─────────────────────────────────────────────────────

    private String buildEmailBody(User customer, List<Invoice> invoices, Tenant tenant) {
        BigDecimal total = invoices.stream()
                .map(Invoice::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        StringBuilder rows = new StringBuilder();
        for (Invoice inv : invoices) {
            long daysOverdue = java.time.temporal.ChronoUnit.DAYS.between(inv.getDueAt(), LocalDate.now());
            rows.append(String.format(
                "<tr>" +
                "<td style='padding:8px 12px;border-bottom:1px solid #2a2a2a;font-family:monospace;font-size:13px;color:#ffffff;'>#%d</td>" +
                "<td style='padding:8px 12px;border-bottom:1px solid #2a2a2a;font-size:13px;color:#ffffff;'>%s</td>" +
                "<td style='padding:8px 12px;border-bottom:1px solid #2a2a2a;font-size:13px;color:#ffffff;text-align:right;'>KES %s</td>" +
                "<td style='padding:8px 12px;border-bottom:1px solid #2a2a2a;font-size:13px;color:#e60026;text-align:right;'>%d day%s</td>" +
                "</tr>",
                inv.getId(),
                inv.getDueAt().format(DATE_FMT),
                inv.getAmount().toPlainString(),
                daysOverdue,
                daysOverdue == 1 ? "" : "s"
            ));
        }

        String bodyHtml = String.format("""
            <p style='color:#cccccc;font-size:15px;line-height:1.6;margin:0 0 16px;'>
              Dear %s,
            </p>
            <p style='color:#cccccc;font-size:15px;line-height:1.6;margin:0 0 20px;'>
              You have <strong style='color:#ffffff;'>%d outstanding invoice%s</strong> with <strong style='color:#ffffff;'>%s</strong>
              totalling <strong style='color:#e60026;'>KES %s</strong>. Please arrange payment at your earliest convenience
              to avoid service interruption.
            </p>
            <table width='100%%' cellpadding='0' cellspacing='0' role='presentation'
                   style='background:#111111;border:1px solid #2a2a2a;margin-bottom:24px;'>
              <thead>
                <tr style='background:#1f1f1f;'>
                  <th style='padding:8px 12px;text-align:left;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#888888;'>Invoice</th>
                  <th style='padding:8px 12px;text-align:left;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#888888;'>Due date</th>
                  <th style='padding:8px 12px;text-align:right;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#888888;'>Amount</th>
                  <th style='padding:8px 12px;text-align:right;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#888888;'>Overdue</th>
                </tr>
              </thead>
              <tbody>%s</tbody>
            </table>
            <p style='color:#888888;font-size:13px;line-height:1.6;margin:0;'>
              Log in to your account to view your invoices and make a payment.
              If you believe this is an error, please contact your service provider.
            </p>
            """,
            customer.getFirstName().isBlank() ? "Customer" : customer.getFirstName(),
            invoices.size(), invoices.size() > 1 ? "s" : "",
            tenant.getName(),
            total.toPlainString(),
            rows
        );

        return EmailService.branded(
                "Payment reminder — " + tenant.getName(),
                "You have " + invoices.size() + " overdue invoice" + (invoices.size() > 1 ? "s" : "") + " totalling KES " + total.toPlainString(),
                bodyHtml
        );
    }

    private String buildSmsBody(List<Invoice> invoices, Tenant tenant) {
        BigDecimal total = invoices.stream()
                .map(Invoice::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return String.format(
                "[%s] You have %d overdue invoice%s totalling KES %s. Log in to your account to pay now.",
                tenant.getName(),
                invoices.size(),
                invoices.size() > 1 ? "s" : "",
                total.toPlainString()
        );
    }
}
