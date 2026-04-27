# Plan-Aware Feature Toggle UI — Pilot Implementation

**Goal:** Replace the dormant legacy feature toggles in `ProfilePanel.tsx` with a new plan-aware "Özellikler" section. Restaurants see 7 toggles grouped by 4 pillars, with disabled state + upgrade link for features outside their plan tier.

**Background (just enough):** Tabbled has 3 plans (Basic / Premium / Enterprise). Most features auto-activate based on plan and require no toggle. Only 7 features are restaurant-preference toggles — things a restaurant might say "we don't want this" about (e.g., a fine-dining place doesn't want WhatsApp ordering). This pilot makes those 7 plan-aware.

**Audit-first discipline required.** Report findings before writing code.

---

## The 7 toggle features

| # | Feature | DB column | Pillar | Basic | Premium | Enterprise |
|---|---|---|---|---|---|---|
| 1 | Sepet | `feature_cart` (exists) | Gelir Yönetimi | ✓ | ✓ | ✓ |
| 2 | Garson çağırma | `feature_waiter_calls` (exists) | Tahsilat | ✗ | ✓ | ✓ |
| 3 | WhatsApp sipariş | `feature_whatsapp_order` (exists) | Tahsilat | ✗ | ✓ | ✓ |
| 4 | Masa rezervasyonu | `feature_table_reservation` (NEW) | Tahsilat | ✗ | ✗ | ✓ |
| 5 | Masadan ödeme | `feature_table_payment` (NEW) | Tahsilat | ✗ | ✗ | ✓ |
| 6 | Dijital bahşiş | `feature_digital_tip` (NEW) | Tahsilat | ✗ | ✗ | ✓ |
| 7 | Grup ödeme | `feature_group_payment` (NEW) | Tahsilat | ✗ | ✗ | ✓ |

**Pillar grouping for UI:**
- **Gelir Yönetimi:** Sepet (1)
- **Tahsilat:** Garson çağırma (2), WhatsApp sipariş (3), Masa rezervasyonu (4), Masadan ödeme (5), Dijital bahşiş (6), Grup ödeme (7)
- **Pazarlama** and **Satın Alma** pillars: empty for now (no toggles in pilot scope) — DO NOT render empty pillar headers

---

## Step 1 — Audit phase

Inspect and report all of these before any code changes:

### A. ProfilePanel.tsx legacy section

1. Lines 550–595 contain the legacy `SHOW_LEGACY_FEATURE_TOGGLES` block. Confirm the structure: `<h4>` header + `<label>` rows with checkbox inputs. Confirm flag is `false` (legacy hidden).
2. The `form` state shape — confirm fields `feature_cart`, `feature_waiter_calls`, `feature_whatsapp_order` exist on it (they should from the legacy mapping). Report: do `feature_table_reservation`, `feature_table_payment`, `feature_digital_tip`, `feature_group_payment` exist on `form`? (Probably not — these are the new columns to add.)
3. How `form` syncs to DB on save — find the save handler (probably `handleSave` or similar). Report which DB columns are written. We will need to add the 4 new columns there.
4. Confirm legacy `SHOW_LEGACY_FEATURE_TOGGLES` block stays `false` after this work — we are NOT re-enabling legacy. We are replacing it.

### B. planFeatures.ts current state

1. Confirm `FeatureKey` union type contains: `cart`, `waiter_calls`, `whatsapp_order`. Report whether these 4 are missing: `table_reservation`, `table_payment`, `digital_tip`, `group_payment`.
2. Confirm `PLAN_FEATURES` map exists with `basic`, `premium`, `enterprise` keys. Confirm cart=true in basic, waiter_calls=false in basic, etc.
3. Confirm `hasFeature(restaurant, key)` function exists with resolution order: `plan_overrides` → `PLAN_FEATURES[current_plan]` → `false`.
4. The `Restaurant` type — find where it's defined. Report whether `feature_cart`, `feature_waiter_calls`, `feature_whatsapp_order` are typed columns on it. The 4 new columns will need to be added to this type too.

### C. Restaurant data flow

1. How does `ProfilePanel` receive the restaurant object? Is it from `useRestaurant` hook, prop, or context? Report.
2. Where is `current_plan` read from for the current restaurant? Confirm it's `restaurant.current_plan` of type `'basic' | 'premium' | 'enterprise'`.
3. After save, does `form` re-sync from DB or is it optimistic-update? This affects whether toggle state survives reload.

### D. shadcn Switch component

1. Is `@/components/ui/switch` available? `ls src/components/ui/switch.tsx` to verify.
2. If missing, the legacy was `<input type="checkbox">` — we'll add shadcn Switch via the standard installation (or build a custom pill switch matching admin theme tokens). Report which path applies.

### E. Sticky save bar interaction

1. The `STICKY_SAVE_PILOT_MENU_PANEL` flag is currently true and the floating save bar lives in MenuPanel context. ProfilePanel save flow is separate. Confirm: when restaurant changes a toggle in ProfilePanel and clicks the existing ProfilePanel save button, does it persist correctly? We are NOT extending the floating save bar to ProfilePanel in this commit. The existing ProfilePanel save mechanism stays.

### F. Admin theme tokens

1. Find `theme` import in ProfilePanel. Report token names for: card background, border, text primary, text secondary, muted text, success/active color (likely a green or pink accent).
2. We need a "disabled" appearance for plan-locked rows. Report whether a token like `theme.disabledBg` or `theme.subtleBg` exists. If not, propose a value (e.g., `rgba(0,0,0,0.04)` or use `theme.pageBg` with reduced opacity).

**Report all findings before proceeding to Step 2.** If anything diverges from the spec above, propose a fix and wait for approval.

---

## Step 2 — Database migration

Create migration file `supabase/migrations/20260427_feature_toggle_columns.sql`:

```sql
-- Add 4 new feature toggle columns for plan-aware admin UI pilot
-- Default TRUE: when a plan unlocks the feature, it is on by default until
-- the restaurant explicitly toggles it off. Reduces "nothing works" friction.

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS feature_table_reservation BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS feature_table_payment    BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS feature_digital_tip      BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS feature_group_payment    BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN restaurants.feature_table_reservation IS 'Restaurant preference: enable table reservation UI in public menu (Tahsilat pillar, Enterprise plan)';
COMMENT ON COLUMN restaurants.feature_table_payment    IS 'Restaurant preference: enable QR pay-at-table flow (Tahsilat pillar, Enterprise plan)';
COMMENT ON COLUMN restaurants.feature_digital_tip      IS 'Restaurant preference: enable digital tipping at checkout (Tahsilat pillar, Enterprise plan)';
COMMENT ON COLUMN restaurants.feature_group_payment    IS 'Restaurant preference: enable split-bill / group payment flow (Tahsilat pillar, Enterprise plan)';
```

Run via Supabase Dashboard → SQL Editor (more reliable than CLI per project memory). Verify with:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'restaurants' AND column_name LIKE 'feature_%'
ORDER BY column_name;
```

Should show 7 feature_* columns total (3 existing + 4 new), all BOOLEAN with DEFAULT TRUE for the 4 new ones.

---

## Step 3 — planFeatures.ts updates

Add the 4 new keys to `FeatureKey` union and `PLAN_FEATURES` map.

```ts
export type FeatureKey =
  // ... existing keys ...
  // New Tahsilat operational features (added 27 Apr)
  | 'table_reservation'
  | 'table_payment'
  | 'digital_tip'
  | 'group_payment';

export const PLAN_FEATURES: Record<PlanTier, Record<FeatureKey, boolean>> = {
  basic: {
    // ... existing entries ...
    table_reservation: false,
    table_payment: false,
    digital_tip: false,
    group_payment: false,
  },
  premium: {
    // ... existing entries ...
    table_reservation: false,
    table_payment: false,
    digital_tip: false,
    group_payment: false,
  },
  enterprise: {
    // ... existing entries ...
    table_reservation: true,
    table_payment: true,
    digital_tip: true,
    group_payment: true,
  },
};
```

All 4 are Enterprise-only per spec. Basic and Premium have them `false`.

Also update the `Restaurant` type wherever it's defined (audit step B4) to include the 4 new boolean columns.

---

## Step 4 — ProfilePanel.tsx new "Özellikler" section

Replace the legacy `SHOW_LEGACY_FEATURE_TOGGLES` block (around lines 553–593) with a new section. The legacy block stays in the file but gated `false` — leave it dormant (do NOT delete it; it has documentation value as a reference).

Insert the new section in the same location.

### Section structure

```tsx
{/* Plan-aware feature toggles — added 27 Apr 2026 */}
<h4 style={{ /* same style as other ProfilePanel section headers */ }}>
  <Toggle size={16} /> Özellikler
</h4>
<p style={{ fontSize: 12, color: theme.mutedText, marginBottom: 12 }}>
  Plan dahilindeki özellikleri açıp kapatabilirsiniz. Plan dışındakiler için yükseltme gerekir.
</p>

{/* Gelir Yönetimi pillar — only Sepet in pilot */}
<PillarHeader title="Gelir Yönetimi" accent="#1D9E75" />
<ToggleRow
  feature="cart"
  dbColumn="feature_cart"
  label="Sepet"
  description="Müşteriler menüden sepete ürün ekleyebilir."
  restaurant={restaurant}
  form={form}
  setForm={setForm}
/>

{/* Tahsilat pillar — 6 toggles */}
<PillarHeader title="Tahsilat" accent="#534AB7" />
<ToggleRow
  feature="waiter_calls"
  dbColumn="feature_waiter_calls"
  label="Garson çağırma"
  description="Müşteri masadan tek tıkla garson çağırır."
  restaurant={restaurant}
  form={form}
  setForm={setForm}
/>
<ToggleRow
  feature="whatsapp_order"
  dbColumn="feature_whatsapp_order"
  label="WhatsApp sipariş"
  description="Müşteri sepetini WhatsApp üzerinden gönderir."
  restaurant={restaurant}
  form={form}
  setForm={setForm}
/>
<ToggleRow
  feature="table_reservation"
  dbColumn="feature_table_reservation"
  label="Masa rezervasyonu"
  description="Müşteri menüden masa rezervasyonu yapabilir."
  restaurant={restaurant}
  form={form}
  setForm={setForm}
/>
<ToggleRow
  feature="table_payment"
  dbColumn="feature_table_payment"
  label="Masadan ödeme (QR)"
  description="Müşteri QR ile masadan online ödeme yapar."
  restaurant={restaurant}
  form={form}
  setForm={setForm}
/>
<ToggleRow
  feature="digital_tip"
  dbColumn="feature_digital_tip"
  label="Dijital bahşiş"
  description="Ödeme sırasında garsona online bahşiş seçeneği."
  restaurant={restaurant}
  form={form}
  setForm={setForm}
/>
<ToggleRow
  feature="group_payment"
  dbColumn="feature_group_payment"
  label="Grup ödeme"
  description="Hesap birden fazla kişiye paylaştırılabilir."
  restaurant={restaurant}
  form={form}
  setForm={setForm}
/>
```

### PillarHeader component (inline or in same file)

```tsx
function PillarHeader({ title, accent }: { title: string; accent: string }) {
  return (
    <div style={{
      marginTop: 18,
      marginBottom: 6,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}>
      <div style={{
        width: 4,
        height: 14,
        background: accent,
        borderRadius: 1,
      }} />
      <span style={{
        fontSize: 11,
        fontWeight: 500,
        color: theme.mutedText,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
      }}>
        {title}
      </span>
    </div>
  );
}
```

Pillar accent colors:
- Pazarlama: `#1D9E75` (green) — not used in pilot
- Gelir Yönetimi: `#1D9E75` (green) — same family for now, distinguish post-pilot
- Tahsilat: `#534AB7` (purple)
- Satın Alma: `#888780` (gray) — not used in pilot

For the pilot, only purple Tahsilat and green Gelir Yönetimi appear. If the same accent shade for both feels confusing, use a slightly different hue for Gelir Yönetimi (e.g., `#10B981` matching the existing dashboard accent).

### ToggleRow component

This is the core component. It computes 3 states from plan + restaurant state:

```tsx
type ToggleRowProps = {
  feature: FeatureKey;       // for hasFeature() lookup
  dbColumn: keyof Restaurant; // for form[col] read/write — all are 'feature_*' boolean cols
  label: string;
  description: string;
  restaurant: Restaurant;
  form: any;
  setForm: (next: any) => void;
};

function ToggleRow({ feature, dbColumn, label, description, restaurant, form, setForm }: ToggleRowProps) {
  const isInPlan = hasFeature(restaurant, feature);
  const isOn = !!form[dbColumn];
  
  // Determine which plan unlocks this feature for the upgrade label
  const requiredPlan = getRequiredPlan(feature); // helper, see below
  
  if (!isInPlan) {
    // Plan-locked state
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 0',
        borderBottom: `0.5px solid ${theme.border}`,
        opacity: 0.6,
      }}>
        <div style={{ flex: 1, paddingRight: 16 }}>
          <div style={{
            fontSize: 14,
            color: theme.mutedText,
            marginBottom: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <span>{label}</span>
            <span style={{
              background: theme.pageBg,
              color: theme.mutedText,
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 3,
              fontWeight: 500,
              letterSpacing: 0.3,
              textTransform: 'uppercase',
            }}>
              {requiredPlan}
            </span>
          </div>
          <div style={{ fontSize: 12, color: theme.mutedText }}>
            {description}{' '}
            <a
              href="/iletisim?subject=plan-upgrade"
              style={{ color: '#DC2626', textDecoration: 'none', fontWeight: 500 }}
            >
              {requiredPlan}'a yükselt →
            </a>
          </div>
        </div>
        <DisabledSwitch />
      </div>
    );
  }
  
  // Plan-included state — toggle is interactive
  return (
    <label style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 0',
      borderBottom: `0.5px solid ${theme.border}`,
      cursor: 'pointer',
    }}>
      <div style={{ flex: 1, paddingRight: 16 }}>
        <div style={{ fontSize: 14, color: theme.value, marginBottom: 2 }}>
          {label}
        </div>
        <div style={{ fontSize: 12, color: theme.mutedText }}>
          {description}
        </div>
      </div>
      <Switch
        checked={isOn}
        onCheckedChange={(checked) => setForm({ ...form, [dbColumn]: checked })}
      />
    </label>
  );
}

function getRequiredPlan(feature: FeatureKey): string {
  // Find the lowest plan tier where this feature is true
  if (PLAN_FEATURES.premium[feature]) return 'Premium';
  if (PLAN_FEATURES.enterprise[feature]) return 'Enterprise';
  return 'Premium'; // fallback, shouldn't hit
}

function DisabledSwitch() {
  // Visual-only fake switch in the off position, no interactivity
  return (
    <div style={{
      width: 36,
      height: 22,
      background: theme.pageBg,
      border: `0.5px solid ${theme.border}`,
      borderRadius: 11,
      position: 'relative',
      flexShrink: 0,
      opacity: 0.6,
    }}>
      <div style={{
        width: 18,
        height: 18,
        background: '#D3D1C7',
        borderRadius: '50%',
        position: 'absolute',
        top: 1.5,
        left: 1.5,
      }} />
    </div>
  );
}
```

### Switch component

If audit Step D shows shadcn `Switch` is available, use `import { Switch } from '@/components/ui/switch'`. Otherwise, build a small custom pill switch matching admin theme:

```tsx
function Switch({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      style={{
        width: 36,
        height: 22,
        background: checked ? '#DC2626' : theme.subtle,
        borderRadius: 11,
        border: 'none',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 150ms ease',
        flexShrink: 0,
      }}
    >
      <div style={{
        width: 18,
        height: 18,
        background: 'white',
        borderRadius: '50%',
        position: 'absolute',
        top: 2,
        left: checked ? 16 : 2,
        transition: 'left 150ms ease',
        boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
      }} />
    </button>
  );
}
```

Pink-red `#DC2626` matches the Tabbled CTA color (Sepete Ekle, Kaydet).

---

## Step 5 — Save handler integration

The `handleSave` function in ProfilePanel must include the 4 new columns when writing to Supabase. Audit Step A3 reports which save handler to update. Add:

```ts
// In the upsert/update payload:
feature_table_reservation: form.feature_table_reservation,
feature_table_payment:     form.feature_table_payment,
feature_digital_tip:       form.feature_digital_tip,
feature_group_payment:     form.feature_group_payment,
```

And in the `form` initial state (where defaults are set on load):

```ts
feature_table_reservation: restaurant.feature_table_reservation ?? true,
feature_table_payment:     restaurant.feature_table_payment ?? true,
feature_digital_tip:       restaurant.feature_digital_tip ?? true,
feature_group_payment:     restaurant.feature_group_payment ?? true,
```

`?? true` because the DB default is TRUE — newly-loaded restaurants without these columns yet should still treat them as on.

---

## Step 6 — Smoke test

Manually verify before commit:

1. **Build passes:** `npm run build` clean.

2. **Migration applied:** SQL query confirms 7 feature_* columns exist.

3. **Premium restaurant test (Ramada or similar):**
   - Open ProfilePanel
   - Section "Özellikler" is visible
   - Two pillar headers: "Gelir Yönetimi" and "Tahsilat"
   - Sepet toggle: pink/active (assuming form has it true)
   - Garson çağırma, WhatsApp sipariş: pink/active toggles
   - Masa rezervasyonu, Masadan ödeme, Dijital bahşiş, Grup ödeme: 4 disabled rows with "Enterprise" badge + "Enterprise'a yükselt →" link
   - Click a Premium-included toggle (e.g., Garson çağırma off). Click ProfilePanel save. Reload page. Toggle remains off. DB row reflects `feature_waiter_calls=false`.

4. **Basic restaurant test:**
   - All 7 toggles except Sepet should be in disabled state with "Premium" or "Enterprise" badge
   - Sepet toggle: interactive (Basic includes cart per planFeatures.ts)

5. **Enterprise restaurant test:**
   - All 7 toggles interactive, no plan-locked rows
   - Toggle 4-7 (table_reservation through group_payment) start as ON by default for newly-saved restaurants (DB default TRUE)

6. **Click "Enterprise'a yükselt →" link** → opens `/iletisim?subject=plan-upgrade` page. Confirm the Contact page handles the subject query param (it should already, per project memory commit `8fdb862`).

7. **Legacy block dormant:** `SHOW_LEGACY_FEATURE_TOGGLES === false` is preserved. The legacy `<input type="checkbox">` rows are NOT visible. They sit dormant in code as documentation.

8. **Customer-facing impact:** Open the public menu of a restaurant where you just toggled OFF a feature (e.g., toggle off WhatsApp sipariş on Ramada). The corresponding feature should disappear from the public menu (the WhatsApp send button in cart). This validates the toggle is wired through to the public side. If it isn't, that's a separate bug — report but do not block this commit; the toggle UI itself is the deliverable.

---

## Commit message

```
feat(admin): plan-aware feature toggle UI in ProfilePanel

Replaces the dormant legacy SHOW_LEGACY_FEATURE_TOGGLES block with
a new "Özellikler" section grouped by 4-pillar structure. 7 toggles
in pilot scope, all in Tahsilat + Gelir Yönetimi pillars.

- Add 4 new DB columns (feature_table_reservation, feature_table_payment,
  feature_digital_tip, feature_group_payment), DEFAULT TRUE
- Add 4 corresponding keys to planFeatures.ts (Enterprise-only)
- Update Restaurant type with new boolean columns
- Render 3 toggle states per row: plan-included on, plan-included off,
  plan-locked (disabled + plan badge + upgrade link)
- Pillar headers with accent stripe (purple Tahsilat, green Gelir Yönetimi)
- Custom pill Switch component matching admin theme (#DC2626 active)
- Existing handleSave extended to persist new columns

Legacy SHOW_LEGACY_FEATURE_TOGGLES block left in file (still false) as
historical reference until cleanup migration drops feature_* columns
post-launch.
```

---

## Final notes for Claude Code

- **Stop at audit phase if anything doesn't match the spec.** Don't improvise.
- **Migration via Supabase Dashboard, not CLI.** Project memory: heredoc CLI deploys produce artifacts.
- **Customer-facing impact** — the toggles wire through to public menu visibility. If during smoke test step 8 you find a toggle doesn't actually hide its feature on the public side, report it separately. We're shipping the admin UI in this commit; public-side wiring fixes are separate work.
- **`STICKY_SAVE_PILOT_MENU_PANEL` flag is unrelated.** ProfilePanel uses its own existing save button. Do not extend the floating bar to ProfilePanel in this commit.
- This is a single commit. No incremental pushes.
