import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { Gauge, Droplets, Zap, Flame, Activity, TrendingUp, TrendingDown, Minus, Wrench } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";

const TYPE_ICON: Record<string, React.ElementType>  = { WATER: Droplets, ELECTRICITY: Zap, GAS: Flame };
const TYPE_COLOR: Record<string, string> = { WATER: "#3b82f6", ELECTRICITY: "#f59e0b", GAS: "#10b981" };
const STATUS_CLS: Record<string, string> = {
  ACTIVE:   "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-slate-100 text-slate-600",
  FAULTY:   "bg-rose-100 text-rose-700",
};

function ago(iso: string) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
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

  // All readings for a specific meter, oldest-first for charting
  const readingsFor = (meterId: number) =>
    readings
      .filter((r: any) => (r.meter?.id ?? r.meterId) === meterId)
      .sort((a: any, b: any) => new Date(a.readAt).getTime() - new Date(b.readAt).getTime());

  if (loading) return (
    <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Loading…</div>
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-brand-red">My Account</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight">My Meters</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {meters.length === 0 ? "No meters assigned yet." : `${meters.length} meter${meters.length !== 1 ? "s" : ""} on your account.`}
        </p>
      </div>

      {meters.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-none border border-border text-sm text-muted-foreground">
          <Gauge className="h-10 w-10 opacity-20" />
          <div className="text-center">
            <p className="font-medium">No meters assigned</p>
            <p className="text-xs mt-1">Contact your service provider to get started.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {meters.map(m => {
            const Icon   = TYPE_ICON[m.type]  ?? Gauge;
            const color  = TYPE_COLOR[m.type] ?? "#888";
            const mReadings = readingsFor(m.id);
            const last   = mReadings[mReadings.length - 1];
            const prev   = mReadings[mReadings.length - 2];
            const delta  = last && prev ? last.value - prev.value : null;
            const chartData = mReadings.slice(-10).map((r: any, i: number) => ({ i, v: r.value }));

            return (
              <div key={m.id} className="rounded-none border border-border bg-card overflow-hidden">
                {/* Mini sparkline */}
                {chartData.length > 1 && (
                  <div className="h-14 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                        <defs>
                          <linearGradient id={`grad-${m.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Tooltip
                          contentStyle={{ fontSize: 10, border: "1px solid hsl(var(--border))", borderRadius: 0, padding: "2px 8px" }}
                          formatter={(v: any) => [v, "Reading"]}
                          labelFormatter={() => ""}
                        />
                        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
                              fill={`url(#grad-${m.id})`} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="p-5 space-y-4">
                  {/* Header row */}
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
                    <span className={`rounded-none px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_CLS[m.status] ?? ""}`}>
                      {m.status}
                    </span>
                  </div>

                  {/* Last reading */}
                  <div className="border-t border-border pt-4">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Latest Reading</p>
                    {last ? (
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="font-display text-2xl font-semibold">
                            {last.value?.toLocaleString()}
                            <span className="ml-1 text-sm font-normal text-muted-foreground">{last.unit}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{ago(last.readAt)}</p>
                        </div>
                        {/* Delta badge */}
                        {delta !== null && (
                          <div className={`flex items-center gap-1 text-xs font-semibold ${delta > 0 ? "text-amber-600" : delta < 0 ? "text-emerald-600" : "text-muted-foreground"}`}>
                            {delta > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : delta < 0 ? <TrendingDown className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                            {delta > 0 ? "+" : ""}{delta.toFixed(2)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Activity className="h-3.5 w-3.5" /> No readings recorded yet
                      </div>
                    )}
                  </div>

                  {/* Technician */}
                  {m.technician && (
                    <div className="flex items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
                      <Wrench className="h-3.5 w-3.5 shrink-0" />
                      <span>Technician: <span className="font-medium text-foreground">{m.technician.firstName} {m.technician.lastName}</span></span>
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
