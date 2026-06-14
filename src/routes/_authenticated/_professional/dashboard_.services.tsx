import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, Save, Sparkles } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard, PPanel } from "@/components/dashboard/primitives";
import { useTrainerTier } from "@/lib/dashboard/useTrainerTier";
import { SpecialismsPicker } from "@/components/profile/SpecialismsPicker";
import {
  getMyDashboardProfile,
  updateMyDashboardProfile,
} from "@/lib/profile/dashboard-profile.functions";
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
              <SpecialismsPicker values={specialisms} onChange={setSpecialisms} />
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
