#!/usr/bin/env node
/**
 * REPs marketing-primitives drift audit.
 *
 * Scans marketing surface routes + shared marketing/features components for
 * patterns that bypass the approved primitives.
 *
 * Exit 1 on HARD violations, 0 otherwise (WARN still printed).
 *
 * See src/components/marketing/README.md for the rules.
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();

const ROUTE_GLOBS = [
  { dir: "src/routes", match: (f) => /^for-professionals.*\.tsx$/.test(f) },
  { dir: "src/routes", match: (f) => /^features.*\.tsx$/.test(f) },
  { dir: "src/routes", match: (f) => /^cpd.*\.tsx$/.test(f) },
  { dir: "src/routes", match: (f) => /^compare.*\.tsx$/.test(f) },
];

const COMPONENT_DIRS = [
  "src/components/marketing",
  "src/components/features",
];

const HEADING_SIZE_RE = /text-\[(32|36|40|44|48)px\]/;
const HEADING_FONT_RE = /font-(display|heading)\b[^"`']*text-\[(2[8-9]|[3-9]\d|1\d{2})px\]|text-\[(2[8-9]|[3-9]\d|1\d{2})px\][^"`']*font-(display|heading)\b/;

const BANNED_COPY = [
  { pat: /15%\s*booking\s*fee/i, msg: "banned pricing claim: '15% booking fee'" },
  { pat: /booking\s*commission/i, msg: "banned pricing claim: 'booking commission'" },
  { pat: /one\s*flat\s*plan/i, msg: "banned pricing copy: 'one flat plan'" },
  { pat: /single\s*flat\s*plan/i, msg: "banned pricing copy: 'single flat plan'" },
  { pat: /£\s*29\s*Pro\b/i, msg: "retired pricing: '£29 Pro' (tier removed)" },
  { pat: /Free\s*Profile\b/, msg: "retired pricing card: 'Free Profile' (free tier removed)" },
  { pat: /Stripe\s+(included|surcharge|fees\s+included)/i, msg: "banned Stripe-fee copy" },
  { pat: /\blegally\s+scraped\b/i, msg: "banned phrase: use 'publicly available information'" },
  { pat: /\bCIMSPA\b/, msg: "banned org name: use 'Ofqual-regulated' / 'recognised awarding body'" },
];

const PLACEHOLDER_RE = /(?:>\s*|"\s*|'\s*|`\s*)(TODO|Placeholder|Coming\s*soon|Lorem\s+ipsum)\b/i;

const PRIMITIVE_NAMES = new Set([
  "SectionHeading",
  "BlockHeading",
  "SectionEyebrow",
  "SectionHeader",
  "MarketingHeroEyebrow",
  "ProductBlock",
  "MarketingFaq",
  "FinalCta",
  "VerifySteps",
  "RegisterProof",
  "ReplacedStackBoard",
  "PillarTabs",
  "ComparisonStrip",
  "TrainerToPlatformComposite",
  "HeroDeviceCluster",
  "UseCaseTriad",
  "WeekWithReps",
  "AiCommandCentreMock",
  "PressMarquee",
]);

const findings = { hard: [], warn: [] };

function listRoutes() {
  const out = [];
  for (const { dir, match } of ROUTE_GLOBS) {
    const abs = join(ROOT, dir);
    if (!existsSync(abs)) continue;
    for (const f of readdirSync(abs)) {
      if (match(f) && statSync(join(abs, f)).isFile()) {
        out.push(join(dir, f));
      }
    }
  }
  return [...new Set(out)];
}

function walkComponents() {
  const out = [];
  for (const dir of COMPONENT_DIRS) {
    const abs = join(ROOT, dir);
    if (!existsSync(abs)) continue;
    const stack = [abs];
    while (stack.length) {
      const cur = stack.pop();
      for (const entry of readdirSync(cur)) {
        const p = join(cur, entry);
        const s = statSync(p);
        if (s.isDirectory()) stack.push(p);
        else if (entry.endsWith(".tsx")) out.push(relative(ROOT, p));
      }
    }
  }
  return out;
}

function scan(file, { isRoute }) {
  const text = readFileSync(join(ROOT, file), "utf8");
  const lines = text.split("\n");

  // Banned copy — always HARD, all files.
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const { pat, msg } of BANNED_COPY) {
      if (pat.test(line)) {
        findings.hard.push({ file, line: i + 1, snippet: line.trim().slice(0, 140), msg, fix: "remove or replace per memory" });
      }
    }
  }

  // Heading-size drift.
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const hit = HEADING_FONT_RE.test(line) || (HEADING_SIZE_RE.test(line) && /font-(display|heading)/.test(line));
    if (!hit) continue;
    const entry = {
      file,
      line: i + 1,
      snippet: line.trim().slice(0, 140),
      msg: "hand-rolled marketing heading (font-display/heading + arbitrary size)",
      fix: "use <SectionHeading /> for H2 or <BlockHeading /> for in-block H3",
    };
    if (isRoute) findings.hard.push(entry);
    else findings.warn.push(entry);
  }

  // Placeholder copy — HARD in route files only.
  if (isRoute) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // skip code-only TODO comments
      if (/^\s*\/\//.test(line)) continue;
      if (PLACEHOLDER_RE.test(line)) {
        findings.hard.push({
          file,
          line: i + 1,
          snippet: line.trim().slice(0, 140),
          msg: "placeholder copy in route file",
          fix: "replace with real content or remove",
        });
      }
    }
  }

  // Soft: route file has <h2>/<h3> JSX without importing a heading primitive.
  if (isRoute) {
    const hasH2 = /<h2\b/.test(text);
    const hasH3 = /<h3\b/.test(text);
    const importsHeading =
      /\bSectionHeading\b/.test(text) || /\bSectionHeader\b/.test(text);
    const importsBlock = /\bBlockHeading\b/.test(text);
    if (hasH2 && !importsHeading) {
      findings.warn.push({
        file,
        line: 0,
        snippet: "<h2> present without SectionHeading import",
        msg: "raw <h2> in route file",
        fix: "use <SectionHeading /> via <SectionHeader />",
      });
    }
    if (hasH3 && !importsBlock) {
      findings.warn.push({
        file,
        line: 0,
        snippet: "<h3> present without BlockHeading import",
        msg: "raw <h3> in route file",
        fix: "use <BlockHeading /> (or pass heading prop to <ProductBlock />)",
      });
    }
  }
}

function fmt(arr, label) {
  if (!arr.length) return;
  console.log(`\n${label} (${arr.length})`);
  for (const f of arr) {
    const loc = f.line ? `${f.file}:${f.line}` : f.file;
    console.log(`  [${label}] ${loc}`);
    console.log(`         ${f.msg}`);
    if (f.snippet) console.log(`         > ${f.snippet}`);
    console.log(`         → ${f.fix}`);
  }
}

const routes = listRoutes();
const components = walkComponents();

for (const f of routes) scan(f, { isRoute: true });
for (const f of components) scan(f, { isRoute: false });

console.log(`Scanned ${routes.length} route files + ${components.length} component files.`);
fmt(findings.hard, "HARD");
fmt(findings.warn, "WARN");

console.log(`\nSummary: ${findings.hard.length} hard, ${findings.warn.length} warn.`);
if (findings.hard.length > 0) {
  console.log("FAIL — fix hard violations before shipping.");
  process.exit(1);
}
console.log("OK");
