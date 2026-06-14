import { useEffect, useState } from "react";
import { getStripeEnvironment } from "@/lib/billing/stripe-client";

export function PaymentTestModeBanner() {
  // Render nothing on SSR + first client paint to avoid hydration mismatch,
  // then reveal the banner only on sandbox hosts after mount.
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(getStripeEnvironment() === "sandbox");
  }, []);

  if (!show) return null;

  return (
    <div className="w-full border-b border-reps-orange-border bg-reps-orange-soft px-4 py-2 text-center text-[13px] text-white/85">
      All payments in preview are in test mode.
    </div>
  );
}
