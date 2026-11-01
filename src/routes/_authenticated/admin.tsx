import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Bell, Download, FileText, Loader2, RefreshCw, Repeat, Save, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { adminQuery, pricingQuery, roleQuery } from "@/lib/queries";
import { adminAddOutputs, adminDeleteFile, adminFileUrl, adminSetStatus, adminUpdatePricing, amIAdmin } from "@/lib/api.functions";
import { pageMeta } from "@/lib/page-meta";
import { formatGHS, type PricingSettings } from "@/lib/pricing";
import { serviceByKey } from "@/lib/services";
import { uploadOrderFile } from "@/lib/uploads";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => pageMeta("Admin dashboard", "Manage Genius orders, deliverables and pricing rules."),
  beforeLoad: async () => {
    const r = await amIAdmin();
    if (!r.admin) throw redirect({ to: "/account" });
  },
  loader: async ({ context }) => {
    await Promise.all([context.queryClient.ensureQueryData(adminQuery), context.queryClient.ensureQueryData(pricingQuery), context.queryClient.ensureQueryData(roleQuery)]);
  },
  component: AdminPage,
});


function AdminPage() {
  const { data } = useSuspenseQuery(adminQuery);
  const qc = useQueryClient();
  const paidCount = data.orders.filter((o) => o.payment_status === "paid").length;
  const seen = useRef<number | null>(null);
  const [alert, setAlert] = useState<string | null>(null);
  useEffect(() => {
    if (seen.current !== null && paidCount > seen.current) {
      const newest = data.orders.find((o) => o.payment_status === "paid");
      const msg = `New paid order${newest ? `: ${newest.client_name} — ${formatGHS(newest.amount_paid)}` : ""}`;
      setAlert(msg);
      toast.success(msg);
    }
    seen.current = paidCount;
  }, [paidCount, data.orders]);

  const revenue = data.orders.reduce((s, o) => s + (o.payment_status === "paid" ? o.amount_paid : 0), 0);
  const open = data.orders.filter((o) => o.status !== "completed").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-primary">Genius · Owner dashboard</p>
          <h1 className="mt-2 text-4xl font-extrabold">Orders & pricing</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => qc.invalidateQueries({ queryKey: ["admin-orders"] })}><RefreshCw /> Refresh</Button>
          <Button asChild variant="outline"><Link to="/account">My account</Link></Button>
        </div>
      </div>

      {alert && (
        <div role="status" className="mt-6 flex items-center justify-between gap-3 rounded-lg border-2 border-primary bg-primary/10 p-4 font-bold text-primary">
          <span className="flex items-center gap-2"><Bell className="h-5 w-5 animate-bounce" /> {alert}</span>
          <Button size="sm" variant="ghost" onClick={() => setAlert(null)}>Dismiss</Button>
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <Stat label="Total orders" value={String(data.orders.length)} />
        <Stat label="Open orders" value={String(open)} />
        <Stat label="Paid orders" value={String(paidCount)} />
        <Stat label="Revenue received" value={formatGHS(revenue)} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className={`rounded-md px-2 py-1 ${data.paymentConfigured ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>Paystack: {data.paymentConfigured ? "connected" : "pending setup"}</span>
        <span className={`rounded-md px-2 py-1 ${data.telegramConfigured ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>Telegram alerts: {data.telegramConfigured ? "connected" : "pending setup"}</span>
      </div>

      <Tabs defaultValue="orders" className="mt-8">
        <TabsList><TabsTrigger value="orders">Orders</TabsTrigger><TabsTrigger value="pricing">Pricing rules</TabsTrigger></TabsList>
        <TabsContent value="orders" className="mt-6 grid gap-4">
          {!data.orders.length && <p className="py-16 text-center text-muted-foreground">No orders yet. They will appear here automatically.</p>}
          {data.orders.map((o) => <OrderCard key={o.id} order={o} />)}
        </TabsContent>
        <TabsContent value="pricing" className="mt-6"><PricingEditor /></TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-extrabold">{value}</p></div>;
}

type Order = { id: string; tracking_id: string; client_name: string; client_email: string; client_phone: string; service_key: string; delivery_format: string; quantity: number; complexity: string; deadline: string; notes: string | null; amount: number; amount_paid: number; status: string; payment_status: string; is_repeat: boolean; created_at: string; order_files: { id: string; kind: string; name: string; size: number; path: string }[] };

function OrderCard({ order: o }: { order: Order }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-orders"] });
  const inputs = o.order_files.filter((f) => f.kind === "input");
  const outputs = o.order_files.filter((f) => f.kind === "output");

  async function setStatus(status: "received" | "in_progress" | "completed") {
    setBusy(true);
    try { await adminSetStatus({ data: { orderId: o.id, status } }); toast.success(`Marked ${status.replace("_", " ")}`); await refresh(); }
    catch { toast.error("Could not update status"); } finally { setBusy(false); }
  }
  async function open(path: string) {
    try { const { url } = await adminFileUrl({ data: { path } }); window.open(url, "_blank", "noopener"); } catch { toast.error("Could not open file"); }
  }
  async function uploadOutputs(list: FileList | null) {
    if (!list?.length) return;
    setBusy(true);
    try {
      const up = [];
      for (const f of Array.from(list)) up.push(await uploadOrderFile(f, `outputs/${o.id}`));
      await adminAddOutputs({ data: { orderId: o.id, files: up } });
      toast.success("Completed work uploaded"); await refresh();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Upload failed"); }
    finally { setBusy(false); if (input.current) input.current.value = ""; }
  }
  async function remove(id: string) {
    setBusy(true);
    try { await adminDeleteFile({ data: { fileId: id } }); await refresh(); } catch { toast.error("Could not delete"); } finally { setBusy(false); }
  }

  const steps = ["received", "in_progress", "completed"] as const;
  return (
    <div className="rounded-lg border bg-card p-5 transition-colors hover:border-primary/50">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-sm font-bold text-primary">{o.tracking_id}</p>
          <h2 className="mt-1 text-xl font-bold">{serviceByKey(o.service_key)?.title ?? o.service_key}</h2>
          <p className="mt-1 text-sm">
            {o.client_name} · <a className="underline" href={`mailto:${o.client_email}`}>{o.client_email}</a> · <a className="underline" href={`tel:${o.client_phone}`}>{o.client_phone}</a>
            {o.is_repeat && <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground"><Repeat className="h-3 w-3" /> Repeat client</span>}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {o.quantity} units · {o.complexity} · {o.delivery_format === "hard" ? "Hard copy (printed & bound)" : "Soft copy"} · Due {new Date(o.deadline).toLocaleString()}
          </p>
          {o.notes && <p className="mt-2 max-w-2xl whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">{o.notes}</p>}
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold">{formatGHS(o.amount)}</p>
          <p className={`text-sm font-semibold capitalize ${o.payment_status === "paid" ? "text-success" : "text-muted-foreground"}`}>
            {o.payment_status}{o.payment_status === "paid" && ` · ${formatGHS(o.amount_paid)}`}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {steps.map((s) => (
          <Button key={s} size="sm" disabled={busy} variant={o.status === s ? "default" : "outline"} onClick={() => setStatus(s)} className="capitalize">
            {s.replace("_", " ")}
          </Button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-sm font-bold">Client files ({inputs.length})</p>
          <div className="mt-2 space-y-1">
            {inputs.map((f) => <button key={f.id} onClick={() => open(f.path)} className="flex w-full items-center gap-2 rounded-md border p-2 text-left text-sm hover:border-primary"><FileText className="h-4 w-4 text-primary" /><span className="flex-1 break-all">{f.name}</span><Download className="h-4 w-4" /></button>)}
            {!inputs.length && <p className="text-sm text-muted-foreground">No files uploaded.</p>}
          </div>
        </div>
        <div>
          <p className="text-sm font-bold">Completed work ({outputs.length})</p>
          <div className="mt-2 space-y-1">
            {outputs.map((f) => (
              <div key={f.id} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                <FileText className="h-4 w-4 text-primary" /><button onClick={() => open(f.path)} className="flex-1 break-all text-left hover:underline">{f.name}</button>
                <Button size="icon" variant="ghost" aria-label={`Delete ${f.name}`} disabled={busy} onClick={() => remove(f.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <input ref={input} type="file" multiple className="hidden" accept=".pdf,.docx,.png,.jpg,.jpeg,.zip,.m,.slx" onChange={(e) => uploadOutputs(e.target.files)} aria-label="Upload completed work" />
            <Button size="sm" variant="outline" disabled={busy} onClick={() => input.current?.click()}>{busy ? <Loader2 className="animate-spin" /> : <Upload />} Upload completed work</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

const settingFields: { key: keyof PricingSettings; label: string }[] = [
  { key: "complexity_standard", label: "Standard complexity multiplier" },
  { key: "complexity_advanced", label: "Advanced complexity multiplier" },
  { key: "complexity_expert", label: "Expert complexity multiplier" },
  { key: "urgency_24h_pct", label: "Urgency ≤ 24h (%)" },
  { key: "urgency_72h_pct", label: "Urgency ≤ 72h (%)" },
  { key: "urgency_7d_pct", label: "Urgency ≤ 7 days (%)" },
  { key: "print_per_page", label: "Printing per page (GH₵)" },
  { key: "binding_base", label: "Binding base (GH₵)" },
  { key: "binding_per_50_pages", label: "Binding per 50 pages (GH₵)" },
  { key: "returning_discount_pct", label: "Returning client discount (%)" },
];

function PricingEditor() {
  const { data } = useSuspenseQuery(pricingQuery);
  const qc = useQueryClient();
  const [rates, setRates] = useState(() => data.rates.map((r) => ({ ...r })));
  const [settings, setSettings] = useState<PricingSettings>(() => ({ ...data.settings }));
  const [busy, setBusy] = useState(false);
  const valid = useMemo(() => rates.every((r) => r.base_rate >= 0 && r.floor_price >= 0) && Object.values(settings).every((v) => Number.isFinite(v) && v >= 0), [rates, settings]);

  async function save() {
    setBusy(true);
    try {
      await adminUpdatePricing({ data: { rates: rates.map((r) => ({ service_key: r.service_key, base_rate: r.base_rate, floor_price: r.floor_price })), settings } });
      await qc.invalidateQueries({ queryKey: ["pricing"] });
      toast.success("Pricing saved — new quotes use these rates now");
    } catch { toast.error("Could not save pricing"); } finally { setBusy(false); }
  }

  return (
    <div className="grid gap-8">
      <div>
        <h2 className="text-xl font-bold">Service rates</h2>
        <div className="mt-4 grid gap-3">
          {rates.map((r, i) => (
            <div key={r.service_key} className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_180px_180px] sm:items-end">
              <div><p className="font-bold">{r.label}</p><p className="text-xs text-muted-foreground">per {r.unit_label}</p></div>
              <div><Label htmlFor={`base-${r.service_key}`}>Base rate (GH₵)</Label><Input id={`base-${r.service_key}`} className="mt-1" type="number" min={0} step="0.01" value={r.base_rate} onChange={(e) => setRates(rates.map((x, j) => (j === i ? { ...x, base_rate: Number(e.target.value) } : x)))} /></div>
              <div><Label htmlFor={`floor-${r.service_key}`}>Minimum price (GH₵)</Label><Input id={`floor-${r.service_key}`} className="mt-1" type="number" min={0} step="0.01" value={r.floor_price} onChange={(e) => setRates(rates.map((x, j) => (j === i ? { ...x, floor_price: Number(e.target.value) } : x)))} /></div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-xl font-bold">Surcharges, printing & discounts</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {settingFields.map((f) => (
            <div key={f.key}><Label htmlFor={f.key}>{f.label}</Label><Input id={f.key} className="mt-1" type="number" min={0} step="0.01" value={settings[f.key]} onChange={(e) => setSettings({ ...settings, [f.key]: Number(e.target.value) })} /></div>
          ))}
        </div>
      </div>
      <Button size="lg" className="w-fit" disabled={busy || !valid} onClick={save}>{busy ? <Loader2 className="animate-spin" /> : <Save />} Save pricing</Button>
    </div>
  );
}

