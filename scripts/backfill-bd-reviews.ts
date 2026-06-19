/**
 * One-off backfill of legacy BrilliantDirectory reviews into the REPs `reviews` table.
 *
 * Usage:
 *   bun run scripts/backfill-bd-reviews.ts <path-to-csv>
 *
 * The CSV maps each row to a BD trainer via `user_id`. We resolve that to a
 * REPs `professionals.id` through the join chain:
 *
 *   member_reviews.user_id
 *     -> bd_member_seed.bd_member_id
 *     -> bd_migration.rep_user_id (where status='seeded')
 *     -> professionals.id
 *
 * Rows whose `user_id` doesn't resolve (BD trainer not yet seeded) are logged
 * and skipped. Re-running the script is safe — `bd_review_id` uniqueness
 * prevents duplicate inserts.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Usage: bun run scripts/backfill-bd-reviews.ts <csv-path>");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/* ----------------------- CSV parsing ----------------------- */

function parseCsv(text: string): Record<string, string>[] {
  // BD CSVs are double-quoted with embedded newlines and \" escapes.
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      cur.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      cur.push(field);
      rows.push(cur);
      cur = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || cur.length > 0) {
    cur.push(field);
    rows.push(cur);
  }
  const header = rows.shift()!;
  return rows
    .filter((r) => r.length === header.length)
    .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>(?:\s*\n)?/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseBdDate(s: string): string | null {
  // BD format: YYYYMMDDHHMMSS
  const m = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(s.trim());
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`;
}

/* ----------------------- Main ----------------------- */

async function main() {
  const text = readFileSync(csvPath, "utf8");
  const rows = parseCsv(text);
  console.log(`Loaded ${rows.length} CSV rows`);

  const approved = rows.filter((r) => r.review_status === "2");
  console.log(`Approved (status=2): ${approved.length}`);

  // Resolve unique BD user_ids -> professional_id
  const bdUserIds = Array.from(new Set(approved.map((r) => r.user_id).filter(Boolean)));

  const { data: seeds, error: seedsErr } = await supabase
    .from("bd_member_seed")
    .select("bd_member_id, email")
    .in("bd_member_id", bdUserIds.map((x) => Number(x)));
  if (seedsErr) throw seedsErr;

  const seedByBd = new Map<string, { email: string }>();
  for (const s of seeds ?? []) seedByBd.set(String(s.bd_member_id), { email: s.email });

  const { data: migrations, error: migErr } = await supabase
    .from("bd_migration")
    .select("bd_member_id, rep_user_id, status")
    .in("bd_member_id", bdUserIds);
  if (migErr) throw migErr;

  const proIdByBd = new Map<string, string>();
  for (const m of migrations ?? []) {
    if (m.status === "seeded" && m.rep_user_id) {
      proIdByBd.set(String(m.bd_member_id), m.rep_user_id);
    }
  }

  // Stats
  const unmapped = new Set<string>();
  for (const id of bdUserIds) if (!proIdByBd.has(id)) unmapped.add(id);

  // Build inserts
  const inserts: any[] = [];
  let skippedUnmapped = 0;
  for (const r of approved) {
    const proId = proIdByBd.get(r.user_id);
    if (!proId) {
      skippedUnmapped++;
      continue;
    }
    const ratingRaw = Number(r.rating_overall);
    const rating = Math.max(1, Math.min(5, Math.round(ratingRaw))) || 5;
    const body = stripHtml(r.review_description ?? "");
    if (body.length < 1) continue;
    const created = parseBdDate(r.review_added) ?? new Date().toISOString();
    inserts.push({
      professional_id: proId,
      client_user_id: null,
      client_name: (r.review_name || "Anonymous").trim().slice(0, 120),
      client_email: r.review_email ? r.review_email.toLowerCase().trim() : null,
      rating,
      title: r.review_title ? r.review_title.trim().slice(0, 120) : null,
      body: body.slice(0, 2000),
      source: "bd_import",
      status: "published",
      created_at: created,
      published_at: created,
      bd_review_id: Number(r.review_id),
    });
  }

  console.log(
    `Ready to upsert ${inserts.length} reviews · skipped ${skippedUnmapped} unmapped (${unmapped.size} BD user_ids not seeded)`,
  );

  if (inserts.length === 0) {
    console.log("Unmapped BD user_ids:", Array.from(unmapped).sort((a, b) => Number(a) - Number(b)));
    return;
  }

  // Idempotent: upsert on bd_review_id (unique index, NULLs excluded)
  let imported = 0;
  const chunk = 100;
  for (let i = 0; i < inserts.length; i += chunk) {
    const batch = inserts.slice(i, i + chunk);
    const { error, count } = await supabase
      .from("reviews")
      .upsert(batch, { onConflict: "bd_review_id", ignoreDuplicates: true, count: "exact" });
    if (error) {
      console.error(`Batch ${i / chunk + 1} failed:`, error);
      throw error;
    }
    imported += count ?? batch.length;
    console.log(`  batch ${i / chunk + 1}: ok (${batch.length} rows)`);
  }

  console.log("=== Done ===");
  console.log(`Imported (or already existed): ${imported}`);
  console.log(`Skipped unmapped rows: ${skippedUnmapped}`);
  console.log(`Unmapped BD user_ids: ${Array.from(unmapped).sort((a, b) => Number(a) - Number(b)).join(", ")}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
