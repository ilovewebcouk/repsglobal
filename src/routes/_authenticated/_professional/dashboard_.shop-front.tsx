import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink, Plus, Save, Sparkles, Trash2 } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard, PPanel } from "@/components/dashboard/primitives";
import { useTrainerTier } from "@/lib/dashboard/useTrainerTier";

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
  aiDraftMethod,
  aiDraftFaqs,
  type MethodPillar,
  type TransformationDTO,
  type FaqDTO,
} from "@/lib/shop-front/website-content.functions";

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

  // Core members get the Lite shop-front; Pro/Studio get the full editor.

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
      toast.success("Shop-front saved");
      qc.invalidateQueries({ queryKey: ["my-shop-front"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not save"),
  });

  const upsertServiceMut = useMutation({
    mutationFn: (s: Partial<ServiceDTO> & { title: string }) =>
      upsertSvc({
        data: {
          id: s.id,
          title: s.title,
          description: s.description ?? null,
          price_pence: s.price_pence ?? null,
          price_label: s.price_label ?? null,
          duration_minutes: s.duration_minutes ?? null,
          mode: (s.mode as "in_person" | "online" | "hybrid") ?? "in_person",
          sort_order: s.sort_order ?? 0,
          is_published: s.is_published ?? true,
          is_featured: s.is_featured ?? false,
        },
      }),
    onSuccess: () => {
      toast.success("Service saved");
      qc.invalidateQueries({ queryKey: ["my-shop-front"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not save service"),
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
            Your shop-front isn't ready yet. Once your identity is approved a Lite shop-front is created automatically.
          </p>
        </PCard>
      ) : (
        <div className="space-y-6">
          <PPanel>
            <div className="border-b border-reps-border px-5 py-4">
              <h3 className="text-[14px] font-semibold text-white">Shop-front basics</h3>
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
            <Field label="Hero image URL" hint="Optional — used as the large hero photo.">
              <TextInput
                value={hero}
                onChange={(e) => setHero(e.target.value)}
                placeholder="https://…"
              />
            </Field>
            <Field label="Accent colour" hint="Hex like #f97316. Optional.">
              <TextInput
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                placeholder="#f97316"
              />
            </Field>
            <Field label="Layout" hint={isPro ? "Full shop-front available on Pro." : "Lite layout for Verified."}>
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

          {isPro ? (
            <ServicesEditor
              services={services}
              onSave={(s) => upsertServiceMut.mutate(s)}
              onDelete={(id) => deleteServiceMut.mutate(id)}
              saving={upsertServiceMut.isPending}
            />
          ) : (
            <PCard>
              <div className="text-[14px] font-semibold text-white">Services</div>
              <p className="mt-1 text-[13px] text-white/65">
                Service packages and pricing are a Pro feature. Upgrade to add tiers, durations and "Most popular" highlights.
              </p>
            </PCard>
          )}
        </div>
      )}
    </DashboardShell>
  );
}

function ServicesEditor({
  services,
  onSave,
  onDelete,
  saving,
}: {
  services: ServiceDTO[];
  onSave: (s: Partial<ServiceDTO> & { title: string }) => void;
  onDelete: (id: string) => void;
  saving: boolean;
}) {
  const [draft, setDraft] = React.useState<Partial<ServiceDTO> & { title: string }>({
    title: "",
    description: "",
    price_pence: null,
    price_label: "",
    duration_minutes: 60,
    mode: "in_person",
    sort_order: services.length,
    is_published: true,
    is_featured: false,
  });

  return (
    <PPanel>
      <div className="border-b border-reps-border px-5 py-4">
        <h3 className="text-[14px] font-semibold text-white">Services</h3>
        <p className="mt-0.5 text-[12px] text-white/55">Up to your service tiers — shown on your public page.</p>
      </div>

      <div className="divide-y divide-reps-border/60">
        {services.map((s) => (
          <div key={s.id} className="grid grid-cols-1 gap-2 px-5 py-4 md:grid-cols-[1fr_auto]">
            <div>
              <div className="text-[13px] font-semibold text-white">{s.title}</div>
              <div className="mt-0.5 text-[12px] text-white/55">
                {s.price_label ?? (s.price_pence ? `£${(s.price_pence / 100).toFixed(0)}` : "On enquiry")}
                {" · "}
                {s.duration_minutes ? `${s.duration_minutes} min` : "—"} · {s.mode}
                {s.is_featured ? " · Featured" : ""}
                {!s.is_published ? " · Hidden" : ""}
              </div>
              {s.description && <p className="mt-1 text-[12px] text-white/65 line-clamp-2">{s.description}</p>}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSave({ ...s, is_featured: !s.is_featured })}
                className="h-9 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] text-white/80 hover:bg-reps-panel"
              >
                {s.is_featured ? "Unfeature" : "Feature"}
              </button>
              <button
                type="button"
                onClick={() => onSave({ ...s, is_published: !s.is_published })}
                className="h-9 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] text-white/80 hover:bg-reps-panel"
              >
                {s.is_published ? "Hide" : "Show"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete "${s.title}"?`)) onDelete(s.id);
                }}
                className="flex h-9 items-center gap-1 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] text-red-300 hover:bg-reps-panel"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </div>
        ))}
        {services.length === 0 && (
          <div className="px-5 py-4 text-[13px] text-white/55">No services yet — add your first below.</div>
        )}
      </div>

      <div className="border-t border-reps-border px-5 py-5">
        <div className="text-[13px] font-semibold text-white">Add a service</div>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <TextInput
            value={draft.title ?? ""}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="Title (e.g. 12-week transformation)"
            maxLength={120}
          />
          <TextInput
            value={draft.price_label ?? ""}
            onChange={(e) => setDraft({ ...draft, price_label: e.target.value })}
            placeholder="Price label (e.g. From £180/mo)"
            maxLength={60}
          />
          <TextInput
            type="number"
            value={draft.duration_minutes ?? 60}
            onChange={(e) => setDraft({ ...draft, duration_minutes: Number(e.target.value) || null })}
            placeholder="Duration (minutes)"
            min={0}
            max={600}
          />
          <select
            value={draft.mode ?? "in_person"}
            onChange={(e) => setDraft({ ...draft, mode: e.target.value as ServiceDTO["mode"] })}
            className="h-10 rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 text-[13px] text-white"
          >
            <option value="in_person">In person</option>
            <option value="online">Online</option>
            <option value="hybrid">Hybrid</option>
          </select>
          <TextArea
            value={draft.description ?? ""}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder="Short description"
            maxLength={2000}
          />
        </div>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            disabled={!draft.title?.trim() || saving}
            onClick={() => {
              onSave({ ...draft, sort_order: services.length });
              setDraft({
                title: "",
                description: "",
                price_pence: null,
                price_label: "",
                duration_minutes: 60,
                mode: "in_person",
                sort_order: services.length + 1,
                is_published: true,
                is_featured: false,
              });
            }}
            className="flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white hover:bg-reps-orange-hover disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            Add service
          </button>
        </div>
      </div>
    </PPanel>
  );
}

/* ===================================================================== */
/* Website content editor (Hero subtitle, Method, Transformations, FAQs)  */
/* ===================================================================== */

function WebsiteContentEditor() {
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

  const [subtitle, setSubtitle] = React.useState("");
  const [methodName, setMethodName] = React.useState("");
  const [methodIntro, setMethodIntro] = React.useState("");
  const [pillars, setPillars] = React.useState<MethodPillar[]>([]);
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
  }, [data]);

  const saveMut = useMutation({
    mutationFn: (patch: Parameters<typeof save_>[0]["data"]) => save_({ data: patch }),
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
