import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Clock } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

type Audience = "client" | "pro" | "press";

const CLIENT_REASONS = [
  { value: "personal-training", label: "Personal training", eta: "~4h" },
  { value: "online-coaching", label: "Online coaching", eta: "~4h" },
  { value: "nutrition", label: "Nutrition", eta: "~4h" },
  { value: "group", label: "Group / classes", eta: "~4h" },
  { value: "yoga-pilates", label: "Yoga / Pilates", eta: "~4h" },
  { value: "other", label: "Something else", eta: "Same day" },
];

const PRO_REASONS = [
  { value: "verification", label: "Verification", eta: "Under 2h" },
  { value: "profile", label: "Profile / shop-front", eta: "~3h" },
  { value: "payouts", label: "Payouts & invoices", eta: "Under 2h" },
  { value: "bug", label: "Bug or technical issue", eta: "~4h" },
  { value: "other", label: "Other", eta: "Same day" },
];

const PRESS_REASONS = [
  { value: "press", label: "Press enquiry", eta: "~6h" },
  { value: "partnership", label: "Partnership", eta: "Next working day" },
  { value: "enterprise", label: "Enterprise / multi-coach", eta: "Next working day" },
  { value: "investor", label: "Investor", eta: "Next working day" },
];

function reasonsFor(a: Audience) {
  if (a === "pro") return PRO_REASONS;
  if (a === "press") return PRESS_REASONS;
  return CLIENT_REASONS;
}

