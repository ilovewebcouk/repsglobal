import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { PPanel } from "@/components/dashboard/primitives";
import { SpecialismsPicker } from "@/components/profile/SpecialismsPicker";
import {
  getMyDashboardProfile,
  updateMyDashboardProfile,
} from "@/lib/profile/dashboard-profile.functions";
import type { SpecialismSlug } from "@/lib/specialisms";

/**
 * Specialism chips.
 *
 * Lives inside the Website editor. The chips feed the directory card,
 * search filters and the enquire form's "What kind of coaching" options.
 * Saving is handled by the page-level "Save & publish" — this panel
 * listens for the `reps:website:save-all` event and fires its own save
 * when the chips are dirty.
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

  React.useEffect(() => {
    if (!data) return;
    setSpecialisms(data.specialisms ?? []);
  }, [data]);

  const dirty =
    !!data && JSON.stringify(specialisms) !== JSON.stringify(data.specialisms ?? []);

  const saveMut = useMutation({
    mutationFn: () => {
      if (!data) throw new Error("Profile not loaded");
      return saveProfile({
        data: {
          full_name: data.full_name,
          display_name: data.display_name,
          business_name: data.business_name,
          headline: data.headline,
          primary_profession: data.primary_profession,
          specialisms,
          in_person_available: data.in_person_available,
          online_available: data.online_available,
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
      qc.invalidateQueries({ queryKey: ["my-dashboard-profile"] });
      qc.invalidateQueries({ queryKey: ["website-public"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not save specialisms"),
  });

  const saveAllRef = React.useRef<() => void>(() => {});
  saveAllRef.current = () => {
    if (dirty) saveMut.mutate();
  };
  React.useEffect(() => {
    const h = () => saveAllRef.current();
    window.addEventListener("reps:website:save-all", h);
    return () => window.removeEventListener("reps:website:save-all", h);
  }, []);

  const MAX = 7;
  const atCap = specialisms.length >= MAX;

  return (
    <div id="specialisms" className="scroll-mt-24">
    <PPanel>
      <div className="border-b border-reps-border px-5 py-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[14px] font-semibold text-white">Specialisms</h3>
          <p className="mt-0.5 text-[12px] text-white/55">
            Tap a chip to add. These power your directory card chips, search
            filters and the enquire form's "What kind of coaching" options.
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[12px] font-semibold tabular-nums ${
            atCap
              ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
              : "border-reps-border bg-reps-panel-soft text-white/70"
          }`}
        >
          {specialisms.length} of {MAX} selected
        </span>
      </div>

      <div className="px-5 py-5">
        {isLoading ? (
          <div className="h-32 animate-pulse rounded-[16px] bg-reps-panel-soft" />
        ) : (
          <SpecialismsPicker
            values={specialisms}
            profession={data?.primary_profession ?? null}
            onChange={setSpecialisms}
            hideCounter
            sortSelectedFirst
            onOverCapAttempt={() =>
              toast.warning(`You can pick up to ${MAX} specialisms.`)
            }
          />
        )}
      </div>
    </PPanel>
    </div>
  );
}

