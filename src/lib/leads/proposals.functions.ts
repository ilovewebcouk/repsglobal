// Phase 2.0 — Lead proposals (Pro tier).
// Draft/send/accept/decline/withdraw structured proposals against a lead.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const CADENCE_LABEL_FOR_EMAIL: Record<string, string> = {
  one_off: "One-off",
  weekly: "Weekly",
  monthly: "Monthly",
  package: "Package",
};

function formatPriceGBP(pence: number): string {
  const pounds = pence / 100;
  const hasFraction = pence % 100 !== 0;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(pounds);
}

async function sendProposalEmail(opts: {
  proposalId: string;
  enquiryId: string;
  professionalId: string;
  body: { title: string; summary?: string; price_pence: number; cadence: string; sessions?: number; start_date?: string; notes?: string };
}) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: enq }, { data: prof }, { data: authUser }] = await Promise.all([
      supabaseAdmin
        .from("enquiries")
        .select("sender_email, sender_name")
        .eq("id", opts.enquiryId)
        .maybeSingle(),
      supabaseAdmin
        .from("profiles")
        .select("full_name")
        .eq("id", opts.professionalId)
        .maybeSingle(),
      supabaseAdmin.auth.admin.getUserById(opts.professionalId),
    ]);
    if (!enq?.sender_email) return;
    const proName = prof?.full_name ?? "Your REPs Pro";
    const clientFirstName = (enq.sender_name ?? "").split(" ")[0] || "there";
    const proEmail = authUser?.user?.email ?? undefined;
    const cadenceLabel = CADENCE_LABEL_FOR_EMAIL[opts.body.cadence] ?? opts.body.cadence;
    const priceLabel =
      opts.body.cadence === "weekly"
        ? `${formatPriceGBP(opts.body.price_pence)} / week`
        : opts.body.cadence === "monthly"
          ? `${formatPriceGBP(opts.body.price_pence)} / month`
          : opts.body.cadence === "package"
            ? `${formatPriceGBP(opts.body.price_pence)} total`
            : `${formatPriceGBP(opts.body.price_pence)} / session`;
    const { sendTransactionalEmailServer } = await import("@/lib/email/send.server");
    await sendTransactionalEmailServer({
      templateName: "proposal-sent",
      recipientEmail: enq.sender_email,
      idempotencyKey: `proposal-${opts.proposalId}`,
      replyTo: proEmail,
      templateData: {
        clientFirstName,
        proName,
        title: opts.body.title,
        summary: opts.body.summary,
        priceLabel,
        cadenceLabel,
        sessions: opts.body.sessions ?? null,
        startDate: opts.body.start_date ?? null,
        notes: opts.body.notes ?? null,
        proEmail,
      },
    });
  } catch (e) {
    console.error("[proposals] proposal-sent email failed:", e);
  }
}

export const PROPOSAL_STATUSES = ["draft", "sent", "accepted", "declined", "withdrawn"] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export const PROPOSAL_CADENCES = ["one_off", "weekly", "monthly", "package"] as const;
export type ProposalCadence = (typeof PROPOSAL_CADENCES)[number];

export const PROPOSAL_CADENCE_LABEL: Record<ProposalCadence, string> = {
  one_off: "One-off",
  weekly: "Weekly",
  monthly: "Monthly",
  package: "Package",
};

export const PROPOSAL_STATUS_LABEL: Record<ProposalStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  declined: "Declined",
  withdrawn: "Withdrawn",
};

export type ProposalBody = {
  title: string;
  summary?: string;
  price_pence: number;
  cadence: ProposalCadence;
  sessions?: number;
  start_date?: string;
  notes?: string;
};

export type ProposalDTO = {
  id: string;
  enquiry_id: string;
  status: ProposalStatus;
  body: ProposalBody;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
};

