import { Link } from "react-router-dom";
import { ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Forbidden() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-black text-primary-foreground">
      <ShieldOff className="h-12 w-12 text-brand-red" strokeWidth={1.5} />
      <h1 className="mt-6 font-display text-5xl font-semibold tracking-tight">403</h1>
      <p className="mt-3 text-sm text-primary-foreground/60">You don't have permission to access this page.</p>
      <Link to="/dashboard" className="mt-8">
        <Button className="rounded-none bg-brand-red px-8 font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground hover:bg-brand-red/90">
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
}
