import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, FileUp, CreditCard, PackageCheck, MessageCircle, QrCode, Star, Smartphone, ShieldCheck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/site/Reveal";
import { SERVICES } from "@/lib/services";
import { whatsappLink } from "@/lib/site";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Genius Engineering & Tech — Engineering, IT, Research & Assignments in Ghana" },
      { name: "description", content: "Get an instant quote for CAD & MATLAB projects, IT services, research support, typing, printing and binding. Pay with MoMo or card." },
      { property: "og:title", content: "Genius Engineering & Tech" },
      { property: "og:description", content: "Instant quotes for engineering projects, IT services, research support and assignments. Pay with Mobile Money or card." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const STEPS = [
  { icon: FileUp, title: "Upload & describe", text: "Pick a service, drop your files (PDF, Word, images, ZIP, .m, .slx) and set your deadline." },
  { icon: CheckCircle2, title: "See your price instantly", text: "Our transparent pricing engine itemises every cedi — no haggling, no surprises." },
  { icon: CreditCard, title: "Pay securely", text: "MTN MoMo, Telecel Cash, AirtelTigo Money or card via Paystack." },
  { icon: PackageCheck, title: "Track & receive", text: "Follow progress with your tracking ID and download finished work — or pick up printed copies." },
];

const TESTIMONIALS = [
  { name: "Final-year student, KNUST", text: "My Simulink model and report were delivered two days early, fully explained." },
  { name: "Small business owner, Accra", text: "They built our website and fixed all our office laptops in one week." },
  { name: "MPhil candidate, UG", text: "The data analysis chapter was clear and my referencing was finally perfect." },
];

function Index() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-ink text-ink-foreground">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
        <div className="absolute -right-32 -top-32 h-[520px] w-[520px] rounded-full bg-primary/50 blur-[120px]" />
        <div className="absolute -bottom-40 left-10 h-[360px] w-[360px] rounded-full bg-accent/20 blur-[120px]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-ink-foreground/15 bg-ink-foreground/5 px-3 py-1.5 text-xs font-semibold text-ink-muted">
              <span className="h-2 w-2 animate-pulse rounded-full bg-success" /> Open now · Online orders 24/7
            </div>
            <h1 className="animate-fade-up mt-6 text-5xl font-extrabold leading-[0.95] sm:text-6xl lg:text-7xl" style={{ animationDelay: "80ms" }}>
              Smart work for <span className="text-gradient">brilliant</span> minds.
            </h1>
            <p className="animate-fade-up mt-6 max-w-xl text-lg text-ink-muted" style={{ animationDelay: "160ms" }}>
              Engineering projects, IT services, research support and assignments — priced instantly, paid with MoMo, tracked to your door.
            </p>
            <div className="animate-fade-up mt-9 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "240ms" }}>
              <Button asChild size="lg" className="h-14 rounded-full px-8 text-base shadow-glow transition-transform hover:-translate-y-0.5">
                <Link to="/quote">Get an Instant Quote <ArrowRight className="ml-1" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 rounded-full border-ink-foreground/20 bg-transparent px-8 text-base text-ink-foreground hover:bg-ink-foreground/10 hover:text-ink-foreground">
                <a href={whatsappLink()} target="_blank" rel="noreferrer"><MessageCircle className="mr-1" /> WhatsApp us</a>
              </Button>
            </div>
            <div className="animate-fade-up mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-ink-muted" style={{ animationDelay: "320ms" }}>
              <span className="flex items-center gap-2"><Smartphone className="h-4 w-4 text-accent" /> MoMo & card</span>
              <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-accent" /> Secure files</span>
              <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-accent" /> Express turnaround</span>
            </div>
          </div>

          {/* Quote preview card */}
          <div className="animate-fade-up relative" style={{ animationDelay: "200ms" }}>
            <div className="animate-float rounded-3xl border border-ink-foreground/10 bg-ink-foreground/[0.06] p-6 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-accent">Live quote</span>
                <span className="rounded-full bg-success/20 px-2.5 py-1 text-xs font-semibold text-success">Floor-protected</span>
              </div>
              <div className="mt-5 space-y-3 text-sm">
                {[
                  ["Research support — 40 pages", "1,000.00"],
                  ["Complexity (advanced ×1.4)", "400.00"],
                  ["Urgency (+30%)", "420.00"],
                  ["Printing & binding", "50.00"],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between border-b border-dashed border-ink-foreground/10 pb-3">
                    <span className="text-ink-muted">{l}</span>
                    <span className="font-semibold tabular-nums">GH₵{v}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-end justify-between">
                <span className="text-ink-muted">Total</span>
                <span className="font-display text-4xl font-extrabold text-accent">GH₵1,870</span>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 hidden rounded-2xl bg-background p-4 text-foreground shadow-xl sm:flex sm:items-center sm:gap-3">
              <QrCode className="h-10 w-10 text-primary" />
              <div className="text-xs">
                <div className="font-bold">Scan at the shop door</div>
                <div className="text-muted-foreground">Order from your phone</div>
              </div>
            </div>
          </div>
        </div>
        {/* marquee */}
        <div className="relative overflow-hidden border-t border-ink-foreground/10 py-4">
          <div className="animate-marquee flex w-max gap-10 whitespace-nowrap font-display text-sm font-bold uppercase tracking-[0.2em] text-ink-muted">
            {Array.from({ length: 2 }).flatMap((_, i) =>
              ["AutoCAD", "SolidWorks", "MATLAB", "Simulink", "Python", "Web Dev", "SPSS", "APA · IEEE · Harvard", "Typing", "Printing", "Binding", "Troubleshooting"].map((t) => (
                <span key={t + i} className="flex items-center gap-10">{t}<span className="text-primary">◆</span></span>
              )),
            )}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <Reveal>
          <p className="text-sm font-bold uppercase tracking-widest text-primary">What we do</p>
          <h2 className="mt-3 max-w-2xl text-4xl font-extrabold sm:text-5xl">Four desks. One shop. Zero stress.</h2>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {SERVICES.map((s, i) => (
            <Reveal key={s.key} delay={i * 80}>
              <Link
                to="/services/$slug"
                params={{ slug: s.slug }}
                className="group relative flex h-full flex-col overflow-hidden rounded-3xl border bg-card p-7 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow"
              >
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/5 transition-transform duration-500 group-hover:scale-[2.2]" />
                <s.icon className="relative h-11 w-11 rounded-xl bg-primary p-2.5 text-primary-foreground transition-transform group-hover:rotate-6" />
                <h3 className="relative mt-6 text-2xl font-bold">{s.title}</h3>
                <p className="relative mt-1 text-sm font-semibold text-primary">{s.tagline}</p>
                <p className="relative mt-3 flex-1 text-muted-foreground">{s.description}</p>
                <span className="relative mt-6 inline-flex items-center gap-1 text-sm font-bold">
                  Explore <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-secondary/60">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
          <Reveal>
            <p className="text-sm font-bold uppercase tracking-widest text-primary">How it works</p>
            <h2 className="mt-3 text-4xl font-extrabold sm:text-5xl">From upload to done in four steps.</h2>
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-4">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 100}>
                <div className="relative h-full rounded-3xl bg-card p-6 shadow-sm">
                  <span className="font-display text-6xl font-extrabold text-primary/10">0{i + 1}</span>
                  <s.icon className="-mt-6 h-8 w-8 text-primary" />
                  <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <Reveal>
          <h2 className="text-4xl font-extrabold sm:text-5xl">Students & businesses trust Genius.</h2>
          <p className="mt-2 text-sm text-muted-foreground">Sample reviews — real client testimonials coming soon.</p>
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 100}>
              <figure className="h-full rounded-3xl border bg-card p-7">
                <div className="flex gap-0.5 text-accent">{Array.from({ length: 5 }).map((_, k) => <Star key={k} className="h-4 w-4 fill-current" />)}</div>
                <blockquote className="mt-4 text-lg font-medium">“{t.text}”</blockquote>
                <figcaption className="mt-5 text-sm font-semibold text-muted-foreground">{t.name}</figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-24 sm:px-6">
        <Reveal className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-[2rem] bg-primary px-6 py-16 text-center text-primary-foreground sm:px-16">
            <div className="bg-grid absolute inset-0 opacity-40" />
            <h2 className="relative text-4xl font-extrabold sm:text-5xl">Your price is 60 seconds away.</h2>
            <p className="relative mx-auto mt-4 max-w-xl text-primary-foreground/80">Upload your files, choose soft or hard copy, set a deadline — and see an itemised quote instantly.</p>
            <Button asChild size="lg" variant="secondary" className="relative mt-8 h-14 rounded-full px-8 text-base transition-transform hover:scale-105">
              <Link to="/quote">Get an Instant Quote <ArrowRight className="ml-1" /></Link>
            </Button>
          </div>
        </Reveal>
      </section>
    </>
  );
}
