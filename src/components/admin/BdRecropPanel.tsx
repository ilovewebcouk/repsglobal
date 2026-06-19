import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageIcon, PlayCircle, RefreshCw } from "lucide-react";

import { PPanel } from "@/components/dashboard/primitives";
import {
  commitBdRecrop,
  getBdRecropCandidates,
  getBdRecropStats,
  rejectBdRecrop,
  validateBdAvatarBytes,
  type BdRecropCandidate,
} from "@/lib/admin/bd-recrop.functions";

type LogEntry = {
  bd_member_id: number;
  name: string;
  status: "ok" | "rejected" | "error";
  detail: string;
};

/** Load an image with CORS so the canvas isn't tainted. */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image failed to load"));
    img.src = src;
  });
}

/**
 * Mirrors src/lib/profile/cropPortraitToJpegBlob — square 1024² crop,
 * centred on the face box, ~2.0× padding, head sits ~38% from the top.
 */
function cropFromFaceBox(
  img: HTMLImageElement,
  faceBox: { x: number; y: number; width: number; height: number },
): Promise<Blob> {
  const W = img.naturalWidth;
  const H = img.naturalHeight;

  // Face box in pixels
  const fx = faceBox.x * W;
  const fy = faceBox.y * H;
  const fw = faceBox.width * W;
  const fh = faceBox.height * H;
  const fcx = fx + fw / 2;
  const fcy = fy + fh / 2;

  // Padding multiplier (face is ~50% of crop)
  const targetFaceFrac = 0.5;
  const sideFromHead = Math.max(fw, fh) / targetFaceFrac;

  // Clamp to image bounds while keeping it square
  let side = Math.min(sideFromHead, W, H);

  // Head sits 38% from top → centre of crop is below the face centre
  // crop_top = fcy - 0.38 * side
  let cropTop = fcy - 0.38 * side;
  let cropLeft = fcx - side / 2;

  // Clamp
  cropLeft = Math.max(0, Math.min(W - side, cropLeft));
  cropTop = Math.max(0, Math.min(H - side, cropTop));

  const outSize = Math.min(1024, Math.round(side));
  const canvas = document.createElement("canvas");
  canvas.width = outSize;
  canvas.height = outSize;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, cropLeft, cropTop, side, side, 0, 0, outSize, outSize);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      0.88,
    );
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = (r.result as string) || "";
      const comma = s.indexOf(",");
      resolve(comma >= 0 ? s.slice(comma + 1) : s);
    };
    r.onerror = () => reject(new Error("FileReader failed"));
    r.readAsDataURL(blob);
  });
}

