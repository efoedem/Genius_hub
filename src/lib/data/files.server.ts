import { getDb, FILES_BUCKET } from "./db.server";

export async function attachFiles(orderId: string, kind: "input" | "output", files: { path: string; name: string; size: number }[]) {
  if (!files.length) return;
  const db = await getDb();
  const { error } = await db.from("order_files").insert(files.map((f) => ({ ...f, order_id: orderId, kind })));
  if (error) throw new Error(error.message);
}

export async function listFiles(orderId: string, kind?: "input" | "output") {
  const db = await getDb();
  let q = db.from("order_files").select("*").eq("order_id", orderId).order("created_at");
  if (kind) q = q.eq("kind", kind);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function signedUrl(path: string, seconds = 60 * 60) {
  const db = await getDb();
  const { data, error } = await db.storage.from(FILES_BUCKET).createSignedUrl(path, seconds);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export async function deleteFile(fileId: string) {
  const db = await getDb();
  const { data } = await db.from("order_files").select("path").eq("id", fileId).single();
  if (data) await db.storage.from(FILES_BUCKET).remove([data.path]);
  await db.from("order_files").delete().eq("id", fileId);
}
