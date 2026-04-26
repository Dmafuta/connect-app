import { useState, useEffect } from "react";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Download, BarChart3, Loader2, TrendingUp, Users, Clock } from "lucide-react";
import { exportCsv } from "@/lib/exportCsv";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const TYPE_COLOR: Record<string, string> = {
  WATER:       "bg-blue-100 text-blue-700",
  ELECTRICITY: "bg-amber-100 text-amber-700",
  GAS:         "bg-emerald-100 text-emerald-700",
};

const AGING_COLOR: Record<string, string> = {
  current:    "border-emerald-300 text-emerald-700",
  days1_30:   "border-amber-300 text-amber-700",
  days31_60:  "border-orange-300 text-orange-700",
  days60plus: "border-rose-400 text-rose-700",
};

function fmt(n: number | string) {
  return `KES ${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function shortMonth(yyyymm: string) {
  const [y, m] = yyyymm.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleString("default", { month: "short", year: "2-digit" });
}

export default function Reports() {
  const api = useApi();
  const { toast } = useToast();

  const today    = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);

  const [from, setFrom] = useState(monthAgo);
  const [to,   setTo]   = useState(today);

  // Usage tab
  const [usageRows,    setUsageRows]    = useState<any[] | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);

  // Revenue tab
  const [revenueData,    setRevenueData]    = useState<any[] | null>(null);
  const [revenueLoading, setRevenueLoading] = useState(false);

  // Top consumers tab
  const [consumersData,    setConsumersData]    = useState<any[] | null>(null);
  const [consumersLoading, setConsumersLoading] = useState(false);

  // Invoice aging tab
  const [agingData,    setAgingData]    = useState<any[] | null>(null);
  const [agingLoading, setAgingLoading] = useState(false);

  // Load usage on mount
  useEffect(() => { fetchUsage(); }, []);

  const fetchUsage = async (f = from, t = to) => {
    setUsageLoading(true);
    try {
      setUsageRows(await api.get<any[]>(`/api/reports/usage?from=${f}&to=${t}`));
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setUsageLoading(false); }
  };

  const fetchRevenue = async () => {
    setRevenueLoading(true);
    try {
      setRevenueData(await api.get<any[]>("/api/reports/revenue?months=12"));
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setRevenueLoading(false); }
  };

  const fetchConsumers = async (f = from, t = to) => {
    setConsumersLoading(true);
    try {
      setConsumersData(await api.get<any[]>(`/api/reports/top-consumers?from=${f}&to=${t}&limit=10`));
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setConsumersLoading(false); }
  };

  const fetchAging = async () => {
    setAgingLoading(true);
    try {
      setAgingData(await api.get<any[]>("/api/reports/invoice-aging"));
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setAgingLoading(false); }
  };

  const handleDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsage();
    fetchConsumers();
  };

  // ── Date filter bar (shared for Usage + Top Consumers) ─────────────────────
  const DateFilter = () => (
    <form onSubmit={handleDateSubmit}
      className="flex flex-wrap items-end gap-4 rounded-none border border-border bg-card p-4">
      <div className="space-y-1.5">
        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">From</Label>
        <Input type="date" value={from} onChange={e => setFrom(e.target.value)} required className="rounded-none w-40" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">To</Label>
        <Input type="date" value={to} onChange={e => setTo(e.target.value)} required className="rounded-none w-40" />
      </div>
      <Button type="submit" className="rounded-none bg-brand-red text-white hover:bg-brand-red/90 h-10">
        <BarChart3 className="mr-2 h-4 w-4" /> Apply
      </Button>
    </form>
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-brand-red">Analytics</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">Usage, revenue, and billing analytics for your organisation.</p>
      </div>

      <Tabs defaultValue="usage" onValueChange={tab => {
        if (tab === "revenue"   && !revenueData)   fetchRevenue();
        if (tab === "consumers" && !consumersData)  fetchConsumers();
        if (tab === "aging"     && !agingData)      fetchAging();
      }}>
        <TabsList className="rounded-none h-9 bg-muted p-0 border border-border w-full justify-start">
          <TabsTrigger value="usage"     className="rounded-none h-9 px-4 text-[11px] font-semibold uppercase tracking-wider data-[state=active]:bg-background data-[state=active]:shadow-none">
            <BarChart3 className="mr-1.5 h-3.5 w-3.5" /> Usage
          </TabsTrigger>
          <TabsTrigger value="revenue"   className="rounded-none h-9 px-4 text-[11px] font-semibold uppercase tracking-wider data-[state=active]:bg-background data-[state=active]:shadow-none">
            <TrendingUp className="mr-1.5 h-3.5 w-3.5" /> Revenue
          </TabsTrigger>
          <TabsTrigger value="consumers" className="rounded-none h-9 px-4 text-[11px] font-semibold uppercase tracking-wider data-[state=active]:bg-background data-[state=active]:shadow-none">
            <Users className="mr-1.5 h-3.5 w-3.5" /> Top Consumers
          </TabsTrigger>
          <TabsTrigger value="aging"     className="rounded-none h-9 px-4 text-[11px] font-semibold uppercase tracking-wider data-[state=active]:bg-background data-[state=active]:shadow-none">
            <Clock className="mr-1.5 h-3.5 w-3.5" /> Invoice Aging
          </TabsTrigger>
        </TabsList>

        {/* ── Usage ──────────────────────────────────────────────────────────── */}
        <TabsContent value="usage" className="mt-4 space-y-4">
          <div className="flex items-end justify-between gap-4">
            <DateFilter />
            {usageRows && usageRows.length > 0 && (
              <Button variant="outline" onClick={() => exportCsv(
                `usage-${from}-${to}.csv`,
                ["Meter", "Type", "Location", "Customer", "Readings", "First", "Last", "Consumption", "Unit"],
                usageRows.map(r => [r.serialNumber, r.type, r.location ?? "", r.customerName ?? "",
                  r.readingCount, r.firstReading, r.lastReading, r.consumption?.toFixed(2), r.unit ?? ""])
              )} className="rounded-none h-10 shrink-0">
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
            )}
          </div>

          {usageLoading ? (
            <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : usageRows !== null && usageRows.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground rounded-none border border-border bg-card">
              No readings found for the selected period.
            </div>
          ) : usageRows !== null && (
            <div className="rounded-none border border-border bg-card">
              <div className="grid grid-cols-[1fr_90px_1fr_1fr_60px_80px_80px_90px] border-b border-border bg-muted px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                <span>Meter</span><span>Type</span><span>Location</span><span>Customer</span>
                <span className="text-right">Rdgs</span><span className="text-right">First</span>
                <span className="text-right">Last</span><span className="text-right">Consumption</span>
              </div>
              {usageRows.map(r => (
                <div key={r.meterId}
                  className="grid grid-cols-[1fr_90px_1fr_1fr_60px_80px_80px_90px] items-center border-b border-border px-4 py-3 text-sm last:border-0 hover:bg-muted/50 transition-colors">
                  <span className="font-medium truncate">{r.serialNumber}</span>
                  <span className={`inline-block rounded-none px-2 py-0.5 text-[10px] font-semibold uppercase w-fit ${TYPE_COLOR[r.type] ?? "bg-muted text-muted-foreground"}`}>{r.type}</span>
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
                <span>{usageRows.length} meter{usageRows.length !== 1 ? "s" : ""} · {from} to {to}</span>
                <span>Total: <strong className="text-foreground">{usageRows.reduce((s, r) => s + (r.consumption ?? 0), 0).toFixed(2)}</strong></span>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── Revenue ────────────────────────────────────────────────────────── */}
        <TabsContent value="revenue" className="mt-4 space-y-4">
          <div className="rounded-none border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Monthly Revenue</p>
                <p className="text-xs text-muted-foreground mt-0.5">Last 12 months — paid vs outstanding</p>
              </div>
              {revenueData && (
                <Button variant="outline" onClick={() => exportCsv(
                  "revenue-12months.csv",
                  ["Month", "Paid (KES)", "Unpaid (KES)"],
                  revenueData.map(r => [r.month, r.paid, r.unpaid])
                )} className="rounded-none h-8 text-xs">
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Export
                </Button>
              )}
            </div>
            {revenueLoading ? (
              <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : revenueData ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={revenueData.map(r => ({ ...r, month: shortMonth(r.month), paid: Number(r.paid), unpaid: Number(r.unpaid) }))}
                  margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false}
                    tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 0, fontSize: 12 }}
                    formatter={(value: number, name: string) => [fmt(value), name === "paid" ? "Paid" : "Unpaid"]}
                  />
                  <Legend formatter={v => v === "paid" ? "Paid" : "Unpaid"} iconSize={10}
                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  <Bar dataKey="paid"   fill="#10b981" radius={0} />
                  <Bar dataKey="unpaid" fill="#f59e0b" radius={0} />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>

          {/* Monthly totals summary row */}
          {revenueData && (() => {
            const totalPaid   = revenueData.reduce((s, r) => s + Number(r.paid),   0);
            const totalUnpaid = revenueData.reduce((s, r) => s + Number(r.unpaid), 0);
            return (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-none border border-emerald-200 bg-card p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Total Paid (12 mo)</p>
                  <p className="mt-1 font-display text-xl font-semibold text-emerald-600">{fmt(totalPaid)}</p>
                </div>
                <div className="rounded-none border border-amber-200 bg-card p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Total Outstanding</p>
                  <p className="mt-1 font-display text-xl font-semibold text-amber-600">{fmt(totalUnpaid)}</p>
                </div>
                <div className="rounded-none border border-border bg-card p-4 sm:block hidden">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Collection Rate</p>
                  <p className="mt-1 font-display text-xl font-semibold">
                    {totalPaid + totalUnpaid > 0
                      ? `${((totalPaid / (totalPaid + totalUnpaid)) * 100).toFixed(1)}%`
                      : "—"}
                  </p>
                </div>
              </div>
            );
          })()}
        </TabsContent>

        {/* ── Top Consumers ──────────────────────────────────────────────────── */}
        <TabsContent value="consumers" className="mt-4 space-y-4">
          <DateFilter />
          {consumersLoading ? (
            <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : consumersData !== null && consumersData.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground rounded-none border border-border bg-card">
              No consumption data for the selected period.
            </div>
          ) : consumersData !== null && (() => {
            const max = Math.max(...consumersData.map(r => r.consumption));
            return (
              <div className="rounded-none border border-border bg-card">
                <div className="grid grid-cols-[32px_1fr_200px_100px] border-b border-border bg-muted px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  <span>#</span><span>Customer</span><span>Consumption</span><span className="text-right">Meters</span>
                </div>
                {consumersData.map((r, i) => (
                  <div key={r.customerId}
                    className="grid grid-cols-[32px_1fr_200px_100px] items-center border-b border-border px-4 py-3 last:border-0 hover:bg-muted/50 transition-colors">
                    <span className="text-sm font-semibold text-muted-foreground tabular-nums">{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium">{r.customerName || r.customerEmail}</p>
                      <p className="text-[11px] text-muted-foreground">{r.customerEmail}</p>
                    </div>
                    <div className="pr-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 bg-brand-red/20 flex-1 rounded-none">
                          <div className="h-2 bg-brand-red rounded-none" style={{ width: `${(r.consumption / max) * 100}%` }} />
                        </div>
                        <span className="text-xs font-semibold tabular-nums w-20 text-right shrink-0">
                          {r.consumption.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">{r.meterCount} meter{r.meterCount !== 1 ? "s" : ""}</div>
                  </div>
                ))}
              </div>
            );
          })()}
        </TabsContent>

        {/* ── Invoice Aging ──────────────────────────────────────────────────── */}
        <TabsContent value="aging" className="mt-4 space-y-4">
          {agingLoading ? (
            <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : agingData !== null && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {agingData.map((bucket: any) => (
                  <div key={bucket.key} className={`rounded-none border bg-card p-4 ${AGING_COLOR[bucket.key] ?? "border-border text-foreground"}`}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">{bucket.label}</p>
                    <p className="mt-1 font-display text-2xl font-semibold">{bucket.count}</p>
                    <p className="mt-0.5 text-xs font-medium">{fmt(bucket.amount)}</p>
                  </div>
                ))}
              </div>

              {/* Aging bar chart */}
              {agingData.some((b: any) => b.count > 0) && (
                <div className="rounded-none border border-border bg-card p-5">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-4">Outstanding Amount by Age</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={agingData.map((b: any) => ({ label: b.label, amount: Number(b.amount), count: b.count }))}
                      margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false}
                        tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                      <Tooltip
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 0, fontSize: 12 }}
                        formatter={(value: number) => [fmt(value), "Amount"]}
                      />
                      <Bar dataKey="amount" fill="#e60026" radius={0} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <p className="text-[11px] text-muted-foreground">
                Overdue invoice reminders are sent automatically to customers every day at 08:00.
              </p>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
