# TABBLED — Claude Code Prompt
# 7 Nisan 2026 — Promo Banner Popup + Kategori Fotoğrafı

---

## PROJE BAĞLAMI

- **Dizin:** /opt/khp/tabbled
- **Stack:** React + Vite + TypeScript + shadcn/ui
- **DB:** Supabase (qmnrawqvkwehufebbkxp.supabase.co)
- **Ana dosyalar:**
  - src/pages/PublicMenu.tsx (public menü — popup burada gösterilecek)
  - src/pages/RestaurantDashboard.tsx (admin panel — promo yönetimi + kategori fotoğrafı)
  - src/lib/themes.ts (tema sistemi — getTheme, MenuTheme)
  - src/lib/supabase.ts (Supabase client)
- **İkon kuralı:** shadcn/ui internal Lucide ikonlarına DOKUNMA. Kendi kodlarımızda Circum Icons (react-icons/ci) kullan.
- **Font:** Playfair Display (başlıklar), Inter (body)
- **Storage:** Supabase Storage — menu-images bucket (public read, authenticated write)

---

## 2 GÖREV VAR

### GÖREV 1: Promo Banner Popup Sistemi
### GÖREV 2: Kategori Fotoğrafı

---

## GÖREV 1: PROMO BANNER POPUP SİSTEMİ

### Konsept
Restoran sahibi admin panelden promo/kampanya banner'ı oluşturur. Müşteri public menüyü açtığında (splash sonrası) popup olarak görür. Happy hour, günün menüsü, özel kampanya gibi içerikler için.

### DB: Yeni Tablo — restaurant_promos

Supabase SQL Editor'da çalıştırılacak SQL:

