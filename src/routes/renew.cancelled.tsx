// Cancellation landing for renewal flow.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/renew/cancelled")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Renewal cancelled — REPS" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: () => (
    <div className="min-h-screen bg-reps-bg text-white flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-[18px] border border-reps-border bg-reps-panel/40 p-8 text-center">
        <h1 className="font-display text-[28px] mb-3">No worries</h1>
        <p className="text-sm text-white/70 mb-4">
          Your renewal was cancelled and you weren't charged. You can come back
          to your renewal link any time before it expires.
        </p>
        <a href="/" className="text-sm text-reps-accent underline">Back to repsuk.org</a>
      </div>
    </div>
  ),
});
