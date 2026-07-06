import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { BadgeCheck, ExternalLink, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { getPublicProviderByMembershipNumber } from "@/lib/training-providers.functions";

export const Route = createFileRoute("/verify/provider/$membershipId")({
  loader: async ({ params }) => {
    const org = await getPublicProviderByMembershipNumber({
      data: { membership_number: params.membershipId },
    });
    return { org, membershipId: params.membershipId };
  },
  head: ({ params }) => ({
    meta: [
      { title: `Verify REPs provider #${params.membershipId} — REPs` },
      {
        name: "description",
        content:
          "Verify a REPs training provider membership. Every accredited provider has a live public verification page.",
      },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  errorComponent: () => (
    <VerifyShell>
      <VerifyFail id="—" />
    </VerifyShell>
  ),
  notFoundComponent: () => (
    <VerifyShell>
      <VerifyFail id="—" />
    </VerifyShell>
  ),
  component: VerifyProviderPage,
});

function VerifyProviderPage() {
  const { org, membershipId } = Route.useLoaderData();
  return (
    <VerifyShell>
      {org ? <VerifyOk org={org} /> : <VerifyFail id={membershipId} />}
    </VerifyShell>
  );
}

function VerifyShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-reps-bg text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="text-white/70 text-sm hover:text-reps-orange"
          >
            ← REPs Global
          </Link>
          <span className="text-xs uppercase tracking-[0.2em] text-white/50">
            Provider verification
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-16 lg:py-24">{children}</main>
    </div>
  );
}

function VerifyOk({ org }: { org: any }) {
  return (
    <div className="rounded-[22px] border border-emerald-400/25 bg-emerald-500/[0.06] p-8">
      <Badge className="rounded-full border-emerald-400/30 bg-emerald-500/15 text-emerald-300">
        <BadgeCheck className="mr-1 h-3.5 w-3.5" /> Verified · Active
      </Badge>
      <h1 className="mt-4 font-display text-3xl lg:text-4xl text-white">
        {org.name}
      </h1>
      <p className="mt-2 text-white/70">
        This provider is a REPs-accredited training organisation. Their
        membership is active and their website is published on REPs.
      </p>

      <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <Row k="Membership number" v={`#${org.membership_number}`} />
        <Row
          k="Location"
          v={[org.city, org.country].filter(Boolean).join(", ") || "—"}
        />
        <Row
          k="Verified since"
          v={
            org.verified_at
              ? new Date(org.verified_at).toLocaleDateString(undefined, {
                  month: "long",
                  year: "numeric",
                })
              : new Date(org.published_at).toLocaleDateString(undefined, {
                  month: "long",
                  year: "numeric",
                })
          }
        />
        <Row k="Status" v={<span className="capitalize">{org.status}</span>} />
      </dl>

      <Link
        to="/providers/$slug"
        params={{ slug: org.slug }}
        className="mt-8 inline-flex items-center gap-1.5 rounded-[10px] bg-reps-orange px-4 py-2.5 text-white hover:bg-reps-orange-hover"
      >
        View provider page <ExternalLink className="h-4 w-4" />
      </Link>
    </div>
  );
}

function VerifyFail({ id }: { id: string }) {
  return (
    <div className="rounded-[22px] border border-red-400/25 bg-red-500/[0.06] p-8 text-center">
      <XCircle className="mx-auto h-10 w-10 text-red-300" />
      <h1 className="mt-3 font-display text-2xl text-white">
        No active membership found
      </h1>
      <p className="mt-2 text-white/70">
        We couldn't find an active REPs training provider with membership
        number <code className="rounded bg-white/5 px-1.5 py-0.5">{id}</code>.
      </p>
      <p className="mt-4 text-sm text-white/50">
        If you were told this provider is REPs-accredited, ask them for their
        REPs profile URL — every accredited provider has one.
      </p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-white/50">{k}</dt>
      <dd className="mt-0.5 text-white">{v}</dd>
    </div>
  );
}
