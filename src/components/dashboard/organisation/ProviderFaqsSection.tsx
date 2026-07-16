// Provider FAQ management for /dashboard/profile.
//
// Independent from the profile-page "Submit for review" flow — FAQs
// are provider-owned public copy, not admin-approved identity data,
// so publish/hide happens immediately when the provider clicks.
import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Check,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import { PPanel } from "@/components/dashboard/primitives";
import {
  listMyProviderFaqs,
  generateProviderFaqs,
  upsertProviderFaq,
  setProviderFaqStatus,
  deleteProviderFaq,
  type ProviderFaqDTO,
} from "@/lib/provider-faqs/provider-faqs.functions";

const inputCls =
  "h-10 w-full rounded-[12px] border border-reps-border bg-reps-ink px-3 text-[13px] text-white placeholder:text-white/35 focus:border-white/25 focus:outline-none";
const textareaCls =
  "min-h-[120px] w-full rounded-[12px] border border-reps-border bg-reps-ink px-3 py-2.5 text-[13px] leading-relaxed text-white placeholder:text-white/35 focus:border-white/25 focus:outline-none";

type EditorState =
  | { open: false }
  | { open: true; id: string | null; question: string; answer: string };

export function ProviderFaqsSection() {
  const qc = useQueryClient();
  const fetchList = useServerFn(listMyProviderFaqs);
  const runGenerate = useServerFn(generateProviderFaqs);
  const runUpsert = useServerFn(upsertProviderFaq);
  const runStatus = useServerFn(setProviderFaqStatus);
  const runDelete = useServerFn(deleteProviderFaq);

  const { data, isLoading } = useQuery({
    queryKey: ["my-provider-faqs"],
    queryFn: () => fetchList(),
  });

  const faqs = data?.faqs ?? [];
  const maxRows = data?.maxRows ?? 8;
  const maxPublic = data?.maxPublic ?? 5;
  const publishedCount = faqs.filter((f) => f.status === "published").length;
  const atCap = faqs.length >= maxRows;

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["my-provider-faqs"] });

  const genMut = useMutation({
    mutationFn: () => runGenerate(),
    onSuccess: (res) => {
      toast.success(`Drafted ${res.inserted} FAQ${res.inserted === 1 ? "" : "s"}. Review and publish below.`);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message || "Couldn't draft FAQs"),
  });

  const upsertMut = useMutation({
    mutationFn: (input: { id: string | null; question: string; answer: string }) =>
      runUpsert({ data: input }),
    onSuccess: () => {
      toast.success("Saved.");
      setEditor({ open: false });
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message || "Couldn't save"),
  });

  const statusMut = useMutation({
    mutationFn: (input: { id: string; status: ProviderFaqDTO["status"] }) =>
      runStatus({ data: input }),
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message || "Couldn't update status"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => runDelete({ data: { id } }),
    onSuccess: () => {
      toast.success("Deleted.");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message || "Couldn't delete"),
  });

  const [editor, setEditor] = React.useState<EditorState>({ open: false });

  const openAdd = () =>
    setEditor({ open: true, id: null, question: "", answer: "" });
  const openEdit = (f: ProviderFaqDTO) =>
    setEditor({ open: true, id: f.id, question: f.question, answer: f.answer });

  return (
    <PPanel>
      <div className="border-b border-reps-border px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-[14px] font-semibold text-white">
              Frequently Asked Questions
            </h3>
            <p className="mt-0.5 text-[12px] text-white/55">
              Up to {maxPublic} published FAQs appear on your public page. We can
              draft suggestions grounded in your approved qualifications and
              courses — nothing goes public until you approve it.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={openAdd}
              disabled={atCap}
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[13px] font-medium text-white transition-colors hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" /> Add manually
            </button>
            <button
              type="button"
              onClick={() => genMut.mutate()}
              disabled={genMut.isPending || atCap}
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-reps-orange px-3 text-[13px] font-semibold text-white transition-colors hover:bg-reps-orange/90 disabled:cursor-not-allowed disabled:opacity-60"
              title={
                atCap
                  ? `You've hit the ${maxRows}-FAQ cap. Delete or hide one first.`
                  : undefined
              }
            >
              {genMut.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {faqs.length === 0 ? "Generate 5 suggested FAQs" : "Suggest more"}
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 py-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-[12.5px] text-white/50">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading FAQs…
          </div>
        ) : faqs.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-white/10 bg-reps-ink/40 p-5 text-center">
            <p className="text-[13px] font-medium text-white">
              No FAQs yet.
            </p>
            <p className="mx-auto mt-1 max-w-md text-[12px] text-white/55">
              Click <strong className="text-white/80">Generate 5 suggested FAQs</strong> and
              we&apos;ll draft real questions from your approved qualifications and
              courses. You review and publish each one.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center gap-3 text-[12px] text-white/55">
              <span>
                <strong className="text-white/85">{publishedCount}</strong> of{" "}
                {maxPublic} published
              </span>
              {publishedCount >= maxPublic ? (
                <span className="rounded-[6px] border border-amber-400/25 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-200">
                  Publish cap reached
                </span>
              ) : null}
            </div>
            <ul className="flex flex-col gap-2">
              {faqs.map((f) => (
                <FaqRow
                  key={f.id}
                  faq={f}
                  publishBlocked={
                    f.status !== "published" && publishedCount >= maxPublic
                  }
                  busy={
                    statusMut.isPending || deleteMut.isPending
                  }
                  onEdit={() => openEdit(f)}
                  onPublish={() =>
                    statusMut.mutate({ id: f.id, status: "published" })
                  }
                  onHide={() =>
                    statusMut.mutate({ id: f.id, status: "hidden" })
                  }
                  onUnhide={() =>
                    statusMut.mutate({ id: f.id, status: "draft" })
                  }
                  onDelete={() => {
                    if (
                      window.confirm("Delete this FAQ? This cannot be undone.")
                    )
                      deleteMut.mutate(f.id);
                  }}
                />
              ))}
            </ul>
          </>
        )}
      </div>

      {editor.open ? (
        <FaqEditor
          value={editor}
          saving={upsertMut.isPending}
          onCancel={() => setEditor({ open: false })}
          onSave={(q, a) =>
            upsertMut.mutate({ id: editor.id, question: q, answer: a })
          }
        />
      ) : null}
    </PPanel>
  );
}

