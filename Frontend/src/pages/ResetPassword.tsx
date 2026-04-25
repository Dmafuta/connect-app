import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const API = `${import.meta.env.VITE_API_URL}/api/auth`;

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token      = searchParams.get("token") ?? "";
  const email      = searchParams.get("email") ?? "";
  const tenantCode = searchParams.get("tenant") ?? "";

  const [password, setPassword]   = useState("");
  const [confirm,  setConfirm]    = useState("");
  const [loading,  setLoading]    = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, tenantCode, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Reset failed");
      toast({ title: "Password updated", description: "You can now sign in with your new password." });
      navigate("/auth");
    } catch (error: any) {
      toast({ title: "Reset failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email || !tenantCode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="max-w-sm text-center">
          <p className="text-sm text-muted-foreground">
            This reset link is invalid or has expired.{" "}
            <button onClick={() => navigate("/auth")} className="underline hover:text-foreground">
              Request a new one
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left brand panel */}
      <div className="relative hidden flex-1 overflow-hidden bg-brand-red lg:block">
        <svg
          className="absolute -left-40 -top-40 h-[140%] w-[140%] text-primary-foreground/20"
          viewBox="0 0 600 600"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="300" cy="300" r="260" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="300" cy="300" r="200" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="300" cy="300" r="140" stroke="hsl(var(--brand-black))" strokeOpacity="0.4" strokeWidth="1.5" />
          <circle cx="300" cy="300" r="80" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <div className="relative z-10 flex h-full flex-col justify-between p-12 text-primary-foreground">
          <div className="flex items-center gap-3">
            <span className="relative flex h-9 w-9 items-center justify-center">
              <span className="absolute inset-0 rounded-full border-2 border-primary-foreground" />
              <span className="absolute inset-1 rounded-full border-2 border-brand-black" />
            </span>
            <span className="font-display text-xl font-semibold tracking-tight">QuantumConnect</span>
          </div>
          <div className="max-w-md">
            <h2 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight">
              New password, fresh start.
            </h2>
            <p className="mt-5 text-base text-primary-foreground/80">
              Choose a strong password to secure your account.
            </p>
          </div>
          <p className="text-xs uppercase tracking-[0.25em] text-primary-foreground/70">
            © QuantumConnect — Identity Portal
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex w-full items-center justify-center lg:w-[520px] lg:flex-none">
        <div className="w-full max-w-[400px] px-8 py-12">
          <div className="mb-10 flex items-center gap-2 lg:hidden">
            <span className="relative flex h-8 w-8 items-center justify-center">
              <span className="absolute inset-0 rounded-full border-2 border-brand-red" />
              <span className="absolute inset-1 rounded-full border-2 border-brand-black" />
            </span>
            <span className="font-display text-lg font-semibold">QuantumConnect</span>
          </div>

          <p className="mb-3 text-xs uppercase tracking-[0.25em] text-brand-red">Password recovery</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">
            Set new password.
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Resetting password for <span className="font-medium text-foreground">{email}</span>.
          </p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[11px] font-medium uppercase tracking-[0.15em] text-foreground/70">
                New password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-12 rounded-none border-0 border-b border-border bg-transparent px-0 text-foreground placeholder:text-muted-foreground/60 focus-visible:border-brand-red focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-[11px] font-medium uppercase tracking-[0.15em] text-foreground/70">
                Confirm password
              </Label>
              <Input
                id="confirm"
                type="password"
                placeholder="••••••••••"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                minLength={6}
                className="h-12 rounded-none border-0 border-b border-border bg-transparent px-0 text-foreground placeholder:text-muted-foreground/60 focus-visible:border-brand-red focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="mt-4 h-12 w-full rounded-none bg-brand-black font-display text-sm font-semibold uppercase tracking-[0.2em] text-primary-foreground transition-colors hover:bg-brand-red"
            >
              {loading ? "Updating…" : "Update password →"}
            </Button>
          </form>

          <p className="mt-10 text-xs text-muted-foreground">
            Remember your password?{" "}
            <button onClick={() => navigate("/auth")} className="underline hover:text-foreground">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
