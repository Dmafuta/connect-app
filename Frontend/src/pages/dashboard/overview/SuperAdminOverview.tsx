import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import StatCard from "@/components/dashboard/StatCard";
import {
  Users, Gauge, AlertTriangle, CreditCard, Activity,
  Droplets, Zap, Flame, ArrowRight, CheckCircle2, Clock,
  TrendingUp, Server, ShieldCheck,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const PIE_COLORS = ["#3b82f6", "#f59e0b", "#10b981"];

const SEVERITY_BADGE: Record<string, string> = {
  CRITICAL: "bg-rose-100 text-rose-700",
  HIGH:     "bg-orange-100 text-orange-700",
  MEDIUM:   "bg-amber-100 text-amber-700",
  LOW:      "bg-slate-100 text-slate-600",
};

function ago(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function SuperAdminOverview() {
  const api = useApi();
  const [stats,        setStats]        = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<any>("/api/stats"),
      api.get<any>("/api/mpesa/transactions/all").catch(() => []),
    ]).then(([s, t]) => {
      setStats(s);
      setTransactions(Array.isArray(t) ? t : (t.content ?? []));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
      Loading dashboard…
    </div>
  );

  const meterByType = [
    { name: "Water",       value: stats.waterMeters       ?? 0 },
    { name: "Electricity", value: stats.electricityMeters ?? 0 },
    { name: "Gas",         value: stats.gasMeters         ?? 0 },
  ];

  const recentAlerts   = stats.recentAlerts   ?? [];
  const recentReadings = stats.recentReadings ?? [];

  const readingsBar = recentReadings.slice().reverse().map((r: any, i: number) => ({
    label: `${i + 1}`, v: r.value ?? 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-brand-red">Super Admin</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Platform Overview</h1>
        </div>
        <div className="flex items-center gap-2 rounded-none border border-border px-3 py-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          Live data
        </div>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users"   value={stats.userCount}     sub={`${stats.customerCount} customers`}  accent="text-brand-red"   trend="up" trendValue={`${stats.adminCount} admins, ${stats.technicianCount} techs`} icon={Users} />
        <StatCard label="Active Meters" value={stats.activeMeters}  sub={`of ${stats.totalMeters} total`}     accent="text-blue-600"    trend="up" trendValue="All utilities" icon={Gauge} />
        <StatCard label="Open Alerts"   value={stats.openAlerts}    sub="requiring attention"                 accent={stats.openAlerts > 0 ? "text-rose-600" : "text-emerald-600"} trend={stats.openAlerts > 0 ? "down" : "flat"} icon={AlertTriangle} />
        <StatCard label="Transactions"  value={transactions.length} sub="total payments"                      accent="text-emerald-600" trend="up" trendValue="Mpesa payments" icon={CreditCard} />
      </div>

      {/* Analytics */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.15em] text-foreground">Analytics</h2>
          <span className="text-xs text-muted-foreground">Live</span>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Security */}
          <div className="rounded-none border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-semibold">Security</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Active Users</p>
                <p className="mt-1 font-display text-2xl font-semibold text-foreground">{stats.activeUserCount}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Roles Configured</p>
                <p className="mt-1 font-display text-2xl font-semibold text-foreground">4</p>
              </div>
            </div>
            <div className="mt-3 h-1 w-full rounded-full bg-muted">
              <div className="h-1 rounded-full bg-emerald-500" style={{ width: `${stats.userCount ? (stats.activeUserCount / stats.userCount) * 100 : 0}%` }} />
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">{stats.activeUserCount} of {stats.userCount} accounts active</p>
          </div>

          {/* Meter Health */}
          <div className="rounded-none border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-semibold">Meter Health</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Active</p>
                <p className="mt-1 font-display text-2xl font-semibold text-foreground">{stats.activeMeters}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Faulty</p>
                <p className="mt-1 font-display text-2xl font-semibold text-rose-500">{stats.faultyMeters}</p>
              </div>
            </div>
            <div className="mt-3 h-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={meterByType} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Bar dataKey="value" radius={0}>
                    {meterByType.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Bar>
                  <Tooltip contentStyle={{ fontSize: 11, border: "1px solid hsl(var(--border))", borderRadius: 0 }}
                    labelFormatter={(_, p) => p[0]?.payload?.name ?? ""} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Alerts Activity */}
          <div className="rounded-none border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-brand-red" />
              <span className="text-sm font-semibold">Alerts Activity</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Open</p>
                <p className="mt-1 font-display text-2xl font-semibold text-rose-500">{stats.openAlerts}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Resolved</p>
                <p className="mt-1 font-display text-2xl font-semibold text-emerald-500">{stats.resolvedAlerts}</p>
              </div>
            </div>
            <div className="mt-3 h-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={readingsBar} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Bar dataKey="v" fill="hsl(354 100% 45% / 0.6)" radius={0} />
                  <Tooltip contentStyle={{ fontSize: 11, border: "1px solid hsl(var(--border))", borderRadius: 0 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Meters by type — pie */}
        <div className="rounded-none border border-border bg-card p-5">
          <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-[0.15em]">Meters by Type</h3>
          {stats.totalMeters === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">No meters registered yet.</div>
          ) : (
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={meterByType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={55} strokeWidth={0}>
                    {meterByType.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 11, border: "1px solid hsl(var(--border))", borderRadius: 0 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Recent alerts */}
        <div className="rounded-none border border-border bg-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold uppercase tracking-[0.15em]">Open Alerts</h3>
            <a href="/dashboard/alerts" className="flex items-center gap-1 text-xs text-brand-red hover:underline">
              View all <ArrowRight className="h-3 w-3" />
            </a>
          </div>
          {recentAlerts.length === 0 ? (
            <div className="flex items-center gap-2 rounded-none border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> All clear — no open alerts.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentAlerts.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{a.alertType?.replace("_", " ")}</p>
                    <p className="text-xs text-muted-foreground">{a.message ?? "—"} · {a.meter?.serialNumber ?? `Meter #${a.meter?.id}`}</p>
                  </div>
                  <div className="ml-4 flex shrink-0 items-center gap-3">
                    <span className={`rounded-none px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${SEVERITY_BADGE[a.severity] ?? "bg-muted text-muted-foreground"}`}>
                      {a.severity}
                    </span>
                    <span className="text-xs text-muted-foreground">{ago(a.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transactions + Quick actions */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-none border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold uppercase tracking-[0.15em]">Recent Transactions</h3>
            <a href="/dashboard/transactions" className="flex items-center gap-1 text-xs text-brand-red hover:underline">
              View all <ArrowRight className="h-3 w-3" />
            </a>
          </div>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions recorded yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {transactions.slice(0, 5).map((t: any) => (
                <div key={t.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium">{t.phoneNumber}</p>
                    <p className="text-xs text-muted-foreground">{t.checkoutRequestId?.slice(0, 20)}…</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">KES {t.amount?.toLocaleString()}</p>
                    <span className={`text-[10px] font-semibold uppercase ${t.status === "SUCCESS" ? "text-emerald-600" : t.status === "PENDING" ? "text-amber-600" : "text-rose-600"}`}>
                      {t.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-none border border-border bg-card p-5">
          <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-[0.15em]">Quick Actions</h3>
          <div className="space-y-1">
            {[
              { label: "Add a new customer",    href: "/dashboard/customers",    icon: Users },
              { label: "Register a meter",      href: "/dashboard/meters",       icon: Gauge },
              { label: "Review open alerts",    href: "/dashboard/alerts",       icon: AlertTriangle },
              { label: "View all transactions", href: "/dashboard/transactions", icon: CreditCard },
              { label: "Manage technicians",    href: "/dashboard/technicians",  icon: Server },
              { label: "Audit log",             href: "/dashboard/audit",        icon: ShieldCheck },
            ].map(item => (
              <a key={item.href} href={item.href}
                className="flex items-center justify-between rounded-none px-3 py-2.5 text-sm hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  {item.label}
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
