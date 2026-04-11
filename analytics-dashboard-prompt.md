# CLAUDE CODE PROMPT — Restoran Analytics Dashboard
## Sidebar'da Ayrı Dashboard Sayfası (Orta Seviye)

---

## GÖREV ÖZETI

Restoran admin panelinin sidebar'ına "Dashboard" sayfası ekle. Restoran sahibinin işletme performansını tek bakışta görmesini sağla.

---

## PROJE BİLGİLERİ

- **Proje dizini:** /opt/khp/tabbled/
- **Stack:** React + Vite + TypeScript + shadcn/ui
- **İkon:** Phosphor Icons (@phosphor-icons/react)
- **Marka:** #FF4F7A (pembe), #1C1C1E (siyah), #F7F7F8 (açık gri)
- **Admin sidebar:** Sol sidebar, 4 grup (Menü Yönetimi / Müşteri İlişkileri / Pazarlama / Görünüm)
- **DB tablolar:** restaurants, menu_categories, menu_items, waiter_calls, feedback, discount_codes, product_likes
- **RPC:** increment_discount_usage, get_like_counts
- **Feature toggle'lar:** feature_waiter_calls, feature_cart, feature_whatsapp_order, feature_feedback, feature_discount_codes, feature_likes

---

## DASHBOARD YERLEŞİMİ

Sidebar'da EN ÜSTE ekle — tüm grupların üzerinde, tek başına:

```
┌──────────────────┐
│  📊 Dashboard    │  ← YENİ (aktif: pembe sol border + bold)
│                  │
│  MENÜ YÖNETİMİ  │
│  Menü            │
│  Çeviri Merkezi  │
│  QR Kodları      │
│                  │
│  MÜŞTERİ İLİŞ.  │
│  Çağrılar        │
│  Geri Bildirim   │
│  Beğeniler       │
│  ...             │
└──────────────────┘
```

Dashboard, sidebar'daki ilk item olsun. Restoran paneli açıldığında varsayılan olarak Dashboard gösterilsin (şu an muhtemelen Menü gösteriliyor — bunu Dashboard'a çevir).

---

## DASHBOARD İÇERİĞİ

### Bölüm 1: Özet Kartlar (4 kart, üst sıra)

Grid: mobilde 2x2, desktop'ta 4x1

```
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│  Toplam  │ │ Aktif   │ │ Geri    │ │ Toplam  │
│  Ürün    │ │ Ürün    │ │ Bildirim│ │ Beğeni  │
│   47     │ │   42    │ │  ★ 4.2  │ │   128   │
│  5 pasif │ │ 3 tüken │ │  23 adet│ │ bu hafta│
└─────────┘ └─────────┘ └─────────┘ └─────────┘
```

**Kart 1 — Toplam Ürün:**
- Büyük sayı: menu_items COUNT (WHERE restaurant_id = current)
- Alt metin: "{x} pasif" (is_available = false)
- İkon: ForkKnife (Phosphor)

**Kart 2 — Aktif Ürün:**
- Büyük sayı: menu_items COUNT (WHERE is_available = true AND is_sold_out != true)
- Alt metin: "{x} tükendi" (is_sold_out = true)
- İkon: CheckCircle (Phosphor)

**Kart 3 — Geri Bildirim:**
- Büyük sayı: feedback ortalama puan (★ X.X)
- Alt metin: "{x} değerlendirme" (feedback COUNT)
- İkon: Star (Phosphor)
- Puan yoksa: "—" göster, alt metin: "Henüz değerlendirme yok"

**Kart 4 — Toplam Beğeni:**
- Büyük sayı: product_likes COUNT (WHERE status = 'approved')
- Alt metin: "bu hafta +{x}" (son 7 gün)
- İkon: Heart (Phosphor)

### Bölüm 2: Garson Çağrıları (son 7 gün grafiği)

**Koşul:** Sadece `feature_waiter_calls !== false` ise göster.

**Basit bar chart — son 7 gün:**

Supabase'den veri çek:
```sql
SELECT DATE(created_at) as date, COUNT(*) as count
FROM waiter_calls
WHERE restaurant_id = '{id}'
AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date
```

