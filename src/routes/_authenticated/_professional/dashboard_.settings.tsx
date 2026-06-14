import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  Bell,
  CreditCard,
  Download,
  EyeOff,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import { CreditsPanel } from "@/components/dashboard/CreditsPanel";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard, PPanel } from "@/components/dashboard/primitives";
import { useTrainerTier } from "@/lib/dashboard/useTrainerTier";
import { ManageBillingButton } from "@/components/billing/ManageBillingButton";
import { PhoneField } from "@/components/forms/PhoneField";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  getMySettings,
  updateMyAccount,
  updateMyNotificationPrefs,
  updateMyListingPaused,
  exportMyData,
  deleteMyAccount,
  listMySessions,
  revokeMySession,
  listMyActivity,
  type SettingsBundle,
  type SessionRow,
  type ActivityEvent,
} from "@/lib/settings/settings.functions";


type TabKey = "account" | "notifications" | "billing" | "credits" | "security" | "activity" | "privacy";

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "account", label: "Account", icon: User },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "billing", label: "Billing", icon: CreditCard },
  { key: "credits", label: "AI credits", icon: Sparkles },
  { key: "security", label: "Security", icon: Lock },
  { key: "activity", label: "Activity", icon: Activity },
  { key: "privacy", label: "Privacy & data", icon: EyeOff },
];

