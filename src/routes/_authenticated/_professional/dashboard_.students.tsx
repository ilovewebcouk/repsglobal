/**
 * /dashboard/students — training provider student registrations & certificates.
 *
 * Four sub-views (segmented control):
 *   Learners       — master list of people this provider has added
 *   Registrations  — one row per (learner × course); mark passed, add to basket
 *   Basket         — everything 'passed' & unpaid → Stripe batch checkout
 *   Certificates   — issued certificates, PDF download, verify link
 */

import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BadgeCheck,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  Plus,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard, PPanel } from "@/components/dashboard/primitives";
import { DashboardButton as Button } from "@/components/dashboard/ui/button";
import { DashboardBadge as Badge } from "@/components/dashboard/ui/badge";
import { DashboardInput as Input } from "@/components/dashboard/ui/input";
import {
  DashboardSelect as Select,
  DashboardSelectContent as SelectContent,
  DashboardSelectItem as SelectItem,
  DashboardSelectTrigger as SelectTrigger,
  DashboardSelectValue as SelectValue,
} from "@/components/dashboard/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { getStripeEnvironment } from "@/lib/billing/stripe-client";
import {
  cancelRegistration,
  createCertificateBatchCheckout,
  createLearner,
  createRegistration,
  deleteLearner,
  getCertificatePricing,
  getCertificateSignedUrl,
  listMyApprovedCourses,
  listMyLearners,
  listMyRegistrations,
  markRegistrationsPassed,
  type LearnerDTO,
  type ProviderCourseOptionDTO,
  type RegistrationDTO,
} from "@/lib/certificates/certificates.functions";

