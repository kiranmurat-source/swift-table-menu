# CLAUDE CODE PROMPT — Teknik Borç + Dashboard Tema Uyumu
## Roboto Fix, Splash Sosyal Medya, Feedback→CRM, Dashboard Tema

---

## PROJE BAĞLAMI

Tabbled (tabbled.com) bir QR dijital menü SaaS platformu. React + Vite + TypeScript + shadcn/ui. Supabase PostgreSQL backend. Vercel deploy.

- **Repo:** /opt/khp/tabbled/
- **Supabase:** qmnrawqvkwehufebbkxp.supabase.co
- **İkon:** Phosphor Icons (@phosphor-icons/react) — Thin weight only
- **Font:** Roboto (Bold/Medium/Regular/Light) — Thin (100) ve Black (900) KULLANILMAZ
- **Tema:** 2 tema (white + black) — public menü
- **Admin tema:** light + dark (adminTheme.ts palette sistemi mevcut)
- **Marka:** #FF4F7A (pembe), #1C1C1E (koyu), #F7F7F8 (açık)

---

## GÖREV 1: ROBOTO FONT DOĞRULAMA VE FİX

### Kontrol Et
1. `package.json`'da `@fontsource/roboto` var mı?
2. Eğer `@fontsource/playfair-display` ve/veya `@fontsource/inter` hâlâ varsa → kaldır (`npm uninstall`)
3. `src/main.tsx` veya `src/index.css`'de Roboto import'ları doğru mu?
4. CSS'de `font-family` tanımları Roboto'ya mı işaret ediyor?
5. Gereksiz font subset'leri var mı? (cyrillic, greek, math, symbols → kaldır, sadece latin + latin-ext gerekli)

### Düzelt
- Sadece şu ağırlıklar import edilmeli:
  ```
  @fontsource/roboto/300.css  (Light — sadece menü ürün açıklamaları)
  @fontsource/roboto/400.css  (Regular — body text)
  @fontsource/roboto/500.css  (Medium — butonlar, label'lar, subheading'ler)
  @fontsource/roboto/700.css  (Bold — başlıklar, fiyatlar)
  ```
- Global CSS'de:
  ```css
  body { font-family: 'Roboto', sans-serif; }
  ```
- Min body font: 16px
- Light (300) sadece menü ürün açıklamalarında, min 14px, line-height 1.6+

---

## GÖREV 2: SPLASH SOSYAL MEDYA İKONLARI

### Mevcut Durum
- Splash ekranında sosyal medya ikonları var ama düzeltilmesi gerekiyor
- Mevcut inline SVG ikonları → Phosphor Icons'a geçirilmeli

### Yapılacak
- Splash ekranındaki sosyal medya ikonlarını Phosphor Icons ile değiştir:
  - Instagram: `InstagramLogo` (Thin)
  - Facebook: `FacebookLogo` (Thin)
  - X/Twitter: `XLogo` (Thin)
  - TikTok: `TiktokLogo` (Thin)
  - Website: `Globe` (Thin)
  - YouTube: `YoutubeLogo` (Thin)
  - LinkedIn: `LinkedinLogo` (Thin)
- Boyut: 24px
- Renk: Tema uyumlu (white tema → koyu, black tema → beyaz)
- Sadece restoran profilde dolu olan platformlar gösterilecek
- Tıklayınca yeni sekmede açılsın (target="_blank" rel="noopener noreferrer")

---

## GÖREV 3: FEEDBACK → OTOMATİK MÜŞTERİ EKLEME

### Mantık
Feedback (geri bildirim) geldiğinde, müşteri bilgileri varsa otomatik `customers` tablosuna kayıt ekle.

### Mevcut Tablolar
- `feedback`: id, restaurant_id, customer_name, customer_email, customer_phone, rating, comment, created_at
- `customers`: id, restaurant_id, name, email, phone, tags, notes, visit_count, last_visit, created_at

### Implementasyon
- **Supabase Trigger** (tercih edilen) veya **Frontend hook** ile:
  - Feedback kaydedildiğinde:
    1. `customer_email` veya `customer_phone` ile `customers` tablosunda ara
    2. Eşleşme varsa: `visit_count += 1`, `last_visit = NOW()` güncelle
    3. Eşleşme yoksa: Yeni müşteri oluştur
       - `name = customer_name`
       - `email = customer_email`
       - `phone = customer_phone`
       - `tags = ['feedback']`
       - `visit_count = 1`
       - `last_visit = NOW()`
       - `notes = 'Geri bildirimden otomatik eklendi'`

### SQL Trigger (DB tarafı — daha güvenilir)
```sql
CREATE OR REPLACE FUNCTION handle_feedback_customer()
RETURNS TRIGGER AS $$
BEGIN
  -- Eğer müşteri bilgisi varsa
  IF NEW.customer_email IS NOT NULL OR NEW.customer_phone IS NOT NULL THEN
    -- Mevcut müşteriyi ara
    IF EXISTS (
      SELECT 1 FROM customers 
      WHERE restaurant_id = NEW.restaurant_id 
      AND (
        (NEW.customer_email IS NOT NULL AND email = NEW.customer_email)
        OR (NEW.customer_phone IS NOT NULL AND phone = NEW.customer_phone)
      )
    ) THEN
      -- Mevcut müşteriyi güncelle
      UPDATE customers 
      SET visit_count = visit_count + 1,
          last_visit = NOW(),
          updated_at = NOW()
      WHERE restaurant_id = NEW.restaurant_id 
      AND (
        (NEW.customer_email IS NOT NULL AND email = NEW.customer_email)
        OR (NEW.customer_phone IS NOT NULL AND phone = NEW.customer_phone)
      );
    ELSE
      -- Yeni müşteri oluştur
      INSERT INTO customers (restaurant_id, name, email, phone, tags, visit_count, last_visit, notes)
      VALUES (
        NEW.restaurant_id,
        COALESCE(NEW.customer_name, ''),
        NEW.customer_email,
        NEW.customer_phone,
        ARRAY['feedback'],
        1,
        NOW(),
        'Geri bildirimden otomatik eklendi'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_feedback_insert_customer
  AFTER INSERT ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION handle_feedback_customer();
```

