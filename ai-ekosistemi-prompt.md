# CLAUDE CODE PROMPT — AI Ekosistemi: Medya Kütüphanesi + Menü Import + Fotoğraf İyileştirme
## Google AI Entegrasyonu (Gemini 2.5 Flash + Imagen 4)

---

## PROJE BAĞLAMI

Tabbled (tabbled.com) bir QR dijital menü SaaS platformu. React + Vite + TypeScript + shadcn/ui. Supabase PostgreSQL backend. Vercel deploy.

- **Repo:** /opt/khp/tabbled/
- **Supabase:** qmnrawqvkwehufebbkxp.supabase.co
- **Supabase project ref:** qmnrawqvkwehufebbkxp
- **Storage bucket:** menu-images (public read, authenticated write)
- **İkon:** Phosphor Icons (@phosphor-icons/react) — Thin weight only
- **Font:** Roboto (Bold/Medium/Regular/Light)
- **Tema:** Admin: light/dark (adminTheme.ts palette), Public: white/black
- **Marka:** #FF4F7A (pembe), #1C1C1E (koyu), #F7F7F8 (açık)
- **Edge Functions deploy:** `supabase functions deploy FUNC_NAME --project-ref qmnrawqvkwehufebbkxp --no-verify-jwt`
- **Secrets:** `supabase secrets set KEY=value --project-ref qmnrawqvkwehufebbkxp`
- **Mevcut Image Transforms:** 5 preset — thumbnail (80px), card (200px), detail (480px), cover (800px), original; auto WebP
- **Mevcut imageUtils.ts:** getOptimizedImageUrl() helper, /object/public/ → /render/image/public/ dönüşümü

---

## MEVCUT DURUM

