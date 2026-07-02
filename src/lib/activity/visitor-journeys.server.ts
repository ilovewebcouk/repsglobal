// Server-only writer for visitor_journeys.
// Behavioural flow store — one row per (session_id) or (posthog_distinct_id).
// Never stores enquiry message text or form field values.

export interface JourneyInput {
  sessionId?: string | null;
  posthogDistinctId?: string | null;
  observationId?: string | null;
  eventName?: string | null;
  path?: string | null;
  referrer?: string | null;
  now?: Date;
}

const PATH_HISTORY_CAP = 100;
const EVENT_HISTORY_CAP = 100;

function deriveSource(referrer: string | null): string | null {
  if (!referrer) return "direct";
  try {
    const u = new URL(referrer);
    if (u.hostname.includes("google.")) return "google";
    if (u.hostname.includes("bing.")) return "bing";
    if (u.hostname.includes("duckduckgo.")) return "duckduckgo";
    if (u.hostname.includes("facebook.") || u.hostname.includes("fb.")) return "facebook";
    if (u.hostname.includes("instagram.")) return "instagram";
    if (u.hostname.includes("linkedin.")) return "linkedin";
    if (u.hostname.includes("twitter.") || u.hostname === "t.co" || u.hostname.includes("x.com")) return "twitter";
    if (u.hostname.includes("reddit.")) return "reddit";
    if (u.hostname.includes("youtube.") || u.hostname === "youtu.be") return "youtube";
    return `referral:${u.hostname}`;
  } catch {
    return "direct";
  }
}

export async function recordVisitorJourney(
  input: JourneyInput,
): Promise<{ id: string | null; result: "ok" | "skipped" | "failed"; error?: string }> {
  const sessionId = input.sessionId ?? null;
  const distinctId = input.posthogDistinctId ?? null;
  if (!sessionId && !distinctId) return { id: null, result: "skipped" };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const now = (input.now ?? new Date()).toISOString();
  const path = input.path ? input.path.slice(0, 500) : null;
  const referrer = input.referrer ? input.referrer.slice(0, 1000) : null;
  const eventName = input.eventName ? input.eventName.slice(0, 100) : null;

  // Look up existing by session_id first (preferred), else by distinct_id.
  const existingSel = supabaseAdmin
    .from("visitor_journeys")
    .select("id, latest_path, path_history, event_history, page_count, event_count, first_seen_at, entry_path, entry_referrer, source")
    .maybeSingle();

  const existingRes = sessionId
    ? await supabaseAdmin
        .from("visitor_journeys")
        .select("id, latest_path, path_history, event_history, page_count, event_count, first_seen_at, entry_path, entry_referrer, source")
        .eq("session_id", sessionId)
        .maybeSingle()
    : await supabaseAdmin
        .from("visitor_journeys")
        .select("id, latest_path, path_history, event_history, page_count, event_count, first_seen_at, entry_path, entry_referrer, source")
        .is("session_id", null)
        .eq("posthog_distinct_id", distinctId!)
        .maybeSingle();

  if (existingRes.error && existingRes.error.code !== "PGRST116") {
    return { id: null, result: "failed", error: existingRes.error.message };
  }

  void existingSel; // eslint appeasement

  const existing = existingRes.data as
    | {
        id: string;
        latest_path: string | null;
        path_history: Array<{ p: string; at: string }> | null;
        event_history: Array<{ e: string; at: string }> | null;
        page_count: number;
        event_count: number;
        first_seen_at: string;
        entry_path: string | null;
        entry_referrer: string | null;
        source: string | null;
      }
    | null;

  if (existing) {
    // Append path only when it differs from latest (dedupe consecutive same-path views).
    const pathHistory = Array.isArray(existing.path_history) ? [...existing.path_history] : [];
    let nextPageCount = existing.page_count;
    if (path && path !== existing.latest_path) {
      pathHistory.push({ p: path, at: now });
      nextPageCount += 1;
      if (pathHistory.length > PATH_HISTORY_CAP) {
        pathHistory.splice(0, pathHistory.length - PATH_HISTORY_CAP);
      }
    }

    const eventHistory = Array.isArray(existing.event_history) ? [...existing.event_history] : [];
    if (eventName) {
      eventHistory.push({ e: eventName, at: now });
      if (eventHistory.length > EVENT_HISTORY_CAP) {
        eventHistory.splice(0, eventHistory.length - EVENT_HISTORY_CAP);
      }
    }

    const updateRes = await supabaseAdmin
      .from("visitor_journeys")
      .update({
        latest_path: path ?? existing.latest_path,
        latest_event: eventName ?? undefined,
        latest_observation_id: input.observationId ?? undefined,
        path_history: pathHistory,
        event_history: eventHistory,
        page_count: nextPageCount,
        event_count: existing.event_count + (eventName ? 1 : 0),
        last_seen_at: now,
      })
      .eq("id", existing.id)
      .select("id")
      .maybeSingle();

    if (updateRes.error) {
      return { id: existing.id, result: "failed", error: updateRes.error.message };
    }
    return { id: existing.id, result: "ok" };
  }

  // Insert new journey.
  const insertRes = await supabaseAdmin
    .from("visitor_journeys")
    .insert({
      session_id: sessionId,
      posthog_distinct_id: distinctId,
      latest_observation_id: input.observationId ?? null,
      entry_path: path,
      entry_referrer: referrer,
      latest_path: path,
      latest_event: eventName,
      source: deriveSource(referrer),
      page_count: path ? 1 : 0,
      event_count: eventName ? 1 : 0,
      path_history: path ? [{ p: path, at: now }] : [],
      event_history: eventName ? [{ e: eventName, at: now }] : [],
      first_seen_at: now,
      last_seen_at: now,
    })
    .select("id")
    .maybeSingle();

  if (insertRes.error) {
    // Race: another request just inserted. Retry the update path once.
    if (insertRes.error.code === "23505") {
      return recordVisitorJourney(input);
    }
    return { id: null, result: "failed", error: insertRes.error.message };
  }
  return { id: (insertRes.data?.id as string | undefined) ?? null, result: "ok" };
}
