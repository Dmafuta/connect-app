import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User, Lock, Building2, Smartphone, Receipt } from "lucide-react";

export default function Settings() {
  const api = useApi();
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();

  // Profile form
  const [profileForm, setProfileForm] = useState({ firstName: "", lastName: "", phone: "" });
  const [profileUsername, setProfileUsername] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  // Password form
  const [pwForm,  setPwForm]  = useState({ current: "", next: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError,  setPwError]  = useState("");

  // Org settings form (ADMIN only)
  const [orgForm,    setOrgForm]    = useState({ name: "", code: "", contactEmail: "", contactPhone: "" });
  const [orgSaving,  setOrgSaving]  = useState(false);
  const [orgLoaded,  setOrgLoaded]  = useState(false);

  // M-Pesa Daraja credentials (ADMIN only)
  const [mpesaForm,    setMpesaForm]    = useState({ mpesaShortcode: "", mpesaConsumerKey: "", mpesaConsumerSecret: "", mpesaPasskey: "" });
  const [mpesaSaving,  setMpesaSaving]  = useState(false);
  const [mpesaConfigured, setMpesaConfigured] = useState(false);
  const [mpesaRegistered, setMpesaRegistered] = useState(false);
  const [mpesaRegisteredAt, setMpesaRegisteredAt] = useState<string | null>(null);

  // Billing unit prices (ADMIN only)
  const [billingForm,   setBillingForm]   = useState({ waterUnitPrice: "", electricityUnitPrice: "", gasUnitPrice: "" });
  const [billingSaving, setBillingSaving] = useState(false);

  const isAdmin = user?.role === "ADMIN";

  // Load profile from /api/users/me
  useEffect(() => {
    api.get<any>("/api/users/me").then(me => {
      setProfileForm({
        firstName: me.firstName ?? "",
        lastName:  me.lastName  ?? "",
        phone:     me.phone     ?? "",
      });
      setProfileUsername(me.username ?? "");
    }).catch(() => {});
  }, []);

  // Load org settings
  useEffect(() => {
    if (!isAdmin) return;
    api.get<any>("/api/tenants/me").then(t => {
      setOrgForm({
        name:         t.name         ?? "",
        code:         t.code         ?? "",
        contactEmail: t.contactEmail ?? "",
        contactPhone: t.contactPhone ?? "",
      });
      setMpesaForm({
        mpesaShortcode:      t.mpesaShortcode      ?? "",
        mpesaConsumerKey:    t.mpesaConsumerKey    ?? "",
        mpesaConsumerSecret: t.mpesaConsumerSecret ?? "",
        mpesaPasskey:        t.mpesaPasskey        ?? "",
      });
      setMpesaConfigured(
        !!(t.mpesaShortcode && t.mpesaConsumerKey && t.mpesaConsumerSecret && t.mpesaPasskey)
      );
      setMpesaRegistered(!!t.mpesaRegistered);
      setMpesaRegisteredAt(t.mpesaRegisteredAt ?? null);
      setBillingForm({
        waterUnitPrice:       t.waterUnitPrice       != null ? String(t.waterUnitPrice)       : "",
        electricityUnitPrice: t.electricityUnitPrice != null ? String(t.electricityUnitPrice) : "",
        gasUnitPrice:         t.gasUnitPrice         != null ? String(t.gasUnitPrice)         : "",
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

  const handleMpesa = async (e: React.FormEvent) => {
    e.preventDefault();
    setMpesaSaving(true);
    try {
      const updated = await api.patch<any>("/api/tenants/me", mpesaForm);
      const configured = !!(mpesaForm.mpesaShortcode && mpesaForm.mpesaConsumerKey && mpesaForm.mpesaConsumerSecret && mpesaForm.mpesaPasskey);
      setMpesaConfigured(configured);
      setMpesaRegistered(!!updated?.mpesaRegistered);
      setMpesaRegisteredAt(updated?.mpesaRegisteredAt ?? null);
      toast({
        title: configured
          ? (updated?.mpesaRegistered ? "M-Pesa credentials saved & registered on Daraja" : "M-Pesa credentials saved (Daraja registration failed — check your credentials)")
          : "M-Pesa credentials saved",
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setMpesaSaving(false); }
  };

  const handleBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    setBillingSaving(true);
    try {
      await api.patch("/api/tenants/me", billingForm);
      toast({ title: "Billing rates saved" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setBillingSaving(false); }
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
          {profileUsername && (
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Username <span className="normal-case font-normal text-muted-foreground/70">(assigned by admin)</span></Label>
              <Input value={`@${profileUsername}`} disabled className="rounded-none bg-muted/50 text-muted-foreground cursor-not-allowed font-mono text-sm" />
            </div>
          )}
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

      {/* Organisation settings — ADMIN only */}
      {isAdmin && orgLoaded && (
        <div className="rounded-none border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-display text-sm font-semibold uppercase tracking-[0.15em]">Organisation</h2>
          </div>
          <form onSubmit={handleOrg} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Organisation Name</Label>
                <Input value={orgForm.name} disabled className="rounded-none bg-muted/50 text-muted-foreground cursor-not-allowed" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Organisation Code</Label>
                <Input value={orgForm.code} disabled className="rounded-none bg-muted/50 text-muted-foreground cursor-not-allowed font-mono tracking-widest" />
              </div>
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

      {/* M-Pesa Daraja credentials — ADMIN only */}
      {isAdmin && orgLoaded && (
        <div className="rounded-none border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-display text-sm font-semibold uppercase tracking-[0.15em]">M-Pesa Daraja</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 ${mpesaConfigured ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                {mpesaConfigured ? "Configured" : "Not configured"}
              </span>
              {mpesaConfigured && (
                <span
                  className={`text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 ${mpesaRegistered ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}
                  title={mpesaRegistered && mpesaRegisteredAt ? `Registered on ${new Date(mpesaRegisteredAt).toLocaleString()}` : "Callback URL not registered on Daraja"}
                >
                  {mpesaRegistered ? "Daraja ✓" : "Not registered"}
                </span>
              )}
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mb-4">
            Enter your organisation's Safaricom Daraja API credentials. Saving credentials will automatically register
            your callback URL (<span className="font-mono">/api/mpesa/callback/{orgForm.code}</span>) on Daraja.
          </p>
          <form onSubmit={handleMpesa} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Paybill / Shortcode</Label>
              <Input
                value={mpesaForm.mpesaShortcode}
                onChange={e => setMpesaForm(f => ({ ...f, mpesaShortcode: e.target.value }))}
                placeholder="e.g. 174379"
                className="rounded-none font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Consumer Key</Label>
              <Input
                type="password"
                value={mpesaForm.mpesaConsumerKey}
                onChange={e => setMpesaForm(f => ({ ...f, mpesaConsumerKey: e.target.value }))}
                placeholder="Daraja consumer key"
                className="rounded-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Consumer Secret</Label>
              <Input
                type="password"
                value={mpesaForm.mpesaConsumerSecret}
                onChange={e => setMpesaForm(f => ({ ...f, mpesaConsumerSecret: e.target.value }))}
                placeholder="Daraja consumer secret"
                className="rounded-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Passkey</Label>
              <Input
                type="password"
                value={mpesaForm.mpesaPasskey}
                onChange={e => setMpesaForm(f => ({ ...f, mpesaPasskey: e.target.value }))}
                placeholder="Lipa Na M-Pesa passkey"
                className="rounded-none"
              />
            </div>
            <Button type="submit" disabled={mpesaSaving} className="rounded-none bg-brand-red text-white hover:bg-brand-red/90">
              {mpesaSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save M-Pesa Credentials"}
            </Button>
          </form>
        </div>
      )}

      {/* Billing rates — ADMIN only */}
      {isAdmin && orgLoaded && (
        <div className="rounded-none border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-display text-sm font-semibold uppercase tracking-[0.15em]">Billing Rates</h2>
          </div>
          <p className="text-[11px] text-muted-foreground mb-4">
            Unit prices used to calculate invoices from meter readings. Set to 0 to skip billing for that type.
          </p>
          <form onSubmit={handleBilling} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Water (KES / m³)</Label>
                <Input
                  type="number" min="0" step="0.01"
                  value={billingForm.waterUnitPrice}
                  onChange={e => setBillingForm(f => ({ ...f, waterUnitPrice: e.target.value }))}
                  placeholder="0.00"
                  className="rounded-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Electricity (KES / kWh)</Label>
                <Input
                  type="number" min="0" step="0.01"
                  value={billingForm.electricityUnitPrice}
                  onChange={e => setBillingForm(f => ({ ...f, electricityUnitPrice: e.target.value }))}
                  placeholder="0.00"
                  className="rounded-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Gas (KES / m³)</Label>
                <Input
                  type="number" min="0" step="0.01"
                  value={billingForm.gasUnitPrice}
                  onChange={e => setBillingForm(f => ({ ...f, gasUnitPrice: e.target.value }))}
                  placeholder="0.00"
                  className="rounded-none"
                />
              </div>
            </div>
            <Button type="submit" disabled={billingSaving} className="rounded-none bg-brand-red text-white hover:bg-brand-red/90">
              {billingSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Billing Rates"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
