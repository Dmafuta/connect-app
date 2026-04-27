import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowRight,
  ShieldCheck,
  Gauge,
  CreditCard,
  Activity,
  HelpCircle,
  Smartphone,
} from "lucide-react";
import PublicHeader from "@/components/public/PublicHeader";
import PublicFooter from "@/components/public/PublicFooter";

const categories = [
  {
    id: "getting-started",
    label: "Getting Started",
    icon: Gauge,
    items: [
      {
        q: "What is QuantumConnect?",
        a: "QuantumConnect is a smart utility management platform that helps property managers, landlords, and utility companies track water, electricity, and gas consumption in real time. It combines IoT meter readings, automated billing, and M-Pesa payments into one dashboard.",
      },
      {
        q: "How do I get my organisation onboarded?",
        a: "Reach out to us at support@quantumconnect.africa and our team will set up your tenant account, provision your meters, and walk you through the dashboard. Onboarding typically takes less than 24 hours.",
      },
      {
        q: "What utility types does QuantumConnect support?",
        a: "We currently support water, electricity, and gas metering. All three can be managed from a single dashboard under one account.",
      },
      {
        q: "Do I need special hardware to use QuantumConnect?",
        a: "For automated readings, you will need compatible smart meters. However, meter readings can also be entered manually by a technician through the dashboard, so you can start without hardware upgrades.",
      },
    ],
  },
  {
    id: "billing",
    label: "Billing & Invoices",
    icon: CreditCard,
    items: [
      {
        q: "How are invoices generated?",
        a: "Invoices are generated automatically based on meter readings submitted during a billing cycle. The system calculates consumption (current reading minus previous reading) and applies your configured unit price to produce the invoice amount.",
      },
      {
        q: "Where can I view my invoices?",
        a: "Log in to your customer dashboard and navigate to Invoices. You will see a full list of your invoices with their status — paid, unpaid, or overdue.",
      },
      {
        q: "Can I download a PDF of my invoice?",
        a: "Yes. On the Invoices page, click the download icon next to any invoice to open a print-ready PDF version in your browser.",
      },
      {
        q: "What happens if I miss a payment deadline?",
        a: "Overdue invoices are highlighted in red on your dashboard. You will also receive a reminder email and SMS notification each morning until the invoice is settled.",
      },
    ],
  },
  {
    id: "mpesa",
    label: "M-Pesa Payments",
    icon: Smartphone,
    items: [
      {
        q: "How do I pay my bill using M-Pesa?",
        a: "On your Invoices page, click the Pay button next to an unpaid invoice. Enter your M-Pesa registered phone number and confirm. You will receive an STK push prompt on your phone — enter your M-Pesa PIN to complete the payment.",
      },
      {
        q: "How long does it take for a payment to reflect?",
        a: "Payments reflect instantly. Once you confirm the M-Pesa PIN, your invoice status updates to Paid within seconds.",
      },
      {
        q: "What if the STK push does not arrive on my phone?",
        a: "Ensure your phone number is correct and your M-Pesa account is active. If the prompt does not arrive within 30 seconds, try again. If the problem persists, contact support at support@quantumconnect.africa.",
      },
      {
        q: "Is my payment information secure?",
        a: "Yes. All payments are processed directly through Safaricom's Daraja API. QuantumConnect never stores your M-Pesa PIN or card details.",
      },
    ],
  },
  {
    id: "readings",
    label: "Meter Readings",
    icon: Activity,
    items: [
      {
        q: "How often are meter readings taken?",
        a: "Reading frequency depends on your organisation's configuration. Readings can be submitted manually by a technician at any time, or automatically if smart meters are installed.",
      },
      {
        q: "What is an alert and why did I receive one?",
        a: "Alerts are triggered when unusual consumption patterns are detected — for example, a sudden spike that could indicate a leak or tamper attempt. Alerts are visible on your dashboard and sent to your administrator.",
      },
      {
        q: "Can I see my consumption history?",
        a: "Yes. The Overview section of your dashboard shows a chart of your recent readings. For a full history, navigate to the Readings page.",
      },
    ],
  },
  {
    id: "security",
    label: "Account & Security",
    icon: ShieldCheck,
    items: [
      {
        q: "How do I log in?",
        a: "Go to the login page and enter your organisation code, email or username, and password. A one-time verification code will be sent to your email to confirm your identity before access is granted.",
      },
      {
        q: "I forgot my password. What do I do?",
        a: "On the login page, click Forgot password, enter your email address, and follow the reset link sent to your inbox.",
      },
      {
        q: "How do I update my phone number or email?",
        a: "Log in to your dashboard, go to Settings, and update your contact details. Changes to your email require re-verification.",
      },
      {
        q: "Who can see my account data?",
        a: "Your data is scoped strictly to your organisation. Administrators within your organisation can view tenant-wide data, while customers can only see their own meters, readings, and invoices.",
      },
    ],
  },
  {
    id: "support",
    label: "Support",
    icon: HelpCircle,
    items: [
      {
        q: "How do I contact QuantumConnect support?",
        a: "Email us at support@quantumconnect.africa or use the contact link in the footer. We respond within one business day.",
      },
      {
        q: "Is there a mobile app?",
        a: "The dashboard is fully responsive and works on any modern mobile browser. A dedicated mobile app is on our roadmap.",
      },
      {
        q: "What browsers are supported?",
        a: "QuantumConnect works on all modern browsers — Chrome, Firefox, Edge, and Safari. We recommend keeping your browser up to date for the best experience.",
      },
    ],
  },
];

