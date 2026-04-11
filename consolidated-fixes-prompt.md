# CLAUDE CODE PROMPT — Toplu Fix'ler
## Satış Funnel Feedback + Dashboard Feedback + UI Fix'ler

---

## GÖREV ÖZETI

İki ayrı code review'dan gelen geri bildirimler + önceden tespit edilen UI sorunları — toplam 12 fix, tek prompt'ta.

---

## PROJE BİLGİLERİ

- **Proje dizini:** /opt/khp/tabbled/
- **Stack:** React + Vite + TypeScript + shadcn/ui
- **İkon:** Phosphor Icons (@phosphor-icons/react)
- **Supabase project-ref:** qmnrawqvkwehufebbkxp
- **WhatsApp:** 905325119484
- **Email:** info@tabbled.com

---

## FIX 1: ORTALAMA RATING HESABI (Dashboard)

### Sorun
Dashboard'daki ortalama rating sadece son 5 feedback'ten hesaplanıyor. Tüm feedback'lerden hesaplanmalı.

### Çözüm
RestaurantAnalytics bileşeninde feedback için iki ayrı sorgu at:

```typescript
// 1. Ortalama ve toplam sayı için — sadece rating kolonu, tüm feedback
const { data: allFeedback } = await supabase
  .from('feedback')
  .select('rating')
  .eq('restaurant_id', restaurantId);

const avgRating = allFeedback && allFeedback.length > 0
  ? (allFeedback.reduce((sum, f) => sum + f.rating, 0) / allFeedback.length).toFixed(1)
  : null;
const totalFeedbackCount = allFeedback?.length || 0;

// 2. Son 5 feedback (liste gösterimi için) — bu zaten var
const { data: recentFeedback } = await supabase
  .from('feedback')
  .select('*')
  .eq('restaurant_id', restaurantId)
  .order('created_at', { ascending: false })
  .limit(5);
```

Özet kartındaki ortalama puanı `avgRating` ile, toplam sayıyı `totalFeedbackCount` ile göster.

---

## FIX 2: PRODUCT_LIKES TARİH FİLTRESİ (Dashboard)

### Sorun
product_likes tüm geçmişi çekiyor — büyük restoranlarda yavaşlar.

### Çözüm
İki ayrı sorgu:

```typescript
// 1. Son 90 gün toplam (performans için sınırla)
const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
const { data: recentLikes, count: totalLikeCount } = await supabase
  .from('product_likes')
  .select('menu_item_id, created_at', { count: 'exact' })
  .eq('restaurant_id', restaurantId)
  .eq('status', 'approved');

// 2. Bu hafta (son 7 gün) — kart alt metni için
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
const { count: weeklyLikeCount } = await supabase
  .from('product_likes')
  .select('id', { count: 'exact', head: true })
  .eq('restaurant_id', restaurantId)
  .eq('status', 'approved')
  .gte('created_at', sevenDaysAgo);
```

Popüler ürünler listesi için `get_like_counts` RPC kullan (varsa). RPC yoksa yukarıdaki `recentLikes`'ı JS'te grupla:

```typescript
const likeCounts: Record<string, number> = {};
recentLikes?.forEach(l => {
  likeCounts[l.menu_item_id] = (likeCounts[l.menu_item_id] || 0) + 1;
});
const topItems = Object.entries(likeCounts)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 5);
```

---

## FIX 3: PLAN QUERY PARAM (İletişim Formu)

### Sorun
PricingSection'dan `/iletisim?plan=pro` gönderiliyor ama Contact.tsx/Iletisim.tsx kullanmıyor.

### Çözüm

İletişim sayfasında:

```typescript
import { useSearchParams } from 'react-router-dom';

const [searchParams] = useSearchParams();
const selectedPlan = searchParams.get('plan'); // 'basic' | 'pro' | 'premium' | null

const planLabels: Record<string, string> = {
  basic: 'Basic',
  pro: 'Pro',
  premium: 'Premium',
};
```

Form başlığının altında, plan seçilmişse rozet göster:

```tsx
{selectedPlan && planLabels[selectedPlan] && (
  <div className="inline-flex items-center gap-2 bg-[#FF4F7A]/10 text-[#FF4F7A] px-4 py-2 rounded-full text-sm font-medium mb-4">
    <CheckCircle size={16} weight="bold" />
    {planLabels[selectedPlan]} planı seçtiniz
  </div>
)}
```

Ayrıca form submit'inde seçili planı da email'e ekle:

```typescript
// Edge Function'a gönderirken
body: JSON.stringify({
  name,
  restaurant,
  phone,
  email,
  message,
  selectedPlan: selectedPlan || 'belirtilmedi',
})
```

