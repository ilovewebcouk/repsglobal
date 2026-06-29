import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data: docs } = await sb
  .from("identity_documents")
  .select("professional_id, status, name_on_doc, reviewed_at, created_at")
  .eq("status", "approved");

const seen = new Set();
let updated = 0;
for (const d of (docs || []).sort((a,b) => b.created_at.localeCompare(a.created_at))) {
  if (seen.has(d.professional_id)) continue;
  seen.add(d.professional_id);
  const { data: pro } = await sb.from("professionals").select("identity_status, identity_verified_at, identity_verified_name").eq("id", d.professional_id).maybeSingle();
  if (!pro || pro.identity_status === "approved") continue;
  const patch = { identity_status: "approved" };
  if (!pro.identity_verified_at) patch.identity_verified_at = d.reviewed_at || d.created_at;
  if (!pro.identity_verified_name && d.name_on_doc) patch.identity_verified_name = d.name_on_doc;
  const { error } = await sb.from("professionals").update(patch).eq("id", d.professional_id);
  if (error) console.error(d.professional_id, error.message);
  else { updated++; console.log("reconciled", d.professional_id); }
}
console.log("Updated:", updated);
