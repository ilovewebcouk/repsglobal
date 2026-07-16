/**
 * REPs Training Academy — mock catalogue data.
 *
 * Directory of qualifications and CPD courses that training providers have
 * submitted for REPs endorsement. Card CTAs link OUT to each provider's own
 * course URL. Real provider data is wired later — placeholders live here.
 */

export type AcademyProfession =
  | "pt"
  | "group"
  | "strength"
  | "yoga"
  | "pilates"
  | "nutrition"
  | "online";

export type AcademyLevel = "L2" | "L3" | "L4" | "cpd";

export type AcademyDelivery = "online" | "blended" | "in-person";

export type AcademyProvider = {
  slug: string;
  name: string;
  /** Two-letter initials rendered inside the placeholder logo. */
  logo: string;
  /** Hue (0-360) used to seed the thumbnail-fallback gradient. */
  hue: number;
};

export type AcademyCourse = {
  id: string;
  title: string;
  summary: string;
  provider: AcademyProvider;
  profession: AcademyProfession;
  level: AcademyLevel;
  cpdPoints: number;
  durationLabel: string;
  delivery: AcademyDelivery;
  priceFromGBP: number;
  ofqualRegulated: boolean;
  /** Total modules in the course (provider-supplied). */
  modules: number;
  /** Average rating out of 5, one decimal. */
  rating: number;
  /** Number of learner reviews. */
  ratingCount: number;
  bestseller?: boolean;
  newRelease?: boolean;
  /** External provider course page — always opens in a new tab. */
  url: string;
};

/* -------------------------------------------------------------------------- */
/* Filter option labels                                                       */
/* -------------------------------------------------------------------------- */

export const PROFESSION_LABELS: Record<AcademyProfession, string> = {
  pt: "Personal training",
  group: "Group exercise",
  strength: "Strength & conditioning",
  yoga: "Yoga",
  pilates: "Pilates",
  nutrition: "Nutrition",
  online: "Online coaching",
};

export const LEVEL_LABELS: Record<AcademyLevel, string> = {
  L2: "Level 2",
  L3: "Level 3",
  L4: "Level 4",
  cpd: "CPD short course",
};

export const DELIVERY_LABELS: Record<AcademyDelivery, string> = {
  online: "Online",
  blended: "Blended",
  "in-person": "In-person",
};

/* -------------------------------------------------------------------------- */
/* Providers (placeholder mock data)                                          */
/* -------------------------------------------------------------------------- */

const P = {
  origym: { slug: "origym", name: "Origym", logo: "OG", hue: 22 },
  tfg: { slug: "the-fitness-group", name: "The Fitness Group", logo: "TF", hue: 210 },
  discovery: { slug: "discovery-learning", name: "Discovery Learning", logo: "DL", hue: 158 },
  studyActive: { slug: "study-active", name: "Study Active", logo: "SA", hue: 280 },
  futureFit: { slug: "future-fit", name: "Future Fit", logo: "FF", hue: 340 },
  hfe: { slug: "hfe", name: "HFE", logo: "HF", hue: 190 },
  trainfitness: { slug: "trainfitness", name: "TRAINFITNESS", logo: "TN", hue: 45 },
  premier: { slug: "premier-global", name: "Premier Global", logo: "PG", hue: 260 },
} satisfies Record<string, AcademyProvider>;

export const ACADEMY_PROVIDERS: AcademyProvider[] = Object.values(P);

/* -------------------------------------------------------------------------- */
/* Courses                                                                    */
/* -------------------------------------------------------------------------- */