- Görseller Supabase Storage `menu-images` bucket'ında
- Her ürün/kategori/promo ayrı yere upload ediliyor (inline form'da)
- Boyut/kota kontrolü YOK — kullanıcı istediği kadar, istediği boyutta yükleyebilir
- AI fotoğraf özelliği YOK
- Menü import özelliği YOK
- AI kredi sistemi YOK
- Google Translate API key zaten mevcut (Supabase secrets'ta)

---

## GÖREV — 3 BÜYÜK PARÇA

### PARÇA 1: Medya Kütüphanesi
### PARÇA 2: AI Menü Import (Gemini 2.5 Flash OCR)
### PARÇA 3: AI Fotoğraf İyileştirme (Google Imagen 4)

---

## PARÇA 1: MEDYA KÜTÜPHANESİ

### 1a. DB Migration (SQL dosyası olarak üret)

```sql
-- Medya kütüphanesi tablosu
CREATE TABLE IF NOT EXISTS media_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,           -- Supabase Storage path
  file_size INTEGER NOT NULL,        -- byte cinsinden
  file_type TEXT NOT NULL,           -- 'image/jpeg', 'image/png', 'image/webp'
  width INTEGER,                     -- piksel
  height INTEGER,                    -- piksel
  file_hash TEXT,                    -- SHA-256 hash (duplicate tespiti)
  tags TEXT[] DEFAULT '{}',          -- 'product', 'category', 'logo', 'cover', 'promo'
  used_in JSONB DEFAULT '[]',       -- [{type: 'menu_item', id: 'xxx'}, {type: 'category', id: 'yyy'}]
  ai_enhanced BOOLEAN DEFAULT false, -- AI ile iyileştirilmiş mi
  original_id UUID REFERENCES media_library(id), -- AI iyileştirme: orijinal görselin ID'si
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "media_library_select" ON media_library
  FOR SELECT USING (
    restaurant_id IN (SELECT restaurant_id FROM profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "media_library_insert" ON media_library
  FOR INSERT WITH CHECK (
    restaurant_id IN (SELECT restaurant_id FROM profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "media_library_update" ON media_library
  FOR UPDATE USING (
    restaurant_id IN (SELECT restaurant_id FROM profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "media_library_delete" ON media_library
  FOR DELETE USING (
    restaurant_id IN (SELECT restaurant_id FROM profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Storage kota takibi
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS storage_limit_mb INTEGER DEFAULT 500;
-- Plan bazlı: Basic=500MB, Pro=2000MB (2GB), Premium=5000MB (5GB)

-- AI kredi sistemi
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS ai_credits_total INTEGER DEFAULT 0;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS ai_credits_used INTEGER DEFAULT 0;
-- Plan bazlı yıllık: Pro=60, Premium=150

-- AI kullanım logu
CREATE TABLE IF NOT EXISTS ai_usage_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,         -- 'menu_import', 'photo_enhance'
  credits_used INTEGER NOT NULL DEFAULT 1,
  input_data JSONB,                  -- özet bilgi (dosya adı, boyut vs.)
  output_data JSONB,                 -- sonuç bilgisi
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_usage_log_select" ON ai_usage_log
  FOR SELECT USING (
    restaurant_id IN (SELECT restaurant_id FROM profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );
```

### 1b. Admin Panel — Medya Kütüphanesi Tab'ı

**Sidebar'da yeni item:**
- Grup: "Menü Yönetimi" grubunda, "QR Kodları" altına
- İkon: Phosphor `Images` (Thin)
- Label: "Medya Kütüphanesi"

**UI Layout:**

```
┌─────────────────────────────────────────────────┐
│  Medya Kütüphanesi                              │
│                                                 │
│  [Upload Görseli ▲]  Kullanım: 245MB / 2GB  ██░│
│                                                 │
│  Filtre: [Tümü ▼] [Ürün] [Kategori] [Logo]     │
│                                                 │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │
│  │ img  │ │ img  │ │ img  │ │ img  │          │
│  │      │ │  ✨  │ │      │ │      │          │
│  │ 245KB│ │ 180KB│ │ 512KB│ │ 95KB │          │
│  └──────┘ └──────┘ └──────┘ └──────┘          │
│  ┌──────┐ ┌──────┐                             │
│  │ img  │ │ img  │                             │
│  │      │ │      │                             │
│  │ 320KB│ │ 150KB│                             │
│  └──────┘ └──────┘                             │
│                                                 │
│  Toplam: 24 görsel · 1.8 MB                    │
└─────────────────────────────────────────────────┘
```

**Özellikler:**
- **Grid view:** 4 sütunlu thumbnail grid (responsive: mobilde 2-3 sütun)
- **Upload:** Drag & drop alan + "Upload" butonu (çoklu dosya destekli)
- **Upload sırasında:**
  - Client-side boyut kontrolü: max 5MB per dosya
  - Client-side resize: genişlik > 1920px ise 1920px'e küçült (canvas API)
  - Client-side WebP dönüşüm (mümkünse)
  - SHA-256 hash hesapla → duplicate kontrolü (aynı hash varsa uyarı: "Bu görsel zaten yüklü")
  - Storage kota kontrolü: limit aşılacaksa upload'ı engelle
- **Thumbnail kartı:**
  - Görsel önizleme (Supabase Image Transform thumbnail 120px)
  - Dosya boyutu (KB)
  - AI iyileştirilmişse ✨ sparkle badge
  - Kullanılmıyorsa (used_in boş) sarı "Kullanılmıyor" etiket
  - Hover: büyütme overlay + aksiyon butonları
- **Tıklayınca detay panel (sağ slide-over veya modal):**
  - Büyük önizleme
  - Dosya bilgileri: boyut, çözünürlük, yükleme tarihi
  - Etiketler (tags): product/category/logo/cover/promo
  - Kullanıldığı yerler listesi (used_in: "Mercimek Çorbası", "Başlangıçlar" vs.)
  - [AI İyileştir] butonu (kredi varsa)
  - [Sil] butonu (kullanımdaysa uyarı: "Bu görsel X yerde kullanılıyor")
  - [URL Kopyala] butonu
- **Storage kullanım barı:**
  - Progress bar: kullanılan/toplam (MB)
  - Renk: yeşil (<%50), sarı (%50-80), kırmızı (>%80)
- **Filtre:** tag bazlı + "Kullanılmayanlar" + "AI İyileştirilmiş"

### 1c. Mevcut Upload Alanlarına Medya Kütüphanesi Entegrasyonu

Şu an ürün/kategori/promo formlarında inline upload var. Bunlara ek olarak:
- Upload butonunun yanına "Kütüphaneden Seç" butonu ekle
- Tıklayınca medya kütüphanesi modal'ı açılır
- Görseli seçince ilgili form alanına URL atanır
- Bu iş BÜYÜK — ayrı bir prompt'ta yapılabilir, şimdilik sadece kütüphane tab'ını yap

---

## PARÇA 2: AI MENÜ İMPORT (Gemini 2.5 Flash OCR)

### 2a. Edge Function: `import-menu`

**Dosya:** `supabase/functions/import-menu/index.ts`

**Mantık:**
1. Frontend'den base64 görsel(ler) alır
2. Gemini 2.5 Flash API'ye gönderir (vision + structured output)
3. JSON olarak kategoriler + ürünler çıkarır
4. Frontend'e döner (DB'ye YAZMAZ — önizleme için)

**Gemini API çağrısı:**
```typescript
const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image
          }
        },
        {
          text: `Bu bir restoran menüsünün fotoğrafı. Menüdeki tüm kategorileri ve ürünleri çıkar.

Her ürün için şunları belirle:
- Kategori adı (Türkçe)
- Ürün adı (Türkçe)
- Açıklama (varsa)
- Fiyat (sayı olarak, TL)

JSON formatında döndür:
{
  "categories": [
    {
      "name_tr": "Başlangıçlar",
      "items": [
        {
          "name_tr": "Mercimek Çorbası",
          "description_tr": "Geleneksel kırmızı mercimek çorbası",
          "price": 95
        }
      ]
    }
  ]
}

Sadece JSON döndür, başka metin ekleme. Fiyatı bulamadığın ürünlerde price: null yaz.`
        }
      ]
    }],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json'
    }
  })
});
```

**API Key:** `GOOGLE_AI_API_KEY` — Supabase secrets'ta ayarla
- NOT: Google Translate için zaten bir API key var, bu farklı bir servis (Generative AI). Aynı Google Cloud proje altında AI API'yi aktifle veya ayrı key oluştur.

**Deploy:**
```bash
supabase secrets set GOOGLE_AI_API_KEY=your_key --project-ref qmnrawqvkwehufebbkxp
supabase functions deploy import-menu --project-ref qmnrawqvkwehufebbkxp --no-verify-jwt
```

### 2b. Admin Panel — Menü Import UI

**Sidebar'da yeni item:**
- Grup: "Menü Yönetimi" grubunda, en üste
- İkon: Phosphor `FileArrowUp` (Thin)
- Label: "Menü İçe Aktar"

**Akış (4 adım):**

**Adım 1: Fotoğraf Yükle**
```
┌─────────────────────────────────────┐
│  📸 Menü Fotoğrafı Yükle           │
│                                     │
│  ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐  │
│  │                               │  │
│  │   Menü fotoğrafınızı buraya   │  │
│  │   sürükleyin veya tıklayın    │  │
│  │                               │  │
│  │   JPG, PNG · Max 10MB         │  │
│  │   Birden fazla sayfa?         │  │
│  │   Her sayfayı ayrı yükleyin   │  │
│  │                               │  │
│  └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘  │
│                                     │
│  💡 1 AI kredisi kullanılacak       │
│  Kalan: 58/60 kredi                │
│                                     │
│  [İptal]              [Analiz Et →] │
└─────────────────────────────────────┘
```

- Tek veya çoklu fotoğraf upload
- Her fotoğraf 1 AI kredisi (çoklu sayfa = çoklu kredi)
- Kredi yetersizse buton disabled + "Krediniz yetersiz" uyarısı

**Adım 2: AI Analiz (Loading)**
```
┌─────────────────────────────────────┐
│  🔄 Menü analiz ediliyor...         │
│                                     │
│  [████████████░░░░░░░] %65          │
│                                     │
│  Kategoriler bulunuyor...           │
│  Ürünler çıkarılıyor...            │
│  Fiyatlar eşleştiriliyor...        │
└─────────────────────────────────────┘
```

- Gemini API çağrısı (Edge Function üzerinden)
- Tipik süre: 5-15 saniye
- Progress bar (fake ama kullanıcıyı bilgilendirici)

**Adım 3: Önizleme & Düzenleme**
```
┌─────────────────────────────────────┐
│  ✅ 3 kategori, 24 ürün bulundu     │
│                                     │
│  ▼ Başlangıçlar (6 ürün)           │
│    ☑ Mercimek Çorbası      95 ₺   │
│    ☑ Çoban Salatası        75 ₺   │
│    ☑ Humus                 65 ₺   │
│    ☑ Sigara Böreği         55 ₺   │
│    ☑ Atom                  45 ₺   │
│    ☑ Cacık                 40 ₺   │
│                                     │
│  ▼ Ana Yemekler (12 ürün)          │
│    ☑ Adana Kebap          285 ₺   │
│    ☑ İskender             245 ₺   │
│    ...                              │
│                                     │
│  ▼ Tatlılar (6 ürün)              │
│    ☑ Künefe               145 ₺   │
│    ☐ Baklava              120 ₺   │  ← checkbox ile hariç tut
│    ...                              │
│                                     │
│  [← Geri]    [Tümünü İçe Aktar →]  │
└─────────────────────────────────────┘
```

- Her ürün checkbox ile seçilebilir (istemediğini hariç tut)
- İsim, açıklama, fiyat inline düzenlenebilir (tıkla-düzelt)
- Kategori adı da düzenlenebilir
- Fiyat NULL ise kırmızı vurguyla "Fiyat giriniz"

**Adım 4: Import Tamamlandı**
```
┌─────────────────────────────────────┐
│  🎉 İçe aktarma tamamlandı!         │
│                                     │
│  3 kategori, 22 ürün eklendi        │
│  (2 ürün hariç tutuldu)             │
│                                     │
│  [Menüyü Görüntüle]                │
└─────────────────────────────────────┘
```

- Seçili ürünleri DB'ye toplu insert (menu_categories + menu_items)
- sort_order: mevcut kategorilerin sonuna eklenir
- Çakışma kontrolü: aynı isimde kategori varsa mevcut kategoriye ekle

### 2c. AI Kredi Kontrolü

- Import başlamadan önce kredi kontrol et
- Yeterli kredi yoksa işlemi engelle
- Başarılı import sonrası kredi düş + ai_usage_log'a kayıt

---

## PARÇA 3: AI FOTOĞRAF İYİLEŞTİRME (Google Imagen 4)

### 3a. Edge Function: `enhance-photo`

**Dosya:** `supabase/functions/enhance-photo/index.ts`

**Mantık:**
1. Frontend'den base64 görsel + restaurant_id alır
2. Kredi kontrolü (ai_credits_used < ai_credits_total)
3. Google Imagen 4 API ile iyileştirme
4. İyileştirilmiş görseli Supabase Storage'a yükle
5. media_library'ye kayıt (ai_enhanced=true, original_id=orijinal)
6. Kredi düş + ai_usage_log'a kayıt
7. Yeni görsel URL'ini döndür

**Imagen 4 API çağrısı:**
```typescript
// Google Imagen 4 — image editing endpoint
const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-goog-api-key': GOOGLE_AI_API_KEY
  },
  body: JSON.stringify({
    instances: [{
      prompt: 'Enhance this food photograph: improve lighting to be bright and appetizing, correct white balance, make colors more vibrant and natural, clean up the background to be less distracting, sharpen food textures. Keep the original dish exactly the same - do not change, add, or remove any food items. This is a real restaurant dish photo that must remain authentic.',
      image: {
        bytesBase64Encoded: base64Image
      }
    }],
    parameters: {
      sampleCount: 1
    }
  })
});
```

**NOT:** Imagen 4 API endpoint ve request formatı değişmiş olabilir — deploy öncesi güncel Google AI dokümantasyonunu kontrol et. Alternatif olarak Gemini'nin image editing özelliği de kullanılabilir.

**Fiyat:** ~$0.04/fotoğraf (Imagen 4 Fast) — 150 kredi = yılda ~$6

### 3b. Admin Panel — Fotoğraf İyileştirme UI

**İki yerden erişim:**

**A) Medya Kütüphanesi'nden:**
- Görsel detay panelinde [✨ AI İyileştir] butonu
- Tıklayınca: "1 AI kredisi kullanılacak. Devam?" confirm dialog
- Onaylanınca: loading spinner + "İyileştiriliyor..." (10-20 sn)
- Sonuç: Yan yana karşılaştırma (önce/sonra slider)
- [Kaydet] → iyileştirilmiş versiyon media_library'ye eklenir
- [İptal] → sonuç atılır, kredi iade edilmez

