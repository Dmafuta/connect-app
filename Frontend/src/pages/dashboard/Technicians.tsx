import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, Search, Loader2, Wrench } from "lucide-react";

export default function Technicians() {
  const api = useApi();
  const { toast } = useToast();
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [open, setOpen]               = useState(false);
  const [saving, setSaving]           = useState(false);
  const [form, setForm]               = useState({ firstName: "", lastName: "", email: "", phone: "", password: "ChangeMe123!" });

  const load = () => {
    setLoading(true);
    api.get<any[]>("/api/users/technicians").then(setTechnicians).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/api/users", { ...form, role: "TECHNICIAN" });
      toast({ title: "Technician created", description: `${form.firstName} ${form.lastName} added.` });
      setOpen(false);
      setForm({ firstName: "", lastName: "", email: "", phone: "", password: "ChangeMe123!" });
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const filtered = technicians.filter(t =>
    `${t.firstName} ${t.lastName} ${t.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-brand-red">Management</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Technicians</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="h-9 rounded-none bg-brand-red px-4 text-xs font-semibold uppercase tracking-wider text-white hover:bg-brand-red/90">
              <UserPlus className="mr-2 h-4 w-4" /> Add Technician
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-none sm:max-w-md">
            <DialogHeader><DialogTitle className="font-display font-semibold">New Technician</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">First name</Label>
                  <Input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} required placeholder="John" className="rounded-none" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Last name</Label>
                  <Input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Doe" className="rounded-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required placeholder="john@quantumconnect.africa" className="rounded-none" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Phone</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="0712345678" className="rounded-none" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Temporary password</Label>
                <Input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required className="rounded-none" />
              </div>
              <Button type="submit" disabled={saving} className="w-full rounded-none bg-brand-red text-white hover:bg-brand-red/90">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Technician"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search technicians…" className="rounded-none pl-9" />
      </div>

      <div className="rounded-none border border-border bg-card">
        <div className="grid grid-cols-[1fr_1fr_1fr_80px] border-b border-border bg-muted px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          <span>Name</span><span>Email</span><span>Phone</span><span>Status</span>
        </div>
        {loading ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <Wrench className="h-8 w-8 opacity-30" />
            {search ? "No technicians match your search." : "No technicians yet. Add one above."}
          </div>
        ) : (
          filtered.map(t => (
            <div key={t.id} className="grid grid-cols-[1fr_1fr_1fr_80px] border-b border-border px-4 py-3 text-sm last:border-0 hover:bg-muted/50 transition-colors">
              <span className="font-medium">{t.firstName} {t.lastName}</span>
              <span className="text-muted-foreground">{t.email}</span>
              <span className="text-muted-foreground">{t.phone ?? "—"}</span>
              <span className={`text-[10px] font-semibold uppercase ${t.active ? "text-emerald-600" : "text-rose-600"}`}>
                {t.active ? "Active" : "Inactive"}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
