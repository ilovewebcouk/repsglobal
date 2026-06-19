// AI pre-screen for new reviews. Never auto-rejects — only writes
// ai_verdict + ai_flags. Admin still has the final say.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

type FlagCheck = { hit: boolean; reason: string };
type ReviewFlags = {
  profanity: FlagCheck;
  promo: FlagCheck;
  pii: FlagCheck;
  fake_signals: FlagCheck;
  dedupe: FlagCheck;
};

const PROFANITY = [
  "fuck","shit","cunt","bitch","bastard","asshole","dick","prick","wanker",
  "slut","whore","faggot","nigger","retard",
];
const URL_RE = /\b(?:https?:\/\/|www\.)\S+/i;
const HANDLE_RE = /(?:^|\s)@[A-Za-z0-9_]{2,}/;
const PHONE_RE = /\b(?:\+?\d[\d\s\-().]{7,}\d)\b/;
const DISCOUNT_RE = /\b(?:promo|discount|coupon|code|use code|voucher|10% off|20% off|free trial)\b/i;
const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
const UK_POSTCODE_RE = /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i;

function heuristicFlags(body: string): Pick<ReviewFlags, "profanity"|"promo"|"pii"> {
  const lower = body.toLowerCase();
  const profanityHit = PROFANITY.find((w) => new RegExp(`\\b${w}\\b`, "i").test(lower));
  const urlHit = URL_RE.test(body) || HANDLE_RE.test(body);
  const discountHit = DISCOUNT_RE.test(body);
  const phoneHit = PHONE_RE.test(body);
  const emailHit = EMAIL_RE.test(body);
  const postcodeHit = UK_POSTCODE_RE.test(body);
  return {
    profanity: {
      hit: !!profanityHit,
      reason: profanityHit ? `Contains "${profanityHit}"` : "Clean",
    },
    promo: {
      hit: urlHit || discountHit,
      reason: [
        urlHit ? "Contains URL or social handle" : null,
        discountHit ? "Promo/discount language" : null,
      ].filter(Boolean).join(" · ") || "Clean",
    },
    pii: {
      hit: phoneHit || emailHit || postcodeHit,
      reason: [
        emailHit ? "Email address" : null,
        phoneHit ? "Phone number" : null,
        postcodeHit ? "Postcode" : null,
      ].filter(Boolean).join(" · ") || "Clean",
    },
  };
}

async function aiCheck(opts: {
  body: string;
  rating: number;
  title: string | null;
}): Promise<{ fake_hit: boolean; fake_reason: string; promo_extra: string | null } | null> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You moderate fitness-professional reviews. Return JSON only with this shape: {\"fake\":{\"hit\":boolean,\"reason\":string},\"promo\":{\"hit\":boolean,\"reason\":string}}. fake.hit=true if the text reads bot-like, suspiciously generic, sentiment strongly contradicts the star rating, or appears AI-generated. promo.hit=true if it pitches another business or contains hidden promotional intent. reason is one short sentence.",
          },
          {
            role: "user",
            content: `Rating: ${opts.rating}/5\nTitle: ${opts.title ?? "(none)"}\nReview: ${opts.body}`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const text = json?.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(text);
    return {
      fake_hit: !!parsed?.fake?.hit,
      fake_reason: typeof parsed?.fake?.reason === "string" ? parsed.fake.reason : "",
      promo_extra: parsed?.promo?.hit
        ? typeof parsed?.promo?.reason === "string"
          ? parsed.promo.reason
          : "AI-detected promotional intent"
        : null,
    };
  } catch (e) {
    console.error("[runReviewModeration] AI call failed", e);
    return null;
  }
}

export const runReviewModeration = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ reviewId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: r, error } = await supabaseAdmin
      .from("reviews")
      .select(
        "id, professional_id, client_email, submitter_ip, body, title, rating, created_at",
      )
      .eq("id", data.reviewId)
      .maybeSingle();
    if (error || !r) return { ok: false };

    const base = heuristicFlags(r.body);

    // Dedupe lookups
    const since90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const dedupeReasons: string[] = [];

    if (r.submitter_ip) {
      const { data: byIp } = await supabaseAdmin
        .from("reviews")
        .select("id, professional_id, created_at")
        .eq("submitter_ip", r.submitter_ip as never)
        .gte("created_at", since7d)
        .neq("id", r.id);
      const pros7d = new Set((byIp ?? []).map((x: any) => x.professional_id));
      if (pros7d.size >= 1) {
        dedupeReasons.push(`Same IP reviewed ${pros7d.size + 1} pro(s) in 7d`);
      }
      const { data: burst } = await supabaseAdmin
        .from("reviews")
        .select("id")
        .eq("submitter_ip", r.submitter_ip as never)
        .gte("created_at", since24h);
      if ((burst?.length ?? 0) >= 3) {
        dedupeReasons.push(`${burst!.length} reviews from this IP in 24h`);
      }
    }

    if (r.client_email) {
      const { data: byEmail } = await supabaseAdmin
        .from("reviews")
        .select("id, professional_id")
        .eq("client_email", r.client_email as never)
        .gte("created_at", since30d)
        .neq("id", r.id);
      const pros30d = new Set((byEmail ?? []).map((x: any) => x.professional_id));
      if (pros30d.size >= 2) {
        dedupeReasons.push(`Same email reviewed ${pros30d.size + 1} pros in 30d`);
      }
    }

    // Duplicate body hash check (cheap: first 80 chars match)
    if (r.body && r.body.length >= 40) {
      const snippet = r.body.slice(0, 80);
      const { data: dupes } = await supabaseAdmin
        .from("reviews")
        .select("id")
        .ilike("body", `${snippet}%`)
        .gte("created_at", since90)
        .neq("id", r.id);
      if ((dupes?.length ?? 0) > 0) {
        dedupeReasons.push(`Body matches ${dupes!.length} other review(s)`);
      }
    }

    const ai = await aiCheck({ body: r.body, rating: r.rating, title: r.title });

    const flags: ReviewFlags = {
      profanity: base.profanity,
      promo: {
        hit: base.promo.hit || !!ai?.promo_extra,
        reason: [base.promo.reason !== "Clean" ? base.promo.reason : null, ai?.promo_extra]
          .filter(Boolean)
          .join(" · ") || "Clean",
      },
      pii: base.pii,
      fake_signals: {
        hit: !!ai?.fake_hit,
        reason: ai?.fake_hit ? ai.fake_reason || "AI flagged this as suspicious" : "Clean",
      },
      dedupe: {
        hit: dedupeReasons.length > 0,
        reason: dedupeReasons.join(" · ") || "Clean",
      },
    };

    const hitCount =
      Number(flags.profanity.hit) +
      Number(flags.promo.hit) +
      Number(flags.pii.hit) +
      Number(flags.fake_signals.hit) +
      Number(flags.dedupe.hit);

    const verdict: "clean" | "warning" | "suspect" =
      hitCount === 0 ? "clean" : hitCount >= 2 || flags.profanity.hit ? "suspect" : "warning";

    await supabaseAdmin
      .from("reviews")
      .update({
        ai_flags: flags as never,
        ai_verdict: verdict,
        ai_checked_at: new Date().toISOString(),
      })
      .eq("id", r.id);

    return { ok: true, verdict, flags };
  });
