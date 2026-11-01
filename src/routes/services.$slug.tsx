import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, Check, FileType } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/site/Reveal";
import { serviceBySlug, SERVICES } from "@/lib/services";

export const Route = createFileRoute("/services/$slug")({
  loader: ({ params }) => {
    const s = serviceBySlug(params.slug);
    if (!s) throw notFound();
    return { slug: s.slug };
  },
  head: ({ loaderData }) => {
    const s = loaderData ? serviceBySlug(loaderData.slug) : undefined;
    const title = s ? `${s.title} — Genius Engineering & Tech` : "Service unavailable";
    return {
      meta: [
        { title },
        { name: "description", content: s?.description ?? "" },
        { property: "og:title", content: title },
        { property: "og:description", content: s?.tagline ?? "" },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: ServicePage,
});

function ServicePage() {
  const { slug } = Route.useLoaderData();
  const s = serviceBySlug(slug)!;
  const others = SERVICES.filter((o) => o.key !== s.key);
  return (
    <>
      <section className="relative overflow-hidden bg-ink text-ink-foreground">
        <div className="bg-grid absolute inset-0 opacity-60" />
        <div className="absolute -right-20 top-0 h-96 w-96 rounded-full bg-primary/50 blur-[110px]" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <Link to="/services" className="text-sm font-semibold text-ink-muted hover:text-ink-foreground">← All services</Link>
          <div className="mt-6 flex items-center gap-4">
            <s.icon className="h-14 w-14 animate-fade-up rounded-2xl bg-primary p-3 text-primary-foreground" />
          </div>
          <h1 className="animate-fade-up mt-6 text-5xl font-extrabold sm:text-6xl">{s.title}</h1>
          <p className="animate-fade-up mt-4 max-w-2xl text-lg text-ink-muted">{s.description}</p>
          <Button asChild size="lg" className="mt-8 h-14 rounded-full px-8 shadow-glow">
            <Link to="/quote" search={{ service: s.key }}>Quote this service <ArrowRight className="ml-1" /></Link>
          </Button>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[2fr_1fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          {s.offerings.map((o, i) => (
            <Reveal key={o.name} delay={i * 80}>
              <div className="h-full rounded-3xl border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-glow">
                <Check className="h-7 w-7 rounded-full bg-primary/10 p-1.5 text-primary" />
                <h3 className="mt-4 text-xl font-bold">{o.name}</h3>
                <p className="mt-2 text-muted-foreground">{o.detail}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <aside className="rounded-3xl bg-secondary p-6">
            <h3 className="flex items-center gap-2 font-bold"><FileType className="h-5 w-5 text-primary" /> Accepted files</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {s.formats.map((f) => <span key={f} className="rounded-lg bg-card px-3 py-1.5 font-mono text-sm">{f}</span>)}
            </div>
            <h3 className="mt-8 font-bold">How pricing works</h3>
            <p className="mt-2 text-sm text-muted-foreground">Price = units × base rate, adjusted for complexity and deadline urgency, plus printing & binding for hard copies. A minimum service charge always applies.</p>
            <h3 className="mt-8 font-bold">Other services</h3>
            <ul className="mt-3 space-y-2">
              {others.map((o) => (
                <li key={o.key}><Link to="/services/$slug" params={{ slug: o.slug }} className="text-sm font-semibold text-primary hover:underline">{o.title} →</Link></li>
              ))}
            </ul>
          </aside>
        </Reveal>
      </section>
    </>
  );
}
