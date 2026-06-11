import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, FileText, Loader2, ShieldCheck, Upload, X } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RepsWordmark } from "@/components/brand/RepsWordmark";
import { supabase } from "@/integrations/supabase/client";
import {
  myVerificationSubmissions,
  submitVerification,
} from "@/lib/verification/verification.functions";

export const Route = createFileRoute("/_authenticated/dashboard_/verification")({
  head: () => ({ meta: [{ title: "Submit your credentials — REPS" }] }),
  component: VerificationPage,
});

type UploadedDoc = { path: string; name: string; size: number };

function VerificationPage() {
  const qc = useQueryClient();
  const fetchMine = useServerFn(myVerificationSubmissions);
  const doSubmit = useServerFn(submitVerification);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [awardingBody, setAwardingBody] = useState("");
  const [qualification, setQualification] = useState("");
  const [year, setYear] = useState<string>("");
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submissions = useQuery({
    queryKey: ["my-verification-submissions"],
    queryFn: () => fetchMine(),
  });

  const submitMutation = useMutation({
    mutationFn: async () =>
      doSubmit({
        data: {
          awarding_body: awardingBody.trim(),
          qualification: qualification.trim(),
          year: year ? parseInt(year, 10) : null,
          doc_paths: docs.map((d) => d.path),
        },
      }),
    onSuccess: () => {
      setAwardingBody("");
      setQualification("");
      setYear("");
      setDocs([]);
      qc.invalidateQueries({ queryKey: ["my-verification-submissions"] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Submission failed"),
  });

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not signed in");

      const next: UploadedDoc[] = [];
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`${file.name} is over 10MB`);
        }
        const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${uid}/${crypto.randomUUID()}-${safe}`;
        const { error: upErr } = await supabase.storage
          .from("verification-docs")
          .upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        next.push({ path, name: file.name, size: file.size });
      }
      setDocs((prev) => [...prev, ...next]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeDoc = async (doc: UploadedDoc) => {
    setDocs((prev) => prev.filter((d) => d.path !== doc.path));
    void supabase.storage.from("verification-docs").remove([doc.path]);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (docs.length === 0) {
      setError("Please upload at least one document");
      return;
    }
    submitMutation.mutate();
  };

  const statusBadge = (s: string) => {
    if (s === "approved")
      return <Badge className="border-emerald-400/30 bg-emerald-500/15 text-emerald-300">Approved</Badge>;
    if (s === "rejected")
      return <Badge className="border-red-400/30 bg-red-500/15 text-red-300">Rejected</Badge>;
    if (s === "changes_requested")
      return <Badge className="border-reps-orange/40 bg-reps-orange/10 text-reps-orange">Changes requested</Badge>;
    return <Badge className="border-white/15 bg-white/10 text-white/75">In review</Badge>;
  };

  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      <header className="border-b border-reps-border/40">
        <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3">
            <RepsWordmark className="h-[24px] text-white" />
          </Link>
          <Link to="/dashboard" className="text-sm text-white/60 hover:text-white">
            Back to dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1100px] gap-8 px-6 py-12 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-8">
            <Badge className="mb-3 border-reps-orange/40 bg-reps-orange/10 text-reps-orange">
              <ShieldCheck className="size-3.5" /> Verification
            </Badge>
            <h1 className="font-display text-[34px] leading-[1.05] text-white">
              Submit your credentials
            </h1>
            <p className="mt-3 text-[15px] text-white/70">
              Upload your qualification, insurance, and (where relevant) DBS check.
              Our admin team reviews within 24 hours.
            </p>
          </div>

          <Card className="rounded-[18px] border-reps-border bg-reps-panel/20">
            <CardContent className="p-7">
              <form onSubmit={onSubmit} className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <Label htmlFor="ab">Awarding body</Label>
                    <Input
                      id="ab"
                      placeholder="e.g. Ofqual-regulated provider"
                      value={awardingBody}
                      onChange={(e) => setAwardingBody(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="yr">Year awarded</Label>
                    <Input
                      id="yr"
                      type="number"
                      placeholder="2024"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="q">Qualification</Label>
                  <Input
                    id="q"
                    placeholder="e.g. Level 3 Certificate in Personal Training"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label>Documents (PDF/JPG/PNG, max 10MB each)</Label>
                  <div className="mt-2 rounded-[12px] border border-dashed border-reps-border bg-reps-ink/40 p-5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => handleFiles(e.target.files)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="size-4 animate-spin" /> Uploading…
                        </>
                      ) : (
                        <>
                          <Upload className="size-4" /> Add file
                        </>
                      )}
                    </Button>

                    {docs.length > 0 && (
                      <ul className="mt-4 space-y-2">
                        {docs.map((d) => (
                          <li
                            key={d.path}
                            className="flex items-center justify-between rounded-[10px] bg-reps-panel/40 px-3 py-2 text-sm"
                          >
                            <span className="flex items-center gap-2 text-white/80">
                              <FileText className="size-4" /> {d.name}
                              <span className="text-white/45">
                                ({Math.round(d.size / 1024)} KB)
                              </span>
                            </span>
                            <button
                              type="button"
                              onClick={() => removeDoc(d)}
                              className="text-white/45 hover:text-white"
                            >
                              <X className="size-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="rounded-[10px] border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={submitMutation.isPending || uploading}
                  className="bg-reps-orange text-reps-ink hover:bg-reps-orange/90"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Submitting…
                    </>
                  ) : (
                    <>
                      <BadgeCheck className="size-4" /> Submit for review
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <aside>
          <h2 className="font-display text-[18px] text-white">Your submissions</h2>
          <p className="mt-1 text-[13px] text-white/55">Most recent first.</p>
          <div className="mt-4 space-y-3">
            {submissions.isLoading && (
              <div className="text-sm text-white/55">Loading…</div>
            )}
            {submissions.data?.length === 0 && (
              <div className="rounded-[12px] border border-reps-border bg-reps-panel/15 p-4 text-sm text-white/60">
                No submissions yet.
              </div>
            )}
            {submissions.data?.map((s) => (
              <div
                key={s.id}
                className="rounded-[12px] border border-reps-border bg-reps-panel/15 p-4 text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-white">{s.qualification}</span>
                  {statusBadge(s.status)}
                </div>
                <div className="mt-1 text-[12px] text-white/55">
                  {s.awarding_body}
                  {s.year ? ` · ${s.year}` : ""}
                </div>
                {s.admin_note && (
                  <p className="mt-2 text-[12px] text-white/70">{s.admin_note}</p>
                )}
              </div>
            ))}
          </div>
        </aside>
      </main>
    </div>
  );
}
