import { useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User, Lock } from "lucide-react";

export default function Settings() {
  const api = useApi();
  const { user } = useAuth();
  const { toast } = useToast();

  const [pwForm, setPwForm]   = useState({ current: "", next: "", confirm: "" });
  const [saving, setSaving]   = useState(false);
  const [error,  setError]    = useState("");

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (pwForm.next !== pwForm.confirm) { setError("New passwords do not match."); return; }
    if (pwForm.next.length < 8) { setError("Password must be at least 8 characters."); return; }
    setSaving(true);
    try {
      await api.patch("/api/users/me/password", { currentPassword: pwForm.current, newPassword: pwForm.next });
      toast({ title: "Password updated successfully" });
      setPwForm({ current: "", next: "", confirm: "" });
    } catch (err: any) {
      setError(err.message ?? "Failed to update password.");
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-8 max-w-lg">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-brand-red">Account</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Settings</h1>
      </div>

      {/* Profile info */}
      <div className="rounded-none border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.15em]">Profile</h2>
        </div>
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Name</p>
          <p className="text-sm font-medium">{user?.fullName || "—"}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Email</p>
          <p className="text-sm font-medium">{user?.email}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Role</p>
          <p className="text-sm font-medium">{user?.role?.replace("_", " ")}</p>
        </div>
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
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <Button type="submit" disabled={saving} className="rounded-none bg-brand-red text-white hover:bg-brand-red/90">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
