// Drop-in replacement for requireSupabaseAuth that ALSO honours an active
// admin impersonation session. If the real user is an admin AND has an
// active row in admin_impersonation_sessions whose ends_at is in the
// future, this middleware swaps:
//
//   - context.userId            → professional being impersonated
//   - context.supabase          → service-role client (bypasses RLS so the
//                                 admin sees the trainer's data without
//                                 having to extend every table's RLS)
//   - context.isImpersonating   → true
//   - context.realUserId        → the real admin's auth uid (for audit)
//
// Impersonation is keyed off the admin's user id only — no client cookie is
// involved (the previous cookie approach didn't survive the server-fn RPC
// response in this stack). startImpersonation enforces one active session
// per admin, so admin_id + ended_at IS NULL uniquely identifies the row.
import { createMiddleware } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

export const requireSupabaseAuthWithImpersonation = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
      throw new Error('Missing Supabase environment variables');
    }

    const request = getRequest();
    if (!request?.headers) throw new Error('Unauthorized: No request headers available');
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) throw new Error('Unauthorized: Missing bearer token');
    const token = authHeader.slice('Bearer '.length);
    if (!token) throw new Error('Unauthorized: No token provided');

    const userSupabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await userSupabase.auth.getClaims(token);
    if (error || !data?.claims?.sub) throw new Error('Unauthorized: Invalid token');

    const realUserId = data.claims.sub as string;

    // Re-verify admin role from DB on every call (cookie / client claim alone
    // never grants impersonation).
    const { data: isAdmin } = await userSupabase.rpc('has_role', {
      _user_id: realUserId,
      _role: 'admin' as never,
    });
    if (!isAdmin) {
      return next({
        context: {
          supabase: userSupabase,
          userId: realUserId,
          realUserId,
          isImpersonating: false as boolean,
          claims: data.claims,
        },
      });
    }

    // Admin: look up an active impersonation session keyed off admin_id.
    const { supabaseAdmin } = await import('./client.server');
    const { data: session } = await supabaseAdmin
      .from('admin_impersonation_sessions')
      .select('professional_id, ends_at, ended_at')
      .eq('admin_id', realUserId)
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!session || new Date(session.ends_at).getTime() < Date.now()) {
      // No live session — behave as the real admin (no swap).
      return next({
        context: {
          supabase: userSupabase,
          userId: realUserId,
          realUserId,
          isImpersonating: false as boolean,
          claims: data.claims,
        },
      });
    }

    return next({
      context: {
        // Service-role client lets the admin read/write the trainer's data
        // without an RLS overhaul. Every privileged read is gated by this
        // middleware re-verifying admin role on every request.
        supabase: supabaseAdmin as unknown as typeof userSupabase,
        userId: session.professional_id,
        realUserId,
        isImpersonating: true as boolean,
        claims: data.claims,
      },
    });
  },
);
