import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MapPin, Pencil, Plus, Quote, Save, Sparkles, Trash2 } from "lucide-react";
import { TransformationImageEditor } from "@/components/dashboard/TransformationImageEditor";
import { GymPicker } from "@/components/profile/GymPicker";
import { getMyPrimaryLocation, saveMyPrimaryPostcode } from "@/lib/profile/location.functions";
import { getMyDashboardProfile, updateMyTrainingBase } from "@/lib/profile/dashboard-profile.functions";
import { PillarEditDialog } from "@/components/dashboard/website/PillarEditDialog";
import {
  ResultEditDialog,
  draftFromResult,
  type ResultDraft,
} from "@/components/dashboard/website/ResultEditDialog";
import {
  FaqEditDialog,
  draftFromFaq,
  type FaqDraft,
} from "@/components/dashboard/website/FaqEditDialog";
import {
  publishMyWebsite,
  getMyPublishState,
  getMyPreviewToken,
  getMySectionDiff,
  discardMySectionChanges,
} from "@/lib/website/publish.functions";
import { PublishConfirmDialog } from "@/components/dashboard/website/PublishConfirmDialog";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard, PPanel } from "@/components/dashboard/primitives";
import { ProfilePhotoPanel } from "@/components/dashboard/ProfilePhotoPanel";
import { useTrainerTier } from "@/lib/dashboard/useTrainerTier";
import {
  WebsiteEditorLayout,
  type WebsiteEditorSection,
} from "@/components/dashboard/website/WebsiteEditorLayout";
import { WebsiteSectionsSidebar } from "@/components/dashboard/website/WebsiteSectionsSidebar";
import { computeWebsiteSections } from "@/lib/dashboard/website-sections";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  getMyWebsite,
  upsertMyWebsite,
  upsertMyService,
  deleteMyService,
  type ServiceDTO,
} from "@/lib/website/website.functions";
import { DEFAULT_SERVICE_CARDS, defaultServiceForSlot } from "@/lib/website/default-services";
import {
  getMyWebsiteContent,
  saveMyWebsiteContent,
  upsertTransformation,
  deleteTransformation,
  upsertFaq,
  deleteFaq,
  aiDraftMethod,
  aiDraftFaqs,
  aiDraftTagline,
  aiDraftAbout,
  aiDraftSubtitle,
  type MethodPillar,
  type TransformationDTO,
  type FaqDTO,
} from "@/lib/website/website-content.functions";
import { HeroImageEditor } from "@/components/dashboard/HeroImageEditor";
import { ServiceImageEditor } from "@/components/dashboard/ServiceImageEditor";
import { SpecialismsDeliveryPanel } from "@/components/dashboard/SpecialismsDeliveryPanel";
import { ContactSocialsPanel } from "@/components/dashboard/ContactSocialsPanel";
import { DeliveryModePanel } from "@/components/dashboard/DeliveryModePanel";
import { FieldCounter } from "@/components/dashboard/website/FieldCounter";

