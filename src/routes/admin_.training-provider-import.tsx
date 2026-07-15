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

function TrainingProviderImportPage() {
  const run = useServerFn(importTrainingProviders);
  const preview = useServerFn(previewProviderPortalEmail);
  const [csv, setCsv] = useState("");
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

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => execute(false)}
            disabled={!canRun}
          >
            {busy ? "Running…" : "Dry run (no changes)"}
          </Button>
          <Button onClick={() => execute(true)} disabled={!canRun}>
            {busy ? "Importing…" : `Import ${valid.length} provider${valid.length === 1 ? "" : "s"}`}
          </Button>
        </div>
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
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Provider</th>
                <th className="px-3 py-2">Stripe customer</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Detail</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-white/10">
                  <td className="px-3 py-2">{r.email}</td>
                  <td className="px-3 py-2">{r.provider_name}</td>
                  <td className="px-3 py-2 font-mono">{r.stripe_customer_id}</td>
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
                  <td className="px-3 py-2 text-white/75">{r.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}
