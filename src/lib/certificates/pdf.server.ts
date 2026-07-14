/**
 * Certificate PDF renderer — template-driven.
 *
 * Loads an admin-uploaded, Adobe-designed print-ready PDF from the
 * `certificate-templates` storage bucket and overlays the variable data
 * (learner name, course, dates, cert number, QR, provider logo) at the
 * coordinates defined in the template's `field_map` JSON.
 *
 * Falls back to the legacy code-drawn renderer when no default template
 * exists so certificates keep issuing on day one.
 *
 * Coordinate system: **top-left origin, Y grows downward**, in PDF points
 * (1pt = 1/72"). This matches Adobe Illustrator's ruler so admins can copy
 * X/Y straight from Illustrator. Internally we flip Y to pdf-lib's native
 * bottom-left space just before drawing (see `overlayPage`).
 *
 * Server-only.
 */
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";

export type CertificatePdfInput = {
  certificateNumber: string;
  learnerName: string;
  courseTitle: string;
  courseLevel: number | null;
  repsCourseNumber: string | null;
  ofqualNumber: string | null;
  providerName: string;
  providerLogoUrl?: string | null;
  providerCenterNumber?: string | null;
  issuedAt: Date;
  verificationUrl: string;
  unitSummary: string[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Field-map schema (stored as jsonb on certificate_templates.field_map)

type Align = "left" | "center" | "right";
type FontWeight = "regular" | "bold" | "italic";

type TextField = {
  field: string;            // 'learner_name' | 'course_title' | 'course_line' | 'issue_date' | 'certificate_number' | 'reps_course_number' | 'ofqual_number' | 'provider_name' | 'verify_url'
  x: number;                // pdf-lib points from bottom-left
  y: number;
  maxWidth?: number;
  align?: Align;            // default "left"
  fontSize?: number;        // default 12
  fontWeight?: FontWeight;  // default "regular"
  color?: string;           // hex, default "#111111"
  prefix?: string;
  suffix?: string;
  uppercase?: boolean;
};

type ImageField = {
  field: "qr_code" | "provider_logo" | "level_badge";
  x: number;
  y: number;
  width: number;
  height: number;
};


type ListField = {
  field: "unit_summary";
  x: number;
  y: number;              // top of the list block (bottom-left origin; list flows downward)
  maxWidth: number;
  lineHeight?: number;    // default 14
  fontSize?: number;      // default 10
  color?: string;         // default "#111111"
  bullet?: string;        // default "•"
  bulletColor?: string;   // default "#e97316"
  maxItems?: number;
};

type PageMap = {
  text?: TextField[];
  images?: ImageField[];
  list?: ListField;       // unit summary page usually
};

export type CertificateFieldMap = {
  certificate: PageMap;
  unit_summary?: PageMap;
};

// ─────────────────────────────────────────────────────────────────────────────

export async function generateCertificatePdf(input: CertificatePdfInput): Promise<Uint8Array> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Load default template
  const { data: tpl } = await supabaseAdmin
    .from("certificate_templates")
    .select("id, certificate_pdf_path, unit_summary_pdf_path, field_map")
    .eq("is_default", true)
    .maybeSingle();

  if (!tpl) {
    // Fallback: legacy code-drawn renderer
    const { generateCertificatePdfLegacy } = await import("./pdf-legacy.server");
    return await generateCertificatePdfLegacy(input);
  }

  return await renderCertificateWithTemplate(
    {
      certificate_pdf_path: (tpl as any).certificate_pdf_path as string,
      unit_summary_pdf_path: ((tpl as any).unit_summary_pdf_path ?? null) as string | null,
      field_map: ((tpl as any).field_map ?? {}) as CertificateFieldMap,
    },
    input,
  );
}

/**
 * Render a certificate against an explicit template row + field map.
 * Used by the admin live-preview editor to render with an unsaved map.
 */
export async function renderCertificateWithTemplate(
  tpl: {
    certificate_pdf_path: string;
    unit_summary_pdf_path: string | null;
    field_map: CertificateFieldMap;
  },
  input: CertificatePdfInput,
): Promise<Uint8Array> {
  const fieldMap = tpl.field_map ?? ({} as CertificateFieldMap);

  // Fetch template PDFs
  const certPdfBytes = await downloadTemplateBytes(tpl.certificate_pdf_path);
  const unitPdfBytes = tpl.unit_summary_pdf_path
    ? await downloadTemplateBytes(tpl.unit_summary_pdf_path)
    : null;

  // Start from the certificate template so its artwork/fonts are preserved
  const output = await PDFDocument.load(certPdfBytes);
  output.setTitle(`REPS Certificate ${input.certificateNumber}`);
  output.setAuthor("REPS");

  const fonts = {
    regular: await output.embedFont(StandardFonts.Helvetica),
    bold: await output.embedFont(StandardFonts.HelveticaBold),
    italic: await output.embedFont(StandardFonts.HelveticaOblique),
  };

  // Build overlay data (values keyed by field name)
  const values = buildFieldValues(input);

  // Prepare shared images
  const qrPng = await renderQrPng(input.verificationUrl);
  const qrImage = await output.embedPng(qrPng);
  const providerLogoImage = await tryEmbedImageFromUrl(output, input.providerLogoUrl ?? null);
  const levelBadgeImage = await tryEmbedLevelBadge(output, input.courseLevel);

  // ── Overlay page 1 (certificate)
  const page1 = output.getPage(0);
  overlayPage(page1, fieldMap.certificate ?? {}, values, input.unitSummary, fonts, {
    qr: qrImage,
    provider_logo: providerLogoImage,
    level_badge: levelBadgeImage,
  });

  // ── Overlay page 2 (unit summary) if present
  if (unitPdfBytes && fieldMap.unit_summary) {
    const unitDoc = await PDFDocument.load(unitPdfBytes);
    const [copied] = await output.copyPages(unitDoc, [0]);
    const page2 = output.addPage(copied);
    overlayPage(page2, fieldMap.unit_summary, values, input.unitSummary, fonts, {
      qr: qrImage,
      provider_logo: providerLogoImage,
      level_badge: levelBadgeImage,
    });
  }


  return await output.save();
}

// ─────────────────────────────────────────────────────────────────────────────

async function downloadTemplateBytes(path: string): Promise<Uint8Array> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.storage.from("certificate-templates").download(path);
  if (error || !data) throw new Error(`Failed to load certificate template ${path}: ${error?.message ?? "no data"}`);
  const ab = await data.arrayBuffer();
  return new Uint8Array(ab);
}

