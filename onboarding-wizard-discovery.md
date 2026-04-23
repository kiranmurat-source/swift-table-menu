# TABBLED — Onboarding Wizard Discovery (READ-ONLY)

## CONTEXT

Yesterday's diagnosis revealed Onboarding.tsx exists and contains the only client-side code that inserts a trial subscriptions row (line 121). We don't know its full structure: is it already a multi-step wizard, a single form, a placeholder, or something else?

Before writing the new Google-signup wizard, we need to understand what's already there and decide whether to extend it or rewrite it.

## TASK — DISCOVERY ONLY

**DO NOT modify any code.** This is purely a structural report.

### Step 1 — Read Onboarding.tsx fully

```bash
cd /opt/khp/tabbled
view src/pages/Onboarding.tsx
wc -l src/pages/Onboarding.tsx
```

### Step 2 — Map the structure

Report:

1. **Total line count** and **rough section breakdown** (imports, state, JSX, etc.)
2. **What's the current UI shape?** Single form, multi-step wizard, redirect page, decision tree?
3. **What state variables drive it?** (e.g., currentStep, formData, isSubmitting)
4. **What fields does it collect?** (restaurant name, slug, plan, payment method, anything else?)
5. **What does it write to the DB?** (line 83: restaurants update, line 121: subscriptions insert — anything else?)
6. **What does it route to on completion?** (e.g., /dashboard, a specific tab)
7. **Is it currently reachable from any UI?** Find references:
   ```bash
   grep -rn "/onboarding\|Onboarding" src/ --include="*.tsx" --include="*.ts"
   ```

### Step 3 — Compare to the new wizard requirements

The new Google-signup wizard needs to deliver these 5 steps:

1. **Restoran bilgileri** — name (required), slug (auto-generated from name, editable), restoran tipi (cafe/restaurant/hotel-restaurant/patisserie), şehir, ilçe
2. **Markanız** (skippable) — logo upload, cover image/video upload, tema seç (white/black)
3. **İletişim** (skippable) — telefon, adres, instagram, facebook, google maps URL
4. **İlk menü** (skippable) — first category name + first product (name+price), OR "boş başla" button
5. **QR kodunuz hazır** — auto-generate 1 QR code (Masa 1), preview, download buttons (PNG + PDF), CTA "Public menünüze git"

After step 5: call `start_trial(restaurant_id)` RPC to mark `onboarding_completed_at`. Trial subscription row already exists from the signup trigger (Day 1 fix), so no new subscription insert needed here.

### Step 4 — Map gap

For each of the 5 steps above, mark:
- ✅ Already implemented in Onboarding.tsx
- ⚠️ Partially implemented (what's there, what's missing)
- ❌ Not implemented

### Step 5 — Recommend strategy

Based on the gap, recommend ONE of:
- **(A) Extend existing Onboarding.tsx** — if it's already wizard-shaped, add missing steps and trim what's not needed
- **(B) Replace existing Onboarding.tsx** — if the existing code is a different paradigm (single form, redirect, etc.) that doesn't fit a 5-step wizard
- **(C) Hybrid** — keep parts of existing, restructure others

For your recommendation, briefly justify (3-4 sentences).

### Step 6 — Important wiring questions

1. After Day 1, new Google signups land on `/dashboard` (not `/onboarding`). Where should the wizard intercept them? Options:
   - (a) Check `restaurants.onboarding_completed_at IS NULL` in Dashboard.tsx → redirect to `/onboarding` if NULL
   - (b) Render the wizard as a full-screen modal on top of the dashboard if NULL
   - (c) Add a route guard at app level
   Which fits the existing patterns in this codebase?

2. The existing Dashboard.tsx already redirects to `/onboarding` if `!profile.restaurant_id`. After Day 1 trigger always sets restaurant_id, so this redirect never fires anymore. We need a new condition to send users to the wizard. Check Dashboard.tsx routing logic and report the minimum change needed.

3. The wizard's step 2 (logo/cover) and step 4 (first menu item) require image upload. Check what upload component is used elsewhere in the admin panel (probably `MediaLibrary` or a Supabase Storage helper). Note the path for reuse.

4. The wizard's step 5 generates a QR code. Check if QR code generation is already implemented somewhere (likely `qr_codes` table CRUD in admin panel). Note the helper/component for reuse.

---

## OUTPUT

Just the discovery report. No code changes, no commits, no pushes.

After Murat reviews the report, the actual wizard implementation prompt will be written.
