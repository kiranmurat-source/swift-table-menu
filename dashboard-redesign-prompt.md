# DASHBOARD REDESİGN — RESTAURANT SOUL TARZI + PEMBE ÇERÇEVE FIX
## Claude Code Prompt — 14 Nisan 2026 (v6)

---

## PROJE BAĞLAMI

- **Proje dizini:** /opt/khp/tabbled/
- **Stack:** React + Vite + TypeScript + S.* inline styles
- **İkonlar:** Phosphor Icons (@phosphor-icons/react) — SADECE "Thin" ağırlık. Emoji YASAK.
- **Marka renkleri:** #FF4F7A / #1C1C1E / #F7F7F8
- **SKILL.md:** /opt/khp/tabbled/SKILL.md (OKU ve UYGULA — özellikle karanlık mod kuralları)
- **Admin paneli:** src/pages/RestaurantDashboard.tsx
- **Dashboard:** src/components/dashboard/RestaurantAnalytics.tsx
- **Analitik:** src/components/dashboard/AnalyticsPanel.tsx
- **Temalar:** Admin panelde henüz tema sistemi yok — bu prompt ile eklenecek

---

## REFERANS: Restaurant Soul Dashboard
- Beyaz arka plan, temiz kartlar, hafif gölge, border yok
- Özet kartları kompakt yatay sıra (Takings, Guests, Avg Wait, Satisfaction)
- Trend okları (yeşil ↑ kırmızı ↓) küçük ve inline
- Daily Activity bar chart (saat bazlı, açık mavi barlar)
- Bol beyaz alan (whitespace), nefes alan tasarım
- Küçük stat kartları sağ tarafta — kompakt bilgi yoğunluğu
- Tipografi: başlıklar hafif gri, değerler koyu ve büyük

---

## GÖREV 1: PEMBE ÇERÇEVE KALDIRMA

Mevcut dashboard'da kartların etrafında pembe/renkli çerçeveler (border) var. Bunları KALDIR:

- Tüm dashboard kartlarından renkli border'ları kaldır
- Yerine: hafif gölge (box-shadow: 0 1px 3px rgba(0,0,0,0.08)) — light mode
- Border: 1px solid #F0F0F0 (çok hafif gri, neredeyse görünmez) — light mode
- border-radius: 12px (mevcut korunur)

Bu değişiklik tüm admin panel kartlarına uygulanmalı:
- RestaurantAnalytics.tsx (dashboard kartları)
- AnalyticsPanel.tsx (analitik kartları)
- CustomersPanel.tsx (CRM kartları)
- WaiterCallsPanel, FeedbackPanel, LikesPanel vb.

---

## GÖREV 2: ADMIN TEMA SİSTEMİ (LIGHT / DARK)

### Konsept
Admin panel de public menü gibi tema destekleyecek. Restoran sahibinin tercihi — "Tema & Profil" bölümünde mevcut public menü tema seçicisinin yanına admin tema seçeneği.

### DB Değişikliği (AYRI SQL)
```sql
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS admin_theme TEXT DEFAULT 'light';
-- Geçerli değerler: 'light', 'dark'
```

### Admin Tema Seçici
- "Tema & Profil" bölümünde, mevcut "Menü Teması" altına:
- **"Yönetim Paneli Teması"** başlığı
- 2 seçenek: Açık (Light) / Koyu (Dark)
- Seçim yapılınca `restaurants.admin_theme` güncellenir
- Sayfa anında güncellenir (state)

