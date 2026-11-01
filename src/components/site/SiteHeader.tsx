import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/services", label: "Services" },
  { to: "/track", label: "Track order" },
] as const;

export function SiteHeader() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header className={cn("sticky top-0 z-40 transition-all", scrolled ? "border-b bg-background/85 backdrop-blur-lg" : "bg-background")}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" activeProps={{ className: "text-foreground bg-secondary" }}>
              {n.label}
            </Link>
          ))}
          <Link to={user ? "/account" : "/auth"} className="rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            {user ? "My orders" : "Sign in"}
          </Link>
          <Button asChild className="ml-2 rounded-full px-5 shadow-glow">
            <Link to="/quote">Get an Instant Quote</Link>
          </Button>
        </nav>
        <button className="rounded-lg p-2 md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="animate-in slide-in-from-top-2 border-t bg-background px-4 pb-5 pt-2 md:hidden">
          {[...NAV, { to: user ? "/account" : "/auth", label: user ? "My orders" : "Sign in" }].map((n) => (
            <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-3 font-semibold hover:bg-secondary">
              {n.label}
            </Link>
          ))}
          <Button asChild className="mt-2 w-full rounded-full" size="lg">
            <Link to="/quote" onClick={() => setOpen(false)}>Get an Instant Quote</Link>
          </Button>
        </div>
      )}
    </header>
  );
}
