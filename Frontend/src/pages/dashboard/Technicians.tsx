import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, Search, Loader2, Wrench } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export default function Technicians() {
  const api = useApi();
  const { toast } = useToast();
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [open, setOpen]               = useState(false);
  const [saving, setSaving]           = useState(false);
  const [form, setForm]               = useState({ firstName: "", lastName: "", email: "", phone: "", password: "ChangeMe123!", username: "" });
  const [formUsernameEdited, setFormUsernameEdited] = useState(false);

  const suggestUsername = (first: string, last: string) => {
    if (formUsernameEdited) return;
    const raw = `${first.trim()}.${last.trim()}`.toLowerCase().replace(/[^a-z0-9._-]/g, "").replace(/\.+/g, ".").replace(/^\./, "");
    setForm(f => ({ ...f, username: raw.substring(0, 30) }));
  };

  const load = () => {
    setLoading(true);
    api.get<any[]>("/api/users/technicians")
      .then(setTechnicians)
      .catch(err => toast({ title: "Error loading technicians", description: err.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/api/users", { ...form, role: "TECHNICIAN" });
      toast({ title: "Technician created", description: `${form.firstName} ${form.lastName} added.` });
      setOpen(false);
      setForm({ firstName: "", lastName: "", email: "", phone: "", password: "ChangeMe123!", username: "" });
      setFormUsernameEdited(false);
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const filtered = technicians.filter(t =>
    `${t.firstName} ${t.lastName} ${t.email} ${t.username ?? ""}`.toLowerCase().includes(search.toLowerCase())
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
                  <Input value={form.firstName} onChange={e => { setForm(f => ({ ...f, firstName: e.target.value })); suggestUsername(e.target.value, form.lastName); }} required placeholder="John" className="rounded-none" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Last name</Label>
                  <Input value={form.lastName} onChange={e => { setForm(f => ({ ...f, lastName: e.target.value })); suggestUsername(form.firstName, e.target.value); }} placeholder="Doe" className="rounded-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Username</Label>
                <Input value={form.username} onChange={e => { setForm(f => ({ ...f, username: e.target.value })); setFormUsernameEdited(true); }} required placeholder="john.doe" minLength={3} maxLength={30} pattern="^[a-zA-Z0-9._-]{3,30}$" title="3–30 characters: letters, numbers, dots, underscores, hyphens" className="rounded-none" />
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

      <div className="rounded-none border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted">
              <TableHead className="text-[10px] font-semibold uppercase tracking-[0.15em]">Name</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-[0.15em]">Username</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-[0.15em]">Email</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-[0.15em]">Phone</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-[0.15em] w-24">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="h-32 text-center text-sm text-muted-foreground">Loading…</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 p-0">
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
                    <Wrench className="h-10 w-10 opacity-20" />
                    <div className="text-center">
                      {search ? (
                        <>
                          <p className="font-medium text-foreground">No technicians match "{search}"</p>
                          <p className="mt-1 text-xs">Try a different name or email address.</p>
                        </>
                      ) : (
                        <>
                          <p className="font-medium text-foreground">No technicians on your team yet</p>
                          <p className="mt-1 text-xs">Add a technician to assign them to meters and enable field readings.</p>
                          <button
                            onClick={() => setOpen(true)}
                            className="mt-3 inline-flex items-center gap-1.5 rounded-none border border-brand-red px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-brand-red hover:bg-brand-red hover:text-white transition-colors"
                          >
                            <UserPlus className="h-3.5 w-3.5" /> Add Technician
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.firstName} {t.lastName}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{t.username ? `@${t.username}` : "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{t.email}</TableCell>
                  <TableCell className="text-muted-foreground">{t.phone ?? "—"}</TableCell>
                  <TableCell className={`text-[10px] font-semibold uppercase ${t.active ? "text-emerald-600" : "text-rose-600"}`}>
                    {t.active ? "Active" : "Inactive"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
