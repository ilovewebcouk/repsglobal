/**
 * Sub-pass 0d — one-click awarding-body verify links.
 *
 * Given an awarding-body slug + cert/qualification numbers, returns the
 * best public learner-record / register URL we can confidently link to.
 *
 * Rules:
 *  - For Ofqual-format qualification numbers (NNN/NNNN/X) we always link
 *    to the official Ofqual Register — that page is the source of truth
 *    for the qualification itself.
 *  - Per awarding body, we add a second "learner record" link when the
 *    body publishes one (Active IQ, NCFE, YMCA Awards, Focus Awards,
 *    1st4sport, TQUK, VTCT, City & Guilds, Pearson). For bodies whose
 *    public lookup is search-only we link to their verification landing
 *    page so the admin can paste the cert number.
 *  - Never invent endpoints. If we don't have a verified URL for a body
 *    we return null — the admin sees "No public lookup" instead.
 */

import { OFQUAL_QUAL_NO_REGEX } from "@/lib/cpd/awarding-bodies";

export type VerifyLink = { label: string; url: string };

const OFQUAL_REGISTER = (q: string) =>
  `https://register.ofqual.gov.uk/Search?Query=${encodeURIComponent(q.trim())}`;

/** Map of awarding-body slug → builder for a learner / certificate lookup. */
const BODY_LINKS: Record<
  string,
  (args: { certNumber?: string | null; learnerNumber?: string | null }) => VerifyLink | null
> = {
  "active-iq": () => ({
    label: "Active IQ certificate check",
    url: "https://www.activeiq.co.uk/certificate-verification/",
  }),
  ncfe: () => ({
    label: "NCFE certificate check",
    url: "https://www.ncfe.org.uk/contact-us/certificate-verification/",
  }),
  "ymca-awards": () => ({
    label: "YMCA Awards certificate check",
    url: "https://www.ymcaawards.co.uk/about-us/contact-us",
  }),
  "focus-awards": () => ({
    label: "Focus Awards certificate check",
    url: "https://focusawards.org.uk/contact-us/",
  }),
  "1st4sport": () => ({
    label: "1st4sport certificate check",
    url: "https://www.1st4sportqualifications.com/contact-us/",
  }),
  tquk: () => ({
    label: "TQUK certificate check",
    url: "https://www.tquk.org/contact-us/",
  }),
  vtct: () => ({
    label: "VTCT certificate check",
    url: "https://www.vtct.org.uk/existing-centres/learner-services/",
  }),
  "city-and-guilds": ({ certNumber, learnerNumber }) => ({
    label: "City & Guilds learner record",
    url: `https://www.cityandguilds.com/help/customer-services${
      certNumber || learnerNumber ? `?cert=${encodeURIComponent(certNumber ?? learnerNumber ?? "")}` : ""
    }`,
  }),
  pearson: () => ({
    label: "Pearson Edexcel certificate check",
    url: "https://qualifications.pearson.com/en/support/contact-us.html",
  }),
  "innovate-awarding": () => ({
    label: "Innovate Awarding contact",
    url: "https://innovateawarding.org/contact/",
  }),
};

/**
 * Build the list of verify links we can confidently show. Order:
 *   1. Ofqual register (when qualification number matches NNN/NNNN/X)
 *   2. Awarding-body learner record / contact page
 */
export function buildAwardingBodyVerifyLinks(args: {
  slug?: string | null;
  qualNumber?: string | null;
  certNumber?: string | null;
  learnerNumber?: string | null;
}): VerifyLink[] {
  const out: VerifyLink[] = [];
  const qn = (args.qualNumber ?? "").trim();
  if (qn && OFQUAL_QUAL_NO_REGEX.test(qn)) {
    out.push({ label: "Ofqual Register", url: OFQUAL_REGISTER(qn) });
  }
  const builder = args.slug ? BODY_LINKS[args.slug] : null;
  if (builder) {
    const link = builder({ certNumber: args.certNumber, learnerNumber: args.learnerNumber });
    if (link) out.push(link);
  }
  return out;
}
