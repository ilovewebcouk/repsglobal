// Server-only helper: sweeps orphaned course-evidence uploads.
//
// Two classes of orphans exist:
//   (A) `reps_course_evidence` rows with `course_id IS NULL` older than the
//       TTL — evidence uploaded to the "Request REPS endorsement" dialog that
//       was closed before the provider submitted the course.
//   (B) Storage objects under the `course-accreditations` bucket that have
//       no matching `reps_course_evidence.file_path` — created when a
//       `removeRepsCourseEvidence` call deleted the DB row but the storage
//       remove step failed (or the request was interrupted after DB commit).
//
// Runs from pg_cron once a day (see `/api/public/cron/reps-evidence-cleanup`).
// Uses the service-role client because it needs to scan across every
// provider's storage prefix.

import { supabaseAdmin } from "@/integrations/supabase/client.server";

const TTL_HOURS = 48;
const BUCKET = "course-accreditations";

export type OrphanCleanupResult = {
  stagedRowsDeleted: number;
  stagedStorageObjectsDeleted: number;
  danglingStorageObjectsDeleted: number;
  scannedProviderFolders: number;
  errors: string[];
};

export async function cleanupOrphanRepsCourseEvidence(): Promise<OrphanCleanupResult> {
  const errors: string[] = [];
  const cutoff = new Date(Date.now() - TTL_HOURS * 60 * 60 * 1000).toISOString();

  // (A) Staged rows older than TTL — delete DB rows first, then their objects.
  const { data: stagedRows, error: stagedErr } = await supabaseAdmin
    .from("reps_course_evidence")
    .select("id, file_path")
    .is("course_id", null)
    .lt("created_at", cutoff);
  if (stagedErr) errors.push(`select staged: ${stagedErr.message}`);

  const stagedRowsList = (stagedRows ?? []) as Array<{ id: string; file_path: string }>;
  const stagedPaths = stagedRowsList.map((r) => r.file_path).filter(Boolean);
  const stagedIds = stagedRowsList.map((r) => r.id);

  if (stagedIds.length > 0) {
    const { error: delErr } = await supabaseAdmin
      .from("reps_course_evidence")
      .delete()
      .in("id", stagedIds);
    if (delErr) errors.push(`delete staged rows: ${delErr.message}`);
  }
  let stagedStorageObjectsDeleted = 0;
  if (stagedPaths.length > 0) {
    // Storage remove takes at most ~1000 keys per call; chunk to be safe.
    for (let i = 0; i < stagedPaths.length; i += 500) {
      const chunk = stagedPaths.slice(i, i + 500);
      const { data: removed, error: rmErr } = await supabaseAdmin.storage
        .from(BUCKET)
        .remove(chunk);
      if (rmErr) errors.push(`remove staged storage: ${rmErr.message}`);
      stagedStorageObjectsDeleted += removed?.length ?? 0;
    }
  }

  // (B) Storage reconciliation — for every top-level provider folder, list
  // objects and delete any whose `file_path` has no matching DB row.
  let scannedProviderFolders = 0;
  let danglingStorageObjectsDeleted = 0;

  const { data: providerFolders, error: listErr } = await supabaseAdmin.storage
    .from(BUCKET)
    .list("", { limit: 1000, offset: 0 });
  if (listErr) errors.push(`list root: ${listErr.message}`);

  for (const folder of providerFolders ?? []) {
    // Folders come back as entries with `id: null` (Supabase Storage convention).
    if (!folder.name || folder.id) continue;
    scannedProviderFolders += 1;

    const { data: objects, error: objErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .list(folder.name, { limit: 1000, offset: 0 });
    if (objErr) {
      errors.push(`list ${folder.name}: ${objErr.message}`);
      continue;
    }
    if (!objects || objects.length === 0) continue;

    const filePaths = objects
      .filter((o) => o.id !== null) // skip nested folders
      .map((o) => `${folder.name}/${o.name}`);
    if (filePaths.length === 0) continue;

    const { data: knownRows, error: knownErr } = await supabaseAdmin
      .from("reps_course_evidence")
      .select("file_path")
      .in("file_path", filePaths);
    if (knownErr) {
      errors.push(`select known ${folder.name}: ${knownErr.message}`);
      continue;
    }
    const known = new Set((knownRows ?? []).map((r) => (r as { file_path: string }).file_path));
    const dangling = filePaths.filter((p) => !known.has(p));
    if (dangling.length === 0) continue;

    const { data: removed, error: rmErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .remove(dangling);
    if (rmErr) {
      errors.push(`remove dangling ${folder.name}: ${rmErr.message}`);
      continue;
    }
    danglingStorageObjectsDeleted += removed?.length ?? 0;
  }

  return {
    stagedRowsDeleted: stagedIds.length,
    stagedStorageObjectsDeleted,
    danglingStorageObjectsDeleted,
    scannedProviderFolders,
    errors,
  };
}
