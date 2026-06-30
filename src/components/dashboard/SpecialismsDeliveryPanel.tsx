import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save } from "lucide-react";

import { PPanel } from "@/components/dashboard/primitives";
import { SpecialismsPicker } from "@/components/profile/SpecialismsPicker";
import {
  getMyDashboardProfile,
  updateMyDashboardProfile,
} from "@/lib/profile/dashboard-profile.functions";
import type { SpecialismSlug } from "@/lib/specialisms";

/**
 * Specialism chips + In-person/Online delivery toggle.
 *
 * Lives at the top of the Website editor. The chips feed the directory
 * card, search filters and the enquire form's "What kind of coaching"
 * options; the delivery toggle drives In-person / Online search filters.
 */
export function SpecialismsDeliveryPanel() {
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
      toast.success("Specialisms updated");
      qc.invalidateQueries({ queryKey: ["my-dashboard-profile"] });
      qc.invalidateQueries({ queryKey: ["shop-front-public"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not save"),
  });

  return (
    <div id="specialisms" className="scroll-mt-24">
    <PPanel>
      <div className="flex items-start justify-between gap-4 border-b border-reps-border px-5 py-4">
        <div>
          <h3 className="text-[14px] font-semibold text-white">Specialisms & delivery</h3>
          <p className="mt-0.5 text-[12px] text-white/55">
            Pick up to 3 specialisms and choose how you train. These power your directory card
            chips, search filters and the enquire form's "What kind of coaching" options.
          </p>
        </div>
        <button
          type="button"
          disabled={!dirty || saveMut.isPending}
          onClick={() => saveMut.mutate()}
          className="flex h-9 shrink-0 items-center gap-2 rounded-[10px] bg-reps-orange px-3 text-[12.5px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" />
          {saveMut.isPending ? "Saving…" : "Save"}
        </button>
      </div>

      <div className="px-5 py-5">
        {isLoading ? (
          <div className="h-32 animate-pulse rounded-[16px] bg-reps-panel-soft" />
        ) : (
          <SpecialismsPicker
            values={specialisms}
            profession={data?.primary_profession ?? null}
            onChange={setSpecialisms}
          />
        )}

        <div className="mt-6">
          <div className="text-[13px] font-semibold text-white">How you train clients</div>
          <p className="mt-0.5 text-[12px] text-white/55">
            At least one. Toggling both surfaces you in both "In-person" and "Online" filters.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
        </div>
      </div>
    </PPanel>
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
