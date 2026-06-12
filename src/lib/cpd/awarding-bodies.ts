// Curated awarding-body list for the Verified Education & CPD flow.
// Used by the upload form's dropdown and by the AI extractor's fuzzy match.

export type AwardingBody = {
  slug: string;
  name: string;
  // Common alternative spellings the AI might return — used for fuzzy matching.
  aliases?: string[];
  // True if this body issues qualifications regulated by Ofqual (or equivalent).
  regulated?: boolean;
};

export const AWARDING_BODIES: AwardingBody[] = [
  // Ofqual-regulated awarding bodies (fitness / coaching / sport)
  { slug: "active-iq", name: "Active IQ", aliases: ["activeiq"], regulated: true },
  { slug: "ncfe", name: "NCFE", aliases: ["ncfe cache", "cache"], regulated: true },
  { slug: "focus-awards", name: "Focus Awards", regulated: true },
  { slug: "ymca-awards", name: "YMCA Awards", aliases: ["ymca"], regulated: true },
  { slug: "vtct", name: "VTCT", aliases: ["itec"], regulated: true },
  { slug: "innovate-awarding", name: "Innovate Awarding", regulated: true },
  { slug: "1st4sport", name: "1st4sport", aliases: ["1st 4 sport"], regulated: true },
  { slug: "pearson", name: "Pearson (Edexcel/BTEC)", aliases: ["edexcel", "btec"], regulated: true },
  { slug: "city-and-guilds", name: "City & Guilds", aliases: ["city and guilds", "c&g"], regulated: true },
  { slug: "ocr", name: "OCR", aliases: ["oxford cambridge and rsa"], regulated: true },
  { slug: "tquk", name: "TQUK", aliases: ["training qualifications uk"], regulated: true },
  { slug: "aim-qualifications", name: "AIM Qualifications", aliases: ["aim"], regulated: true },
  { slug: "open-awards", name: "Open Awards", regulated: true },
  { slug: "gateway-qualifications", name: "Gateway Qualifications", regulated: true },
  { slug: "iao", name: "IAO", aliases: ["industry qualifications", "iq"], regulated: true },

  // Strength & conditioning / international (not Ofqual but well-known)
  { slug: "uksca", name: "UKSCA", aliases: ["uk strength & conditioning association"] },
  { slug: "nasm", name: "NASM", aliases: ["national academy of sports medicine"] },
  { slug: "ace", name: "ACE", aliases: ["american council on exercise"] },
  { slug: "acsm", name: "ACSM", aliases: ["american college of sports medicine"] },
  { slug: "nsca", name: "NSCA", aliases: ["national strength & conditioning association"] },

  // UK private training providers
  { slug: "premier-global", name: "Premier Global NASM", aliases: ["premier", "premier global", "premier training"] },
  { slug: "future-fit", name: "Future Fit Training", aliases: ["future fit"] },
  { slug: "lifetime-training", name: "Lifetime Training", aliases: ["lifetime"] },
  { slug: "protrainings", name: "ProTrainings", aliases: ["pro trainings"] },
  { slug: "emd-uk", name: "EMD UK", aliases: ["exercise movement and dance"] },

  // Nutrition
  { slug: "mac-nutrition-uni", name: "Mac-Nutrition Uni", aliases: ["mnu"] },
  { slug: "precision-nutrition", name: "Precision Nutrition", aliases: ["pn"] },

  // Specialist
  { slug: "girls-gone-strong", name: "Girls Gone Strong", aliases: ["ggs"] },
  { slug: "fitpro", name: "FitPro" },
  { slug: "yoga-alliance", name: "Yoga Alliance", aliases: ["yoga alliance professionals"] },
  { slug: "british-wheel-of-yoga", name: "British Wheel of Yoga", aliases: ["bwy"] },
  { slug: "body-control-pilates", name: "Body Control Pilates" },
  { slug: "stott-pilates", name: "STOTT Pilates", aliases: ["stott"] },
  { slug: "polestar-pilates", name: "Polestar Pilates" },

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
