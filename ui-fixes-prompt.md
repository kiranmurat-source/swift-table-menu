# TABBLED — UI FIX PROMPT
## Profil Hizalama + Beğeni Sistemi + Hover Renk Düzeltmesi

---

## GENEL BAKIŞ

Bu prompt 4 fix yapacak:
1. **Public menü profil bölümü hizalama** — adres, telefon, saat satırları düzgün hizalanacak
2. **Beğeni sistemi değişikliği** — "Nasıl Buldunuz?" kaldırılacak, yerine kalp butonu + Google Maps yönlendirme
3. **Hover renk düzeltmesi** — tüm amber/sarı hover'lar → Tabbled pembe (#FF4F7A)
4. **Admin allerjen seçici güncelleme** — 14 AB + 4 diyet, text-only chip'ler, pembe renk

---

## ADIM 1: PROFİL BÖLÜMÜ HİZALAMA

Public menü sayfasında (`/menu/:slug`) restoran profil bilgilerinin gösterildiği bölümü bul.

### Mevcut sorun:
Adres, telefon, çalışma saatleri satırları hizasız — ikonlar ve metinler arasında tutarsız boşluklar var.

### Düzeltme:
Tüm bilgi satırlarını tutarlı bir flex yapısına sok:

```tsx
{/* Restoran bilgi satırları — hepsi aynı yapıda */}
<div className="flex flex-col gap-2 text-sm text-gray-600">
  
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
```

**Kurallar:**
- Her satır `flex items-center gap-2` (adres için `items-start` çünkü uzun olabilir)
- İkon: `size={16}`, `text-gray-400`, `flex-shrink-0` (küçülmesin)
- Metin: `text-sm text-gray-600`
- Satırlar arası: `gap-2` (8px)

---

## ADIM 2: BEĞENİ SİSTEMİ DEĞİŞİKLİĞİ

### 2a. "Nasıl Buldunuz?" linkini kaldır

Profil bölümündeki "Nasıl Buldunuz?" yazısını/butonunu/ikonunu tamamen kaldır.

Mevcut kodu bul ve SİL:
```bash
grep -rn "Nasıl Buldunuz\|nasil_buldunuz\|openFeedback\|FeedbackModal\|showFeedback" src/ --include="*.tsx"
```

FeedbackModal import ve render'ını public menüden kaldır. FeedbackModal.tsx dosyasını SİLME — sadece public menüden çağrısını kaldır.

### 2b. Kalp (beğeni) butonu ekle

Profil bilgileri bölümüne, çalışma saatleri satırının altına kalp butonu ekle:

```tsx
import { Heart } from "@phosphor-icons/react";

// State
const likeStorageKey = `liked_${restaurant?.id}`;
const [liked, setLiked] = useState(() => {
  try { return sessionStorage.getItem(likeStorageKey) === 'true'; } catch { return false; }
});
const [showReviewPrompt, setShowReviewPrompt] = useState(false);

const handleLike = () => {
  if (liked) return;
  setLiked(true);
  try { sessionStorage.setItem(likeStorageKey, 'true'); } catch {}
  // google_place_id varsa 600ms sonra yorum popup göster
  if (restaurant?.google_place_id) {
    setTimeout(() => setShowReviewPrompt(true), 600);
  }
};
```

Profil bilgi satırlarının altına ekle:
```tsx
{/* Beğeni butonu */}
<button
  onClick={handleLike}
  className={`flex items-center gap-1.5 text-sm transition-colors ${
    liked ? 'text-[#FF4F7A]' : 'text-gray-500 hover:text-[#FF4F7A]'
  }`}
  disabled={liked}
>
  <Heart size={18} weight={liked ? "fill" : "regular"} />
  <span>{liked ? t('liked') : t('like')}</span>
</button>
```

### 2c. Google Maps yorum yönlendirme popup

Kalbe basıldıktan sonra gösterilecek bottom sheet:

