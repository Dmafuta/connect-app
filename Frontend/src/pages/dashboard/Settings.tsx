import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User, Lock, Building2 } from "lucide-react";

export default function Settings() {
  const api = useApi();
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();

  // Profile form
  const [profileForm, setProfileForm] = useState({ firstName: "", lastName: "", phone: "" });
  const [profileSaving, setProfileSaving] = useState(false);

  // Password form
  const [pwForm,  setPwForm]  = useState({ current: "", next: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError,  setPwError]  = useState("");

  // Org settings form (ADMIN/SUPER_ADMIN)
  const [orgForm,    setOrgForm]    = useState({ name: "", contactEmail: "", contactPhone: "" });
  const [orgSaving,  setOrgSaving]  = useState(false);
  const [orgLoaded,  setOrgLoaded]  = useState(false);

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  // Load profile from /api/users/me
  useEffect(() => {
    api.get<any>("/api/users/me").then(me => {
      setProfileForm({
        firstName: me.firstName ?? "",
        lastName:  me.lastName  ?? "",
        phone:     me.phone     ?? "",
      });
    }).catch(() => {});
  }, []);

  // Load org settings
  useEffect(() => {
    if (!isAdmin) return;
    api.get<any>("/api/tenants/me").then(t => {
      setOrgForm({
        name:         t.name         ?? "",
        contactEmail: t.contactEmail ?? "",
        contactPhone: t.contactPhone ?? "",
      });
      setOrgLoaded(true);
    }).catch(() => { setOrgLoaded(true); });
  }, [isAdmin]);

  const handleProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      await api.patch("/api/users/me", profileForm);
      updateProfile(profileForm.firstName, profileForm.lastName);
      toast({ title: "Profile updated" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setProfileSaving(false); }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    if (pwForm.next !== pwForm.confirm) { setPwError("New passwords do not match."); return; }
    if (pwForm.next.length < 8) { setPwError("Password must be at least 8 characters."); return; }
    setPwSaving(true);
    try {
      await api.patch("/api/users/me/password", { currentPassword: pwForm.current, newPassword: pwForm.next });
      toast({ title: "Password updated successfully" });
      setPwForm({ current: "", next: "", confirm: "" });
    } catch (err: any) {
      setPwError(err.message ?? "Failed to update password.");
    } finally { setPwSaving(false); }
  };

  const handleOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrgSaving(true);
    try {
      await api.patch("/api/tenants/me", orgForm);
      toast({ title: "Organisation settings saved" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setOrgSaving(false); }
  };

  return (
    <div className="space-y-8 max-w-lg">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-brand-red">Account</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Settings</h1>
      </div>

      {/* Profile */}
      <div className="rounded-none border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.15em]">Profile</h2>
        </div>
        <form onSubmit={handleProfile} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">First name</Label>
              <Input value={profileForm.firstName} onChange={e => setProfileForm(f => ({ ...f, firstName: e.target.value }))} required className="rounded-none" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Last name</Label>
              <Input value={profileForm.lastName} onChange={e => setProfileForm(f => ({ ...f, lastName: e.target.value }))} className="rounded-none" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Email</Label>
            <Input value={user?.email ?? ""} disabled className="rounded-none bg-muted/50 text-muted-foreground cursor-not-allowed" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Phone</Label>
            <Input value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} placeholder="+254712345678" className="rounded-none" />
          </div>
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Role</p>
            <p className="text-sm font-medium">{user?.role?.replace("_", " ")}</p>
          </div>
          <Button type="submit" disabled={profileSaving} className="rounded-none bg-brand-red text-white hover:bg-brand-red/90">
            {profileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Profile"}
          </Button>
        </form>
      </div>

      {/* Change password */}
      <div className="rounded-none border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.15em]">Change Password</h2>
        </div>
        <form onSubmit={handlePassword} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Current Password</Label>
            <Input type="password" value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} required className="rounded-none" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">New Password</Label>
            <Input type="password" value={pwForm.next} onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))} required className="rounded-none" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Confirm New Password</Label>
            <Input type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} required className="rounded-none" />
          </div>
          {pwError && <p className="text-xs text-rose-600">{pwError}</p>}
          <Button type="submit" disabled={pwSaving} className="rounded-none bg-brand-black text-white hover:bg-brand-black/90">
            {pwSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Password"}
          </Button>
        </form>
      </div>

      {/* Organisation settings — ADMIN / SUPER_ADMIN */}
      {isAdmin && orgLoaded && (
        <div className="rounded-none border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-display text-sm font-semibold uppercase tracking-[0.15em]">Organisation</h2>
          </div>
          <form onSubmit={handleOrg} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Organisation Name</Label>
              <Input value={orgForm.name} onChange={e => setOrgForm(f => ({ ...f, name: e.target.value }))} required className="rounded-none" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Contact Email</Label>
              <Input type="email" value={orgForm.contactEmail} onChange={e => setOrgForm(f => ({ ...f, contactEmail: e.target.value }))} placeholder="support@example.com" className="rounded-none" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Contact Phone</Label>
              <Input value={orgForm.contactPhone} onChange={e => setOrgForm(f => ({ ...f, contactPhone: e.target.value }))} placeholder="+254700000000" className="rounded-none" />
            </div>
            <Button type="submit" disabled={orgSaving} className="rounded-none bg-brand-red text-white hover:bg-brand-red/90">
              {orgSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Organisation"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
