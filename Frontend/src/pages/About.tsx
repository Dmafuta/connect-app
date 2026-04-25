import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Target,
  Compass,
  Sparkles,
  Droplets,
  Zap,
  Flame,
  ShieldCheck,
  Leaf,
} from "lucide-react";
import aboutMission from "@/assets/about-mission.jpg";
import PublicHeader from "@/components/public/PublicHeader";
import PublicFooter from "@/components/public/PublicFooter";

const values = [
  {
    icon: Target,
    title: "Precision over noise",
    body: "Every reading, every alert, every forecast is engineered to be defensible — down to the last decimal.",
  },
  {
    icon: ShieldCheck,
    title: "Trust by design",
    body: "Hardware-rooted security, end-to-end encryption and auditable data flows are not features — they are foundations.",
  },
  {
    icon: Leaf,
    title: "Resources are finite",
    body: "We exist so that water, electricity and gas are measured, valued and never wasted in the dark.",
  },
  {
    icon: Sparkles,
    title: "Engineering with taste",
    body: "From silicon to dashboard, we obsess over the small details that make infrastructure feel inevitable.",
  },
];

const milestones = [
  {
    year: "2019",
    title: "First prototype",
    body: "QC-Meter Series 1 ships to a pilot water utility in southern Europe.",
  },
  {
    year: "2021",
    title: "Cloud platform",
    body: "Real-time analytics and ML forecasting move 1.2M endpoints online.",
  },
  {
    year: "2023",
    title: "Multi-utility",
    body: "Electricity and gas modules unify under one operational layer.",
  },
  {
    year: "2025",
    title: "Series 9",
    body: "Edge AI inference enables sub-second leak and tamper detection.",
  },
];

const stats = [
  { value: "3.4M",   label: "Endpoints connected" },
  { value: "27",     label: "Utilities served" },
  { value: "11",     label: "Countries live" },
  { value: "99.98%", label: "Network uptime" },
];

const leadership = [
  { name: "M. Carvalho", role: "Co-founder & CEO", initials: "MC" },
  { name: "S. Almeida",  role: "Co-founder & CTO", initials: "SA" },
  { name: "R. Tavares",  role: "VP Hardware",       initials: "RT" },
  { name: "I. Pereira",  role: "VP Cloud & AI",     initials: "IP" },
];

