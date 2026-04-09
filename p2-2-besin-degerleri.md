# TABBLED.COM — CLAUDE CODE PROMPT
## P2-2: Besin Değerleri Tablosu (FDA Tarzı) + Hazırlanma Süresi

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

---

## MEVCUT DURUM

### menu_items tablosu (ilgili mevcut kolonlar)
- calories (integer) — TEK KALORİ DEĞERİ, zaten var
- price_variants (jsonb) — P2-1'de eklendi, her varyantın kendi calories'i var
- Diğer besin değeri YOK
- Hazırlanma süresi YOK

### Mevcut Kalori Kullanımı
- Admin ürün formu: "Kalori" input alanı → calories integer kolonu
- Admin ürün satırı: kalori gösterilmiyor
- Public menü kart: kalori badge gösterimi (varsa)
- Public menü detay modal: kalori bilgisi gösterimi
- Varyantlarda: her varyant objesinin kendi calories'i var

---

## GÖREV 1: BESİN DEĞERLERİ TABLOSU

### Amaç
FineDine'daki FDA tarzı besin değerleri tablosu. Restoran sahibi ürün bazında besin değerlerini girebilir, müşteri public menüde görebilir. "Menüde göster" toggle ile kontrol edilir.

### A) Veritabanı Değişiklikleri

```sql
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS nutrition jsonb DEFAULT NULL;

-- nutrition formatı (NULL = besin değeri girilmemiş):
-- {
--   "serving_size": "1 porsiyon (250g)",
--   "calories": 450,
--   "calories_from_fat": 120,
--   "total_fat": 13,
--   "saturated_fat": 5,
--   "trans_fat": 0,
--   "cholesterol": 65,
--   "sodium": 780,
--   "total_carb": 52,
--   "dietary_fiber": 3,
--   "sugars": 8,
--   "protein": 28,
--   "vitamin_a": 15,
--   "vitamin_c": 4,
--   "calcium": 20,
--   "iron": 25,
--   "show_on_menu": true
-- }
--
-- Tüm sayısal değerler: gram (g) veya miligram (mg) veya yüzde (%)
-- show_on_menu: false ise public menüde gösterilmez
-- NULL = hiç besin değeri girilmemiş, form boş gelir

-- Mevcut calories kolonu KALSIN (backward compat + hızlı erişim)
-- Besin değeri kaydedildiğinde nutrition.calories İLE calories kolonu senkron tutulacak
```

### B) Admin Panel — RestaurantDashboard.tsx

#### Ürün Formu (Modal) Değişiklikleri:

1. **"Besin Değerleri" bölümü ekle:**
   - Ürün formunda, allerjen seçicinin ALTINDA
   - Başlık: "Besin Değerleri" (CiWheat ikonu)
   - Varsayılan: kapalı (collapse) — tıklayınca açılır (expand)
   - Açık/kapalı durumu chevron ikonu ile gösterilir (CiCircleChevDown / CiCircleChevUp)

