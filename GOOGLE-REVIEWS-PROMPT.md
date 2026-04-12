# TABBLED — GOOGLE REVIEWS ENTEGRASYONU
## Public Menüde Google Puanı + Yorum Yazma Yönlendirme

---

## GENEL BAKIŞ

Bu prompt 4 iş yapacak:
1. **DB:** restaurants tablosuna google_rating + google_review_count kolonları ekle
2. **Edge Function:** google_place_id'den Places API ile puan çekip DB'ye cache'le
3. **Admin panel:** google_place_id girilince otomatik puan çekme + manuel "Güncelle" butonu
4. **Public menü:** İletişim bilgileri altında Google puanı + yıldızlar + yorum sayısı + "Yorum Yaz" butonu

---

## ADIM 0: MEVCUT DURUMU KEŞFET

```bash
cd /opt/khp/tabbled

# google_place_id mevcut mu?
grep -rn "google_place_id" src/ --include="*.tsx" --include="*.ts" | head -20

# Mevcut profil bölümünü bul (iletişim bilgileri, akordeon)
grep -rn "infoOpen\|show_info\|hide_info\|İletişim bilgileri\|Contact info" src/pages/PublicMenu.tsx | head -10

# Mevcut Google review popup'ını bul
grep -rn "google_place_id\|writereview\|review_prompt\|showReviewPrompt" src/pages/PublicMenu.tsx | head -10

# Mevcut Edge Function'ları listele
ls supabase/functions/

# DB'deki mevcut restaurants kolonlarını kontrol et
grep -rn "google_rating\|google_review_count" src/ --include="*.tsx" --include="*.ts" | head -10
```

---

## ADIM 1: EDGE FUNCTION — fetch-google-rating

### Dosya: supabase/functions/fetch-google-rating/index.ts

