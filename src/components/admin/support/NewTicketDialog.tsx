import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createOutboundTicket } from "@/lib/support/tickets.functions";

type Inbox = "support" | "pros" | "partners" | "press";
type Priority = "urgent" | "high" | "normal" | "low";

export function NewTicketDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: (ticketId: string) => void;
}) {
  const [to, setTo] = useState("");
  const [name, setName] = useState("");
  const [inbox, setInbox] = useState<Inbox>("support");
  const [priority, setPriority] = useState<Priority>("normal");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const createFn = useServerFn(createOutboundTicket);

  const create = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          to: to.trim(),
          name: name.trim() || undefined,
          subject: subject.trim(),
          body: body.trim(),
          priority,
          inbox,
        },
      }),
    onSuccess: (res) => {
      toast.success(`Sent — ${res.ticket_number}`);
      // reset
      setTo("");
      setName("");
      setSubject("");
      setBody("");
      setPriority("normal");
      setInbox("support");
      onOpenChange(false);
      onCreated(res.id);
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not send"),
  });

  const valid =
    /.+@.+\..+/.test(to.trim()) && subject.trim().length > 0 && body.trim().length > 0;

  function onKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && valid && !create.isPending) {
      e.preventDefault();
      create.mutate();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-reps-panel border-reps-border text-white sm:max-w-[560px]"
        onKeyDown={onKeyDown}
      >
        <DialogHeader>
          <DialogTitle className="text-white">New ticket</DialogTitle>
          <DialogDescription className="text-white/55 text-[12.5px]">
            Sends a real email and opens a ticket so the reply lands back here.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-2">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/45">
                To (email)
              </label>
              <Input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="name@example.com"
                type="email"
                autoFocus
                className="mt-1 bg-white/[0.04] border-reps-border text-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/45">
                Name (optional)
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sarah"
                className="mt-1 bg-white/[0.04] border-reps-border text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/45">
                Send from
              </label>
              <Select value={inbox} onValueChange={(v) => setInbox(v as Inbox)}>
                <SelectTrigger className="mt-1 bg-white/[0.04] border-reps-border text-white text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="support">Support · support@repsuk.org</SelectItem>
                  <SelectItem value="pros">Pros · pros@repsuk.org</SelectItem>
                  <SelectItem value="partners">Partners · partners@repsuk.org</SelectItem>
                  <SelectItem value="press">Press · press@repsuk.org</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/45">
                Priority
              </label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger className="mt-1 bg-white/[0.04] border-reps-border text-white text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/45">
              Subject
            </label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Quick question about your REPS profile"
              className="mt-1 bg-white/[0.04] border-reps-border text-white"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/45">
              Message
            </label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={7}
              placeholder="Write your message…"
              className="mt-1 bg-white/[0.04] border-reps-border text-white text-[14px] resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <div className="text-[11px] text-white/45">
            ⌘ + Enter to send
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-white/70 hover:text-white hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={() => create.mutate()}
              disabled={!valid || create.isPending}
              className="bg-reps-orange hover:bg-reps-orange/90 text-white"
            >
              {create.isPending ? (
                "Sending…"
              ) : (
                <>
                  <Send className="h-3.5 w-3.5 mr-1.5" /> Send email
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
