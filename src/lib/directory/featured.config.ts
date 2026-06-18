/**
 * Featured-rotation config.
 *
 * Featured placement (city pages, profession pages, directory `featured=true`
 * filter) is a PERK of the paid tier — never a paid add-on. The rail is also
 * a **quality bar**: a pro only appears if they've earned the slot. No
 * monograms, no stock photos, no thin profiles. If a scope can't fill the
 * minimum, we render NO rail rather than a weak one.
 */

/**
 * When the paid pool in a scope has strictly more than this many pros,
 * we feature paid pros only and stop backfilling.
 */
export const FEATURED_PAID_THRESHOLD = 5;

/**
 * Minimum quality score (0-100 as displayed in admin) for a pro to be
 * eligible for the featured rail. Filters out thin / migrated stubs.
 */
export const FEATURED_MIN_QUALITY = 60;

/**
 * Minimum eligible pros required to render a featured rail. Below this,
 * the rail is hidden on that page entirely.
 */
export const FEATURED_MIN_CARDS = 3;
