# TABBLED — Trial UX Combined Fix

## CONTEXT

Day 2 wizard shipped successfully. Testing revealed 2 UX bugs + 1 missing feature:

1. **Misleading banner:** Dashboard shows "PREMIUM · Daha fazla özellik için Premium'a geçin". Basic trial users read the "PREMIUM" badge as their current plan. Confusion.
2. **Trial AI unavailable:** New Google signups have `ai_credits_total=0`, so they can't experience AI features during trial. This kills conversion — they never see "wow, AI works".
3. **Wizard AI missing:** Wizard Step 4 collects first product but doesn't offer AI description. Missed onboarding opportunity.

## LOCKED DECISIONS

- **Trial credit budget:** 15 credits = exactly 1 AI description (15 credits each). Used once in wizard Step 4, then depleted.
- **Post-trial AI:** blocked by existing 0-credit flow (Edge Function returns error when credits insufficient — already behaves correctly).
- **Banner copy:** show current plan state first, upsell second. "BASIC DENEME · 14 gün kaldı" not "PREMIUM".
- **Dismiss:** remove localStorage-backed dismiss. Memory rule forbids browser storage. The banner should always show for Basic users (upsell opportunity is valuable).

## 4 FIXES IN THIS PROMPT

### FIX 1 — Update handle_new_user trigger to grant 15 trial credits

Run this SQL in Supabase SQL Editor BEFORE deploying the frontend changes:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_restaurant_id UUID;
  v_basic_plan_id UUID := '8b7e331c-64c5-4b48-9abe-4cfb12382b7e'::uuid;
  v_temp_slug TEXT;
  v_user_email TEXT;
  v_user_name TEXT;
