import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Star, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  getReviewRequestByToken,
  submitReviewByToken,
} from "@/lib/reviews/reviews.functions";

export const Route = createFileRoute("/r/$token")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Leave a review — REPS" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ReviewByTokenPage,
});

function ReviewByTokenPage() {
  const { token } = Route.useParams();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["review-request", token],
    queryFn: () => getReviewRequestByToken({ data: { token } }),
    staleTime: 60_000,
  });

  const [rating, setRating] = React.useState(0);
  const [hover, setHover] = React.useState(0);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [name, setName] = React.useState("");

  React.useEffect(() => {
    if (data?.found && data.client_name && !name) setName(data.client_name);
  }, [data, name]);

  const submit = useMutation({
    mutationFn: () =>
      submitReviewByToken({
        data: {
          token,
          rating,
          title: title.trim() || undefined,
          body: body.trim(),
          client_name: name.trim(),
        },
      }),
    onSuccess: () => toast.success("Thanks — your review has been received"),
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Couldn't submit review"),
  });

  if (isLoading) {
    return (
      <Shell>
        <p className="text-[14px] text-reps-muted-light">Loading…</p>
      </Shell>
    );
  }

  if (isError || !data?.found) {
    return (
      <Shell>
        <h1 className="font-display text-[26px] font-bold text-reps-charcoal">
          This review link isn't valid
        </h1>
        <p className="mt-3 text-[14px] text-reps-muted-light">
          The link may have expired or already been used. If you think
          something's wrong, please reply to the email you received.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex h-10 items-center rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white hover:bg-reps-orange-dark"
        >
          Back to REPS
        </Link>
      </Shell>
    );
  }

  const expired = new Date(data.expires_at).getTime() < Date.now();

  if (data.status === "submitted") {
    return (
      <Shell>
        <h1 className="font-display text-[26px] font-bold text-reps-charcoal">
          You've already left a review
        </h1>
        <p className="mt-3 text-[14px] text-reps-muted-light">
          Thanks again — your review for {data.professional_name} is published.
        </p>
        {data.professional_slug && (
          <Link
            to="/c/$slug"
            params={{ slug: data.professional_slug }}
            className="mt-6 inline-flex h-10 items-center rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white hover:bg-reps-orange-dark"
          >
            View profile
          </Link>
        )}
      </Shell>
    );
  }

  if (expired) {
    return (
      <Shell>
        <h1 className="font-display text-[26px] font-bold text-reps-charcoal">
          This link has expired
        </h1>
        <p className="mt-3 text-[14px] text-reps-muted-light">
          Review links are valid for 90 days. Ask {data.professional_name} to
          send a new one.
        </p>
      </Shell>
    );
  }

  if (submit.isSuccess) {
    return (
      <Shell>
        <div className="flex items-center gap-2 text-emerald-700">
          <ShieldCheck className="h-5 w-5" />
          <span className="text-[12px] font-semibold uppercase tracking-wider">
            Received
          </span>
        </div>
        <h1 className="mt-3 font-display text-[26px] font-bold text-reps-charcoal">
          Thanks for your review
        </h1>
        <p className="mt-3 text-[14px] text-reps-muted-light">
          Your review for <strong>{data.professional_name}</strong> has been
          received. Every review on REPS is checked by our team before it
          appears on the public profile — usually within 24 hours.
        </p>
        {data.professional_slug && (
          <Link
            to="/c/$slug"
            params={{ slug: data.professional_slug }}
            className="mt-6 inline-flex h-10 items-center rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white hover:bg-reps-orange-dark"
          >
            View {data.professional_name}'s profile
          </Link>
        )}
      </Shell>
    );
  }

  const canSubmit =
    rating > 0 && body.trim().length >= 20 && name.trim().length >= 2;

  return (
    <Shell>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-reps-orange">
        REPS review
      </p>
      <h1 className="mt-2 font-display text-[28px] font-bold leading-tight text-reps-charcoal">
        Leave a review for {data.professional_name}
      </h1>
      {data.service_label && (
        <p className="mt-1 text-[13px] text-reps-muted-light">
          About: <span className="font-semibold">{data.service_label}</span>
        </p>
      )}

      <form
        className="mt-6 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit && !submit.isPending) submit.mutate();
        }}
      >
        <div>
          <Label className="text-[12px] font-semibold text-reps-charcoal">
            Overall rating
          </Label>
          <div className="mt-2 flex gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                className="rounded-md p-1"
                aria-label={`${n} star${n === 1 ? "" : "s"}`}
              >
                <Star
                  className={`h-8 w-8 ${
                    n <= (hover || rating)
                      ? "fill-reps-orange text-reps-orange"
                      : "text-reps-stone"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="name" className="text-[12px] font-semibold text-reps-charcoal">
            Your name
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            className="mt-1.5"
            placeholder="Jane Smith"
            required
          />
        </div>

        <div>
          <Label htmlFor="title" className="text-[12px] font-semibold text-reps-charcoal">
            Headline <span className="text-reps-muted-light">(optional)</span>
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            className="mt-1.5"
            placeholder="A quick summary of your experience"
          />
        </div>

        <div>
          <Label htmlFor="body" className="text-[12px] font-semibold text-reps-charcoal">
            Your review
          </Label>
          <Textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            minLength={20}
            maxLength={2000}
            className="mt-1.5"
            placeholder="Tell other clients what made working with this professional valuable. Minimum 20 characters."
            required
          />
          <p className="mt-1 text-[11px] text-reps-muted-light">
            {body.trim().length}/2000 — checked by REPS before it appears on the profile.
          </p>
        </div>

        <Button
          type="submit"
          disabled={!canSubmit || submit.isPending}
          className="h-11 w-full rounded-[10px] bg-reps-orange text-[14px] font-semibold text-white hover:bg-reps-orange-dark disabled:opacity-50"
        >
          {submit.isPending ? "Publishing…" : "Publish review"}
        </Button>
      </form>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-reps-warm-white py-12">
      <div className="mx-auto w-full max-w-[600px] px-5">
        <Link to="/" className="text-[12px] font-semibold uppercase tracking-[0.2em] text-reps-orange">
          REPS
        </Link>
        <div className="mt-6 rounded-[22px] border border-reps-stone bg-white p-8 shadow-sm">
          {children}
        </div>
      </div>
    </main>
  );
}