export const Route = createFileRoute("/_authenticated/_professional/dashboard_/students")({
  head: () => ({
    meta: [
      { title: "Students & Certificates — REPS Provider" },
      { name: "description", content: "Register learners on your REPS-approved courses and issue verified certificates." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  validateSearch: (raw: Record<string, unknown>) => ({
    checkout: typeof raw.checkout === "string" ? raw.checkout : undefined,
    batch: typeof raw.batch === "string" ? raw.batch : undefined,
    tab: typeof raw.tab === "string" ? (raw.tab as Tab) : undefined,
  }),
  component: StudentsPage,
});

type Tab = "learners" | "registrations" | "basket" | "certificates";

function StudentsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = React.useState<Tab>(search.tab ?? "learners");

  const learnersFn = useServerFn(listMyLearners);
  const regsFn = useServerFn(listMyRegistrations);
  const coursesFn = useServerFn(listMyApprovedCourses);
  const pricingFn = useServerFn(getCertificatePricing);

  const learnersQ = useQuery({ queryKey: ["cert-learners"], queryFn: () => learnersFn() });
  const regsQ = useQuery({ queryKey: ["cert-registrations"], queryFn: () => regsFn() });
  const coursesQ = useQuery({ queryKey: ["cert-courses"], queryFn: () => coursesFn() });
  const pricingQ = useQuery({ queryKey: ["cert-pricing"], queryFn: () => pricingFn() });

  // Post-checkout toast + cleanup
  React.useEffect(() => {
    if (search.checkout === "success") {
      toast.success("Payment received — certificates are being issued.");
      qc.invalidateQueries({ queryKey: ["cert-registrations"] });
      navigate({ search: { tab: "certificates" }, replace: true });
    } else if (search.checkout === "canceled") {
      toast("Checkout canceled — your registrations are back in the basket.");
      qc.invalidateQueries({ queryKey: ["cert-registrations"] });
      navigate({ search: { tab: "basket" }, replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.checkout]);

  const learners = learnersQ.data ?? [];
  const regs = regsQ.data ?? [];
  const courses = coursesQ.data ?? [];
  const pricing = pricingQ.data;

  const basket = regs.filter((r) => r.status === "passed" && !r.batch_id);
  const certs = regs.filter((r) => r.status === "issued" || r.status === "dispatched");

  return (
    <DashboardShell
      role="trainer"
      active="Students & Certificates"
      title="Students & Certificates"
      subtitle="Register learners on your approved courses, mark them passed, and issue REPS-verified certificates."
    >

      <div className="mx-auto w-full max-w-6xl space-y-6 p-4 lg:p-6">
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button onClick={() => setTab("learners")}>
            <UserPlus className="mr-1 h-4 w-4" /> Add a learner
          </Button>
        </div>


        {/* Segmented tabs */}
        <div className="inline-flex rounded-[10px] border border-reps-border bg-reps-panel p-1">
          {(
            [
              ["learners", `Learners${learners.length ? ` (${learners.length})` : ""}`],
              ["registrations", `Registrations${regs.length ? ` (${regs.length})` : ""}`],
              ["basket", `Basket${basket.length ? ` (${basket.length})` : ""}`],
              ["certificates", `Certificates${certs.length ? ` (${certs.length})` : ""}`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-[8px] px-3 py-1.5 text-[13px] font-medium transition ${
                tab === key
                  ? "bg-reps-orange-soft text-reps-orange"
                  : "text-white/70 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "learners" ? <LearnersTab learners={learners} loading={learnersQ.isLoading} /> : null}
        {tab === "registrations" ? (
          <RegistrationsTab regs={regs} learners={learners} courses={courses} loading={regsQ.isLoading} />
        ) : null}
        {tab === "basket" ? <BasketTab basket={basket} pricing={pricing} /> : null}
        {tab === "certificates" ? <CertificatesTab certs={certs} /> : null}
      </div>
    </DashboardShell>
  );
}

/* ────────────────────────────────────────────────────────── Learners */

function LearnersTab({ learners, loading }: { learners: LearnerDTO[]; loading: boolean }) {
  const [open, setOpen] = React.useState(false);
  const qc = useQueryClient();
  const del = useServerFn(deleteLearner);
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Learner removed.");
      qc.invalidateQueries({ queryKey: ["cert-learners"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not remove learner."),
  });

  return (
    <PPanel>
      <div className="flex items-center justify-between border-b border-reps-border p-4">
        <div>
          <h2 className="text-[15px] font-semibold text-white">Learners</h2>
          <p className="mt-0.5 text-[12.5px] text-white/55">
            Add every person you'll be issuing REPS certificates to.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-1 h-4 w-4" /> Add learner
        </Button>
      </div>
      {loading ? (
        <div className="p-6 text-center text-[13px] text-white/55">Loading…</div>
      ) : learners.length === 0 ? (
        <div className="p-8 text-center text-[13px] text-white/55">
          No learners yet. Add your first one to start registering certificates.
        </div>
      ) : (
        <ul className="divide-y divide-reps-border">
          {learners.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="text-[14px] font-semibold text-white">{l.full_name}</div>
                <div className="text-[12.5px] text-white/60">{l.email}</div>
              </div>
              <Button
                variant="ghost"
                onClick={() => {
                  if (confirm(`Remove ${l.full_name}?`)) delMut.mutate(l.id);
                }}
                disabled={delMut.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      {open ? <AddLearnerDialog open={open} onClose={() => setOpen(false)} /> : null}
    </PPanel>
  );
}

function AddLearnerDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const create = useServerFn(createLearner);
  const [full_name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [country, setCountry] = React.useState("");

  const mut = useMutation({
    mutationFn: () => create({ data: { full_name, email, country: country || null, dob: null } }),
    onSuccess: () => {
      toast.success("Learner added.");
      qc.invalidateQueries({ queryKey: ["cert-learners"] });
      onClose();
      setName("");
      setEmail("");
      setCountry("");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not add learner."),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md bg-reps-panel border-reps-border text-white">
        <DialogHeader>
          <DialogTitle>Add a learner</DialogTitle>
          <DialogDescription>
            You'll assign them to one of your approved courses on the next step.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-[12px] text-white/70">Full name</label>
            <Input value={full_name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" />
          </div>
          <div>
            <label className="text-[12px] text-white/70">Email</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" />
          </div>
          <div>
            <label className="text-[12px] text-white/70">Country (optional)</label>
            <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="United Kingdom" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mut.mutate()} disabled={!full_name.trim() || !email.trim() || mut.isPending}>
            {mut.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
            Add learner
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ────────────────────────────────────────────────────────── Registrations */

function RegistrationsTab({
  regs,
  learners,
  courses,
  loading,
}: {
  regs: RegistrationDTO[];
  learners: LearnerDTO[];
  courses: ProviderCourseOptionDTO[];
  loading: boolean;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const markFn = useServerFn(markRegistrationsPassed);
  const markMut = useMutation({
    mutationFn: (ids: string[]) => markFn({ data: { ids } }),
    onSuccess: () => {
      toast.success("Marked as passed. They're ready to check out.");
      qc.invalidateQueries({ queryKey: ["cert-registrations"] });
      setSelected(new Set());
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not mark passed."),
  });

  const cancelFn = useServerFn(cancelRegistration);
  const cancelMut = useMutation({
    mutationFn: (id: string) => cancelFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cert-registrations"] });
    },
  });

  const toggle = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const selectableIds = regs.filter((r) => r.status === "enrolled").map((r) => r.id);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));

  return (
    <PPanel>
      <div className="flex items-center justify-between border-b border-reps-border p-4">
        <div>
          <h2 className="text-[15px] font-semibold text-white">Registrations</h2>
          <p className="mt-0.5 text-[12.5px] text-white/55">
            One row per learner + course. Mark them as passed when they've completed the course.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 ? (
            <Button
              onClick={() => markMut.mutate(Array.from(selected))}
              disabled={markMut.isPending}
            >
              {markMut.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <BadgeCheck className="mr-1 h-4 w-4" />}
              Mark {selected.size} passed
            </Button>
          ) : null}
          <Button onClick={() => setOpen(true)} disabled={learners.length === 0 || courses.length === 0}>
            <Plus className="mr-1 h-4 w-4" /> Register learner on course
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="p-6 text-center text-[13px] text-white/55">Loading…</div>
      ) : regs.length === 0 ? (
        <div className="p-8 text-center text-[13px] text-white/55">
          {learners.length === 0
            ? "Add a learner first, then register them on a course."
            : courses.length === 0
              ? "You'll need at least one approved course before you can register learners."
              : "No registrations yet."}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-[13px]">
            <thead className="border-b border-reps-border text-left text-[11.5px] uppercase tracking-wide text-white/50">
              <tr>
                <th className="p-3 w-8">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(v) => {
                      if (v) setSelected(new Set(selectableIds));
                      else setSelected(new Set());
                    }}
                  />
                </th>
                <th className="p-3">Learner</th>
                <th className="p-3">Course</th>
                <th className="p-3">Status</th>
                <th className="p-3">Enrolled</th>
                <th className="p-3 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-reps-border">
              {regs.map((r) => (
                <tr key={r.id} className="text-white/85">
                  <td className="p-3">
                    {r.status === "enrolled" ? (
                      <Checkbox
                        checked={selected.has(r.id)}
                        onCheckedChange={() => toggle(r.id)}
                      />
                    ) : null}
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-white">{r.learner_name}</div>
                    <div className="text-[12px] text-white/55">{r.learner_email}</div>
                  </td>
                  <td className="p-3">
                    <div className="text-white">{r.course_title}</div>
                    <div className="text-[12px] text-white/55">
                      {r.course_level ? `Level ${r.course_level}` : ""}
                      {r.reps_course_number ? ` · ${r.reps_course_number}` : ""}
                    </div>
                  </td>
                  <td className="p-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="p-3 text-white/60">
                    {new Date(r.enrolled_at).toLocaleDateString("en-GB")}
                  </td>
                  <td className="p-3">
                    {r.status === "enrolled" || r.status === "passed" ? (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          if (confirm("Cancel this registration?")) cancelMut.mutate(r.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open ? (
        <RegisterOnCourseDialog
          open={open}
          onClose={() => setOpen(false)}
          learners={learners}
          courses={courses}
        />
      ) : null}
    </PPanel>
  );
}

function RegisterOnCourseDialog({
  open,
  onClose,
  learners,
  courses,
}: {
  open: boolean;
  onClose: () => void;
  learners: LearnerDTO[];
  courses: ProviderCourseOptionDTO[];
}) {
  const qc = useQueryClient();
  const create = useServerFn(createRegistration);
  const [learnerId, setLearnerId] = React.useState("");
  const [coursePick, setCoursePick] = React.useState("");

  const mut = useMutation({
    mutationFn: () => {
      const course = courses.find((c) => c.id === coursePick);
      if (!course) throw new Error("Pick a course");
      return create({ data: { learner_id: learnerId, course_id: course.id, course_kind: course.kind } });
    },
    onSuccess: () => {
      toast.success("Registered.");
      qc.invalidateQueries({ queryKey: ["cert-registrations"] });
      onClose();
      setLearnerId("");
      setCoursePick("");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not register."),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md bg-reps-panel border-reps-border text-white">
        <DialogHeader>
          <DialogTitle>Register a learner on a course</DialogTitle>
          <DialogDescription>You'll mark them as passed once they've completed it.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-[12px] text-white/70">Learner</label>
            <Select value={learnerId} onValueChange={setLearnerId}>
              <SelectTrigger><SelectValue placeholder="Choose a learner" /></SelectTrigger>
              <SelectContent>
                {learners.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.full_name} — {l.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[12px] text-white/70">Course</label>
            <Select value={coursePick} onValueChange={setCoursePick}>
              <SelectTrigger><SelectValue placeholder="Choose an approved course" /></SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.level ? `L${c.level} · ` : ""}
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mut.mutate()} disabled={!learnerId || !coursePick || mut.isPending}>
            {mut.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
            Register
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ────────────────────────────────────────────────────────── Basket */

function BasketTab({
  basket,
  pricing,
}: {
  basket: RegistrationDTO[];
  pricing:
    | {
        unit_price_pence: number;
        postage_fee_pence?: number;
        international_postage_fee_pence?: number;
        currency: string;
      }
    | undefined;
}) {
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const checkout = useServerFn(createCertificateBatchCheckout);

  React.useEffect(() => {
    setSelected(new Set(basket.map((b) => b.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basket.length]);

  const unit = pricing?.unit_price_pence ?? 1500;
  const ukPostage = pricing?.postage_fee_pence ?? 650;
  const intlPostage = pricing?.international_postage_fee_pence ?? 1500;
  const count = selected.size;

  // Every training-provider batch is printed + digital, so shipping is always required.
  const requiresShipping = true;

  // Ship-to address — persisted locally so providers don't re-type each time
  const [addr, setAddr] = React.useState({
    fullName: "",
    companyName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    postcode: "",
    countryCode: "GB",
    phoneNumber: "",
  });
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("reps-cert-ship-to");
      if (raw) setAddr((a) => ({ ...a, ...JSON.parse(raw) }));
    } catch {
      /* ignore */
    }
  }, []);

  const cc = (addr.countryCode || "GB").toUpperCase();
  const isInternational = cc !== "GB" && cc !== "UK";
  const postageOnBatch = isInternational ? intlPostage : ukPostage;
  const total = unit * count + postageOnBatch;

  const addressComplete =
    addr.fullName.trim() &&
    addr.addressLine1.trim() &&
    addr.city.trim() &&
    addr.postcode.trim() &&
    addr.countryCode.trim().length === 2;

  const mut = useMutation({
    mutationFn: () => {
      const shipTo = {
        fullName: addr.fullName.trim(),
        companyName: addr.companyName.trim() || null,
        addressLine1: addr.addressLine1.trim(),
        addressLine2: addr.addressLine2.trim() || null,
        city: addr.city.trim(),
        postcode: addr.postcode.trim(),
        countryCode: cc,
        phoneNumber: addr.phoneNumber.trim() || null,
      };

      try {
        localStorage.setItem("reps-cert-ship-to", JSON.stringify(shipTo));
      } catch {
        /* ignore */
      }

      return checkout({
        data: {
          registration_ids: Array.from(selected),
          environment: getStripeEnvironment(),
          ship_to_address: shipTo,
        },
      });
    },
    onSuccess: (res: any) => {
      if ("url" in res && res.url) window.location.assign(res.url);
      else toast.error(res?.error ?? "Could not start checkout.");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not start checkout."),
  });

  return (
    <PPanel>
      <div className="border-b border-reps-border p-4">
        <h2 className="text-[15px] font-semibold text-white">Basket</h2>
        <p className="mt-0.5 text-[12.5px] text-white/55">
          Ready to claim certificates for these learners. Payment goes to REPS; we'll email
          each learner a QR-verified digital certificate, and post any printed copies via
          Royal Mail tracked delivery.
        </p>
      </div>
      {basket.length === 0 ? (
        <div className="p-8 text-center text-[13px] text-white/55">
          Nothing in the basket. Mark a registration as passed to add it here.
        </div>
      ) : (
        <>
          <ul className="divide-y divide-reps-border">
            {basket.map((r) => (
              <li key={r.id} className="flex items-center gap-3 p-4">
                <Checkbox
                  checked={selected.has(r.id)}
                  onCheckedChange={() =>
                    setSelected((prev) => {
                      const n = new Set(prev);
                      if (n.has(r.id)) n.delete(r.id);
                      else n.add(r.id);
                      return n;
                    })
                  }
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-white">{r.learner_name}</div>
                  <div className="text-[12.5px] text-white/60">
                    {r.course_level ? `Level ${r.course_level} · ` : ""}
                    {r.course_title}
                    {r.format === "printed_and_digital" ? (
                      <span className="ml-2 text-white/45">· Printed + digital</span>
                    ) : (
                      <span className="ml-2 text-white/45">· Digital</span>
                    )}
                  </div>
                </div>
                <div className="text-[13px] text-white/70">£{(unit / 100).toFixed(2)}</div>
              </li>
            ))}
          </ul>

          {requiresShipping && (
            <div className="border-t border-reps-border p-4 space-y-3">
              <div>
                <h3 className="text-[13.5px] font-semibold text-white">
                  Shipping address
                </h3>
                <p className="text-[12px] text-white/55 mt-0.5">
                  Printed certificates ship in one bundle via Royal Mail tracked delivery
                  (UK £{(ukPostage / 100).toFixed(2)} / international £
                  {(intlPostage / 100).toFixed(2)} per batch). We save this address for
                  next time.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  placeholder="Contact name"
                  value={addr.fullName}
                  onChange={(e) => setAddr({ ...addr, fullName: e.target.value })}
                />
                <Input
                  placeholder="Company / organisation (optional)"
                  value={addr.companyName}
                  onChange={(e) => setAddr({ ...addr, companyName: e.target.value })}
                />
                <Input
                  className="sm:col-span-2"
                  placeholder="Address line 1"
                  value={addr.addressLine1}
                  onChange={(e) => setAddr({ ...addr, addressLine1: e.target.value })}
                />
                <Input
                  className="sm:col-span-2"
                  placeholder="Address line 2 (optional)"
                  value={addr.addressLine2}
                  onChange={(e) => setAddr({ ...addr, addressLine2: e.target.value })}
                />
                <Input
                  placeholder="City / town"
                  value={addr.city}
                  onChange={(e) => setAddr({ ...addr, city: e.target.value })}
                />
                <Input
                  placeholder="Postal / ZIP code"
                  value={addr.postcode}
                  onChange={(e) => setAddr({ ...addr, postcode: e.target.value })}
                />
                <Input
                  placeholder="Country code (2 letters, e.g. GB, US, ES)"
                  maxLength={2}
                  value={addr.countryCode}
                  onChange={(e) =>
                    setAddr({
                      ...addr,
                      countryCode: e.target.value.toUpperCase().slice(0, 2),
                    })
                  }
                />
                <Input
                  placeholder="Phone (optional — for the courier)"
                  value={addr.phoneNumber}
                  onChange={(e) => setAddr({ ...addr, phoneNumber: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-reps-border p-4">
            <div>
              <div className="text-[12.5px] text-white/55">
                {count} certificate{count === 1 ? "" : "s"} × £{(unit / 100).toFixed(2)}
                {postageOnBatch > 0
                  ? ` + £${(postageOnBatch / 100).toFixed(2)} ${
                      isInternational ? "international " : ""
                    }postage`
                  : ""}
              </div>
              <div className="mt-1 font-display text-[22px] font-bold text-white">
                £{(total / 100).toFixed(2)}
              </div>
            </div>
            <Button
              onClick={() => mut.mutate()}
              disabled={count === 0 || mut.isPending || !addressComplete}
            >
              {mut.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              Check out {count} certificate{count === 1 ? "" : "s"}
            </Button>
          </div>
        </>
      )}
    </PPanel>
  );
}

/* ────────────────────────────────────────────────────────── Certificates */

function CertificatesTab({ certs }: { certs: RegistrationDTO[] }) {
  const sign = useServerFn(getCertificateSignedUrl);

  const downloadMut = useMutation({
    mutationFn: (id: string) => sign({ data: { registration_id: id } }),
    onSuccess: (r: any) => {
      if (r?.url) window.open(r.url, "_blank");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not download."),
  });

  const publicBase = typeof window === "undefined" ? "https://repsuk.org" : window.location.origin;

  return (
    <PPanel>
      <div className="border-b border-reps-border p-4">
        <h2 className="text-[15px] font-semibold text-white">Issued certificates</h2>
        <p className="mt-0.5 text-[12.5px] text-white/55">
          Forward these to your learners. Every certificate carries a QR code that anyone can scan to
          verify it on REPS.
        </p>
      </div>
      {certs.length === 0 ? (
        <div className="p-8 text-center text-[13px] text-white/55">
          No certificates yet. Pay for a basket of registrations to have REPS issue them.
        </div>
      ) : (
        <ul className="divide-y divide-reps-border">
          {certs.map((r) => (
            <li key={r.id} className="flex items-center gap-3 p-4">
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold text-white">{r.learner_name}</div>
                <div className="text-[12.5px] text-white/60">
                  {r.course_level ? `Level ${r.course_level} · ` : ""}
                  {r.course_title}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11.5px] text-white/50">
                  <Badge className="bg-emerald-500/15 border-emerald-400/30 text-emerald-300">
                    {r.certificate_number}
                  </Badge>
                  <span>Issued {r.issued_at ? new Date(r.issued_at).toLocaleDateString("en-GB") : "—"}</span>
                  {r.verification_token ? (
                    <button
                      className="inline-flex items-center gap-1 text-white/70 hover:text-white"
                      onClick={() => {
                        const url = `${publicBase}/verify/${r.verification_token}`;
                        navigator.clipboard.writeText(url);
                        toast.success("Verify URL copied.");
                      }}
                    >
                      <Copy className="h-3 w-3" /> Copy verify link
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {r.verification_token ? (
                  <a
                    href={`/verify/${r.verification_token}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-[8px] border border-reps-border px-2 py-1 text-[12px] text-white/75 hover:bg-white/5"
                  >
                    <ExternalLink className="h-3 w-3" /> Verify page
                  </a>
                ) : null}
                <Button
                  variant="ghost"
                  onClick={() => downloadMut.mutate(r.id)}
                  disabled={downloadMut.isPending}
                >
                  <Download className="mr-1 h-4 w-4" /> PDF
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PPanel>
  );
}

/* ────────────────────────────────────────────────────────── shared */

function StatusBadge({ status }: { status: RegistrationDTO["status"] }) {
  const map: Record<RegistrationDTO["status"], { label: string; className: string }> = {
    enrolled: { label: "Enrolled", className: "bg-white/10 text-white/75 border-white/15" },
    passed: { label: "Passed", className: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30" },
    pending_payment: { label: "Awaiting payment", className: "bg-amber-500/15 text-amber-300 border-amber-400/30" },
    paid: { label: "Paid", className: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30" },
    issued: { label: "Issued", className: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30" },
    dispatched: { label: "Dispatched", className: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30" },
    revoked: { label: "Revoked", className: "bg-red-500/15 text-red-300 border-red-400/30" },
    canceled: { label: "Canceled", className: "bg-white/5 text-white/50 border-white/10" },
  };
  const cfg = map[status];
  return <Badge className={cfg.className}>{cfg.label}</Badge>;
}
