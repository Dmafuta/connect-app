import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Loader2, Gauge, Droplets, Zap, Flame } from "lucide-react";

const TYPE_ICON: Record<string, React.ElementType> = { WATER: Droplets, ELECTRICITY: Zap, GAS: Flame };
const TYPE_COLOR: Record<string, string> = { WATER: "#3b82f6", ELECTRICITY: "#f59e0b", GAS: "#10b981" };
const STATUS_CLS: Record<string, string> = { ACTIVE: "bg-emerald-100 text-emerald-700", INACTIVE: "bg-slate-100 text-slate-600", FAULTY: "bg-rose-100 text-rose-700" };

export default function Meters() {
  const api = useApi();
  const { toast } = useToast();
  const [meters, setMeters] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ serialNumber: "", type: "WATER", location: "", customerId: "" });

  const load = () => { setLoading(true); Promise.all([api.get<any[]>("/api/meters"), api.get<any[]>("/api/users/customers")]).then(([m,c]) => { setMeters(m); setCustomers(c); }).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/api/meters", form);
      toast({ title: "Meter registered", description: `${form.serialNumber} added.` });
      setOpen(false);
      setForm({ serialNumber: "", type: "WATER", location: "", customerId: "" });
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const filtered = meters.filter(m =>
    `${m.serialNumber} ${m.location ?? ""} ${m.type}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-brand-red">Management</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Meters</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="h-9 rounded-none bg-brand-red px-4 text-xs font-semibold uppercase tracking-wider text-white hover:bg-brand-red/90">
              <Plus className="mr-2 h-4 w-4" /> Register Meter
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-none sm:max-w-md">
            <DialogHeader><DialogTitle className="font-display font-semibold">Register New Meter</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Serial Number</Label>
                <Input value={form.serialNumber} onChange={e => setForm(f => ({...f, serialNumber: e.target.value}))} required placeholder="QC-WTR-0001" className="rounded-none" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({...f, type: v}))}>
                  <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="WATER">Water</SelectItem><SelectItem value="ELECTRICITY">Electricity</SelectItem><SelectItem value="GAS">Gas</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Location</Label>
                <Input value={form.location} onChange={e => setForm(f => ({...f, location: e.target.value}))} placeholder="Nairobi, Block A" className="rounded-none" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Assign to Customer (optional)</Label>
                <Select value={form.customerId} onValueChange={v => setForm(f => ({...f, customerId: v}))}>
                  <SelectTrigger className="rounded-none"><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>
                    {customers.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.firstName} {c.lastName} — {c.email}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={saving} className="w-full rounded-none bg-brand-red text-white hover:bg-brand-red/90">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Register Meter"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search meters…" className="rounded-none pl-9" />
      </div>

      <div className="rounded-none border border-border bg-card">
        <div className="grid grid-cols-[auto_1fr_1fr_1fr_100px] border-b border-border bg-muted px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          <span className="w-8" /><span>Serial</span><span>Type / Location</span><span>Customer</span><span>Status</span>
        </div>
        {loading ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <Gauge className="h-8 w-8 opacity-30" />
            {search ? "No meters match." : "No meters registered yet."}
          </div>
        ) : (
          filtered.map(m => {
            const Icon = TYPE_ICON[m.type] ?? Gauge;
            const color = TYPE_COLOR[m.type] ?? "#888";
            return (
              <div key={m.id} className="grid grid-cols-[auto_1fr_1fr_1fr_100px] items-center border-b border-border px-4 py-3 text-sm last:border-0 hover:bg-muted/50 transition-colors">
                <Icon className="mr-3 h-4 w-4 shrink-0" style={{ color }} />
                <span className="font-medium">{m.serialNumber}</span>
                <span className="text-muted-foreground">{m.type} · {m.location ?? "—"}</span>
                <span className="text-muted-foreground">{m.customer ? `${m.customer.firstName} ${m.customer.lastName}` : "Unassigned"}</span>
                <span className={`inline-block rounded-none px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_CLS[m.status] ?? ""}`}>{m.status}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
