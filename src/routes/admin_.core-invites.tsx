import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { requireRole } from "@/lib/route-gates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import {
  verifyStripeCustomer,
  createCoreInvite,
  sendCoreInvite,
  resendCoreInvite,
  revokeCoreInvite,
  listCoreInvites,
  previewCoreInvite,
} from "@/lib/admin/core-invites.functions";

export const Route = createFileRoute("/admin_/core-invites")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  head: () => ({
    meta: [
      { title: "Core invites — REPS Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: CoreInvitesPage,
});

type Invite = Awaited<ReturnType<typeof listCoreInvites>>[number];
type VerifyResult = Awaited<ReturnType<typeof verifyStripeCustomer>>;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

function statusBadge(status: Invite["status"]) {
  const map: Record<Invite["status"], { label: string; cls: string }> = {
    draft:   { label: "Draft",   cls: "bg-white/10 text-white/70 border-white/15" },
    sent:    { label: "Sent",    cls: "bg-white/10 text-white border-white/20" },
    claimed: { label: "Claimed", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30" },
    revoked: { label: "Revoked", cls: "bg-white/5 text-white/40 border-white/10" },
    expired: { label: "Expired", cls: "bg-white/5 text-white/40 border-white/10" },
  };
  const s = map[status];
  return <Badge variant="outline" className={s.cls}>{s.label}</Badge>;
}

function CoreInvitesPage() {
  const list = useServerFn(listCoreInvites);
  const send = useServerFn(sendCoreInvite);
  const resend = useServerFn(resendCoreInvite);
  const revoke = useServerFn(revokeCoreInvite);
  const preview = useServerFn(previewCoreInvite);

  const [rows, setRows] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [previewState, setPreviewState] = useState<
    | { open: false }
    | { open: true; loading: true; inviteId: string }
    | { open: true; loading: false; inviteId: string; subject: string; recipientEmail: string; html: string; canSend: boolean }
  >({ open: false });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await list();
      setRows(data as Invite[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [list]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function onSend(id: string) {
    try { await send({ data: { id } }); toast.success("Invite sent"); await refresh(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Send failed"); }
  }
  async function onResend(id: string) {
    try { await resend({ data: { id } }); toast.success("Invite resent"); await refresh(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Resend failed"); }
  }
  async function onRevoke(id: string) {
    if (!confirm("Revoke this invite? The trainer can't use the link after this.")) return;
    try { await revoke({ data: { id } }); toast.success("Revoked"); await refresh(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Revoke failed"); }
  }

  return (
    <main className="min-h-screen bg-reps-ink text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">


      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Core invites</h1>
          <p className="text-sm text-white/60 max-w-2xl">
            Manually onboard a trainer onto Core (£34/yr) whose Stripe customer already exists.
            Draft → verify → send. First charge lands on the anniversary of their last payment.
          </p>
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button className="bg-reps-orange hover:bg-reps-orange/90 text-white">
              New invite
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-[#0F172A] text-white border-white/10 w-full sm:max-w-md overflow-y-auto">
            <NewInviteForm
              onCreated={async () => {
                setSheetOpen(false);
                await refresh();
              }}
            />
          </SheetContent>
        </Sheet>
      </div>

      <div className="rounded-[16px] border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-white/60 text-left">
            <tr>
              <th className="px-4 py-3 font-normal">Trainer</th>
              <th className="px-4 py-3 font-normal">Stripe customer</th>
              <th className="px-4 py-3 font-normal">Anniversary</th>
              <th className="px-4 py-3 font-normal">Status</th>
              <th className="px-4 py-3 font-normal text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="px-4 py-6 text-white/50">Loading…</td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-white/50">No invites yet.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-white/5">
                <td className="px-4 py-3">
                  <div className="font-medium">{r.full_name ?? "—"}</div>
                  <div className="text-white/50 text-xs">{r.email}</div>
                  {r.slug && <div className="text-white/40 text-xs mt-0.5">/{r.slug}</div>}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-white/70">{r.stripe_customer_id ?? "—"}</td>
                <td className="px-4 py-3 text-white/70">
                  {new Date(r.target_renewal_at).toLocaleDateString("en-GB", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3">{statusBadge(r.status)}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  {r.status === "draft" && (
                    <Button size="sm" onClick={() => onSend(r.id)}>Send</Button>
                  )}
                  {r.status === "sent" && (
                    <Button size="sm" variant="outline" onClick={() => onResend(r.id)}>Resend</Button>
                  )}
                  {(r.status === "draft" || r.status === "sent") && (
                    <Button size="sm" variant="ghost" className="text-white/50 hover:text-white" onClick={() => onRevoke(r.id)}>
                      Revoke
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </main>
  );
}


function NewInviteForm({ onCreated }: { onCreated: () => void | Promise<void> }) {
  const verify = useServerFn(verifyStripeCustomer);
  const create = useServerFn(createCoreInvite);
  const send = useServerFn(sendCoreInvite);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [lastPaidAt, setLastPaidAt] = useState("");
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [verified, setVerified] = useState<VerifyResult | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [sendNow, setSendNow] = useState(false);

  function onNameChange(v: string) {
    setFullName(v);
    if (!slugTouched) setSlug(slugify(v));
  }

  async function onVerify() {
    setVerifyBusy(true);
    setVerified(null);
    setConfirmed(false);
    try {
      const res = await verify({ data: { stripe_customer_id: customerId.trim() } });
      setVerified(res);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setVerifyBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!confirmed) return;
    setSaveBusy(true);
    try {
      const res = await create({
        data: {
          full_name: fullName,
          email: email.trim().toLowerCase(),
          slug: slug.trim().toLowerCase(),
          stripe_customer_id: customerId.trim(),
          last_paid_at: new Date(lastPaidAt).toISOString(),
        },
      });
      if (res.alreadyExists) {
        toast.warning("An open invite already exists for that email — reusing it.");
      } else {
        toast.success("Draft created");
      }
      if (sendNow) {
        try {
          await send({ data: { id: res.id } });
          toast.success("Invite email sent");
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Send failed — draft saved");
        }
      }
      await onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaveBusy(false);
    }
  }

  const canSave = confirmed && fullName && email && slug && customerId && lastPaidAt;

  return (
    <>
      <SheetHeader className="mb-6">
        <SheetTitle className="text-white">New Core invite</SheetTitle>
      </SheetHeader>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label className="text-white/80">Full name</Label>
          <Input
            className="mt-1 bg-white/5 border-white/15 text-white"
            value={fullName}
            onChange={(e) => onNameChange(e.target.value)}
            required
          />
        </div>
        <div>
          <Label className="text-white/80">Email</Label>
          <Input
            type="email"
            className="mt-1 bg-white/5 border-white/15 text-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <Label className="text-white/80">Slug</Label>
          <Input
            className="mt-1 bg-white/5 border-white/15 text-white font-mono text-sm"
            value={slug}
            onChange={(e) => { setSlugTouched(true); setSlug(e.target.value); }}
            required
          />
          <p className="text-xs text-white/40 mt-1">Public URL: /pro/{slug || "…"}</p>
        </div>
        <div>
          <Label className="text-white/80">Stripe customer ID</Label>
          <div className="flex gap-2 mt-1">
            <Input
              className="bg-white/5 border-white/15 text-white font-mono text-sm"
              placeholder="cus_XXXXXXXXXXX"
              value={customerId}
              onChange={(e) => { setCustomerId(e.target.value); setVerified(null); setConfirmed(false); }}
              required
            />
            <Button
              type="button"
              variant="outline"
              onClick={onVerify}
              disabled={verifyBusy || !customerId.trim()}
            >
              {verifyBusy ? "Verifying…" : "Verify"}
            </Button>
          </div>
          {verified && (
            <div className="mt-3 rounded-[12px] border border-white/10 bg-white/5 p-3 text-sm space-y-1">
              <div><span className="text-white/50">Email:</span> <span className="text-white">{verified.email ?? "—"}</span></div>
              <div><span className="text-white/50">Name:</span> <span className="text-white">{verified.name ?? "—"}</span></div>
              <div><span className="text-white/50">Card on file:</span> <span className="text-white">{verified.has_default_payment_method ? "yes" : "no"}</span></div>
              <div><span className="text-white/50">Mode:</span> <span className="text-white">{verified.livemode ? "live" : "sandbox"}</span></div>
              {verified.has_active_subscription && (
                <div className="text-amber-300 text-xs mt-1">
                  ⚠ This customer already has an active subscription ({verified.active_subscription_id}). Creating a new one may double-bill.
                </div>
              )}
              <label className="flex items-center gap-2 mt-2 pt-2 border-t border-white/10">
                <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
                <span className="text-white/80 text-sm">This is the right person.</span>
              </label>
            </div>
          )}
        </div>
        <div>
          <Label className="text-white/80">Last payment date</Label>
          <Input
            type="date"
            className="mt-1 bg-white/5 border-white/15 text-white"
            value={lastPaidAt}
            onChange={(e) => setLastPaidAt(e.target.value)}
            required
          />
          <p className="text-xs text-white/40 mt-1">
            First charge will be one year after this date.
          </p>
        </div>
        <label className="flex items-center gap-2 pt-2">
          <input type="checkbox" checked={sendNow} onChange={(e) => setSendNow(e.target.checked)} />
          <span className="text-white/80 text-sm">Send the email now (otherwise saved as draft)</span>
        </label>
        <Button
          type="submit"
          disabled={!canSave || saveBusy}
          className="w-full bg-reps-orange hover:bg-reps-orange/90 text-white"
        >
          {saveBusy ? "Saving…" : sendNow ? "Save & send" : "Save as draft"}
        </Button>
      </form>
    </>
  );
}
