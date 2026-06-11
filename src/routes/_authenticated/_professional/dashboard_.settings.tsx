import { createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  CreditCard,
  Globe,
  KeyRound,
  Link as LinkIcon,
  Lock,
  Mail,
  Plug,
  Save,
  ShieldCheck,
  Trash2,
  User,
} from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard, PPanel } from "@/components/dashboard/primitives";
import { useTrainerTier } from "@/lib/dashboard/useTrainerTier";

export const Route = createFileRoute("/_authenticated/_professional/dashboard_/settings")({
  head: () => ({
    meta: [
      { title: "Settings — REPS Professional" },
      { name: "description", content: "Manage your account, business, notifications, billing and integrations." },
      { property: "og:title", content: "Settings — REPS Professional" },
      { property: "og:description", content: "Account, business, notifications, billing, integrations." },
      { property: "og:url", content: "/dashboard/settings" },
    ],
    links: [{ rel: "canonical", href: "/dashboard/settings" }],
  }),
  component: SettingsPage,
});

const TABS = [
  { label: "Account", icon: User, active: true },
  { label: "Business profile", icon: Globe },
  { label: "Notifications", icon: Bell },
  { label: "Billing", icon: CreditCard },
  { label: "Integrations", icon: Plug },
  { label: "Security", icon: Lock },
];

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-3 border-b border-reps-border/60 px-5 py-4 last:border-b-0 md:grid-cols-[220px_1fr]">
      <div>
        <div className="text-[13px] font-semibold text-white">{label}</div>
        {hint && <p className="mt-0.5 text-[12px] text-white/55">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Input({ placeholder, defaultValue }: { placeholder?: string; defaultValue?: string }) {
  return (
    <input
      defaultValue={defaultValue}
      placeholder={placeholder}
      className="h-10 w-full rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 text-[13px] text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-reps-orange"
    />
  );
}

function Toggle({ on = false, label }: { on?: boolean; label: string }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 py-2.5">
      <span className="text-[13px] text-white/85">{label}</span>
      <span className={`relative h-5 w-9 rounded-full transition-colors ${on ? "bg-reps-orange" : "bg-white/15"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${on ? "translate-x-[18px]" : "translate-x-0.5"}`} />
      </span>
    </label>
  );
}

