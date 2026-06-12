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
  // Drop www.
  v = v.replace(/^www\./i, "");
  // Drop any known social domain prefix up to the first slash
  v = v.replace(
    /^(instagram\.com|tiktok\.com|x\.com|twitter\.com|youtube\.com|linkedin\.com\/in|linkedin\.com\/company|linkedin\.com)\/+/i,
    "",
  );
  // Drop leading @
  v = v.replace(/^@+/, "");
  // Drop query/hash
  v = v.split(/[?#]/)[0] ?? "";
  // Drop trailing slash
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
