// Drop-in replacement for requireSupabaseAuth that ALSO honours an admin
// impersonation cookie (`reps_impersonate`). If the real user is a verified
// admin AND has an active impersonation session whose token matches the
// cookie AND has not expired, this middleware swaps:
//
//   - context.userId            → professional being impersonated
//   - context.supabase          → service-role client (bypasses RLS so the
//                                 admin sees the trainer's data without
//                                 having to extend every table's RLS)
//   - context.isImpersonating   → true
//   - context.realUserId        → the real admin's auth uid (for audit)
//
// When NOT impersonating, behaviour is identical to requireSupabaseAuth.
import { createMiddleware } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const COOKIE_NAME = 'reps_impersonate';

function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  const parts = header.split(';');
  for (const part of parts) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

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
    const impersonationToken = readCookie(request.headers.get('cookie'), COOKIE_NAME);

    // Default: no impersonation — behave like requireSupabaseAuth.
    if (!impersonationToken) {
      return next({
        context: {
          supabase: userSupabase,
          userId: realUserId,
          realUserId,
          isImpersonating: false as const,
          claims: data.claims,
        },
      });
    }

    // Re-verify admin role from DB (cookie alone never grants impersonation).
    const { data: isAdmin } = await userSupabase.rpc('has_role', {
      _user_id: realUserId,
      _role: 'admin' as never,
    });
    if (!isAdmin) {
      // Cookie present but caller is not admin — ignore cookie, behave normally.
      return next({
        context: {
          supabase: userSupabase,
          userId: realUserId,
          realUserId,
          isImpersonating: false as const,
          claims: data.claims,
        },
      });
    }

    // Load service-role client and look up the live session row.
    const { supabaseAdmin } = await import('./client.server');
    const { data: session } = await supabaseAdmin
      .from('admin_impersonation_sessions')
      .select('professional_id, ends_at, ended_at')
      .eq('admin_id', realUserId)
      .eq('session_token', impersonationToken)
      .is('ended_at', null)
      .maybeSingle();

    if (!session || new Date(session.ends_at).getTime() < Date.now()) {
      // Expired or missing — behave as the real admin (no swap).
      return next({
        context: {
          supabase: userSupabase,
          userId: realUserId,
          realUserId,
          isImpersonating: false as const,
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
        isImpersonating: true as const,
        claims: data.claims,
      },
    });
  },
);
