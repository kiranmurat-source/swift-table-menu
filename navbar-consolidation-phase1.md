# TABBLED — Navbar Consolidation (Phase 1 of 2)

## CONTEXT

Admin panel currently renders TWO stacked top bars, plus a sidebar footer. User info appears in THREE places (outer bar, inner bar, sidebar footer). Notification bell is in the inner bar but doesn't work (just shows green dot).

This prompt does PHASE 1: clean up the navbars. PHASE 2 (separate prompt) will implement the full notification dropdown + realtime + sound.

## DESIRED STATE AFTER PHASE 1

**ONE top bar total**, white background, 56px height, sticky. Layout left to right:
- LEFT: empty space (matches sidebar 64px width)
- CENTER: Tabbled logo, horizontally centered
- RIGHT: Bell icon button (placeholder for now — Phase 2 will wire it up)

**No user email** anywhere in the top bar.
**No logout button** anywhere in the top bar.
**Sidebar footer remains** as the single source of truth for user identity + logout.

---

## TASK BREAKDOWN

### Step 1 — Find the two navbar sources

```bash
cd /opt/khp/tabbled
grep -rn "Cikis\|Çıkış\|Cıkış" src/pages/Dashboard.tsx src/pages/RestaurantDashboard.tsx src/components/ --include="*.tsx" | head -30
grep -rn "Bell\|notification" src/pages/RestaurantDashboard.tsx | head -20
grep -rn "user.email\|session.user" src/pages/Dashboard.tsx src/pages/RestaurantDashboard.tsx | head -20
ls public/ | grep -i tabbled
```

Identify:
- Outer dark bar (Tabbled logo + email + Cikis) — likely Dashboard.tsx or layout wrapper
- Inner white bar (Dashboard title + email + Bell) — RestaurantDashboard.tsx
- Sidebar footer (M avatar + email + Çıkış) — RestaurantDashboard.tsx, Session 2.7
- Correct logo filename in /public

### Step 2 — Delete the outer dark navbar entirely

Find the outer header block (dark background, contains Tabbled logo + email + Cikis button). DELETE the entire block. The dark bar disappears.

### Step 3 — Replace inner navbar with logo-centered bar + bell on right

In RestaurantDashboard.tsx, find the inner top bar block and REPLACE with:

```tsx
{/* Top bar — Tabbled logo centered, bell on right */}
<header
  style={{
    height: 56,
    background: '#FFFFFF',
    borderBottom: '1px solid #E5E7EB',
    display: 'grid',
    gridTemplateColumns: '64px 1fr auto',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 30,
    paddingRight: 16,
  }}
>
  {/* Left spacer to match sidebar width */}
  <div />

  {/* Center: Tabbled logo */}
  <div style={{ display: 'flex', justifyContent: 'center' }}>
    <img
      src="/tabbled-logo-horizontal.png"
      alt="Tabbled"
      style={{ height: 24, objectFit: 'contain' }}
    />
  </div>

  {/* Right: Bell placeholder (Phase 2 will replace with full dropdown) */}
  <button
    type="button"
    onClick={() => { /* Phase 2: open notification dropdown */ }}
    style={{
      width: 36,
      height: 36,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'transparent',
      border: 'none',
      borderRadius: 8,
      cursor: 'pointer',
      color: '#6B7280',
    }}
    onMouseEnter={(e) => { e.currentTarget.style.background = '#F3F4F6'; }}
    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    aria-label="Bildirimler"
  >
    <Bell size={20} weight="thin" />
  </button>
</header>
```

Use the correct logo filename from Step 1 ls output. Replace `tabbled-logo-horizontal.png` if needed.

### Step 4 — Clean up old bell-related state

Delete the old bell logic that lived in the previous inner bar (Session 2.6 leftovers):

```bash
grep -n "pendingCallCount\|newFeedbackCount\|newReviewCount" src/pages/RestaurantDashboard.tsx
```

Remove:
- `pendingCallCount`, `newFeedbackCount`, `newReviewCount` state declarations
- The useEffect that fetches these counts
- Any related interval polling

These will be replaced in Phase 2 with proper realtime subscriptions.

Keep the `Bell` import from `@phosphor-icons/react` — it's used in the new placeholder above.

### Step 5 — Sidebar footer stays unchanged

Do NOT touch the sidebar footer (M avatar + email + Çıkış). Confirm intact:

```bash
grep -n "sb-footer\|handleLogout" src/pages/RestaurantDashboard.tsx | head -10
```

### Step 6 — Verify "Dashboard" H1 still appears

RestaurantAnalytics.tsx renders its own page header ("Dashboard" + "Menü performansınıza genel bakış" + date selector). After removing the inner navbar, this should be the only H1. Confirm:

```bash
grep -n "Dashboard\|Menü performansınıza" src/components/dashboard/RestaurantAnalytics.tsx | head -5
```

### Step 7 — Content padding adjustment

Drop any `paddingTop` that previously accounted for two stacked bars:

```tsx
<main style={{ paddingLeft: 64, paddingTop: 0, ... }}>
```

The single sticky top bar handles its own space.

---

## BUILD & DEPLOY

```bash
npm run build
```

If clean:

```bash
git add -A
git commit -m "refactor(dashboard): consolidate to single top bar with centered logo and bell placeholder, remove duplicate user identity displays"
git push origin main
```

---

## TEST CHECKLIST

After Vercel deploy:

- [ ] Only ONE top bar visible (not two stacked)
- [ ] Tabbled logo horizontally centered
- [ ] Bell icon visible on far right of top bar
- [ ] Bell button has hover state (light gray bg)
- [ ] Bell click does nothing yet (Phase 2 will wire it)
- [ ] No user email anywhere in top bar
- [ ] No Cikis / Çıkış button in top bar
- [ ] Sidebar footer intact (M + email + Çıkış)
- [ ] Sidebar Çıkış logs out correctly
- [ ] "Dashboard" page title appears in content
- [ ] Date range selector still works
- [ ] Hover-expand sidebar still works
- [ ] Tablet/mobile drawer still works (below 1024px)

---

## ROLLBACK

```bash
git revert HEAD
git push origin main
```

---

## NEXT: PHASE 2

After Phase 1 is verified in production, run the Phase 2 prompt: notification system with dropdown panel, DB read tracking, realtime subscriptions, and sound alerts for waiter calls.
