import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <Link to="/" className={cn("group flex items-center gap-2.5", className)} aria-label="Genius Engineering & Tech home">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary font-display text-lg font-extrabold text-primary-foreground shadow-glow transition-transform group-hover:-rotate-6">
        G
      </span>
      <span className="leading-none">
        <span className={cn("block font-display text-lg font-extrabold tracking-tight", light ? "text-ink-foreground" : "text-primary")}>GENIUS</span>
        <span className={cn("block text-[10px] font-semibold uppercase tracking-[0.22em]", light ? "text-ink-muted" : "text-muted-foreground")}>
          Engineering & Tech
        </span>
      </span>
    </Link>
  );
}
