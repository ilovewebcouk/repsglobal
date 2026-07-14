/**
 * Live certificate template editor.
 *
 * Two-pane UI:
 *  - Left: structured form for the field map (text / image / list fields)
 *          plus an "Advanced / raw JSON" disclosure.
 *  - Right: live PDF preview rasterised via pdfjs-dist, with draggable
 *          markers overlaid so admins can position fields visually.
 *
 * Coordinates: **top-left origin, Y grows downward** (matches Adobe
 * Illustrator). pdfjs viewport is also top-left, so no Y flip is needed.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { DashboardButton as Button } from "@/components/dashboard/ui/button";
import { DashboardInput as Input } from "@/components/dashboard/ui/input";
import { previewCertificateTemplateWithMap } from "@/lib/certificates/templates.functions";

// ─────────────────────────────────────────────────────────── Types (mirror pdf.server.ts)

type Align = "left" | "center" | "right";
type FontWeight = "regular" | "bold" | "italic";

type TextField = {
  field: string;
  x: number;
  y: number;
  maxWidth?: number;
  align?: Align;
  fontSize?: number;
  fontWeight?: FontWeight;
  color?: string;
  prefix?: string;
  suffix?: string;
  uppercase?: boolean;
};

type ImageField = {
  field: "qr_code" | "provider_logo";
  x: number;
  y: number;
  width: number;
  height: number;
};

type ListField = {
  field: "unit_summary";
  x: number;
  y: number;
  maxWidth: number;
  lineHeight?: number;
  fontSize?: number;
  color?: string;
  bullet?: string;
  bulletColor?: string;
  maxItems?: number;
};

type PageMap = {
  text?: TextField[];
  images?: ImageField[];
  list?: ListField;
};

type CertificateFieldMap = {
  certificate: PageMap;
  unit_summary?: PageMap;
};

const KNOWN_TEXT_FIELDS = [
  "learner_name",
  "course_title",
  "course_line",
  "course_level",
  "issue_date",
  "certificate_number",
  "reps_course_number",
  "ofqual_number",
  "provider_name",
  "verify_url",
] as const;

// ─────────────────────────────────────────────────────────── PDF.js loader

async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.mjs?url")).default;
  (pdfjs as any).GlobalWorkerOptions.workerSrc = workerUrl;
  return pdfjs;
}

// ─────────────────────────────────────────────────────────── Component

export function TemplateEditor({
  templateId,
  initialFieldMapJson,
  onSave,
  onCancel,
}: {
  templateId: string;
  initialFieldMapJson: string;
  onSave: (json: string) => Promise<void>;
  onCancel: () => void;
}) {
  const previewFn = useServerFn(previewCertificateTemplateWithMap);

  const [map, setMap] = useState<CertificateFieldMap>(() => parseMap(initialFieldMapJson));
  const [rawJson, setRawJson] = useState(() => JSON.stringify(parseMap(initialFieldMapJson), null, 2));
  const [showRaw, setShowRaw] = useState(false);
  const [showMarkers, setShowMarkers] = useState(true);
  const [pageKey, setPageKey] = useState<"certificate" | "unit_summary">("certificate");
  const [saving, setSaving] = useState(false);

  // Preview state
  const [pdfB64, setPdfB64] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Serialised map (drives preview refresh)
  const mapJson = useMemo(() => JSON.stringify(map), [map]);

  // Keep raw JSON textarea synced when structured form updates it
  useEffect(() => {
    setRawJson(JSON.stringify(map, null, 2));
  }, [map]);

  // Debounced preview render
  useEffect(() => {
    const t = setTimeout(async () => {
      setPreviewing(true);
      setPreviewError(null);
      try {
        const { pdf_b64 } = await previewFn({
          data: { id: templateId, field_map_json: mapJson },
        });
        setPdfB64(pdf_b64);
      } catch (err) {
        setPreviewError(err instanceof Error ? err.message : "Preview failed");
      } finally {
        setPreviewing(false);
      }
    }, 450);
    return () => clearTimeout(t);
  }, [mapJson, templateId, previewFn]);

  const pageMap = map[pageKey] ?? { text: [], images: [] };

  const updatePage = useCallback(
    (updater: (p: PageMap) => PageMap) => {
      setMap((prev) => {
        const current = prev[pageKey] ?? {};
        return { ...prev, [pageKey]: updater(current) };
      });
    },
    [pageKey],
  );

  const save = async () => {
    // Validate raw JSON if user has been editing that pane
    if (showRaw) {
      try {
        const parsed = JSON.parse(rawJson);
        setMap(parsed);
        setSaving(true);
        await onSave(JSON.stringify(parsed));
      } catch {
        toast.error("Raw JSON is not valid");
        return;
      } finally {
        setSaving(false);
      }
      return;
    }
    setSaving(true);
    try {
      await onSave(JSON.stringify(map));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 rounded-lg bg-white/[0.04] p-1">
          {(["certificate", "unit_summary"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setPageKey(k)}
              className={`rounded-md px-2.5 py-1 text-[12px] ${
                pageKey === k ? "bg-white/10 text-white" : "text-white/60 hover:text-white/90"
              }`}
            >
              {k === "certificate" ? "Page 1 · Certificate" : "Page 2 · Unit summary"}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-[12px] text-white/70">
          <input
            type="checkbox"
            checked={showMarkers}
            onChange={(e) => setShowMarkers(e.target.checked)}
          />
          Show draggable markers
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* ── Left: fields form */}
        <div className="space-y-3">
          <FieldsPanel
            pageMap={pageMap}
            pageKey={pageKey}
            onChange={updatePage}
          />

          <details className="rounded-lg border border-white/10 bg-black/30 p-3">
            <summary className="cursor-pointer text-[12px] text-white/60">
              Advanced · raw JSON
            </summary>
            <textarea
              value={rawJson}
              onChange={(e) => {
                setRawJson(e.target.value);
                try {
                  setMap(JSON.parse(e.target.value));
                } catch {
                  /* wait for valid JSON */
                }
              }}
              rows={18}
              className="mt-2 w-full rounded-md border border-white/10 bg-black/40 p-2 font-mono text-[11px] text-white/90"
              onFocus={() => setShowRaw(true)}
              onBlur={() => setShowRaw(false)}
            />
          </details>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={onCancel} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Save field map
            </Button>
          </div>
        </div>

        {/* ── Right: live preview */}
        <div>
          <PreviewCanvas
            pdfB64={pdfB64}
            pageIndex={pageKey === "certificate" ? 0 : 1}
            previewing={previewing}
            previewError={previewError}
            showMarkers={showMarkers}
            pageMap={pageMap}
            onDragField={(kind, index, x, y) => {
              updatePage((p) => {
                if (kind === "text") {
                  const arr = [...(p.text ?? [])];
                  arr[index] = { ...arr[index], x: Math.round(x), y: Math.round(y) };
                  return { ...p, text: arr };
                }
                if (kind === "image") {
                  const arr = [...(p.images ?? [])];
                  arr[index] = { ...arr[index], x: Math.round(x), y: Math.round(y) };
                  return { ...p, images: arr };
                }
                if (kind === "list" && p.list) {
                  return { ...p, list: { ...p.list, x: Math.round(x), y: Math.round(y) } };
                }
                return p;
              });
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────── Fields form

function FieldsPanel({
  pageMap,
  pageKey,
  onChange,
}: {
  pageMap: PageMap;
  pageKey: "certificate" | "unit_summary";
  onChange: (updater: (p: PageMap) => PageMap) => void;
}) {
  const textFields = pageMap.text ?? [];
  const imageFields = pageMap.images ?? [];
  const listField = pageMap.list;

  return (
    <div className="space-y-3">
      {/* Text fields */}
      <div className="rounded-lg border border-white/10 bg-black/20 p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-[12px] font-medium text-white">Text fields</div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              onChange((p) => ({
                ...p,
                text: [
                  ...(p.text ?? []),
                  { field: "learner_name", x: 300, y: 400, fontSize: 24, align: "center" },
                ],
              }))
            }
          >
            + Add text
          </Button>
        </div>
        <div className="space-y-2">
          {textFields.length === 0 && (
            <div className="text-[11px] text-white/40">No text fields on this page.</div>
          )}
          {textFields.map((t, i) => (
            <TextFieldRow
              key={i}
              value={t}
              onChange={(next) =>
                onChange((p) => {
                  const arr = [...(p.text ?? [])];
                  arr[i] = next;
                  return { ...p, text: arr };
                })
              }
              onRemove={() =>
                onChange((p) => ({
                  ...p,
                  text: (p.text ?? []).filter((_, j) => j !== i),
                }))
              }
            />
          ))}
        </div>
      </div>

      {/* Image fields */}
      <div className="rounded-lg border border-white/10 bg-black/20 p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-[12px] font-medium text-white">Images</div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                onChange((p) => ({
                  ...p,
                  images: [
                    ...(p.images ?? []),
                    { field: "qr_code", x: 60, y: 60, width: 90, height: 90 },
                  ],
                }))
              }
            >
              + QR
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                onChange((p) => ({
                  ...p,
                  images: [
                    ...(p.images ?? []),
                    { field: "provider_logo", x: 60, y: 500, width: 140, height: 60 },
                  ],
                }))
              }
            >
              + Logo
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          {imageFields.length === 0 && (
            <div className="text-[11px] text-white/40">No images on this page.</div>
          )}
          {imageFields.map((im, i) => (
            <ImageFieldRow
              key={i}
              value={im}
              onChange={(next) =>
                onChange((p) => {
                  const arr = [...(p.images ?? [])];
                  arr[i] = next;
                  return { ...p, images: arr };
                })
              }
              onRemove={() =>
                onChange((p) => ({
                  ...p,
                  images: (p.images ?? []).filter((_, j) => j !== i),
                }))
              }
            />
          ))}
        </div>
      </div>

      {/* List field (unit summary only) */}
      {pageKey === "unit_summary" && (
        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[12px] font-medium text-white">Unit summary list</div>
            {!listField ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  onChange((p) => ({
                    ...p,
                    list: {
                      field: "unit_summary",
                      x: 80,
                      y: 700,
                      maxWidth: 435,
                      fontSize: 10,
                      lineHeight: 14,
                    },
                  }))
                }
              >
                + Add list
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  onChange((p) => {
                    const { list: _drop, ...rest } = p;
                    void _drop;
                    return rest;
                  })
                }
              >
                Remove
              </Button>
            )}
          </div>
          {listField && (
            <ListFieldRow
              value={listField}
              onChange={(next) => onChange((p) => ({ ...p, list: next }))}
            />
          )}
        </div>
      )}
    </div>
  );
}

