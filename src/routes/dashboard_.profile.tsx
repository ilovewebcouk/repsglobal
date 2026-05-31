import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Apple,
  AreaChart,
  Bell,
  Calendar,
  Camera,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Dumbbell,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  GraduationCap,
  Image as ImageIcon,
  Instagram,
  LayoutDashboard,
  Linkedin,
  MapPin,
  MessagesSquare,
  Plus,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trash2,
  Users,
  Wrench,
  X,
import { ProShell } from "@/components/dashboard/ProShell";
  Youtube,
  type LucideIcon,
} from "lucide-react";

import proJames from "@/assets/pro-james.jpg";

export const Route = createFileRoute("/dashboard_/profile")({
  head: () => ({
    meta: [
      { title: "Profile editor — REPs Professional" },
      {
        name: "description",
        content:
          "Manage how your professional profile appears in the REPs directory — photos, bio, services, specialisms and qualifications.",
      },
      { property: "og:title", content: "Profile editor — REPs Professional" },
      {
        property: "og:description",
        content:
          "Manage how your professional profile appears in the REPs directory.",
      },
      { property: "og:url", content: "/dashboard/profile" },
    ],
    links: [{ rel: "canonical", href: "/dashboard/profile" }],
  }),
  component: ProfileEditorPage,
});

/* ============================================================
   SIDEBAR — mirrors /dashboard exactly
   ============================================================ */

type NavItem = {
  icon: LucideIcon;
  label: string;
  to?: string;
  badge?: string;
  active?: boolean;
};

const NAV: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
  { icon: Users, label: "Clients" },
  { icon: Calendar, label: "Calendar" },
  { icon: Dumbbell, label: "Programs" },
  { icon: Apple, label: "Nutrition" },
  { icon: ClipboardList, label: "Check-Ins" },
  { icon: MessagesSquare, label: "Messages", badge: "6" },
  { icon: Target, label: "Leads" },
  { icon: CreditCard, label: "Payments" },
  { icon: AreaChart, label: "Reports" },
  { icon: FileText, label: "Content Studio" },
  { icon: GraduationCap, label: "Education & CPD" },
  { icon: Users, label: "Community" },
  { icon: Wrench, label: "Business Tools" },
  { icon: Settings, label: "Settings" },
];

function Sidebar() {
  return (
    <aside className="hidden w-[232px] shrink-0 flex-col border-r border-reps-border bg-reps-midnight lg:flex">
      <Link to="/" className="flex items-center gap-3 px-5 pb-6 pt-6">
        <span className="font-display text-[26px] font-bold leading-none tracking-tight text-white">
          REPs
        </span>
        <span className="border-l border-white/15 pl-3 text-[10px] leading-tight text-white/65">
          The Register of
          <br />
          Exercise Professionals
        </span>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <ul className="space-y-1">
          {NAV.map((item) => {
            const content = (
              <>
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge ? (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-reps-orange px-1.5 text-[10px] font-semibold text-white">
                    {item.badge}
                  </span>
                ) : null}
              </>
            );
            const cls =
              "flex h-10 w-full items-center gap-3 rounded-[10px] px-3 text-[13px] font-medium text-white/70 hover:bg-reps-panel hover:text-white transition-colors";
            return (
              <li key={item.label}>
                {item.to ? (
                  <Link to={item.to} className={cls}>
                    {content}
                  </Link>
                ) : (
                  <button type="button" className={cls}>
                    {content}
                  </button>
                )}
              </li>
            );
          })}

          {/* Profile = active context for this page */}
          <li>
            <button
              type="button"
              className="mt-1 flex h-10 w-full items-center gap-3 rounded-[10px] bg-reps-orange-soft px-3 text-[13px] font-medium text-reps-orange transition-colors"
            >
              <ShieldCheck className="h-[18px] w-[18px] shrink-0" />
              <span className="flex-1 text-left">Profile</span>
            </button>
          </li>
        </ul>
      </nav>

      <div className="space-y-3 px-3 pb-5">
        <div className="flex items-center gap-3 rounded-[16px] border border-reps-border bg-reps-panel p-3">
          <img
            src={proJames}
            alt=""
            className="h-10 w-10 rounded-full object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold text-white">
              James Carter
            </div>
            <div className="truncate text-[11px] text-white/55">
              Personal Trainer
            </div>
            <span className="mt-1 inline-flex h-4 items-center rounded-full bg-reps-orange-soft px-2 text-[10px] font-semibold text-reps-orange">
              REPs Level 3
            </span>
          </div>
        </div>
        <button
          type="button"
          className="flex h-10 w-full items-center justify-center gap-2 rounded-[10px] border border-reps-orange-border bg-reps-orange-soft text-[13px] font-semibold text-reps-orange shadow-none transition-colors hover:bg-reps-orange/15"
        >
          <Sparkles className="h-4 w-4" />
          AI Assistant
        </button>
      </div>
    </aside>
  );
}

