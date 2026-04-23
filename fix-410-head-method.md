# Fix: 410 Gone Edge Function — HEAD Request Support

## Problem

Current `api/gone/[slug].ts` uses `export function GET()` which only handles GET requests. Curl HEAD requests (`curl -I`) return **HTTP 405 Method Not Allowed** instead of **HTTP 410 Gone**.

This breaks the deindex strategy because:
1. Google bot uses HEAD requests as the first probe before GET
2. A 405 response signals "URL exists but is broken" — not "URL is gone"
3. Google will retry the URL instead of removing it from the index

## Verification of Current Bug

```bash
curl -I https://tabbled.com/lander
# Returns: HTTP/2 405

curl -s -o /dev/null -w "%{http_code}\n" https://tabbled.com/lander
# Returns: 410 (GET works fine)
```

## Fix

Replace the entire content of `api/gone/[slug].ts` with the standard Vercel Edge Function pattern using `export default`. This pattern handles all HTTP methods (GET, HEAD, POST, etc.) with the same response.

**New content for `api/gone/[slug].ts`:**

```typescript
export const config = {
  runtime: 'edge',
};

export default function handler(request: Request) {
  return new Response('Gone', {
    status: 410,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
```

## Why This Works

- `export default function handler()` is Vercel's **official documented pattern** for Edge Functions in non-Next.js projects (this is a Vite project)
- It handles ALL HTTP methods automatically (GET, HEAD, POST, OPTIONS, etc.)
- HEAD responses automatically use the same headers as GET but with no body — perfect for 410 Gone
- This is what the original plan specified

## Why the Previous Pattern Failed

The previous code used `export function GET()` which is the **Next.js App Router Route Handler** pattern (typically in `route.ts` files). This is NOT supported by Vercel Edge Functions in Vite projects:

- Vercel Edge Runtime in Vite expects a default export
- Named method exports (`GET`, `POST`, `HEAD`) are a Next.js App Router convention
- When only `GET` is exported, Vercel returns 405 for any other method (HEAD, POST, etc.)

If a validator told Claude Code that `export default` was rejected, that validator was applying Next.js rules to a Vite project. The Vercel runtime itself accepts `export default` — that's the documented standard for `/api/*.ts` files in Vite/non-Next projects.

## No Other Files Change

- `vercel.json` — DO NOT TOUCH (working correctly)
- `public/robots.txt` — DO NOT TOUCH (working correctly)
- Only `api/gone/[slug].ts` is modified

## Build & Deploy

```bash
npm run build
git add api/gone/[slug].ts
git commit -m "fix(seo): use export default in 410 Gone function so HEAD requests return 410 not 405"
git push origin main
```

## Post-Deploy Verification

Wait 1-2 minutes for Vercel deploy, then run:

```bash
echo "=== HEAD request (was 405, should be 410) ===" && \
curl -sI https://tabbled.com/lander | head -3

echo "=== GET request (should still be 410) ===" && \
curl -s -o /dev/null -w "GET status: %{http_code}\n" https://tabbled.com/lander

echo "=== Same for manufacture-automatization ===" && \
curl -sI https://tabbled.com/manufacture-automatization | head -3
curl -s -o /dev/null -w "GET status: %{http_code}\n" https://tabbled.com/manufacture-automatization

echo "=== Regression: existing pages still 200 ===" && \
for url in / /blog /iletisim /privacy /menu/demo; do
  status=$(curl -sI "https://tabbled.com$url" | head -1)
  echo "$url → $status"
done
```

**Expected:**
- HEAD requests: `HTTP/2 410`
- GET requests: `GET status: 410`
- All regression URLs: `HTTP/2 200`

If HEAD still returns 405 after this fix, paste the new file content with `cat 'api/gone/[slug].ts'` and we'll debug further (possible Vercel Edge Runtime version issue).

## Why This Matters for SEO

Once HEAD returns 410:
- Google bot's first probe (HEAD) immediately learns "URL is gone"
- No wasted GET request needed
- Faster deindexing (1-2 weeks instead of 4-6 weeks)
- Cleaner Search Console reporting (no "soft 404" or "method not allowed" warnings)
