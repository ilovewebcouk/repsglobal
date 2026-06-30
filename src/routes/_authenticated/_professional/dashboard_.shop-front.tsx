import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink, GripVertical, Plus, Save, Sparkles, Trash2 } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard, PPanel } from "@/components/dashboard/primitives";
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
  type MethodPillar,
  type Venue,
  type TransformationDTO,
  type ClientResultDTO,
  type FaqDTO,
} from "@/lib/shop-front/website-content.functions";
import { HeroImageEditor } from "@/components/dashboard/HeroImageEditor";
import { ServiceImageEditor } from "@/components/dashboard/ServiceImageEditor";

export const Route = createFileRoute("/_authenticated/_professional/dashboard_/shop-front")({
  head: () => ({
    meta: [
      { title: "Website — REPS Professional" },
      { name: "description", content: "Edit your public REPS website — services, pricing and content." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ShopFrontEditorPage,
});

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-3 border-b border-reps-border/60 px-5 py-4 last:border-b-0 md:grid-cols-[220px_1fr]">
      <div>
        <div className="text-[13px] font-semibold text-white">{label}</div>
        {hint && <p className="mt-0.5 text-[12px] text-white/55">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
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

  const { data, isLoading } = useQuery({
    queryKey: ["my-shop-front"],
    queryFn: () => fetchMine(),
  });

  const sf = data?.shopFront ?? null;
  const services = data?.services ?? [];

  const [tagline, setTagline] = React.useState("");
  const [about, setAbout] = React.useState("");
  const [hero, setHero] = React.useState("");
  const [accent, setAccent] = React.useState("");
  const [layout, setLayout] = React.useState<"lite" | "full">("lite");
  const [isPublished, setIsPublished] = React.useState(false);

  React.useEffect(() => {
    if (!sf) return;
    setTagline(sf.tagline ?? "");
    setAbout(sf.about ?? "");
    setHero(sf.hero_image_url ?? "");
    setAccent(sf.accent_hex ?? "");
    setLayout(sf.layout_variant);
    setIsPublished(sf.is_published);
  }, [sf]);

  const saveMutation = useMutation({
    mutationFn: () =>
      upsertSf({
        data: {
          tagline: tagline || null,
          about: about || null,
          hero_image_url: hero || null,
          accent_hex: accent || null,
          layout_variant: layout,
          is_published: isPublished,
        },
      }),
    onSuccess: () => {
      toast.success("Website saved");
      qc.invalidateQueries({ queryKey: ["my-shop-front"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not save"),
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
          <PPanel>
            <div className="border-b border-reps-border px-5 py-4">
              <h3 className="text-[14px] font-semibold text-white">Website basics</h3>
              <p className="mt-0.5 text-[12px] text-white/55">
                Shown on your public page at <span className="text-white/80">/c/{slug ?? "your-slug"}</span>.
              </p>
            </div>
            <Field label="Tagline" hint="One short line that sums you up.">
              <TextInput
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                maxLength={200}
                placeholder="Stronger, leaner, sharper — in 12 weeks."
              />
            </Field>
            <Field label="About" hint="A short bio. Plain paragraphs, separated by blank lines.">
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
            <Field label="Accent colour" hint="Hex like #f97316. Optional.">
              <TextInput
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                placeholder="#f97316"
              />
            </Field>
            <Field label="Layout" hint={isPro ? "Full website available on Pro." : "Lite layout for Core."}>
              <select
                value={layout}
                onChange={(e) => setLayout(e.target.value as "lite" | "full")}
                disabled={!isPro}
                className="h-10 rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 text-[13px] text-white disabled:opacity-60"
              >
                <option value="lite">Lite (Verified)</option>
                <option value="full">Full (Pro)</option>
              </select>
            </Field>
            <Field label="Published" hint="When on, your page is publicly visible.">
              <label className="flex items-center gap-2 text-[13px] text-white/85">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="h-4 w-4 accent-reps-orange"
                />
                Page is live
              </label>
            </Field>
          </PPanel>

          <WebsiteContentEditor />

          <ServicesEditor
            services={services}
            onSave={(s) => upsertServiceMut.mutate(s)}
            onDelete={(id) => deleteServiceMut.mutate(id)}
            onReorder={(ids) => reorderServicesMut.mutate(ids)}
            saving={upsertServiceMut.isPending}
          />
        </div>
      )}
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

const SERVICE_PLACEHOLDERS = [
  {
    title: "Online Coaching",
    price: "£160",
    cta: "Enquire about Online Coaching",
    description: "For people who train themselves but want a coach in their corner.",
    bullets: [
      "Fully bespoke programme in-app",
      "Weekly written check-in & adjustments",
      "Unlimited messaging (Mon–Fri)",
      "Video form reviews",
      "Quarterly strategy call",
    ],
  },
  {
    title: "Hybrid Coaching",
    price: "£240",
    cta: "Start with Hybrid",
    description: "The full programme — two in-person sessions a month, online the rest.",
    bullets: [
      "Everything in Online Coaching",
      "2× in-person sessions per month",
      "Movement screen & progress reviews",
      "Body composition tracking",
      "Priority response time",
    ],
  },
  {
    title: "1-to-1 In Person",
    price: "From £75",
    cta: "Enquire about 1-to-1 In Person",
    description: "Train with me in central London. Programming, coaching and accountability in one room.",
    bullets: [
      "60-minute sessions at Third Space or BXR",
      "Bespoke programme outside sessions",
      "Nutrition & recovery rails",
      "Direct messaging access",
      "Block discount available (10+ sessions)",
    ],
  },
];


type ServiceDraft = Partial<ServiceDTO> & {
  title: string;
  bullets: string[];
};

function emptyDraft(sort_order: number): ServiceDraft {
  return {
    title: "",
    description: "",
    price_pence: null,
    price_label: "",
    price_unit: "per_session",
    duration_minutes: null,
    mode: "in_person",
    sort_order,
    is_published: true,
    is_featured: false,
    bullets: ["", "", "", "", ""],
    cta_label: "",
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
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);

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

  function submit() {
    onSave({
      ...draft,
      title: draft.title.trim(),
      bullets: draft.bullets.map((b) => b.trim()).filter(Boolean),
      price_label: draft.price_label?.trim() || null,
      description: draft.description?.trim() || null,
      cta_label: draft.cta_label?.trim() || null,
      image_url: draft.image_url || null,
    });
    setOpen(false);
  }

  function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const ids = services.map((s) => s.id);
    const [moved] = ids.splice(dragIndex, 1);
    ids.splice(targetIndex, 0, moved);
    setDragIndex(null);
    setDragOverIndex(null);
    onReorder(ids);
  }

  const slots: Array<ServiceDTO | null> = [0, 1, 2].map((i) => services[i] ?? null);

  return (
    <PPanel>
      <div className="px-5 py-4">
        <h3 className="text-[14px] font-semibold text-white">Service cards</h3>
        <p className="mt-0.5 text-[12px] text-white/55">
          Three cards on your public website. Drag to reorder. Only one card can be marked
          "Most popular" — it shows with the orange ring. A free Discovery Consultation is added
          automatically — you don't manage it here.
        </p>
      </div>

      <div className="flex flex-col gap-3 px-5 pb-5">
        {slots.map((s, i) => {
          const featured = !!s?.is_featured;
          const isDragOver = dragOverIndex === i && dragIndex !== null && dragIndex !== i;
          const placeholder = SERVICE_PLACEHOLDERS[i % 3];
          const isEmpty = !s;
          return (
            <div
              key={s?.id ?? `slot-${i}`}
              onDragOver={(e) => {
                if (isEmpty) return;
                e.preventDefault();
                setDragOverIndex(i);
              }}
              onDragLeave={() => setDragOverIndex((v) => (v === i ? null : v))}
              onDrop={(e) => {
                if (isEmpty) return;
                e.preventDefault();
                handleDrop(i);
              }}
              className={[
                "flex items-stretch gap-2 transition",
                dragIndex === i ? "opacity-50" : "",
              ].join(" ")}
            >
              <div
                draggable={!isEmpty}
                onDragStart={() => !isEmpty && setDragIndex(i)}
                onDragEnd={() => {
                  setDragIndex(null);
                  setDragOverIndex(null);
                }}
                aria-label="Drag to reorder"
                className={[
                  "flex w-8 shrink-0 items-center justify-center rounded-[10px] border border-reps-border bg-reps-panel-soft/60 text-white/40",
                  isEmpty ? "opacity-30" : "cursor-grab hover:text-white/80 active:cursor-grabbing",
                ].join(" ")}
              >
                <GripVertical className="h-4 w-4" />
              </div>
              <div
                className={[
                  "relative flex flex-1 items-start justify-between gap-3 rounded-[14px] px-4 py-3 transition",
                  featured
                    ? "border-2 border-reps-orange bg-reps-orange/5 shadow-[0_0_0_4px_rgba(255,122,0,0.10)]"
                    : isEmpty
                      ? "border border-dashed border-reps-border/70 bg-reps-panel-soft/30"
                      : "border border-reps-border bg-reps-panel-soft",
                  isDragOver ? "ring-2 ring-reps-orange/60" : "",
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
                    {placeholder.title}{isEmpty ? " (empty)" : ""}
                  </div>
                  <div className="mt-0.5 text-[12px] text-white/55">
                    {s
                      ? (s.price_label ?? (s.price_pence ? `£${(s.price_pence / 100).toFixed(0)}` : "On enquiry"))
                      : placeholder.price}
                    {" · "}{i === 0 ? "Remote" : i === 1 ? "Hybrid" : "Hands-on"}
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
                    {s ? "Edit" : "Set up"}
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-reps-border bg-reps-panel text-white sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="text-white">
            {editing ? "Edit service" : "Add a service"}
            <span className="ml-2 rounded-full bg-reps-orange-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-reps-orange align-middle">
              {SERVICE_PLACEHOLDERS[(draft.sort_order ?? 0) % 3].title}
            </span>
          </DialogTitle>
          <DialogDescription className="text-white/55">
            The title, delivery mode and button are fixed for this slot. You control the price, description and bullets.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {/* Slot summary (locked) */}
          <div className="md:col-span-2 rounded-[12px] border border-reps-border bg-reps-panel-soft/40 px-3 py-2 text-[12px] text-white/65">
            <span className="text-white/80 font-semibold">{SERVICE_PLACEHOLDERS[(draft.sort_order ?? 0) % 3].title}</span>
            <span className="mx-1.5 text-white/30">·</span>
            {(draft.sort_order ?? 0) % 3 === 0 ? "Remote" : (draft.sort_order ?? 0) % 3 === 1 ? "Hybrid" : "Hands-on"}
            <span className="mx-1.5 text-white/30">·</span>
            CTA: "{SERVICE_PLACEHOLDERS[(draft.sort_order ?? 0) % 3].cta}"
            {(draft.sort_order ?? 0) % 3 === 1 ? (
              <span className="ml-2 rounded-full bg-reps-orange px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">Most popular</span>
            ) : null}
          </div>

          <div>
            <TextInput
              value={draft.price_label ?? ""}
              onChange={(e) => setDraft({ ...draft, price_label: e.target.value })}
              placeholder={SERVICE_PLACEHOLDERS[(draft.sort_order ?? 0) % 3].price}
              maxLength={16}
            />
            <div className="mt-1 text-[11px] text-white/40">Price (≤16)</div>
          </div>
          <div className="flex items-center rounded-[12px] border border-reps-border bg-reps-panel-soft/40 px-3 text-[12.5px] text-white/65">
            Unit: {(draft.sort_order ?? 0) % 3 === 2 ? "per session" : "per month"}
          </div>


          <div className="md:col-span-2">
            <TextArea
              value={draft.description ?? ""}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder={SERVICE_PLACEHOLDERS[(draft.sort_order ?? 0) % 3].description}
              maxLength={240}
              className="min-h-[64px] w-full rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 py-2 text-[13px] text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-reps-orange"
            />
          </div>

          <div className="md:col-span-2">
            <div className="text-[12px] font-semibold text-white/80">Bullets (up to 5)</div>
            <p className="mt-0.5 text-[11.5px] text-white/45">
              Keep each one short so they fit on a single line. 60 char max.
            </p>
            <div className="mt-2 grid gap-2">
              {draft.bullets.map((b, i) => {
                const examples = SERVICE_PLACEHOLDERS[(draft.sort_order ?? 0) % 3].bullets;
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

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-10 rounded-[10px] border border-reps-border bg-reps-panel-soft px-4 text-[13px] font-semibold text-white/80 hover:bg-reps-panel"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!draft.title?.trim() || saving}
            onClick={onSubmit}
            className="flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white hover:bg-reps-orange-hover disabled:opacity-60"
          >
            {editing ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editing ? "Save changes" : "Add service"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


/* ===================================================================== */
/* Website content editor (Hero subtitle, Method, Venues, Results, FAQs)   */
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

  const [subtitle, setSubtitle] = React.useState("");
  const [methodName, setMethodName] = React.useState("");
  const [methodIntro, setMethodIntro] = React.useState("");
  const [pillars, setPillars] = React.useState<MethodPillar[]>([]);
  const [venues, setVenues] = React.useState<Venue[]>([]);
  const [cities, setCities] = React.useState("");
  const [onlineWorldwide, setOnlineWorldwide] = React.useState(false);
  const [clientResultsIntro, setClientResultsIntro] = React.useState("");
  const [drafting, setDrafting] = React.useState(false);
  const [draftingFaqs, setDraftingFaqs] = React.useState(false);

  React.useEffect(() => {
    if (!data) return;
    setSubtitle(data.content.subtitle ?? "");
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
    setVenues(data.content.venues.length ? data.content.venues : [{ name: "", address: "" }]);
    setCities(data.content.coaching_reach.cities.join(", "));
    setOnlineWorldwide(data.content.coaching_reach.online_worldwide);
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

  const onSaveHero = () => saveMut.mutate({ subtitle: subtitle || null });
  const onSaveMethod = () =>
    saveMut.mutate({
      method_name: methodName || null,
      method_intro: methodIntro || null,
      method_pillars: pillars.filter((p) => p.title.trim() && p.body.trim()),
    });
  const onSaveVenues = () =>
    saveMut.mutate({
      venues: venues
        .map((v) => ({ name: v.name.trim(), address: v.address?.trim() || null }))
        .filter((v) => v.name),
      coaching_reach: {
        cities: cities
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
        online_worldwide: onlineWorldwide,
      },
    });
  const onSaveResultsIntro = () => saveMut.mutate({ client_results_intro: clientResultsIntro || null });

  if (isLoading || !data) return <PCard>Loading website content…</PCard>;

  return (
    <>
      {/* Hero subtitle */}
      <PPanel>
        <div className="border-b border-reps-border px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-[14px] font-semibold text-white">Hero subtitle</h3>
            <p className="mt-0.5 text-[12px] text-white/55">
              Shown directly under your H1 on /c/{"{slug}"} — one short line.
            </p>
          </div>
          <button
            type="button"
            onClick={onSaveHero}
            disabled={saveMut.isPending}
            className="h-9 rounded-[10px] bg-reps-orange px-3 text-[12px] font-semibold text-white hover:bg-reps-orange-hover disabled:opacity-60"
          >
            Save
          </button>
        </div>
        <div className="px-5 py-4">
          <TextInput
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            maxLength={200}
            placeholder="e.g. Strength + hybrid coaching for busy professionals"
          />
        </div>
      </PPanel>

      {/* Venues + reach */}
      <PPanel>
        <div className="border-b border-reps-border px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-[14px] font-semibold text-white">Where I train</h3>
            <p className="mt-0.5 text-[12px] text-white/55">Edit in-person venues, cities and online/worldwide availability.</p>
          </div>
          <button
            type="button"
            onClick={onSaveVenues}
            disabled={saveMut.isPending}
            className="h-9 rounded-[10px] bg-reps-orange px-3 text-[12px] font-semibold text-white hover:bg-reps-orange-hover disabled:opacity-60"
          >
            Save
          </button>
        </div>
        {venues.map((v, i) => (
          <Field key={i} label={`Venue ${i + 1}`} hint="Name + optional area/address.">
            <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
              <TextInput
                value={v.name}
                onChange={(e) => {
                  const next = [...venues];
                  next[i] = { ...next[i], name: e.target.value };
                  setVenues(next);
                }}
                placeholder="e.g. PureGym Leeds"
                maxLength={120}
              />
              <TextInput
                value={v.address ?? ""}
                onChange={(e) => {
                  const next = [...venues];
                  next[i] = { ...next[i], address: e.target.value };
                  setVenues(next);
                }}
                placeholder="e.g. Leeds city centre"
                maxLength={200}
              />
              <button
                type="button"
                onClick={() => setVenues(venues.filter((_, idx) => idx !== i))}
                className="h-10 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] text-red-300 hover:bg-reps-panel"
              >
                Remove
              </button>
            </div>
          </Field>
        ))}
        <Field label="Add venue">
          <button
            type="button"
            onClick={() => setVenues([...venues, { name: "", address: "" }].slice(0, 8))}
            className="h-10 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] font-semibold text-white/85 hover:bg-reps-panel"
          >
            + Add venue
          </button>
        </Field>
        <Field label="Cities" hint="Comma-separated list shown as chips.">
          <TextInput value={cities} onChange={(e) => setCities(e.target.value)} placeholder="Leeds, Bradford, Online" />
        </Field>
        <Field label="Online worldwide" hint="Adds the online/worldwide chip.">
          <label className="flex items-center gap-2 text-[13px] text-white/85">
            <input
              type="checkbox"
              checked={onlineWorldwide}
              onChange={(e) => setOnlineWorldwide(e.target.checked)}
              className="h-4 w-4 accent-reps-orange"
            />
            I coach online and worldwide
          </label>
        </Field>
      </PPanel>

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