function TextFieldRow({
  value,
  onChange,
  onRemove,
}: {
  value: TextField;
  onChange: (v: TextField) => void;
  onRemove: () => void;
}) {
  const num = (v: number | undefined) => (v == null ? "" : String(v));
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.02] p-2">
      <div className="mb-1.5 flex items-center gap-2">
        <select
          className="min-w-0 flex-1 rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[12px] text-white"
          value={value.field}
          onChange={(e) => onChange({ ...value, field: e.target.value })}
        >
          {KNOWN_TEXT_FIELDS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <button
          onClick={onRemove}
          className="text-[11px] text-white/40 hover:text-white/80"
        >
          Remove
        </button>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        <MiniInput
          label="x"
          value={num(value.x)}
          onChange={(v) => onChange({ ...value, x: Number(v) || 0 })}
        />
        <MiniInput
          label="y"
          value={num(value.y)}
          onChange={(v) => onChange({ ...value, y: Number(v) || 0 })}
        />
        <MiniInput
          label="size"
          value={num(value.fontSize)}
          onChange={(v) => onChange({ ...value, fontSize: Number(v) || undefined })}
        />
        <MiniInput
          label="maxW"
          value={num(value.maxWidth)}
          onChange={(v) => onChange({ ...value, maxWidth: Number(v) || undefined })}
        />
        <label className="col-span-2 flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-wider text-white/40">align</span>
          <select
            className="rounded-md border border-white/10 bg-black/40 px-1.5 py-1 text-[12px] text-white"
            value={value.align ?? "left"}
            onChange={(e) => onChange({ ...value, align: e.target.value as Align })}
          >
            <option value="left">left</option>
            <option value="center">center</option>
            <option value="right">right</option>
          </select>
        </label>
        <label className="col-span-2 flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-wider text-white/40">weight</span>
          <select
            className="rounded-md border border-white/10 bg-black/40 px-1.5 py-1 text-[12px] text-white"
            value={value.fontWeight ?? "regular"}
            onChange={(e) => onChange({ ...value, fontWeight: e.target.value as FontWeight })}
          >
            <option value="regular">regular</option>
            <option value="bold">bold</option>
            <option value="italic">italic</option>
          </select>
        </label>
        <MiniInput
          label="color"
          value={value.color ?? ""}
          placeholder="#111"
          onChange={(v) => onChange({ ...value, color: v || undefined })}
          colSpan={2}
        />
        <label className="col-span-2 flex items-center gap-2 pt-4 text-[11px] text-white/70">
          <input
            type="checkbox"
            checked={!!value.uppercase}
            onChange={(e) => onChange({ ...value, uppercase: e.target.checked || undefined })}
          />
          UPPERCASE
        </label>
      </div>
    </div>
  );
}

