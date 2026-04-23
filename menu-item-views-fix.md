# TABBLED — menu_item_views Tracking Fix

## CONTEXT

Diagnosis identified root cause: tracking call uses `void supabase.from('menu_item_views').insert({...})` which discards the promise without triggering execution. Result: zero network requests, table empty in production.

`menu_page_views` works correctly (different pattern). This fix brings menu_item_views to parity AND optionally introduces a shared helper for consistency.

## FIX SCOPE

Two-stage fix:

**Stage 1 (this prompt):** Replace the `void` pattern with `.then()` to actually execute the insert AND log errors. This unblocks tracking IF RLS is permissive.

**Stage 2 (separate, conditional):** If post-deploy Network tab shows 401/403 errors, add an anon insert RLS policy via Supabase SQL editor. Don't pre-emptively add this — diagnose says HIGH confidence the void is the bug, not RLS. RLS check is a fallback.

## STEP 1 — APPLY THE CODE FIX

Locate the tracking call (around PublicMenu.tsx:2115-2129 per diagnosis). Replace:

```typescript
// BEFORE (broken — void discards the promise, no execution)
void supabase.from('menu_item_views').insert({
  menu_item_id: itemId,
  restaurant_id: restaurantId,
  fingerprint: getFingerprint(),
  duration_seconds: duration,
});
```

With:

```typescript
// AFTER (executes and surfaces errors)
supabase
  .from('menu_item_views')
  .insert({
    menu_item_id: itemId,
    restaurant_id: restaurantId,
    fingerprint: getFingerprint(),
    duration_seconds: duration,
  })
  .then(({ error }) => {
    if (error) {
      console.error('[Tabbled] menu_item_views insert failed:', error);
    }
  });
```

**IMPORTANT — preserve existing logic:**
- Don't touch the duration filter (2 ≤ duration ≤ 300) if it exists — it stays as-is, just before the insert call
- Don't change the dependency array of the surrounding useEffect
- Don't refactor the modal mount strategy (diagnosis confirmed it's already correct)
- Don't change field names — match the diagnosis-confirmed schema

The ONLY change is: drop `void`, add `.then()` with error logging.

## STEP 2 — VERIFY EXISTING menu_page_views PATTERN (consistency check)

The diagnosis noted `menu_page_views` already works with proper error logging. Quickly verify the two patterns now match:

```bash
cd /opt/khp/tabbled
grep -A 5 "menu_page_views" src/pages/PublicMenu.tsx | head -30
```

If `menu_page_views` uses `.then(({ error }) => ...)` with similar error logging, both tracking calls follow the same pattern after this fix. No additional change needed.

If `menu_page_views` uses a different pattern (await, etc.), don't refactor — leave both working but slightly different. Standardization can be a separate cleanup task post-launch.

## STEP 3 — BUILD & DEPLOY

```bash
npm run build
```

If clean, push directly with this commit message:

```
fix(public-menu): trigger menu_item_views insert (void pattern was discarding promise) — adds error logging consistent with menu_page_views
```

## STEP 4 — POST-DEPLOY VERIFICATION (Murat does this)

After Vercel deploy completes (1-2 min), Murat will:

**4a. Open Ramada menu in browser with DevTools open:**
- URL: https://tabbled.com/menu/ramada-encore-bayrampasa
- Open DevTools → Network tab → filter by "menu_item_views"
- Click any product card to open detail modal
- Wait 3+ seconds (must exceed the 2s minimum filter)
- Close the modal
- Watch for the network request

**4b. Three possible outcomes:**

| Status | Meaning | Action |
|---|---|---|
| **201 Created** | Working! INSERT succeeded. | Done. Verify table populates: `SELECT count(*) FROM menu_item_views;` should grow on each modal close. |
| **401 / 403** | RLS blocking anon insert | Run Stage 2 SQL below |
| **No request at all** | Code fix didn't take effect (cache?) or modal mount issue | Hard refresh (Ctrl+Shift+R), retry. If still no request, escalate to second diagnosis pass. |

**4c. If Stage 2 needed (401/403 only):**

In Supabase SQL Editor:

```sql
-- Verify RLS is missing anon insert
SELECT polname, polcmd, pg_get_expr(polqual, polrelid) AS using_expr,
       pg_get_expr(polwithcheck, polrelid) AS with_check_expr
FROM pg_policy
WHERE polrelid = 'public.menu_item_views'::regclass;

-- If no INSERT policy with TO anon exists, add it:
CREATE POLICY "Anon can insert views"
  ON public.menu_item_views
  FOR INSERT
  TO anon
  WITH CHECK (true);
```

Then retest the modal flow — should now return 201.

## STEP 5 — DASHBOARD IMPACT

Once events flow:
- "En Çok Görüntülenen Ürün" card populates within minutes
- "Ürün Tıklama" card shows count
- "En Çok Görüntülenen 5 Ürün" list fills
- "Kategori Performance" chart starts showing data
- Hour heatmap reflects modal-view timing

These changes do NOT need a code update — RestaurantAnalytics.tsx already queries `menu_item_views` and aggregations will start returning real data automatically.

## ROLLBACK

```bash
git revert HEAD
git push origin main
```

If Stage 2 SQL was applied:
```sql
DROP POLICY IF EXISTS "Anon can insert views" ON public.menu_item_views;
```

(Only roll back the policy if it caused unintended access — this is unlikely as anon insert is the explicit intent.)
