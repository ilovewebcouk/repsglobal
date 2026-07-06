import * as React from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, MailCheck, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getPublicProvider,
  submitProviderReview,
} from "@/lib/training-providers.functions";

export const Route = createFileRoute("/providers/$slug/review")({
  loader: async ({ params }) => {
    const res = await getPublicProvider({ data: { slug: params.slug } });
    if (!res) throw notFound();
    return res;
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `Write a review — ${loaderData.org.name} — REPs`
          : "Write a review — REPs",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  errorComponent: () => (
    <div className="min-h-screen grid place-items-center bg-reps-bg text-white p-8">
      <p className="text-white/70">Something went wrong. Please try again.</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center bg-reps-bg text-white p-8">
      <p className="text-white/70">Provider not found.</p>
    </div>
  ),
  component: WriteReviewPage,
});

function WriteReviewPage() {
  const { org, courses } = Route.useLoaderData();
  const { slug } = Route.useParams();

  const [rating, setRating] = React.useState<number>(5);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [courseId, setCourseId] = React.useState<string>("");
  const [agree, setAgree] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const mut = useMutation({
    mutationFn: () =>
      submitProviderReview({
        data: {
          slug,
          rating,
          title: title || undefined,
          body,
          author_display_name: name,
          author_email: email,
          course_id: courseId || null,
        },
      }),
    onSuccess: () => setSubmitted(true),
    onError: (e: any) => toast.error(e?.message ?? "Could not submit review"),
  });

  if (submitted) {
    return (
      <div className="min-h-screen bg-reps-bg text-white">
        <div className="mx-auto max-w-xl px-4 py-24">
          <div className="rounded-[22px] border border-emerald-400/30 bg-emerald-500/10 p-8 text-center">
            <MailCheck className="mx-auto h-10 w-10 text-emerald-300" />
            <h1 className="mt-4 font-display text-3xl">Check your inbox</h1>
            <p className="mt-3 text-white/70">
              We've sent a confirmation link to <strong>{email}</strong>. Click
              it to publish your review of {org.name}. If you don't see it
              within a few minutes, check spam.
            </p>
            <Link
              to="/providers/$slug"
              params={{ slug }}
              className="mt-6 inline-flex items-center gap-2 text-sm text-white/70 hover:text-reps-orange"
            >
              <ArrowLeft className="h-4 w-4" /> Back to {org.name}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const submitDisabled =
    mut.isPending ||
    !body.trim() ||
    body.trim().length < 40 ||
    !name.trim() ||
    !email.trim() ||
    !agree;

  return (
    <div className="min-h-screen bg-reps-bg text-white">
      <div className="mx-auto max-w-2xl px-4 py-16 lg:py-24">
        <Link
          to="/providers/$slug"
          params={{ slug }}
          className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-reps-orange"
        >
          <ArrowLeft className="h-4 w-4" /> {org.name}
        </Link>
        <h1 className="mt-4 font-display text-4xl">Write a review</h1>
        <p className="mt-2 text-white/60">
          Share your experience learning with {org.name}. Reviews are
          moderated and may require proof of your learning experience.
        </p>

        <form
          className="mt-8 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            mut.mutate();
          }}
        >
          <div>
            <Label>Overall rating</Label>
            <div className="mt-2 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className="p-1"
                  aria-label={`${n} stars`}
                >
                  <Star
                    className={`h-8 w-8 ${
                      n <= rating
                        ? "fill-reps-orange text-reps-orange"
                        : "text-white/25"
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-white/60 text-sm">{rating} / 5</span>
            </div>
          </div>

          {courses.length > 0 && (
            <div>
              <Label>Which course? (optional)</Label>
              <Select value={courseId} onValueChange={(v) => setCourseId(v === "none" ? "" : v)}>
                <SelectTrigger className="rounded-[12px] mt-1">
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— No specific course —</SelectItem>
                  {courses.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="title">Headline (optional)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="Great tutors, hands-on assessment"
              className="rounded-[12px] mt-1"
            />
          </div>

          <div>
            <Label htmlFor="body">Your review</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={7}
              minLength={40}
              maxLength={4000}
              placeholder="What went well? What could be better? Which course did you take and when?"
              className="rounded-[12px] mt-1"
            />
            <div className="mt-1 text-xs text-white/45">
              {body.trim().length} / 40 min · {body.length} / 4000
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Your name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                placeholder="Displayed publicly"
                className="rounded-[12px] mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email">Your email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Not shown publicly"
                className="rounded-[12px] mt-1"
              />
            </div>
          </div>

          <label className="flex gap-2 items-start text-sm text-white/70">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-1"
            />
            <span>
              This is a genuine review based on my own experience. I understand
              REPs may contact me for proof (invoice, certificate, or
              correspondence) and may remove the review if I can't verify it
              or if it breaches the{" "}
              <a href="/legal/reviews-policy" className="underline">reviews policy</a>.
            </span>
          </label>

          <Button
            type="submit"
            disabled={submitDisabled}
            className="w-full rounded-[10px] bg-reps-orange hover:bg-reps-orange-hover text-white shadow-none"
          >
            {mut.isPending ? "Submitting…" : "Submit review"}
          </Button>
        </form>
      </div>
    </div>
  );
}
