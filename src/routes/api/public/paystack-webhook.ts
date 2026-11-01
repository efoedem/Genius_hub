import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/paystack-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["PAYSTACK_SECRET_KEY"];
        if (!secret) return new Response("Not configured", { status: 503 });
        const raw = await request.text();
        const { hmacSha512Hex, settlePayment } = await import("@/lib/paystack.server");
        const expected = await hmacSha512Hex(secret, raw);
        const got = request.headers.get("x-paystack-signature") ?? "";
        if (got.length !== expected.length) return new Response("Bad signature", { status: 401 });
        let diff = 0;
        for (let i = 0; i < got.length; i++) diff |= got.charCodeAt(i) ^ expected.charCodeAt(i);
        if (diff !== 0) return new Response("Bad signature", { status: 401 });

        const evt = JSON.parse(raw) as { event: string; data?: { reference: string; amount: number; status: string; metadata?: { order_id?: string } } };
        if (evt.event === "charge.success" && evt.data?.metadata?.order_id && evt.data.status === "success") {
          await settlePayment(evt.data.metadata.order_id, evt.data.reference, evt.data.amount, new URL(request.url).origin);
        }
        return new Response("ok");
      },
    },
  },
});