function ImageFieldRow({
  value,
  onChange,
  onRemove,
}: {
  value: ImageField;
  onChange: (v: ImageField) => void;
  onRemove: () => void;
}) {
  const num = (v: number) => String(v);
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.02] p-2">
      <div className="mb-1.5 flex items-center gap-2">
        <select
          className="min-w-0 flex-1 rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[12px] text-white"
          value={value.field}
          onChange={(e) =>
            onChange({ ...value, field: e.target.value as ImageField["field"] })
          }
        >
          <option value="qr_code">qr_code</option>
          <option value="provider_logo">provider_logo</option>
        </select>
        <button onClick={onRemove} className="text-[11px] text-white/40 hover:text-white/80">
          Remove
        </button>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        <MiniInput label="x" value={num(value.x)} onChange={(v) => onChange({ ...value, x: Number(v) || 0 })} />
        <MiniInput label="y" value={num(value.y)} onChange={(v) => onChange({ ...value, y: Number(v) || 0 })} />
        <MiniInput label="w" value={num(value.width)} onChange={(v) => onChange({ ...value, width: Number(v) || 0 })} />
        <MiniInput label="h" value={num(value.height)} onChange={(v) => onChange({ ...value, height: Number(v) || 0 })} />
      </div>
    </div>
  );
}

