# Fix: Duplicate `<title>` and `<meta>` Tags in SSG Output

## Project Context

**This is a Vite + React + TypeScript project using vite-react-ssg, NOT Next.js.** Do not apply Next.js conventions or validators.

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

**Affects:** All 18 SSG pages — landing, /blog, 10 blog posts, /iletisim, /privacy, /menu/demo.

**Root cause:** `index.html` template (lines 8-9) has hardcoded `<title>` and `<meta name="description">` tags. vite-react-ssg adds React Helmet's tags during prerender but does NOT remove the original template tags. Both end up in the output.

**SEO impact:**
- Googlebot's behavior with multiple `<title>` is undefined — sometimes uses first, sometimes last, sometimes logs warnings
- Search results may show inconsistent titles (correct page-specific OR generic site title)
- Same issue for description: snippets may show wrong text
- Reduces CTR and looks unprofessional

## Verification (Run Before Fix to Confirm Diagnosis)

```bash
echo "=== Source: index.html lines 8-9 ===" && \
sed -n '8,9p' /opt/khp/tabbled/index.html

echo "" && echo "=== Built output: landing has 2 titles ===" && \
grep -c "<title" /opt/khp/tabbled/dist/index.html
# Expected: 2

echo "" && echo "=== Built output: blog post has 2 titles ===" && \
grep -c "<title" /opt/khp/tabbled/dist/blog/qr-menu-zorunlulugu-2026.html
# Expected: 2
```

## Discovery Already Confirmed

- ✅ `index.html` lines 8-9 have hardcoded `<title>` and `<meta description>`
- ✅ All 18 SSG pages emit duplicate tags after build
- ✅ Helmet is already setting these correctly per-page (`<title data-rh="true">`)
- ✅ HelmetProvider has no `defaultTitle` or `titleTemplate` prop
- ✅ Landing's `Index.tsx` uses `<Helmet>` and sets its own title
- ✅ All SSG-prerendered pages have their own Helmet (verified via earlier discovery)

## Fix

### Step 1 — Remove hardcoded tags from index.html

Edit `/opt/khp/tabbled/index.html`. Locate lines 8-9 which currently look like:

```html
    <title>Tabbled — Otel ve Restoranlar için QR Dijital Menü</title>
    <meta name="description" content="Tabbled, Türkiye'deki restoran, kafe ve oteller için QR kod tabanlı dijital menü yönetim platformudur. Çok dilli menü, garson çağırma, WhatsApp sipariş ve müşteri yönetimi çözümleri sunar.">
```

**Delete both lines entirely.** Helmet will provide these tags from each page's component.

### Step 2 — Add fallback defaultTitle to HelmetProvider (safety net)

For SPA-only routes (dashboard, login, onboarding) that don't have their own `<Helmet>` blocks, the page would otherwise have NO title at all without the template default. Add a fallback via HelmetProvider configuration.

Find where `HelmetProvider` is initialized (likely in `src/main.tsx` or `src/App.tsx`):

```bash
grep -rn "HelmetProvider" /opt/khp/tabbled/src/
```

Wherever `<HelmetProvider>` is rendered, ensure the root `<Helmet>` (or a fallback) provides defaults. The cleanest pattern:

In whichever file wraps the entire app (likely `src/App.tsx`), add a top-level `<Helmet>` BEFORE the router/routes:

```tsx
import { Helmet, HelmetProvider } from 'react-helmet-async';

// Inside the App component, before <Router> or <RouterProvider>:
<Helmet
  defaultTitle="Tabbled — Restoran Dijital Menü Platformu"
  titleTemplate="%s"
>
  <meta name="description" content="Tabbled, Türkiye'deki restoran, kafe ve oteller için QR kod tabanlı dijital menü yönetim platformudur." />
</Helmet>
```

**Notes:**
- `defaultTitle` is used when no child `<Helmet>` sets a title
- `titleTemplate="%s"` means "use the title as-is" (no append like "%s | Site Name") — pages already include "| Tabbled" in their meta titles where needed
- The fallback `<meta description>` is overridden by any page-level Helmet that sets its own description
- This is a single source of truth: the index.html no longer has duplicates, the HelmetProvider provides defaults for SPA routes

**If `<HelmetProvider>` is in `src/main.tsx`** (more common pattern with vite-react-ssg), add the wrapping `<Helmet>` either there or at the top of the route tree. Verify by checking what's in main.tsx vs App.tsx and choose the location that wraps ALL routes.

### Step 3 — Verify other places aren't double-injecting

Some pages might have their own redundant duplicate. Sanity check:

```bash
grep -rn "<title>" /opt/khp/tabbled/src/ --include="*.tsx" --include="*.ts" | head -20
```

Should only find `<title>...</title>` inside `<Helmet>` blocks (which is correct). Anything OUTSIDE Helmet would be a separate bug.

## Build & Test

```bash
npm run build
```

Build should pass with no warnings. The 18 SSG HTML files should now have ONLY ONE `<title>` and ONE `<meta description>`.

