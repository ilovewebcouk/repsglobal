import { createFileRoute } from "@tanstack/react-router";

import { FeatureGroupLayout } from "@/components/features/FeatureGroupLayout";
import { BookingsMockup } from "@/components/mockups/PlatformMockups";

export const Route = createFileRoute("/features/operations")({
  head: () => ({
    meta: [
      { title: "Operations — Run your practice in one place · REPs" },
      {
        name: "description",
        content:
          "Bookings, payments, leads, CRM and messaging — replaces Calendly, Stripe, Mailchimp and a CRM with one tool built for fitness.",
      },
      { property: "og:title", content: "Operations — REPs for Professionals" },
      {
        property: "og:description",
        content: "The operating system for a modern coaching practice.",
      },
      { property: "og:url", content: "https://repsglobal.lovable.app/features/operations" },
    ],
    links: [{ rel: "canonical", href: "https://repsglobal.lovable.app/features/operations" }],
  }),
  component: () => <FeatureGroupLayout groupKey="operations" visual={<BookingsMockup />} />,
});
