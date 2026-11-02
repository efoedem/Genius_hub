import { describe, expect, it } from "vitest";
import { computeQuote, printingCost, type PricingSettings, type ServiceRate } from "./pricing";

const settings: PricingSettings = {
  complexity_standard: 1,
  complexity_advanced: 1.4,
  complexity_expert: 1.9,
  urgency_24h_pct: 60,
  urgency_72h_pct: 30,
  urgency_7d_pct: 10,
  print_per_page: 1,
  binding_base: 10,
  binding_per_50_pages: 5,
  returning_discount_pct: 5,
};
const rate: ServiceRate = { service_key: "assignment", label: "Typing", unit_label: "page", base_rate: 5, floor_price: 30 };
const now = new Date("2026-01-01T00:00:00Z");
const in30days = new Date("2026-01-31T00:00:00Z");

describe("pricing engine", () => {
  it("never goes below the service floor price", () => {
    const q = computeQuote({ rate, settings, quantity: 1, complexity: "standard", delivery: "soft", deadline: in30days, now });
    expect(q.total).toBe(30);
  });

  it("adds the 24h urgency surcharge", () => {
    const q = computeQuote({ rate, settings, quantity: 20, complexity: "standard", delivery: "soft", deadline: new Date("2026-01-01T12:00:00Z"), now });
    expect(q.total).toBe(160); // 100 + 60%
  });

  it("adds printing and binding for hard copy", () => {
    expect(printingCost(60, settings)).toBe(80); // 60 + 10 + 2×5
    const q = computeQuote({ rate, settings, quantity: 60, complexity: "standard", delivery: "hard", deadline: in30days, now });
    expect(q.total).toBe(380);
  });

  it("returning discount cannot push below floor", () => {
    const q = computeQuote({ rate, settings, quantity: 1, complexity: "standard", delivery: "soft", deadline: in30days, now, isReturning: true });
    expect(q.total).toBe(30);
  });
});

it("applies the AI technical tedium multiplier when provided", () => {
  const q = computeQuote({
    rate,
    settings,
    quantity: 10, // base = 50
    complexity: "standard",
    delivery: "soft",
    deadline: in30days,
    now,
    aiMultiplier: 1.9,
    aiTediumScore: 9,
    aiReasoning: "Involves complex control systems MATLAB modeling.",
  });
  // Base = 50. Complexity adjustment with 1.9 multiplier adds: 50 * (1.9 - 1) = 45. Total = 95.
  expect(q.total).toBe(95);
  expect(
    q.lines.some((line) => line.label.includes("AI Technical Tedium Analysis (Score: 9/10")),
  ).toBe(true);
  expect(q.aiEvaluationSummary?.reasoning).toBe(
    "Involves complex control systems MATLAB modeling.",
  );
});