import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronRight, MapPin } from "lucide-react";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";
import { getGymBySlug, type GymDetail } from "@/lib/directory/gyms.functions";

export const Route = createFileRoute("/gyms/$slug")({
  loader: async ({ params }): Promise<GymDetail> => {
    const gym = await getGymBySlug({ data: { slug: params.slug } });
    if (!gym) throw notFound();
    return gym;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [] };
    const title = `${loaderData.name}${loaderData.city ? ` — ${loaderData.city}` : ""} | REPs`;
    const description = loaderData.tagline
      ?? `${loaderData.name} — REPs-verified trainers, classes and facilities${loaderData.area ? ` in ${loaderData.area}` : ""}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: GymPlaceholderPage,
  errorComponent: ({ error }) => (
    <div className="min-h-screen bg-reps-ivory text-reps-charcoal">
      <PublicHeader variant="solid" />
      <div className="mx-auto max-w-[860px] px-6 py-20 text-center">
        <h1 className="font-display text-[28px] font-bold">Something went wrong</h1>
        <p className="mt-2 text-reps-muted-light">{error.message}</p>
      </div>
      <PublicFooter />
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen bg-reps-ivory text-reps-charcoal">
      <PublicHeader variant="solid" />
      <div className="mx-auto max-w-[860px] px-6 py-20 text-center">
        <h1 className="font-display text-[28px] font-bold">Gym not found</h1>
        <p className="mt-2 text-reps-muted-light">We couldn't find that gym. Try browsing by city instead.</p>
        <Link to="/find-a-professional" className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-semibold text-reps-orange hover:text-reps-orange-dark">
          Find a professional <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <PublicFooter />
    </div>
  ),
});

function citySlug(city: string | null | undefined): string | null {
  if (!city) return null;
  return city
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || null;
}

function GymPlaceholderPage() {
  const gym = Route.useLoaderData();
  const router = useRouter();
  const cSlug = citySlug(gym.city);
  const knownCitySlugs = new Set(["london", "manchester", "birmingham", "edinburgh"]);
  const canLinkCity = cSlug && knownCitySlugs.has(cSlug);

  return (
    <div className="min-h-screen bg-reps-ivory text-reps-charcoal">
      <PublicHeader variant="solid" />

      <div className="mx-auto max-w-[1320px] px-6 pt-6 lg:px-10">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[12px] text-reps-muted-light">
          <Link to="/" className="hover:text-reps-charcoal">Home</Link>
          <ChevronRight className="h-3 w-3" />
          {canLinkCity ? (
            <>
              <Link to="/in/$location" params={{ location: cSlug! }} className="hover:text-reps-charcoal">
                {gym.city}
              </Link>
              <ChevronRight className="h-3 w-3" />
            </>
          ) : null}
          <span className="font-medium text-reps-charcoal">{gym.name}</span>
        </nav>
      </div>

      <section className="mx-auto max-w-[860px] px-6 py-16 lg:py-24">
        <div className="rounded-[22px] border border-reps-stone bg-reps-warm-white p-8 lg:p-12">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-reps-stone bg-reps-ivory px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-reps-muted-light">
            <MapPin className="h-3 w-3 text-reps-orange" />
            {gym.area ?? gym.city ?? "Gym"}
          </span>
          <h1 className="mt-4 font-display text-[36px] font-bold leading-[1.1] text-reps-charcoal lg:text-[48px]">
            {gym.name}
          </h1>
          {gym.chain_name && gym.chain_name !== gym.name ? (
            <p className="mt-2 text-[15px] text-reps-muted-light">Part of {gym.chain_name}</p>
          ) : null}
          {gym.tagline ? (
            <p className="mt-4 text-[16px] leading-relaxed text-reps-charcoal/85">{gym.tagline}</p>
          ) : null}

          <div className="mt-8 rounded-[16px] border border-dashed border-reps-stone bg-reps-ivory p-5 text-[14px] leading-relaxed text-reps-muted-light">
            <p className="font-semibold text-reps-charcoal">Gym pages are coming soon.</p>
            <p className="mt-1">
              Soon you'll see the REPs-verified trainers who coach here, facilities, classes and ways to enquire — all in one place.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {canLinkCity ? (
              <Link
                to="/in/$location"
                params={{ location: cSlug! }}
                className="inline-flex items-center gap-1.5 rounded-[10px] bg-reps-orange px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-reps-orange-dark"
              >
                Browse pros in {gym.city} <ChevronRight className="h-4 w-4" />
              </Link>
            ) : null}
            <Link
              to="/find-a-professional"
              className="inline-flex items-center gap-1.5 rounded-[10px] border border-reps-stone bg-reps-ivory px-4 py-2.5 text-[14px] font-semibold text-reps-charcoal hover:border-reps-orange hover:text-reps-orange"
            >
              Find a professional <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
