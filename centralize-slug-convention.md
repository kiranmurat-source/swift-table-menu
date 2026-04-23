# TABBLED — Centralize `temp-` Slug Convention into `src/lib/slug.ts`

## PROJECT CONTEXT

- Tabbled production SaaS, 24 days to hard launch (15 May)
- VPS: `/opt/khp/tabbled/` on `root@168.119.234.186`
- Stack: React + Vite + TypeScript + Supabase
- Active customer: Ramada Encore — `tabbled.com/menu/ramada-encore-bayrampasa`

## CURRENT STATE

On April 21, the self-serve onboarding funnel shipped. New Google signups create a draft restaurant row with `slug = "temp-{uuid}"`. The Dashboard onboarding guard (hardened earlier today) decides whether to redirect to the wizard based on `slug?.startsWith('temp-')`.

**The problem:** The string literal `'temp-'` is a convention — an implicit contract between the wizard (which creates rows with this prefix) and the guard (which tests for this prefix). That contract is not written down anywhere in code. It lives as a magic string in at least two places, possibly more.

If someone changes the prefix in one place (e.g. the wizard starts using `'draft-'` or `'new-'`) without changing the other, the guard fails silently and an existing customer gets locked out of admin again. This is exactly the class of regression that locked Ramada out yesterday.

**The fix:** Extract the convention into a single source of truth: `src/lib/slug.ts`. Every producer and consumer of this convention imports from one place. The convention can't drift.

---

## TASK

Create a helper module and migrate all callsites. Two phases.

### Phase 1 — Discovery (REPORT ONLY, no edits yet)

Before writing any code, find every place the `'temp-'` convention lives. Run:

```bash
cd /opt/khp/tabbled
grep -rn "temp-" src/ supabase/ --include="*.ts" --include="*.tsx"
```

Also check for related patterns that might be part of this same convention:

```bash
grep -rn "startsWith('temp" src/ --include="*.ts" --include="*.tsx"
grep -rn "LIKE 'temp" src/ supabase/ --include="*.ts" --include="*.tsx" --include="*.sql"
grep -rn "crypto.randomUUID\|nanoid" src/ --include="*.ts" --include="*.tsx"
```

**Report back a list of every occurrence, grouped by file.** Categorize each:
- **Producer** — code that creates slugs with the `temp-` prefix (likely in signup/wizard)
- **Consumer** — code that checks if a slug is a draft (guard, filters, admin UI)
- **Unrelated** — false positives (variable names like `temp_value`, comments, etc.)

Wait for my confirmation on the list before Phase 2. Do not edit any file yet.

### Phase 2 — Implementation (after I confirm Phase 1 list)

**Step 1 — Create `src/lib/slug.ts`:**

```typescript
/**
 * Slug conventions for Tabbled restaurants.
 *
 * Draft slugs follow the pattern `draft-{identifier}` during the onboarding wizard.
 * The wizard replaces the draft slug with a real, user-chosen slug on completion.
 * All producers (signup, wizard) and consumers (guards, filters) of this convention
 * MUST go through this module — do not test for the prefix string inline.
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
 * Creates a new draft slug using a random identifier. Used by signup /
 * onboarding flows when provisioning a restaurant row before the user has
 * chosen a real slug.
 */
export function createDraftSlug(): string {
  // crypto.randomUUID is available in modern browsers and Node 19+.
  // Supabase Edge Functions run Deno, which also provides it.
  const uuid =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `${DRAFT_SLUG_PREFIX}${uuid}`;
}

/**
 * The SQL pattern used in `WHERE slug LIKE ?` queries. Exported so that
 * migrations and Edge Functions speak the same language as the client.
 */
export const DRAFT_SLUG_SQL_PATTERN = `${DRAFT_SLUG_PREFIX}%`;
```

**Step 2 — Migrate every callsite found in Phase 1:**

- **Producers** → replace literal string construction (e.g. `` `temp-${uuid}` ``) with `createDraftSlug()`
- **Consumers in TS/TSX** → replace inline checks (e.g. `slug?.startsWith('temp-')`) with `isDraftSlug(slug)`
- **Consumers in SQL** (migration files, Edge Functions using raw SQL) → leave the literal `'temp-%'` in place **but** add a comment referencing `DRAFT_SLUG_SQL_PATTERN` in the TS layer. Example:
  ```sql
  -- Keep in sync with DRAFT_SLUG_PREFIX in src/lib/slug.ts
  UPDATE restaurants SET ... WHERE slug LIKE 'temp-%';
  ```

**Step 3 — Dashboard.tsx guard rewrite:**

The guard currently reads:
```typescript
!data.restaurant_id ||
(!data.restaurant?.onboarding_completed_at &&
 data.restaurant?.slug?.startsWith('temp-'));
```

Rewrite to:
```typescript
!data.restaurant_id ||
(!data.restaurant?.onboarding_completed_at &&
 isDraftSlug(data.restaurant?.slug));
```

And add the import: `import { isDraftSlug } from '@/lib/slug';`

---

## GENERAL RULES

1. **Do not change behavior.** This is a pure refactor — every producer must still produce `temp-*` slugs, every consumer must still match them. The only functional change is that both sides now agree via a shared module.
2. **Do not change the prefix value.** It stays `'temp-'`. We are centralizing, not renaming. A prefix rename is a separate decision for a later sprint.
3. Preserve all existing imports, types, and surrounding code. Minimum edits.
4. Build must pass after Phase 2: `npm run build`.
5. Do **not** `git push`. Stop after build passes and report back.
6. If Phase 1 reveals a producer or consumer pattern I didn't anticipate (e.g. in an Edge Function, a migration, or a test file), **stop and report before migrating it.** I want to see what's out there before we touch it.

---

## TEST CHECKLIST

After Phase 2, confirm:

- [ ] `src/lib/slug.ts` exists and exports `isDraftSlug`, `createDraftSlug`, `DRAFT_SLUG_SQL_PATTERN`
- [ ] Every producer from Phase 1 now calls `createDraftSlug()`
- [ ] Every TS/TSX consumer from Phase 1 now calls `isDraftSlug()`
- [ ] SQL callsites have a sync comment pointing at `src/lib/slug.ts`
- [ ] `Dashboard.tsx` guard imports and uses `isDraftSlug()`
- [ ] `grep -rn "'temp-'" src/` returns **only** `src/lib/slug.ts`
- [ ] `grep -rn "startsWith('temp" src/` returns **zero** results
- [ ] `npm run build` clean

---

## REPORT BACK

**After Phase 1:** Paste the grep output, categorized (producer / consumer / unrelated). Wait for my confirmation.

**After Phase 2:** Report:
1. Files created (path)
2. Files modified (path + short description)
3. Callsites remaining with raw `'temp-'` literals (should only be `src/lib/slug.ts` and SQL files)
4. Build output tail (last 5 lines)
5. Any surprise

Do not push.
