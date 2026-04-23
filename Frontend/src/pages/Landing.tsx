import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

/* ─── tiny helpers ─── */
const cn = (...cls: (string | false | undefined)[]) => cls.filter(Boolean).join(" ");

/* ─── stat counter hook ─── */
function useCounter(target: number, duration = 2000, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf: number;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return value;
}

/* ─── intersection observer hook ─── */
function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ══════════════════════════════════════════════
   ICON COMPONENTS (inline SVG — no deps needed)
══════════════════════════════════════════════ */
const IconWifi = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/>
  </svg>
);
const IconBrain = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.14z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.14z"/>
  </svg>
);
const IconZap = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const IconDroplets = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/>
  </svg>
);
const IconFlame = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
  </svg>
);
const IconCloud = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z"/>
  </svg>
);
const IconShield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IconBarChart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);
const IconCpu = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/>
    <line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/>
    <line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/>
    <line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/>
    <line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>
  </svg>
);
const IconGlobe = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);
const IconArrowRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconMenu = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);
const IconX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

/* ══════════════════════════════════════════════
   ANIMATED HERO BACKGROUND
══════════════════════════════════════════════ */
const HeroBackground = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden">
    {/* base dark gradient */}
    <div className="absolute inset-0 bg-[hsl(0,0%,4%)]" />

    {/* red radial glow */}
    <div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{
        width: "80vw",
        height: "80vw",
        borderRadius: "50%",
        background: "radial-gradient(ellipse at center, hsl(354,100%,45%,0.18) 0%, transparent 70%)",
      }}
    />

    {/* grid lines */}
    <svg className="absolute inset-0 h-full w-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>

    {/* floating data pulses */}
    {[
      { cx: "20%", cy: "30%", r: 120, delay: "0s" },
      { cx: "80%", cy: "25%", r: 80, delay: "0.8s" },
      { cx: "65%", cy: "70%", r: 100, delay: "1.4s" },
      { cx: "15%", cy: "75%", r: 60, delay: "0.4s" },
    ].map((p, i) => (
      <svg key={i} className="absolute inset-0 h-full w-full" style={{ left: 0, top: 0 }}>
        <circle
          cx={p.cx} cy={p.cy} r={p.r}
          fill="none" stroke="hsl(354,100%,45%)" strokeWidth="0.5" opacity="0.3"
          style={{
            animation: `ping 3s cubic-bezier(0,0,0.2,1) infinite`,
            animationDelay: p.delay,
          }}
        />
      </svg>
    ))}

    {/* connecting lines motif */}
    <svg className="absolute inset-0 h-full w-full opacity-[0.08]" viewBox="0 0 1440 800" preserveAspectRatio="xMidYMid slice">
      <line x1="200" y1="100" x2="600" y2="350" stroke="white" strokeWidth="0.8" />
      <line x1="600" y1="350" x2="900" y2="200" stroke="white" strokeWidth="0.8" />
      <line x1="900" y1="200" x2="1300" y2="500" stroke="white" strokeWidth="0.8" />
      <line x1="300" y1="600" x2="700" y2="450" stroke="white" strokeWidth="0.8" />
      <line x1="700" y1="450" x2="1100" y2="650" stroke="white" strokeWidth="0.8" />
      {[200, 600, 900, 1300, 300, 700, 1100].map((x, i) => (
        <circle key={i} cx={x} cy={[100, 350, 200, 500, 600, 450, 650][i]} r="3" fill="hsl(354,100%,45%)" opacity="0.6" />
      ))}
    </svg>

    <style>{`
      @keyframes ping {
        75%, 100% { transform: scale(1.6); opacity: 0; }
      }
    `}</style>
  </div>
);