function buildFieldValues(input: CertificatePdfInput): Record<string, string> {
  const dateStr = input.issuedAt.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const levelLabel = input.courseLevel ? `Level ${input.courseLevel} — ` : "";
  return {
    learner_name: input.learnerName,
    course_title: input.courseTitle,
    course_line: `${levelLabel}${input.courseTitle}`,
    course_level: input.courseLevel ? `Level ${input.courseLevel}` : "",
    issue_date: dateStr,
    certificate_number: input.certificateNumber,
    reps_course_number: input.repsCourseNumber ?? "",
    ofqual_number: input.ofqualNumber ?? "",
    provider_name: input.providerName,
    center_number: input.providerCenterNumber ?? "",
    center_number_line: input.providerCenterNumber ? `Centre No. ${input.providerCenterNumber}` : "",
    verify_url: input.verificationUrl.replace(/^https?:\/\//, ""),
  };
}

async function renderQrPng(url: string): Promise<Uint8Array> {
  const dataUrl = await QRCode.toDataURL(url, { margin: 1, width: 400, errorCorrectionLevel: "M" });
  return Uint8Array.from(atob(dataUrl.split(",")[1]), (c) => c.charCodeAt(0));
}

async function tryEmbedImageFromUrl(
  doc: PDFDocument,
  url: string | null,
): Promise<Awaited<ReturnType<PDFDocument["embedPng"]>> | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    const ct = res.headers.get("content-type") ?? "";
    if (ct.includes("jpeg") || ct.includes("jpg")) {
      return (await doc.embedJpg(buf)) as never;
    }
    return await doc.embedPng(buf);
  } catch (err) {
    console.error("[cert-pdf] provider logo embed failed", err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Rendering

type EmbeddedFonts = {
  regular: Awaited<ReturnType<PDFDocument["embedFont"]>>;
  bold: Awaited<ReturnType<PDFDocument["embedFont"]>>;
  italic: Awaited<ReturnType<PDFDocument["embedFont"]>>;
};

function overlayPage(
  page: ReturnType<PDFDocument["getPage"]>,
  map: PageMap,
  values: Record<string, string>,
  units: string[],
  fonts: EmbeddedFonts,
  images: {
    qr: Awaited<ReturnType<PDFDocument["embedPng"]>>;
    provider_logo: Awaited<ReturnType<PDFDocument["embedPng"]>> | null;
  },
): void {
  const pageH = page.getHeight();
  for (const t of map.text ?? []) {
    const raw = values[t.field];
    if (raw == null || raw === "") continue;
    drawText(page, t, raw, fonts, pageH);
  }
  for (const img of map.images ?? []) {
    // Top-left origin: (img.x, img.y) is the top-left corner of the image box.
    const pdfY = pageH - img.y - img.height;
    if (img.field === "qr_code") {
      page.drawImage(images.qr, { x: img.x, y: pdfY, width: img.width, height: img.height });
    } else if (img.field === "provider_logo" && images.provider_logo) {
      const src = images.provider_logo;
      const scale = Math.min(img.width / src.width, img.height / src.height);
      const w = src.width * scale;
      const h = src.height * scale;
      const cx = img.x + (img.width - w) / 2;
      const cy = pdfY + (img.height - h) / 2;
      page.drawImage(src, { x: cx, y: cy, width: w, height: h });
    }
  }
  if (map.list && map.list.field === "unit_summary") {
    drawList(page, map.list, units, fonts, pageH);
  }
}

function drawText(
  page: ReturnType<PDFDocument["getPage"]>,
  t: TextField,
  raw: string,
  fonts: EmbeddedFonts,
  pageH: number,
): void {
  const font =
    t.fontWeight === "bold" ? fonts.bold : t.fontWeight === "italic" ? fonts.italic : fonts.regular;
  const size = t.fontSize ?? 12;
  const text = (t.uppercase ? raw.toUpperCase() : raw);
  const full = `${t.prefix ?? ""}${text}${t.suffix ?? ""}`;
  const color = hexToRgb(t.color ?? "#111111");
  const width = font.widthOfTextAtSize(full, size);
  const align: Align = t.align ?? "left";
  let x = t.x;
  if (align === "center") x = t.x - width / 2;
  else if (align === "right") x = t.x - width;
  // Top-left origin: t.y is the top of the glyph box; pdf-lib draws from baseline.
  const y = pageH - t.y - size;
  page.drawText(full, { x, y, size, font, color, maxWidth: t.maxWidth });
}

function drawList(
  page: ReturnType<PDFDocument["getPage"]>,
  l: ListField,
  items: string[] | undefined,
  fonts: EmbeddedFonts,
  pageH: number,
): void {
  const list = (items ?? []).slice(0, l.maxItems ?? 40);
  if (list.length === 0) return;
  const size = l.fontSize ?? 10;
  const lh = l.lineHeight ?? 14;
  const color = hexToRgb(l.color ?? "#111111");
  const numberColor = hexToRgb(l.bulletColor ?? "#e97316");
  const font = fonts.regular;
  // Reserve gutter width based on widest number label (e.g. "10.") so wrapped text left-aligns.
  const widestLabel = `${list.length}.`;
  const labelWidth = font.widthOfTextAtSize(widestLabel + "  ", size);
  // Top-left origin: l.y is the top of the first line's glyph box.
  let y = pageH - l.y - size;
  const maxCharsPerLine = Math.max(20, Math.floor((l.maxWidth - labelWidth) / (size * 0.5)));
  for (let idx = 0; idx < list.length; idx++) {
    const raw = list[idx];
    const lines = wrapText(raw, maxCharsPerLine);
    for (let i = 0; i < lines.length; i++) {
      if (i === 0) {
        page.drawText(`${idx + 1}.`, { x: l.x, y, size, font, color: numberColor });
      }
      page.drawText(lines[i], { x: l.x + labelWidth, y, size, font, color, maxWidth: l.maxWidth - labelWidth });
      y -= lh;
    }
    y -= 4;
  }
}

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const n = parseInt(clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean, 16);
  return rgb(((n >> 16) & 0xff) / 255, ((n >> 8) & 0xff) / 255, (n & 0xff) / 255);
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxCharsPerLine) {
      if (cur) lines.push(cur);
      cur = w;
    } else {
      cur = (cur ? cur + " " : "") + w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}
