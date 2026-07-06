import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";

import { supabase } from "@/integrations/supabase/client";

// Local wrapper for the beta supabase.auth.oauth namespace so TS is happy.
type AuthorizationDetails = {
  client?: { name?: string | null } | null;
  redirect_url?: string | null;
  redirect_to?: string | null;
};

function oauth() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase.auth as any).oauth as {
    getAuthorizationDetails: (
      id: string,
    ) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
    approveAuthorization: (
      id: string,
    ) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
    denyAuthorization: (
      id: string,
    ) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  };
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/auth", search: { next } as never });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) {
      throw redirect({ href: immediate });
    }
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-md p-8 text-white">
      <h1 className="mb-2 font-display text-2xl">Something went wrong</h1>
      <p className="text-sm text-white/70">
        Could not load this authorization request: {String((error as Error)?.message ?? error)}
      </p>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const res = approve
      ? await oauth().approveAuthorization(authorization_id)
      : await oauth().denyAuthorization(authorization_id);
    if (res.error) {
      setBusy(false);
      setError(res.error.message);
      return;
    }
    const target = res.data?.redirect_url ?? res.data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  const name = details?.client?.name ?? "an app";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-8 text-white">
      <div className="rounded-[18px] border border-reps-border bg-reps-panel p-6">
        <h1 className="mb-2 font-display text-2xl">Connect {name} to your REPS account?</h1>
        <p className="mb-6 text-sm text-white/70">
          This will let {name} use REPS tools on your behalf — such as reading your professional
          profile and searching the directory as you. You can disconnect at any time.
        </p>
        {error ? (
          <p role="alert" className="mb-4 rounded-[10px] border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}
        <div className="flex gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => decide(true)}
            className="h-10 flex-1 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white hover:bg-reps-orange-hover disabled:opacity-60"
          >
            {busy ? "Working…" : "Approve"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => decide(false)}
            className="h-10 flex-1 rounded-[10px] border border-reps-border bg-reps-panel-soft px-4 text-[13px] font-semibold text-white/80 hover:text-white disabled:opacity-60"
          >
            Deny
          </button>
        </div>
      </div>
    </main>
  );
}
