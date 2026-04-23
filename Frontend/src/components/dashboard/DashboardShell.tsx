import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth, UserRole } from "@/context/AuthContext";
import {
  LayoutDashboard, Users, Gauge, Activity, AlertTriangle,
  CreditCard, Settings, LogOut, Menu, X, ChevronRight,
  Wrench, UserCircle, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const NAV: NavItem[] = [
  { label: "Overview",      href: "/dashboard",               icon: LayoutDashboard, roles: ["SUPER_ADMIN","ADMIN","TECHNICIAN","CUSTOMER"] },
  { label: "Users",         href: "/dashboard/users",         icon: Users,           roles: ["SUPER_ADMIN"] },
  { label: "Customers",     href: "/dashboard/customers",     icon: UserCircle,      roles: ["SUPER_ADMIN","ADMIN"] },
  { label: "Technicians",   href: "/dashboard/technicians",   icon: Wrench,          roles: ["SUPER_ADMIN","ADMIN"] },
  { label: "Meters",        href: "/dashboard/meters",        icon: Gauge,           roles: ["SUPER_ADMIN","ADMIN","TECHNICIAN"] },
  { label: "Readings",      href: "/dashboard/readings",      icon: Activity,        roles: ["SUPER_ADMIN","ADMIN","TECHNICIAN","CUSTOMER"] },
  { label: "Alerts",        href: "/dashboard/alerts",        icon: AlertTriangle,   roles: ["SUPER_ADMIN","ADMIN","TECHNICIAN"] },
  { label: "Transactions",  href: "/dashboard/transactions",  icon: CreditCard,      roles: ["SUPER_ADMIN","ADMIN","CUSTOMER"] },
  { label: "My Meters",     href: "/dashboard/my-meters",     icon: Zap,             roles: ["CUSTOMER"] },
  { label: "Settings",      href: "/dashboard/settings",      icon: Settings,        roles: ["SUPER_ADMIN","ADMIN"] },
];

const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN:       "Admin",
  TECHNICIAN:  "Technician",
  CUSTOMER:    "Customer",
};

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const visibleNav = NAV.filter(n => user && n.roles.includes(user.role));

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const Sidebar = () => (
    <aside className={cn(
      "flex h-full w-64 flex-col border-r border-border bg-brand-black text-primary-foreground",
    )}>
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-primary-foreground/10 px-6">
        <span className="relative flex h-7 w-7 items-center justify-center">
          <span className="absolute inset-0 rounded-full border-2 border-primary-foreground" />
          <span className="absolute inset-1.5 rounded-full border-2 border-brand-red" />
        </span>
        <span className="font-display text-sm font-semibold tracking-tight">QuantumConnect</span>
      </div>

      {/* Role badge */}
      <div className="px-6 py-4">
        <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-primary-foreground/40">
          {user?.role ? ROLE_LABELS[user.role] : ""}
        </p>
        <p className="mt-0.5 truncate text-sm font-medium text-primary-foreground/90">
          {user?.fullName || user?.email}
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {visibleNav.map(item => {
          const active = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-none px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-brand-red text-primary-foreground"
                  : "text-primary-foreground/60 hover:bg-primary-foreground/8 hover:text-primary-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
              {active && <ChevronRight className="ml-auto h-3 w-3" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-primary-foreground/10 p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-primary-foreground/60 hover:text-brand-red transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-col">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {open && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative z-50 flex h-full flex-col">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="flex h-16 items-center justify-between border-b border-border px-4 md:hidden">
          <button onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-display text-sm font-semibold">QuantumConnect</span>
          <div className="w-5" />
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
