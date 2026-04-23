# TABBLED — Technical Debt Fix: Dashboard Guard + Video URL Guard

## PROJECT CONTEXT

- Production Tabbled.com — live QR digital menu SaaS
- VPS: `/opt/khp/tabbled/` on `root@168.119.234.186`
- Stack: React + Vite + TypeScript + shadcn/ui + Supabase
- Active customer: Ramada Encore by Wyndham İstanbul (menu live at `tabbled.com/menu/ramada-encore-bayrampasa`)
- 24 days to hard launch (May 15). Zero tolerance for customer-facing regressions.

## CURRENT STATE

Two independent but related issues both revealed by the April 21 session. SQL backfill already saved production, but code hardening is required to prevent recurrence.

### Issue 1 — Onboarding guard regression (HIGH PRIORITY)
`Dashboard.tsx` has an onboarding redirect check that currently only looks at `onboarding_completed_at`. Any existing restaurant row created before the wizard migration existed has `onboarding_completed_at = NULL` and was incorrectly swept into the new-signup wizard. Ramada got locked out of production admin. SQL backfill fixed existing rows, but the code still contains the weak guard. Next time someone runs a manual SQL migration that NULLs this column, or creates a row without setting it, the bug recurs.

**Principle:** Gate new behavior on a **positive signal** (`slug LIKE 'temp-%'` means "this was created by the signup funnel"), not on the absence of a new column.

### Issue 2 — `getOptimizedImageUrl` silently 404s on video URLs (MEDIUM PRIORITY)
The `getOptimizedImageUrl()` helper blindly rewrites any URL to Supabase's `/render/image/` path, including `.mp4` / `.webm` / `.mov` URLs. The browser then 404s and degrades to default media controls (the frozen play button bug fixed on April 21 in `PublicMenu.tsx` for splash/header). The splash/header fix bypassed the helper using `coverImageRaw`. But the root cause — the helper itself processing video URLs — is still there. Any future code that passes a video URL through this helper will silently 404 again.

**Principle:** The helper should early-return the raw URL when it detects a video extension. One line, high safety value.

---

## TASK

Apply both fixes in a single commit. Both are defensive, both are non-breaking.

### Fix 1: Dashboard.tsx onboarding guard

**File:** `src/pages/Dashboard.tsx`

**Find:** The current guard logic that decides whether to redirect to the onboarding wizard. It currently looks something like:

```typescript
const needsOnboarding = !data.restaurant?.onboarding_completed_at;
```

(Exact variable name may differ — `needsOnboarding`, `shouldOnboard`, `isOnboarding`, etc. Find the branch that decides "wizard vs admin panel".)

**Replace with:**

```typescript
const needsOnboarding =
  !data.restaurant_id ||
  (!data.restaurant?.onboarding_completed_at &&
   data.restaurant?.slug?.startsWith('temp-'));
```

**Semantics:**
- No restaurant linked → wizard (new user who hasn't been provisioned)
- Restaurant exists but wizard not completed AND slug is a draft (`temp-*`) → wizard (genuine in-progress signup)
- Restaurant exists with a real slug (e.g. `ramada-encore-bayrampasa`) → admin panel, regardless of `onboarding_completed_at` value

**Important:** Make sure `data.restaurant?.slug` is included in the Supabase query that fetches restaurant data. If not already selected, add `slug` to the `.select()` call. Verify before pushing.

### Fix 2: getOptimizedImageUrl video guard

**File:** Wherever `getOptimizedImageUrl` is defined. Likely `src/lib/supabase.ts` or `src/lib/utils.ts` or `src/lib/imageHelpers.ts`. Grep for the function definition:

```bash
grep -rn "export.*getOptimizedImageUrl\|function getOptimizedImageUrl\|const getOptimizedImageUrl" src/
```

**At the very top of the function body, before any existing logic, add:**

```typescript
// Video URLs bypass image transforms — browser fetches original
if (typeof url === 'string' && /\.(mp4|webm|mov)(\?|$)/i.test(url)) {
  return url;
}
```

**Semantics:**
- If the URL is a video extension (`.mp4`, `.webm`, `.mov`, with or without query params), return it untouched
- For everything else, run the existing image optimization logic

**Edge cases to verify:**
- `null` / `undefined` URLs still handled by existing code (the `typeof url === 'string'` check keeps it safe)
- Query strings like `?v=2` don't break the regex (the `(\?|$)` handles this)
- Case insensitive (`.MP4` still matches via `/i` flag)

---

## GENERAL RULES

1. Read both files fully before editing. Do not assume internal structure from this prompt.
2. If the onboarding guard lives in a utility function or React hook rather than inline in `Dashboard.tsx`, update it wherever it actually lives. Report where you found it.
3. Keep changes minimal — do not reformat surrounding code, do not rename variables, do not touch imports unless the fix requires it.
4. Build must pass: `npm run build` from `/opt/khp/tabbled`.
5. Do **not** `git push`. Stop after `npm run build` passes and report back. Murat handles the push manually.

---

## TEST CHECKLIST

Before reporting done, confirm each:

### Dashboard guard
- [ ] Found the guard logic — report the file and line number
- [ ] `data.restaurant?.slug` is present in the Supabase query (added if missing)
- [ ] New condition compiles without TypeScript errors
- [ ] No other place in `Dashboard.tsx` still uses the old single-condition guard
- [ ] `npm run build` clean

### Video URL guard
- [ ] Found `getOptimizedImageUrl` — report the file and line number
- [ ] Guard added at function top, before any existing logic
- [ ] Regex test passes mentally for: `foo.mp4`, `foo.MP4`, `foo.mp4?v=2`, `foo.webm`, `foo.mov`
- [ ] Regex test correctly excludes: `foo.jpg`, `foo.png.webp`, `foo.webp`, image URLs with query params
- [ ] `npm run build` clean

---

## PRIORITY ORDER

Do Fix 1 first (customer-facing regression risk), then Fix 2. Test build after each. Do not combine into a single edit that mixes both files — commit history should show two distinct intents even though we ship in one push.

---

## REPORT BACK

After build passes, report:
1. Exact file and line numbers for both edits
2. Whether `slug` needed to be added to the Supabase select (Fix 1)
3. Build output tail (last 5–10 lines, confirming clean)
4. Any surprise encountered

Do not push. Wait for confirmation.
