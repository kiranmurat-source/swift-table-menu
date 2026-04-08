# TABBLED — Super Admin KPI Dashboard
## Claude Code Prompt — 10 Nisan 2026

---

## GENEL BAKIŞ

SuperAdminDashboard.tsx'teki mevcut 4 istatistik kartını kapsamlı bir KPI Dashboard'a genişlet. Sistem sağlığı, iş metrikleri ve kullanım istatistiklerini gösteren bir dashboard oluştur. Tüm veriler Supabase'den gerçek zamanlı çekilecek.

---

## MEVCUT DURUM

SuperAdminDashboard.tsx'te şu an 4 kart var:
- Toplam Restoran
- Aktif Üyelik
- Aylık Gelir
- Süresi Dolan

Bunlar `restaurants`, `subscriptions`, `subscription_plans` tablolarından çekiliyor.

---

## YENİ KPI DASHBOARD YAPISI

Dashboard 3 bölümden oluşacak, her bölüm bir başlık altında gruplanacak:

### BÖLÜM 1: SİSTEM SAĞLIĞI

Kartlar (grid 2x2 veya 4x1):

1. **Toplam Menü Ürünü**
   - `SELECT COUNT(*) FROM menu_items`
   - İkon: CiViewList
   - Alt metin: "X aktif, Y pasif" (`is_available` true/false sayımı)

2. **Fotoğraflı Ürün Oranı**
   - `SELECT COUNT(*) FROM menu_items WHERE image_url IS NOT NULL AND image_url != ''` / toplam
   - Yüzde olarak göster: "%72"
   - İkon: CiCamera
   - Renk: %80+ yeşil, %50-80 sarı, <%50 kırmızı

3. **Aktif / Pasif Restoran**
   - `SELECT COUNT(*) FROM restaurants WHERE is_active = true` ve false
   - Gösterim: "5 aktif / 2 pasif"
   - İkon: CiShop

4. **Bu Hafta Eklenen Ürün**
   - `SELECT COUNT(*) FROM menu_items WHERE created_at >= NOW() - INTERVAL '7 days'`
   - İkon: CiCalendar
   - Alt metin: "Son 7 gün"

### BÖLÜM 2: İŞ METRİKLERİ

Kartlar (grid 2x2 veya 4x1):

5. **Plan Dağılımı**
   - Her planın aktif üyelik sayısı
   - Gösterim: "Basic: 3 | Pro: 2 | Premium: 1"
   - `SELECT sp.name, COUNT(s.id) FROM subscriptions s JOIN subscription_plans sp ON s.plan_id = sp.id WHERE s.status = 'active' GROUP BY sp.name`
   - İkon: CiViewBoard

6. **Aylık Gelir**
   - Mevcut kart geliştirilecek
   - `SUM(sp.price_yearly / 12)` aktif üyelikler için
   - Gösterim: "₺4,200 /ay"
   - İkon: CiDollar

7. **30 Gün İçinde Dolacak Üyelikler**
   - `SELECT COUNT(*) FROM subscriptions WHERE end_date <= NOW() + INTERVAL '30 days' AND end_date > NOW() AND status = 'active'`
   - Uyarı rengi: sarı/turuncu
   - İkon: CiTimer
   - Alt metin: restoran isimlerini listele (tooltip veya alt satır)

8. **Ortalama Menü Boyutu**
   - Restoran başına ortalama ürün sayısı
   - `SELECT AVG(cnt) FROM (SELECT COUNT(*) as cnt FROM menu_items GROUP BY restaurant_id) sub`
   - Gösterim: "12.5 ürün/restoran"
   - İkon: CiBoxList

### BÖLÜM 3: KULLANIM

Kartlar (grid 3x1):

9. **Son 7 Günde Aktif Restoranlar**
   - `SELECT COUNT(DISTINCT restaurant_id) FROM menu_items WHERE updated_at >= NOW() - INTERVAL '7 days'`
   - İkon: CiWavePulse1
   - Alt metin: "Menüsünü güncelleyenler"

10. **Boş Menüsü Olan Restoranlar**
    - Hiç ürünü olmayan restoranlar
    - `SELECT COUNT(*) FROM restaurants r WHERE NOT EXISTS (SELECT 1 FROM menu_items mi WHERE mi.restaurant_id = r.id)`
    - Uyarı rengi: kırmızı (0 ise yeşil)
    - İkon: CiCircleAlert (veya CiWarning)
    - Alt metin: Restoran isimlerini listele

11. **QR Kod Oluşturulmuş Restoran**
    - `SELECT COUNT(DISTINCT restaurant_id) FROM qr_codes`
    - İkon: CiGrid2H
    - Alt metin: "X / Y restoran" (toplam restoran ile oran)

---

## TASARIM

### Kart Stili

Her KPI kartı:
```
┌─────────────────────┐
│ 📊 Başlık           │
│                     │
│    42               │ ← Büyük sayı (font-size: 28-32px, font-weight: 700)
│                     │
│ Alt açıklama         │ ← Küçük metin (font-size: 12px, text-muted)
└─────────────────────┘
```

- Background: `#fff`
- Border: `1px solid #e7e5e4`
- Border-radius: 12px
- Padding: 20px
- İkon + başlık üst satırda (flex, gap: 8px)
- Ana metrik ortada büyük
- Alt açıklama küçük gri

