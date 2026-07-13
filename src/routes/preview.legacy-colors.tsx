import { createFileRoute } from "@tanstack/react-router";
import { HomeV2 } from "./index";
import { heroAvatarsQueryOptions } from "@/lib/directory/hero.functions";

export const Route = createFileRoute("/preview/legacy-colors")({
  head: () => ({
    meta: [
      { title: "Legacy palette preview — REPS" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(heroAvatarsQueryOptions);
  },
  component: LegacyColorsPreview,
});

function LegacyColorsPreview() {
  return (
    <div data-palette="legacy-reps">
      <HomeV2 />
    </div>
  );
}
