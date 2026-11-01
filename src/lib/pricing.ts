// Rule-based pricing engine. Pure functions only — shared by the browser
// (live quote preview) and the server (authoritative price on order creation).

export type Complexity = "standard" | "advanced" | "expert";
export type DeliveryFormat = "soft" | "hard";

export interface ServiceRate {
  service_key: string;
  label: string;
  unit_label: string;
  base_rate: number;
  floor_price: number;
  sort_order?: number;
}

export interface PricingSettings {
  complexity_standard: number;
  complexity_advanced: number;
  complexity_expert: number;
  urgency_24h_pct: number;
  urgency_72h_pct: number;
  urgency_7d_pct: number;
  print_per_page: number;
  binding_base: number;
  binding_per_50_pages: number;
  returning_discount_pct: number;
}

export interface QuoteInput {
  rate: ServiceRate;
  settings: PricingSettings;
  quantity: number;
  complexity: Complexity;
  delivery: DeliveryFormat;
  deadline: Date;
  now?: Date;
  isReturning?: boolean;
}

export interface QuoteLine {
  label: string;
  amount: number;
}

export interface Quote {
  lines: QuoteLine[];
  total: number;
  urgencyPct: number;
  hoursUntilDeadline: number;
}

const round = (n: number) => Math.round(n * 100) / 100;

export function urgencyPctFor(hours: number, s: PricingSettings): number {
  if (hours <= 24) return Number(s.urgency_24h_pct);
  if (hours <= 72) return Number(s.urgency_72h_pct);
  if (hours <= 168) return Number(s.urgency_7d_pct);
  return 0;
}

export function printingCost(pages: number, s: PricingSettings): number {
  const p = Math.max(1, Math.ceil(pages));
  return round(
    p * Number(s.print_per_page) +
      Number(s.binding_base) +
      Math.ceil(p / 50) * Number(s.binding_per_50_pages),
  );
}

export function computeQuote(input: QuoteInput): Quote {
  const { rate, settings: s, complexity, delivery } = input;
  const qty = Math.max(1, Math.floor(input.quantity || 1));
  const now = input.now ?? new Date();
  const hours = Math.max(0, (input.deadline.getTime() - now.getTime()) / 36e5);
  const lines: QuoteLine[] = [];

  const base = round(qty * Number(rate.base_rate));
  lines.push({ label: `${rate.label} — ${qty} × GH₵${Number(rate.base_rate).toFixed(2)} per ${rate.unit_label}`, amount: base });

  const mult =
    complexity === "expert"
      ? Number(s.complexity_expert)
      : complexity === "advanced"
        ? Number(s.complexity_advanced)
        : Number(s.complexity_standard);
  const complexityAdj = round(base * (mult - 1));
  if (complexityAdj !== 0) lines.push({ label: `Complexity (${complexity}, ×${mult})`, amount: complexityAdj });

  let work = base + complexityAdj;
  const urgencyPct = urgencyPctFor(hours, s);
  if (urgencyPct > 0) {
    const u = round(work * (urgencyPct / 100));
    lines.push({ label: `Urgency surcharge (+${urgencyPct}%)`, amount: u });
    work += u;
  }

  const floor = Number(rate.floor_price);
  if (work < floor) {
    lines.push({ label: "Minimum service charge adjustment", amount: round(floor - work) });
    work = floor;
  }

  let total = work;
  if (delivery === "hard") {
    const pc = printingCost(qty, s);
    lines.push({ label: `Printing & binding (${qty} pages)`, amount: pc });
    total += pc;
  }

  if (input.isReturning && Number(s.returning_discount_pct) > 0) {
    const pct = Number(s.returning_discount_pct);
    let d = round(total * (pct / 100));
    if (total - d < floor) d = round(Math.max(0, total - floor));
    if (d > 0) {
      lines.push({ label: `Returning client discount (−${pct}%)`, amount: -d });
      total -= d;
    }
  }

  total = round(Math.max(total, floor));
  return { lines, total, urgencyPct, hoursUntilDeadline: hours };
}

export const formatGHS = (n: number) =>
  `GH₵${Number(n).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
