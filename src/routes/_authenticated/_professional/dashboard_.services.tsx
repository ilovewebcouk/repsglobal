import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, Plus, Save, Sparkles, Star, Trash2 } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard, PPanel } from "@/components/dashboard/primitives";
import { useTrainerTier } from "@/lib/dashboard/useTrainerTier";
import { SpecialismsPicker } from "@/components/profile/SpecialismsPicker";
import {
  getMyDashboardProfile,
  updateMyDashboardProfile,
} from "@/lib/profile/dashboard-profile.functions";
import {
  getMyShopFront,
  upsertMyService,
  deleteMyService,
  type ServiceDTO,
} from "@/lib/shop-front/shop-front.functions";
import { getSpecialismLabel, type SpecialismSlug } from "@/lib/specialisms";


export const Route = createFileRoute("/_authenticated/_professional/dashboard_/services")({
  head: () => ({
    meta: [
      { title: "Services — REPS Professional" },
      {
        name: "description",
        content:
          "Choose the services you offer. These chips appear on your directory card and as coaching options on your enquiry form.",
      },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const tier = useTrainerTier();
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getMyDashboardProfile);
  const saveProfile = useServerFn(updateMyDashboardProfile);


  const { data, isLoading } = useQuery({
    queryKey: ["my-dashboard-profile"],
    queryFn: () => fetchProfile(),
  });

  const [specialisms, setSpecialisms] = React.useState<SpecialismSlug[]>([]);
  const [inPerson, setInPerson] = React.useState(true);
  const [online, setOnline] = React.useState(true);

  React.useEffect(() => {
    if (!data) return;
    setSpecialisms(data.specialisms ?? []);
    setInPerson(!!data.in_person_available);
    setOnline(!!data.online_available);
  }, [data]);

  const dirty =
    !!data &&
    (JSON.stringify(specialisms) !== JSON.stringify(data.specialisms ?? []) ||
      inPerson !== data.in_person_available ||
      online !== data.online_available);

  const saveMut = useMutation({
    mutationFn: () => {
      if (!data) throw new Error("Profile not loaded");
      if (!inPerson && !online)
        throw new Error("Pick at least one delivery mode (in-person or online).");
      return saveProfile({
        data: {
          // Pass-through all required fields so the server validator is happy.
          full_name: data.full_name,
          display_name: data.display_name,
          business_name: data.business_name,
          headline: data.headline,
          primary_profession: data.primary_profession,
          specialisms,
          in_person_available: inPerson,
          online_available: online,
          city: data.city,
          contact_phone: data.contact_phone,
          bio: data.bio,
          languages: data.languages,
          social_instagram: data.social_instagram,
          social_linkedin: data.social_linkedin,
          social_youtube: data.social_youtube,
          social_tiktok: data.social_tiktok,
          social_x: data.social_x,
        },
      });
    },
    onSuccess: () => {
      toast.success("Services updated");
      qc.invalidateQueries({ queryKey: ["my-dashboard-profile"] });
      qc.invalidateQueries({ queryKey: ["shop-front-public"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not save"),
  });


  return (
    <DashboardShell
      role="trainer"
      active="Services"
      tier={tier}
      title="Services you offer"
      subtitle="These chips appear on your directory card and as coaching options on your enquiry form."
      actions={
        <button
          type="button"
          disabled={!dirty || saveMut.isPending}
          onClick={() => saveMut.mutate()}
          className="flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saveMut.isPending ? "Saving…" : "Save changes"}
        </button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-6">
          {/* 01 — Specialisms */}
          <PPanel className="p-6">
            <header className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-[16px] font-semibold text-white">
                  What clients should hire you for
                </h2>
                <p className="mt-1 text-[13px] text-white/55">
                  Pick up to 3. These are the chips clients see on your directory card and the
                  "What kind of coaching" options on your enquire form.
                </p>
              </div>
              <span className="rounded-full border border-reps-orange-border bg-reps-orange-soft px-2.5 py-1 text-[11px] font-semibold text-reps-orange">
                01
              </span>
            </header>
            {isLoading ? (
              <div className="h-32 animate-pulse rounded-[16px] bg-reps-panel-soft" />
            ) : (
              <SpecialismsPicker
                values={specialisms}
                profession={data?.primary_profession ?? null}
                onChange={setSpecialisms}
              />
            )}
          </PPanel>

          {/* 02 — Delivery mode */}
          <PPanel className="p-6">
            <header className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-[16px] font-semibold text-white">
                  How you train clients
                </h2>
                <p className="mt-1 text-[13px] text-white/55">
                  At least one. Toggling both surfaces you in both "In-person" and "Online" filters.
                </p>
              </div>
              <span className="rounded-full border border-reps-orange-border bg-reps-orange-soft px-2.5 py-1 text-[11px] font-semibold text-reps-orange">
                02
              </span>
            </header>
            <div className="grid gap-3 sm:grid-cols-2">
              <ModeToggle
                label="In-person"
                hint="Studio, gym, or client's home"
                on={inPerson}
                onChange={setInPerson}
              />
              <ModeToggle
                label="Online"
                hint="Remote programmes and check-ins"
                on={online}
                onChange={setOnline}
              />
            </div>
          </PPanel>

          {/* 03 — Service cards (Verified + Pro). Up to 3 cards shown on your
              public profile and in the enquire form. */}
          <ServiceCardsEditor tier={tier} />



          {/* 03 — Pro upsell: Shop-front */}
          {tier === "verified" ? (
            <PPanel className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-[15px] font-semibold text-white">
                    Unlock your Shop-front
                  </h3>
                  <p className="mt-1 text-[13px] text-white/60">
                    Pro turns your listing into a full coach page — priced service packages,
                    "Most popular" highlight, online enquire / book / pay, and a guided client
                    onboarding flow. Verified members appear in the directory; Pro members sell
                    from it.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-[13px] font-semibold">
                    <Link
                      to="/features/shop-front"
                      className="inline-flex items-center gap-1.5 text-reps-orange hover:underline"
                    >
                      See the Shop-front <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <span className="text-white/30">·</span>
                    <Link
                      to="/pricing"
                      className="inline-flex items-center gap-1.5 text-white/70 hover:text-white"
                    >
                      Compare plans
                    </Link>
                  </div>
                </div>
              </div>
            </PPanel>
          ) : null}
        </div>

        {/* Live preview */}
        <aside className="flex flex-col gap-4">
          <PCard>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-[14px] font-semibold text-white">
                Directory card preview
              </h3>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-white/45">
                Live
              </span>
            </div>
            <div className="rounded-[18px] border border-reps-border bg-reps-ink p-4">
              <div className="text-[15px] font-semibold text-white">
                {data?.display_name || data?.full_name || "Your name"}
              </div>
              <div className="mt-0.5 text-[12.5px] text-white/55">
                {data?.headline || "Personal Trainer"}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-white/65">
                {inPerson ? (
                  <span className="rounded-full border border-reps-border bg-reps-panel-soft px-2 py-0.5">
                    In-person
                  </span>
                ) : null}
                {online ? (
                  <span className="rounded-full border border-reps-border bg-reps-panel-soft px-2 py-0.5">
                    Online
                  </span>
                ) : null}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {specialisms.length === 0 ? (
                  <span className="text-[12px] text-white/40">
                    Pick a specialism to see the chips appear here.
                  </span>
                ) : (
                  specialisms.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-reps-orange-border bg-reps-orange-soft px-2.5 py-0.5 text-[11.5px] font-semibold text-reps-orange"
                    >
                      {getSpecialismLabel(s) ?? s}
                    </span>
                  ))
                )}
              </div>
            </div>
            <p className="mt-3 text-[11.5px] text-white/45">
              Same chips appear on your public profile and as coaching options on your enquire
              form.
            </p>
          </PCard>

          <PCard>
            <h3 className="font-display text-[14px] font-semibold text-white">Where else this shows</h3>
            <ul className="mt-3 space-y-2 text-[12.5px] text-white/65">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-reps-orange" />
                <span>
                  <Link
                    to="/dashboard/profile"
                    className="text-white hover:text-reps-orange"
                  >
                    Public Profile
                  </Link>{" "}
                  · specialisms block
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-reps-orange" />
                <span>Directory cards (Find a Professional + City pages)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-reps-orange" />
                <span>Enquire form · "What kind of coaching" options</span>
              </li>
            </ul>
          </PCard>
        </aside>
      </div>
    </DashboardShell>
  );
}

function ModeToggle({
  label,
  hint,
  on,
  onChange,
}: {
  label: string;
  hint: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      aria-pressed={on}
      className={
        "flex items-start gap-3 rounded-[12px] border p-4 text-left transition-colors " +
        (on
          ? "border-reps-orange-border bg-reps-orange-soft/40"
          : "border-reps-border bg-reps-panel-soft hover:border-reps-orange-border/60")
      }
    >
      <span
        className={
          "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border " +
          (on
            ? "border-reps-orange bg-reps-orange text-white"
            : "border-reps-border bg-reps-ink text-transparent")
        }
      >
        ✓
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-semibold text-white">{label}</span>
        <span className="mt-0.5 block text-[12px] text-white/55">{hint}</span>
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Service cards editor (Verified + Pro) — up to 3 published rows.    */
/* Reuses upsertMyService / deleteMyService from shop-front.functions */
/* ------------------------------------------------------------------ */

const MAX_SERVICE_CARDS = 3;

type Draft = {
  id?: string;
  title: string;
  description: string;
  price_label: string;
  mode: "in_person" | "online" | "hybrid";
  is_featured: boolean;
};

const EMPTY_DRAFT: Draft = {
  title: "",
  description: "",
  price_label: "",
  mode: "in_person",
  is_featured: false,
};

function ServiceCardsEditor({ tier }: { tier: "verified" | "pro" | "studio" }) {
  const qc = useQueryClient();
  const fetchMine = useServerFn(getMyShopFront);
  const upsertSvc = useServerFn(upsertMyService);
  const deleteSvc = useServerFn(deleteMyService);
  const isPro = tier === "pro" || tier === "studio";

  const { data, isLoading } = useQuery({
    queryKey: ["my-shop-front"],
    queryFn: () => fetchMine(),
  });

  const services = data?.services ?? [];
  const publishedCount = services.filter((s) => s.is_published).length;
  const atCap = publishedCount >= MAX_SERVICE_CARDS;

  const [draft, setDraft] = React.useState<Draft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  function startEdit(s: ServiceDTO) {
    setEditingId(s.id);
    setDraft({
      id: s.id,
      title: s.title,
      description: s.description ?? "",
      price_label: s.price_label ?? "",
      mode: (s.mode as Draft["mode"]) ?? "in_person",
      is_featured: s.is_featured,
    });
  }

  function resetDraft() {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
  }

  const saveMut = useMutation({
    mutationFn: () =>
      upsertSvc({
        data: {
          id: draft.id,
          title: draft.title.trim(),
          description: draft.description.trim() || null,
          price_label: draft.price_label.trim() || null,
          price_pence: null,
          duration_minutes: null,
          mode: draft.mode,
          sort_order: editingId
            ? services.find((s) => s.id === editingId)?.sort_order ?? 0
            : services.length,
          is_published: true,
          is_featured: isPro ? draft.is_featured : false,
        },
      }),
    onSuccess: () => {
      toast.success(editingId ? "Service updated" : "Service added");
      qc.invalidateQueries({ queryKey: ["my-shop-front"] });
      qc.invalidateQueries({ queryKey: ["shop-front-public"] });
      resetDraft();
    },
    onError: (e: Error) => toast.error(e.message || "Could not save service"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteSvc({ data: { id } }),
    onSuccess: () => {
      toast.success("Service removed");
      qc.invalidateQueries({ queryKey: ["my-shop-front"] });
      qc.invalidateQueries({ queryKey: ["shop-front-public"] });
      if (editingId) resetDraft();
    },
  });

  return (
    <PPanel className="p-6">
      <header className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-[16px] font-semibold text-white">
            Service cards
          </h2>
          <p className="mt-1 text-[13px] text-white/55">
            Up to 3 cards. These show on your public profile and as the coaching
            options on your enquire form. A free Discovery Consultation is added
            automatically — you don't manage it here.
          </p>
        </div>
        <span className="rounded-full border border-reps-orange-border bg-reps-orange-soft px-2.5 py-1 text-[11px] font-semibold text-reps-orange">
          03
        </span>
      </header>

      {isLoading ? (
        <div className="h-24 animate-pulse rounded-[16px] bg-reps-panel-soft" />
      ) : (
        <div className="space-y-3">
          {services.length === 0 && (
            <p className="rounded-[12px] border border-dashed border-reps-border bg-reps-panel-soft/40 px-4 py-3 text-[12.5px] text-white/55">
              No services yet — add your first card below.
            </p>
          )}
          {services.map((s) => (
            <div
              key={s.id}
              className="flex items-start justify-between gap-3 rounded-[14px] border border-reps-border bg-reps-panel-soft px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="text-[13.5px] font-semibold text-white">{s.title}</div>
                  {s.is_featured && isPro ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-reps-orange-border bg-reps-orange-soft px-2 py-0.5 text-[10.5px] font-semibold text-reps-orange">
                      <Star className="h-3 w-3" /> Most popular
                    </span>
                  ) : null}
                </div>
                <div className="mt-0.5 text-[12px] text-white/55">
                  {(s.price_label || "Enquire") + " · " + s.mode.replace("_", " ")}
                </div>
                {s.description ? (
                  <p className="mt-1 line-clamp-2 text-[12.5px] text-white/65">
                    {s.description}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(s)}
                  className="h-8 rounded-[8px] border border-reps-border bg-reps-ink px-3 text-[12px] font-semibold text-white/80 hover:bg-reps-panel"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Delete "${s.title}"?`)) deleteMut.mutate(s.id);
                  }}
                  className="flex h-8 items-center gap-1 rounded-[8px] border border-reps-border bg-reps-ink px-2.5 text-[12px] text-red-300 hover:bg-reps-panel"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / edit form */}
      <div className="mt-4 rounded-[14px] border border-reps-border bg-reps-ink/60 p-4">
        <div className="flex items-center justify-between">
          <div className="text-[13px] font-semibold text-white">
            {editingId ? "Edit service" : "Add a service"}
          </div>
          {atCap && !editingId ? (
            <span className="text-[11.5px] font-semibold text-white/45">
              3 of 3 — delete one to add another
            </span>
          ) : null}
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="Title (e.g. 1:1 Personal Training)"
            maxLength={120}
            disabled={atCap && !editingId}
            className="h-10 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[13px] text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-reps-orange disabled:opacity-50"
          />
          <input
            value={draft.price_label}
            onChange={(e) => setDraft({ ...draft, price_label: e.target.value })}
            placeholder="Price (e.g. From £60 / session)"
            maxLength={60}
            disabled={atCap && !editingId}
            className="h-10 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[13px] text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-reps-orange disabled:opacity-50"
          />
          <select
            value={draft.mode}
            onChange={(e) => setDraft({ ...draft, mode: e.target.value as Draft["mode"] })}
            disabled={atCap && !editingId}
            className="h-10 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[13px] text-white disabled:opacity-50"
          >
            <option value="in_person">In person</option>
            <option value="online">Online</option>
            <option value="hybrid">Hybrid</option>
          </select>
          {isPro ? (
            <label className="flex items-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[13px] text-white/85">
              <input
                type="checkbox"
                checked={draft.is_featured}
                onChange={(e) => setDraft({ ...draft, is_featured: e.target.checked })}
                disabled={atCap && !editingId}
                className="h-4 w-4 accent-reps-orange"
              />
              Mark as "Most popular"
            </label>
          ) : (
            <div className="flex items-center rounded-[10px] border border-dashed border-reps-border bg-reps-panel-soft/40 px-3 text-[12px] text-white/45">
              "Most popular" highlight is Pro-only
            </div>
          )}
          <textarea
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder="Short description (1–2 lines)"
            maxLength={400}
            rows={2}
            disabled={atCap && !editingId}
            className="md:col-span-2 min-h-[64px] rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 py-2 text-[13px] text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-reps-orange disabled:opacity-50"
          />
        </div>
        <div className="mt-3 flex justify-end gap-2">
          {editingId ? (
            <button
              type="button"
              onClick={resetDraft}
              className="h-9 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[12.5px] font-semibold text-white/80 hover:bg-reps-panel"
            >
              Cancel
            </button>
          ) : null}
          <button
            type="button"
            disabled={
              !draft.title.trim() ||
              saveMut.isPending ||
              (!editingId && atCap)
            }
            onClick={() => saveMut.mutate()}
            className="flex h-9 items-center gap-2 rounded-[10px] bg-reps-orange px-3 text-[12.5px] font-semibold text-white hover:bg-reps-orange-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {editingId ? <Save className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {saveMut.isPending ? "Saving…" : editingId ? "Save changes" : "Add service"}
          </button>
        </div>
      </div>
    </PPanel>
  );
}