const FAQ = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-brand-black text-primary-foreground">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--brand-red)/0.35),transparent_60%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.08)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.08)_1px,transparent_1px)] bg-[size:48px_48px]" />
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-24 md:grid-cols-[1.1fr_0.9fr] md:py-32">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 border border-border/40 bg-background/5 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.22em] text-primary-foreground/80">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-red" />
              Frequently asked
            </div>
            <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
              Straight answers,
              <br />
              <span className="text-brand-red">no jargon.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-primary-foreground/70 md:text-lg">
              Everything customers, administrators and new users ask us.
              If your question isn't here, the team is one message away.
            </p>
          </div>
          <div className="relative hidden md:block">
            <div className="absolute right-0 top-1/2 -translate-y-1/2">
              <div className="grid grid-cols-3 gap-3">
                {categories.map((c) => {
                  const Icon = c.icon;
                  return (
                    <a
                      key={c.id}
                      href={`#${c.id}`}
                      className="group flex aspect-square w-28 flex-col items-start justify-between border border-border/30 bg-background/5 p-3 transition-colors hover:border-brand-red hover:bg-brand-red/10"
                    >
                      <Icon className="h-5 w-5 text-brand-red" />
                      <span className="font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/90">
                        {c.label}
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ body */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="grid gap-16 md:grid-cols-[280px_1fr]">
            {/* Sticky sidebar */}
            <aside className="md:sticky md:top-24 md:self-start">
              <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                Index
              </div>
              <ul className="mt-6 space-y-1 border-l border-border">
                {categories.map((c) => (
                  <li key={c.id}>
                    <a
                      href={`#${c.id}`}
                      className="block border-l-2 border-transparent py-2 pl-4 font-display text-sm uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:border-brand-red hover:text-foreground"
                    >
                      {c.label}
                    </a>
                  </li>
                ))}
              </ul>
            </aside>

            {/* Accordions */}
            <div className="space-y-20">
              {categories.map((c, idx) => {
                const Icon = c.icon;
                return (
                  <div key={c.id} id={c.id} className="scroll-mt-24">
                    <div className="mb-8 flex items-center gap-4 border-b border-border pb-6">
                      <span className="flex h-12 w-12 items-center justify-center border border-border bg-secondary">
                        <Icon className="h-5 w-5 text-brand-red" />
                      </span>
                      <div>
                        <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                          0{idx + 1} — Section
                        </div>
                        <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
                          {c.label}
                        </h2>
                      </div>
                    </div>
                    <Accordion type="single" collapsible className="w-full">
                      {c.items.map((item, i) => (
                        <AccordionItem
                          key={i}
                          value={`${c.id}-${i}`}
                          className="border-b border-border"
                        >
                          <AccordionTrigger className="py-6 text-left font-display text-lg font-medium tracking-tight hover:no-underline md:text-xl">
                            {item.q}
                          </AccordionTrigger>
                          <AccordionContent className="pb-6 text-base leading-relaxed text-muted-foreground">
                            {item.a}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-b border-border bg-brand-black text-primary-foreground">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 md:grid-cols-[1fr_auto] md:items-center md:py-24">
          <div className="flex items-start gap-6">
            <span className="hidden h-14 w-14 shrink-0 items-center justify-center border border-border/30 md:flex">
              <HelpCircle className="h-6 w-6 text-brand-red" />
            </span>
            <div>
              <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.22em] text-primary-foreground/60">
                Still curious
              </div>
              <h2 className="font-display text-3xl font-semibold tracking-tight md:text-5xl">
                Talk to a real person,
                <br />
                <span className="text-brand-red">not a chatbot.</span>
              </h2>
              <p className="mt-4 max-w-xl text-primary-foreground/70">
                Our support team responds within one business day — usually faster.
                No automated queues, no runaround.
              </p>
            </div>
          </div>
          <a href="mailto:support@quantumconnect.africa">
            <Button className="h-14 rounded-none bg-brand-red px-8 font-display text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground hover:bg-brand-red/90">
              Contact support
              <ArrowRight className="ml-3 h-4 w-4" />
            </Button>
          </a>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default FAQ;
