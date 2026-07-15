import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { requireRole } from "@/lib/route-gates";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, CheckCircle2, Eye } from "lucide-react";
import {
  importTrainingProviders,
  type ImportRowResult,
  type ImportSummary,
} from "@/lib/admin/import-training-providers.functions";
import { previewProviderPortalEmail } from "@/lib/admin/preview-provider-email.functions";


export const Route = createFileRoute("/admin_/training-provider-import")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  head: () => ({
    meta: [
      { name: "robots", content: "noindex,nofollow" },
      { title: "Training-provider import — REPs Admin" },
    ],
  }),
  component: TrainingProviderImportPage,
});

type ParsedRow = {
  ok: boolean;
  raw: string;
  email?: string;
  stripe_customer_id?: string;
  provider_name?: string;
  website?: string;
  error?: string;
};

const HEADER_TOKENS = new Set([
  "email",
  "stripe_customer_id",
  "customer_id",
  "provider_name",
  "name",
  "website",
]);

function splitCsvLine(line: string): string[] {
  // minimal CSV splitter: supports quoted fields with commas inside.
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else {
      if (c === ",") {
        out.push(cur);
        cur = "";
      } else if (c === '"') {
        inQuotes = true;
      } else {
        cur += c;
      }
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function parseCsv(text: string): ParsedRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  if (lines.length === 0) return [];

  // Sniff header row
  const firstCells = splitCsvLine(lines[0]).map((c) => c.toLowerCase());
  const hasHeader = firstCells.some((c) => HEADER_TOKENS.has(c));
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines.map<ParsedRow>((raw) => {
    const cells = splitCsvLine(raw);
    const [email, cust, name, website] = cells;
    if (!email || !cust || !name) {
      return {
        ok: false,
        raw,
        error: "Need at least: email, stripe_customer_id, provider_name",
      };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false, raw, error: `Invalid email: ${email}` };
    }
    if (!/^cus_[A-Za-z0-9]+$/.test(cust)) {
      return {
        ok: false,
        raw,
        error: `Invalid Stripe customer id: ${cust} (should look like cus_...)`,
      };
    }
    return {
      ok: true,
      raw,
      email: email.toLowerCase(),
      stripe_customer_id: cust,
      provider_name: name,
      website: website || undefined,
    };
  });
}

type RenewalAction = NonNullable<ImportRowResult["stripe_audit"]>["renewal_action"] | undefined;

function renewalPlanLabel(a: RenewalAction): string {
  switch (a) {
    case "keep_current_price":
      return "Keep current price";
    case "already_at_cap":
      return "Already £479";
    case "cap_to_479_at_renewal":
      return "Cap to £479 at renewal";
    case "no_active_sub":
      return "No active sub";
    case "non_gbp":
      return "Non-GBP — review";
    case "non_annual":
      return "Non-annual — review";
    case "audit_error":
      return "Audit error";
    default:
      return "—";
  }
}

function renewalPlanClass(a: RenewalAction): string {
  switch (a) {
    case "cap_to_479_at_renewal":
      return "text-orange-300";
    case "keep_current_price":
    case "already_at_cap":
      return "text-emerald-300";
    case "no_active_sub":
    case "non_gbp":
    case "non_annual":
    case "audit_error":
      return "text-red-300";
    default:
      return "text-white/70";
  }
}

/**
 * Prefilled CSV of the 24 existing paying training providers (loaded from
 * `training_providers.numbers`). Admins can edit or clear this before running.
 */
