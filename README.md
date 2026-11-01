# Genius Engineering & Tech

All-in-one platform: service catalog, instant rule-based quotes, file uploads, Paystack checkout (Mobile Money + cards), order tracking, client accounts and an owner admin dashboard.

## Run locally

```bash
bun install
bun run dev
```

Environment (`.env`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`, plus server-side `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

Optional server secrets:
- `PAYSTACK_SECRET_KEY` — enables checkout. Without it orders are still recorded and show "payment configuration pending".
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` — owner alert on every paid order.

Paystack webhook URL: `https://<your-domain>/api/public/paystack-webhook`.

## Admin

Sign in at `/auth`. Accounts with the `admin` role in `public.user_roles` see an **Admin** button and can open `/admin` to manage orders, upload completed work and edit pricing.

## Data access layer

All server data access goes through `src/lib/data/`:
- `db.server.ts` — the single database client entry point
- `orders.server.ts`, `clients.server.ts`, `pricing.server.ts`, `files.server.ts` — one module per entity

## Pointing at an external database

1. Create a Supabase (or Postgres + compatible API) project.
2. Run the SQL in `drizzle/migrations/` in order to create tables, policies and the `order-files` storage bucket policies; create a private bucket named `order-files`.
3. Update the env vars above to the new project's URL and keys.
4. For a non-Supabase Postgres, replace the client returned by `getDb()` in `db.server.ts` and the storage calls in `files.server.ts`; the rest of the app is unchanged.

Pricing logic lives in `src/lib/pricing.ts` (tested in `src/lib/pricing.test.ts`). The server always recomputes the final price.
