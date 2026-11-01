import { useRef, useState } from "react";
import { Upload, File, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ACCEPTED_FILES, uploadOrderFile, type UploadedFile } from "@/lib/uploads";
import { toast } from "sonner";

export function FileUpload({ files, onChange, folder, onBusy }: { files: UploadedFile[]; onChange: (files: UploadedFile[]) => void; folder: string; onBusy?: (busy: boolean) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  async function add(list: FileList | null) {
    if (!list || busy) return;
    if (files.length + list.length > 20) { toast.error("Maximum 20 files per order"); return; }
    setBusy(true); onBusy?.(true);
    const added: UploadedFile[] = [];
    try { for (const file of Array.from(list)) added.push(await uploadOrderFile(file, folder)); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Upload failed"); }
    finally { onChange([...files, ...added]); setBusy(false); onBusy?.(false); if (input.current) input.current.value = ""; }
  }
  return <div className="space-y-3">
    <input ref={input} type="file" className="hidden" multiple accept={ACCEPTED_FILES} onChange={e => add(e.target.files)} aria-label="Upload project files" />
    <div onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); add(e.dataTransfer.files); }} className={`rounded-lg border-2 border-dashed p-7 text-center transition-colors ${dragging ? "border-primary bg-primary/5" : "border-border bg-muted/40"}`}>
      {busy ? <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /> : <Upload className="mx-auto h-8 w-8 text-primary" />}
      <Button type="button" variant="ghost" disabled={busy} onClick={() => input.current?.click()} className="mt-2">{busy ? "Uploading…" : "Choose files or drop them here"}</Button>
      <p className="mt-1 text-xs text-muted-foreground">PDF, Word, PNG, JPG, ZIP, MATLAB, Simulink · up to 50 MB each</p>
    </div>
    {files.map((f, index) => <div key={f.path} className="flex items-center gap-3 rounded-lg border p-3 text-sm"><File className="h-4 w-4 shrink-0 text-primary" /><span className="min-w-0 flex-1 break-all">{f.name}<span className="block text-xs text-muted-foreground">{(f.size / 1024).toFixed(1)} KB</span></span><Button type="button" size="icon" variant="ghost" aria-label={`Remove ${f.name}`} onClick={() => onChange(files.filter((_, i) => i !== index))}><X className="h-4 w-4" /></Button></div>)}
  </div>;
}