# CLAUDE CODE PROMPT — AB/EU Besin Değerleri + Nutri-Score
## FDA Tarzı → AB Formatı + Nutri-Score Dropdown

---

## PROJE BAĞLAMI

Tabbled (tabbled.com) bir QR dijital menü SaaS platformu. React + Vite + TypeScript + shadcn/ui. Supabase PostgreSQL backend. Vercel deploy.

- **Repo:** /opt/khp/tabbled/
- **Supabase:** qmnrawqvkwehufebbkxp.supabase.co
- **İkon:** Phosphor Icons (@phosphor-icons/react) — Thin weight only
- **Font:** Roboto (Bold/Medium/Regular/Light)
- **Tema:** 2 tema (white + black)
- **Marka:** #FF4F7A (pembe), #1C1C1E (koyu), #F7F7F8 (açık)

---

## MEVCUT DURUM

### Besin Değerleri Sistemi (12 Nisan'da yapıldı)
- `menu_items.nutrition` JSONB kolonu mevcut
- 16 alan tanımlı: serving_size, calories, total_fat, saturated_fat, trans_fat, cholesterol, sodium, total_carbs, dietary_fiber, sugars, protein, vitamin_a, vitamin_c, calcium, iron, show_nutrition
- Admin'de collapsible form ile düzenleniyor
- Public menüde ürün detay modalında **FDA tarzı** tablo gösteriliyor
- FDA tarzı: Amerikan formatı, "Nutrition Facts" başlığı, siyah kalın çerçeve, % Daily Value

### Sorun
- Türkiye AB gıda mevzuatını takip ediyor (AB 1169/2011 regülasyonu)
- FDA formatı Türkiye/AB için uygun değil
- AB formatına geçmemiz gerekiyor

---

## GÖREV

2 ana iş:
1. Public menüdeki besin değerleri gösterimini FDA tarzından **AB/EU formatına** dönüştür
2. **Nutri-Score** sistemi ekle (DB + Admin + Public)

Admin tarafındaki besin değerleri formu (JSONB yapısı) DEĞİŞMEYECEK — sadece public menüdeki gösterim değişecek. Nutri-Score için yeni DB kolonu + admin dropdown + public UI eklenecek.

---

## NUTRI-SCORE SİSTEMİ

### DB Migration (SQL dosyası olarak üret — migration-nutri-score.sql)

```sql
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS nutri_score TEXT DEFAULT NULL
  CHECK (nutri_score IN ('A', 'B', 'C', 'D', 'E'));
```

### Renkler (sabit)
- A: #038141 (koyu yeşil)
- B: #85BB2F (açık yeşil)
- C: #FECB02 (sarı)
- D: #EE8100 (turuncu)
- E: #E63E11 (kırmızı)

### Açıklamalar (çok dilli)
| Skor | TR | EN |
|------|----|----|
| A | Çok iyi beslenme kalitesi | Very good nutritional quality |
| B | İyi beslenme kalitesi | Good nutritional quality |
| C | Orta beslenme kalitesi | Average nutritional quality |
| D | Düşük beslenme kalitesi | Low nutritional quality |
| E | Kötü beslenme kalitesi | Poor nutritional quality |

### Admin — Ürün Formunda Nutri-Score Dropdown
- Mevcut besin değerleri bölümünün ÜSTÜNE ekle
- Label: "Nutri-Score (opsiyonel)"
- İkon: Phosphor `Gauge` (Thin)
- Dropdown seçenekleri: Boş (seçim yok) / A / B / C / D / E
- Her seçeneğin yanında renkli dot (8px daire, ilgili renk)
- Seçildiğinde kaydedilen değer: 'A', 'B', 'C', 'D', 'E' veya NULL

### Public Menü — Ürün Kartında Gösterim

**kcal badge HER ZAMAN görünür — Nutri-Score opsiyonel ek bilgi.**

Layout (kcal badge satırı):
```
[🔥 180 kcal] [B]
              ↑ küçük renkli kare badge (20×20px, tıklanabilir)
```

- kcal badge: mevcut tasarım korunur (her zaman gösterilir)
- Nutri-Score badge: kcal'in SAĞINDA, 20×20px kare, border-radius 4px, ilgili renk arka plan, beyaz harf (C harfi için koyu metin)
- `nutri_score` NULL ise badge gösterilmez, sadece kcal kalır

### Public Menü — Nutri-Score Dropdown (Tıklayınca Açılan)

Nutri-Score badge'ine dokunduğunda açılan dropdown:

