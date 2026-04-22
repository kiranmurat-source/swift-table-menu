/**
 * Slug conventions for Tabbled restaurants.
 *
 * Draft slugs follow the pattern `temp-{identifier}` during the onboarding
 * wizard. The wizard replaces the draft slug with a real, user-chosen slug
 * on completion.
 *
 * IMPORTANT: DRAFT_SLUG_PREFIX must match the prefix used by the Supabase
 * auth trigger that provisions new restaurants on Google signup. That
 * trigger currently lives in the Supabase Dashboard (production DB only)
 * and is mirrored into supabase/migrations/ as a version-controlled copy.
 * Changing this prefix requires updating BOTH the trigger in Supabase AND
 * this constant in a single coordinated deploy.
 *
 * All producers and consumers of this convention MUST go through this
 * module — do not test for the prefix string inline.
 */

const DRAFT_SLUG_PREFIX = 'temp-';

/**
 * Returns true if the given slug was created by the signup funnel and the
 * restaurant has not yet finished onboarding. Safe with null / undefined.
 */
export function isDraftSlug(slug: string | null | undefined): boolean {
  return typeof slug === 'string' && slug.startsWith(DRAFT_SLUG_PREFIX);
}

/**
 * Creates a new draft slug using a random identifier. Intended for future
 * TS-side producers (e.g. if we ever move the signup trigger out of the
 * database). Not currently used by production code — the DB trigger is
 * the sole producer today.
 */
export function createDraftSlug(): string {
  const uuid =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `${DRAFT_SLUG_PREFIX}${uuid}`;
}

/**
 * SQL LIKE pattern matching the draft slug prefix. Exported so that any
 * future migration or Edge Function SQL speaks the same convention.
 */
export const DRAFT_SLUG_SQL_PATTERN = `${DRAFT_SLUG_PREFIX}%`;