```sql
CREATE TABLE restaurant_promos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  title_tr TEXT NOT NULL DEFAULT '',
  title_en TEXT DEFAULT '',
  description_tr TEXT DEFAULT '',
  description_en TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  cta_text_tr TEXT DEFAULT 'Detaylar',
  cta_text_en TEXT DEFAULT 'Details',
  cta_url TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  schedule_enabled BOOLEAN DEFAULT false,
  schedule_start_time TIME DEFAULT '00:00',
  schedule_end_time TIME DEFAULT '23:59',
  schedule_days INTEGER[] DEFAULT '{0,1,2,3,4,5,6}',
  show_once_per_session BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE restaurant_promos ENABLE ROW LEVEL SECURITY;

-- Super admin full access
CREATE POLICY "Super admin full access on restaurant_promos"
  ON restaurant_promos FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Restaurant user can manage own promos
CREATE POLICY "Restaurant users manage own promos"
  ON restaurant_promos FOR ALL
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Public can read active promos
CREATE POLICY "Public can read active promos"
  ON restaurant_promos FOR SELECT
  USING (is_active = true);

-- Updated at trigger
CREATE TRIGGER update_restaurant_promos_updated_at
  BEFORE UPDATE ON restaurant_promos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### Alan Açıklamaları:
- title_tr/en: Promo başlığı (örn: "Happy Hour!")
- description_tr/en: Promo açıklaması (örn: "Tüm içeceklerde %30 indirim")
- image_url: Banner görseli (Supabase Storage'a yüklenir)
- cta_text_tr/en: CTA buton metni (örn: "Sipariş Ver", "Menüyü Gör")
- cta_url: CTA butonu tıklanınca nereye gitsin (boşsa popup kapanır)
- is_active: Promo aktif mi
- schedule_enabled: Saat planlaması aktif mi
- schedule_start_time / schedule_end_time: Gösterilecek saat aralığı (TIME formatı, örn: 15:00 - 18:00)
- schedule_days: Gösterilecek günler (0=Pazar, 1=Pazartesi ... 6=Cumartesi)
- show_once_per_session: Session başına bir kez mi gösterilsin

### Admin Panel — Promo Yönetimi

RestaurantDashboard.tsx'e yeni bir tab ekle: "Promosyonlar" (veya mevcut tab yapısına göre uygun yere)

#### Promo Listesi
- Mevcut promoların listesi (kart veya tablo)
- Her promoda: küçük önizleme, başlık, durum (aktif/pasif), saat bilgisi
- Aktif/pasif toggle
- Düzenle / Sil butonları
- "Yeni Promo Ekle" butonu

#### Promo Oluşturma/Düzenleme Formu
```
┌─────────────────────────────────────┐
│ Promo Görseli                       │
│ [Görsel Yükle]  (drag & drop veya   │
│                  tıkla)             │
│                                     │
│ Başlık (TR): [___________________]  │
│ Başlık (EN): [___________________]  │
│                                     │
│ Açıklama (TR): [________________]   │
│ Açıklama (EN): [________________]   │
│                                     │
│ CTA Buton Metni (TR): [Detaylar__]  │
│ CTA Buton Metni (EN): [Details___]  │
│ CTA Link: [https://...___________]  │
│                                     │
│ ☑ Saat Planlaması                   │
│   Başlangıç: [15:00]               │
│   Bitiş:     [18:00]               │
│   Günler: ☑Pzt ☑Sal ☑Çar ☑Per      │
│           ☑Cum ☐Cmt ☐Paz           │
│                                     │
│ ☑ Session başına bir kez göster     │
│                                     │
│ [Kaydet]  [İptal]                   │
└─────────────────────────────────────┘
```

Görsel yükleme: Mevcut ürün görsel yükleme mantığını kullan (Supabase Storage, menu-images bucket). Dosya yolu: `{restaurant_id}/promos/{uuid}.{ext}`

### Public Menü — Popup Gösterimi

PublicMenu.tsx'te splash ekranı kapandıktan sonra promo popup'ı göster.

#### Popup Mantığı:
1. Restaurant verisini çekerken promoları da çek
2. Aktif promoları filtrele:
   - is_active === true
   - schedule_enabled ise: şu anki saat schedule_start_time ile schedule_end_time arasında mı? Şu anki gün schedule_days içinde mi?
   - show_once_per_session ise: sessionStorage'da bu promo gösterilmiş mi kontrol et
3. Gösterilecek promo varsa splash kapandıktan 500ms sonra popup aç
4. Birden fazla promo varsa sadece ilkini göster (sort_order'a göre)

#### Saat Kontrolü:
```typescript
function isPromoVisible(promo: Promo): boolean {
  if (!promo.is_active) return false;
  
  if (promo.schedule_enabled) {
    const now = new Date();
    const currentDay = now.getDay(); // 0=Sunday
    if (!promo.schedule_days.includes(currentDay)) return false;
    
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = promo.schedule_start_time.split(':').map(Number);
    const [endH, endM] = promo.schedule_end_time.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    
    if (currentTime < startMinutes || currentTime > endMinutes) return false;
  }
  
  if (promo.show_once_per_session) {
    const shown = sessionStorage.getItem(`promo_shown_${promo.id}`);
    if (shown) return false;
  }
  
  return true;
}
```

#### Popup UI Tasarımı:
```
┌──────────────────────────────────┐
│                              [X] │
│  ┌────────────────────────────┐  │
│  │                            │  │
│  │    BANNER GÖRSELİ          │  │
│  │    (tam genişlik, maks     │  │
│  │     200px yükseklik,       │  │
│  │     rounded top corners)   │  │
│  │                            │  │
│  └────────────────────────────┘  │
│                                  │
│  Happy Hour!                     │  ← Playfair Display 700
│  Tüm içeceklerde %30 indirim    │  ← Inter 400
│  16:00 - 19:00 arası             │  ← Inter 300, muted
│                                  │
│  ┌────────────────────────────┐  │
│  │       Sipariş Ver          │  │  ← CTA butonu
│  └────────────────────────────┘  │
│                                  │
└──────────────────────────────────┘
```

- Modal/popup tarzı, ortada, backdrop ile
- Tema renklerine uyumlu (theme objesi kullan)
- Backdrop tıklama veya X ile kapanır
- Kapanınca sessionStorage'a kaydet (tekrar gösterme)
- Görsel yoksa sadece metin göster
- Mobil uyumlu: genişlik max 90vw, maks 400px
- Giriş animasyonu: fade in + scale (CSS transition)

#### Popup Bileşeni:
```tsx
// src/components/PromoPopup.tsx

interface PromoPopupProps {
  promo: {
    id: string;
    title_tr: string;
    title_en: string;
    description_tr: string;
    description_en: string;
    image_url: string;
    cta_text_tr: string;
    cta_text_en: string;
    cta_url: string;
    schedule_start_time: string;
    schedule_end_time: string;
  };
  theme: MenuTheme;
  lang: string;
  onClose: () => void;
}
```

---

## GÖREV 2: KATEGORİ FOTOĞRAFI

### DB Güncelleme

menu_categories tablosuna image_url kolonu ekle:

```sql
ALTER TABLE menu_categories ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';
```

### Admin Panel — Kategori Formu Güncelleme

RestaurantDashboard.tsx'teki kategori oluşturma/düzenleme formuna fotoğraf yükleme alanı ekle.

#### Mevcut kategori formu alanları:
- name_tr, name_en, is_active, sort_order

#### Eklenecek:
- Fotoğraf yükleme alanı (ürün fotoğrafı yükleme mantığıyla aynı)
- Küçük önizleme (64x64 kare, rounded)
- Yükle / Değiştir / Sil butonları

Görsel yükleme: Supabase Storage, menu-images bucket.
Dosya yolu: `{restaurant_id}/categories/{category_id}.{ext}`

#### Kategori Listesinde:
Her kategori satırında küçük fotoğraf önizlemesi (32x32 kare) göster. Fotoğraf yoksa kategori adının baş harfi veya yemek ikonu (CiForkAndKnife).

### Public Menü — Kategori Görseli

PublicMenu.tsx'te kategori gösterimini güncelle. İki olası yaklaşım (İKİNCİSİNİ UYGULA):

#### Yaklaşım: Kategori başlığı yanında küçük ikon
- Kategori tab bar'daki her tab'ın başında küçük yuvarlak fotoğraf (24x24)
- Fotoğraf yoksa sadece text (şu anki gibi)
- Tab bar yatay scroll korunur

```tsx
// Kategori tab içinde:
<button className="flex items-center gap-1.5 px-3 py-2 rounded-full whitespace-nowrap ...">
  {category.image_url && (
    <img 
      src={category.image_url} 
      alt="" 
      className="w-6 h-6 rounded-full object-cover flex-shrink-0"
    />
  )}
  <span>{lang === 'tr' ? category.name_tr : category.name_en}</span>
  <span className="...">{filteredCount}</span>
</button>
```

---

## GENEL KURALLAR

1. shadcn/ui internal Lucide ikonlarına DOKUNMA
2. Kendi ikonlarımızda Circum Icons (react-icons/ci) kullan
3. Tema objesini kullan (theme.bg, theme.text, theme.cardBg vb.), hardcoded renk yazma
4. Font: başlıklar Playfair Display 700, body Inter 400, muted Inter 300
5. Mobil öncelikli tasarla
6. TypeScript hata vermemeli — npm run build başarılı olmalı
7. Supabase RLS policy'lerini unutma
8. Mevcut işlevselliği bozma

---

## SQL KOMUTLARI

Bu SQL komutlarını BEN Supabase'de çalıştıracağım, sen sadece uygulama kodunu yaz. Ama kodun bu tabloya/kolona bağımlı olacağını bil:

### Tablo: restaurant_promos
```sql
CREATE TABLE restaurant_promos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  title_tr TEXT NOT NULL DEFAULT '',
  title_en TEXT DEFAULT '',
  description_tr TEXT DEFAULT '',
  description_en TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  cta_text_tr TEXT DEFAULT 'Detaylar',
  cta_text_en TEXT DEFAULT 'Details',
  cta_url TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  schedule_enabled BOOLEAN DEFAULT false,
  schedule_start_time TIME DEFAULT '00:00',
  schedule_end_time TIME DEFAULT '23:59',
  schedule_days INTEGER[] DEFAULT '{0,1,2,3,4,5,6}',
  show_once_per_session BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE restaurant_promos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin full access on restaurant_promos"
  ON restaurant_promos FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

CREATE POLICY "Restaurant users manage own promos"
  ON restaurant_promos FOR ALL
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Public can read active promos"
  ON restaurant_promos FOR SELECT
  USING (is_active = true);

CREATE TRIGGER update_restaurant_promos_updated_at
  BEFORE UPDATE ON restaurant_promos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### Kolon: menu_categories.image_url
```sql
ALTER TABLE menu_categories ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';
```

---

## ÇALIŞTIRMA SIRASI

1. Önce GÖREV 2'yi yap (kategori fotoğrafı — daha basit, hızlı)
2. Sonra GÖREV 1'i yap (promo popup — daha kapsamlı)
3. npm run build ile test et
4. Git push yapma, ben yapacağım

---

## TEST KONTROL LİSTESİ

### Kategori Fotoğrafı
- [ ] Admin panelde kategori formunda fotoğraf yükleme alanı var
- [ ] Fotoğraf yüklenebiliyor (Supabase Storage)
- [ ] Kategori listesinde küçük önizleme görünüyor
- [ ] Public menüde kategori tab'larında fotoğraf görünüyor
- [ ] Fotoğraf yoksa normal çalışıyor (fallback)
- [ ] Fotoğraf silinebiliyor

### Promo Popup
- [ ] Admin panelde "Promosyonlar" bölümü var
- [ ] Yeni promo oluşturulabiliyor (başlık, açıklama, görsel, CTA)
- [ ] Saat planlaması ayarlanabiliyor
- [ ] Gün seçimi çalışıyor
- [ ] Promo aktif/pasif yapılabiliyor
- [ ] Promo silinebiliyor
- [ ] Public menüde popup çıkıyor (splash sonrası)
- [ ] Saat dışında popup çıkmıyor
- [ ] Seçilmeyen günlerde popup çıkmıyor
- [ ] Session başına bir kez gösteriliyor (sessionStorage)
- [ ] CTA butonu çalışıyor
- [ ] X ile kapanıyor
- [ ] Backdrop tıklama ile kapanıyor
- [ ] 3 temada doğru renklerde
- [ ] TR/EN dil desteği çalışıyor
- [ ] npm run build hatasız
