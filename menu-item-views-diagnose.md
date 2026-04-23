# TABBLED — menu_item_views Tracking Diagnosis (READ-ONLY)

## CONTEXT

Admin dashboard cards "Most Viewed Item", "Product Clicks", "Category Performance", and "Top 5 Items" all show "Henüz veri yok" because the `menu_item_views` table is empty in production. Tracking code exists at PublicMenu.tsx around lines 2115-2129 (modal unmount fires INSERT with duration_seconds), but no events are being recorded.

Murat manually tested: opened product modals on Ramada menu, waited 3+ seconds, closed. Browser console showed NO network request, NO error, NO log. Tracking effect appears to never execute.

## TASK — DIAGNOSE ONLY

**DO NOT FIX ANYTHING.** This prompt is purely investigative. Report findings, propose fix, then STOP. Murat will review the report and write a separate fix prompt.

---

## INVESTIGATION CHECKLIST

### 1. Locate the tracking code

```bash
cd /opt/khp/tabbled
grep -n "menu_item_views" src/pages/PublicMenu.tsx
grep -n "menu_item_views" src/ -r --include="*.tsx" --include="*.ts"
```

Report all locations where `menu_item_views` is referenced.

### 2. Read the modal + tracking effect

```bash
view src/pages/PublicMenu.tsx 2080:2160
```

Look at:
- How is the product detail modal mounted? Conditional render (`{open && <Modal />}`) OR CSS-based (`<Modal style={{display: open ? 'block' : 'none'}}/>`)?
- What's the cleanup mechanism? `useEffect` cleanup function, `onClose` callback, or both?
- What dependencies does the tracking `useEffect` have? Could one of them cause skip on every render?

### 3. Check getFingerprint

```bash
grep -rn "getFingerprint\|fingerprint" src/lib/ src/pages/PublicMenu.tsx | head -20
```

Verify:
- Is `getFingerprint()` defined? Where?
- Does it return a non-empty string synchronously?
- If async, is the tracking effect awaiting it correctly?

### 4. Check the INSERT call itself

In the tracking code, look for:
- The actual `supabase.from('menu_item_views').insert()` call
- Are required fields included? (menu_item_id, restaurant_id, fingerprint, duration_seconds at minimum)
- Is the duration filter (2 ≤ duration ≤ 300) applied BEFORE or AFTER the INSERT? If before, very short modal views correctly skip — but if Murat waited 3+ seconds, that filter shouldn't block.
- Any `.then()` or `.catch()` that could silently swallow errors?

### 5. Check RLS on menu_item_views

```bash
grep -rn "menu_item_views" supabase/migrations/ 2>/dev/null
ls supabase/migrations/ | grep -i view
```

Find the migration that created `menu_item_views`. Report:
- What columns does it have?
- What RLS policies are defined?
- Specifically: is there an "anon insert" policy? Public menu visitors are anonymous, so without an explicit anon insert policy, INSERTs from the client will be silently rejected.

If migration is not in repo (created via Supabase dashboard), Murat will run a query in SQL editor to dump it — leave a note that this is needed.

### 6. Check the modal mount strategy

The single biggest suspect: if the modal uses `{showDetail && <Modal />}` conditional render, the cleanup function fires correctly on close. But if it uses `style={{display: showDetail ? 'block' : 'none'}}` or a portal that's never unmounted, the cleanup never fires.

Look for:
- The component that renders the modal (might be inline JSX or a separate `<ProductDetailModal>` component)
- How `showDetail` (or whatever the state variable is called) is used in the JSX

### 7. Check for AbortController or early return

If the tracking useEffect has an early return for some condition (e.g., `if (!item) return;` or `if (!restaurant) return;`), and that condition is true at unmount time, the cleanup never fires the INSERT.

Look for the structure:
```typescript
useEffect(() => {
  // ... setup ...
  return () => {
    // ← THIS is what fires the INSERT on unmount
    // If the effect early-returned, this cleanup also never runs
  };
}, [deps]);
```

---

## REPORT FORMAT

After investigation, produce a report with:

### Findings (numbered)

1. **Modal mount strategy**: [conditional render / CSS hide / portal / other]
2. **Tracking effect location**: line numbers, dependency array
3. **getFingerprint behavior**: defined where, sync/async, returns what
4. **INSERT call structure**: required fields included? error handling?
5. **RLS policies on menu_item_views**: list them; flag if anon insert is missing
6. **Suspected root cause**: rank top 2-3 hypotheses
7. **Smoking gun (if any)**: anything that's clearly broken vs just suspicious

### Proposed fix (do NOT implement)

Outline what would need to change to fix this. Could be:
- Add anon insert RLS policy (DB-side)
- Move tracking from useEffect cleanup to onClose callback
- Fix dependency array
- Fix early return that bypasses cleanup
- Other

### Confidence

State your confidence level (high / medium / low) and what would raise it. If you need Murat to run a SQL query in Supabase to confirm RLS, say so.

---

## OUTPUT

Just the report. No code changes, no commits, no pushes. Murat will read the report and decide next steps.
