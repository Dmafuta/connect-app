import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import PublicHeader from "@/components/public/PublicHeader";
import PublicFooter from "@/components/public/PublicFooter";

const FAQS: { category: string; items: { q: string; a: string }[] }[] = [
  {
    category: "Getting Started",
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
    category: "Billing & Invoices",
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
    category: "Payments via M-Pesa",
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
    category: "Meter Readings",
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
    category: "Account & Security",
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
    category: "Support",
    items: [
      {
        q: "How do I contact QuantumConnect support?",
        a: "Email us at support@quantumconnect.africa or use the contact link in the footer. We respond within one business day.",
      },
      {
        q: "Is there a mobile app?",
        a: "The dashboard is fully responsive and works on any modern mobile browser. A dedicated mobile app is on our roadmap.",
      },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="text-sm font-medium leading-snug">{q}</span>
        {open
          ? <ChevronUp className="h-4 w-4 shrink-0 text-brand-red" />
          : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        }
      </button>
      {open && (
        <p className="pb-5 text-sm leading-relaxed text-muted-foreground">{a}</p>
      )}
    </div>
  );
}

export default function FAQ() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <PublicHeader />

      {/* Hero */}
      <section className="border-b border-border bg-brand-black px-6 py-20 text-primary-foreground">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-brand-red">
            Support
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            Frequently asked questions
          </h1>
          <p className="mt-5 text-base text-primary-foreground/70">
            Everything you need to know about QuantumConnect. Can't find an answer?{" "}
            <a
              href="mailto:support@quantumconnect.africa"
              className="text-brand-red underline-offset-4 hover:underline"
            >
              Contact us
            </a>
            .
          </p>
        </div>
      </section>

      {/* FAQ sections */}
      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="space-y-12">
          {FAQS.map((section) => (
            <div key={section.category}>
              <h2 className="mb-1 font-display text-xs font-semibold uppercase tracking-[0.25em] text-brand-red">
                {section.category}
              </h2>
              <div className="mt-4 rounded-none border border-border bg-card px-6">
                {section.items.map((item) => (
                  <FAQItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-none border border-border bg-card px-8 py-10 text-center">
          <h3 className="font-display text-lg font-semibold">Still have questions?</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Our support team is available Monday – Friday, 8 am – 6 pm EAT.
          </p>
          <a
            href="mailto:support@quantumconnect.africa"
            className="mt-6 inline-flex items-center gap-2 bg-brand-red px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-brand-red/90"
          >
            Email support
          </a>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
