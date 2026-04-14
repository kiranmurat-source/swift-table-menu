# ADMIN PLAN BANNER + SPLASH SOSYAL MEDYA + MÜŞTERİ LİSTESİ (CRM)
## Claude Code Prompt — 14 Nisan 2026 (v4)

---

## PROJE BAĞLAMI

- **Proje dizini:** /opt/khp/tabbled/
- **Stack:** React + Vite + TypeScript + S.* inline styles
- **Supabase project-ref:** qmnrawqvkwehufebbkxp
- **İkonlar:** Phosphor Icons (@phosphor-icons/react) — SADECE "Thin" ağırlık. Emoji YASAK.
- **Marka renkleri:** #FF4F7A / #1C1C1E / #F7F7F8
- **Admin paneli:** src/pages/RestaurantDashboard.tsx
- **Public menü:** src/pages/PublicMenu.tsx

---

## GÖREV 1: ADMIN PLAN BİLGİ BANNER'I

### Konsept
Ürün düzenleme formunun üstünde (şu an "EN, ES" + "AI Açıklama" badge'leri olan yer) mevcut plan bilgisi gösterilecek.

### Değişiklikler

1. **"EN, ES" dil badge'lerini ve "AI Açıklama" badge'ini KALDIR**
2. Yerine **plan bilgi banner** ekle:
   - Pembe arka plan (#FF4F7A, opacity 0.1 veya hafif gradient) + pembe sol border (3px solid #FF4F7A)
   - İçerik (tek satır, flex row, space-between):
     - Sol: Plan adı pill badge — "Basic Plan" / "Premium Plan" / "Enterprise Plan"
       - Badge renk: pembe arka plan (#FF4F7A), beyaz yazı, border-radius: 12px, padding: 4px 12px
       - Plan adı `subscriptions` tablosundan veya `restaurants.current_plan`'dan al
     - Orta: AI Kredisi gösterimi — "AI Kredisi: 45/150" (sadece AI özelliği olan planlarda)
       - Küçük progress bar (pembe) veya sadece metin
       - Basic'te AI yoksa bu kısım GÖRÜNMESİN
     - Sağ: **"Yükselt"** butonu (sadece Basic ve Premium'da, Enterprise'da gösterilmez)
       - Küçük outline buton, pembe border, pembe yazı
       - Tıklayınca → WhatsApp (wa.me/905325119484?text=Planımı%20yükseltmek%20istiyorum)
3. Plan bilgisi yoksa (üyelik atanmamış): "Henüz plan atanmadı" mesajı, gri arka plan

### Plan belirleme
- `subscriptions` tablosundan `restaurant_id` ile aktif üyeliği bul
- Üyelik yoksa veya expired ise: "Plan Yok" göster + "İletişime Geç" butonu
- AI kredisi şimdilik statik gösterim (ileride dinamik yapılacak):
  - Basic: AI yok
  - Premium: "AI Kredisi: —/150"
  - Enterprise: "AI Kredisi: —/∞"

---

## GÖREV 2: SPLASH EKRANINA SOSYAL MEDYA BAĞLANTILARI

### Konsept
Restoranın sosyal medya ikonları splash ekranda, dil seçeneklerinin ÜSTÜNDE gösterilecek.

### Mevcut durum
Splash ekranda: Logo → Restoran adı → Tagline → "Menüyü Görüntüle" butonu → Dil seçenekleri → "Powered by Tabbled" → Değerlendir pill

### Yeni sıralama
Logo → Restoran adı → Tagline → **Sosyal medya ikonları** → "Menüyü Görüntüle" butonu → Dil seçenekleri → "Powered by Tabbled" → Değerlendir pill

### Sosyal medya ikonları
- Mevcut `restaurant` verisinden: `social_instagram`, `social_facebook`, `social_x`, `social_tiktok`, `social_website`, `social_whatsapp`, `social_google_maps`
- Sadece dolu olanlar gösterilecek (boş/null olanlar gizli)
- İkon stili: dairesel arka plan (yarı saydam beyaz veya koyu tema uyumlu), ikon içinde
- İkon boyutu: 36px daire, ikon 18px
- Yatay hizalı, gap: 12px, center
- İkonlar: mevcut inline SVG'leri kullan (7 platform zaten var)
- Tıklayınca yeni sekmede açılır (target="_blank", rel="noopener")

### Eğer hiç sosyal medya yoksa
- Bölüm tamamen GİZLENSİN (boş satır gösterme)

---

## GÖREV 3: MÜŞTERİ LİSTESİ (BASİT CRM)

### Konsept
P2'nin son item'ı. Geri bildirim gönderen, beğeni yapan veya sipariş veren müşterilerin basit listesi. Admin panelinde "Müşteri İlişkileri" grubunda yeni bir tab.

### DB Değişikliği (AYRI SQL — Supabase Dashboard'dan çalıştırılacak)

```sql
-- Müşteri tablosu
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT,
  source TEXT DEFAULT 'manual',
  -- source: 'manual', 'feedback', 'order', 'reservation'
  first_visit TIMESTAMPTZ DEFAULT NOW(),
  last_visit TIMESTAMPTZ DEFAULT NOW(),
  visit_count INTEGER DEFAULT 1,
  total_spent DECIMAL(10,2) DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  -- tags: VIP, regular, new, complaint, etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_customers_restaurant ON customers(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_source ON customers(restaurant_id, source);

-- RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Restoran sahibi kendi müşterilerini yönetir
CREATE POLICY "Owner can manage own customers"
  ON customers FOR ALL
  TO authenticated
  USING (
    restaurant_id IN (SELECT restaurant_id FROM profiles WHERE id = auth.uid())
    OR is_super_admin()
  )
  WITH CHECK (
    restaurant_id IN (SELECT restaurant_id FROM profiles WHERE id = auth.uid())
    OR is_super_admin()
  );

-- Updated_at trigger
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### Admin Paneli — Müşteriler Tab'ı

**Sidebar:** "Müşteri İlişkileri" grubuna **"Müşteriler"** item'ı ekle (Phosphor: Users, Thin)

**Sayfa yapısı:**

1. **Özet kartları** (üst kısım, 4 kart):
   - Toplam Müşteri
   - Bu Ay Yeni
   - VIP Müşteri (tags'te 'vip' olanlar)
   - Aktif Müşteri (is_active=true)

2. **Müşteri ekleme butonu:**
   - Sağ üst: "Müşteri Ekle" pembe buton
   - Tıklayınca inline form açılır:
     - İsim (zorunlu)
     - Email (opsiyonel)
     - Telefon (opsiyonel)
     - Notlar (opsiyonel)
     - Etiketler: çoklu seçim pill'ler — VIP, Düzenli, Yeni, Şikayet, Özel (veya serbest metin)
   - Kaydet / İptal butonları

3. **Müşteri listesi** (tablo):
   - Sütunlar: İsim, Email, Telefon, Kaynak, Etiketler, İlk Ziyaret, Son Ziyaret, Ziyaret Sayısı
   - Sıralama: son ziyaret tarihi (en yeni üstte)
   - Arama: isim, email, telefon üzerinden filtre
   - Etiket filtresi: pill butonlarla filtrele (Tümü, VIP, Düzenli, Yeni, Şikayet)

4. **Müşteri düzenleme:**
   - Satıra tıklayınca inline düzenleme (mevcut ürün/kategori pattern'i gibi)
   - Düzenlenebilir alanlar: isim, email, telefon, notlar, etiketler, aktif/pasif
   - Silme: kırmızı X butonu + onay

5. **Kaynak (source) gösterimi:**
   - Manual: el ile eklendi (ikon: PencilSimple)
   - Feedback: geri bildirimden geldi (ikon: ChatCircle)
   - Order: siparişten geldi (ikon: ShoppingCart)
   - Reservation: rezervasyondan geldi (ikon: CalendarBlank)

### Otomatik müşteri ekleme (opsiyonel — sadece feedback'ten)
- Feedback gönderilirken "Adınız" alanı doluysa:
  - customers tablosuna otomatik kayıt (source: 'feedback')
  - Aynı isim + restaurant_id ile müşteri varsa: last_visit güncelle, visit_count artır
  - Yoksa yeni müşteri oluştur
- Bu logic PublicMenu.tsx'teki feedback submit handler'ına eklenecek

---

## GENEL KURALLAR

1. **Phosphor Icons:** SADECE Thin ağırlık
2. **Emoji YASAK**
3. **S.* inline styles**
4. **DB migration SQL'ini ÇALIŞTIRMA** — dosyaya yaz
5. **Mevcut özellikleri BOZMA**
6. **Build test:** `npm run build`

---

## SQL DOSYASI

`/opt/khp/tabbled/supabase-migration-customers.sql` dosyasına yaz:
- customers tablosu + index'ler + RLS + trigger

---

## TEST CHECKLIST

### Plan Banner
- [ ] Ürün düzenleme üstündeki "EN, ES" + "AI Açıklama" badge'leri kaldırıldı
- [ ] Pembe plan banner görünüyor (plan adı + AI kredisi + yükselt)
- [ ] Basic plan: AI kredisi gösterilmiyor, "Yükselt" butonu var
- [ ] Premium plan: AI kredisi gösteriliyor, "Yükselt" butonu var
- [ ] Enterprise: "Yükselt" butonu yok
- [ ] Plan atanmamışsa: "Plan Yok" mesajı
- [ ] "Yükselt" → WhatsApp açılıyor

### Splash Sosyal Medya
- [ ] Sosyal medya ikonları splash'ta, dil seçeneklerinin üstünde
- [ ] Sadece dolu alanlar gösteriliyor
- [ ] Tıklayınca yeni sekmede açılıyor
- [ ] Hiç sosyal yoksa bölüm gizli
- [ ] White + Black tema uyumlu

### CRM
- [ ] Sidebar'da "Müşteriler" item'ı var (Users ikonu)
- [ ] Özet kartları görünüyor (4 kart)
- [ ] "Müşteri Ekle" butonu çalışıyor
- [ ] Inline form: isim, email, telefon, notlar, etiketler
- [ ] Müşteri listesi tablosu görünüyor
- [ ] Arama çalışıyor (isim/email/telefon)
- [ ] Etiket filtresi çalışıyor
- [ ] Inline düzenleme çalışıyor
- [ ] Silme çalışıyor (onay ile)
- [ ] Feedback'ten otomatik müşteri ekleme çalışıyor

### Regresyon
- [ ] Splash: Değerlendir pill butonu hâlâ çalışıyor
- [ ] Menü: kategori grid / list / grid modları çalışıyor
- [ ] Öneri sistemi çalışıyor
- [ ] Video player çalışıyor
- [ ] Sepet, WhatsApp, garson, beğeni, indirim çalışıyor

---

## ÖNCELİK SIRASI

1. **SQL dosyası oluştur** (customers tablosu)
2. **Plan banner** (admin ürün düzenleme üstü)
3. **Splash sosyal medya** (ikonları taşı)
4. **CRM** — müşteriler tab'ı (admin panel)
5. **Feedback → otomatik müşteri** ekleme
