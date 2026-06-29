import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ExternalLink } from "lucide-react";
import type { Member360Snapshot } from "@/lib/admin/member360.functions";

function fmtMoney(pence: number | null, currency: string | null) {
  if (pence == null) return "—";
  const sym = currency?.toLowerCase() === "gbp" ? "£" : (currency?.toUpperCase() ?? "");
  return `${sym}${(pence / 100).toFixed(2)}`;
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  trialing: "secondary",
  past_due: "destructive",
  unpaid: "destructive",
  canceled: "outline",
  incomplete: "outline",
  incomplete_expired: "outline",
};

export function MemberSnapshotCard({ snapshot }: { snapshot: Member360Snapshot }) {
  const { subscription: sub } = snapshot;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{snapshot.full_name ?? "Unnamed member"}</CardTitle>
            <CardDescription>{snapshot.email ?? "no email on file"}</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {sub ? (
              <Badge variant={STATUS_VARIANT[sub.status] ?? "outline"}>{sub.status}</Badge>
            ) : (
              <Badge variant="outline">no subscription</Badge>
            )}
            {sub?.tier && <Badge variant="secondary">{sub.tier}</Badge>}
            {sub?.cancel_at_period_end && <Badge variant="destructive">cancels at period end</Badge>}
            {sub && !sub.livemode && <Badge variant="outline">test mode</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Field label="Price">{sub ? fmtMoney(sub.unit_amount_pence, sub.currency) : "—"}</Field>
          <Field label="Interval">
            {sub?.interval ? `${sub.interval_count ?? 1} ${sub.interval}` : "—"}
          </Field>
          <Field label="Current period end">{fmtDate(sub?.current_period_end ?? null)}</Field>
          <Field label="Trial end">{fmtDate(sub?.trial_end ?? null)}</Field>
        </div>
        <Separator />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Stripe customer">
            <code className="text-xs">{snapshot.stripe_customer_id ?? "—"}</code>
          </Field>
          <Field label="Stripe subscription">
            <code className="text-xs">{sub?.id ?? "—"}</code>
          </Field>
          <Field label="Price ID">
            <code className="text-xs">{sub?.price_id ?? sub?.price_lookup_key ?? "—"}</code>
          </Field>
        </div>
        {snapshot.stripe_customer_id && (
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <a
                href={`https://dashboard.stripe.com/customers/${snapshot.stripe_customer_id}`}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink data-icon="inline-start" />
                Open customer in Stripe
              </a>
            </Button>
            {sub && (
              <Button asChild size="sm" variant="outline">
                <a
                  href={`https://dashboard.stripe.com/subscriptions/${sub.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink data-icon="inline-start" />
                  Open subscription
                </a>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm">{children}</span>
    </div>
  );
}
