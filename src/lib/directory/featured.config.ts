/**
 * Featured-rotation config.
 *
 * Featured placement (homepage rail, city pages, profession pages, directory
 * filter) is a PERK of the paid tier — not a separately purchased add-on.
 *
 * Until enough paid pros exist in a scope, we backfill the rail with any
 * published pro that has an avatar so the section never looks empty.
 *
 * `FEATURED_PAID_THRESHOLD` is the only knob: when the paid pool in a scope
 * has STRICTLY MORE than this many pros, only paid pros are featured.
 */
export const FEATURED_PAID_THRESHOLD = 5;