### Light Mode Tasarım (Restaurant Soul ilhamı)
- **Sayfa arka plan:** #F8F9FA (çok hafif gri, saf beyaz değil)
- **Sidebar:** mevcut koyu charcoal (#1C1C1E) — HER İKİ MODDA AYNI KALIR
- **Kartlar:** beyaz (#FFFFFF), border: 1px solid #E8E8E8, box-shadow: 0 1px 3px rgba(0,0,0,0.06)
- **Başlıklar:** #6B7280 (gri, küçük, uppercase, letter-spacing: 0.05em, font-size: 11px)
- **Değerler:** #111827 (koyu siyah, font-weight: 700, font-size: 28px)
- **Alt metin:** #9CA3AF (açık gri, font-size: 13px)
- **İkonlar:** #9CA3AF (gri ton, kartın sağ üstünde)
- **Divider'lar:** #F3F4F6
- **Tablo header:** #F9FAFB arka plan, #6B7280 metin
- **Hover:** arka plan #F9FAFB

### Dark Mode Tasarım (SKILL.md kuralları)
- **Sayfa arka plan:** #0F1117 (derin koyu)
- **Sidebar:** mevcut koyu charcoal (#1C1C1E) — AYNI KALIR
- **Kartlar:** #1A1D26 (arka plandan DAHA AÇIK — SKILL.md karanlık mod kuralı), border: 1px solid #2A2D36, box-shadow: YOK
- **Başlıklar:** #6B7280 (gri, aynı stil)
- **Değerler:** #F9FAFB (beyaz)
- **Alt metin:** #6B7280
- **İkonlar:** #4B5563
- **Divider'lar:** #2A2D36
- **Tablo header:** #1F2229 arka plan, #9CA3AF metin
- **Hover:** arka plan #1F2229
- **NOT:** Gölge KULLANMA dark mode'da — kart derinliği renk farkıyla sağlanır

---

## GÖREV 3: DASHBOARD KARTLARINI RESTAURANT SOUL TARZINA GEÇİR

### RestaurantAnalytics.tsx (Ana Dashboard)

#### Özet kartları (üst 4 kart)
Mevcut kartları Restaurant Soul tarzına getir:
- Kart yüksekliği: kompakt (padding: 20px)
- Üst satır: başlık (uppercase, 11px, gri) + ikon (sağ üst, 20px, gri)
- Orta: değer (28px, bold)
- Alt: açıklama metni (13px, açık gri)
- Trend oku varsa: değerin yanında küçük inline (↑ yeşil / ↓ kırmızı + yüzde)

#### En Çok Beğenilen Ürünler
- Başlık: uppercase gri, sol hizalı
- Liste: sıra numara + ürün adı + beğeni sayısı (sağ hizalı, pembe kalp küçük)
- Satır arası: ince divider
- Max 5 ürün

#### Son Geri Bildirimler
- Aynı pattern: başlık + liste + divider
- Her satır: isim + yıldız + tarih
- "Tümünü Gör" linki

#### Menü Özeti
- Kompakt key-value listesi
- Sol: label (gri), Sağ: değer (koyu, bold)
- Arka plan: kart ile aynı

### AnalyticsPanel.tsx (Analitik Sayfası)

#### Özet kartları
- Aynı Restaurant Soul stili (üstteki gibi)
- Trend okları inline

#### Günlük Görüntülenme Grafiği
- Bar chart: ince barlar (4px genişlik), rounded üst
- Renkler: light mode → açık mavi (#93C5FD) sayfa + pembe (#FDA4AF) ürün
- Renkler: dark mode → mavi (#60A5FA) + pembe (#FB7185)
- X ekseni: gün kısaltmaları (Pzt, Sal, Çar...)
- Y ekseni: sayılar (gizli çizgi grid'ler, çok hafif)
- Alt: legend (küçük renkli daire + etiket)

#### Top 10 Tablo
- Tablo header: hafif arka plan, küçük uppercase başlıklar
- Satırlar: hover efekti, ince divider
- Sıra numarası: gri, küçük
- Ürün adı: normal weight
- Tıklama: bold
- Süre: gri, "X.X sn" format

#### Isı Haritası
- 24 kutu yatay grid
- Light mode: beyaz → pembe (#FEE2E8 → #FB7185 → #E11D48)
- Dark mode: koyu → pembe (#1A1D26 → #9F1239 → #FB7185)
- Altında saat etiketleri (0, 3, 6, 9, 12, 15, 18, 21)
- Üstünde "Yoğunluk" başlığı

---

## GÖREV 4: DİĞER PANEL'LER UYUMU

Aşağıdaki panel'lerin kartlarını da aynı tema sistemine uyumlu hale getir:

- **CustomersPanel.tsx** — özet kartları + tablo
- **WaiterCallsPanel** — çağrı kartları
- **FeedbackPanel** — geri bildirim listesi
- **LikesPanel** — beğeni listesi

Her birinde:
- Pembe border → kaldır
- Tema renklerini uygula (light/dark)
- Kart stili: Restaurant Soul tutarlılığı

### Tema uygulaması
Admin temasını bir CSS variable sistemi veya context ile uygula:
- `adminTheme` state'i RestaurantDashboard'da tutulsun
- Tüm child component'lara prop olarak geçilsin
- Veya basit: `const isDark = restaurant?.admin_theme === 'dark'`
- Her kartın style'ında: `backgroundColor: isDark ? '#1A1D26' : '#FFFFFF'` gibi

---

## GENEL KURALLAR

1. **Phosphor Icons:** SADECE Thin ağırlık
2. **Emoji YASAK**
3. **S.* inline styles** (CSS variable'lar yerine inline conditional tercih et)
4. **Sidebar HER İKİ MODDA AYNI:** koyu charcoal kalır, değişmez
5. **SKILL.md karanlık mod kuralları:** gölge YOK, kart bg ana bg'den DAHA AÇIK, border kontrastı düşük
6. **DB migration SQL'ini ÇALIŞTIRMA** — dosyaya yaz
7. **Mevcut işlevselliği BOZMA** — sadece görsel güncelleme
8. **Build test:** `npm run build`

---

## SQL DOSYASI

`/opt/khp/tabbled/supabase-migration-admin-theme.sql` dosyasına yaz:

```sql
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS admin_theme TEXT DEFAULT 'light';
```

---

## TEST CHECKLIST

### Pembe Çerçeve
- [ ] Dashboard kartlarında pembe border YOK
- [ ] Analitik kartlarında pembe border YOK
- [ ] CRM kartlarında pembe border YOK
- [ ] Tüm kartlarda hafif gölge (light) veya renk farkı (dark)

### Light Mode
- [ ] Sayfa arka plan #F8F9FA
- [ ] Kartlar beyaz, hafif gölge, ince border
- [ ] Başlıklar gri uppercase
- [ ] Değerler koyu bold büyük
- [ ] Bar chart açık tonlarda
- [ ] Isı haritası beyaz→pembe

### Dark Mode
- [ ] Sayfa arka plan #0F1117
- [ ] Kartlar #1A1D26 (bg'den daha açık)
- [ ] Gölge YOK
- [ ] Değerler beyaz
- [ ] Bar chart canlı tonlarda
- [ ] Isı haritası koyu→pembe

### Tema Seçici
- [ ] Tema & Profil'de "Yönetim Paneli Teması" seçeneği var
- [ ] Light / Dark seçilebiliyor
- [ ] Seçim DB'ye kaydediliyor
- [ ] Sayfa anında güncelleniyor

### Tutarlılık
- [ ] Tüm paneller (Dashboard, Analitik, CRM, Çağrılar, Feedback, Beğeniler) aynı tema
- [ ] Sidebar her iki modda koyu kalıyor
- [ ] Plan banner tema uyumlu

### Regresyon
- [ ] Dashboard verileri doğru
- [ ] Analitik verileri doğru
- [ ] CRM çalışıyor
- [ ] Sidebar navigasyonu çalışıyor
- [ ] Mevcut özellikler bozulmadı

---

## ÖNCELİK SIRASI

1. **SQL dosyası oluştur** (admin_theme kolonu)
2. **Pembe çerçeveleri kaldır** (tüm paneller)
3. **Light mode tasarım** (Restaurant Soul stili)
4. **Dark mode tasarım** (SKILL.md kuralları)
5. **Tema seçici** (admin'de)
6. **Diğer panelleri uyumlu hale getir**
