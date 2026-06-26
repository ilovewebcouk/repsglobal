import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Seed-shells recovery — admin workflow to bring "thin" BD-migrated profiles
 * (bd_seed_thin = true, no bio / headline / avatar) back into the public
 * directory. AI drafts a safe headline + bio from the limited facts we have
 * (name, city, country) and the admin approves it. On approve we write
 * bio + headline → the BEFORE-UPDATE trigger tg_clear_bd_seed_thin flips
 * bd_seed_thin to false → the profile appears in the public directory
 * (with a monogram avatar fallback).
 *
 * Three actions, all admin-only:
 *   - listSeedShells     → paginated queue of thin profiles + seed context
 *   - generateShellDraft → AI returns { headline, bio } (no DB write)
 *   - applyShellDraft    → admin-approved write to professionals
 *   - dismissShellShell  → hide permanently (is_published = false)
 */

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const MODEL = "google/gemini-3-flash-preview";

const HEADLINE_MAX = 160;
const BIO_MAX = 1200;

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Response("Forbidden", { status: 403 });
}

/* -------------------------------------------------------------------------- */
/* List                                                                        */
/* -------------------------------------------------------------------------- */

export type SeedShell = {
  user_id: string;
  bd_member_id: number | null;
  full_name: string;
  city: string | null;
  country: string | null;
  slug: string | null;
  is_published: boolean;
  has_avatar: boolean;
  photo_status: string | null;
};

export type SeedShellStats = {
  total_thin: number;
  total_thin_published: number;
  total_thin_hidden: number;
};

const ListInput = z
  .object({
    limit: z.number().int().min(1).max(200).optional().default(50),
    offset: z.number().int().min(0).optional().default(0),
  })
  .optional()
  .default({});

export const listSeedShells = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ListInput.parse(d ?? {}))
  .handler(
    async ({
      data,
      context,
    }): Promise<{ rows: SeedShell[]; stats: SeedShellStats }> => {
      await assertAdmin(context);
      const sb = context.supabase;

      // Stats
      const [{ count: totalThin }, { count: totalPub }, { count: totalHidden }] =
        await Promise.all([
          sb
            .from("professionals")
            .select("id", { count: "exact", head: true })
            .eq("bd_seed_thin", true),
          sb
            .from("professionals")
            .select("id", { count: "exact", head: true })
            .eq("bd_seed_thin", true)
            .eq("is_published", true),
          sb
            .from("professionals")
            .select("id", { count: "exact", head: true })
            .eq("bd_seed_thin", true)
            .eq("is_published", false),
        ]);

      const { data: pros, error } = await sb
        .from("professionals")
        .select("id, slug, city, country, is_published")
        .eq("bd_seed_thin", true)
        .order("city", { ascending: true, nullsFirst: false })
        .range(data.offset, data.offset + data.limit - 1);
      if (error) throw new Error(error.message);

      const ids = (pros ?? []).map((p: any) => p.id as string);
      if (ids.length === 0) {
        return {
          rows: [],
          stats: {
            total_thin: totalThin ?? 0,
            total_thin_published: totalPub ?? 0,
            total_thin_hidden: totalHidden ?? 0,
          },
        };
      }

      const [{ data: profs }, { data: migs }] = await Promise.all([
        sb.from("profiles").select("id, full_name, avatar_url").in("id", ids),
        sb
          .from("bd_migration")
          .select("rep_user_id, bd_member_id")
          .in("rep_user_id", ids),
      ]);

      const profById = new Map<string, any>(
        (profs ?? []).map((p: any) => [p.id, p]),
      );
      const bdByUser = new Map<string, number>(
        (migs ?? []).map((m: any) => [m.rep_user_id, Number(m.bd_member_id)]),
      );

      const bdIds = Array.from(bdByUser.values()).filter((n) =>
        Number.isFinite(n),
      );
      const { data: seeds } =
        bdIds.length > 0
          ? await sb
              .from("bd_member_seed")
              .select("bd_member_id, profile_photo_status")
              .in("bd_member_id", bdIds)
          : ({ data: [] } as any);
      const seedById = new Map<number, any>(
        (seeds ?? []).map((s: any) => [Number(s.bd_member_id), s]),
      );

      const rows: SeedShell[] = (pros ?? []).map((p: any) => {
        const prof = profById.get(p.id);
        const bdId = bdByUser.get(p.id) ?? null;
        const seed = bdId != null ? seedById.get(bdId) : null;
        return {
          user_id: p.id,
          bd_member_id: bdId,
          full_name: prof?.full_name ?? "(no name)",
          city: p.city ?? null,
          country: p.country ?? null,
          slug: p.slug ?? null,
          is_published: !!p.is_published,
          has_avatar: !!prof?.avatar_url,
          photo_status: seed?.profile_photo_status ?? null,
        };
      });

      return {
        rows,
        stats: {
          total_thin: totalThin ?? 0,
          total_thin_published: totalPub ?? 0,
          total_thin_hidden: totalHidden ?? 0,
        },
      };
    },
  );

