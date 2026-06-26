import { Callout } from "@/components/help/Callout";
import type { HelpArticle } from "../types";

export const article: HelpArticle = {
  slug: "upload-failed",
  category: "troubleshooting",
  title: "Document upload failed",
  summary: "S3 timeouts, oversize files, and what to do when an upload stalls.",
  tier: ["verified"],
  lastReviewed: "2026-06-26",
  author: "REPS Team",
  tags: ["uploads", "s3", "errors", "files"],
  Body: () => (
    <>
      <h2 id="check-the-basics">1. Check the basics</h2>
      <ul>
        <li>File is under 20MB</li>
        <li>File is a PDF, JPG, PNG or HEIC</li>
        <li>You're on a stable connection</li>
      </ul>
      <h2 id="service-unavailable">2. "ServiceUnavailable" or a timeout</h2>
      <p>
        Usually a transient blip with the upload backend. Wait 60 seconds and try again — the
        upload picker will resume rather than restart from scratch.
      </p>
      <h2 id="qr-code-route">3. Use the QR code route</h2>
      <p>
        On both qualifications and insurance, you can scan a QR code to upload from your phone
        instead. This bypasses any browser extensions interfering with the desktop upload.
      </p>
      <Callout tone="tip" title="HEIC photos from iPhone">
        We convert HEIC server-side, but you'll get faster reviews if you change your iPhone
        camera setting to "Most Compatible" so it captures JPEG directly.
      </Callout>
    </>
  ),
};
