import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Clock, Loader2 } from "lucide-react";

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

type Audience = "pro" | "partner";

const PRO_REASONS = [
  { value: "verification", label: "Verification help", eta: "Under 2h" },
  { value: "upgrade", label: "Upgrade to Pro or Studio", eta: "~2h" },
  { value: "profile", label: "Profile / shop-front issue", eta: "~3h" },
  { value: "billing", label: "Billing", eta: "Under 2h" },
  { value: "safeguarding", label: "Safeguarding / conduct", eta: "Same day" },
  { value: "other", label: "Something else", eta: "Same day" },
];

const PRO_PROFESSIONS = [
  { value: "pt", label: "Personal trainer" },
  { value: "snc", label: "Strength & conditioning" },
  { value: "group", label: "Group exercise instructor" },
  { value: "online", label: "Online coach" },
  { value: "nutritionist", label: "Nutritionist" },
  { value: "yoga", label: "Yoga teacher" },
  { value: "pilates", label: "Pilates teacher" },
  { value: "other", label: "Other" },
];

const PARTNER_REASONS = [
  { value: "recognition", label: "Course recognition on REPS", eta: "Next working day" },
  { value: "partnership", label: "Partnership / integration", eta: "Next working day" },
  { value: "bulk-verify", label: "Bulk verification for our graduates", eta: "Next working day" },
  { value: "press", label: "Press / media", eta: "~6h" },
  { value: "safeguarding", label: "Safeguarding / conduct concern", eta: "Same day" },
  { value: "other", label: "Other", eta: "Next working day" },
];

const PARTNER_TYPES = [
  { value: "awarding-body", label: "Awarding body" },
  { value: "course-provider", label: "Course provider" },
  { value: "education", label: "Education partner" },
  { value: "insurer", label: "Insurer" },
  { value: "press", label: "Media / Press" },
  { value: "other", label: "Other" },
];

function reasonsFor(a: Audience) {
  return a === "partner" ? PARTNER_REASONS : PRO_REASONS;
}

