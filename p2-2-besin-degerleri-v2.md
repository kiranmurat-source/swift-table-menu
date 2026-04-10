# TABBLED.COM — CLAUDE CODE PROMPT
## P2-2: Besin Değerleri Tablosu (FDA Tarzı)

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
- **Admin UX:** Modal KALDIRILDI → inline akordeon form (ürün satırının altında açılıyor)

---

## MEVCUT DURUM

### menu_items tablosu (ilgili mevcut kolonlar)
- calories (integer) — TEK KALORİ DEĞERİ, zaten var
- price_variants (jsonb) — P2-1'de eklendi, her varyantın kendi calories'i var
- prep_time (integer) — P2-2'de eklendi, dakika cinsinden hazırlanma süresi
- nutrition kolonu YOK — bu prompt'ta eklenecek

### Mevcut Kalori Kullanımı
- Admin ürün formu (inline akordeon): "Kalori" input alanı → calories integer kolonu
- Public menü kart: kalori badge gösterimi (varsa)
- Public menü detay modal: kalori bilgisi gösterimi
- Varyantlarda: her varyant objesinin kendi calories'i var

### Admin Form Yapısı (Şu An — Inline Akordeon)
Ürün satırına tıklayınca satırın altında inline form açılıyor:
- Temel Bilgiler (kategori, ad TR/EN, açıklama TR/EN)
- Fiyat & Detay (fiyat, hazırlanma süresi, varyantlar)
- Görsel (fotoğraf yükleme)
- Özellikler (badge'ler, allerjenler)
- Zamanlama (collapse)

---

## GÖREV: BESİN DEĞERLERİ TABLOSU

### Amaç
FineDine'daki FDA tarzı besin değerleri tablosu. Restoran sahibi ürün bazında besin değerlerini girebilir, müşteri public menüde görebilir. "Menüde göster" toggle ile kontrol edilir.

### A) Veritabanı Değişiklikleri

```sql
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS nutrition jsonb DEFAULT NULL;
```

nutrition formatı (NULL = besin değeri girilmemiş):
```json
{
  "serving_size": "1 porsiyon (250g)",
  "calories": 450,
  "calories_from_fat": 120,
  "total_fat": 13,
  "saturated_fat": 5,
  "trans_fat": 0,
  "cholesterol": 65,
  "sodium": 780,
  "total_carb": 52,
  "dietary_fiber": 3,
  "sugars": 8,
  "protein": 28,
  "vitamin_a": 15,
  "vitamin_c": 4,
  "calcium": 20,
  "iron": 25,
  "show_on_menu": true
}
```

- Mevcut `calories` kolonu KALSIN (backward compat + hızlı erişim)
- Besin değeri kaydedildiğinde `nutrition.calories` İLE `calories` kolonu senkron tutulacak

### B) Admin Panel — RestaurantDashboard.tsx (Inline Akordeon Form)

#### Inline forma "Besin Değerleri" collapse bölümü ekle:

1. **Konum:** Zamanlama bölümünün ALTINDA, Kaydet/İptal butonlarının ÜSTÜNde
2. **Başlık:** "Besin Değerleri" (CiWheat ikonu) — tıklayınca açılır/kapanır
3. **Chevron:** CiCircleChevDown (kapalı) / CiCircleChevUp (açık)
4. **Varsayılan:** Kapalı (collapse). Eğer nutrition !== null ise otomatik açık gelsin.
5. **Kapalıyken badge:** Kalori girilmişse başlığın yanında küçük badge: "450 kcal"

6. **Collapse açıldığında form alanları:**

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
│ [Besin Değerlerini Temizle]                      │
└─────────────────────────────────────────────────┘
```

7. **Form kuralları:**
   - Tüm alanlar opsiyonel — restoran istediği kadar az/çok doldurabilir
   - Sayısal alanlar: number input, min 0, step any (ondalık destekle)
   - Porsiyon boyutu: text input (serbest metin, örn: "1 porsiyon (250g)", "100ml")
   - "Menüde Göster" checkbox: varsayılan true
   - "Besin Değerlerini Temizle" butonu: confirm dialog → nutrition = NULL, tüm inputlar sıfırlanır

8. **Kaydetme mantığı:**
   - Hiçbir alan doldurulmamışsa: nutrition = NULL
   - En az 1 alan doldurulmuşsa: nutrition JSONB olarak kaydet
   - nutrition.calories ile mevcut calories kolonu SENKRON:
     - nutrition.calories değişirse → calories kolonu da güncellenir
     - Besin değerleri bölümü kullanılmıyorsa (nutrition = NULL) → mevcut calories kolonuna dokunma
   - show_on_menu değeri nutrition objesinin içinde saklanır

9. **Mevcut kalori alanı ile entegrasyon:**
   - Eski standalone "Kalori" input alanı KALDIRILSIN (eğer hala varsa)
   - Kalori artık sadece Besin Değerleri bölümünden girilir
   - Besin Değerleri collapse kapalıyken, kalori girilmişse başlık yanında badge: "450 kcal"

### C) Public Menü — PublicMenu.tsx

#### Ürün Detay Modalı:

10. **Besin değerleri tablosu gösterimi:**
    - SADECE `nutrition !== null && nutrition.show_on_menu === true` ise göster
    - Varyant listesinin (varsa) ALTINDA, allerjen listesinin ALTINDA, hazırlanma süresinin ALTINDA
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

11. **Tablo kuralları:**
    - Sadece değeri olan satırları göster (0 olan satırlar DA gösterilir — 0g trans yağ bilgi verir)
    - NULL/undefined olan satırlar gizlenir
    - Alt kalemler (doymuş yağ, trans yağ, lif, şeker) 16px sol indent
    - Separator çizgiler tema renkiyle (theme.cardBorder veya theme.textMuted opacity)
    - "Besin Değerleri" başlığı: Playfair Display bold
    - Değerler: Inter 400, sağa dayalı
    - Footer notu: Inter 300, küçük font (12px)
    - Tablo arka planı: tema cardBg
    - Tablo kenarlığı: tema cardBorder

12. **Çok dilli destek — src/lib/languages.ts uiStrings'e ekle:**
    - `nutritionTitle`: "Besin Değerleri" / "Nutrition Facts" / "القيم الغذائية" / "营养成分"
    - `servingSize`: "Porsiyon" / "Serving" / "الحصة" / "份量"
    - `caloriesLabel`: "Kalori" / "Calories" / "السعرات" / "卡路里"
    - `caloriesFromFat`: "Yağdan" / "From Fat" / "من الدهون" / "来自脂肪"
    - `totalFat`: "Toplam Yağ" / "Total Fat" / "الدهون" / "总脂肪"
    - `saturatedFat`: "Doymuş Yağ" / "Saturated Fat" / "دهون مشبعة" / "饱和脂肪"
    - `transFat`: "Trans Yağ" / "Trans Fat" / "دهون متحولة" / "反式脂肪"
    - `cholesterol`: "Kolesterol" / "Cholesterol" / "الكوليسترول" / "胆固醇"
    - `sodium`: "Sodyum" / "Sodium" / "الصوديوم" / "钠"
    - `totalCarb`: "Toplam Karbonhidrat" / "Total Carbohydrate" / "الكربوهيدرات" / "总碳水化合物"
    - `dietaryFiber`: "Lif" / "Dietary Fiber" / "الألياف" / "膳食纤维"
    - `sugars`: "Şeker" / "Sugars" / "السكريات" / "糖"
    - `proteinLabel`: "Protein" / "Protein" / "البروتين" / "蛋白质"
    - `vitaminA`: "A Vitamini" / "Vitamin A" / "فيتامين أ" / "维生素A"
    - `vitaminC`: "C Vitamini" / "Vitamin C" / "فيتامين ج" / "维生素C"
    - `calcium`: "Kalsiyum" / "Calcium" / "الكالسيوم" / "钙"
    - `iron`: "Demir" / "Iron" / "الحديد" / "铁"
    - `dailyValue`: "% Günlük Referans Değer (2000 kcal diyete göre)" / "% Daily Value (based on 2,000 calorie diet)" / "% القيمة اليومية (بناءً على نظام 2000 سعرة)" / "% 每日参考值（基于2000卡路里饮食）"

#### Ürün Kartı:

13. **Kalori gösterimi kaynak güncelleme:**
    - Mevcut: calories kolonu kullanılıyor
    - Yeni: `nutrition?.calories ?? item.calories` (nutrition öncelikli, fallback eski kolon)
    - Gösterim değişmez, sadece kaynak önceliği

### D) Tema Uyumu
- Besin değerleri tablosu 3 temada (white/black/red) test edilmeli
- White tema: tablo arka plan beyaz, gölge hafif, border belirgin
- Black tema: tablo arka plan koyu kart bg, gölge YOK, border düşük kontrast
- Red tema: tablo arka plan kart bg, border orta kontrast

### E) Varyantlar ile İlişki
- Besin değerleri ÜRÜN bazında — varyant bazında DEĞİL
- Her varyantın kendi calories'i zaten var (price_variants içinde)
- nutrition tablosu ürünün genel besin değerini gösterir
- Detay modalda sıralama: varyantlar → hazırlanma süresi → allerjenler → besin tablosu

---

## GENEL KURALLAR

1. **İkon:** Sadece `react-icons/ci` (Circum Icons). shadcn/ui internal Lucide'a DOKUNMA.
2. **Font:** Playfair Display (başlıklar), Inter (body/muted)
3. **Style:** S.* inline styles pattern
4. **4-Nokta Sistemi:** Spacing değerleri 4'ün katı (4, 8, 12, 16, 24, 32px)
5. **Backward compat:** Mevcut calories kolonu KORUNACAK ve senkron tutulacak. nutrition = NULL olan ürünler eski gibi çalışır.
6. **Çeviri:** Besin değeri label'ları toUiLang() ile çevrilir (4 dil: TR/EN/AR/ZH)
7. **Admin form:** INLINE AKORDEON — modal YOK. Besin değerleri bölümü formun içinde collapse olarak eklenir.
8. **Deployment:** `npm run build` test → `git add -A && git commit -m "P2-2: Besin değerleri tablosu (FDA tarzı)" && git push origin main`

---

## DB MİGRATION (Supabase SQL Editor'da çalıştır)

```sql
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS nutrition jsonb DEFAULT NULL;
```

---

## TEST CHECKLIST

### Admin Panel:
- [ ] Besin Değerleri bölümü inline formda collapse/expand çalışıyor
- [ ] Konum doğru: zamanlama altında, kaydet/iptal üstünde
- [ ] Hiç besin değeri girilmemiş ürün: nutrition = NULL, collapse kapalı, badge yok
- [ ] Kalori girilmiş ürün: collapse kapalı ama "450 kcal" badge görünüyor
- [ ] Tüm alanlar doldurulmuş: nutrition JSONB doğru kaydediliyor
- [ ] Kısmi alanlar (sadece kalori + protein): sorunsuz kaydediyor
- [ ] "Besin Değerlerini Temizle" → confirm → nutrition = NULL
- [ ] nutrition.calories değişince calories kolonu da senkron güncelleniyor
- [ ] "Menüde Göster" checkbox çalışıyor
- [ ] Eski standalone "Kalori" input alanı kaldırılmış (varsa)
- [ ] Mevcut ürün düzenlerken nutrition verisi doğru yükleniyor (hydrate)

### Public Menü:
- [ ] nutrition = NULL → besin tablosu görünmüyor
- [ ] nutrition var + show_on_menu = true → FDA tarzı tablo görünüyor
- [ ] nutrition var + show_on_menu = false → tablo görünmüyor
- [ ] Sadece değeri olan satırlar gösteriliyor (null alanlar gizli)
- [ ] 0 değerli satırlar gösteriliyor (örn: 0g trans yağ)
- [ ] Alt kalemler indentli (doymuş yağ, trans yağ, lif, şeker)
- [ ] Dil değiştir (EN) → tablo label'ları İngilizce
- [ ] 3 tema test (white/black/red) — tablo arka plan, border, text doğru
- [ ] Varyantlı ürün + besin tablosu → detay modalda düzgün sıralı
- [ ] Kalori kartı: nutrition?.calories ?? item.calories fallback

### Backward Compat:
- [ ] Mevcut ürünler (nutrition = NULL) hiç etkilenmedi
- [ ] Eski calories kolonu hala çalışıyor
- [ ] Inline akordeon form bozulmadı (regression yok)

---

## DOSYA DEĞİŞİKLİK LİSTESİ (Beklenen)

1. `src/pages/RestaurantDashboard.tsx` — Besin değerleri collapse bölümü (inline form içinde) + eski kalori input kaldırma
2. `src/pages/PublicMenu.tsx` — FDA tarzı besin tablosu (detay modal) + kalori kaynak güncelleme
3. `src/lib/languages.ts` — 18 yeni UI string (besin değeri label'ları, 4 dil)

---

## ÖNCELİK SIRASI

1. DB migration çalıştır (nutrition kolonu)
2. Admin — inline forma besin değerleri collapse bölümü ekle
3. Eski kalori input'unu kaldır (varsa), collapse badge'e taşı
4. calories kolonu senkronizasyonu (kaydetme logic)
5. Form hydrate — düzenlemede nutrition verisi yükle
6. Public menü — FDA tarzı tablo (detay modal)
7. Kalori kartı kaynak güncellemesi (nutrition?.calories fallback)
8. Çok dilli label'lar (languages.ts)
9. 3 tema visual test
10. Build test + deploy
