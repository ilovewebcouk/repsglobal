import * as React from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { GraduationCap, ShieldCheck, Sparkles, Users } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard, PPanel } from "@/components/dashboard/primitives";
import { useTrainerTier } from "@/lib/dashboard/useTrainerTier";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute(
  "/_authenticated/_professional/dashboard_/provider-website",
)({
  beforeLoad: ({ context }) => {
    const tier = (context as { trainerTier?: string }).trainerTier;
    // Only training providers should reach this editor. Everyone else goes
    // back to their coach website.
    if (tier && tier !== "training_provider") {
      throw redirect({ to: "/dashboard/website" });
    }
  },
  head: () => ({ meta: [{ title: "Provider website — REPS" }] }),
  component: ProviderWebsitePage,
});

function ProviderWebsitePage() {
  const tier = useTrainerTier();

  return (
    <DashboardShell
      role="trainer"
      tier={tier}
      active="Website"
      title="Provider website"
      subtitle="Your public /t/… page — visible on the REPS provider directory."
    >
      <div className="flex flex-col gap-4">
        <PCard>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <Badge className="border-reps-orange-border bg-reps-orange-soft text-reps-orange">
                Training provider plan
              </Badge>
              <Badge className="border-emerald-400/30 bg-emerald-500/15 text-emerald-300">
                Coming soon
              </Badge>
            </div>
            <h2 className="font-display text-[22px] font-bold text-white">
              Build your provider website
            </h2>
            <p className="text-[14px] text-white/70">
              This is where you'll edit the public page prospective learners see
              on the REPS training-provider directory. The full editor is on
              the way — the sections below are placeholders for the shape it
              will take.
            </p>
          </div>
        </PCard>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SectionPanel
            icon={Sparkles}
            title="Basics"
            body="Provider name, tagline, about — the top of your /t/… page."
          />
          <SectionPanel
            icon={ShieldCheck}
            title="Accreditations"
            body="Recognised awarding bodies and Ofqual regulation status."
          />
          <SectionPanel
            icon={GraduationCap}
            title="Courses"
            body="Your qualification catalogue — Level 2/3, CPD, specialisms."
          />
          <SectionPanel
            icon={Users}
            title="Tutors"
            body="The people teaching your courses, with REPS verification."
          />
        </div>
      </div>
    </DashboardShell>
  );
}

function SectionPanel({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <PPanel>
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-reps-border bg-reps-panel-soft text-white/70">
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0">
          <div className="text-[14px] font-semibold text-white">{title}</div>
          <p className="mt-1 text-[13px] text-white/60">{body}</p>
        </div>
      </div>
    </PPanel>
  );
}