Bu SQL'i ayrı migration dosyası olarak üret — Murat Supabase Dashboard'dan çalıştıracak.

---

## GÖREV 4: DASHBOARD TEMA UYUMU

### Mevcut Durum
- `adminTheme.ts` palette sistemi mevcut (light/dark renk tanımları)
- `AnalyticsPanel` + `CustomersPanel` zaten tema uyumlu
- Kalan paneller hâlâ sabit renklerle yazılmış

### Düzeltilecek Paneller

#### 4a. RestaurantAnalytics.tsx (Ana Dashboard Kartları)
- Özet kartlar (KPI kartları): bg, text, border renklerini `adminTheme` palette'den al
- Trend okları: yeşil/kırmızı kalabilir (anlamsal renk)

#### 4b. WaiterCallsPanel
- Tablo satırları: `palette.cardBg`, `palette.text`, `palette.border`
- Status badge'leri: anlamsal renkler korunur (pending=amber, completed=green)
- Butonlar: `palette.primary` veya marka rengi

#### 4c. FeedbackPanel
- Yıldız gösterimi: sarı/amber kalabilir
- Kart arka planları: `palette.cardBg`
- Metin renkleri: `palette.text`, `palette.textMuted`
- İstatistik kartları: `palette.cardBg` + `palette.border`

#### 4d. LikesPanel
- İstatistik kartları: `palette.cardBg`
- Ürün listesi satırları: `palette.cardBg` + `palette.border`
- Kalp ikonu: pembe (#FF4F7A) kalabilir (marka rengi)

#### 4e. DiscountCodesPanel
- Tablo: `palette.cardBg`, `palette.text`, `palette.border`
- Aktif/pasif badge'leri: anlamsal renkler (yeşil/gri)
- Butonlar: `palette.primary`

### Tema Kuralları (SKILL.md'den)
- **Light mode:** Kartları gölge ile ayır, belirgin kenarlık
- **Dark mode:** Gölge YOK, kart bg ana bg'den DAHA AÇIK ton, border kontrastı düşük
- Chart bar renkleri: light → #FF4F7A (pembe), dark → #FF6B8A (biraz daha açık pembe)
- Isı haritası: light → yeşil-sarı-kırmızı, dark → aynı ama satürasyon biraz düşük

---

## GENEL KURALLAR

1. **DB migration → SQL dosyası olarak üret** (feedback trigger)
2. **Phosphor Icons Thin weight** sadece
3. **Emoji ikon YASAK**
4. **4-nokta spacing sistemi**
5. **TypeScript strict** — any kullanma
6. **console.log temizle**
7. **adminTheme.ts palette'i import et** — hardcoded renk kullanma (dashboard panellerinde)
8. **Mevcut pattern'leri takip et** — AnalyticsPanel'in tema uyumu nasıl yapıldıysa aynısı

---

## TEST CHECKLIST

### Font
- [ ] @fontsource/roboto kurulu
- [ ] @fontsource/playfair-display kaldırıldı
- [ ] @fontsource/inter kaldırıldı
- [ ] Sadece 300/400/500/700 ağırlıkları import ediliyor
- [ ] CSS'de font-family: 'Roboto'
- [ ] Gereksiz subset'ler kaldırılmış

### Splash Sosyal Medya
- [ ] Phosphor Icons kullanılıyor (inline SVG değil)
- [ ] Thin weight
- [ ] Sadece dolu platformlar gösteriliyor
- [ ] Yeni sekmede açılıyor
- [ ] White ve black temada doğru renk

### Feedback → CRM
- [ ] SQL trigger dosyası üretildi
- [ ] Yeni feedback geldiğinde customers'a kayıt ekleniyor
- [ ] Mevcut müşteri varsa visit_count artıyor
- [ ] Email veya phone ile eşleşme çalışıyor
- [ ] Müşteri bilgisi yoksa (anonim feedback) trigger hata vermiyor

### Dashboard Tema
- [ ] WaiterCallsPanel: light/dark doğru
- [ ] FeedbackPanel: light/dark doğru
- [ ] LikesPanel: light/dark doğru
- [ ] DiscountCodesPanel: light/dark doğru
- [ ] RestaurantAnalytics kartları: light/dark doğru
- [ ] Chart renkleri light/dark varyantlar
- [ ] Hardcoded renk kalmamış (palette'den alınıyor)

### Genel
- [ ] npm run build hatasız
- [ ] Tüm tema geçişleri çalışıyor

---

## ÖNCELİK SIRASI

1. Roboto font doğrulama + fix + eski fontları kaldır
2. Splash sosyal medya ikonları (Phosphor)
3. Feedback → CRM SQL trigger dosyası
4. Dashboard tema: RestaurantAnalytics.tsx
5. Dashboard tema: WaiterCallsPanel
6. Dashboard tema: FeedbackPanel
7. Dashboard tema: LikesPanel
8. Dashboard tema: DiscountCodesPanel
9. Chart renkleri light/dark
10. Build test