/* ══════════════════════════════════════════════
   HERO CAROUSEL
══════════════════════════════════════════════ */
function HeroCarousel() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const SLIDES = 2;

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setCurrent(p => (p + 1) % SLIDES), 6500);
    return () => clearInterval(id);
  }, [paused]);

  return (
    <section
      className="relative min-h-screen overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ── Slide 0 : Split layout (new design) ── */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-1000",
          current === 0 ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"
        )}
      >
        {/* dark base */}
        <div className="absolute inset-0 bg-[hsl(0,0%,4%)]" />

        {/* right-side image */}
        <div className="absolute inset-y-0 right-0 w-full lg:w-[55%]">
          <img
            src="https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1200&q=80&fit=crop"
            alt="Smart metering infrastructure"
            className="h-full w-full object-cover brightness-[0.35]"
          />
          {/* gradient fade to left */}
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(0,0%,4%)] via-[hsl(0,0%,4%)]/60 to-transparent" />
          {/* subtle red tint on right edge */}
          <div
            className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse at 80% 50%, hsl(354,100%,45%,0.12) 0%, transparent 60%)" }}
          />
        </div>

        {/* grid overlay */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid-s0" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-s0)" />
        </svg>

        {/* text content */}
        <div className="relative z-10 flex min-h-screen items-center">
          <div className="mx-auto max-w-7xl w-full px-6 py-32 lg:py-0">
            <div className="max-w-xl">
              {/* eyebrow */}
              <div className="mb-8 flex items-center gap-3">
                <span className="h-px w-8 bg-brand-red" />
                <span className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-brand-red">
                  Smart Utility Intelligence
                </span>
              </div>

              {/* heading */}
              <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight text-white md:text-6xl lg:text-7xl">
                Every drop, watt
                <br />and therm —{" "}
                <span className="text-brand-red">measured in real time.</span>
              </h1>

              <p className="mt-7 max-w-md text-sm leading-relaxed text-white/55 md:text-base">
                QuantumConnect unifies IoT smart meters, machine learning and cloud
                analytics for water, electricity and gas utilities. Cut losses,
                forecast demand and bill with precision.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => navigate("/auth")}
                  className="group flex items-center gap-3 bg-brand-red px-7 py-3.5 font-display text-sm font-semibold uppercase tracking-widest text-white transition-all hover:brightness-110"
                >
                  Explore Solutions
                  <IconArrowRight />
                </button>
                <a
                  href="#how-it-works"
                  className="font-display text-sm font-semibold uppercase tracking-widest text-white/60 transition-colors hover:text-white"
                >
                  See How It Works →
                </a>
              </div>

              {/* stats row */}
              <div className="mt-12 flex flex-wrap gap-10 border-t border-white/10 pt-8">
                {[
                  { val: "2.4M+", label: "Meters Online" },
                  { val: "38%",   label: "NRW Reduction" },
                  { val: "99.95%",label: "Uptime SLA" },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="font-display text-2xl font-bold text-brand-red">{s.val}</p>
                    <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/40">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Slide 1 : Original centered design ── */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-1000",
          current === 1 ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"
        )}
      >
        <HeroBackground />
        <div className="relative z-10 flex min-h-screen items-center">
          <div className="mx-auto max-w-7xl w-full px-6 py-32 text-center">
            <div className="mb-8 inline-flex items-center gap-2 border border-brand-red/30 bg-brand-red/10 px-4 py-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-red" />
              <span className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-brand-red">
                IoT · ML · Smart Metering
              </span>
            </div>

            <h1 className="font-display text-5xl font-semibold leading-[1.0] tracking-tight text-white md:text-7xl lg:text-8xl">
              The Future of
              <br />
              <span className="text-brand-red">Utility Intelligence</span>
            </h1>

            <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-white/60 md:text-lg">
              QuantumConnect unifies smart metering for water, electricity, and gas
              into one AI-powered platform — delivering real-time visibility,
              predictive analytics, and automated anomaly detection at scale.
            </p>

            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button
                onClick={() => navigate("/auth")}
                className="group flex items-center gap-3 bg-brand-red px-8 py-4 font-display text-sm font-semibold uppercase tracking-widest text-white transition-all hover:brightness-110"
              >
                Start Monitoring
                <span className="transition-transform group-hover:translate-x-1"><IconArrowRight /></span>
              </button>
              <a
                href="#how-it-works"
                className="flex items-center gap-3 border border-white/20 px-8 py-4 font-display text-sm font-semibold uppercase tracking-widest text-white/70 transition-all hover:border-white/50 hover:text-white"
              >
                See How It Works
              </a>
            </div>

            <div className="mt-20 flex flex-col items-center gap-2 text-white/30">
              <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
              <div className="h-8 w-px animate-bounce bg-brand-red/50" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Dot indicators ── */}
      <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
        {Array.from({ length: SLIDES }).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              current === i ? "w-8 bg-brand-red" : "w-1.5 bg-white/30 hover:bg-white/50"
            )}
          />
        ))}
      </div>

      {/* ── Arrow controls ── */}
      <button
        onClick={() => setCurrent(p => (p - 1 + SLIDES) % SLIDES)}
        className="absolute left-4 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center border border-white/20 bg-black/30 text-white/60 transition-all hover:border-white/50 hover:text-white backdrop-blur-sm"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <button
        onClick={() => setCurrent(p => (p + 1) % SLIDES)}
        className="absolute right-4 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center border border-white/20 bg-black/30 text-white/60 transition-all hover:border-white/50 hover:text-white backdrop-blur-sm"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </section>
  );
}

