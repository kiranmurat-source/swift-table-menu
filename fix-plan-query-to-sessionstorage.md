# Fix: PricingSection.tsx — Replace ?plan= Query Params with sessionStorage

## Context

Google Search Console flagged `/iletisim?plan=premium` as a separately indexed URL (duplicate content with `/iletisim`). We deployed a `noindex, follow` header for `?plan=*` query strings (commit 8fdb862), which prevents future indexing — but the source links in `PricingSection.tsx` still emit these query strings, wasting crawl budget and signaling Google to keep checking them.

**Goal:** Strip query params from the visible URL while preserving plan-selection tracking through `sessionStorage`.

## Scope

**Modify:**
- `src/components/landing/PricingSection.tsx` — 3 links
- `src/pages/Iletisim.tsx` (or whatever the contact page is named) — read `sessionStorage` on mount and pre-fill form

**Do NOT modify:**
- `src/pages/RestaurantDashboard.tsx` — those 2 links (`?plan=basic&source=trial_expired` and `?plan=premium&source=upgrade_banner`) are behind auth and not crawled by Google. The `?source=` tracking is valuable analytics data for understanding upgrade funnel behavior. Leave them as-is.

## Task 1 — Update PricingSection.tsx

Find these 3 lines (approximate, exact line numbers may vary):

```tsx
// Line ~60
<a href="/iletisim?plan=basic">Başla</a>

// Line ~110
<a href="/iletisim?plan=premium">Başla</a>

// Line ~156
<a href="/iletisim?plan=enterprise">Başla</a>
```

Replace each with the equivalent `onClick` pattern:

```tsx
// Line ~60
<a 
  href="/iletisim"
  onClick={() => {
    try {
      sessionStorage.setItem('selected_plan', 'basic');
    } catch (e) {
      // sessionStorage may be unavailable in private browsing or with cookies disabled
    }
  }}
>
  Başla
</a>

// Line ~110
<a 
  href="/iletisim"
  onClick={() => {
    try {
      sessionStorage.setItem('selected_plan', 'premium');
    } catch (e) {}
  }}
>
  Başla
</a>

// Line ~156
<a 
  href="/iletisim"
  onClick={() => {
    try {
      sessionStorage.setItem('selected_plan', 'enterprise');
    } catch (e) {}
  }}
>
  Başla
</a>
```

**Important:**
- Keep `href="/iletisim"` (no query string) — this is what Google will see
- The `onClick` fires before navigation, so sessionStorage is set before the page transitions
- Wrap in `try/catch` because sessionStorage can throw in private browsing mode or when cookies are disabled
- The visible link in browser status bar will now show `tabbled.com/iletisim` (clean)

## Task 2 — Read sessionStorage in Iletisim Page

Find the contact page (likely `src/pages/Iletisim.tsx` or `src/pages/Contact.tsx` — search with `grep -l "iletisim" src/pages/` if unsure).

Look for the form component that has plan-related logic. Add a `useEffect` hook on mount to read `sessionStorage` and pre-fill the form's plan field.

If the form uses React state (typical pattern):

```tsx
import { useEffect } from 'react';

// Inside the component, after state declarations:
useEffect(() => {
  try {
    const selectedPlan = sessionStorage.getItem('selected_plan');
    if (selectedPlan && ['basic', 'premium', 'enterprise'].includes(selectedPlan)) {
      // Update whichever state field tracks the selected plan
      // Example: setSelectedPlan(selectedPlan);
      // Example: setFormData(prev => ({ ...prev, plan: selectedPlan }));
      
      // Optional: clear after reading so refresh doesn't re-apply
      sessionStorage.removeItem('selected_plan');
    }
  } catch (e) {
    // sessionStorage unavailable, ignore
  }
}, []);
```

**Key requirements:**
- Whitelist allowed values (`basic`, `premium`, `enterprise`) to prevent injection of arbitrary strings into form
- Use empty dependency array `[]` so it only runs on mount
- Optionally clear after reading to prevent stale data on refresh

**If the contact page currently reads `?plan=` from query string:**
Look for code like `useSearchParams()`, `URLSearchParams(window.location.search)`, or `searchParams.get('plan')`. Replace that logic with the sessionStorage read above. The query string is no longer the source of truth.

## Task 3 — Verify No Other Query Param Readers

Search for any other places that read `plan` from URL query string:

```bash
grep -rn "searchParams.get.*plan" src/
grep -rn "URLSearchParams.*plan" src/
grep -rn "useSearchParams" src/pages/Iletisim
```

If any are found, update them to use `sessionStorage.getItem('selected_plan')` instead.

## Build & Test

```bash
npm run build
```

Build should pass with no new warnings. If TypeScript complains about `sessionStorage` being undefined in SSR (since contact page is one of the SSG-prerendered pages), that's expected — the `try/catch` in `useEffect` handles it. `useEffect` only runs client-side.

## Commit & Deploy

```bash
git add src/components/landing/PricingSection.tsx src/pages/Iletisim.tsx
git commit -m "fix(seo): replace ?plan= query params with sessionStorage on landing CTAs

Landing PricingSection.tsx links no longer emit ?plan= query strings.
Plan selection now stored in sessionStorage via onClick handler.
Iletisim page reads sessionStorage on mount and pre-fills form.

Dashboard upgrade CTAs (RestaurantDashboard.tsx) intentionally unchanged
- they are behind auth and ?source= tracking is valuable analytics."
git push origin main
```

## Post-Deploy Verification

After Vercel auto-deploy (1-2 min), test that:

1. **Landing page CTA links are clean:**
   ```bash
   curl -s https://tabbled.com/ | grep -oE 'href="/iletisim[^"]*"' | sort -u
   ```
   Expected: only `href="/iletisim"` (no query strings). If you see `href="/iletisim?plan=..."` something didn't deploy.

2. **Manual click test:** Open https://tabbled.com/ in browser, scroll to pricing, hover over a "Başla" button — status bar should show `tabbled.com/iletisim` (no `?plan=`). Click it, form should still know which plan was selected (verify via DevTools: `sessionStorage.getItem('selected_plan')` was set).

3. **No regression:** Form submission with plan info should still work end-to-end.

## SEO Impact

After this fix:
- Google bot crawling landing page sees only `/iletisim` (one canonical URL)
- No more `?plan=basic`, `?plan=premium`, `?plan=enterprise` URLs to crawl
- Combined with the noindex header from commit 8fdb862, any old `?plan=` URLs already in Google's index will be deindexed within 2-4 weeks
- Crawl budget is freed up for actual content pages

## Rollback Plan

If anything breaks form pre-fill on Iletisim page, the rollback is straightforward — revert just the Iletisim.tsx change. The PricingSection.tsx change is harmless on its own (form just won't be pre-filled, user picks plan manually). No database or API changes involved.
