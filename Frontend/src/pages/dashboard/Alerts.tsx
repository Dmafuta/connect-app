import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle2, Clock, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("OPEN");
  const [resolving, setResolving] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    api.get<any[]>("/api/alerts").then(setAlerts).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const resolve = async (id: number) => {
    setResolving(id);
    try {
      await api.patch(`/api/alerts/${id}/resolve`, {});
      toast({ title: "Alert resolved" });
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a));
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setResolving(null); }
  };

  const filtered = alerts.filter(a =>
    filter === "ALL" ? true : filter === "OPEN" ? !a.resolved : a.resolved
  );

  const openCount = alerts.filter(a => !a.resolved).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-brand-red">Monitoring</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Alerts</h1>
        </div>
        {openCount > 0 && (
          <span className="flex items-center gap-1.5 rounded-none border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">
            <AlertTriangle className="h-3.5 w-3.5" /> {openCount} open
          </span>
        )}
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

      <div className="rounded-none border border-border bg-card">
        <div className="grid grid-cols-[1fr_100px_1fr_100px_100px] border-b border-border bg-muted px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          <span>Type</span><span>Severity</span><span>Message</span><span>Time</span><span>Action</span>
        </div>
        {loading ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 opacity-30" />
            {filter === "OPEN" ? "No open alerts — system nominal." : "No alerts found."}
          </div>
        ) : (
          filtered.map(a => (
            <div key={a.id} className="grid grid-cols-[1fr_100px_1fr_100px_100px] items-center border-b border-border px-4 py-3 text-sm last:border-0 hover:bg-muted/50 transition-colors">
              <div>
                <p className="font-medium">{a.alertType?.replace(/_/g, " ")}</p>
                <p className="text-xs text-muted-foreground">Meter #{a.meter?.id ?? a.meterId ?? "—"}</p>
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
  );
}