export const ACADEMY_COURSES: AcademyCourse[] = [
  {
    id: "l2-gym-instructor-origym",
    title: "Level 2 Certificate in Gym Instructing",
    summary:
      "Regulated entry-level qualification to work as a gym instructor in commercial and private facilities.",
    provider: P.origym,
    profession: "pt",
    level: "L2",
    cpdPoints: 20,
    durationLabel: "8–12 weeks",
    delivery: "blended",
    priceFromGBP: 599,
    ofqualRegulated: true,
    modules: 12,
    rating: 4.7,
    ratingCount: 1284,
    bestseller: true,
    url: "https://example.com/origym/level-2-gym-instructor",
  },
  {
    id: "l3-pt-tfg",
    title: "Level 3 Diploma in Personal Training",
    summary:
      "Full L2 + L3 pathway leading to insurable personal trainer status, with programme design and 1:1 delivery.",
    provider: P.tfg,
    profession: "pt",
    level: "L3",
    cpdPoints: 40,
    durationLabel: "16 weeks",
    delivery: "blended",
    priceFromGBP: 1499,
    ofqualRegulated: true,
    modules: 24,
    rating: 4.8,
    ratingCount: 2140,
    bestseller: true,
    url: "https://example.com/the-fitness-group/l3-personal-training",
  },
  {
    id: "l3-pt-premier",
    title: "Level 3 Personal Trainer — Master PT programme",
    summary:
      "Extended PT diploma with nutrition, business and online coaching modules bolted on.",
    provider: P.premier,
    profession: "pt",
    level: "L3",
    cpdPoints: 45,
    durationLabel: "6 months",
    delivery: "blended",
    priceFromGBP: 1799,
    ofqualRegulated: true,
    modules: 32,
    rating: 4.6,
    ratingCount: 987,
    url: "https://example.com/premier-global/master-pt",
  },
  {
    id: "l4-strength-tfg",
    title: "Level 4 Strength & Conditioning",
    summary:
      "Advanced programming for athletic populations. Periodisation, testing, return-to-play.",
    provider: P.tfg,
    profession: "strength",
    level: "L4",
    cpdPoints: 60,
    durationLabel: "20 weeks",
    delivery: "blended",
    priceFromGBP: 1699,
    ofqualRegulated: true,
    modules: 28,
    rating: 4.9,
    ratingCount: 412,
    url: "https://example.com/the-fitness-group/l4-strength-conditioning",
  },
  {
    id: "l4-pre-post-natal-discovery",
    title: "Level 4 Pre & Post-natal Exercise Specialist",
    summary:
      "Specialist qualification to safely coach pregnant and postpartum clients through every trimester and recovery.",
    provider: P.discovery,
    profession: "pt",
    level: "L4",
    cpdPoints: 50,
    durationLabel: "12 weeks",
    delivery: "online",
    priceFromGBP: 899,
    ofqualRegulated: true,
    modules: 18,
    rating: 4.8,
    ratingCount: 623,
    url: "https://example.com/discovery-learning/pre-post-natal",
  },
  {
    id: "l4-lower-back-hfe",
    title: "Level 4 Lower Back Pain Management",
    summary:
      "Screening, corrective exercise and referral pathways for clients presenting with chronic lower back pain.",
    provider: P.hfe,
    profession: "pt",
    level: "L4",
    cpdPoints: 50,
    durationLabel: "10 weeks",
    delivery: "online",
    priceFromGBP: 849,
    ofqualRegulated: true,
    modules: 16,
    rating: 4.7,
    ratingCount: 388,
    url: "https://example.com/hfe/lower-back-pain",
  },
  {
    id: "l3-nutrition-futurefit",
    title: "Level 3 Award in Nutrition for Physical Activity",
    summary:
      "Foundational nutrition qualification for PTs and coaches — energy balance, macros and evidence-based guidance.",
    provider: P.futureFit,
    profession: "nutrition",
    level: "L3",
    cpdPoints: 30,
    durationLabel: "6 weeks",
    delivery: "online",
    priceFromGBP: 349,
    ofqualRegulated: true,
    modules: 10,
    rating: 4.6,
    ratingCount: 1502,
    url: "https://example.com/future-fit/l3-nutrition",
  },
  {
    id: "l4-nutrition-hfe",
    title: "Level 4 Nutrition Coach",
    summary:
      "In-depth nutrition coaching qualification covering body composition, habit change and client consultation.",
    provider: P.hfe,
    profession: "nutrition",
    level: "L4",
    cpdPoints: 55,
    durationLabel: "16 weeks",
    delivery: "online",
    priceFromGBP: 899,
    ofqualRegulated: true,
    modules: 22,
    rating: 4.8,
    ratingCount: 741,
    url: "https://example.com/hfe/l4-nutrition-coach",
  },
  {
    id: "l3-yoga-studyactive",
    title: "Level 3 Diploma in Teaching Yoga",
    summary:
      "200-hour equivalent yoga teacher training — asana, anatomy, sequencing, philosophy and teaching practice.",
    provider: P.studyActive,
    profession: "yoga",
    level: "L3",
    cpdPoints: 200,
    durationLabel: "9 months",
    delivery: "blended",
    priceFromGBP: 1899,
    ofqualRegulated: true,
    modules: 40,
    rating: 4.9,
    ratingCount: 356,
    url: "https://example.com/study-active/yoga-diploma",
  },
  {
    id: "l3-pilates-hfe",
    title: "Level 3 Diploma in Teaching Mat Pilates",
    summary:
      "Comprehensive mat Pilates teaching qualification — repertoire, modifications, class design.",
    provider: P.hfe,
    profession: "pilates",
    level: "L3",
    cpdPoints: 180,
    durationLabel: "6 months",
    delivery: "blended",
    priceFromGBP: 1699,
    ofqualRegulated: true,
    modules: 34,
    rating: 4.8,
    ratingCount: 289,
    url: "https://example.com/hfe/mat-pilates-diploma",
  },
  {
    id: "l2-group-ex-tfg",
    title: "Level 2 Certificate in Group Exercise",
    summary:
      "Insurable group exercise instructor qualification — planning, cueing, adapting and leading mixed classes.",
    provider: P.tfg,
    profession: "group",
    level: "L2",
    cpdPoints: 25,
    durationLabel: "10 weeks",
    delivery: "blended",
    priceFromGBP: 549,
    ofqualRegulated: true,
    modules: 14,
    rating: 4.6,
    ratingCount: 812,
    url: "https://example.com/the-fitness-group/l2-group-exercise",
  },
  {
    id: "cpd-kettlebells-trainfitness",
    title: "Kettlebell Instructor CPD",
    summary:
      "One-day practical — swings, cleans, snatches, get-ups and how to programme kettlebells safely in 1:1 and group sessions.",
    provider: P.trainfitness,
    profession: "strength",
    level: "cpd",
    cpdPoints: 8,
    durationLabel: "1 day",
    delivery: "in-person",
    priceFromGBP: 179,
    ofqualRegulated: false,
    modules: 6,
    rating: 4.7,
    ratingCount: 214,
    url: "https://example.com/trainfitness/kettlebell-cpd",
  },
  {
    id: "cpd-mobility-origym",
    title: "Mobility & Movement Coaching CPD",
    summary:
      "Screening, joint-by-joint mobility drills and warm-up structures you can use with every client from tomorrow.",
    provider: P.origym,
    profession: "pt",
    level: "cpd",
    cpdPoints: 10,
    durationLabel: "Self-paced (~8 hrs)",
    delivery: "online",
    priceFromGBP: 129,
    ofqualRegulated: false,
    modules: 8,
    rating: 4.5,
    ratingCount: 468,
    newRelease: true,
    url: "https://example.com/origym/mobility-cpd",
  },
  {
    id: "cpd-online-coaching-premier",
    title: "Online Coaching Business CPD",
    summary:
      "How to onboard, programme for and retain remote clients — including check-ins, delivery cadence and pricing.",
    provider: P.premier,
    profession: "online",
    level: "cpd",
    cpdPoints: 12,
    durationLabel: "Self-paced (~10 hrs)",
    delivery: "online",
    priceFromGBP: 149,
    ofqualRegulated: false,
    modules: 9,
    rating: 4.6,
    ratingCount: 331,
    bestseller: true,
    url: "https://example.com/premier-global/online-coaching-cpd",
  },
  {
    id: "cpd-boxing-tfg",
    title: "Boxing Circuits Instructor CPD",
    summary:
      "Pad work fundamentals, safety and building a boxing-inspired group class that scales to any level.",
    provider: P.tfg,
    profession: "group",
    level: "cpd",
    cpdPoints: 8,
    durationLabel: "1 day",
    delivery: "in-person",
    priceFromGBP: 169,
    ofqualRegulated: false,
    modules: 5,
    rating: 4.7,
    ratingCount: 156,
    url: "https://example.com/the-fitness-group/boxing-circuits-cpd",
  },
  {
    id: "cpd-yin-yoga-studyactive",
    title: "Yin Yoga CPD",
    summary:
      "20-hour Yin specialisation for qualified yoga teachers — meridian theory, holds, sequencing and props.",
    provider: P.studyActive,
    profession: "yoga",
    level: "cpd",
    cpdPoints: 20,
    durationLabel: "3 weekends",
    delivery: "blended",
    priceFromGBP: 449,
    ofqualRegulated: false,
    modules: 12,
    rating: 4.9,
    ratingCount: 142,
    url: "https://example.com/study-active/yin-yoga-cpd",
  },
  {
    id: "cpd-reformer-hfe",
    title: "Reformer Pilates Instructor CPD",
    summary:
      "Studio Reformer teaching methodology for qualified mat Pilates instructors — repertoire and safe progressions.",
    provider: P.hfe,
    profession: "pilates",
    level: "cpd",
    cpdPoints: 25,
    durationLabel: "5 days",
    delivery: "in-person",
    priceFromGBP: 899,
    ofqualRegulated: false,
    modules: 15,
    rating: 4.8,
    ratingCount: 203,
    url: "https://example.com/hfe/reformer-pilates-cpd",
  },
  {
    id: "cpd-behaviour-change-futurefit",
    title: "Behaviour Change for Coaches CPD",
    summary:
      "Applied habit change frameworks — motivational interviewing, adherence, and long-term client retention.",
    provider: P.futureFit,
    profession: "pt",
    level: "cpd",
    cpdPoints: 15,
    durationLabel: "Self-paced (~12 hrs)",
    delivery: "online",
    priceFromGBP: 189,
    ofqualRegulated: false,
    modules: 10,
    rating: 4.7,
    ratingCount: 512,
    url: "https://example.com/future-fit/behaviour-change-cpd",
  },
  {
    id: "cpd-female-athlete-discovery",
    title: "Female Athlete Programming CPD",
    summary:
      "Cycle-based programming, RED-S awareness and adapting load for female clients across life stages.",
    provider: P.discovery,
    profession: "strength",
    level: "cpd",
    cpdPoints: 12,
    durationLabel: "Self-paced (~10 hrs)",
    delivery: "online",
    priceFromGBP: 169,
    ofqualRegulated: false,
    modules: 8,
    rating: 4.8,
    ratingCount: 267,
    newRelease: true,
    url: "https://example.com/discovery-learning/female-athlete-cpd",
  },
  {
    id: "cpd-older-adults-hfe",
    title: "Exercise for Older Adults CPD",
    summary:
      "Screening, falls prevention and progressive resistance for over-60 clients in group and 1:1 settings.",
    provider: P.hfe,
    profession: "group",
    level: "cpd",
    cpdPoints: 10,
    durationLabel: "Self-paced (~8 hrs)",
    delivery: "online",
    priceFromGBP: 139,
    ofqualRegulated: false,
    modules: 7,
    rating: 4.6,
    ratingCount: 189,
    url: "https://example.com/hfe/older-adults-cpd",
  },
  {
    id: "cpd-nutrition-macros-trainfitness",
    title: "Macros & Meal Planning CPD",
    summary:
      "Practical macro coaching workflow — from consultation to weekly adjustment — inside evidence-based limits.",
    provider: P.trainfitness,
    profession: "nutrition",
    level: "cpd",
    cpdPoints: 8,
    durationLabel: "Self-paced (~6 hrs)",
    delivery: "online",
    priceFromGBP: 119,
    ofqualRegulated: false,
    modules: 6,
    rating: 4.5,
    ratingCount: 421,
    url: "https://example.com/trainfitness/macros-cpd",
  },
  {
    id: "cpd-hyrox-tfg",
    title: "Hybrid Race Prep Coaching CPD",
    summary:
      "Programming for hybrid race clients (Hyrox-style events) — running + functional work in one plan.",
    provider: P.tfg,
    profession: "strength",
    level: "cpd",
    cpdPoints: 10,
    durationLabel: "1 day",
    delivery: "in-person",
    priceFromGBP: 189,
    ofqualRegulated: false,
    modules: 7,
    rating: 4.9,
    ratingCount: 98,
    newRelease: true,
    url: "https://example.com/the-fitness-group/hybrid-race-cpd",
  },
];
