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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createMyTicket } from "@/lib/support/my-tickets.functions";

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

  const [category, setCategory] = React.useState<string>("account");
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");

  const create = useMutation({
    mutationFn: (input: { subject: string; body: string; category: string }) =>
      createFn({ data: input }),
    onSuccess: (res) => {
      toast.success(`Ticket ${res.ticket_number} created`);
      navigate({ to: "/dashboard/support/$id", params: { id: res.id } });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Could not create ticket"),
  });

  const canSubmit =
    subject.trim().length >= 3 && body.trim().length >= 10 && !create.isPending;

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
            className="flex flex-col gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!canSubmit) return;
              create.mutate({ subject: subject.trim(), body: body.trim(), category });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Short summary"
                maxLength={200}
                className="rounded-[12px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Details</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Include any relevant details — URLs, what you tried, what you expected."
                rows={10}
                maxLength={10000}
                className="rounded-[12px]"
              />
              <p className="text-[11.5px] text-white/40">
                {body.trim().length} / 10,000 characters
              </p>
            </div>

            <div className="flex items-center justify-end gap-2">
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
                {create.isPending ? (
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
