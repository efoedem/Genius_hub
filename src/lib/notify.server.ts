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

const esc = (s: string) =>
  s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);

/** Telegram alert to the owner. Skipped silently if bot token / chat id are not configured. */
export async function notifyOwnerPaid(order: OrderRow) {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  const chatId = process.env["TELEGRAM_CHAT_ID"];
  if (!token || !chatId) return;
  try {
    const files = await listFiles(order.id, "input");
    const links = await Promise.all(
      files.map(
        async (f) => `• <a href="${await signedUrl(f.path, 7 * 86400)}">${esc(f.name)}</a>`,
      ),
    );
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
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
  } catch (e) {
    console.error("Telegram notify failed", e);
  }
}

/**
 * Client emails (order confirmed / work ready), sent through Resend.
 * Requires RESEND_API_KEY and EMAIL_FROM in your environment.
 */
export async function emailClient(order: OrderRow, kind: "confirmed" | "ready", origin: string) {
  const link = `${origin}/order/${order.tracking_id}`;
  const apiKey = process.env["RESEND_API_KEY"];
  const from = process.env["EMAIL_FROM"];

  if (!apiKey || !from) {
    console.warn(
      `[email:${kind}] skipped for ${order.client_email}: RESEND_API_KEY / EMAIL_FROM not set`,
    );
    return;
  }

  const service = esc(serviceByKey(order.service_key)?.title ?? order.service_key);
  const name = esc(order.client_name);
  const subject =
    kind === "ready"
      ? `Your order ${order.tracking_id} is completed`
      : `Order ${order.tracking_id} confirmed`;

  const body =
    kind === "ready"
      ? `<p>Hi ${name},</p><p>Great news — your <b>${service}</b> order <b>${order.tracking_id}</b> is completed and your files are ready to download.</p>`
      : `<p>Hi ${name},</p><p>We received your payment for <b>${service}</b>. Your tracking ID is <b>${order.tracking_id}</b>.</p>`;

  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;background:#ffffff;color:#222">
<h2 style="color:#7a1022;margin:0 0 16px">GENIUS Engineering &amp; Tech</h2>
${body}
<p><a href="${link}" style="display:inline-block;background:#7a1022;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold">${kind === "ready" ? "Download your work" : "Track your order"}</a></p>
<p style="font-size:12px;color:#777">Or open: ${link}</p></div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
        "Idempotency-Key": `${kind}-${order.id}`,
      },
      body: JSON.stringify({
        from,
        to: [order.client_email],
        subject,
        html,
      }),
    });
    if (!res.ok) {
      console.error(`[email:${kind}] failed [${res.status}]: ${await res.text()}`);
    }
  } catch (e) {
    console.error(`[email:${kind}] failed`, e);
  }
}
