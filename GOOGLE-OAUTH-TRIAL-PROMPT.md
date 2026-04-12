# TABBLED — GOOGLE OAUTH + 14 GÜN TRİAL + ONBOARDING
## Admin Panel: Google Login + Otomatik Trial + Onboarding Formu

---

## GENEL BAKIŞ

Bu prompt 4 iş yapacak:
1. **Login sayfası** — Mevcut email/password yanına "Google ile Giriş Yap" butonu
2. **Onboarding sayfası** — İlk kez giriş yapan kullanıcıya restoran bilgileri formu
3. **Otomatik trial** — Onboarding sonrası 14 gün Basic trial subscription oluştur
4. **Trial kilitleme** — Süre bitince dashboard erişimi engelle, plan satın alma yönlendirmesi

**KAPSAM DIŞI:** Public menüde müşteri login yok — sadakat programıyla birlikte gelecek.

---

## ADIM 0: MEVCUT DURUMU KEŞFET

```bash
cd /opt/khp/tabbled

# Login sayfası
cat src/pages/Login.tsx

# Auth hook
cat src/lib/useAuth.ts

# Supabase client
cat src/lib/supabase.ts

# Dashboard router (role yönlendirme)
cat src/pages/Dashboard.tsx

# Mevcut profiles yapısı
grep -rn "interface.*Profile\|type.*Profile\|role\|restaurant_id" src/ --include="*.ts" --include="*.tsx" | head -20

# Mevcut subscription/plan yapısı
grep -rn "subscription_status\|current_plan\|subscription\|plan_id" src/ --include="*.ts" --include="*.tsx" | head -20

# handle_new_user trigger — bu Google OAuth ile de çalışır
grep -rn "handle_new_user" supabase/ src/ --include="*.ts" --include="*.sql" 2>/dev/null | head -5

# Router yapısı (route'lar nerede tanımlı)
grep -rn "Route\|path.*dashboard\|path.*login\|path.*onboarding" src/ --include="*.tsx" | head -20

# Mevcut subscription_plans tablosundaki plan isimleri
grep -rn "Basic\|Premium\|Enterprise\|subscription_plans" src/ --include="*.ts" --include="*.tsx" | head -10
```

---

## ADIM 1: LOGIN SAYFASI — GOOGLE BUTONU

### Dosya: src/pages/Login.tsx

Mevcut email/password formunun **üstüne** Google login butonu ekle.

**Eklenecek state:**
```typescript
const [googleLoading, setGoogleLoading] = useState(false);
```

**Google OAuth handler:**
```typescript
const handleGoogleLogin = async () => {
  setGoogleLoading(true);
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) {
      toast({ title: "Google giriş hatası", description: error.message, variant: "destructive" });
    }
  } catch (err) {
    toast({ title: "Bağlantı hatası", variant: "destructive" });
  } finally {
    setGoogleLoading(false);
  }
};
```

**Buton + ayırıcı (mevcut formun ÜSTÜNE ekle):**
```tsx
{/* Google Login */}
<button
  onClick={handleGoogleLogin}
  disabled={googleLoading}
  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors font-medium text-[#1C1C1E] disabled:opacity-50"
>
  {googleLoading ? (
    <div className="w-5 h-5 border-2 border-gray-300 border-t-[#FF4F7A] rounded-full animate-spin" />
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )}
  {googleLoading ? 'Bağlanıyor...' : 'Google ile Giriş Yap'}
</button>

{/* Ayırıcı */}
<div className="flex items-center gap-4 my-6">
  <div className="flex-1 h-px bg-gray-200" />
  <span className="text-sm text-gray-400">veya</span>
  <div className="flex-1 h-px bg-gray-200" />
</div>

{/* === MEVCUT EMAIL/PASSWORD FORMU BURADAN DEVAM EDER === */}
```

---

## ADIM 2: ONBOARDING SAYFASI

### Yeni dosya: src/pages/Onboarding.tsx

İlk kez Google ile giriş yapan kullanıcı (profiles tablosunda `restaurant_id = null`) bu sayfaya yönlendirilir.

```tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Helmet } from 'react-helmet-async';

const Onboarding = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [form, setForm] = useState({
    restaurant_name: '',
    phone: '',
    address: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auth kontrolü — login değilse /login'e yönlendir
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login', { replace: true });
        return;
      }

      // Zaten restoran bağlıysa dashboard'a yönlendir
      const { data: profile } = await supabase
        .from('profiles')
        .select('restaurant_id, role')
        .eq('id', user.id)
        .single();

      if (profile?.restaurant_id) {
        navigate('/dashboard', { replace: true });
        return;
      }

      // Super admin onboarding'e girmez
      if (profile?.role === 'super_admin') {
        navigate('/dashboard', { replace: true });
        return;
      }

      setCheckingAuth(false);
    };
    checkAuth();
  }, [navigate]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.restaurant_name.trim()) {
      newErrors.restaurant_name = 'İşletme adı zorunludur';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Oturum bulunamadı');

      // 1. Slug oluştur (Türkçe karakter desteği)
      const slug = form.restaurant_name.trim()
        .toLowerCase()
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        + '-' + Math.random().toString(36).substring(2, 6);

      // 2. Restoran oluştur
      const { data: restaurant, error: restError } = await supabase
        .from('restaurants')
        .insert({
          name: form.restaurant_name.trim(),
          slug: slug,
          phone: form.phone.trim() || null,
          address: form.address.trim() || null,
          is_active: true,
          subscription_status: 'trial',
          current_plan: 'basic',
          theme_color: 'white',
        })
        .select()
        .single();

      if (restError) throw restError;

      // 3. Profile'a restaurant_id bağla + isim güncelle
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          restaurant_id: restaurant.id,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '',
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 4. Trial subscription oluştur (14 gün Basic)
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);

      // Basic plan ID'sini bul
      const { data: plans } = await supabase
        .from('subscription_plans')
        .select('id, name')
        .order('sort_order', { ascending: true });

      const basicPlan = plans?.find(p =>
        p.name.toLowerCase().includes('basic') || p.name.toLowerCase().includes('başlangıç')
      );

      if (basicPlan) {
        await supabase
          .from('subscriptions')
          .insert({
            restaurant_id: restaurant.id,
            plan_id: basicPlan.id,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            status: 'active',
            payment_method: 'trial',
            notes: '14 gün ücretsiz deneme — Google ile kayıt',
          });
      }

      // 5. plan_features ekle (Basic plan özellikleri)
      // Bu super admin tarafından zaten features + plan_features tablosunda yönetiliyor
      // Yeni restoran otomatik olarak plan'ın özelliklerini alır (mevcut sistem)

      // 6. Dashboard'a yönlendir
      navigate('/dashboard', { replace: true });

    } catch (err: any) {
      console.error('Onboarding error:', err);
      setErrors({ submit: err.message || 'Bir hata oluştu. Lütfen tekrar deneyin.' });
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-[#FF4F7A] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>İşletme Bilgileri | Tabbled</title>
      </Helmet>
      <div className="min-h-screen bg-[#F7F7F8] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <img
              src="/tabbled-logo-horizontal.png"
              alt="Tabbled"
              className="h-8 mx-auto mb-6"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <h1 className="text-2xl font-bold text-[#1C1C1E]">Hoş Geldiniz!</h1>
            <p className="text-gray-500 mt-2">
              İşletme bilgilerinizi girin, 14 günlük ücretsiz denemeniz hemen başlasın.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-sm space-y-5">
            {/* İşletme Adı (zorunlu) */}
            <div>
              <label className="block text-sm font-medium text-[#1C1C1E] mb-1.5">
                İşletme Adı <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.restaurant_name}
                onChange={(e) => setForm(prev => ({ ...prev, restaurant_name: e.target.value }))}
                placeholder="Örn: Café Istanbul"
                className={`w-full px-4 py-3 rounded-lg border ${errors.restaurant_name ? 'border-red-400' : 'border-gray-200'} focus:border-[#FF4F7A] focus:ring-1 focus:ring-[#FF4F7A] outline-none transition-colors`}
                autoFocus
              />
              {errors.restaurant_name && (
                <p className="text-red-500 text-xs mt-1">{errors.restaurant_name}</p>
              )}
            </div>

            {/* Telefon (opsiyonel) */}
            <div>
              <label className="block text-sm font-medium text-[#1C1C1E] mb-1.5">
                Telefon
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Örn: 0212 555 1234"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#FF4F7A] focus:ring-1 focus:ring-[#FF4F7A] outline-none transition-colors"
              />
            </div>

            {/* Adres (opsiyonel) */}
            <div>
              <label className="block text-sm font-medium text-[#1C1C1E] mb-1.5">
                Adres
              </label>
              <textarea
                value={form.address}
                onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Örn: Beyoğlu, İstanbul"
                rows={2}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#FF4F7A] focus:ring-1 focus:ring-[#FF4F7A] outline-none transition-colors resize-none"
              />
            </div>

            {/* Hata mesajı */}
            {errors.submit && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">
                {errors.submit}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-bold text-white bg-[#FF4F7A] hover:bg-[#E63D66] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Oluşturuluyor...
                </>
              ) : (
                'Denemeyi Başlat'
              )}
            </button>

            {/* Bilgi notu */}
            <p className="text-xs text-gray-400 text-center">
              Kredi kartı gerekmez · 14 gün ücretsiz · İstediğiniz zaman iptal
            </p>
          </form>
        </div>
      </div>
    </>
  );
};

