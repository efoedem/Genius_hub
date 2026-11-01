import { getOrder, markPaid } from "./data/orders.server";
import { emailClient, notifyOwnerPaid } from "./notify.server";

export const paystackConfigured = () => !!process.env["PAYSTACK_SECRET_KEY"];

export async function initializeTransaction(opts: { email: string; amount: number; reference: string; callbackUrl: string; orderId: string }) {
  const secret = process.env["PAYSTACK_SECRET_KEY"];
  if (!secret) return null;
  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "content-type": "application/json" },
    body: JSON.stringify({
      email: opts.email,
      amount: Math.round(opts.amount * 100),
      currency: "GHS",
      reference: opts.reference,
      callback_url: opts.callbackUrl,
      channels: ["mobile_money", "card"],
      metadata: { order_id: opts.orderId },
    }),
  });
  const json = (await res.json()) as { status: boolean; message: string; data?: { authorization_url: string } };
  if (!json.status || !json.data) throw new Error(`Paystack: ${json.message}`);
  return json.data.authorization_url;
}

export async function verifyTransaction(reference: string) {
  const secret = process.env["PAYSTACK_SECRET_KEY"];
  if (!secret) return null;
  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const json = (await res.json()) as { status: boolean; data?: { status: string; amount: number; metadata?: { order_id?: string } } };
  return json.status && json.data ? json.data : null;
}

/** Shared by callback verification and webhook. Idempotent. */
export async function settlePayment(orderId: string, reference: string, amountPesewas: number, origin: string) {
  const order = await getOrder(orderId);
  if (!order) return false;
  const paid = amountPesewas / 100;
  if (paid + 0.01 < Number(order.amount)) return false; // underpayment
  const first = await markPaid(order.id, paid, reference);
  if (first) {
    const fresh = (await getOrder(order.id))!;
    await Promise.all([notifyOwnerPaid(fresh), emailClient(fresh, "confirmed", origin)]);
  }
  return true;
}

export async function hmacSha512Hex(secret: string, body: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-512" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}