**Yapı:**
```
┌────────────────────────────────┐
│  Nutri-Score                   │
│  Avrupa beslenme kalitesi      │
│  skalası                       │
├────────────────────────────────┤
│  [A] [B] [C] [D] [E]          │  ← 5 harf, seçili olan BÜYÜK
│  Daha        Daha az           │
│  sağlıklı    sağlıklı          │
│                                │
│  ┌─ Seçili skor açıklama ────┐ │
│  │ [D] Düşük beslenme        │ │
│  │     kalitesi               │ │
│  └────────────────────────────┘ │
├────────────────────────────────┤
│  İşletme tarafından beyan      │
│  edilmiştir.                   │
└────────────────────────────────┘
```

**Detaylar:**
- Dropdown genişlik: 240px
- Konumu: badge'in altında, sağa hizalı
- Animasyon: fade-in + translateY(-4px → 0) + scale(0.96 → 1), 0.2s ease
- Backdrop: saydam tam ekran div (tıklayınca kapanır)
- Gölge: white temada `0 8px 32px rgba(0,0,0,0.12)`, black temada `0 8px 32px rgba(0,0,0,0.5)`

**Skala gösterimi:**
- 5 harf yan yana, flex
- Seçili harf: flex 1.6, height 32px, radius 7px, tam renk arka plan, font 16px bold, 2px border + box-shadow
- Diğer harfler: flex 1, height 24px, radius 5px, renk %25 opacity arka plan, font 11px, 1px border %30 opacity
- Altında: "Daha sağlıklı" (sol) — "Daha az sağlıklı" (sağ), 9px muted

**Seçili skor açıklaması:**
- Renkli arka plan (%12 opacity) + border (%25 opacity)
- Sol: 28×28px renkli kare badge ile harf
- Sağ: açıklama metni (dile göre TR/EN)

**Alt not:**
- "İşletme tarafından beyan edilmiştir." / "Declared by the establishment."
- 10px, muted renk

### Tema Uyumu
- White: dropdown bg beyaz, border #E5E5E5
- Black: dropdown bg #2C2C2E, border #3C3C3E

---

## AB/EU BESİN DEĞERLERİ FORMATI

### Zorunlu 7 Madde (AB 1169/2011)
Bu 7 madde AB'de zorunlu gösterimdir. Sıralama sabittir:

| # | Besin Ögesi | Birim | Mevcut JSONB field |
|---|------------|-------|-------------------|
| 1 | Enerji | kJ / kcal | calories (× 4.184 = kJ) |
| 2 | Yağ | g | total_fat |
| 3 | — doymuş yağ | g | saturated_fat |
| 4 | Karbonhidrat | g | total_carbs |
| 5 | — şekerler | g | sugars |
| 6 | Protein | g | protein |
| 7 | Tuz | g | sodium (× 2.5 / 1000 = tuz g) |

**NOT:** 
- Enerji hem kJ hem kcal gösterilir: "523 kJ / 125 kcal"
- Sodyum → Tuz dönüşümü: `tuz (g) = sodyum (mg) × 2.5 / 1000`
- Trans yağ, kolesterol, lif, vitaminler AB'de zorunlu değil ama opsiyonel gösterilebilir

### Gösterim Formatı

#### Tablo Layout (AB standardı)
```
┌──────────────────────────────────────┐
│  Besin Değerleri                     │
│  100 g / porsiyon başına             │
├──────────────────────────────────────┤
│  Enerji          523 kJ / 125 kcal  │
│  Yağ                         8,5 g  │
│    doymuş yağ                3,1 g  │
│  Karbonhidrat               12,0 g  │
│    şekerler                  4,2 g  │
│  Protein                     6,3 g  │
│  Tuz                        0,75 g  │
├──────────────────────────────────────┤
│  Referans Alım (RI%)                │
│  ██████░░░░░░░░░░░░░░  6%           │
└──────────────────────────────────────┘
```

#### Trafik Işığı Renk Kodlaması
Her besin ögesinin yanında küçük renk göstergesi:

**Yağ (per 100g):**
- 🟢 Yeşil: ≤ 3g
- 🟡 Sarı: 3.1g – 17.5g
- 🔴 Kırmızı: > 17.5g

**Doymuş Yağ (per 100g):**
- 🟢 Yeşil: ≤ 1.5g
- 🟡 Sarı: 1.6g – 5g
- 🔴 Kırmızı: > 5g

**Şeker (per 100g):**
- 🟢 Yeşil: ≤ 5g
- 🟡 Sarı: 5.1g – 22.5g
- 🔴 Kırmızı: > 22.5g

**Tuz (per 100g):**
- 🟢 Yeşil: ≤ 0.3g
- 🟡 Sarı: 0.31g – 1.5g
- 🔴 Kırmızı: > 1.5g

