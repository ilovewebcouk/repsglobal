import * as React from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Monitor,
  RefreshCw,
  Smartphone,
} from "lucide-react";
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
  /** Signed preview token minted server-side for the logged-in owner. */
  previewToken: string | null;
  children: React.ReactNode;
};

const DESKTOP_WIDTH = 1280;
const MOBILE_WIDTH = 390;
const PREVIEW_COLLAPSE_KEY = "reps.editor.previewCollapsed";

/**
 * Focus-per-section website editor shell.
 * Left rail = sections + status pills + Publish.
 * Middle  = header (title / description) + active section body.
 * Right   = live iframe preview of the trainer's public page, rendered at the
 *           real device width (1280 desktop / 390 mobile) and CSS-scaled to fit.
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
  previewToken,
  children,
}: Props) {
  const [device, setDevice] = React.useState<"mobile" | "desktop">("desktop");
  const [collapsed, setCollapsed] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(PREVIEW_COLLAPSE_KEY) === "1";
  });
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PREVIEW_COLLAPSE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  // Only mount the iframe once we have a signed preview token — otherwise
  // the server returns the published snapshot and the "preview" panel
  // would silently show stale content.
  // Load preview from the published origin so the editor iframe is cross-origin.
  // Same-origin caused Vite HMR / postMessage collisions that forced a reload every 2–3s.
  const PREVIEW_ORIGIN = "https://repsglobal.lovable.app";
  const iframeSrc = slug && previewToken ? `${PREVIEW_ORIGIN}/c/${slug}?preview=${encodeURIComponent(previewToken)}` : "";


  return (
    <div className="flex h-[100vh] min-h-[640px] flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1">
        {/* Middle — active section */}
        <main className="flex min-w-0 flex-[1.5] flex-col overflow-hidden lg:flex-[1.6] xl:flex-[1.8]">

          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-reps-border bg-reps-ink/70 px-6 py-3 backdrop-blur">
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-display text-[15px] font-semibold leading-tight text-white">
                {title}
              </h2>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {collapsed ? (
                <button
                  type="button"
                  onClick={() => setCollapsed(false)}
                  className="hidden h-8 items-center gap-1.5 rounded-[10px] border border-reps-border bg-reps-panel-soft px-2.5 text-[12px] font-medium text-white/70 hover:text-white lg:flex"
                  aria-label="Show preview"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Preview
                </button>
              ) : null}
              <button
                type="button"
                onClick={onPublish}
                disabled={publishPending}
                className="flex h-8 items-center gap-1.5 rounded-[10px] bg-reps-orange px-3 text-[12.5px] font-semibold text-white hover:bg-reps-orange-hover disabled:opacity-60 lg:hidden"
              >
                {publishPending ? "Publishing…" : "Publish"}
              </button>
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            <div className="mx-auto max-w-[760px] space-y-6">{children}</div>
          </div>
        </main>

        {/* Right — live preview */}
        {!collapsed ? (
          <aside className="hidden min-w-[360px] max-w-[560px] flex-1 shrink-0 flex-col border-l border-reps-border bg-reps-panel/30 lg:flex">
            <div className="flex items-center justify-between gap-2 border-b border-reps-border px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5 rounded-[8px] border border-reps-border bg-reps-panel-soft p-0.5">
                  <DeviceToggle
                    active={device === "desktop"}
                    onClick={() => setDevice("desktop")}
                    aria-label="Desktop preview"
                  >
                    <Monitor className="h-3.5 w-3.5" />
                  </DeviceToggle>
                  <DeviceToggle
                    active={device === "mobile"}
                    onClick={() => setDevice("mobile")}
                    aria-label="Mobile preview"
                  >
                    <Smartphone className="h-3.5 w-3.5" />
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
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open(publicUrl, "_blank", "noopener,noreferrer");
                    }}
                    className="grid h-8 w-8 place-items-center rounded-[8px] text-white/60 hover:bg-white/[0.06] hover:text-white"
                    aria-label="Open in new tab"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : null}

                <button
                  type="button"
                  onClick={() => setCollapsed(true)}
                  className="grid h-8 w-8 place-items-center rounded-[8px] text-white/60 hover:bg-white/[0.06] hover:text-white"
                  aria-label="Hide preview"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <PreviewStage
              slug={slug}
              iframeSrc={iframeSrc}
              device={device}
              reloadNonce={reloadNonce}
            />
          </aside>
        ) : null}
      </div>
    </div>
  );
}

function PreviewStage({
  slug,
  iframeSrc,
  device,
  reloadNonce,
}: {
  slug: string | null | undefined;
  iframeSrc: string;
  device: "mobile" | "desktop";
  reloadNonce: number;
}) {
  const stageRef = React.useRef<HTMLDivElement | null>(null);
  const [stage, setStage] = React.useState({ w: 0, h: 0 });

  React.useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setStage({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const intrinsic = device === "desktop" ? DESKTOP_WIDTH : MOBILE_WIDTH;
  // Leave a little breathing room around the frame
  const availW = Math.max(0, stage.w - 32);
  const availH = Math.max(0, stage.h - 32);
  const scale = availW > 0 ? Math.min(1, availW / intrinsic) : 1;
  const scaledW = intrinsic * scale;
  const scaledH = availH; // fill vertically
  const frameHeight = scale > 0 ? scaledH / scale : availH;
  const percent = Math.round(scale * 100);

  return (
    <div className="min-h-0 flex-1 overflow-hidden bg-reps-ink">
      <div className="flex items-center justify-center gap-2 border-b border-reps-border/60 px-4 py-1.5 text-[10.5px] font-medium tracking-wide text-white/45">
        {device === "desktop" ? (
          <>Desktop · {DESKTOP_WIDTH}px · {percent}%</>
        ) : (
          <>Mobile · {MOBILE_WIDTH}px{scale < 1 ? ` · ${percent}%` : ""}</>
        )}
      </div>
      <div ref={stageRef} className="relative h-[calc(100%-28px)] w-full">
        {slug ? (
          <div
            className="absolute left-1/2 top-4"
            style={{
              width: scaledW,
              height: scaledH,
              transform: `translateX(-50%)`,
            }}
          >
            <div
              className={cn(
                "origin-top-left overflow-hidden border bg-black shadow-2xl",
                device === "mobile"
                  ? "rounded-[28px] border-white/10"
                  : "rounded-[12px] border-reps-border",
              )}
              style={{
                width: intrinsic,
                height: frameHeight,
                transform: `scale(${scale})`,
              }}
            >
              <iframe
                key={reloadNonce}
                src={iframeSrc}
                title="Public page preview"
                sandbox="allow-same-origin allow-scripts allow-forms"
                className="h-full w-full border-0"
                loading="lazy"
              />
            </div>
          </div>
        ) : (
          <div className="grid h-full place-items-center px-6 text-center text-[12.5px] text-white/55">
            Preview appears once your public page is live.
          </div>
        )}
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
  if (status === "partial") {
    return (
      <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-amber-300">
        In progress
      </span>
    );
  }
  // empty & optional both render "Add" so no section is ever silently unlabeled.
  return (
    <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-white/55">
      Add
    </span>
  );
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