function ListFieldRow({
  value,
  onChange,
}: {
  value: ListField;
  onChange: (v: ListField) => void;
}) {
  const num = (v: number | undefined) => (v == null ? "" : String(v));
  return (
    <div className="grid grid-cols-4 gap-1.5">
      <MiniInput label="x" value={num(value.x)} onChange={(v) => onChange({ ...value, x: Number(v) || 0 })} />
      <MiniInput label="y" value={num(value.y)} onChange={(v) => onChange({ ...value, y: Number(v) || 0 })} />
      <MiniInput
        label="maxW"
        value={num(value.maxWidth)}
        onChange={(v) => onChange({ ...value, maxWidth: Number(v) || 0 })}
      />
      <MiniInput
        label="size"
        value={num(value.fontSize)}
        onChange={(v) => onChange({ ...value, fontSize: Number(v) || undefined })}
      />
      <MiniInput
        label="lineH"
        value={num(value.lineHeight)}
        onChange={(v) => onChange({ ...value, lineHeight: Number(v) || undefined })}
      />
      <MiniInput
        label="maxItems"
        value={num(value.maxItems)}
        onChange={(v) => onChange({ ...value, maxItems: Number(v) || undefined })}
      />
      <MiniInput
        label="color"
        value={value.color ?? ""}
        placeholder="#111"
        onChange={(v) => onChange({ ...value, color: v || undefined })}
        colSpan={2}
      />
    </div>
  );
}

function MiniInput({
  label,
  value,
  onChange,
  placeholder,
  colSpan,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  colSpan?: number;
}) {
  return (
    <label className={`flex flex-col gap-0.5 ${colSpan === 2 ? "col-span-2" : ""}`}>
      <span className="text-[10px] uppercase tracking-wider text-white/40">{label}</span>
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 text-[12px]"
      />
    </label>
  );
}

// ─────────────────────────────────────────────────────────── Preview canvas

const CANVAS_WIDTH_PX = 620;

