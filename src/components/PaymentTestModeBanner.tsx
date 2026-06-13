const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="w-full border-b border-reps-red/40 bg-reps-red/12 px-4 py-2 text-center text-[13px] text-white/85">
        Production checkout is not configured. Complete Stripe go-live in Lovable to accept live payments.
      </div>
    );
  }

  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="w-full border-b border-reps-orange-border bg-reps-orange-soft px-4 py-2 text-center text-[13px] text-white/85">
        All payments in preview are in test mode.
      </div>
    );
  }

  return null;
}