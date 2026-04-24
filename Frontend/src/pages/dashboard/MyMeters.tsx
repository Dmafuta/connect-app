import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { Gauge, Droplets, Zap, Flame, Activity } from "lucide-react";

const TYPE_ICON: Record<string, React.ElementType>  = { WATER: Droplets, ELECTRICITY: Zap, GAS: Flame };
const TYPE_COLOR: Record<string, string> = { WATER: "#3b82f6", ELECTRICITY: "#f59e0b", GAS: "#10b981" };

function ago(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

export default function MyMeters() {
  const api = useApi();
  const [meters,   setMeters]   = useState<any[]>([]);
  const [readings, setReadings] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<any[]>("/api/meters/my"),
      api.get<any[]>("/api/readings/my").catch(() => []),
    ]).then(([m, r]) => { setMeters(m); setReadings(r); }).finally(() => setLoading(false));
  }, []);

  const lastReadingFor = (meterId: number) =>
    readings.filter((r: any) => (r.meter?.id ?? r.meterId) === meterId)[0];

  if (loading) return <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-brand-red">My Account</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight">My Meters</h1>
      </div>

      {meters.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-none border border-border text-sm text-muted-foreground">
          <Gauge className="h-8 w-8 opacity-30" />
          No meters assigned to your account yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {meters.map(m => {
            const Icon  = TYPE_ICON[m.type]  ?? Gauge;
            const color = TYPE_COLOR[m.type] ?? "#888";
            const last  = lastReadingFor(m.id);
            return (
              <div key={m.id} className="rounded-none border border-border bg-card p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="rounded-none border border-border p-2" style={{ color }}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-semibold text-sm">{m.serialNumber}</p>
                      <p className="text-xs text-muted-foreground">{m.location ?? "Location not set"}</p>
                    </div>
                  </div>
                  <span className={`rounded-none px-2 py-0.5 text-[10px] font-semibold uppercase ${m.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                    {m.status}
                  </span>
                </div>

                <div className="border-t border-border pt-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Last Reading</p>
                  {last ? (
                    <div className="mt-1 flex items-end justify-between">
                      <div>
                        <p className="font-display text-2xl font-semibold text-foreground">{last.value?.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{last.unit}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{ago(last.readingDate ?? last.createdAt)}</p>
                    </div>
                  ) : (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Activity className="h-3.5 w-3.5" /> No readings yet
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
