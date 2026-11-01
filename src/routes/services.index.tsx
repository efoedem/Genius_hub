import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/site/Reveal";
import { SERVICES } from "@/lib/services";

export const Route = createFileRoute("/services/")({
  head: () => ({
    meta: [
      { title: "Services — Genius Engineering & Tech" },
      { name: "description", content: "Engineering projects, IT services, academic research support and assignments, typing, printing & binding." },
      { property: "og:title", content: "Services — Genius Engineering & Tech" },
      { property: "og:description", content: "Explore our full catalogue of engineering, IT, research and assignment services." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
      <Reveal>
        <p className="text-sm font-bold uppercase tracking-widest text-primary">Catalogue</p>
        <h1 className="mt-3 text-5xl font-extrabold sm:text-6xl">Everything we do.</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">Choose a desk to see what's included, accepted file types and how pricing works.</p>
      </Reveal>
      <div className="mt-14 space-y-6">
        {SERVICES.map((s, i) => (
          <Reveal key={s.key} delay={i * 60}>
            <Link to="/services/$slug" params={{ slug: s.slug }} className="group grid items-center gap-6 rounded-3xl border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-glow md:grid-cols-[auto_1fr_auto] md:p-8">
              <div className="grid h-20 w-20 place-items-center rounded-2xl bg-ink text-accent transition-transform group-hover:scale-105 group-hover:-rotate-3">
                <s.icon className="h-9 w-9" />
              </div>
              <div>
                <h2 className="text-2xl font-bold sm:text-3xl">{s.title}</h2>
                <p className="mt-1 text-muted-foreground">{s.tagline}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {s.offerings.map((o) => (
                    <span key={o.name} className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">{o.name}</span>
                  ))}
                </div>
              </div>
              <span className="grid h-12 w-12 place-items-center rounded-full border transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
