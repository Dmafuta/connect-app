import { useEffect, useRef, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Receipt, Download, MoreHorizontal, Smartphone, Loader2, CheckCircle2, XCircle, FileText } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { exportCsv } from "@/lib/exportCsv";
import { printInvoice } from "@/lib/invoicePdf";
import Pagination, { PageResponse } from "@/components/dashboard/Pagination";

const STATUS_CLS: Record<string, string> = {
  UNPAID: "bg-amber-100 text-amber-700",
  PAID:   "bg-emerald-100 text-emerald-700",
  VOID:   "bg-slate-100 text-slate-500",
};

const FILTERS = ["ALL", "UNPAID", "PAID", "VOID"] as const;
type Filter = typeof FILTERS[number];

function fmt(n: number | string) {
  return `KES ${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function Invoices() {
  const api = useApi();
  const { user } = useAuth();
  const { toast } = useToast();
  const orgName = user?.tenantName || "Your Service Provider";
  const isCustomer = user?.role === "CUSTOMER";
  const isAdmin    = user?.role === "ADMIN";

  const [page,    setPage]    = useState<PageResponse<any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<Filter>("ALL");
  const [pageNum, setPageNum] = useState(0);
  const [summary, setSummary] = useState<any>(null);

  // Pay Now dialog
  const [payInvoice,      setPayInvoice]      = useState<any | null>(null);
  const [payPhone,        setPayPhone]        = useState("");
  const [payState,        setPayState]        = useState<"form" | "pending" | "success" | "failed">("form");
  const [payMessage,      setPayMessage]      = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = (p = 0, f: Filter = filter) => {
    setLoading(true);
    const status = f === "ALL" ? "" : `&status=${f}`;
    const endpoint = isCustomer
      ? `/api/invoices/my?page=${p}&size=20`
      : `/api/invoices?page=${p}&size=20${status}`;
    api.get<PageResponse<any>>(endpoint)
      .then(setPage)
      .catch(err => toast({ title: "Error", description: err.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(0, filter);
    if (isAdmin) {
      api.get<any>("/api/invoices/summary").then(setSummary).catch(() => {});
    }
  }, []);

  const handleFilterChange = (f: Filter) => {
    setFilter(f);
    setPageNum(0);
    load(0, f);
  };

  const markPaid = async (inv: any) => {
    try {
      await api.patch(`/api/invoices/${inv.id}/mark-paid`, {});
      toast({ title: "Invoice marked as paid" });
      load(pageNum);
      if (isAdmin) api.get<any>("/api/invoices/summary").then(setSummary).catch(() => {});
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const voidInvoice = async (inv: any) => {
    if (!confirm("Void this invoice? This cannot be undone.")) return;
    try {
      await api.patch(`/api/invoices/${inv.id}/void`, {});
      toast({ title: "Invoice voided" });
      load(pageNum);
      if (isAdmin) api.get<any>("/api/invoices/summary").then(setSummary).catch(() => {});
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const openPayDialog = (inv: any) => {
    setPayInvoice(inv);
    setPayPhone(user?.phone ?? "");
    setPayState("form");
    setPayMessage("");
  };

  const closePayDialog = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setPayInvoice(null);
  };

  const handlePayNow = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayState("pending");
    try {
      const res = await api.post<any>(`/api/mpesa/pay-invoice/${payInvoice.id}`, { phone: payPhone });
      setPayMessage(res.customerMessage ?? "Check your phone for the M-Pesa prompt.");
      // Poll for confirmation
      const checkoutRequestId = res.checkoutRequestId;
      let attempts = 0;
      pollRef.current = setInterval(async () => {
        attempts++;
        try {
          const tx = await api.get<any>(`/api/mpesa/transaction/${checkoutRequestId}`);
          if (tx.status === "SUCCESS") {
            clearInterval(pollRef.current!);
            setPayState("success");
            load(pageNum);
            if (isAdmin) api.get<any>("/api/invoices/summary").then(setSummary).catch(() => {});
          } else if (tx.status === "FAILED" || tx.status === "CANCELLED") {
            clearInterval(pollRef.current!);
            setPayState("failed");
            setPayMessage(tx.resultDesc ?? "Payment was not completed.");
          } else if (attempts >= 24) { // 2 min timeout
            clearInterval(pollRef.current!);
            setPayState("failed");
            setPayMessage("Payment timed out. If you completed the prompt, your invoice will update shortly.");
          }
        } catch { /* keep polling */ }
      }, 5000);
    } catch (err: any) {
      setPayState("failed");
      setPayMessage(err.message ?? "Failed to initiate payment.");
    }
  };

  const invoices = page?.content ?? [];

  const handleExport = () => {
    exportCsv("invoices.csv",
      ["Invoice #", "Customer", "Meter", "Consumption", "Unit", "Unit Price", "Amount", "Status", "Issued", "Due"],
      invoices.map((i: any) => [
        i.id,
        i.customer ? `${i.customer.firstName} ${i.customer.lastName}`.trim() || i.customer.email : "",
        i.meter?.serialNumber ?? "",
        i.consumption,
        i.meter?.type === "ELECTRICITY" ? "kWh" : "m³",
        i.unitPrice,
        i.amount,
        i.status,
        i.issuedAt,
        i.dueAt,
      ])
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-brand-red">Billing</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Invoices</h1>
        </div>
        {invoices.length > 0 && (
          <Button variant="outline" onClick={handleExport} className="h-9 rounded-none px-4 text-xs font-semibold uppercase tracking-wider">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        )}
      </div>

      {/* Summary cards — ADMIN only */}
      {isAdmin && summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Unpaid invoices", value: summary.unpaidCount,  sub: fmt(summary.unpaidAmount), cls: "border-amber-200" },
            { label: "Paid invoices",   value: summary.paidCount,    sub: fmt(summary.paidAmount),   cls: "border-emerald-200" },
          ].map(c => (
            <div key={c.label} className={`rounded-none border ${c.cls} bg-card p-4`}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">{c.label}</p>
              <p className="mt-1 font-display text-2xl font-semibold">{c.value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{c.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs — ADMIN only */}
      {isAdmin && (
        <div className="flex items-center gap-1 border-b border-border">
          {FILTERS.map(f => (
            <button key={f} onClick={() => handleFilterChange(f)}
              className={`px-3 py-2 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                filter === f ? "border-b-2 border-brand-red text-brand-red" : "text-muted-foreground hover:text-foreground"
              }`}>
              {f === "ALL" ? "All" : f}
            </button>
          ))}
        </div>
      )}

      <div className="rounded-none border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted">
              <TableHead className="text-[10px] font-semibold uppercase tracking-[0.15em] w-16">#</TableHead>
              {isAdmin && <TableHead className="text-[10px] font-semibold uppercase tracking-[0.15em]">Customer</TableHead>}
              <TableHead className="text-[10px] font-semibold uppercase tracking-[0.15em]">Meter</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-[0.15em] w-28">Consumption</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-[0.15em] w-28">Unit Price</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-[0.15em] w-32">Amount</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-[0.15em] w-24">Status</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-[0.15em] w-28">Issued</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-[0.15em] w-28">Due</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={isAdmin ? 10 : 9} className="h-32 text-center text-sm text-muted-foreground">Loading…</TableCell></TableRow>
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 10 : 9} className="h-48 p-0">
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
                    <Receipt className="h-10 w-10 opacity-20" />
                    <div className="text-center">
                      <p className="font-medium text-foreground">No invoices yet</p>
                      <p className="mt-1 text-xs">Invoices are generated automatically when meter readings are submitted.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv: any) => {
                const unit = inv.meter?.type === "ELECTRICITY" ? "kWh" : "m³";
                return (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">#{inv.id}</TableCell>
                    {isAdmin && (
                      <TableCell className="font-medium">
                        {inv.customer ? (`${inv.customer.firstName} ${inv.customer.lastName}`.trim() || inv.customer.email) : "—"}
                      </TableCell>
                    )}
                    <TableCell className="font-mono text-xs">{inv.meter?.serialNumber ?? "—"}</TableCell>
                    <TableCell className="font-semibold">{inv.consumption?.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">{unit}</span></TableCell>
                    <TableCell className="text-muted-foreground">{fmt(inv.unitPrice)} <span className="text-xs">/{unit}</span></TableCell>
                    <TableCell className="font-semibold">{fmt(inv.amount)}</TableCell>
                    <TableCell>
                      <span className={`inline-block rounded-none px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_CLS[inv.status] ?? "bg-muted text-muted-foreground"}`}>
                        {inv.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{inv.issuedAt}</TableCell>
                    <TableCell className={`text-xs font-medium ${inv.status === "UNPAID" && inv.dueAt < new Date().toISOString().slice(0, 10) ? "text-rose-600" : "text-muted-foreground"}`}>
                      {inv.dueAt}
                    </TableCell>
                    <TableCell>
                      {isAdmin ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 rounded-none p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-none w-44">
                            {inv.status === "UNPAID" && (
                              <DropdownMenuItem onClick={() => markPaid(inv)} className="text-xs text-emerald-600 focus:text-emerald-600">
                                Mark as paid
                              </DropdownMenuItem>
                            )}
                            {inv.status === "UNPAID" && (
                              <DropdownMenuItem onClick={() => openPayDialog(inv)} className="text-xs">
                                Send STK push
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => printInvoice(inv, orgName)} className="text-xs">
                              Download PDF
                            </DropdownMenuItem>
                            {inv.status !== "VOID" && (
                              <DropdownMenuItem onClick={() => voidInvoice(inv)} className="text-xs text-rose-600 focus:text-rose-600">
                                Void invoice
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : isCustomer ? (
                        <div className="flex items-center gap-1">
                          {inv.status === "UNPAID" && (
                            <Button size="sm" onClick={() => openPayDialog(inv)}
                              className="h-7 rounded-none bg-brand-red px-3 text-[10px] font-semibold uppercase tracking-wider text-white hover:bg-brand-red/90">
                              Pay
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => printInvoice(inv, orgName)}
                            className="h-7 w-7 rounded-none p-0" title="Download PDF">
                            <FileText className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {page && <Pagination meta={page} onPageChange={p => { setPageNum(p); load(p); }} />}

      {/* Pay Now dialog */}
      <Dialog open={!!payInvoice} onOpenChange={open => { if (!open) closePayDialog(); }}>
        <DialogContent className="rounded-none max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-base font-semibold">Pay Invoice #{payInvoice?.id}</DialogTitle>
            <DialogDescription className="text-xs">
              Amount: <span className="font-semibold text-foreground">{payInvoice ? fmt(payInvoice.amount) : ""}</span>
            </DialogDescription>
          </DialogHeader>

          {payState === "form" && (
            <form onSubmit={handlePayNow} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">M-Pesa Phone Number</Label>
                <Input
                  value={payPhone}
                  onChange={e => setPayPhone(e.target.value)}
                  placeholder="+254712345678"
                  required
                  className="rounded-none font-mono"
                />
                <p className="text-[10px] text-muted-foreground">You will receive a prompt on this number.</p>
              </div>
              <Button type="submit" className="w-full rounded-none bg-brand-red text-white hover:bg-brand-red/90">
                <Smartphone className="mr-2 h-4 w-4" /> Send M-Pesa Prompt
              </Button>
            </form>
          )}

          {payState === "pending" && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-brand-red" />
              <div>
                <p className="font-medium text-sm">Waiting for payment…</p>
                <p className="mt-1 text-xs text-muted-foreground">{payMessage}</p>
              </div>
            </div>
          )}

          {payState === "success" && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              <div>
                <p className="font-semibold text-sm">Payment confirmed!</p>
                <p className="mt-1 text-xs text-muted-foreground">Invoice #{payInvoice?.id} has been marked as paid.</p>
              </div>
              <Button onClick={closePayDialog} className="rounded-none" variant="outline">Close</Button>
            </div>
          )}

          {payState === "failed" && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <XCircle className="h-10 w-10 text-rose-500" />
              <div>
                <p className="font-semibold text-sm">Payment not completed</p>
                <p className="mt-1 text-xs text-muted-foreground">{payMessage}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setPayState("form")} className="rounded-none bg-brand-red text-white hover:bg-brand-red/90">Try again</Button>
                <Button onClick={closePayDialog} className="rounded-none" variant="outline">Cancel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