export function ContactForm() {
  const [audience, setAudience] = useState<Audience>("client");
  const [reason, setReason] = useState<string>("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const reasons = useMemo(() => reasonsFor(audience), [audience]);
  const eta =
    reasons.find((r) => r.value === reason)?.eta ?? "Same working day";

  function handleAudience(value: string) {
    if (!value) return;
    setAudience(value as Audience);
    setReason("");
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="rounded-[22px] border border-reps-border bg-reps-panel/60 p-6 backdrop-blur lg:p-9">
      <Tabs
        value={audience}
        onValueChange={(v) => handleAudience(v)}
        className="w-full"
      >
        <TabsList className="grid h-auto w-full grid-cols-1 gap-1 bg-reps-ink p-1 sm:grid-cols-3">
          <TabsTrigger
            value="client"
            className="rounded-[8px] text-[13px] font-semibold data-[state=active]:bg-reps-panel data-[state=active]:text-white"
          >
            Looking for a coach
          </TabsTrigger>
          <TabsTrigger
            value="pro"
            className="rounded-[8px] text-[13px] font-semibold data-[state=active]:bg-reps-panel data-[state=active]:text-white"
          >
            I'm a professional
          </TabsTrigger>
          <TabsTrigger
            value="press"
            className="rounded-[8px] text-[13px] font-semibold data-[state=active]:bg-reps-panel data-[state=active]:text-white"
          >
            Press / partnerships
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {submitted ? (
        <Alert className="mt-8 border-emerald-400/30 bg-emerald-500/15 text-emerald-100">
          <CheckCircle2 className="size-4 text-emerald-300" />
          <AlertTitle className="text-emerald-100">Message sent</AlertTitle>
          <AlertDescription className="text-emerald-100/80">
            We'll reply to <span className="font-semibold">{email || "your email"}</span>{" "}
            shortly — usually within {eta.toLowerCase()}.
          </AlertDescription>
        </Alert>
      ) : (
        <form className="mt-8 flex flex-col gap-5" onSubmit={handleSubmit}>
          {/* Shared rows */}
          <div className="grid gap-5 md:grid-cols-2">
            <FieldShell label="Full name" htmlFor="name">
              <Input
                id="name"
                required
                placeholder={audience === "press" ? "Alex Morgan" : "Jane Carter"}
                className="h-11 rounded-[12px] border-reps-border bg-reps-ink text-[14px] text-white placeholder:text-white/35 focus-visible:ring-reps-orange/60"
              />
            </FieldShell>
            <FieldShell label="Email" htmlFor="email">
              <Input
                id="email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-[12px] border-reps-border bg-reps-ink text-[14px] text-white placeholder:text-white/35 focus-visible:ring-reps-orange/60"
              />
            </FieldShell>
          </div>

          {audience === "client" && (
            <div className="grid gap-5 md:grid-cols-2">
              <FieldShell label="City" htmlFor="city" hint="So we can suggest local pros.">
                <Input
                  id="city"
                  placeholder="London, Manchester, Lisbon…"
                  className="h-11 rounded-[12px] border-reps-border bg-reps-ink text-[14px] text-white placeholder:text-white/35 focus-visible:ring-reps-orange/60"
                />
              </FieldShell>
              <FieldShell label="What you're looking for" htmlFor="reason-client">
                <ReasonSelect
                  id="reason-client"
                  value={reason}
                  onChange={setReason}
                  options={CLIENT_REASONS}
                  placeholder="Pick the closest fit"
                />
              </FieldShell>
            </div>
          )}

          {audience === "pro" && (
            <>
              <FieldShell label="Where you're at" htmlFor="tier" hint="So we route you to the right team.">
                <ToggleGroup
                  id="tier"
                  type="single"
                  className="flex flex-wrap justify-start gap-2"
                >
                  {["Not on REPs yet", "Verified", "Pro", "Studio"].map((t) => (
                    <ToggleGroupItem
                      key={t}
                      value={t}
                      className="h-10 rounded-[10px] border border-reps-border bg-reps-ink px-4 text-[13px] font-semibold text-white/75 data-[state=on]:border-reps-orange data-[state=on]:bg-reps-orange-soft data-[state=on]:text-reps-orange"
                    >
                      {t}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </FieldShell>

              <div className="grid gap-5 md:grid-cols-2">
                <FieldShell
                  label="REPs profile URL"
                  htmlFor="profile-url"
                  hint="Optional — helps us look you up."
                >
                  <Input
                    id="profile-url"
                    type="url"
                    placeholder="repsglobal.com/c/your-handle"
                    className="h-11 rounded-[12px] border-reps-border bg-reps-ink text-[14px] text-white placeholder:text-white/35 focus-visible:ring-reps-orange/60"
                  />
                </FieldShell>
                <FieldShell label="Reason" htmlFor="reason-pro">
                  <ReasonSelect
                    id="reason-pro"
                    value={reason}
                    onChange={setReason}
                    options={PRO_REASONS}
                    placeholder="What's this about?"
                  />
                </FieldShell>
              </div>
            </>
          )}

          {audience === "press" && (
            <>
              <div className="grid gap-5 md:grid-cols-2">
                <FieldShell label="Outlet / company" htmlFor="outlet">
                  <Input
                    id="outlet"
                    placeholder="Publication, brand or fund"
                    className="h-11 rounded-[12px] border-reps-border bg-reps-ink text-[14px] text-white placeholder:text-white/35 focus-visible:ring-reps-orange/60"
                  />
                </FieldShell>
                <FieldShell label="Deadline" htmlFor="deadline" hint="Optional — we'll prioritise.">
                  <Input
                    id="deadline"
                    placeholder="e.g. Friday 6pm GMT"
                    className="h-11 rounded-[12px] border-reps-border bg-reps-ink text-[14px] text-white placeholder:text-white/35 focus-visible:ring-reps-orange/60"
                  />
                </FieldShell>
              </div>
              <FieldShell label="Reason" htmlFor="reason-press">
                <ReasonSelect
                  id="reason-press"
                  value={reason}
                  onChange={setReason}
                  options={PRESS_REASONS}
                  placeholder="What's this about?"
                />
              </FieldShell>
            </>
          )}

          <FieldShell
            label={audience === "press" ? "Brief" : "Message"}
            htmlFor="message"
          >
            <Textarea
              id="message"
              required
              rows={5}
              placeholder={
                audience === "press"
                  ? "A few lines on what you're working on and what you need from us."
                  : "Tell us a bit more — context is gold."
              }
              className="rounded-[12px] border-reps-border bg-reps-ink text-[14px] text-white placeholder:text-white/35 focus-visible:ring-reps-orange/60"
            />
          </FieldShell>

          {/* Honeypot */}
          <input
            type="text"
            name="company"
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            aria-hidden
          />

          <div className="mt-2 flex flex-col-reverse items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="inline-flex items-center gap-2 self-start rounded-full border border-reps-border bg-reps-ink px-3 py-1.5 text-[12px] text-white/65">
              <Clock className="size-3.5 text-reps-orange" />
              Estimated reply: <span className="font-semibold text-white">{eta}</span>
            </span>
            <button
              type="submit"
              className={cn(
                "inline-flex h-12 items-center justify-center gap-2 rounded-[10px] bg-reps-orange px-7 text-[14px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-hover",
              )}
            >
              Send message <ArrowRight className="size-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function FieldShell({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor} className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/70">
        {label}
      </Label>
      {children}
      {hint ? <p className="text-[12px] text-white/45">{hint}</p> : null}
    </div>
  );
}

function ReasonSelect({
  id,
  value,
  onChange,
  options,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        id={id}
        className="h-11 rounded-[12px] border-reps-border bg-reps-ink text-[14px] text-white focus:ring-reps-orange/60"
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="rounded-[12px] border-reps-border bg-reps-panel text-white">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} className="text-[14px]">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
