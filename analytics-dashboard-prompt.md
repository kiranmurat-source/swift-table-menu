# ANALİTİK SİSTEMİ — MENÜ GÖRÜNTÜLENMELERİ + ÜRÜN TIKLAMA + SÜRE TAKİBİ
## Claude Code Prompt — 14 Nisan 2026 (v5)

---

## PROJE BAĞLAMI

- **Proje dizini:** /opt/khp/tabbled/
- **Stack:** React + Vite + TypeScript + S.* inline styles
- **Supabase project-ref:** qmnrawqvkwehufebbkxp
- **Public menü:** src/pages/PublicMenu.tsx
- **Admin dashboard:** src/components/dashboard/RestaurantAnalytics.tsx
- **İkonlar:** Phosphor Icons (@phosphor-icons/react) — SADECE "Thin" ağırlık. Emoji YASAK.
- **Marka renkleri:** #FF4F7A / #1C1C1E / #F7F7F8
- **Mevcut tablo:** menu_item_views (ürün detay modal açılma kaydı — id, menu_item_id, restaurant_id, fingerprint, created_at)
- **Mevcut RPC'ler:** get_item_view_counts, get_daily_views

---

## MEVCUT DURUM

- `menu_item_views` tablosu var ama sadece detay modal açılma kaydı tutuyor
- Eksik: menü sayfa açılma kaydı, detayda kalma süresi
- Admin dashboard'da basit istatistikler var (toplam ürün, aktif ürün, geri bildirim, beğeni)
- Detaylı analitik sayfası yok

---

## GÖREV 1: DB DEĞİŞİKLİKLERİ

### SQL (AYRI DOSYA — Supabase Dashboard'dan çalıştırılacak)

