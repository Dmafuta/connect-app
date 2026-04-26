import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";
import { ClipboardList, Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import Pagination, { PageResponse } from "@/components/dashboard/Pagination";
import { exportCsv } from "@/lib/exportCsv";

interface AuditEntry {
  id: number;
  actorEmail: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  detail: string;
  ipAddress: string;
  createdAt: string;
}

const ACTION_CLS: Record<string, string> = {
  USER_CREATED:              "bg-blue-100 text-blue-700",
  USER_UPDATED:              "bg-sky-100 text-sky-700",
  USER_ACTIVATED:            "bg-emerald-100 text-emerald-700",
  USER_DEACTIVATED:          "bg-rose-100 text-rose-700",
  METER_CREATED:             "bg-violet-100 text-violet-700",
  METER_UPDATED:             "bg-purple-100 text-purple-700",
  METER_DELETED:             "bg-red-100 text-red-700",
  READING_LOGGED:            "bg-amber-100 text-amber-700",
  ALERT_CREATED:             "bg-orange-100 text-orange-700",
  ALERT_RESOLVED:            "bg-teal-100 text-teal-700",
  TENANT_CREATED:            "bg-indigo-100 text-indigo-700",
  TENANT_UPDATED:            "bg-cyan-100 text-cyan-700",
  PASSWORD_CHANGED:          "bg-slate-100 text-slate-600",
  PASSWORD_RESET_REQUESTED:  "bg-slate-100 text-slate-600",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric", month: "short", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

const ACTION_GROUPS = [
  "USER_CREATED", "USER_UPDATED", "USER_ACTIVATED", "USER_DEACTIVATED", "USER_DELETED", "USER_RESTORED",
  "METER_CREATED", "METER_UPDATED", "METER_DELETED",
  "READING_LOGGED",
  "ALERT_CREATED", "ALERT_RESOLVED",
  "TENANT_CREATED", "TENANT_UPDATED",
  "PASSWORD_CHANGED", "PASSWORD_RESET_REQUESTED",
];

export default function AuditLog() {
  const api = useApi();
  const { toast } = useToast();
  const [page, setPage]           = useState<PageResponse<AuditEntry> | null>(null);
  const [loading, setLoading]     = useState(true);
  const [pageNum, setPageNum]     = useState(0);
  const [search, setSearch]       = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");

  const load = (p = 0) => {
    setLoading(true);
    api.get<PageResponse<AuditEntry>>(`/api/audit?page=${p}&size=50`)
      .then(setPage)
      .catch(err => toast({ title: "Error loading audit log", description: err.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(pageNum); }, [pageNum]);

  const entries = page?.content ?? [];

  const filtered = entries.filter(e => {
    const matchAction = actionFilter === "ALL" || e.action === actionFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || e.actorEmail?.toLowerCase().includes(q) || e.detail?.toLowerCase().includes(q);
    return matchAction && matchSearch;
  });

  const handleExport = () => {
    exportCsv("audit-log.csv",
      ["Time", "Actor", "Role", "Action", "Detail", "IP"],
      filtered.map(e => [fmt(e.createdAt), e.actorEmail, e.actorRole, e.action, e.detail ?? "", e.ipAddress ?? ""])
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-brand-red">Security</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Audit Log</h1>
          <p className="mt-1 text-sm text-muted-foreground">A record of all actions performed in this organisation.</p>
        </div>
        {filtered.length > 0 && (
          <Button variant="outline" onClick={handleExport} className="h-9 rounded-none px-4 text-xs font-semibold uppercase tracking-wider">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by actor or detail…" className="rounded-none pl-9" />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="rounded-none w-52">
            <SelectValue placeholder="All actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All actions</SelectItem>
            {ACTION_GROUPS.map(a => (
              <SelectItem key={a} value={a}>{a.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-none border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted">
              <TableHead className="text-[10px] font-semibold uppercase tracking-[0.15em] w-44">Time</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-[0.15em]">Actor</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-[0.15em] w-36">Action</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-[0.15em]">Detail</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-[0.15em] w-28">IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="h-32 text-center text-sm text-muted-foreground">Loading…</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                    <ClipboardList className="h-8 w-8 opacity-30" />
                    {search || actionFilter !== "ALL" ? "No events match your filters." : "No audit events recorded yet."}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="text-xs text-muted-foreground tabular-nums">{fmt(e.createdAt)}</TableCell>
                  <TableCell>
                    <p className="font-medium text-xs">{e.actorEmail}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{e.actorRole?.replace("_", " ")}</p>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-block rounded-none px-2 py-0.5 text-[10px] font-semibold uppercase ${ACTION_CLS[e.action] ?? "bg-muted text-muted-foreground"}`}>
                      {e.action?.replace(/_/g, " ")}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{e.detail ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">{e.ipAddress ?? "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {page && <Pagination meta={page} onPageChange={p => setPageNum(p)} />}
      <p className="text-xs text-muted-foreground">{page?.totalElements ?? 0} total events</p>
    </div>
  );
}
