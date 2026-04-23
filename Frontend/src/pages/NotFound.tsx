import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

const cn = (...cls: (string | false | undefined)[]) => cls.filter(Boolean).join(" ");

/* ── Icons ── */
const IconArrowRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);
const IconHome = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const IconWifiOff = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
    <path d="M5 12.55a11 11 0 0 1 5.17-2.39" />
    <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
    <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <circle cx="12" cy="20" r="1" fill="currentColor" />
  </svg>
);

/* ── Glitch 404 ── */
function GlitchNumber() {
  const [glitch, setGlitch] = useState(false);
  useEffect(() => {
    const id = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 140);
    }, 3000);
    return () => clearInterval(id);
  }, []);
  return (
    <span
      className={cn(
        "font-display font-semibold leading-none tracking-tighter text-white transition-all duration-75 select-none",
        "text-[clamp(6rem,15vw,11rem)]",
        glitch && "opacity-80"
      )}
      style={glitch ? { textShadow: "4px 0 hsl(354,100%,45%), -4px 0 rgba(0,220,220,0.5)" } : {}}
    >
      404
    </span>
  );
}

/* ══════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════ */
const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.error("404: non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[hsl(0,0%,7%)] text-white antialiased">

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
          <span className="font-display text-xs font-semibold uppercase tracking-[0.25em] text-brand-red">Signal Lost</span>
        </div>
      </nav>

      {/* ── HERO SPLIT ── */}
      <div className="grid lg:grid-cols-2 min-h-[calc(100vh-65px)]">

        {/* LEFT — text content */}
        <div className="flex flex-col justify-center px-8 py-20 md:px-16 lg:px-20 relative">

          {/* subtle grid overlay on left */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.04]">
            <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="g404" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#g404)" />
            </svg>
          </div>

          {/* red glow blob */}
          <div
            className="pointer-events-none absolute -left-20 top-1/3 -translate-y-1/2 opacity-30"
            style={{
              width: 400, height: 400, borderRadius: "50%",
              background: "radial-gradient(ellipse, hsl(354,100%,45%,0.4) 0%, transparent 70%)",
            }}
          />

          <div className="relative z-10">
            {/* eyebrow badge */}
            <div className="mb-6 inline-flex items-center gap-2 border border-brand-red/40 bg-brand-red/10 px-4 py-1.5">
              <IconWifiOff />
              <span className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-brand-red">
                Connection Not Found
              </span>
            </div>

            {/* glitch number + accent line */}
            <div className="relative inline-block mb-2">
              <GlitchNumber />
              <span className="absolute -bottom-1 left-0 h-[3px] w-full bg-brand-red" />
            </div>

            <h1 className="mt-6 font-display text-3xl font-semibold leading-tight text-white md:text-4xl">
              Signal lost.<br />
              <span className="text-white/60">Page doesn't exist.</span>
            </h1>

            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/50">
              The route you're looking for is off the grid — it may have been moved,
              removed, or never deployed. Let's get you back to the command centre.
            </p>

            {/* terminal path */}
            <div className="mt-6 inline-flex items-center gap-3 border border-white/10 bg-white/[0.04] px-4 py-2.5 font-mono text-xs">
              <span className="text-brand-red">ERR_NOT_FOUND</span>
              <span className="text-white/20">·</span>
              <span className="text-white/40 truncate max-w-[180px]">{location.pathname}</span>
            </div>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap gap-4">
              <button
                onClick={() => navigate("/")}
                className="group flex items-center gap-3 bg-brand-red px-7 py-3.5 font-display text-sm font-semibold uppercase tracking-widest text-white transition-all hover:brightness-110"
              >
                <IconHome />
                Back to Home
                <span className="transition-transform group-hover:translate-x-1"><IconArrowRight /></span>
              </button>
              <button
                onClick={() => navigate("/auth")}
                className="flex items-center gap-3 border border-white/20 px-7 py-3.5 font-display text-sm font-semibold uppercase tracking-widest text-white/70 transition-all hover:border-white/50 hover:text-white"
              >
                Sign In
              </button>
            </div>

            {/* diagnostics widget */}
            <div className="mt-12 border border-white/10 bg-white/[0.03] p-5 max-w-xs">
              <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-brand-red">Live Diagnostics</p>
              {[
                { label: "HTTP Status", val: "404", red: true },
                { label: "Route", val: "Unknown", red: true },
                { label: "Network", val: "Healthy", red: false },
                { label: "API", val: "Online", red: false },
              ].map((r) => (
                <div key={r.label} className="flex items-center justify-between border-b border-white/5 py-2 last:border-0">
                  <span className="text-xs text-white/40">{r.label}</span>
                  <span className={cn("font-display text-xs font-semibold", r.red ? "text-brand-red" : "text-green-400")}>
                    {r.val}
                  </span>
                </div>
              ))}
              <div className="mt-3 h-1 w-full overflow-hidden bg-white/10">
                <div className="h-full w-1/4 bg-brand-red" />
              </div>
              <p className="mt-1.5 text-[10px] text-white/25">System health: 25%</p>
            </div>
          </div>
        </div>

        {/* RIGHT — image collage */}
        <div className="hidden lg:flex flex-col gap-0 relative overflow-hidden">

          {/* top image — network/satellite */}
          <div className="relative flex-1 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=900&q=80&fit=crop"
              alt="Global network"
              className="h-full w-full object-cover brightness-[0.55]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[hsl(0,0%,7%)]/30 via-transparent to-[hsl(0,0%,7%)]/60" />
            <div className="absolute bottom-4 left-5 right-5">
              <p className="font-display text-[10px] uppercase tracking-[0.3em] text-brand-red mb-1">Global Network</p>
              <p className="text-xs text-white/50">102 nodes · All systems nominal</p>
            </div>
          </div>

          {/* bottom row — two images */}
          <div className="flex h-52">
            <div className="relative flex-1 overflow-hidden border-t border-r border-white/10">
              <img
                src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80&fit=crop"
                alt="Server room"
                className="h-full w-full object-cover brightness-[0.5]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[hsl(0,0%,7%)]/80 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-4">
                <p className="font-display text-[10px] uppercase tracking-[0.25em] text-white/50">Infrastructure</p>
              </div>
            </div>
            <div className="relative flex-1 overflow-hidden border-t border-white/10">
              <img
                src="https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&q=80&fit=crop"
                alt="Power grid"
                className="h-full w-full object-cover brightness-[0.5]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[hsl(0,0%,7%)]/80 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-4">
                <p className="font-display text-[10px] uppercase tracking-[0.25em] text-white/50">Grid Status</p>
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

export default NotFound;
