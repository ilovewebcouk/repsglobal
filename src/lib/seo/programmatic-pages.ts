// Canonical lists for the /in/$location/$profession programmatic SEO pages.
// Kept separate from the route file so the sitemap can import them without
// pulling the route's UI dependencies.
import { PROFESSIONS } from "@/lib/professions";

// Top UK population centres + major commuter towns. Adding a slug here
// instantly creates one landing page per profession (7 today) and one
// sitemap entry per page. Slugs must be lowercase, hyphenated, and match
// the city catalogue in `src/routes/in.$location.$profession.tsx` when a
// curated display name / region is desired (otherwise the route falls
// back to a Title-Cased version of the slug).
export const PROGRAMMATIC_CITY_SLUGS = [
  // Capitals / nations
  "london",
  "edinburgh",
  "cardiff",
  "belfast",
  // North West
  "manchester",
  "liverpool",
  "preston",
  "blackpool",
  "bolton",
  "warrington",
  "stockport",
  "salford",
  "chester",
  // North East
  "newcastle",
  "sunderland",
  "middlesbrough",
  "durham",
  // Yorkshire & Humber
  "leeds",
  "sheffield",
  "bradford",
  "hull",
  "york",
  "wakefield",
  "huddersfield",
  // West Midlands
  "birmingham",
  "coventry",
  "wolverhampton",
  "stoke-on-trent",
  "solihull",
  // East Midlands
  "nottingham",
  "leicester",
  "derby",
  "northampton",
  // East of England
  "cambridge",
  "norwich",
  "ipswich",
  "luton",
  "peterborough",
  "chelmsford",
  // South East
  "brighton",
  "oxford",
  "reading",
  "milton-keynes",
  "southampton",
  "portsmouth",
  "guildford",
  "tunbridge-wells",
  "canterbury",
  "maidstone",
  "basingstoke",
  "crawley",
  "watford",
  "woking",
  "slough",
  // South West
  "bristol",
  "bath",
  "plymouth",
  "exeter",
  "bournemouth",
  "swindon",
  "gloucester",
  "cheltenham",
  // London commuter / Greater London hubs
  "croydon",
  "kingston-upon-thames",
  "richmond",
  "wimbledon",
  "islington",
  "hackney",
  "shoreditch",
  "clapham",
  "fulham",
  "chelsea",
  "canary-wharf",
  // Scotland
  "glasgow",
  "aberdeen",
  "dundee",
  "stirling",
  "inverness",
  // Wales
  "swansea",
  "newport",
  "wrexham",
  // Northern Ireland
  "londonderry",
  "lisburn",
] as const;

export const PROGRAMMATIC_PROFESSION_SLUGS = PROFESSIONS.map((p) => p.slug);
