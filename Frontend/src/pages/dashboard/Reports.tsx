import { useState, useEffect } from "react";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, BarChart3, Loader2 } from "lucide-react";
import { exportCsv } from "@/lib/exportCsv";

const TYPE_COLOR: Record<string, string> = {
  WATER:       "bg-blue-100 text-blue-700",
  ELECTRICITY: "bg-amber-100 text-amber-700",
  GAS:         "bg-emerald-100 text-emerald-700",
};

export default function Reports() {
  const api = useApi();
  const { toast } = useToast();

  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);

  const [from,    setFrom]    = useState(monthAgo);
  const [to,      setTo]      = useState(today);
  const [rows,    setRows]    = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async (f = from, t = to) => {
    setLoading(true);
    try {
      const data = await api.get<any[]>(`/api/reports/usage?from=${f}&to=${t}`);
      setRows(data);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleFetch = (e: React.FormEvent) => { e.preventDefault(); fetchReport(); };

  useEffect(() => { fetchReport(); }, []);

  const handleExport = () => {
    if (!rows) return;
    exportCsv(
      `usage-report-${from}-to-${to}.csv`,
      ["Meter", "Type", "Location", "Customer", "Readings", "First", "Last", "Consumption", "Unit"],
      rows.map(r => [
        r.serialNumber, r.type, r.location ?? "", r.customerName ?? "",
        r.readingCount, r.firstReading, r.lastReading, r.consumption?.toFixed(2), r.unit ?? "",
      ])
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-brand-red">Analytics</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Usage Report</h1>
        <p className="mt-1 text-sm text-muted-foreground">Consumption summary per meter over a selected date range.</p>
      </div>

      {/* Filter form */}
      <form onSubmit={handleFetch} className="flex flex-wrap items-end gap-4 rounded-none border border-border bg-card p-5">
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">From</Label>
          <Input type="date" value={from} onChange={e => setFrom(e.target.value)} required className="rounded-none w-40" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">To</Label>
          <Input type="date" value={to} onChange={e => setTo(e.target.value)} required className="rounded-none w-40" />
        </div>
        <Button type="submit" disabled={loading} className="rounded-none bg-brand-red text-white hover:bg-brand-red/90 h-10">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><BarChart3 className="mr-2 h-4 w-4" />Generate</>}
        </Button>
        {rows && rows.length > 0 && (
          <Button type="button" onClick={handleExport} variant="outline" className="rounded-none h-10">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        )}
      </form>

      {/* Results */}
      {rows !== null && (
        rows.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground rounded-none border border-border bg-card">
            No readings found for the selected period.
          </div>
        ) : (
          <div className="rounded-none border border-border bg-card">
            <div className="grid grid-cols-[1fr_90px_1fr_1fr_60px_80px_80px_90px] border-b border-border bg-muted px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              <span>Meter</span>
              <span>Type</span>
              <span>Location</span>
              <span>Customer</span>
              <span className="text-right">Rdgs</span>
              <span className="text-right">First</span>
              <span className="text-right">Last</span>
              <span className="text-right">Consumption</span>
            </div>
            {rows.map(r => (
              <div key={r.meterId}
                   className="grid grid-cols-[1fr_90px_1fr_1fr_60px_80px_80px_90px] items-center border-b border-border px-4 py-3 text-sm last:border-0 hover:bg-muted/50 transition-colors">
                <span className="font-medium truncate">{r.serialNumber}</span>
                <span className={`inline-block rounded-none px-2 py-0.5 text-[10px] font-semibold uppercase w-fit ${TYPE_COLOR[r.type] ?? "bg-muted text-muted-foreground"}`}>
                  {r.type}
                </span>
                <span className="truncate text-muted-foreground">{r.location ?? "—"}</span>
                <span className="truncate text-muted-foreground">{r.customerName ?? "—"}</span>
                <span className="text-right tabular-nums">{r.readingCount}</span>
                <span className="text-right tabular-nums">{r.firstReading?.toFixed(2)}</span>
                <span className="text-right tabular-nums">{r.lastReading?.toFixed(2)}</span>
                <span className="text-right tabular-nums font-semibold text-brand-red">
                  {r.consumption?.toFixed(2)} <span className="text-[10px] font-normal text-muted-foreground">{r.unit}</span>
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-border bg-muted/50 px-4 py-2 text-xs text-muted-foreground">
              <span>{rows.length} meter{rows.length !== 1 ? "s" : ""} · {from} to {to}</span>
              <span>Total consumption: <strong className="text-foreground">
                {rows.reduce((s, r) => s + (r.consumption ?? 0), 0).toFixed(2)}
              </strong></span>
            </div>
          </div>
        )
      )}
    </div>
  );
}
