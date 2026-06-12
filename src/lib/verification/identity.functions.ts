import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const identityInput = z.object({
  doc_type: z.enum(["passport", "driving_licence", "national_id"]),
  doc_country: z.string().min(2).max(64).optional().nullable(),
  doc_path_front: z.string().min(1),
  doc_path_back: z.string().optional().nullable(),
  selfie_path: z.string().optional().nullable(),
  name_on_doc: z.string().max(160).optional().nullable(),
  dob_on_doc: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  doc_expiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
});

export const saveIdentity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => identityInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("professionals").upsert({ id: userId } as never, { onConflict: "id" });
    const { data: row, error } = await supabase
      .from("identity_documents")
      .insert({
        professional_id: userId,
        doc_type: data.doc_type,
        doc_country: data.doc_country ?? null,
        doc_path_front: data.doc_path_front,
        doc_path_back: data.doc_path_back ?? null,
        selfie_path: data.selfie_path ?? null,
        name_on_doc: data.name_on_doc ?? null,
        dob_on_doc: data.dob_on_doc ?? null,
        doc_expiry: data.doc_expiry ?? null,
        status: "pending",
      } as never)
      .select("id, status, created_at")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const myIdentity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("identity_documents")
      .select("id, doc_type, doc_country, name_on_doc, dob_on_doc, doc_expiry, selfie_path, doc_path_front, doc_path_back, status, admin_note, created_at, reviewed_at")
      .eq("professional_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const getIdentityForPro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ professional_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("identity_documents")
      .select("*")
      .eq("professional_id", data.professional_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return row;
  });
