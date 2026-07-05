/**
 * Admin-facing server functions for the SEO index monitor.
 *
 * All functions require an authenticated admin caller. `runSeoIndexScanNow`
 * lets an admin trigger a scan on demand (uses the `manual` batch_kind).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: unknown; userId: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = ctx.supabase as any;
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}


export type SeoStatusRow = {
  url: string;
  priority: "A" | "B";
  verdict: string | null;
  coverage_state: string | null;
  indexing_state: string | null;
  google_canonical: string | null;
  user_canonical: string | null;
  robots_state: string | null;
  page_fetch_state: string | null;
  last_crawl_time: string | null;
  first_checked_at: string;
  last_checked_at: string;
  last_changed_at: string | null;
};

export type SeoEventRow = {
  id: string;
  url: string;
  detected_at: string;
  severity: "error" | "warn" | "info";
  summary: string;
  prev: unknown;
  next: unknown;
  acknowledged_at: string | null;
};

export type SeoScanRunRow = {
  id: string;
  started_at: string;
  finished_at: string | null;
  batch_kind: string;
  urls_checked: number;
  urls_changed: number;
  errors: number;
  status: string;
  notes: string | null;
};

/** List indexing status rows. `filter` narrows to failing URLs only. */
export const listSeoStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        filter: z.enum(["all", "failing", "priority_a"]).default("all"),
        limit: z.number().int().min(1).max(500).default(200),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let q = context.supabase
      .from("seo_index_status")
      .select(
        "url, priority, verdict, coverage_state, indexing_state, google_canonical, user_canonical, robots_state, page_fetch_state, last_crawl_time, first_checked_at, last_checked_at, last_changed_at",
      )
      .order("last_changed_at", { ascending: false, nullsFirst: false })
      .limit(data.limit);
    if (data.filter === "failing") q = q.neq("verdict", "PASS");
    if (data.filter === "priority_a") q = q.eq("priority", "A");
    const { data: rows, error } = await q;
    if (error) throw error;
    return { rows: (rows ?? []) as SeoStatusRow[] };
  });

/** List recent events. `open` filters to unacknowledged. */
export const listSeoEvents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        open: z.boolean().default(true),
        limit: z.number().int().min(1).max(200).default(50),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let q = context.supabase
      .from("seo_index_events")
      .select("id, url, detected_at, severity, summary, prev, next, acknowledged_at")
      .order("detected_at", { ascending: false })
      .limit(data.limit);
    if (data.open) q = q.is("acknowledged_at", null);
    const { data: rows, error } = await q;
    if (error) throw error;
    return { rows: (rows ?? []) as SeoEventRow[] };
  });

/** Recent scan runs (for the "last run" widget). */
export const listSeoScanRuns = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ limit: z.number().int().min(1).max(50).default(10) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: rows, error } = await context.supabase
      .from("seo_scan_runs")
      .select("id, started_at, finished_at, batch_kind, urls_checked, urls_changed, errors, status, notes")
      .order("started_at", { ascending: false })
      .limit(data.limit);
    if (error) throw error;
    return { rows: (rows ?? []) as SeoScanRunRow[] };
  });

/** Acknowledge one or more events (hide them from the "open" list). */
export const acknowledgeSeoEvents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ ids: z.array(z.string().uuid()).min(1).max(200) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("seo_index_events")
      .update({ acknowledged_at: new Date().toISOString(), acknowledged_by: context.userId })
      .in("id", data.ids);
    if (error) throw error;
    return { acknowledged: data.ids.length };
  });

/** Trigger a scan on demand. Priority A only by default — keeps it snappy. */
export const runSeoIndexScanNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ full: z.boolean().default(false) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { runSeoIndexScan } = await import("@/lib/seo/index-monitor.server");
    return runSeoIndexScan({ batchKind: data.full ? "manual" : "priority_a" });
  });
