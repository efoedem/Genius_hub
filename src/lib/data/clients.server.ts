import { getDb } from "./db.server";

export async function findClientByEmail(email: string) {
  const db = await getDb();
  const { data } = await db.from("clients").select("*").eq("email", email.toLowerCase()).maybeSingle();
  return data;
}

/** Create or update a client record; returns the client and whether they ordered before. */
export async function upsertClient(input: { email: string; name: string; phone: string; userId: string | null }) {
  const db = await getDb();
  const email = input.email.toLowerCase();
  const existing = await findClientByEmail(email);
  if (existing) {
    const { data, error } = await db
      .from("clients")
      .update({ name: input.name, phone: input.phone, user_id: input.userId ?? existing.user_id })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { client: data, isReturning: existing.order_count > 0 };
  }
  const { data, error } = await db
    .from("clients")
    .insert({ email, name: input.name, phone: input.phone, user_id: input.userId })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return { client: data, isReturning: false };
}

export async function incrementOrderCount(clientId: string) {
  const db = await getDb();
  const { data } = await db.from("clients").select("order_count").eq("id", clientId).single();
  await db.from("clients").update({ order_count: (data?.order_count ?? 0) + 1 }).eq("id", clientId);
}
