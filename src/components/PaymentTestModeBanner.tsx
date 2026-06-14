import { getStripeEnvironment } from "@/lib/billing/stripe-client";

export function PaymentTestModeBanner() {
  if (typeof window === "undefined") return null;
  if (getStripeEnvironment() === "sandbox") {
    return (
      <div className="w-full border-b border-reps-orange-border bg-reps-orange-soft px-4 py-2 text-center text-[13px] text-white/85">
        All payments in preview are in test mode.
      </div>
    );
  }
  return null;
}
