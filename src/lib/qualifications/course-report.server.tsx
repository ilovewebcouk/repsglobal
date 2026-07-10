/**
 * REPS Course Assessment Report — server-side PDF renderer + deterministic
 * flag computer.
 *
 * This file is server-only (`.server.tsx` prevents client bundling). Called
 * from `qualifications.functions.ts` when an admin makes a final decision
 * on a REPS-accredited course, or when a fresh decision snapshot is needed
 * (draft preview for admins).
 *
 * The report is the Ofqual-style credibility artefact:
 * cover · spec · level determination · findings · trust · decision · audit.
 */
import * as React from "react";
import { Document, Page, Text, View, StyleSheet, Font, renderToBuffer } from "@react-pdf/renderer";

// ─── Types ──────────────────────────────────────────────────────────────────

export type CourseDecision = "approved" | "rejected" | "changes_requested";

export type DecisionSnapshot = {
  // Immutable snapshot taken at decision time.
  version: 1;
  generated_at: string;
  document_id: string;
  decision: CourseDecision;
  decision_at: string;
  reviewer: { id: string | null; email: string | null; display_name: string | null };
  admin_note: string | null;
  course: {
    id: string;
    proposed_title: string;
    proposed_delivery_mode: string | null;
    proposed_total_hours: number | null;
    proposed_prerequisites: string | null;
    proposed_tutor_credentials: string | null;
    official_title: string | null;
    official_level: number | null;
    reps_qual_number: string | null;
    spec_who_for: string | null;
    spec_learning_outcomes: string[] | null;
    spec_how_youll_study: string | null;
    spec_how_youre_assessed: string | null;
    spec_prerequisites: string | null;
    spec_guided_learning_hours: number | null;
    spec_total_qualification_time: number | null;
    spec_delivery_mode: string | null;
  };
  ai: {
    verdict: string | null;
    red_flags: string[];
    reviewer_notes: string | null;
    level_rationale: string | null;
    level_confidence: string | null;
    deterministic_flags: string[];
  };
  provider: {
    id: string;
    legal_entity_name: string | null;
    slug: string | null;
    trust: {
      identity_verified: boolean;
      identity_verified_at: string | null;
      insurance_active: boolean;
      insurance_valid_until: string | null;
      domain_verified: boolean;
      previous_approved_courses: number;
    };
  };
  audit: {
    submitted_at: string;
    ai_drafted_at: string | null;
    decided_at: string;
  };
};

// ─── Deterministic red-flag computer ────────────────────────────────────────
// Cheap, reliable checks that don't rely on the LLM. Kept small and honest.

type FlagInput = {
  proposed_prerequisites: string | null;
  proposed_how_assessed: string | null;
  proposed_tutor_credentials: string | null;
  spec_prerequisites: string | null;
  spec_guided_learning_hours: number | null;
  spec_total_qualification_time: number | null;
  spec_delivery_mode: string | null;
  official_level: number | null;
};

const isEssentiallyEmpty = (s: string | null | undefined): boolean => {
  const t = (s ?? "").trim().toLowerCase();
  return !t || t === "none" || t === "n/a" || t === "na" || t === "-";
};

export function computeDeterministicFlags(row: FlagInput): string[] {
  const flags: string[] = [];

  // No prerequisites at level 4+.
  if (
    row.official_level != null &&
    row.official_level >= 4 &&
    isEssentiallyEmpty(row.spec_prerequisites ?? row.proposed_prerequisites)
  ) {
    flags.push(
      `Level ${row.official_level} claimed with no prerequisites — specialist qualifications normally require a Level 3 baseline.`,
    );
  }

  // GLH > TQT is a logical error.
  if (
    row.spec_guided_learning_hours != null &&
    row.spec_total_qualification_time != null &&
    row.spec_guided_learning_hours > row.spec_total_qualification_time
  ) {
    flags.push(
      `Guided learning hours (${row.spec_guided_learning_hours}) exceed total qualification time (${row.spec_total_qualification_time}).`,
    );
  }

  // Self-paced but claims practical observation.
  if (
    row.spec_delivery_mode === "online_self_paced" &&
    (row.proposed_how_assessed ?? "").toLowerCase().match(/practical|observ|in.person|physical/)
  ) {
    flags.push(
      `Delivery is self-paced online but assessment mentions practical observation — verify how in-person assessment is arranged.`,
    );
  }

  // Tutor credentials thin.
  const tutor = (row.proposed_tutor_credentials ?? "").trim();
  if (tutor.length > 0 && tutor.length < 40) {
    flags.push(
      `Tutor credentials are very short (${tutor.length} chars) — request evidence of qualifications and experience.`,
    );
  }

  return flags;
}

