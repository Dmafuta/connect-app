import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import StatCard from "@/components/dashboard/StatCard";
import { useAuth } from "@/context/AuthContext";
import { Gauge, Activity, CreditCard, AlertTriangle, ArrowRight, CheckCircle2, Droplets, Zap, Flame } from "lucide-react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const TYPE_ICON: Record<string, React.ElementType> = { WATER: Droplets, ELECTRICITY: Zap, GAS: Flame };
const TYPE_COLOR: Record<string, string> = { WATER: "#3b82f6", ELECTRICITY: "#f59e0b", GAS: "#10b981" };

export default function CustomerOverview() {
  const { user }  = useAuth();
  const api       = useApi();
  const [meters,  setMeters]  = useState<any[]>([]);
  const [readings,setReadings]= useState<any[]>([]);
  const [txns,    setTxns]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<any[]>("/api/meters/my"),
      api.get<any[]>("/api/readings/my"),
      api.get<any[]>(`/api/mpesa/transactions/user/${user?.email}`).catch(() => []),
    ]).then(([m, r, t]) => { setMeters(m); setReadings(r); setTxns(t as any[]); })
      .finally(() => setLoading(false));
  }, []);

  const lastReading = readings[0];
  const pendingBill = txns.find(t => t.status === "PENDING");

  const chartData = readings.slice(0, 14).reverse().map((r: any, i: number) => ({
    name: `${i+1}`, v: r.value,
  }));

  // Per-meter consumption: last reading minus first reading per meter
  const meterConsumption = meters.map((m: any) => {
    const mReadings = readings.filter((r: any) => r.meter?.id === m.id || r.meter?.serialNumber === m.serialNumber);
    const sorted = [...mReadings].sort((a: any, b: any) => new Date(a.readAt).getTime() - new Date(b.readAt).getTime());
    const first = sorted[0]?.value ?? null;
    const last  = sorted[sorted.length - 1]?.value ?? null;
    return { ...m, first, last, consumption: first !== null && last !== null ? last - first : null, readingCount: sorted.length };
  });

  if (loading) return <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-brand-red">Customer Portal</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Welcome{user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}.
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Your utility usage and billing at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="My Meters"       value={meters.length}                    sub="registered"           accent="text-brand-red"    icon={Gauge} />
        <StatCard label="Latest Reading"  value={lastReading ? lastReading.value : "—"} sub={lastReading?.unit ?? "no data"} accent="text-blue-600" icon={Activity} />
        <StatCard label="Payments Made"   value={txns.filter(t=>t.status==="SUCCESS").length} sub="successful"   accent="text-emerald-600"  icon={CreditCard} />
        <StatCard label="Active Alerts"   value={0}                                sub="on your account"      accent="text-amber-600"    icon={AlertTriangle} />
      </div>

      {/* Consumption chart */}
      <div className="rounded-none border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold uppercase tracking-[0.15em]">Consumption History</h3>
          <Link to="/dashboard/readings" className="flex items-center gap-1 text-xs text-brand-red hover:underline">
            Full history <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {chartData.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            No readings available yet.
          </div>
        ) : (
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="custGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#e8002e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#e8002e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: 11, border: "1px solid hsl(var(--border))", borderRadius: 0 }} />
                <Area type="monotone" dataKey="v" stroke="#e8002e" strokeWidth={1.5} fill="url(#custGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Per-meter consumption breakdown */}
      {meterConsumption.length > 0 && (
        <div className="rounded-none border border-border bg-card p-5">
          <h3 className="font-display text-sm font-semibold uppercase tracking-[0.15em] mb-4">Consumption by Meter</h3>
          <div className="divide-y divide-border">
            {meterConsumption.map((m: any) => {
              const Icon  = TYPE_ICON[m.type]  ?? Gauge;
              const color = TYPE_COLOR[m.type] ?? "#888";
              return (
                <div key={m.id} className="flex items-center gap-4 py-3">
                  <Icon className="h-5 w-5 shrink-0" style={{ color }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{m.serialNumber}</p>
                    <p className="text-xs text-muted-foreground">{m.readingCount} readings</p>
                  </div>
                  <div className="text-right">
                    {m.consumption !== null ? (
                      <>
                        <p className="text-sm font-semibold">{m.consumption.toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">total consumption</p>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">No readings</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* My meters */}
        <div className="rounded-none border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold uppercase tracking-[0.15em]">My Meters</h3>
            <Link to="/dashboard/my-meters" className="flex items-center gap-1 text-xs text-brand-red hover:underline">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {meters.length === 0 ? (
            <p className="text-sm text-muted-foreground">No meters assigned to your account yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {meters.map((m: any) => {
                const Icon  = TYPE_ICON[m.type]  ?? Gauge;
                const color = TYPE_COLOR[m.type] ?? "#888";
                return (
                  <div key={m.id} className="flex items-center gap-3 py-3">
                    <Icon className="h-5 w-5 shrink-0" style={{ color }} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{m.serialNumber}</p>
                      <p className="text-xs text-muted-foreground">{m.location ?? "Location not set"}</p>
                    </div>
                    <span className={`shrink-0 rounded-none px-2 py-0.5 text-[10px] font-semibold uppercase ${m.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                      {m.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent payments */}
        <div className="rounded-none border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold uppercase tracking-[0.15em]">Recent Payments</h3>
            <Link to="/dashboard/transactions" className="flex items-center gap-1 text-xs text-brand-red hover:underline">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {txns.length === 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">No payments made yet.</p>
              <Link to="/dashboard/transactions">
                <Button className="h-9 w-full rounded-none bg-brand-red text-xs font-semibold uppercase tracking-wider text-white hover:bg-brand-red/90">
                  Pay Bill via Mpesa
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {txns.slice(0, 5).map((t: any) => (
                <div key={t.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium">KES {t.amount?.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{t.mpesaReceiptNumber ?? t.checkoutRequestId?.slice(0,16)}</p>
                  </div>
                  <span className={`text-[10px] font-semibold uppercase ${t.status === "SUCCESS" ? "text-emerald-600" : t.status === "PENDING" ? "text-amber-600" : "text-rose-600"}`}>
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