/* -------------------------------------------------------------------------- */
/* Generate draft (AI)                                                         */
/* -------------------------------------------------------------------------- */

const GenInput = z.object({ user_id: z.string().uuid() });

const BANNED_PHRASES = [
  "passionate about",
  "your journey",
  "transform your life",
  "results-driven",
  "unleash your potential",
  "fitness journey",
  "level up",
  "no excuses",
  "fitness enthusiast",
  "game-changer",
];
const EMOJI_REGEX =
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}\u{FE0F}]/gu;

function clean(text: string): string {
  return text
    .replace(EMOJI_REGEX, "")
    .replace(/^["“'']+|["”'']+$/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function hasBanned(t: string) {
  const l = t.toLowerCase();
  return BANNED_PHRASES.some((p) => l.includes(p));
}

export const generateShellDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => GenInput.parse(d))
  .handler(
    async ({
      data,
      context,
    }): Promise<{ headline: string; bio: string }> => {
      await assertAdmin(context);
      const sb = context.supabase;

      const [{ data: pro }, { data: prof }] = await Promise.all([
        sb
          .from("professionals")
          .select("city, country")
          .eq("id", data.user_id)
          .maybeSingle(),
        sb
          .from("profiles")
          .select("full_name")
          .eq("id", data.user_id)
          .maybeSingle(),
      ]);

      const firstName = String(prof?.full_name ?? "")
        .split(" ")[0]
        ?.trim() ?? "";
      const city = pro?.city ?? "";
      const country = pro?.country ?? "United Kingdom";

      const key = process.env.LOVABLE_API_KEY;
      if (!key) throw new Error("Missing LOVABLE_API_KEY");

      const system = `You write neutral, safe placeholder copy for REPs-registered fitness professionals whose profile has been migrated from a legacy directory with no bio.

Voice rules (NON-NEGOTIABLE):
- First person ("I").
- British English.
- Plain, grounded, generic. NO invented credentials, numbers, awards, specialisms, or service types.
- Treat the pro as a "REPs-registered fitness professional" — do not assume profession (PT, yoga, nutrition, etc.) unless told.
- No emoji, no hashtags, no exclamation marks, no ALL CAPS.
- BANNED: "passionate about", "your journey", "transform your life", "results-driven", "unleash your potential", "fitness journey", "level up", "no excuses", "fitness enthusiast", "game-changer".

Return ONLY valid JSON: { "headline": string, "bio": string }.
- headline: 80-140 chars, single line, no trailing period.
- bio: 2 short paragraphs, 350-600 chars total. End with one sentence inviting an enquiry.`;

      const user = `Facts (use ONLY these):
- First name: ${firstName || "(unknown)"}
- City: ${city || "(unknown)"}
- Country: ${country}
- Status: REPs-registered fitness professional, profile migrated from legacy directory, full profile pending update.

Write a placeholder headline + bio that is honest about being a REPs-registered professional in ${city || country}, without claiming any specific service, qualification, specialism, or client outcome.`;

      const res = await fetch(`${GATEWAY}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
      });
      if (res.status === 429)
        throw new Error("AI rate-limited. Wait a few seconds and retry.");
      if (res.status === 402)
        throw new Error("Workspace AI credits exhausted.");
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`AI request failed: ${res.status} ${t.slice(0, 240)}`);
      }
      const body = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      let parsed: { headline?: unknown; bio?: unknown };
      try {
        parsed = JSON.parse(body.choices?.[0]?.message?.content ?? "{}");
      } catch {
        throw new Error("AI returned invalid JSON.");
      }

      const headline = clean(String(parsed.headline ?? "")).slice(
        0,
        HEADLINE_MAX,
      );
      const bio = clean(String(parsed.bio ?? "")).slice(0, BIO_MAX);
      if (!headline || !bio)
        throw new Error("AI returned empty headline or bio.");
      if (hasBanned(headline) || hasBanned(bio))
        throw new Error("AI used a banned phrase. Regenerate.");
      return { headline, bio };
    },
  );

/* -------------------------------------------------------------------------- */
/* Apply (publish)                                                             */
/* -------------------------------------------------------------------------- */

const ApplyInput = z.object({
  user_id: z.string().uuid(),
  headline: z.string().trim().min(20).max(HEADLINE_MAX),
  bio: z.string().trim().min(60).max(BIO_MAX),
});

export const applyShellDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ApplyInput.parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context);
    const sb = context.supabase;
    const { error } = await sb
      .from("professionals")
      .update({
        headline: data.headline,
        bio: data.bio,
        is_published: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* -------------------------------------------------------------------------- */
/* Dismiss (hide)                                                              */
/* -------------------------------------------------------------------------- */

const DismissInput = z.object({ user_id: z.string().uuid() });

export const dismissSeedShell = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DismissInput.parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context);
    const sb = context.supabase;
    const { error } = await sb
      .from("professionals")
      .update({
        is_published: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