/* ══════════════════════════════════════════════
   NAVBAR
══════════════════════════════════════════════ */
function Navbar() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const links = ["Solutions", "Technology", "How It Works", "About"];

  return (
    <nav
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "bg-[hsl(0,0%,4%)/95] backdrop-blur-md border-b border-white/10"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center gap-3 text-white"
        >
          <span className="relative flex h-9 w-9 items-center justify-center">
            <span className="absolute inset-0 rounded-full border-2 border-brand-red" />
            <span className="absolute inset-2 rounded-full border-2 border-white/40" />
            <span className="absolute h-1.5 w-1.5 rounded-full bg-brand-red" />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">
            QuantumConnect
          </span>
        </button>

        {/* Desktop links */}
        <div className="hidden items-center gap-8 lg:flex">
          {links.map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase().replace(/ /g, "-")}`}
              className="text-sm text-white/70 transition-colors hover:text-white"
            >
              {l}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden items-center gap-3 lg:flex">
          <button
            onClick={() => navigate("/auth")}
            className="text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            Sign in
          </button>
          <button
            onClick={() => navigate("/auth")}
            className="bg-brand-red px-5 py-2 font-display text-sm font-semibold uppercase tracking-widest text-white transition-all hover:brightness-110"
          >
            Get Started →
          </button>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="text-white lg:hidden"
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <IconX /> : <IconMenu />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-white/10 bg-[hsl(0,0%,4%)] px-6 py-4 lg:hidden">
          {links.map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase().replace(/ /g, "-")}`}
              onClick={() => setMenuOpen(false)}
              className="block py-3 text-sm text-white/70 hover:text-white"
            >
              {l}
            </a>
          ))}
          <button
            onClick={() => navigate("/auth")}
            className="mt-4 w-full bg-brand-red py-3 font-display text-sm font-semibold uppercase tracking-widest text-white"
          >
            Get Started →
          </button>
        </div>
      )}
    </nav>
  );
}

/* ══════════════════════════════════════════════
   STAT CARD
══════════════════════════════════════════════ */
function StatCard({ value, unit, label, start }: { value: number; unit: string; label: string; start: boolean }) {
  const count = useCounter(value, 2000, start);
  return (
    <div className="border-l-2 border-brand-red pl-5">
      <div className="font-display text-4xl font-semibold text-white">
        {count.toLocaleString()}
        <span className="text-brand-red">{unit}</span>
      </div>
      <p className="mt-1 text-sm text-white/50">{label}</p>
    </div>
  );
}

/* ══════════════════════════════════════════════
   FEATURE CARD
══════════════════════════════════════════════ */
function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="group border border-white/10 bg-white/[0.03] p-8 transition-all duration-300 hover:border-brand-red/50 hover:bg-white/[0.06]">
      <div className="mb-5 inline-flex h-12 w-12 items-center justify-center border border-brand-red/30 text-brand-red transition-all group-hover:border-brand-red group-hover:bg-brand-red/10">
        {icon}
      </div>
      <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-white/50">{desc}</p>
    </div>
  );
}

