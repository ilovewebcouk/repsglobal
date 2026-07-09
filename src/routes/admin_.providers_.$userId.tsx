import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import * as React from "react";
import { ExternalLink, CheckCircle2, ArrowLeft } from "lucide-react";

import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { getProvider } from "@/lib/admin/providers.functions";
import { ProviderProfileTab } from "@/components/admin/providers/ProviderProfileTab";
import { ProviderVerificationTab } from "@/components/admin/providers/ProviderVerificationTab";
import { ProviderNameHistoryTab } from "@/components/admin/providers/ProviderNameHistoryTab";
import { ProviderBillingTab } from "@/components/admin/providers/ProviderBillingTab";
import { ProviderActivityTab } from "@/components/admin/providers/ProviderActivityTab";
import { ProviderDangerTab } from "@/components/admin/providers/ProviderDangerTab";

export const Route = createFileRoute("/admin_/providers_/$userId")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  head: () => ({
    meta: [
      { name: "robots", content: "noindex,nofollow" },
      { title: "Provider 360 — REPS Admin" },
    ],
  }),
  component: ProviderPage,
});

function ProviderPage() {
  const { userId } = Route.useParams();
  const navigate = useNavigate();
  const fetchProvider = useServerFn(getProvider);

  const snap = useQuery({
    queryKey: ["admin-provider-360", userId],
    queryFn: () => fetchProvider({ data: { user_id: userId } }),
  });

  if (snap.isLoading) {
    return (
      <DashboardShell role="admin" active="Providers" title="Provider 360" subtitle="Loading…">

        <div className="flex flex-col gap-6 p-6">
          <Skeleton className="h-24 w-full bg-reps-panel/60" />
          <Skeleton className="h-96 w-full bg-reps-panel/60" />
        </div>
      </DashboardShell>
    );
  }

  if (!snap.data) {
    return (
      <DashboardShell role="admin" active="Providers" title="Provider 360" subtitle="Not found">
        <div className="flex flex-col items-start gap-4 p-6">
          <Button
            variant="outline"
            onClick={() => navigate({ to: "/admin/providers" })}
            className="rounded-[10px] border-reps-border"
          >
            <ArrowLeft data-icon="inline-start" /> Back to providers
          </Button>
          <div className="rounded-[18px] border border-reps-border bg-reps-panel/40 p-8 text-center">
            <h2 className="mb-2 text-lg font-semibold text-white">Provider not found</h2>
            <p className="text-white/60">
              This user id does not exist, or the account is not a training provider.
              Individual professionals live under{" "}
              <Link to="/admin/members" className="text-reps-orange hover:underline">
                Members
              </Link>
              .
            </p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  const snapshot = snap.data;

  return (
    <DashboardShell role="admin" active="Providers" title="Provider 360" subtitle="One workbench for every provider action.">
      <div className="flex flex-col gap-6 p-6">
        <Header userId={userId} snapshot={snapshot} />

        <Tabs defaultValue="profile" className="flex flex-col gap-5">
          <div className="sticky top-[112px] z-10 -mx-6 border-b border-reps-border bg-reps-ink/85 px-6 py-2 backdrop-blur-md">
            <TabsList className="flex h-10 w-full flex-wrap justify-start gap-1 rounded-[12px] border border-reps-border bg-reps-panel/40 p-1">
              {[
                { v: "profile", l: "Profile" },
                { v: "verification", l: "Verification" },
                { v: "names", l: "Names & domains" },
                { v: "billing", l: "Billing" },
                { v: "activity", l: "Activity" },
                { v: "danger", l: "Danger" },
              ].map(({ v, l }) => (
                <TabsTrigger
                  key={v}
                  value={v}
                  className="h-8 rounded-[10px] px-3 text-[13px] font-medium text-white/65 data-[state=active]:bg-reps-panel-soft data-[state=active]:text-white"
                >
                  {l}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="profile">
            <ProviderProfileTab userId={userId} snapshot={snapshot} />
          </TabsContent>
          <TabsContent value="verification">
            <ProviderVerificationTab userId={userId} />
          </TabsContent>
          <TabsContent value="names">
            <ProviderNameHistoryTab userId={userId} />
          </TabsContent>
          <TabsContent value="billing">
            <ProviderBillingTab userId={userId} />
          </TabsContent>
          <TabsContent value="activity">
            <ProviderActivityTab userId={userId} />
          </TabsContent>
          <TabsContent value="danger">
            <ProviderDangerTab userId={userId} snapshot={snapshot} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}

function Header({
  userId,
  snapshot,
}: {
  userId: string;
  snapshot: NonNullable<Awaited<ReturnType<typeof getProvider>>>;
}) {
  const { business_name, email, avatar_url, professional } = snapshot;
  const slug = professional.slug as string | null;
  const verified = professional.verification_status === "verified";
  const isPublished = professional.is_published as boolean;
  const suspended = professional.suspended_at != null;
  const memberId = professional.reps_member_id as string | null;
  const createdAt = professional.created_at as string | null;
  const publicHref = slug ? `/t/${slug}` : null;
  const initials = (business_name ?? email ?? "?").slice(0, 2).toUpperCase();

  return (
    <div className="sticky top-0 z-20 -mx-6 border-b border-reps-border bg-reps-ink/85 px-6 py-4 backdrop-blur-md shadow-[0_8px_24px_-12px_rgba(0,0,0,0.55)]">
      <div className="flex flex-wrap items-center gap-4">
        <Avatar className="size-14 ring-1 ring-reps-border">
          {avatar_url && <AvatarImage src={avatar_url} alt={business_name ?? "Provider"} />}
          <AvatarFallback className="bg-reps-orange/15 text-base font-semibold text-reps-orange">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <h2 className="truncate text-lg font-semibold text-white">
              {business_name ?? "Unnamed provider"}
            </h2>
            <span className="truncate font-mono text-[12px] text-white/45">/t/{slug ?? "—"}</span>
          </div>
          <div className="truncate text-[13px] text-white/45">
            {email ?? "no email on file"}
            {memberId ? <span className="ml-2 font-mono text-white/40">· {memberId}</span> : null}
            {createdAt ? (
              <span className="ml-2 text-white/40">
                · Member since {new Date(createdAt).toLocaleDateString("en-GB")}
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {verified ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                <CheckCircle2 className="h-3 w-3" /> Verified
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-reps-border bg-reps-panel/60 px-2 py-0.5 text-[11px] font-semibold text-white/65">
                Unverified
              </span>
            )}
            {suspended ? (
              <span className="inline-flex items-center rounded-full border border-red-400/30 bg-red-500/15 px-2 py-0.5 text-[11px] font-semibold text-red-300">
                Suspended
              </span>
            ) : isPublished ? (
              <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                Published
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-reps-border bg-reps-panel/60 px-2 py-0.5 text-[11px] font-semibold text-white/65">
                Hidden
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {publicHref && (
            <Button asChild size="sm" className="h-9 rounded-[10px] bg-reps-orange text-white hover:bg-reps-orange-hover">
              <a href={publicHref} target="_blank" rel="noreferrer">
                <ExternalLink data-icon="inline-start" /> View public page
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
