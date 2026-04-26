import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Loader2, Gauge, Droplets, Zap, Flame, MoreHorizontal, Trash2, UserCog } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ToastAction } from "@/components/ui/toast";
import { useAuth } from "@/context/AuthContext";
import Pagination, { PageResponse } from "@/components/dashboard/Pagination";

const TYPE_ICON: Record<string, React.ElementType> = { WATER: Droplets, ELECTRICITY: Zap, GAS: Flame };
const TYPE_COLOR: Record<string, string> = { WATER: "#3b82f6", ELECTRICITY: "#f59e0b", GAS: "#10b981" };
const STATUS_CLS: Record<string, string> = { ACTIVE: "bg-emerald-100 text-emerald-700", INACTIVE: "bg-slate-100 text-slate-600", FAULTY: "bg-rose-100 text-rose-700" };

export default function Meters() {
  const api = useApi();
  const { toast } = useToast();
  const { user } = useAuth();
  const [page, setPage] = useState<PageResponse<any> | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [pageNum, setPageNum] = useState(0);
  const [form, setForm]       = useState({ serialNumber: "", type: "WATER", location: "", customerId: "", technicianId: "" });
  const [deleting, setDeleting] = useState<number | null>(null);
  const [assignTarget, setAssignTarget] = useState<any | null>(null);
  const [assignForm, setAssignForm] = useState({ customerId: "", technicianId: "" });
  const [assigning, setAssigning] = useState(false);

  const loadMeters = (p = 0) => {
    setLoading(true);
    api.get<PageResponse<any>>(`/api/meters?page=${p}&size=20`)
      .then(setPage)
      .catch(err => toast({ title: "Error loading meters", description: err.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    Promise.all([
      api.get<any[]>("/api/users/customers"),
      api.get<any[]>("/api/users/technicians"),
    ]).then(([c, t]) => { setCustomers(c); setTechnicians(t); });
    loadMeters(0);
  }, []);
  useEffect(() => { if (pageNum > 0) loadMeters(pageNum); }, [pageNum]);

  const handleStatusChange = async (m: any, status: string) => {
    try {
      await api.patch(`/api/meters/${m.id}`, { status });
      toast({ title: `Meter marked as ${status.toLowerCase()}` });
      loadMeters(pageNum);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (m: any) => {
    if (!window.confirm(`Delete meter ${m.serialNumber}?`)) return;
    setDeleting(m.id);
    try {
      await api.del(`/api/meters/${m.id}`);
      loadMeters(pageNum);
      toast({
        title: "Meter deleted",
        description: `${m.serialNumber} has been removed.`,
        action: (
          <ToastAction altText="Undo delete" onClick={async () => {
            try {
              await api.patch(`/api/meters/${m.id}/restore`, {});
              toast({ title: "Meter restored", description: `${m.serialNumber} is back.` });
              loadMeters(pageNum);
            } catch { /* ignore */ }
          }}>Undo</ToastAction>
        ),
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setDeleting(null); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/api/meters", form);
      toast({ title: "Meter registered", description: `${form.serialNumber} added.` });
      setOpen(false);
      setForm({ serialNumber: "", type: "WATER", location: "", customerId: "", technicianId: "" });
      loadMeters(pageNum);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const openAssign = (m: any) => {
    setAssignTarget(m);
    setAssignForm({
      customerId:   m.customer   ? String(m.customer.id)   : "",
      technicianId: m.technician ? String(m.technician.id) : "",
    });
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTarget) return;
    setAssigning(true);
    try {
      await api.patch(`/api/meters/${assignTarget.id}`, {
        customerId:   assignForm.customerId,
        technicianId: assignForm.technicianId,
      });
      toast({ title: "Assignment updated", description: `${assignTarget.serialNumber} reassigned.` });
      setAssignTarget(null);
      loadMeters(pageNum);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setAssigning(false); }
  };

  const meters = page?.content ?? [];
  const filtered = meters.filter(m =>
    `${m.serialNumber} ${m.location ?? ""} ${m.type}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-brand-red">Management</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Meters</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="h-9 rounded-none bg-brand-red px-4 text-xs font-semibold uppercase tracking-wider text-white hover:bg-brand-red/90">
              <Plus className="mr-2 h-4 w-4" /> Register Meter
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-none sm:max-w-md">
            <DialogHeader><DialogTitle className="font-display font-semibold">Register New Meter</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Serial Number</Label>
                <Input value={form.serialNumber} onChange={e => setForm(f => ({...f, serialNumber: e.target.value}))} required placeholder="QC-WTR-0001" className="rounded-none" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({...f, type: v}))}>
                  <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="WATER">Water</SelectItem><SelectItem value="ELECTRICITY">Electricity</SelectItem><SelectItem value="GAS">Gas</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Location</Label>
                <Input value={form.location} onChange={e => setForm(f => ({...f, location: e.target.value}))} placeholder="Nairobi, Block A" className="rounded-none" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Assign to Customer (optional)</Label>
                <Select value={form.customerId} onValueChange={v => setForm(f => ({...f, customerId: v}))}>
                  <SelectTrigger className="rounded-none"><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>
                    {customers.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.firstName} {c.lastName} — {c.email}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Assign Technician (optional)</Label>
                <Select value={form.technicianId} onValueChange={v => setForm(f => ({...f, technicianId: v}))}>
                  <SelectTrigger className="rounded-none"><SelectValue placeholder="Select technician" /></SelectTrigger>
                  <SelectContent>
                    {technicians.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.firstName} {t.lastName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={saving} className="w-full rounded-none bg-brand-red text-white hover:bg-brand-red/90">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Register Meter"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search meters…" className="rounded-none pl-9" />
      </div>

      <div className="rounded-none border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted">
              <TableHead className="w-10" />
              <TableHead className="text-[10px] font-semibold uppercase tracking-[0.15em]">Serial</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-[0.15em]">Type / Location</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-[0.15em]">Customer</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-[0.15em]">Technician</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-[0.15em] w-28">Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="h-32 text-center text-sm text-muted-foreground">Loading…</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Gauge className="h-8 w-8 opacity-30" />
                    {search ? "No meters match." : "No meters registered yet."}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(m => {
                const Icon = TYPE_ICON[m.type] ?? Gauge;
                const color = TYPE_COLOR[m.type] ?? "#888";
                return (
                  <TableRow key={m.id}>
                    <TableCell className="pr-0">
                      <Icon className="h-4 w-4 shrink-0" style={{ color }} />
                    </TableCell>
                    <TableCell className="font-medium">{m.serialNumber}</TableCell>
                    <TableCell className="text-muted-foreground">{m.type} · {m.location ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{m.customer ? `${m.customer.firstName} ${m.customer.lastName}` : "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{m.technician ? `${m.technician.firstName} ${m.technician.lastName}` : "—"}</TableCell>
                    <TableCell>
                      <span className={`inline-block rounded-none px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_CLS[m.status] ?? ""}`}>{m.status}</span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 rounded-none p-0" disabled={deleting === m.id}>
                            {deleting === m.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-none w-44">
                          <DropdownMenuItem onClick={() => openAssign(m)} className="text-xs">
                            <UserCog className="mr-2 h-3.5 w-3.5" /> Assign / Reassign
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {m.status !== "ACTIVE"   && <DropdownMenuItem onClick={() => handleStatusChange(m, "ACTIVE")}   className="text-xs">Mark as Active</DropdownMenuItem>}
                          {m.status !== "FAULTY"   && <DropdownMenuItem onClick={() => handleStatusChange(m, "FAULTY")}   className="text-xs">Mark as Faulty</DropdownMenuItem>}
                          {m.status !== "INACTIVE" && <DropdownMenuItem onClick={() => handleStatusChange(m, "INACTIVE")} className="text-xs">Mark as Inactive</DropdownMenuItem>}
                          {user?.role === "SUPER_ADMIN" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDelete(m)} className="text-xs text-rose-600 focus:text-rose-600">
                                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete meter
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      {page && <Pagination meta={page} onPageChange={p => { setPageNum(p); setSearch(""); }} />}

      {/* Assign / Reassign dialog */}
      <Dialog open={!!assignTarget} onOpenChange={open => { if (!open) setAssignTarget(null); }}>
        <DialogContent className="rounded-none sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display font-semibold">
              Assign — {assignTarget?.serialNumber}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAssign} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Customer</Label>
              <Select value={assignForm.customerId} onValueChange={v => setAssignForm(f => ({ ...f, customerId: v }))}>
                <SelectTrigger className="rounded-none"><SelectValue placeholder="None / Unassign" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None / Unassign</SelectItem>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.firstName} {c.lastName} — {c.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Technician</Label>
              <Select value={assignForm.technicianId} onValueChange={v => setAssignForm(f => ({ ...f, technicianId: v }))}>
                <SelectTrigger className="rounded-none"><SelectValue placeholder="None / Unassign" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None / Unassign</SelectItem>
                  {technicians.map(t => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.firstName} {t.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={assigning} className="w-full rounded-none bg-brand-red text-white hover:bg-brand-red/90">
              {assigning ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Assignment"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