// ─── PDF stylesheet ─────────────────────────────────────────────────────────
// Uses built-in Helvetica so no network font fetch is needed at render time.

const REPS_ORANGE = "#F26522";
const INK = "#0F172A";
const MUTED = "#475569";
const HAIRLINE = "#E2E8F0";
const SUCCESS = "#059669";
const WARN = "#B45309";
const ERR = "#B91C1C";

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: INK, lineHeight: 1.45 },
  wm: { position: "absolute", top: 30, right: 40, fontSize: 8, color: MUTED, letterSpacing: 1 },
  band: { backgroundColor: REPS_ORANGE, color: "#fff", padding: 14, marginBottom: 18 },
  bandTitle: { fontSize: 14, fontFamily: "Helvetica-Bold", letterSpacing: 1 },
  bandKicker: { fontSize: 8, letterSpacing: 2, marginBottom: 4 },
  h1: { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 6 },
  h2: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 16, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1, color: REPS_ORANGE },
  h3: { fontSize: 10, fontFamily: "Helvetica-Bold", marginTop: 8, marginBottom: 3 },
  p: { marginBottom: 4 },
  small: { fontSize: 8, color: MUTED },
  muted: { color: MUTED },
  bold: { fontFamily: "Helvetica-Bold" },
  hr: { borderBottomWidth: 0.5, borderBottomColor: HAIRLINE, marginVertical: 8 },
  row: { flexDirection: "row", marginBottom: 3 },
  kvKey: { width: "38%", color: MUTED, fontSize: 9 },
  kvVal: { width: "62%", fontSize: 9 },
  chip: { fontSize: 8, borderRadius: 3, paddingVertical: 2, paddingHorizontal: 6, marginRight: 4 },
  chipOk: { backgroundColor: "#ECFDF5", color: SUCCESS },
  chipWarn: { backgroundColor: "#FFFBEB", color: WARN },
  chipErr: { backgroundColor: "#FEF2F2", color: ERR },
  chipRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 6 },
  ol: { marginTop: 3 },
  li: { marginBottom: 2, paddingLeft: 8 },
  footer: {
    position: "absolute",
    left: 40,
    right: 40,
    bottom: 24,
    fontSize: 7,
    color: MUTED,
    borderTopWidth: 0.5,
    borderTopColor: HAIRLINE,
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  card: { borderWidth: 0.5, borderColor: HAIRLINE, padding: 8, borderRadius: 3, marginBottom: 6 },
  draftStamp: {
    position: "absolute",
    top: 200,
    left: 60,
    right: 60,
    fontSize: 60,
    color: "rgba(178, 34, 34, 0.12)",
    textAlign: "center",
    fontFamily: "Helvetica-Bold",
    letterSpacing: 8,
  },
});

// ─── Small helpers ──────────────────────────────────────────────────────────

const dateOnly = (iso: string | null | undefined): string =>
  iso ? new Date(iso).toISOString().slice(0, 10) : "—";
const dateTime = (iso: string | null | undefined): string =>
  iso ? new Date(iso).toISOString().replace("T", " ").slice(0, 16) + " UTC" : "—";

const DELIVERY_LABEL: Record<string, string> = {
  in_person: "In person",
  online_live: "Online — live",
  online_self_paced: "Online — self-paced",
  online: "Online",
  blended: "Blended",
};

const DECISION_LABEL: Record<CourseDecision, string> = {
  approved: "Approved",
  rejected: "Rejected",
  changes_requested: "Changes requested",
};

function KV({ k, v }: { k: string; v: string | number | null | undefined }) {
  return (
    <View style={s.row}>
      <Text style={s.kvKey}>{k}</Text>
      <Text style={s.kvVal}>{v == null || v === "" ? "—" : String(v)}</Text>
    </View>
  );
}

// ─── Report component ──────────────────────────────────────────────────────

