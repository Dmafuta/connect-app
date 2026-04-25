import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";
import { Building2, MoreHorizontal, Plus } from "lucide-react";
import Pagination, { PageResponse } from "@/components/dashboard/Pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Tenant {
  id: number;
  name: string;
  slug: string;
  code: string;
  active: boolean;
  createdAt: string;
}

export default function Tenants() {
  const api = useApi();
  const { toast } = useToast();
  const [page, setPage] = useState<PageResponse<Tenant> | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [pageNum, setPageNum] = useState(0);

  const load = (p = 0) => {
    setLoading(true);
    api.get<PageResponse<Tenant>>(`/api/tenants?page=${p}&size=20`)
      .then(setPage)
      .catch(err => toast({ title: "Error loading tenants", description: err.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(pageNum); }, [pageNum]);

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(val.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const tenant = await api.post<Tenant>("/api/tenants", { name, slug });
      setPage(prev => prev ? { ...prev, content: [tenant, ...prev.content], totalElements: prev.totalElements + 1 } : prev);
      toast({
        title: "Tenant created",
        description: `${tenant.name} — org code: ${tenant.code}`,
      });
      setOpen(false);
      setName("");
      setSlug("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (tenant: Tenant) => {
    try {
      const updated = await api.patch<Tenant>(`/api/tenants/${tenant.id}`, {
        active: String(!tenant.active),
      });
      setPage(prev => prev ? { ...prev, content: prev.content.map(t => t.id === tenant.id ? updated : t) } : prev);
      toast({ title: `Tenant ${updated.active ? "activated" : "deactivated"}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-brand-red">Platform</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Tenants</h1>
        </div>
        <Button
          onClick={() => setOpen(true)}
          className="rounded-none bg-brand-black font-display text-xs font-semibold uppercase tracking-[0.15em] hover:bg-brand-red"
        >
          <Plus className="mr-2 h-3.5 w-3.5" /> New Tenant
        </Button>
      </div>

      <div className="rounded-none border border-border bg-card">
        <div className="grid grid-cols-[1fr_140px_120px_80px_40px] border-b border-border bg-muted px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          <span>Name / Slug</span>
          <span>Org Code</span>
          <span>Created</span>
          <span>Status</span>
          <span />
        </div>

        {loading ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">Loading…</div>
        ) : (page?.content ?? []).length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-8 w-8 opacity-30" />
            No tenants yet.
          </div>
        ) : (
          (page?.content ?? []).map(t => (
            <div
              key={t.id}
              className="grid grid-cols-[1fr_140px_120px_80px_40px] items-center border-b border-border px-4 py-3 text-sm last:border-0 hover:bg-muted/50 transition-colors"
            >
              <div>
                <p className="font-medium">{t.name}</p>
                <p className="text-[11px] text-muted-foreground">{t.slug}</p>
              </div>
              <span className="font-mono text-sm font-semibold tracking-widest">{t.code}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(t.createdAt).toLocaleDateString()}
              </span>
              <span className={`text-[10px] font-semibold uppercase ${t.active ? "text-emerald-600" : "text-rose-600"}`}>
                {t.active ? "Active" : "Inactive"}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 rounded-none p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-none w-40">
                  <DropdownMenuItem onClick={() => toggleActive(t)} className="text-xs">
                    {t.active ? "Deactivate" : "Activate"} tenant
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        )}
      </div>

      {page && <Pagination meta={page} onPageChange={p => setPageNum(p)} />}
      <p className="text-xs text-muted-foreground">{page?.totalElements ?? 0} tenant{(page?.totalElements ?? 0) !== 1 ? "s" : ""} total</p>

      {/* Create Tenant Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-none sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-semibold tracking-tight">New Tenant</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-5 py-2">
            <div className="space-y-2">
              <Label className="text-[11px] font-medium uppercase tracking-[0.15em] text-foreground/70">
                Organisation name
              </Label>
              <Input
                value={name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="e.g. Greatwall ISP"
                required
                className="h-11 rounded-none border-0 border-b border-border bg-transparent px-0 focus-visible:border-brand-red focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-medium uppercase tracking-[0.15em] text-foreground/70">
                Slug <span className="normal-case text-muted-foreground">(auto-generated, editable)</span>
              </Label>
              <Input
                value={slug}
                onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="e.g. greatwall-isp"
                required
                className="h-11 rounded-none border-0 border-b border-border bg-transparent px-0 font-mono text-sm focus-visible:border-brand-red focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <p className="text-[11px] text-muted-foreground">
                Org code is auto-generated after creation.
              </p>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="rounded-none text-xs">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creating}
                className="rounded-none bg-brand-black font-display text-xs font-semibold uppercase tracking-[0.15em] hover:bg-brand-red"
              >
                {creating ? "Creating…" : "Create tenant →"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
