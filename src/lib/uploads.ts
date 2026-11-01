import { supabase } from "@/integrations/supabase/client";
export const ACCEPTED_FILES = ".pdf,.docx,.png,.jpg,.jpeg,.zip,.m,.slx";
export type UploadedFile = { path: string; name: string; size: number };
export function validateFile(file: { name: string; size: number }) {
  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  if (!ACCEPTED_FILES.split(",").includes(extension)) return "Unsupported file format";
  if (file.size > 50 * 1024 * 1024) return "Each file must be 50 MB or smaller";
  if (!file.size) return "Empty files cannot be uploaded";
  return null;
}
export async function uploadOrderFile(file: File, folder: string): Promise<UploadedFile> {
  const error = validateFile(file);
  if (error) throw new Error(`${file.name}: ${error}`);
  const safeName = file.name.replace(/[^\w .()-]/g, "_");
  const path = `${folder}/${crypto.randomUUID()}-${safeName}`;
  const { error: uploadError } = await supabase.storage.from("order-files").upload(path, file, { upsert: false });
  if (uploadError) throw new Error("File upload failed. Please try again.");
  return { path, name: file.name, size: file.size };
}