import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink, GripVertical, MapPin, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import { GymPicker } from "@/components/profile/GymPicker";
import { getMyPrimaryLocation, saveMyPrimaryPostcode } from "@/lib/profile/location.functions";
import { getMyDashboardProfile } from "@/lib/profile/dashboard-profile.functions";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard, PPanel } from "@/components/dashboard/primitives";
import { ProfilePhotoPanel } from "@/components/dashboard/ProfilePhotoPanel";
import { useTrainerTier } from "@/lib/dashboard/useTrainerTier";
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
  getMyShopFront,
  upsertMyShopFront,
  upsertMyService,
  deleteMyService,
  type ServiceDTO,
} from "@/lib/shop-front/shop-front.functions";
import { DEFAULT_SERVICE_CARDS, defaultServiceForSlot } from "@/lib/shop-front/default-services";
import {
  getMyWebsiteContent,
  saveMyWebsiteContent,
  upsertTransformation,
  deleteTransformation,
  upsertFaq,
  deleteFaq,
  upsertClientResult,
  deleteClientResult,
  aiDraftMethod,
  aiDraftFaqs,
  aiDraftTagline,
  aiDraftAbout,
  aiDraftSubtitle,
  type MethodPillar,
  type TransformationDTO,
  type ClientResultDTO,
  type FaqDTO,
} from "@/lib/shop-front/website-content.functions";
import { HeroImageEditor } from "@/components/dashboard/HeroImageEditor";
import { ServiceImageEditor } from "@/components/dashboard/ServiceImageEditor";
import { SpecialismsDeliveryPanel } from "@/components/dashboard/SpecialismsDeliveryPanel";
import { DeliveryModePanel } from "@/components/dashboard/DeliveryModePanel";

