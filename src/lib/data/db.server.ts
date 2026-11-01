// Single entry point to the database for all server-side data access.
// To move to another Postgres/Supabase provider, change ONLY this file
// (and files.server.ts for storage). See README.md.
export async function getDb() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const FILES_BUCKET = "order-files";
