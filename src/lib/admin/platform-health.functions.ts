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
  suppressions_7d: number;
  orphan_subscriptions: number;
  stuck_payment_events: number;
  failed_payments_active: number;
};

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
    const { data, error } = await supabaseAdmin.rpc('platform_health_snapshot' as never);
    if (error) throw error;
    return data as unknown as PlatformHealthSnapshot;
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
