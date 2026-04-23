import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

const API = `${import.meta.env.VITE_API_URL}/api/auth`;

const Auth = () => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = mode === "login" ? `${API}/login` : `${API}/register`;
      const body = mode === "login"
        ? { email, password }
        : { email, password, firstName, lastName };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Authentication failed");
      login({ token: data.token, email: data.email, role: data.role, fullName: data.fullName ?? "" });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: mode === "login" ? "Sign in failed" : "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left brand panel */}
      <div className="relative hidden flex-1 overflow-hidden bg-brand-red lg:block">
        {/* Concentric arcs motif */}
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
            <span className="font-display text-xl font-semibold tracking-tight">
              QuantumConnect
            </span>
          </div>

          <div className="max-w-md">
            <h2 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight">
              Connect at the speed of light.
            </h2>
            <p className="mt-5 text-base text-primary-foreground/80">
              Sign in to manage your network, monitor performance, and deliver
              exceptional experiences to every customer.
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

          <p className="mb-3 text-xs uppercase tracking-[0.25em] text-brand-red">
            Secure access
          </p>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">
            {mode === "login" ? "Welcome back." : "Create account."}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {mode === "login"
              ? "Enter your credentials to continue."
              : "Register a new account to get started."}
          </p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-5">
            {mode === "register" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[11px] font-medium uppercase tracking-[0.15em] text-foreground/70">First name</Label>
                  <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jane" required
                    className="h-12 rounded-none border-0 border-b border-border bg-transparent px-0 focus-visible:border-brand-red focus-visible:ring-0 focus-visible:ring-offset-0" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-medium uppercase tracking-[0.15em] text-foreground/70">Last name</Label>
                  <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Doe"
                    className="h-12 rounded-none border-0 border-b border-border bg-transparent px-0 focus-visible:border-brand-red focus-visible:ring-0 focus-visible:ring-offset-0" />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-[11px] font-medium uppercase tracking-[0.15em] text-foreground/70"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@quantumconnect.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-none border-0 border-b border-border bg-transparent px-0 text-foreground placeholder:text-muted-foreground/60 focus-visible:border-brand-red focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-[11px] font-medium uppercase tracking-[0.15em] text-foreground/70"
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              {loading
                ? mode === "login" ? "Signing in…" : "Registering…"
                : mode === "login" ? "Sign in →" : "Register →"}
            </Button>
          </form>

          <p className="mt-10 text-xs text-muted-foreground">
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <button
                  onClick={() => setMode("register")}
                  className="underline hover:text-foreground"
                >
                  Register
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => setMode("login")}
                  className="underline hover:text-foreground"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
