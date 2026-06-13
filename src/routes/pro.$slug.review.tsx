import * as React from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Star, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { submitReview } from "@/lib/reviews/reviews.functions";
import { getShopFrontBySlug } from "@/lib/shop-front/shop-front.functions";

export const Route = createFileRoute("/pro/$slug/review")({
  head: () => ({
    meta: [
      { title: "Leave a review — REPS" },
      { name: "description", content: "Share your experience with a REPS-verified professional." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ReviewPage,
});

function ReviewPage() {
  const { slug } = Route.useParams();
  const router = useRouter();

  const { data: shopFront } = useQuery({
    queryKey: ["shop-front", slug],
    queryFn: () => getShopFrontBySlug({ data: { slug } }),
    staleTime: 60_000,
  });

  const [session, setSession] = React.useState<{ email: string; name: string } | null>(null);
  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (u)
        setSession({
          email: u.email ?? "",
          name: (u.user_metadata?.full_name as string) ?? "",
        });
    });
  }, []);

  const [rating, setRating] = React.useState(5);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [clientName, setClientName] = React.useState("");

  React.useEffect(() => {
    if (session && !clientName) setClientName(session.name);
  }, [session, clientName]);

  const mutation = useMutation({
    mutationFn: () =>
      submitReview({
        data: {
          slug,
          rating,
          title: title || null,
          body,
          client_name: clientName,
        },
      }),
    onSuccess: () => {
      toast.success("Thanks — your review has been posted.");
      router.navigate({ to: "/pro/$slug", params: { slug } });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Couldn't submit review");
    },
  });

  const proName = shopFront?.shopFront.full_name ?? "this professional";

  if (!session) {
    return (
      <div className="min-h-screen bg-reps-bg text-white">
        <PublicHeader />
        <main className="mx-auto max-w-[640px] px-5 py-16">
          <div className="rounded-[22px] border border-reps-border bg-reps-panel p-8 text-center">
            <ShieldCheck className="mx-auto size-8 text-reps-orange" />
            <h1 className="mt-3 font-display text-[26px] font-bold">Sign in to leave a review</h1>
            <p className="mt-2 text-[14px] text-white/65">
              Reviews on REPS come from verified accounts only. Sign in or create a free client account to continue.
            </p>
            <div className="mt-6 flex flex-col items-center gap-2">
              <Button asChild className="h-11 rounded-[10px] bg-reps-orange px-6 font-semibold text-white hover:bg-reps-orange-dark">
                <Link to="/auth" search={{ redirect: `/pro/${slug}/review` }}>
                  Sign in to continue
                </Link>
              </Button>
              <Link to="/pro/$slug" params={{ slug }} className="text-[13px] text-white/55 hover:text-white">
                Back to profile
              </Link>
            </div>
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-reps-bg text-white">
      <PublicHeader />
      <main className="mx-auto max-w-[640px] px-5 py-12">
        <Link to="/pro/$slug" params={{ slug }} className="text-[13px] text-white/55 hover:text-white">
          ← Back to profile
        </Link>
        <h1 className="mt-4 font-display text-[32px] font-bold leading-tight">
          Review {proName}
        </h1>
        <p className="mt-2 text-[14px] text-white/65">
          Be honest and specific — other clients use this to choose the right pro.
        </p>

        <form
          className="mt-8 space-y-6 rounded-[22px] border border-reps-border bg-reps-panel p-6"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <div>
            <label className="text-[12px] font-semibold uppercase tracking-wider text-white/55">Rating</label>
            <div className="mt-2 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className="rounded-md p-1 transition-transform hover:scale-110"
                  aria-label={`${n} star${n === 1 ? "" : "s"}`}
                >
                  <Star
                    className={`size-7 ${n <= rating ? "fill-reps-orange text-reps-orange" : "text-white/25"}`}
                  />
                </button>
              ))}
              <Badge variant="outline" className="ml-3 border-reps-border bg-reps-panel-soft text-white/70">
                {rating}/5
              </Badge>
            </div>
          </div>

          <div>
            <label htmlFor="rev-name" className="text-[12px] font-semibold uppercase tracking-wider text-white/55">
              Your name (shown publicly)
            </label>
            <Input
              id="rev-name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
              maxLength={120}
              className="mt-2"
            />
          </div>

          <div>
            <label htmlFor="rev-title" className="text-[12px] font-semibold uppercase tracking-wider text-white/55">
              Headline (optional)
            </label>
            <Input
              id="rev-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="e.g. Hit my first 100kg deadlift"
              className="mt-2"
            />
          </div>

          <div>
            <label htmlFor="rev-body" className="text-[12px] font-semibold uppercase tracking-wider text-white/55">
              Your review
            </label>
            <Textarea
              id="rev-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              minLength={20}
              maxLength={2000}
              rows={6}
              placeholder="What did you work on together? What changed? Would you recommend them?"
              className="mt-2"
            />
            <p className="mt-1 text-[11.5px] text-white/45">{body.length}/2000 characters · minimum 20</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              type="submit"
              disabled={mutation.isPending || body.length < 20 || !clientName}
              className="h-11 rounded-[10px] bg-reps-orange px-6 font-semibold text-white hover:bg-reps-orange-dark"
            >
              {mutation.isPending ? "Posting…" : "Post review"}
            </Button>
            <Link to="/pro/$slug" params={{ slug }} className="text-[13px] text-white/55 hover:text-white">
              Cancel
            </Link>
          </div>
        </form>
      </main>
      <PublicFooter />
    </div>
  );
}
