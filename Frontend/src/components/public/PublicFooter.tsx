import { Link } from "react-router-dom";
import { Twitter, Linkedin, Youtube, Facebook } from "lucide-react";

const SOCIALS = [
  { icon: Twitter,  href: "https://twitter.com/quantumconnect",              label: "X / Twitter" },
  { icon: Linkedin, href: "https://linkedin.com/company/quantumconnect",     label: "LinkedIn" },
  { icon: Youtube,  href: "https://youtube.com/@quantumconnect",             label: "YouTube" },
  { icon: Facebook, href: "https://facebook.com/quantumconnect",             label: "Facebook" },
];

export default function PublicFooter() {
  return (
    <footer className="bg-brand-black text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-4">
        {/* Brand */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-8 w-8 items-center justify-center">
              <span className="absolute inset-0 rounded-full border-2 border-primary-foreground" />
              <span className="absolute inset-1.5 rounded-full border-2 border-brand-red" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">QuantumConnect</span>
          </div>
          <p className="mt-5 max-w-sm text-sm text-primary-foreground/70">
            Intelligent metering for water, electricity and gas utilities.
            Built on IoT, ML and zero-trust cloud.
          </p>
          {/* Social icons */}
          <div className="mt-6 flex items-center gap-4">
            {SOCIALS.map(({ icon: Icon, href, label }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                 aria-label={label}
                 className="flex h-8 w-8 items-center justify-center rounded-none border border-primary-foreground/20 text-primary-foreground/50 transition-colors hover:border-brand-red hover:text-brand-red">
                <Icon className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
        </div>

        {/* Solutions */}
        <div>
          <h4 className="font-display text-xs uppercase tracking-[0.2em] text-primary-foreground/60">
            Solutions
          </h4>
          <ul className="mt-4 space-y-2 text-sm text-primary-foreground/70">
            <li>Smart Water</li>
            <li>Smart Electricity</li>
            <li>Smart Gas</li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="font-display text-xs uppercase tracking-[0.2em] text-primary-foreground/60">
            Company
          </h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link to="/about" className="text-primary-foreground/70 transition-colors hover:text-primary-foreground">
                About
              </Link>
            </li>
            <li>
              <Link to="/careers" className="text-primary-foreground/70 transition-colors hover:text-primary-foreground">
                Opportunities
              </Link>
            </li>
            <li>
              <Link to="/faq" className="text-primary-foreground/70 transition-colors hover:text-primary-foreground">
                FAQ
              </Link>
            </li>
            <li>
              <a href="mailto:hello@quantumconnect.africa" className="text-primary-foreground/70 transition-colors hover:text-primary-foreground">
                Contact
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-primary-foreground/10">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-6 py-6 text-xs text-primary-foreground/60 md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} QuantumConnect. All rights reserved.</p>
          <p className="uppercase tracking-[0.2em]">Measured. Connected. Trusted.</p>
        </div>
      </div>
    </footer>
  );
}
