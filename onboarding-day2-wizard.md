# TABBLED — Onboarding Wizard Implementation (Day 2, Part 2)

## CONTEXT

Day 1 enabled self-serve Google signup. New users land on `/dashboard` with a draft restaurant ("İsimsiz Restoran", `temp-XXXXXXXX` slug, trial subscription active for 14 days).

Currently `/onboarding` is an orphan single-form page. This prompt REPLACES it with a 5-step wizard that turns the draft into a live restaurant.

DB prep (`onboarding-day2-db-prep.sql`) added `restaurant_type`, `city`, `district` columns. Day 1 added `onboarding_completed_at`, `trial_ends_at`, and the `start_trial(uuid)` RPC.

## STRATEGY: REPLACE (not extend)

Replace the body of `src/pages/Onboarding.tsx` entirely. Keep the file path and default export so `App.tsx:60` route and `Dashboard.tsx:49` redirect work without changes to those files (Dashboard.tsx will get a small condition update — see Step 2).

## WIZARD UX SHAPE

5 steps in a single fullscreen layout. Top: progress bar (5 dots, active = pink #FF4F7A). Center: current step content. Bottom: "Geri" + "İleri" / "Atla" / "Tamamla" buttons.

```
┌──────────────────────────────────────────────────┐
│           Tabbled logo                       4/5 │
│     ●─●─●─●─○                                    │
├──────────────────────────────────────────────────┤
│                                                  │
│   Step content (centered, max 480px wide)        │
│                                                  │
├──────────────────────────────────────────────────┤
│   [Geri]                          [Atla] [İleri] │
└──────────────────────────────────────────────────┘
```

- Mobile-friendly (stacked, full-width buttons, padding)
- Roboto font, Tabbled brand colors, Phosphor Thin icons
- Cannot close — wizard must be completed (or user logs out)

## STEPS DETAIL

### Step 1 — Restoran Bilgileri (REQUIRED — cannot skip)

Form fields:
- **Restoran Adı** (text input, required, max 80 chars) → updates `restaurants.name`
- **URL Slug** (text input, auto-generated from name, editable) → updates `restaurants.slug`
  - Auto-generate via `slugify`: lowercase, Turkish chars normalized (ş→s, ç→c, ğ→g, ı→i, ö→o, ü→u), spaces→`-`, only `[a-z0-9-]`
  - Show preview: `tabbled.com/menu/{slug}`
  - Validate: must be unique. Use Supabase query `select id from restaurants where slug=? and id!=current` — if found, show error "Bu URL zaten kullanılıyor"
  - Slug is initialized from the auto-generated value but user can override
- **Restoran Tipi** (select dropdown, required) → updates `restaurants.restaurant_type`
  - Options: `cafe` (Kafe), `restaurant` (Restoran), `hotel_restaurant` (Otel Restoranı), `patisserie` (Pastane), `bar` (Bar), `bakery` (Fırın), `other` (Diğer)
- **Şehir** (text input, required) → `restaurants.city`
- **İlçe** (text input, optional) → `restaurants.district`

Button states:
- "Geri" — disabled (first step)
- "İleri" — enabled when name + slug + type + city are filled and slug is unique

### Step 2 — Markanız (SKIPPABLE)

Form fields:
- **Logo** — uses `MediaPickerModal` with `accept='image'`. Shows preview when picked. → updates `restaurants.logo_url`. Call `attachMediaUsage` after pick.
- **Kapak Görseli/Video** — uses `MediaPickerModal` with `accept='image'` and a separate button for `accept='video'`. Or a single button that opens with `accept` toggle. Shows preview. → updates `restaurants.cover_url`. Call `attachMediaUsage`.
- **Tema** — radio buttons or button group:
  - White (light) — default, sample preview tile
  - Black (dark) — sample preview tile
  - → updates `restaurants.theme_color` (write `'white'` or `'black'`)

Button states:
- "Geri" — enabled
- "Atla" — enabled, jumps to Step 3 without saving
- "İleri" — enabled (no required fields)

### Step 3 — İletişim (SKIPPABLE)

Form fields:
- **Telefon** (text, optional, validate Turkish format loose: digits + `+90` prefix optional) → `restaurants.phone`
- **Adres** (textarea, optional, max 300 chars) → `restaurants.address`
- **Instagram** (text, optional, accept username with or without @) → `restaurants.social_instagram`
- **Facebook** (text, optional, full URL or username) → `restaurants.social_facebook`
- **Google Maps URL** (text, optional, validate as URL if filled) → `restaurants.social_google_maps`

Buttons: same as Step 2 (Geri / Atla / İleri).

### Step 4 — İlk Menü (SKIPPABLE)

Two-column layout (or stacked on mobile):
- **İlk Kategori Adı** (text input, optional) → if filled, will INSERT into `menu_categories` with name_tr, restaurant_id, sort_order=0, is_active=true
- **İlk Ürün Adı** (text input, optional) → if filled (and category filled), will INSERT into `menu_items` with name_tr, restaurant_id, category_id, sort_order=0, is_available=true
- **İlk Ürün Fiyatı** (number input, optional, validate >= 0) → menu_items.price
- **İlk Ürün Fotoğrafı** (button to open MediaPickerModal `accept='image'`, optional) → menu_items.image_url

Below the form: muted text "Sonradan istediğin kadar ürün ekleyebilirsin."

Buttons:
- "Geri"
- "Atla" — skips to Step 5 without writing anything
- "İleri" — if category filled but product empty → only insert category. If product filled but category empty → show error "Önce kategori ekleyin". If both filled → insert both.

### Step 5 — QR Kodunuz Hazır (FINAL)

This step both creates the QR code AND completes onboarding.

On enter (run once via `useEffect`):
1. Insert into `qr_codes`: `restaurant_id`, `label='Masa 1'`, `table_number='1'`, `url='https://tabbled.com/menu/{slug}?table=1'`, color/include_logo defaults from QRManager.tsx pattern
2. Render the `<QRCodeSVG>` preview centered, 240×240, with restaurant name below
3. Call `start_trial(restaurant_id)` RPC to mark `onboarding_completed_at`

Layout:
- Heading: "🎉 Menünüz Hazır!" (no emoji per memory rules — use a Phosphor `CheckCircle` Thin icon instead)
- Centered QR preview
- Caption: "QR kodunuzu indirip masalarınıza yerleştirin"
- Two buttons side by side:
  - **PNG İndir** — calls the `downloadQR` pattern from QRManager.tsx:124-160 (renders SVG to canvas, triggers download)
  - **PDF İndir** (optional — if quick to add, use jsPDF; if not, ship without it and add as P3)
- Below buttons: trial info card
  - Heading: "14 günlük ücretsiz denemen başladı"
  - Subtext: "Trial bitiminden önce bir plan seçerek devam edebilirsin"
  - Sub-subtext: "trial_ends_at" formatted as DD MMM YYYY
- Bottom: large pink "Public Menüye Git" button → `navigate('/menu/{slug}')` opens public menu in new tab AND `navigate('/dashboard')` for the wizard window.

Buttons (footer):
- "Geri" — enabled
- "Tamamla" — primary CTA, navigates to `/dashboard`

## DATA HANDLING

**Submit strategy: progressive saves, not all-at-once.**

When user clicks "İleri" or "Atla" on each step (1-4), persist that step's data immediately. This way if they refresh, their progress isn't lost AND if they exit early, partial data is captured. Step 5's `start_trial` RPC is the final marker.

For each step's persist:
- Step 1: `restaurants.update({name, slug, restaurant_type, city, district})` where id = restaurant.id
- Step 2: `restaurants.update({logo_url, cover_url, theme_color})` (only fields that were touched)
- Step 3: `restaurants.update({phone, address, social_instagram, social_facebook, social_google_maps})`
- Step 4: insert category (if filled), then insert product (if filled)
- Step 5: insert QR code, call `start_trial(restaurant.id)`, then navigate

**Error handling:**
- Show inline error below the failing field
- Show toast/error banner for save failures
- Don't advance to next step if current step failed to save

## STEP 2 OF THE PROMPT — UPDATE Dashboard.tsx ROUTING

Edit `src/pages/Dashboard.tsx` around line 44-57. The current logic:

```typescript
supabase.from('profiles').select('role, restaurant_id').eq('id', user.id).single()
  .then(({ data }) => {
    if (data && data.role !== 'super_admin' && !data.restaurant_id) {
      navigate('/onboarding', { replace: true });
      return;
    }
    setRole(data?.role ?? 'restaurant');
    setRestaurantId(data?.restaurant_id ?? null);
    setRoleLoading(false);
  });
```

Change to (minimum diff):

```typescript
supabase
  .from('profiles')
  .select('role, restaurant_id, restaurant:restaurants(onboarding_completed_at)')
  .eq('id', user.id)
  .single()
  .then(({ data }) => {
    if (data && data.role !== 'super_admin') {
      const needsOnboarding =
        !data.restaurant_id ||
        !data.restaurant?.onboarding_completed_at;
      if (needsOnboarding) {
        navigate('/onboarding', { replace: true });
        return;
      }
    }
    setRole(data?.role ?? 'restaurant');
    setRestaurantId(data?.restaurant_id ?? null);
    setRoleLoading(false);
  });
```

This makes Dashboard.tsx redirect to /onboarding for both new users (no restaurant_id, legacy path) AND new Google signups (has restaurant_id but onboarding not completed).

## STEP 3 OF THE PROMPT — KILL THE OLD INSERTS

In the new Onboarding.tsx implementation, do NOT include the old logic from L75-130:
- ❌ Don't INSERT into restaurants (trigger already created it — UPDATE existing)
- ❌ Don't UPDATE profiles.restaurant_id (trigger already linked)
- ❌ Don't INSERT into subscriptions (trigger already created the trial row)
- ❌ Don't manually set subscription_status, current_plan, ai_credits_total (trigger sets them)
- ✅ DO update restaurants.{name, slug, restaurant_type, city, district, logo_url, cover_url, theme_color, phone, address, socials}
- ✅ DO insert menu_categories + menu_items if step 4 filled
- ✅ DO insert qr_codes for Masa 1 in step 5
- ✅ DO call rpc('start_trial', {p_restaurant_id: restaurant.id}) at step 5

## STEP 4 — INITIAL DATA LOAD

The new Onboarding.tsx should load the existing draft restaurant on mount:

```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('restaurant_id')
  .eq('id', user.id)
  .single();

if (!profile?.restaurant_id) {
  // Edge case: no restaurant linked. Shouldn't happen post-Day-1, but handle.
  navigate('/dashboard');
  return;
}

const { data: restaurant } = await supabase
  .from('restaurants')
  .select('*')
  .eq('id', profile.restaurant_id)
  .single();

// If onboarding already completed, redirect away
if (restaurant.onboarding_completed_at) {
  navigate('/dashboard');
  return;
}

setRestaurant(restaurant);
// Pre-fill form fields from existing restaurant data (in case user resumed)
setForm({
  name: restaurant.name === 'İsimsiz Restoran' ? '' : restaurant.name,
  slug: restaurant.slug.startsWith('temp-') ? '' : restaurant.slug,
  restaurant_type: restaurant.restaurant_type ?? '',
  city: restaurant.city ?? '',
  district: restaurant.district ?? '',
  // ... etc per step
});
```

## CONSTRAINTS / STYLE

- Roboto font only (memory rule: no Playfair, no Inter)
- Phosphor Icons "Thin" weight (no emojis)
- Tabbled brand colors: pink #FF4F7A primary CTA, charcoal #1C1C1E text, off-white background
- Min body font 16px, button labels Medium 500
- Responsive: mobile-first, single column, generous padding
- No localStorage usage (memory rule)
- Use existing `S.*` inline style pattern (no new shadcn components)

## CONSTRAINTS / DEPENDENCIES

- `MediaPickerModal` import path: per discovery, RestaurantDashboard.tsx:14 imports it. Same import works in Onboarding.tsx.
- `attachMediaUsage` / `detachMediaUsage` — call when picking/unpicking images
- `<QRCodeSVG>` from `qrcode.react` — already in deps (used by QRManager.tsx)
- `start_trial(uuid)` RPC — already exists from Day 1
- No new npm packages needed unless you add jsPDF for PDF export (optional Step 5 feature — ship without if it adds risk)

## BUILD & DEPLOY

```bash
cd /opt/khp/tabbled
npm run build
```

If clean, push with this commit:

```
feat(onboarding): 5-step wizard for self-serve Google signups — collects restaurant info, brand, contact, first menu item, generates QR; calls start_trial on completion
```

Show diff before push. Wait for Murat's approval.

## TEST PLAN (Murat does this after deploy)

1. **Fresh Google signup test:**
   - Incognito browser, sign in with NEW Google account
   - Lands on /onboarding (not /dashboard)
   - Progress bar shows 1/5
   - Fill Step 1, click İleri → moves to Step 2
   - Skip Step 2 (Atla) → moves to Step 3
   - Skip Step 3 → moves to Step 4
   - Fill category + product → click İleri
   - Step 5: QR code visible, "14 günlük denemen başladı" shown
   - Click "Tamamla" → lands on /dashboard
   - Dashboard shows real restaurant name (not "İsimsiz Restoran")
   - Public menu URL works: tabbled.com/menu/{your-slug}

2. **Resume test:**
   - Same user, refresh during Step 3
   - Should land on /onboarding still (since onboarding_completed_at is NULL)
   - Step 1 fields should be pre-filled from earlier saves

3. **Already-completed user test:**
   - Logout, login again with same account
   - Should land on /dashboard directly (not /onboarding)

4. **Slug uniqueness:**
   - Try setting slug = "ramada-encore-bayrampasa" (existing customer's slug)
   - Should show error "Bu URL zaten kullanılıyor"

5. **Verify in DB:**
```sql
SELECT name, slug, restaurant_type, city, district, theme_color, 
       onboarding_completed_at, subscription_status
FROM restaurants
WHERE id = 'YOUR-RESTAURANT-ID';

SELECT * FROM menu_categories WHERE restaurant_id = 'YOUR-RESTAURANT-ID';
SELECT * FROM menu_items WHERE restaurant_id = 'YOUR-RESTAURANT-ID';
SELECT * FROM qr_codes WHERE restaurant_id = 'YOUR-RESTAURANT-ID';
```

## ROLLBACK

```bash
git revert HEAD
git push origin main
```

DB rollback (only if you also want to remove the new columns):
```sql
ALTER TABLE public.restaurants DROP COLUMN IF EXISTS restaurant_type;
ALTER TABLE public.restaurants DROP COLUMN IF EXISTS city;
ALTER TABLE public.restaurants DROP COLUMN IF EXISTS district;
ALTER TABLE public.restaurants DROP CONSTRAINT IF EXISTS restaurants_type_check;
```