2. **Collapse açıldığında form alanları:**

   ```
   ┌─────────────────────────────────────────────────┐
   │ ▼ Besin Değerleri                    [CiWheat]  │
   │                                                  │
   │ ☑ Menüde Göster                                  │
   │                                                  │
   │ Porsiyon Boyutu: [1 porsiyon (250g)           ]  │
   │                                                  │
   │ ┌─── Temel ───────────────────────────────────┐  │
   │ │ Kalori:        [450    ] kcal                │  │
   │ │ Yağdan Kalori: [120    ] kcal                │  │
   │ └─────────────────────────────────────────────┘  │
   │                                                  │
   │ ┌─── Yağlar ──────────────────────────────────┐  │
   │ │ Toplam Yağ:    [13     ] g                   │  │
   │ │ Doymuş Yağ:    [5      ] g                   │  │
   │ │ Trans Yağ:     [0      ] g                   │  │
   │ └─────────────────────────────────────────────┘  │
   │                                                  │
   │ ┌─── Diğer ───────────────────────────────────┐  │
   │ │ Kolesterol:    [65     ] mg                  │  │
   │ │ Sodyum:        [780    ] mg                  │  │
   │ └─────────────────────────────────────────────┘  │
   │                                                  │
   │ ┌─── Karbonhidratlar ─────────────────────────┐  │
   │ │ Toplam Karb:   [52     ] g                   │  │
   │ │ Lif:           [3      ] g                   │  │
   │ │ Şeker:         [8      ] g                   │  │
   │ └─────────────────────────────────────────────┘  │
   │                                                  │
   │ Protein:         [28     ] g                     │
   │                                                  │
   │ ┌─── Vitaminler & Mineraller (% GRD) ─────────┐ │
   │ │ A Vitamini:    [15     ] %                   │ │
   │ │ C Vitamini:    [4      ] %                   │ │
   │ │ Kalsiyum:      [20     ] %                   │ │
   │ │ Demir:         [25     ] %                   │ │
   │ └─────────────────────────────────────────────┘  │
   │                                                  │
   │ [Besin Değerlerini Temizle]  ← tüm alanları sıfırla │
   └─────────────────────────────────────────────────┘
   ```

3. **Form kuralları:**
   - Tüm alanlar opsiyonel — restoran istediği kadar az/çok doldurabilir
   - Sayısal alanlar: number input, min 0, step any (ondalık destekle)
   - Porsiyon boyutu: text input (serbest metin, örn: "1 porsiyon (250g)", "100ml")
   - "Menüde Göster" checkbox: varsayılan true (besin değeri giriliyorsa göstermek istiyordur)
   - "Besin Değerlerini Temizle" butonu: confirm dialog → nutrition = NULL

4. **Kaydetme mantığı:**
   - Hiçbir alan doldurulmamışsa: nutrition = NULL (kaydetme)
   - En az 1 alan doldurulmuşsa: nutrition JSONB olarak kaydet
   - nutrition.calories ile mevcut calories kolonu SENKRON:
     - nutrition.calories değişirse → calories kolonu da güncellenir
     - calories kolonu direkt değişirse (eski form) → nutrition.calories da güncellenir (varsa)
   - show_on_menu değeri nutrition objesinin içinde saklanır

5. **Mevcut kalori alanı ile entegrasyon:**
   - Eski "Kalori" input alanı KALDIRILSIN
   - Kalori artık sadece Besin Değerleri bölümünden girilir
   - Besin Değerleri collapse kapalıyken bile, kalori girilmişse küçük bir badge göster: "450 kcal"
   - Bu sayede restoran sahibi collapse açmadan kalorinin girilip girilmediğini görebilir

### C) Public Menü — PublicMenu.tsx

#### Ürün Detay Modalı:

6. **Besin değerleri tablosu gösterimi:**
   - SADECE `nutrition !== null && nutrition.show_on_menu === true` ise göster
   - Varyant listesinin (varsa) ALTINDA, allerjen listesinin ALTINDA
   - FDA tarzı tablo görünümü:

   ```
   ┌──────────────────────────────────────┐
   │  Besin Değerleri                     │
   │  Porsiyon: 1 porsiyon (250g)         │
   │  ──────────────────────────────────  │
   │  Kalori              450 kcal        │
   │    Yağdan             120 kcal       │
   │  ──────────────────────────────────  │
   │  Toplam Yağ            13 g          │
   │    Doymuş Yağ           5 g          │
   │    Trans Yağ            0 g          │
   │  Kolesterol            65 mg         │
   │  Sodyum               780 mg         │
   │  ──────────────────────────────────  │
   │  Toplam Karbonhidrat   52 g          │
   │    Lif                  3 g          │
   │    Şeker                8 g          │
   │  Protein               28 g          │
   │  ──────────────────────────────────  │
   │  A Vitamini            15%           │
   │  C Vitamini             4%           │
   │  Kalsiyum              20%           │
   │  Demir                 25%           │
   │  ──────────────────────────────────  │
   │  * % Günlük Referans Değer          │
   │    (2000 kcal diyete göre)           │
   └──────────────────────────────────────┘
   ```