export function CourseAssessmentReport({
  snap,
  isDraft,
}: {
  snap: DecisionSnapshot;
  isDraft: boolean;
}) {
  const c = snap.course;
  const ai = snap.ai;
  const p = snap.provider;
  const providerName = p.legal_entity_name || "Unnamed provider";
  const decisionLabel = DECISION_LABEL[snap.decision];
  const decisionChipStyle =
    snap.decision === "approved"
      ? s.chipOk
      : snap.decision === "rejected"
        ? s.chipErr
        : s.chipWarn;

  return (
    <Document
      title={`REPS Course Assessment — ${c.official_title || c.proposed_title}`}
      author="REPS"
    >
      <Page size="A4" style={s.page}>
        <Text style={s.wm}>REPS · REGISTER OF EXERCISE PROFESSIONALS</Text>
        {isDraft ? <Text style={s.draftStamp}>DRAFT</Text> : null}

        {/* Cover band */}
        <View style={s.band}>
          <Text style={s.bandKicker}>COURSE ASSESSMENT REPORT</Text>
          <Text style={s.bandTitle}>{c.official_title || c.proposed_title}</Text>
          <Text style={{ fontSize: 9, marginTop: 4 }}>{providerName}</Text>
        </View>

        {/* Decision chip row */}
        <View style={s.chipRow}>
          <Text style={[s.chip, decisionChipStyle]}>{decisionLabel}</Text>
          {c.reps_qual_number ? (
            <Text style={[s.chip, s.chipOk]}>{c.reps_qual_number}</Text>
          ) : null}
          {c.official_level != null ? (
            <Text style={[s.chip, { backgroundColor: "#F1F5F9", color: INK }]}>
              Level {c.official_level}
            </Text>
          ) : null}
          <Text style={[s.chip, { backgroundColor: "#F1F5F9", color: INK }]}>
            Decided {dateOnly(snap.decision_at)}
          </Text>
        </View>

        {/* 1. Cover facts */}
        <Text style={s.h2}>1 · Overview</Text>
        <KV k="Course title (official)" v={c.official_title || c.proposed_title} />
        <KV k="Provider" v={providerName} />
        <KV k="REPS qualification number" v={c.reps_qual_number} />
        <KV k="Decision" v={decisionLabel} />
        <KV k="Decision date" v={dateOnly(snap.decision_at)} />
        <KV k="Reviewer" v={snap.reviewer.display_name || snap.reviewer.email || snap.reviewer.id || "—"} />

        {/* 2. Course specification */}
        <Text style={s.h2}>2 · Course specification</Text>
        <KV k="Level (1–7)" v={c.official_level != null ? `Level ${c.official_level}` : null} />
        <KV
          k="Delivery mode"
          v={c.spec_delivery_mode ? DELIVERY_LABEL[c.spec_delivery_mode] ?? c.spec_delivery_mode : null}
        />
        <KV k="Guided learning hours (GLH)" v={c.spec_guided_learning_hours} />
        <KV k="Total qualification time (TQT)" v={c.spec_total_qualification_time} />
        <KV k="Prerequisites" v={c.spec_prerequisites} />

        <Text style={s.h3}>Who this course is for</Text>
        <Text style={s.p}>{c.spec_who_for || "—"}</Text>

        <Text style={s.h3}>Learning outcomes</Text>
        {c.spec_learning_outcomes && c.spec_learning_outcomes.length > 0 ? (
          <View style={s.ol}>
            {c.spec_learning_outcomes.map((o, i) => (
              <Text key={i} style={s.li}>
                {i + 1}. {o}
              </Text>
            ))}
          </View>
        ) : (
          <Text style={s.p}>—</Text>
        )}

        <Text style={s.h3}>How you'll study</Text>
        <Text style={s.p}>{c.spec_how_youll_study || "—"}</Text>

        <Text style={s.h3}>How you're assessed</Text>
        <Text style={s.p}>{c.spec_how_youre_assessed || "—"}</Text>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text>REPS Course Assessment · Doc {snap.document_id.slice(0, 8)}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>

      <Page size="A4" style={s.page}>
        <Text style={s.wm}>REPS · REGISTER OF EXERCISE PROFESSIONALS</Text>
        {isDraft ? <Text style={s.draftStamp}>DRAFT</Text> : null}

        {/* 3. Level determination */}
        <Text style={s.h2}>3 · Level determination</Text>
        <View style={s.card}>
          <Text style={s.bold}>
            Assigned level: {c.official_level != null ? `Level ${c.official_level}` : "—"}
            {ai.level_confidence ? `  ·  AI confidence: ${ai.level_confidence}` : ""}
          </Text>
          <Text style={[s.p, s.small, { marginTop: 4 }]}>
            {ai.level_rationale ??
              "The AI did not surface a rationale for this level; the admin selected the level manually."}
          </Text>
        </View>

        <Text style={s.h3}>Level rubric applied</Text>
        <Text style={s.li}>1. Prerequisites required — {c.spec_prerequisites || c.proposed_prerequisites || "none stated"}.</Text>
        <Text style={s.li}>
          2. Total qualification time — {c.spec_total_qualification_time ?? c.proposed_total_hours ?? "—"} hours.
        </Text>
        <Text style={s.li}>3. Tutor credential floor — {c.proposed_tutor_credentials ? "declared" : "not declared"}.</Text>
        <Text style={s.li}>4. Learning-outcome verb depth — {c.spec_learning_outcomes?.length ?? 0} formal outcomes.</Text>

        {/* 4. Findings */}
        <Text style={s.h2}>4 · Assessment findings</Text>
        {ai.reviewer_notes ? (
          <View style={s.card}>
            <Text style={s.bold}>Reviewer notes (AI summary)</Text>
            <Text style={[s.p, { marginTop: 3 }]}>{ai.reviewer_notes}</Text>
          </View>
        ) : null}

        <Text style={s.h3}>AI red flags</Text>
        {ai.red_flags.length === 0 ? (
          <Text style={[s.p, s.muted]}>None raised.</Text>
        ) : (
          ai.red_flags.map((f, i) => (
            <Text key={i} style={s.li}>
              • {f}
            </Text>
          ))
        )}

        <Text style={s.h3}>Deterministic checks</Text>
        {ai.deterministic_flags.length === 0 ? (
          <Text style={[s.p, s.muted]}>All deterministic checks passed.</Text>
        ) : (
          ai.deterministic_flags.map((f, i) => (
            <Text key={i} style={s.li}>
              • {f}
            </Text>
          ))
        )}

        {/* 5. Trust context */}
        <Text style={s.h2}>5 · Provider trust context at time of decision</Text>
        <KV k="Provider" v={providerName} />
        <KV
          k="Identity verification"
          v={
            p.trust.identity_verified
              ? `Verified ${p.trust.identity_verified_at ? "on " + dateOnly(p.trust.identity_verified_at) : ""}`
              : "Not verified"
          }
        />
        <KV
          k="Insurance"
          v={
            p.trust.insurance_active
              ? `Active${p.trust.insurance_valid_until ? " until " + dateOnly(p.trust.insurance_valid_until) : ""}`
              : "Not on file"
          }
        />
        <KV k="Domain verified" v={p.trust.domain_verified ? "Yes" : "No"} />
        <KV k="Previously approved REPS courses" v={p.trust.previous_approved_courses} />

        {/* 6. Decision */}
        <Text style={s.h2}>6 · Decision & conditions</Text>
        <View style={s.chipRow}>
          <Text style={[s.chip, decisionChipStyle]}>{decisionLabel}</Text>
        </View>
        {snap.admin_note ? (
          <View style={s.card}>
            <Text style={s.bold}>Admin note</Text>
            <Text style={[s.p, { marginTop: 3 }]}>{snap.admin_note}</Text>
          </View>
        ) : (
          <Text style={[s.p, s.muted]}>No admin note recorded.</Text>
        )}

        {/* 7. Audit trail */}
        <Text style={s.h2}>7 · Audit trail</Text>
        <KV k="Submitted" v={dateTime(snap.audit.submitted_at)} />
        <KV k="AI drafted" v={dateTime(snap.audit.ai_drafted_at)} />
        <KV k="Decision issued" v={dateTime(snap.audit.decided_at)} />
        <KV k="Report generated" v={dateTime(snap.generated_at)} />
        <KV k="Document ID" v={snap.document_id} />

        {/* 8. Methodology */}
        <Text style={s.h2}>8 · Methodology</Text>
        <Text style={s.p}>
          REPS assesses provider-submitted courses against a published rubric spanning prerequisites,
          learning-outcome depth, total qualification time, and tutor credential floor. Every
          submission is AI-drafted against the same schema Ofqual publishes for regulated
          qualifications, then a REPS reviewer edits, verifies, and decides. Deterministic checks
          run alongside the AI to catch logical inconsistencies (e.g. GLH &gt; TQT).
        </Text>
        <Text style={[s.p, s.small, { marginTop: 4 }]}>
          Full methodology: https://repsuk.org/accreditation-methodology
        </Text>

        <View style={s.footer} fixed>
          <Text>REPS Course Assessment · Doc {snap.document_id.slice(0, 8)}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export async function renderCourseAssessmentPdf(
  snap: DecisionSnapshot,
  opts: { isDraft?: boolean } = {},
): Promise<Uint8Array> {
  const buf = await renderToBuffer(
    <CourseAssessmentReport snap={snap} isDraft={Boolean(opts.isDraft)} />,
  );
  // renderToBuffer returns a Node Buffer; convert to Uint8Array so Supabase
  // storage upload works uniformly on Workers.
  return new Uint8Array(buf);
}

// Suppress "Font is used but not defined" warning across cold starts.
void Font;
