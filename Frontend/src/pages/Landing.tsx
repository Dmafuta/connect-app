import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Droplets,
  Zap,
  Flame,
  Cpu,
  Cloud,
  BrainCircuit,
  Radio,
  ShieldCheck,
  ArrowRight,
  Activity,
  Gauge,
  LineChart,
} from "lucide-react";
import heroMeter from "@/assets/hero-meter.jpg";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-8 w-8 items-center justify-center">
              <span className="absolute inset-0 rounded-full border-2 border-brand-red" />
              <span className="absolute inset-1.5 rounded-full border-2 border-brand-black" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">
              QuantumConnect
            </span>
          </div>
          <nav className="hidden items-center gap-8 text-sm md:flex">
            <a href="#solutions" className="text-muted-foreground hover:text-foreground">Solutions</a>
            <a href="#technology" className="text-muted-foreground hover:text-foreground">Technology</a>
            <a href="#how" className="text-muted-foreground hover:text-foreground">How it works</a>
            <a href="#impact" className="text-muted-foreground hover:text-foreground">Impact</a>
          </nav>
          <Link to="/auth">
            <Button className="h-10 rounded-none bg-brand-black font-display text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground hover:bg-brand-red">
              Sign in
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-brand-black text-primary-foreground">
        <div className="absolute inset-0 opacity-60">
          <img
            src={heroMeter}
            alt="QuantumConnect IoT smart utility meter with red digital display"
            width={1920}
            height={1080}
            className="h-full w-full object-cover object-right"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-black via-brand-black/85 to-transparent" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-24 lg:grid-cols-12 lg:py-36">
          <div className="lg:col-span-7">
            <p className="mb-6 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.3em] text-brand-red">
              <span className="h-px w-8 bg-brand-red" />
              Smart Utility Intelligence
            </p>
            <h1 className="font-display text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Every drop, watt and therm —{" "}
              <span className="text-brand-red">measured in real time.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base text-primary-foreground/75 sm:text-lg">
              QuantumConnect unifies IoT smart meters, machine learning and cloud
              analytics for water, electricity and gas utilities. Cut losses,
              forecast demand and bill with precision.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a href="#solutions">
                <Button className="h-12 rounded-none bg-brand-red px-8 font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground hover:bg-brand-red/90">
                  Explore solutions <ArrowRight className="ml-1" />
                </Button>
              </a>
              <a
                href="#how"
                className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/80 hover:text-primary-foreground"
              >
                See how it works →
              </a>
            </div>

            <dl className="mt-16 grid max-w-2xl grid-cols-3 gap-8 border-t border-primary-foreground/15 pt-8">
              {[
                { k: "2.4M+", v: "Meters online" },
                { k: "38%", v: "NRW reduction" },
                { k: "99.95%", v: "Uptime SLA" },
              ].map((s) => (
                <div key={s.v}>
                  <dt className="font-display text-3xl font-semibold text-brand-red">{s.k}</dt>
                  <dd className="mt-1 text-xs uppercase tracking-[0.18em] text-primary-foreground/70">
                    {s.v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Solutions */}
      <section id="solutions" className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.3em] text-brand-red">
                Solutions
              </p>
              <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                Three utilities. One intelligent grid.
              </h2>
            </div>
            <p className="max-w-md text-sm text-muted-foreground">
              Purpose-built smart metering for the resources that power
              modern life — instrumented end to end.
            </p>
          </div>

          <div className="mt-16 grid gap-px bg-border md:grid-cols-3">
            {[
              {
                icon: Droplets,
                title: "Smart Water",
                desc: "Acoustic leak detection, district metering and pressure analytics that slash non-revenue water.",
                points: ["Leak alerts < 60s", "Per-DMA balance", "Tamper detection"],
              },
              {
                icon: Zap,
                title: "Smart Electricity",
                desc: "AMI infrastructure with sub-minute load profiles, outage signaling and dynamic tariff support.",
                points: ["Load disaggregation", "Outage mapping", "ToU billing"],
              },
              {
                icon: Flame,
                title: "Smart Gas",
                desc: "Battery-grade NB-IoT meters with leak detection, pressure telemetry and remote shut-off.",
                points: ["10-yr battery", "Safety shut-off", "Pressure analytics"],
              },
            ].map((s) => (
              <div key={s.title} className="group bg-background p-10 transition-colors hover:bg-muted">
                <s.icon className="h-9 w-9 text-brand-red" strokeWidth={1.5} />
                <h3 className="mt-8 font-display text-2xl font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground">{s.desc}</p>
                <ul className="mt-8 space-y-2">
                  {s.points.map((p) => (
                    <li key={p} className="flex items-center gap-3 text-sm">
                      <span className="h-px w-4 bg-brand-red" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology */}
      <section id="technology" className="border-b border-border bg-brand-black text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="max-w-2xl">
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.3em] text-brand-red">
              Technology
            </p>
            <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              An emerging-tech stack, engineered for the meter.
            </h2>
            <p className="mt-5 text-base text-primary-foreground/70">
              From silicon at the edge to forecasts in the cloud — every layer
              optimized for low-power, high-trust telemetry.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Radio, title: "IoT Edge", desc: "NB-IoT, LoRaWAN and LTE-M radios with secure element provisioning." },
              { icon: BrainCircuit, title: "Machine Learning", desc: "Anomaly detection, theft analytics and demand forecasting." },
              { icon: Cloud, title: "Cloud Native", desc: "Event-driven ingestion handling millions of readings per minute." },
              { icon: ShieldCheck, title: "Zero Trust", desc: "End-to-end encryption, signed firmware and granular RBAC." },
            ].map((t) => (
              <div key={t.title} className="border-l border-primary-foreground/15 pl-6">
                <t.icon className="h-7 w-7 text-brand-red" strokeWidth={1.5} />
                <h3 className="mt-6 font-display text-lg font-semibold">{t.title}</h3>
                <p className="mt-2 text-sm text-primary-foreground/70">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="grid gap-16 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.3em] text-brand-red">
                How it works
              </p>
              <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight">
                From meter to insight, in seconds.
              </h2>
              <p className="mt-5 text-sm text-muted-foreground">
                A four-step pipeline that turns raw consumption signals into
                operational intelligence and accurate bills.
              </p>
            </div>

            <ol className="lg:col-span-8 lg:grid lg:grid-cols-2 lg:gap-px lg:bg-border">
              {[
                { icon: Gauge, n: "01", title: "Measure", desc: "Certified smart meters sample consumption with millisecond precision." },
                { icon: Radio, n: "02", title: "Transmit", desc: "Encrypted packets stream over NB-IoT or LoRaWAN to regional gateways." },
                { icon: Activity, n: "03", title: "Analyze", desc: "ML models flag leaks, theft and anomalies before they become losses." },
                { icon: LineChart, n: "04", title: "Act", desc: "Operators bill, balance and dispatch crews from a unified console." },
              ].map((step) => (
                <li key={step.n} className="bg-background p-8">
                  <div className="flex items-center justify-between">
                    <step.icon className="h-7 w-7 text-brand-red" strokeWidth={1.5} />
                    <span className="font-display text-sm tracking-[0.2em] text-muted-foreground">
                      {step.n}
                    </span>
                  </div>
                  <h3 className="mt-6 font-display text-xl font-semibold tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Impact / testimonials */}
      <section id="impact" className="border-b border-border bg-muted">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.3em] text-brand-red">
            Impact
          </p>
          <h2 className="max-w-3xl font-display text-4xl font-semibold leading-tight tracking-tight">
            Operators are running tighter networks with QuantumConnect.
          </h2>

          <div className="mt-16 grid gap-px bg-border md:grid-cols-3">
            {[
              {
                quote:
                  "We cut non-revenue water by 38% in eighteen months. The ML leak detection paid for the rollout.",
                name: "Amani Otieno",
                role: "COO, Metro Water Utility",
              },
              {
                quote:
                  "Sub-minute load profiles transformed how we plan substations. Forecasts we trust, finally.",
                name: "Daniel Müller",
                role: "Head of Grid Ops, NordicPower",
              },
              {
                quote:
                  "Remote shut-off and pressure telemetry made our gas network measurably safer.",
                name: "Priya Raghavan",
                role: "VP Engineering, AuraGas",
              },
            ].map((t) => (
              <figure key={t.name} className="bg-background p-10">
                <blockquote className="font-display text-lg leading-snug tracking-tight">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-8 border-t border-border pt-5 text-sm">
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-muted-foreground">{t.role}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-b border-border bg-brand-red text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-20 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Ready to instrument your grid?
            </h2>
            <p className="mt-4 text-primary-foreground/85">
              Talk to our team about a pilot for your water, electricity or gas network.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link to="/auth">
              <Button className="h-12 rounded-none bg-brand-black px-8 font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground hover:bg-brand-black/85">
                Sign in to console
              </Button>
            </Link>
            <a href="mailto:hello@quantumconnect.io">
              <Button
                variant="outline"
                className="h-12 rounded-none border-primary-foreground bg-transparent px-8 font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground hover:bg-primary-foreground hover:text-brand-red"
              >
                Request a demo
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-black text-primary-foreground">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-8 w-8 items-center justify-center">
                <span className="absolute inset-0 rounded-full border-2 border-primary-foreground" />
                <span className="absolute inset-1.5 rounded-full border-2 border-brand-red" />
              </span>
              <span className="font-display text-lg font-semibold tracking-tight">
                QuantumConnect
              </span>
            </div>
            <p className="mt-5 max-w-sm text-sm text-primary-foreground/70">
              Intelligent metering for water, electricity and gas utilities.
              Built on IoT, ML and zero-trust cloud.
            </p>
          </div>
          <div>
            <h4 className="font-display text-xs uppercase tracking-[0.2em] text-primary-foreground/60">
              Solutions
            </h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li>Smart Water</li>
              <li>Smart Electricity</li>
              <li>Smart Gas</li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-xs uppercase tracking-[0.2em] text-primary-foreground/60">
              Company
            </h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li>About</li>
              <li>Careers</li>
              <li>Contact</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-primary-foreground/10">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-6 py-6 text-xs text-primary-foreground/60 md:flex-row md:items-center">
            <p>© {new Date().getFullYear()} QuantumConnect. All rights reserved.</p>
            <p className="uppercase tracking-[0.2em]">Measured. Connected. Trusted.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