function SettingsPage() {
  const tier = useTrainerTier();
  return (
    <DashboardShell role="trainer" tier="pro"
      active="Settings"
      tier={tier}
      title="Settings"
      subtitle="Account, business profile, notifications, billing and integrations."
      actions={
        <button type="button" className="flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white shadow-none hover:bg-reps-orange-hover">
          <Save className="h-4 w-4" />
          Save changes
        </button>
      }
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Tabs */}
        <aside className="xl:col-span-3">
          <PPanel className="p-3">
            <ul className="space-y-1">
              {TABS.map((t) => (
                <li key={t.label}>
                  <button
                    type="button"
                    className={`flex h-10 w-full items-center gap-3 rounded-[10px] px-3 text-[13px] font-medium transition-colors ${t.active ? "bg-reps-orange-soft text-reps-orange" : "text-white/70 hover:bg-reps-panel-soft hover:text-white"}`}
                  >
                    <t.icon className="h-[18px] w-[18px]" />
                    <span className="flex-1 text-left">{t.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </PPanel>

          <PCard className="mt-6">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-emerald-500/12 text-emerald-300">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div>
                <div className="text-[13px] font-semibold text-white">Account verified</div>
                <p className="mt-1 text-[12px] text-white/65">REPS Level 3 · DBS valid · Insurance active</p>
              </div>
            </div>
          </PCard>
        </aside>

        {/* Panels */}
        <div className="space-y-6 xl:col-span-9">
          <PPanel>
            <div className="border-b border-reps-border px-5 py-4">
              <h3 className="text-[14px] font-semibold text-white">Account details</h3>
              <p className="mt-0.5 text-[12px] text-white/55">Your personal information shown across REPS.</p>
            </div>
            <Row label="Full name">
              <div className="grid grid-cols-2 gap-3">
                <Input defaultValue="James" />
                <Input defaultValue="Carter" />
              </div>
            </Row>
            <Row label="Email" hint="Used for sign-in and client notifications.">
              <Input defaultValue="james@repsglobal.uk" />
            </Row>
            <Row label="Phone">
              <Input defaultValue="+44 7700 900014" />
            </Row>
            <Row label="Profile photo">
              <div className="flex items-center gap-3">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-reps-orange-soft text-[14px] font-bold text-reps-orange">JC</span>
                <button type="button" className="flex h-9 items-center rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] font-semibold text-white/85 shadow-none hover:text-white">Upload new</button>
                <button type="button" className="flex h-9 items-center gap-1.5 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] font-semibold text-white/60 shadow-none hover:text-rose-300">
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              </div>
            </Row>
          </PPanel>

          <PPanel>
            <div className="border-b border-reps-border px-5 py-4">
              <h3 className="text-[14px] font-semibold text-white">Business profile</h3>
              <p className="mt-0.5 text-[12px] text-white/55">What clients see on your public REPS profile.</p>
            </div>
            <Row label="Trading name"><Input defaultValue="James Carter Coaching" /></Row>
            <Row label="Public URL" hint="Your shareable profile link.">
              <div className="flex items-center gap-2">
                <span className="flex h-10 items-center rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] text-white/55">repsglobal.uk/pro/</span>
                <Input defaultValue="james-carter" />
              </div>
            </Row>
            <Row label="Service area"><Input defaultValue="Manchester · 10 mile radius · Online worldwide" /></Row>
            <Row label="Specialisms">
              <div className="flex flex-wrap gap-2">
                {["Strength", "Performance", "Hybrid", "Pre/post-natal"].map((s) => (
                  <span key={s} className="flex h-7 items-center gap-1.5 rounded-full bg-reps-orange-soft px-3 text-[12px] font-semibold text-reps-orange">{s}</span>
                ))}
                <button type="button" className="flex h-7 items-center rounded-full border border-dashed border-reps-border px-3 text-[12px] font-semibold text-white/60 hover:text-white">+ Add</button>
              </div>
            </Row>
          </PPanel>

          <PPanel>
            <div className="border-b border-reps-border px-5 py-4">
              <h3 className="text-[14px] font-semibold text-white">Notifications</h3>
            </div>
            <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2">
              <Toggle on label="New booking confirmations" />
              <Toggle on label="Check-in submissions" />
              <Toggle on label="New leads" />
              <Toggle label="Marketing tips weekly" />
              <Toggle on label="Failed payment alerts" />
              <Toggle label="Community digest" />
            </div>
          </PPanel>

          <PPanel>
            <div className="border-b border-reps-border px-5 py-4">
              <h3 className="text-[14px] font-semibold text-white">Billing</h3>
              <p className="mt-0.5 text-[12px] text-white/55">Your REPS membership and payout details.</p>
            </div>
            <Row label="Membership plan">
              <div className="flex items-center justify-between rounded-[12px] border border-reps-border bg-reps-panel-soft px-4 py-3">
                <div>
                  <div className="text-[13px] font-semibold text-white">REPS Pro — Annual</div>
                  <div className="text-[12px] text-white/55">£189 / year · renews 01 Apr 2027</div>
                </div>
                <button type="button" className="flex h-8 items-center rounded-[10px] border border-reps-border bg-reps-panel px-3 text-[12px] font-semibold text-white/85 shadow-none hover:text-white">Change plan</button>
              </div>
            </Row>
            <Row label="Payout account">
              <div className="flex items-center justify-between rounded-[12px] border border-reps-border bg-reps-panel-soft px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-reps-panel"><CreditCard className="h-4 w-4 text-reps-orange" /></span>
                  <div>
                    <div className="text-[13px] font-semibold text-white">Monzo •• 4421</div>
                    <div className="text-[12px] text-white/55">Weekly payout · Tuesdays</div>
                  </div>
                </div>
                <button type="button" className="flex h-8 items-center rounded-[10px] border border-reps-border bg-reps-panel px-3 text-[12px] font-semibold text-white/85 shadow-none hover:text-white">Update</button>
              </div>
            </Row>
          </PPanel>

          <PPanel>
            <div className="border-b border-reps-border px-5 py-4">
              <h3 className="text-[14px] font-semibold text-white">Integrations</h3>
            </div>
            <ul className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2">
              {[
                { name: "Google Calendar", desc: "Two-way calendar sync", connected: true, icon: LinkIcon },
                { name: "Stripe", desc: "Card payments & subscriptions", connected: true, icon: CreditCard },
                { name: "Mailchimp", desc: "Email marketing list sync", connected: false, icon: Mail },
                { name: "Zoom", desc: "Auto-create call links for online bookings", connected: true, icon: Plug },
                { name: "MyFitnessPal", desc: "Pull client food logs", connected: false, icon: Plug },
                { name: "Apple Health / Garmin", desc: "Sync HR, sleep, steps", connected: false, icon: Plug },
              ].map((it) => (
                <li key={it.name} className="flex items-center gap-3 rounded-[12px] border border-reps-border bg-reps-panel-soft p-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-panel text-reps-orange">
                    <it.icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-white">{it.name}</div>
                    <div className="truncate text-[11px] text-white/55">{it.desc}</div>
                  </div>
                  {it.connected ? (
                    <span className="flex h-7 items-center gap-1 rounded-full bg-emerald-500/12 px-2.5 text-[11px] font-semibold text-emerald-300">
                      <ShieldCheck className="h-3 w-3" /> Connected
                    </span>
                  ) : (
                    <button type="button" className="flex h-7 items-center rounded-[8px] bg-reps-orange px-2.5 text-[11px] font-semibold text-white shadow-none">Connect</button>
                  )}
                </li>
              ))}
            </ul>
          </PPanel>

          <PPanel>
            <div className="border-b border-reps-border px-5 py-4">
              <h3 className="text-[14px] font-semibold text-white">Security</h3>
            </div>
            <Row label="Password"><Input placeholder="••••••••" /></Row>
            <Row label="Two-factor auth" hint="Required for REPS Pro accounts.">
              <Toggle on label="Authenticator app — enabled" />
            </Row>
            <Row label="Active sessions">
              <div className="space-y-2">
                {[
                  { dev: "MacBook Pro · Chrome · Manchester", current: true },
                  { dev: "iPhone 15 · Safari · Manchester", current: false },
                ].map((s) => (
                  <div key={s.dev} className="flex items-center justify-between rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 py-2.5 text-[12px] text-white/80">
                    <div className="flex items-center gap-2">
                      <KeyRound className="h-3.5 w-3.5 text-reps-orange" />
                      {s.dev}
                      {s.current && <span className="ml-1 rounded-full bg-emerald-500/12 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">This device</span>}
                    </div>
                    <button type="button" className="text-[11px] font-semibold text-rose-300 hover:text-rose-200">Revoke</button>
                  </div>
                ))}
              </div>
            </Row>
          </PPanel>
        </div>
      </div>
    </DashboardShell>
  );
}
