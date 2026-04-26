import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";
import { Search, Users as UsersIcon, MoreHorizontal, UserPlus, Loader2 } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Pagination, { PageResponse } from "@/components/dashboard/Pagination";

const ROLE_CLS: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-700",
  ADMIN:       "bg-blue-100 text-blue-700",
  TECHNICIAN:  "bg-amber-100 text-amber-700",
  CUSTOMER:    "bg-slate-100 text-slate-600",
};

// Roles a tenant ADMIN can assign — SUPER_ADMIN is a platform-level role, never assignable here
const ASSIGNABLE_ROLES = ["TECHNICIAN", "CUSTOMER"];
const FILTER_ROLES = ["ALL", "ADMIN", "TECHNICIAN", "CUSTOMER"] as const;
type RoleFilter = typeof FILTER_ROLES[number];

export default function Users() {
  const api = useApi();
  const { toast } = useToast();
  const [page,    setPage]    = useState<PageResponse<any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [role,    setRole]    = useState<RoleFilter>("ALL");
  const [pageNum, setPageNum] = useState(0);
  const [open,    setOpen]    = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [showDeleted,   setShowDeleted]   = useState(false);
  const [deletedUsers,  setDeletedUsers]  = useState<any[]>([]);
  const [loadingDeleted, setLoadingDeleted] = useState(false);
  const [form,    setForm]    = useState({ firstName: "", lastName: "", email: "", phone: "", role: "CUSTOMER", password: "ChangeMe123!", username: "" });
  const [formUsernameEdited, setFormUsernameEdited] = useState(false);
  const [changeUsernameUser,  setChangeUsernameUser]  = useState<any | null>(null);
  const [newUsername, setNewUsername] = useState("");

  const load = (p = 0) => {
    setLoading(true);
    api.get<PageResponse<any>>(`/api/users?page=${p}&size=20`).then(setPage).catch(err => {
      toast({ title: "Error loading users", description: err.message, variant: "destructive" });
    }).finally(() => setLoading(false));
  };
  useEffect(() => { load(pageNum); }, [pageNum]);

  const handlePageChange = (p: number) => { setPageNum(p); setSearch(""); };

  const suggestUsername = (first: string, last: string) => {
    if (formUsernameEdited) return;
    const raw = `${first.trim()}.${last.trim()}`.toLowerCase().replace(/[^a-z0-9._-]/g, "").replace(/\.+/g, ".").replace(/^\./, "");
    setForm(f => ({ ...f, username: raw.substring(0, 30) }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/api/users", form);
      toast({ title: "User created", description: `${form.firstName} ${form.lastName} added.` });
      setOpen(false);
      setForm({ firstName: "", lastName: "", email: "", phone: "", role: "CUSTOMER", password: "ChangeMe123!", username: "" });
      setFormUsernameEdited(false);
      load(pageNum);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const toggleActive = async (user: any) => {
    try {
      await api.patch(`/api/users/${user.id}`, { active: String(!user.active) });
      setPage(prev => prev ? { ...prev, content: prev.content.map(u => u.id === user.id ? { ...u, active: !u.active } : u) } : prev);
      toast({ title: `User ${!user.active ? "activated" : "deactivated"}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const changeRole = async (user: any, newRole: string) => {
    try {
      await api.patch(`/api/users/${user.id}`, { role: newRole });
      setPage(prev => prev ? { ...prev, content: prev.content.map(u => u.id === user.id ? { ...u, role: newRole } : u) } : prev);
      toast({ title: "Role updated", description: `${user.firstName} is now ${newRole.replace("_", " ")}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const loadDeleted = () => {
    setLoadingDeleted(true);
    api.get<any[]>("/api/users/deleted")
      .then(setDeletedUsers)
      .catch(err => toast({ title: "Error", description: err.message, variant: "destructive" }))
      .finally(() => setLoadingDeleted(false));
  };

  const restoreUser = async (user: any) => {
    try {
      await api.patch(`/api/users/${user.id}/restore`, {});
      setDeletedUsers(prev => prev.filter(u => u.id !== user.id));
      toast({ title: "User restored", description: `${user.firstName} ${user.lastName} has been restored.` });
      load(pageNum);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleToggleDeleted = () => {
    const next = !showDeleted;
    setShowDeleted(next);
    if (next) loadDeleted();
  };

  const deleteUser = async (user: any) => {
    if (!confirm(`Delete ${user.firstName} ${user.lastName}? This can be undone.`)) return;
    try {
      await api.del(`/api/users/${user.id}`);
      setPage(prev => prev ? { ...prev, content: prev.content.filter(u => u.id !== user.id) } : prev);
      toast({ title: "User deleted", description: `${user.firstName} ${user.lastName} removed.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleChangeUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeUsernameUser) return;
    setSaving(true);
    try {
      await api.patch(`/api/users/${changeUsernameUser.id}`, { username: newUsername });
      setPage(prev => prev ? { ...prev, content: prev.content.map(u => u.id === changeUsernameUser.id ? { ...u, username: newUsername } : u) } : prev);
      toast({ title: "Username updated" });
      setChangeUsernameUser(null);
      setNewUsername("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const users = page?.content ?? [];
  const filtered = users.filter(u => {
    const matchRole   = role === "ALL" || u.role === role;
    const matchSearch = `${u.firstName} ${u.lastName} ${u.email} ${u.username ?? ""}`.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-brand-red">Platform</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">All Users</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleToggleDeleted}
            className={`h-9 rounded-none px-4 text-xs font-semibold uppercase tracking-wider ${showDeleted ? "border-brand-red text-brand-red" : ""}`}
          >
            {showDeleted ? "Active Users" : "Show Deleted"}
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="h-9 rounded-none bg-brand-red px-4 text-xs font-semibold uppercase tracking-wider text-white hover:bg-brand-red/90">
              <UserPlus className="mr-2 h-4 w-4" /> Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-none sm:max-w-md">
            <DialogHeader><DialogTitle className="font-display font-semibold">New User</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">First name</Label>
                  <Input value={form.firstName} onChange={e => { setForm(f => ({...f, firstName: e.target.value})); suggestUsername(e.target.value, form.lastName); }} required placeholder="Jane" className="rounded-none" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Last name</Label>
                  <Input value={form.lastName} onChange={e => { setForm(f => ({...f, lastName: e.target.value})); suggestUsername(form.firstName, e.target.value); }} placeholder="Doe" className="rounded-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Username</Label>
                <Input value={form.username} onChange={e => { setForm(f => ({...f, username: e.target.value})); setFormUsernameEdited(true); }} required placeholder="jane.doe" minLength={3} maxLength={30} pattern="^[a-zA-Z0-9._-]{3,30}$" title="3–30 characters: letters, numbers, dots, underscores, hyphens" className="rounded-none" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} required placeholder="jane@example.com" className="rounded-none" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Phone</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} placeholder="0712345678" className="rounded-none" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Role</Label>
                <Select value={form.role} onValueChange={v => setForm(f => ({...f, role: v}))}>
                  <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ASSIGNABLE_ROLES.map(r => <SelectItem key={r} value={r}>{r.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Temporary password</Label>
                <Input value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} required className="rounded-none" />
              </div>
              <Button type="submit" disabled={saving} className="w-full rounded-none bg-brand-red text-white hover:bg-brand-red/90">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create User"}
              </Button>
            </form>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…" className="rounded-none pl-9" />
        </div>
        <div className="flex items-center gap-1 border-b border-border sm:border-b-0">
          {FILTER_ROLES.map(r => (
            <button key={r} onClick={() => setRole(r)}
              className={`px-3 py-2 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                role === r ? "border-b-2 border-brand-red text-brand-red" : "text-muted-foreground hover:text-foreground"
              }`}>
              {r === "ALL" ? "All" : r.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-none border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted">
              <TableHead className="text-[10px] font-semibold uppercase tracking-[0.15em]">Name</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-[0.15em]">Username</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-[0.15em]">Email</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-[0.15em] w-32">Role</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-[0.15em] w-24">Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading || loadingDeleted ? (
              <TableRow><TableCell colSpan={6} className="h-32 text-center text-sm text-muted-foreground">Loading…</TableCell></TableRow>
            ) : showDeleted ? (
              deletedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                      <UsersIcon className="h-8 w-8 opacity-30" />
                      No deleted users.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                deletedUsers
                  .filter(u => `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase()))
                  .map(u => (
                    <TableRow key={u.id} className="bg-muted/20 hover:bg-muted/30">
                      <TableCell className="font-medium text-muted-foreground line-through">{u.firstName} {u.lastName}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">{u.username ? `@${u.username}` : "—"}</TableCell>
                      <TableCell className="text-muted-foreground truncate">{u.email}</TableCell>
                      <TableCell>
                        <span className={`inline-block rounded-none px-2 py-0.5 text-[10px] font-semibold uppercase opacity-50 ${ROLE_CLS[u.role] ?? "bg-muted text-muted-foreground"}`}>
                          {u.role?.replace("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell className="text-[10px] font-semibold uppercase text-rose-500">Deleted</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 rounded-none p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-none w-44">
                            <DropdownMenuItem onClick={() => restoreUser(u)} className="text-xs text-emerald-600 focus:text-emerald-600">
                              Restore user
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
              )
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                    <UsersIcon className="h-8 w-8 opacity-30" />
                    No users found.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.firstName} {u.lastName}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{u.username ? `@${u.username}` : "—"}</TableCell>
                  <TableCell className="text-muted-foreground truncate">{u.email}</TableCell>
                  <TableCell>
                    <span className={`inline-block rounded-none px-2 py-0.5 text-[10px] font-semibold uppercase ${ROLE_CLS[u.role] ?? "bg-muted text-muted-foreground"}`}>
                      {u.role?.replace("_", " ")}
                    </span>
                  </TableCell>
                  <TableCell className={`text-[10px] font-semibold uppercase ${u.active ? "text-emerald-600" : "text-rose-600"}`}>
                    {u.active ? "Active" : "Inactive"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 rounded-none p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-none w-48">
                        <DropdownMenuItem onClick={() => toggleActive(u)} className="text-xs">
                          {u.active ? "Deactivate" : "Activate"} account
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setChangeUsernameUser(u); setNewUsername(u.username ?? ""); }} className="text-xs">
                          Change username
                        </DropdownMenuItem>
                        {ASSIGNABLE_ROLES.filter(r => r !== u.role).map(r => (
                          <DropdownMenuItem key={r} onClick={() => changeRole(u, r)} className="text-xs">
                            Set as {r.replace("_", " ")}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => deleteUser(u)} className="text-xs text-rose-600 focus:text-rose-600">
                          Delete user
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {page && <Pagination meta={page} onPageChange={handlePageChange} />}

      {/* Change username dialog */}
      <Dialog open={!!changeUsernameUser} onOpenChange={open => { if (!open) { setChangeUsernameUser(null); setNewUsername(""); } }}>
        <DialogContent className="rounded-none sm:max-w-sm">
          <DialogHeader><DialogTitle className="font-display font-semibold">Change Username</DialogTitle></DialogHeader>
          <form onSubmit={handleChangeUsername} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">New username</Label>
              <Input value={newUsername} onChange={e => setNewUsername(e.target.value)} required minLength={3} maxLength={30}
                pattern="^[a-zA-Z0-9._-]{3,30}$" title="3–30 characters: letters, numbers, dots, underscores, hyphens"
                placeholder="jane.doe" className="rounded-none" />
            </div>
            <Button type="submit" disabled={saving} className="w-full rounded-none bg-brand-red text-white hover:bg-brand-red/90">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
