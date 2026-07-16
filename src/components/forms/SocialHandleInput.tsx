import * as React from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  /** Visible read-only domain prefix shown inside the field, e.g. "instagram.com/" */
  prefix: string;
  /** Brand icon rendered on the left */
  icon: React.ReactNode;
  placeholder?: string;
  ariaLabel?: string;
};

/**
 * Strip protocol, domain, leading "@", and trailing slashes from any input so
 * the saved value is always a bare handle. Mirrors the server normaliser so
 * "what you see is what saves".
 */
function normalise(raw: string): string {
  let v = raw.trim();
  if (!v) return "";
  // Drop protocol
  v = v.replace(/^https?:\/\//i, "");
  // Drop query/hash early so trailing junk never survives
  v = v.split(/[?#]/)[0] ?? "";
  // Collapse any subdomain (www., m., uk., de., in., www.uk. …) down to the
  // bare social host so the next replace can match it.
  v = v.replace(
    /^(?:[a-z0-9-]+\.)+(instagram\.com|tiktok\.com|x\.com|twitter\.com|youtube\.com|linkedin\.com)\b/i,
    "$1",
  );
  // Strip the host + optional path prefix (/in/, /company/, /c/, /channel/,
  // /user/, or a leading /@ for TikTok/YouTube).
  v = v.replace(
    /^(?:instagram\.com|tiktok\.com|x\.com|twitter\.com|youtube\.com|linkedin\.com)(?:\/(?:in|company|c|channel|user))?\/+@?/i,
    "",
  );
  // Drop leading @ (handle pasted as "@name")
  v = v.replace(/^@+/, "");
  // Keep only the first path segment — strips "/videos", "/about", etc.
  v = v.split("/")[0] ?? "";
  // Drop trailing slash (defensive)
  v = v.replace(/\/+$/, "");
  return v;
}

/**
 * Prefix-locked handle input: the domain prefix is rendered inside the field
 * as non-editable grey text. Users only type the handle. Pasting a full URL
 * is auto-stripped to the bare handle.
 */
export function SocialHandleInput({
  value,
  onChange,
  prefix,
  icon,
  placeholder = "yourhandle",
  ariaLabel,
}: Props) {
  return (
    <label
      className="flex h-10 items-center gap-2 rounded-[12px] border border-reps-border bg-reps-ink pl-3 pr-3 text-[13px] text-white focus-within:border-reps-orange-border/60"
      aria-label={ariaLabel}
    >
      <span className="flex shrink-0 items-center text-white/45">{icon}</span>
      <span className="shrink-0 select-none whitespace-nowrap text-[12.5px] text-white/40">
        {prefix}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(normalise(e.target.value))}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        className="min-w-0 flex-1 bg-transparent text-[13px] text-white placeholder:text-white/35 focus:outline-none"
      />
    </label>
  );
}
