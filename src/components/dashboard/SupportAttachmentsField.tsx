import * as React from "react";
import { Paperclip, X, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PendingFile = {
  id: string;
  file: File;
};

const MAX_FILES = 5;
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_PREFIXES = ["image/", "application/pdf"];
const ALLOWED_EXACT = [
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
];

function isAllowed(file: File): boolean {
  if (ALLOWED_PREFIXES.some((p) => file.type.startsWith(p))) return true;
  if (ALLOWED_EXACT.includes(file.type)) return true;
  return false;
}

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function SupportAttachmentsField({
  files,
  onChange,
  disabled,
  uploading,
  onError,
}: {
  files: PendingFile[];
  onChange: (files: PendingFile[]) => void;
  disabled?: boolean;
  uploading?: boolean;
  onError?: (msg: string) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const add = (selected: FileList | null) => {
    if (!selected) return;
    const next = [...files];
    for (const f of Array.from(selected)) {
      if (next.length >= MAX_FILES) {
        onError?.(`You can attach up to ${MAX_FILES} files per message.`);
        break;
      }
      if (!isAllowed(f)) {
        onError?.(`${f.name}: file type not allowed.`);
        continue;
      }
      if (f.size > MAX_BYTES) {
        onError?.(`${f.name}: max ${fmtBytes(MAX_BYTES)} per file.`);
        continue;
      }
      next.push({ id: `${f.name}-${f.size}-${f.lastModified}-${Math.random().toString(36).slice(2, 6)}`, file: f });
    }
    onChange(next);
    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = (id: string) => {
    onChange(files.filter((f) => f.id !== id));
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/csv"
        onChange={(e) => add(e.target.files)}
        disabled={disabled || uploading}
      />
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || uploading || files.length >= MAX_FILES}
          onClick={() => inputRef.current?.click()}
          className="h-8 rounded-[10px] border-reps-border bg-reps-panel text-[12px] text-white/75 hover:bg-reps-panel-soft hover:text-white"
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" data-icon="inline-start" />
          ) : (
            <Paperclip className="h-3.5 w-3.5" data-icon="inline-start" />
          )}
          {uploading ? "Uploading…" : "Attach files"}
        </Button>
        <span className="text-[11px] text-white/40">
          Up to {MAX_FILES} files · {fmtBytes(MAX_BYTES)} each
        </span>
      </div>

      {files.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {files.map((f) => {
            const Icon = f.file.type.startsWith("image/") ? ImageIcon : FileText;
            return (
              <li
                key={f.id}
                className={cn(
                  "flex items-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel-soft/60 px-2.5 py-1.5",
                )}
              >
                <Icon className="h-3.5 w-3.5 text-white/55" />
                <span className="max-w-[180px] truncate text-[12px] text-white/85">
                  {f.file.name}
                </span>
                <span className="text-[10.5px] text-white/40">{fmtBytes(f.file.size)}</span>
                <button
                  type="button"
                  onClick={() => remove(f.id)}
                  disabled={uploading}
                  aria-label={`Remove ${f.file.name}`}
                  className="ml-0.5 rounded-full p-0.5 text-white/40 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export async function uploadPendingFiles(args: {
  ticketId: string;
  files: PendingFile[];
}): Promise<{ storage_path: string; filename: string; mime_type: string; size_bytes: number }[]> {
  const { supabase } = await import("@/integrations/supabase/client");
  const out: { storage_path: string; filename: string; mime_type: string; size_bytes: number }[] = [];
  for (const f of args.files) {
    const safeName = f.file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
    const path = `tickets/${args.ticketId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
    const { error } = await supabase.storage
      .from("support-attachments")
      .upload(path, f.file, {
        cacheControl: "3600",
        upsert: false,
        contentType: f.file.type || "application/octet-stream",
      });
    if (error) throw new Error(`${f.file.name}: ${error.message}`);
    out.push({
      storage_path: path,
      filename: f.file.name,
      mime_type: f.file.type || "application/octet-stream",
      size_bytes: f.file.size,
    });
  }
  return out;
}
