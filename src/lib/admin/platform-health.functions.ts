import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export type CronJobHealth = {
  jobname: string;
  schedule: string;
  active: boolean;
  last_status: string | null;
  last_run: string | null;
};

export type PlatformHealthSnapshot = {
  cron_failures_24h: number;
  cron_jobs: CronJobHealth[];
  queue_transactional: number;
  queue_auth: number;
  dlq_emails_7d: number;
  dlq_webhook_events_7d: number;
  suppressions_7d: number;
  orphan_subscriptions: number;
  stuck_payment_events: number;
  failed_payments_active: number;
  stuck_pending_emails?: number;
  degraded?: boolean;
  error?: string;
};

const FALLBACK_HEALTH: PlatformHealthSnapshot = {
  cron_failures_24h: 0,
  cron_jobs: [],
  queue_transactional: 0,
  queue_auth: 0,
  dlq_emails_7d: 0,
  dlq_webhook_events_7d: 0,
  suppressions_7d: 0,
  orphan_subscriptions: 0,
  stuck_payment_events: 0,
  failed_payments_active: 0,
  stuck_pending_emails: 0,
};

function isStatementTimeout(error: unknown) {
  if (!error) return false;
  const err = error as { code?: string; message?: string; details?: string };
  const message = `${err.message ?? ''} ${err.details ?? ''}`.toLowerCase();
  return err.code === '57014' || message.includes('statement timeout') || message.includes('canceling statement');
}

function degradedHealth(error: unknown): PlatformHealthSnapshot {
  return {
    ...FALLBACK_HEALTH,
    degraded: true,
    error: isStatementTimeout(error)
      ? 'Platform Health timed out while reading database diagnostics. The page is still usable; cron and queue metrics are temporarily degraded.'
      : 'Platform Health could not read database diagnostics. The page is still usable; metrics are temporarily degraded.',
  };
}

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data: isAdmin } = await ctx.supabase.rpc('has_role', {
    _user_id: ctx.userId,
    _role: 'admin' as never,
  });
  if (!isAdmin) throw new Error('Forbidden');
}

export const getPlatformHealth = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PlatformHealthSnapshot> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    try {
      const { data, error } = await supabaseAdmin.rpc('platform_health_snapshot' as never);
      if (error) {
        if (isStatementTimeout(error)) return degradedHealth(error);
        throw error;
      }
      return {
        ...FALLBACK_HEALTH,
        ...(data as unknown as Partial<PlatformHealthSnapshot>),
        cron_jobs: Array.isArray((data as { cron_jobs?: unknown } | null)?.cron_jobs)
          ? (data as unknown as PlatformHealthSnapshot).cron_jobs
          : [],
      };
    } catch (error) {
      if (isStatementTimeout(error)) return degradedHealth(error);
      throw error;
    }
  });

export const sweepOrphanSubscriptions = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ removed: number }> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data, error } = await supabaseAdmin.rpc('sweep_orphan_subscriptions' as never);
    if (error) throw error;
    return { removed: Number(data ?? 0) };
  });
