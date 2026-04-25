import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Clock, Briefcase, Radio, BrainCircuit, ShieldCheck, Cloud } from "lucide-react";
import PublicHeader from "@/components/public/PublicHeader";
import PublicFooter from "@/components/public/PublicFooter";

const OPENINGS: {
  title: string; dept: string; location: string; type: string; desc: string; tags: string[];
}[] = [];

const VALUES = [
  {
    icon: Radio,
    title: "Work that matters",
    desc: "Every line of code helps a utility detect a leak faster, cut energy losses or get an accurate bill to a customer.",
  },
  {
    icon: BrainCircuit,
    title: "Hard, interesting problems",
    desc: "We operate at the intersection of IoT hardware, ML inference and mission-critical infrastructure. Boredom is off the grid.",
  },
  {
    icon: ShieldCheck,
    title: "Trust and ownership",
    desc: "Small teams, big scope. Engineers own features end to end and deploy to production with confidence.",
  },
  {
    icon: Cloud,
    title: "Flexible by default",
    desc: "Async-first culture, remote-friendly roles and a bias towards outcomes over office hours.",
  },
];

const Careers = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader navItems={[
        { label: "Home",    href: "/" },
        { label: "About",   href: "/about" },
        { label: "Contact", href: "mailto:careers@quantumconnect.africa", external: true },
      ]} />

      <main className="flex-1">
      {/* ── Hero ── */}
      <section className="border-b border-border bg-brand-black text-primary-foreground">
        <div className="relative overflow-hidden">
          {/* background grid */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.06]">
            <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="cg" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#cg)" />
            </svg>
          </div>
          {/* red glow */}
          <div
            className="pointer-events-none absolute -right-40 top-0 opacity-20"
            style={{ width: 600, height: 600, borderRadius: "50%",
              background: "radial-gradient(ellipse, hsl(354,100%,45%,0.5) 0%, transparent 70%)" }}
          />

          <div className="relative mx-auto max-w-7xl px-6 py-24 lg:py-32">
            <p className="mb-6 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.3em] text-brand-red">
              <span className="h-px w-8 bg-brand-red" />
              Careers
            </p>
            <h1 className="font-display text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl max-w-4xl">
              Help us measure<br />
              <span className="text-brand-red">the world's resources.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base text-primary-foreground/70 sm:text-lg">
              We're a small team building infrastructure that water, electricity and gas
              utilities depend on. If you want your work to have a direct impact on how
              cities manage essential resources, you're in the right place.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <a href="#openings">
                <Button className="h-12 rounded-none bg-brand-red px-8 font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground hover:bg-brand-red/90">
                  See open roles <ArrowRight className="ml-1" />
                </Button>
              </a>
              <a href="mailto:careers@quantumconnect.africa"
                className="inline-flex h-12 items-center rounded-none border border-primary-foreground/30 px-8 font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/80 hover:border-primary-foreground hover:text-primary-foreground transition-colors">
                Speculative application
              </a>
            </div>

            {/* stats strip */}
            <dl className="mt-16 grid max-w-lg grid-cols-3 gap-8 border-t border-primary-foreground/15 pt-8">
              {[
                { k: OPENINGS.length > 0 ? `${OPENINGS.length}` : "Soon", v: "Open roles" },
                { k: "4+",     v: "Countries" },
                { k: "Remote", v: "Friendly" },
              ].map((s) => (
                <div key={s.v}>
                  <dt className="font-display text-3xl font-semibold text-brand-red">{s.k}</dt>
                  <dd className="mt-1 text-xs uppercase tracking-[0.18em] text-primary-foreground/60">{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ── Why QuantumConnect ── */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.3em] text-brand-red">Why us</p>
          <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight max-w-2xl sm:text-5xl">
            Built for people who want to do their best work.
          </h2>

          <div className="mt-16 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => (
              <div key={v.title} className="bg-background p-10">
                <v.icon className="h-8 w-8 text-brand-red" strokeWidth={1.5} />
                <h3 className="mt-6 font-display text-lg font-semibold tracking-tight">{v.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Open Roles ── */}
      <section id="openings" className="border-b border-border bg-muted">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.3em] text-brand-red">Open roles</p>
              <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                {OPENINGS.length > 0 ? "Current opportunities." : "Open roles."}
              </h2>
            </div>
            <p className="max-w-sm text-sm text-muted-foreground">
              Don't see a fit? Send a speculative CV to{" "}
              <a href="mailto:careers@quantumconnect.africa" className="text-foreground underline underline-offset-2">
                careers@quantumconnect.africa
              </a>
            </p>
          </div>

          {OPENINGS.length === 0 ? (
            <div className="mt-12 border border-border bg-background px-10 py-16 text-center">
              <p className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Our team is full of legends.
              </p>
              <p className="mt-3 font-display text-xl text-brand-red sm:text-2xl">
                More legends soon?
              </p>
              <p className="mx-auto mt-5 max-w-md text-sm text-muted-foreground">
                We're not hiring right now, but we're always interested in exceptional people.
              </p>
              <a
                href="mailto:careers@quantumconnect.africa?subject=Speculative Application"
                className="mt-8 inline-flex items-center gap-2 bg-brand-black px-8 py-3.5 font-display text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-brand-red"
              >
                Send a speculative application <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          ) : (
            <div className="mt-12 flex flex-col gap-px bg-border">
              {OPENINGS.map((job) => (
                <div key={job.title} className="group bg-background p-8 transition-colors hover:bg-background/80">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-red border border-brand-red/30 bg-brand-red/5 px-2.5 py-1">
                          {job.dept}
                        </span>
                      </div>
                      <h3 className="font-display text-xl font-semibold tracking-tight">{job.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground max-w-2xl">{job.desc}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {job.tags.map((tag) => (
                          <span key={tag} className="border border-border bg-muted px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 lg:items-end lg:min-w-[200px]">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" strokeWidth={1.5} />
                        {job.type}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Briefcase className="h-3.5 w-3.5" strokeWidth={1.5} />
                        {job.dept}
                      </div>
                      <a
                        href={`mailto:careers@quantumconnect.africa?subject=Application — ${encodeURIComponent(job.title)}`}
                        className="mt-2 inline-flex items-center gap-2 bg-brand-black px-5 py-2.5 font-display text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-brand-red"
                      >
                        Apply <ArrowRight className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-b border-border bg-brand-red text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-20 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Don't see the right role?
            </h2>
            <p className="mt-4 text-primary-foreground/85">
              We're always interested in exceptional people. Send us your CV and tell
              us what you'd build.
            </p>
          </div>
          <a href="mailto:careers@quantumconnect.africa">
            <Button className="h-12 rounded-none bg-brand-black px-8 font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground hover:bg-brand-black/85 whitespace-nowrap">
              Get in touch <ArrowRight className="ml-1" />
            </Button>
          </a>
        </div>
      </section>

      </main>
      <PublicFooter />
    </div>
  );
};

export default Careers;
