import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Activity, Loader2 } from "lucide-react";

function ago(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

export default function Readings() {
  const api = useApi();
  const { user } = useAuth();
  const { toast } = useToast();
  const isCustomer = user?.role === "CUSTOMER";

  const [readings, setReadings] = useState<any[]>([]);
  const [meters, setMeters]     = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [open, setOpen]         = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({ meterId: "", value: "", unit: "m³", notes: "" });

  const load = () => {
    setLoading(true);
    const readingsEndpoint = isCustomer ? "/api/readings/my" : "/api/readings";
    const metersEndpoint   = isCustomer ? "/api/meters/my" : "/api/meters";
    Promise.all([
      api.get<any[]>(readingsEndpoint).catch(() => []),
      api.get<any[]>(metersEndpoint).catch(() => []),
    ]).then(([r, m]) => { setReadings(r); setMeters(m); }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/api/readings", { ...form, meterId: Number(form.meterId), value: Number(form.value) });
      toast({ title: "Reading logged successfully" });
      setOpen(false);
      setForm({ meterId: "", value: "", unit: "m³", notes: "" });
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const canLog = user?.role === "TECHNICIAN" || user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-brand-red">Field Data</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Meter Readings</h1>
        </div>
        {canLog && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="h-9 rounded-none bg-brand-red px-4 text-xs font-semibold uppercase tracking-wider text-white hover:bg-brand-red/90">
                <Plus className="mr-2 h-4 w-4" /> Log Reading
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-none sm:max-w-md">
              <DialogHeader><DialogTitle className="font-display font-semibold">Log Meter Reading</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Meter</Label>
                  <Select value={form.meterId} onValueChange={v => setForm(f => ({ ...f, meterId: v, unit: v ? (meters.find(m => String(m.id) === v)?.type === "WATER" ? "m³" : meters.find(m => String(m.id) === v)?.type === "ELECTRICITY" ? "kWh" : "m³") : f.unit }))}>
                    <SelectTrigger className="rounded-none"><SelectValue placeholder="Select meter" /></SelectTrigger>
                    <SelectContent>
                      {meters.map(m => (
                        <SelectItem key={m.id} value={String(m.id)}>
                          {m.serialNumber} — {m.type} {m.location ? `(${m.location})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Reading Value</Label>
                    <Input type="number" step="0.01" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} required placeholder="0.00" className="rounded-none" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Unit</Label>
                    <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v }))}>
                      <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="m³">m³ (Water/Gas)</SelectItem>
                        <SelectItem value="kWh">kWh (Electricity)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Notes (optional)</Label>
                  <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any observations…" className="rounded-none" />
                </div>
                <Button type="submit" disabled={saving || !form.meterId} className="w-full rounded-none bg-brand-red text-white hover:bg-brand-red/90">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Reading"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="rounded-none border border-border bg-card">
        <div className="grid grid-cols-[1fr_1fr_80px_80px_120px] border-b border-border bg-muted px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          <span>Meter</span><span>Value</span><span>Unit</span><span>Type</span><span>Logged</span>
        </div>
        {loading ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">Loading…</div>
        ) : readings.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-8 w-8 opacity-30" />
            No readings recorded yet.
          </div>
        ) : (
          readings.map((r: any) => (
            <div key={r.id} className="grid grid-cols-[1fr_1fr_80px_80px_120px] items-center border-b border-border px-4 py-3 text-sm last:border-0 hover:bg-muted/50 transition-colors">
              <span className="font-medium">{r.meter?.serialNumber ?? `#${r.meterId}`}</span>
              <span className="font-semibold text-foreground">{r.value?.toLocaleString()}</span>
              <span className="text-muted-foreground">{r.unit}</span>
              <span className="text-muted-foreground">{r.meter?.type ?? "—"}</span>
              <span className="text-xs text-muted-foreground">{ago(r.readingDate ?? r.createdAt)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
