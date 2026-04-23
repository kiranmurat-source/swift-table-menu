# TABBLED — Phase 2: Centralize Slug Convention + Mirror DB Trigger

## PROJECT CONTEXT

- Tabbled production SaaS, 24 days to hard launch (15 May)
- VPS: `/opt/khp/tabbled/` on `root@168.119.234.186`
- Stack: React + Vite + TypeScript + Supabase
- Active customer: Ramada Encore — `tabbled.com/menu/ramada-encore-bayrampasa`
- Supabase project: `qmnrawqvkwehufebbkxp`

## CONTEXT FROM PHASE 1

Phase 1 discovery revealed:
- **Producer is NOT in TypeScript code** — the `temp-{uuid}` slug is produced by a Supabase trigger/function deployed manually through the Supabase Dashboard. It is NOT version-controlled in this repo.
- **Consumers are two TypeScript files**:
  - `src/pages/Dashboard.tsx` — onboarding guard (hardened earlier today to use `slug?.startsWith('temp-')`)
  - `src/pages/Onboarding.tsx:267` — input default value reset ("if draft slug, show empty input so user types a real one")
- No TS producer exists. No existing SQL migration file for this trigger exists in `supabase/migrations/`.

Given this reality, the refactor has two goals:

1. **Step A** — Centralize the TS-side convention so the two consumers agree via a single module.
2. **Step B** — Bring the DB producer under version control by mirroring the production trigger into `supabase/migrations/`.

Both steps reduce drift risk. Step B is the bigger win long-term (version-control dark production code) but has CLI / auth unknowns. Step A is safe and cheap.

---

## DECISION: Proceed with both steps, sequentially, with hard stops between them.

Do not combine. Do not skip verification between steps.

---

## STEP A — TypeScript Refactor

### A.1 — Create `src/lib/slug.ts`

```typescript
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
```

### A.2 — Migrate `src/pages/Dashboard.tsx` guard

Current guard (from earlier today):
```typescript
!data.restaurant_id ||
(!data.restaurant?.onboarding_completed_at &&
 data.restaurant?.slug?.startsWith('temp-'));
```

Replace with:
```typescript
!data.restaurant_id ||
(!data.restaurant?.onboarding_completed_at &&
 isDraftSlug(data.restaurant?.slug));
```

Add import at top of file:
```typescript
import { isDraftSlug } from '@/lib/slug';
```

### A.3 — Migrate `src/pages/Onboarding.tsx:267`

The line currently contains an inline check like `slug?.startsWith('temp-')` (or similar — verify exact form before editing). Replace the inline check with `isDraftSlug(slug)`. Add the same import.

**Preserve behavior exactly.** If the line reads `slug?.startsWith('temp-') ? '' : slug`, it becomes `isDraftSlug(slug) ? '' : slug`. Do not change the surrounding logic, do not change what happens on true/false branches.

### A.4 — Build and verify

```bash
cd /opt/khp/tabbled
npm run build
```

### A.5 — Grep verification

```bash
grep -rn "'temp-'" src/
grep -rn "startsWith('temp" src/
```

Expected:
- `'temp-'` appears ONLY in `src/lib/slug.ts`
- `startsWith('temp` returns ZERO results

### A.6 — REPORT AND STOP

Report back:
1. Files created: `src/lib/slug.ts`
2. Files modified: exact paths + line numbers of changed lines
3. Build output (last 5 lines)
4. Grep verification output (both greps)
5. Exact form of the `Onboarding.tsx:267` line before and after

**DO NOT proceed to Step B yet. DO NOT commit. DO NOT push. Wait for confirmation.**

---

## STEP B — DB Trigger Mirror (only after Step A is confirmed)

Goal: Extract the production Supabase trigger/function that produces `temp-{uuid}` slugs and commit it as a version-controlled migration file. The file is a READ-ONLY MIRROR of production — we never run it against the database, we just keep it in git so future changes are visible.

### B.1 — Check Supabase CLI availability

```bash
which supabase
supabase --version
```

If not installed, STOP and report. Do not attempt to install — Murat will decide whether to install or fall back to a manual Dashboard export.

### B.2 — Check authentication

```bash
cd /opt/khp/tabbled
supabase projects list 2>&1 | head -20
```

If this fails with an auth error (requires `supabase login` or access token), STOP and report. Do not attempt to log in. Murat will provide access token or switch to manual export path.

### B.3 — Dump schema (if A.1 and A.2 both succeeded)

