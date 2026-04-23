# Fix: Duplicate `<title>` and `<meta>` Tags in SSG Output (v2)

## Project Context

**This is a Vite + React + TypeScript project using vite-react-ssg, NOT Next.js.** Do not apply Next.js conventions or validators.

## Architecture (Confirmed via Discovery)

- `main.tsx` calls `ViteReactSSG({ routes })` — the library wraps the app and provides HelmetProvider internally
- `routes.tsx` defines `RouteRecord[]` with `App` as the layout component
- `App.tsx` is the layout (Outlet, Toaster, ConditionalWhatsApp etc.) — does NOT use Helmet itself
- Each page (Index.tsx, BlogPost.tsx, Contact.tsx, etc.) has its own `<Helmet>` block

**Important:** HelmetProvider is provided by `vite-react-ssg` internally. Do NOT add a manual `<HelmetProvider>` wrapper — it would conflict.

## Problem

All 18 SSG-prerendered pages have **two `<title>` tags and two `<meta name="description">` tags** in their HTML output:

```html
<head>
  <title data-rh="true">[Page-specific title from React Helmet]</title>          ← Correct
  <meta data-rh="true" name="description" content="[page description]">           ← Correct
  ...other Helmet tags...
  
  <title>Tabbled — Otel ve Restoranlar için QR Dijital Menü</title>              ← Duplicate from index.html template
  <meta name="description" content="Tabbled, Türkiye'deki...">                    ← Duplicate from index.html template
</head>
```

**Root cause:** `index.html` template (lines 8-9) has hardcoded `<title>` and `<meta name="description">` tags. vite-react-ssg adds React Helmet's tags during prerender but does NOT remove the original template tags. Both end up in the output.

**Affects:** All 18 SSG pages — landing, /blog, 10 blog posts, /iletisim, /privacy, /menu/demo. Verified.

## Fix

### Step 1 — Remove hardcoded tags from index.html

Edit `/opt/khp/tabbled/index.html`. Locate lines 8-9 (verified to exist):

```html
    <title>Tabbled — Otel ve Restoranlar için QR Dijital Menü</title>
    <meta name="description" content="Tabbled, Türkiye'deki restoran, kafe ve oteller için QR kod tabanlı dijital menü yönetim platformudur. Çok dilli menü, garson çağırma, WhatsApp sipariş ve müşteri yönetimi çözümleri sunar.">
```

**Delete both lines entirely.** Helmet provides these tags from each page's component during SSG prerender.

### Step 2 — Add fallback `<Helmet>` to App.tsx

For SPA-only routes (Login, Onboarding, Dashboard) that don't have their own `<Helmet>` blocks, add a top-level fallback in `App.tsx`. This uses Helmet's `defaultTitle` mechanism.

Edit `/opt/khp/tabbled/src/App.tsx`.

**Add import at the top:**
```tsx
import { Helmet } from "react-helmet-async";
```

**Modify the `App` component to wrap with a top-level `<Helmet>`:**

Current:
```tsx
const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <CookieBanner />
        <ConditionalWhatsApp />
        <Suspense fallback={<PageLoading />}>
          <Outlet />
        </Suspense>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);
```

Updated:
```tsx
const App = () => (
  <ErrorBoundary>
    <Helmet
      defaultTitle="Tabbled — Restoran Dijital Menü Platformu"
      titleTemplate="%s"
    >
      <meta name="description" content="Tabbled, Türkiye'deki restoran, kafe ve oteller için QR kod tabanlı dijital menü yönetim platformudur. Çok dilli menü, garson çağırma, WhatsApp sipariş ve müşteri yönetimi çözümleri sunar." />
    </Helmet>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <CookieBanner />
        <ConditionalWhatsApp />
        <Suspense fallback={<PageLoading />}>
          <Outlet />
        </Suspense>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);
```

**How this works:**
- `defaultTitle` is used when no child `<Helmet>` sets a title (only affects Login, Onboarding, Dashboard — they have no Helmet blocks)
- `titleTemplate="%s"` means "use child title as-is" without appending site name (pages already include "| Tabbled" in their meta titles where needed)
- Child page `<Helmet>` blocks override these defaults via react-helmet-async's normal precedence rules — no conflict
- The `<meta description>` here is also a fallback; pages with their own description override it

### Step 3 — Sanity check (no changes, verification only)

Confirm no `<title>` exists outside Helmet blocks in any page component:

```bash
grep -rn "<title>" /opt/khp/tabbled/src/ --include="*.tsx" --include="*.ts" | grep -v "Helmet\|test"
```

Expected: empty output (all `<title>` should be inside `<Helmet>` blocks). If anything appears, those need to be moved into Helmet. Based on prior discovery, none exist outside Helmet — this is just a final check.

## Build & Test

```bash
npm run build
```

Build should pass. Then verify the duplicate is gone:

```bash
echo "=== Build verification: counts should be 1 (was 2) ===" && \
for file in /opt/khp/tabbled/dist/index.html \
           /opt/khp/tabbled/dist/blog.html \
           /opt/khp/tabbled/dist/blog/qr-menu-zorunlulugu-2026.html \
           /opt/khp/tabbled/dist/iletisim.html \
           /opt/khp/tabbled/dist/privacy.html \
           /opt/khp/tabbled/dist/menu/demo.html; do
  if [ -f "$file" ]; then
    title_count=$(grep -c "<title" "$file")
    desc_count=$(grep -c 'name="description"' "$file")
    echo "$file → titles: $title_count, descriptions: $desc_count"
  else
    echo "$file → NOT FOUND"
  fi
done

echo "" && echo "=== Sample title outputs (should be page-specific) ===" && \
grep -oE '<title[^>]*>[^<]+</title>' /opt/khp/tabbled/dist/index.html
grep -oE '<title[^>]*>[^<]+</title>' /opt/khp/tabbled/dist/blog/qr-menu-zorunlulugu-2026.html
grep -oE '<title[^>]*>[^<]+</title>' /opt/khp/tabbled/dist/iletisim.html
```

**Expected after fix:**
- All 6 files: titles=1, descriptions=1
- Landing title: "Tabbled — Restoran Dijital Menü Platformu" (from Index.tsx Helmet)
- Blog post title: "Restoran Fiyat Etiketi Yönetmeliği 2026: QR Menü Zorunlu Mu?"
- İletişim title: "İletişim — Tabbled | 14 Gün Ücretsiz Deneyin"

## Stop for Review

After build passes and verification looks correct, **STOP. DO NOT COMMIT OR PUSH.** Show the diff and verification output. Wait for Murat's approval before pushing.

## Commit & Deploy (Only After Approval)

```bash
git add index.html src/App.tsx
git commit -m "fix(seo): remove duplicate <title> and <meta description> from SSG output

Root cause: index.html template had hardcoded <title> and <meta description>.
React Helmet was injecting per-page tags during SSG prerender, but template
tags were also kept, resulting in 2 of each tag in all 18 SSG output files.

Fix:
- Removed hardcoded <title> and <meta description> from index.html
- Added top-level <Helmet> in App.tsx with defaultTitle and fallback
  description, providing graceful default for SPA routes (login, onboarding,
  dashboard) that have no Helmet blocks of their own

Note: HelmetProvider is provided internally by vite-react-ssg — no manual
provider wrapping needed.

Affects all 18 SSG pages: landing, /blog, 10 blog posts, /iletisim, /privacy,
/menu/demo. SPA routes get the fallback title via defaultTitle.

SEO impact: Googlebot will now see a single, page-specific title and
description in search results. Resolves inconsistent search snippet rendering."

git push origin main
```

## Post-Deploy Verification

Wait 1-2 min, then:

```bash
echo "=== 1. Landing has SINGLE title ===" && \
curl -s https://tabbled.com/ | grep -oE '<title[^>]*>[^<]+</title>' | wc -l
# Expected: 1

echo "" && echo "=== 2. Landing title is page-specific ===" && \
curl -s https://tabbled.com/ | grep -oE '<title[^>]*>[^<]+</title>'
# Expected: "Tabbled — Restoran Dijital Menü Platformu"

echo "" && echo "=== 3. Blog post has SINGLE title ===" && \
curl -s https://tabbled.com/blog/qr-menu-zorunlulugu-2026 | grep -oE '<title[^>]*>[^<]+</title>' | wc -l
# Expected: 1

echo "" && echo "=== 4. Blog post title is correct ===" && \
curl -s https://tabbled.com/blog/qr-menu-zorunlulugu-2026 | grep -oE '<title[^>]*>[^<]+</title>'
# Expected: "Restoran Fiyat Etiketi Yönetmeliği 2026: QR Menü Zorunlu Mu?"

echo "" && echo "=== 5. Description count is 1 ===" && \
curl -s https://tabbled.com/blog/qr-menu-zorunlulugu-2026 | grep -c 'name="description"'
# Expected: 1

echo "" && echo "=== 6. Regression: all SSG pages still 200 ===" && \
for url in / /blog /blog/qr-menu-nedir /iletisim /privacy /menu/demo; do
  status=$(curl -sI "https://tabbled.com$url" | head -1)
  echo "$url → $status"
done
# Expected: All HTTP/2 200

echo "" && echo "=== 7. SPA route gets the fallback title ===" && \
curl -s https://tabbled.com/login | grep -oE '<title[^>]*>[^<]+</title>'
# Expected: "Tabbled — Restoran Dijital Menü Platformu" (defaultTitle from App.tsx)

echo "" && echo "=== 8. Iletisim title preserved ===" && \
curl -s https://tabbled.com/iletisim | grep -oE '<title[^>]*>[^<]+</title>'
# Expected: "İletişim — Tabbled | 14 Gün Ücretsiz Deneyin"
```

## What This Fix Does NOT Touch

- React Helmet usage in individual page components (already correct)
- Other meta tags Helmet sets (og:title, og:description, twitter:card, etc. — all working)
- The Organization + SoftwareApplication JSON-LD schema in landing (already there, working)
- vite-react-ssg config (no changes needed)
- Routing or SSG generation logic

## Rollback Plan

If anything breaks:
```bash
git revert HEAD
git push origin main
```

The change is minimal: 2 lines removed from index.html, ~5 lines added to App.tsx. Reverting both restores original behavior (back to duplicate tags, but functioning).

## Notes for Reviewer

- The duplicate `<title>` issue was discovered while building the blog rewrite (commit 8e7bd30). It is pre-existing — the blog rewrite did not introduce it.
- After this fix, Search Console will show cleaner page titles in search results within 1-2 weeks (when Google re-crawls).
- This completes the second SEO improvement of the day after the blog content rewrite.