export default Onboarding;
```

---

## ADIM 3: ROUTER GÜNCELLEME

### Dosya: Router'ın tanımlı olduğu dosyayı bul ve /onboarding route'u ekle

```bash
grep -rn "createBrowserRouter\|BrowserRouter\|<Route\|path=" src/ --include="*.tsx" | head -20
```

Bulunan router dosyasına ekle:

```tsx
// Lazy import
const Onboarding = React.lazy(() => import('./pages/Onboarding'));

// Route ekle (login ve dashboard arasına)
<Route path="/onboarding" element={
  <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-gray-300 border-t-[#FF4F7A] rounded-full animate-spin" /></div>}>
    <Onboarding />
  </Suspense>
} />
```

### Vercel rewrites (SPA routing)

```bash
cat vercel.json
```

Eğer vercel.json'da catch-all rewrite varsa (`"source": "/(.*)"`) sorun yok. Yoksa /onboarding için rewrite ekle.

---

## ADIM 4: DASHBOARD'DA ONBOARDING YÖNLENDİRME

### Dosya: src/pages/Dashboard.tsx

Dashboard açılırken profile kontrol et — restaurant_id yoksa onboarding'e yönlendir.

```bash
cat src/pages/Dashboard.tsx
```

Mevcut auth/profile kontrolünde şu koşulu ekle:

```typescript
// Mevcut profile fetch'ten sonra:
if (profile && profile.role !== 'super_admin' && !profile.restaurant_id) {
  navigate('/onboarding', { replace: true });
  return;
}
```

Bu kontrolü mevcut `useEffect` veya auth check bloğunda yap. Super admin'ler onboarding'e yönlendirilmez.

---

## ADIM 5: TRİAL KİLİTLEME

### Dosya: src/pages/RestaurantDashboard.tsx

Dashboard açılırken subscription durumunu kontrol et. Trial süresi bittiyse dashboard'u kilitle.

**Subscription kontrolü — RestaurantDashboard'un en üstüne ekle:**

```typescript
const [trialExpired, setTrialExpired] = useState(false);
const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);