contact-form Edge Function'da email template'ine plan bilgisi ekle:

```html
${data.selectedPlan && data.selectedPlan !== 'belirtilmedi'
  ? `<p><strong>Seçilen Plan:</strong> ${data.selectedPlan}</p>`
  : ''}
```

---

## FIX 4: CONTACT_SUBMISSIONS TABLOSU (Veri Kaybı Önleme)

### Sorun
Resend düşerse form verisi kaybolur.

### Çözüm

**4a. Supabase SQL (ayrı çalıştır — SQL Editor'de):**

```sql
-- contact_submissions tablosu
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  restaurant_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  message TEXT,
  selected_plan TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Super admin tüm erişim
CREATE POLICY "Super admin full access on contact_submissions"
  ON contact_submissions FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Anonim insert (form gönderimi)
CREATE POLICY "Anyone can submit contact form"
  ON contact_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
```

**4b. contact-form Edge Function güncelle:**

Email göndermeden ÖNCE Supabase'e kaydet:

```typescript
// Mevcut kodda, email gönderiminden ÖNCE ekle:
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// DB'ye kaydet (email başarısız olsa bile veri kaybolmaz)
await supabaseAdmin.from('contact_submissions').insert({
  name,
  restaurant_name: restaurant,
  phone,
  email: email || null,
  message: message || null,
  selected_plan: selectedPlan || null,
})

// Sonra email gönder (mevcut Resend kodu)
```

Edge Function import'una createClient ekle:
```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
```

**4c. Edge Function redeploy:**
```bash
supabase functions deploy contact-form --project-ref qmnrawqvkwehufebbkxp --no-verify-jwt
```

---

## FIX 5: SIDEBAR PEMBE FRAME (UI)

### Sorun
Restoran admin sidebar'da aktif menü item'ında sol kenarda pembe border/frame var — çok kalın veya yanlış stil.

### Çözüm

Sidebar'daki aktif item stilini bul:
```bash
grep -rn "border-l\|border-left\|active.*sidebar\|activeTab.*className" src/pages/RestaurantDashboard.tsx src/components/
```

Aktif item'ın sol border'ını incelt:
```tsx
// ÖNCE (muhtemelen):
'border-l-4 border-[#FF4F7A]' veya 'border-l-3 border-[#FF4F7A]'

// SONRA:
'border-l-2 border-[#FF4F7A]'
```

Eğer border yerine `bg` ile yapılıyorsa, aktif durumda sadece hafif arka plan + pembe metin yeterli:
```tsx
activeTab === item
  ? 'text-[#FF4F7A] font-semibold bg-[#FF4F7A]/8'
  : 'text-gray-400 hover:text-white hover:bg-white/5'
```

Sol pembe çizgi ince ve zarif olmalı (2px max), kalın frame görüntüsü kaldırılmalı.

---

## FIX 6: GERİ BİLDİRİM SAYFASI — AMBER İKON (UI)

### Sorun
Geri Bildirim sayfasının başlığındaki ikon amber/turuncu renkte. Marka rengiyle uyumsuz.

### Çözüm

```bash
grep -rn "amber\|orange\|warning\|text-yellow\|ChatCircle\|Feedback.*icon\|Geri Bildirim.*icon" src/components/ src/pages/RestaurantDashboard.tsx
```

Başlık ikonunun rengini bul ve değiştir:
```tsx
// ÖNCE:
<SomeIcon className="text-amber-500" /> veya color="orange"

// SONRA:
<SomeIcon className="text-gray-500" /> // veya marka pembe: text-[#FF4F7A]
```

Sayfa başlık ikonu nötr (gray-500) veya marka rengi (#FF4F7A) olmalı — amber/turuncu kullanılmamalı.

---

## FIX 7: GERİ BİLDİRİM — ÇİFT RENKLİ YILDIZLAR (UI)

### Sorun
Filtre butonlarındaki yıldız ikonları sarı dolu + siyah outline karışık görünüyor, tutarsız.

### Çözüm

```bash
grep -rn "Star\|star\|★\|⭐\|yildiz\|rating.*filter\|filter.*rating" src/components/FeedbackPanel.tsx src/pages/RestaurantDashboard.tsx
```

Filtre butonlarındaki yıldız ikonlarını tek renk yap:

```tsx
// Filtre butonu — seçili
<Star size={16} weight="fill" className="text-amber-400" />

// Filtre butonu — seçili değil
<Star size={16} weight="regular" className="text-gray-400" />
```

Yıldızlar tek renk olmalı:
- Seçili filtre: dolu yıldız, amber-400
- Seçili olmayan: boş yıldız (outline), gray-400
- Karışık dolu+outline aynı ikonda OLMAMALI

---

## FIX 8: FLOATING WHATSAPP Z-INDEX (Çakışma Kontrolü)

### Sorun
FloatingWhatsApp + CookieBanner z-index çakışması potansiyeli.

### Çözüm

```bash
grep -rn "z-40\|z-50\|z-\[" src/components/FloatingWhatsApp.tsx src/components/CookieBanner.tsx
```

Z-index hiyerarşisi:
```
CookieBanner:    z-50 (en üstte — KVKK zorunluluğu)
FloatingWhatsApp: z-40 (cookie banner'ın altında)
Modal/Drawer:    z-30 veya z-[100] (mevcut ne ise)
```

Eğer CookieBanner z-50 değilse, z-50 yap. FloatingWhatsApp z-40 kalmalı.

Ayrıca mobilde CookieBanner açıkken FloatingWhatsApp'ın altına gizlenmesi gerekebilir:

```tsx
// FloatingWhatsApp.tsx — cookie banner kabul edilmemişse biraz yukarı kaydır
// veya CookieBanner görünürken bottom offset artır
className="fixed bottom-6 right-6 z-40 ..."
// Cookie banner varken: bottom-24 (banner yüksekliği kadar yukarı)
```

Basit çözüm: CookieBanner'ın yüksekliğini kontrol et, FloatingWhatsApp'ın bottom offset'ini buna göre ayarla. Eğer cookie kabul edildiyse normal bottom-6, edilmediyse bottom-24.

---

## FIX 9: FEATURE TOGGLE FETCH OPTİMİZASYONU (Dashboard)

### Sorun
Basic plan kullanıcısı için kapalı feature'ların sorguları boşuna atılıyor — DB yükü.

### Çözüm

Dashboard veri çekerken feature toggle'ları kontrol et:

```typescript
const restaurant = ...; // Zaten yüklü

const fetchPromises: Promise<any>[] = [
  // Bunlar her zaman çekilir
  supabase.from('menu_items').select('*').eq('restaurant_id', restaurantId),
  supabase.from('menu_categories').select('id, parent_id').eq('restaurant_id', restaurantId),
];

// Koşullu fetch'ler
if (restaurant.feature_waiter_calls !== false) {
  fetchPromises.push(
    supabase.from('waiter_calls').select('created_at')
      .eq('restaurant_id', restaurantId)
      .gte('created_at', sevenDaysAgo)
  );
} else {
  fetchPromises.push(Promise.resolve({ data: null }));
}

if (restaurant.feature_feedback !== false) {
  fetchPromises.push(
    supabase.from('feedback').select('rating').eq('restaurant_id', restaurantId)
  );
  fetchPromises.push(
    supabase.from('feedback').select('*').eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false }).limit(5)
  );
} else {
  fetchPromises.push(Promise.resolve({ data: null }));
  fetchPromises.push(Promise.resolve({ data: null }));
}

// ... benzer şekilde likes ve discount_codes
```

Bu şekilde kapalı feature'lar için Supabase'e sorgu atılmaz.

---

## FIX 10: DEMO MENÜ — TEMA GÖSTERİCİ (İyileştirme)

### Sorun
Demo menü her zaman white tema gösteriyor — potansiyel müşteri 3 temayı göremez.

### Çözüm

Demo menünün üstündeki banner'a tema değiştirici ekle:

```tsx
// Demo banner'ın içinde
<div className="bg-gradient-to-r from-[#FF4F7A] to-[#e8456e] text-white text-center py-3 px-4 text-sm">
  <p className="font-medium">
    🎉 Bu bir demo menüdür.
    <a href="/iletisim" className="underline font-bold ml-1">
      14 gün ücretsiz deneyin →
    </a>
  </p>
  {/* Tema değiştirici */}
  <div className="flex items-center justify-center gap-2 mt-1">
    <span className="text-white/70 text-xs">Tema:</span>
    {['white', 'black', 'red'].map(t => (
      <button
        key={t}
        onClick={() => setDemoTheme(t)}
        className={`w-5 h-5 rounded-full border-2 ${
          demoTheme === t ? 'border-white' : 'border-white/30'
        }`}
        style={{
          backgroundColor: t === 'white' ? '#F7F7F8' : t === 'black' ? '#1C1C1E' : '#DC2626'
        }}
      />
    ))}
  </div>
</div>
```

demoMenuData'daki `theme_color`'ı `demoTheme` state'iyle override et.

---

## FIX 11: PRICING SECTION — "14 GÜN ÜCRETSİZ" ETİKETİ

### Sorun
Fiyat kartlarında "14 gün ücretsiz deneme" etiketi yok — müşteri deneme hakkı olduğunu bilmiyor.

### Çözüm

PricingSection'daki her plan kartının üstüne veya butonunun üstüne:

```tsx
<div className="text-xs text-[#FF4F7A] font-medium mb-2">
  ✓ 14 gün ücretsiz deneme
</div>
```

Veya butonun altına:
```tsx
<p className="text-xs text-gray-500 mt-2">
  Kredi kartı gerekmez · 14 gün ücretsiz
</p>
```

---

## FIX 12: RESTORAN DASHBOARD DOSYA BOYUTU UYARISI (Roadmap notu)

### Sorun
RestaurantDashboard.tsx 3153 satır — code split gerekiyor.

### Çözüm (BU PROMPT'TA YAPMA — sadece yorum ekle)

Dosyanın en üstüne TODO yorumu ekle:

```typescript
// TODO: Bu dosya 3000+ satır — aşağıdaki tab'lar ayrı lazy-loaded bileşenlere split edilmeli:
// - Dashboard → components/dashboard/RestaurantAnalytics.tsx (zaten ayrı)
// - Menü → components/menu/MenuManager.tsx
// - Çeviri Merkezi → components/translation/TranslationCenter.tsx
// - QR Kodları → components/qr/QRCodesPanel.tsx
// - Profil → components/profile/ProfileTab.tsx
// Sonraki sprint'te React.lazy + Suspense ile code split yapılacak.
```

---

## UYGULAMA SIRASI

1. Fix 1: Rating hesabı (dashboard)
2. Fix 2: Likes tarih filtresi (dashboard)
3. Fix 9: Feature toggle fetch optimizasyonu (dashboard)
4. Fix 3: Plan query param (iletişim formu)
5. Fix 4a: SQL — contact_submissions tablosu (AYRI NOT: SQL Editor'de çalıştırılacak)
6. Fix 4b-c: contact-form Edge Function güncelle + redeploy
7. Fix 5: Sidebar pembe frame
8. Fix 6: Geri bildirim amber ikon
9. Fix 7: Çift renkli yıldızlar
10. Fix 8: Z-index kontrolü
11. Fix 10: Demo menü tema gösterici
12. Fix 11: Pricing "14 gün ücretsiz" etiketi
13. Fix 12: TODO yorumu ekle
14. npm run build
15. Sonuçları raporla

---

## DOĞRULAMA

```bash
# Dashboard fix'leri
grep -n "allFeedback\|avgRating\|ninetyDaysAgo\|feature_waiter_calls.*false" src/components/dashboard/RestaurantAnalytics.tsx

# Plan query param
grep -n "useSearchParams\|selectedPlan\|planLabels" src/pages/Contact.tsx src/pages/Iletisim.tsx

# contact_submissions
grep -n "contact_submissions" supabase/functions/contact-form/index.ts

# Sidebar border
grep -n "border-l" src/pages/RestaurantDashboard.tsx

# Z-index
grep -n "z-40\|z-50" src/components/FloatingWhatsApp.tsx src/components/CookieBanner.tsx

# Pricing etiketi
grep -n "14 gün\|ücretsiz deneme" src/components/PricingSection.tsx

# Build
cd /opt/khp/tabbled
npm run build
```

---

## SUPABASE SQL (AYRI ÇALIŞTIR)

Fix 4a'daki SQL'i Supabase Dashboard → SQL Editor'de çalıştır:
- contact_submissions tablosu + RLS

---

## EDGE FUNCTION REDEPLOY

Fix 4b-c'den sonra:
```bash
supabase functions deploy contact-form --project-ref qmnrawqvkwehufebbkxp --no-verify-jwt
```

---

## HATIRLATMALAR

- Dashboard fix'leri mevcut RestaurantAnalytics.tsx'te yapılacak — yeni dosya oluşturmaya gerek yok
- contact-form Edge Function'a createClient import'u eklenecek (Supabase insert için)
- Sidebar fix'i görsel — build'de test edilemez, deploy sonrası manual kontrol
- Demo menü tema gösterici: demoMenuData'daki theme_color'ı state ile override et
- Fix 12 sadece TODO yorumu — gerçek code split bu prompt'ta YAPILMAYACAK
- Tüm fix'ler birbirinden bağımsız — biri başarısız olursa diğerleri etkilenmez