const PREFILL_CSV = `email,stripe_customer_id,provider_name,website
charlottesaunders2016@googlemail.com,cus_USZd4mtxruqXGB,Charlotte Saunders Limited,https://www.instagram.com/charlottesaundersx
info@zerogravitypilatestraininglab.co.uk,cus_UR4xHlMGemLHra,Power Health and Fitness Ltd,http://www.zerogravitypilates.co.uk
info@barrecertification.com,cus_UPnBAE1DZHYkVE,"Discover True You, Inc",https://barrecertification.com/
lvlupfitness.pk@gmail.com,cus_TkvnOYI1KZNUOF,Level Up Fitness,https://www.lvl-upfitness.com
gemmahuston@gmail.com,cus_TfD7d6sZaszeUp,Core By Gemma,https://www.corebygemma.com
lara@bodybylara.co.uk,cus_TdcZq1I4VQbugF,Bodybylaracore LLP,https://www.bodybylaracore.com
info@balancedconnection.co.uk,cus_TXRG9DBbqbSkAR,Core reformer ltd,http://www.balancedconnection.co.uk
sally@mkreformed.co.uk,cus_TXR92RemhbCWCf,Mkhealthhub Solihull,https://mkreformed.co.uk
rosarialp@hotmail.com,cus_THdW0JHN9IZudQ,Reformer Fitness Academy,https://se9pilates.co.uk/reformer-pilates-academy/
rod@bodbyrod.com,cus_TFMUz1YB2TXguC,BodbyRod,http://www.bodbyrod.com
askcoachx@gmail.com,cus_TAWjZ5R9oBzCUT,CoachX by ABS,https://www.abswellnessclub.com
emma@emmanewhamfitness.com,cus_SYAiBukyrsTPaI,Pilates Union,https://www.pilatesunion.com/
hussain.ali@aikaro.co.uk,cus_Rt0T8yUXoA6BCc,Aikaro Sports Academy,https://aikaro.co.uk/
catie@barreseries.com,cus_TZzjq5oWd7pqz2,Barre Series,https://www.barreseries.com
andy.gill@ethicsleisure.com,cus_RCSV3cBOpjNssb,Ethics Leisure,http://www.totalgymshop.co.uk
jonathon@fitnesseducationonline.com.au,cus_T6az9cO6UUiEsL,Fitness Education Online,https://fitnesseducationonline.co.uk
info@stormfitnessacademy.co.uk,cus_PKFfkS4BsmFl4b,Storm Fitness Academy,https://www.stormfitnessacademy.co.uk
karwanmoh1995@gmail.com,cus_PM8uDZyZP6chGm,Fitness Global Academy,https://fitnessglobalacademy.com/
nyamath@sifa-fitness.com,cus_Qc6ZavuZOp8MOp,SIFA,https://sifa-fitness.com/
accounts@apeccourses.com,cus_QD5LgkMdgkTSsA,APEC Courses Ireland Ltd.,http://www.apeccourses.com
claudia@bellydancebodymind.com,cus_PU0qwZD0uL8KNO,Dance Body Mind,https://www.bellydancebodymind.com/
info@athleticum.co.uk,cus_QASk2eQofTc8eU,Athleticum (Morelli Enterprises Ltd),https://www.athleticum.co.uk/
steele.williams@train.fitness,cus_Q8DO6LgkZUNc15,Campus Learning Limited,https://train.fitness
info@diversetrainers.co.uk,cus_Pt0nD0Q4QyWsyL,Diverse Trainers,https://www.diversetrainers.co.uk/`;