useEffect(() => {
  if (!restaurant?.id) return;

  const checkSubscription = async () => {
    // Aktif subscription bul
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('*, subscription_plans(name)')
      .eq('restaurant_id', restaurant.id)
      .order('end_date', { ascending: false })
      .limit(1);

    const activeSub = subs?.[0];

    if (!activeSub) {
      // Subscription yok — kilitle
      setTrialExpired(true);
      return;
    }

    const endDate = new Date(activeSub.end_date);
    const now = new Date();
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft <= 0) {
      // Süre dolmuş
      setTrialExpired(true);

      // DB'de status'u expired yap
      if (activeSub.status !== 'expired') {
        await supabase
          .from('subscriptions')
          .update({ status: 'expired' })
          .eq('id', activeSub.id);
      }
    } else {
      setTrialDaysLeft(daysLeft);
    }
  };

  checkSubscription();
}, [restaurant?.id]);
```

**Trial süresi dolmuşsa kilit ekranı göster:**

```tsx
// RestaurantDashboard return'ünün EN BAŞINA ekle (tüm dashboard içeriğinden önce):
if (trialExpired) {
  return (
    <div className="min-h-screen bg-[#F7F7F8] flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <img
          src="/tabbled-logo-horizontal.png"
          alt="Tabbled"
          className="h-8 mx-auto mb-8"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <Warning size={32} weight="thin" className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-[#1C1C1E] mb-2">
            Deneme Süreniz Doldu
          </h2>
          <p className="text-gray-500 mb-6">
            14 günlük ücretsiz deneme süreniz sona erdi. Tabbled'ı kullanmaya devam etmek için bir plan seçin.
          </p>
          <a
            href="/iletisim?plan=basic&source=trial_expired"
            className="block w-full py-3 rounded-lg font-bold text-white bg-[#FF4F7A] hover:bg-[#E63D66] transition-colors text-center"
          >
            Plan Seçin
          </a>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/login';
            }}
            className="block w-full mt-3 py-3 text-gray-400 text-sm hover:text-gray-600 transition-colors"
          >
            Çıkış Yap
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Import ekle:**
```typescript
import { Warning } from "@phosphor-icons/react";
```

**Trial uyarı banner'ı (son 3 gün kala):**

Dashboard'ın ana içeriğinin en üstüne, sidebar'ın altına veya içerik alanının en tepesine ekle:

```tsx
{trialDaysLeft !== null && trialDaysLeft <= 3 && !trialExpired && (
  <div className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center justify-between">
    <div className="flex items-center gap-2">
      <Warning size={18} weight="thin" className="text-amber-600" />
      <span className="text-sm text-amber-800">
        Deneme süreniz {trialDaysLeft} gün sonra doluyor.
      </span>
    </div>
    <a
      href="/iletisim?plan=basic&source=trial_warning"
      className="text-sm font-medium text-[#FF4F7A] hover:text-[#E63D66]"
    >
      Plan Seçin →
    </a>
  </div>
)}
```

---

## ADIM 6: RLS — ONBOARDING INSERT İZİNLERİ

Google OAuth ile giriş yapan yeni kullanıcının restoran + subscription oluşturabilmesi için RLS policy'leri kontrol et.

```bash
# Mevcut RLS policy'lerini kontrol et
grep -rn "CREATE POLICY\|RLS\|ENABLE ROW" supabase/ 2>/dev/null | head -20
```

**Gerekli policy'ler:**

Authenticated kullanıcının restoran oluşturabilmesi:
```sql
-- Eğer restaurants INSERT policy'si sadece super_admin ise, authenticated kullanıcılar için de ekle:
-- KONTROL ET: Mevcut policy yeterliyse dokunma.
-- Eğer yetersizse şu policy'yi ekle:

-- Authenticated user restoran oluşturabilir (onboarding için)
-- NOT: Mevcut policy durumuna göre gerekip gerekmediğini kontrol et
```

**ÖNEMLİ:** Önce mevcut RLS policy'lerini kontrol et. Eğer mevcut policy'ler authenticated INSERT'e izin veriyorsa dokunma. Vermiyorsa, Supabase Dashboard'dan gerekli policy'leri ekle.

Onboarding'de kullanılan tablolar ve gerekli izinler:
- `restaurants` → INSERT (yeni restoran oluşturma)
- `profiles` → UPDATE (restaurant_id bağlama)
- `subscriptions` → INSERT (trial oluşturma)
- `subscription_plans` → SELECT (plan ID bulma)

Her birinin mevcut RLS policy'lerini kontrol et. Eksik varsa Supabase Dashboard'dan ekle.

---

## ADIM 7: HANDLE_NEW_USER TRİGGER KONTROLÜ

Mevcut `handle_new_user()` trigger'ı yeni auth user oluşturulunca otomatik profiles'a satır ekliyor (role: restaurant). Google OAuth ile de aynı trigger çalışır.

```bash
# Trigger kodunu kontrol et
grep -rn "handle_new_user\|CREATE.*TRIGGER\|auth.users" supabase/ 2>/dev/null | head -10
```

Trigger'ın Google OAuth metadata'sını da alıp full_name'e yazıp yazmadığını kontrol et. Yazması lazım:

```sql
-- Trigger'da şuna benzer bir satır olmalı:
-- NEW.raw_user_meta_data->>'full_name' veya NEW.raw_user_meta_data->>'name'
```

Google OAuth'ta `raw_user_meta_data` şöyle gelir:
```json
{
  "full_name": "Murat Kıran",
  "name": "Murat Kıran",
  "avatar_url": "https://...",
  "email": "murat@gmail.com",
  "provider_id": "...",
  "sub": "..."
}
```

Eğer trigger full_name'i almıyorsa, Onboarding.tsx'te zaten profile update yapıyoruz — sorun değil.

---

## BUILD & TEST

```bash
cd /opt/khp/tabbled
npm run build
```

Hata yoksa:
```bash
echo "BUILD OK — Google OAuth + Trial sistemi tamamlandı"
```

---

## GIT PUSH

```bash
cd /opt/khp/tabbled
git add -A
git commit -m "feat: Google OAuth + 14-day trial + onboarding

- Login page: Google sign-in button with OAuth flow
- Onboarding page: restaurant name + phone + address form
- Auto-create restaurant + 14-day Basic trial subscription
- Trial lock screen when expired (plan selection redirect)
- Trial warning banner (last 3 days)
- Lazy loaded /onboarding route
- Dashboard redirect for users without restaurant_id"
git push origin main
```

---

## SONRA YAPILACAK (MANUEL — Claude Code çalıştırmadan ÖNCE)

### 1. Supabase Dashboard → Authentication → Providers → Google
- **Enable** Google provider
- Google Client ID ve Client Secret gir (aşağıda nasıl alınacağı var)

### 2. Google Cloud Console → OAuth ayarları
1. https://console.cloud.google.com → mevcut proje
2. APIs & Services → Credentials → Create Credentials → OAuth client ID
3. Application type: **Web application**
4. Name: "Tabbled Login"
5. Authorized JavaScript origins:
   - `https://tabbled.com`
   - `http://localhost:5173` (development)
6. Authorized redirect URIs:
   - `https://qmnrawqvkwehufebbkxp.supabase.co/auth/v1/callback`
7. Create → Client ID ve Client Secret'ı kopyala

### 3. OAuth Consent Screen (ilk kez yapılıyorsa)
1. APIs & Services → OAuth consent screen
2. User Type: **External**
3. App name: "Tabbled"
4. User support email: info@tabbled.com
5. Authorized domains: `tabbled.com`, `supabase.co`
6. Developer contact: kiran.murat@gmail.com
7. Scopes: email, profile, openid
8. Save

### 4. Supabase'e Client ID/Secret gir
- Supabase Dashboard → Authentication → Providers → Google
- Client ID: yapıştır
- Client Secret: yapıştır
- Save

### 5. RLS policy kontrol
- Supabase Dashboard → Table Editor → restaurants → RLS
- Authenticated INSERT policy var mı kontrol et
- Aynısını subscriptions tablosu için de kontrol et

### 6. Site URL kontrolü
- Supabase Dashboard → Authentication → URL Configuration
- Site URL: `https://tabbled.com`
- Redirect URLs'e ekle: `https://tabbled.com/dashboard`, `https://tabbled.com/onboarding`

---

## KONTROL LİSTESİ

- [ ] Google Cloud Console'da OAuth client oluşturuldu
- [ ] OAuth consent screen ayarlandı
- [ ] Supabase'de Google provider enable + Client ID/Secret girildi
- [ ] Supabase URL Configuration güncellendi
- [ ] RLS policy'ler kontrol edildi (restaurants INSERT, subscriptions INSERT)
- [ ] Login sayfasında "Google ile Giriş Yap" butonu görünüyor
- [ ] Google ile giriş başarılı oluyor
- [ ] İlk giriş → /onboarding sayfasına yönlendiriyor
- [ ] Onboarding formu çalışıyor (restoran adı zorunlu, telefon/adres opsiyonel)
- [ ] "Denemeyi Başlat" → restoran + subscription oluşuyor
- [ ] Dashboard'a yönlendiriliyor ve çalışıyor
- [ ] Trial son 3 günde uyarı banner'ı görünüyor
- [ ] Trial bitince kilit ekranı görünüyor ("Plan Seçin" + "Çıkış Yap")
- [ ] Mevcut email/password login hala çalışıyor
- [ ] Super admin etkilenmiyor (onboarding'e yönlenmiyor, trial kilidi yok)
- [ ] `npm run build` başarılı
