import { serviceByKey } from "./services";
import { listFiles, signedUrl } from "./data/files.server";

type OrderRow = {
  id: string;
  tracking_id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  service_key: string;
  delivery_format: string;
  amount_paid: number;
  is_repeat: boolean;
};

const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);

/** Telegram alert to the owner. Skipped silently if bot token / chat id are not configured. */
export async function notifyOwnerPaid(order: OrderRow) {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  const chatId = process.env["TELEGRAM_CHAT_ID"];
  if (!token || !chatId) return;
  try {
    const files = await listFiles(order.id, "input");
    const links = await Promise.all(files.map(async (f) => `• <a href="${await signedUrl(f.path, 7 * 86400)}">${esc(f.name)}</a>`));
    const text = [
      `💰 <b>New paid order ${order.tracking_id}</b>${order.is_repeat ? " (returning client)" : ""}`,
      `👤 ${esc(order.client_name)}`,
      `📞 ${esc(order.client_phone)} · ${esc(order.client_email)}`,
      `🛠 ${esc(serviceByKey(order.service_key)?.title ?? order.service_key)}`,
      `📦 ${order.delivery_format === "hard" ? "Hard copy (printed & bound)" : "Soft copy (PDF/Word)"}`,
      `💵 Paid: GH₵${Number(order.amount_paid).toFixed(2)}`,
      links.length ? `📎 Files:\n${links.join("\n")}` : "📎 No files uploaded",
    ].join("\n");
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
    });
  } catch (e) {
    console.error("Telegram notify failed", e);
  }
}

/**
 * Client emails (order confirmed / work ready). Sending requires a verified
 * sender domain; until one is set up this logs and returns without sending.
 */
export async function emailClient(order: OrderRow, kind: "confirmed" | "ready", origin: string) {
  const link = `${origin}/order/${order.tracking_id}`;
  console.log(`[email:${kind}] to ${order.client_email} — ${link} (email sending not configured yet)`);
}