```tsx
{/* Yorum yönlendirme popup */}
{showReviewPrompt && (
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

slideUp animasyonu (CSS'e ekle veya mevcut animasyonları kullan):
```css
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
```

### 2d. Çok dilli string'ler (7 dil)

Mevcut dil sistemine ekle (t() fonksiyonunun kullandığı string objesine):

```typescript
like: { tr: 'Beğen', en: 'Like', ar: 'إعجاب', zh: '点赞', de: 'Gefällt mir', fr: "J'aime", ru: 'Нравится' },
liked: { tr: 'Beğendiniz', en: 'Liked', ar: 'أعجبك', zh: '已点赞', de: 'Gefällt Ihnen', fr: 'Aimé', ru: 'Понравилось' },
review_prompt_title: { tr: 'Teşekkürler!', en: 'Thank you!', ar: '!شكراً', zh: '谢谢！', de: 'Danke!', fr: 'Merci !', ru: 'Спасибо!' },
review_prompt_text: { tr: "Google Maps'te de yorum bırakmak ister misiniz?", en: 'Would you like to leave a review on Google Maps?', ar: 'هل ترغب في ترك تعليق على خرائط جوجل؟', zh: '您想在Google地图上留下评论吗？', de: 'Möchten Sie auch eine Bewertung auf Google Maps hinterlassen?', fr: 'Souhaitez-vous laisser un avis sur Google Maps ?', ru: 'Хотите оставить отзыв на Google Картах?' },
review_button: { tr: "Google'da Yorum Yap", en: 'Review on Google', ar: 'تقييم على جوجل', zh: '在Google上评价', de: 'Auf Google bewerten', fr: 'Évaluer sur Google', ru: 'Оставить отзыв в Google' },
not_now: { tr: 'Şimdi değil', en: 'Not now', ar: 'ليس الآن', zh: '以后再说', de: 'Nicht jetzt', fr: 'Pas maintenant', ru: 'Не сейчас' },
```

### 2e. Eski feedback kullanımı

- FeedbackModal'ı public menüden KALDIR (import + render)
- FeedbackModal.tsx dosyasını SİLME (admin panelde FeedbackPanel hala referans verebilir)
- Admin paneldeki FeedbackPanel ve sidebar item'ı kalsın
- `feature_feedback` toggle kalsın
- `feedback` DB tablosu kalsın

---

## ADIM 3: HOVER RENK DÜZELTMESİ

### Sorun:
Bazı butonlar/yıldızlar hover'da amber/sarı renk alıyor. Bu 4. bir renk oluşturuyor.

### Kural:
Tabbled renk paleti sadece 3 renk:
- **Beyaz** — arka plan
- **Siyah/koyu gri** — metin
- **Pembe (#FF4F7A)** — hover, aktif durum, CTA, vurgu

### Düzeltme:

Tüm projede amber/yellow/orange hover'ları bul:

```bash
grep -rn "amber\|yellow\|orange" src/ --include="*.tsx" --include="*.ts" | grep -i "hover\|active\|fill\|text-\|bg-\|border-"
```

Yıldız (Star) ikonlarını kontrol et:
```bash
grep -rn "Star" src/ --include="*.tsx" --include="*.ts" | grep -i "color\|fill\|text-\|className"
```

### Değiştirilecekler:

```tsx
// YANLIŞ:
"hover:text-amber-500"  →  "hover:text-[#FF4F7A]"
"text-yellow-400"       →  "text-[#FF4F7A]"
"text-amber-400"        →  "text-[#FF4F7A]"
"hover:text-yellow-500" →  "hover:text-[#FF4F7A]"
"fill-amber-400"        →  "fill-[#FF4F7A]"
"bg-amber-50"           →  "bg-pink-50"
"border-amber-500"      →  "border-[#FF4F7A]"
"bg-yellow-50"          →  "bg-pink-50"
```

### StarRating bileşeni (varsa):

```tsx
// YANLIŞ:
<Star weight="fill" className="text-amber-400" />
<Star className="text-gray-300 hover:text-amber-400" />

