import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface NavItem {
  label: string;
  href: string;
  /** true = renders as <a>, false/undefined = renders as <Link> */
  external?: boolean;
  active?: boolean;
}

interface Props {
  navItems?: NavItem[];
}

export default function PublicHeader({ navItems = [] }: Props) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <span className="relative flex h-8 w-8 items-center justify-center">
            <span className="absolute inset-0 rounded-full border-2 border-brand-red" />
            <span className="absolute inset-1.5 rounded-full border-2 border-brand-black" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">QuantumConnect</span>
        </Link>

        {/* Nav */}
        {navItems.length > 0 && (
          <nav className="hidden items-center gap-8 text-sm md:flex">
            {navItems.map(item =>
              item.external ? (
                <a key={item.label} href={item.href}
                   className={`transition-colors ${item.active ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {item.label}
                </a>
              ) : (
                <Link key={item.label} to={item.href}
                      className={`transition-colors ${item.active ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {item.label}
                </Link>
              )
            )}
          </nav>
        )}

        {/* CTA */}
        <Link to="/auth">
          <Button className="h-10 rounded-none bg-brand-black font-display text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground hover:bg-brand-red">
            Sign in
          </Button>
        </Link>
      </div>
    </header>
  );
}
