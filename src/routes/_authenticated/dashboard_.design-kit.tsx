import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Info, Sparkles, Users } from "lucide-react";

import {
  DashboardAlertDialog,
  DashboardAlertDialogAction,
  DashboardAlertDialogCancel,
  DashboardAlertDialogContent,
  DashboardAlertDialogDescription,
  DashboardAlertDialogFooter,
  DashboardAlertDialogHeader,
  DashboardAlertDialogTitle,
  DashboardAlertDialogTrigger,
  DashboardBadge,
  DashboardButton,
  DashboardCard,
  DashboardCardContent,
  DashboardCardDescription,
  DashboardCardFooter,
  DashboardCardHeader,
  DashboardCardTitle,
  DashboardDialog,
  DashboardDialogContent,
  DashboardDialogDescription,
  DashboardDialogFooter,
  DashboardDialogHeader,
  DashboardDialogTitle,
  DashboardDialogTrigger,
  DashboardEmpty,
  DashboardEmptyActions,
  DashboardEmptyDescription,
  DashboardEmptyIcon,
  DashboardEmptyTitle,
  DashboardInput,
  DashboardSelect,
  DashboardSelectContent,
  DashboardSelectItem,
  DashboardSelectTrigger,
  DashboardSelectValue,
  DashboardTextarea,
  DashboardTooltip,
  DashboardTooltipContent,
  DashboardTooltipTrigger,
  toast,
} from "@/components/dashboard/ui";