```bash
supabase db dump --project-ref qmnrawqvkwehufebbkxp --schema=public --schema=auth > /tmp/tabbled-schema.sql 2>&1
```

If this command fails, STOP and report the error.

If it succeeds, check the output:

```bash
wc -l /tmp/tabbled-schema.sql
grep -n "temp-" /tmp/tabbled-schema.sql | head -20
grep -n "handle_new_user\|create.*restaurant\|on_auth_user_created" /tmp/tabbled-schema.sql | head -20
```

Expected: The trigger/function that produces `temp-{uuid}` appears in the dump, plus any function body containing the string `'temp-'`.

### B.4 — Extract the relevant pieces

From `/tmp/tabbled-schema.sql`, extract ONLY:
- The trigger definition that fires on auth user creation (likely named something like `on_auth_user_created`)
- The function that trigger calls (likely `handle_new_user` or similar)
- Any related sequence or helper if directly referenced

Do NOT include:
- Other triggers
- Other functions
- Table definitions
- RLS policies
- Anything unrelated to draft slug creation

If you can't confidently identify which pieces belong to the draft slug creation flow, STOP and report the full set of candidates. Murat will pick.

### B.5 — Write the migration file

Create `supabase/migrations/20260422120000_draft_slug_trigger.sql`:

```sql
-- ============================================================================
-- DRAFT SLUG TRIGGER — PRODUCTION MIRROR
-- ============================================================================
--
-- This file is a version-controlled mirror of the trigger/function currently
-- live in Supabase production (project qmnrawqvkwehufebbkxp). It was
-- extracted on 2026-04-22 to bring the database-side producer of the
-- `temp-{uuid}` slug convention under version control.
--
-- DO NOT RUN `supabase db push` WITH THIS FILE.
-- The production database already contains this trigger — pushing would
-- either no-op (if identical) or create conflicts (if it has drifted).
--
-- Workflow going forward:
--   1. To change this trigger, edit this file FIRST
--   2. Then manually paste the new version into the Supabase SQL Editor
--   3. Verify the change in staging / test restaurant, then commit
--
-- The TypeScript mirror of the prefix constant lives in
-- `src/lib/slug.ts` (DRAFT_SLUG_PREFIX). Keep both in sync.
-- ============================================================================

-- [ PASTE EXTRACTED TRIGGER + FUNCTION HERE ]
```

Replace the placeholder comment with the actual extracted SQL from B.4.

### B.6 — Build is not affected by this file

The `supabase/migrations/` folder is not touched by `npm run build`. No build test needed for this step. Just verify the file exists and is readable:

```bash
ls -la supabase/migrations/20260422120000_draft_slug_trigger.sql
head -30 supabase/migrations/20260422120000_draft_slug_trigger.sql
tail -20 supabase/migrations/20260422120000_draft_slug_trigger.sql
```

### B.7 — REPORT AND STOP

Report back:
1. Supabase CLI version
2. Whether auth worked first try
3. Dump file size and relevant grep counts
4. Which pieces were extracted (full names of trigger + function)
5. Which pieces were candidates but NOT included (if ambiguous)
6. First 30 lines and last 20 lines of the final migration file

**DO NOT commit. DO NOT push. DO NOT run `supabase db push`. Wait for confirmation.**

---

## GENERAL RULES

1. Step A completes fully and is verified before Step B begins.
2. Any step failure → STOP and report. Do not improvise.
3. Never run `git push`, `git commit`, `supabase db push`, or `supabase migration up` at any point in this task.
4. Never install new packages or CLI tools.
5. If any command returns an unexpected error, report it verbatim instead of guessing.
6. Preserve existing imports, formatting, and surrounding code in all TS files. Minimum edits only.

---

## WHAT SUCCESS LOOKS LIKE

After Step A:
- `src/lib/slug.ts` exists with helpers
- `Dashboard.tsx` and `Onboarding.tsx` use `isDraftSlug()`
- `grep 'temp-' src/` shows only `slug.ts`
- Build clean

After Step B:
- `supabase/migrations/20260422120000_draft_slug_trigger.sql` exists and contains the production trigger + function
- File has the warning header (DO NOT RUN `supabase db push`)
- Nothing on production changed

Two separate commits will be made by Murat after both steps are confirmed:
- `refactor(slug): centralize draft slug convention into src/lib/slug.ts`
- `chore(db): mirror production draft-slug trigger into migrations/`
