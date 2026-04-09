# TABBLED.COM — CLAUDE CODE PROMPT
## P2-1: Çoklu Fiyat Varyantları + Teknik Borç

---

## PROJE BAĞLAMI

- **Repo:** /opt/khp/tabbled (GitHub: kiranmurat-source/swift-table-menu)
- **Stack:** React + Vite + TypeScript + shadcn/ui
- **DB:** Supabase PostgreSQL (qmnrawqvkwehufebbkxp.supabase.co)
- **Deploy:** Vercel (otomatik GitHub push)
- **Font:** Playfair Display (başlıklar) + Inter (body)
- **İkon:** Circum Icons (react-icons/ci) — shadcn/ui internal Lucide'a DOKUNMA
- **Tema:** white/black/red (restaurants.theme_color)
- **Style:** S.* inline styles kullanılıyor (shadcn/ui bileşenleri kullanılmıyor)
- **Image Transforms:** src/lib/imageUtils.ts → getOptimizedImageUrl()

---

## MEVCUT DURUM

### menu_items tablosu (mevcut kolonlar)
- id, restaurant_id, category_id, name_tr, name_en, description_tr, description_en
- price (numeric — TEK FİYAT), image_url, is_available, is_popular, is_new
- is_vegetarian, is_vegan, allergens (text[]), calories (integer)
- sort_order, is_featured, is_sold_out
- schedule_type, schedule_start, schedule_end, schedule_periodic (jsonb)
- translations (jsonb), created_at, updated_at

