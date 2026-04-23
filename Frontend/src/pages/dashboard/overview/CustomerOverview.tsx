import { Gauge, Activity, CreditCard, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const stats = [
  { label: "My Meters",        value: "—", icon: Gauge,         color: "text-brand-red" },
  { label: "Last Reading",     value: "—", icon: Activity,      color: "text-blue-500" },
  { label: "Outstanding Bill", value: "—", icon: CreditCard,    color: "text-emerald-500" },
  { label: "Active Alerts",    value: "—", icon: AlertTriangle, color: "text-amber-500" },
];

export default function CustomerOverview() {
  const { user } = useAuth();
  return (
    <div>
      <div className="mb-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-brand-red">Customer Portal</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Welcome{user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}.
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Your utility usage and billing at a glance.</p>
      </div>

      <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
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
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.15em]">Recent Consumption</h2>
          <p className="mt-6 text-sm text-muted-foreground">No readings available yet.</p>
        </div>
        <div className="bg-background p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold uppercase tracking-[0.15em]">Latest Bill</h2>
            <Link to="/dashboard/transactions">
              <Button variant="outline" className="h-8 rounded-none text-xs">Pay via Mpesa</Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">No bills generated yet.</p>
        </div>
      </div>
    </div>
  );
}
