/**
 * Certificate PDF + QR generator.
 *
 * Server-only. Renders a jointly-branded REPS certificate of achievement
 * on page 1 and a learner unit summary on page 2. QR encodes the public
 * verification URL. Uses pdf-lib (Worker-safe) and qrcode.
 *
 * The visual template here is intentionally clean and typographic — the
 * final REPS-approved artwork will replace it later, keeping the same
 * data contract.
 */
import { PDFDocument, StandardFonts, rgb, PageSizes } from "pdf-lib";
import QRCode from "qrcode";

export type CertificatePdfInput = {
  certificateNumber: string;
  learnerName: string;
  courseTitle: string;
  courseLevel: number | null;
  repsCourseNumber: string | null;
  ofqualNumber: string | null;
  providerName: string;
  issuedAt: Date;
  verificationUrl: string;
  unitSummary: string[]; // learning outcomes / modules
};

export async function generateCertificatePdfLegacy(input: CertificatePdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`REPS Certificate ${input.certificateNumber}`);
  pdf.setAuthor("REPS");

  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const helvBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const helvOblique = await pdf.embedFont(StandardFonts.HelveticaOblique);

  const orange = rgb(0.92, 0.45, 0.1);
  const dark = rgb(0.08, 0.08, 0.1);
  const muted = rgb(0.35, 0.35, 0.4);
  const line = rgb(0.85, 0.85, 0.88);

  // ── Page 1 — Certificate of Achievement (A4 portrait) ─────────────────
  const page = pdf.addPage(PageSizes.A4);
  const { width: W, height: H } = page.getSize();

  // Border
  page.drawRectangle({
    x: 24, y: 24, width: W - 48, height: H - 48,
    borderColor: orange, borderWidth: 2,
  });
  page.drawRectangle({
    x: 32, y: 32, width: W - 64, height: H - 64,
    borderColor: line, borderWidth: 0.5,
  });

  // Header
  page.drawText("REPS", { x: 60, y: H - 80, size: 28, font: helvBold, color: orange });
  page.drawText("Register of Exercise Professionals", { x: 60, y: H - 100, size: 10, font: helv, color: muted });
  const rightHeader = `Certificate No. ${input.certificateNumber}`;
  const rightHeaderW = helv.widthOfTextAtSize(rightHeader, 10);
  page.drawText(rightHeader, { x: W - 60 - rightHeaderW, y: H - 80, size: 10, font: helv, color: muted });

  // Title
  const title = "Certificate of Achievement";
  const titleSize = 36;
  const titleW = helvBold.widthOfTextAtSize(title, titleSize);
  page.drawText(title, { x: (W - titleW) / 2, y: H - 190, size: titleSize, font: helvBold, color: dark });

  // "Presented to"
  const presented = "This is to certify that";
  const presentedW = helvOblique.widthOfTextAtSize(presented, 14);
  page.drawText(presented, { x: (W - presentedW) / 2, y: H - 230, size: 14, font: helvOblique, color: muted });

  // Learner name
  const nameSize = 32;
  const nameW = helvBold.widthOfTextAtSize(input.learnerName, nameSize);
  page.drawText(input.learnerName, {
    x: (W - nameW) / 2, y: H - 280, size: nameSize, font: helvBold, color: dark,
  });
  page.drawLine({
    start: { x: (W - Math.max(nameW, 300)) / 2 - 20, y: H - 296 },
    end: { x: (W + Math.max(nameW, 300)) / 2 + 20, y: H - 296 },
    thickness: 0.75, color: line,
  });

  // Achievement line
  const hasCompleted = "has successfully completed";
  const hasW = helv.widthOfTextAtSize(hasCompleted, 13);
  page.drawText(hasCompleted, { x: (W - hasW) / 2, y: H - 320, size: 13, font: helv, color: muted });

  // Course title + level
  const levelLabel = input.courseLevel ? `Level ${input.courseLevel} — ` : "";
  const courseLine = `${levelLabel}${input.courseTitle}`;
  const courseSize = 20;
  const courseW = helvBold.widthOfTextAtSize(courseLine, courseSize);
  page.drawText(courseLine, {
    x: Math.max(60, (W - courseW) / 2), y: H - 355, size: courseSize, font: helvBold, color: dark,
    maxWidth: W - 120,
  });

  // Awarded by
  const awardedBy = `Awarded by ${input.providerName}, in association with REPS`;
  const awardedW = helv.widthOfTextAtSize(awardedBy, 12);
  page.drawText(awardedBy, {
    x: (W - awardedW) / 2, y: H - 390, size: 12, font: helv, color: muted,
  });

  // Footer — issued date + numbers
  const issuedText = `Issued ${input.issuedAt.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}`;
  page.drawText(issuedText, { x: 60, y: 70, size: 10, font: helv, color: muted });
  if (input.repsCourseNumber) {
    page.drawText(`REPS Course: ${input.repsCourseNumber}`, { x: 60, y: 55, size: 9, font: helv, color: muted });
  }
  if (input.ofqualNumber) {
    page.drawText(`Ofqual: ${input.ofqualNumber}`, { x: 60, y: 40, size: 9, font: helv, color: muted });
  }

  // QR code (bottom right)
  const qrDataUrl = await QRCode.toDataURL(input.verificationUrl, {
    margin: 1, width: 300, errorCorrectionLevel: "M",
  });
  const qrBytes = Uint8Array.from(atob(qrDataUrl.split(",")[1]), (c) => c.charCodeAt(0));
  const qrImg = await pdf.embedPng(qrBytes);
  const qrSize = 96;
  page.drawImage(qrImg, { x: W - 60 - qrSize, y: 40, width: qrSize, height: qrSize });
  const verifyLabel = "Verify at";
  page.drawText(verifyLabel, {
    x: W - 60 - qrSize - 100, y: 90, size: 9, font: helv, color: muted,
  });
  page.drawText("repsuk.org/verify", {
    x: W - 60 - qrSize - 100, y: 76, size: 10, font: helvBold, color: dark,
  });
  page.drawText(input.certificateNumber, {
    x: W - 60 - qrSize - 100, y: 62, size: 9, font: helv, color: muted,
  });

  // ── Page 2 — Unit Summary (A4 portrait) ───────────────────────────────
  const page2 = pdf.addPage([PageSizes.A4[0], PageSizes.A4[1]]);
  const { width: PW, height: PH } = page2.getSize();

  page2.drawText("REPS", { x: 48, y: PH - 60, size: 22, font: helvBold, color: orange });
  page2.drawText("Learner Unit Summary", { x: 48, y: PH - 84, size: 18, font: helvBold, color: dark });
  page2.drawLine({
    start: { x: 48, y: PH - 92 }, end: { x: PW - 48, y: PH - 92 },
    thickness: 0.5, color: line,
  });

  // Metadata block
  const meta: Array<[string, string]> = [
    ["Learner", input.learnerName],
    ["Course", input.courseTitle],
    ...(input.courseLevel ? [["Level", `Level ${input.courseLevel}`] as [string, string]] : []),
    ["Certificate No.", input.certificateNumber],
    ["Issued", input.issuedAt.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })],
    ["Provider", input.providerName],
    ...(input.repsCourseNumber ? [["REPS Course No.", input.repsCourseNumber] as [string, string]] : []),
    ...(input.ofqualNumber ? [["Ofqual No.", input.ofqualNumber] as [string, string]] : []),
  ];
  let mY = PH - 120;
  for (const [k, v] of meta) {
    page2.drawText(k, { x: 48, y: mY, size: 9, font: helv, color: muted });
    page2.drawText(v, { x: 160, y: mY, size: 10, font: helvBold, color: dark, maxWidth: PW - 220 });
    mY -= 18;
  }

  mY -= 16;
  page2.drawLine({ start: { x: 48, y: mY }, end: { x: PW - 48, y: mY }, thickness: 0.5, color: line });
  mY -= 22;

  page2.drawText("Units achieved", { x: 48, y: mY, size: 12, font: helvBold, color: dark });
  mY -= 20;

  const units = input.unitSummary.length > 0 ? input.unitSummary : ["Successful completion of all assessed units for this course."];
  for (const unit of units) {
    if (mY < 80) break;
    page2.drawText("•", { x: 48, y: mY, size: 10, font: helv, color: orange });
    const lines = wrapText(unit, 90);
    for (const l of lines) {
      page2.drawText(l, { x: 62, y: mY, size: 10, font: helv, color: dark, maxWidth: PW - 110 });
      mY -= 14;
    }
    mY -= 4;
  }

  // Footer QR mini + verify text
  page2.drawImage(qrImg, { x: PW - 48 - 72, y: 48, width: 72, height: 72 });
  page2.drawText("Verify authenticity", { x: 48, y: 96, size: 10, font: helvBold, color: dark });
  page2.drawText(`repsuk.org/verify/${input.certificateNumber}`, { x: 48, y: 82, size: 9, font: helv, color: muted });
  page2.drawText("Scan the QR to confirm this certificate is on the REPS register.", {
    x: 48, y: 66, size: 9, font: helv, color: muted,
  });

  return await pdf.save();
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
