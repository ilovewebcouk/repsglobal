import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/account/suspended")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Account suspended · REPS" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SuspendedPage,
});

function SuspendedPage() {
  return (
    <div className="min-h-screen bg-reps-bg text-white">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-start justify-center gap-6 px-6 py-16">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
          REPS
        </span>
        <h1 className="font-display text-[30px] leading-[1.15] text-white lg:text-[36px]">
          Your account is suspended
        </h1>
        <p className="text-[15px] leading-[1.6] text-white/70">
          A payment dispute or chargeback has been opened against your REPS
          membership. While it's being investigated, access to your dashboard
          and your public profile is paused.
        </p>
        <p className="text-[15px] leading-[1.6] text-white/70">
          If you believe this is a mistake, or you'd like to withdraw the
          dispute, please contact us and we'll help sort it out.
        </p>
        <div className="mt-2 flex flex-col gap-3">
          <a
            href="mailto:support@repsuk.org"
            className="inline-flex h-11 items-center justify-center rounded-[10px] bg-reps-orange px-5 text-[14px] font-semibold text-black transition hover:bg-reps-orange/90"
          >
            Email support@repsuk.org
          </a>
          <Link
            to="/"
            className="text-[13px] text-white/55 underline underline-offset-4 hover:text-white/80"
          >
            Back to repsuk.org
          </Link>
        </div>
      </div>
    </div>
  );
}
