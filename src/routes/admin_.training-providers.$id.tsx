import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, Plus, Trash2, GraduationCap } from "lucide-react";

import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard } from "@/components/dashboard/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  getOrganisation,
  updateOrganisation,
  setOrganisationPublished,
  upsertCourse,
  deleteCourse,
} from "@/lib/training-providers.functions";

export const Route = createFileRoute("/admin_/training-providers/$id")({
  head: () => ({ meta: [{ name: "robots", content: "noindex,nofollow" }] }),
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  component: AdminTrainingProviderDetailPage,
});

function AdminTrainingProviderDetailPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const key = ["admin", "training-provider", id];

  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: () => getOrganisation({ data: { id } }),
  });

  if (isLoading || !data) {
    return (
      <DashboardShell
        role="admin"
        active="Training Providers"
        title="Loading…"
        subtitle="Loading provider…"
      >
        <div className="p-8 text-white/60">Loading provider…</div>
      </DashboardShell>
    );
  }

  const { org, courses, subscription } = data;

  return (
    <DashboardShell
      role="admin"
      active="Training Providers"
      title={org.name}
      subtitle={
        [
          org.city,
          org.country,
          org.membership_number ? `#${org.membership_number}` : null,
          `/${org.slug}`,
        ]
          .filter(Boolean)
          .join(" · ")
      }
      actions={
        <div className="flex items-center gap-2">
          {org.published_at ? (
            <Link
              to="/providers/$slug"
              params={{ slug: org.slug }}
              target="_blank"
              className="inline-flex items-center gap-1 rounded-[10px] border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              View website <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          ) : null}
          <PublishToggle
            id={id}
            published={!!org.published_at}
            onDone={() => qc.invalidateQueries({ queryKey: key })}
          />
        </div>
      }
    >
      <Tabs defaultValue="details" className="space-y-5">
        <TabsList className="rounded-[10px] bg-white/5">
          <TabsTrigger value="details" className="rounded-[8px]">
            Details
          </TabsTrigger>
          <TabsTrigger value="courses" className="rounded-[8px]">
            Courses ({courses.length})
          </TabsTrigger>
          <TabsTrigger value="subscription" className="rounded-[8px]">
            Subscription
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <DetailsForm
            org={org}
            onSaved={() => qc.invalidateQueries({ queryKey: key })}
          />
        </TabsContent>

        <TabsContent value="courses">
          <CoursesTab
            orgId={id}
            courses={courses}
            onChange={() => qc.invalidateQueries({ queryKey: key })}
          />
        </TabsContent>

        <TabsContent value="subscription">
          <SubscriptionTab org={org} subscription={subscription} />
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}

function PublishToggle({
  id,
  published,
  onDone,
}: {
  id: string;
  published: boolean;
  onDone: () => void;
}) {
  const mut = useMutation({
    mutationFn: (v: boolean) =>
      setOrganisationPublished({ data: { id, published: v } }),
    onSuccess: (_, v) => {
      toast.success(v ? "Website published" : "Website unpublished");
      onDone();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
  return (
    <Button
      onClick={() => mut.mutate(!published)}
      disabled={mut.isPending}
      className={
        published
          ? "rounded-[10px] border border-white/15 bg-white/5 text-white shadow-none hover:bg-white/10"
          : "rounded-[10px] bg-reps-orange text-white shadow-none hover:bg-reps-orange-hover"
      }
    >
      {published ? "Unpublish" : "Publish website"}
    </Button>
  );
}

function DetailsForm({ org, onSaved }: { org: any; onSaved: () => void }) {
  const [form, setForm] = React.useState({
    name: org.name ?? "",
    slug: org.slug ?? "",
    legal_name: org.legal_name ?? "",
    membership_number: org.membership_number ?? "",
    website_url: org.website_url ?? "",
    contact_email: org.contact_email ?? "",
    contact_phone: org.contact_phone ?? "",
    city: org.city ?? "",
    country: org.country ?? "",
    companies_house_number: org.companies_house_number ?? "",
    logo_url: org.logo_url ?? "",
    cover_url: org.cover_url ?? "",
    about_md: org.about_md ?? "",
    status: (org.status ?? "draft") as
      | "draft"
      | "active"
      | "suspended"
      | "cancelled",
  });

  const mut = useMutation({
    mutationFn: () =>
      updateOrganisation({
        data: {
          id: org.id,
          patch: Object.fromEntries(
            Object.entries(form).map(([k, v]) => [k, v === "" ? null : v]),
          ) as any,
        },
      }),
    onSuccess: () => {
      toast.success("Saved");
      onSaved();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const F = (k: keyof typeof form) => ({
    value: (form[k] as string) ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((s) => ({ ...s, [k]: e.target.value })),
  });

  return (
    <PCard className="p-6 space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Display name">
          <Input {...F("name")} className="rounded-[12px]" />
        </Field>
        <Field label="Slug (URL)">
          <Input {...F("slug")} className="rounded-[12px]" />
        </Field>
        <Field label="Legal name">
          <Input {...F("legal_name")} className="rounded-[12px]" />
        </Field>
        <Field label="REPs membership number">
          <Input
            {...F("membership_number")}
            placeholder="e.g. TP-2026-014"
            className="rounded-[12px]"
          />
        </Field>
        <Field label="Website URL">
          <Input
            {...F("website_url")}
            placeholder="https://…"
            className="rounded-[12px]"
          />
        </Field>
        <Field label="Contact email">
          <Input {...F("contact_email")} className="rounded-[12px]" />
        </Field>
        <Field label="Contact phone">
          <Input {...F("contact_phone")} className="rounded-[12px]" />
        </Field>
        <Field label="Companies House #">
          <Input {...F("companies_house_number")} className="rounded-[12px]" />
        </Field>
        <Field label="City">
          <Input {...F("city")} className="rounded-[12px]" />
        </Field>
        <Field label="Country">
          <Input {...F("country")} className="rounded-[12px]" />
        </Field>
        <Field label="Logo URL">
          <Input {...F("logo_url")} className="rounded-[12px]" />
        </Field>
        <Field label="Cover image URL">
          <Input {...F("cover_url")} className="rounded-[12px]" />
        </Field>
      </div>
      <Field label="About (markdown supported)">
        <Textarea
          {...F("about_md")}
          rows={8}
          className="rounded-[12px] font-mono text-sm"
        />
      </Field>
      <Field label="Status">
        <Select
          value={form.status}
          onValueChange={(v) => setForm((s) => ({ ...s, status: v as any }))}
        >
          <SelectTrigger className="rounded-[12px] max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <div className="flex justify-end">
        <Button
          onClick={() => mut.mutate()}
          disabled={mut.isPending}
          className="rounded-[10px] bg-reps-orange text-white shadow-none hover:bg-reps-orange-hover"
        >
          {mut.isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </PCard>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-white/60">
        {label}
      </Label>
      {children}
    </div>
  );
}

function CoursesTab({
  orgId,
  courses,
  onChange,
}: {
  orgId: string;
  courses: any[];
  onChange: () => void;
}) {
  const [editing, setEditing] = React.useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const del = useMutation({
    mutationFn: (id: string) => deleteCourse({ data: { id } }),
    onSuccess: () => {
      toast.success("Course deleted");
      onChange();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  return (
    <PCard className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-xl text-white">Accredited courses</h3>
          <p className="text-sm text-white/60">
            Each accredited course shows on the provider's website with a REPs
            badge and course id.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => setEditing(null)}
              className="rounded-[10px] bg-reps-orange text-white shadow-none hover:bg-reps-orange-hover"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add course
            </Button>
          </DialogTrigger>
          <CourseDialog
            orgId={orgId}
            course={editing}
            onDone={() => {
              setDialogOpen(false);
              setEditing(null);
              onChange();
            }}
          />
        </Dialog>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-[16px] border border-dashed border-white/15 py-12 text-center text-white/50">
          <GraduationCap className="mx-auto h-8 w-8 text-white/30" />
          <div className="mt-2">No courses yet.</div>
        </div>
      ) : (
        <div className="divide-y divide-white/5 rounded-[16px] border border-white/10">
          {courses.map((c) => (
            <div key={c.id} className="p-4 flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-white">{c.title}</span>
                  <Badge
                    className={
                      c.status === "accredited"
                        ? "rounded-full border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                        : c.status === "rejected"
                          ? "rounded-full border-red-400/30 bg-red-500/15 text-red-300"
                          : "rounded-full border-white/15 bg-white/5 text-white/70"
                    }
                  >
                    {c.status}
                  </Badge>
                  {c.reps_course_id && (
                    <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-white/70">
                      {c.reps_course_id}
                    </code>
                  )}
                </div>
                {c.summary && (
                  <p className="mt-1 text-sm text-white/60 line-clamp-2">
                    {c.summary}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-white/50">
                  {c.level && <span>Level {c.level}</span>}
                  {c.duration_hours && <span>{c.duration_hours}h</span>}
                  {c.delivery_mode && (
                    <span className="capitalize">
                      {String(c.delivery_mode).replace("_", " ")}
                    </span>
                  )}
                  {c.price_from && <span>from £{c.price_from}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="rounded-[10px] border-white/15 bg-white/5 text-white shadow-none hover:bg-white/10"
                  onClick={() => {
                    setEditing(c);
                    setDialogOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  className="rounded-[10px] border-red-400/30 bg-red-500/10 text-red-300 shadow-none hover:bg-red-500/20"
                  onClick={() => {
                    if (confirm(`Delete "${c.title}"?`)) del.mutate(c.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PCard>
  );
}

function CourseDialog({
  orgId,
  course,
  onDone,
}: {
  orgId: string;
  course: any | null;
  onDone: () => void;
}) {
  const [form, setForm] = React.useState(() => ({
    title: course?.title ?? "",
    slug: course?.slug ?? "",
    reps_course_id: course?.reps_course_id ?? "",
    summary: course?.summary ?? "",
    description_md: course?.description_md ?? "",
    level: course?.level ?? "",
    duration_hours: course?.duration_hours ?? "",
    delivery_mode: (course?.delivery_mode ?? "") as
      | ""
      | "in_person"
      | "online"
      | "blended",
    price_from: course?.price_from ?? "",
    external_url: course?.external_url ?? "",
    status: (course?.status ?? "pending") as
      | "pending"
      | "accredited"
      | "rejected"
      | "expired",
    expires_at: (course?.expires_at ?? "").slice(0, 10),
  }));

  React.useEffect(() => {
    setForm({
      title: course?.title ?? "",
      slug: course?.slug ?? "",
      reps_course_id: course?.reps_course_id ?? "",
      summary: course?.summary ?? "",
      description_md: course?.description_md ?? "",
      level: course?.level ?? "",
      duration_hours: course?.duration_hours ?? "",
      delivery_mode: (course?.delivery_mode ?? "") as any,
      price_from: course?.price_from ?? "",
      external_url: course?.external_url ?? "",
      status: (course?.status ?? "pending") as any,
      expires_at: (course?.expires_at ?? "").slice(0, 10),
    });
  }, [course]);

  const mut = useMutation({
    mutationFn: () =>
      upsertCourse({
        data: {
          id: course?.id,
          organisation_id: orgId,
          title: form.title.trim(),
          slug: form.slug.trim() || undefined,
          reps_course_id: form.reps_course_id.trim() || null,
          summary: form.summary.trim() || null,
          description_md: form.description_md.trim() || null,
          level: form.level.trim() || null,
          duration_hours: form.duration_hours
            ? Number(form.duration_hours)
            : null,
          delivery_mode: (form.delivery_mode || null) as any,
          price_from: form.price_from ? Number(form.price_from) : null,
          external_url: form.external_url.trim() || null,
          status: form.status,
          expires_at: form.expires_at ? form.expires_at : null,
        },
      }),
    onSuccess: () => {
      toast.success(course ? "Course updated" : "Course added");
      onDone();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{course ? "Edit course" : "Add course"}</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Title">
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="rounded-[12px]"
          />
        </Field>
        <Field label="REPs course id">
          <Input
            value={form.reps_course_id}
            onChange={(e) =>
              setForm({ ...form, reps_course_id: e.target.value })
            }
            placeholder="e.g. REPS-L3-PT-014"
            className="rounded-[12px]"
          />
        </Field>
        <Field label="Slug">
          <Input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            placeholder="auto from title"
            className="rounded-[12px]"
          />
        </Field>
        <Field label="Level">
          <Input
            value={form.level}
            onChange={(e) => setForm({ ...form, level: e.target.value })}
            placeholder="e.g. 3"
            className="rounded-[12px]"
          />
        </Field>
        <Field label="Duration (hours)">
          <Input
            type="number"
            value={form.duration_hours}
            onChange={(e) =>
              setForm({ ...form, duration_hours: e.target.value })
            }
            className="rounded-[12px]"
          />
        </Field>
        <Field label="Delivery mode">
          <Select
            value={form.delivery_mode || "unset"}
            onValueChange={(v) =>
              setForm({
                ...form,
                delivery_mode: v === "unset" ? "" : (v as any),
              })
            }
          >
            <SelectTrigger className="rounded-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unset">—</SelectItem>
              <SelectItem value="in_person">In person</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="blended">Blended</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Price from (£)">
          <Input
            type="number"
            value={form.price_from}
            onChange={(e) => setForm({ ...form, price_from: e.target.value })}
            className="rounded-[12px]"
          />
        </Field>
        <Field label="External URL (enquire / apply)">
          <Input
            value={form.external_url}
            onChange={(e) =>
              setForm({ ...form, external_url: e.target.value })
            }
            placeholder="https://…"
            className="rounded-[12px]"
          />
        </Field>
        <Field label="Status">
          <Select
            value={form.status}
            onValueChange={(v) => setForm({ ...form, status: v as any })}
          >
            <SelectTrigger className="rounded-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accredited">Accredited</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Accreditation expires">
          <Input
            type="date"
            value={form.expires_at}
            onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
            className="rounded-[12px]"
          />
        </Field>
      </div>
      <Field label="Summary (1–2 sentences)">
        <Textarea
          value={form.summary}
          onChange={(e) => setForm({ ...form, summary: e.target.value })}
          rows={2}
          className="rounded-[12px]"
        />
      </Field>
      <Field label="Description (markdown)">
        <Textarea
          value={form.description_md}
          onChange={(e) =>
            setForm({ ...form, description_md: e.target.value })
          }
          rows={5}
          className="rounded-[12px] font-mono text-sm"
        />
      </Field>
      <DialogFooter>
        <Button
          disabled={!form.title.trim() || mut.isPending}
          onClick={() => mut.mutate()}
          className="rounded-[10px] bg-reps-orange text-white shadow-none hover:bg-reps-orange-hover"
        >
          {mut.isPending ? "Saving…" : "Save course"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function SubscriptionTab({
  org,
  subscription,
}: {
  org: any;
  subscription: any | null;
}) {
  return (
    <PCard className="p-6 space-y-4">
      <h3 className="font-display text-xl text-white">Stripe subscription</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <Row
          k="Stripe customer"
          v={
            org.stripe_customer_id ? (
              <code className="rounded bg-white/5 px-1.5 py-0.5">
                {org.stripe_customer_id}
              </code>
            ) : (
              "—"
            )
          }
        />
        {subscription ? (
          <>
            <Row k="Tier" v={subscription.tier} />
            <Row k="Status" v={subscription.status} />
            <Row
              k="Subscription id"
              v={
                <code className="rounded bg-white/5 px-1.5 py-0.5">
                  {subscription.stripe_subscription_id}
                </code>
              }
            />
            <Row
              k="Current period end"
              v={
                subscription.current_period_end
                  ? new Date(subscription.current_period_end).toLocaleDateString()
                  : "—"
              }
            />
            <Row
              k="Cancel at period end"
              v={subscription.cancel_at_period_end ? "Yes" : "No"}
            />
            <Row k="Environment" v={subscription.environment} />
          </>
        ) : (
          <div className="col-span-2 rounded-[12px] border border-dashed border-white/15 p-4 text-white/60">
            No subscription attached. Membership will not auto-renew.
          </div>
        )}
      </div>
    </PCard>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-white/50">{k}</div>
      <div className="mt-0.5 text-white">{v}</div>
    </div>
  );
}
