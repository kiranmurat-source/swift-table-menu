# PUBLIC MENÜ REDESİGN + ÖNERİ SİSTEMİ + VİDEO MENÜ
## Claude Code Prompt — 14 Nisan 2026

---

## PROJE BAĞLAMI

- **Proje dizini:** /opt/khp/tabbled/
- **Stack:** React + Vite + TypeScript + shadcn/ui (S.* inline styles)
- **Supabase project-ref:** qmnrawqvkwehufebbkxp
- **Public menü:** src/pages/PublicMenu.tsx
- **İkonlar:** Phosphor Icons (@phosphor-icons/react) — SADECE "Thin" ağırlık. Emoji ikon YASAK.
- **Temalar:** white / black (2 tema — kırmızı tema KALDIRILACAK)
- **Font:** Şimdilik Playfair Display + Inter (Roboto migration ayrı yapılacak)
- **Marka renkleri:** Strawberry Pink #FF4F7A / Deep Charcoal #1C1C1E / Off-White #F7F7F8
- **Image Transforms:** getOptimizedImageUrl() — src/lib/imageUtils.ts (thumbnail 80px, card 200px, detail 480px, cover 800px)
- **SKILL.md:** /opt/khp/tabbled/SKILL.md (UI/UX kuralları — OKU ve UYGULA)

---

## MEVCUT DURUM

Public menüde şu an 2 görünüm modu var:
- **List:** Yatay kart (fotoğraf sol, bilgiler sağ) — varsayılan
- **Grid:** 2 sütunlu (fotoğraf üst, isim+fiyat alt)

Toggle: tab bar sağında Grid/List ikon butonları.

Mevcut akış: QR tara → splash → tüm kategoriler + ürünler tek sayfada (tab bar ile navigasyon veya scroll).

---

## GÖREV 1: KATEGORİ GRİD VIEW (3. Layout Modu)

### Konsept
Splash sonrası ilk açılış ekranı artık **kategori grid** olacak. Büyük fotoğraflı kategori kartları. Kullanıcı kategoriye tıklayınca o kategorinin ürünlerine gider.

### Gereksinimler

1. **Yeni varsayılan açılış:** Splash → Kategori Grid (tüm ürünler değil)
2. **Kategori kartları:**
   - 2 sütun grid (mobil)
   - Kategori fotoğrafı büyük (kare veya 4:3, Image Transforms card preset 200px)
   - Kategori adı overlay (alt kısımda, linear-gradient ile okunabilirlik)
   - Ürün sayısı küçük badge
   - Fotoğrafı olmayan kategoriler: arka plan rengi + büyük kategori adı
