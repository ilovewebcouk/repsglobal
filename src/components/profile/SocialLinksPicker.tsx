import * as React from "react";
import { Instagram, Linkedin, Plus, X, Youtube } from "lucide-react";

import { SocialHandleInput } from "@/components/forms/SocialHandleInput";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type SocialField =
  | "social_instagram"
  | "social_tiktok"
  | "social_x"
  | "social_youtube"
  | "social_linkedin";

export type SocialValues = Record<SocialField, string>;

function TiktokIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
      <path d="M19.6 6.7a5.6 5.6 0 0 1-3.4-1.2 5.6 5.6 0 0 1-2.1-3.5h-3v13.2a2.6 2.6 0 1 1-1.9-2.5V9.5a5.7 5.7 0 1 0 4.9 5.7V9.1a8.5 8.5 0 0 0 5.5 1.9z" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.836L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

type PlatformMeta = {
  field: SocialField;
  label: string;
  prefix: string;
  icon: React.ReactNode;
};

const PLATFORMS: PlatformMeta[] = [
  { field: "social_instagram", label: "Instagram", prefix: "instagram.com/", icon: <Instagram className="h-3.5 w-3.5" /> },
  { field: "social_tiktok", label: "TikTok", prefix: "tiktok.com/@", icon: <TiktokIcon /> },
  { field: "social_x", label: "X / Twitter", prefix: "x.com/", icon: <XIcon /> },
  { field: "social_youtube", label: "YouTube", prefix: "youtube.com/@", icon: <Youtube className="h-3.5 w-3.5" /> },
  { field: "social_linkedin", label: "LinkedIn", prefix: "linkedin.com/in/", icon: <Linkedin className="h-3.5 w-3.5" /> },
];

export function SocialLinksPicker({
  values,
  onChange,
}: {
  values: SocialValues;
  onChange: (field: SocialField, value: string) => void;
}) {
  // A platform is "shown" if it has a value OR the user just opened it via the dropdown.
  const [extra, setExtra] = React.useState<Set<SocialField>>(new Set());
  const focusRef = React.useRef<SocialField | null>(null);

  const shown = React.useMemo(() => {
    const set = new Set<SocialField>(extra);
    for (const p of PLATFORMS) {
      if (values[p.field]) set.add(p.field);
    }
    // Preserve PLATFORMS order
    return PLATFORMS.filter((p) => set.has(p.field));
  }, [values, extra]);

  const available = PLATFORMS.filter((p) => !shown.some((s) => s.field === p.field));
  const allAdded = available.length === 0;

  const handleAdd = (field: SocialField) => {
    focusRef.current = field;
    setExtra((s) => {
      const next = new Set(s);
      next.add(field);
      return next;
    });
  };

  const handleRemove = (field: SocialField) => {
    if (values[field]) onChange(field, "");
    setExtra((s) => {
      const next = new Set(s);
      next.delete(field);
      return next;
    });
  };

  // Auto-focus the just-added row's input
  const inputRefs = React.useRef<Partial<Record<SocialField, HTMLInputElement | null>>>({});
  React.useEffect(() => {
    if (!focusRef.current) return;
    const el = inputRefs.current[focusRef.current];
    el?.focus();
    focusRef.current = null;
  }, [shown.length]);

  return (
    <div className="flex flex-col gap-2">
      {shown.length === 0 ? (
        <p className="text-[11.5px] text-white/45">
          No links added yet. Add the platforms you use — clients see them on your profile.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {shown.map((p) => (
            <li key={p.field} className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <SocialHandleInputWithRef
                  inputRef={(el) => (inputRefs.current[p.field] = el)}
                  value={values[p.field]}
                  onChange={(v) => onChange(p.field, v)}
                  icon={p.icon}
                  prefix={p.prefix}
                  ariaLabel={`${p.label} handle`}
                />
              </div>
              <button
                type="button"
                aria-label={`Remove ${p.label}`}
                onClick={() => handleRemove(p.field)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-reps-border bg-reps-ink text-white/55 transition-colors hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={allAdded}
          className="inline-flex h-9 w-fit items-center gap-1.5 rounded-[10px] border border-dashed border-reps-border bg-reps-panel-soft/40 px-3 text-[12px] font-semibold text-white/75 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          {allAdded ? "All platforms added" : "Add platform"}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[200px]">
          <DropdownMenuGroup>
            {available.map((p) => (
              <DropdownMenuItem key={p.field} onSelect={() => handleAdd(p.field)}>
                <span className="flex h-4 w-4 items-center justify-center text-white/60">{p.icon}</span>
                {p.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/**
 * Tiny wrapper around SocialHandleInput that forwards a ref to the underlying
 * input so the picker can focus a row right after the user adds it.
 */
function SocialHandleInputWithRef({
  inputRef,
  ...rest
}: React.ComponentProps<typeof SocialHandleInput> & { inputRef: (el: HTMLInputElement | null) => void }) {
  // SocialHandleInput renders a single <input> inside a <label>. We attach a
  // hidden ref via a sibling effect: find the label's input on mount.
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const input = wrapperRef.current?.querySelector("input");
    inputRef(input ?? null);
    return () => inputRef(null);
  }, [inputRef]);
  return (
    <div ref={wrapperRef}>
      <SocialHandleInput {...rest} />
    </div>
  );
}