export const Route = createFileRoute("/_authenticated/dashboard_/design-kit")({
  head: () => ({
    meta: [
      { title: "Dashboard UI kit — REPs" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DesignKitPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-[12px] font-semibold uppercase tracking-wider text-white/45">{title}</h2>
      <div className="rounded-[16px] border border-reps-border bg-reps-panel/40 p-5">{children}</div>
    </section>
  );
}

function DesignKitPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-10 text-white">
      <header className="space-y-2">
        <h1 className="font-display text-[28px] font-semibold text-white">Dashboard UI kit</h1>
        <p className="text-[14px] text-white/70">
          Visual QA surface for every primitive in <code className="text-reps-orange">@/components/dashboard/ui</code>.
        </p>
      </header>

      <Section title="Buttons">
        <div className="flex flex-wrap gap-3">
          <DashboardButton variant="primary">Primary</DashboardButton>
          <DashboardButton variant="ghost">Ghost</DashboardButton>
          <DashboardButton variant="subtle">Subtle</DashboardButton>
          <DashboardButton variant="destructive-ghost">Remove</DashboardButton>
          <DashboardButton variant="link">Inline link</DashboardButton>
          <DashboardButton disabled>Disabled</DashboardButton>
        </div>
      </Section>

      <Section title="Inputs">
        <div className="grid gap-4 sm:grid-cols-2">
          <DashboardInput placeholder="Default input" />
          <DashboardInput placeholder="Disabled" disabled />
          <DashboardInput placeholder="Invalid" aria-invalid />
          <DashboardSelect>
            <DashboardSelectTrigger>
              <DashboardSelectValue placeholder="Pick a tier" />
            </DashboardSelectTrigger>
            <DashboardSelectContent>
              <DashboardSelectItem value="verified">Verified</DashboardSelectItem>
              <DashboardSelectItem value="pro">Pro</DashboardSelectItem>
              <DashboardSelectItem value="studio">Studio</DashboardSelectItem>
            </DashboardSelectContent>
          </DashboardSelect>
          <DashboardTextarea placeholder="Tell us a bit..." className="sm:col-span-2" />
        </div>
      </Section>

      <Section title="Card">
        <DashboardCard>
          <DashboardCardHeader>
            <DashboardCardTitle>Profile completion</DashboardCardTitle>
            <DashboardCardDescription>
              Add a bio and at least one service to publish your profile.
            </DashboardCardDescription>
          </DashboardCardHeader>
          <DashboardCardContent>
            <p className="text-[13px] text-white/65">Two of four steps complete.</p>
          </DashboardCardContent>
          <DashboardCardFooter>
            <DashboardButton variant="primary" size="sm">Continue</DashboardButton>
            <DashboardButton variant="ghost" size="sm">Later</DashboardButton>
          </DashboardCardFooter>
        </DashboardCard>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap gap-2">
          <DashboardBadge>Neutral</DashboardBadge>
          <DashboardBadge variant="orange">Featured</DashboardBadge>
          <DashboardBadge variant="success"><CheckCircle2 /> Verified</DashboardBadge>
          <DashboardBadge variant="warn">Action needed</DashboardBadge>
          <DashboardBadge variant="danger">Expired</DashboardBadge>
        </div>
      </Section>

      <Section title="Empty state">
        <DashboardEmpty>
          <DashboardEmptyIcon><Users /></DashboardEmptyIcon>
          <DashboardEmptyTitle>No clients yet</DashboardEmptyTitle>
          <DashboardEmptyDescription>
            Once enquiries start coming in, you'll see them here.
          </DashboardEmptyDescription>
          <DashboardEmptyActions>
            <DashboardButton variant="primary" size="sm">Share profile</DashboardButton>
          </DashboardEmptyActions>
        </DashboardEmpty>
      </Section>

      <Section title="Tooltip">
        <DashboardTooltip>
          <DashboardTooltipTrigger asChild>
            <DashboardButton variant="ghost">
              <Info /> Hover me
            </DashboardButton>
          </DashboardTooltipTrigger>
          <DashboardTooltipContent>Tooltips use reps-ink and 8px radius.</DashboardTooltipContent>
        </DashboardTooltip>
      </Section>

      <Section title="Dialog">
        <DashboardDialog>
          <DashboardDialogTrigger asChild>
            <DashboardButton variant="primary">Open dialog</DashboardButton>
          </DashboardDialogTrigger>
          <DashboardDialogContent>
            <DashboardDialogHeader>
              <DashboardDialogTitle><Sparkles className="h-4 w-4 text-reps-orange" /> Confirm change</DashboardDialogTitle>
              <DashboardDialogDescription>
                This is the dark-themed dialog. Body text reads at 13px / white-70.
              </DashboardDialogDescription>
            </DashboardDialogHeader>
            <DashboardDialogFooter>
              <DashboardButton variant="ghost">Cancel</DashboardButton>
              <DashboardButton variant="primary">Save</DashboardButton>
            </DashboardDialogFooter>
          </DashboardDialogContent>
        </DashboardDialog>
      </Section>

      <Section title="Alert dialog">
        <DashboardAlertDialog>
          <DashboardAlertDialogTrigger asChild>
            <DashboardButton variant="destructive-ghost">Delete account</DashboardButton>
          </DashboardAlertDialogTrigger>
          <DashboardAlertDialogContent>
            <DashboardAlertDialogHeader>
              <DashboardAlertDialogTitle>Delete account?</DashboardAlertDialogTitle>
              <DashboardAlertDialogDescription>
                This permanently removes your profile and cannot be undone.
              </DashboardAlertDialogDescription>
            </DashboardAlertDialogHeader>
            <DashboardAlertDialogFooter>
              <DashboardAlertDialogCancel>Keep account</DashboardAlertDialogCancel>
              <DashboardAlertDialogAction destructive>Delete</DashboardAlertDialogAction>
            </DashboardAlertDialogFooter>
          </DashboardAlertDialogContent>
        </DashboardAlertDialog>
      </Section>

      <Section title="Toasts">
        <div className="flex flex-wrap gap-2">
          <DashboardButton variant="ghost" onClick={() => toast("Profile saved")}>Default</DashboardButton>
          <DashboardButton variant="ghost" onClick={() => toast.success("Avatar uploaded")}>Success</DashboardButton>
          <DashboardButton variant="ghost" onClick={() => toast.error("Something broke")}>Error</DashboardButton>
          <DashboardButton variant="ghost" onClick={() => toast.warning("Heads up")}>Warning</DashboardButton>
          <DashboardButton
            variant="ghost"
            onClick={() => toast("New enquiry", { description: "From Alex — Mon 10:30am" })}
          >
            With description
          </DashboardButton>
        </div>
      </Section>
    </div>
  );
}