**Trafik ışığı gösterimi:**
- Her satırın solunda 8px çaplı daire (dot)
- Renk: yeşil (#4CAF50), sarı/amber (#FFC107), kırmızı (#F44336)
- Sadece yağ, doymuş yağ, şeker, tuz satırlarında gösterilir
- Enerji, karbonhidrat, protein satırlarında dot yok

#### Referans Alım (RI%) Gösterimi
AB'de "Reference Intake" (RI) kullanılır (FDA'daki "% Daily Value" karşılığı):

| Besin Ögesi | Günlük RI |
|-------------|-----------|
| Enerji | 8400 kJ / 2000 kcal |
| Yağ | 70g |
| Doymuş yağ | 20g |
| Karbonhidrat | 260g |
| Şeker | 90g |
| Protein | 50g |
| Tuz | 6g |

- RI% = (miktar / günlük RI) × 100
- Tablonun sağ sütununda her satırda "6%" gibi gösterilir
- Altta küçük not: "Referans alım: ortalama yetişkin (8400 kJ / 2000 kcal)"

---

## UI TASARIMI

### Tetikleme
- Mevcut: ürün kartında kcal badge'ine tıklayınca besin değerleri açılıyor
- Bu davranış korunacak — sadece içerik AB formatına dönecek

### Tablo Tasarımı
- **Başlık:** "Besin Değerleri" (TR) / "Nutrition Information" (EN) — FDA'daki "Nutrition Facts" değil
- **Alt başlık:** "100 g başına" veya "Porsiyon başına (Xg)" — serving_size varsa porsiyon göster
- **Satırlar:** Zebra striping yok, ince ayırıcı çizgiler (1px, muted renk)
- **Alt kalemler (doymuş yağ, şekerler):** 16px sol indent, normal font (kalın değil)
- **Değerler:** Sağa hizalı, ondalık virgül (Türk formatı: "8,5 g" — nokta değil)
- **RI%:** En sağda, muted renk, küçük font
- **Trafik ışığı dot:** Satırın en solunda, 8px daire

### Renk ve Font
- Başlık: Roboto Bold, 16px
- Satır adı: Roboto Regular, 14px
- Değer: Roboto Medium, 14px
- RI%: Roboto Regular, 12px, muted
- Alt not: Roboto Light, 11px, muted

### Tema Uyumu
**White tema:**
- Tablo arka plan: beyaz
- Border: #E5E5E5
- Metin: #1C1C1E
- Muted: #9CA3AF

**Black tema:**
- Tablo arka plan: #2C2C2E
- Border: #3C3C3E
- Metin: #FFFFFF
- Muted: #9CA3AF

### Çok Dilli Destek
Mevcut UI string'leri güncelle (minimum 4 dil):

| Key | TR | EN | AR | ZH |
|-----|----|----|----|----|
| nutrition_title | Besin Değerleri | Nutrition Information | معلومات غذائية | 营养信息 |
| per_100g | 100 g başına | Per 100 g | لكل 100 غرام | 每100克 |
| per_serving | Porsiyon başına | Per serving | لكل حصة | 每份 |
| energy | Enerji | Energy | طاقة | 能量 |
| fat | Yağ | Fat | دهون | 脂肪 |
| saturated_fat | doymuş yağ | saturated fat | دهون مشبعة | 饱和脂肪 |
| carbohydrate | Karbonhidrat | Carbohydrate | كربوهيدرات | 碳水化合物 |
| sugars | şekerler | sugars | سكريات | 糖 |
| protein | Protein | Protein | بروتين | 蛋白质 |
| salt | Tuz | Salt | ملح | 盐 |
| ri_note | Referans alım: ortalama yetişkin (8400 kJ / 2000 kcal) | Reference intake of an average adult (8400 kJ / 2000 kcal) | المدخول المرجعي لشخص بالغ متوسط (8400 كيلوجول / 2000 سعرة حرارية) | 成人平均参考摄入量 (8400千焦/2000千卡) |
| ri_percent | RI% | RI% | النسبة المرجعية% | 参考摄入量% |

---

## DÖNÜŞÜM KURALLARI

### kcal → kJ
```
kJ = kcal × 4.184
```
Gösterim: "523 kJ / 125 kcal"

### Sodyum (mg) → Tuz (g)
```
tuz_g = sodium_mg × 2.5 / 1000
```
Gösterim: "0,75 g" (Türk ondalık formatı)

### Ondalık Format
- Türkçe ve çoğu AB dili: virgül (8,5 g)
- İngilizce: nokta (8.5 g)
- Dile göre otomatik format

### Porsiyon vs 100g
- `serving_size` varsa: "Porsiyon başına (150g)" göster
- `serving_size` yoksa: "100 g başına" göster
- Değerler her zaman mevcut JSONB değerleri — per 100g'a çevirme YAPMA (restoran ne girdiyse o)

