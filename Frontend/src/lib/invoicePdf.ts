/**
 * Opens a new browser window with a formatted invoice and triggers the print dialog.
 * Works without any additional libraries — uses native browser print.
 */
export function printInvoice(inv: any, orgName = "Your Service Provider") {
  const unit = inv.meter?.type === "ELECTRICITY" ? "kWh" : "m³";
  const customerName = `${inv.customer?.firstName ?? ""} ${inv.customer?.lastName ?? ""}`.trim()
    || inv.customer?.email
    || "—";
  const amountFmt = (n: number | string) =>
    `KES ${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice #${inv.id} — ${orgName}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; color: #111; background: #fff; padding: 48px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #e60026; }
    .org-name { font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }
    .invoice-meta { text-align: right; }
    .invoice-meta h1 { font-size: 32px; font-weight: 800; color: #e60026; letter-spacing: -1px; }
    .invoice-meta .inv-number { font-size: 13px; color: #666; margin-top: 2px; font-family: monospace; }
    .badge { display: inline-block; margin-top: 6px; padding: 3px 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; }
    .badge-PAID   { background: #d1fae5; color: #065f46; }
    .badge-UNPAID { background: #fef3c7; color: #92400e; }
    .badge-VOID   { background: #f3f4f6; color: #6b7280; }
    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 36px; }
    .party-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; color: #888; margin-bottom: 8px; }
    .party-name { font-size: 15px; font-weight: 600; }
    .party-detail { font-size: 13px; color: #555; margin-top: 2px; }
    .dates { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .date-row { font-size: 13px; }
    .date-row .label { color: #888; margin-bottom: 2px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead tr { background: #f5f5f5; }
    th { padding: 10px 14px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #555; border-bottom: 2px solid #e5e5e5; }
    td { padding: 13px 14px; border-bottom: 1px solid #ebebeb; font-size: 14px; vertical-align: top; }
    .tr-total td { background: #fafafa; font-weight: 700; font-size: 15px; border-top: 2px solid #e5e5e5; border-bottom: none; }
    .tr-total .total-label { color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; }
    .amount-cell { text-align: right; font-variant-numeric: tabular-nums; }
    .mono { font-family: monospace; }
    .notes { margin-bottom: 32px; }
    .notes-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; color: #888; margin-bottom: 6px; }
    .footer { border-top: 1px solid #e5e5e5; padding-top: 16px; font-size: 11px; color: #999; text-align: center; }
    @media print {
      body { padding: 24px; }
      @page { margin: 1.5cm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="org-name">${orgName}</div>
    <div class="invoice-meta">
      <h1>Invoice</h1>
      <div class="inv-number">#${inv.id}</div>
      <div class="badge badge-${inv.status}">${inv.status}</div>
    </div>
  </div>

  <div class="parties">
    <div>
      <div class="party-label">Bill To</div>
      <div class="party-name">${customerName}</div>
      ${inv.customer?.email    ? `<div class="party-detail">${inv.customer.email}</div>` : ""}
      ${inv.customer?.phone    ? `<div class="party-detail">${inv.customer.phone}</div>` : ""}
    </div>
    <div class="dates">
      <div>
        <div class="date-row"><div class="label">Issued</div>${inv.issuedAt ?? "—"}</div>
      </div>
      <div>
        <div class="date-row"><div class="label">Due</div>${inv.dueAt ?? "—"}</div>
      </div>
      ${inv.paidAt ? `
      <div style="grid-column:1/-1">
        <div class="date-row"><div class="label">Paid On</div>${new Date(inv.paidAt).toLocaleDateString()}</div>
      </div>` : ""}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Meter</th>
        <th>Previous</th>
        <th>Current</th>
        <th>Consumption</th>
        <th>Unit Price</th>
        <th class="amount-cell">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${inv.meter?.type ?? "Utility"} usage${inv.meter?.location ? ` · ${inv.meter.location}` : ""}</td>
        <td class="mono">${inv.meter?.serialNumber ?? "—"}</td>
        <td>${inv.previousReading != null ? Number(inv.previousReading).toFixed(2) : "—"} <span style="color:#888;font-size:11px">${unit}</span></td>
        <td>${inv.currentReading  != null ? Number(inv.currentReading).toFixed(2)  : "—"} <span style="color:#888;font-size:11px">${unit}</span></td>
        <td><strong>${inv.consumption != null ? Number(inv.consumption).toFixed(2) : "—"}</strong> <span style="color:#888;font-size:11px">${unit}</span></td>
        <td>${amountFmt(inv.unitPrice)} <span style="color:#888;font-size:11px">/${unit}</span></td>
        <td class="amount-cell"><strong>${amountFmt(inv.amount)}</strong></td>
      </tr>
      <tr class="tr-total">
        <td colspan="6"><span class="total-label">Total ${inv.status === "PAID" ? "Paid" : "Due"}</span></td>
        <td class="amount-cell">${amountFmt(inv.amount)}</td>
      </tr>
    </tbody>
  </table>

  ${inv.notes ? `
  <div class="notes">
    <div class="notes-label">Notes</div>
    <p style="font-size:13px;color:#555;line-height:1.6;">${inv.notes}</p>
  </div>` : ""}

  <div class="footer">
    <p>${orgName} · Invoice #${inv.id} · Generated ${new Date().toLocaleDateString()}</p>
    <p style="margin-top:4px;">Thank you for your business. Please quote the invoice number for all correspondence.</p>
  </div>

  <script>
    window.onload = function () { window.print(); };
  </script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
