// Timeline provider abstraction.
//
// The Flight Recorder UI calls a single `loadMemberTimeline` interface so the
// underlying data source can change later (e.g. a dedicated event store)
// without the UI noticing. v1 ships a single SupabaseTimelineProvider that
// delegates to the existing `getMemberTimeline` server fn.

import type { MemberTimelineResult } from "./timeline.functions";
import { getMemberTimeline } from "./timeline.functions";

export interface MemberTimelineQuery {
  user_id: string;
  limit?: number;
}

export interface TimelineProvider {
  readonly id: string;
  load(query: MemberTimelineQuery): Promise<MemberTimelineResult>;
}

const SupabaseTimelineProvider: TimelineProvider = {
  id: "supabase",
  async load({ user_id, limit = 500 }) {
    return await getMemberTimeline({ data: { user_id, limit } });
  },
};

let activeProvider: TimelineProvider = SupabaseTimelineProvider;

export function resolveTimelineProvider(): TimelineProvider {
  return activeProvider;
}

/** For tests / future swap. Not used in production code. */
export function setTimelineProvider(p: TimelineProvider) {
  activeProvider = p;
}