---

## DEĞİŞTİRİLECEK DOSYALAR

```
Yeni:
- src/lib/nutritionEU.ts — AB format helper'ları:
  - kcalToKj(kcal)
  - sodiumToSalt(sodium_mg)  
  - getTrafficLight(nutrient, value) → 'green' | 'amber' | 'red'
  - getRIPercent(nutrient, value)
  - formatNutritionValue(value, locale) → "8,5" veya "8.5"
  - nutriScoreColors, nutriScoreLabels
- migration-nutri-score.sql — nutri_score kolonu

Değişecek:
- src/pages/PublicMenu.tsx — besin değerleri gösterim (FDA → AB), kcal badge yanına Nutri-Score badge + dropdown
- src/pages/RestaurantDashboard.tsx — ürün formuna Nutri-Score dropdown

Değişmeyecek:
- Admin besin değerleri formu (JSONB yapısı tamamen aynı kalacak)
- DB nutrition JSONB şeması
```

---

## GENEL KURALLAR

1. **Admin tarafına DOKUNMA** — sadece public menü gösterimi değişecek
2. **DB şeması DEĞİŞMEYECEK** — mevcut nutrition JSONB'yi olduğu gibi kullan
3. **Phosphor Icons Thin weight**
4. **Emoji ikon YASAK** — trafik ışığı renkleri CSS dot ile gösterilecek, emoji değil
5. **4-nokta spacing sistemi**
6. **TypeScript strict** — any kullanma
7. **Mevcut kcal badge tetikleme mekanizmasını koru** — sadece açılan içerik değişecek
8. **Ondalık format dile göre** — TR virgül, EN nokta

---

## TEST CHECKLIST

### AB Besin Değerleri
- [ ] Besin değerleri tablosu AB formatında görünüyor
- [ ] Başlık: "Besin Değerleri" (FDA "Nutrition Facts" değil)
- [ ] Enerji: kJ + kcal birlikte gösteriliyor
- [ ] Tuz: sodyumdan hesaplanıyor (× 2.5 / 1000)
- [ ] Zorunlu 7 madde doğru sırada
- [ ] Trafik ışığı dot'ları doğru renkte (yeşil/sarı/kırmızı)
- [ ] RI% doğru hesaplanıyor
- [ ] Alt not görünüyor (referans alım açıklaması)
- [ ] Türkçe: ondalık virgül (8,5 g)
- [ ] İngilizce: ondalık nokta (8.5 g)
- [ ] Alt kalemler indentli (doymuş yağ, şekerler)
- [ ] serving_size varsa "Porsiyon başına" yazıyor
- [ ] serving_size yoksa "100 g başına" yazıyor
- [ ] kcal badge tıklama hâlâ çalışıyor

### Nutri-Score
- [ ] migration-nutri-score.sql üretildi
- [ ] Admin: ürün formunda Nutri-Score dropdown görünüyor
- [ ] Admin: A-E seçenekleri renkli dot ile
- [ ] Admin: boş seçenek (NULL) var
- [ ] Admin: kaydet çalışıyor (DB'ye yazılıyor)
- [ ] Public: kcal badge her zaman görünür
- [ ] Public: nutri_score varsa kcal yanında renkli harf badge
- [ ] Public: nutri_score NULL ise badge yok
- [ ] Public: badge'e dokunduğunda dropdown açılıyor
- [ ] Public: dropdown'da 5 harf skalası, seçili büyük (zoom)
- [ ] Public: "Daha sağlıklı / Daha az sağlıklı" yön göstergesi
- [ ] Public: seçili skor açıklaması doğru
- [ ] Public: "İşletme tarafından beyan edilmiştir" alt notu
- [ ] Public: dropdown dışına tıklayınca kapanıyor
- [ ] Public: fade-in animasyon çalışıyor

### Tema & Dil
- [ ] White tema doğru (her iki özellik)
- [ ] Black tema doğru (her iki özellik)
- [ ] Çok dilli (TR/EN/AR/ZH minimum)
- [ ] npm run build hatasız

---

## ÖNCELİK SIRASI

1. migration-nutri-score.sql üret
2. nutritionEU.ts helper fonksiyonları (AB format + Nutri-Score renk/label sabitleri)
3. Admin ürün formuna Nutri-Score dropdown
4. PublicMenu.tsx FDA tabloyu AB tabloyla değiştir
5. Public kcal badge yanına Nutri-Score badge
6. Nutri-Score dropdown UI (tıklayınca açılan)
7. Trafik ışığı dot'ları
8. RI% hesaplama + gösterim
9. Ondalık format (dile göre)
10. Çok dilli string'ler
11. Tema uyumu (white + black)
12. Build test
