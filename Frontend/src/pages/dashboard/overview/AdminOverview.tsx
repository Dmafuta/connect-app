import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import StatCard from "@/components/dashboard/StatCard";
import {
  UserCircle, Gauge, AlertTriangle, Receipt,
  Droplets, Zap, Flame, ArrowRight, CheckCircle2, Clock, TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";

function ago(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmt(n: number | string) {
  return `KES ${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const SEVERITY_BADGE: Record<string, string> = {
  CRITICAL: "bg-rose-100 text-rose-700",
  HIGH:     "bg-orange-100 text-orange-700",
  MEDIUM:   "bg-amber-100 text-amber-700",
  LOW:      "bg-slate-100 text-slate-600",
};

export default function AdminOverview() {
  const api = useApi();
  const [stats,          setStats]          = useState<any>(null);
  const [billing,        setBilling]        = useState<any>(null);
  const [recentUnpaid,   setRecentUnpaid]   = useState<any[]>([]);
  const [loading,        setLoading]        = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<any>("/api/stats"),
      api.get<any>("/api/invoices/summary").catch(() => null),
      api.get<any>("/api/invoices?page=0&size=5&status=UNPAID").catch(() => null),
    ]).then(([s, b, unpaid]) => {
      setStats(s);
      setBilling(b);
      setRecentUnpaid(unpaid?.content ?? []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Loading…</div>;

  const recentAlerts = stats.recentAlerts ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-brand-red">Admin</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Utility Dashboard</h1>
        </div>
        <div className="flex items-center gap-2 rounded-none border border-border px-3 py-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" /> Live
        </div>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Customers"     value={stats.customerCount} sub="registered accounts"      accent="text-brand-red"   icon={UserCircle} />
        <StatCard label="Active Meters" value={stats.activeMeters}  sub={`${stats.totalMeters} total`} accent="text-blue-600" icon={Gauge} />
        <StatCard label="Open Alerts"   value={stats.openAlerts}    sub="unresolved"                accent={stats.openAlerts > 0 ? "text-rose-600" : "text-emerald-600"} icon={AlertTriangle} />
        <StatCard label="Unpaid Invoices" value={billing?.unpaidCount ?? "—"} sub={billing ? fmt(billing.unpaidAmount) : "loading…"} accent={billing?.unpaidCount > 0 ? "text-amber-600" : "text-emerald-600"} icon={Receipt} />
      </div>

      {/* Billing summary */}
      {billing && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-none border border-amber-200 bg-card p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Outstanding</p>
            <p className="mt-1 font-display text-xl font-semibold text-amber-600">{fmt(billing.unpaidAmount)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{billing.unpaidCount} unpaid invoice{billing.unpaidCount !== 1 ? "s" : ""}</p>
          </div>
          <div className="rounded-none border border-emerald-200 bg-card p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Collected</p>
            <p className="mt-1 font-display text-xl font-semibold text-emerald-600">{fmt(billing.paidAmount)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{billing.paidCount} paid invoice{billing.paidCount !== 1 ? "s" : ""}</p>
          </div>
          <div className="rounded-none border border-border bg-card p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Collection Rate</p>
            <p className="mt-1 font-display text-xl font-semibold">
              {(billing.paidAmount + billing.unpaidAmount) > 0
                ? `${((billing.paidAmount / (billing.paidAmount + billing.unpaidAmount)) * 100).toFixed(1)}%`
                : "—"}
            </p>
            <div className="mt-2 h-1.5 w-full bg-muted rounded-none">
              <div className="h-1.5 bg-emerald-500 rounded-none"
                style={{ width: `${(billing.paidAmount + billing.unpaidAmount) > 0 ? (billing.paidAmount / (billing.paidAmount + billing.unpaidAmount)) * 100 : 0}%` }} />
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Meters by type */}
        <div className="rounded-none border border-border bg-card p-5">
          <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-[0.15em]">Meters by Type</h3>
          <div className="space-y-3">
            {[
              { type: "WATER",       label: "Water",       count: stats.waterMeters,       color: "#3b82f6", icon: Droplets },
              { type: "ELECTRICITY", label: "Electricity", count: stats.electricityMeters, color: "#f59e0b", icon: Zap },
              { type: "GAS",         label: "Gas",         count: stats.gasMeters,         color: "#10b981", icon: Flame },
            ].map(({ label, count, color, icon: Icon }) => {
              const pct = stats.totalMeters ? (count / stats.totalMeters) * 100 : 0;
              return (
                <div key={label}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <Icon className="h-3.5 w-3.5" style={{ color }} />
                      <span>{label}</span>
                    </div>
                    <span className="font-semibold">{count}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted">
                    <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Open alerts */}
        <div className="rounded-none border border-border bg-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold uppercase tracking-[0.15em]">Open Alerts</h3>
            <Link to="/dashboard/alerts" className="flex items-center gap-1 text-xs text-brand-red hover:underline">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recentAlerts.length === 0 ? (
            <div className="flex items-center gap-2 rounded-none border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> No open alerts — system nominal.
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
                    <span className={`rounded-none px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${SEVERITY_BADGE[a.severity] ?? ""}`}>
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

      {/* Recent unpaid invoices + Quick actions */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-none border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold uppercase tracking-[0.15em]">Unpaid Invoices</h3>
            <Link to="/dashboard/invoices?status=UNPAID" className="flex items-center gap-1 text-xs text-brand-red hover:underline">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recentUnpaid.length === 0 ? (
            <div className="flex items-center gap-2 rounded-none border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> No outstanding invoices.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentUnpaid.map((inv: any) => {
                const overdue = inv.dueAt < new Date().toISOString().slice(0, 10);
                return (
                  <div key={inv.id} className="flex items-center justify-between py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {inv.customer ? `${inv.customer.firstName} ${inv.customer.lastName}`.trim() || inv.customer.email : "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">#{inv.id} · {inv.meter?.serialNumber}</p>
                    </div>
                    <div className="ml-4 shrink-0 text-right">
                      <p className="text-sm font-semibold">{fmt(inv.amount)}</p>
                      <p className={`text-[10px] font-medium ${overdue ? "text-rose-600" : "text-muted-foreground"}`}>
                        {overdue ? "Overdue" : `Due ${inv.dueAt}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="rounded-none border border-border bg-card p-5">
          <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-[0.15em]">Quick Actions</h3>
          <div className="grid gap-1 sm:grid-cols-1">
            {[
              { label: "Add a new customer", href: "/dashboard/customers",   icon: UserCircle },
              { label: "Register a meter",   href: "/dashboard/meters",      icon: Gauge },
              { label: "Review alerts",      href: "/dashboard/alerts",      icon: AlertTriangle },
              { label: "View invoices",      href: "/dashboard/invoices",    icon: Receipt },
              { label: "Revenue reports",    href: "/dashboard/reports",     icon: TrendingUp },
            ].map(item => (
              <Link key={item.href} to={item.href}
                className="flex items-center justify-between rounded-none px-3 py-2.5 text-sm hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  {item.label}
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
