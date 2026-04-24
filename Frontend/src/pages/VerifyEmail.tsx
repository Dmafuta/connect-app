import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const API = `${import.meta.env.VITE_API_URL}/api/auth`;

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      setStatus("error");
      setMessage("Invalid verification link.");
      return;
    }

    fetch(`${API}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`)
      .then(res => res.json())
      .then(data => {
        if (data.message?.toLowerCase().includes("success") || data.message?.toLowerCase().includes("verified")) {
          setStatus("success");
          setMessage(data.message);
        } else {
          setStatus("error");
          setMessage(data.message || "Verification failed.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <span className="relative flex h-10 w-10 items-center justify-center">
            <span className="absolute inset-0 rounded-full border-2 border-brand-red" />
            <span className="absolute inset-1.5 rounded-full border-2 border-foreground" />
          </span>
        </div>

        {status === "loading" && (
          <>
            <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-brand-red" />
            <h1 className="font-display text-2xl font-semibold tracking-tight">Verifying your email…</h1>
            <p className="mt-2 text-sm text-muted-foreground">Please wait a moment.</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-emerald-500" />
            <h1 className="font-display text-2xl font-semibold tracking-tight">Email verified!</h1>
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
            <Button
              onClick={() => navigate("/auth")}
              className="mt-8 h-11 w-full rounded-none bg-brand-red font-display text-sm font-semibold uppercase tracking-[0.2em] text-white hover:bg-brand-red/90"
            >
              Sign in →
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="mx-auto mb-4 h-10 w-10 text-rose-500" />
            <h1 className="font-display text-2xl font-semibold tracking-tight">Verification failed</h1>
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
            <Button
              onClick={() => navigate("/auth")}
              variant="outline"
              className="mt-8 h-11 w-full rounded-none font-display text-sm font-semibold uppercase tracking-[0.2em]"
            >
              Back to sign in
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
