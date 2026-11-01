import { getDb } from "./db.server";
import type { Json } from "@/integrations/supabase/types";

function newTrackingId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return "GEN-" + Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export interface NewOrder {
  user_id: string | null;
  client_id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  service_key: string;
  delivery_format: "soft" | "hard";
  quantity: number;
  complexity: string;
  deadline: string;
  notes: string | null;
  amount: number;
  breakdown: Json;
  is_repeat: boolean;
}

export async function createOrder(o: NewOrder) {
  const db = await getDb();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await db.from("orders").insert({ ...o, tracking_id: newTrackingId() }).select().single();
    if (!error) {
      await addEvent(data.id, "Order received");
      return data;
    }
    if (!error.message.includes("duplicate")) throw new Error(error.message);
  }
  throw new Error("Could not allocate tracking ID");
}

export async function getOrderByTracking(trackingId: string) {
  const db = await getDb();
  const { data } = await db.from("orders").select("*").eq("tracking_id", trackingId.toUpperCase()).maybeSingle();
  return data;
}

export async function getOrder(id: string) {
  const db = await getDb();
  const { data } = await db.from("orders").select("*").eq("id", id).maybeSingle();
  return data;
}

export async function listOrders() {
  const db = await getDb();
  const { data, error } = await db.from("orders").select("*, order_files(*)").order("created_at", { ascending: false }).limit(500);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listOrdersForUser(userId: string, email?: string) {
  const db = await getDb();
  let q = db.from("orders").select("*").order("created_at", { ascending: false });
  q = email ? q.or(`user_id.eq.${userId},client_email.eq.${email.toLowerCase()}`) : q.eq("user_id", userId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function setStatus(id: string, status: string) {
  const db = await getDb();
  const { error } = await db.from("orders").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
  const label = status === "in_progress" ? "Work in progress" : status === "completed" ? "Completed — ready for download" : "Order received";
  await addEvent(id, label);
}

export async function setPaymentRef(id: string, ref: string) {
  const db = await getDb();
  await db.from("orders").update({ payment_ref: ref }).eq("id", id);
}

/** Marks paid; returns true only the first time (idempotent). */
export async function markPaid(id: string, amountPaid: number, ref: string) {
  const db = await getDb();
  const { data } = await db
    .from("orders")
    .update({ payment_status: "paid", amount_paid: amountPaid, payment_ref: ref, paid_at: new Date().toISOString() })
    .eq("id", id)
    .neq("payment_status", "paid")
    .select()
    .maybeSingle();
  if (data) await addEvent(id, `Payment confirmed (GH₵${amountPaid.toFixed(2)})`);
  return !!data;
}

export async function addEvent(orderId: string, label: string) {
  const db = await getDb();
  await db.from("order_events").insert({ order_id: orderId, label });
}

export async function listEvents(orderId: string) {
  const db = await getDb();
  const { data } = await db.from("order_events").select("*").eq("order_id", orderId).order("created_at");
  return data ?? [];
}
