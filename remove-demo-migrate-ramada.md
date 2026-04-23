# Migrate Demo Flow: Remove /menu/demo, Use Ramada Menu as Primary Demo

## Project Context

**This is a Vite + React + TypeScript project using vite-react-ssg, NOT Next.js.** Do not apply Next.js conventions or validators.

## Background

Tabbled currently has two demo surfaces:
- `/menu/demo` — hardcoded demo data, SSG-prerendered, 4 CTAs link here
- `/menu/ramada-encore-bayrampasa` — real active customer, SPA only, 1 CTA links here (WhyNowSection)

Decision: Consolidate to Ramada as the single demo surface. Kill `/menu/demo` entirely. All CTAs point to Ramada. Add Ramada to SSG prerender list (via Supabase fetch of active restaurants).

Benefits:
- Consistent marketing narrative: "This is our active customer's live menu"
- Single URL to maintain, single schema, single breadcrumb
- No more hardcoded demo data drift
- Restaurant Schema indexed via SSG (not JS render dependency)
- New active customers auto-prerendered on next deploy

## Scope — 5 Changes in One Commit

This is all one deploy because the changes are interdependent. A half-done state (e.g., demo deleted but CTAs still pointing to it) would create 410 errors for users.

### Change 1 — Remove demo bypass from PublicMenu.tsx

File: `src/pages/PublicMenu.tsx`

Locate the block around line 404 that starts with `// Static demo bypass:`:

```typescript
// Static demo bypass: /menu/demo loads hardcoded data, no Supabase calls.
if (slug === 'demo') {
  setRestaurant(demoRestaurant as unknown as Restaurant);
  setCategories(demoCategories as unknown as MenuCategory[]);
  setItems(demoItems as unknown as MenuItem[]);
  setPromos([]);
  const t = setTimeout(() => setLoading(false), LOADING_MIN_MS);
  return () => clearTimeout(t);
}
```

**Delete this entire block.** After deletion, the `fetchData` call below (Supabase query) will execute for any slug, including `demo`. Since no `demo` record exists in Supabase, `/menu/demo` will naturally fall through to the "restaurant not found" state — but we handle that via 410 Gone redirect (Change 4), so users never see the fallback state.

Also remove the import at the top of the file:

```typescript
import { demoRestaurant, demoCategories, demoItems } from '../data/demoMenuData';
```

Verify no other references to `demoRestaurant`, `demoCategories`, or `demoItems` exist in the file after deletion:

```bash
grep -n "demoRestaurant\|demoCategories\|demoItems" src/pages/PublicMenu.tsx
# Expected: empty
```

### Change 2 — Delete demoMenuData.ts

```bash
rm src/data/demoMenuData.ts
```

Verify no other file imports from it:

```bash
grep -rn "demoMenuData" src/ --include="*.tsx" --include="*.ts"
# Expected: empty (after Change 1, this should be the case)
```

If any file still references `demoMenuData`, remove that import and usage too. Report back before proceeding.

### Change 3 — Update 5 CTAs to point to Ramada

Replace `/menu/demo` with `/menu/ramada-encore-bayrampasa` in these 5 files:

| File | Line (approx) | Current | New |
|---|---|---|---|
| `src/components/HeroSection.tsx` | ~61 | `href="/menu/demo"` | `href="/menu/ramada-encore-bayrampasa"` |
| `src/components/BlogCTA.tsx` | ~57 | `href="/menu/demo"` | `href="/menu/ramada-encore-bayrampasa"` |
| `src/components/landing/FeaturesSection.tsx` | ~99 | `href="/menu/demo"` | `href="/menu/ramada-encore-bayrampasa"` |
| `src/components/landing/LandingFooter.tsx` | ~68 | `href="/menu/demo"` | `href="/menu/ramada-encore-bayrampasa"` |
| `src/pages/Contact.tsx` | ~134 | `href="/menu/demo"` | `href="/menu/ramada-encore-bayrampasa"` |

**Note on WhyNowSection.tsx:** Already uses Ramada URL (`DEMO_MENU_URL` constant). Do not change it.

**Note on button text:** Some CTAs say "Demo Menüyü Gör" or "Canlı Demo Gör" — keep existing text. The URL change alone is sufficient. Do NOT modify button labels unless explicitly asked in a separate task.

Verification:

```bash
grep -rn "menu/demo" src/ --include="*.tsx" --include="*.ts"
# Expected: ZERO matches (all 5 replaced + no other references)
# EXCEPT: routes.tsx should also lose "menu/demo" (handled in Change 5)
```

### Change 4 — Add /menu/demo → Ramada 410 Gone (NOT redirect)

Wait — user decided **"kaldır"** (remove), which was interpreted as 410 Gone earlier in the conversation when I asked. Re-confirming the decision: **410 Gone**, same pattern as `/lander` and `/manufacture-automatization`.