**B) Ürün formundan:**
- Mevcut ürün fotoğrafının altında [✨ İyileştir] link/buton
- Aynı akış (confirm → loading → önce/sonra → kaydet/iptal)
- Kaydet seçilince ürünün image_url güncellenir

### 3c. Önce/Sonra Karşılaştırma UI
- Yan yana veya slider (sürüklenebilir dikey çizgi) ile karşılaştırma
- Sol: orijinal, sağ: iyileştirilmiş
- Etiketler: "Orijinal" / "İyileştirilmiş"

---

## AI KREDİ EKONOMİSİ

### Plan Bazlı Krediler
| Plan | Yıllık Kredi | Aylık Ortalama |
|------|-------------|----------------|
| Basic | 0 | 0 (AI özellik yok) |
| Pro | 60 | ~5/ay |
| Premium | 150 | ~12.5/ay |

### Kredi Maliyetleri
| İşlem | Kredi | Gerçek Maliyet |
|-------|-------|---------------|
| Menü import (1 fotoğraf) | 1 | ~$0.003 |
| Fotoğraf iyileştirme | 1 | ~$0.04 |

### Admin'de Kredi Gösterimi
- Plan bilgi banner'da (mevcut): "AI Kredisi: 58/60"
- Medya kütüphanesi ve import ekranlarında kalan kredi bilgisi
- Kredi bitince AI butonları disabled + "Krediniz tükendi" uyarısı

