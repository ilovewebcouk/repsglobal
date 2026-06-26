import { DeepLinkButton } from "@/components/help/DeepLinkButton";
import type { HelpArticle } from "../types";

export const article: HelpArticle = {
  slug: "services-and-locations",
  category: "public-profile",
  title: "Set your services, locations and in-person vs online",
  summary: "What clients filter on when they search the directory.",
  tier: ["verified"],
  lastReviewed: "2026-06-26",
  author: "REPS Team",
  tags: ["services", "locations", "online", "in-person"],
  Body: () => (
    <>
      <p>
        The directory is filtered on three things: <strong>service</strong>,{" "}
        <strong>location</strong> and <strong>format</strong> (in-person or online). Set all
        three carefully — the closer you match real client searches, the more enquiries you'll
        get.
      </p>
      <h2 id="services">Services</h2>
      <p>
        Pick services you can genuinely deliver against a verified qualification. Listing
        services you aren't qualified for is grounds for removal.
      </p>
      <h2 id="locations">Locations</h2>
      <p>
        Add the towns and cities you actually train in — including any home or studio addresses
        where you take clients. If you travel to clients, add the boroughs or postcode districts
        you'll cover.
      </p>
      <h2 id="online">Online</h2>
      <p>
        If you take online clients, tick the Online toggle. Online profiles appear in nationwide
        searches as well as your local areas.
      </p>
      <DeepLinkButton to="/dashboard/profile" label="Edit services & locations" />
    </>
  ),
};
