import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Rocket, ArrowRight, Radio, Gauge, ShieldCheck } from "lucide-react";
import heroMeter from "@/assets/hero-meter.jpg";

const ComingSoon = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "You're on the list",
      description: "We'll notify you the moment QuantumConnect goes live.",
    });
    setEmail("");
  };

  return (
    <div className="min-h-screen bg-[hsl(0,0%,7%)] text-white antialiased flex flex-col">

      {/* ── NAVBAR ── */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-5 md:px-10 border-b border-white/10 bg-[hsl(0,0%,7%)]">
        <button onClick={() => navigate("/")} className="flex items-center gap-3 text-white">
          <span className="relative flex h-9 w-9 items-center justify-center">
            <span className="absolute inset-0 rounded-full border-2 border-brand-red" />
            <span className="absolute inset-2 rounded-full border-2 border-white/40" />
            <span className="absolute h-1.5 w-1.5 rounded-full bg-brand-red" />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">QuantumConnect</span>
        </button>
        <div className="flex items-center gap-2 border border-brand-red/30 bg-brand-red/10 px-3 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-red animate-pulse" />
          <span className="font-display text-xs font-semibold uppercase tracking-[0.25em] text-brand-red">In Calibration</span>
        </div>
      </nav>

      {/* ── MAIN SPLIT ── */}
      <div className="grid lg:grid-cols-2 flex-1">

        {/* LEFT — copy + form */}
        <div className="flex flex-col justify-center px-8 py-20 md:px-16 lg:px-20 relative">

          {/* grid overlay */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.04]">
            <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="gCS" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#gCS)" />
            </svg>
          </div>

          {/* red glow */}
          <div
            className="pointer-events-none absolute -left-20 top-1/3 -translate-y-1/2 opacity-25"
            style={{
              width: 400, height: 400, borderRadius: "50%",
              background: "radial-gradient(ellipse, hsl(354,100%,45%,0.4) 0%, transparent 70%)",
            }}
          />

          <div className="relative z-10">
            {/* eyebrow */}
            <div className="mb-6 inline-flex items-center gap-2 border border-brand-red/40 bg-brand-red/10 px-4 py-1.5">
              <Rocket className="h-4 w-4 text-brand-red" strokeWidth={1.5} />
              <span className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-brand-red">
                Launching Soon
              </span>
            </div>

            <h1 className="font-display text-4xl font-semibold leading-tight md:text-5xl lg:text-6xl">
              Something measured<br />
              <span className="text-white/60">is on the way.</span>
            </h1>

            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/50">
              We're calibrating the next generation of smart metering — unifying
              water, electricity and gas under one IoT-native, AI-driven console.
              Be first to plug in.
            </p>

            {/* notify form */}
            <form onSubmit={handleSubmit} className="mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@utility.com"
                aria-label="Email address"
                className="h-12 rounded-none border-white/20 bg-white/[0.06] text-white placeholder:text-white/30 focus-visible:ring-brand-red"
              />
              <Button
                type="submit"
                className="h-12 rounded-none bg-brand-red px-6 font-display text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-brand-red/90 shrink-0"
              >
                Notify me <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </form>
            <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-white/25">
              No spam. One launch ping. Unsubscribe anytime.
            </p>

            {/* feature strip */}
            <dl className="mt-12 grid max-w-lg grid-cols-1 gap-6 border-t border-white/10 pt-8 sm:grid-cols-3">
              <div className="flex items-start gap-3">
                <Radio className="mt-0.5 h-5 w-5 shrink-0 text-brand-red" strokeWidth={1.5} />
                <div>
                  <dt className="font-display text-sm font-semibold">LoRaWAN ready</dt>
                  <dd className="mt-1 text-xs text-white/40">Field-tested mesh telemetry</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Gauge className="mt-0.5 h-5 w-5 shrink-0 text-brand-red" strokeWidth={1.5} />
                <div>
                  <dt className="font-display text-sm font-semibold">Sub-second reads</dt>
                  <dd className="mt-1 text-xs text-white/40">Real-time consumption signals</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-red" strokeWidth={1.5} />
                <div>
                  <dt className="font-display text-sm font-semibold">Tamper proof</dt>
                  <dd className="mt-1 text-xs text-white/40">End-to-end encrypted streams</dd>
                </div>
              </div>
            </dl>
          </div>
        </div>

        {/* RIGHT — meter image panel */}
        <div className="hidden lg:flex flex-col relative overflow-hidden">

          <div className="relative flex-1 overflow-hidden">
            <img
              src={heroMeter}
              alt="QuantumConnect smart utility meter"
              className="h-full w-full object-cover brightness-[0.55]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[hsl(0,0%,7%)]/40 via-transparent to-[hsl(0,0%,7%)]/70" />

            {/* top badge */}
            <div className="absolute top-6 left-6 flex items-center gap-2 border border-brand-red/40 bg-[hsl(0,0%,7%)]/70 px-3 py-1.5 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-red animate-pulse" />
              <span className="font-display text-[10px] font-semibold uppercase tracking-[0.3em] text-brand-red">Live calibration</span>
            </div>

            {/* bottom overlay */}
            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
              <div>
                <p className="font-display text-[10px] uppercase tracking-[0.3em] text-white/50 mb-1">Next-gen module</p>
                <p className="font-display text-lg font-semibold text-white">QC-Meter / Series 9</p>
              </div>
              <div className="border border-white/10 bg-[hsl(0,0%,7%)]/60 px-4 py-2 text-center backdrop-blur-sm">
                <p className="font-display text-2xl font-semibold text-brand-red">Q3</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Launch</p>
              </div>
            </div>
          </div>

          {/* decorative red border on left edge */}
          <div className="absolute left-0 top-0 h-full w-[2px] bg-gradient-to-b from-transparent via-brand-red to-transparent opacity-60" />
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/10 bg-[hsl(0,0%,5%)] px-6 py-5 text-center text-xs text-white/20">
        © {new Date().getFullYear()} QuantumConnect · Smart Metering Intelligence · All rights reserved.
      </footer>
    </div>
  );
};

export default ComingSoon;