const ProposalBodySchema = z.object({
  title: z.string().trim().min(1).max(160),
  summary: z.string().trim().max(600).optional().or(z.literal("")),
  price_pence: z.number().int().nonnegative().max(100_000_00),
  cadence: z.enum(PROPOSAL_CADENCES),
  sessions: z.number().int().positive().max(500).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

function normaliseBody(input: z.infer<typeof ProposalBodySchema>): ProposalBody {
  const b: ProposalBody = {
    title: input.title,
    price_pence: input.price_pence,
    cadence: input.cadence,
  };
  if (input.summary) b.summary = input.summary;
  if (input.sessions) b.sessions = input.sessions;
  if (input.start_date) b.start_date = input.start_date;
  if (input.notes) b.notes = input.notes;
  return b;
}

/* -------------------- List -------------------- */

export const listProposals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ enquiryId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<ProposalDTO[]> => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("lead_proposals")
      .select("id, enquiry_id, status, body, sent_at, created_at, updated_at")
      .eq("enquiry_id", data.enquiryId)
      .eq("professional_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (rows ?? []).map((r) => ({
      id: r.id,
      enquiry_id: r.enquiry_id,
      status: (r.status ?? "draft") as ProposalStatus,
      body: (r.body ?? {}) as ProposalBody,
      sent_at: r.sent_at,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
  });

/* -------------------- Create -------------------- */

const CreateSchema = z.object({
  enquiryId: z.string().uuid(),
  body: ProposalBodySchema,
  status: z.enum(["draft", "sent"]).default("draft"),
});

export const createProposal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Ownership
    const { data: enq, error: enqErr } = await supabaseAdmin
      .from("enquiries")
      .select("id")
      .eq("id", data.enquiryId)
      .eq("professional_id", userId)
      .maybeSingle();
    if (enqErr) throw enqErr;
    if (!enq) throw new Error("Lead not found");

    const body = normaliseBody(data.body);
    const nowIso = new Date().toISOString();
    const { data: row, error } = await supabaseAdmin
      .from("lead_proposals")
      .insert({
        enquiry_id: data.enquiryId,
        professional_id: userId,
        status: data.status,
        body,
        sent_at: data.status === "sent" ? nowIso : null,
      })
      .select("id")
      .single();
    if (error) throw error;

    if (data.status === "sent") {
      await supabaseAdmin.from("lead_activity").insert({
        enquiry_id: data.enquiryId,
        professional_id: userId,
        type: "proposal_sent",
        payload: { proposal_id: row.id, title: body.title, price_pence: body.price_pence },
        created_by: userId,
      });
      // Auto-bump stage to proposal_sent if currently earlier
      await supabaseAdmin
        .from("enquiries")
        .update({ stage: "proposal_sent" })
        .eq("id", data.enquiryId)
        .eq("professional_id", userId)
        .in("stage", ["new", "contacted", "call_booked"]);
      // Email the lead with the proposal
      await sendProposalEmail({
        proposalId: row.id,
        enquiryId: data.enquiryId,
        professionalId: userId,
        body,
      });
    }
    return { id: row.id };
  });

/* -------------------- Update -------------------- */

const UpdateSchema = z.object({
  id: z.string().uuid(),
  body: ProposalBodySchema.optional(),
  status: z.enum(PROPOSAL_STATUSES).optional(),
});

export const updateProposal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpdateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing, error: exErr } = await supabaseAdmin
      .from("lead_proposals")
      .select("id, enquiry_id, status, body, sent_at")
      .eq("id", data.id)
      .eq("professional_id", userId)
      .maybeSingle();
    if (exErr) throw exErr;
    if (!existing) throw new Error("Proposal not found");

    const patch: {
      body?: ProposalBody;
      status?: ProposalStatus;
      sent_at?: string;
    } = {};
    if (data.body) patch.body = normaliseBody(data.body);
    if (data.status) {
      patch.status = data.status;
      if (data.status === "sent" && !existing.sent_at) {
        patch.sent_at = new Date().toISOString();
      }
    }
    if (Object.keys(patch).length === 0) return { ok: true };

    const { error } = await supabaseAdmin
      .from("lead_proposals")
      .update(patch)
      .eq("id", data.id)
      .eq("professional_id", userId);
    if (error) throw error;

    // Activity log on status change
    if (data.status && data.status !== existing.status) {
      const body = (existing.body ?? {}) as ProposalBody;
      await supabaseAdmin.from("lead_activity").insert({
        enquiry_id: existing.enquiry_id,
        professional_id: userId,
        type: `proposal_${data.status}`,
        payload: { proposal_id: existing.id, title: body.title, price_pence: body.price_pence },
        created_by: userId,
      });

      // Stage nudges
      if (data.status === "sent") {
        await supabaseAdmin
          .from("enquiries")
          .update({ stage: "proposal_sent" })
          .eq("id", existing.enquiry_id)
          .eq("professional_id", userId)
          .in("stage", ["new", "contacted", "call_booked"]);
      }
    }

    return { ok: true };
  });