### Bölüm Başlıkları

```
── SİSTEM SAĞLIĞI ────────────────────
[kart] [kart] [kart] [kart]

── İŞ METRİKLERİ ─────────────────────
[kart] [kart] [kart] [kart]

── KULLANIM ───────────────────────────
[kart] [kart] [kart]
```

- Başlık: `font-size: 13px`, `font-weight: 700`, `text-transform: uppercase`, `letter-spacing: 1px`, `color: #a8a29e`
- Altında ince çizgi (`border-bottom: 1px solid #e7e5e4`)
- Margin-bottom: 16px

### Grid Layout

- Desktop: `grid-template-columns: repeat(4, 1fr)` (ilk iki bölüm), `repeat(3, 1fr)` (son bölüm)
- Mobil: `grid-template-columns: repeat(2, 1fr)`

### Renk Kodlaması

Bazı kartlarda değer rengi anlamlı olacak:
- Yeşil (`#16a34a`): İyi durumda
- Sarı/Turuncu (`#d97706`): Dikkat gerekiyor
- Kırmızı (`#dc2626`): Acil/sorunlu

---

## KOD YAPISI

### Veri Çekme

Tüm KPI verileri `useEffect` ile sayfa yüklendiğinde çekilecek. Ayrı bir `loadKPIData()` fonksiyonu oluştur:

```typescript
interface KPIData {
  // Sistem Sağlığı
  totalItems: number;
  activeItems: number;
  passiveItems: number;
  photoPercentage: number;
  activeRestaurants: number;
  passiveRestaurants: number;
  weeklyNewItems: number;
  
  // İş Metrikleri
  planDistribution: { name: string; count: number }[];
  monthlyRevenue: number;
  expiringSoon: number;
  expiringNames: string[];
  avgMenuSize: number;
  
  // Kullanım
  recentlyActiveRestaurants: number;
  emptyMenuRestaurants: number;
  emptyMenuNames: string[];
  qrCreatedRestaurants: number;
  totalRestaurants: number;
}
```

### Supabase Sorguları

Supabase JS client ile mümkün olduğunca tek sorguda çek. Bazı karmaşık sorgular için birden fazla sorgu gerekebilir. `.rpc()` kullanma — doğrudan `.from().select()` ile yap.

Önemli: Supabase JS client aggregation (COUNT, AVG, SUM) doğrudan desteklemez. Tüm verileri çekip JavaScript'te hesapla:

```typescript
// Örnek: Toplam ürün
const { data: items } = await supabase.from('menu_items').select('id, is_available, image_url, restaurant_id, created_at');
const totalItems = items?.length || 0;
const activeItems = items?.filter(i => i.is_available).length || 0;
// ... vb.
```

NOT: Eğer restoran sayısı çok fazla olursa (100+) bu yaklaşım verimsiz olabilir, ama şu an için yeterli.

### KPI Kartları mevcut istatistik kartlarının ALTINA eklenecek

Mevcut 4 kart (Toplam Restoran, Aktif Üyelik, Aylık Gelir, Süresi Dolan) KALACAK. Altına yeni KPI bölümleri eklenecek. Yani sayfanın yapısı:

```
[Mevcut 4 kart — üst sıra]

── SİSTEM SAĞLIĞI ────
[4 yeni kart]

── İŞ METRİKLERİ ─────
[4 yeni kart]

── KULLANIM ──────────
[3 yeni kart]
```

### Mevcut kodu bozmadan ekleme yap

- Mevcut `stats` state ve `loadStats()` fonksiyonu korunacak
- Yeni `kpiData` state ve `loadKPIData()` fonksiyonu EKLENE
- `loadKPIData()` sayfa yüklendiğinde ve tab 'restaurants' olduğunda çağrılacak
- KPI kartları sadece `tab === 'restaurants'` olduğunda render edilecek (mevcut 4 kartın altında)

---

## İKON KULLANIMI

Circum Icons (react-icons/ci):
- CiViewList — Toplam Ürün
- CiCamera — Fotoğraflı Ürün
- CiShop — Aktif/Pasif Restoran
- CiCalendar — Haftalık Eklenen
- CiViewBoard — Plan Dağılımı
- CiDollar — Aylık Gelir
- CiTimer — Dolacak Üyelikler
- CiBoxList — Ortalama Menü
- CiWavePulse1 — Aktif Restoranlar
- CiCircleRemove — Boş Menü
- CiGrid2H — QR Kod

Gerekirse mevcut import'lara ekle. shadcn/ui internal Lucide'a DOKUNMA.

---

## FONT

- Bölüm başlıkları: Inter 700, 13px, uppercase
- Kart başlıkları: Inter 600, 13px
- Ana metrik: Playfair Display 700, 28-32px
- Alt açıklama: Inter 300, 12px

---

## TEST

1. Tüm KPI kartları doğru veri gösteriyor
2. Boş DB'de (0 restoran, 0 ürün) hata vermiyor
3. Fotoğraf yüzdesi doğru hesaplanıyor
4. Plan dağılımı doğru
5. Dolacak üyelikler doğru filtreleniyor
6. Mobilde grid 2 kolona düşüyor
7. npm run build başarılı