export const Route = createFileRoute("/_authenticated/_professional/dashboard_/website")({
  head: () => ({
    meta: [
      { title: "Website — REPS Professional" },
      { name: "description", content: "Edit your public REPS website — services, pricing and content." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: WebsiteEditorPage,
});

function Field({ label, hint, action, children }: { label: string; hint?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border-b border-reps-border/60 px-5 py-4 last:border-b-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-white">{label}</div>
          {hint && <p className="mt-0.5 text-[12px] text-white/55">{hint}</p>}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function AIDraftButton({ onClick, pending, label = "AI draft" }: { onClick: () => void; pending: boolean; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="inline-flex items-center gap-1 rounded-[8px] border border-reps-border bg-reps-panel-soft px-2 py-1 text-[11px] font-semibold text-white/80 hover:bg-reps-panel hover:text-white disabled:opacity-60"
    >
      <Sparkles className="h-3 w-3" />
      {pending ? "Drafting…" : label}
    </button>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-10 w-full rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 text-[13px] text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-reps-orange"
    />
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="min-h-[120px] w-full rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 py-2 text-[13px] text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-reps-orange"
    />
  );
}

function CurrentClientsField({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  const shown = value !== null;
  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2 text-[12px] text-white/70">
        <input
          type="checkbox"
          checked={shown}
          onChange={(e) => onChange(e.target.checked ? 0 : null)}
          className="h-3.5 w-3.5 rounded-[4px] border-reps-border bg-reps-panel-soft accent-reps-orange"
        />
        Show this on my public page
      </label>
      {shown ? (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={20}
            value={value ?? 0}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n)) onChange(Math.max(0, Math.min(20, Math.round(n))));
            }}
            className="h-10 w-20 rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-reps-orange"
          />
          <span className="text-[12px] text-white/55">of 20 spaces (cap is fixed)</span>
        </div>
      ) : null}
    </div>
  );
}




function WebsiteEditorPage() {
  const tier = useTrainerTier();
  const navigate = Route.useNavigate();
  const blocked = false;

  // Training providers don't use the coach website editor — send them home.
  React.useEffect(() => {
    if (tier === "training_provider") {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [tier, navigate]);

  // Core members get the Lite website; Pro/Studio get the full editor.

  const qc = useQueryClient();
  const fetchMine = useServerFn(getMyWebsite);
  const upsertSf = useServerFn(upsertMyWebsite);
  const upsertSvc = useServerFn(upsertMyService);
  const deleteSvc = useServerFn(deleteMyService);
  const draftTaglineFn = useServerFn(aiDraftTagline);
  const draftAboutFn = useServerFn(aiDraftAbout);

  const { data, isLoading } = useQuery({
    queryKey: ["my-website"],
    queryFn: () => fetchMine(),
  });

  const sf = data?.website ?? null;
  const services = data?.services ?? [];

  const [tagline, setTagline] = React.useState("");
  const [subtitle, setSubtitle] = React.useState("");
  const [aboutHeadline, setAboutHeadline] = React.useState("");
  const [about, setAbout] = React.useState("");
  const [hero, setHero] = React.useState("");
  const [currentClients, setCurrentClients] = React.useState<number | null>(null);
  
  const [layout, setLayout] = React.useState<"lite" | "full">("lite");
  const [theme] = React.useState<"dark" | "light">("dark");

  React.useEffect(() => {
    if (!sf) return;
    setTagline(sf.tagline ?? "");
    setSubtitle(sf.subtitle ?? "");
    setAboutHeadline((sf as { about_headline?: string | null }).about_headline ?? "");
    setAbout(sf.about ?? "");
    setHero(sf.hero_image_url ?? "");
    setCurrentClients(sf.current_clients ?? null);
    setLayout(sf.layout_variant);
  }, [sf]);

  // Ref used to suppress the "Website saved" toast when Save is being
  // invoked internally as a prerequisite of Publish (the Publish toast is
  // enough — no need to fire two toasts for one click).
  const suppressSaveToastRef = React.useRef(false);

  const saveMutation = useMutation({
    mutationFn: () =>
      upsertSf({
        data: {
          tagline: tagline || null,
          subtitle: subtitle || null,
          about_headline: aboutHeadline || null,
          about: about || null,
          hero_image_url: hero || null,
          accent_hex: null,
          layout_variant: layout,
          theme,
          current_clients: currentClients,
        },
      }),


    onSuccess: () => {
      if (!suppressSaveToastRef.current) {
        toast.success("Website saved");
      }
      qc.invalidateQueries({ queryKey: ["my-website"] });
      qc.invalidateQueries({ queryKey: ["my-website-publish-state"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not save"),
  });

  const [taglineDialogOpen, setTaglineDialogOpen] = React.useState(false);
  const [aboutDialogOpen, setAboutDialogOpen] = React.useState(false);
  const [taglineAudience, setTaglineAudience] = React.useState("");
  const [taglineSpecialisms, setTaglineSpecialisms] = React.useState<string[]>([]);
  const [aboutAudience, setAboutAudience] = React.useState("");
  const [aboutDifferentiator, setAboutDifferentiator] = React.useState("");
  const [aboutTone, setAboutTone] = React.useState<"warm" | "direct" | "professional" | "playful">("warm");

  const draftTaglineMut = useMutation({
    mutationFn: (input: { audience: string; specialisms: string[] }) =>
      draftTaglineFn({ data: input }),
    onSuccess: (r) => {
      setTagline(r.tagline);
      setTaglineDialogOpen(false);
      toast.success("Tagline drafted — review and save.");
    },
    onError: (e: Error) => toast.error(e.message || "Could not draft tagline"),
  });

  const draftAboutMut = useMutation({
    mutationFn: (input: { audience: string; differentiator: string; tone: "warm" | "direct" | "professional" | "playful" }) =>
      draftAboutFn({ data: input }),
    onSuccess: (r) => {
      setAbout(r.about);
      setAboutDialogOpen(false);
      toast.success("About drafted — review and save.");
    },
    onError: (e: Error) => toast.error(e.message || "Could not draft About"),
  });

  const upsertServiceMut = useMutation({
    mutationFn: async (s: Partial<ServiceDTO> & { title: string }) => {
      // Enforce single "Most popular": when marking this one featured,
      // clear is_featured on any other existing services first.
      if (s.is_featured) {
        const others = services.filter((x) => x.is_featured && x.id !== s.id);
        for (const o of others) {
          await upsertSvc({
            data: {
              id: o.id,
              title: o.title,
              description: o.description ?? null,
              price_pence: o.price_pence ?? null,
              price_label: o.price_label ?? null,
              price_unit: (o.price_unit as never) ?? null,
              duration_minutes: o.duration_minutes ?? null,
              mode: (o.mode as "in_person" | "online" | "hybrid") ?? "in_person",
              sort_order: o.sort_order ?? 0,
              is_published: o.is_published ?? true,
              is_featured: false,
              bullets: Array.isArray(o.bullets) ? o.bullets : [],
              cta_label: o.cta_label ?? null,
            },
          });
        }
      }
      return upsertSvc({
        data: {
          id: s.id,
          title: s.title,
          description: s.description ?? null,
          price_pence: s.price_pence ?? null,
          price_label: s.price_label ?? null,
          price_unit: (s.price_unit as never) ?? null,
          duration_minutes: s.duration_minutes ?? null,
          mode: (s.mode as "in_person" | "online" | "hybrid") ?? "in_person",
          sort_order: s.sort_order ?? 0,
          is_published: s.is_published ?? true,
          is_featured: s.is_featured ?? false,
          bullets: Array.isArray(s.bullets) ? s.bullets : [],
          cta_label: s.cta_label ?? null,
        },
      });
    },
    onSuccess: () => {
      toast.success("Service saved");
      qc.invalidateQueries({ queryKey: ["my-website"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not save service"),
  });

  const reorderServicesMut = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      for (let i = 0; i < orderedIds.length; i++) {
        const o = services.find((x) => x.id === orderedIds[i]);
        if (!o || o.sort_order === i) continue;
        await upsertSvc({
          data: {
            id: o.id,
            title: o.title,
            description: o.description ?? null,
            price_pence: o.price_pence ?? null,
            price_label: o.price_label ?? null,
            price_unit: (o.price_unit as never) ?? null,
            duration_minutes: o.duration_minutes ?? null,
            mode: (o.mode as "in_person" | "online" | "hybrid") ?? "in_person",
            sort_order: i,
            is_published: o.is_published ?? true,
            is_featured: o.is_featured ?? false,
            bullets: Array.isArray(o.bullets) ? o.bullets : [],
            cta_label: o.cta_label ?? null,
          },
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-website"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not reorder"),
  });


  const deleteServiceMut = useMutation({
    mutationFn: (id: string) => deleteSvc({ data: { id } }),
    onSuccess: () => {
      toast.success("Service removed");
      qc.invalidateQueries({ queryKey: ["my-website"] });
    },
  });

  const slug = sf?.slug;
  const isPro = tier === "pro" || tier === "studio";
  void isPro;

  // Live-preview reload nonce (used to force iframe refresh after publish).
  const [reloadNonce, setReloadNonce] = React.useState(0);

  // Fetch website content at page level so we can drive completeness pills
  // for method / results / faqs / location in the section rail. The
  // WebsiteContentEditor child re-reads the same query key from cache.
  const fetchContent = useServerFn(getMyWebsiteContent);
  const contentQuery = useQuery({
    queryKey: ["my-website-content"],
    queryFn: () => fetchContent(),
  });
  const content = contentQuery.data;

  // Page-level fetches used purely to derive sidebar status pills for
  // Profile photo, Specialisms and Where I train. The editor panels have
  // their own copies of these queries — react-query dedupes them.
  const fetchProfileFn = useServerFn(getMyDashboardProfile);
  const profileQuery = useQuery({
    queryKey: ["my-dashboard-profile"],
    queryFn: () => fetchProfileFn(),
  });
  const fetchLocationFn = useServerFn(getMyPrimaryLocation);
  const locationQuery = useQuery({
    queryKey: ["my-primary-location"],
    queryFn: () => fetchLocationFn(),
  });

  // Which section is focused in the editor.
  const [activeSection, setActiveSection] = React.useState<string>("basics");

  // Draft-vs-published state. Editor writes update live rows; triggers flip
  // has_unpublished_changes on the websites row. Publishing snapshots the
  // current live content into websites.published_snapshot; the public
  // /c/$slug page reads that snapshot until the next publish.
  const fetchPublishStateFn = useServerFn(getMyPublishState);
  const publishStateQuery = useQuery({
    queryKey: ["my-website-publish-state"],
    queryFn: () => fetchPublishStateFn(),
    // Editor invalidates this key after every save/publish, so background
    // window-focus refetches only cause a "Loading…" flash without adding
    // freshness. Keep it stable while the tab is idle.
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
  const publishState = publishStateQuery.data;
  const publishNowFn = useServerFn(publishMyWebsite);

  // Signed preview token for the iframe. Refetched on a slow interval so a
  // long editing session doesn't hit the 4h expiry mid-flight.
  const fetchPreviewTokenFn = useServerFn(getMyPreviewToken);
  const previewTokenQuery = useQuery({
    queryKey: ["my-website-preview-token"],
    queryFn: () => fetchPreviewTokenFn(),
    staleTime: 60 * 60 * 1000, // 1h — server issues 4h tokens
    refetchInterval: 60 * 60 * 1000,
  });
  const previewToken = previewTokenQuery.data?.token ?? null;

  // Per-section diff (live vs snapshot) — drives sidebar dirty dots and the
  // publish confirm dialog. Cheap to fetch; re-runs whenever any section
  // saves via the invalidation below.
  const fetchSectionDiffFn = useServerFn(getMySectionDiff);
  const sectionDiffQuery = useQuery({
    queryKey: ["my-website-section-diff"],
    queryFn: () => fetchSectionDiffFn(),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
  const sectionDiff = sectionDiffQuery.data;


  // Optimistic dirty tracker. Any mutation success anywhere in the editor
  // bumps `localDirtyBump`; publish/discard reset `publishedDirtyBaseline`
  // to the current value. If bump > baseline we know something was edited
  // since the last publish, even before the publish-state query refetches.
  //
  // Also acts as a safety net for panels whose mutations invalidate only
  // their own domain queryKey — the mutation-cache subscription below
  // catches every mutation success and forces publish-state + section-diff
  // to refetch, so the DB-driven `has_unpublished_changes` flag surfaces
  // in the UI without every mutation having to know about it.
  const [localDirtyBump, setLocalDirtyBump] = React.useState(0);
  const [publishedDirtyBaseline, setPublishedDirtyBaseline] = React.useState(0);
  React.useEffect(() => {
    const cache = qc.getMutationCache();
    const unsub = cache.subscribe((event) => {
      if (event.type !== "updated") return;
      if (event.mutation.state.status !== "success") return;
      // Ignore the publish/discard mutations themselves (they reset baseline
      // in their own onSuccess). Everything else is a content edit.
      const key = event.mutation.options.mutationKey?.[0];
      if (key === "website-publish" || key === "website-discard") return;
      setLocalDirtyBump((n) => n + 1);
      qc.invalidateQueries({ queryKey: ["my-website-publish-state"] });
      qc.invalidateQueries({ queryKey: ["my-website-section-diff"] });
    });
    return () => unsub();
  }, [qc]);


  // Dirty tracking for the basics fields owned here (tagline/subtitle/about_headline/about/hero/current_clients).
  const basicsDirty =
    !!sf &&
    ((tagline || "") !== (sf.tagline ?? "") ||
      (subtitle || "") !== (sf.subtitle ?? "") ||
      (aboutHeadline || "") !== ((sf as { about_headline?: string | null }).about_headline ?? "") ||
      (about || "") !== (sf.about ?? "") ||
      (hero || "") !== (sf.hero_image_url ?? "") ||
      (currentClients ?? null) !== (sf.current_clients ?? null));

  // What the sidebar/publish bar considers "unpublished" — either the
  // in-form basics haven't been saved yet, the server tells us there's
  // content changed since last publish, or we've had a mutation succeed
  // locally since the last publish/discard (optimistic — bridges the gap
  // before the publish-state query refetch resolves).
  const isDirty =
    basicsDirty ||
    !!publishState?.has_unpublished_changes ||
    localDirtyBump > publishedDirtyBaseline;

  const saveAll = React.useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      saveMutation.mutate(undefined, {
        onSuccess: () => {
          // Fan-out to child sections that own their own local state.
          window.dispatchEvent(new CustomEvent("reps:website:save-all"));
          resolve();
        },
        onError: (e) => reject(e),
      });
    });
  }, [saveMutation]);

  const publishMut = useMutation({
    mutationKey: ["website-publish"],
    mutationFn: async () => {
      if (basicsDirty) {
        suppressSaveToastRef.current = true;
        try {
          await saveAll();
        } catch (e) {
          throw new Error((e as Error).message || "Save failed");
        } finally {
          suppressSaveToastRef.current = false;
        }
      }
      return publishNowFn();
    },
    onSuccess: () => {
      toast.success("Website published — your public page is live.");
      qc.invalidateQueries({ queryKey: ["my-website-publish-state"] });
      qc.invalidateQueries({ queryKey: ["my-website-section-diff"] });
      setPublishedDirtyBaseline(localDirtyBump);
      setPublishDialogOpen(false);
      setReloadNonce((n) => n + 1);
    },
    onError: (e: Error) => toast.error(e.message || "Could not publish"),
  });

  // Publish confirm dialog wiring. Clicking Publish always opens the dialog;
  // the dialog's "Publish now" action runs the mutation.
  const [publishDialogOpen, setPublishDialogOpen] = React.useState(false);
  const publishNow = React.useCallback(() => {
    // Refresh the diff before opening so the dialog summary is current.
    sectionDiffQuery.refetch();
    setPublishDialogOpen(true);
  }, [sectionDiffQuery]);

  // Per-section discard.
  const discardFn = useServerFn(discardMySectionChanges);
  const [discardingId, setDiscardingId] = React.useState<string | null>(null);
  const discardMut = useMutation({
    mutationKey: ["website-discard"],
    mutationFn: (section: "basics" | "method" | "plans" | "results" | "faqs") =>
      discardFn({ data: { section } }),
    onSuccess: (_r, section) => {
      toast.success(`${section} reverted to last published version`);
      // Full refresh — the live rows just changed underneath us.
      qc.invalidateQueries({ queryKey: ["my-website"] });
      qc.invalidateQueries({ queryKey: ["my-website-content"] });
      qc.invalidateQueries({ queryKey: ["my-website-section-diff"] });
      qc.invalidateQueries({ queryKey: ["my-website-publish-state"] });
      setPublishedDirtyBaseline(localDirtyBump);
      setDiscardingId(null);
      setReloadNonce((n) => n + 1);
    },
    onError: (e: Error) => {
      toast.error(e.message || "Could not discard changes");
      setDiscardingId(null);
    },
  });
  const onDiscardSection = React.useCallback(
    (id: "basics" | "method" | "plans" | "results" | "faqs") => {
      setDiscardingId(id);
      discardMut.mutate(id);
    },
    [discardMut],
  );


  // Any time content queries refetch (services/transformations/faqs saved
  // via child mutations), refresh publish-state too so the "Unpublished
  // changes" pill and the Publish button reflect reality.
  const contentUpdatedAt = contentQuery.dataUpdatedAt;
  const websiteUpdatedAt = data && (data as unknown as { updatedAt?: number }).updatedAt;
  React.useEffect(() => {
    qc.invalidateQueries({ queryKey: ["my-website-publish-state"] });
    qc.invalidateQueries({ queryKey: ["my-website-section-diff"] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentUpdatedAt, websiteUpdatedAt, services.length]);




  // Build the section list + completeness. Kept tolerant so the rail
  // still renders while queries load. Ordering: photo → basics →
  // specialisms → location → plans → method → results → faqs.
  const sections: WebsiteEditorSection[] = React.useMemo(() => {
    const trimmed = (s: string | null | undefined) => (s ?? "").trim();
    const profile = profileQuery.data;
    const loc = locationQuery.data;

    const methodPillarCount = (content?.content.method_pillars ?? []).filter(
      (p) => p.title?.trim() && p.body?.trim(),
    ).length;

    return computeWebsiteSections({
      hasAvatar: !!profile?.avatar_url,
      tagline,
      subtitle,
      about,
      heroImageUrl: hero,
      specialismCount: profile?.specialisms?.length ?? 0,
      hasPostcode: !!trimmed(loc?.postcode ?? ""),
      hasDelivery: !!(profile?.in_person_available || profile?.online_available),
      serviceCount: services.length,
      hasWebsiteRow: !!content,
      methodName: content?.content.method_name ?? null,
      methodPillarCount,
      transformationCount: content?.transformations?.length ?? 0,
      faqCount: content?.faqs?.length ?? 0,
      languageCount: profile?.languages?.length ?? 0,
      socialCount: [
        profile?.social_instagram,
        profile?.social_linkedin,
        profile?.social_youtube,
        profile?.social_tiktok,
        profile?.social_x,
      ].filter((v) => !!v?.trim()).length,
      hasPhone: !!trimmed(profile?.contact_phone ?? ""),
    });
  }, [
    tagline,
    subtitle,
    about,
    hero,
    services.length,
    content,
    profileQuery.data,
    locationQuery.data,
  ]);


  const active = sections.find((s) => s.id === activeSection) ?? sections[0];
  const sectionCopy: Record<string, { title: string; description: string }> = {
    profile: {
      title: "Profile photo",
      description: "A clear photo of you (head-and-shoulders or waist-up) helps clients trust and recognise you.",
    },
    basics: {
      title: "Website basics",
      description: slug
        ? `Tagline, About and hero image for /c/${slug}.`
        : "Tagline, About and hero image for your public page.",
    },
    plans: {
      title: "Coaching plans",
      description:
        "Three cards on your public website. The middle card is always marked \u201cMost popular\u201d.",
    },
    method: {
      title: "How I coach",
      description: "A short method name, intro and three pillars.",
    },
    specialisms: {
      title: "Specialisms",
      description: "Which specialisms show on your public page.",
    },
    location: {
      title: "Where I train",
      description: "Postcode, gyms and cities. Powers distance search and location chips.",
    },
    results: {
      title: "Client results",
      description: "Image + metric proof cards shown in the Results section.",
    },
    faqs: {
      title: "Frequently asked questions",
      description: "Answer the questions clients ask before they book.",
    },
    contact: {
      title: "Languages & socials",
      description:
        "Languages you speak, social links shown on your public page, and your internal contact phone.",
    },
  };
  const activeCopy = sectionCopy[active.id] ?? { title: active.label, description: "" };

  if (blocked) return null;

  return (
    <DashboardShell
      role="trainer"
      active="Website"
      tier={tier}
      title="Website"
      showTopbarSearch={false}
      subtitle="Edit one section at a time — the live preview updates when you publish."
      mainClassName="!p-0"
      hideTopBar
      sidebarOverride={
        <WebsiteSectionsSidebar
          sections={sections}
          activeId={active.id}
          onActive={setActiveSection}
          isDirty={isDirty}
          onPublish={publishNow}
          publishPending={publishMut.isPending || saveMutation.isPending}
          publicUrl={slug ? `/c/${slug}` : "#"}
          dirtyMap={sectionDiff?.dirty}
          onDiscardSection={onDiscardSection}
          discardingId={discardingId}
        />
      }
    >
      {isLoading ? (
        <div className="p-6"><PCard>Loading…</PCard></div>
      ) : !sf ? (
        <div className="p-6">
          <PCard>
            <p className="text-[13px] text-white/70">
              Your Website isn't ready yet. Once your identity, qualifications and insurance are approved, your Lite website is created automatically.
            </p>
          </PCard>
        </div>
      ) : (
        <WebsiteEditorLayout
          sections={sections}
          activeId={active.id}
          onActive={setActiveSection}
          slug={slug ?? null}
          publicUrl={slug ? `/c/${slug}` : "#"}
          title={activeCopy.title}
          description={activeCopy.description}
          isDirty={isDirty}
          onPublish={publishNow}
          publishPending={publishMut.isPending || saveMutation.isPending}
          reloadNonce={reloadNonce}
          onReloadPreview={() => setReloadNonce((n) => n + 1)}
          previewToken={previewToken}
        >

          <div hidden={active.id !== "profile"}><ProfilePhotoPanel /></div>
          <div hidden={active.id !== "contact"}><ContactSocialsPanel /></div>
          <div hidden={active.id !== "basics"}>
            <div className="mb-4"><ProfilePhotoPanel /></div>
            <PPanel>
              <div className="border-b border-reps-border px-5 py-4">
                <h3 className="text-[14px] font-semibold text-white">Website basics</h3>
                <p className="mt-0.5 text-[12px] text-white/55">
                  Shown on your public page at <span className="text-white/80">/c/{slug ?? "your-slug"}</span>.
                </p>
              </div>
              <Field
                label="Tagline"
                hint="The H1 on your public page. One short line that sums you up."
                action={<AIDraftButton onClick={() => setTaglineDialogOpen(true)} pending={draftTaglineMut.isPending} />}
              >
                <TextInput
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  maxLength={200}
                  placeholder="[Your tagline — e.g. Stronger, leaner, sharper in 12 weeks]"
                />
                <FieldCounter current={tagline.length} max={200} />
              </Field>
              <HeroSubtitleField value={subtitle} onChange={setSubtitle} tagline={tagline} slug={slug} />
              <Field
                label="About headline"
                hint="The bold H2 that sits above your About paragraphs on /c/your-slug."
              >
                <TextInput
                  value={aboutHeadline}
                  onChange={(e) => setAboutHeadline(e.target.value)}
                  maxLength={200}
                  placeholder="[e.g. I take 20 clients. I write 20 programmes.]"
                />
                <FieldCounter current={aboutHeadline.length} max={200} />
              </Field>
              <Field
                label="About"
                hint="A short bio. Plain paragraphs, separated by blank lines."
                action={<AIDraftButton onClick={() => setAboutDialogOpen(true)} pending={draftAboutMut.isPending} />}
              >
                <TextArea
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  maxLength={800}
                  placeholder="[Tell clients who you help and how — 2–3 short paragraphs]"
                />
                <FieldCounter current={about.length} max={800} />
              </Field>
              <Field
                label="Hero image"
                hint="Portrait 9:16, 1080 × 1920. Upload, generate with AI, or paste a URL."
              >
                <HeroImageEditor value={hero} onChange={setHero} />
              </Field>
              <Field
                label="Currently coaching"
                hint="Shown in the hero as 'Currently coaching X of 20 available spaces'. Leave empty to hide."
              >
                <CurrentClientsField
                  value={currentClients}
                  onChange={setCurrentClients}
                />
              </Field>
            </PPanel>
          </div>
          <div hidden={active.id !== "plans"}>
            <ServicesEditor
              services={services}
              onSave={(s) => upsertServiceMut.mutate(s)}
              onDelete={(id) => deleteServiceMut.mutate(id)}
              onReorder={(ids) => reorderServicesMut.mutate(ids)}
              saving={upsertServiceMut.isPending}
            />
          </div>
          <WebsiteContentEditor activeSection={active.id} />
        </WebsiteEditorLayout>
      )}

      <PublishConfirmDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        summary={sectionDiff?.summary ?? {}}
        everPublished={!!sectionDiff?.ever_published || !!publishState?.ever_published}
        publishing={publishMut.isPending || saveMutation.isPending}
        onConfirm={() => publishMut.mutate()}
      />



      <Dialog open={taglineDialogOpen} onOpenChange={setTaglineDialogOpen}>
        <DialogContent className="max-w-lg border-reps-border bg-reps-panel text-white">
          <DialogHeader>
            <DialogTitle>Draft my tagline</DialogTitle>
            <DialogDescription>
              A couple of quick answers so the draft actually sounds like you.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="mb-1.5 text-[13px] font-semibold text-white">Who do you help and how?</div>
              <TextArea
                value={taglineAudience}
                onChange={(e) => setTaglineAudience(e.target.value)}
                maxLength={400}
                placeholder='e.g. "Busy professionals in Manchester get lean and strong in 3 sessions a week — at home or online."'
                className="min-h-[90px]"
              />
            </div>
            <div>
              <div className="mb-2 text-[13px] font-semibold text-white">Focus areas <span className="font-normal text-white/55">(optional)</span></div>
              <div className="flex flex-wrap gap-2">
                {["Fat loss", "Strength", "Postnatal", "Over 50s", "Athletes", "Rehab", "Hypertrophy", "Endurance"].map((s) => {
                  const active = taglineSpecialisms.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() =>
                        setTaglineSpecialisms((cur) =>
                          cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s],
                        )
                      }
                      className={`rounded-full border px-3 py-1 text-[12px] font-semibold ${
                        active
                          ? "border-reps-orange bg-reps-orange/15 text-white"
                          : "border-reps-border bg-reps-panel-soft text-white/70 hover:text-white"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setTaglineDialogOpen(false)}
              className="h-10 rounded-[10px] border border-reps-border bg-reps-panel-soft px-4 text-[13px] font-semibold text-white/80 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={draftTaglineMut.isPending}
              onClick={() =>
                draftTaglineMut.mutate({ audience: taglineAudience.trim(), specialisms: taglineSpecialisms })
              }
              className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white hover:bg-reps-orange-hover disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4" />
              {draftTaglineMut.isPending ? "Drafting…" : "Draft tagline"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={aboutDialogOpen} onOpenChange={setAboutDialogOpen}>
        <DialogContent className="max-w-lg border-reps-border bg-reps-panel text-white">
          <DialogHeader>
            <DialogTitle>Draft my About</DialogTitle>
            <DialogDescription>
              Two quick answers so the draft sounds like you, not a template.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="mb-1.5 text-[13px] font-semibold text-white">Who do you help and how?</div>
              <TextArea
                value={aboutAudience}
                onChange={(e) => setAboutAudience(e.target.value)}
                maxLength={400}
                placeholder='e.g. "Busy professionals in Manchester get lean and strong in 3 sessions a week."'
                className="min-h-[90px]"
              />
            </div>
            <div>
              <div className="mb-1.5 text-[13px] font-semibold text-white">What makes your coaching different?</div>
              <TextArea
                value={aboutDifferentiator}
                onChange={(e) => setAboutDifferentiator(e.target.value)}
                maxLength={400}
                placeholder='e.g. "20 years in the game, ex-Team GB S&C, no fluff, results tracked weekly."'
                className="min-h-[90px]"
              />
            </div>
            <div>
              <div className="mb-2 text-[13px] font-semibold text-white">Tone</div>
              <div className="flex flex-wrap gap-2">
                {(["warm", "direct", "professional", "playful"] as const).map((t) => {
                  const active = aboutTone === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAboutTone(t)}
                      className={`rounded-full border px-3 py-1 text-[12px] font-semibold capitalize ${
                        active
                          ? "border-reps-orange bg-reps-orange/15 text-white"
                          : "border-reps-border bg-reps-panel-soft text-white/70 hover:text-white"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setAboutDialogOpen(false)}
              className="h-10 rounded-[10px] border border-reps-border bg-reps-panel-soft px-4 text-[13px] font-semibold text-white/80 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={draftAboutMut.isPending}
              onClick={() =>
                draftAboutMut.mutate({
                  audience: aboutAudience.trim(),
                  differentiator: aboutDifferentiator.trim(),
                  tone: aboutTone,
                })
              }
              className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white hover:bg-reps-orange-hover disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4" />
              {draftAboutMut.isPending ? "Drafting…" : "Draft About"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}

const PRICE_UNIT_OPTIONS: { value: NonNullable<ServiceDTO["price_unit"]>; label: string }[] = [
  { value: "per_session", label: "per session" },
  { value: "per_month", label: "per month" },
  { value: "per_week", label: "per week" },
  { value: "per_block", label: "per block" },
  { value: "per_hour", label: "per hour" },
  { value: "total", label: "total (one-off)" },
  { value: "from", label: "from" },
  { value: "custom", label: "no unit" },
];

const EMPTY_BULLETS = ["", "", "", "", ""];

type ServiceDraft = Partial<ServiceDTO> & {
  title: string;
  bullets: string[];
};

function emptyDraft(sort_order: number): ServiceDraft {
  const p = defaultServiceForSlot(sort_order);
  return {
    title: p.title,
    description: p.description,
    price_pence: null,
    price_label: p.price_label,
    price_unit: p.price_unit,
    duration_minutes: null,
    mode: p.mode,
    sort_order,
    is_published: true,
    is_featured: p.is_featured,
    bullets: [...p.bullets, ...EMPTY_BULLETS].slice(0, 5),
    cta_label: p.cta_label,
    image_url: null,
  };
}

function ServicesEditor({
  services,
  onSave,
  onDelete,
  onReorder,
  saving,
}: {
  services: ServiceDTO[];
  onSave: (s: Partial<ServiceDTO> & { title: string }) => void;
  onDelete: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
  saving: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<ServiceDraft>(() => emptyDraft(services.length));
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);



  function startEdit(s: ServiceDTO) {
    const b = Array.isArray(s.bullets) ? s.bullets.slice(0, 5) : [];
    setEditingId(s.id);
    setDraft({
      id: s.id,
      title: s.title ?? "",
      description: s.description ?? "",
      price_pence: s.price_pence,
      price_label: s.price_label ?? "",
      price_unit: s.price_unit ?? "per_session",
      duration_minutes: s.duration_minutes,
      mode: (s.mode as ServiceDTO["mode"]) ?? "in_person",
      sort_order: s.sort_order,
      is_published: s.is_published,
      is_featured: s.is_featured,
      bullets: [...b, ...EMPTY_BULLETS].slice(0, 5),
      cta_label: s.cta_label ?? "",
      image_url: s.image_url ?? null,
    });
    setOpen(true);
  }

  function startAddSlot(slot: number) {
    setEditingId(null);
    setDraft(emptyDraft(slot));
    setOpen(true);
  }

  function buildPayload() {
    return {
      ...draft,
      title: draft.title.trim(),
      bullets: draft.bullets.map((b) => b.trim()).filter(Boolean),
      price_label: draft.price_label?.trim() || null,
      description: draft.description?.trim() || null,
      cta_label: draft.cta_label?.trim() || null,
      image_url: draft.image_url || null,
      is_featured: (draft.sort_order ?? 0) === 1,
    };
  }


  function submit() {
    onSave(buildPayload());
    setOpen(false);
  }


  const slots: Array<ServiceDTO | null> = [0, 1, 2].map((i) => services[i] ?? null);

  return (
    <PPanel>
      <div className="px-5 py-4">
        <h3 className="text-[14px] font-semibold text-white">Coaching plans</h3>
        <p className="mt-0.5 text-[12px] text-white/55">
          Three cards on your public website. The middle card is always marked
          "Most popular". A free Discovery Consultation is added automatically —
          you don't manage it here.
        </p>
      </div>

      <div className="flex flex-col gap-3 px-5 pb-5">
        {slots.map((s, i) => {
          const featured = i === 1;
          const placeholder = DEFAULT_SERVICE_CARDS[i % 3];
          const isEmpty = !s;
          return (
            <div
              key={s?.id ?? `slot-${i}`}
              className="flex items-stretch gap-2"
            >
              <div
                className={[
                  "relative flex flex-1 items-start justify-between gap-3 rounded-[14px] px-4 py-3 transition",
                  featured
                    ? "border-2 border-reps-orange bg-reps-orange/5 shadow-[0_0_0_4px_rgba(255,122,0,0.10)]"
                    : isEmpty
                      ? "border border-dashed border-reps-border/70 bg-reps-panel-soft/30"
                      : "border border-reps-border bg-reps-panel-soft",
                ].join(" ")}
              >
                {featured && (
                  <div className="absolute -top-2.5 left-4 inline-flex items-center gap-1 rounded-full bg-reps-orange px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    <Sparkles className="h-3 w-3" />
                    Most popular
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className={["text-[13.5px] font-semibold", isEmpty ? "text-white/50" : "text-white"].join(" ")}>
                    {s?.title || placeholder.title}
                  </div>
                  <div className="mt-0.5 text-[12px] text-white/55">
                    {s
                      ? (s.price_label ?? (s.price_pence ? `£${(s.price_pence / 100).toFixed(0)}` : "On enquiry"))
                      : placeholder.price_label}
                    {" · "}
                    {s
                      ? (s.mode === "online" ? "Remote" : s.mode === "hybrid" ? "Hybrid" : "Hands-on")
                      : (i === 0 ? "Remote" : i === 1 ? "Hybrid" : "Hands-on")}
                    {s && !s.is_published ? " · Hidden" : ""}
                  </div>
                  <div className="mt-1.5 text-[12.5px] text-white/65 line-clamp-2">
                    {s?.description || placeholder.description}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => (s ? startEdit(s) : startAddSlot(i))}
                    className="h-9 rounded-[10px] border border-reps-border bg-reps-panel px-3 text-[12.5px] font-semibold text-white hover:bg-reps-panel/80"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>




      <ServiceEditDialog
        open={open}
        onOpenChange={setOpen}
        draft={draft}
        setDraft={setDraft}
        editing={!!editingId}
        saving={saving}
        onSubmit={submit}
      />


      <AlertDialog
        open={!!confirmDeleteId}
        onOpenChange={(o) => !o && setConfirmDeleteId(null)}
      >
        <AlertDialogContent className="border-reps-border bg-reps-panel text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete this service?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/55">
              This removes the card from your public website. You can add a new one in its place.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-reps-border bg-reps-panel-soft text-white hover:bg-reps-panel hover:text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDeleteId) onDelete(confirmDeleteId);
                setConfirmDeleteId(null);
              }}
              className="bg-red-500 text-white hover:bg-red-500/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PPanel>
  );
}

function ServiceEditDialog({
  open,
  onOpenChange,
  draft,
  setDraft,
  editing,
  saving,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  draft: ServiceDraft;
  setDraft: (d: ServiceDraft) => void;
  editing: boolean;
  saving: boolean;
  onSubmit: () => void;
}) {
  // ---- Explicit save model --------------------------------------------------
  // No autosave. The dialog snapshots the original draft on open; "Cancel"
  // restores it. Closing via Esc / backdrop / Cancel while dirty triggers a
  // confirm step so changes are never silently lost OR silently kept.
  const originalSnapshot = React.useRef<string>("");
  const [dirty, setDirty] = React.useState(false);
  const [justSaved, setJustSaved] = React.useState(false);
  const [confirmDiscard, setConfirmDiscard] = React.useState(false);
  const wasSaving = React.useRef(false);

  // Snapshot the original draft whenever the dialog opens.
  React.useEffect(() => {
    if (open) {
      originalSnapshot.current = JSON.stringify(draft);
      setDirty(false);
      setJustSaved(false);
      setConfirmDiscard(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Track dirty state vs original snapshot.
  React.useEffect(() => {
    if (!open) return;
    setDirty(JSON.stringify(draft) !== originalSnapshot.current);
  }, [draft, open]);

  // Detect save completion (saving falling edge) → flash "Saved" briefly.
  React.useEffect(() => {
    if (saving) {
      wasSaving.current = true;
      setJustSaved(false);
    } else if (wasSaving.current) {
      wasSaving.current = false;
      setJustSaved(true);
      const t = setTimeout(() => setJustSaved(false), 2000);
      return () => clearTimeout(t);
    }
  }, [saving]);

  const status: { label: string; tone: "muted" | "saving" | "saved" | "dirty" } =
    saving
      ? { label: "Saving…", tone: "saving" }
      : dirty
        ? { label: "Unsaved changes", tone: "dirty" }
        : justSaved
          ? { label: "Saved", tone: "saved" }
          : { label: editing ? "No changes" : "Ready", tone: "muted" };

  const toneClass =
    status.tone === "saving"
      ? "text-white/70"
      : status.tone === "saved"
        ? "text-emerald-300"
        : status.tone === "dirty"
          ? "text-amber-300"
          : "text-white/45";

  function handleSave() {
    if (!draft.title?.trim()) return;
    onSubmit();
  }

  function discardAndClose() {
    // Restore original draft, then close.
    try {
      const original = JSON.parse(originalSnapshot.current) as ServiceDraft;
      setDraft(original);
    } catch {
      /* noop */
    }
    setConfirmDiscard(false);
    onOpenChange(false);
  }

  function attemptClose() {
    if (saving) return;
    if (dirty) {
      setConfirmDiscard(true);
    } else {
      onOpenChange(false);
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) attemptClose();
          else onOpenChange(o);
        }}
      >
        <DialogContent
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            attemptClose();
          }}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className="flex max-h-[90vh] flex-col gap-0 overflow-hidden border-reps-border bg-reps-panel p-0 text-white sm:max-w-[640px] [&>button.absolute]:hidden"
        >
          <DialogHeader className="border-b border-reps-border px-6 pb-4 pt-5">
            <DialogTitle className="text-white">Edit service</DialogTitle>
            <DialogDescription className="text-white/55">
              Edit the default copy or replace it with your own title, price, mode and details.
              Nothing saves until you click Save.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3 overflow-y-auto px-6 py-5 md:grid-cols-2">
            {(() => {
              const slot = (((draft.sort_order ?? 0) % 3) + 3) % 3;
              const p = DEFAULT_SERVICE_CARDS[slot];
              return (
                <>
                  <div className="md:col-span-2">
                    <TextInput
                      value={draft.title ?? ""}
                      onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                      placeholder={p.title}
                      maxLength={80}
                    />
                    <div className="mt-1 text-[11px] text-white/40">Title</div>
                  </div>

                  <div>
                    <TextInput
                      value={draft.price_label ?? ""}
                      onChange={(e) => setDraft({ ...draft, price_label: e.target.value })}
                      placeholder={p.price_label}
                      maxLength={16}
                    />
                    <div className="mt-1 text-[11px] text-white/40">Price (≤16)</div>
                  </div>
                  <div>
                    <select
                      value={draft.price_unit ?? "per_session"}
                      onChange={(e) => setDraft({ ...draft, price_unit: e.target.value as NonNullable<ServiceDTO["price_unit"]> })}
                      className="h-10 w-full rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-reps-orange"
                    >
                      {PRICE_UNIT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <div className="mt-1 text-[11px] text-white/40">Unit</div>
                  </div>

                  <div>
                    <select
                      value={draft.mode ?? "in_person"}
                      onChange={(e) => setDraft({ ...draft, mode: e.target.value as ServiceDTO["mode"] })}
                      className="h-10 w-full rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-reps-orange"
                    >
                      <option value="online">Remote (online)</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="in_person">Hands-on (in person)</option>
                    </select>
                    <div className="mt-1 text-[11px] text-white/40">Delivery mode</div>
                  </div>
                  <div>
                    <TextInput
                      value={draft.cta_label ?? ""}
                      onChange={(e) => setDraft({ ...draft, cta_label: e.target.value })}
                      placeholder={p.cta_label}
                      maxLength={40}
                    />
                    <div className="mt-1 text-[11px] text-white/40">Button label</div>
                  </div>




                  <div className="md:col-span-2">
                    <TextArea
                      value={draft.description ?? ""}
                      onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                      placeholder={p.description}
                      maxLength={240}
                      className="min-h-[64px] w-full rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 py-2 text-[13px] text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-reps-orange"
                    />
                  </div>
                </>
              );
            })()}


            <div className="md:col-span-2">
              <div className="text-[12px] font-semibold text-white/80">Bullets (up to 5)</div>
              <p className="mt-0.5 text-[11.5px] text-white/45">
                Keep each one short so they fit on a single line. 60 char max.
              </p>
              <div className="mt-2 grid gap-2">
                {draft.bullets.map((b, i) => {
                  const examples = DEFAULT_SERVICE_CARDS[(draft.sort_order ?? 0) % 3].bullets;
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-4 text-[11px] text-white/40">{i + 1}.</span>
                      <TextInput
                        value={b}
                        onChange={(e) => {
                          const next = [...draft.bullets];
                          next[i] = e.target.value;
                          setDraft({ ...draft, bullets: next });
                        }}
                        placeholder={examples[i] ?? "Add a bullet"}
                        maxLength={60}
                      />
                      <span className="w-10 text-right text-[11px] text-white/35">{b.length}/60</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="md:col-span-2 rounded-[14px] border border-reps-border bg-reps-panel-soft/40 p-3">
              <ServiceImageEditor
                value={draft.image_url ?? null}
                onChange={(url: string | null) => setDraft({ ...draft, image_url: url })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-reps-border bg-reps-panel/95 px-6 py-3 backdrop-blur">
            <div className={`flex items-center gap-2 text-[12px] ${toneClass}`}>
              {status.tone === "saving" ? (
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
              ) : status.tone === "saved" ? (
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
              ) : status.tone === "dirty" ? (
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
              ) : null}
              {status.label}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={attemptClose}
                className="flex h-10 items-center rounded-[10px] border border-reps-border bg-reps-panel-soft px-4 text-[13px] font-semibold text-white hover:bg-reps-panel disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!draft.title?.trim() || saving || (!dirty && editing)}
                onClick={handleSave}
                className="flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white hover:bg-reps-orange-hover disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {editing ? "Save & close" : "Save & close"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <AlertDialogContent className="border-reps-border bg-reps-panel text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/55">
              You have edits that haven't been saved. If you close now, those changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-reps-border bg-reps-panel-soft text-white hover:bg-reps-panel hover:text-white">
              Keep editing
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={discardAndClose}
              className="bg-red-500 text-white hover:bg-red-500/90"
            >
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


/* ===================================================================== */
/* Hero subtitle field — inline in the Website basics panel               */
/* ===================================================================== */

function HeroSubtitleField({
  value,
  onChange,
  tagline,
  slug,
}: {
  value: string;
  onChange: (v: string) => void;
  tagline: string;
  slug?: string | null;
}) {
  const draftFn = useServerFn(aiDraftSubtitle);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [audience, setAudience] = React.useState("");

  const draftMut = useMutation({
    mutationFn: (input: { tagline: string; audience: string }) => draftFn({ data: input }),
    onSuccess: (r) => {
      onChange(r.subtitle);
      setDialogOpen(false);
      toast.success("Subtitle drafted — review and save.");
    },
    onError: (e: Error) => toast.error(e.message || "Could not draft subtitle"),
  });

  return (
    <>
      <Field
        label="Subtitle"
        hint={`Sits directly under your tagline on /c/${slug ?? "your-slug"} — one short supporting line.`}
        action={<AIDraftButton onClick={() => setDialogOpen(true)} pending={draftMut.isPending} />}
      >
        <TextInput
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={200}
          placeholder="[Supporting line — e.g. Strength + hybrid coaching for busy professionals]"
        />
        <FieldCounter current={value.length} max={200} />
      </Field>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg border-reps-border bg-reps-panel text-white">
          <DialogHeader>
            <DialogTitle>Draft my subtitle</DialogTitle>
            <DialogDescription>
              One quick line about who this is for — we'll write a subtitle that supports your tagline.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {tagline ? (
              <div className="rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 py-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-white/50">Your tagline</div>
                <div className="mt-0.5 text-[13px] text-white/90">{tagline}</div>
              </div>
            ) : (
              <p className="rounded-[10px] border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-200">
                Add and save your tagline first for a sharper subtitle.
              </p>
            )}
            <div>
              <div className="mb-1.5 text-[13px] font-semibold text-white">Who is this for and how do you deliver it?</div>
              <TextArea
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                maxLength={400}
                placeholder='e.g. "Busy professionals — small-group and 1:1, in person in Bridgend or online worldwide."'
                className="min-h-[90px]"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setDialogOpen(false)}
              className="h-10 rounded-[10px] border border-reps-border bg-reps-panel-soft px-4 text-[13px] font-semibold text-white/80 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={draftMut.isPending}
              onClick={() => draftMut.mutate({ tagline, audience })}
              className="h-10 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white hover:bg-reps-orange-hover disabled:opacity-60"
            >
              {draftMut.isPending ? "Drafting…" : "Draft subtitle"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ===================================================================== */
/* Website content editor (Method, Venues, Results, FAQs)                */
/* ===================================================================== */


function WebsiteContentEditor({ activeSection }: { activeSection: string }) {
  const qc = useQueryClient();
  const fetch_ = useServerFn(getMyWebsiteContent);
  const save_ = useServerFn(saveMyWebsiteContent);
  const upsertT = useServerFn(upsertTransformation);
  const delT = useServerFn(deleteTransformation);
  const upsertF = useServerFn(upsertFaq);
  const delF = useServerFn(deleteFaq);
  const draftMethod = useServerFn(aiDraftMethod);
  const draftFaqs = useServerFn(aiDraftFaqs);

  const { data, isLoading } = useQuery({
    queryKey: ["my-website-content"],
    queryFn: () => fetch_(),
  });

  // subtitle now lives in HeroSubtitleField (rendered in the basics panel)
  const [methodName, setMethodName] = React.useState("");
  const [methodIntro, setMethodIntro] = React.useState("");
  const [pillars, setPillars] = React.useState<MethodPillar[]>([]);
  // venues are now managed by the GymPicker in WhereITrainPanel (professional_gyms table)
  const [cities, setCities] = React.useState("");
  // online-worldwide chip is now driven by the "Online" delivery toggle (see DeliveryModePanel)
  const [clientResultsIntro, setClientResultsIntro] = React.useState("");
  const [drafting, setDrafting] = React.useState(false);
  const [draftingFaqs, setDraftingFaqs] = React.useState(false);

  React.useEffect(() => {
    if (!data) return;
    // subtitle handled by HeroSubtitleField
    setMethodName(data.content.method_name ?? "");
    setMethodIntro(data.content.method_intro ?? "");
    setPillars(
      data.content.method_pillars.length
        ? data.content.method_pillars
        : [
            { title: "", body: "" },
            { title: "", body: "" },
            { title: "", body: "" },
          ],
    );
    // venues: managed by GymPicker
    setCities(data.content.coaching_reach.cities.join(", "));
    // online_worldwide handled by DeliveryModePanel
    setClientResultsIntro(data.content.client_results_intro ?? "");
  }, [data]);

  const saveMut = useMutation({
    mutationFn: (patch: Record<string, unknown>) => save_({ data: patch as never }),
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["my-website-content"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not save"),
  });

  const onDraftMethod = async () => {
    setDrafting(true);
    try {
      const out = await draftMethod({ data: { extra: "" } });
      setMethodName(out.method_name);
      setMethodIntro(out.method_intro);
      setPillars(out.pillars.length === 3 ? out.pillars : [...out.pillars, { title: "", body: "" }, { title: "", body: "" }].slice(0, 3));
      toast.success("AI draft ready — edit and save");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setDrafting(false);
    }
  };

  // onSaveHero removed — HeroSubtitleField saves independently
  const onSaveMethod = () =>
    saveMut.mutate({
      method_name: methodName || null,
      method_intro: methodIntro || null,
      method_pillars: pillars.filter((p) => p.title.trim() && p.body.trim()),
    });
  const onSaveVenues = () =>
    saveMut.mutate({
      coaching_reach: {
        cities: cities
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
        // Preserve stored online_worldwide value; the public chip now derives
        // from the profile's online_available flag (DeliveryModePanel).
        online_worldwide: data?.content.coaching_reach.online_worldwide ?? false,
      },
    });
  const onSaveResultsIntro = () => saveMut.mutate({ client_results_intro: clientResultsIntro || null });

  // Listen for the page-level "Save & publish" and fan out to a single
  // merged patch so we don't stampede the same mutation.
  const saveAllRef = React.useRef<() => void>(() => {});
  saveAllRef.current = () => {
    if (!data) return;
    saveMut.mutate({
      method_name: methodName || null,
      method_intro: methodIntro || null,
      method_pillars: pillars.filter((p) => p.title.trim() && p.body.trim()),
      client_results_intro: clientResultsIntro || null,
      coaching_reach: {
        cities: cities
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
        online_worldwide: data.content.coaching_reach.online_worldwide ?? false,
      },
    });
  };
  React.useEffect(() => {
    const h = () => saveAllRef.current();
    window.addEventListener("reps:website:save-all", h);
    return () => window.removeEventListener("reps:website:save-all", h);
  }, []);

  if (isLoading || !data) return <PCard>Loading website content…</PCard>;

  return (
    <>
      {/* Method */}
      <div hidden={activeSection !== "method"}>
      <section id="method" className="scroll-mt-24">
      <PPanel>
        <div className="border-b border-reps-border px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-[14px] font-semibold text-white">How I coach</h3>
            <p className="mt-0.5 text-[12px] text-white/55">A short name + intro + 3 pillars. Use AI to draft a starting point.</p>
          </div>
          <button
            type="button"
            onClick={onDraftMethod}
            disabled={drafting}
            className="flex h-9 items-center gap-1.5 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] font-semibold text-white/85 hover:bg-reps-panel disabled:opacity-60"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {drafting ? "Drafting…" : "AI draft"}
          </button>
        </div>
        <Field label="Method name" hint="The bold headline shown at the top of this section.">
          <TextInput
            value={methodName}
            onChange={(e) => setMethodName(e.target.value)}
            maxLength={80}
            placeholder="[Your method name — e.g. The Foundation Method]"
          />
          <FieldCounter current={methodName.length} max={80} />
        </Field>
        <Field label="Intro" hint="One short paragraph under the headline.">
          <TextArea
            value={methodIntro}
            onChange={(e) => setMethodIntro(e.target.value)}
            maxLength={600}
            placeholder="[One short paragraph about how you coach — 2–3 sentences]"
          />
          <FieldCounter current={methodIntro.length} max={600} />
        </Field>

        <div className="border-b border-reps-border/60 px-5 pt-5 pb-2">
          <div className="text-[13px] font-semibold text-white">The three pillars</div>
          <p className="mt-0.5 text-[12px] text-white/55">Each renders as a numbered card (01 · 02 · 03) on your public page. Click Edit to open the pillar in a focused editor.</p>
        </div>

        <PillarsRowList pillars={pillars} onChange={setPillars} />
      </PPanel>
      </section>
      </div>


      <div hidden={activeSection !== "specialisms"}>
        <SpecialismsDeliveryPanel />
      </div>

      {/* Where I train — postcode + Google-Places gyms + reach */}
      <div hidden={activeSection !== "location"}>
      <section id="location" className="scroll-mt-24">
      <WhereITrainPanel
        cities={cities}
        setCities={setCities}
      />
      </section>
      </div>

      <div hidden={activeSection !== "results"}>
      <section id="results" className="scroll-mt-24">
        <PPanel>
          <div className="border-b border-reps-border px-5 py-4">
            <h3 className="text-[14px] font-semibold text-white">Client Results</h3>
            <p className="mt-0.5 text-[12px] text-white/55">Image + metric proof cards shown in the Results section. Written testimonials come from your verified reviews automatically.</p>
          </div>
          <div className="px-5 py-4">
            <TextArea
              value={clientResultsIntro}
              onChange={(e) => setClientResultsIntro(e.target.value)}
              maxLength={600}
              placeholder="[Short intro — what clients can expect from the results below]"
            />
            <FieldCounter current={clientResultsIntro.length} max={600} />
          </div>
          <div className="border-t border-reps-border px-5 py-4">
            <div className="text-[13px] font-semibold text-white">Proof cards</div>
            <p className="mt-0.5 text-[12px] text-white/55">Image + metric cards shown in the Results section. Preview updates on the right after you save.</p>
          </div>
          <TransformationsEditor
            items={data.transformations}
            onSave={(t) => upsertT({ data: t }).then(() => qc.invalidateQueries({ queryKey: ["my-website-content"] }))}
            onDelete={(id) => delT({ data: { id } }).then(() => qc.invalidateQueries({ queryKey: ["my-website-content"] }))}
          />
        </PPanel>
      </section>
      </div>

      {/* FAQs */}
      <div hidden={activeSection !== "faqs"}>
      <section id="faqs" className="scroll-mt-24">
      <FaqsEditor
        items={data.faqs}
        onSave={(f) => upsertF({ data: f }).then(() => qc.invalidateQueries({ queryKey: ["my-website-content"] }))}
        onDelete={(id) => delF({ data: { id } }).then(() => qc.invalidateQueries({ queryKey: ["my-website-content"] }))}
        onAiDraft={async () => {
          setDraftingFaqs(true);
          try {
            const out = await draftFaqs({ data: { count: 5 } });
            for (let i = 0; i < out.faqs.length; i++) {
              await upsertF({
                data: {
                  question: out.faqs[i].question,
                  answer: out.faqs[i].answer,
                  sort_order: i,
                  source: "ai",
                },
              });
            }
            await qc.invalidateQueries({ queryKey: ["my-website-content"] });
            toast.success("AI drafted 5 FAQs — edit anything you like");
          } catch (e) {
            toast.error((e as Error).message);
          } finally {
            setDraftingFaqs(false);
          }
        }}
        drafting={draftingFaqs}
      />
      </section>
      </div>
    </>
  );
}

/**
 * TransformationsEditor
 * Compact row list + focused edit dialog (matches Coaching plans pattern).
 * The live preview iframe on the right is the source of truth for how the
 * card renders — this editor intentionally does NOT duplicate that preview
 * inline. Click Edit on any row to open the full editor in a dialog.
 */
function TransformationsEditor({
  items,
  onSave,
  onDelete,
}: {
  items: TransformationDTO[];
  onSave: (t: Partial<TransformationDTO> & { sort_order: number; is_published: boolean }) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<ResultDraft>(() => draftFromResult(null, 0));

  function startAdd() {
    setEditingId(null);
    setDraft(draftFromResult(null, items.length));
    setOpen(true);
  }
  function startEdit(t: TransformationDTO) {
    setEditingId(t.id);
    setDraft(draftFromResult(t, t.sort_order));
    setOpen(true);
  }
  function handleSave(next: ResultDraft) {
    onSave({
      ...(next.id ? { id: next.id } : {}),
      client_first_name: next.client_first_name || null,
      client_role: next.client_role || null,
      duration_label: next.duration_label || null,
      metric: next.metric || null,
      headline: null,
      quote: next.quote || null,
      image_url: next.image_url || null,
      sort_order: next.sort_order,
      is_published: next.is_published,
    });
  }

  // Empty state: single hero CTA.
  if (items.length === 0) {
    return (
      <>
        <div className="px-5 py-8">
          <div className="rounded-[16px] border border-dashed border-reps-border bg-reps-panel-soft/40 px-5 py-10 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-reps-orange/15 text-reps-orange">
              <Quote className="h-4 w-4" />
            </div>
            <div className="text-[14px] font-semibold text-white">No client results yet</div>
            <p className="mx-auto mt-1 max-w-[380px] text-[12.5px] text-white/60">
              Proof cards show a photo, a headline result and a short quote below your services on your public page.
            </p>
            <button
              type="button"
              onClick={startAdd}
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white hover:bg-reps-orange-hover"
            >
              <Plus className="h-4 w-4" /> Add your first client result
            </button>
          </div>
        </div>

        <ResultEditDialog
          open={open}
          onOpenChange={setOpen}
          editing={false}
          initial={draft}
          onSave={handleSave}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3 px-5 pb-5 pt-1">
        {items.map((t, i) => (
          <div
            key={t.id}
            className="flex items-stretch gap-2"
          >
            <div
              className={[
                "relative flex flex-1 items-start justify-between gap-3 rounded-[14px] px-4 py-3 transition",
                t.is_published
                  ? "border border-reps-border bg-reps-panel-soft"
                  : "border border-dashed border-reps-border/70 bg-reps-panel-soft/30",
              ].join(" ")}
            >
              {t.image_url ? (
                <img
                  src={t.image_url}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-[10px] object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[10px] bg-reps-orange/10 text-reps-orange">
                  <Quote className="h-4 w-4" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-white/45 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="truncate text-[13.5px] font-semibold text-white">
                    {t.metric || t.client_first_name || "Untitled result"}
                  </div>
                  {!t.is_published ? (
                    <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-white/55">
                      Hidden
                    </span>
                  ) : null}
                </div>
                {t.quote ? (
                  <div className="mt-1 line-clamp-2 text-[12.5px] italic text-white/60">
                    "{t.quote}"
                  </div>
                ) : null}
                <div className="mt-1 text-[11.5px] text-white/45">
                  {[t.client_first_name, t.client_role, t.duration_label]
                    .filter(Boolean)
                    .join(" · ") || "No client details yet"}
                </div>
              </div>
              <div className="flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={() => startEdit(t)}
                  className="flex h-9 items-center gap-1.5 rounded-[10px] border border-reps-border bg-reps-panel px-3 text-[12.5px] font-semibold text-white hover:bg-reps-panel/80"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={startAdd}
          className="flex h-11 items-center justify-center gap-2 rounded-[14px] border border-dashed border-reps-border bg-transparent text-[13px] font-semibold text-white/70 hover:border-reps-orange/50 hover:text-white"
        >
          <Plus className="h-4 w-4" /> Add another client result
        </button>
      </div>

      <ResultEditDialog
        open={open}
        onOpenChange={setOpen}
        editing={!!editingId}
        initial={draft}
        onSave={handleSave}
        onDelete={editingId ? () => onDelete(editingId) : undefined}
      />
    </>
  );
}

/**
 * PillarsRowList
 * Compact row list for the three method pillars + focused edit dialog
 * (matches Coaching plans + Client results). The pillars array is always
 * length 3; each row opens the dialog for that slot.
 */
function PillarsRowList({
  pillars,
  onChange,
}: {
  pillars: MethodPillar[];
  onChange: (next: MethodPillar[]) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [editingIndex, setEditingIndex] = React.useState(0);

  // Guarantee three slots so the UI is stable even if data is short.
  const slots: MethodPillar[] = [0, 1, 2].map(
    (i) => pillars[i] ?? { title: "", body: "" },
  );

  function startEdit(i: number) {
    setEditingIndex(i);
    setOpen(true);
  }
  function handleSave(next: MethodPillar) {
    const arr = [...slots];
    arr[editingIndex] = next;
    onChange(arr);
  }

  return (
    <>
      <div className="flex flex-col gap-3 px-5 pb-5 pt-1">
        {slots.map((p, i) => {
          const isEmpty = !p.title.trim() && !p.body.trim();
          const previousFilled = i === 0 || (slots[i - 1]?.title?.trim().length ?? 0) > 0;
          return (
            <div key={i} className="flex items-stretch gap-2">
              <div
                className={[
                  "flex flex-1 items-start justify-between gap-3 rounded-[14px] px-4 py-3 transition",
                  isEmpty
                    ? "border border-dashed border-reps-border/70 bg-reps-panel-soft/30"
                    : "border border-reps-border bg-reps-panel-soft",
                ].join(" ")}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-reps-orange/15 text-[13px] font-semibold text-reps-orange">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className={["text-[13.5px] font-semibold", isEmpty ? "text-white/50" : "text-white"].join(" ")}>
                    {p.title.trim() || `Pillar ${i + 1}`}
                  </div>
                  <div className="mt-0.5 line-clamp-2 text-[12.5px] text-white/60">
                    {p.body.trim() || "One clear sentence about what happens in this phase."}
                  </div>
                </div>
                <div className="flex shrink-0 items-center">
                  <button
                    type="button"
                    onClick={() => startEdit(i)}
                    disabled={isEmpty && !previousFilled}
                    className={
                      isEmpty && !previousFilled
                        ? "flex h-9 items-center gap-1.5 rounded-[10px] border border-reps-border bg-reps-panel-soft/50 px-3 text-[12.5px] font-semibold text-white/35 cursor-not-allowed"
                        : isEmpty
                          ? "flex h-9 items-center gap-1.5 rounded-[10px] bg-reps-orange px-3 text-[12.5px] font-semibold text-white hover:bg-reps-orange-hover"
                          : "flex h-9 items-center gap-1.5 rounded-[10px] border border-reps-border bg-reps-panel px-3 text-[12.5px] font-semibold text-white hover:bg-reps-panel/80"
                    }
                  >
                    {isEmpty ? <><Plus className="h-3.5 w-3.5" /> Add</> : <><Pencil className="h-3.5 w-3.5" /> Edit</>}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <PillarEditDialog
        open={open}
        onOpenChange={setOpen}
        index={editingIndex}
        pillar={slots[editingIndex] ?? { title: "", body: "" }}
        onSave={handleSave}
      />
    </>
  );
}






function FaqsEditor({
  items,
  onSave,
  onDelete,
  onAiDraft,
  drafting,
}: {
  items: FaqDTO[];
  onSave: (f: { question: string; answer: string; sort_order: number; source: "manual" | "ai"; id?: string }) => void;
  onDelete: (id: string) => void;
  onAiDraft: () => void;
  drafting: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<FaqDraft>(() => draftFromFaq(null, 0));

  function startAdd() {
    setEditingId(null);
    setDraft(draftFromFaq(null, items.length));
    setOpen(true);
  }
  function startEdit(f: FaqDTO) {
    setEditingId(f.id);
    setDraft(draftFromFaq(f, f.sort_order));
    setOpen(true);
  }
  function handleSave(next: FaqDraft) {
    onSave({
      ...(next.id ? { id: next.id } : {}),
      question: next.question,
      answer: next.answer,
      sort_order: next.sort_order,
      source: next.source,
    });
  }

  return (
    <PPanel>
      <div className="border-b border-reps-border px-5 py-4 flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-semibold text-white">FAQs</h3>
          <p className="mt-0.5 text-[12px] text-white/55">Short Q&amp;A shown near the bottom of your website.</p>
        </div>
        <button
          type="button"
          onClick={onAiDraft}
          disabled={drafting}
          className="flex h-9 items-center gap-1.5 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] font-semibold text-white/85 hover:bg-reps-panel disabled:opacity-60"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {drafting ? "Drafting…" : "AI draft 5 FAQs"}
        </button>
      </div>

      {items.length === 0 ? (
        <div className="px-5 py-8">
          <div className="rounded-[16px] border border-dashed border-reps-border bg-reps-panel-soft/40 px-5 py-10 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-reps-orange/15 text-reps-orange">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="text-[14px] font-semibold text-white">No FAQs yet</div>
            <p className="mx-auto mt-1 max-w-[380px] text-[12.5px] text-white/60">
              Answer the questions clients actually ask before they enquire — pricing, availability, format, cancellation.
            </p>
            <button
              type="button"
              onClick={startAdd}
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white hover:bg-reps-orange-hover"
            >
              <Plus className="h-4 w-4" /> Add your first FAQ
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 px-5 pb-5 pt-4">
          {items.map((f, i) => (
            <div key={f.id} className="flex items-stretch gap-2">
              <div className="relative flex flex-1 items-start justify-between gap-3 rounded-[14px] border border-reps-border bg-reps-panel-soft px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-white/45 tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="truncate text-[13.5px] font-semibold text-white">
                      {f.question || "Untitled question"}
                    </div>
                    {f.source === "ai" ? (
                      <span className="rounded-full bg-reps-orange/15 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-reps-orange">
                        AI draft
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 line-clamp-1 text-[12.5px] text-white/60">
                    {f.answer || "No answer yet"}
                  </div>
                </div>
                <div className="flex shrink-0 items-center">
                  <button
                    type="button"
                    onClick={() => startEdit(f)}
                    className="flex h-9 items-center gap-1.5 rounded-[10px] border border-reps-border bg-reps-panel px-3 text-[12.5px] font-semibold text-white hover:bg-reps-panel/80"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={startAdd}
            className="flex h-11 items-center justify-center gap-2 rounded-[14px] border border-dashed border-reps-border bg-transparent text-[13px] font-semibold text-white/70 hover:border-reps-orange/50 hover:text-white"
          >
            <Plus className="h-4 w-4" /> Add another FAQ
          </button>
        </div>
      )}

      <FaqEditDialog
        open={open}
        onOpenChange={setOpen}
        editing={!!editingId}
        initial={draft}
        onSave={handleSave}
        onDelete={editingId ? () => onDelete(editingId) : undefined}
      />
    </PPanel>
  );
}

/* ===================================================================== */
/* Where I train — postcode + Google-Places gyms + reach                 */
/* ===================================================================== */

function WhereITrainPanel({
  cities,
  setCities,
}: {
  cities: string;
  setCities: (v: string) => void;
}) {
  const qc = useQueryClient();
  const fetchLocation = useServerFn(getMyPrimaryLocation);
  const savePostcode = useServerFn(saveMyPrimaryPostcode);
  const fetchProfile = useServerFn(getMyDashboardProfile);
  const saveTrainingBase = useServerFn(updateMyTrainingBase);

  const locationQuery = useQuery({
    queryKey: ["my-primary-location"],
    queryFn: () => fetchLocation(),
  });
  const primaryLocation = locationQuery.data;
  const profileQuery = useQuery({
    queryKey: ["my-dashboard-profile"],
    queryFn: () => fetchProfile(),
  });
  const inPerson = !!profileQuery.data?.in_person_available;
  const homeStudio = !!profileQuery.data?.trains_at_home_studio;
  const clientsHome = !!profileQuery.data?.trains_at_clients_home;

  const [postcode, setPostcode] = React.useState("");
  const [initialised, setInitialised] = React.useState(false);
  React.useEffect(() => {
    if (initialised) return;
    if (primaryLocation !== undefined) {
      setPostcode(primaryLocation?.postcode ?? "");
      setInitialised(true);
    }
  }, [primaryLocation, initialised]);

  const postcodeMut = useMutation({
    mutationFn: (pc: string) => savePostcode({ data: { postcode: pc } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-primary-location"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not save postcode"),
  });

  const trainingBaseMut = useMutation({
    mutationFn: (v: { trains_at_home_studio: boolean; trains_at_clients_home: boolean }) =>
      saveTrainingBase({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-dashboard-profile"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not save training base"),
  });

  // Listen for the page-level "Save & publish".
  const saveAllRef = React.useRef<() => void>(() => {});
  saveAllRef.current = () => {
    const trimmed = postcode.trim();
    if (trimmed && trimmed !== (primaryLocation?.postcode ?? "")) {
      postcodeMut.mutate(trimmed);
    }
  };
  React.useEffect(() => {
    const h = () => saveAllRef.current();
    window.addEventListener("reps:website:save-all", h);
    return () => window.removeEventListener("reps:website:save-all", h);
  }, []);


  return (
    <PPanel>
      <div className="border-b border-reps-border px-5 py-4 flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-semibold text-white">Where I train</h3>
          <p className="mt-0.5 text-[12px] text-white/55">
            How you train, your training base, the gyms you work out of, and the cities you cover.
            Powers distance search and the location chips on your website.
          </p>
        </div>
      </div>

      <Field
        label="How you train clients"
        hint="At least one. Turning on Online also adds the Online (worldwide) chip to your website."
      >
        <DeliveryModePanel />
      </Field>

      <Field
        label="Primary training postcode"
        hint="We use this to calculate distance and show your town. Your full postcode is never shown publicly."
      >
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
          <input
            value={postcode}
            onChange={(e) => setPostcode(e.target.value.toUpperCase())}
            placeholder="e.g. SW1A 1AA"
            className="h-10 w-full rounded-[12px] border border-reps-border bg-reps-panel-soft pl-9 pr-3 text-[13px] text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-reps-orange"
          />
        </div>
        {primaryLocation?.town ? (
          <p className="mt-1.5 text-[11px] text-white/60">
            Public location: <span className="text-white/80">{primaryLocation.town}{primaryLocation.region ? ` · ${primaryLocation.region}` : ""}</span>
            {primaryLocation.postcode_outward ? <> · <span className="text-white/80">{primaryLocation.postcode_outward}</span></> : null}
          </p>
        ) : null}
      </Field>

      <Field
        label="Trains at (optional · max 4)"
        hint={
          inPerson
            ? "Add up to 4 gyms or studios you work from. Search picks live venues so your website chips stay accurate — each one links out to its Google Business profile."
            : "You're set to online-only. Enable in-person above to list gyms."
        }
      >
        {inPerson ? (
          <>
            <GymPicker />
            <div className="mt-4 space-y-2 border-t border-reps-border/60 pt-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">
                Also train from
              </p>
              <label className="flex items-start gap-2.5 rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 py-2.5 text-[12.5px] text-white/85 hover:border-white/25">
                <input
                  type="checkbox"
                  className="mt-0.5 h-3.5 w-3.5 accent-reps-orange"
                  checked={homeStudio}
                  disabled={trainingBaseMut.isPending}
                  onChange={(e) =>
                    trainingBaseMut.mutate({
                      trains_at_home_studio: e.target.checked,
                      trains_at_clients_home: clientsHome,
                    })
                  }
                />
                <span>
                  <span className="font-semibold text-white">Home / private studio</span>
                  <span className="ml-1 text-white/55">— your own space. Address stays private.</span>
                </span>
              </label>
              <label className="flex items-start gap-2.5 rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 py-2.5 text-[12.5px] text-white/85 hover:border-white/25">
                <input
                  type="checkbox"
                  className="mt-0.5 h-3.5 w-3.5 accent-reps-orange"
                  checked={clientsHome}
                  disabled={trainingBaseMut.isPending}
                  onChange={(e) =>
                    trainingBaseMut.mutate({
                      trains_at_home_studio: homeStudio,
                      trains_at_clients_home: e.target.checked,
                    })
                  }
                />
                <span>
                  <span className="font-semibold text-white">Client's home / mobile</span>
                  <span className="ml-1 text-white/55">— you travel to them.</span>
                </span>
              </label>
            </div>
          </>
        ) : (
          <p className="text-[12px] text-white/55">No gyms shown while you're online-only.</p>
        )}
      </Field>

      <Field
        label="Cities you cover"
        hint="Comma-separated list shown as chips on your website."
      >
        <TextInput value={cities} onChange={(e) => setCities(e.target.value)} placeholder="Leeds, Bradford" />
      </Field>
    </PPanel>
  );
}