export const Route = createFileRoute("/_authenticated/_professional/dashboard_/website")({
  head: () => ({
    meta: [
      { title: "Website — REPS Professional" },
      { name: "description", content: "Edit your public REPS website — services, pricing and content." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ShopFrontEditorPage,
});

function Field({ label, hint, action, children }: { label: string; hint?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-3 border-b border-reps-border/60 px-5 py-4 last:border-b-0 md:grid-cols-[220px_1fr]">
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="text-[13px] font-semibold text-white">{label}</div>
          {action}
        </div>
        {hint && <p className="mt-0.5 text-[12px] text-white/55">{hint}</p>}
      </div>
      <div>{children}</div>
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

function ShopFrontEditorPage() {
  const tier = useTrainerTier();
  const blocked = false;

  // Core members get the Lite website; Pro/Studio get the full editor.

  const qc = useQueryClient();
  const fetchMine = useServerFn(getMyShopFront);
  const upsertSf = useServerFn(upsertMyShopFront);
  const upsertSvc = useServerFn(upsertMyService);
  const deleteSvc = useServerFn(deleteMyService);
  const draftTaglineFn = useServerFn(aiDraftTagline);
  const draftAboutFn = useServerFn(aiDraftAbout);

  const { data, isLoading } = useQuery({
    queryKey: ["my-shop-front"],
    queryFn: () => fetchMine(),
  });

  const sf = data?.shopFront ?? null;
  const services = data?.services ?? [];

  const [tagline, setTagline] = React.useState("");
  const [subtitle, setSubtitle] = React.useState("");
  const [about, setAbout] = React.useState("");
  const [hero, setHero] = React.useState("");
  
  const [layout, setLayout] = React.useState<"lite" | "full">("lite");
  const [theme] = React.useState<"dark" | "light">("dark");

  React.useEffect(() => {
    if (!sf) return;
    setTagline(sf.tagline ?? "");
    setSubtitle(sf.subtitle ?? "");
    setAbout(sf.about ?? "");
    setHero(sf.hero_image_url ?? "");
    setLayout(sf.layout_variant);
  }, [sf]);

  const saveMutation = useMutation({
    mutationFn: () =>
      upsertSf({
        data: {
          tagline: tagline || null,
          subtitle: subtitle || null,
          about: about || null,
          hero_image_url: hero || null,
          accent_hex: null,
          layout_variant: layout,
          theme,
        },
      }),

    onSuccess: () => {
      toast.success("Website saved");
      qc.invalidateQueries({ queryKey: ["my-shop-front"] });
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
      qc.invalidateQueries({ queryKey: ["my-shop-front"] });
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
      qc.invalidateQueries({ queryKey: ["my-shop-front"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not reorder"),
  });


  const deleteServiceMut = useMutation({
    mutationFn: (id: string) => deleteSvc({ data: { id } }),
    onSuccess: () => {
      toast.success("Service removed");
      qc.invalidateQueries({ queryKey: ["my-shop-front"] });
    },
  });

  const slug = sf?.slug;
  const isPro = tier === "pro" || tier === "studio";

  if (blocked) return null;

  return (
    <DashboardShell
      role="trainer"
      active="Website"
      tier={tier}
      title="Website"
      subtitle={
        isPro
          ? "Your public REPS website — services, pricing, method and branding."
          : "Your public REPS website. Pro unlocks deeper customisation — join the waitlist for the full editor."
      }
      actions={
        <div className="flex items-center gap-2">
          {slug && (
            <Link
              to="/c/$slug"
              params={{ slug }}
              target="_blank"
              className="flex h-10 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel-soft px-4 text-[13px] font-semibold text-white hover:bg-reps-panel"
            >
              <ExternalLink className="h-4 w-4" />
              View public page
            </Link>
          )}
          <button
            type="button"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
            className="flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white hover:bg-reps-orange-hover disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saveMutation.isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      }
    >
      {isLoading ? (
        <PCard>Loading…</PCard>
      ) : !sf ? (
        <PCard>
          <p className="text-[13px] text-white/70">
            Your Website isn't ready yet. Once your identity, qualifications and insurance are approved, your Lite website is created automatically.
          </p>
        </PCard>
      ) : (
        <div className="space-y-6">
          <ProfilePhotoPanel />
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
                placeholder='e.g. "Stronger, leaner, sharper — in 12 weeks"'
              />
            </Field>
            <HeroSubtitleField value={subtitle} onChange={setSubtitle} tagline={tagline} slug={slug} />
            <Field
              label="About"
              hint="A short bio. Plain paragraphs, separated by blank lines."
              action={<AIDraftButton onClick={() => setAboutDialogOpen(true)} pending={draftAboutMut.isPending} />}
            >
              <TextArea
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                maxLength={4000}
                placeholder="Tell clients who you help and how."
              />
            </Field>
            <Field
              label="Hero image"
              hint="Portrait 9:16, 1080 × 1920. Upload, generate with AI, or paste a URL."
            >
              <HeroImageEditor value={hero} onChange={setHero} />
            </Field>
          </PPanel>

          <ServicesEditor
            services={services}
            onSave={(s) => upsertServiceMut.mutate(s)}
            onDelete={(id) => deleteServiceMut.mutate(id)}
            onReorder={(ids) => reorderServicesMut.mutate(ids)}
            saving={upsertServiceMut.isPending}
          />

          

          <SpecialismsDeliveryPanel />


          <WebsiteContentEditor />
        </div>
      )}

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
          placeholder="e.g. Strength + hybrid coaching for busy professionals"
        />
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


function WebsiteContentEditor() {
  const qc = useQueryClient();
  const fetch_ = useServerFn(getMyWebsiteContent);
  const save_ = useServerFn(saveMyWebsiteContent);
  const upsertT = useServerFn(upsertTransformation);
  const delT = useServerFn(deleteTransformation);
  const upsertR = useServerFn(upsertClientResult);
  const delR = useServerFn(deleteClientResult);
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

  if (isLoading || !data) return <PCard>Loading website content…</PCard>;

  return (
    <>
      {/* Where I train — postcode + Google-Places gyms + reach */}
      <WhereITrainPanel
        cities={cities}
        setCities={setCities}
        onSaveReach={onSaveVenues}
        saving={saveMut.isPending}
      />


      {/* Results intro */}
      <PPanel>
        <div className="border-b border-reps-border px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-[14px] font-semibold text-white">Client results intro</h3>
            <p className="mt-0.5 text-[12px] text-white/55">This is the short paragraph above your result cards.</p>
          </div>
          <button
            type="button"
            onClick={onSaveResultsIntro}
            disabled={saveMut.isPending}
            className="h-9 rounded-[10px] bg-reps-orange px-3 text-[12px] font-semibold text-white hover:bg-reps-orange-hover disabled:opacity-60"
          >
            Save
          </button>
        </div>
        <div className="px-5 py-4">
          <TextArea
            value={clientResultsIntro}
            onChange={(e) => setClientResultsIntro(e.target.value)}
            maxLength={600}
            placeholder="Use this to explain what clients can expect from the results below."
          />
        </div>
      </PPanel>

      {/* Method */}
      <PPanel>
        <div className="border-b border-reps-border px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-[14px] font-semibold text-white">Foundation Method · How I coach</h3>
            <p className="mt-0.5 text-[12px] text-white/55">A short name + intro + 3 pillars. Use AI to draft a starting point.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDraftMethod}
              disabled={drafting}
              className="flex h-9 items-center gap-1.5 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] font-semibold text-white/85 hover:bg-reps-panel disabled:opacity-60"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {drafting ? "Drafting…" : "AI draft"}
            </button>
            <button
              type="button"
              onClick={onSaveMethod}
              disabled={saveMut.isPending}
              className="h-9 rounded-[10px] bg-reps-orange px-3 text-[12px] font-semibold text-white hover:bg-reps-orange-hover disabled:opacity-60"
            >
              Save
            </button>
          </div>
        </div>
        <Field label="Method name" hint="e.g. Foundation Method">
          <TextInput value={methodName} onChange={(e) => setMethodName(e.target.value)} maxLength={80} />
        </Field>
        <Field label="Intro" hint="One short paragraph.">
          <TextArea value={methodIntro} onChange={(e) => setMethodIntro(e.target.value)} maxLength={600} />
        </Field>
        {pillars.map((p, i) => (
          <Field key={i} label={`Pillar ${i + 1}`} hint="Title + 1-2 sentences.">
            <div className="space-y-2">
              <TextInput
                value={p.title}
                onChange={(e) => {
                  const next = [...pillars];
                  next[i] = { ...next[i], title: e.target.value };
                  setPillars(next);
                }}
                placeholder="Pillar title"
                maxLength={60}
              />
              <TextArea
                value={p.body}
                onChange={(e) => {
                  const next = [...pillars];
                  next[i] = { ...next[i], body: e.target.value };
                  setPillars(next);
                }}
                placeholder="Pillar description"
                maxLength={400}
              />
            </div>
          </Field>
        ))}
      </PPanel>

      {/* Transformations */}
      <TransformationsEditor
        items={data.transformations}
        onSave={(t) => upsertT({ data: t }).then(() => qc.invalidateQueries({ queryKey: ["my-website-content"] }))}
        onDelete={(id) => delT({ data: { id } }).then(() => qc.invalidateQueries({ queryKey: ["my-website-content"] }))}
      />

      <ClientResultsEditor
        items={data.clientResults}
        onSave={(r) => upsertR({ data: r }).then(() => qc.invalidateQueries({ queryKey: ["my-website-content"] }))}
        onDelete={(id) => delR({ data: { id } }).then(() => qc.invalidateQueries({ queryKey: ["my-website-content"] }))}
      />

      {/* FAQs */}
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
    </>
  );
}

function TransformationsEditor({
  items,
  onSave,
  onDelete,
}: {
  items: TransformationDTO[];
  onSave: (t: Partial<TransformationDTO> & { sort_order: number; is_published: boolean }) => void;
  onDelete: (id: string) => void;
}) {
  const [draft, setDraft] = React.useState({
    client_first_name: "",
    metric: "",
    headline: "",
    quote: "",
    image_url: "",
  });

  return (
    <PPanel>
      <div className="border-b border-reps-border px-5 py-4">
        <h3 className="text-[14px] font-semibold text-white">Client transformations</h3>
        <p className="mt-0.5 text-[12px] text-white/55">Short proof cards shown in the Results section.</p>
      </div>
      <div className="divide-y divide-reps-border/60">
        {items.map((t) => (
          <div key={t.id} className="grid grid-cols-1 gap-2 px-5 py-4 md:grid-cols-[1fr_auto]">
            <div>
              <div className="text-[13px] font-semibold text-white">
                {t.client_first_name ?? "Client"} {t.metric ? `· ${t.metric}` : ""}
              </div>
              {t.headline && <div className="text-[12px] text-white/70 mt-0.5">{t.headline}</div>}
              {t.quote && <p className="text-[12px] text-white/55 mt-1 line-clamp-2">"{t.quote}"</p>}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSave({ ...t, is_published: !t.is_published })}
                className="h-9 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] text-white/80 hover:bg-reps-panel"
              >
                {t.is_published ? "Hide" : "Show"}
              </button>
              <button
                type="button"
                onClick={() => confirm("Delete this transformation?") && onDelete(t.id)}
                className="flex h-9 items-center gap-1 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] text-red-300 hover:bg-reps-panel"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="px-5 py-4 text-[13px] text-white/55">No transformations yet — add one below.</div>
        )}
      </div>
      <div className="border-t border-reps-border px-5 py-5">
        <div className="text-[13px] font-semibold text-white">Add a transformation</div>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <TextInput
            value={draft.client_first_name}
            onChange={(e) => setDraft({ ...draft, client_first_name: e.target.value })}
            placeholder="Client first name (e.g. Sarah)"
            maxLength={60}
          />
          <TextInput
            value={draft.metric}
            onChange={(e) => setDraft({ ...draft, metric: e.target.value })}
            placeholder="Metric (e.g. -8kg in 16 weeks)"
            maxLength={80}
          />
          <TextInput
            value={draft.headline}
            onChange={(e) => setDraft({ ...draft, headline: e.target.value })}
            placeholder="Headline"
            maxLength={120}
          />
          <TextInput
            value={draft.image_url}
            onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
            placeholder="Image URL (optional)"
          />
          <div className="md:col-span-2">
            <TextArea
              value={draft.quote}
              onChange={(e) => setDraft({ ...draft, quote: e.target.value })}
              placeholder="Short client quote (optional)"
              maxLength={600}
            />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            disabled={!draft.client_first_name.trim() && !draft.headline.trim()}
            onClick={() => {
              onSave({
                client_first_name: draft.client_first_name || null,
                metric: draft.metric || null,
                headline: draft.headline || null,
                quote: draft.quote || null,
                image_url: draft.image_url || null,
                sort_order: items.length,
                is_published: true,
              });
              setDraft({ client_first_name: "", metric: "", headline: "", quote: "", image_url: "" });
            }}
            className="flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white hover:bg-reps-orange-hover disabled:opacity-60"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </div>
    </PPanel>
  );
}

function ClientResultsEditor({
  items,
  onSave,
  onDelete,
}: {
  items: ClientResultDTO[];
  onSave: (r: Partial<ClientResultDTO> & { sort_order: number; is_published: boolean }) => void;
  onDelete: (id: string) => void;
}) {
  const [draft, setDraft] = React.useState({ headline: "", body: "" });

  return (
    <PPanel>
      <div className="border-b border-reps-border px-5 py-4">
        <h3 className="text-[14px] font-semibold text-white">Client result quotes</h3>
        <p className="mt-0.5 text-[12px] text-white/55">
          Optional written result cards. These feed the client results/testimonial-style section on your website.
        </p>
      </div>
      <div className="divide-y divide-reps-border/60">
        {items.map((r) => (
          <div key={r.id} className="grid grid-cols-1 gap-2 px-5 py-4 md:grid-cols-[1fr_auto]">
            <div>
              <div className="text-[13px] font-semibold text-white">{r.headline ?? "Client result"}</div>
              {r.body && <p className="mt-1 line-clamp-2 text-[12px] text-white/55">&quot;{r.body}&quot;</p>}
              {!r.is_published && (
                <span className="mt-1 inline-block text-[10px] uppercase tracking-wide text-white/40">Hidden</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSave({ ...r, is_published: !r.is_published })}
                className="h-9 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] text-white/80 hover:bg-reps-panel"
              >
                {r.is_published ? "Hide" : "Show"}
              </button>
              <button
                type="button"
                onClick={() => confirm("Delete this client result?") && onDelete(r.id)}
                className="flex h-9 items-center gap-1 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] text-red-300 hover:bg-reps-panel"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="px-5 py-4 text-[13px] text-white/55">No written client results yet — add one below.</div>
        )}
      </div>
      <div className="border-t border-reps-border px-5 py-5">
        <div className="text-[13px] font-semibold text-white">Add a client result quote</div>
        <div className="mt-3 space-y-3">
          <TextInput
            value={draft.headline}
            onChange={(e) => setDraft({ ...draft, headline: e.target.value })}
            placeholder="Headline (e.g. Stronger and more confident in 12 weeks)"
            maxLength={120}
          />
          <TextArea
            value={draft.body}
            onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            placeholder="Short result story or quote"
            maxLength={800}
          />
        </div>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            disabled={!draft.headline.trim() && !draft.body.trim()}
            onClick={() => {
              onSave({
                headline: draft.headline || null,
                body: draft.body || null,
                sort_order: items.length,
                is_published: true,
              });
              setDraft({ headline: "", body: "" });
            }}
            className="flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white hover:bg-reps-orange-hover disabled:opacity-60"
          >
            <Plus className="h-4 w-4" /> Add result
          </button>
        </div>
      </div>
    </PPanel>
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
  const [draft, setDraft] = React.useState({ question: "", answer: "" });

  return (
    <PPanel>
      <div className="border-b border-reps-border px-5 py-4 flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-semibold text-white">FAQs</h3>
          <p className="mt-0.5 text-[12px] text-white/55">5 short Q&amp;A shown near the bottom of your website.</p>
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
      <div className="divide-y divide-reps-border/60">
        {items.map((f) => (
          <div key={f.id} className="grid grid-cols-1 gap-2 px-5 py-4 md:grid-cols-[1fr_auto]">
            <div>
              <div className="text-[13px] font-semibold text-white">{f.question}</div>
              <p className="mt-1 text-[12px] text-white/65 whitespace-pre-line line-clamp-3">{f.answer}</p>
              {f.source === "ai" && (
                <span className="mt-1 inline-block text-[10px] uppercase tracking-wide text-white/40">AI draft · edit me</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => confirm("Delete this FAQ?") && onDelete(f.id)}
              className="flex h-9 items-center gap-1 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] text-red-300 hover:bg-reps-panel"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <div className="px-5 py-4 text-[13px] text-white/55">
            No FAQs yet — click "AI draft 5 FAQs" or add one manually below.
          </div>
        )}
      </div>
      <div className="border-t border-reps-border px-5 py-5">
        <div className="text-[13px] font-semibold text-white">Add a FAQ</div>
        <div className="mt-3 space-y-3">
          <TextInput
            value={draft.question}
            onChange={(e) => setDraft({ ...draft, question: e.target.value })}
            placeholder="Question"
            maxLength={200}
          />
          <TextArea
            value={draft.answer}
            onChange={(e) => setDraft({ ...draft, answer: e.target.value })}
            placeholder="Answer"
            maxLength={1200}
          />
        </div>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            disabled={draft.question.trim().length < 3 || draft.answer.trim().length < 3}
            onClick={() => {
              onSave({
                question: draft.question.trim(),
                answer: draft.answer.trim(),
                sort_order: items.length,
                source: "manual",
              });
              setDraft({ question: "", answer: "" });
            }}
            className="flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white hover:bg-reps-orange-hover disabled:opacity-60"
          >
            <Plus className="h-4 w-4" /> Add FAQ
          </button>
        </div>
      </div>
    </PPanel>
  );
}

/* ===================================================================== */
/* Where I train — postcode + Google-Places gyms + reach                 */
/* ===================================================================== */

function WhereITrainPanel({
  cities,
  setCities,
  onSaveReach,
  saving,
}: {
  cities: string;
  setCities: (v: string) => void;
  onSaveReach: () => void;
  saving: boolean;
}) {
  const qc = useQueryClient();
  const fetchLocation = useServerFn(getMyPrimaryLocation);
  const savePostcode = useServerFn(saveMyPrimaryPostcode);
  const fetchProfile = useServerFn(getMyDashboardProfile);

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
      toast.success("Postcode saved");
      qc.invalidateQueries({ queryKey: ["my-primary-location"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not save postcode"),
  });

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
        action={
          <button
            type="button"
            onClick={() => postcodeMut.mutate(postcode)}
            disabled={postcodeMut.isPending || !postcode.trim()}
            className="h-8 rounded-[10px] bg-reps-orange px-2.5 text-[11px] font-semibold text-white hover:bg-reps-orange-hover disabled:opacity-60"
          >
            {postcodeMut.isPending ? "Saving…" : "Save"}
          </button>
        }
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
        label="Trains at (optional · max 3)"
        hint={
          inPerson
            ? "Add up to 3 gyms or studios you work from. Search picks live venues so your website chips stay accurate."
            : "You're set to online-only. Enable in-person above to list gyms."
        }
      >
        {inPerson ? (
          <GymPicker />
        ) : (
          <p className="text-[12px] text-white/55">No gyms shown while you're online-only.</p>
        )}
      </Field>

      <Field
        label="Cities you cover"
        hint="Comma-separated list shown as chips on your website."
        action={
          <button
            type="button"
            onClick={onSaveReach}
            disabled={saving}
            className="h-8 rounded-[10px] bg-reps-orange px-2.5 text-[11px] font-semibold text-white hover:bg-reps-orange-hover disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        }
      >
        <TextInput value={cities} onChange={(e) => setCities(e.target.value)} placeholder="Leeds, Bradford" />
      </Field>
    </PPanel>
  );
}
