# Vercel.json SEO Fix — Final Version (5 Issues, Single Deploy)

## Context

Tabbled.com switched to SSG (vite-react-ssg) and Google Search Console flagged 5 issues:

1. **`/iletisim?plan=premium` indexed** — Should canonicalize to `/iletisim`. Query-string variant being indexed as separate page.
2. **`/privacy-policy` still crawled** — Old URL, real page is at `/privacy`.
3. **`www.tabbled.com` indexed separately** — Duplicate content issue (will be confirmed manually before applying).
4. **`/lander` indexed** — Legacy URL from previous domain owner (tablet retailer).
5. **`/manufacture-automatization` indexed** — Same legacy origin.

## Current State (Confirmed)

`vercel.json` exists with this structure:

```json
{
  "rewrites": [
    { "source": "/sitemap.xml", "destination": "https://qmnrawqvkwehufebbkxp.supabase.co/functions/v1/sitemap" },
    { "source": "/blog", "destination": "/blog.html" },
    { "source": "/blog/:slug", "destination": "/blog/:slug.html" },
    { "source": "/iletisim", "destination": "/iletisim.html" },
    { "source": "/privacy", "destination": "/privacy.html" },
    { "source": "/menu/demo", "destination": "/menu/demo.html" },
    { "source": "/menu/:path*", "destination": "/index.html" },
    { "source": "/login", "destination": "/index.html" },
    { "source": "/onboarding", "destination": "/index.html" },
    { "source": "/dashboard", "destination": "/index.html" },
    { "source": "/dashboard/:path*", "destination": "/index.html" }
  ],
  "headers": [
    { "source": "/assets/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] },
    { "source": "/(.*\\.woff2)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] }
  ]
}
```

`public/robots.txt`:
```
User-agent: *
Allow: /
Allow: /menu/
Disallow: /dashboard
Disallow: /login
Sitemap: https://tabbled.com/sitemap.xml
```

`api/` directory does not exist.

## Tasks (Apply All in One Commit)

### Task 1 — Add 410 Gone Edge Function (single dynamic file)

Create `api/gone/[slug].ts`:

```typescript
export const config = {
  runtime: 'edge',
};

export default function handler() {
  return new Response('Gone', {
    status: 410,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
```

This single function handles both `/lander` and `/manufacture-automatization` via dynamic slug routing. The slug parameter is unused in the handler (always returns 410), but using `[slug]` keeps the file count to one.

### Task 2 — Update vercel.json

Replace the entire `vercel.json` with this version. **Order matters** — Vercel processes redirects → rewrites → headers, and within each block top-to-bottom:

```json
{
  "redirects": [
    {
      "source": "/privacy-policy",
      "destination": "/privacy",
      "permanent": true
    }
  ],
  "rewrites": [
    { "source": "/lander", "destination": "/api/gone/lander" },
    { "source": "/manufacture-automatization", "destination": "/api/gone/manufacture-automatization" },
    { "source": "/sitemap.xml", "destination": "https://qmnrawqvkwehufebbkxp.supabase.co/functions/v1/sitemap" },
    { "source": "/blog", "destination": "/blog.html" },
    { "source": "/blog/:slug", "destination": "/blog/:slug.html" },
    { "source": "/iletisim", "destination": "/iletisim.html" },
    { "source": "/privacy", "destination": "/privacy.html" },
    { "source": "/menu/demo", "destination": "/menu/demo.html" },
    { "source": "/menu/:path*", "destination": "/index.html" },
    { "source": "/login", "destination": "/index.html" },
    { "source": "/onboarding", "destination": "/index.html" },
    { "source": "/dashboard", "destination": "/index.html" },
    { "source": "/dashboard/:path*", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/iletisim",
      "has": [{ "type": "query", "key": "plan" }],
      "headers": [{ "key": "X-Robots-Tag", "value": "noindex, follow" }]
    },
    {
      "source": "/(.*)",
      "has": [{ "type": "query", "key": "utm_source" }],
      "headers": [{ "key": "X-Robots-Tag", "value": "noindex, follow" }]
    },
    {
      "source": "/(.*)",
      "has": [{ "type": "query", "key": "ref" }],
      "headers": [{ "key": "X-Robots-Tag", "value": "noindex, follow" }]
    },
    {
      "source": "/assets/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    },
    {
      "source": "/(.*\\.woff2)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }
  ]
}
```