/* ============================================================
   TOP BAR
   ============================================================ */

function TopBar() {
  return (
    <header className="flex items-center justify-between gap-6 px-8 pt-7">
      <div className="min-w-0">
        <h1 className="font-display text-[22px] font-bold leading-tight text-white">
          Profile editor
        </h1>
        <p className="mt-0.5 text-[13px] text-white/55">
          Manage how your professional profile appears in the REPs directory.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden h-10 w-[280px] items-center gap-2 rounded-[12px] border border-reps-border bg-reps-panel px-3 text-[13px] text-white/55 md:flex">
          <Search className="h-4 w-4" />
          <span className="flex-1">Search…</span>
          <kbd className="rounded-[6px] border border-reps-border bg-reps-ink px-1.5 py-0.5 text-[10px] font-semibold text-white/60">
            ⌘K
          </kbd>
        </div>
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-[10px] border border-reps-border bg-reps-panel text-white/70 shadow-none transition-colors hover:text-white"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-reps-orange px-1 text-[9px] font-semibold text-white">
            12
          </span>
        </button>
        <img
          src={proJames}
          alt=""
          className="h-10 w-10 rounded-full object-cover ring-2 ring-reps-border"
        />
      </div>
    </header>
  );
}

/* ============================================================
   ACTION BAR (page heading row inside main)
   ============================================================ */

