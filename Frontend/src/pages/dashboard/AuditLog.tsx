import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";
import { ClipboardList } from "lucide-react";
import Pagination, { PageResponse } from "@/components/dashboard/Pagination";

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

export default function AuditLog() {
  const api = useApi();
  const { toast } = useToast();
  const [page, setPage] = useState<PageResponse<AuditEntry> | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageNum, setPageNum] = useState(0);

  const load = (p = 0) => {
    setLoading(true);
    api.get<PageResponse<AuditEntry>>(`/api/audit?page=${p}&size=50`)
      .then(setPage)
      .catch(err => toast({ title: "Error loading audit log", description: err.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(pageNum); }, [pageNum]);

  const entries = page?.content ?? [];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-brand-red">Security</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Audit Log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A record of all actions performed in this organisation.
        </p>
      </div>

      <div className="rounded-none border border-border bg-card">
        <div className="grid grid-cols-[160px_1fr_120px_1fr_100px] border-b border-border bg-muted px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          <span>Time</span>
          <span>Actor</span>
          <span>Action</span>
          <span>Detail</span>
          <span>IP</span>
        </div>

        {loading ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">Loading…</div>
        ) : entries.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <ClipboardList className="h-8 w-8 opacity-30" />
            No audit events recorded yet.
          </div>
        ) : (
          entries.map(e => (
            <div
              key={e.id}
              className="grid grid-cols-[160px_1fr_120px_1fr_100px] items-start border-b border-border px-4 py-3 text-sm last:border-0 hover:bg-muted/50 transition-colors"
            >
              <span className="text-xs text-muted-foreground tabular-nums">{fmt(e.createdAt)}</span>
              <div>
                <p className="font-medium text-xs">{e.actorEmail}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{e.actorRole?.replace("_", " ")}</p>
              </div>
              <span className={`inline-block self-start rounded-none px-2 py-0.5 text-[10px] font-semibold uppercase ${ACTION_CLS[e.action] ?? "bg-muted text-muted-foreground"}`}>
                {e.action?.replace(/_/g, " ")}
              </span>
              <span className="text-xs text-muted-foreground leading-relaxed">{e.detail ?? "—"}</span>
              <span className="text-xs text-muted-foreground font-mono">{e.ipAddress ?? "—"}</span>
            </div>
          ))
        )}
      </div>

      {page && <Pagination meta={page} onPageChange={p => setPageNum(p)} />}
      <p className="text-xs text-muted-foreground">{page?.totalElements ?? 0} total events</p>
    </div>
  );
}
