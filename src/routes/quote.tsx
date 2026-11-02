import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  ShieldCheck,
  Loader2,
  Check,
  Sparkles,
  Upload,
  File as FileIcon,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SERVICES } from "@/lib/services";
import { pricingQuery } from "@/lib/queries";
import { computeQuote, formatGHS, type Complexity, type DeliveryFormat } from "@/lib/pricing";
import { createOrder, checkReturning } from "@/lib/api.functions";
import { analyzeProjectComplexity } from "@/lib/ai-quote.server";
import { uploadOrderFile, type UploadedFile } from "@/lib/uploads";
import { pageMeta } from "@/lib/page-meta";
import { toast } from "sonner";
import mammoth from "mammoth";

export const Route = createFileRoute("/quote")({
  validateSearch: z.object({ service: z.string().optional() }),
  head: () =>
    pageMeta(
      "Instant Quote",
      "Get an itemized quote, upload project files and order engineering, IT, research or typing services.",
    ),
  loader: ({ context }) => context.queryClient.ensureQueryData(pricingQuery),
  component: QuotePage,
});

// Safe fallback UUID generator avoiding browser/SSR crypto context errors
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function QuotePage() {
  const { service } = Route.useSearch();
  const { data: pricing } = useSuspenseQuery(pricingQuery);
  const navigate = useNavigate();
  const submitOrder = useServerFn(createOrder);
  const returningCheck = useServerFn(checkReturning);
  const analyzeAiFn = useServerFn(analyzeProjectComplexity);

  const [selected, setSelected] = useState(
    SERVICES.find((s) => s.key === service)?.key ?? "engineering",
  );
  const [quantity, setQuantity] = useState(1);
  const [complexity, setComplexity] = useState<Complexity>("standard");
  const [delivery, setDelivery] = useState<DeliveryFormat>("soft");
  const [deadline, setDeadline] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [extractedFileText, setExtractedFileText] = useState(""); // Holds local raw text extract
  const [folder, setFolder] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [returning, setReturning] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  // AI Analysis States
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [aiResult, setAiResult] = useState<{
    detectedDomain: string;
    technicalComplexity: Complexity;
    tediumScore: number;
    reasoning: string;
    estimatedHours: number;
    suggestedMultiplier: number;
  } | null>(null);

  useEffect(() => {
    setFolder(`incoming/${generateUUID()}`);
    const d = new Date(Date.now() + 8 * 86400000);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    setDeadline(d.toISOString().slice(0, 16));
  }, []);

  // Handle local file selection, text extraction, and Supabase upload simultaneously
  async function handleFilesSelected(list: FileList | null) {
    if (!list || list.length === 0) return;
    if (files.length + list.length > 20) {
      toast.error("Maximum 20 files per order");
      return;
    }

    const file = list[0]; // Take first file for deep text inspection
    let textContent = "";

    try {
      // 1. Extract text locally from browser File object instantly
      if (file.name.endsWith(".docx")) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        textContent = result.value;
      } else if (
        file.name.endsWith(".txt") ||
        file.name.endsWith(".py") ||
        file.name.endsWith(".m") ||
        file.name.endsWith(".cpp") ||
        file.name.endsWith(".md")
      ) {
        textContent = await file.text();
      }
      setExtractedFileText(textContent);
    } catch (err) {
      console.error("Local text extraction error:", err);
    }

    // 2. Upload file to Supabase storage for order submission
    setUploading(true);
    const added: UploadedFile[] = [];
    try {
      for (const f of Array.from(list)) {
        added.push(await uploadOrderFile(f, folder));
      }
      setFiles((prev) => [...prev, ...added]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // Automatically trigger AI analysis when brief, files, or extracted text change with AbortController protection
  useEffect(() => {
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      if (!notes && files.length === 0 && !extractedFileText) {
        setAiResult(null);
        setComplexity("standard");
        return;
      }
      setIsAnalyzingAi(true);
      try {
        const res = await analyzeAiFn({
          data: {
            serviceKey: selected,
            projectBrief: notes || "No detailed brief provided.",
            fileName: files[0]?.name,
            fileTextExtract: extractedFileText,
          },
        });

        // Only update state if the request wasn't aborted
        if (!controller.signal.aborted) {
          setAiResult(res);
          if (res && res.technicalComplexity) {
            setComplexity(res.technicalComplexity);
          }
        }
      } catch (err: any) {
        if (err?.name !== "AbortError" && !controller.signal.aborted) {
          console.error("AI Analysis failed:", err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsAnalyzingAi(false);
        }
      }
    }, 800);

    return () => {
      clearTimeout(timer);
      controller.abort(); // Cancels stale requests instantly and prevents HTTP server abortion crashes
    };
  }, [notes, files, extractedFileText, selected]);

  const rate = pricing.rates.find((r) => r.service_key === selected);

  // Compute quote with automated AI multiplier and reasoning
  const quote =
    rate && deadline
      ? computeQuote({
          rate,
          settings: pricing.settings,
          quantity,
          complexity,
          delivery,
          deadline: new Date(deadline),
          isReturning: returning,
          aiMultiplier: aiResult?.suggestedMultiplier,
          aiTediumScore: aiResult?.tediumScore,
          aiReasoning: aiResult?.reasoning,
        })
      : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!quote || busy || uploading) return;
    if (new Date(deadline).getTime() < Date.now() + 3 * 3600000) {
      toast.error("Choose a deadline at least 3 hours from now");
      return;
    }
    setBusy(true);
    try {
      const result = await submitOrder({
        data: {
          name,
          email,
          phone,
          service_key: selected,
          delivery_format: delivery,
          quantity,
          complexity,
          deadline: new Date(deadline).toISOString(),
          notes,
          files,
        },
      });
      if (result.paymentUrl) window.location.assign(result.paymentUrl);
      else {
        toast.success("Order received. Your tracking ID is ready.");
        await navigate({ to: "/order/$trackingId", params: { trackingId: result.trackingId } });
      }
    } catch {
      toast.error("We couldn’t submit your order. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <p className="text-sm font-bold uppercase text-primary">Genius · Order desk</p>
      <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">Your project. Your quote.</h1>

      <form onSubmit={submit} className="mt-10 grid items-start gap-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-9">
          <section>
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold">
              <span className="text-primary">01</span> Choose your service
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {SERVICES.map((s) => (
                <Button
                  type="button"
                  key={s.key}
                  variant={selected === s.key ? "default" : "outline"}
                  className="h-auto min-h-20 justify-start whitespace-normal p-4 text-left"
                  onClick={() => setSelected(s.key)}
                  aria-pressed={selected === s.key}
                >
                  <s.icon className="mr-2 h-6 w-6 shrink-0" />
                  <span>{s.title}</span>
                  {selected === s.key && <Check className="ml-auto shrink-0" />}
                </Button>
              ))}
            </div>
          </section>

          <section className="border-t pt-7">
            <h2 className="mb-5 text-xl font-bold">
              <span className="mr-3 text-primary">02</span> Project details
            </h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="quantity">Quantity / pages</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  max={5000}
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="mt-2"
                />
              </div>

              {/* Fully Automated AI Complexity & Tedium Tier Display */}
              <div>
                <div className="flex items-center justify-between">
                  <Label>Complexity & Tedium Tier</Label>
                  <span className="text-xs font-semibold text-primary flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-full">
                    <Sparkles className="h-3 w-3" />{" "}
                    {isAnalyzingAi ? "Analyzing..." : "AI Automated"}
                  </span>
                </div>
                <div className="mt-2 flex h-10 w-full items-center justify-between rounded-md border bg-muted/50 px-3 text-sm font-medium capitalize text-foreground">
                  <span>
                    {isAnalyzingAi
                      ? "Evaluating project complexity..."
                      : `${complexity} tier (${aiResult?.suggestedMultiplier || 1.0}x multiplier)`}
                  </span>
                  {isAnalyzingAi ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <ShieldCheck className="h-4 w-4 text-success" />
                  )}
                </div>
              </div>

              <div className="sm:col-span-2">
                <Label>Delivery format</Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(
                    [
                      ["soft", "Soft copy"],
                      ["hard", "Printed & bound"],
                    ] as const
                  ).map(([key, label]) => (
                    <Button
                      type="button"
                      key={key}
                      variant={delivery === key ? "default" : "outline"}
                      onClick={() => setDelivery(key)}
                      aria-pressed={delivery === key}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="mt-5">
              <Label htmlFor="notes">Project brief</Label>
              <Textarea
                id="notes"
                className="mt-2 min-h-28"
                value={notes}
                maxLength={4000}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Requirements, topic, software, or print preferences…"
              />
            </div>

            {/* Direct File Upload Zone with Instant Local Text Parsing */}
            <div className="mt-5 space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                accept=".pdf,.docx,.doc,.txt,.py,.m,.cpp,.zip,.png,.jpg"
                onChange={(e) => handleFilesSelected(e.target.files)}
                aria-label="Upload project files"
              />
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  handleFilesSelected(e.dataTransfer.files);
                }}
                className={`rounded-lg border-2 border-dashed p-7 text-center transition-colors ${
                  dragging ? "border-primary bg-primary/5" : "border-border bg-muted/40"
                }`}
              >
                {uploading ? (
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                ) : (
                  <Upload className="mx-auto h-8 w-8 text-primary" />
                )}
                <Button
                  type="button"
                  variant="ghost"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2"
                >
                  {uploading ? "Uploading & parsing…" : "Choose files or drop them here"}
                </Button>
                <p className="mt-1 text-xs text-muted-foreground">
                  PDF, Word, PNG, JPG, ZIP, MATLAB, Simulink · up to 50 MB each
                </p>
              </div>
              {files.map((f, index) => (
                <div key={f.path} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
                  <FileIcon className="h-4 w-4 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1 break-all">
                    {f.name}
                    <span className="block text-xs text-muted-foreground">
                      {(f.size / 1024).toFixed(1)} KB
                    </span>
                  </span>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={`Remove ${f.name}`}
                    onClick={() => {
                      setFiles(files.filter((_, i) => i !== index));
                      if (index === 0) setExtractedFileText("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* AI Analysis Live Status Card */}
            {(isAnalyzingAi || aiResult) && (
              <div className="mt-5 rounded-lg border bg-muted/40 p-4 text-sm">
                <div className="flex items-center gap-2 font-semibold text-primary">
                  {isAnalyzingAi ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  <span>
                    {isAnalyzingAi
                      ? "Reading document & calculating technical tedium..."
                      : `AI Technical Assessment: Score ${aiResult?.tediumScore}/10`}
                  </span>
                </div>
                {aiResult && !isAnalyzingAi && (
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                    {aiResult.reasoning}
                  </p>
                )}
              </div>
            )}
          </section>

          <section className="border-t pt-7">
            <h2 className="mb-5 text-xl font-bold">
              <span className="mr-3 text-primary">03</span> Contact details
            </h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  required
                  minLength={2}
                  maxLength={120}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2"
                  autoComplete="name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setReturning(false);
                  }}
                  onBlur={async () => {
                    if (email.includes("@")) {
                      try {
                        const r = await returningCheck({ data: { email } });
                        setReturning(r.returning);
                      } catch {
                        setReturning(false);
                      }
                    }
                  }}
                  className="mt-2"
                  autoComplete="email"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone / MoMo number</Label>
                <Input
                  id="phone"
                  required
                  minLength={9}
                  maxLength={20}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-2"
                  autoComplete="tel"
                  placeholder="024 …"
                />
              </div>
            </div>
          </section>
        </div>

        <aside className="rounded-lg border bg-card p-6 lg:sticky lg:top-24">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Your quote</h2>
            <ShieldCheck className="text-success" />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {rate?.label} · {delivery === "hard" ? "Printed & bound" : "Digital delivery"}
          </p>

          <div className="mt-6 space-y-4">
            {quote?.lines.map((line, i) => (
              <div
                key={i}
                className="flex justify-between gap-4 border-b border-dashed pb-3 text-sm"
              >
                <span className="min-w-0 text-muted-foreground">{line.label}</span>
                <span
                  className={`shrink-0 font-semibold tabular-nums ${line.amount < 0 ? "text-success" : ""}`}
                >
                  {formatGHS(line.amount)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-end justify-between gap-2">
            <span className="font-semibold">Total</span>
            <strong className="text-3xl text-primary">
              {quote ? formatGHS(quote.total) : "—"}
            </strong>
          </div>

          <Button
            type="submit"
            size="lg"
            className="mt-6 w-full"
            disabled={busy || uploading || !quote || isAnalyzingAi}
          >
            {busy ? <Loader2 className="animate-spin" /> : <ArrowRight />}{" "}
            {busy ? "Submitting…" : "Proceed to Checkout"}
          </Button>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            MTN · Telecel · AirtelTigo · Bank cards
          </p>
        </aside>
      </form>
    </div>
  );
}