7. **Tablo kuralları:**
   - Sadece değeri olan satırları göster (0 olan satırlar DA gösterilir — 0g trans yağ bilgi verir)
   - NULL/undefined olan satırlar gizlenir
   - Alt kalemler (doymuş yağ, trans yağ, lif, şeker) 16px sol indent
   - Separator çizgiler tema renkiyle (theme.cardBorder veya theme.textMuted opacity)
   - "Besin Değerleri" başlığı: Playfair Display bold
   - Değerler: Inter 400, sağa dayalı
   - Footer notu: Inter 300, küçük font (12px)

8. **Çok dilli destek:**
   - src/lib/languages.ts'deki uiStrings'e yeni key'ler ekle:
     - `nutritionTitle`: "Besin Değerleri" / "Nutrition Facts" / "القيم الغذائية" / "营养成分"
     - `servingSize`: "Porsiyon" / "Serving" / "الحصة" / "份量"
     - `calories`: "Kalori" / "Calories" / "السعرات" / "卡路里"
     - `caloriesFromFat`: "Yağdan" / "From Fat" / "من الدهون" / "来自脂肪"
     - `totalFat`: "Toplam Yağ" / "Total Fat" / "الدهون" / "总脂肪"
     - `saturatedFat`: "Doymuş Yağ" / "Saturated Fat" / "دهون مشبعة" / "饱和脂肪"
     - `transFat`: "Trans Yağ" / "Trans Fat" / "دهون متحولة" / "反式脂肪"
     - `cholesterol`: "Kolesterol" / "Cholesterol" / "الكوليسترول" / "胆固醇"
     - `sodium`: "Sodyum" / "Sodium" / "الصوديوم" / "钠"
     - `totalCarb`: "Toplam Karbonhidrat" / "Total Carbohydrate" / "الكربوهيدرات" / "总碳水化合物"
     - `dietaryFiber`: "Lif" / "Dietary Fiber" / "الألياف" / "膳食纤维"
     - `sugars`: "Şeker" / "Sugars" / "السكريات" / "糖"
     - `protein`: "Protein" / "Protein" / "البروتين" / "蛋白质"
     - `vitaminA`: "A Vitamini" / "Vitamin A" / "فيتامين أ" / "维生素A"
     - `vitaminC`: "C Vitamini" / "Vitamin C" / "فيتامين ج" / "维生素C"
     - `calcium`: "Kalsiyum" / "Calcium" / "الكالسيوم" / "钙"
     - `iron`: "Demir" / "Iron" / "الحديد" / "铁"
     - `dailyValue`: "% Günlük Referans Değer (2000 kcal diyete göre)" / "% Daily Value (based on 2,000 calorie diet)" / "% القيمة اليومية (بناءً على نظام 2000 سعرة)" / "% 每日参考值（基于2000卡路里饮食）"
     - `prepTime`: "Hazırlanma Süresi" / "Prep Time" / "وقت التحضير" / "准备时间"
     - `minutes`: "dk" / "min" / "دقيقة" / "分钟"

#### Ürün Kartı (değişiklik):

9. **Kalori gösterimi güncelleme:**
   - Mevcut: calories kolonu kullanılıyor
   - Yeni: nutrition?.calories VEYA calories (fallback) kullan
   - Gösterim değişmez, sadece kaynak önceliği: nutrition.calories > calories

### D) Tema Uyumu
- Besin değerleri tablosu 3 temada (white/black/red) test edilmeli
- Separator çizgiler: tema border rengini kullan
- Alt kalem indent'leri: theme.textMuted rengiyle
- Tablo arka planı: tema cardBg
- Tablo kenarlığı: tema cardBorder

