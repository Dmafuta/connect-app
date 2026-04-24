import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";
import { Search, Users as UsersIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

const ROLE_CLS: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-700",
  ADMIN:       "bg-blue-100 text-blue-700",
  TECHNICIAN:  "bg-amber-100 text-amber-700",
  CUSTOMER:    "bg-slate-100 text-slate-600",
};

type RoleFilter = "ALL" | "SUPER_ADMIN" | "ADMIN" | "TECHNICIAN" | "CUSTOMER";

export default function Users() {
  const api = useApi();
  const { toast } = useToast();
  const [users,   setUsers]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [role,    setRole]    = useState<RoleFilter>("ALL");

  useEffect(() => {
    api.get<any[]>("/api/users").then(setUsers).catch(err => {
      toast({ title: "Error loading users", description: err.message, variant: "destructive" });
    }).finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u => {
    const matchRole   = role === "ALL" || u.role === role;
    const matchSearch = `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-brand-red">Platform</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight">All Users</h1>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…" className="rounded-none pl-9" />
        </div>
        <div className="flex items-center gap-1 border-b border-border sm:border-b-0">
          {(["ALL", "SUPER_ADMIN", "ADMIN", "TECHNICIAN", "CUSTOMER"] as RoleFilter[]).map(r => (
            <button key={r} onClick={() => setRole(r)}
              className={`px-3 py-2 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                role === r
                  ? "border-b-2 border-brand-red text-brand-red sm:border-b-0 sm:bg-brand-red sm:text-white sm:rounded-none sm:px-3"
                  : "text-muted-foreground hover:text-foreground"
              }`}>
              {r === "ALL" ? "All" : r.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-none border border-border bg-card">
        <div className="grid grid-cols-[1fr_1fr_120px_80px] border-b border-border bg-muted px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          <span>Name</span><span>Email</span><span>Role</span><span>Status</span>
        </div>
        {loading ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <UsersIcon className="h-8 w-8 opacity-30" />
            No users found.
          </div>
        ) : (
          filtered.map(u => (
            <div key={u.id} className="grid grid-cols-[1fr_1fr_120px_80px] items-center border-b border-border px-4 py-3 text-sm last:border-0 hover:bg-muted/50 transition-colors">
              <span className="font-medium">{u.firstName} {u.lastName}</span>
              <span className="text-muted-foreground">{u.email}</span>
              <span className={`inline-block rounded-none px-2 py-0.5 text-[10px] font-semibold uppercase ${ROLE_CLS[u.role] ?? "bg-muted text-muted-foreground"}`}>
                {u.role?.replace("_", " ")}
              </span>
              <span className={`text-[10px] font-semibold uppercase ${u.active ? "text-emerald-600" : "text-rose-600"}`}>
                {u.active ? "Active" : "Inactive"}
              </span>
            </div>
          ))
        )}
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} of {users.length} users shown</p>
    </div>
  );
}
