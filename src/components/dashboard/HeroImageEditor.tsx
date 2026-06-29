// Hero image editor for the trainer Website page.
// - Three input modes: Upload / AI generate / Paste URL.
// - Every input lands in a shared cropper locked to 9:16, output is
//   re-encoded client-side to 1080x1920 JPEG before upload.
// - Uploads go to the shop-front-hero bucket; the resulting public URL is
//   stored on the parent (via onChange) and persisted with the rest of
//   the Website form on Save.
import * as React from "react";
import Cropper, { type Area } from "react-easy-crop";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Image as ImageIcon, Sparkles, Upload, Link2, X, Check } from "lucide-react";
import {
  uploadHeroFromBase64,
  generateHeroFromAi,
} from "@/lib/shop-front/hero.functions";

const TARGET_W = 1080;
const TARGET_H = 1920;
const ASPECT = TARGET_W / TARGET_H; // 9:16

type Mode = "upload" | "ai" | "url";

export function HeroImageEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [mode, setMode] = React.useState<Mode>("upload");
  const [editing, setEditing] = React.useState<string | null>(null); // source data URL for cropper
  const [urlDraft, setUrlDraft] = React.useState(value);
  const [prompt, setPrompt] = React.useState("");
  const [style, setStyle] = React.useState<"editorial" | "studio" | "action">("editorial");
  const fileRef = React.useRef<HTMLInputElement>(null);

  const uploadFn = useServerFn(uploadHeroFromBase64);
  const aiFn = useServerFn(generateHeroFromAi);

  const aiMut = useMutation({
    mutationFn: () => aiFn({ data: { prompt, style } }),
    onSuccess: (r) => {
      setEditing(r.dataUrl);
    },
    onError: (e: Error) => toast.error(e.message || "AI couldn't generate that image"),
  });

  const uploadMut = useMutation({
    mutationFn: (dataUrl: string) => uploadFn({ data: { dataUrl } }),
    onSuccess: (r) => {
      onChange(r.url);
      setEditing(null);
      toast.success("Hero image saved");
    },
    onError: (e: Error) => toast.error(e.message || "Upload failed"),
  });

  function handleFile(file: File) {
    if (!/^image\/(jpeg|jpg|png|webp|heic|heif)$/i.test(file.type)) {
      toast.error("Use a JPG, PNG, WebP or HEIC image");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Image is too large (20 MB max)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setEditing(String(reader.result));
    reader.onerror = () => toast.error("Could not read that file");
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-3">
      {value ? (
        <div className="flex items-start gap-4">
          <div className="relative h-44 w-[99px] shrink-0 overflow-hidden rounded-[12px] border border-reps-border bg-reps-panel-soft">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Hero preview" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[12px] font-semibold text-white/85">Current hero image</div>
            <div className="mt-0.5 truncate text-[11px] text-white/45">{value}</div>
            <p className="mt-2 text-[12px] text-white/55">
              Locked spec: <span className="text-white/80">Portrait 9:16 · 1080 × 1920</span>. Replace it
              using one of the options below.
            </p>
            <button
              type="button"
              onClick={() => onChange("")}
              className="mt-2 inline-flex h-8 items-center gap-1 rounded-[10px] border border-reps-border bg-reps-panel-soft px-2 text-[12px] text-white/70 hover:bg-reps-panel"
            >
              <X className="h-3.5 w-3.5" /> Remove
            </button>
          </div>
        </div>
      ) : (
        <p className="text-[12px] text-white/55">
          No hero image yet. Use one of the options below — all hero images are locked to
          portrait 9:16 (1080 × 1920) so they crop cleanly on your public page.
        </p>
      )}

      <div className="inline-flex rounded-[10px] border border-reps-border bg-reps-panel-soft p-1 text-[12px]">
        {([
          { id: "upload", label: "Upload", icon: Upload },
          { id: "ai", label: "AI generate", icon: Sparkles },
          { id: "url", label: "Paste URL", icon: Link2 },
        ] as const).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setMode(t.id)}
            className={`flex h-8 items-center gap-1.5 rounded-[8px] px-3 font-medium transition ${
              mode === t.id
                ? "bg-reps-orange text-white"
                : "text-white/65 hover:text-white"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {mode === "upload" && (
        <div className="rounded-[12px] border border-dashed border-reps-border bg-reps-panel-soft/60 p-5 text-center">
          <ImageIcon className="mx-auto h-6 w-6 text-white/40" />
          <p className="mt-2 text-[13px] text-white/75">Drop a JPG / PNG / WebP / HEIC here</p>
          <p className="text-[12px] text-white/45">or</p>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mt-2 inline-flex h-9 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white hover:bg-reps-orange-hover"
          >
            <Upload className="h-4 w-4" /> Choose file
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
        </div>
      )}

      {mode === "ai" && (
        <div className="space-y-3 rounded-[12px] border border-reps-border bg-reps-panel-soft/60 p-4">
          <div className="text-[12px] text-white/65">
            We use your profile photo as a likeness reference and our locked REPs cinematic
            shot as a style anchor, so the result matches our brand quality bar.
          </div>

          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/55">
              Style
            </div>
            <div className="inline-flex flex-wrap gap-1.5">
              {([
                { id: "editorial", label: "Editorial · golden hour" },
                { id: "studio", label: "Studio · magazine cover" },
                { id: "action", label: "In-action · mid-rep" },
              ] as const).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStyle(s.id)}
                  className={`h-8 rounded-[10px] border px-3 text-[12px] font-medium transition ${
                    style === s.id
                      ? "border-reps-orange bg-reps-orange/15 text-white"
                      : "border-reps-border bg-reps-panel-soft text-white/65 hover:text-white"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            maxLength={400}
            placeholder="Coaching a client through a deadlift, industrial gym, golden hour"
            className="min-h-[72px] w-full rounded-[10px] border border-reps-border bg-reps-ink/60 px-3 py-2 text-[13px] text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-reps-orange"
          />
          <div className="flex items-center justify-end gap-2">
            <div className="flex items-center gap-2">
              {aiMut.isSuccess && !aiMut.isPending ? (
                <button
                  type="button"
                  onClick={() => aiMut.mutate()}
                  className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[13px] font-medium text-white/80 hover:bg-reps-panel"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Regenerate
                </button>
              ) : null}
              <button
                type="button"
                disabled={!prompt.trim() || aiMut.isPending}
                onClick={() => aiMut.mutate()}
                className="inline-flex h-9 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white hover:bg-reps-orange-hover disabled:opacity-60"
              >
                <Sparkles className="h-4 w-4" />
                {aiMut.isPending ? "Generating…" : "Generate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {mode === "url" && (
        <div className="space-y-2 rounded-[12px] border border-reps-border bg-reps-panel-soft/60 p-4">
          <input
            type="url"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            placeholder="https://…"
            className="h-10 w-full rounded-[10px] border border-reps-border bg-reps-ink/60 px-3 text-[13px] text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-reps-orange"
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-white/45">We'll re-host and crop it to 1080 × 1920.</span>
            <button
              type="button"
              disabled={!urlDraft.trim()}
              onClick={async () => {
                try {
                  const r = await fetch(urlDraft);
                  const blob = await r.blob();
                  const reader = new FileReader();
                  reader.onload = () => setEditing(String(reader.result));
                  reader.readAsDataURL(blob);
                } catch {
                  toast.error("Couldn't fetch that URL");
                }
              }}
              className="inline-flex h-9 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white hover:bg-reps-orange-hover disabled:opacity-60"
            >
              <Check className="h-4 w-4" /> Load
            </button>
          </div>
        </div>
      )}

      {editing && (
        <CropperModal
          src={editing}
          onCancel={() => setEditing(null)}
          onConfirm={(dataUrl) => uploadMut.mutate(dataUrl)}
          uploading={uploadMut.isPending}
        />
      )}
    </div>
  );
}

function CropperModal({
  src,
  onCancel,
  onConfirm,
  uploading,
}: {
  src: string;
  onCancel: () => void;
  onConfirm: (dataUrl: string) => void;
  uploading: boolean;
}) {
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [pixels, setPixels] = React.useState<Area | null>(null);

  async function handleConfirm() {
    if (!pixels) return;
    const dataUrl = await renderCrop(src, pixels);
    onConfirm(dataUrl);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-[420px] overflow-hidden rounded-[16px] border border-reps-border bg-reps-ink shadow-2xl">
        <div className="flex items-center justify-between border-b border-reps-border px-4 py-3">
          <div>
            <div className="text-[14px] font-semibold text-white">Crop hero image</div>
            <div className="text-[11px] text-white/55">Portrait 9:16 · saves as 1080 × 1920 JPEG</div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white"
            aria-label="Cancel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="relative h-[480px] w-full bg-black">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={ASPECT}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, area) => setPixels(area)}
            objectFit="contain"
          />
        </div>
        <div className="space-y-3 border-t border-reps-border px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-white/55">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-reps-orange"
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="h-9 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[13px] text-white/80 hover:bg-reps-panel"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={uploading || !pixels}
              onClick={handleConfirm}
              className="inline-flex h-9 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white hover:bg-reps-orange-hover disabled:opacity-60"
            >
              <Check className="h-4 w-4" />
              {uploading ? "Saving…" : "Use this image"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

async function renderCrop(src: string, area: Area): Promise<string> {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = TARGET_W;
  canvas.height = TARGET_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    img,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    TARGET_W,
    TARGET_H,
  );
  return canvas.toDataURL("image/jpeg", 0.85);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image failed to load"));
    img.src = src;
  });
}
