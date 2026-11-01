import { getDb } from "./db.server";
import type { PricingSettings, ServiceRate } from "../pricing";

export async function getRates(): Promise<ServiceRate[]> {
  const db = await getDb();
  const { data, error } = await db.from("service_rates").select("*").order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({ ...r, base_rate: Number(r.base_rate), floor_price: Number(r.floor_price) }));
}

export async function getSettings(): Promise<PricingSettings> {
  const db = await getDb();
  const { data, error } = await db.from("pricing_settings").select("*").eq("id", 1).single();
  if (error) throw new Error(error.message);
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(data)) if (k !== "id" && k !== "updated_at") out[k] = Number(v);
  return out as unknown as PricingSettings;
}

export async function updateRate(key: string, patch: { base_rate: number; floor_price: number }) {
  const db = await getDb();
  const { error } = await db.from("service_rates").update({ ...patch, updated_at: new Date().toISOString() }).eq("service_key", key);
  if (error) throw new Error(error.message);
}

export async function updateSettings(patch: Partial<PricingSettings>) {
  const db = await getDb();
  const { error } = await db.from("pricing_settings").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", 1);
  if (error) throw new Error(error.message);
}
