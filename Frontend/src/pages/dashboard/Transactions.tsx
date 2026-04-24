import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreditCard, Loader2, RefreshCw } from "lucide-react";

const STATUS_CLS: Record<string, string> = {
  SUCCESS: "text-emerald-600",
  PENDING: "text-amber-600",
  FAILED:  "text-rose-600",
};

function ago(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

export default function Transactions() {
  const api = useApi();
  const { user } = useAuth();
  const { toast } = useToast();
  const isCustomer = user?.role === "CUSTOMER";

  const [transactions, setTransactions] = useState<any[]>([]);
  const [userId, setUserId]             = useState<number | null>(null);
  const [loading, setLoading]           = useState(true);
  const [open, setOpen]                 = useState(false);
  const [paying, setPaying]             = useState(false);
  const [polling, setPolling]           = useState<string | null>(null);
  const [form, setForm]                 = useState({ phone: "", amount: "" });

  const load = (uid?: number) => {
    setLoading(true);
    const id = uid ?? userId;
    const endpoint = isCustomer && id
      ? `/api/mpesa/transactions/user/${id}`
      : "/api/mpesa/transactions/all";
    api.get<any[]>(endpoint).catch(() => [])
      .then(setTransactions).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isCustomer) {
      api.get<any>("/api/users/me").then(me => {
        setUserId(me.id);
        load(me.id);
      }).catch(() => setLoading(false));
    } else {
      load();
    }
  }, []);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaying(true);
    try {
      const res: any = await api.post("/api/mpesa/stk-push", {
        phoneNumber: form.phone,
        amount: Number(form.amount),
      });
      toast({ title: "STK Push sent", description: res.customerMessage ?? "Check your phone." });
      setOpen(false);
      setPolling(res.checkoutRequestId);
    } catch (err: any) {
      toast({ title: "Payment failed", description: err.message, variant: "destructive" });
    } finally { setPaying(false); }
  };

  // Poll until the transaction resolves
  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(async () => {
      try {
        const tx: any = await api.get(`/api/mpesa/transaction/${polling}`);
        if (tx.status !== "PENDING") {
          clearInterval(interval);
          setPolling(null);
          load(userId ?? undefined);
          toast({
            title: tx.status === "SUCCESS" ? "Payment successful" : "Payment failed",
            description: tx.status === "SUCCESS" ? `Receipt: ${tx.mpesaReceiptNumber}` : "Transaction was not completed.",
            variant: tx.status === "SUCCESS" ? "default" : "destructive",
          });
        }
      } catch { clearInterval(interval); setPolling(null); }
    }, 4000);
    return () => clearInterval(interval);
  }, [polling]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-brand-red">Billing</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Transactions</h1>
        </div>
        <div className="flex items-center gap-2">
          {polling && (
            <span className="flex items-center gap-1.5 text-xs text-amber-600">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Confirming payment…
            </span>
          )}
          {isCustomer && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="h-9 rounded-none bg-brand-red px-4 text-xs font-semibold uppercase tracking-wider text-white hover:bg-brand-red/90">
                  <CreditCard className="mr-2 h-4 w-4" /> Pay via M-Pesa
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-none sm:max-w-sm">
                <DialogHeader><DialogTitle className="font-display font-semibold">Pay Utility Bill</DialogTitle></DialogHeader>
                <form onSubmit={handlePay} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">M-Pesa Phone Number</Label>
                    <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required placeholder="254712345678" className="rounded-none" />
                    <p className="text-[11px] text-muted-foreground">Format: 254XXXXXXXXX</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Amount (KES)</Label>
                    <Input type="number" min="1" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required placeholder="500" className="rounded-none" />
                  </div>
                  <Button type="submit" disabled={paying} className="w-full rounded-none bg-brand-red text-white hover:bg-brand-red/90">
                    {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send STK Push"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="rounded-none border border-border bg-card">
        <div className="grid grid-cols-[1fr_120px_100px_120px_80px] border-b border-border bg-muted px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          <span>Reference</span><span>Phone</span><span>Amount</span><span>Time</span><span>Status</span>
        </div>
        {loading ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">Loading…</div>
        ) : transactions.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <CreditCard className="h-8 w-8 opacity-30" />
            No transactions yet.
          </div>
        ) : (
          transactions.map((t: any) => (
            <div key={t.id} className="grid grid-cols-[1fr_120px_100px_120px_80px] items-center border-b border-border px-4 py-3 text-sm last:border-0 hover:bg-muted/50 transition-colors">
              <div>
                <p className="font-medium font-mono text-xs">{t.mpesaReceiptNumber ?? t.checkoutRequestId?.slice(0, 20) + "…"}</p>
              </div>
              <span className="text-muted-foreground">{t.phoneNumber}</span>
              <span className="font-semibold">KES {t.amount?.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground">{ago(t.createdAt)}</span>
              <span className={`text-[10px] font-semibold uppercase ${STATUS_CLS[t.status] ?? "text-muted-foreground"}`}>
                {t.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
