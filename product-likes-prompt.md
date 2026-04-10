# TABBLED — ÜRÜN BEĞENİ + UI İYİLEŞTİRME PROMPT
## Ürün Bazlı Beğeni + Splash Sosyal Medya + Profil Akordeon + Logo Fix

---

## GENEL BAKIŞ

Bu prompt 5 iş yapacak:
1. **"Nasıl Buldunuz?" kaldır** — profil altından tamamen sil
2. **Profil bilgilerini akordeon yap** — adres/telefon/saat tıkla-aç
3. **Splash sayfasına sosyal medya butonları** ekle (kalp butonu yerine)
4. **Tabbled logo koyu arka plan fix** — splash'ta beyaz renk
5. **Ürün bazlı beğeni sistemi** — her üründe kalp + sayaç + Google Maps yönlendirme

---

## ADIM 1: "NASIL BULDUNUZ?" KALDIRMA

Public menü sayfasında profil bilgileri altındaki "Nasıl Buldunuz?" linkini/butonunu tamamen kaldır.

```bash
grep -rn "Nasıl Buldunuz\|nasil_buldunuz\|nasil_buldun\|how_did_you_find\|openFeedback\|showFeedback\|FeedbackModal" src/pages/PublicMenu.tsx src/components/PublicMenu* 2>/dev/null
```

Bulunan her referansı kaldır:
- "Nasıl Buldunuz?" yazısı/ikonu/butonu
- FeedbackModal import ve render (sadece public menüden — FeedbackModal.tsx dosyasını SİLME)
- Mevcut kalp/like butonu varsa onu da kaldır (profil seviyesindeki — ürün bazlıyı biz ekleyeceğiz)

---

## ADIM 2: PROFİL BİLGİLERİNİ AKORDEON YAP

### Mevcut sorun:
Adres, telefon, çalışma saatleri profil bölümünde kalabalık yapıyor.

### Çözüm:
Restoran adı + tagline her zaman görünür. Adres/telefon/saat bir akordeon içinde — varsayılan KAPALI, tıklayınca açılır.

```tsx
import { CaretDown, MapPin, Phone, Clock } from "@phosphor-icons/react";

const [infoOpen, setInfoOpen] = useState(false);

{/* Restoran adı + tagline — her zaman görünür */}
<div className="text-center">
  {/* Logo */}
  {restaurant.logo_url && (
    <img src={restaurant.logo_url} alt={restaurant.name} className="w-16 h-16 rounded-xl mx-auto mb-2 object-contain" />
  )}
  <h1 className="text-xl font-bold">{displayName}</h1>
  {restaurant.tagline && (
    <p className="text-sm text-gray-500 mt-0.5">{restaurant.tagline}</p>
  )}
</div>

{/* Bilgi akordeon */}
<button
  onClick={() => setInfoOpen(!infoOpen)}
  className="flex items-center gap-1 mx-auto mt-2 text-sm text-gray-400 hover:text-[#FF4F7A] transition-colors"
>
  <span>{infoOpen ? (t('hide_info') || 'Bilgileri gizle') : (t('show_info') || 'İletişim bilgileri')}</span>
  <CaretDown
    size={14}
    className={`transition-transform duration-200 ${infoOpen ? 'rotate-180' : ''}`}
  />
</button>

{/* Akordeon içeriği */}
{infoOpen && (
  <div className="flex flex-col gap-2 text-sm text-gray-600 mt-3 animate-fadeIn">
    
    {/* Adres */}
    {restaurant.address && (
      <div className="flex items-start gap-2">
        <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
        <span>{restaurant.address}</span>
      </div>
    )}

    {/* Telefon */}
    {restaurant.phone && (
      <a href={`tel:${restaurant.phone}`} className="flex items-center gap-2 hover:text-[#FF4F7A] transition-colors">
        <Phone size={16} className="text-gray-400 flex-shrink-0" />
        <span>{restaurant.phone}</span>
      </a>
    )}

    {/* Çalışma saatleri */}
    {todayHours && (
      <div className="flex items-center gap-2">
        <Clock size={16} className="text-gray-400 flex-shrink-0" />
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
          {todayHours}
        </span>
      </div>
    )}

  </div>
)}
```