/* -------------------- row -------------------- */

function FaqRow({
  faq,
  publishBlocked,
  busy,
  onEdit,
  onPublish,
  onHide,
  onUnhide,
  onDelete,
}: {
  faq: ProviderFaqDTO;
  publishBlocked: boolean;
  busy: boolean;
  onEdit: () => void;
  onPublish: () => void;
  onHide: () => void;
  onUnhide: () => void;
  onDelete: () => void;
}) {
  const pill =
    faq.status === "published"
      ? {
          text: "Published",
          cls:
            "border-emerald-400/30 bg-emerald-500/15 text-emerald-300",
        }
      : faq.status === "hidden"
        ? {
            text: "Hidden",
            cls: "border-white/12 bg-white/[0.05] text-white/60",
          }
        : {
            text:
              faq.source === "ai_suggested"
                ? "Draft · AI suggestion"
                : "Draft",
            cls: "border-amber-400/25 bg-amber-500/10 text-amber-200",
          };

  return (
    <li className="rounded-[14px] border border-reps-border bg-reps-ink/60 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <p className="flex-1 text-[13.5px] font-semibold leading-snug text-white">
              {faq.question}
            </p>
            <span
              className={`shrink-0 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${pill.cls}`}
            >
              {pill.text}
            </span>
          </div>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/70">
            {faq.answer}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {faq.status !== "published" ? (
          <ActionBtn
            onClick={onPublish}
            disabled={busy || publishBlocked}
            title={
              publishBlocked
                ? "Publish cap reached — hide a published FAQ first."
                : undefined
            }
            icon={<Check className="h-3 w-3" />}
            tone="primary"
          >
            {faq.source === "ai_suggested" && faq.status === "draft"
              ? "Approve & publish"
              : "Publish"}
          </ActionBtn>
        ) : (
          <ActionBtn onClick={onHide} disabled={busy} icon={<EyeOff className="h-3 w-3" />}>
            Hide
          </ActionBtn>
        )}
        {faq.status === "hidden" ? (
          <ActionBtn onClick={onUnhide} disabled={busy} icon={<Eye className="h-3 w-3" />}>
            Move to draft
          </ActionBtn>
        ) : null}
        <ActionBtn onClick={onEdit} disabled={busy} icon={<Pencil className="h-3 w-3" />}>
          Edit
        </ActionBtn>
        <ActionBtn onClick={onDelete} disabled={busy} icon={<Trash2 className="h-3 w-3" />} tone="danger">
          Delete
        </ActionBtn>
      </div>
    </li>
  );
}

function ActionBtn({
  children,
  onClick,
  disabled,
  icon,
  tone,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  tone?: "primary" | "danger";
  title?: string;
}) {
  const cls =
    tone === "primary"
      ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25"
      : tone === "danger"
        ? "border-rose-400/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20"
        : "border-reps-border bg-reps-panel-soft text-white/75 hover:bg-white/[0.06]";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex h-7 items-center gap-1 rounded-[8px] border px-2 text-[11.5px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${cls}`}
    >
      {icon}
      {children}
    </button>
  );
}

/* -------------------- editor dialog -------------------- */

function FaqEditor({
  value,
  saving,
  onCancel,
  onSave,
}: {
  value: Extract<EditorState, { open: true }>;
  saving: boolean;
  onCancel: () => void;
  onSave: (question: string, answer: string) => void;
}) {
  const [question, setQuestion] = React.useState(value.question);
  const [answer, setAnswer] = React.useState(value.answer);
  const valid = question.trim().length >= 3 && answer.trim().length >= 3;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-lg rounded-[16px] border border-reps-border bg-reps-panel p-5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h4 className="text-[15px] font-semibold text-white">
            {value.id ? "Edit FAQ" : "Add FAQ"}
          </h4>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-[8px] p-1 text-white/60 hover:bg-white/[0.08] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[12.5px] font-medium text-white/85">Question</span>
            <input
              className={inputCls}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={240}
              placeholder="What do learners ask you most?"
            />
            <span className="text-right text-[11px] text-white/40">
              {question.length}/240
            </span>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12.5px] font-medium text-white/85">Answer</span>
            <textarea
              className={textareaCls}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              maxLength={800}
              placeholder="Answer in your own words — plain, direct, 40–90 words."
            />
            <span className="text-right text-[11px] text-white/40">
              {answer.length}/800
            </span>
          </label>
        </div>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-9 items-center rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[13px] font-medium text-white/80 hover:bg-white/[0.06]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!valid || saving}
            onClick={() => onSave(question.trim(), answer.trim())}
            className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-reps-orange px-3 text-[13px] font-semibold text-white hover:bg-reps-orange/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