export function BdRecropPanel() {
  const qc = useQueryClient();
  const fetchCandidates = useServerFn(getBdRecropCandidates);
  const fetchValidate = useServerFn(validateBdAvatarBytes);
  const fetchCommit = useServerFn(commitBdRecrop);
  const fetchReject = useServerFn(rejectBdRecrop);

  const { data: stats, isPending } = useQuery({
    queryKey: ["admin-bd-recrop-stats"],
    queryFn: () => getBdRecropStats(),
    staleTime: 30_000,
  });

  const [running, setRunning] = React.useState(false);
  const [progress, setProgress] = React.useState({ done: 0, total: 0 });
  const [log, setLog] = React.useState<LogEntry[]>([]);

  async function processOne(c: BdRecropCandidate): Promise<LogEntry> {
    // 1. Validate via Gemini → face box
    const v = await fetchValidate({ data: { path: c.src_path } });
    if (!v.ok) {
      await fetchReject({
        data: {
          bd_member_id: c.bd_member_id,
          user_id: c.user_id,
          reason: `${v.category}: ${v.reason}`,
        },
      });
      return {
        bd_member_id: c.bd_member_id,
        name: c.full_name,
        status: "rejected",
        detail: `${v.category} — ${v.reason}`,
      };
    }
    // 2. Load original + crop in browser
    const img = await loadImage(c.src_public_url);
    const blob = await cropFromFaceBox(img, v.faceBox);
    const b64 = await blobToBase64(blob);
    // 3. Commit via admin server fn
    await fetchCommit({
      data: { bd_member_id: c.bd_member_id, user_id: c.user_id, jpeg_base64: b64 },
    });
    return {
      bd_member_id: c.bd_member_id,
      name: c.full_name,
      status: "ok",
      detail: `q${v.qualityScore} · ${(blob.size / 1024).toFixed(0)}KB`,
    };
  }

  async function runBatch(limit: number) {
    setRunning(true);
    setLog([]);
    setProgress({ done: 0, total: 0 });
    try {
      const candidates = await fetchCandidates({ data: { limit } });
      setProgress({ done: 0, total: candidates.length });
      for (const c of candidates) {
        try {
          const entry = await processOne(c);
          setLog((prev) => [entry, ...prev]);
        } catch (e) {
          setLog((prev) => [
            {
              bd_member_id: c.bd_member_id,
              name: c.full_name,
              status: "error",
              detail: e instanceof Error ? e.message : "unknown",
            },
            ...prev,
          ]);
        }
        setProgress((p) => ({ ...p, done: p.done + 1 }));
      }
    } finally {
      setRunning(false);
      qc.invalidateQueries({ queryKey: ["admin-bd-recrop-stats"] });
    }
  }

  const okCount = log.filter((l) => l.status === "ok").length;
  const rejCount = log.filter((l) => l.status === "rejected").length;
  const errCount = log.filter((l) => l.status === "error").length;

  return (
    <PPanel className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-reps-border px-5 py-4">
        <div>
          <h2 className="font-display text-[16px] font-bold text-white">
            BD avatar re-crop
          </h2>
          <p className="text-[12px] text-white/55">
            Re-frame the BD-seeded "ok" photos into proper headshots (face-centred
            1024² JPEG). Rejects clear <code>avatar_url</code> so the card falls back to
            initials.
          </p>
        </div>
        <div className="flex items-center gap-3 text-[12px] text-white/70">
          <span>
            <b className="text-white">{stats?.total_ok_bd ?? "…"}</b> total
          </span>
          <span>
            <b className="text-reps-green">{stats?.recropped ?? "…"}</b> re-cropped
          </span>
          <span>
            <b className="text-red-400">{stats?.rejected ?? "…"}</b> rejected
          </span>
          <span>
            <b className="text-reps-orange">{stats?.pending ?? "…"}</b> pending
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 px-5 py-4">
        <button
          onClick={() => runBatch(10)}
          disabled={running || isPending}
          className="flex h-9 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-ink px-3 text-[12px] font-medium text-white/80 disabled:opacity-50"
        >
          <PlayCircle className="h-3.5 w-3.5" /> Run batch (10)
        </button>
        <button
          onClick={() => runBatch(25)}
          disabled={running || isPending}
          className="flex h-9 items-center gap-2 rounded-[10px] bg-reps-orange px-3 text-[12px] font-semibold text-white disabled:opacity-50"
        >
          <ImageIcon className="h-3.5 w-3.5" /> Run batch (25)
        </button>
        <button
          onClick={() => runBatch(100)}
          disabled={running || isPending}
          className="flex h-9 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-ink px-3 text-[12px] font-medium text-white/80 disabled:opacity-50"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Run batch (100)
        </button>
        {running && (
          <span className="text-[12px] text-white/65">
            Processing {progress.done} / {progress.total}…
          </span>
        )}
        {!running && log.length > 0 && (
          <span className="text-[12px] text-white/65">
            Last batch: <b className="text-reps-green">{okCount}</b> ok ·{" "}
            <b className="text-red-400">{rejCount}</b> rejected ·{" "}
            <b className="text-red-300">{errCount}</b> errors
          </span>
        )}
      </div>

      {log.length > 0 && (
        <div className="max-h-72 overflow-y-auto border-t border-reps-border">
          <ul className="divide-y divide-reps-border">
            {log.map((entry, i) => (
              <li
                key={`${entry.bd_member_id}-${i}`}
                className="flex items-start justify-between gap-3 px-5 py-2"
              >
                <div className="min-w-0">
                  <div className="truncate text-[12.5px] font-medium text-white/85">
                    {entry.name}{" "}
                    <span className="font-mono text-[11px] text-white/40">
                      #{entry.bd_member_id}
                    </span>
                  </div>
                  <div className="truncate text-[11px] text-white/55">{entry.detail}</div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${
                    entry.status === "ok"
                      ? "bg-reps-green/15 text-reps-green"
                      : entry.status === "rejected"
                        ? "bg-red-500/15 text-red-400"
                        : "bg-red-500/25 text-red-300"
                  }`}
                >
                  {entry.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </PPanel>
  );
}