Reasoning: `/menu/demo` was a generic throwaway URL with hardcoded fake data. It doesn't carry meaningful link equity worth redirecting. A clean 410 ("this URL is gone, forget it") is cleaner than redirecting to a customer-specific URL that happens to serve as demo.

Add to `vercel.json` `rewrites` block (at the top, before `/menu/:path*` catch-all):

```json
{ "source": "/menu/demo", "destination": "/api/gone/menu-demo" }
```

The existing `api/gone/[slug].ts` Edge Function handles this — the `[slug]` pattern accepts any value and returns 410. No new Edge Function needed.

**Current `vercel.json` rewrites order (for reference, maintain this order):**

```json
{
  "rewrites": [
    { "source": "/lander", "destination": "/api/gone/lander" },
    { "source": "/manufacture-automatization", "destination": "/api/gone/manufacture-automatization" },
    { "source": "/menu/demo", "destination": "/api/gone/menu-demo" },
    { "source": "/sitemap.xml", "destination": "https://..." },
    { "source": "/blog", "destination": "/blog.html" },
    ... (rest unchanged) ...
  ]
}
```

The `/menu/demo` rewrite must come BEFORE `/menu/:path*` (the SPA catch-all), otherwise the catch-all will intercept it first.

### Change 5 — Update getStaticPaths to fetch from Supabase

File: `src/routes.tsx`

Current:

```typescript
{
  path: "menu/:slug",
  Component: PublicMenu,
  getStaticPaths: () => ["menu/demo"],
},
```

New — use async Supabase fetch:

```typescript
{
  path: "menu/:slug",
  Component: PublicMenu,
  getStaticPaths: async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
    const { data, error } = await supabase
      .from('restaurants')
      .select('slug')
      .eq('is_active', true);
    
    if (error || !data) {
      console.warn('[SSG] Failed to fetch active restaurants for prerender:', error);
      return []; // Fall back to SPA for all menu routes
    }
    
    return data.map(r => `menu/${r.slug}`);
  },
},
```

**Why this pattern:**
- Build-time Supabase fetch — runs once per deploy
- Only prerenders `is_active = true` restaurants (inactive/deleted ones stay SPA)
- Graceful fallback: if Supabase is down during build, returns empty array, menu routes stay SPA (no build crash)
- Each new active customer automatically joins the SSG roster on next deploy
- Dynamic import keeps the Supabase client out of the client bundle

**Environment variable check:**

Before running `npm run build`, verify these env vars exist in `.env` or Vercel dashboard:

```bash
# Check locally
echo "VITE_SUPABASE_URL: ${VITE_SUPABASE_URL:-NOT SET}"
echo "VITE_SUPABASE_ANON_KEY: ${VITE_SUPABASE_ANON_KEY:+SET}${VITE_SUPABASE_ANON_KEY:-NOT SET}"
```

If not set locally, the build might fail or fall back to empty paths (graceful). Vercel's production build should have these set — Memory note: "Supabase env var hardening" was a prior lesson; env vars exist in Vercel.

**Expected build output:**

After this change, `npm run build` should prerender:
- All existing 17 pages (landing, /blog, 10 blog posts, /iletisim, /privacy)
- `dist/menu/ramada-encore-bayrampasa.html` (new)

Total: 18 SSG pages (previously 18 with `/menu/demo.html`, now 18 with `/menu/ramada-encore-bayrampasa.html`). Net neutral count.

## Build & Test

```bash
npm run build 2>&1 | tail -20
```

Expected:
- Build completes in ~22-25s (slight increase due to Supabase fetch)
- Output includes `dist/menu/ramada-encore-bayrampasa.html`
- `dist/menu/demo.html` NOT in output (verify: `ls dist/menu/`)

### Verification Commands

```bash
echo "=== 1. Ramada menu is prerendered ===" && \
ls -la /opt/khp/tabbled/dist/menu/
# Expected: ramada-encore-bayrampasa.html exists, demo.html does NOT exist

echo "" && echo "=== 2. Static HTML has Ramada-specific content ===" && \
grep -oE '<title[^>]*>[^<]+</title>' /opt/khp/tabbled/dist/menu/ramada-encore-bayrampasa.html | head -1
# Expected: contains "Ramada" or the restaurant's actual name

echo "" && echo "=== 3. Restaurant Schema in static HTML ===" && \
grep -c '"@type":"Restaurant"' /opt/khp/tabbled/dist/menu/ramada-encore-bayrampasa.html
# Expected: 1 (Restaurant Schema embedded in SSG output, not requiring JS render)

echo "" && echo "=== 4. All CTAs updated (zero /menu/demo references) ===" && \
grep -rn "menu/demo" /opt/khp/tabbled/src/ --include="*.tsx" --include="*.ts"
# Expected: empty

echo "" && echo "=== 5. demoMenuData deleted ===" && \
ls /opt/khp/tabbled/src/data/demoMenuData.ts 2>/dev/null && echo "STILL EXISTS — REMOVE" || echo "Deleted ✓"
```