/* ══════════════════════════════════════════════
   UTILITY CARD
══════════════════════════════════════════════ */
function UtilityCard({
  icon, label, img, features,
}: {
  icon: React.ReactNode; label: string; img: string; features: string[];
}) {
  return (
    <div className="group relative overflow-hidden border border-white/10 transition-all duration-500 hover:border-brand-red/60">
      {/* image */}
      <div className="relative h-56 overflow-hidden">
        <img
          src={img}
          alt={label}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 brightness-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(0,0%,4%)] via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white">
          <span className="text-brand-red">{icon}</span>
          <span className="font-display text-lg font-semibold">{label}</span>
        </div>
      </div>
      {/* features */}
      <div className="bg-[hsl(0,0%,6%)] p-6">
        <ul className="space-y-3">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-3 text-sm text-white/60">
              <span className="text-brand-red"><IconCheck /></span>
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   STEP CARD
══════════════════════════════════════════════ */
function StepCard({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="relative flex gap-6">
      <div className="flex flex-col items-center">
        <div className="flex h-10 w-10 flex-none items-center justify-center border-2 border-brand-red font-display text-sm font-bold text-brand-red">
          {String(n).padStart(2, "0")}
        </div>
        {n < 4 && <div className="mt-2 h-full w-px bg-brand-red/20" />}
      </div>
      <div className="pb-10">
        <h4 className="font-display text-lg font-semibold text-white">{title}</h4>
        <p className="mt-2 text-sm leading-relaxed text-white/50">{desc}</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   TESTIMONIAL CARD
══════════════════════════════════════════════ */
function TestimonialCard({ quote, name, role, company }: { quote: string; name: string; role: string; company: string }) {
  return (
    <div className="border border-white/10 bg-white/[0.03] p-8">
      <p className="text-sm leading-relaxed text-white/70 italic">"{quote}"</p>
      <div className="mt-6 flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center bg-brand-red font-display text-sm font-bold text-white">
          {name[0]}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{name}</p>
          <p className="text-xs text-white/40">{role} · {company}</p>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════ */
const Landing = () => {
  const navigate = useNavigate();
  const statsRef = useInView(0.3);
  const [statsStarted, setStatsStarted] = useState(false);

  useEffect(() => {
    if (statsRef.inView) setStatsStarted(true);
  }, [statsRef.inView]);

  return (
    <div className="min-h-screen bg-[hsl(0,0%,4%)] text-white antialiased">
      <Navbar />

      {/* ── HERO CAROUSEL ── */}
      <HeroCarousel />

      {/* ── STATS STRIP ── */}
      <section ref={statsRef.ref} className="border-y border-white/10 bg-[hsl(0,0%,6%)]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-white/10 lg:grid-cols-4">
          {[
            { value: 2400000, unit: "+", label: "Smart meters deployed globally" },
            { value: 98, unit: "%", label: "Real-time uptime SLA" },
            { value: 35, unit: "%", label: "Average utility waste reduction" },
            { value: 160, unit: "+", label: "Utility companies onboarded" },
          ].map((s) => (
            <div key={s.label} className="bg-[hsl(0,0%,6%)] px-8 py-10">
              <StatCard value={s.value} unit={s.unit} label={s.label} start={statsStarted} />
            </div>
          ))}
        </div>
      </section>

      {/* ── SOLUTIONS / UTILITIES ── */}
      <section id="solutions" className="py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 max-w-xl">
            <p className="mb-4 font-display text-xs font-semibold uppercase tracking-[0.3em] text-brand-red">
              Core Solutions
            </p>
            <h2 className="font-display text-4xl font-semibold leading-tight text-white md:text-5xl">
              Three utilities. One unified platform.
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-white/50">
              Whether you're managing a municipal water network, a national power grid, or
              commercial gas distribution — QuantumConnect gives you the data, the insights,
              and the control.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <UtilityCard
              icon={<IconZap />}
              label="Electricity Metering"
              img="https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&q=80&fit=crop"
              features={[
                "Sub-second demand monitoring",
                "ML-based load forecasting",
                "Automatic outage detection",
                "Time-of-use tariff analytics",
              ]}
            />
            <UtilityCard
              icon={<IconDroplets />}
              label="Water Metering"
              img="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80&fit=crop"
              features={[
                "NRW (Non-Revenue Water) tracking",
                "Pressure zone analytics",
                "Leak detection via AI",
                "Per-zone consumption profiling",
              ]}
            />
            <UtilityCard
              icon={<IconFlame />}
              label="Gas Metering"
              img="https://images.unsplash.com/photo-1611270629569-8b357cb88da9?w=800&q=80&fit=crop"
              features={[
                "Calorific value monitoring",
                "Pipeline pressure telemetry",
                "Safety anomaly alerts",
                "Seasonal demand modelling",
              ]}
            />
          </div>
        </div>
      </section>

      {/* ── TECHNOLOGY ── */}
      <section id="technology" className="border-t border-white/10 bg-[hsl(0,0%,6%)] py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 grid gap-16 lg:grid-cols-2">
            <div>
              <p className="mb-4 font-display text-xs font-semibold uppercase tracking-[0.3em] text-brand-red">
                Technology Stack
              </p>
              <h2 className="font-display text-4xl font-semibold leading-tight text-white md:text-5xl">
                Built on the edge of what's possible.
              </h2>
            </div>
            <p className="self-end text-sm leading-relaxed text-white/50">
              We integrate cutting-edge IoT hardware, edge computing, cloud-native
              infrastructure, and machine learning pipelines so your operations team
              gets clean, actionable intelligence — not raw data noise.
            </p>
          </div>

          <div className="grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: <IconWifi />,
                title: "IoT Connectivity",
                desc: "NB-IoT, LoRaWAN, and LTE-M sensors transmit readings every 15 minutes with <1% packet loss, even in underground vaults.",
              },
              {
                icon: <IconBrain />,
                title: "Machine Learning",
                desc: "LSTM and transformer models predict consumption patterns, flag anomalies, and continuously retrain on your live data streams.",
              },
              {
                icon: <IconCpu />,
                title: "Edge Computing",
                desc: "Embedded edge nodes pre-process meter data locally, reducing cloud payload by 60% while enabling offline-resilient operation.",
              },
              {
                icon: <IconCloud />,
                title: "Cloud & API",
                desc: "Multi-region cloud deployment with a fully documented REST & WebSocket API — integrate with any SCADA, ERP, or GIS system.",
              },
              {
                icon: <IconShield />,
                title: "Cybersecurity",
                desc: "End-to-end AES-256 encryption, zero-trust network architecture, and ISO 27001-compliant data handling.",
              },
              {
                icon: <IconBarChart />,
                title: "Real-time Analytics",
                desc: "Live dashboards with configurable KPIs, multi-utility benchmarking, and automated regulatory reporting exports.",
              },
              {
                icon: <IconGlobe />,
                title: "Digital Twin",
                desc: "Simulate network behaviour, test tariff scenarios, and model infrastructure upgrades before a single pipe is changed.",
              },
              {
                icon: <IconZap />,
                title: "Demand Response",
                desc: "Automated demand-side management signals integrate with smart switches to balance load and cut peak-hour costs.",
              },
            ].map((f) => (
              <div key={f.title} className="bg-[hsl(0,0%,6%)] p-8 transition-colors hover:bg-white/[0.04]">
                <FeatureCard icon={f.icon} title={f.title} desc={f.desc} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-20 lg:grid-cols-2">
            {/* left: steps */}
            <div>
              <p className="mb-4 font-display text-xs font-semibold uppercase tracking-[0.3em] text-brand-red">
                How It Works
              </p>
              <h2 className="mb-12 font-display text-4xl font-semibold leading-tight text-white md:text-5xl">
                From sensor to insight in minutes.
              </h2>
              <div>
                {[
                  {
                    title: "Deploy Smart Meters",
                    desc: "Our certified IoT meters are retrofittable to any existing utility infrastructure. Field engineers or utility staff can complete installation in under 30 minutes per site.",
                  },
                  {
                    title: "Stream Live Data",
                    desc: "Each meter connects via our secure multi-protocol gateway — data flows to our cloud platform in real time, geo-tagged and timestamped to the millisecond.",
                  },
                  {
                    title: "AI Analyses & Alerts",
                    desc: "Our ML engine establishes behavioural baselines per meter, learns seasonal patterns, and fires smart alerts when readings deviate beyond configurable thresholds.",
                  },
                  {
                    title: "Act on Intelligence",
                    desc: "Your team receives push alerts, automated work orders, and decision-grade reports — reducing response times from days to minutes.",
                  },
                ].map((s, i) => (
                  <StepCard key={s.title} n={i + 1} title={s.title} desc={s.desc} />
                ))}
              </div>
            </div>

            {/* right: visual panel */}
            <div className="relative">
              <div className="sticky top-32 overflow-hidden border border-white/10">
                <img
                  src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=900&q=80&fit=crop"
                  alt="Smart meter dashboard"
                  className="h-80 w-full object-cover brightness-40"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {/* Animated meter readout */}
                  <div className="border border-brand-red/40 bg-[hsl(0,0%,4%)/90] p-8 backdrop-blur-sm w-72">
                    <p className="mb-4 text-[10px] uppercase tracking-[0.3em] text-brand-red">Live Feed — Zone 7A</p>
                    {[
                      { label: "Electricity", val: "423.7 kWh", delta: "+2.1%" },
                      { label: "Water", val: "18,420 L", delta: "-0.4%" },
                      { label: "Gas", val: "87.3 m³", delta: "+0.8%" },
                    ].map((r) => (
                      <div key={r.label} className="flex items-center justify-between border-b border-white/5 py-3 last:border-0">
                        <span className="text-xs text-white/50">{r.label}</span>
                        <span className="font-display text-sm font-semibold text-white">{r.val}</span>
                        <span className={cn("text-xs font-medium", r.delta.startsWith("+") ? "text-brand-red" : "text-green-400")}>
                          {r.delta}
                        </span>
                      </div>
                    ))}
                    <div className="mt-4 h-1.5 w-full overflow-hidden bg-white/10">
                      <div className="h-full w-3/4 animate-pulse bg-brand-red" />
                    </div>
                    <p className="mt-2 text-[10px] text-white/30">System health: 98.7%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── EMERGING TECH BANNER ── */}
      <section className="border-y border-white/10 bg-brand-red py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-8 text-center lg:flex-row lg:text-left">
            <div>
              <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
                Emerging Technology Roadmap
              </p>
              <h3 className="mt-2 font-display text-3xl font-semibold text-white">
                Quantum-resilient encryption. Federated ML. Digital water twins.
              </h3>
            </div>
            <button
              onClick={() => navigate("/auth")}
              className="flex-none border-2 border-white px-8 py-4 font-display text-sm font-semibold uppercase tracking-widest text-white transition-all hover:bg-white hover:text-brand-red"
            >
              Join the Beta →
            </button>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              "Post-Quantum Cryptography",
              "Federated Machine Learning",
              "Digital Twin Simulation",
              "Autonomous Leak Response",
            ].map((t) => (
              <div key={t} className="border border-white/20 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white/80">
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-32">
        <div className="mx-auto max-w-7xl px-6">
          <p className="mb-4 font-display text-xs font-semibold uppercase tracking-[0.3em] text-brand-red">
            Customer Voices
          </p>
          <h2 className="mb-14 font-display text-4xl font-semibold text-white md:text-5xl">
            Trusted by utility leaders.
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                quote:
                  "We cut our NRW (Non-Revenue Water) from 32% to 18% in the first year — the leak detection AI is genuinely game-changing.",
                name: "Amara Osei",
                role: "CTO",
                company: "Accra Water Authority",
              },
              {
                quote:
                  "The real-time demand forecasting let us defer a $12M grid upgrade by three years. The ROI is extraordinary.",
                name: "James Muriuki",
                role: "Head of Operations",
                company: "East Africa Power Grid",
              },
              {
                quote:
                  "Having electricity, water and gas in one unified dashboard transformed how our engineers work. Night and day.",
                name: "Fatima Al-Hassan",
                role: "Smart City Director",
                company: "Nairobi Metro Council",
              },
            ].map((t) => (
              <TestimonialCard key={t.name} {...t} />
            ))}
          </div>
        </div>
      </section>

      {/* ── PLATFORM PREVIEW IMAGE ── */}
      <section className="border-y border-white/10">
        <div className="relative overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1600&q=80&fit=crop"
            alt="Analytics dashboard"
            className="h-[500px] w-full object-cover brightness-30"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-brand-red">
              Unified Dashboard
            </p>
            <h2 className="mt-4 max-w-2xl font-display text-4xl font-semibold leading-tight text-white md:text-5xl">
              All your utility data. One intelligent command centre.
            </h2>
            <button
              onClick={() => navigate("/auth")}
              className="mt-8 bg-brand-red px-8 py-4 font-display text-sm font-semibold uppercase tracking-widest text-white transition-all hover:brightness-110"
            >
              Request a Demo →
            </button>
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" className="bg-[hsl(0,0%,6%)] py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-16 lg:grid-cols-2">
            <div>
              <p className="mb-4 font-display text-xs font-semibold uppercase tracking-[0.3em] text-brand-red">
                About QuantumConnect
              </p>
              <h2 className="font-display text-4xl font-semibold leading-tight text-white md:text-5xl">
                Technology built for the infrastructure that sustains life.
              </h2>
            </div>
            <div className="space-y-6 text-sm leading-relaxed text-white/50">
              <p>
                QuantumConnect was founded with one mission: to bring the precision and
                intelligence of modern AI to the utilities sector — an industry where
                inefficiency costs lives, not just money.
              </p>
              <p>
                We combine IoT engineering, machine learning research, and deep utility-sector
                expertise to deliver a platform that doesn't just measure — it thinks.
                From predicting demand spikes to isolating invisible leaks, our technology
                is always working, even when your team isn't.
              </p>
              <p>
                Our smart metering solutions are active across water, electricity, and gas
                networks globally — and we're just getting started.
              </p>
            </div>
          </div>

          {/* partner logos strip */}
          <div className="mt-16 border-t border-white/10 pt-12">
            <p className="mb-8 text-center text-xs uppercase tracking-[0.3em] text-white/30">
              Integrated with leading platforms
            </p>
            <div className="flex flex-wrap items-center justify-center gap-12">
              {["AWS IoT", "Azure IoT Hub", "Google Cloud", "ESRI GIS", "SAP IS-U", "Salesforce"].map((p) => (
                <span key={p} className="font-display text-sm font-semibold uppercase tracking-widest text-white/20 transition-colors hover:text-white/50">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden py-32">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[hsl(0,0%,4%)]" />
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              width: "70vw",
              height: "70vw",
              borderRadius: "50%",
              background: "radial-gradient(ellipse, hsl(354,100%,45%,0.15) 0%, transparent 65%)",
            }}
          />
          <svg className="absolute inset-0 h-full w-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid2" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid2)" />
          </svg>
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <p className="mb-4 font-display text-xs font-semibold uppercase tracking-[0.3em] text-brand-red">
            Ready to Connect?
          </p>
          <h2 className="font-display text-5xl font-semibold leading-[1.0] tracking-tight text-white md:text-6xl">
            Start measuring smarter
            <br />
            <span className="text-brand-red">today.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-white/50">
            Join hundreds of utility companies already using QuantumConnect to reduce waste,
            prevent failures, and deliver better service.
          </p>
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              onClick={() => navigate("/auth")}
              className="group flex items-center gap-3 bg-brand-red px-10 py-4 font-display text-sm font-semibold uppercase tracking-widest text-white transition-all hover:brightness-110"
            >
              Create Free Account
              <span className="transition-transform group-hover:translate-x-1"><IconArrowRight /></span>
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="border border-white/20 px-10 py-4 font-display text-sm font-semibold uppercase tracking-widest text-white/70 transition-all hover:border-white/50 hover:text-white"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/10 bg-[hsl(0,0%,4%)] px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <span className="relative flex h-8 w-8 items-center justify-center">
                <span className="absolute inset-0 rounded-full border-2 border-brand-red" />
                <span className="absolute inset-2 rounded-full border-2 border-white/20" />
              </span>
              <span className="font-display text-lg font-semibold text-white">QuantumConnect</span>
            </div>
            <div className="flex flex-wrap gap-8 text-xs text-white/30">
              {["Privacy Policy", "Terms of Service", "Security", "Contact"].map((l) => (
                <a key={l} href="#" className="transition-colors hover:text-white/60">{l}</a>
              ))}
            </div>
          </div>
          <div className="mt-8 border-t border-white/5 pt-8 text-xs text-white/20">
            © {new Date().getFullYear()} QuantumConnect · Smart Metering Intelligence · All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
