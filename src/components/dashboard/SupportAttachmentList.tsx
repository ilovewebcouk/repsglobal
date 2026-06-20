import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { Paperclip, FileText, Image as ImageIcon, Download } from "lucide-react";
import { toast } from "sonner";
import { getMyAttachmentUrl, type MyTicketAttachment } from "@/lib/support/my-tickets.functions";

function fmtBytes(n: number | null) {
  if (n == null) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function SupportAttachmentList({
  attachments,
}: {
  attachments: MyTicketAttachment[];
}) {
  const getUrl = useServerFn(getMyAttachmentUrl);

  if (!attachments.length) return null;

  const open = async (path: string) => {
    try {
      const { url } = await getUrl({ data: { storage_path: path } });
      window.open(url, "_blank", "noopener");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open file");
    }
  };

  return (
    <div className="mt-3 flex flex-wrap gap-1.5 border-t border-reps-border/40 pt-3">
      {attachments.map((a) => {
        const isImage = a.mime_type?.startsWith("image/");
        const Icon = isImage ? ImageIcon : a.mime_type ? FileText : Paperclip;
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => void open(a.storage_path)}
            className="group flex items-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel-soft/60 px-2.5 py-1.5 text-left transition hover:border-reps-orange/40 hover:bg-reps-panel-soft"
          >
            <Icon className="h-3.5 w-3.5 text-white/55 group-hover:text-reps-orange" />
            <span className="max-w-[200px] truncate text-[12px] text-white/85">
              {a.filename}
            </span>
            {a.size_bytes != null && (
              <span className="text-[10.5px] text-white/40">{fmtBytes(a.size_bytes)}</span>
            )}
            <Download className="h-3 w-3 text-white/30 group-hover:text-reps-orange" />
          </button>
        );
      })}
    </div>
  );
}