---

## DOSYA YAPISI

```
Yeni dosyalar:
- migration-media-ai.sql (tüm DB değişiklikleri)
- supabase/functions/import-menu/index.ts
- supabase/functions/enhance-photo/index.ts
- src/components/admin/MediaLibrary.tsx
- src/components/admin/MenuImport.tsx
- src/components/admin/PhotoEnhance.tsx (önce/sonra karşılaştırma)
- src/hooks/useAICredits.ts

Değişecek dosyalar:
- src/pages/RestaurantDashboard.tsx (sidebar + yeni tab'lar)
- src/components/admin/dashboardShared.ts (yeni tipler)
```

---

## GENEL KURALLAR

1. **DB migration → SQL dosyası olarak üret** (migration-media-ai.sql)
2. **Edge Function'ları dosya olarak yaz**, deploy komutlarını çıktıya yaz
3. **Phosphor Icons Thin weight** sadece
4. **Emoji ikon YASAK**
5. **4-nokta spacing sistemi**
6. **TypeScript strict** — any kullanma
7. **Admin tema uyumu** — adminTheme.ts palette kullan
8. **console.log temizle**
9. **AI asla kalori/alerjen/besin verisi ÜRETMEMELİ** — sadece menü metni (isim, açıklama, fiyat) ve fotoğraf iyileştirme
10. **Fotoğraf iyileştirme sadece iyileştirme** — yeni yemek üretme, ekleme, kaldırma YASAK

