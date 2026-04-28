import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

const API = `${import.meta.env.VITE_API_URL}/api/auth`;

type Mode = "login" | "register" | "verify-phone" | "forgot-password" | "verify-login-otp";

const Auth = () => {
  const [mode, setMode] = useState<Mode>("login");
  const [isPlatformLogin, setIsPlatformLogin] = useState(false);
  const [tenantCode, setTenantCode] = useState("");
  const [identifier, setIdentifier] = useState(""); // email or username for login
  const [email, setEmail] = useState("");            // email only for register/forgot/otp
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameEdited, setUsernameEdited] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  // Auto-suggest username from first + last name (only if user hasn't manually edited it)
  const suggestUsername = (first: string, last: string) => {
    if (usernameEdited) return;
    const raw = `${first.trim()}.${last.trim()}`.toLowerCase().replace(/[^a-z0-9._-]/g, "").replace(/\.+/g, ".").replace(/^\./, "");
    setUsername(raw.substring(0, 30));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "forgot-password") {
        const res = await fetch(`${API}/forgot-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tenantCode: isPlatformLogin ? "" : tenantCode, email }),
        });
        const data = await res.json();
        toast({ title: "Check your email", description: data.message });
        setMode("login");
        return;
      }

      if (mode === "verify-phone") {
        const res = await fetch(`${API}/verify-phone`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, code: otp }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Verification failed");
        toast({ title: "Phone verified!", description: "You can now sign in." });
        setMode("login");
        return;
      }

      if (mode === "verify-login-otp") {
        const res = await fetch(`${API}/verify-login-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code: otp, tenantCode: isPlatformLogin ? "" : tenantCode }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Verification failed");
        login({
          token: data.token,
          refreshToken: data.refreshToken ?? "",
          email: data.email,
          role: data.role,
          fullName: data.fullName ?? "",
          tenantCode: data.tenantCode ?? tenantCode,
          tenantName: data.tenantName ?? "",
        });
        navigate("/dashboard");
        return;
      }

      const endpoint = mode === "login" ? `${API}/login` : `${API}/register`;
      const reqBody = mode === "login"
        ? { tenantCode: isPlatformLogin ? "" : tenantCode, identifier, password }
        : { tenantCode, email, password, firstName, lastName, phone, username };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Authentication failed");

      if (mode === "register") {
        toast({ title: "Account created!", description: data.message });
        if (data.phoneSent) {
          setMode("verify-phone");
        } else {
          setMode("login");
        }
        return;
      }

      // Login step 1 succeeded — OTP was sent
      if (data.status === "OTP_REQUIRED") {
        if (data.email) setEmail(data.email); // capture real email for OTP step
        toast({ title: "Check your email", description: data.message });
        setMode("verify-login-otp");
        return;
      }

      login({
        token: data.token,
        refreshToken: data.refreshToken ?? "",
        email: data.email,
        role: data.role,
        fullName: data.fullName ?? "",
        tenantCode: data.tenantCode ?? tenantCode,
        tenantName: data.tenantName ?? "",
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: mode === "login" ? "Sign in failed" : mode === "register" ? "Registration failed" : "Verification failed",
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
            {mode === "verify-phone" || mode === "verify-login-otp" ? "Verification" : mode === "forgot-password" ? "Password recovery" : "Secure access"}
          </p>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">
            {mode === "login" ? "Welcome back." : mode === "register" ? "Create account." : mode === "forgot-password" ? "Reset password." : "Verify code."}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {mode === "login"
              ? isPlatformLogin
                ? "Platform access — enter your credentials to continue."
                : "Enter your organisation code and credentials to continue."
              : mode === "register"
              ? "Register a new account to get started."
              : mode === "forgot-password"
              ? isPlatformLogin
                ? "Enter your email. We'll send you a reset link."
                : "Enter your organisation code and email. We'll send you a reset link."
              : mode === "verify-login-otp"
              ? `Enter the 6-digit code sent to ${email}.`
              : `Enter the OTP sent to ${phone}. Also check your email for a verification link.`}
          </p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-5">
            {mode === "forgot-password" ? (
              <>
                {!isPlatformLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="tenantCode" className="text-[11px] font-medium uppercase tracking-[0.15em] text-foreground/70">
                      Organisation code
                    </Label>
                    <Input
                      id="tenantCode"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="e.g. 432910"
                      value={tenantCode}
                      onChange={e => setTenantCode(e.target.value.replace(/\D/g, ""))}
                      required
                      className="h-12 rounded-none border-0 border-b border-border bg-transparent px-0 text-foreground placeholder:text-muted-foreground/60 focus-visible:border-brand-red focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[11px] font-medium uppercase tracking-[0.15em] text-foreground/70">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" value={email}
                    onChange={e => setEmail(e.target.value)} required
                    className="h-12 rounded-none border-0 border-b border-border bg-transparent px-0 text-foreground placeholder:text-muted-foreground/60 focus-visible:border-brand-red focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </>
            ) : mode === "verify-phone" || mode === "verify-login-otp" ? (
              <div className="space-y-2">
                <Label className="text-[11px] font-medium uppercase tracking-[0.15em] text-foreground/70">
                  Verification code
                </Label>
                <Input type="text" inputMode="numeric" maxLength={6} placeholder="000000"
                  value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))} required
                  autoFocus
                  className="h-12 rounded-none border-0 border-b border-border bg-transparent px-0 text-center text-2xl font-semibold tracking-[0.5em] text-foreground focus-visible:border-brand-red focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            ) : (
              <>
                {!isPlatformLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="tenantCode" className="text-[11px] font-medium uppercase tracking-[0.15em] text-foreground/70">
                      Organisation code
                    </Label>
                    <Input
                      id="tenantCode"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="e.g. 432910"
                      value={tenantCode}
                      onChange={e => setTenantCode(e.target.value.replace(/\D/g, ""))}
                      required
                      className="h-12 rounded-none border-0 border-b border-border bg-transparent px-0 text-foreground placeholder:text-muted-foreground/60 focus-visible:border-brand-red focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                )}
                {mode === "register" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[11px] font-medium uppercase tracking-[0.15em] text-foreground/70">First name</Label>
                        <Input value={firstName} onChange={e => { setFirstName(e.target.value); suggestUsername(e.target.value, lastName); }} placeholder="Jane" required
                          className="h-12 rounded-none border-0 border-b border-border bg-transparent px-0 focus-visible:border-brand-red focus-visible:ring-0 focus-visible:ring-offset-0" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-medium uppercase tracking-[0.15em] text-foreground/70">Last name</Label>
                        <Input value={lastName} onChange={e => { setLastName(e.target.value); suggestUsername(firstName, e.target.value); }} placeholder="Doe"
                          className="h-12 rounded-none border-0 border-b border-border bg-transparent px-0 focus-visible:border-brand-red focus-visible:ring-0 focus-visible:ring-offset-0" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-medium uppercase tracking-[0.15em] text-foreground/70">
                        Phone <span className="normal-case text-muted-foreground">(optional, e.g. +254712345678)</span>
                      </Label>
                      <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+254712345678"
                        className="h-12 rounded-none border-0 border-b border-border bg-transparent px-0 focus-visible:border-brand-red focus-visible:ring-0 focus-visible:ring-offset-0" />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label htmlFor="emailOrId" className="text-[11px] font-medium uppercase tracking-[0.15em] text-foreground/70">
                    {mode === "login" ? "Email or username" : "Email"}
                  </Label>
                  {mode === "login" ? (
                    <Input id="emailOrId" type="text" placeholder="you@example.com or your_username" value={identifier}
                      onChange={e => setIdentifier(e.target.value)} required
                      className="h-12 rounded-none border-0 border-b border-border bg-transparent px-0 text-foreground placeholder:text-muted-foreground/60 focus-visible:border-brand-red focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  ) : (
                    <Input id="emailOrId" type="email" placeholder="you@example.com" value={email}
                      onChange={e => setEmail(e.target.value)} required
                      className="h-12 rounded-none border-0 border-b border-border bg-transparent px-0 text-foreground placeholder:text-muted-foreground/60 focus-visible:border-brand-red focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  )}
                </div>
                {mode === "register" && (
                  <div className="space-y-2">
                    <Label className="text-[11px] font-medium uppercase tracking-[0.15em] text-foreground/70">
                      Username <span className="normal-case text-muted-foreground">(letters, numbers, . _ -)</span>
                    </Label>
                    <Input value={username}
                      onChange={e => { setUsername(e.target.value); setUsernameEdited(true); }}
                      placeholder="jane.doe" required minLength={3} maxLength={30}
                      pattern="^[a-zA-Z0-9._-]{3,30}$"
                      title="3–30 characters: letters, numbers, dots, underscores, hyphens"
                      className="h-12 rounded-none border-0 border-b border-border bg-transparent px-0 focus-visible:border-brand-red focus-visible:ring-0 focus-visible:ring-offset-0" />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[11px] font-medium uppercase tracking-[0.15em] text-foreground/70">Password</Label>
                  <Input id="password" type="password" placeholder="••••••••••" value={password}
                    onChange={e => setPassword(e.target.value)} required minLength={6}
                    className="h-12 rounded-none border-0 border-b border-border bg-transparent px-0 text-foreground placeholder:text-muted-foreground/60 focus-visible:border-brand-red focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </>
            )}

            <Button type="submit" disabled={loading}
              className="mt-4 h-12 w-full rounded-none bg-brand-black font-display text-sm font-semibold uppercase tracking-[0.2em] text-primary-foreground transition-colors hover:bg-brand-red"
            >
              {loading
                ? mode === "login" ? "Signing in…" : mode === "register" ? "Registering…" : mode === "forgot-password" ? "Sending…" : "Verifying…"
                : mode === "login" ? "Sign in →" : mode === "register" ? "Register →" : mode === "forgot-password" ? "Send reset link →" : mode === "verify-login-otp" ? "Confirm →" : "Verify phone →"}
            </Button>
          </form>

          <p className="mt-10 text-xs text-muted-foreground">
            {mode === "verify-login-otp" ? (
              <>
                Didn't receive a code?{" "}
                <button onClick={() => setMode("login")} className="underline hover:text-foreground">Back to sign in</button>
              </>
            ) : mode === "verify-phone" ? (
              <>
                Skip for now?{" "}
                <button onClick={() => setMode("login")} className="underline hover:text-foreground">Sign in</button>
              </>
            ) : mode === "forgot-password" ? (
              <>
                Remember your password?{" "}
                <button onClick={() => setMode("login")} className="underline hover:text-foreground">Sign in</button>
              </>
            ) : mode === "login" ? (
              <>
                <button onClick={() => setMode("forgot-password")} className="underline hover:text-foreground">Forgot password?</button>
                {" · "}
                Don't have an account?{" "}
                <button onClick={() => setMode("register")} className="underline hover:text-foreground">Register</button>
                <br className="mt-4" />
                <span className="mt-4 inline-block">
                  {isPlatformLogin ? (
                    <>
                      Tenant login?{" "}
                      <button
                        onClick={() => setIsPlatformLogin(false)}
                        className="underline hover:text-foreground"
                      >
                        Use organisation code
                      </button>
                    </>
                  ) : (
                    <>
                      Quantum staff?{" "}
                      <button
                        onClick={() => { setIsPlatformLogin(true); setTenantCode(""); }}
                        className="underline hover:text-foreground"
                      >
                        Platform access
                      </button>
                    </>
                  )}
                </span>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button onClick={() => setMode("login")} className="underline hover:text-foreground">Sign in</button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