export const Route = createFileRoute("/_authenticated/_professional/dashboard_/settings")({
  validateSearch: (s: Record<string, unknown>) => {
    const raw = typeof s.tab === "string" ? (s.tab as TabKey) : "account";
    const tab: TabKey = TABS.some((t) => t.key === raw) ? raw : "account";
    return { tab };
  },
  head: () => ({
    meta: [
      { title: "Settings — REPS Professional" },
      { name: "description", content: "Account, notifications, billing, security and privacy." },
      { name: "robots", content: "noindex,nofollow" },
    ],
    links: [{ rel: "canonical", href: "/dashboard/settings" }],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const tier = useTrainerTier();
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  const fetchSettings = useServerFn(getMySettings);

  const { data, isLoading } = useQuery({
    queryKey: ["my-settings"],
    queryFn: () => fetchSettings(),
  });

  return (
    <DashboardShell
      role="trainer"
      active="Settings"
      tier={tier}
      title="Settings"
      subtitle="Account, notifications, billing, security and privacy."
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Tabs */}
        <aside className="xl:col-span-3">
          <PPanel className="p-3">
            <ul className="space-y-1">
              {TABS.map((t) => {
                const active = t.key === tab;
                return (
                  <li key={t.key}>
                    <button
                      type="button"
                      onClick={() => navigate({ search: { tab: t.key }, replace: true })}
                      className={`flex h-10 w-full items-center gap-3 rounded-[10px] px-3 text-[13px] font-medium transition-colors ${
                        active
                          ? "bg-reps-orange-soft text-reps-orange"
                          : "text-white/70 hover:bg-reps-panel-soft hover:text-white"
                      }`}
                    >
                      <t.icon className="h-[18px] w-[18px]" />
                      <span className="flex-1 text-left">{t.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </PPanel>

          {data ? (
            <PCard className="mt-6">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-emerald-500/12 text-emerald-300">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-[13px] font-semibold text-white">
                    {data.subscription.tier === "verified" && "REPs Verified · £99/year"}
                    {data.subscription.tier === "pro" && "REPs Pro"}
                    {data.subscription.tier === "studio" && "REPs Studio"}
                    {data.subscription.tier === "free" && "No active plan"}
                  </div>
                  <p className="mt-1 text-[12px] text-white/65">
                    {data.account.email ?? "—"}
                  </p>
                </div>
              </div>
            </PCard>
          ) : null}
        </aside>

        {/* Panel */}
        <div className="space-y-6 xl:col-span-9">
          {isLoading || !data ? (
            <PPanel className="p-10">
              <div className="flex items-center gap-3 text-[13px] text-white/60">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading your settings…
              </div>
            </PPanel>
          ) : tab === "account" ? (
            <AccountTab data={data} />
          ) : tab === "notifications" ? (
            <NotificationsTab data={data} />
          ) : tab === "billing" ? (
            <BillingTab data={data} />
          ) : tab === "credits" ? (
            <CreditsPanel />
          ) : tab === "security" ? (
            <SecurityTab data={data} />

          ) : (
            <PrivacyTab data={data} />
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

/* ---------- Reusable bits ----------------------------------------------- */

function PanelHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="border-b border-reps-border px-5 py-4">
      <h2 className="text-[14px] font-semibold text-white">{title}</h2>
      {subtitle ? <p className="mt-0.5 text-[12px] text-white/55">{subtitle}</p> : null}
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-3 border-b border-reps-border/60 px-5 py-4 last:border-b-0 md:grid-cols-[220px_1fr]">
      <div>
        <div className="text-[13px] font-semibold text-white">{label}</div>
        {hint ? <p className="mt-0.5 text-[12px] text-white/55">{hint}</p> : null}
      </div>
      <div>{children}</div>
    </div>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-10 w-full rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 text-[13px] text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-reps-orange disabled:cursor-not-allowed disabled:opacity-60"
    />
  );
}

function Toggle({
  on,
  onChange,
  label,
  hint,
  disabled,
}: {
  on: boolean;
  onChange?: (v: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange?.(!on)}
      className={`flex w-full items-start justify-between gap-3 rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 py-3 text-left transition-colors ${
        disabled ? "cursor-not-allowed opacity-70" : "hover:border-reps-orange-border/60"
      }`}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold text-white">{label}</span>
        {hint ? <span className="mt-0.5 block text-[12px] text-white/55">{hint}</span> : null}
      </span>
      <span
        className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors ${
          on ? "bg-reps-orange" : "bg-white/15"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
            on ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}

/* ---------- Account ----------------------------------------------------- */

function AccountTab({ data }: { data: SettingsBundle }) {
  const qc = useQueryClient();
  const save = useServerFn(updateMyAccount);

  const [fullName, setFullName] = React.useState(data.account.full_name ?? "");
  const [phone, setPhone] = React.useState(data.account.contact_phone ?? "");
  const [timezone, setTimezone] = React.useState(data.account.timezone);
  const [locale, setLocale] = React.useState(data.account.locale);

  const [newEmail, setNewEmail] = React.useState("");
  const [emailLoading, setEmailLoading] = React.useState(false);

  const mut = useMutation({
    mutationFn: () =>
      save({
        data: {
          full_name: fullName.trim(),
          contact_phone: phone || null,
          timezone,
          locale,
        },
      }),
    onSuccess: () => {
      toast.success("Account updated");
      qc.invalidateQueries({ queryKey: ["my-settings"] });
      qc.invalidateQueries({ queryKey: ["my-dashboard-profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });


  const handleEmailChange = async () => {
    const trimmed = newEmail.trim();
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      toast.error("Enter a valid email address");
      return;
    }
    setEmailLoading(true);
    const { error } = await supabase.auth.updateUser({ email: trimmed });
    setEmailLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Confirmation sent to ${trimmed}. Click the link to complete the change.`);
    setNewEmail("");
  };

  return (
    <PPanel>
      <PanelHeader title="Account" subtitle="Your personal details across REPs." />

      <Row
        label="Legal name"
        hint={data.account.legal_name_locked ? "Locked after identity verification. Contact support to change." : "Must match your ID and qualifications."}
      >
        <TextInput
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={data.account.legal_name_locked}
          placeholder="Jane Smith"
        />
      </Row>

      <Row label="Phone" hint="Internal only. Never shown publicly.">
        <PhoneField
          value={phone}
          onChange={(v) => setPhone(v)}
        />
      </Row>


      <Row label="Timezone">
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="h-10 w-full rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-reps-orange"
        >
          {["Europe/London", "Europe/Dublin", "Europe/Paris", "Europe/Madrid", "America/New_York", "America/Los_Angeles", "Asia/Dubai", "Asia/Singapore", "Australia/Sydney"].map((tz) => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
      </Row>

      <Row label="Language / formatting">
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value)}
          className="h-10 w-full rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-reps-orange"
        >
          <option value="en-GB">English (UK)</option>
          <option value="en-US">English (US)</option>
          <option value="en-AU">English (AU)</option>
        </select>
      </Row>

      <div className="flex items-center justify-end gap-3 px-5 py-4">
        <button
          type="button"
          onClick={() => mut.mutate()}
          disabled={mut.isPending}
          className="flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white hover:bg-reps-orange-hover disabled:opacity-60"
        >
          {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {mut.isPending ? "Saving…" : "Save changes"}
        </button>
      </div>

      <PanelHeader title="Email & sign-in" subtitle="Change the email you use to sign in." />
      <Row label="Current email">
        <div className="flex h-10 items-center rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 text-[13px] text-white/80">
          <Mail className="mr-2 h-4 w-4 text-white/55" />
          {data.account.email ?? "—"}
        </div>
      </Row>
      <Row label="New email" hint="We'll send a confirmation link to the new address.">
        <div className="flex flex-col gap-2 sm:flex-row">
          <TextInput
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="new@example.com"
          />
          <button
            type="button"
            onClick={handleEmailChange}
            disabled={emailLoading || !newEmail.trim()}
            className="flex h-10 shrink-0 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel px-4 text-[13px] font-semibold text-white hover:bg-reps-panel-soft disabled:opacity-60"
          >
            {emailLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Send confirmation
          </button>
        </div>
      </Row>
    </PPanel>
  );
}

/* ---------- Notifications ----------------------------------------------- */

function NotificationsTab({ data }: { data: SettingsBundle }) {
  const qc = useQueryClient();
  const save = useServerFn(updateMyNotificationPrefs);

  const [prefs, setPrefs] = React.useState(data.notifications);
  const dirty = JSON.stringify(prefs) !== JSON.stringify(data.notifications);

  const mut = useMutation({
    mutationFn: () => save({ data: prefs }),
    onSuccess: () => {
      toast.success("Notification preferences saved");
      qc.invalidateQueries({ queryKey: ["my-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <PPanel>
      <PanelHeader title="Notifications" subtitle="Choose what we email you about." />

      <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2">
        <Toggle
          on={prefs.new_enquiry_email}
          onChange={(v) => setPrefs((p) => ({ ...p, new_enquiry_email: v }))}
          label="New enquiry"
          hint="Email me the moment a client submits an enquiry."
        />
        <Toggle
          on={prefs.weekly_enquiry_digest}
          onChange={(v) => setPrefs((p) => ({ ...p, weekly_enquiry_digest: v }))}
          label="Weekly enquiry digest"
          hint="Monday summary of new enquiries and replies."
        />
        <Toggle
          on
          disabled
          label="Renewal reminders"
          hint="Required. We email you 30 and 7 days before renewal."
        />
        <Toggle
          on
          disabled
          label="Verification expiry reminders"
          hint="Required. DBS, insurance, qualifications."
        />
        <Toggle
          on={prefs.marketing_opt_in}
          onChange={(v) => setPrefs((p) => ({ ...p, marketing_opt_in: v }))}
          label="REPs product updates"
          hint="Occasional emails about new features. Off by default."
        />
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-reps-border px-5 py-4">
        <button
          type="button"
          onClick={() => mut.mutate()}
          disabled={!dirty || mut.isPending}
          className="flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white hover:bg-reps-orange-hover disabled:opacity-60"
        >
          {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save changes
        </button>
      </div>
    </PPanel>
  );
}

/* ---------- Billing ----------------------------------------------------- */

function BillingTab({ data }: { data: SettingsBundle }) {
  const sub = data.subscription;
  const tierLabel =
    sub.tier === "verified" ? "REPs Verified"
    : sub.tier === "pro" ? "REPs Pro"
    : sub.tier === "studio" ? "REPs Studio"
    : "No active plan";

  const priceLabel =
    sub.tier === "verified" ? "£99 / year"
    : sub.tier === "pro" ? (sub.billing_period === "annual" ? "£590 / year (Founding)" : "£59 / month (Founding)")
    : sub.tier === "studio" ? "£149 / month"
    : "—";

  const renews = sub.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : null;

  return (
    <PPanel>
      <PanelHeader title="Billing" subtitle="Your REPs membership, card and invoices." />

      <Row label="Membership plan">
        <div className="flex flex-col items-start justify-between gap-3 rounded-[12px] border border-reps-border bg-reps-panel-soft px-4 py-3 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-[14px] font-semibold text-white">
              {tierLabel}
              {sub.is_founding ? (
                <span className="rounded-full border border-reps-orange-border bg-reps-orange-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-reps-orange">
                  Founding
                </span>
              ) : null}
            </div>
            <div className="mt-0.5 text-[12.5px] text-white/60">
              {priceLabel}
              {renews ? (
                <> · {sub.cancel_at_period_end ? "ends" : "renews"} {renews}</>
              ) : null}
              {sub.status !== "active" && sub.status !== "trialing" && sub.tier !== "free" ? (
                <span className="ml-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10.5px] font-semibold text-amber-300">
                  {sub.status}
                </span>
              ) : null}
            </div>
          </div>
          <Link
            to="/pricing"
            className="inline-flex h-9 shrink-0 items-center rounded-[10px] border border-reps-border bg-reps-panel px-3 text-[12px] font-semibold text-white/80 hover:text-white"
          >
            Change plan
          </Link>
        </div>
      </Row>

      <Row
        label="Card & invoices"
        hint="Update your card, view receipts, or cancel — all in our secure billing portal."
      >
        <ManageBillingButton
          label="Open billing portal"
          variant="ghost"
          className="inline-flex h-9 shrink-0 items-center rounded-[10px] border border-reps-border bg-reps-panel px-3 text-[12px] font-semibold text-white/80 hover:bg-reps-panel hover:text-white"
        />
      </Row>

      {sub.tier !== "free" ? null : (
        <Row label="Get listed">
          <Link
            to="/pricing"
            className="inline-flex h-10 items-center rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white hover:bg-reps-orange-hover"
          >
            See plans
          </Link>
        </Row>
      )}
    </PPanel>
  );
}

/* ---------- Security ---------------------------------------------------- */

function SecurityTab({ data: _data }: { data: SettingsBundle }) {
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const submit = async () => {
    if (next.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const email = userData.user?.email;
      if (!email) throw new Error("Not signed in.");
      // Re-auth to verify current password.
      const { error: reauthErr } = await supabase.auth.signInWithPassword({
        email,
        password: current,
      });
      if (reauthErr) {
        toast.error("Current password is incorrect.");
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) throw error;
      toast.success("Password updated.");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update password.");
    } finally {
      setLoading(false);
    }
  };

  const signOutEverywhere = async () => {
    await supabase.auth.signOut({ scope: "global" });
    toast.success("Signed out on every device.");
    window.location.href = "/auth";
  };

  return (
    <>
      <PPanel>
        <PanelHeader title="Password" subtitle="Use 8+ characters. We check against known breached passwords." />
        <Row label="Current password">
          <TextInput type="password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="••••••••" />
        </Row>
        <Row label="New password">
          <TextInput type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="At least 8 characters" />
        </Row>
        <Row label="Confirm new password">
          <TextInput type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat new password" />
        </Row>
        <div className="flex items-center justify-end gap-3 px-5 py-4">
          <button
            type="button"
            onClick={submit}
            disabled={loading || !current || !next || !confirm}
            className="flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white hover:bg-reps-orange-hover disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Update password
          </button>
        </div>
      </PPanel>

      <SessionsPanel signOutEverywhere={signOutEverywhere} />

    </>
  );
}

/* ---------- Sessions ---------------------------------------------------- */

function parseUserAgent(ua: string | null): { device: string; browser: string } {
  if (!ua) return { device: "Unknown device", browser: "" };
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
  let os = "";
  if (/Windows NT/i.test(ua)) os = "Windows";
  else if (/Mac OS X|Macintosh/i.test(ua)) os = "macOS";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/Linux/i.test(ua)) os = "Linux";
  let browser = "";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/OPR\/|Opera/i.test(ua)) browser = "Opera";
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browser = "Chrome";
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = "Safari";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  const device = isMobile ? `${os || "Mobile"} phone` : `${os || "Desktop"} computer`;
  return { device, browser };
}

function formatLastActive(iso: string | null): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  if (diff < 60_000) return "Just now";
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} day${d === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString();
}

function SessionsPanel({ signOutEverywhere }: { signOutEverywhere: () => Promise<void> }) {
  const qc = useQueryClient();
  const listFn = useServerFn(listMySessions);
  const revokeFn = useServerFn(revokeMySession);

  const { data, isLoading } = useQuery({
    queryKey: ["my-sessions"],
    queryFn: () => listFn(),
  });

  const revokeMut = useMutation({
    mutationFn: (sessionId: string) => revokeFn({ data: { session_id: sessionId } }),
    onSuccess: () => {
      toast.success("Session signed out.");
      qc.invalidateQueries({ queryKey: ["my-sessions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sessions: SessionRow[] = data?.sessions ?? [];
  const currentId = data?.current_session_id ?? null;

  return (
    <PPanel className="mt-6">
      <PanelHeader
        title="Active sessions"
        subtitle="Devices currently signed in to your REPs account."
      />
      <div className="px-5 pb-2">
        {isLoading ? (
          <div className="flex items-center gap-2 py-4 text-[13px] text-white/55">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading sessions…
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-4 text-[13px] text-white/55">No active sessions found.</div>
        ) : (
          <ul className="divide-y divide-reps-border/60">
            {sessions.map((s) => {
              const ua = parseUserAgent(s.user_agent);
              const isCurrent = currentId && s.id === currentId;
              const lastActive = s.refreshed_at ?? s.updated_at ?? s.created_at;
              return (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-[13px] font-semibold text-white">
                      {ua.device}
                      {ua.browser ? (
                        <span className="font-normal text-white/55">· {ua.browser}</span>
                      ) : null}
                      {isCurrent ? (
                        <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-emerald-300">
                          This device
                        </span>
                      ) : null}
                      {s.aal === "aal2" ? (
                        <span className="rounded-full border border-reps-border bg-reps-panel-soft px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-white/70">
                          2FA
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-0.5 text-[12px] text-white/55">
                      {s.ip ? <>IP {s.ip} · </> : null}
                      Last active {formatLastActive(lastActive)}
                      {s.created_at ? <> · Signed in {new Date(s.created_at).toLocaleDateString()}</> : null}
                    </div>
                  </div>
                  {!isCurrent ? (
                    <button
                      type="button"
                      onClick={() => revokeMut.mutate(s.id)}
                      disabled={revokeMut.isPending}
                      className="flex h-8 shrink-0 items-center gap-1.5 rounded-[10px] border border-reps-border bg-reps-panel px-3 text-[12px] font-semibold text-white/80 hover:text-white disabled:opacity-60"
                    >
                      <LogOut className="h-3.5 w-3.5" /> Sign out
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="flex items-center justify-end gap-3 px-5 py-4">
        <button
          type="button"
          onClick={signOutEverywhere}
          className="flex h-10 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel-soft px-4 text-[13px] font-semibold text-white hover:bg-reps-panel"
        >
          <LogOut className="h-4 w-4" />
          Sign out everywhere
        </button>
      </div>
    </PPanel>
  );
}

/* ---------- Privacy & data ---------------------------------------------- */

function PrivacyTab({ data }: { data: SettingsBundle }) {
  const qc = useQueryClient();
  const pauseFn = useServerFn(updateMyListingPaused);
  const exportFn = useServerFn(exportMyData);

  const [paused, setPaused] = React.useState(!data.privacy.is_published);
  const [exporting, setExporting] = React.useState(false);

  const pauseMut = useMutation({
    mutationFn: (next: boolean) => pauseFn({ data: { paused: next } }),
    onSuccess: (_, next) => {
      toast.success(next ? "Listing paused — hidden from the directory." : "Listing live again.");
      qc.invalidateQueries({ queryKey: ["my-settings"] });
      qc.invalidateQueries({ queryKey: ["my-dashboard-profile"] });
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setPaused(!data.privacy.is_published); // revert
    },
  });

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportFn();
      const json = JSON.stringify(blob, null, 2);
      const file = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reps-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Your data download has started.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not export data.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <PPanel>
        <PanelHeader title="Listing visibility" subtitle="Temporarily hide your profile without cancelling." />
        <div className="px-5 py-5">
          <Toggle
            on={paused}
            onChange={(v) => {
              setPaused(v);
              pauseMut.mutate(v);
            }}
            label="Pause my listing"
            hint={paused
              ? "Your profile is hidden from the directory. New enquiries are paused. Your subscription stays active."
              : "Hide your profile from directory search results. You can resume any time."}
          />
        </div>
      </PPanel>

      <PPanel className="mt-6">
        <PanelHeader title="Your data" subtitle="Download everything REPs holds about you." />
        <div className="px-5 py-4">
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="flex h-10 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel-soft px-4 text-[13px] font-semibold text-white hover:bg-reps-panel disabled:opacity-60"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export my data (JSON)
          </button>
          <p className="mt-2 text-[11.5px] text-white/55">
            Includes your profile, enquiries, reviews, verifications and subscription history.
          </p>
        </div>
      </PPanel>

      <PPanel className="mt-6 border-rose-500/20">
        <PanelHeader title="Delete account" subtitle="Permanent. There is no recovery once confirmed." />
        <div className="space-y-3 px-5 py-4">
          <div className="flex items-start gap-3 rounded-[12px] border border-rose-500/20 bg-rose-500/5 p-3 text-[12.5px] text-rose-100/85">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
            <div>
              Deleting cancels your subscription and permanently removes your profile, enquiries,
              reviews, verifications and account. This cannot be undone.
            </div>
          </div>
          <DeleteAccountDialog email={data.account.email ?? ""} />
        </div>
      </PPanel>
    </>
  );
}

function DeleteAccountDialog({ email }: { email: string }) {
  const deleteFn = useServerFn(deleteMyAccount);

  const [open, setOpen] = React.useState(false);
  const [confirmEmail, setConfirmEmail] = React.useState("");
  const [confirmPhrase, setConfirmPhrase] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const canConfirm =
    confirmEmail.trim().toLowerCase() === email.toLowerCase() && confirmPhrase === "DELETE";

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteFn({ data: { confirm_email: confirmEmail.trim(), confirm_phrase: confirmPhrase } });
      toast.success("Account deleted.");
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete account.");
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          className="h-10 rounded-[10px] bg-rose-600 px-4 text-[13px] font-semibold text-white hover:bg-rose-500"
        >
          <Trash2 className="h-4 w-4" />
          Delete account
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete your REPs account?</DialogTitle>
          <DialogDescription>
            This will cancel your subscription and permanently delete your profile, enquiries,
            reviews and account. There is no recovery.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-white/80">
              Type your email to confirm
            </label>
            <TextInput
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder={email}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-white/80">
              Type <span className="font-mono text-rose-300">DELETE</span> to confirm
            </label>
            <TextInput
              value={confirmPhrase}
              onChange={(e) => setConfirmPhrase(e.target.value)}
              placeholder="DELETE"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!canConfirm || loading}
            className="bg-rose-600 hover:bg-rose-500"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Permanently delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