**Key changes:**
- New top-level `redirects` block for `/privacy-policy` → `/privacy`
- Two new rewrites at the **top** of `rewrites` for 410 Gone URLs (must come before any catch-all)
- Three new header rules at the **top** of `headers` for query-string noindex
- All existing rewrites and headers preserved exactly as they were

**Note on www redirect:** Intentionally NOT added to `vercel.json`. To be handled at Vercel Dashboard level (Project → Settings → Domains → set `tabbled.com` as primary, `www.tabbled.com` as redirect). Adding it here can cause double 301 hops if Dashboard already does it. Murat will confirm Dashboard config separately.

### Task 3 — Update robots.txt

Replace `public/robots.txt` with:

```
User-agent: *
Allow: /
Allow: /menu/
Disallow: /dashboard
Disallow: /login
Disallow: /onboarding

Sitemap: https://tabbled.com/sitemap.xml
```

**What's added:** `Disallow: /onboarding` (was missing — onboarding is a SPA route that shouldn't be indexed, matches existing dashboard/login pattern).

**What's NOT added:** `Disallow: /lander` and `Disallow: /manufacture-automatization`. Reason: if we disallow them in robots.txt, Google can't crawl them and therefore can't see the 410 status code we just configured. The 410 alone is the stronger deindex signal. Once Google sees the 410 (typically within 1-4 weeks) and the URLs disappear from index, we can optionally add the Disallow lines as a final cleanup — but they're not needed for deindexing.

## Post-Deploy Verification

After Vercel deploy completes, run these and paste results back:

```bash
# Test 1 — Query string noindex
curl -I "https://tabbled.com/iletisim?plan=premium" | grep -i x-robots-tag
# Expected: X-Robots-Tag: noindex, follow

# Test 2 — Privacy redirect
curl -I https://tabbled.com/privacy-policy
# Expected: HTTP/2 308 (or 301), Location: /privacy

# Test 3 — Lander 410
curl -I https://tabbled.com/lander
# Expected: HTTP/2 410

# Test 4 — Manufacture 410
curl -I https://tabbled.com/manufacture-automatization
# Expected: HTTP/2 410

# Test 5 — Regression check (these MUST still be 200)
curl -I https://tabbled.com/
curl -I https://tabbled.com/blog
curl -I https://tabbled.com/blog/qr-menu-nedir
curl -I https://tabbled.com/iletisim
curl -I https://tabbled.com/privacy
curl -I https://tabbled.com/menu/demo
curl -I https://tabbled.com/menu/ramada-encore-bayrampasa
# Expected: All HTTP/2 200, content-type: text/html

# Test 6 — Sitemap still works
curl -I https://tabbled.com/sitemap.xml
# Expected: HTTP/2 200, content-type: application/xml (proxied to Supabase function)

# Test 7 — UTM noindex (optional verification)
curl -I "https://tabbled.com/?utm_source=test" | grep -i x-robots-tag
# Expected: X-Robots-Tag: noindex, follow
```

## Files Modified

1. **`vercel.json`** — Replaced (additions only, no deletions to existing rules)
2. **`public/robots.txt`** — Added `Disallow: /onboarding`
3. **`api/gone/[slug].ts`** — New file (Edge Function for 410 Gone)

## Build & Deploy

```bash
npm run build
git add -A
git commit -m "fix(seo): add 410 Gone for legacy URLs, query-param noindex, privacy-policy redirect"
git push origin main
```

Vercel auto-deploys in 1-2 minutes.

## What This Fix Does NOT Do

- **Does NOT add www→non-www redirect to vercel.json** (handled at Dashboard level — Murat to verify separately)
- **Does NOT block legacy URLs in robots.txt** (intentional — 410 needs to be crawlable to work)
- **Does NOT fix the source of `/iletisim?plan=premium` links** — if landing page CTAs link with `?plan=` parameter, Google will re-discover them. Header fix prevents indexing but doesn't stop crawling. Murat will audit landing CTAs separately.

## Expected Timeline

- **Immediate:** All curl tests pass
- **24-48 hours:** Google starts seeing new headers/redirects
- **1-4 weeks:** Legacy URLs (`/lander`, `/manufacture-automatization`) drop from index
- **2-6 weeks:** `/iletisim?plan=premium` and `/privacy-policy` consolidate into canonicals

## If Something Breaks

If any Test 5 URL returns non-200 after deploy, the most likely cause is rewrite ordering. The `/lander` and `/manufacture-automatization` rewrites must be at the top of the `rewrites` array (before `/menu/:path*` which could theoretically capture them via path traversal, though it shouldn't). If issues arise, share full vercel.json post-deploy and the failing curl output.