```sql
-- 1. Menü görüntülenme tablosu (sayfa açılma)
CREATE TABLE IF NOT EXISTS menu_page_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  fingerprint TEXT,
  table_number TEXT,
  language TEXT DEFAULT 'tr',
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_views_restaurant ON menu_page_views(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_page_views_created ON menu_page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_restaurant_created ON menu_page_views(restaurant_id, created_at);

ALTER TABLE menu_page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert page views"
  ON menu_page_views FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Owner can view own page views"
  ON menu_page_views FOR SELECT
  TO authenticated
  USING (
    restaurant_id IN (SELECT restaurant_id FROM profiles WHERE id = auth.uid())
    OR is_super_admin()
  );

CREATE POLICY "Super admin can delete page views"
  ON menu_page_views FOR DELETE
  TO authenticated
  USING (is_super_admin());

-- 2. menu_item_views tablosuna duration_seconds kolonu ekle
ALTER TABLE menu_item_views ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;

-- 3. RPC: Menü sayfa görüntülenme sayıları (günlük)
CREATE OR REPLACE FUNCTION get_page_view_counts(
  p_restaurant_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE(view_date DATE, view_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT DATE(mpv.created_at) as view_date, COUNT(*)::BIGINT as view_count
  FROM menu_page_views mpv
  WHERE mpv.restaurant_id = p_restaurant_id
    AND mpv.created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY DATE(mpv.created_at)
  ORDER BY view_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RPC: Toplam menü görüntülenme
CREATE OR REPLACE FUNCTION get_total_page_views(
  p_restaurant_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS BIGINT AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::BIGINT
    FROM menu_page_views
    WHERE restaurant_id = p_restaurant_id
      AND created_at >= NOW() - (p_days || ' days')::INTERVAL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RPC: Ürün ortalama kalma süresi
CREATE OR REPLACE FUNCTION get_item_avg_duration(
  p_restaurant_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE(menu_item_id UUID, avg_duration NUMERIC, view_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    miv.menu_item_id,
    ROUND(AVG(miv.duration_seconds)::NUMERIC, 1) as avg_duration,
    COUNT(*)::BIGINT as view_count
  FROM menu_item_views miv
  WHERE miv.restaurant_id = p_restaurant_id
    AND miv.created_at >= NOW() - (p_days || ' days')::INTERVAL
    AND miv.duration_seconds IS NOT NULL
    AND miv.duration_seconds > 0
    AND miv.duration_seconds < 300
  GROUP BY miv.menu_item_id
  ORDER BY view_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RPC: Saat bazlı menü görüntülenme (ısı haritası için)
CREATE OR REPLACE FUNCTION get_hourly_page_views(
  p_restaurant_id UUID,
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE(hour_of_day INTEGER, view_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    EXTRACT(HOUR FROM mpv.created_at)::INTEGER as hour_of_day,
    COUNT(*)::BIGINT as view_count
  FROM menu_page_views mpv
  WHERE mpv.restaurant_id = p_restaurant_id
    AND mpv.created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY hour_of_day
  ORDER BY hour_of_day;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## GÖREV 2: PUBLIC MENÜ — VERİ TOPLAMA

### Menü sayfa açılma kaydı (PublicMenu.tsx)
- Menü sayfası yüklendiğinde (splash sonrası, ürünler göründüğünde) `menu_page_views`'a kayıt at
- Kayıt verileri:
  - restaurant_id
  - fingerprint (mevcut fingerprint.ts kullan)
  - table_number (URL'den ?table=X)
  - language (seçili dil)
  - user_agent (navigator.userAgent, ilk 200 karakter)
- Session başına 1 kayıt (aynı session'da tekrar tekrar kayıt atma — sessionStorage flag)

### Ürün detay süresi (PublicMenu.tsx)
- Detay modal açıldığında timestamp kaydet (modalOpenTime)
- Modal kapandığında süreyi hesapla: `duration = Date.now() - modalOpenTime`
- Mevcut `menu_item_views` INSERT'ine `duration_seconds` ekle
- duration_seconds = Math.round(duration / 1000)
- Max 300 saniye (5 dk üzeri outlier, kaydetme)
- 0 veya negatif → null (kaydetme)

**NOT:** Mevcut item view kaydı modal açılışında atılıyor. Bunu değiştir:
- Modal açılışında: sadece timestamp kaydet (henüz INSERT yapma)
- Modal kapanışında: INSERT yap (duration_seconds ile birlikte)
- Eğer modal 2 saniyeden kısa açık kaldıysa: INSERT YAPMA (yanlışlıkla tıklama)

---

## GÖREV 3: ADMIN ANALİTİK DASHBOARD'U

### Yeni bileşen: AnalyticsDashboard.tsx

Admin sidebar'da mevcut "Dashboard" tab'ını genişlet veya altına **"Analitik"** tab'ı ekle (Phosphor: ChartBar, Thin).

### Dashboard yapısı:

#### A. Özet Kartları (üst kısım, 4 kart)
1. **Menü Görüntülenme** — son 30 gün toplam sayfa açılma
   - Alt metin: "son 30 gün"
   - Trend: bu hafta vs geçen hafta (yeşil ↑ veya kırmızı ↓ ok)
2. **Ürün Tıklama** — son 30 gün toplam detay modal açılma
   - Alt metin: "son 30 gün"
   - Trend ok
3. **Ort. İnceleme Süresi** — tüm ürünlerin ortalama detay süresi (saniye)
   - Format: "12.5 sn"
4. **Bugün Görüntülenme** — bugünkü menü açılma sayısı

#### B. Günlük Görüntülenme Grafiği (son 7 veya 30 gün)
- Basit bar chart (CSS, recharts kullanma — mevcut dashboard pattern'i)
- X ekseni: tarih (gün)
- Y ekseni: görüntülenme sayısı
- İki seri: menü açılma (mavi) + ürün tıklama (pembe)
- Filtre: 7 gün / 30 gün toggle

#### C. En Çok Tıklanan Ürünler (Top 10)
- Tablo: sıra, ürün adı, tıklama sayısı, ort. süre
- Sıralama: tıklama sayısına göre (en çok → en az)
- Ort. süre format: "X.X sn"
- Son 30 gün verisi

#### D. Saat Bazlı Yoğunluk (Isı Haritası)
- 24 saat yatay bar (0-23)
- Her saatin yoğunluğuna göre renk (açık pembe → koyu pembe)
- Son 7 gün verisi
- Restoranın en yoğun saatlerini gösterir

#### E. Popüler Kategoriler
- Kategorilerdeki ürünlerin toplam tıklama sayısına göre sıralama
- Basit liste: kategori adı + toplam tıklama
- Client-side hesaplama (ürün tıklamalarını kategoriye göre grupla)

### Tasarım kuralları
- SKILL.md'deki 4-nokta boşluk sistemi
- Kartlar: beyaz arka plan, hafif gölge, 12px radius
- Başlıklar: font-weight 600, 14px, muted renk
- Değerler: font-weight 700, 24px
- Trend okları: yeşil (#22C55E) yukarı ↑, kırmızı (#EF4444) aşağı ↓
- Chart: CSS bar chart (recharts kullanma — bundle şişmesin)
- Isı haritası: CSS grid, 24 kutu, opacity veya background-color interpolation

---

## GENEL KURALLAR

1. **Phosphor Icons:** SADECE Thin ağırlık
2. **Emoji YASAK**
3. **S.* inline styles**
4. **recharts KULLANMA** — CSS bar chart yap (bundle optimize)
5. **DB migration SQL'ini ÇALIŞTIRMA** — dosyaya yaz
6. **Mevcut özellikleri BOZMA**
7. **Supabase JS client aggregation yok** — RPC kullan veya client-side hesapla
8. **Build test:** `npm run build`

---

## SQL DOSYASI

`/opt/khp/tabbled/supabase-migration-analytics.sql` dosyasına yaz:
- menu_page_views tablosu + index'ler + RLS
- menu_item_views.duration_seconds kolonu
- 4 RPC: get_page_view_counts, get_total_page_views, get_item_avg_duration, get_hourly_page_views

---

## TEST CHECKLIST

### Veri Toplama
- [ ] Menü açıldığında menu_page_views'a kayıt atılıyor
- [ ] Aynı session'da tekrar kayıt atılmıyor
- [ ] Ürün detay modal açılıp kapanınca menu_item_views'a duration_seconds ile kayıt
- [ ] 2 saniyeden kısa açılmalarda kayıt atılmıyor
- [ ] 300 saniye üzeri duration kaydedilmiyor

### Admin Dashboard
- [ ] Sidebar'da "Analitik" tab'ı var (ChartBar ikonu)
- [ ] 4 özet kartı doğru veri gösteriyor
- [ ] Trend okları çalışıyor (bu hafta vs geçen hafta)
- [ ] Günlük görüntülenme grafiği görünüyor (7/30 gün toggle)
- [ ] En çok tıklanan ürünler listesi (Top 10)
- [ ] Saat bazlı yoğunluk ısı haritası
- [ ] Popüler kategoriler listesi
- [ ] Veri yokken "Henüz veri yok" mesajı

### Regresyon
- [ ] Mevcut dashboard çalışıyor
- [ ] Ürün detay modalı normal açılıp kapanıyor
- [ ] Beğeni sistemi çalışıyor
- [ ] Sepet, WhatsApp, garson çalışıyor

---

## ÖNCELİK SIRASI

1. **SQL dosyası oluştur** (page_views + duration + RPC'ler)
2. **Public menü veri toplama** (sayfa açılma + ürün süre)
3. **Admin analitik dashboard** (kartlar + chart + tablo + ısı haritası)
