import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, ShieldCheck, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/site/FileUpload";
import { SERVICES } from "@/lib/services";
import { pricingQuery } from "@/lib/queries";
import { computeQuote, formatGHS, type Complexity, type DeliveryFormat } from "@/lib/pricing";
import { createOrder, checkReturning } from "@/lib/api.functions";
import { pageMeta } from "@/lib/page-meta";
import type { UploadedFile } from "@/lib/uploads";
import { toast } from "sonner";

export const Route = createFileRoute("/quote")({
  validateSearch: z.object({ service: z.string().optional() }),
  head: () => pageMeta("Instant Quote", "Get an itemized quote, upload project files and order engineering, IT, research or typing services."),
  loader: ({ context }) => context.queryClient.ensureQueryData(pricingQuery),
  component: QuotePage,
});

function QuotePage() {
  const { service } = Route.useSearch();
  const { data: pricing } = useSuspenseQuery(pricingQuery);
  const navigate = useNavigate();
  const submitOrder = useServerFn(createOrder);
  const returningCheck = useServerFn(checkReturning);
  const [selected, setSelected] = useState(SERVICES.find(s => s.key === service)?.key ?? "engineering");
  const [quantity, setQuantity] = useState(1);
  const [complexity, setComplexity] = useState<Complexity>("standard");
  const [delivery, setDelivery] = useState<DeliveryFormat>("soft");
  const [deadline, setDeadline] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [folder, setFolder] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [returning, setReturning] = useState(false);
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [phone, setPhone] = useState(""); const [notes, setNotes] = useState("");
  useEffect(() => {
    setFolder(`incoming/${crypto.randomUUID()}`);
    const d = new Date(Date.now() + 8 * 86400000); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); setDeadline(d.toISOString().slice(0, 16));
  }, []);
  const rate = pricing.rates.find(r => r.service_key === selected);
  const quote = rate && deadline ? computeQuote({ rate, settings: pricing.settings, quantity, complexity, delivery, deadline: new Date(deadline), isReturning: returning }) : null;
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!quote || busy || uploading) return;
    if (new Date(deadline).getTime() < Date.now() + 3 * 3600000) { toast.error("Choose a deadline at least 3 hours from now"); return; }
    setBusy(true);
    try {
      const result = await submitOrder({ data: { name, email, phone, service_key: selected, delivery_format: delivery, quantity, complexity, deadline: new Date(deadline).toISOString(), notes, files } });
      if (result.paymentUrl) window.location.assign(result.paymentUrl);
      else { toast.success("Order received. Your tracking ID is ready."); await navigate({ to: "/order/$trackingId", params: { trackingId: result.trackingId } }); }
    } catch { toast.error("We couldn’t submit your order. Please try again."); } finally { setBusy(false); }
  }
  return <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
    <p className="text-sm font-bold uppercase text-primary">Genius · Order desk</p><h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">Your project. Your quote.</h1>
    <form onSubmit={submit} className="mt-10 grid items-start gap-10 lg:grid-cols-[1fr_380px]">
      <div className="space-y-9">
        <section><h2 className="mb-4 flex items-center gap-3 text-xl font-bold"><span className="text-primary">01</span> Choose your service</h2><div className="grid gap-3 sm:grid-cols-2">{SERVICES.map(s => <Button type="button" key={s.key} variant={selected === s.key ? "default" : "outline"} className="h-auto min-h-20 justify-start whitespace-normal p-4 text-left" onClick={() => setSelected(s.key)} aria-pressed={selected === s.key}><s.icon className="mr-2 h-6 w-6 shrink-0" /><span>{s.title}</span>{selected === s.key && <Check className="ml-auto shrink-0" />}</Button>)}</div></section>
        <section className="border-t pt-7"><h2 className="mb-5 text-xl font-bold"><span className="mr-3 text-primary">02</span> Project details</h2>
          <div className="grid gap-5 sm:grid-cols-2"><div><Label htmlFor="quantity">Quantity / pages</Label><Input id="quantity" type="number" min={1} max={5000} required value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="mt-2" /></div><div><Label htmlFor="complexity">Complexity</Label><select id="complexity" value={complexity} onChange={e => setComplexity(e.target.value as Complexity)} className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm"><option value="standard">Standard</option><option value="advanced">Advanced</option><option value="expert">Expert</option></select></div><div className="sm:col-span-2"><Label>Delivery format</Label><div className="mt-2 grid grid-cols-2 gap-2">{([['soft', 'Soft copy'], ['hard', 'Printed & bound']] as const).map(([key, label]) => <Button type="button" key={key} variant={delivery === key ? "default" : "outline"} onClick={() => setDelivery(key)} aria-pressed={delivery === key}>{label}</Button>)}</div></div><div className="sm:col-span-2"><Label htmlFor="deadline">Deadline</Label><Input id="deadline" type="datetime-local" required value={deadline} onChange={e => setDeadline(e.target.value)} className="mt-2" /></div></div>
          <div className="mt-5"><Label htmlFor="notes">Project brief</Label><Textarea id="notes" className="mt-2 min-h-28" value={notes} maxLength={4000} onChange={e => setNotes(e.target.value)} placeholder="Requirements, topic, software, or print preferences…" /></div>
          <div className="mt-5">{folder && <FileUpload files={files} onChange={setFiles} folder={folder} onBusy={setUploading} />}</div>
        </section>
        <section className="border-t pt-7"><h2 className="mb-5 text-xl font-bold"><span className="mr-3 text-primary">03</span> Contact details</h2><div className="grid gap-5 sm:grid-cols-2"><div className="sm:col-span-2"><Label htmlFor="name">Full name</Label><Input id="name" required minLength={2} maxLength={120} value={name} onChange={e => setName(e.target.value)} className="mt-2" autoComplete="name" /></div><div><Label htmlFor="email">Email</Label><Input id="email" required type="email" value={email} onChange={e => { setEmail(e.target.value); setReturning(false); }} onBlur={async () => { if (email.includes("@")) { try { const r = await returningCheck({ data: { email } }); setReturning(r.returning); } catch { setReturning(false); } } }} className="mt-2" autoComplete="email" /></div><div><Label htmlFor="phone">Phone / MoMo number</Label><Input id="phone" required minLength={9} maxLength={20} value={phone} onChange={e => setPhone(e.target.value)} className="mt-2" autoComplete="tel" placeholder="024 …" /></div></div></section>
      </div>
      <aside className="rounded-lg border bg-card p-6 lg:sticky lg:top-24"><div className="flex items-center justify-between"><h2 className="text-xl font-bold">Your quote</h2><ShieldCheck className="text-success" /></div><p className="mt-2 text-sm text-muted-foreground">{rate?.label} · {delivery === "hard" ? "Printed & bound" : "Digital delivery"}</p><div className="mt-6 space-y-4">{quote?.lines.map((line, i) => <div key={i} className="flex justify-between gap-4 border-b border-dashed pb-3 text-sm"><span className="min-w-0 text-muted-foreground">{line.label}</span><span className={`shrink-0 font-semibold tabular-nums ${line.amount < 0 ? "text-success" : ""}`}>{formatGHS(line.amount)}</span></div>)}</div><div className="mt-6 flex items-end justify-between gap-2"><span className="font-semibold">Total</span><strong className="text-3xl text-primary">{quote ? formatGHS(quote.total) : "—"}</strong></div><Button type="submit" size="lg" className="mt-6 w-full" disabled={busy || uploading || !quote}>{busy ? <Loader2 className="animate-spin" /> : <ArrowRight />} {busy ? "Submitting…" : "Proceed to Checkout"}</Button><p className="mt-4 text-center text-xs text-muted-foreground">MTN · Telecel · AirtelTigo · Bank cards</p></aside>
    </form>
  </div>;
}