### E) Varyantlar ile İlişki
- Besin değerleri ÜRÜN bazında — varyant bazında DEĞİL
- Her varyantın kendi calories'i zaten var (price_variants içinde)
- nutrition tablosu ürünün genel besin değerini gösterir
- Eğer ürünün varyantları varsa ve nutrition tablosu da varsa:
  - Detay modalda önce varyant listesi, sonra besin tablosu gösterilir
  - Besin tablosundaki kalori, ürünün genel kalorisi (nutrition.calories)
  - Varyant başına kalori ayrıca varyant satırında gösterilir (mevcut davranış)

---

## GÖREV 2: HAZIRLANMA SÜRESİ

### Amaç
Her ürüne hazırlanma süresi (dakika) ekle. Müşteri menüde ürünün ne kadar sürede hazır olacağını görsün.

### A) Veritabanı Değişiklikleri

```sql
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS prep_time integer DEFAULT NULL;

-- prep_time: dakika cinsinden hazırlanma süresi
-- NULL = belirtilmemiş (gösterilmez)
-- Örnek: 15 = 15 dakika
```

### B) Admin Panel — RestaurantDashboard.tsx

#### Ürün Formu (Modal):

1. **Hazırlanma süresi input'u ekle:**
   - Fiyat bölümünün ALTINDA, allerjen seçicinin ÜSTÜNde
   - Tek satır: CiTimer ikonu + "Hazırlanma Süresi" label + number input + "dk" suffix
   - Layout:
   ```
   ┌───────────────────────────────────────┐
   │ ⏱ Hazırlanma Süresi: [15    ] dk     │
   └───────────────────────────────────────┘
   ```
   - number input: min 1, max 999, step 1 (tam dakika)
   - Opsiyonel — boş bırakılabilir (NULL olarak kaydedilir)

#### Ürün Satırı (Kompakt Liste):

2. **Hazırlanma süresi gösterimi (opsiyonel):**
   - Satırda yer varsa, fiyatın yanında küçük muted text: "15 dk"
   - Yer yoksa gösterme — kart tasarımını bozmasın
   - Öncelik: ad + fiyat > prep_time

### C) Public Menü — PublicMenu.tsx

#### Ürün Kartı:

3. **Hazırlanma süresi badge:**
   - Ürün kartında, kalori badge'inin YANINDA (varsa) veya aynı konumda
   - CiTimer ikonu (küçük, 14px) + "15 dk" / "15 min"
   - Tema uyumlu muted renk (theme.textMuted)
   - prep_time NULL ise gösterme
   - Layout (kalori + hazırlanma süresi yan yana):
   ```
   450 kcal  ·  ⏱ 15 dk
   ```

#### Ürün Detay Modalı:

4. **Hazırlanma süresi gösterimi:**
   - Fiyat/varyant bölümünün hemen altında
   - CiTimer ikonu + "Hazırlanma Süresi: 15 dk" / "Prep Time: 15 min"
   - Tema renkleri, muted style
   - prep_time NULL ise gösterme

#### Featured (Öne Çıkan) Kart:

5. **Aynı badge mantığı:**
   - Featured kartlarda da kalori yanında göster
   - Aynı style, sadece kart büyük olduğu için biraz daha rahat yerleşir

### D) Çok Dilli Destek
- `prepTime` ve `minutes` UI string'leri Görev 1'de languages.ts'e ekleniyor
- Kart ve modal gösterimlerinde toUiLang() kullan

---

## DB MİGRATION (Supabase SQL Editor'da her iki kolonu birlikte çalıştır)

```sql
-- P2-2: Besin değerleri + Hazırlanma süresi
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS nutrition jsonb DEFAULT NULL;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS prep_time integer DEFAULT NULL;
```

---

## GENEL KURALLAR

1. **İkon:** Sadece `react-icons/ci` (Circum Icons). shadcn/ui internal Lucide'a DOKUNMA.
2. **Font:** Playfair Display (başlıklar), Inter (body/muted)
3. **Style:** S.* inline styles pattern
4. **Backward compat:** Mevcut calories kolonu KORUNACAK ve senkron tutulacak. nutrition = NULL olan ürünler eski gibi çalışır. prep_time = NULL olan ürünlerde süre gösterilmez.
5. **Çeviri:** Besin değeri label'ları + hazırlanma süresi toUiLang() ile çevrilir (4 dil: TR/EN/AR/ZH)
6. **Deployment:** `npm run build` test → `git add -A && git commit -m "P2-2: Besin değerleri tablosu + hazırlanma süresi" && git push origin main`

