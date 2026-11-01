import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeQuote } from "./pricing";

function originOf() {
  const req = getRequest();
  return req.headers.get("origin") ?? new URL(req.url).origin;
}

async function optionalUserId(): Promise<string | null> {
  const auth = getRequest().headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const { getDb } = await import("./data/db.server");
  const db = await getDb();
  const { data } = await db.auth.getUser(auth.slice(7));
  return data.user?.id ?? null;
}

// ---------- Public ----------

export const getPricing = createServerFn({ method: "GET" }).handler(async () => {
  const p = await import("./data/pricing.server");
  const [rates, settings] = await Promise.all([p.getRates(), p.getSettings()]);
  return { rates, settings };
});

export const checkReturning = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ email: z.string().email().max(255) }).parse(d))
  .handler(async ({ data }) => {
    const { findClientByEmail } = await import("./data/clients.server");
    const c = await findClientByEmail(data.email);
    return { returning: !!c && c.order_count > 0 };
  });

const orderSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(9).max(20),
  service_key: z.enum(["engineering", "it", "research", "assignment"]),
  delivery_format: z.enum(["soft", "hard"]),
  quantity: z.number().int().min(1).max(5000),
  complexity: z.enum(["standard", "advanced", "expert"]),
  deadline: z.string().datetime(),
  notes: z.string().max(4000).optional(),
  files: z
    .array(z.object({ path: z.string().regex(/^incoming\/[\w.-]+\/[\w .()-]+$/).max(400), name: z.string().max(255), size: z.number().int().min(0) }))
    .max(20),
});

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => orderSchema.parse(d))
  .handler(async ({ data }) => {
    const [pricing, clients, orders, files, paystack] = await Promise.all([
      import("./data/pricing.server"),
      import("./data/clients.server"),
      import("./data/orders.server"),
      import("./data/files.server"),
      import("./paystack.server"),
    ]);
    const deadline = new Date(data.deadline);
    if (deadline.getTime() < Date.now() + 3 * 36e5) throw new Error("Deadline must be at least 3 hours from now");
    const userId = await optionalUserId();
    const [rates, settings] = await Promise.all([pricing.getRates(), pricing.getSettings()]);
    const rate = rates.find((r) => r.service_key === data.service_key);
    if (!rate) throw new Error("Unknown service");
    const { client, isReturning } = await clients.upsertClient({ email: data.email, name: data.name, phone: data.phone, userId });
    // Authoritative price — always computed on the server.
    const quote = computeQuote({ rate, settings, quantity: data.quantity, complexity: data.complexity, delivery: data.delivery_format, deadline, isReturning });
    const order = await orders.createOrder({
      user_id: userId,
      client_id: client.id,
      client_name: data.name,
      client_email: data.email.toLowerCase(),
      client_phone: data.phone,
      service_key: data.service_key,
      delivery_format: data.delivery_format,
      quantity: data.quantity,
      complexity: data.complexity,
      deadline: deadline.toISOString(),
      notes: data.notes ?? null,
      amount: quote.total,
      breakdown: quote.lines as unknown as import("@/integrations/supabase/types").Json,
      is_repeat: isReturning,
    });
    await files.attachFiles(order.id, "input", data.files);
    await clients.incrementOrderCount(client.id);

    let paymentUrl: string | null = null;
    let paymentError: string | null = null;
    if (paystack.paystackConfigured()) {
      try {
        const reference = `${order.tracking_id}-${Date.now()}`;
        paymentUrl = await paystack.initializeTransaction({
          email: order.client_email,
          amount: Number(order.amount),
          reference,
          orderId: order.id,
          callbackUrl: `${originOf()}/order/${order.tracking_id}`,
        });
        await orders.setPaymentRef(order.id, reference);
      } catch (e) {
        paymentError = e instanceof Error ? e.message : "Payment could not start";
      }
    }
    return { trackingId: order.tracking_id, amount: Number(order.amount), paymentUrl, paymentConfigured: paystack.paystackConfigured(), paymentError };
  });

export const retryPayment = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ trackingId: z.string().max(20) }).parse(d))
  .handler(async ({ data }) => {
    const orders = await import("./data/orders.server");
    const paystack = await import("./paystack.server");
    const order = await orders.getOrderByTracking(data.trackingId);
    if (!order || order.payment_status === "paid") return { paymentUrl: null };
    if (!paystack.paystackConfigured()) return { paymentUrl: null };
    const reference = `${order.tracking_id}-${Date.now()}`;
    const url = await paystack.initializeTransaction({ email: order.client_email, amount: Number(order.amount), reference, orderId: order.id, callbackUrl: `${originOf()}/order/${order.tracking_id}` });
    await orders.setPaymentRef(order.id, reference);
    return { paymentUrl: url };
  });

