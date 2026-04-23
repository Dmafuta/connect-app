import { UserCircle, Gauge, AlertTriangle, CreditCard, Activity, Wrench } from "lucide-react";

const stats = [
  { label: "Customers",     value: "—", icon: UserCircle,    color: "text-brand-red" },
  { label: "Meters",        value: "—", icon: Gauge,         color: "text-blue-500" },
  { label: "Open Alerts",   value: "—", icon: AlertTriangle, color: "text-amber-500" },
  { label: "Revenue (MTD)", value: "—", icon: CreditCard,    color: "text-emerald-500" },
  { label: "Readings Today",value: "—", icon: Activity,      color: "text-purple-500" },
  { label: "Technicians",   value: "—", icon: Wrench,        color: "text-orange-500" },
];

export default function AdminOverview() {
  return (
    <div>
      <div className="mb-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-brand-red">Admin</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Utility Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your customers, meters, and billing.</p>
      </div>

      <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(s => (
          <div key={s.label} className="bg-background p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">{s.label}</p>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className={`mt-3 font-display text-3xl font-semibold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-px grid gap-px bg-border lg:grid-cols-2">
        <div className="bg-background p-6">
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.15em]">Open Alerts</h2>
          <p className="mt-6 text-sm text-muted-foreground">No open alerts.</p>
        </div>
        <div className="bg-background p-6">
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.15em]">Recent Readings</h2>
          <p className="mt-6 text-sm text-muted-foreground">No readings recorded yet.</p>
        </div>
      </div>
    </div>
  );
}