### RestaurantDashboard.tsx — Mevcut Ürün Düzenleme
- FineDine tarzı akordeon kategori listesi + kompakt ürün satırları
- Her ürün satırı: thumbnail + ad + inline fiyat input + tükendi toggle + silme ikonu
- Ürün ekleme/düzenleme: modal form (ad TR/EN, açıklama TR/EN, fiyat, görsel, allerjenler, badge'ler, zamanlama)
- Inline fiyat düzenleme: blur/Enter'da Supabase update
- Drag & drop: @dnd-kit (kategoriler + ürünler)

### PublicMenu.tsx — Mevcut Fiyat Gösterimi
- Ürün kartlarında tek fiyat gösteriliyor: `{item.price} ₺`
- Ürün detay modalında tek fiyat
- Tükendi ürünlerde çizili fiyat + "Tükendi" badge

---

## GÖREV 1: ÇOKLU FİYAT VARYANTLARI

### Amaç
FineDine'daki gibi ürünlere birden fazla boyut/porsiyon bazlı fiyat seçeneği ekle.
Örnek: Latte → Küçük 65₺, Orta 80₺, Büyük 95₺
Örnek: Pizza → Kişisel 120₺, Orta 180₺, Büyük 250₺

### A) Veritabanı Değişiklikleri

```sql
-- menu_items tablosuna yeni kolon ekle
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS price_variants jsonb DEFAULT '[]';

-- price_variants formatı:
-- [
--   { "name_tr": "Küçük", "name_en": "Small", "price": 65, "calories": 120 },
--   { "name_tr": "Orta", "name_en": "Medium", "price": 80, "calories": 180 },
--   { "name_tr": "Büyük", "name_en": "Large", "price": 95, "calories": 250 }
-- ]
-- 
-- Boş array [] = tek fiyat modu (mevcut price kolonu kullanılır)
-- Dolu array = çoklu fiyat modu (price kolonu en düşük fiyatı tutar, SEO/sıralama için)
```

### B) Admin Panel — RestaurantDashboard.tsx

#### Ürün Formu (Modal) Değişiklikleri:

1. **Fiyat bölümünü yeniden tasarla:**
   - Varsayılan: tek fiyat input'u (mevcut hali, değişme)
   - "+ Varyant Ekle" butonu (CiCirclePlus ikonu)
   - Butona tıklayınca tek fiyat input'u gizlenir, varyant listesi açılır

2. **Varyant Listesi UI:**
   ```
   ┌─────────────────────────────────────────────┐
   │ Fiyat Varyantları                            │
   │                                              │
   │ ┌─ Varyant 1 ──────────────────────────────┐ │
   │ │ İsim (TR): [Küçük    ] İsim (EN): [Small]│ │
   │ │ Fiyat:     [65       ] Kalori:    [120  ] │ │
   │ │                              [🗑 Sil]     │ │
   │ └──────────────────────────────────────────┘ │
   │ ┌─ Varyant 2 ──────────────────────────────┐ │
   │ │ İsim (TR): [Orta     ] İsim (EN): [Med. ]│ │
   │ │ Fiyat:     [80       ] Kalori:    [180  ] │ │
   │ │                              [🗑 Sil]     │ │
   │ └──────────────────────────────────────────┘ │
   │                                              │
   │ [+ Varyant Ekle]                             │
   │                                              │
   │ "Tek fiyata dön" linki (tüm varyantları siler│
   │ ve eski price alanına geri döner)             │
   └─────────────────────────────────────────────┘
   ```

3. **Varyant kuralları:**
   - Minimum 2 varyant (1 varyant anlamsız, tek fiyat kullan)
   - Maksimum 10 varyant
   - Her varyant: name_tr (zorunlu), name_en (opsiyonel), price (zorunlu, > 0), calories (opsiyonel)
   - "Tek fiyata dön" tıklanınca: confirm dialog → price_variants = [] ve price eski haline döner
   - Varyant eklendiğinde price kolonu otomatik olarak en düşük varyant fiyatına set edilir (SEO/sıralama/filtreleme için)

4. **Kaydetme mantığı:**
   - Tek fiyat modunda: `price` güncellenir, `price_variants` = `[]`
   - Çoklu fiyat modunda: `price_variants` güncellenir, `price` = `Math.min(...variants.map(v => v.price))`

#### Ürün Satırı (Kompakt Liste) Değişiklikleri:

5. **Inline fiyat gösterimi:**
   - Tek fiyat: mevcut inline editable input (değişme)
   - Çoklu fiyat: "65 ₺ - 95 ₺" şeklinde range göster (editable DEĞİL, tıklayınca modal açılır)
   - Çoklu fiyat varsa küçük bir CiLayers ikonu göster (varyant olduğunu belirt)

### C) Public Menü — PublicMenu.tsx

#### Ürün Kartı:
6. **Fiyat gösterimi:**
   - Tek fiyat: mevcut hali (değişme) → `150.00 ₺`
   - Çoklu fiyat: en düşük fiyatı göster → `65.00 ₺'den başlayan` (veya dil bazlı: "Starting from 65.00 ₺")
   - Çok dilli metin: 
     - TR: `{minPrice} ₺'den başlayan`
     - EN: `Starting from {minPrice} ₺`
     - AR: `يبدأ من {minPrice} ₺`
     - Diğer diller: EN fallback

#### Ürün Detay Modalı:
7. **Varyant listesi gösterimi:**
   - Tek fiyat: mevcut hali (değişme)
   - Çoklu fiyat: tüm varyantlar listele
   ```
   ┌──────────────────────────────────┐
   │  Boyut Seçenekleri               │
   │                                  │
   │  Küçük .............. 65.00 ₺   │
   │  120 kcal                        │
   │                                  │
   │  Orta ............... 80.00 ₺   │
   │  180 kcal                        │
   │                                  │
   │  Büyük .............. 95.00 ₺   │
   │  250 kcal                        │
   │                                  │
   └──────────────────────────────────┘
   ```
   - Varyant isimleri dil bazlı: seçili dil EN ise name_en (fallback name_tr), seçili dil TR ise name_tr
   - Tükendi ürünlerde: tüm varyant fiyatları çizili + "Tükendi" badge
   - Kalori opsiyonel: yoksa gösterme

### D) Tema Uyumu
- Tüm yeni UI elemanları mevcut 3 tema (white/black/red) ile uyumlu olmalı
- PublicMenu'deki varyant listesinde tema renklerini kullan (mevcut tema sistemi: S.* inline styles)

### E) Çeviri Desteği
- Varyant isimleri translations JSONB'ye EKLENMESİN — zaten her varyant kendi name_tr/name_en'ini tutuyor
- Public menüde "X ₺'den başlayan" metni toUiLang() fonksiyonuyla çevrilmeli
- src/lib/languages.ts'deki UI string'lerine yeni key ekle: `startingFrom`

---

## GÖREV 2: ÜRÜN DÜZENLEMEDE KATEGORİ DEĞİŞTİRME (Teknik Borç)

### Amaç
Ürün düzenleme modalında kategori seçici ekle. Şu an bir ürünü başka kategoriye taşımak imkansız.

### Uygulama:

1. **Ürün formu modalına kategori dropdown ekle:**
   - Formun en üstünde (ad alanının üzerinde)
   - Label: "Kategori"
   - Select/dropdown: restoranın tüm kategorilerini listele (parent + child)
   - Child kategoriler indentli gösterilsin: "— Alt Kategori Adı"
   - Varsayılan: ürünün mevcut kategorisi seçili

2. **Kaydetme:**
   - category_id güncellenir
   - Ürün yeni kategoriye taşınır
   - Ürünün sort_order yeni kategorideki en sona eklenir (MAX(sort_order) + 1)

3. **Yeni ürün eklerken:**
   - Şu an "+ Ürün Ekle" butonu her kategorinin altında ve otomatik o kategoriye ekliyor
   - Bu davranış korunsun, ama modal açıldığında kategori dropdown'da ilgili kategori seçili gelsin
   - Kullanıcı isterse başka kategori seçebilsin

---

## GÖREV 3: ALT KATEGORİ DRAG HANDLE (Teknik Borç)

### Amaç
Şu an child (alt) kategori satırlarında drag handle yok. Parent kategoriler drag edilebilir ama child'lar edilemiyor.

### Uygulama:

1. **Child kategori satırlarına drag handle ekle:**
   - Parent kategorilerdeki aynı CiBoxes grip ikonu
   - Child'lar kendi parent'ları içinde sıralanabilir (parent değiştirme YOK, sadece sıralama)
   - @dnd-kit kullanılıyor: child kategoriler için ayrı SortableContext (parent_id bazlı filtreleme)

2. **Sort mantığı:**
   - Her parent'ın child'ları kendi aralarında sort_order'a göre sıralanır
   - Drag drop sonrası DB'ye batch update: child sort_order güncellenir
   - Mevcut parent drag logic'e dokunma

3. **Sınırlamalar:**
   - Child kategoriler SADECE kendi parent'ları içinde drag edilir
   - Parent'lar arası taşıma yok (bu ayrı bir özellik olur)
   - Child'sız parent'lar normal drag (mevcut davranış)

---

## GENEL KURALLAR

1. **İkon kullanımı:** Sadece `react-icons/ci` (Circum Icons). shadcn/ui internal Lucide'a DOKUNMA.
2. **Font:** Playfair Display (başlıklar, 700), Inter (body, 400/500), Inter (muted, 300)
3. **Style convention:** S.* inline styles pattern kullan (projedeki mevcut pattern)
4. **Supabase:** RLS aktif — yeni kolon ekliyorsan mevcut policy'ler yeterli (menu_items zaten restaurant_id bazlı)
5. **Backward compatibility:** Mevcut tek fiyatlı ürünler etkilenmemeli — price_variants = [] olan ürünler eski gibi çalışmaya devam etmeli
6. **Çeviri:** Varyant isimleri name_tr/name_en olarak varyant objesinin içinde — translations JSONB'ye ekleme
7. **Deployment:** `npm run build` ile test et, sonra `git add -A && git commit -m "P2-1: Çoklu fiyat varyantları + kategori değiştirme + alt kategori drag" && git push origin main`

---

## TEST CHECKLIST

### Çoklu Fiyat Varyantları:
- [ ] Yeni ürün oluştur, tek fiyat → kaydet → doğru çalışıyor
- [ ] Mevcut ürüne varyant ekle → 2+ varyant → kaydet → price_variants JSONB dolu
- [ ] price kolonu en düşük varyant fiyatına otomatik set ediliyor
- [ ] "Tek fiyata dön" → confirm → price_variants = [] → eski fiyat geri geliyor
- [ ] Admin ürün satırında çoklu fiyat: "65 ₺ - 95 ₺" range gösterimi
- [ ] Admin ürün satırında tek fiyat: inline editable (mevcut davranış korunuyor)
- [ ] Public menü kart: çoklu fiyat → "65.00 ₺'den başlayan"
- [ ] Public menü detay modal: tüm varyantlar listelenmiş, isim + fiyat + kalori
- [ ] Dil değiştir (EN) → "Starting from 65.00 ₺" + varyant isimleri İngilizce
- [ ] Tükendi ürün + çoklu fiyat → tüm fiyatlar çizili + "Tükendi" badge
- [ ] 3 tema (white/black/red) ile varyant UI doğru görünüyor
- [ ] Mevcut tek fiyatlı ürünler hiç etkilenmedi

### Kategori Değiştirme:
- [ ] Ürün düzenleme modalında kategori dropdown görünüyor
- [ ] Mevcut kategori seçili geliyor
- [ ] Başka kategori seç → kaydet → ürün yeni kategoride görünüyor
- [ ] Yeni ürün eklerken doğru kategori seçili geliyor

### Alt Kategori Drag:
- [ ] Child kategorilerde drag handle (CiBoxes) görünüyor
- [ ] Child kategoriler kendi parent'ları içinde sıralanabiliyor
- [ ] Parent kategoriler hala drag edilebiliyor (regression yok)
- [ ] Sort_order DB'ye doğru kaydediliyor

---

## DOSYA DEĞİŞİKLİK LİSTESİ (Beklenen)

1. `src/pages/RestaurantDashboard.tsx` — Varyant UI, kategori dropdown, child drag handle
2. `src/pages/PublicMenu.tsx` — Varyant fiyat gösterimi (kart + detay modal)
3. `src/lib/languages.ts` — `startingFrom` UI string'i ekleme
4. **DB migration** — `ALTER TABLE menu_items ADD COLUMN price_variants jsonb DEFAULT '[]'`

---

## ÖNCELİK SIRASI

1. DB migration çalıştır (price_variants kolonu)
2. Admin panel — ürün formu varyant UI
3. Admin panel — ürün satırı range gösterimi
4. Public menü — kart fiyat + detay modal varyant listesi
5. Kategori değiştirme (ürün formu)
6. Alt kategori drag handle
7. Build test + deploy