function ActionBar() {
  return (
    <div className="flex flex-col items-start justify-between gap-3 rounded-[22px] border border-reps-border bg-reps-panel px-5 py-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-reps-orange-soft text-reps-orange">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <div className="text-[14px] font-semibold text-white">
            Public profile
          </div>
          <div className="text-[12px] text-white/55">
            Last updated 2 days ago · Visible in REPs directory
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex h-10 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel-soft px-4 text-[13px] font-semibold text-white/85 shadow-none transition-colors hover:text-white"
        >
          <Eye className="h-4 w-4" />
          Preview public profile
        </button>
        <button
          type="button"
          className="flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-hover"
        >
          <Save className="h-4 w-4" />
          Save changes
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   PRIMITIVES
   ============================================================ */

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[16px] border border-reps-border bg-reps-panel p-5 ${className}`}
    >
      {children}
    </section>
  );
}

function SectionHeader({
  title,
  subtitle,
  step,
}: {
  title: string;
  subtitle?: string;
  step?: string;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="font-display text-[15px] font-semibold text-white">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-0.5 text-[12px] text-white/55">{subtitle}</p>
        ) : null}
      </div>
      {step ? (
        <span className="rounded-full bg-reps-panel-soft px-2.5 py-0.5 text-[11px] font-semibold text-white/60">
          {step}
        </span>
      ) : null}
    </div>
  );
}

function Field({
  label,
  children,
  hint,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-[12px] font-medium text-white/70">{label}</span>
      {children}
      {hint ? <span className="text-[11px] text-white/45">{hint}</span> : null}
    </label>
  );
}

function TextInput({
  value,
  placeholder,
  prefix,
}: {
  value?: string;
  placeholder?: string;
  prefix?: React.ReactNode;
}) {
  return (
    <div className="flex h-10 items-center gap-2 rounded-[12px] border border-reps-border bg-reps-ink px-3 text-[13px] text-white">
      {prefix ? <span className="text-white/45">{prefix}</span> : null}
      <input
        type="text"
        defaultValue={value}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-[13px] text-white placeholder:text-white/35 focus:outline-none"
      />
    </div>
  );
}

function TextArea({
  value,
  rows = 4,
  placeholder,
}: {
  value?: string;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <textarea
      defaultValue={value}
      rows={rows}
      placeholder={placeholder}
      className="w-full resize-none rounded-[12px] border border-reps-border bg-reps-ink px-3 py-2.5 text-[13px] leading-relaxed text-white placeholder:text-white/35 focus:outline-none"
    />
  );
}

function Chip({
  children,
  removable = true,
}: {
  children: React.ReactNode;
  removable?: boolean;
}) {
  return (
    <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-reps-orange-border bg-reps-orange-soft pl-3 pr-2 text-[12px] font-semibold text-reps-orange">
      {children}
      {removable ? (
        <button
          type="button"
          aria-label="Remove"
          className="flex h-5 w-5 items-center justify-center rounded-full text-reps-orange/70 hover:bg-reps-orange/10 hover:text-reps-orange"
        >
          <X className="h-3 w-3" />
        </button>
      ) : null}
    </span>
  );
}

function AddButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-dashed border-reps-border bg-transparent px-3 text-[12px] font-semibold text-white/65 shadow-none transition-colors hover:border-reps-orange-border hover:text-reps-orange"
    >
      <Plus className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

/* ============================================================
   LEFT COLUMN SECTIONS
   ============================================================ */

function PhotoAndCover() {
  return (
    <Card>
      <SectionHeader
        title="Profile photo & cover"
        subtitle="High-quality images help clients trust and recognise you."
        step="01"
      />
      <div className="flex flex-col gap-5">
        {/* Cover */}
        <div className="relative h-[180px] overflow-hidden rounded-[16px] border border-reps-border bg-gradient-to-br from-reps-panel-soft via-reps-panel to-reps-ink">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,122,0,0.18),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(95,168,255,0.12),transparent_60%)]" />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <button
              type="button"
              className="flex h-9 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-ink/80 px-3 text-[12px] font-semibold text-white shadow-none backdrop-blur transition-colors hover:bg-reps-ink"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              Change cover
            </button>
          </div>
          <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-reps-ink/70 px-2.5 py-1 text-[11px] font-medium text-white/75 backdrop-blur">
            Recommended 1600 × 480 · JPG or PNG
          </div>
        </div>

        {/* Avatar row */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={proJames}
              alt=""
              className="h-20 w-20 rounded-full object-cover ring-2 ring-reps-border"
            />
            <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-reps-panel bg-reps-orange text-white">
              <Camera className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="flex h-9 items-center gap-2 rounded-[10px] bg-reps-orange px-3 text-[12px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-hover"
              >
                <Camera className="h-3.5 w-3.5" />
                Change photo
              </button>
              <button
                type="button"
                className="flex h-9 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] font-semibold text-white/70 shadow-none transition-colors hover:text-white"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>
            <p className="text-[11px] text-white/45">
              Square image, at least 512 × 512 · JPG or PNG · max 4MB
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

function BasicInfo() {
  return (
    <Card>
      <SectionHeader
        title="Basic information"
        subtitle="The essentials clients see at the top of your profile."
        step="02"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full name">
          <TextInput value="James Carter" />
        </Field>
        <Field label="Professional title">
          <TextInput value="Strength & Conditioning Coach" />
        </Field>
        <Field label="Business / gym name">
          <TextInput value="Carter Performance Studio" />
        </Field>
        <Field label="Location">
          <TextInput value="London, UK" prefix={<MapPin className="h-3.5 w-3.5" />} />
        </Field>
        <Field label="Public phone">
          <TextInput value="+44 20 7946 0817" />
        </Field>
        <Field label="Public email">
          <TextInput value="james@carterperformance.co.uk" />
        </Field>
        <Field label="Website" className="sm:col-span-2">
          <TextInput
            value="carterperformance.co.uk"
            prefix={<Globe className="h-3.5 w-3.5" />}
          />
        </Field>
        <Field label="Languages spoken" className="sm:col-span-2">
          <div className="flex flex-wrap items-center gap-2 rounded-[12px] border border-reps-border bg-reps-ink p-2">
            <Chip>English</Chip>
            <Chip>Spanish</Chip>
            <AddButton label="Add language" />
          </div>
        </Field>
        <Field label="Social links" className="sm:col-span-2">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <TextInput
              value="@jamescarter.coach"
              prefix={<Instagram className="h-3.5 w-3.5" />}
            />
            <TextInput
              value="james-carter-coach"
              prefix={<Linkedin className="h-3.5 w-3.5" />}
            />
            <TextInput
              value="@CarterPerformance"
              prefix={<Youtube className="h-3.5 w-3.5" />}
            />
          </div>
        </Field>
      </div>
    </Card>
  );
}

function PublicBio() {
  return (
    <Card>
      <SectionHeader
        title="Public bio"
        subtitle="Lead with credibility — credentials, results, and who you help."
        step="03"
      />
      <div className="flex flex-col gap-4">
        <Field
          label="Short bio"
          hint="Appears under your name on directory cards · 120 / 160 characters"
        >
          <TextArea
            rows={2}
            value="REPs Level 3 strength coach helping busy professionals build lean, resilient bodies through structured training and clear nutrition."
          />
        </Field>
        <Field
          label="About"
          hint="Shown on your full profile · 642 / 1200 characters"
        >
          <TextArea
            rows={7}
            value={`With over 9 years coaching clients across London and online, I specialise in strength-led programmes for people who want measurable, sustainable progress — without spending their life in the gym.

My approach blends evidence-based programming, weekly check-ins, and honest nutrition coaching. Clients typically train 3–4 times a week and follow a structured 12-week block tailored to their goals, lifestyle, and recovery.

I work with general population clients, post-rehab returners, and a small roster of competitive athletes. Every plan is built around the principle that consistency beats intensity — and that the best programme is the one you can actually follow.`}
          />
        </Field>
      </div>
    </Card>
  );
}

function Services() {
  const items = [
    {
      title: "Personal Training",
      desc: "1-to-1 in-person coaching at Carter Performance Studio, London.",
      price: "£75 / session",
    },
    {
      title: "Online Coaching",
      desc: "12-week structured programming with weekly check-ins and form review.",
      price: "£180 / month",
    },
    {
      title: "Nutrition Plan",
      desc: "Bespoke nutrition strategy with adherence tracking and adjustments.",
      price: "£120 / month",
    },
  ];
  return (
    <Card>
      <SectionHeader
        title="Services"
        subtitle="The packages clients can book directly from your profile."
        step="04"
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((s) => (
          <div
            key={s.title}
            className="flex flex-col gap-2 rounded-[12px] border border-reps-border bg-reps-ink p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="text-[13px] font-semibold text-white">
                {s.title}
              </div>
              <span className="rounded-full bg-reps-orange-soft px-2 py-0.5 text-[11px] font-semibold text-reps-orange">
                {s.price}
              </span>
            </div>
            <p className="text-[12px] leading-relaxed text-white/60">{s.desc}</p>
            <div className="mt-1 flex items-center gap-2">
              <button
                type="button"
                className="h-7 rounded-[8px] border border-reps-border bg-reps-panel-soft px-2.5 text-[11px] font-semibold text-white/70 shadow-none hover:text-white"
              >
                Edit
              </button>
              <button
                type="button"
                className="h-7 rounded-[8px] border border-reps-border bg-transparent px-2.5 text-[11px] font-semibold text-white/50 shadow-none hover:text-white/80"
              >
                Hide
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="flex min-h-[124px] flex-col items-center justify-center gap-1.5 rounded-[12px] border border-dashed border-reps-border bg-transparent text-[12px] font-semibold text-white/55 shadow-none transition-colors hover:border-reps-orange-border hover:text-reps-orange"
        >
          <Plus className="h-4 w-4" />
          Add service
        </button>
      </div>
    </Card>
  );
}

function Specialisms() {
  const tags = [
    "Strength Training",
    "Fat Loss",
    "Muscle Building",
    "Performance",
    "Online Coaching",
  ];
  return (
    <Card>
      <SectionHeader
        title="Specialisms"
        subtitle="What clients should hire you for — keep it focused."
        step="05"
      />
      <div className="flex flex-wrap items-center gap-2">
        {tags.map((t) => (
          <Chip key={t}>{t}</Chip>
        ))}
        <AddButton label="Add specialism" />
      </div>
    </Card>
  );
}

function Qualifications() {
  const quals = [
    {
      title: "REPs Level 3 Personal Trainer",
      issuer: "REPs Global",
      year: "2018 · Verified",
      verified: true,
    },
    {
      title: "Level 3 Diploma in Personal Training",
      issuer: "YMCAfit",
      year: "2017 · Verified",
      verified: true,
    },
  ];
  return (
    <Card>
      <SectionHeader
        title="Qualifications"
        subtitle="Verified credentials displayed on your public profile."
        step="06"
      />
      <ul className="flex flex-col gap-2">
        {quals.map((q) => (
          <li
            key={q.title}
            className="flex items-center gap-3 rounded-[12px] border border-reps-border bg-reps-ink px-3 py-3"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
              <GraduationCap className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-[13px] font-semibold text-white">
                  {q.title}
                </span>
                {q.verified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-reps-orange-soft px-2 py-0.5 text-[10px] font-semibold text-reps-orange">
                    <ShieldCheck className="h-3 w-3" />
                    Verified
                  </span>
                ) : null}
              </div>
              <div className="text-[11px] text-white/55">
                {q.issuer} · {q.year}
              </div>
            </div>
            <button
              type="button"
              className="h-8 rounded-[8px] border border-reps-border bg-reps-panel-soft px-2.5 text-[11px] font-semibold text-white/70 shadow-none hover:text-white"
            >
              Edit
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-3">
        <AddButton label="Add qualification" />
      </div>
    </Card>
  );
}

/* ============================================================
   RIGHT COLUMN
   ============================================================ */

function PublicPreview() {
  return (
    <Card className="p-0">
      <div className="flex items-center justify-between px-5 pt-5">
        <h2 className="font-display text-[15px] font-semibold text-white">
          Public profile preview
        </h2>
        <span className="rounded-full bg-reps-panel-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/55">
          Live
        </span>
      </div>
      <p className="px-5 pt-1 text-[12px] text-white/55">
        How your profile appears in the REPs directory.
      </p>

      <div className="p-5">
        <div className="overflow-hidden rounded-[18px] border border-reps-border bg-reps-ink">
          <div className="relative h-[88px] bg-gradient-to-br from-reps-orange/30 via-reps-panel to-reps-ink">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,122,0,0.35),transparent_55%)]" />
          </div>
          <div className="-mt-8 px-4 pb-4">
            <div className="flex items-end justify-between">
              <img
                src={proJames}
                alt=""
                className="h-16 w-16 rounded-full object-cover ring-4 ring-reps-panel"
              />
              <span className="inline-flex items-center gap-1 rounded-full bg-reps-orange-soft px-2 py-0.5 text-[10px] font-semibold text-reps-orange">
                <ShieldCheck className="h-3 w-3" />
                REPs Verified
              </span>
            </div>
            <div className="mt-3">
              <div className="text-[14px] font-semibold text-white">
                James Carter
              </div>
              <div className="text-[12px] text-white/60">
                Strength & Conditioning Coach
              </div>
              <div className="mt-1 flex items-center gap-3 text-[11px] text-white/55">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  London, UK
                </span>
                <span className="flex items-center gap-1 text-reps-orange">
                  <Star className="h-3 w-3 fill-current" />
                  <span className="font-semibold">5.0</span>
                  <span className="text-white/45">(128)</span>
                </span>
              </div>
            </div>
            <p className="mt-3 line-clamp-3 text-[12px] leading-relaxed text-white/65">
              REPs Level 3 strength coach helping busy professionals build lean,
              resilient bodies through structured training and clear nutrition.
            </p>
            <button
              type="button"
              className="mt-4 flex h-9 w-full items-center justify-center gap-1.5 rounded-[10px] border border-reps-border bg-reps-panel-soft text-[12px] font-semibold text-white shadow-none transition-colors hover:bg-reps-panel"
            >
              View full profile
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function ProfileCompletion() {
  const checklist = [
    { label: "Basic information", done: true },
    { label: "About and bio", done: true },
    { label: "Services", done: true },
    { label: "Specialisms", done: true },
    { label: "Qualifications", done: true },
    { label: "Media", done: true },
    { label: "Location and availability", done: false },
    { label: "Reviews and testimonials", done: false },
  ];
  const pct = 85;
  const r = 28;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <Card>
      <SectionHeader title="Profile completion" />
      <div className="flex items-center gap-4">
        <div className="relative h-[72px] w-[72px]">
          <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90">
            <circle
              cx="36"
              cy="36"
              r={r}
              fill="none"
              stroke="var(--reps-border)"
              strokeWidth="6"
            />
            <circle
              cx="36"
              cy="36"
              r={r}
              fill="none"
              stroke="var(--reps-orange)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-[15px] font-bold text-white">
            {pct}%
          </div>
        </div>
        <div className="flex-1">
          <div className="text-[13px] font-semibold text-white">
            Almost there
          </div>
          <p className="text-[11px] text-white/55">
            Complete 2 more sections to unlock priority directory placement.
          </p>
        </div>
      </div>
      <ul className="mt-4 space-y-2">
        {checklist.map((c) => (
          <li
            key={c.label}
            className="flex items-center gap-2 text-[12px] text-white/75"
          >
            {c.done ? (
              <CheckCircle2 className="h-4 w-4 text-reps-orange" />
            ) : (
              <span className="h-4 w-4 rounded-full border border-reps-border" />
            )}
            <span className={c.done ? "" : "text-white/45"}>{c.label}</span>
            {!c.done ? (
              <span className="ml-auto text-[11px] font-semibold text-reps-orange">
                Incomplete
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function VerificationStatus() {
  const rows = [
    { label: "REPs Verified Member", value: "Verified" },
    { label: "Professional Indemnity Insurance", value: "Verified" },
    { label: "CPD Compliance", value: "Compliant" },
    { label: "Qualifications Verified", value: "Up to date" },
  ];
  return (
    <Card>
      <SectionHeader
        title="Verification status"
        subtitle="Trust signals shown on your public profile."
      />
      <ul className="space-y-2">
        {rows.map((r) => (
          <li
            key={r.label}
            className="flex items-center justify-between gap-3 rounded-[12px] border border-reps-border bg-reps-ink px-3 py-2.5"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-reps-orange" />
              <span className="text-[12px] font-medium text-white/85">
                {r.label}
              </span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-reps-orange-soft px-2 py-0.5 text-[11px] font-semibold text-reps-orange">
              <CheckCircle2 className="h-3 w-3" />
              {r.value}
            </span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-[10px] border border-reps-orange-border bg-reps-orange-soft text-[13px] font-semibold text-reps-orange shadow-none transition-colors hover:bg-reps-orange/15"
      >
        <ShieldCheck className="h-4 w-4" />
        Manage verification
      </button>
    </Card>
  );
}

/* ============================================================
   FOOTER
   ============================================================ */

function DashboardFooter() {
  return (
    <footer className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-reps-border px-8 py-6 text-[12px] text-white/55 sm:flex-row">
      <div className="flex items-center gap-3">
        <span className="font-display text-[18px] font-bold tracking-tight text-white">
          REPs
        </span>
        <span className="border-l border-white/15 pl-3 text-[10px] leading-tight">
          The Register of
          <br />
          Exercise Professionals
        </span>
      </div>
      <div className="flex items-center gap-5">
        <span>© 2026 REPs. All rights reserved.</span>
        <a href="#" className="hover:text-white">Privacy Policy</a>
        <a href="#" className="hover:text-white">Terms of Service</a>
        <a href="#" className="hover:text-white">Contact Support</a>
      </div>
    </footer>
  );
}

/* ============================================================
   PAGE
   ============================================================ */

function ProfileEditorPage() {
  return (
    <div className="flex min-h-screen bg-reps-ink text-reps-text">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex flex-col gap-4 px-8 py-6">
          <ActionBar />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="flex flex-col gap-4 xl:col-span-8">
              <PhotoAndCover />
              <BasicInfo />
              <PublicBio />
              <Services />
              <Specialisms />
              <Qualifications />
            </div>
            <aside className="flex flex-col gap-4 xl:col-span-4">
              <PublicPreview />
              <ProfileCompletion />
              <VerificationStatus />
            </aside>
          </div>
        </main>
        <DashboardFooter />
      </div>
    </div>
  );
}