BEGIN
  v_user_email := NEW.email;
  v_user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  v_temp_slug := 'temp-' || substring(NEW.id::text, 1, 8);

  INSERT INTO public.restaurants (
    name, slug, is_active, subscription_status, current_plan,
    trial_ends_at, onboarding_completed_at,
    ai_credits_total, ai_credits_used
  ) VALUES (
    'İsimsiz Restoran',
    v_temp_slug,
    true,
    'trial',
    'basic',
    NOW() + INTERVAL '14 days',
    NULL,
    15,     -- 15 credits = exactly 1 AI description for wizard demo
    0
  )
  RETURNING id INTO v_restaurant_id;

  INSERT INTO public.profiles (id, email, full_name, role, restaurant_id)
  VALUES (NEW.id, v_user_email, v_user_name, 'restaurant', v_restaurant_id);

  INSERT INTO public.subscriptions (
    restaurant_id, plan_id, start_date, end_date,
    status, payment_method, notes
  ) VALUES (
    v_restaurant_id, v_basic_plan_id,
    CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days',
    'active', 'trial',
    'Auto-created by Google signup trigger'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger re-bind (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing trial restaurants that have 0 credits
UPDATE public.restaurants
SET ai_credits_total = 15
WHERE subscription_status = 'trial'
  AND ai_credits_total = 0
  AND ai_credits_used = 0;

-- Verify
SELECT name, subscription_status, current_plan, ai_credits_total, ai_credits_used
FROM public.restaurants
WHERE subscription_status = 'trial'
ORDER BY created_at DESC;
-- Expected: all trial restaurants have ai_credits_total=15
```

### FIX 2 — Banner copy fix (RestaurantDashboard.tsx)

Locate the banner (around line 395-402 and the JSX that renders "Daha fazla özellik için Premium'a geçin"). Replace with plan-aware version.

Required grep first:

```bash
cd /opt/khp/tabbled
grep -n "Daha fazla özellik için Premium\|premiumBannerDismissed\|tabbled_premium_dismissed" src/pages/RestaurantDashboard.tsx
```

Replace the banner JSX with:

```tsx
{/* Upsell banner — shown only to Basic plan users */}
{restaurant?.current_plan === 'basic' && !trialExpired && (
  <div style={{
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 12,
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 16,
    flexWrap: 'wrap',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
      <span style={{
        background: trialDaysLeft !== null ? '#ECFDF5' : '#F3F4F6',
        color: trialDaysLeft !== null ? '#065F46' : '#374151',
        fontSize: 11,
        fontWeight: 500,
        padding: '4px 10px',
        borderRadius: 999,
        whiteSpace: 'nowrap',
        letterSpacing: '0.3px',
      }}>
        {trialDaysLeft !== null
          ? `BASIC DENEME · ${trialDaysLeft} gün kaldı`
          : 'BASIC'}
      </span>
      <span style={{ fontSize: 14, color: '#6B7280', flex: 1, minWidth: 0 }}>
        Tüm özelliklere erişim için Premium'a yükseltin.
      </span>
    </div>
    <a
      href="/iletisim?plan=premium&source=upgrade_banner"
      style={{
        background: '#FF4F7A',
        color: '#FFFFFF',
        padding: '8px 16px',
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 500,
        textDecoration: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      Yükselt
    </a>
  </div>
)}
```

**Also REMOVE:**
- `premiumBannerDismissed` useState declaration
- `dismissPremiumBanner` handler
- Any `localStorage.setItem('tabbled_premium_dismissed', ...)` or `localStorage.getItem(...)` related to this banner
- The X close button in the old banner JSX

Banner now always shows for Basic users, always hidden for Pro/Premium/Enterprise users. No dismiss.

Note: `trialDaysLeft` is already a useState in RestaurantDashboard.tsx (set by checkSubscription at line ~472). Reuse it as-is.

### FIX 3 — Wizard Step 4: Add "AI ile açıklama oluştur" button (Onboarding.tsx)

Locate Step 4 in Onboarding.tsx (the "İlk Menü" step). Find the "İlk Ürün Adı" input field. Below or next to the description input, add an AI generation button.

Required discovery first:

```bash
grep -n "generateAIDescription\|functions.invoke\|generate-description" src/ -r --include="*.tsx" --include="*.ts"
```

Identify the exact function name and import path. Reuse the existing AI call pattern — do NOT write a new Edge Function invocation from scratch.

Button placement: next to the description textarea in Step 4. Only visible when product_name is filled.

Button behavior:

```tsx
const [aiLoading, setAiLoading] = useState(false);
const [aiUsed, setAiUsed] = useState(false); // local state — once used, button disabled

const handleGenerateDescription = async () => {
  if (!productName || aiLoading || aiUsed) return;
  
  setAiLoading(true);
  try {
    // Reuse existing generateAIDescription pattern.
    // The existing call probably uses supabase.functions.invoke(...) or fetch.
    // Pass item_id='new' (the Edge Function already supports this sentinel per discovery).
    const { data, error } = await supabase.functions.invoke('generate-description', {
      body: {
        restaurant_id: restaurant.id,
        item_id: 'new',
        item_name: productName,
        language: 'tr',
      },
    });
    
    if (error) throw error;
    if (data?.description) {
      setProductDescription(data.description);
      setAiUsed(true);
      // Also refetch restaurant to update credit counts in state
      // (Edge Function already debits the 15 credits server-side)
    }
  } catch (err) {
    console.error('AI description generation failed:', err);
    setAiError('AI açıklama oluşturulamadı. Lütfen manuel girin.');
  } finally {
    setAiLoading(false);
  }
};
```

Button JSX (place next to or below the description textarea):

```tsx
<button
  type="button"
  onClick={handleGenerateDescription}
  disabled={!productName || aiLoading || aiUsed}
  style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 12px',
    background: aiUsed ? '#F3F4F6' : '#FDF2F8',
    color: aiUsed ? '#9CA3AF' : '#DB2777',
    border: `1px solid ${aiUsed ? '#E5E7EB' : '#FBCFE8'}`,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    cursor: (!productName || aiLoading || aiUsed) ? 'not-allowed' : 'pointer',
    alignSelf: 'flex-start',
  }}
>
  <Sparkle size={14} weight="thin" />
  {aiLoading
    ? 'Oluşturuluyor...'
    : aiUsed
      ? 'AI ile oluşturuldu'
      : 'AI ile açıklama oluştur'}
</button>

{aiUsed && (
  <p style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
    Trial'da 1 AI kullanımı hakkınız vardı. Daha fazlası için Premium'a yükseltin.
  </p>
)}
```

(Sparkle or Magic icon from Phosphor Thin. Pick one that exists; MagicWand is typical.)

Also add a product_description field to Step 4 state if not already there. The description gets saved to `menu_items.description_tr` when the user clicks "İleri" on Step 4.

### FIX 4 — Reset test user's credits (manual cleanup)

After the trigger is updated, existing test user "Mahmut" (id `6580ce16-ac27-4ca9-9570-3773145715e7`) was already updated by the backfill UPDATE. No additional action needed — just verify with:

```sql
SELECT name, ai_credits_total, ai_credits_used
FROM public.restaurants
WHERE id = '6580ce16-ac27-4ca9-9570-3773145715e7';
-- Expected: ai_credits_total=15, ai_credits_used=0
```

---

## BUILD & DEPLOY

```bash
cd /opt/khp/tabbled
npm run build
```

If clean, show diff (especially Onboarding.tsx + RestaurantDashboard.tsx changes). Push with:

```
fix(dashboard+onboarding): trial UX — accurate 'BASIC DENEME · X gün' banner, 15 trial AI credits, AI description button in wizard step 4, remove localStorage-backed banner dismiss
```

---

## TEST PLAN (Murat after deploy)

**A. Banner test (existing Mahmut account):**
- Login as khotelpartners
- Dashboard banner should show: `[BASIC DENEME · 14 gün kaldı]` (or fewer days) + "Tüm özelliklere erişim için Premium'a yükseltin." + [Yükselt]
- No "PREMIUM" text in isolation
- No X dismiss button
- Refresh page → banner still shows (no localStorage persistence)

**B. Wizard AI button test (new signup):**
- Incognito, use Mahmut's account after resetting onboarding (SQL to reset included below if needed)
- Step 4: enter product name "Türk Kahvesi"
- Click "AI ile açıklama oluştur"
- After 2-5 sec, description appears in textarea
- Button shows "AI ile oluşturuldu" and becomes grayed out
- Click İleri → product saves with AI-generated description
- Step 5 → complete wizard
- Dashboard now shows "BASIC DENEME · 14 gün" with 0 credits left (`ai_credits_used=15`)

**C. No-credits test (post-wizard AI attempt):**
- In dashboard, try to generate description for another product (in admin panel, not wizard)
- Should see error "AI kredin bitti" or similar (Edge Function returns error when ai_credits_used >= ai_credits_total)
- Prompts user to upgrade

**D. Ramada test (no regression):**
- Login as muratkiran@ramadaencorebayrampasa.com
- Dashboard should NOT show the upsell banner (Ramada is not current_plan='basic')
- Everything else works as before

**To reset Mahmut for re-test:**

```sql
-- Reset for a clean wizard test
UPDATE public.restaurants
SET 
  onboarding_completed_at = NULL,
  name = 'İsimsiz Restoran',
  slug = 'temp-' || substring(id::text, 1, 8),
  restaurant_type = NULL,
  city = NULL,
  district = NULL,
  logo_url = NULL,
  cover_url = NULL,
  phone = NULL,
  address = NULL,
  social_instagram = NULL,
  social_facebook = NULL,
  social_google_maps = NULL,
  ai_credits_total = 15,
  ai_credits_used = 0
WHERE id = '6580ce16-ac27-4ca9-9570-3773145715e7';

DELETE FROM menu_items WHERE restaurant_id = '6580ce16-ac27-4ca9-9570-3773145715e7';
DELETE FROM menu_categories WHERE restaurant_id = '6580ce16-ac27-4ca9-9570-3773145715e7';
DELETE FROM qr_codes WHERE restaurant_id = '6580ce16-ac27-4ca9-9570-3773145715e7';
```

---

## ROLLBACK

```bash
git revert HEAD
git push origin main
```

SQL rollback (trigger only):
```sql
-- Restore old trigger (pre-15-credit version). Only do this if frontend is also reverted.
-- Or: just UPDATE restaurants SET ai_credits_total = 0 WHERE subscription_status = 'trial';
```

## FLAGS / NOTES FOR CLAUDE CODE

1. **Edge Function CORS** is hard-coded to `https://tabbled.com` (per earlier discovery). If the AI description endpoint needs CORS changes, flag it — don't modify the function in this prompt unless it breaks the flow.

2. **`trialDaysLeft` reuse** — do NOT add a new state variable. The existing `trialDaysLeft` is set by `checkSubscription` around line 472. Reuse it.

3. **Button accessibility** — `aria-label` on the AI button; Phosphor icon inside a `<button>` needs screen-reader text.

4. **Don't touch the expired-trial gate** (lines 1107-1149). That's working correctly.

5. **If `generate-description` Edge Function name differs** from what's in the code (e.g., `generate-menu-description`), use the actual name from the grep at Fix 3. Do not invent a name.
