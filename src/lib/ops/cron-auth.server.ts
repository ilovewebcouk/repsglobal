// Server-only helper: validates the Authorization header on cron endpoints
// against the token stored in public.cron_secrets (name='default'). The token
// is set once at migration time via encode(gen_random_bytes(32), 'hex') and
// referenced by pg_cron jobs. Cached in-process to avoid a DB round-trip per
// invocation. Never expose this token to browser code.

let cachedToken: string | null = null;
let cachedAt = 0;
const TTL_MS = 60_000;

export async function verifyCronRequest(request: Request): Promise<boolean> {
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return false;
  const provided = header.slice(7).trim();
  if (!provided) return false;

  const now = Date.now();
  if (!cachedToken || now - cachedAt > TTL_MS) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("cron_secrets")
      .select("token")
      .eq("name", "default")
      .maybeSingle();
    if (error || !data?.token) return false;
    cachedToken = data.token;
    cachedAt = now;
  }

  // Length-safe constant-time-ish comparison
  if (provided.length !== cachedToken.length) return false;
  let diff = 0;
  for (let i = 0; i < provided.length; i++) {
    diff |= provided.charCodeAt(i) ^ cachedToken.charCodeAt(i);
  }
  return diff === 0;
}