CSS ekle (mevcut CSS'e):
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn {
  animation: fadeIn 0.2s ease-out;
}
```

### Çok dilli string'ler:
```typescript
show_info: { tr: 'İletişim bilgileri', en: 'Contact info', ar: 'معلومات الاتصال', zh: '联系信息', de: 'Kontaktinfo', fr: 'Coordonnées', ru: 'Контакты' },
hide_info: { tr: 'Bilgileri gizle', en: 'Hide info', ar: 'إخفاء المعلومات', zh: '隐藏信息', de: 'Info ausblenden', fr: 'Masquer', ru: 'Скрыть' },
```

---

## ADIM 3: SPLASH SAYFASINA SOSYAL MEDYA BUTONLARI

Splash sayfasında zaten sosyal medya ikonları var (session-wrapup-6nisan'dan: "Sosyal medya ikonları (Instagram, Facebook, X, TikTok, Website) — inline SVG"). Bunlar kalacak.

Ek olarak şu butonları da ekle (varsa):
- **WhatsApp** (social_whatsapp)
- **Google Maps** (social_google_maps)
- **YouTube** (social_youtube — DB'de varsa)

Splash'taki sosyal medya ikonları zaten çalışıyorsa bu adımı atla. Sadece eksik platformları ekle.

Profildeki genel kalp/like butonu varsa KALDIR — beğeni artık ürün bazlı olacak (Adım 5).

---

## ADIM 4: TABBLED LOGO KOYU ARKA PLAN FİX

### Mevcut sorun:
Splash sayfasında koyu arka planda (cover image overlay) "Powered by Tabbled" logosu görünmüyor — logo pembe/kırmızı, koyu arka plana karışıyor.

### Çözüm:
"Powered by Tabbled" yazısı ve logosunun rengini beyaz yap:

```bash
grep -rn "Powered by\|powered.by\|tabbled-logo\|tabbled_logo" src/ --include="*.tsx" | head -10
```

Bulunan bölümde:
```tsx
{/* Powered by Tabbled — splash'ta */}
<div className="text-center mt-auto pb-4">
  <span className="text-white/60 text-xs">Powered by</span>
  <img
    src="/tabbled-logo.png"
    alt="Tabbled"
    className="h-5 mx-auto mt-1 brightness-0 invert opacity-60"
  />
</div>
```

**`brightness-0 invert`** CSS filtresi logoyu beyaz yapar. `opacity-60` ile hafif transparan.

Alternatif: Eğer projede beyaz logo varyantı varsa (tabbled-logo-white.png gibi) onu kullan.

Eğer logo `<img>` değil text ise:
```tsx
<span className="text-white/60 text-sm font-medium">Tabbled</span>
```

---

## ADIM 5: ÜRÜN BAZLI BEĞENİ SİSTEMİ

### 5a. DB: product_likes tablosu

Bu SQL'i Supabase'de çalıştırmak için ayrı verilecek ama kodu şimdiden yazalım.

DB yapısı (Supabase SQL — PROMPT SONUNDA AYRICA VERİLECEK):
```sql
-- product_likes tablosu
-- Her ürüne anonim beğeni, fingerprint ile spam koruması
CREATE TABLE product_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  fingerprint TEXT NOT NULL, -- sessionStorage ID veya IP hash
  status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: aynı kişi aynı ürünü tekrar beğenemez
CREATE UNIQUE INDEX idx_product_likes_unique ON product_likes(menu_item_id, fingerprint);

-- Performans index'leri
CREATE INDEX idx_product_likes_item ON product_likes(menu_item_id);
CREATE INDEX idx_product_likes_restaurant ON product_likes(restaurant_id);
CREATE INDEX idx_product_likes_status ON product_likes(status);
```

### 5b. Supabase RLS

```sql
ALTER TABLE product_likes ENABLE ROW LEVEL SECURITY;

-- Anonim kullanıcılar beğeni ekleyebilir
CREATE POLICY "Anyone can insert likes"
  ON product_likes FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Onaylanan beğeniler herkese görünür (sayaç için)
CREATE POLICY "Approved likes are public"
  ON product_likes FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

-- Restoran sahibi tüm beğenileri görebilir (onay/red için)
CREATE POLICY "Owner can view all likes"
  ON product_likes FOR SELECT
  TO authenticated
  USING (
    restaurant_id IN (SELECT restaurant_id FROM profiles WHERE id = auth.uid())
    OR is_super_admin()
  );

-- Restoran sahibi beğeni durumunu güncelleyebilir
CREATE POLICY "Owner can update like status"
  ON product_likes FOR UPDATE
  TO authenticated
  USING (
    restaurant_id IN (SELECT restaurant_id FROM profiles WHERE id = auth.uid())
    OR is_super_admin()
  )
  WITH CHECK (
    restaurant_id IN (SELECT restaurant_id FROM profiles WHERE id = auth.uid())
    OR is_super_admin()
  );

-- Restoran sahibi beğeni silebilir
CREATE POLICY "Owner can delete likes"
  ON product_likes FOR DELETE
  TO authenticated
  USING (
    restaurant_id IN (SELECT restaurant_id FROM profiles WHERE id = auth.uid())
    OR is_super_admin()
  );
```

### 5c. Feature toggle

```sql
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS feature_likes BOOLEAN DEFAULT TRUE;
```

### 5d. RPC: Beğeni sayısını getir (performans için)

```sql
CREATE OR REPLACE FUNCTION get_like_counts(p_restaurant_id UUID)
RETURNS TABLE(menu_item_id UUID, like_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT pl.menu_item_id, COUNT(*)::BIGINT as like_count
  FROM product_likes pl
  WHERE pl.restaurant_id = p_restaurant_id
    AND pl.status = 'approved'
  GROUP BY pl.menu_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5e. Frontend: Fingerprint oluştur

```typescript
// src/lib/fingerprint.ts
export function getFingerprint(): string {
  const key = 'tabbled_fp';
  let fp = '';
  try {
    fp = sessionStorage.getItem(key) || '';
  } catch {}
  if (!fp) {
    fp = 'fp_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    try { sessionStorage.setItem(key, fp); } catch {}
  }
  return fp;
}
```

### 5f. Frontend: useLikes hook

```typescript
// src/hooks/useLikes.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getFingerprint } from '../lib/fingerprint';

interface UseLikesReturn {
  likeCounts: Record<string, number>;   // menu_item_id → count
  likedItems: Set<string>;              // bu kullanıcının beğendiği item'lar
  toggleLike: (itemId: string, restaurantId: string) => Promise<boolean>;
  loading: boolean;
}

export function useLikes(restaurantId: string | undefined): UseLikesReturn {
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const fingerprint = getFingerprint();

  useEffect(() => {
    if (!restaurantId) return;

    const fetchLikes = async () => {
      // 1. Toplam beğeni sayıları
      const { data: counts } = await supabase
        .rpc('get_like_counts', { p_restaurant_id: restaurantId });

      if (counts) {
        const map: Record<string, number> = {};
        counts.forEach((row: any) => { map[row.menu_item_id] = row.like_count; });
        setLikeCounts(map);
      }

      // 2. Bu kullanıcının beğendikleri
      const { data: myLikes } = await supabase
        .from('product_likes')
        .select('menu_item_id')
        .eq('restaurant_id', restaurantId)
        .eq('fingerprint', fingerprint)
        .eq('status', 'approved');

      if (myLikes) {
        setLikedItems(new Set(myLikes.map((l: any) => l.menu_item_id)));
      }

      setLoading(false);
    };

    fetchLikes();
  }, [restaurantId, fingerprint]);

  const toggleLike = useCallback(async (itemId: string, restaurantId: string): Promise<boolean> => {
    if (likedItems.has(itemId)) return false; // zaten beğenmiş

    const { error } = await supabase
      .from('product_likes')
      .insert({
        menu_item_id: itemId,
        restaurant_id: restaurantId,
        fingerprint: fingerprint,
        status: 'approved', // varsayılan onaylı (restoran sahibi red edebilir)
      });

    if (error) {
      // Unique constraint violation = zaten beğenmiş
      if (error.code === '23505') return false;
      console.error('Like error:', error);
      return false;
    }

    // Optimistic update
    setLikedItems(prev => new Set([...prev, itemId]));
    setLikeCounts(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
    return true;
  }, [likedItems, fingerprint]);

  return { likeCounts, likedItems, toggleLike, loading };
}
```

### 5g. Frontend: Ürün kartına kalp butonu ekle

PublicMenu.tsx'te ürün kartlarını render eden bölümü bul. Her karta kalp butonu ekle:

```tsx
import { Heart } from "@phosphor-icons/react";
import { useLikes } from '../hooks/useLikes';

// PublicMenu bileşeninde:
const { likeCounts, likedItems, toggleLike } = useLikes(restaurant?.id);
const [showReviewPrompt, setShowReviewPrompt] = useState(false);

// Ürün kartında (grid veya list her ikisinde de):
<button
  onClick={async (e) => {
    e.stopPropagation(); // kartın detay modalını açmasını engelle
    const success = await toggleLike(item.id, restaurant.id);
    if (success && restaurant.google_place_id) {
      // Beğeni başarılıysa 800ms sonra Google Maps yorum popup göster
      setTimeout(() => setShowReviewPrompt(true), 800);
    }
  }}
  className={`flex items-center gap-1 text-xs transition-colors ${
    likedItems.has(item.id)
      ? 'text-[#FF4F7A]'
      : 'text-gray-400 hover:text-[#FF4F7A]'
  }`}
>
  <Heart
    size={16}
    weight={likedItems.has(item.id) ? "fill" : "regular"}
  />
  {(likeCounts[item.id] || 0) > 0 && (
    <span>{likeCounts[item.id]}</span>
  )}
</button>
```

**Kalp butonunun konumu:** Ürün kartında fiyatın yanında veya altında, sağ tarafta.

### 5h. Google Maps yorum yönlendirme popup

Beğeni başarılı olunca gösterilecek popup (tek sefer — showReviewPrompt state'i):

```tsx
{showReviewPrompt && restaurant?.google_place_id && (
  <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm"
       onClick={() => setShowReviewPrompt(false)}>
    <div
      className="bg-white rounded-t-2xl w-full max-w-lg p-6 pb-8"
      style={{ animation: 'slideUp 0.3s ease-out' }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="text-center mb-4">
        <Heart size={32} weight="fill" className="text-[#FF4F7A] mx-auto mb-2" />
        <h3 className="text-lg font-semibold">{t('review_prompt_title')}</h3>
        <p className="text-sm text-gray-500 mt-1">{t('review_prompt_text')}</p>
      </div>

      <div className="flex flex-col gap-3">
        <a
          href={`https://search.google.com/local/writereview?placeid=${restaurant.google_place_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 bg-[#FF4F7A] text-white rounded-xl text-center font-medium hover:bg-[#e8456e] transition-colors"
          onClick={() => setShowReviewPrompt(false)}
        >
          {t('review_button')}
        </a>
        <button
          onClick={() => setShowReviewPrompt(false)}
          className="w-full py-3 text-gray-500 text-sm"
        >
          {t('not_now')}
        </button>
      </div>
    </div>
  </div>
)}
```

### 5i. Detay modalda da kalp butonu

Ürün detay modalında da aynı kalp butonu olmalı (daha büyük boyutlu):

```tsx
{/* Detay modal footer'ında */}
<div className="flex items-center justify-between mt-4">
  <button
    onClick={async () => {
      const success = await toggleLike(selectedItem.id, restaurant.id);
      if (success && restaurant.google_place_id) {
        setTimeout(() => setShowReviewPrompt(true), 800);
      }
    }}
    className={`flex items-center gap-1.5 text-sm transition-colors ${
      likedItems.has(selectedItem.id)
        ? 'text-[#FF4F7A]'
        : 'text-gray-500 hover:text-[#FF4F7A]'
    }`}
  >
    <Heart
      size={20}
      weight={likedItems.has(selectedItem.id) ? "fill" : "regular"}
    />
    <span>
      {likedItems.has(selectedItem.id) ? t('liked') : t('like')}
      {(likeCounts[selectedItem.id] || 0) > 0 && ` (${likeCounts[selectedItem.id]})`}
    </span>
  </button>
</div>
```

### 5j. Çok dilli string'ler

Mevcut dil string'lerine ekle:

```typescript
like: { tr: 'Beğen', en: 'Like', ar: 'إعجاب', zh: '点赞', de: 'Gefällt mir', fr: "J'aime", ru: 'Нравится' },
liked: { tr: 'Beğendiniz', en: 'Liked', ar: 'أعجبك', zh: '已点赞', de: 'Gefällt Ihnen', fr: 'Aimé', ru: 'Понравилось' },
review_prompt_title: { tr: 'Teşekkürler!', en: 'Thank you!', ar: '!شكراً', zh: '谢谢！', de: 'Danke!', fr: 'Merci !', ru: 'Спасибо!' },
review_prompt_text: { tr: "Google Maps'te de yorum bırakmak ister misiniz?", en: 'Would you like to leave a review on Google Maps?', ar: 'هل ترغب في ترك تعليق على خرائط جوجل؟', zh: '您想在Google地图上留下评论吗？', de: 'Möchten Sie auch eine Bewertung auf Google Maps hinterlassen?', fr: 'Souhaitez-vous laisser un avis sur Google Maps ?', ru: 'Хотите оставить отзыв на Google Картах?' },
review_button: { tr: "Google'da Yorum Yap", en: 'Review on Google', ar: 'تقييم على جوجل', zh: '在Google上评价', de: 'Auf Google bewerten', fr: 'Évaluer sur Google', ru: 'Оставить отзыв в Google' },
not_now: { tr: 'Şimdi değil', en: 'Not now', ar: 'ليس الآن', zh: '以后再说', de: 'Nicht jetzt', fr: 'Pas maintenant', ru: 'Не сейчас' },
```

### 5k. Admin panel: Beğeni yönetimi (opsiyonel — basit tablo)

Admin panelde sidebar'a "Beğeniler" ekle (Müşteri İlişkileri grubunda). Basit liste:

```
Beğeniler
┌────────────────────────────────────────────────────┐
│ Toplam: 47 beğeni  |  Bugün: 3  |  Son 7 gün: 12  │
├────────────────────────────────────────────────────┤
│ ❤️ Türk Kahvaltısı Tabağı — 15 beğeni              │
│ ❤️ Kontinental Kahvaltı — 12 beğeni                │
│ ❤️ Açık Büfe Kahvaltı — 10 beğeni                  │
│ ❤️ Menemen — 6 beğeni                              │
│ ❤️ Simit & Peynir Tabağı — 4 beğeni                │
└────────────────────────────────────────────────────┘
```

Ürünleri beğeni sayısına göre sıralı göster. Restoran sahibi isterse bir beğeniyi "red" edebilir (status: rejected).

```tsx
// LikesPanel.tsx — basit bileşen
// Beğeni istatistikleri (3 kart) + ürün bazlı sıralı liste + red butonu
```

### 5l. Feature toggle kontrolü

Public menüde beğeni butonunu göstermeden önce kontrol et:
```tsx
{restaurant?.feature_likes !== false && (
  <button onClick={...}>
    <Heart ... />
  </button>
)}
```

Admin profil tabında toggle ekle:
```tsx
{/* Beğeni sistemi toggle */}
<label className="flex items-center gap-2">
  <input type="checkbox" checked={profile.feature_likes !== false} onChange={...} />
  <span>Ürün beğeni sistemi</span>
</label>
```

---

## ADIM 6: BUILD VE TEST

```bash
cd /opt/khp/tabbled
npm run build
```

---

## ADIM 7: GIT PUSH

```bash
cd /opt/khp/tabbled
git add -A
git commit -m "feat: product likes + UI improvements

- Remove 'Nasıl Buldunuz?' from profile section
- Profile info accordion (address/phone/hours collapsible)
- Fix Tabbled logo visibility on dark splash backgrounds
- Product-level like system (heart button + count)
- Like → Google Maps review redirect prompt (7 languages)
- useLikes hook with fingerprint spam protection
- Admin: LikesPanel with stats + per-product ranking
- Feature toggle: feature_likes
- RPC: get_like_counts for performance"
git push origin main
```

---

## SUPABASE SQL (AYRI ÇALIŞTIR)

Aşağıdaki SQL'i Supabase Dashboard → SQL Editor'de çalıştır:

```sql
-- =============================================
-- PRODUCT_LIKES TABLOSU
-- =============================================
CREATE TABLE IF NOT EXISTS product_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  fingerprint TEXT NOT NULL,
  status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_likes_unique ON product_likes(menu_item_id, fingerprint);
CREATE INDEX IF NOT EXISTS idx_product_likes_item ON product_likes(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_product_likes_restaurant ON product_likes(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_product_likes_status ON product_likes(status);

-- RLS
ALTER TABLE product_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert likes"
  ON product_likes FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Approved likes are public"
  ON product_likes FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

CREATE POLICY "Owner can view all likes"
  ON product_likes FOR SELECT
  TO authenticated
  USING (
    restaurant_id IN (SELECT restaurant_id FROM profiles WHERE id = auth.uid())
    OR is_super_admin()
  );

CREATE POLICY "Owner can update like status"
  ON product_likes FOR UPDATE
  TO authenticated
  USING (
    restaurant_id IN (SELECT restaurant_id FROM profiles WHERE id = auth.uid())
    OR is_super_admin()
  )
  WITH CHECK (
    restaurant_id IN (SELECT restaurant_id FROM profiles WHERE id = auth.uid())
    OR is_super_admin()
  );

CREATE POLICY "Owner can delete likes"
  ON product_likes FOR DELETE
  TO authenticated
  USING (
    restaurant_id IN (SELECT restaurant_id FROM profiles WHERE id = auth.uid())
    OR is_super_admin()
  );

-- RPC: Beğeni sayıları
CREATE OR REPLACE FUNCTION get_like_counts(p_restaurant_id UUID)
RETURNS TABLE(menu_item_id UUID, like_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT pl.menu_item_id, COUNT(*)::BIGINT as like_count
  FROM product_likes pl
  WHERE pl.restaurant_id = p_restaurant_id
    AND pl.status = 'approved'
  GROUP BY pl.menu_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Feature toggle
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS feature_likes BOOLEAN DEFAULT TRUE;
```

---

## KONTROL LİSTESİ

- [ ] "Nasıl Buldunuz?" kaldırıldı (public menüden)
- [ ] Profil bilgileri akordeon — varsayılan kapalı, tıkla aç
- [ ] Akordeon: adres + telefon + saat düzgün hizalı
- [ ] Splash'ta Tabbled logosu koyu arka planda görünür (beyaz/invert)
- [ ] Ürün kartlarında kalp butonu + beğeni sayısı
- [ ] Detay modalda kalp butonu + beğeni sayısı
- [ ] useLikes hook çalışıyor (fingerprint + optimistic update)
- [ ] Beğeni sonrası Google Maps yorum popup (google_place_id varsa)
- [ ] 7 dil desteği (like/liked/review strings)
- [ ] feature_likes toggle (admin profil tabı + public kontrol)
- [ ] Admin: LikesPanel (beğeni istatistikleri + ürün sıralaması)
- [ ] Sidebar'a "Beğeniler" item'ı eklendi
- [ ] `npm run build` başarılı
- [ ] Git push yapıldı
- [ ] Supabase SQL ayrıca çalıştırıldı
