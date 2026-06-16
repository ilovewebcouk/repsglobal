import { useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { X, Eye } from 'lucide-react';
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
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  if (!data?.active) return null;

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-reps-orange px-4 py-2.5 text-[12.5px] font-medium text-white sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-2.5">
        <Eye className="h-4 w-4 shrink-0" />
        <span className="truncate">
          Viewing as <strong className="font-semibold">{data.name}</strong>
          <span className="opacity-80"> · started {fmtTime(data.startedAt)} · expires {fmtTime(data.endsAt)}</span>
        </span>
      </div>
      <button
        type="button"
        onClick={async () => {
          await stopFn();
          await qc.invalidateQueries();
          navigate({ to: '/admin/professionals' });
        }}
        className="flex h-7 items-center gap-1.5 rounded-[8px] bg-white/15 px-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-white/25"
      >
        <X className="h-3.5 w-3.5" /> Exit view
      </button>
    </div>
  );
}