## Stop for Review

After build passes and verification looks correct, **STOP. DO NOT COMMIT OR PUSH.** Show the diff and verification output. Wait for Murat's approval before pushing.

## Commit & Deploy (Only After Approval)

```bash
git add src/pages/PublicMenu.tsx \
        src/components/HeroSection.tsx \
        src/components/BlogCTA.tsx \
        src/components/landing/FeaturesSection.tsx \
        src/components/landing/LandingFooter.tsx \
        src/pages/Contact.tsx \
        src/routes.tsx \
        vercel.json
git rm src/data/demoMenuData.ts

git commit -m "feat(demo): consolidate to Ramada as primary demo, remove /menu/demo

- Removed hardcoded /menu/demo surface: demoMenuData.ts deleted, demo bypass
  in PublicMenu.tsx removed.
- 5 CTAs (Hero, BlogCTA, Features, Footer, Contact) updated to point at
  /menu/ramada-encore-bayrampasa.
- /menu/demo now returns HTTP 410 Gone via existing api/gone/[slug].ts Edge
  Function (vercel.json rewrite added).
- getStaticPaths now fetches active restaurants from Supabase at build time,
  automatically prerendering Ramada and any future active customers. Falls
  back to empty paths (SPA) on Supabase failure.

SEO impact:
- Restaurant Schema now in static HTML for Ramada (was runtime-only JS-render
  dependency).
- Consistent marketing narrative: all 'Demo Gör' CTAs land on live active
  customer's real menu.
- /menu/demo will be deindexed by Google within 1-4 weeks via 410 signal."

git push origin main
```

## Post-Deploy Verification

Wait 1-2 min for Vercel auto-deploy. Note: **build will take slightly longer** because of Supabase fetch.

```bash
echo "=== 1. /menu/demo returns 410 ===" && \
curl -sI https://tabbled.com/menu/demo | head -3
# Expected: HTTP/2 410

echo "" && echo "=== 2. /menu/demo 410 (HEAD also) ===" && \
curl -s -o /dev/null -w "GET: %{http_code}\n" https://tabbled.com/menu/demo
# Expected: GET: 410

echo "" && echo "=== 3. Ramada page returns 200 ===" && \
curl -sI https://tabbled.com/menu/ramada-encore-bayrampasa | head -3
# Expected: HTTP/2 200

echo "" && echo "=== 4. Ramada title is restaurant-specific (not generic landing) ===" && \
curl -s https://tabbled.com/menu/ramada-encore-bayrampasa | grep -oE '<title[^>]*>[^<]+</title>' | head -1
# Expected: contains restaurant name, NOT "Tabbled — Restoran Dijital Menü Platformu"

echo "" && echo "=== 5. Restaurant Schema in initial HTML (no JS needed) ===" && \
curl -s https://tabbled.com/menu/ramada-encore-bayrampasa | grep -oE '"@type":"Restaurant"'
# Expected: "@type":"Restaurant" appears at least once

echo "" && echo "=== 6. Regression: other SSG pages still work ===" && \
for url in / /blog /blog/qr-menu-zorunlulugu-2026 /iletisim /privacy; do
  status=$(curl -sI "https://tabbled.com$url" | head -1)
  echo "$url → $status"
done
# Expected: All HTTP/2 200

echo "" && echo "=== 7. Landing CTAs no longer reference /menu/demo ===" && \
curl -s https://tabbled.com/ | grep -oE 'href="/menu/[^"]+"' | sort -u
# Expected: only /menu/ramada-encore-bayrampasa references (no /menu/demo)
```

## Rollback Plan

If anything breaks:

```bash
git revert HEAD
git push origin main
```

The revert restores demoMenuData.ts (git tracks deletions), restores demo bypass, restores CTAs, removes /menu/demo 410 rewrite. Full rollback.

**Supabase fetch in build:** If Vercel build fails due to Supabase env vars missing, the graceful fallback returns empty paths (SPA for all menus). Build won't crash. But if it does crash unexpectedly, revert.

## Notes for Reviewer (Murat)

After this prompt completes and pushes:

1. **Google Search Console removal** (optional): Request temporary removal of `https://tabbled.com/menu/demo` to speed up deindex. 410 alone works in 1-4 weeks; removal accelerates to 24-48h.

2. **sitemap.xml auto-update:** The existing sitemap Edge Function (`supabase/functions/sitemap`) fetches active restaurants from Supabase. Ramada will now appear in sitemap (if not already). `/menu/demo` should NOT appear — verify by visiting `https://tabbled.com/sitemap.xml`.

3. **Bonus observation:** The existing `api/gone/[slug].ts` Edge Function handles `/menu/demo` gracefully — no new function needed. Reusing the pattern from commit `8fdb862`.

4. **Future customers:** When a new restaurant becomes active (`is_active = true` in Supabase), it will be automatically prerendered on the next deploy. No manual `routes.tsx` edit needed.