// DOĞRU:
<Star weight="fill" className="text-[#FF4F7A]" />
<Star className="text-gray-300 hover:text-[#FF4F7A]" />
```

Tüm dosyalarda bu değişiklikleri yap. Hiçbir yerde amber, yellow veya orange hover/active rengi kalmamalı.

---

## ADIM 4: ADMIN ALLERJEN SEÇİCİSİ GÜNCELLE

### Mevcut sorun:
- 30+ allerjen chip'i (kaju, buğday, dana eti, domuz eti, elma, muz, mantar vb.)
- Kırık SVG ikonlar

### Düzeltme:

allergens.ts'i import et ve seçiciyi yeniden yaz:

```tsx
import { ALLERGEN_LIST, DIET_LIST } from '../lib/allergens';
```

Mevcut allerjen chip listesini (tüm o 30+ item'lık listeyi) şununla değiştir:

```tsx
{/* === ALERJENLER (14 AB) === */}
<div>
  <label className="text-sm font-medium mb-2 block">Alerjenler</label>
  <div className="flex flex-wrap gap-2">
    {ALLERGEN_LIST.map((allergen) => (
      <label
        key={allergen.key}
        className={`flex items-center px-3 py-1.5 rounded-full border text-sm cursor-pointer transition-colors ${
          itemForm.allergens?.includes(allergen.key)
            ? 'bg-pink-50 border-[#FF4F7A] text-[#FF4F7A]'
            : 'bg-white border-gray-200 text-gray-600 hover:border-[#FF4F7A]'
        }`}
      >
        <input
          type="checkbox"
          className="sr-only"
          checked={itemForm.allergens?.includes(allergen.key) || false}
          onChange={() => toggleAllergen(allergen.key)}
        />
        {allergen.name_tr}
      </label>
    ))}
  </div>
</div>

{/* === DİYET TERCİHLERİ === */}
<div className="mt-3">
  <label className="text-sm font-medium mb-2 block">Diyet Tercihleri</label>
  <div className="flex flex-wrap gap-2">
    {DIET_LIST.map((diet) => (
      <label
        key={diet.key}
        className={`flex items-center px-3 py-1.5 rounded-full border text-sm cursor-pointer transition-colors ${
          itemForm.allergens?.includes(diet.key)
            ? 'bg-pink-50 border-[#FF4F7A] text-[#FF4F7A]'
            : 'bg-white border-gray-200 text-gray-600 hover:border-[#FF4F7A]'
        }`}
      >
        <input
          type="checkbox"
          className="sr-only"
          checked={itemForm.allergens?.includes(diet.key) || false}
          onChange={() => toggleAllergen(diet.key)}
        />
        {diet.name_tr}
      </label>
    ))}
  </div>
</div>
```

**ÖNEMLİ:**
- Chip'lerde SVG ikon GÖSTERİLMEYECEK — sadece text
- Seçili renk: pembe (#FF4F7A), yeşil DEĞİL
- Öne Çıkar + Yeni Ürün checkbox'ları bu bölümün dışında ayrı kalacak
- Tükendi toggle da ayrı kalacak

---

## ADIM 5: PUBLIC MENÜ FİLTRE PANELİ GÜNCELLE

Public menüdeki filtre bottom sheet'inde allerjen listesini güncelle:
- "Alerjen İçermeyen" bölümü: `ALLERGEN_LIST` kullan (14 AB)
- "Tercihler" bölümü: `DIET_LIST` kullan + Popüler + Yeni
- Eski food ikonlarını kaldır
- Chip renkleri: seçili → pembe, hover → pembe

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
git commit -m "fix: UI improvements - profile alignment, like system, hover colors

- Fix profile info alignment (address, phone, hours)
- Replace feedback form with heart like button
- Like → Google Maps review redirect (7 languages)
- Fix all amber/yellow hovers → Tabbled pink (#FF4F7A)
- Admin allergen selector: 14 EU + 4 diet, text-only pink chips
- Public filter panel updated with simplified allergen list"
git push origin main
```

---

## KONTROL LİSTESİ

- [ ] Profil satırları hizalı (flex + gap-2 + flex-shrink-0)
- [ ] "Nasıl Buldunuz?" kaldırıldı (public menüden)
- [ ] Kalp butonu eklendi (Heart, Phosphor)
- [ ] Beğeni → popup → Google Maps yorum yönlendirme
- [ ] google_place_id yoksa popup gösterme
- [ ] sessionStorage spam koruması
- [ ] 7 dil desteği
- [ ] Tüm amber/yellow hover → #FF4F7A
- [ ] Admin allerjen: 14 AB + 4 diyet, text-only, pembe renk
- [ ] Public filtre paneli güncellendi
- [ ] `npm run build` başarılı
- [ ] Git push yapıldı
