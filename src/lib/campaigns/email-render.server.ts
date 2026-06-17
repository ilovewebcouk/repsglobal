// Shared email rendering for outbound campaigns. Mirrors the inline helpers in
// outbound.functions.ts so server-only callers (the cron runner and the new
// shared batch sender) don't need to depend on a `.functions.ts` file's
// non-exported helpers.

const REPS_WORDMARK_SVG = (height: number) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 267.34 48.17" height="${height}" fill="#0F172A" role="img" aria-label="REPS" style="display:block"><path d="M53.86,33.34c7.34-2.81,11.59-8.28,11.59-15.77C65.45,6.55,56.31,0,41.19,0H0v48.17h14.83v-12.82h21.82l12.1,12.82h19.66l-14.54-14.83ZM42.7,23.33H14.83v-10.8h27.79c5.4,0,7.92,1.73,7.92,5.62,0,3.6-2.38,5.18-7.85,5.18Z"/><polygon points="119.96 12.53 129.68 12.53 129.68 0 129.6 0 119.96 0 73.8 0 73.8 48.17 120.17 48.17 129.68 48.17 129.68 35.64 120.17 35.64 88.7 35.64 88.7 29.38 118.16 29.38 126.8 29.38 126.8 18.72 118.16 18.72 88.7 18.72 88.7 12.53 119.96 12.53"/><path d="M175.32,0h-40.68v48.17h14.83v-12.46h25.85c14.11,0,22.97-6.91,22.97-17.71S189.29,0,175.32,0ZM176.98,23.4h-27.51v-10.87h27.51c3.96,0,6.48,2.09,6.48,5.4s-2.45,5.47-6.48,5.47Z"/><path d="M249.05,18.79h-26.28c-3.1,0-4.54-1.01-4.54-3.17s1.44-3.1,4.54-3.1h43.28V0h-42.12c-13.61,0-20.31,4.97-20.31,14.91,0,9.15,6.77,14.47,18.51,14.47h26.07c3.1,0,4.54.94,4.54,3.17s-1.37,3.1-4.39,3.1h-44.72v12.53h44.28c13.39,0,19.44-4.82,19.44-15.41,0-9.15-6.34-13.97-18.29-13.97Z"/></svg>`;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function applyMergeTags(
  body: string,
  recipient: { email: string; name: string | null },
): string {
  const full = (recipient.name ?? "").trim();
  const parts = full.split(/\s+/).filter(Boolean);
  const first = parts[0] ?? "";
  const last = parts.length > 1 ? parts.slice(1).join(" ") : "";
  const map: Record<string, string> = {
    first_name: first || "there",
    last_name: last,
    full_name: full,
    name: full || first || "there",
    email: recipient.email,
  };
  return body.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_m, key: string) => {
    const k = String(key).toLowerCase();
    return k in map ? map[k] : `{{${key}}}`;
  });
}

function inlineFormat(s: string): string {
  return s
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(
      /(https?:\/\/[^\s<]+[^\s<.,;:!?)\]])/g,
      '<a href="$1" style="color:#0f172a;text-decoration:underline;">$1</a>',
    );
}

function textToHtml(text: string): string {
  const escaped = escapeHtml(text);
  return escaped
    .split(/\n{2,}/)
    .map((raw) => {
      const lines = raw.split(/\n/);
      const isList = lines.length > 0 && lines.every((l) => /^\s*[-*]\s+/.test(l));
      if (isList) {
        const items = lines
          .map((l) => l.replace(/^\s*[-*]\s+/, ""))
          .map((l) => `<li style="margin:0 0 6px 0;">${inlineFormat(l)}</li>`)
          .join("");
        return `<ul style="margin:0 0 14px 20px;padding:0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#0f172a;">${items}</ul>`;
      }
      return `<p style="margin:0 0 14px 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#0f172a;">${inlineFormat(raw.replace(/\n/g, "<br/>"))}</p>`;
    })
    .join("\n");
}

function sanitiseHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");
}

function wrapEmail(innerHtml: string, inboxLabel: string): string {
  const year = new Date().getFullYear();
  const SITE = "https://repsuk.org";
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="format-detection" content="telephone=no,address=no,email=no" />
    <title>REPs</title>
    <style>
      img { -ms-interpolation-mode: bicubic; }
      @media only screen and (max-width:600px) {
        .reps-shell { width:100% !important; padding:16px 8px !important; }
        .reps-card  { width:100% !important; border-radius:12px !important; }
        .reps-head  { padding:20px 18px 6px 18px !important; }
        .reps-pad   { padding:22px 18px 6px 18px !important; }
        .reps-foot  { padding:20px 18px 22px 18px !important; }
        .reps-body, .reps-body p, .reps-body li { font-size:16px !important; line-height:1.6 !important; }
        .reps-foot p { font-size:14px !important; line-height:1.6 !important; }
        .reps-foot-meta { font-size:12px !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#0f172a;-webkit-text-size-adjust:100%;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="reps-shell" style="background:#f4f5f7;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="reps-card" style="width:100%;max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr><td class="reps-head" style="padding:24px 32px 8px 32px;border-bottom:1px solid #f1f2f4;">
            ${REPS_WORDMARK_SVG(22)}
          </td></tr>
          <tr><td class="reps-pad reps-body" style="padding:28px 32px 8px 32px;">
            ${innerHtml}
          </td></tr>
          <tr><td class="reps-foot" style="padding:24px 32px 28px 32px;border-top:1px solid #f1f2f4;">
            <p style="margin:0 0 8px 0;font-size:14px;line-height:1.55;color:#475569;">The professional platform for the modern fitness industry.</p>
            <p style="margin:0 0 14px 0;font-size:14px;line-height:1.55;color:#64748b;">Reply directly to this email — it goes straight to the ${escapeHtml(inboxLabel)} team.</p>
            <p class="reps-foot-meta" style="margin:0 0 6px 0;font-size:13px;line-height:1.55;color:#64748b;">
              <a href="${SITE}" style="color:#64748b;text-decoration:underline;">repsuk.org</a>
            </p>
            <p class="reps-foot-meta" style="margin:0;font-size:12px;line-height:1.55;color:#94a3b8;">© ${year} REPs. All rights reserved.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export function renderForRecipient(args: {
  body: string;
  format: "text" | "html";
  recipient: { email: string; name: string | null };
  inboxLabel: string;
}): { html: string; text: string } {
  const personalised = applyMergeTags(args.body, args.recipient);
  const innerHtml =
    args.format === "html" ? sanitiseHtml(personalised) : textToHtml(personalised);
  const html = wrapEmail(innerHtml, args.inboxLabel);
  const text =
    args.format === "text"
      ? personalised
      : personalised
          .replace(/<br\s*\/?>(\s*)/gi, "\n")
          .replace(/<\/p>/gi, "\n\n")
          .replace(/<\/li>/gi, "\n")
          .replace(/<li[^>]*>/gi, "• ")
          .replace(/<[^>]+>/g, "")
          .replace(/\n{3,}/g, "\n\n")
          .trim();
  return { html, text };
}