---

## TEST CHECKLIST

### Medya Kütüphanesi
- [ ] media_library tablosu oluştu
- [ ] Admin sidebar'da "Medya Kütüphanesi" görünüyor
- [ ] Upload çalışıyor (tek + çoklu dosya)
- [ ] Max 5MB dosya boyutu kontrolü
- [ ] Client-side resize (>1920px → 1920px)
- [ ] Duplicate tespiti (hash kontrolü)
- [ ] Storage kota barı gösteriliyor
- [ ] Kota aşımında upload engeli
- [ ] Grid view thumbnail'lar gösteriliyor
- [ ] Detay panel açılıyor (bilgi + aksiyon butonları)
- [ ] Tag filtresi çalışıyor
- [ ] "Kullanılmıyor" etiketi doğru gösteriliyor
- [ ] Silme çalışıyor (kullanımdaysa uyarı)

### Menü Import
- [ ] import-menu Edge Function deploy edildi
- [ ] Admin sidebar'da "Menü İçe Aktar" görünüyor
- [ ] Fotoğraf upload çalışıyor
- [ ] Gemini API çağrısı doğru çalışıyor
- [ ] JSON response parse ediliyor
- [ ] Önizleme ekranında kategoriler + ürünler listeleniyor
- [ ] Checkbox ile ürün hariç tutma çalışıyor
- [ ] Inline isim/fiyat düzenleme çalışıyor
- [ ] Import sonrası DB'ye doğru yazılıyor
- [ ] Kredi kontrolü çalışıyor
- [ ] Kredi yetersizse engelleniyor
- [ ] ai_usage_log'a kayıt ekleniyor

### Fotoğraf İyileştirme
- [ ] enhance-photo Edge Function deploy edildi
- [ ] Medya kütüphanesinden "AI İyileştir" çalışıyor
- [ ] Ürün formundan "İyileştir" çalışıyor
- [ ] Kredi kontrolü çalışıyor
- [ ] Önce/sonra karşılaştırma gösteriliyor
- [ ] Kaydet: iyileştirilmiş görsel storage'a yazılıyor
- [ ] media_library'ye ai_enhanced=true kaydı ekleniyor
- [ ] Kredi düşüyor + log ekleniyor

### Genel
- [ ] Light/dark admin tema uyumu
- [ ] npm run build hatasız

---

## ÖNCELİK SIRASI

1. SQL migration dosyası (media_library + ai_usage_log + restaurants kolon eklemeleri)
2. Medya Kütüphanesi tab'ı (upload + grid + detay + filtre + kota barı)
3. useAICredits hook
4. import-menu Edge Function
5. Menü Import UI (4 adımlı akış)
6. enhance-photo Edge Function
7. Fotoğraf İyileştirme UI (medya kütüphanesinden + ürün formundan)
8. Önce/sonra karşılaştırma bileşeni
9. Admin tema uyumu
10. Build test

**NOT:** Bu büyük bir prompt. Claude Code parça parça ilerleyebilir. Önce DB + medya kütüphanesi, sonra import, sonra enhance sırasıyla yapılabilir. Hepsini tek seferde yapmak zorunda değil — önemli olan her parça build geçmesi.
