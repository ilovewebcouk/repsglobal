import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { PPanel } from "@/components/dashboard/primitives";
import { LanguagePicker } from "@/components/forms/LanguagePicker";
import { SocialLinksPicker } from "@/components/profile/SocialLinksPicker";
import { PhoneField, isValidPhoneNumber } from "@/components/forms/PhoneField";
import {
  getMyDashboardProfile,
  updateMyDashboardProfile,
} from "@/lib/profile/dashboard-profile.functions";

/**
 * Languages, social links and contact phone — the "extras" that used to live
 * on the retired /dashboard/profile page.
 *
 * Follows the same pattern as SpecialismsDeliveryPanel: reads via
 * getMyDashboardProfile, saves via updateMyDashboardProfile passing every
 * other field through unchanged, and listens for the page-level
 * `reps:website:save-all` event fired by the Publish flow.
 */
export function ContactSocialsPanel() {
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getMyDashboardProfile);
  const saveProfile = useServerFn(updateMyDashboardProfile);

  const { data } = useQuery({
    queryKey: ["my-dashboard-profile"],
    queryFn: () => fetchProfile(),
  });

  const [languages, setLanguages] = React.useState<string[]>([]);
  const [contactPhone, setContactPhone] = React.useState<string>("");
  const [socials, setSocials] = React.useState({
    social_instagram: "",
    social_linkedin: "",
    social_youtube: "",
    social_tiktok: "",
    social_x: "",
  });

  React.useEffect(() => {
    if (!data) return;
    setLanguages(data.languages ?? []);
    setContactPhone(data.contact_phone ?? "");
    setSocials({
      social_instagram: data.social_instagram ?? "",
      social_linkedin: data.social_linkedin ?? "",
      social_youtube: data.social_youtube ?? "",
      social_tiktok: data.social_tiktok ?? "",
      social_x: data.social_x ?? "",
    });
  }, [data]);

  const phoneValid = !contactPhone || isValidPhoneNumber(contactPhone);
  const dirty =
    !!data &&
    (JSON.stringify(languages) !== JSON.stringify(data.languages ?? []) ||
      (contactPhone || "") !== (data.contact_phone ?? "") ||
      socials.social_instagram !== (data.social_instagram ?? "") ||
      socials.social_linkedin !== (data.social_linkedin ?? "") ||
      socials.social_youtube !== (data.social_youtube ?? "") ||
      socials.social_tiktok !== (data.social_tiktok ?? "") ||
      socials.social_x !== (data.social_x ?? ""));

  const saveMut = useMutation({
    mutationFn: () => {
      if (!data) throw new Error("Profile not loaded");
      if (!phoneValid) throw new Error("Contact phone number looks invalid.");
      return saveProfile({
        data: {
          full_name: data.full_name: data.full_name: data.full_name,
          headline: data.headline,
          primary_profession: data.primary_profession,
          specialisms: data.specialisms,
          in_person_available: data.in_person_available,
          online_available: data.online_available,
          city: data.city,
          contact_phone: contactPhone || null,
          bio: data.bio,
          languages,
          social_instagram: socials.social_instagram || null,
          social_linkedin: socials.social_linkedin || null,
          social_youtube: socials.social_youtube || null,
          social_tiktok: socials.social_tiktok || null,
          social_x: socials.social_x || null,
        },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-dashboard-profile"] });
      qc.invalidateQueries({ queryKey: ["website-public"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not save"),
  });

  const saveAllRef = React.useRef<() => void>(() => {});
  saveAllRef.current = () => {
    if (dirty && phoneValid) saveMut.mutate();
  };
  React.useEffect(() => {
    const h = () => saveAllRef.current();
    window.addEventListener("reps:website:save-all", h);
    return () => window.removeEventListener("reps:website:save-all", h);
  }, []);

  return (
    <div id="contact" className="scroll-mt-24 flex flex-col gap-4">
      <PPanel>
        <div className="border-b border-reps-border px-5 py-4">
          <h3 className="text-[14px] font-semibold text-white">Languages spoken</h3>
          <p className="mt-0.5 text-[12px] text-white/55">
            Pick up to 4 — clients filter search by language.
          </p>
        </div>
        <div className="px-5 py-4">
          <LanguagePicker values={languages} onChange={setLanguages} />
        </div>
      </PPanel>

      <PPanel>
        <div className="border-b border-reps-border px-5 py-4">
          <h3 className="text-[14px] font-semibold text-white">Social links</h3>
          <p className="mt-0.5 text-[12px] text-white/55">
            Add the platforms you use. Paste a full URL or @ handle — we clean it up.
          </p>
        </div>
        <div className="px-5 py-4">
          <SocialLinksPicker
            values={socials}
            onChange={(field, value) =>
              setSocials((cur) => ({ ...cur, [field]: value }))
            }
          />
        </div>
      </PPanel>

      <PPanel>
        <div className="border-b border-reps-border px-5 py-4">
          <h3 className="text-[14px] font-semibold text-white">Contact phone</h3>
          <p className="mt-0.5 text-[12px] text-white/55">
            Internal only — never shown on your public page. Used for booking notifications and REPs support.
          </p>
        </div>
        <div className="px-5 py-4">
          <PhoneField
            value={contactPhone}
            onChange={(v) => setContactPhone(v)}
          />
          {!phoneValid ? (
            <p className="mt-2 text-[12px] text-rose-300">
              That doesn't look like a valid phone number.
            </p>
          ) : null}
        </div>
      </PPanel>
    </div>
  );
}
