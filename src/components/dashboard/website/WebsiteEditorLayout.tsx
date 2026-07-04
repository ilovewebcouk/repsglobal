import * as React from "react";
import { Check, ExternalLink, Monitor, RefreshCw, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

export type SectionStatus = "done" | "partial" | "empty" | "optional";

export type WebsiteEditorSection = {
  id: string;
  label: string;
  status: SectionStatus;
};

type Props = {
  sections: WebsiteEditorSection[];
  activeId: string;
  onActive: (id: string) => void;
  slug: string | null | undefined;
  publicUrl: string;
  title: string;
  description: string;
  isDirty: boolean;
  onPublish: () => void;
  publishPending: boolean;
  reloadNonce: number;
  onReloadPreview: () => void;
  children: React.ReactNode;
};

/**
 * Focus-per-section website editor shell.
 * Left rail = sections + status pills + Publish.
 * Middle  = header (title / description) + active section body.
 * Right   = live iframe preview of the trainer's public page with device toggle.
 *
 * On <lg the preview and rail collapse: rail becomes a horizontal pill row,
 * preview becomes a "View public" link (kept off-screen — full iframe on desktop only).
 */
export function WebsiteEditorLayout({
  sections,
  activeId,
  onActive,
  slug,
  publicUrl,
  title,
  description,
  isDirty,
  onPublish,
  publishPending,
  reloadNonce,
  onReloadPreview,
  children,
}: Props) {
  const [device, setDevice] = React.useState<"mobile" | "desktop">("mobile");
  const iframeSrc = slug ? `/c/${slug}?preview=1#nonce-${reloadNonce}` : "";

  return (
    <div className="-mx-4 -mt-6 flex h-[calc(100vh-88px)] flex-col overflow-hidden border-t border-reps-border sm:-mx-6 lg:-mx-8">
      {/* Mobile pill nav */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-reps-border bg-reps-panel/40 px-4 py-2 lg:hidden">
        {sections.map((s) => (
          <NavPill key={s.id} section={s} active={s.id === activeId} onClick={() => onActive(s.id)} />
        ))}
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Left rail (desktop) */}
        <aside className="hidden w-[236px] shrink-0 flex-col border-r border-reps-border bg-reps-panel/40 lg:flex">
          <div className="px-5 py-4">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/45">
              Website sections
            </div>
          </div>
          <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
            {sections.map((s) => (
              <NavItem key={s.id} section={s} active={s.id === activeId} onClick={() => onActive(s.id)} />
            ))}
          </nav>
          <div className="border-t border-reps-border p-4">
            {isDirty ? (
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-amber-300">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-300" />
                Unpublished changes
              </div>
            ) : (
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-white/45">
                <Check className="h-3 w-3" /> All changes published
              </div>
            )}
            <button
              type="button"
              onClick={onPublish}
              disabled={publishPending}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-[10px] bg-reps-orange text-[13px] font-semibold text-white hover:bg-reps-orange-hover disabled:opacity-60"
            >
              {publishPending ? "Publishing…" : "Publish changes"}
            </button>
          </div>
        </aside>

        {/* Middle — active section */}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-reps-border bg-reps-ink/70 px-6 py-4 backdrop-blur">
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-display text-[18px] font-semibold leading-tight text-white">
                {title}
              </h2>
              <p className="mt-0.5 line-clamp-2 text-[12.5px] text-white/55">{description}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2 lg:hidden">
              <button
                type="button"
                onClick={onPublish}
                disabled={publishPending}
                className="flex h-9 items-center gap-1.5 rounded-[10px] bg-reps-orange px-3 text-[12.5px] font-semibold text-white hover:bg-reps-orange-hover disabled:opacity-60"
              >
                {publishPending ? "Publishing…" : "Publish"}
              </button>
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            <div className="mx-auto max-w-[720px] space-y-6">{children}</div>
          </div>
        </main>

        {/* Right — live preview */}
        <aside className="hidden w-[420px] shrink-0 flex-col border-l border-reps-border bg-reps-panel/30 xl:flex">
          <div className="flex items-center justify-between gap-2 border-b border-reps-border px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 rounded-[8px] border border-reps-border bg-reps-panel-soft p-0.5">
                <DeviceToggle
                  active={device === "mobile"}
                  onClick={() => setDevice("mobile")}
                  aria-label="Mobile preview"
                >
                  <Smartphone className="h-3.5 w-3.5" />
                </DeviceToggle>
                <DeviceToggle
                  active={device === "desktop"}
                  onClick={() => setDevice("desktop")}
                  aria-label="Desktop preview"
                >
                  <Monitor className="h-3.5 w-3.5" />
                </DeviceToggle>
              </div>
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/45">
                Live preview
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onReloadPreview}
                className="grid h-8 w-8 place-items-center rounded-[8px] text-white/60 hover:bg-white/[0.06] hover:text-white"
                aria-label="Reload preview"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              {slug ? (
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="grid h-8 w-8 place-items-center rounded-[8px] text-white/60 hover:bg-white/[0.06] hover:text-white"
                  aria-label="Open in new tab"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden bg-reps-ink p-4">
            {slug ? (
              <div
                className={cn(
                  "mx-auto h-full overflow-hidden rounded-[16px] border border-reps-border bg-black shadow-2xl transition-all",
                  device === "mobile" ? "w-[320px]" : "w-full",
                )}
              >
                <iframe
                  key={reloadNonce}
                  src={iframeSrc}
                  title="Public page preview"
                  className="h-full w-full border-0"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="grid h-full place-items-center text-center text-[12.5px] text-white/55">
                Preview appears once your public page is live.
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function NavItem({
  section,
  active,
  onClick,
}: {
  section: WebsiteEditorSection;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-center justify-between rounded-[10px] px-3 py-2 text-left text-[13px] transition-colors",
        active
          ? "border border-reps-orange/25 bg-reps-orange/10 text-white"
          : "border border-transparent text-white/70 hover:bg-white/[0.04] hover:text-white",
      )}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <StatusDot status={section.status} />
        <span className="truncate font-medium">{section.label}</span>
      </span>
      <StatusPill status={section.status} />
    </button>
  );
}

function NavPill({
  section,
  active,
  onClick,
}: {
  section: WebsiteEditorSection;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
        active
          ? "border-reps-orange/40 bg-reps-orange/15 text-white"
          : "border-reps-border bg-reps-panel-soft text-white/70",
      )}
    >
      <StatusDot status={section.status} />
      {section.label}
    </button>
  );
}

function StatusDot({ status }: { status: SectionStatus }) {
  const cls =
    status === "done"
      ? "bg-emerald-400"
      : status === "partial"
        ? "bg-amber-300"
        : status === "empty"
          ? "border border-white/25 bg-transparent"
          : "border border-white/15 bg-transparent";
  return <span className={cn("inline-block h-1.5 w-1.5 shrink-0 rounded-full", cls)} />;
}

function StatusPill({ status }: { status: SectionStatus }) {
  if (status === "done") {
    return (
      <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-emerald-300">
        Done
      </span>
    );
  }
  if (status === "empty") {
    return (
      <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-amber-300">
        Empty
      </span>
    );
  }
  if (status === "partial") {
    return (
      <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-white/60">
        Draft
      </span>
    );
  }
  return null;
}

function DeviceToggle({
  active,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active: boolean }) {
  return (
    <button
      type="button"
      {...rest}
      className={cn(
        "grid h-7 w-7 place-items-center rounded-[6px] transition-colors",
        active ? "bg-reps-orange text-white" : "text-white/55 hover:text-white",
      )}
    >
      {children}
    </button>
  );
}