export const verifyPayment = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ reference: z.string().max(80) }).parse(d))
  .handler(async ({ data }) => {
    const paystack = await import("./paystack.server");
    const tx = await paystack.verifyTransaction(data.reference);
    if (!tx || tx.status !== "success" || !tx.metadata?.order_id) return { paid: false };
    const ok = await paystack.settlePayment(tx.metadata.order_id, data.reference, tx.amount, originOf());
    return { paid: ok };
  });

export const trackOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ trackingId: z.string().trim().min(4).max(20) }).parse(d))
  .handler(async ({ data }) => {
    const orders = await import("./data/orders.server");
    const files = await import("./data/files.server");
    const o = await orders.getOrderByTracking(data.trackingId);
    if (!o) return null;
    const [events, outputs, inputs] = await Promise.all([orders.listEvents(o.id), files.listFiles(o.id, "output"), files.listFiles(o.id, "input")]);
    const downloads =
      o.status === "completed" && o.payment_status === "paid"
        ? await Promise.all(outputs.map(async (f) => ({ name: f.name, size: f.size, url: await files.signedUrl(f.path) })))
        : [];
    return {
      trackingId: o.tracking_id,
      firstName: o.client_name.split(" ")[0],
      service_key: o.service_key,
      delivery_format: o.delivery_format,
      quantity: o.quantity,
      complexity: o.complexity,
      deadline: o.deadline,
      amount: Number(o.amount),
      breakdown: o.breakdown as { label: string; amount: number }[],
      status: o.status,
      payment_status: o.payment_status,
      created_at: o.created_at,
      events: events.map((e) => ({ label: e.label, at: e.created_at })),
      uploadedCount: inputs.length,
      outputsReady: outputs.length,
      downloads,
    };
  });

// ---------- Signed-in clients ----------

export const myOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const orders = await import("./data/orders.server");
    const email = (context.claims as { email?: string }).email;
    const rows = await orders.listOrdersForUser(context.userId, email);
    return rows.map((o) => ({ tracking_id: o.tracking_id, service_key: o.service_key, status: o.status, payment_status: o.payment_status, amount: Number(o.amount), created_at: o.created_at, deadline: o.deadline }));
  });

export const amIAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    return { admin: !!data };
  });

// ---------- Admin ----------

async function assertAdmin(context: { supabase: { rpc: (...a: never[]) => unknown }; userId: string }) {
  const sb = context.supabase as unknown as { rpc: (fn: string, args: object) => Promise<{ data: boolean | null }> };
  const { data } = await sb.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

export const adminListOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const orders = await import("./data/orders.server");
    const paystack = await import("./paystack.server");
    const rows = await orders.listOrders();
    return {
      paymentConfigured: paystack.paystackConfigured(),
      telegramConfigured: !!process.env["TELEGRAM_BOT_TOKEN"] && !!process.env["TELEGRAM_CHAT_ID"],
      orders: rows.map((o) => ({
        ...o,
        amount: Number(o.amount),
        amount_paid: Number(o.amount_paid),
        breakdown: o.breakdown as { label: string; amount: number }[],
        order_files: o.order_files.map((f) => ({ id: f.id, kind: f.kind, name: f.name, size: f.size, path: f.path })),
      })),
    };
  });

export const adminFileUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ path: z.string().max(400) }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const files = await import("./data/files.server");
    return { url: await files.signedUrl(data.path, 600) };
  });

export const adminSetStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ orderId: z.string().uuid(), status: z.enum(["received", "in_progress", "completed"]) }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const orders = await import("./data/orders.server");
    await orders.setStatus(data.orderId, data.status);
    if (data.status === "completed") {
      const { emailClient } = await import("./notify.server");
      const o = await orders.getOrder(data.orderId);
      if (o) await emailClient({ ...o, amount_paid: Number(o.amount_paid) }, "ready", originOf());
    }
    return { ok: true };
  });

export const adminAddOutputs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ orderId: z.string().uuid(), files: z.array(z.object({ path: z.string().regex(/^outputs\//).max(400), name: z.string().max(255), size: z.number().int() })).max(20) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const files = await import("./data/files.server");
    await files.attachFiles(data.orderId, "output", data.files);
    return { ok: true };
  });

export const adminDeleteFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ fileId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const files = await import("./data/files.server");
    await files.deleteFile(data.fileId);
    return { ok: true };
  });

const num = z.number().min(0).max(100000);
export const adminUpdatePricing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        rates: z.array(z.object({ service_key: z.string(), base_rate: num, floor_price: num })),
        settings: z.object({
          complexity_standard: num,
          complexity_advanced: num,
          complexity_expert: num,
          urgency_24h_pct: num,
          urgency_72h_pct: num,
          urgency_7d_pct: num,
          print_per_page: num,
          binding_base: num,
          binding_per_50_pages: num,
          returning_discount_pct: z.number().min(0).max(100),
        }),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const p = await import("./data/pricing.server");
    for (const r of data.rates) await p.updateRate(r.service_key, { base_rate: r.base_rate, floor_price: r.floor_price });
    await p.updateSettings(data.settings);
    return { ok: true };
  });