const About = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader navItems={[
        { label: "Home",          href: "/" },
        { label: "About",         href: "/about",   active: true },
        { label: "Opportunities", href: "/careers" },
      ]} />

      <main className="flex-1">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-border bg-brand-black text-primary-foreground">
        <div className="mx-auto grid max-w-7xl gap-0 lg:grid-cols-12">
          <div className="px-6 py-20 lg:col-span-7 lg:py-32 lg:pr-12">
            <p className="mb-6 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.3em] text-brand-red">
              <span className="h-px w-8 bg-brand-red" />
              About QuantumConnect
            </p>
            <h1 className="font-display text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              We measure what the world{" "}
              <span className="text-brand-red">cannot afford to lose.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base text-primary-foreground/75 sm:text-lg">
              Born from a simple frustration — utilities running 21st-century
              networks on 20th-century instruments — we build the meters,
              models and software that turn every drop, watt and therm into
              decisions worth trusting.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link to="/careers">
                <Button className="h-12 rounded-none bg-brand-red px-8 font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground hover:bg-brand-red/90">
                  Join the team <ArrowRight className="ml-1" />
                </Button>
              </Link>
              <Link to="/" className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/80 hover:text-brand-red">
                See the platform →
              </Link>
            </div>
          </div>
          <div className="relative lg:col-span-5">
            <img
              src={aboutMission}
              alt="QuantumConnect engineers monitoring smart utility infrastructure"
              width={1280}
              height={896}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-brand-black/20 to-brand-black/60 lg:bg-gradient-to-r lg:from-brand-black/60 lg:via-transparent lg:to-transparent" />
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-border md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="px-6 py-10 text-center">
              <div className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                {s.value}
              </div>
              <div className="mt-2 text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Mission / Vision ── */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="mb-6 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.3em] text-brand-red">
              <span className="h-px w-8 bg-brand-red" />
              Why we exist
            </p>
            <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Infrastructure deserves better instruments.
            </h2>
          </div>

          <div className="grid gap-6 lg:col-span-8 lg:grid-cols-2">
            <article className="group border border-border bg-card p-8 transition-colors hover:border-brand-red">
              <Target className="h-6 w-6 text-brand-red" />
              <h3 className="mt-6 font-display text-xl font-semibold">Our mission</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Equip every utility on the planet with measurement so accurate,
                so secure and so timely that loss, fraud and waste become a
                solved problem — not a line item.
              </p>
            </article>
            <article className="group border border-border bg-card p-8 transition-colors hover:border-brand-red">
              <Compass className="h-6 w-6 text-brand-red" />
              <h3 className="mt-6 font-display text-xl font-semibold">Our vision</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                A world where the flow of water, energy and gas is as
                observable, predictable and accountable as the flow of money
                through a modern bank.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="border-b border-border bg-brand-black text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="mb-6 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.3em] text-brand-red">
                <span className="h-px w-8 bg-brand-red" />
                Operating principles
              </p>
              <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                The four rules we ship by.
              </h2>
            </div>
            <p className="max-w-sm text-sm text-primary-foreground/70">
              Not posters on a wall — these are the trade-offs we make when
              decisions are hard and timelines are short.
            </p>
          </div>

          <div className="mt-14 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.title} className="bg-brand-black p-8">
                <v.icon className="h-6 w-6 text-brand-red" />
                <h3 className="mt-6 font-display text-lg font-semibold">{v.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-primary-foreground/70">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Timeline ── */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <p className="mb-6 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.3em] text-brand-red">
            <span className="h-px w-8 bg-brand-red" />
            The road so far
          </p>
          <h2 className="max-w-3xl font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            From a single prototype to a multi-utility operating layer.
          </h2>

          <div className="relative mt-16 grid gap-px bg-border md:grid-cols-4">
            {milestones.map((m) => (
              <div key={m.year} className="relative bg-background p-8">
                <span className="absolute left-8 top-0 h-1 w-12 bg-brand-red" />
                <div className="font-display text-3xl font-semibold tracking-tight text-foreground">
                  {m.year}
                </div>
                <h3 className="mt-3 font-display text-base font-semibold">{m.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{m.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Leadership ── */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="mb-6 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.3em] text-brand-red">
                <span className="h-px w-8 bg-brand-red" />
                Leadership
              </p>
              <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                Operators, engineers and utility veterans.
              </h2>
              <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
                Our leadership team has shipped silicon, scaled cloud
                platforms and run grid operations. We build what we know.
              </p>
            </div>

            <div className="grid gap-6 lg:col-span-8 sm:grid-cols-2">
              {leadership.map((p) => (
                <div key={p.name} className="flex items-center gap-5 border border-border bg-background p-6">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center bg-brand-black font-display text-sm font-semibold tracking-[0.15em] text-brand-red">
                    {p.initials}
                  </div>
                  <div>
                    <div className="font-display text-base font-semibold">{p.name}</div>
                    <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{p.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Coverage ── */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-24 lg:grid-cols-3">
          {[
            { icon: Droplets, label: "Water utilities",   body: "Leak detection, district metering, non-revenue water reduction." },
            { icon: Zap,      label: "Electricity DSOs",  body: "Load forecasting, theft analytics, distributed grid balancing." },
            { icon: Flame,    label: "Gas networks",      body: "Pressure monitoring, tamper alerts, accurate volumetric billing." },
          ].map((c) => (
            <div key={c.label} className="border-l-2 border-brand-red pl-6">
              <c.icon className="h-6 w-6 text-brand-red" />
              <h3 className="mt-5 font-display text-xl font-semibold">{c.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-brand-black text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-6 py-20 md:flex-row md:items-center">
          <div>
            <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              Build the measurement layer of the next century.
            </h2>
            <p className="mt-3 max-w-xl text-sm text-primary-foreground/70">
              Whether you operate a utility, integrate hardware or want to
              join the team — we'd love to talk.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link to="/careers">
              <Button className="h-12 rounded-none bg-brand-red px-8 font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground hover:bg-brand-red/90">
                Open roles <ArrowRight className="ml-1" />
              </Button>
            </Link>
            <a href="mailto:hello@quantumconnect.africa">
              <Button variant="outline" className="h-12 rounded-none border-primary-foreground/30 bg-transparent px-8 font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground hover:bg-primary-foreground hover:text-brand-black">
                Contact us
              </Button>
            </a>
          </div>
        </div>
      </section>

      </main>
      <PublicFooter />
    </div>
  );
};

export default About;
