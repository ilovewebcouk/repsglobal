/**
 * Cross-check helpers for verification.
 * Pure functions — server- and client-safe.
 */

function normalise(s: string | null | undefined): string {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Dice coefficient on bigrams — fast, no deps, 0..1. */
export function nameSimilarity(a: string | null | undefined, b: string | null | undefined): number {
  const x = normalise(a);
  const y = normalise(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  const bigrams = (s: string) => {
    const out: string[] = [];
    for (let i = 0; i < s.length - 1; i++) out.push(s.slice(i, i + 2));
    return out;
  };
  const xb = bigrams(x);
  const yb = new Map<string, number>();
  for (const g of bigrams(y)) yb.set(g, (yb.get(g) ?? 0) + 1);
  let hits = 0;
  for (const g of xb) {
    const n = yb.get(g) ?? 0;
    if (n > 0) {
      hits++;
      yb.set(g, n - 1);
    }
  }
  return (2 * hits) / (xb.length + bigrams(y).length || 1);
}

export type CheckStatus = "pass" | "warn" | "fail" | "pending" | "skip";

export interface CrossCheck {
  id: string;
  label: string;
  status: CheckStatus;
  detail?: string;
}

export interface CrossCheckInput {
  profileName?: string | null;
  certHolderName?: string | null;
  idDocName?: string | null;
  dobOnDoc?: string | null;
  selfieMatchScore?: number | null;
  livenessPassed?: boolean | null;
  duplicateSubmissionId?: string | null;
  duplicateFileSha?: boolean | null;
  insuranceExpiry?: string | null;
  insuranceCover?: number | null;
  regulatorVerified?: boolean | null;
}

export function INSURANCE_MIN_COVER_GBP() {
  return 1_000_000; // £1m public liability — warn threshold
}

export function runCrossChecks(input: CrossCheckInput): CrossCheck[] {
  const checks: CrossCheck[] = [];

  // Name match
  if (input.certHolderName || input.idDocName) {
    const refs = [input.profileName, input.certHolderName, input.idDocName].filter(Boolean) as string[];
    if (refs.length >= 2) {
      const scores: number[] = [];
      for (let i = 0; i < refs.length; i++)
        for (let j = i + 1; j < refs.length; j++) scores.push(nameSimilarity(refs[i], refs[j]));
      const min = Math.min(...scores);
      checks.push({
        id: "name_match",
        label: "Name match across documents",
        status: min >= 0.85 ? "pass" : min >= 0.65 ? "warn" : "fail",
        detail: `${Math.round(min * 100)}% similarity`,
      });
    } else {
      checks.push({ id: "name_match", label: "Name match across documents", status: "pending" });
    }
  } else {
    checks.push({ id: "name_match", label: "Name match across documents", status: "pending", detail: "Need ID + cert" });
  }

  // DOB plausibility
  if (input.dobOnDoc) {
    const age = (Date.now() - new Date(input.dobOnDoc).getTime()) / (365.25 * 24 * 3600 * 1000);
    if (age >= 18 && age <= 90) checks.push({ id: "dob", label: "Age 18–90", status: "pass", detail: `${Math.floor(age)}y` });
    else checks.push({ id: "dob", label: "Age 18–90", status: "fail", detail: `${Math.floor(age)}y` });
  } else {
    checks.push({ id: "dob", label: "Age plausibility", status: "pending" });
  }

  // Liveness / selfie
  if (input.livenessPassed === true) {
    checks.push({ id: "liveness", label: "Selfie ↔ ID match", status: "pass", detail: input.selfieMatchScore ? `${Math.round((input.selfieMatchScore ?? 0) * 100)}%` : undefined });
  } else if (input.livenessPassed === false) {
    checks.push({ id: "liveness", label: "Selfie ↔ ID match", status: "fail" });
  } else {
    checks.push({ id: "liveness", label: "Selfie ↔ ID match", status: "pending", detail: "Manual review" });
  }

  // Regulator (Ofqual) match
  checks.push({
    id: "regulator",
    label: "Awarding body recognised",
    status: input.regulatorVerified ? "pass" : "warn",
    detail: input.regulatorVerified ? "Ofqual-listed" : "Manual confirmation",
  });

  // Duplicate file detection
  if (input.duplicateFileSha) {
    checks.push({ id: "duplicate", label: "Document fingerprint", status: "fail", detail: "Identical file used elsewhere" });
  } else if (input.duplicateSubmissionId) {
    checks.push({ id: "duplicate", label: "Document fingerprint", status: "warn", detail: "Similar submission seen" });
  } else {
    checks.push({ id: "duplicate", label: "Document fingerprint", status: "pass" });
  }

  // Insurance
  if (input.insuranceExpiry) {
    const expired = new Date(input.insuranceExpiry).getTime() < Date.now();
    const adequate = (input.insuranceCover ?? 0) >= INSURANCE_MIN_COVER_GBP();
    if (expired) checks.push({ id: "insurance", label: "Insurance current", status: "fail", detail: "Expired" });
    else if (!adequate)
      checks.push({ id: "insurance", label: "Insurance cover", status: "warn", detail: `< £${(INSURANCE_MIN_COVER_GBP() / 1_000_000).toFixed(0)}m` });
    else checks.push({ id: "insurance", label: "Insurance current & adequate", status: "pass" });
  } else {
    checks.push({ id: "insurance", label: "Insurance on file", status: "pending", detail: "Required for Pro tier" });
  }

  return checks;
}

export function checksSummary(checks: CrossCheck[]): { pass: number; warn: number; fail: number; pending: number } {
  return checks.reduce(
    (acc, c) => {
      if (c.status === "pass") acc.pass++;
      else if (c.status === "warn") acc.warn++;
      else if (c.status === "fail") acc.fail++;
      else if (c.status === "pending") acc.pending++;
      return acc;
    },
    { pass: 0, warn: 0, fail: 0, pending: 0 },
  );
}

/* -------------------------------------------------------------------------- */
/* Gates engine (Sub-pass 0c)                                                 */
/* Hard gates MUST pass to Approve — reviewer needs a typed override reason   */
/* (stored in verification_decisions.override_reason) to bypass.              */
/* Soft gates are warnings; reviewer may approve without override.            */
/* -------------------------------------------------------------------------- */

export type GateId =
  | "name_match"
  | "ofqual_recognised"
  | "not_expired"
  | "cert_number_present"
  | "no_duplicate_file";

export type SoftGateId =
  | "name_warn"
  | "insurance_missing"
  | "insurance_low_cover"
  | "year_implausible"
  | "duplicate_similar";

export interface Gate {
  id: GateId | SoftGateId;
  label: string;
  passed: boolean;
  detail?: string;
}

export interface GatesResult {
  hardGates: Gate[];
  softGates: Gate[];
  hardPassed: boolean;
  blockingReasons: string[];
  warnings: string[];
}

export interface GatesInput extends CrossCheckInput {
  certNumberPresent?: boolean | null;
  expiryDate?: string | null;
  issueYear?: number | null;
}

export function evaluateGates(input: GatesInput): GatesResult {
  const hard: Gate[] = [];
  const soft: Gate[] = [];

  // Hard 1 — Name match across profile / cert / ID
  const refs = [input.profileName, input.certHolderName, input.idDocName].filter(Boolean) as string[];
  if (refs.length >= 2) {
    const scores: number[] = [];
    for (let i = 0; i < refs.length; i++)
      for (let j = i + 1; j < refs.length; j++) scores.push(nameSimilarity(refs[i], refs[j]));
    const min = Math.min(...scores);
    hard.push({
      id: "name_match",
      label: "Name matches across ID, cert and profile",
      passed: min >= 0.85,
      detail: `${Math.round(min * 100)}% similarity`,
    });
    if (min >= 0.65 && min < 0.85)
      soft.push({ id: "name_warn", label: "Borderline name similarity", passed: false, detail: `${Math.round(min * 100)}%` });
  } else {
    hard.push({
      id: "name_match",
      label: "Name matches across ID, cert and profile",
      passed: false,
      detail: "Missing reference name",
    });
  }

  // Hard 2 — Awarding body recognised (Ofqual)
  hard.push({
    id: "ofqual_recognised",
    label: "Awarding body recognised (Ofqual)",
    passed: !!input.regulatorVerified,
    detail: input.regulatorVerified ? "Ofqual-listed" : "Not on Ofqual register",
  });

  // Hard 3 — Not expired
  if (input.expiryDate) {
    const expired = new Date(input.expiryDate).getTime() < Date.now();
    hard.push({ id: "not_expired", label: "Certificate not expired", passed: !expired, detail: input.expiryDate });
  } else {
    hard.push({ id: "not_expired", label: "Certificate not expired", passed: true, detail: "No expiry" });
  }

  // Hard 4 — Cert number present
  hard.push({
    id: "cert_number_present",
    label: "Certificate number recorded",
    passed: !!input.certNumberPresent,
    detail: input.certNumberPresent ? "Recorded" : "Missing",
  });

  // Hard 5 — File fingerprint unique
  hard.push({
    id: "no_duplicate_file",
    label: "Document fingerprint unique",
    passed: !input.duplicateFileSha,
    detail: input.duplicateFileSha ? "Identical file used elsewhere" : "Unique",
  });

  if (!input.duplicateFileSha && input.duplicateSubmissionId) {
    soft.push({ id: "duplicate_similar", label: "Similar submission seen recently", passed: false });
  }

  // Soft — insurance
  if (input.insuranceExpiry) {
    const expired = new Date(input.insuranceExpiry).getTime() < Date.now();
    const adequate = (input.insuranceCover ?? 0) >= INSURANCE_MIN_COVER_GBP();
    if (expired) soft.push({ id: "insurance_missing", label: "Insurance expired", passed: false, detail: input.insuranceExpiry });
    else if (!adequate)
      soft.push({
        id: "insurance_low_cover",
        label: `Insurance below £${(INSURANCE_MIN_COVER_GBP() / 1_000_000).toFixed(0)}m cover`,
        passed: false,
        detail: `£${(input.insuranceCover ?? 0).toLocaleString()}`,
      });
  } else {
    soft.push({
      id: "insurance_missing",
      label: "Insurance missing (Pro tier needs it)",
      passed: false,
      detail: "Verified tier OK without",
    });
  }

  // Soft — year plausibility
  if (input.issueYear != null) {
    const now = new Date().getFullYear();
    if (input.issueYear < 1990 || input.issueYear > now + 1)
      soft.push({ id: "year_implausible", label: "Issue year looks wrong", passed: false, detail: String(input.issueYear) });
  }

  const hardPassed = hard.every((g) => g.passed);
  return {
    hardGates: hard,
    softGates: soft,
    hardPassed,
    blockingReasons: hard.filter((g) => !g.passed).map((g) => g.label),
    warnings: soft.map((g) => g.label),
  };
}
