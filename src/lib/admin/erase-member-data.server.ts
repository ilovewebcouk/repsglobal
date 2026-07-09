// Shared PII/storage erasure for closed member accounts. Called from
// `_closeMembershipImpl` so every account-ending path (self-delete, admin
// close, Stripe cancel, uncollectible, chargeback lost) leaves the same
// footprint.
//
// Server-only — never import from a client-reachable module at top level.

export type ErasureMode =
  | "full_self_delete"
  | "membership_closed"
  | "chargeback_lost";

export interface EraseResult {
  ok: boolean;
  piiErased: boolean;
  storageBucketsCleared: string[];
  storageBucketsFailed: string[];
  piiError?: string;
}

/**
 * Storage buckets a member can own objects in. Path convention is
 * `<userId>/...`. `auth.users` FK cascade does NOT touch `storage.objects`,
 * so we clean these explicitly.
 */
const ALL_BUCKETS = [
  "avatars",
  "pro-photos",
  "identity-docs",
  "insurance-docs",
  "verification-docs",
  "support-attachments",
  "cpd-certificates",
] as const;

/**
 * Buckets to retain when the closure was triggered by a lost chargeback —
 * we may need identity/insurance evidence for the payment dispute record.
 */
const CHARGEBACK_RETAIN = new Set<string>([
  "identity-docs",
  "insurance-docs",
  "verification-docs",
]);

function bucketsForMode(mode: ErasureMode): string[] {
  if (mode === "chargeback_lost") {
    return ALL_BUCKETS.filter((b) => !CHARGEBACK_RETAIN.has(b));
  }
  return [...ALL_BUCKETS];
}

export async function eraseClosedMemberData(
  userId: string,
  opts: { erasureMode: ErasureMode },
): Promise<EraseResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const result: EraseResult = {
    ok: true,
    piiErased: false,
    storageBucketsCleared: [],
    storageBucketsFailed: [],
  };

  // PII scrub (enquiries, reviews, support_messages, support_tickets,
  // lead_activity — whatever the RPC covers today).
  try {
    const { error } = await supabaseAdmin.rpc("erase_user_pii", {
      _user_id: userId,
    });
    if (error) {
      result.ok = false;
      result.piiError = error.message;
      console.error("[eraseClosedMemberData] erase_user_pii failed", error);
    } else {
      result.piiErased = true;
    }
  } catch (e: any) {
    result.ok = false;
    result.piiError = e?.message ?? String(e);
    console.error("[eraseClosedMemberData] erase_user_pii threw", e);
  }

  // Storage scrub.
  const buckets = bucketsForMode(opts.erasureMode);
  await Promise.all(
    buckets.map(async (bucket) => {
      try {
        const { data: files } = await supabaseAdmin.storage
          .from(bucket)
          .list(userId, { limit: 1000 });
        if (!files || files.length === 0) {
          result.storageBucketsCleared.push(bucket);
          return;
        }
        const paths = files.map((f) => `${userId}/${f.name}`);
        const { error } = await supabaseAdmin.storage.from(bucket).remove(paths);
        if (error) throw error;
        result.storageBucketsCleared.push(bucket);
      } catch (e) {
        result.ok = false;
        result.storageBucketsFailed.push(bucket);
        console.warn(
          `[eraseClosedMemberData] storage cleanup failed for ${bucket}`,
          e,
        );
      }
    }),
  );

  return result;
}
