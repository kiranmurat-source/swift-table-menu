# DASHBOARD FIX — Phase 2.7 (critical layout + polish pack)

## CONTEXT

Production screenshot verified the following issues after commit pushed in Session 3 (sidebar hover-expand):

1. Main content renders BELOW the sidebar vertically instead of NEXT TO it — sidebar is either not fixed-positioned, or main content padding-left is not applied (Tailwind `md:pl-16` likely not working in this project)
2. Logout button "Çıkış" ended up in the top bar, should be inside sidebar at the bottom
3. Two stacked sticky areas visible: top bar + separate Dashboard header region
4. Active nav item still has a 2px green left border — user wants it removed
5. Premium banner still has a visible border (remove) and neutral "Yükselt" button (change to pink)
6. Content background is plain gray — needs warm off-white
7. Brand area duplicates: wordmark + "T" icon shown together in some states
8. Tablet range (768-1023px) currently collapsed rail — user wants drawer behavior for all screens below 1024px

Fix everything in one pass.

## TECHNICAL NOTES

- Project uses inline style pattern `S.*` via `makeStyles()` helper and `getAdminTheme()`. Tailwind utility classes are inconsistently applied in this codebase — DO NOT rely on `md:pl-16` or similar responsive utilities. Use explicit inline styles driven by a JavaScript `isDesktop` check.
- `isDesktop = window.innerWidth >= 1024` (change from 768 to 1024 — user wants tablet in drawer mode)
- Sidebar light theme stays LIGHT for admin panel light theme (no charcoal reversion). Dark theme support is a future topic.
- Brand colors: green `#10B981` is the only accent anywhere except the Premium "Yükselt" CTA which is pink `#FF4F7A`. Zero pink elsewhere.

## TASK 1 — FIX sidebar + content layout (critical)

### Sidebar must be fixed-positioned
```
position: fixed
left: 0
top: 0
height: 100vh
width: 64px (default) → 240px (on hover)
z-index: 40
transition: width 180ms ease
```

### Main content wrapper must have explicit left padding via inline style
Apply paddingLeft dynamically via JavaScript state, NOT via Tailwind class:
```ts
style={{
  paddingLeft: isDesktop ? '64px' : '0',
  minHeight: '100vh',
  background: '#FAFAF9',
}}
```

### Sidebar expansion must NOT reflow content
When sidebar width animates from 64px to 240px on hover, the content's paddingLeft stays at 64px. The 240px expanded sidebar overlays the content (z-index higher). Content never shifts horizontally.

### Top bar alignment
The top bar (with bell + email) must also respect the 64px left offset on desktop. Either place it inside the main content wrapper (after paddingLeft is applied), or give it the same paddingLeft inline.

### Verify after fix
- Desktop: "Dashboard" title appears to the RIGHT of sidebar rail, NOT below
- Hovering sidebar expands to 240px smoothly, main content does NOT shift right
- No vertical stacking of sidebar and content

## TASK 2 — Move logout button BACK inside sidebar

Currently the logout button "Çıkış" is rendered in the top bar (next to email). Move it back into the sidebar footer.

Top bar after fix should contain ONLY:
- Bell icon (left or right side)
- User email display
- No logout button

Sidebar internal structure (flex column, height 100vh):
```
┌────────────────────────────┐
│ Brand area (64px tall)     │
├────────────────────────────┤
│                            │
│ Navigation items           │
│ (flex-grow:1, overflow-y)  │
│                            │
├────────────────────────────┤
│ Divider (1px)              │
│ User menu (avatar + logout)│
│ (flex: 0 0 auto)           │
└────────────────────────────┘
```

User menu behavior:
- Collapsed state (64px): avatar circle 32x32 only, clicking avatar logs out directly OR opens a tiny overlay
- Expanded state (240px): avatar + email text + "Çıkış" button next to or below

## TASK 3 — Internal scroll: nav scrolls, footer stays

Inside sidebar, if navigation items exceed available vertical space, the nav area scrolls internally but the user menu stays pinned at the bottom.

```css
.sidebar {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}
.sidebar-nav {
  flex: 1 1 auto;
  overflow-y: auto;
  overflow-x: hidden;
}
.sidebar-footer {
  flex: 0 0 auto;
  border-top: 1px solid #E5E7EB;
}
```

Scrollbar should be subtle (thin, not default browser chunky style). Use:
```css
.sidebar-nav::-webkit-scrollbar { width: 4px; }
.sidebar-nav::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 2px; }
.sidebar-nav::-webkit-scrollbar-track { background: transparent; }
```

## TASK 4 — Remove 2px green left border on active item

Active nav item currently has a 2px green left bar (likely ::before pseudo or border-left). REMOVE IT entirely.

New active state styling:
- Background: `#F7F7F8`
- Icon color: `#10B981` (green — this is now the sole accent indicator)
- Text color: `#1C1C1E`
- No border, no ::before pseudo, no left bar of any kind

Verify visually: active item is a clean pill with subtle gray bg and green-colored icon, nothing else.

## TASK 5 — Warm off-white content background

Main content wrapper (the scrollable area where Dashboard content lives, excluding sidebar):
- Background: `#FAFAF9` (warm off-white)

