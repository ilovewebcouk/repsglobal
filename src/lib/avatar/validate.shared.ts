/**
 * Canonical avatar validation rules — shared between the dashboard upload
 * (`src/lib/profile/avatar-ai.functions.ts`) and the BD backfill
 * (`src/lib/admin/bd-recrop.functions.ts`).
 *
 * One prompt, one schema, one decision function. If a photo would be rejected
 * for a pro uploading through the dashboard, it is rejected for a BD-imported
 * photo too — and vice versa. There is no second, looser bar anywhere.
 *
 * This file is pure: no fetch, no I/O, no server-fn wrapper. Safe to import
 * from both server-only and client-reachable modules.
 */

export type FaceBox = { x: number; y: number; width: number; height: number };

export type AvatarRejectCategory =
  | "logo"
  | "illustration"
  | "group"
  | "full_body"
  | "face_obscured"
  | "low_quality"
  | "not_a_person"
  | "distracting_background"
  | "other";

export type RawAvatarValidation = {
  isHeadshot?: boolean;
  rejectionReason?: string | null;
  rejectionCategory?: string | null;
  faceBox?: FaceBox | null;
  qualityScore?: number;
};

export type AvatarDecision =
  | {
      ok: true;
      faceBox: FaceBox;
      qualityScore: 1 | 2 | 3 | 4 | 5;
      faceArea: number;
    }
  | {
      ok: false;
      reason: string;
      category: AvatarRejectCategory;
    };

/* -------------------------------------------------------------------------- */
/* Thresholds — the single source of truth                                     */
/* -------------------------------------------------------------------------- */

/**
 * Minimum head bounding-box area (width × height as a fraction of the whole
 * image). A tight head-and-shoulders portrait reads at ~0.20–0.40. A
 * head-to-torso (chest/waist up) mid-shot reads at ~0.06–0.12. A true
 * full-body shot reads at ~0.005–0.02.
 *
 * 0.07 admits head-and-shoulders AND head-to-torso portraits while still
 * rejecting full-body / distant / group shots. Gemini's bounding boxes
 * carry ±20% noise — tune from real-world reject counts, not theoretical
 * area math.
 */
export const MIN_FACE_AREA = 0.07;

/** Minimum Gemini quality score (1-5). 3 = "acceptable", 4-5 = "good/great". */
export const MIN_QUALITY = 3;

/* -------------------------------------------------------------------------- */
/* The Gemini prompt — identical for both pipelines                            */
/* -------------------------------------------------------------------------- */

export const AVATAR_SYSTEM_PROMPT = `You are a strict gatekeeper for professional headshots on a verified fitness-professional directory.

REJECT the image unless ALL of these are true:
- It is a real photograph (not an illustration, drawing, 3D render, AI-generated cartoon, logo, icon, or text/wordmark).
- It shows exactly ONE human being.
- The face is clearly visible, roughly front-facing, well-lit, in focus.
- It is a head-and-shoulders OR head-to-torso (chest/waist up) portrait — NOT a full-body, distant, or group shot.
- The face is not heavily obscured (e.g. both sunglasses AND a hat covering the face = reject; mask covering most of face = reject).
- The background is not visually distracting. REJECT (category "distracting_background") if any of the following dominate the frame behind or beside the person:
  - Large, legible commercial signage, storefronts, branded gym facades, or shop names (e.g. "GOLD'S GYM", "PUREGYM" visible behind the subject).
  - Busy text, posters, banners, billboards, or screens with readable words.
  - A cluttered scene that competes with the face for attention (crowds, traffic, dense merchandise, busy street).
  A clean gym floor, plain wall, neutral outdoor setting, or softly blurred background is FINE — only reject when the background pulls the eye away from the person.

If you reject, set isHeadshot=false and pick the single best matching category and a short, user-facing reason in plain English (1 sentence, no jargon, no markdown).

If you accept, set isHeadshot=true and return a faceBox with normalized coordinates (0..1) relative to the original image. The faceBox MUST enclose the WHOLE HEAD — from the top of the hair (NOT the eyebrows) down to the chin, and from the left ear to the right ear. Always include any hair above the forehead. NEVER return a box that only covers the lower face, mouth, or chin. Quality score 1-5 reflects sharpness, lighting, and framing.

Return ONLY valid JSON matching the schema. No prose.`;

export const AVATAR_VALIDATION_SCHEMA = `{
  "isHeadshot": boolean,
  "rejectionReason": string | null,
  "rejectionCategory": "logo" | "illustration" | "group" | "full_body" | "face_obscured" | "low_quality" | "not_a_person" | "distracting_background" | "other" | null,
  "faceBox": { "x": number, "y": number, "width": number, "height": number } | null,
  "qualityScore": 1 | 2 | 3 | 4 | 5
}`;

/* -------------------------------------------------------------------------- */
/* Pure decision — no I/O                                                      */
/* -------------------------------------------------------------------------- */

function clampCategory(c: unknown): AvatarRejectCategory {
  const allowed: AvatarRejectCategory[] = [
    "logo",
    "illustration",
    "group",
    "full_body",
    "face_obscured",
    "low_quality",
    "not_a_person",
    "distracting_background",
    "other",
  ];
  const s = String(c ?? "").toLowerCase();
  return (allowed as string[]).includes(s) ? (s as AvatarRejectCategory) : "other";
}

function clampBox(box: FaceBox | null | undefined): FaceBox | null {
  if (!box) return null;
  if (
    typeof box.x !== "number" ||
    typeof box.y !== "number" ||
    typeof box.width !== "number" ||
    typeof box.height !== "number"
  ) {
    return null;
  }
  return {
    x: Math.max(0, Math.min(1, box.x)),
    y: Math.max(0, Math.min(1, box.y)),
    width: Math.max(0.01, Math.min(1, box.width)),
    height: Math.max(0.01, Math.min(1, box.height)),
  };
}

/**
 * Apply the canonical rule to a raw Gemini response. Both the dashboard
 * uploader and the BD backfill route through this — same outcome either way.
 */
export function decideAvatar(parsed: RawAvatarValidation): AvatarDecision {
  // 1. Gemini said "not a headshot" — pass through its reason.
  if (!parsed.isHeadshot) {
    return {
      ok: false,
      reason:
        (parsed.rejectionReason ?? "").toString().trim() ||
        "This image doesn't look like a professional headshot.",
      category: clampCategory(parsed.rejectionCategory),
    };
  }

  // 2. Gemini said "headshot" but failed to return a usable face box → reject.
  //    We refuse to centre-crop a head we couldn't actually locate.
  const box = clampBox(parsed.faceBox ?? null);
  if (!box) {
    return {
      ok: false,
      reason: "We couldn't reliably detect a face in this image.",
      category: "face_obscured",
    };
  }

  // 3. Face is too small in the frame — full-body / distant / selfie-from-afar.
  const faceArea = box.width * box.height;
  if (faceArea < MIN_FACE_AREA) {
    return {
      ok: false,
      reason:
        "The face is too small in this photo — please upload a head-and-shoulders or waist-up portrait where your face is clearly visible.",
      category: "full_body",
    };
  }

  // 4. Quality below the bar — blurry, dark, very low resolution.
  const quality = (parsed.qualityScore as 1 | 2 | 3 | 4 | 5) ?? 3;
  if (quality < MIN_QUALITY) {
    return {
      ok: false,
      reason:
        "This photo is too low-quality (blurry, dark, or low resolution). Please upload a sharper, well-lit headshot.",
      category: "low_quality",
    };
  }

  return { ok: true, faceBox: box, qualityScore: quality, faceArea };
}
