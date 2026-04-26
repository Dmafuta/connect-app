import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import StatCard from "@/components/dashboard/StatCard";
import { Gauge, AlertTriangle, Activity, CheckCircle2, ArrowRight, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const SEVERITY_BADGE: Record<string, string> = {
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

export default function TechnicianOverview() {
  const api  = useApi();
  const { user } = useAuth();
  const [stats,   setStats]   = useState<any>(null);
  const [meters,  setMeters]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<any>("/api/stats"),
      api.get<any[]>("/api/meters/assigned"),
    ]).then(([s, m]) => { setStats(s); setMeters(m); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Loading…</div>;

  const recentAlerts = stats.recentAlerts ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-brand-red">Technician</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Field Dashboard</h1>
        </div>
        <div className="flex items-center gap-2 rounded-none border border-border px-3 py-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" /> Live
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="My Meters"    value={meters.length}                                          sub="assigned to me"    accent="text-blue-600"    icon={Gauge} />
        <StatCard label="Active"       value={meters.filter(m => m.status === "ACTIVE").length}       sub="running"           accent="text-emerald-600" icon={Activity} />
        <StatCard label="Open Alerts"  value={stats.openAlerts}                                       sub="need resolution"   accent={stats.openAlerts > 0 ? "text-rose-600" : "text-emerald-600"} icon={AlertTriangle} />
        <StatCard label="Resolved"     value={stats.resolvedAlerts}                                   sub="all time"          accent="text-brand-red"   icon={CheckCircle2} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Open alerts */}
        <div className="rounded-none border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold uppercase tracking-[0.15em]">Open Alerts</h3>
            <a href="/dashboard/alerts" className="flex items-center gap-1 text-xs text-brand-red hover:underline">
              View all <ArrowRight className="h-3 w-3" />
            </a>
          </div>
          {recentAlerts.length === 0 ? (
            <div className="flex items-center gap-2 rounded-none border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> No open alerts.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentAlerts.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{a.alertType?.replace("_", " ")}</p>
                    <p className="text-xs text-muted-foreground">{a.meter?.serialNumber ?? `Meter #${a.meter?.id}`} · {ago(a.createdAt)}</p>
                  </div>
                  <span className={`ml-2 shrink-0 rounded-none px-2 py-0.5 text-[10px] font-semibold uppercase ${SEVERITY_BADGE[a.severity] ?? ""}`}>
                    {a.severity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assigned meters */}
        <div className="rounded-none border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold uppercase tracking-[0.15em]">My Meters</h3>
            <a href="/dashboard/my-assignments" className="flex items-center gap-1 text-xs text-brand-red hover:underline">
              View all <ArrowRight className="h-3 w-3" />
            </a>
          </div>
          {meters.length === 0 ? (
            <p className="text-sm text-muted-foreground">No meters assigned to you yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {meters.slice(0, 6).map((m: any) => (
                <div key={m.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium">{m.serialNumber}</p>
                    <p className="text-xs text-muted-foreground">{m.type} · {m.location ?? "No location"}</p>
                  </div>
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-none ${m.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : m.status === "FAULTY" ? "bg-rose-100 text-rose-700" : "bg-muted text-muted-foreground"}`}>
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Log reading CTA */}
      <div className="rounded-none border border-brand-red/20 bg-brand-red/5 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-sm font-semibold">Log a Manual Reading</h3>
            <p className="mt-1 text-xs text-muted-foreground">Record a meter reading from the field.</p>
          </div>
          <a href="/dashboard/readings"
            className="flex items-center gap-2 rounded-none bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-brand-red/90">
            Log Reading <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