```bash
echo "=== Build verification: counts should be 1, not 2 ===" && \
for file in /opt/khp/tabbled/dist/index.html /opt/khp/tabbled/dist/blog.html /opt/khp/tabbled/dist/blog/qr-menu-zorunlulugu-2026.html /opt/khp/tabbled/dist/iletisim.html /opt/khp/tabbled/dist/privacy.html /opt/khp/tabbled/dist/menu/demo.html; do
  title_count=$(grep -c "<title" "$file" 2>/dev/null || echo "FILE NOT FOUND")
  desc_count=$(grep -c 'name="description"' "$file" 2>/dev/null || echo "FILE NOT FOUND")
  echo "$file → titles: $title_count, descriptions: $desc_count"
done

echo "" && echo "=== Sample output: landing should still have title via Helmet ===" && \
grep -oE '<title[^>]*>[^<]+</title>' /opt/khp/tabbled/dist/index.html

echo "" && echo "=== Sample output: blog should still have correct title ===" && \
grep -oE '<title[^>]*>[^<]+</title>' /opt/khp/tabbled/dist/blog/qr-menu-zorunlulugu-2026.html
```

**Expected after fix:**
- Each file: titles=1, descriptions=1 (was 2 before)
- Landing title via Helmet: "Tabbled — Restoran Dijital Menü Platformu" (or whatever Index.tsx Helmet sets)
- Blog post title via Helmet: page-specific metaTitle

## Commit & Deploy

```bash
git add index.html src/main.tsx src/App.tsx
# (only the files actually changed — likely index.html + one of main.tsx/App.tsx)

git commit -m "fix(seo): remove duplicate <title> and <meta> from index.html template

Root cause: index.html template had hardcoded <title> and <meta description>.
React Helmet was injecting per-page tags during SSG prerender but template
tags were also kept, resulting in 2 of each tag in all 18 SSG output files.

Fix:
- Removed hardcoded <title> and <meta description> from index.html
- Added defaultTitle + fallback description on HelmetProvider for SPA routes
  (dashboard, login, onboarding) that don't have their own Helmet blocks

Affected pages now have correct single tag set:
- Landing, /blog, 10 blog posts, /iletisim, /privacy, /menu/demo

SEO impact: Googlebot will now see a single, page-specific title and
description in search results. Resolves inconsistent search snippet rendering."

git push origin main
```

## Post-Deploy Verification

Wait 1-2 min for Vercel deploy, then:

```bash
echo "=== 1. Landing has single title ===" && \
curl -s https://tabbled.com/ | grep -oE '<title[^>]*>[^<]+</title>' | wc -l
# Expected: 1

echo "" && echo "=== 2. Landing title is correct ===" && \
curl -s https://tabbled.com/ | grep -oE '<title[^>]*>[^<]+</title>'
# Expected: page-specific title from Helmet

echo "" && echo "=== 3. Blog post has single title ===" && \
curl -s https://tabbled.com/blog/qr-menu-zorunlulugu-2026 | grep -oE '<title[^>]*>[^<]+</title>' | wc -l
# Expected: 1

echo "" && echo "=== 4. Blog post title is correct ===" && \
curl -s https://tabbled.com/blog/qr-menu-zorunlulugu-2026 | grep -oE '<title[^>]*>[^<]+</title>'
# Expected: "Restoran Fiyat Etiketi Yönetmeliği 2026..."

echo "" && echo "=== 5. Description count ===" && \
curl -s https://tabbled.com/blog/qr-menu-zorunlulugu-2026 | grep -c 'name="description"'
# Expected: 1

echo "" && echo "=== 6. Regression: all SSG pages still 200 ===" && \
for url in / /blog /blog/qr-menu-nedir /iletisim /privacy /menu/demo; do
  status=$(curl -sI "https://tabbled.com$url" | head -1)
  echo "$url → $status"
done
# Expected: All HTTP/2 200

echo "" && echo "=== 7. SPA routes (login/dashboard) get the fallback title ===" && \
curl -s https://tabbled.com/login | grep -oE '<title[^>]*>[^<]+</title>' | head -1
# Expected: "Tabbled — Restoran Dijital Menü Platformu" (the defaultTitle from HelmetProvider)
```

## What This Fix Does NOT Touch

- React Helmet usage in individual page components (already correct)
- Any other meta tags Helmet currently sets (og:title, og:description, twitter:card, etc.)
- The Organization + SoftwareApplication JSON-LD schema in landing (already there, working correctly)
- Any vite-react-ssg config (no changes needed — this is a template-level fix)

## Rollback Plan

If anything breaks (e.g. blank titles on some pages), revert with:
```bash
git revert HEAD
git push origin main
```

The change is purely additive in src/ (adding defaultTitle) and removal in index.html. Reverting both restores the original behavior (back to duplicates, but functioning).

## Notes

- The duplicate `<title>` issue was discovered while building the blog rewrite (commit 8e7bd30). It's pre-existing — the blog rewrite did not introduce it.
- This fix improves all 18 SSG pages simultaneously.
- After this fix, Search Console will show cleaner, more accurate page titles in search results within 1-2 weeks (when Google re-crawls).