---

## TEST CHECKLIST

### Besin Değerleri — Admin:
- [ ] Besin Değerleri bölümü collapse/expand çalışıyor
- [ ] Hiç besin değeri girilmemiş ürün: nutrition = NULL, collapse kapalı, badge yok
- [ ] Kalori girilmiş ürün: collapse kapalı ama "450 kcal" badge görünüyor
- [ ] Tüm alanlar doldurulmuş ürün: nutrition JSONB doğru kaydediliyor
- [ ] Kısmi alanlar (sadece kalori + protein): sorunsuz kaydediyor
- [ ] "Besin Değerlerini Temizle" → confirm → nutrition = NULL
- [ ] nutrition.calories değişince calories kolonu da senkron güncelleniyor
- [ ] "Menüde Göster" checkbox çalışıyor
- [ ] Eski "Kalori" input alanı kaldırılmış

### Besin Değerleri — Public Menü:
- [ ] nutrition = NULL → besin tablosu görünmüyor
- [ ] nutrition var + show_on_menu = true → FDA tarzı tablo görünüyor
- [ ] nutrition var + show_on_menu = false → tablo görünmüyor
- [ ] Sadece değeri olan satırlar gösteriliyor (null alanlar gizli)
- [ ] 0 değerli satırlar gösteriliyor (örn: 0g trans yağ)
- [ ] Alt kalemler indentli
- [ ] Dil değiştir (EN) → tablo label'ları İngilizce
- [ ] 3 tema test (white/black/red)
- [ ] Varyantlı ürün + besin tablosu → ikisi de düzgün sıralı

### Hazırlanma Süresi — Admin:
- [ ] Ürün formunda "Hazırlanma Süresi" input'u görünüyor (CiTimer)
- [ ] Boş bırakılabilir (NULL)
- [ ] 15 girilip kaydedildiğinde prep_time = 15
- [ ] Düzenlemede mevcut değer yükleniyor

### Hazırlanma Süresi — Public Menü:
- [ ] prep_time = NULL → süre gösterilmiyor
- [ ] prep_time = 15 → kart: "⏱ 15 dk" badge
- [ ] prep_time = 15 → detay modal: "Hazırlanma Süresi: 15 dk"
- [ ] Kalori + prep_time yan yana: "450 kcal · ⏱ 15 dk"
- [ ] Featured kartta da çalışıyor
- [ ] Dil değiştir (EN) → "15 min"
- [ ] 3 tema test

### Backward Compat:
- [ ] Mevcut ürünler hiç etkilenmedi
- [ ] Eski calories kolonu hala çalışıyor

---

## DOSYA DEĞİŞİKLİK LİSTESİ (Beklenen)

1. `src/pages/RestaurantDashboard.tsx` — Besin değerleri collapse + hazırlanma süresi input + eski kalori kaldırma
2. `src/pages/PublicMenu.tsx` — FDA besin tablosu (modal) + hazırlanma süresi badge (kart + modal + featured)
3. `src/lib/languages.ts` — ~20 yeni UI string (4 dil)

---

## ÖNCELİK SIRASI

1. DB migration çalıştır (nutrition + prep_time)
2. Admin — hazırlanma süresi input (basit, hızlı)
3. Admin — besin değerleri collapse formu
4. Eski kalori input'unu kaldır, collapse badge'e taşı
5. calories kolonu senkronizasyonu
6. Public menü — hazırlanma süresi badge (kart + featured + modal)
7. Public menü — FDA tarzı besin tablosu (detay modal)
8. Çok dilli label'lar (languages.ts)
9. 3 tema visual test
10. Build test + deploy