function TrainingProviderImportPage() {
  const run = useServerFn(importTrainingProviders);
  const preview = useServerFn(previewProviderPortalEmail);
  const [csv, setCsv] = useState(PREFILL_CSV);

  const [busy, setBusy] = useState(false);
  const [environment, setEnvironment] = useState<"live" | "sandbox">("live");
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [rows, setRows] = useState<ImportRowResult[] | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [previewSubject, setPreviewSubject] = useState<string>("");
  const [previewFor, setPreviewFor] = useState<string>("");

  async function openPreview(r: ImportRowResult) {
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewFor(`${r.provider_name} · ${r.email}`);
    setPreviewHtml("");
    setPreviewSubject("");
    try {
      const res = (await preview({
        data: {
          provider_name: r.provider_name,
          email: r.email,
          already_registered:
            r.action === "would_link_existing" || r.action === "linked_existing",
        },
      })) as { subject: string; html: string };
      setPreviewSubject(res.subject);
      setPreviewHtml(res.html);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Preview failed");
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  }


  const parsed = useMemo(() => parseCsv(csv), [csv]);
  const valid = parsed.filter((p) => p.ok);
  const invalid = parsed.filter((p) => !p.ok);
  const canRun = valid.length > 0 && invalid.length === 0 && !busy;

  async function execute(commit: boolean) {
    if (valid.length === 0) return;
    setBusy(true);
    setSummary(null);
    setRows(null);
    try {
      const res = (await run({
        data: {
          commit,
          environment,
          rows: valid.map((v) => ({
            email: v.email!,
            stripe_customer_id: v.stripe_customer_id!,
            provider_name: v.provider_name!,
            website: v.website ?? null,
          })),
        },
      })) as { summary: ImportSummary; results: ImportRowResult[] };

      setSummary(res.summary);
      setRows(res.results);
      toast.success(
        commit
          ? `Import complete: ${res.summary.created} created, ${res.summary.linked_existing} linked, ${res.summary.errors} errors`
          : `Dry run complete: ${res.summary.total} rows checked`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Run failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 text-white">
      <h1 className="text-2xl font-semibold">Bulk import training providers</h1>
      <p className="mt-2 text-sm text-white/70">
        Paste one row per line as{" "}
        <code className="rounded bg-white/10 px-1.5 py-0.5 text-white/90">
          email, stripe_customer_id, provider_name, website
        </code>
        . A header row is optional. Website is optional. Each row creates (or links) a training
        provider, sets the Stripe customer id on their subscription, and sends the branded
        &ldquo;Portal is live&rdquo; email with a password-set link when a new account is created.
        Verified provider status still requires full REPS provider verification &mdash; this
        importer does not bypass it.
      </p>

      <section className="mt-6">
        <label htmlFor="csv" className="text-sm font-medium text-white">
          CSV input
        </label>
        <Textarea
          id="csv"
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          rows={10}
          placeholder={`email,stripe_customer_id,provider_name,website\nalex@example.com,cus_ABCDEF,Example Fitness Academy,https://example.com`}
          className="mt-2 min-h-48 font-mono text-xs"
        />

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <Badge variant="outline" className="border-white/20 text-white/80">
            {parsed.length} row{parsed.length === 1 ? "" : "s"}
          </Badge>
          {valid.length > 0 && (
            <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
              <CheckCircle2 className="mr-1 size-3.5" /> {valid.length} valid
            </Badge>
          )}
          {invalid.length > 0 && (
            <Badge className="bg-red-500/15 text-red-300 border border-red-400/30">
              <AlertCircle className="mr-1 size-3.5" /> {invalid.length} invalid
            </Badge>
          )}
        </div>

        {invalid.length > 0 && (
          <div className="mt-3 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-xs text-red-100">
            <div className="mb-2 font-medium">Fix these before running:</div>
            <ul className="space-y-1">
              {invalid.map((p, i) => (
                <li key={i} className="font-mono">
                  <span className="text-red-300">{p.error}</span>{" "}
                  <span className="text-red-100/70">— {p.raw}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-white/60">Stripe environment:</span>
            <div className="inline-flex overflow-hidden rounded-md border border-white/15">
              {(["live", "sandbox"] as const).map((env) => (
                <button
                  key={env}
                  type="button"
                  onClick={() => setEnvironment(env)}
                  className={`px-3 py-1.5 font-medium transition ${
                    environment === env
                      ? env === "live"
                        ? "bg-red-500/25 text-red-100"
                        : "bg-sky-500/25 text-sky-100"
                      : "bg-transparent text-white/70 hover:bg-white/5"
                  }`}
                >
                  {env}
                </button>
              ))}
            </div>
          </div>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={() => execute(false)} disabled={!canRun}>
              {busy ? "Running…" : "Dry run (no changes)"}
            </Button>
            <Button onClick={() => execute(true)} disabled={!canRun}>
              {busy ? "Importing…" : `Import ${valid.length} provider${valid.length === 1 ? "" : "s"}`}
            </Button>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-white/50">
          Renewal-price rule: providers keep their existing annual price if it&rsquo;s £479 or
          less. Anyone paying more will be capped to £479 <strong>at their next renewal</strong>{" "}
          — no immediate charges, no proration. Rows with no active subscription are flagged and
          the email is skipped.
        </p>
      </section>

      {summary && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">
            {summary.dry_run ? "Dry-run summary" : "Import summary"}
          </h2>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <Badge variant="outline" className="border-white/20 text-white/80">
              Total: {summary.total}
            </Badge>
            <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
              {summary.dry_run ? "Would create" : "Created"}: {summary.created}
            </Badge>
            <Badge className="bg-sky-500/15 text-sky-200 border border-sky-400/30">
              {summary.dry_run ? "Would link" : "Linked existing"}: {summary.linked_existing}
            </Badge>
            {summary.errors > 0 && (
              <Badge className="bg-red-500/15 text-red-300 border border-red-400/30">
                Errors: {summary.errors}
              </Badge>
            )}
          </div>
        </section>
      )}

      {rows && (
        <section className="mt-4 overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/15 bg-white/5 text-left text-white/80">
                <th className="px-3 py-2">Provider</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Current price</th>
                <th className="px-3 py-2">Renewal plan</th>
                <th className="px-3 py-2">Detail</th>
                <th className="px-3 py-2">Email</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const audit = r.stripe_audit;
                const current =
                  audit?.unit_amount_pence != null
                    ? `£${(audit.unit_amount_pence / 100).toFixed(2)}/${audit.interval ?? "?"}`
                    : audit?.renewal_action === "no_active_sub"
                    ? "—"
                    : "?";
                const planLabel = renewalPlanLabel(audit?.renewal_action);
                const planClass = renewalPlanClass(audit?.renewal_action);
                return (
                  <tr key={i} className="border-b border-white/10 align-top">
                    <td className="px-3 py-2 font-medium">{r.provider_name}</td>
                    <td className="px-3 py-2">{r.email}</td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          r.action === "error"
                            ? "text-red-300"
                            : r.action === "created" || r.action === "would_create"
                            ? "text-emerald-300"
                            : r.action === "linked_existing" || r.action === "would_link_existing"
                            ? "text-sky-300"
                            : "text-white/80"
                        }
                      >
                        {r.action.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-white/85">{current}</td>
                    <td className="px-3 py-2">
                      <span className={planClass}>{planLabel}</span>
                    </td>
                    <td className="px-3 py-2 text-white/70">{r.detail}</td>
                    <td className="px-3 py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => openPreview(r)}
                      >
                        <Eye className="mr-1 size-3.5" /> Preview
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-sm">
              Email preview — {previewFor}
            </DialogTitle>
          </DialogHeader>
          {previewSubject && (
            <div className="text-xs text-white/70">
              <span className="text-white/50">Subject:</span> {previewSubject}
            </div>
          )}
          <div className="mt-2 h-[70vh] w-full overflow-hidden rounded-md border border-white/10 bg-white">
            {previewLoading ? (
              <div className="grid h-full place-items-center text-sm text-black/60">
                Rendering…
              </div>
            ) : (
              <iframe
                title="Email preview"
                srcDoc={previewHtml}
                className="h-full w-full"
                sandbox=""
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );

}
