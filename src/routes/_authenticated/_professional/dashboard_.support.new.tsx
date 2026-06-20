import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Send } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard } from "@/components/dashboard/primitives";
import { useTrainerTier } from "@/lib/dashboard/useTrainerTier";
import { Button } from "@/components/ui/button";
import { DashboardInput as Input } from "@/components/dashboard/ui/input";
import { DashboardTextarea as Textarea } from "@/components/dashboard/ui/textarea";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  DashboardSelect as Select,
  DashboardSelectContent as SelectContent,
  DashboardSelectItem as SelectItem,
  DashboardSelectTrigger as SelectTrigger,
  DashboardSelectValue as SelectValue,
} from "@/components/dashboard/ui/select";
import {
  SupportAttachmentsField,
  uploadPendingFiles,
  type PendingFile,
} from "@/components/dashboard/SupportAttachmentsField";
import {
  attachToMyMessage,
  createMyTicket,
} from "@/lib/support/my-tickets.functions";

export const Route = createFileRoute(
  "/_authenticated/_professional/dashboard_/support/new",
)({
  head: () => ({
    meta: [
      { title: "New support ticket — REPS" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: NewTicketPage,
});

const CATEGORIES = [
  { value: "account", label: "Account" },
  { value: "billing", label: "Billing" },
  { value: "verification", label: "Verification" },
  { value: "profile", label: "Public profile" },
  { value: "technical", label: "Technical issue" },
  { value: "feedback", label: "Feedback / feature request" },
  { value: "other", label: "Other" },
] as const;

function NewTicketPage() {
  const tier = useTrainerTier();
  const navigate = useNavigate();
  const createFn = useServerFn(createMyTicket);
  const attachFn = useServerFn(attachToMyMessage);

  const [category, setCategory] = React.useState<string>("account");
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [files, setFiles] = React.useState<PendingFile[]>([]);
  const [touched, setTouched] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  const subjectInvalid = touched && subject.trim().length < 3;
  const bodyInvalid = touched && body.trim().length < 10;

  const create = useMutation({
    mutationFn: async (input: { subject: string; body: string; category: string }) => {
      const res = await createFn({ data: input });
      if (files.length > 0) {
        setUploading(true);
        try {
          const uploaded = await uploadPendingFiles({
            ticketId: res.id,
            files,
          });
          await attachFn({
            data: {
              messageId: res.message_id,
              files: uploaded,
            },
          });
        } finally {
          setUploading(false);
        }
      }
      return res;
    },
    onSuccess: (res) => {
      toast.success(`Ticket ${res.ticket_number} created`);
      navigate({ to: "/dashboard/support/$id", params: { id: res.id } });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Could not create ticket"),
  });

  const canSubmit =
    subject.trim().length >= 3 &&
    body.trim().length >= 10 &&
    !create.isPending &&
    !uploading;

  return (
    <DashboardShell
      role="trainer"
      tier={tier}
      active="Support"
      title="New support ticket"
      subtitle="Tell us what’s going on and we’ll come back to you."
    >
      <div className="mx-auto w-full max-w-[720px]">
        <div className="mb-4">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 rounded-[10px] px-2 text-white/55 hover:text-white"
          >
            <Link to="/dashboard/support">
              <ArrowLeft className="mr-1.5 h-4 w-4" data-icon /> Back to support
            </Link>
          </Button>
        </div>

        <PCard className="p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setTouched(true);
              if (!canSubmit) return;
              create.mutate({
                subject: subject.trim(),
                body: body.trim(),
                category,
              });
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="category">Category</FieldLabel>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category" className="rounded-[12px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>
                  Helps us route your ticket to the right person.
                </FieldDescription>
              </Field>

              <Field data-invalid={subjectInvalid || undefined}>
                <FieldLabel htmlFor="subject">Subject</FieldLabel>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder="Short summary"
                  maxLength={200}
                  aria-invalid={subjectInvalid || undefined}
                  className="rounded-[12px]"
                />
                {subjectInvalid ? (
                  <FieldError>Subject needs at least 3 characters.</FieldError>
                ) : (
                  <FieldDescription>One-line summary of the issue.</FieldDescription>
                )}
              </Field>

              <Field data-invalid={bodyInvalid || undefined}>
                <FieldLabel htmlFor="body">Details</FieldLabel>
                <Textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder="Include any relevant details — URLs, what you tried, what you expected."
                  rows={10}
                  maxLength={10000}
                  aria-invalid={bodyInvalid || undefined}
                  className="rounded-[12px]"
                />
                {bodyInvalid ? (
                  <FieldError>Tell us a bit more — at least 10 characters.</FieldError>
                ) : (
                  <FieldDescription>
                    {body.trim().length} / 10,000 characters
                  </FieldDescription>
                )}
              </Field>

              <Field>
                <FieldLabel>Attachments</FieldLabel>
                <SupportAttachmentsField
                  files={files}
                  onChange={setFiles}
                  uploading={uploading}
                  onError={(msg) => toast.error(msg)}
                />
                <FieldDescription>
                  Screenshots, PDFs and documents. Optional.
                </FieldDescription>
              </Field>
            </FieldGroup>

            <div className="mt-6 flex items-center justify-end gap-2">
              <Button
                asChild
                type="button"
                variant="ghost"
                className="rounded-[10px] text-white/65"
              >
                <Link to="/dashboard/support">Cancel</Link>
              </Button>
              <Button
                type="submit"
                disabled={!canSubmit}
                className="rounded-[10px] bg-reps-orange text-white hover:bg-reps-orange/90"
              >
                {create.isPending || uploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" data-icon />
                ) : (
                  <Send className="mr-2 h-4 w-4" data-icon />
                )}
                Submit ticket
              </Button>
            </div>
          </form>
        </PCard>
      </div>
    </DashboardShell>
  );
}
