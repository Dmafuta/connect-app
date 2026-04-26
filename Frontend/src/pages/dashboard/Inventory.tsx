import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Package, MoreHorizontal, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Pagination, { PageResponse } from "@/components/dashboard/Pagination";

interface InventoryMeter {
  id: number;
  serialNumber: string;
  type: string;
  mode: string;
  status: "AVAILABLE" | "ALLOCATED";
  allocatedTo: { id: number; name: string; code: string } | null;
  addedAt: string;
  allocatedAt: string | null;
}

interface Tenant {
  id: number;
  name: string;
  code: string;
  active: boolean;
}

const TYPE_COLOR: Record<string, string> = { WATER: "text-blue-500", ELECTRICITY: "text-amber-500", GAS: "text-emerald-500" };

export default function Inventory() {
  const api = useApi();
  const { toast } = useToast();

  const [page, setPage] = useState<PageResponse<InventoryMeter> | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageNum, setPageNum] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");

  // Add meter dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ serialNumber: "", type: "ELECTRICITY", mode: "SMART" });
  const [adding, setAdding] = useState(false);

  // Allocate dialog
  const [allocTarget, setAllocTarget] = useState<InventoryMeter | null>(null);
  const [allocTenantId, setAllocTenantId] = useState("");
  const [allocating, setAllocating] = useState(false);

  const load = (p = 0) => {
    setLoading(true);
    const qs = statusFilter ? `&status=${statusFilter}` : "";
    api.get<PageResponse<InventoryMeter>>(`/api/inventory?page=${p}&size=20${qs}`)
      .then(setPage)
      .catch(err => toast({ title: "Error loading inventory", description: err.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get<PageResponse<Tenant>>("/api/tenants?page=0&size=100")
      .then(r => setTenants(r.content.filter(t => t.active)))
      .catch(() => {});
    load(0);
  }, []);

  useEffect(() => { load(pageNum); }, [pageNum, statusFilter]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await api.post("/api/inventory", addForm);
      toast({ title: "Meter added to inventory", description: addForm.serialNumber });
      setAddOpen(false);
      setAddForm({ serialNumber: "", type: "ELECTRICITY", mode: "SMART" });
      load(pageNum);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setAdding(false); }
  };

  const openAllocate = (inv: InventoryMeter) => {
    setAllocTarget(inv);
    setAllocTenantId("");
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocTarget) return;
    setAllocating(true);
    try {
      const res = await api.post<any>(`/api/inventory/${allocTarget.id}/allocate`, { tenantId: allocTenantId });
      toast({ title: "Meter allocated", description: res.message });
      setAllocTarget(null);
      load(pageNum);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setAllocating(false); }
  };

  const meters = page?.content ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-brand-red">Platform</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Meter Inventory</h1>
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="rounded-none bg-brand-black font-display text-xs font-semibold uppercase tracking-[0.15em] hover:bg-brand-red"
        >
          <Plus className="mr-2 h-3.5 w-3.5" /> Add Meter
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter || "ALL"} onValueChange={v => { setStatusFilter(v === "ALL" ? "" : v); setPageNum(0); }}>
          <SelectTrigger className="w-44 rounded-none h-9 text-xs">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="AVAILABLE">Available</SelectItem>
            <SelectItem value="ALLOCATED">Allocated</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{page?.totalElements ?? 0} meters</span>
      </div>

      {/* Table */}
      <div className="rounded-none border border-border bg-card">
        <div className="grid grid-cols-[1fr_100px_90px_90px_1fr_40px] border-b border-border bg-muted px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          <span>Serial Number</span>
          <span>Type</span>
          <span>Mode</span>
          <span>Status</span>
          <span>Allocated To</span>
          <span />
        </div>

        {loading ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">Loading…</div>
        ) : meters.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <Package className="h-8 w-8 opacity-30" />
            No meters in inventory.
          </div>
        ) : (
          meters.map(m => (
            <div
              key={m.id}
              className="grid grid-cols-[1fr_100px_90px_90px_1fr_40px] items-center border-b border-border px-4 py-3 text-sm last:border-0 hover:bg-muted/50 transition-colors"
            >
              <span className="font-mono font-medium">{m.serialNumber}</span>
              <span className={`text-xs font-semibold ${TYPE_COLOR[m.type] ?? ""}`}>{m.type}</span>
              <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 inline-block ${m.mode === "SMART" ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-600"}`}>
                {m.mode}
              </span>
              <span className={`text-[10px] font-semibold uppercase ${m.status === "AVAILABLE" ? "text-emerald-600" : "text-slate-500"}`}>
                {m.status}
              </span>
              <span className="text-xs text-muted-foreground">
                {m.allocatedTo ? (
                  <span>{m.allocatedTo.name} <span className="font-mono text-[10px]">{m.allocatedTo.code}</span></span>
                ) : "—"}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 rounded-none p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-none w-40">
                  {m.status === "AVAILABLE" && (
                    <DropdownMenuItem onClick={() => openAllocate(m)} className="text-xs">
                      Allocate to tenant
                    </DropdownMenuItem>
                  )}
                  {m.status === "ALLOCATED" && (
                    <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                      Already allocated
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        )}
      </div>

      {page && <Pagination meta={page} onPageChange={p => setPageNum(p)} />}

      {/* Add Meter Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="rounded-none sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-semibold tracking-tight">Add to Inventory</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 pt-1">
            <div className="space-y-2">
              <Label className="text-[11px] font-medium uppercase tracking-[0.15em] text-foreground/70">Serial Number</Label>
              <Input
                value={addForm.serialNumber}
                onChange={e => setAddForm(f => ({ ...f, serialNumber: e.target.value }))}
                placeholder="QC-ELC-0001"
                required
                className="h-11 rounded-none border-0 border-b border-border bg-transparent px-0 font-mono focus-visible:border-brand-red focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[11px] font-medium uppercase tracking-[0.15em] text-foreground/70">Type</Label>
                <Select value={addForm.type} onValueChange={v => setAddForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ELECTRICITY">Electricity</SelectItem>
                    <SelectItem value="WATER">Water</SelectItem>
                    <SelectItem value="GAS">Gas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-medium uppercase tracking-[0.15em] text-foreground/70">Mode</Label>
                <Select value={addForm.mode} onValueChange={v => setAddForm(f => ({ ...f, mode: v }))}>
                  <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SMART">Smart</SelectItem>
                    <SelectItem value="POSTPAID">Postpaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setAddOpen(false)} className="rounded-none text-xs">Cancel</Button>
              <Button type="submit" disabled={adding} className="rounded-none bg-brand-black font-display text-xs font-semibold uppercase tracking-[0.15em] hover:bg-brand-red">
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add to Inventory →"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Allocate Dialog */}
      <Dialog open={!!allocTarget} onOpenChange={open => { if (!open) setAllocTarget(null); }}>
        <DialogContent className="rounded-none sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-semibold tracking-tight">
              Allocate — {allocTarget?.serialNumber}
            </DialogTitle>
          </DialogHeader>
          <p className="text-[12px] text-muted-foreground -mt-2">
            This will create the meter in the selected tenant's dashboard.
          </p>
          <form onSubmit={handleAllocate} className="space-y-4 pt-1">
            <div className="space-y-2">
              <Label className="text-[11px] font-medium uppercase tracking-[0.15em] text-foreground/70">Tenant</Label>
              <Select value={allocTenantId} onValueChange={setAllocTenantId} required>
                <SelectTrigger className="rounded-none"><SelectValue placeholder="Select tenant" /></SelectTrigger>
                <SelectContent>
                  {tenants.map(t => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.name} — {t.code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setAllocTarget(null)} className="rounded-none text-xs">Cancel</Button>
              <Button type="submit" disabled={allocating || !allocTenantId} className="rounded-none bg-brand-black font-display text-xs font-semibold uppercase tracking-[0.15em] hover:bg-brand-red">
                {allocating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Allocate →"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
