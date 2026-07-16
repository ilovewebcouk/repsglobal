// Curated awarding-body list for the Verified Education & CPD flow.
// Used by the upload form's dropdown and by the AI extractor's fuzzy match.

export type AwardingBody = {
  slug: string;
  name: string;
  // Common alternative spellings the AI might return — used for fuzzy matching.
  aliases?: string[];
  // True if this body issues qualifications regulated by Ofqual (or equivalent).
  regulated?: boolean;
  // Optional logo URL (Lovable Asset). Rendered on /t/$slug next to approved
  // regulated qualifications. If missing, we fall back to Logo.dev by domain.
  logo?: string;
  // Optional primary domain for the awarding body. Used by `awardingBodyLogo`
  // to pull a logo from Logo.dev when no official upload exists yet.
  domain?: string;
};

const LOGO_DEV_TOKEN =
  (typeof import.meta !== "undefined" && (import.meta as { env?: Record<string, string | undefined> }).env
    ? (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_LOVABLE_CONNECTOR_LOGO_DEV_API_KEY
    : undefined) ?? null;

function logoDevUrl(domain: string): string | null {
  if (!LOGO_DEV_TOKEN) return null;
  return `https://img.logo.dev/${domain}?token=${LOGO_DEV_TOKEN}&size=128&format=png`;
}

/** Look up a logo URL by awarding-body slug. */
export function awardingBodyLogo(slug: string | null | undefined): string | null {
  if (!slug) return null;
  const body = AWARDING_BODIES.find((b) => b.slug === slug);
  if (!body) return null;
  if (body.logo) return body.logo;
  if (body.domain) return logoDevUrl(body.domain);
  return null;
}

/**
 * Fuzzy match an awarding-body name (as returned by the Ofqual register or
 * the AI extractor) against our curated list, then return its logo. Handles
 * suffixes like "Limited", "Ltd", "plc", punctuation, and known aliases.
 */
export function awardingBodyLogoByName(name: string | null | undefined): string | null {
  const body = findAwardingBodyByName(name);
  if (!body) return null;
  if (body.logo) return body.logo;
  if (body.domain) return logoDevUrl(body.domain);
  return null;
}

function normaliseName(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b(limited|ltd\.?|plc|llp|inc\.?|corp\.?|company|co\.?)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function findAwardingBodyByName(name: string | null | undefined): AwardingBody | null {
  if (!name) return null;
  const n = normaliseName(name);
  if (!n) return null;
  for (const b of AWARDING_BODIES) {
    const candidates = [b.name, ...(b.aliases ?? [])].map(normaliseName);
    if (candidates.some((c) => c && (c === n || n.includes(c) || c.includes(n)))) {
      return b;
    }
  }
  return null;
}

export const AWARDING_BODIES: AwardingBody[] = [
  // Ofqual-regulated awarding bodies (fitness / coaching / sport)
  { slug: "active-iq", name: "Active IQ", aliases: ["activeiq"], regulated: true, domain: "activeiq.co.uk" },
  { slug: "ncfe", name: "NCFE", aliases: ["ncfe cache", "cache"], regulated: true, domain: "ncfe.org.uk" },
  { slug: "focus-awards", name: "Focus Awards", regulated: true, domain: "focusawards.org.uk", logo: "/__l5e/assets-v1/a4a92305-eae5-4c4a-a673-c2e8e68c8a52/focus-awards.png" },
  { slug: "ymca-awards", name: "YMCA Awards", aliases: ["ymca"], regulated: true, domain: "ymcaawards.co.uk" },
  { slug: "vtct", name: "VTCT", aliases: ["itec"], regulated: true, domain: "vtct.org.uk" },
  { slug: "innovate-awarding", name: "Innovate Awarding", regulated: true, domain: "innovateawarding.org" },
  { slug: "1st4sport", name: "1st4sport", aliases: ["1st 4 sport"], regulated: true, domain: "1st4sportqualifications.com" },
  { slug: "pearson", name: "Pearson (Edexcel/BTEC)", aliases: ["edexcel", "btec"], regulated: true, domain: "pearson.com" },
  { slug: "city-and-guilds", name: "City & Guilds", aliases: ["city and guilds", "c&g"], regulated: true, domain: "cityandguilds.com" },
  { slug: "ocr", name: "OCR", aliases: ["oxford cambridge and rsa"], regulated: true, domain: "ocr.org.uk" },
  { slug: "tquk", name: "TQUK", aliases: ["training qualifications uk"], regulated: true, domain: "tquk.org" },
  { slug: "aim-qualifications", name: "AIM Qualifications", aliases: ["aim"], regulated: true, domain: "aim-group.org.uk" },
  { slug: "open-awards", name: "Open Awards", regulated: true, domain: "openawards.org.uk" },
  { slug: "gateway-qualifications", name: "Gateway Qualifications", regulated: true, domain: "gatewayqualifications.org.uk" },
  { slug: "iao", name: "IAO", aliases: ["industry qualifications", "iq"], regulated: true, domain: "industryqualifications.org.uk" },

  // Strength & conditioning / international (not Ofqual but well-known)
  { slug: "uksca", name: "UKSCA", aliases: ["uk strength & conditioning association"], domain: "uksca.org.uk" },
  { slug: "nasm", name: "NASM", aliases: ["national academy of sports medicine"], domain: "nasm.org" },
  { slug: "ace", name: "ACE", aliases: ["american council on exercise"], domain: "acefitness.org" },
  { slug: "acsm", name: "ACSM", aliases: ["american college of sports medicine"], domain: "acsm.org" },
  { slug: "nsca", name: "NSCA", aliases: ["national strength & conditioning association"], domain: "nsca.com" },

  // UK private training providers
  { slug: "premier-global", name: "Premier Global NASM", aliases: ["premier", "premier global", "premier training"], domain: "premierglobal.co.uk" },
  { slug: "future-fit", name: "Future Fit Training", aliases: ["future fit"], domain: "futurefit.co.uk" },
  { slug: "lifetime-training", name: "Lifetime Training", aliases: ["lifetime"], domain: "lifetimetraining.co.uk" },
  { slug: "protrainings", name: "ProTrainings", aliases: ["pro trainings"], domain: "protrainings.uk" },
  { slug: "emd-uk", name: "EMD UK", aliases: ["exercise movement and dance"], domain: "emduk.org" },

  // Nutrition
  { slug: "mac-nutrition-uni", name: "Mac-Nutrition Uni", aliases: ["mnu"], domain: "mac-nutritionuni.com" },
  { slug: "precision-nutrition", name: "Precision Nutrition", aliases: ["pn"], domain: "precisionnutrition.com" },

  // Specialist
  { slug: "girls-gone-strong", name: "Girls Gone Strong", aliases: ["ggs"], domain: "girlsgonestrong.com" },
  { slug: "fitpro", name: "FitPro", domain: "fitpro.com" },
  { slug: "yoga-alliance", name: "Yoga Alliance", aliases: ["yoga alliance professionals"], domain: "yogaalliance.org" },
  { slug: "british-wheel-of-yoga", name: "British Wheel of Yoga", aliases: ["bwy"], domain: "bwy.org.uk" },
  { slug: "body-control-pilates", name: "Body Control Pilates", domain: "bodycontrolpilates.com" },
  { slug: "stott-pilates", name: "STOTT Pilates", aliases: ["stott"], domain: "merrithew.com" },
  { slug: "polestar-pilates", name: "Polestar Pilates", domain: "polestarpilates.com" },

  { slug: "other", name: "Other (specify)" },
];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Fuzzy-match a free-text awarding body to a canonical slug. Returns null if no confident match. */
export function matchAwardingBody(input: string | null | undefined): AwardingBody | null {
  if (!input) return null;
  const q = norm(input);
  if (!q) return null;

  for (const body of AWARDING_BODIES) {
    if (body.slug === "other") continue;
    const candidates = [body.name, ...(body.aliases ?? [])].map(norm);
    if (candidates.includes(q)) return body;
    // Contains either direction (handles "UKSCA L2" → "UKSCA")
    if (candidates.some((c) => q.includes(c) || c.includes(q))) return body;
  }
  return null;
}

export function awardingBodyName(slug: string | null | undefined): string | null {
  if (!slug) return null;
  return AWARDING_BODIES.find((b) => b.slug === slug)?.name ?? null;
}

/** Ofqual qualification number format: NNN/NNNN/X (e.g. 500/8513/X). */
export const OFQUAL_QUAL_NO_REGEX = /^\d{3}\/\d{4}\/[A-Z0-9]$/i;

export function isOfqualQualNumber(input: string | null | undefined): boolean {
  if (!input) return false;
  return OFQUAL_QUAL_NO_REGEX.test(input.trim());
}

/**
 * Accepted Ofqual `OrganisationName` variants per slug.
 * Used by the Ofqual cross-check to avoid false-negatives when the awarding
 * body's legal name on the register differs from the friendly label the Pro
 * picked (e.g. "Innovate Awarding" vs "Innovate Awarding Organisation Limited"
 * — or acronyms like "IAO" / "NCFE-CACHE").
 *
 * Each variant is matched case-insensitively after normalisation to
 * alphanumerics + spaces. New aliases here flow through both the live lookup
 * and admin "Re-check Ofqual" without code changes elsewhere.
 */
export const OFQUAL_BODY_ALIASES: Record<string, string[]> = {
  "active-iq": ["active iq", "active iq limited", "active iq ltd", "activeiq"],
  ncfe: ["ncfe", "ncfe cache", "cache", "ncfe (cache)", "council for awards in care health and education"],
  "focus-awards": ["focus awards", "focus awards limited", "focus awards ltd"],
  "ymca-awards": ["ymca awards", "ymca awards limited", "ymca awards ltd", "ymca"],
  vtct: ["vtct", "vocational training charitable trust", "itec"],
  "innovate-awarding": [
    "innovate awarding",
    "innovate awarding organisation",
    "innovate awarding organisation limited",
    "innovate awarding organisation ltd",
    "iao",
  ],
  "1st4sport": ["1st4sport", "1st4sport qualifications", "1st 4 sport", "1st 4 sport qualifications"],
  pearson: ["pearson", "pearson education", "pearson education limited", "edexcel", "btec", "pearson edexcel"],
  "city-and-guilds": ["city and guilds", "city & guilds", "the city and guilds of london institute", "c and g"],
  ocr: ["ocr", "oxford cambridge and rsa", "oxford cambridge and rsa examinations"],
  tquk: ["tquk", "training qualifications uk", "training qualifications uk limited", "training qualifications uk ltd"],
  "aim-qualifications": ["aim", "aim qualifications", "aim qualifications and assessment group"],
  "open-awards": ["open awards", "open awards limited"],
  "gateway-qualifications": ["gateway qualifications", "gateway qualifications limited"],
  iao: ["iao", "industry qualifications", "industry qualifications limited", "iq"],
};

const normAlias = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/**
 * Decide whether `registerName` (from Ofqual) refers to the same awarding body
 * as the one the Pro selected. Slug + alias table wins; falls back to a
 * bidirectional substring compare so unknown bodies still have a chance.
 */
export function matchesAwardingBody(
  registerName: string | null | undefined,
  submitted: { slug?: string | null; name?: string | null },
): boolean {
  if (!registerName) return false;
  const reg = normAlias(registerName);
  if (!reg) return false;

  const slug = submitted.slug ?? null;
  if (slug && OFQUAL_BODY_ALIASES[slug]) {
    for (const alias of OFQUAL_BODY_ALIASES[slug]) {
      const a = normAlias(alias);
      if (!a) continue;
      if (reg === a || reg.includes(a) || a.includes(reg)) return true;
    }
  }

  const name = submitted.name ? normAlias(submitted.name) : "";
  if (name && (reg === name || reg.includes(name) || name.includes(reg))) return true;

  return false;
}
