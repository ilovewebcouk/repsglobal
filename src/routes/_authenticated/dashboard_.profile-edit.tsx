import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, ExternalLink } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RepsWordmark } from "@/components/brand/RepsWordmark";
import {
  getMyProfile,
  saveMyProfile,
  setPublished,
} from "@/lib/profile/profile.functions";

const SPECIALISM_OPTIONS = [
  "Personal training",
  "Strength & conditioning",
  "Group exercise",
  "Online coaching",
  "Nutrition",
  "Yoga",
  "Pilates",
  "Pre/post-natal",
  "Rehab",
  "Mobility",
];

export const Route = createFileRoute("/_authenticated/dashboard_/profile-edit")({
  head: () => ({ meta: [{ title: "Edit your profile — REPS" }] }),
  component: ProfileEditPage,
});

function ProfileEditPage() {
  const qc = useQueryClient();
  const fetchMine = useServerFn(getMyProfile);
  const doSave = useServerFn(saveMyProfile);
  const doPublish = useServerFn(setPublished);

  const profile = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => fetchMine(),
  });

  const [form, setForm] = useState({
    slug: "",
    trading_name: "",
    headline: "",
    bio: "",
    specialisms: [] as string[],
    city: "",
    country: "United Kingdom",
    online_available: true,
    in_person_available: true,
    hourly_rate_pence: "" as string,
  });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile.data) {
      const p = profile.data;
      setForm({
        slug: p.slug ?? "",
        trading_name: p.trading_name ?? "",
        headline: p.headline ?? "",
        bio: p.bio ?? "",
        specialisms: p.specialisms ?? [],
        city: p.city ?? "",
        country: p.country ?? "United Kingdom",
        online_available: p.online_available,
        in_person_available: p.in_person_available,
        hourly_rate_pence:
          p.hourly_rate_pence != null ? String(p.hourly_rate_pence / 100) : "",
      });
    }
  }, [profile.data]);

  const saveMutation = useMutation({
    mutationFn: async () =>
      doSave({
        data: {
          slug: form.slug.trim().toLowerCase(),
          trading_name: form.trading_name.trim(),
          headline: form.headline.trim() || null,
          bio: form.bio.trim() || null,
          specialisms: form.specialisms,
          city: form.city.trim() || null,
          country: form.country.trim() || null,
          online_available: form.online_available,
          in_person_available: form.in_person_available,
          hourly_rate_pence: form.hourly_rate_pence
            ? Math.round(parseFloat(form.hourly_rate_pence) * 100)
            : null,
        },
      }),
    onSuccess: () => {
      setSaved(true);
      setError(null);
      qc.invalidateQueries({ queryKey: ["my-profile"] });
      setTimeout(() => setSaved(false), 2500);
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Save failed"),
  });

  const publishMutation = useMutation({
    mutationFn: async (next: boolean) => doPublish({ data: { is_published: next } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-profile"] }),
  });

  const toggleSpec = (s: string) => {
    setForm((f) => ({
      ...f,
      specialisms: f.specialisms.includes(s)
        ? f.specialisms.filter((x) => x !== s)
        : [...f.specialisms, s],
    }));
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  const isPublished = profile.data?.is_published ?? false;

  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      <header className="border-b border-reps-border/40">
        <div className="mx-auto flex h-[72px] max-w-[1100px] items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3">
            <RepsWordmark className="h-[24px] text-white" />
          </Link>
          <Link to="/dashboard" className="text-sm text-white/60 hover:text-white">
            Back to dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[820px] px-6 py-12">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-[32px] leading-[1.05] text-white">
              Your profile
            </h1>
            <p className="mt-2 text-[14px] text-white/65">
              This is what clients see on your public REPS page.
            </p>
          </div>
          {profile.data?.slug && (
            <Button asChild variant="outline" size="sm">
              <Link to="/pro/$slug" params={{ slug: profile.data.slug }} target="_blank">
                View public page <ExternalLink className="size-3.5" />
              </Link>
            </Button>
          )}
        </div>

        {profile.isLoading ? (
          <div className="flex items-center gap-2 text-white/60">
            <Loader2 className="size-4 animate-spin" /> Loading…
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-6">
            <Card className="rounded-[18px] border-reps-border bg-reps-panel/15">
              <CardContent className="space-y-5 p-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="trading_name">Display name</Label>
                    <Input
                      id="trading_name"
                      value={form.trading_name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, trading_name: e.target.value }))
                      }
                      placeholder="James Wilson"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">Profile handle</Label>
                    <Input
                      id="slug"
                      value={form.slug}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, slug: e.target.value }))
                      }
                      placeholder="james-wilson"
                      required
                    />
                    <p className="mt-1.5 text-[12px] text-white/45">
                      reps.uk/pro/{form.slug || "your-handle"}
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="headline">Headline</Label>
                  <Input
                    id="headline"
                    value={form.headline}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, headline: e.target.value }))
                    }
                    placeholder="Strength coach helping busy professionals get strong in 3 hours/week"
                    maxLength={160}
                  />
                </div>

                <div>
                  <Label htmlFor="bio">About you</Label>
                  <Textarea
                    id="bio"
                    value={form.bio}
                    onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                    rows={6}
                    maxLength={4000}
                    placeholder="A short bio — who you work with, your approach, results."
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[18px] border-reps-border bg-reps-panel/15">
              <CardContent className="space-y-5 p-6">
                <div>
                  <Label>Specialisms</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {SPECIALISM_OPTIONS.map((s) => {
                      const on = form.specialisms.includes(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleSpec(s)}
                          className={`rounded-full border px-3 py-1.5 text-[13px] transition ${
                            on
                              ? "border-reps-orange/60 bg-reps-orange/15 text-reps-orange"
                              : "border-reps-border bg-reps-panel/20 text-white/70 hover:text-white"
                          }`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={form.city}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, city: e.target.value }))
                      }
                      placeholder="London"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={form.country}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, country: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="rate">Hourly rate (£)</Label>
                  <Input
                    id="rate"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    value={form.hourly_rate_pence}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, hourly_rate_pence: e.target.value }))
                    }
                    placeholder="65"
                  />
                </div>

                <div className="flex items-center justify-between rounded-[12px] border border-reps-border bg-reps-panel/10 px-4 py-3">
                  <div>
                    <p className="text-[14px] text-white">Online sessions</p>
                    <p className="text-[12px] text-white/50">Available worldwide</p>
                  </div>
                  <Switch
                    checked={form.online_available}
                    onCheckedChange={(v) =>
                      setForm((f) => ({ ...f, online_available: v }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded-[12px] border border-reps-border bg-reps-panel/10 px-4 py-3">
                  <div>
                    <p className="text-[14px] text-white">In-person sessions</p>
                    <p className="text-[12px] text-white/50">In your city</p>
                  </div>
                  <Switch
                    checked={form.in_person_available}
                    onCheckedChange={(v) =>
                      setForm((f) => ({ ...f, in_person_available: v }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {error && (
              <div className="rounded-[12px] border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Badge
                  className={
                    isPublished
                      ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                      : "border-reps-border bg-reps-panel/20 text-white/60"
                  }
                >
                  {isPublished ? "Live" : "Draft"}
                </Badge>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={publishMutation.isPending || !profile.data?.slug}
                  onClick={() => publishMutation.mutate(!isPublished)}
                >
                  {isPublished ? "Unpublish" : "Publish"}
                </Button>
              </div>
              <div className="flex items-center gap-3">
                {saved && (
                  <span className="text-[13px] text-emerald-300">Saved</span>
                )}
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Saving…
                    </>
                  ) : (
                    <>
                      <Save className="size-4" /> Save profile
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