export function ContactForm() {
  const [audience, setAudience] = useState<Audience>("pro");
  const [reason, setReason] = useState<string>("");
  const [tier, setTier] = useState<string>("");
  const [profession, setProfession] = useState<string>("");
  const [orgType, setOrgType] = useState<string>("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [org, setOrg] = useState("");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reasons = useMemo(() => reasonsFor(audience), [audience]);
  const eta =
    reasons.find((r) => r.value === reason)?.eta ?? "Same working day";

  function handleAudience(value: string) {
    if (!value) return;
    setAudience(value as Audience);
    setReason("");
    setTier("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/public/support/contact-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audience,
          company,
          fullName,
          email,
          message,
          reason: reason || undefined,
          profession: audience === "pro" ? profession || undefined : undefined,
          mobile: audience === "pro" ? mobile || undefined : undefined,
          tier: audience === "pro" ? tier || undefined : undefined,
          profileUrl: audience === "pro" ? profileUrl || undefined : undefined,
          org: audience === "partner" ? org || undefined : undefined,
          orgType: audience === "partner" ? orgType || undefined : undefined,
          website: audience === "partner" ? website || undefined : undefined,
          phone: audience === "partner" ? phone || undefined : undefined,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Could not send your message. Please try again.");
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-[22px] border border-reps-border bg-reps-panel/60 p-6 backdrop-blur lg:p-9">
      <Tabs
        value={audience}
        onValueChange={(v) => handleAudience(v)}
        className="w-full"
      >
        <TabsList className="grid h-auto w-full grid-cols-1 gap-1 bg-reps-ink p-1 sm:grid-cols-2">
          <TabsTrigger
            value="pro"
            className="rounded-[8px] text-[13px] font-semibold data-[state=active]:bg-reps-panel data-[state=active]:text-white"
          >
            I'm a professional
          </TabsTrigger>
          <TabsTrigger
            value="partner"
            className="rounded-[8px] text-[13px] font-semibold data-[state=active]:bg-reps-panel data-[state=active]:text-white"
          >
            Training provider / partner
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {submitted ? (
        <Alert className="mt-8 border-emerald-400/30 bg-emerald-500/15 text-emerald-100">
          <CheckCircle2 className="size-4 text-emerald-300" />
          <AlertTitle className="text-emerald-100">Message received</AlertTitle>
          <AlertDescription className="text-emerald-100/80">
            We've emailed a confirmation to{" "}
            <span className="font-semibold">{email || "your email"}</span>. A
            real human will reply within 24 hours.
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
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={audience === "partner" ? "Alex Morgan" : "Jane Carter"}
                className="h-11 rounded-[12px] border-reps-border bg-reps-ink text-[14px] text-white placeholder:text-white/35 focus-visible:ring-reps-orange/60"
              />
            </FieldShell>
            <FieldShell label="Work email" htmlFor="email">
              <Input
                id="email"
                type="email"
                required
                placeholder="you@yourcompany.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-[12px] border-reps-border bg-reps-ink text-[14px] text-white placeholder:text-white/35 focus-visible:ring-reps-orange/60"
              />
            </FieldShell>
          </div>

          {audience === "pro" && (
            <>
              <div className="grid gap-5 md:grid-cols-2">
                <FieldShell label="Profession" htmlFor="profession">
                  <Select value={profession} onValueChange={setProfession}>
                    <SelectTrigger
                      id="profession"
                      className="h-11 rounded-[12px] border-reps-border bg-reps-ink text-[14px] text-white focus:ring-reps-orange/60"
                    >
                      <SelectValue placeholder="Pick your profession" />
                    </SelectTrigger>
                    <SelectContent className="rounded-[12px] border-reps-border bg-reps-panel text-white">
                      {PRO_PROFESSIONS.map((p) => (
                        <SelectItem key={p.value} value={p.value} className="text-[14px]">
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldShell>
                <FieldShell label="Mobile" htmlFor="mobile" hint="Optional — for urgent verification follow-ups.">
                  <Input
                    id="mobile"
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+44…"
                    className="h-11 rounded-[12px] border-reps-border bg-reps-ink text-[14px] text-white placeholder:text-white/35 focus-visible:ring-reps-orange/60"
                  />
                </FieldShell>
              </div>

              <FieldShell label="Where are you in your REPS journey?" htmlFor="tier">
                <ToggleGroup
                  id="tier"
                  type="single"
                  value={tier}
                  onValueChange={(v) => v && setTier(v)}
                  className="flex flex-wrap justify-start gap-2"
                >
                  {[
                    "Just exploring",
                    "Ready to verify",
                    "Already verified, need help",
                    "Considering Pro or Studio",
                  ].map((t) => (
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
                <FieldShell label="Reason" htmlFor="reason-pro">
                  <ReasonSelect
                    id="reason-pro"
                    value={reason}
                    onChange={setReason}
                    options={PRO_REASONS}
                    placeholder="What's this about?"
                  />
                </FieldShell>
                {tier === "Already verified, need help" && (
                  <FieldShell
                    label="REPS profile URL"
                    htmlFor="profile-url"
                    hint="Helps us look you up directly."
                  >
                    <Input
                      id="profile-url"
                      type="url"
                      value={profileUrl}
                      onChange={(e) => setProfileUrl(e.target.value)}
                      placeholder="repsglobal.com/c/your-handle"
                      className="h-11 rounded-[12px] border-reps-border bg-reps-ink text-[14px] text-white placeholder:text-white/35 focus-visible:ring-reps-orange/60"
                    />
                  </FieldShell>
                )}
              </div>
            </>
          )}

          {audience === "partner" && (
            <>
              <div className="grid gap-5 md:grid-cols-2">
                <FieldShell label="Organisation" htmlFor="org">
                  <Input
                    id="org"
                    required
                    value={org}
                    onChange={(e) => setOrg(e.target.value)}
                    placeholder="Your awarding body, provider or outlet"
                    className="h-11 rounded-[12px] border-reps-border bg-reps-ink text-[14px] text-white placeholder:text-white/35 focus-visible:ring-reps-orange/60"
                  />
                </FieldShell>
                <FieldShell label="Organisation type" htmlFor="org-type">
                  <Select value={orgType} onValueChange={setOrgType}>
                    <SelectTrigger
                      id="org-type"
                      className="h-11 rounded-[12px] border-reps-border bg-reps-ink text-[14px] text-white focus:ring-reps-orange/60"
                    >
                      <SelectValue placeholder="Pick the closest fit" />
                    </SelectTrigger>
                    <SelectContent className="rounded-[12px] border-reps-border bg-reps-panel text-white">
                      {PARTNER_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value} className="text-[14px]">
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldShell>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <FieldShell label="Website" htmlFor="website">
                  <Input
                    id="website"
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://"
                    className="h-11 rounded-[12px] border-reps-border bg-reps-ink text-[14px] text-white placeholder:text-white/35 focus-visible:ring-reps-orange/60"
                  />
                </FieldShell>
                <FieldShell label="Phone" htmlFor="phone" hint="Optional.">
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+44…"
                    className="h-11 rounded-[12px] border-reps-border bg-reps-ink text-[14px] text-white placeholder:text-white/35 focus-visible:ring-reps-orange/60"
                  />
                </FieldShell>
              </div>

              <FieldShell label="What would you like to discuss?" htmlFor="reason-partner">
                <ReasonSelect
                  id="reason-partner"
                  value={reason}
                  onChange={setReason}
                  options={PARTNER_REASONS}
                  placeholder="Pick the closest fit"
                />
              </FieldShell>
            </>
          )}

          <FieldShell
            label={audience === "partner" ? "Brief" : "Message"}
            htmlFor="message"
          >
            <Textarea
              id="message"
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                audience === "partner"
                  ? "A few lines on what you're working on — courses, learner volumes, timelines, anything useful."
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
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="hidden"
            aria-hidden
          />

          {error ? (
            <Alert className="border-rose-400/30 bg-rose-500/15 text-rose-100">
              <AlertDescription className="text-rose-100/90">{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="mt-2 flex flex-col-reverse items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="inline-flex items-center gap-2 self-start rounded-full border border-reps-border bg-reps-ink px-3 py-1.5 text-[12px] text-white/65">
              <Clock className="size-3.5 text-reps-orange" />
              Estimated reply: <span className="font-semibold text-white">{eta}</span>
            </span>
            <button
              type="submit"
              disabled={submitting}
              className={cn(
                "inline-flex h-12 items-center justify-center gap-2 rounded-[10px] bg-reps-orange px-7 text-[14px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-hover disabled:opacity-60 disabled:cursor-not-allowed",
              )}
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Sending…
                </>
              ) : (
                <>
                  {audience === "partner" ? "Send to partnerships" : "Send message"}{" "}
                  <ArrowRight className="size-4" />
                </>
              )}
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
