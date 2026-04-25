import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle2, Clock, Plus, Loader2, Download } from "lucide-react";
import { exportCsv } from "@/lib/exportCsv";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Pagination, { PageResponse } from "@/components/dashboard/Pagination";

const SEVERITY_CLS: Record<string, string> = {
  CRITICAL: "bg-rose-100 text-rose-700",
  HIGH:     "bg-orange-100 text-orange-700",
  MEDIUM:   "bg-amber-100 text-amber-700",
  LOW:      "bg-slate-100 text-slate-600",
};

function ago(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

type Filter = "ALL" | "OPEN" | "RESOLVED";

export default function Alerts() {
  const api = useApi();
  const { toast } = useToast();
  const [alertsPage, setAlertsPage] = useState<PageResponse<any> | null>(null);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState<Filter>("OPEN");
  const [pageNum, setPageNum]       = useState(0);
  const [resolving, setResolving]   = useState<number | null>(null);
  const [open, setOpen]             = useState(false);
  const [saving, setSaving]         = useState(false);
  const [meters, setMeters]         = useState<any[]>([]);
  const [form, setForm]             = useState({ meterId: "", alertType: "ANOMALY", severity: "MEDIUM", message: "" });

  const load = (p = 0, f: Filter = filter) => {
    setLoading(true);
    const qs = f === "ALL" ? "&all=true" : f === "RESOLVED" ? "&resolved=true" : "";
    api.get<PageResponse<any>>(`/api/alerts?page=${p}&size=20${qs}`)
      .then(setAlertsPage).finally(() => setLoading(false));
  };

  useEffect(() => {
    load(0, filter);
    setPageNum(0);
  }, [filter]);

  useEffect(() => {
    api.get<any>("/api/meters?size=1000").then(r => setMeters(Array.isArray(r) ? r : (r.content ?? []))).catch(() => {});
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/api/alerts", { ...form, meterId: Number(form.meterId) });
      toast({ title: "Alert logged" });
      setOpen(false);
      setForm({ meterId: "", alertType: "ANOMALY", severity: "MEDIUM", message: "" });
      load(0, filter);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const resolve = async (id: number) => {
    setResolving(id);
    try {
      await api.patch(`/api/alerts/${id}/resolve`, {});
      toast({ title: "Alert resolved" });
      if (filter === "OPEN") {
        setAlertsPage(prev => prev ? { ...prev, content: prev.content.filter(a => a.id !== id), totalElements: prev.totalElements - 1 } : prev);
      } else {
        setAlertsPage(prev => prev ? { ...prev, content: prev.content.map(a => a.id === id ? { ...a, resolved: true } : a) } : prev);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setResolving(null); }
  };

  const alerts = alertsPage?.content ?? [];
  const openCount = filter === "OPEN" ? (alertsPage?.totalElements ?? 0) : alerts.filter(a => !a.resolved).length;

  const handleExport = () => {
    exportCsv(`alerts-${filter.toLowerCase()}.csv`,
      ["Type", "Severity", "Meter", "Message", "Status", "Created"],
      alerts.map((a: any) => [
        a.alertType,
        a.severity,
        a.meter?.serialNumber ?? a.meter?.id,
        a.message ?? "",
        a.resolved ? "Resolved" : "Open",
        a.createdAt ? new Date(a.createdAt).toLocaleString() : "",
      ])
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-brand-red">Monitoring</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Alerts</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {alerts.length > 0 && (
            <Button variant="outline" onClick={handleExport} className="h-9 rounded-none px-4 text-xs font-semibold uppercase tracking-wider">
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          )}
          {openCount > 0 && (
            <span className="flex items-center gap-1.5 rounded-none border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">
              <AlertTriangle className="h-3.5 w-3.5" /> {openCount} open
            </span>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="h-9 rounded-none bg-brand-red px-4 text-xs font-semibold uppercase tracking-wider text-white hover:bg-brand-red/90">
                <Plus className="mr-2 h-4 w-4" /> Log Alert
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-none sm:max-w-md">
              <DialogHeader><DialogTitle className="font-display font-semibold">Log New Alert</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Meter</Label>
                  <Select value={form.meterId} onValueChange={v => setForm(f => ({ ...f, meterId: v }))}>
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
                    <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Alert Type</Label>
                    <Select value={form.alertType} onValueChange={v => setForm(f => ({ ...f, alertType: v }))}>
                      <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["LEAK","THEFT","OUTAGE","TAMPER","ANOMALY","LOW_BATTERY","PRESSURE"].map(t => (
                          <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Severity</Label>
                    <Select value={form.severity} onValueChange={v => setForm(f => ({ ...f, severity: v }))}>
                      <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["LOW","MEDIUM","HIGH","CRITICAL"].map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Message (optional)</Label>
                  <Input value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Describe the issue…" className="rounded-none" />
                </div>
                <Button type="submit" disabled={saving || !form.meterId} className="w-full rounded-none bg-brand-red text-white hover:bg-brand-red/90">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log Alert"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {(["OPEN", "RESOLVED", "ALL"] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
              filter === f
                ? "border-b-2 border-brand-red text-brand-red"
                : "text-muted-foreground hover:text-foreground"
            }`}>
            {f}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[600px] rounded-none border border-border bg-card">
        <div className="grid grid-cols-[1fr_100px_1fr_100px_100px] border-b border-border bg-muted px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          <span>Type</span><span>Severity</span><span>Message</span><span>Time</span><span>Action</span>
        </div>
        {loading ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">Loading…</div>
        ) : alerts.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
            <CheckCircle2 className={`h-10 w-10 ${filter === "OPEN" ? "text-emerald-500 opacity-60" : "opacity-20"}`} />
            <div className="text-center">
              {filter === "OPEN" ? (
                <>
                  <p className="font-medium text-emerald-700">All clear — system nominal</p>
                  <p className="mt-1 text-xs">No open alerts. All meters are operating within expected parameters.</p>
                </>
              ) : filter === "RESOLVED" ? (
                <>
                  <p className="font-medium text-foreground">No resolved alerts</p>
                  <p className="mt-1 text-xs">Alerts you resolve will appear here for your records.</p>
                </>
              ) : (
                <>
                  <p className="font-medium text-foreground">No alerts in the system</p>
                  <p className="mt-1 text-xs">Use "Log Alert" above to manually flag a meter issue.</p>
                </>
              )}
            </div>
          </div>
        ) : (
          alerts.map(a => (
            <div key={a.id} className="grid grid-cols-[1fr_100px_1fr_100px_100px] items-center border-b border-border px-4 py-3 text-sm last:border-0 hover:bg-muted/50 transition-colors">
              <div>
                <p className="font-medium">{a.alertType?.replace(/_/g, " ")}</p>
                <p className="text-xs text-muted-foreground">{a.meter?.serialNumber ?? `Meter #${a.meterId ?? "—"}`}</p>
              </div>
              <span className={`inline-block rounded-none px-2 py-0.5 text-[10px] font-semibold uppercase ${SEVERITY_CLS[a.severity] ?? "bg-muted text-muted-foreground"}`}>
                {a.severity}
              </span>
              <span className="text-muted-foreground">{a.message ?? "—"}</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" /> {ago(a.createdAt)}
              </span>
              <div>
                {!a.resolved ? (
                  <Button size="sm" variant="outline"
                    disabled={resolving === a.id}
                    onClick={() => resolve(a.id)}
                    className="h-7 rounded-none px-2 text-[10px] font-semibold uppercase tracking-wider">
                    {resolving === a.id ? "…" : "Resolve"}
                  </Button>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                    <CheckCircle2 className="h-3 w-3" /> Resolved
                  </span>
                )}
              </div>
            </div>
          ))
        )}
        </div>
      </div>
      {alertsPage && <Pagination meta={alertsPage} onPageChange={p => { setPageNum(p); load(p); }} />}
    </div>
  );
}