**NOT:** Supabase JS client'ta aggregate yok — tüm son 7 günlük waiter_calls'ı çek, JS'te grupla.

**Görsel:** Basit CSS bar chart (kütüphane ekleme — sade div'lerle yap).

```
Garson Çağrıları (Son 7 Gün)
┌────────────────────────────────────┐
│  █                                 │
│  █  █        █                     │
│  █  █  █     █  █                  │
│  █  █  █  █  █  █  █              │
│  Pzt Sal Çar Per Cum Cmt Paz     │
│  12  8   5   3   15  10  7        │
└────────────────────────────────────┘
  Toplam: 60 çağrı
```

- Bar rengi: #FF4F7A (pembe)
- Altında: "Toplam: {x} çağrı" ve "Ort: {x}/gün"
- Veri yoksa: "Son 7 günde garson çağrısı yok" mesajı

### Bölüm 3: Popüler Ürünler (En Çok Beğenilen Top 5)

**Koşul:** Sadece `feature_likes !== false` ise göster.

RPC `get_like_counts` kullan, sonuçları sırala, ilk 5'i al.

```
En Çok Beğenilen Ürünler
┌──────────────────────────────────────┐
│ 1. 🔥 Adana Kebap          ♥ 45    │
│ 2.    Künefe                ♥ 38    │
│ 3.    Mantı                 ♥ 29    │
│ 4.    Serpme Kahvaltı       ♥ 22    │
│ 5.    Baklava               ♥ 18    │
└──────────────────────────────────────┘
```

- 1. sıradaki öne çıksın (🔥 veya Fire ikonu)
- Her satırda: sıra + ürün adı + kalp + beğeni sayısı
- Veri yoksa: "Henüz beğeni yok" mesajı

### Bölüm 4: Son Geri Bildirimler (Son 5)

**Koşul:** Sadece `feature_feedback !== false` ise göster.

```sql
SELECT * FROM feedback
WHERE restaurant_id = '{id}'
ORDER BY created_at DESC
LIMIT 5
```

```
Son Geri Bildirimler
┌──────────────────────────────────────┐
│ ★★★★★  "Harika yemekler!"          │
│ Ahmet · 2 saat önce · Masa 5       │
│──────────────────────────────────────│
│ ★★★★☆  "Servis biraz yavaştı"      │
│ Elif · 1 gün önce · Masa 12        │
│──────────────────────────────────────│
│ ...                                  │
└──────────────────────────────────────┘
  Tümünü Gör →  (link: Geri Bildirim sayfasına)
```

- Yıldız + yorum kısaltması (max 50 karakter, üstü ...)
- İsim + göreceli zaman (X saat/gün önce) + masa no
- "Tümünü Gör →" linki sidebar'daki Geri Bildirim sayfasına yönlendir
- Veri yoksa: "Henüz geri bildirim yok" mesajı

### Bölüm 5: İndirim Kodları Durumu

**Koşul:** Sadece `feature_discount_codes !== false` ise göster.

```sql
SELECT code, discount_type, discount_value, current_uses, max_uses, is_active, expires_at
FROM discount_codes
WHERE restaurant_id = '{id}' AND is_active = true
ORDER BY current_uses DESC
LIMIT 5
```

```
Aktif İndirim Kodları
┌──────────────────────────────────────┐
│ HOSGELDIN   %15    12/50 kullanım   │
│ YAZ2026     20 TL  5/∞  kullanım   │
│ VIP10       %10    28/30 kullanım ⚠ │
└──────────────────────────────────────┘
  Tümünü Gör →  (link: İndirim Kodları sayfasına)
```

- Kod adı + indirim (% veya TL) + kullanım/limit
- Limiti dolmak üzere olanlarda ⚠ uyarı (>%80 kullanılmış)
- Süresi dolmuş/pasif kodlar gösterilmez
- "Tümünü Gör →" linki İndirim Kodları sayfasına
- Veri yoksa: "Aktif indirim kodu yok" mesajı

### Bölüm 6: Hızlı İstatistikler (Menü Özeti)

```
Menü Özeti
┌──────────────────────────────────────┐
│ Kategoriler:  8                      │
│ Alt kategoriler: 3                   │
│ Fotoğraflı ürün: 35/47 (%74)       │
│ Alerjen bilgili: 28/47 (%60)       │
│ Tükendi (86'd): 2                    │
│ Öne çıkan: 5                        │
└──────────────────────────────────────┘
```

- Kategori sayısı (parent kategoriler)
- Alt kategori sayısı (parent_id IS NOT NULL)
- Fotoğraflı ürün oranı (image_url IS NOT NULL / toplam)
- Alerjen bilgili ürün oranı (allergens dizisi boş olmayan / toplam)
- Tükendi sayısı
- Öne çıkan (is_featured) sayısı
- Eksik oranlar %50'nin altındaysa sarı uyarı rengi

---

## TASARIM PRENSİPLERİ

### Layout
```
Desktop (>1024px):
┌────────────────────────────────────────────┐
│  [Kart1] [Kart2] [Kart3] [Kart4]          │  ← 4 sütun grid
├─────────────────────┬──────────────────────┤
│  Garson Çağrıları   │  Popüler Ürünler     │  ← 2 sütun
│  (bar chart)        │  (top 5 liste)       │
├─────────────────────┴──────────────────────┤
│  Son Geri Bildirimler                      │  ← tam genişlik
├─────────────────────┬──────────────────────┤
│  İndirim Kodları    │  Menü Özeti          │  ← 2 sütun
└─────────────────────┴──────────────────────┘

Mobil (<768px):
Kartlar 2x2, geri kalanı tek sütun (full width)
```

### Stil
- Kart arka plan: beyaz, border: 1px solid #E5E7EB, border-radius: 12px
- Kart padding: 20px
- Başlık: Inter 14px semibold, text-gray-500, uppercase, letter-spacing 0.05em
- Büyük sayı: Inter 28px bold, text-gray-900
- Alt metin: Inter 13px, text-gray-500
- İkon: 20px, text-gray-400 (kart'ın sağ üstünde veya başlık yanında)
- Bölüm arası boşluk: 24px
- Bar chart bar: #FF4F7A, border-radius: 4px üst

### Loading State
- Her bölüm için ayrı loading (paralel fetch)
- Shimmer skeleton animasyonu (mevcut loading skeleton'la tutarlı)

### Boş State
- Her bölüm veri yoksa kendi boş mesajını göstersin (yukarıda belirtildi)
- Gri ikon + açık gri metin, ortalanmış

---

## TEKNİK UYGULAMA

### Dosya: src/components/dashboard/RestaurantAnalytics.tsx

Tek büyük bileşen yerine, her bölüm ayrı bileşen olabilir (ama tek dosyada tutulabilir):

```typescript
// Ana bileşen
const RestaurantAnalytics = ({ restaurantId }: { restaurantId: string }) => {
  // Tüm verileri paralel çek
  // ...
  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <SummaryCards ... />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WaiterCallsChart ... />
        <PopularItems ... />
      </div>
      <RecentFeedback ... />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DiscountCodesStatus ... />
        <MenuSummary ... />
      </div>
    </div>
  );
};
```

### Veri Çekme

Supabase JS client kullan. Aggregate yok — tüm veriyi çek, JS'te hesapla.

```typescript
// Paralel fetch
const [
  { data: items },
  { data: categories },
  { data: waiterCalls },
  { data: feedbackData },
  { data: discountCodes },
] = await Promise.all([
  supabase.from('menu_items').select('*').eq('restaurant_id', restaurantId),
  supabase.from('menu_categories').select('*').eq('restaurant_id', restaurantId),
  supabase.from('waiter_calls').select('*').eq('restaurant_id', restaurantId).gte('created_at', sevenDaysAgo),
  supabase.from('feedback').select('*').eq('restaurant_id', restaurantId).order('created_at', { ascending: false }).limit(5),
  supabase.from('discount_codes').select('*').eq('restaurant_id', restaurantId).eq('is_active', true),
]);

// Beğeniler RPC ile
const { data: likeCounts } = await supabase.rpc('get_like_counts', { p_restaurant_id: restaurantId });
```

### Bar Chart (CSS-only, kütüphane yok)

```tsx
const WaiterCallsChart = ({ data }: { data: { date: string; count: number }[] }) => {
  const maxCount = Math.max(...data.map(d => d.count), 1);
  
  return (
    <div className="bg-white border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
        Garson Çağrıları (Son 7 Gün)
      </h3>
      <div className="flex items-end gap-2 h-32">
        {data.map((d) => (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs text-gray-500">{d.count}</span>
            <div
              className="w-full bg-[#FF4F7A] rounded-t"
              style={{ height: `${(d.count / maxCount) * 100}%`, minHeight: d.count > 0 ? '4px' : '0' }}
            />
            <span className="text-xs text-gray-400">{dayLabel(d.date)}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 text-sm text-gray-500">
        Toplam: {data.reduce((s, d) => s + d.count, 0)} çağrı · 
        Ort: {(data.reduce((s, d) => s + d.count, 0) / 7).toFixed(1)}/gün
      </div>
    </div>
  );
};
```

### Göreceli Zaman

```typescript
const timeAgo = (date: string): string => {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);
  
  if (diffMin < 1) return 'Az önce';
  if (diffMin < 60) return `${diffMin} dk önce`;
  if (diffHour < 24) return `${diffHour} saat önce`;
  if (diffDay < 7) return `${diffDay} gün önce`;
  return d.toLocaleDateString('tr-TR');
};
```

---

## SIDEBAR ENTEGRASYONU

### RestaurantDashboard.tsx (veya sidebar bileşeni)

1. Sidebar'a "Dashboard" item'ı ekle — EN ÜSTE, grup dışı
2. İkon: ChartBar veya ChartLine (Phosphor)
3. Varsayılan aktif tab: "dashboard" (ilk açılışta Dashboard gösterilsin)
4. Tab değişim mantığına "dashboard" case'i ekle

```tsx
// Sidebar items — Dashboard en üstte
<button
  onClick={() => setActiveTab('dashboard')}
  className={`flex items-center gap-3 px-4 py-2.5 w-full text-left rounded-lg transition-colors ${
    activeTab === 'dashboard'
      ? 'bg-[#FF4F7A]/10 text-[#FF4F7A] font-semibold border-l-3 border-[#FF4F7A]'
      : 'text-gray-400 hover:text-white hover:bg-white/5'
  }`}
>
  <ChartBar size={20} weight={activeTab === 'dashboard' ? 'bold' : 'regular'} />
  <span>Dashboard</span>
</button>

{/* Boşluk / ayırıcı */}
<div className="my-2 border-t border-white/10" />

{/* Mevcut gruplar devam eder */}
```

### Tab İçeriği

```tsx
{activeTab === 'dashboard' && (
  <RestaurantAnalytics restaurantId={restaurant.id} />
)}
```

---

## DOĞRULAMA

```bash
# Bileşen oluşturuldu mu?
ls src/components/dashboard/RestaurantAnalytics.tsx

# Sidebar'da Dashboard var mı?
grep -n "dashboard\|Dashboard\|ChartBar" src/pages/RestaurantDashboard.tsx

# Build test
cd /opt/khp/tabbled
npm run build
```

---

## HATIRLATMALAR

- Supabase JS client'ta aggregate (COUNT, AVG, SUM) yok — fetch + JS hesaplama kullan
- Bar chart için harici kütüphane EKLEME — CSS div'lerle yap (bundle büyümesin)
- Feature toggle kontrolü: her bölüm ilgili feature kapalıysa gizlensin
- Paralel veri çekme (Promise.all) — sıralı fetch performans düşürür
- Loading: her bölüm bağımsız shimmer skeleton göstersin
- Mobilde 2x2 grid + tek sütun layout
- Veri yoksa her bölüm kendi boş state'ini göstersin — genel "veri yok" sayfası olmasın
- Dashboard varsayılan açılış tabı olsun (mevcut varsayılan ne ise onu değiştir)
- Göreceli zaman Türkçe: "dk", "saat", "gün" — İngilizce değil
- Kart tasarımı mevcut admin panel kartlarıyla (KPI Dashboard, Geri Bildirim özet kartları) tutarlı olsun
