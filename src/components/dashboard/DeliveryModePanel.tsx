import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  getMyDashboardProfile,
  updateMyDashboardProfile,
} from "@/lib/profile/dashboard-profile.functions";

/**
 * In-person / Online delivery toggle.
 *
 * Extracted from SpecialismsDeliveryPanel so it can live inside the
 * "Where I train" panel on the Website tab. Owns its own query + mutation
 * against the same dashboard profile record so the two panels never
 * clobber each other's writes.
 */
export function DeliveryModePanel() {
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getMyDashboardProfile);
  const saveProfile = useServerFn(updateMyDashboardProfile);

  const { data } = useQuery({
    queryKey: ["my-dashboard-profile"],
    queryFn: () => fetchProfile(),
  });

  const [inPerson, setInPerson] = React.useState(true);
  const [online, setOnline] = React.useState(true);
  const [initialised, setInitialised] = React.useState(false);

  React.useEffect(() => {
    if (!data || initialised) return;
    setInPerson(!!data.in_person_available);
    setOnline(!!data.online_available);
    setInitialised(true);
  }, [data, initialised]);

  const saveMut = useMutation({
    mutationFn: (next: { inPerson: boolean; online: boolean }) => {
      if (!data) throw new Error("Profile not loaded");
      if (!next.inPerson && !next.online)
        throw new Error("Pick at least one — in-person or online.");
      return saveProfile({
        data: {
          full_name: data.full_name,
          full_name: data.full_name,
          full_name: data.full_name,
          headline: data.headline,
          primary_profession: data.primary_profession,
          specialisms: data.specialisms,
          in_person_available: next.inPerson,
          online_available: next.online,
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
      toast.success("Delivery updated");
      qc.invalidateQueries({ queryKey: ["my-dashboard-profile"] });
      qc.invalidateQueries({ queryKey: ["website-public"] });
    },
    onError: (e: Error) => {
      // Roll back local state to the last saved value.
      if (data) {
        setInPerson(!!data.in_person_available);
        setOnline(!!data.online_available);
      }
      toast.error(e.message || "Could not save");
    },
  });

  const toggle = (which: "inPerson" | "online") => {
    const next = { inPerson, online, [which]: which === "inPerson" ? !inPerson : !online };
    if (!next.inPerson && !next.online) {
      toast.error("Pick at least one — in-person or online.");
      return;
    }
    setInPerson(next.inPerson);
    setOnline(next.online);
    saveMut.mutate({ inPerson: next.inPerson, online: next.online });
  };

  return (
    <div>
      <p className="text-[12px] text-white/55">
        At least one. Toggling both surfaces you in both "In-person" and "Online" filters.
      </p>
      <div className="mt-3 grid gap-3 min-[520px]:grid-cols-2">
        <ModeToggle
          label="In-person"
          hint="Studio, gym, or client's home"
          on={inPerson}
          onChange={() => toggle("inPerson")}
        />
        <ModeToggle
          label="Online"
          hint="Remote programmes and check-ins — adds the Online (worldwide) chip"
          on={online}
          onChange={() => toggle("online")}
        />
      </div>
    </div>
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
