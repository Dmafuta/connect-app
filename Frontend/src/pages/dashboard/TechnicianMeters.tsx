import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Gauge, Droplets, Zap, Flame, Activity, Search,
  Loader2, UserCircle, MapPin, ClipboardList,
} from "lucide-react";

const TYPE_ICON: Record<string, React.ElementType>  = { WATER: Droplets, ELECTRICITY: Zap, GAS: Flame };
const TYPE_COLOR: Record<string, string> = { WATER: "#3b82f6", ELECTRICITY: "#f59e0b", GAS: "#10b981" };
const STATUS_CLS: Record<string, string> = {
  ACTIVE:   "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-slate-100 text-slate-600",
  FAULTY:   "bg-rose-100 text-rose-700",
};

function ago(iso: string) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

export default function TechnicianMeters() {
  const api = useApi();
  const { toast } = useToast();

  const [meters,   setMeters]   = useState<any[]>([]);
  const [readings, setReadings] = useState<Map<number, any>>(new Map());
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");

  // Log reading dialog
  const [logTarget, setLogTarget] = useState<any | null>(null);
  const [logForm,   setLogForm]   = useState({ value: "", unit: "" });
  const [logging,   setLogging]   = useState(false);

  const load = () => {
    setLoading(true);
    api.get<any[]>("/api/meters/assigned")
      .then(async ms => {
        setMeters(ms);
        // Fetch last reading for each meter in parallel
        const pairs = await Promise.all(
          ms.map((m: any) =>
            api.get<any[]>(`/api/readings/meter/${m.id}`)
              .then(rs => [m.id, rs[0] ?? null] as [number, any])
              .catch(() => [m.id, null] as [number, any])
          )
        );
        setReadings(new Map(pairs));
      })
      .catch(err => toast({ title: "Error loading meters", description: err.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openLog = (m: any) => {
    const defaultUnit = m.type === "WATER" ? "m³" : m.type === "GAS" ? "m³" : "kWh";
    setLogTarget(m);
    setLogForm({ value: "", unit: defaultUnit });
  };

  const handleLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logTarget) return;
    setLogging(true);
    try {
      await api.post("/api/readings", {
        meterId: String(logTarget.id),
        value:   logForm.value,
        unit:    logForm.unit,
      });
      toast({ title: "Reading logged", description: `${logForm.value} ${logForm.unit} for ${logTarget.serialNumber}.` });
      setLogTarget(null);
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setLogging(false); }
  };

  const filtered = meters.filter(m =>
    `${m.serialNumber} ${m.location ?? ""} ${m.type}`.toLowerCase().includes(search.toLowerCase())
  );

  const active  = meters.filter(m => m.status === "ACTIVE").length;
  const faulty  = meters.filter(m => m.status === "FAULTY").length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-brand-red">Field Work</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight">My Assignments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Meters assigned to you — log readings directly from this view.
        </p>
      </div>

      {/* Summary strip */}
      {!loading && meters.length > 0 && (
        <div className="grid grid-cols-3 divide-x divide-border rounded-none border border-border bg-card">
          {[
            { label: "Assigned",  value: meters.length, cls: "text-foreground" },
            { label: "Active",    value: active,         cls: "text-emerald-600" },
            { label: "Faulty",    value: faulty,         cls: faulty > 0 ? "text-rose-600" : "text-muted-foreground" },
          ].map(s => (
            <div key={s.label} className="px-5 py-4 text-center">
              <p className={`font-display text-2xl font-semibold ${s.cls}`}>{s.value}</p>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)}
               placeholder="Search by serial, type, location…" className="rounded-none pl-9" />
      </div>

      {/* Meter list */}
      {loading ? (
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-none border border-border text-sm text-muted-foreground">
          <Gauge className="h-10 w-10 opacity-20" />
          <div className="text-center">
            <p className="font-medium">{search ? "No meters match." : "No meters assigned to you yet."}</p>
            {!search && <p className="text-xs mt-1">Contact your administrator to get assignments.</p>}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[650px] rounded-none border border-border bg-card">
          {/* Table header */}
          <div className="grid grid-cols-[auto_1fr_1fr_1fr_140px_80px] border-b border-border bg-muted px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            <span className="w-8" />
            <span>Meter</span>
            <span>Customer</span>
            <span>Last Reading</span>
            <span>Status</span>
            <span />
          </div>

          {filtered.map(m => {
            const Icon  = TYPE_ICON[m.type]  ?? Gauge;
            const color = TYPE_COLOR[m.type] ?? "#888";
            const last  = readings.get(m.id);

            return (
              <div key={m.id}
                   className="grid grid-cols-[auto_1fr_1fr_1fr_140px_80px] items-center border-b border-border px-4 py-3 text-sm last:border-0 hover:bg-muted/50 transition-colors">
                <Icon className="mr-3 h-4 w-4 shrink-0" style={{ color }} />

                <div>
                  <p className="font-medium">{m.serialNumber}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <MapPin className="h-3 w-3" />
                    {m.location ?? "No location"}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  {m.customer ? (
                    <div className="flex items-center gap-1.5">
                      <UserCircle className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{m.customer.firstName} {m.customer.lastName}</span>
                    </div>
                  ) : (
                    <span className="italic">Unassigned</span>
                  )}
                </div>

                <div>
                  {last ? (
                    <div>
                      <p className="font-medium tabular-nums">{last.value?.toLocaleString()} <span className="font-normal text-muted-foreground text-xs">{last.unit}</span></p>
                      <p className="text-xs text-muted-foreground">{ago(last.readAt)}</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Activity className="h-3.5 w-3.5" /> No readings
                    </div>
                  )}
                </div>

                <span className={`inline-block rounded-none px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_CLS[m.status] ?? ""}`}>
                  {m.status}
                </span>

                <Button
                  size="sm"
                  onClick={() => openLog(m)}
                  className="h-7 rounded-none bg-brand-red px-3 text-[10px] font-semibold uppercase tracking-wider text-white hover:bg-brand-red/90"
                >
                  <ClipboardList className="mr-1.5 h-3 w-3" /> Log
                </Button>
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* Log reading dialog */}
      <Dialog open={!!logTarget} onOpenChange={open => { if (!open) setLogTarget(null); }}>
        <DialogContent className="rounded-none sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display font-semibold">
              Log Reading — {logTarget?.serialNumber}
            </DialogTitle>
          </DialogHeader>
          {logTarget && (
            <form onSubmit={handleLog} className="space-y-4 pt-2">
              <div className="rounded-none border border-border bg-muted/50 px-4 py-3 text-xs text-muted-foreground space-y-1">
                <p><span className="font-medium text-foreground">Type:</span> {logTarget.type}</p>
                <p><span className="font-medium text-foreground">Location:</span> {logTarget.location ?? "—"}</p>
                {logTarget.customer && (
                  <p><span className="font-medium text-foreground">Customer:</span> {logTarget.customer.firstName} {logTarget.customer.lastName}</p>
                )}
                {readings.get(logTarget.id) && (
                  <p><span className="font-medium text-foreground">Previous reading:</span> {readings.get(logTarget.id)?.value} {readings.get(logTarget.id)?.unit}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Reading Value</Label>
                  <Input
                    type="number" step="any" min="0"
                    value={logForm.value}
                    onChange={e => setLogForm(f => ({ ...f, value: e.target.value }))}
                    required placeholder="0.00" className="rounded-none"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Unit</Label>
                  <Input
                    value={logForm.unit}
                    onChange={e => setLogForm(f => ({ ...f, unit: e.target.value }))}
                    required placeholder="kWh / m³" className="rounded-none"
                  />
                </div>
              </div>
              <Button type="submit" disabled={logging} className="w-full rounded-none bg-brand-red text-white hover:bg-brand-red/90">
                {logging ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Reading"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