Bu Edge Function google_place_id alacak, Google Places API'den puan + yorum sayısını çekecek ve DB'ye kaydedecek.

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://tabbled.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { restaurant_id, google_place_id } = await req.json();

    if (!restaurant_id || !google_place_id) {
      return new Response(
        JSON.stringify({ error: "restaurant_id ve google_place_id gerekli" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Google Places API (New) — Place Details
    const GOOGLE_PLACES_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!GOOGLE_PLACES_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Google Places API key yapılandırılmamış" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Places API (New) — sadece rating ve review count çek (Essentials SKU — ücretsiz limit dahilinde)
    const placesUrl = `https://places.googleapis.com/v1/places/${google_place_id}`;
    const placesResponse = await fetch(placesUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": "rating,userRatingCount",
      },
    });

    if (!placesResponse.ok) {
      const errorText = await placesResponse.text();
      console.error("Google Places API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Google Places API hatası", details: errorText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const placesData = await placesResponse.json();
    const rating = placesData.rating || null;
    const reviewCount = placesData.userRatingCount || 0;

    // Supabase'e kaydet
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: updateError } = await supabase
      .from("restaurants")
      .update({
        google_rating: rating,
        google_review_count: reviewCount,
        google_rating_updated_at: new Date().toISOString(),
      })
      .eq("id", restaurant_id);

    if (updateError) {
      console.error("DB update error:", updateError);
      return new Response(
        JSON.stringify({ error: "DB güncelleme hatası" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        rating,
        review_count: reviewCount,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Beklenmeyen hata" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

### Deploy

```bash
supabase functions deploy fetch-google-rating --project-ref qmnrawqvkwehufebbkxp --no-verify-jwt
```

### Secret ekle

```bash
supabase secrets set GOOGLE_PLACES_API_KEY=BURAYA_API_KEY --project-ref qmnrawqvkwehufebbkxp
```

**NOT:** Google Cloud Console'dan Places API (New) etkinleştirilmeli ve API key oluşturulmalı. Mevcut Google Translate API key ayrı tutulsun — Places için yeni key oluştur ve sadece Places API (New) ile kısıtla.

---

## ADIM 2: ADMIN PANEL — Google Rating Güncelle Butonu

### Dosya: RestaurantDashboard.tsx (Profil tabı)

Mevcut google_place_id input'unu bul. Yanına "Puanı Güncelle" butonu ekle.

```bash
grep -n "google_place_id\|Google Place\|place_id" src/pages/RestaurantDashboard.tsx | head -10
```

google_place_id input'unun altına veya yanına ekle:

```tsx
{/* Google Place ID input'u — MEVCUT, dokunma */}

{/* Google Rating gösterimi + güncelle butonu — YENİ */}
{profile.google_place_id && (
  <div className="flex items-center gap-3 mt-2">
    {/* Mevcut puan göster */}
    {profile.google_rating ? (
      <div className="flex items-center gap-1.5 text-sm text-gray-600">
        <Star size={16} weight="fill" className="text-yellow-400" />
        <span className="font-medium">{profile.google_rating.toFixed(1)}</span>
        <span className="text-gray-400">({profile.google_review_count || 0} yorum)</span>
        {profile.google_rating_updated_at && (
          <span className="text-gray-300 text-xs ml-1">
            · {new Date(profile.google_rating_updated_at).toLocaleDateString('tr-TR')}
          </span>
        )}
      </div>
    ) : (
      <span className="text-sm text-gray-400">Puan henüz çekilmedi</span>
    )}

    {/* Güncelle butonu */}
    <button
      onClick={async () => {
        setRatingLoading(true);
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const res = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL || 'https://qmnrawqvkwehufebbkxp.supabase.co'}/functions/v1/fetch-google-rating`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token}`,
                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
              },
              body: JSON.stringify({
                restaurant_id: restaurant.id,
                google_place_id: profile.google_place_id,
              }),
            }
          );
          const result = await res.json();
          if (result.success) {
            // Local state güncelle
            setProfile(prev => ({
              ...prev,
              google_rating: result.rating,
              google_review_count: result.review_count,
              google_rating_updated_at: new Date().toISOString(),
            }));
            toast({ title: "Google puanı güncellendi", description: `${result.rating?.toFixed(1)} ⭐ (${result.review_count} yorum)` });
          } else {
            toast({ title: "Hata", description: result.error || "Puan çekilemedi", variant: "destructive" });
          }
        } catch (err) {
          toast({ title: "Bağlantı hatası", variant: "destructive" });
        } finally {
          setRatingLoading(false);
        }
      }}
      disabled={ratingLoading}
      className="text-xs text-[#FF4F7A] hover:text-[#e8456e] font-medium flex items-center gap-1 disabled:opacity-50"
    >
      <ArrowsClockwise size={14} weight="thin" className={ratingLoading ? 'animate-spin' : ''} />
      {ratingLoading ? 'Çekiliyor...' : 'Puanı Güncelle'}
    </button>
  </div>
)}
```

**Gerekli state'ler:**
```typescript
const [ratingLoading, setRatingLoading] = useState(false);
```

**Gerekli import'lar:**
```typescript
import { Star, ArrowsClockwise } from "@phosphor-icons/react";
```

**Profil fetch'inde yeni kolonları da çek:**
Mevcut restaurant fetch sorgusuna google_rating, google_review_count, google_rating_updated_at ekle (zaten select('*') ise dokunma).

---

## ADIM 3: PUBLIC MENÜ — Google Puanı Gösterimi

### Dosya: src/pages/PublicMenu.tsx

İletişim bilgileri akordeon bölümünde (infoOpen içinde), mevcut adres/telefon/saat'in **ÜSTÜNE** Google rating bölümü ekle. Bu bölüm akordeon dışında, her zaman görünür olacak.

```bash
# Akordeon bölümünü bul
grep -n "infoOpen\|İletişim bilgileri\|Contact info\|show_info" src/pages/PublicMenu.tsx | head -10
```

**Restoran adı + tagline'ın altına, akordeonun üstüne ekle (her zaman görünür):**

```tsx
{/* Google Rating — akordeon dışında, her zaman görünür */}
{restaurant?.google_rating && restaurant?.google_place_id && (
  <div className="flex flex-col items-center gap-2 mt-3">
    {/* Yıldızlar + puan + yorum sayısı */}
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = restaurant.google_rating >= star;
          const half = !filled && restaurant.google_rating >= star - 0.5;
          return (
            <Star
              key={star}
              size={18}
              weight={filled ? "fill" : "regular"}
              className={filled || half ? "text-yellow-400" : "text-gray-200"}
            />
          );
        })}
      </div>
      <span className="text-sm font-bold" style={{ color: S.textPrimary }}>
        {restaurant.google_rating.toFixed(1)}
      </span>
      {restaurant.google_review_count > 0 && (
        <span className="text-xs" style={{ color: S.textSecondary }}>
          ({restaurant.google_review_count} {t('reviews') || 'yorum'})
        </span>
      )}
    </div>

    {/* Yorum Yaz butonu */}
    <a
      href={`https://search.google.com/local/writereview?placeid=${restaurant.google_place_id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors"
      style={{
        color: S.textSecondary,
        borderColor: S.border,
      }}
    >
      <GoogleLogo size={14} weight="thin" />
      {t('write_review') || 'Yorum Yaz'}
    </a>
  </div>
)}
```

**S.* stil pattern'ine uy** — tema renklerini mevcut inline stil sisteminden al.

### GoogleLogo ikonu

Phosphor Icons'ta GoogleLogo var mı kontrol et:
```bash
grep -r "GoogleLogo\|google.*logo" node_modules/@phosphor-icons/react/dist/ 2>/dev/null | head -5
```

Yoksa Google "G" ikonunu inline SVG olarak ekle:
```tsx
const GoogleIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);
```

### Çok dilli string'ler

Mevcut dil string'lerine ekle:
```typescript
reviews: { tr: 'yorum', en: 'reviews', ar: 'تعليق', zh: '评论', de: 'Bewertungen', fr: 'avis', ru: 'отзывов' },
write_review: { tr: 'Yorum Yaz', en: 'Write a Review', ar: 'اكتب تعليقاً', zh: '撰写评论', de: 'Bewertung schreiben', fr: 'Écrire un avis', ru: 'Написать отзыв' },
```

---

## ADIM 4: TEMA UYUMU

3 tema için Google rating bölümünün doğru renkleri kullanmasını sağla.

**Yıldız rengi her temada aynı:** `text-yellow-400` (sarı)

**Metin renkleri:** Mevcut S.textPrimary ve S.textSecondary pattern'ini kullan.

**Buton border:** S.border pattern'ini kullan.

**Koyu temada (black):**
- Yıldızlar: sarı (değişmez)
- Puan metni: beyaz (S.textPrimary)
- Yorum sayısı: gray-400 (S.textSecondary)
- Buton: border beyaz/gri, text beyaz/gri

---

## SUPABASE SQL (AYRI ÇALIŞTIR)

Aşağıdaki SQL'i Supabase Dashboard → SQL Editor'de çalıştır:

```sql
-- =============================================
-- GOOGLE RATING CACHE KOLONLARI
-- =============================================

-- Puan ve yorum sayısı cache
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS google_rating NUMERIC(2,1) DEFAULT NULL;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS google_review_count INTEGER DEFAULT 0;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS google_rating_updated_at TIMESTAMPTZ DEFAULT NULL;

-- Index (public menü sorgusu için)
CREATE INDEX IF NOT EXISTS idx_restaurants_google_rating ON restaurants(google_rating) WHERE google_rating IS NOT NULL;
```

---

## BUILD & TEST

```bash
cd /opt/khp/tabbled
npm run build
```

Hata yoksa:
```bash
echo "BUILD OK — Google Reviews entegrasyonu tamamlandı"
```

---

## GIT PUSH

```bash
cd /opt/khp/tabbled
git add -A
git commit -m "feat: Google Reviews integration

- Edge Function: fetch-google-rating (Places API New, rating + userRatingCount)
- DB: google_rating, google_review_count, google_rating_updated_at columns
- Admin: Google rating display + 'Puanı Güncelle' button in profile tab
- Public menu: Star rating + review count + 'Yorum Yaz' button (always visible)
- Google colored logo SVG icon
- 7 language strings (reviews, write_review)
- 3 theme compatible"
git push origin main
```

---

## SONRA YAPILACAK (MANUEL)

1. **Supabase SQL çalıştır** — yukarıdaki ALTER TABLE + INDEX
2. **Google Cloud Console:**
   - Places API (New) etkinleştir
   - Yeni API key oluştur (veya mevcut key'e Places API ekle)
   - Key'i HTTP referrer ile kısıtla (tabbled.com, qmnrawqvkwehufebbkxp.supabase.co)
3. **Supabase secret ekle:**
   ```
   supabase secrets set GOOGLE_PLACES_API_KEY=AIza... --project-ref qmnrawqvkwehufebbkxp
   ```
4. **Edge Function deploy:**
   ```
   supabase functions deploy fetch-google-rating --project-ref qmnrawqvkwehufebbkxp --no-verify-jwt
   ```
5. **Test:** Admin panelden bir restoranın google_place_id'sini gir, "Puanı Güncelle" tıkla, public menüde kontrol et

---

## KONTROL LİSTESİ

- [ ] SQL çalıştırıldı (google_rating, google_review_count, google_rating_updated_at)
- [ ] Google Cloud Console'da Places API (New) etkin
- [ ] API key oluşturuldu ve Supabase secret'a eklendi
- [ ] Edge Function deploy edildi (fetch-google-rating)
- [ ] Admin panelde "Puanı Güncelle" butonu çalışıyor
- [ ] Admin panelde puan + yorum sayısı + güncelleme tarihi gösteriliyor
- [ ] Public menüde yıldızlar + puan + yorum sayısı görünüyor
- [ ] Public menüde "Yorum Yaz" butonu Google Reviews'a yönlendiriyor
- [ ] 3 tema uyumlu (white/black/red)
- [ ] google_place_id boş olan restoranlarda hiçbir şey gösterilmiyor
- [ ] `npm run build` başarılı