function PreviewCanvas({
  pdfB64,
  pageIndex,
  previewing,
  previewError,
  showMarkers,
  pageMap,
  onDragField,
}: {
  pdfB64: string | null;
  pageIndex: number;
  previewing: boolean;
  previewError: string | null;
  showMarkers: boolean;
  pageMap: PageMap;
  onDragField: (kind: "text" | "image" | "list", index: number, x: number, y: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dims, setDims] = useState<{ pdfW: number; pdfH: number; scale: number } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Render the requested page whenever the pdf bytes or page change
  useEffect(() => {
    let cancelled = false;
    if (!pdfB64) return;
    (async () => {
      try {
        const pdfjs = await loadPdfjs();
        const bytes = Uint8Array.from(atob(pdfB64), (c) => c.charCodeAt(0));
        // pdfjs mutates the buffer — clone so subsequent renders still work
        const doc = await (pdfjs as any).getDocument({ data: bytes.slice() }).promise;
        const safeIdx = Math.min(pageIndex, doc.numPages - 1);
        const page = await doc.getPage(safeIdx + 1);
        const viewport1 = page.getViewport({ scale: 1 });
        const scale = CANVAS_WIDTH_PX / viewport1.width;
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        await page.render({ canvasContext: ctx, canvas, viewport }).promise;
        if (!cancelled) {
          setDims({ pdfW: viewport1.width, pdfH: viewport1.height, scale });
        }
      } catch (err) {
        console.error("[cert-editor] pdf render failed", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pdfB64, pageIndex]);

  // Convert PDF point (top-left origin) → screen px on canvas (top-left origin)
  const pdfToScreen = useCallback(
    (x: number, y: number) => {
      if (!dims) return { left: 0, top: 0 };
      return { left: x * dims.scale, top: y * dims.scale };
    },
    [dims],
  );

  // Convert screen px on canvas → PDF point (top-left origin)
  const screenToPdf = useCallback(
    (leftPx: number, topPx: number) => {
      if (!dims) return { x: 0, y: 0 };
      return { x: leftPx / dims.scale, y: topPx / dims.scale };
    },
    [dims],
  );

  const startDrag = (
    e: React.PointerEvent<HTMLDivElement>,
    kind: "text" | "image" | "list",
    index: number,
    origin: { x: number; y: number },
  ) => {
    if (!dims) return;
    e.preventDefault();
    e.stopPropagation();
    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startScreen = pdfToScreen(origin.x, origin.y);

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startClientX;
      const dy = ev.clientY - startClientY;
      const nextLeft = startScreen.left + dx;
      const nextTop = startScreen.top + dy;
      const next = screenToPdf(nextLeft, nextTop);
      onDragField(kind, index, next.x, next.y);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div className="rounded-lg border border-white/10 bg-black/30 p-3">
      <div className="mb-2 flex items-center justify-between text-[11px] text-white/50">
        <span>Live preview · sample data</span>
        {previewing && (
          <span className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" /> rendering…
          </span>
        )}
      </div>
      {previewError && (
        <div className="mb-2 rounded-md border border-red-500/30 bg-red-500/10 p-2 text-[11px] text-red-200">
          {previewError}
        </div>
      )}
      <div
        ref={containerRef}
        className="relative mx-auto overflow-hidden rounded-md bg-white"
        style={{ width: CANVAS_WIDTH_PX }}
      >
        <canvas ref={canvasRef} className="block w-full" />
        {showMarkers && dims && (
          <>
            {(pageMap.text ?? []).map((t, i) => {
              const pos = pdfToScreen(t.x, t.y);
              return (
                <Marker
                  key={`t-${i}`}
                  left={pos.left}
                  top={pos.top}
                  label={t.field}
                  color="rgba(233,115,22,0.85)"
                  onPointerDown={(e) => startDrag(e, "text", i, { x: t.x, y: t.y })}
                />
              );
            })}
            {(pageMap.images ?? []).map((im, i) => {
              const pos = pdfToScreen(im.x, im.y + im.height);
              const w = im.width * dims.scale;
              const h = im.height * dims.scale;
              return (
                <div
                  key={`i-${i}`}
                  className="absolute cursor-move rounded-sm border-2 border-dashed border-fuchsia-500/90 bg-fuchsia-500/10"
                  style={{ left: pos.left, top: pos.top, width: w, height: h }}
                  onPointerDown={(e) => startDrag(e, "image", i, { x: im.x, y: im.y })}
                  title={im.field}
                >
                  <span className="absolute -top-4 left-0 whitespace-nowrap rounded bg-fuchsia-600 px-1 text-[9px] text-white">
                    {im.field}
                  </span>
                </div>
              );
            })}
            {pageMap.list && (
              <Marker
                left={pdfToScreen(pageMap.list.x, pageMap.list.y).left}
                top={pdfToScreen(pageMap.list.x, pageMap.list.y).top}
                label={`list: ${pageMap.list.field}`}
                color="rgba(56,189,248,0.9)"
                onPointerDown={(e) =>
                  startDrag(e, "list", 0, { x: pageMap.list!.x, y: pageMap.list!.y })
                }
              />
            )}
          </>
        )}
      </div>
      <div className="mt-2 text-center text-[10px] text-white/40">
        {dims
          ? `PDF page ${Math.round(dims.pdfW)} × ${Math.round(dims.pdfH)} pt · display ${Math.round(dims.scale * 100)}%`
          : "Loading preview…"}
      </div>
    </div>
  );
}

function Marker({
  left,
  top,
  label,
  color,
  onPointerDown,
}: {
  left: number;
  top: number;
  label: string;
  color: string;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-move select-none"
      style={{ left, top }}
      onPointerDown={onPointerDown}
    >
      <div
        className="h-3 w-3 rounded-full border-2 border-white shadow"
        style={{ background: color }}
      />
      <span
        className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-medium text-white"
      >
        {label}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────── Utils

function parseMap(json: string): CertificateFieldMap {
  try {
    const obj = JSON.parse(json || "{}");
    return {
      certificate: obj.certificate ?? {},
      unit_summary: obj.unit_summary,
    };
  } catch {
    return { certificate: {} };
  }
}
