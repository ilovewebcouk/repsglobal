export type DefaultServiceCard = {
  title: string;
  description: string;
  price_label: string;
  price_unit: "per_session" | "per_month" | "per_week" | "per_block" | "per_hour" | "total" | "from" | "custom";
  mode: "in_person" | "online" | "hybrid";
  sort_order: number;
  is_featured: boolean;
  bullets: string[];
  cta_label: string;
};

export const DEFAULT_SERVICE_CARDS: DefaultServiceCard[] = [
  {
    title: "Online Coaching",
    description: "For people who train themselves but want a coach in their corner.",
    price_label: "£160",
    price_unit: "per_month",
    mode: "online",
    sort_order: 0,
    is_featured: false,
    bullets: [
      "Fully bespoke programme in-app",
      "Weekly written check-in & adjustments",
      "Unlimited messaging (Mon–Fri)",
      "Video form reviews",
      "Quarterly strategy call",
    ],
    cta_label: "Enquire about Online Coaching",
  },
  {
    title: "Hybrid Coaching",
    description: "The full programme — two in-person sessions a month, online the rest.",
    price_label: "£240",
    price_unit: "per_month",
    mode: "hybrid",
    sort_order: 1,
    is_featured: true,
    bullets: [
      "Everything in Online Coaching",
      "2× in-person sessions per month",
      "Movement screen & progress reviews",
      "Body composition tracking",
      "Priority response time",
    ],
    cta_label: "Start with Hybrid",
  },
  {
    title: "1-to-1 In Person",
    description: "Train with me in central London. Programming, coaching and accountability in one room.",
    price_label: "From £75",
    price_unit: "per_session",
    mode: "in_person",
    sort_order: 2,
    is_featured: false,
    bullets: [
      "60-minute sessions at Third Space or BXR",
      "Bespoke programme outside sessions",
      "Nutrition & recovery rails",
      "Direct messaging access",
      "Block discount available (10+ sessions)",
    ],
    cta_label: "Enquire about 1-to-1 In Person",
  },
];

export function defaultServiceForSlot(slot: number): DefaultServiceCard {
  return DEFAULT_SERVICE_CARDS[((slot % DEFAULT_SERVICE_CARDS.length) + DEFAULT_SERVICE_CARDS.length) % DEFAULT_SERVICE_CARDS.length];
}