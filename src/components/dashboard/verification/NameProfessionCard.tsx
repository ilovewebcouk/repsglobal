import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Lock, UserRound } from "lucide-react";

import {
  getMyDashboardProfile,
  updateMyDashboardProfile,
} from "@/lib/profile/dashboard-profile.functions";
import { EarnedTitlePicker } from "@/components/profile/EarnedTitlePicker";

/**
 * Name & profession — the identity fields that used to live at the top of
 * the retired /dashboard/profile page. They belong on Verification: legal
 * name has to match the government ID uploaded here, and the profession is
 * unlocked by the qualifications also managed here.
 *
 * Legal name is the only field this card owns directly. Profession is
 * managed by EarnedTitlePicker, which saves itself via the CPD title
 * server fns.
 */
export function NameProfessionCard({ step }: { step?: string }) {
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getMyDashboardProfile);
  const saveProfile = useServerFn(updateMyDashboardProfile);

  const { data } = useQuery({
    queryKey: ["my-dashboard-profile"],
    queryFn: () => fetchProfile(),
  });

  const [fullName, setFullName] = React.useState("");
  const [justSaved, setJustSaved] = React.useState(false);

  React.useEffect(() => {
    if (!data) return;
    setFullName(data.full_name ?? "");
  }, [data]);

  const locked = data?.legal_name_locked ?? false;
  const dirty = !!data && (fullName || "") !== (data.full_name ?? "");

  const saveMut = useMutation({
    mutationFn: () => {
      if (!data) throw new Error("Profile not loaded");
      return saveProfile({
        data: { full_name: data.full_name, headline: data.headline, primary_profession: data.primary_profession, specialisms: data.specialisms, in_person_available: data.in_person_available, online_available: data.online_available, city: data.city, contact_phone: data.contact_phone, bio: data.bio, languages: data.languages, social_instagram: data.social_instagram, social_linkedin: data.social_linkedin, social_youtube: data.social_youtube, social_tiktok: data.social_tiktok, social_x: data.social_x,  },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-dashboard-profile"] });
      qc.invalidateQueries({ queryKey: ["my-trust-state"] });
      setJustSaved(true);
      window.setTimeout(() => setJustSaved(false), 2000);
      toast.success("Legal name saved");
    },
    onError: (e: Error) => toast.error(e.message || "Could not save"),
  });

  return (
    <section
      id="name"
      className="scroll-mt-24 rounded-[16px] border border-reps-border bg-reps-panel p-5"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <UserRound className="h-4 w-4 text-reps-orange" />
            <h2 className="font-display text-[15px] font-semibold text-white">
              Name & profession
            </h2>
          </div>
          <p className="mt-0.5 text-[12px] text-white/55">
            Your legal name must match your government ID and your qualification
            certificates. Profession is unlocked by the qualifications you upload below.
          </p>
        </div>
        {step ? (
          <span className="rounded-full bg-reps-panel-soft px-2.5 py-0.5 text-[11px] font-semibold text-white/60">
            {step}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-5">
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-medium text-white/75">
            <span>Legal name</span>
            {locked ? <Lock className="h-3 w-3 text-emerald-300" /> : null}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={locked}
              className={
                "h-10 flex-1 rounded-[12px] border px-3 text-[13px] focus:outline-none focus:ring-1 disabled:cursor-not-allowed " +
                (locked
                  ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300 focus:ring-emerald-400/40"
                  : "border-reps-border bg-reps-panel-soft text-white placeholder:text-white/40 focus:ring-reps-orange")
              }
              placeholder="As it appears on your government ID"
            />
            <div className="flex items-center gap-3">
              {justSaved && !dirty ? (
                <span className="text-[12px] text-emerald-300">Saved.</span>
              ) : null}
              <button
                type="button"
                onClick={() => saveMut.mutate()}
                disabled={!dirty || saveMut.isPending || locked}
                className={
                  "inline-flex h-10 items-center gap-2 rounded-[10px] px-4 text-[12.5px] font-semibold transition-colors " +
                  (locked
                    ? "border border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                    : "bg-reps-orange text-white hover:bg-reps-orange-hover disabled:opacity-50")
                }
              >
                {locked ? (
                  <>
                    <Lock className="h-3.5 w-3.5" />
                    Locked
                  </>
                ) : saveMut.isPending ? (
                  "Saving…"
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </div>
          <p className={locked ? "mt-1.5 text-[11.5px] text-emerald-300" : "mt-1.5 text-[11.5px] text-white/45"}>
            {locked
              ? "Locked — matches your verified ID. Contact REPs support to change it."
              : "Must match your government ID and your regulated qualification certificates."}
          </p>
        </div>

        <div className="border-t border-reps-border/60 pt-5">
          <div className="mb-2 text-[12.5px] font-medium text-white/75">
            Profession
          </div>
          <EarnedTitlePicker />
        </div>
      </div>
    </section>
  );
}