3. **Kategoriye tıklama:**
   - O kategorinin ürünleri açılır (list modunda)
   - Üstte geri butonu "← Kategoriler" (kategori grid'e dönüş)
   - Veya tab bar'a kategori adı yazılır
4. **Toggle sistemi güncelleme:**
   - 3 mod: Kategoriler (grid ikon) / Grid (kare grid ikon) / List (list ikon)
   - Phosphor Icons Thin: SquaresFour (kategoriler), GridFour (grid), List (list)
   - Varsayılan: Kategoriler modu
   - "Tümü" seçeneği: tüm kategorileri + ürünleri tek sayfada gösterir (mevcut davranış — Grid veya List modunda)

### Tema uyumu
- White tema: beyaz arka plan, kartlarda gölge
- Black tema: koyu arka plan (#1C1C1E), kartlarda gölge YOK, border düşük kontrast

---

## GÖREV 2: KART TASARIMI POLİSH

### List Modu İyileştirmeleri
- Fotoğraf: 88×88px → 96×96px, border-radius: 12px
- Ürün adı: font-weight 600, font-size 16px
- Fiyat: font-weight 700, font-size 16px, sağ hizalı, marka rengi (#FF4F7A) veya tema uyumlu
- Açıklama: max 2 satır, text-overflow ellipsis, font-weight 300 (Light), font-size 14px, renk muted
- Badge'ler (Popüler, Yeni, Tükendi): kart içinde, ürün adının yanında veya altında, küçük pill
- Allerjen ikonları: küçük (16px), fotoğrafın altında veya açıklama satırında
- Beğeni kalp: sağ alt köşe, sayı yanında
- Kart arası boşluk: 8px (SKILL.md 4-nokta sistemi)
- Kart iç padding: 12px

### Grid Modu İyileştirmeleri
- Fotoğraf: tam genişlik, aspect-ratio 1:1 veya 4:3, border-radius: 12px üst
- Ürün adı: altında, font-weight 600, 14px, max 2 satır
- Fiyat: adın altında, font-weight 700, 14px
- Açıklama: grid modda GÖSTERİLMESİN (alan dar)
- Featured ürünler: her iki modda 2x genişlik (full width kart)

### Genel
- Tüm kartlara tıklayınca ürün detay modalı açılır (mevcut davranış korunacak)
- Hover: hafif scale(1.01) + shadow artışı (white tema) veya border highlight (black tema)
- Tükendi ürünler: opacity 0.5 + üzeri çapraz çizgi veya "Tükendi" badge

---

## GÖREV 3: ÖNERİ SİSTEMİ (Admin + Public)

### Konsept
Foost/Cool Chicken'dan ilham: ürün detayında "Öneriler" bölümü. Admin panelinde restoran sahibi hangi ürünlerin birbirine uyduğunu belirler. AI değil, tamamen manuel eşleştirme.

### DB Değişikliği (AYRI SQL — Supabase Dashboard'dan çalıştırılacak)

```sql
-- Ürün önerileri tablosu
CREATE TABLE IF NOT EXISTS item_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  recommended_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  reason_tr TEXT,
  reason_en TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(menu_item_id, recommended_item_id)
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_recommendations_item ON item_recommendations(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_recommended ON item_recommendations(recommended_item_id);

-- RLS
ALTER TABLE item_recommendations ENABLE ROW LEVEL SECURITY;

-- Public okuma (menü görüntüleme için)
CREATE POLICY "Anyone can read recommendations"
  ON item_recommendations FOR SELECT
  TO anon, authenticated
  USING (true);

-- Restoran sahibi kendi ürünlerinin önerilerini yönetir
CREATE POLICY "Owner can manage own recommendations"
  ON item_recommendations FOR ALL
  TO authenticated
  USING (
    menu_item_id IN (
      SELECT mi.id FROM menu_items mi
      JOIN profiles p ON p.restaurant_id = mi.restaurant_id
      WHERE p.id = auth.uid()
    )
    OR is_super_admin()
  )
  WITH CHECK (
    menu_item_id IN (
      SELECT mi.id FROM menu_items mi
      JOIN profiles p ON p.restaurant_id = mi.restaurant_id
      WHERE p.id = auth.uid()
    )
    OR is_super_admin()
  );
```

### Admin Paneli — Ürün Düzenleme Formu
- Mevcut ürün düzenleme formuna yeni bölüm: **"Önerilen Ürünler"**
- Aynı restoranın diğer ürünlerinden seçim (multi-select dropdown veya arama)
- Her öneri için isteğe bağlı "Neden?" metni (TR + EN):
  - Placeholder: "Neden bu ürünü öneriyorsunuz? (ör: Acılı nachos'u serinleten bir eşlik)"
- Max 5 öneri per ürün
- Sıralama: drag & drop veya numara
- Önerileri kaldırma: X butonu

### Public Menü — Ürün Detay Modalı
- Mevcut detay modalının altına **"Öneriler"** bölümü ekle
- Öneri yoksa bölüm GÖRÜNMESİN
- Her öneri kartı:
  - Ürün adı (bold)
  - "Neden?" metni (italic, muted renk) — varsa
  - Fiyat (sağda)
  - Küçük fotoğraf (thumbnail 80px, varsa)
- Öneri kartına tıklayınca o ürünün detay modalı açılır (modal içinde modal veya modal değişir)
- Başlık: "Yanında İyi Gider" veya "Öneriler" (çok dil desteği düşünülerek)
- 3 tema uyumlu

---

## GÖREV 4: VİDEO MENÜ DESTEĞI

### Konsept
Ürün detayında kısa video gösterimi. Hazırlama süreci veya sunum videosu.

### DB Değişikliği (AYRI SQL)

```sql
-- menu_items'a video_url kolonu ekle
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS video_url TEXT;
```

### Admin Paneli — Ürün Düzenleme Formu
- Mevcut fotoğraf upload alanının altına **"Video"** bölümü ekle
- Video URL input (text field):
  - Placeholder: "Video URL (ör: https://...mp4 veya YouTube/Vimeo linki)"
  - Desteklenen formatlar: .mp4, .webm (direkt URL) veya YouTube/Vimeo embed
- Video önizleme: URL girilince küçük player göster
- Silme: X butonu ile URL temizle
- **NOT:** Video upload Supabase Storage'a YAPILMAYACAK (bant genişliği). Sadece harici URL kabul edilecek.

### Public Menü — Ürün Detay Modalı
- video_url varsa, fotoğrafın üstünde veya altında video player göster
- Otomatik oynatma YOK (muted autoplay bile yapma — mobil data tüketimi)
- Play butonu overlay (fotoğraf üzerinde play ikonu, tıklayınca video oynar)
- Video yoksa mevcut davranış (sadece fotoğraf)
- Küçük video player: max yükseklik 240px, border-radius: 12px
- 3 tema uyumlu

### Desteklenen video kaynakları
1. **Direkt URL** (.mp4, .webm): HTML5 `<video>` tag
2. **YouTube**: URL'den video ID çıkar → iframe embed
3. **Vimeo**: URL'den video ID çıkar → iframe embed

---

## GÖREV 5: KIRMIZI TEMA KALDIRMA

- `restaurants.theme_color` değeri "red" olan kayıtları "white" olarak güncelle (SQL)
- Public menüde red tema CSS/logic'ini kaldır
- Admin tema seçiciden "red" seçeneğini kaldır (sadece white + black)
- Temizlik: red tema ile ilgili tüm conditional CSS'leri sil

### SQL (AYRI ÇALIŞTIR)
```sql
UPDATE restaurants SET theme_color = 'white' WHERE theme_color = 'red';
```

---

## GENEL KURALLAR

1. **Phosphor Icons:** SADECE Thin ağırlık. İthalat: `import { IconName } from "@phosphor-icons/react"`
2. **Emoji ikon YASAK** — hiçbir yerde emoji kullanma
3. **shadcn/ui iç Lucide'a DOKUNMA**
4. **S.* inline styles** kullan (shadcn bileşenlerini doğrudan kullanma)
5. **SKILL.md kuralları:** 4-nokta boşluk, görsel hiyerarşi, tema uyumu, gölge kuralları
6. **Image Transforms:** Tüm img src'leri `getOptimizedImageUrl()` ile optimize et
7. **3→2 tema:** Artık sadece white ve black. Red referanslarını temizle.
8. **Türkçe karakter:** bash heredoc kullanma, python3 -c ile yaz
9. **DB migration:** SQL dosyalarını oluştur ama ÇALIŞTIRMA — Murat Supabase Dashboard'dan çalıştıracak
10. **Mevcut davranışları BOZMA:** Sepet, WhatsApp sipariş, garson çağırma, beğeni, feedback, indirim kodu, happy hour, çok dil — hepsi çalışmaya devam etmeli
11. **Public menü performans:** lazy loading korunacak, gereksiz re-render önlenecek
12. **Çok dil:** Yeni metinler (ör: "Öneriler", "Yanında İyi Gider", "Kategoriler") için mevcut çeviri sistemini kullan (toUiLang veya translations)

---

## SQL DOSYALARI (AYRI OLUŞTUR)

Aşağıdaki SQL'leri `/opt/khp/tabbled/supabase-migration-recommendations-video.sql` dosyasına yaz. Murat bunu Supabase Dashboard SQL Editor'de çalıştıracak:

1. `item_recommendations` tablosu + index'ler + RLS
2. `menu_items.video_url` kolon ekleme
3. `restaurants.theme_color` red → white güncelleme

---

## TEST CHECKLIST

### Kategori Grid
- [ ] Splash sonrası kategori grid açılıyor (varsayılan)
- [ ] Kategori kartları 2 sütun, fotoğraflı
- [ ] Kategoriye tıklayınca o kategorinin ürünleri list modunda açılıyor
- [ ] "← Kategoriler" geri butonu çalışıyor
- [ ] 3 mod toggle çalışıyor (Kategoriler / Grid / List)
- [ ] Fotoğrafsız kategoriler düzgün görünüyor

### Kart Polish
- [ ] List modda kart tasarımı güncel (96px foto, fiyat sağda, açıklama 2 satır)
- [ ] Grid modda kart tasarımı güncel (tam genişlik foto, ad+fiyat alt)
- [ ] Featured ürünler büyük kart
- [ ] Tükendi gösterimi çalışıyor
- [ ] Hover efektleri çalışıyor
- [ ] White + Black tema uyumlu

### Öneri Sistemi
- [ ] Admin: ürün düzenleme formunda "Önerilen Ürünler" bölümü var
- [ ] Admin: aynı restoranın diğer ürünlerinden seçim yapılabiliyor
- [ ] Admin: "Neden?" metni girilebiliyor (TR + EN)
- [ ] Admin: max 5 öneri, kaldırma çalışıyor
- [ ] Public: detay modalda "Öneriler" bölümü görünüyor (öneri varsa)
- [ ] Public: öneri kartına tıklayınca o ürünün detayı açılıyor
- [ ] Public: öneri yoksa bölüm gizli

### Video
- [ ] Admin: ürün formunda video URL input'u var
- [ ] Admin: URL girilince önizleme gösteriyor
- [ ] Public: video_url varsa detay modalda play butonu görünüyor
- [ ] Public: tıklayınca video oynatılıyor
- [ ] Public: video yoksa sadece fotoğraf (mevcut)
- [ ] YouTube ve Vimeo linkleri çalışıyor
- [ ] Direkt .mp4 linkleri çalışıyor

### Tema
- [ ] Kırmızı tema kaldırıldı
- [ ] Mevcut red temadaki restoranlar white'a geçti
- [ ] Admin tema seçicide sadece white + black var
- [ ] Tüm red CSS referansları temizlendi

### Mevcut Özellikler (REGRESYON)
- [ ] Sepet çalışıyor
- [ ] WhatsApp sipariş çalışıyor
- [ ] Garson çağırma çalışıyor
- [ ] Beğeni sistemi çalışıyor
- [ ] Feedback sistemi çalışıyor
- [ ] İndirim kodları çalışıyor
- [ ] Happy hour çalışıyor
- [ ] Çok dil çalışıyor
- [ ] Scroll-aware tab bar çalışıyor

---

## ÖNCELİK SIRASI

1. **SQL dosyası oluştur** (recommendations + video_url + red→white)
2. **Kırmızı tema kaldır** (en az risk, temizlik)
3. **Kategori Grid View** (yeni varsayılan açılış + 3 mod toggle)
4. **Kart Tasarımı Polish** (list + grid iyileştirmeleri)
5. **Video Desteği** (admin + public — basit, az risk)
6. **Öneri Sistemi** (admin + public — en karmaşık, sona bırak)

---

## NOT

- Bu prompt'taki SQL'leri ÇALIŞTIRMA. Sadece dosyaya yaz.
- `npm run build` ile test et, hata yoksa devam et.
- Her görev tamamlandığında kısa rapor ver.