Cards inside (metric cards, chart card, etc.) stay `#FFFFFF` — they will pop slightly against the off-white background.

Do NOT change:
- Sidebar background (stays light theme white/neutral)
- Card backgrounds (stay white)
- Individual section backgrounds inside cards

## TASK 6 — Premium banner: borderless + pink CTA

### Banner container
- Background: `#FFFFFF`
- NO border (remove any `border: 1px solid #E5E7EB`)
- Border radius: 10px
- Padding: 16px 20px
- Subtle shadow to maintain elevation without border: `box-shadow: 0 1px 2px rgba(0,0,0,0.04)`

### "Yükselt" button (and "İletişime Geç" enterprise variant)
- Background: `#FF4F7A` (pink — ONLY place pink is allowed in admin panel)
- Text: `#FFFFFF` (white)
- No border
- Padding: 8px 16px
- Border radius: 6px
- Font: Roboto Medium 13px
- Hover: background `#E63E68` (darker pink)
- Cursor: pointer

### Other banner elements unchanged
- "PREMIUM" label: Roboto Medium 11px, tracking-wide, uppercase, color `#9CA3AF`
- Message text: Roboto Regular 13px, color `#6B7280`
- Dismiss X: Phosphor X Thin 14px, color `#9CA3AF`, clickable, persists in localStorage key `tabbled_premium_dismissed`

## TASK 7 — Brand area deduplication

Currently both the Tabbled wordmark and a smaller "T" square icon appear together in some states. Simplify to ONE brand mark per state.

### Collapsed sidebar (64px)
- Top area shows ONLY the "T" square icon (24x24), centered horizontally
- No wordmark, no restaurant name — everything else hidden

### Expanded sidebar (240px)
- Top area shows: "T" icon (24x24) + "Tabbled" wordmark inline, horizontally aligned
- Below that: restaurant context block
  - Avatar circle (24x24) + restaurant name + small chevron for switcher
  - Only one visual block, no duplication

The current state has a second "T" icon appearing below the wordmark — eliminate that.

## TASK 8 — Breakpoint change: drawer for all below 1024px

Current behavior: mobile (<768px) uses drawer, tablet (768-1023px) shows collapsed rail with no hover.

NEW behavior:
- Below 1024px → hamburger + drawer pattern for ALL screen sizes
- 1024px and above → hover-expand overlay pattern

Change `isDesktop` threshold from 768 to 1024:
```ts
const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024)
useEffect(() => {
  const onResize = () => setIsDesktop(window.innerWidth >= 1024)
  window.addEventListener('resize', onResize)
  return () => window.removeEventListener('resize', onResize)
}, [])
```

Below 1024px:
- Sidebar is hidden by default
- Hamburger icon visible in top bar (left side)
- Clicking hamburger opens drawer (slide from left, full height, 280px wide)
- Drawer uses the same sidebar content (brand + nav + user footer) but always "expanded" (data-collapsed={false})
- Backdrop overlay behind drawer, clicking backdrop closes drawer
- Content wrapper paddingLeft: 0 (no fixed rail to reserve space for)

1024px and above:
- Current hover-expand overlay pattern applies
- Content wrapper paddingLeft: 64px
- No hamburger visible

## CONSTRAINTS

- DO NOT touch RestaurantAnalytics.tsx
- DO NOT rely on Tailwind utility classes for responsive layout — use inline styles driven by JS state (`isDesktop`)
- Keep the existing S.* inline style pattern
- Keep Roboto font (300/400/500/700), Phosphor Thin icons
- Zero pink anywhere except the Yükselt CTA button
- Build must be clean, no TypeScript errors

## TEST CHECKLIST

Run `npm run build` — must be clean.

### Desktop viewport (1440x900)
1. Sidebar: 64px rail on the left, fixed, full viewport height
2. "Dashboard" page title appears to the RIGHT of sidebar (horizontally aligned), NOT below
3. Top bar: bell + email visible, NO logout button here
4. Hover over sidebar: expands to 240px as overlay, main content does NOT shift
5. User menu (avatar + "Çıkış") visible at the bottom of sidebar (both collapsed and expanded states)
6. Active nav item: subtle gray bg `#F7F7F8` + green icon, NO left border or bar
7. Premium banner: white bg, no border, subtle shadow, "Yükselt" button is pink `#FF4F7A` with white text
8. Content area background: warm off-white `#FAFAF9`
9. Card backgrounds: pure white, subtle contrast against off-white bg
10. Brand: single "T" icon in collapsed state, "T + Tabbled" wordmark + restaurant block in expanded state (no duplication)

### Tablet viewport (768x1024)
11. Hamburger icon visible in top bar
12. Sidebar hidden by default, no rail visible
13. Clicking hamburger opens drawer, clicking backdrop closes

### Mobile viewport (375x667)
14. Same as tablet: hamburger + drawer, no rail visible

### grep checks
15. `grep -rn "FF4F7A" src/` returns ONE location (the Yükselt CTA) and the accent-green variable definitions, nothing else
16. `grep -rn "md:pl-16\|md:pl-" src/pages/RestaurantDashboard.tsx` returns zero — all replaced with inline style

## DELIVERY

Report build output and grep check results. Push when I confirm.
