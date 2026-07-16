import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { X, Eye, LayoutDashboard } from 'lucide-react';
import {
  getImpersonationStatus,
  stopImpersonation,
} from '@/lib/admin/impersonation.functions';

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function ImpersonationBanner() {
  const fetchStatus = useServerFn(getImpersonationStatus);
  const stopFn = useServerFn(stopImpersonation);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ['impersonation-status'],
    queryFn: () => fetchStatus(),
    // Tight window: banner must disappear promptly at ends_at.
    refetchInterval: 15_000,
    staleTime: 10_000,
    refetchOnWindowFocus: true,
  });

  // Client-clock check so the banner drops the instant local time passes
  // ends_at, without waiting for the next refetch.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!data?.active) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [data?.active]);

  if (!data?.active) return null;
  if (new Date(data.endsAt).getTime() <= now) {
    // Expired locally — evict cached status; server-side is fail-closed too.
    void qc.invalidateQueries({ queryKey: ['impersonation-status'] });
    return null;
  }

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-reps-orange px-4 py-2.5 text-[12.5px] font-medium text-white sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-2.5">
        <Eye className="h-4 w-4 shrink-0" />
        <span className="truncate">
          Viewing as <strong className="font-semibold">{data.name}</strong>
          <span className="opacity-80"> · started {fmtTime(data.startedAt)} · expires {fmtTime(data.endsAt)}</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Link
          to="/dashboard"
          className="flex h-7 items-center gap-1.5 rounded-[8px] bg-white/15 px-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-white/25"
        >
          <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
        </Link>
        <button
          type="button"
          onClick={async () => {
            await stopFn();
            await qc.invalidateQueries();
            navigate({ to: '/admin/members' });
          }}
          className="flex h-7 items-center gap-1.5 rounded-[8px] bg-white/15 px-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-white/25"
        >
          <X className="h-3.5 w-3.5" /> Exit view
        </button>
      </div>
    </div>
  );
}
