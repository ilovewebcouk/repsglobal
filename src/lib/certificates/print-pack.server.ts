/**
 * Print pack builder — merges every issued certificate PDF in a batch into
 * a single print-ready PDF (one learner per page), plus a ZIP of the
 * individual PDFs for reprints. Server-only.
 *
 * Cached in the `certificates` storage bucket at
 *   batches/{batchId}/print-pack.pdf
 *   batches/{batchId}/print-pack.zip
 * so subsequent downloads are instant. Rebuilds when the cached copy is
 * older than the most recently issued registration in the batch.
 */
import { PDFDocument } from "pdf-lib";
import { zipSync } from "fflate";

type Reg = { id: string; certificate_number: string | null; pdf_path: string | null; issued_at: string | null };

async function loadBatchPdfs(batchId: string): Promise<{ regs: Reg[]; latestIssuedAt: number }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("certificate_registrations")
    .select("id, certificate_number, pdf_path, issued_at")
    .eq("batch_id", batchId)
    .in("status", ["issued", "dispatched"]);
  if (error) throw new Error(error.message);
  const regs = ((data as unknown as Reg[]) ?? []).filter((r) => r.pdf_path);
  const latestIssuedAt = regs.reduce((max, r) => {
    const t = r.issued_at ? new Date(r.issued_at).getTime() : 0;
    return t > max ? t : max;
  }, 0);
  return { regs, latestIssuedAt };
}

async function cachedAgeMs(path: string): Promise<number | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // list parent folder to get metadata
  const parts = path.split("/");
  const name = parts.pop()!;
  const prefix = parts.join("/");
  const { data } = await supabaseAdmin.storage.from("certificates").list(prefix, { limit: 100 });
  const hit = (data ?? []).find((f) => f.name === name);
  if (!hit) return null;
  const updated = (hit as any).updated_at ?? (hit as any).created_at ?? null;
  return updated ? new Date(updated).getTime() : null;
}

async function fetchPdfBytes(path: string): Promise<Uint8Array | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.storage.from("certificates").download(path);
  if (error || !data) return null;
  return new Uint8Array(await data.arrayBuffer());
}

/**
 * Build (or return cached) merged print-pack PDF for a batch.
 * Returns the storage path in the `certificates` bucket.
 */
export async function buildMergedPrintPack(batchId: string): Promise<string> {
  const outPath = `batches/${batchId}/print-pack.pdf`;
  const { regs, latestIssuedAt } = await loadBatchPdfs(batchId);
  if (regs.length === 0) throw new Error("No issued certificates in this batch yet.");

  const cachedAt = await cachedAgeMs(outPath);
  if (cachedAt !== null && cachedAt >= latestIssuedAt) return outPath;

  const merged = await PDFDocument.create();
  merged.setTitle(`REPS print pack ${batchId}`);
  // Deterministic order: by certificate number
  regs.sort((a, b) => (a.certificate_number ?? "").localeCompare(b.certificate_number ?? ""));

  for (const r of regs) {
    const bytes = await fetchPdfBytes(r.pdf_path!);
    if (!bytes) continue;
    const src = await PDFDocument.load(bytes);
    const copied = await merged.copyPages(src, src.getPageIndices());
    for (const p of copied) merged.addPage(p);
  }

  const out = await merged.save();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error: upErr } = await supabaseAdmin.storage
    .from("certificates")
    .upload(outPath, out, { contentType: "application/pdf", upsert: true });
  if (upErr) throw new Error(`Could not save print pack: ${upErr.message}`);
  return outPath;
}

/**
 * Build (or return cached) ZIP of individual certificate PDFs for a batch.
 */
export async function buildIndividualZip(batchId: string): Promise<string> {
  const outPath = `batches/${batchId}/print-pack.zip`;
  const { regs, latestIssuedAt } = await loadBatchPdfs(batchId);
  if (regs.length === 0) throw new Error("No issued certificates in this batch yet.");

  const cachedAt = await cachedAgeMs(outPath);
  if (cachedAt !== null && cachedAt >= latestIssuedAt) return outPath;

  const files: Record<string, Uint8Array> = {};
  for (const r of regs) {
    const bytes = await fetchPdfBytes(r.pdf_path!);
    if (!bytes) continue;
    const name = `${r.certificate_number ?? r.id}.pdf`;
    files[name] = bytes;
  }
  const zipped = zipSync(files, { level: 6 });

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error: upErr } = await supabaseAdmin.storage
    .from("certificates")
    .upload(outPath, zipped, { contentType: "application/zip", upsert: true });
  if (upErr) throw new Error(`Could not save ZIP: ${upErr.message}`);
  return outPath;
}
