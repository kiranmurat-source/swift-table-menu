# CLAUDE CODE PROMPT — Medya Kütüphanesi Entegrasyonu
## Tüm Formlardan Merkezi Medya Seçimi + Video Desteği

---

## PROJE BAĞLAMI

Tabbled (tabbled.com) bir QR dijital menü SaaS platformu. React + Vite + TypeScript + shadcn/ui. Supabase PostgreSQL backend. Vercel deploy.

- **Repo:** /opt/khp/tabbled/
- **Supabase:** qmnrawqvkwehufebbkxp.supabase.co
- **Storage bucket:** menu-images (public read, authenticated write)
- **İkon:** Phosphor Icons (@phosphor-icons/react) — Thin weight only
- **Font:** Roboto (Bold/Medium/Regular/Light)
- **Admin tema:** light/dark (adminTheme.ts palette)
- **Marka:** #FF4F7A (pembe), #1C1C1E (koyu), #F7F7F8 (açık)

---

## MEVCUT DURUM

### Medya Kütüphanesi (az önce yapıldı)
- `media_library` tablosu mevcut (id, restaurant_id, file_name, file_path, file_size, file_type, width, height, file_hash, tags, used_in, ai_enhanced, original_id)
- MediaLibrary.tsx admin tab'ı mevcut (upload, grid view, detay panel, kota barı, filtre)
- Sadece **görsel** destekliyor şu an (image/jpeg, image/png, image/webp)

### Mevcut Upload Alanları (her biri inline upload yapıyor)
1. **Ürün formu** — ürün fotoğrafı (image_url)
2. **Ürün formu** — video URL (video_url) — şu an sadece text input, dosya upload yok
3. **Kategori formu** — kategori fotoğrafı (image_url)
4. **Kategori formu** — video URL (video_url) — şu an sadece text input
5. **Profil** — logo (logo_url)
6. **Profil** — kapak görseli (cover_url)
7. **Promosyon formu** — promo görseli (image_url)

### Sorun
- Her formda ayrı inline upload → boyut/kota kontrolü dağınık
- Video dosyaları upload edilemiyor (sadece URL yapıştırma)
- Görseller media_library'ye kayıt olmuyor → takip yok

---

## GÖREV

### 1. Medya Kütüphanesine Video Desteği Ekle

**DB Migration (SQL dosyası):**
```sql
-- media_library'ye video desteği için güncelleme gerekmez
-- file_type zaten TEXT — 'video/mp4', 'video/webm' de kabul edilecek
-- Ama duration kolonu ekleyelim:
ALTER TABLE media_library ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT NULL;
```

**MediaLibrary.tsx güncellemeleri:**
- Upload'ta kabul edilen dosya tipleri: image/jpeg, image/png, image/webp, **video/mp4, video/webm**
- Video dosyaları için max boyut: **50MB** (görseller hâlâ 5MB)
- Video thumbnail: `<video>` elementinden ilk kare capture (canvas) veya sadece video ikonu göster
- Grid view'da video dosyaları: Phosphor `VideoCamera` (Thin) overlay badge
- Detay panelde video dosyaları: video player (autoplay, muted, loop, controls)
- Filtre: tag'lere ek olarak "Görseller" / "Videolar" filtresi
- Video dosyaları için duration bilgisi göster (varsa)
- Video dosyaları AI iyileştirme butonunu gösterme (sadece görseller için)

**Storage path convention:**
- Görseller: `{restaurant_id}/images/{filename}`
- Videolar: `{restaurant_id}/videos/{filename}`

### 2. MediaPickerModal Bileşeni Oluştur

**Yeni dosya:** `src/components/admin/MediaPickerModal.tsx`

Medya kütüphanesini modal olarak açan, dosya seçimi sağlayan bileşen.

**Props:**
```typescript
interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  accept?: 'image' | 'video' | 'all';  // hangi tip dosyalar gösterilecek
  restaurantId: string;
}
```

**UI:**
```
┌─────────────────────────────────────────────┐
│  Medya Seç                            [✕]  │
├─────────────────────────────────────────────┤
│                                             │
│  [+ Yeni Yükle]  Filtre: [Tümü ▼]         │
│                                             │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     │
│  │ img  │ │ img  │ │ vid  │ │ img  │     │
│  │      │ │  ✨  │ │ ▶    │ │      │     │
│  │ 245KB│ │ 180KB│ │ 2.1MB│ │ 95KB │     │
│  └──────┘ └──────┘ └──────┘ └──────┘     │
│  ┌──────┐ ┌──────┐                        │
│  │ img  │ │ vid  │                        │
│  │      │ │ ▶    │                        │
│  │ 320KB│ │ 4.5MB│                        │
│  └──────┘ └──────┘                        │
│                                             │
│  Kullanım: 245MB / 2GB  ████████░░░        │
│                                             │
├─────────────────────────────────────────────┤
│  [İptal]                          [Seç]    │
└─────────────────────────────────────────────┘
```

**Özellikler:**
- MediaLibrary'nin grid view'ını modal içinde gösterir
- `accept` prop'una göre filtreleme (image only, video only, all)
- Dosya seçilince mavi border ile vurgulama
- "Yeni Yükle" butonu — modal içinde upload (kütüphaneye ekler)
- Upload sonrası otomatik seçili olur
- "Seç" butonu → `onSelect(file_url)` callback
- Kota barı altta görünür
- Arama/filtre (dosya adına göre)
- Responsive: mobilde tam ekran modal

### 3. Tüm Formlardaki Inline Upload'ı Değiştir

**Her upload alanı şu şekilde değişecek:**

Eski:
```
[Dosya Seç] [Yükle] 
(veya drag & drop alan)
```

Yeni:
```
[Mevcut görsel/video önizleme]
[Kütüphaneden Seç]  [Kaldır]
```

**Değişecek yerler:**

#### 3a. Ürün Formu (RestaurantDashboard.tsx)
- **Ürün fotoğrafı:** Inline upload → "Kütüphaneden Seç" butonu (accept="image")
  - Buton: Phosphor `ImageSquare` (Thin) + "Kütüphaneden Seç"
  - Seçilmiş görsel: küçük önizleme + "Değiştir" + "Kaldır" butonları
- **Video:** Text input (URL yapıştırma) → "Video Seç" butonu (accept="video")
  - Buton: Phosphor `VideoCamera` (Thin) + "Video Seç"
  - Seçilmiş video: küçük video player önizleme + "Değiştir" + "Kaldır"
  - URL yapıştırma input'u DA kalsın (YouTube/Vimeo linkleri için)
  - Açıklama: "Kütüphaneden video seçin veya YouTube/Vimeo linki yapıştırın"

#### 3b. Kategori Formu (RestaurantDashboard.tsx)
- **Kategori fotoğrafı:** Inline upload → "Kütüphaneden Seç" (accept="image")
- **Video:** Text input → "Video Seç" butonu (accept="video") + URL input korunur

#### 3c. Profil Tabı (RestaurantDashboard.tsx veya ProfilePanel.tsx)
- **Logo:** Inline upload → "Kütüphaneden Seç" (accept="image")
- **Kapak görseli:** Inline upload → "Kütüphaneden Seç" (accept="image")

#### 3d. Promosyon Formu (RestaurantDashboard.tsx)
- **Promo görseli:** Inline upload → "Kütüphaneden Seç" (accept="image")

### 4. used_in Takibi

Dosya seçildiğinde `media_library.used_in` JSONB güncellenmeli:

```typescript
// Örnek: ürüne fotoğraf atanınca
used_in: [
  { type: 'menu_item', id: 'item-uuid', field: 'image_url' },
  { type: 'menu_category', id: 'cat-uuid', field: 'image_url' }
]
```

- Dosya seçilince: used_in'e ekleme
- Dosya kaldırılınca (Kaldır butonu): used_in'den çıkarma
- Bu sayede medya kütüphanesinde "Kullanılmıyor" etiketi doğru çalışır

### 5. Eski Inline Upload Kodunu Temizle

- Ürün/kategori/promo/profil formlarındaki Supabase Storage upload fonksiyonlarını kaldır
- Upload SADECE MediaLibrary.tsx ve MediaPickerModal.tsx üzerinden yapılacak
- `handleImageUpload`, `handleFileChange` gibi inline upload handler'ları temizle
- İlgili state'ler (uploading, uploadProgress vs.) temizle

---

## GENEL KURALLAR

1. **DB migration → SQL dosyası olarak üret** (migration-media-video.sql)
2. **Phosphor Icons Thin weight** sadece
3. **Emoji ikon YASAK**
4. **4-nokta spacing sistemi**
5. **TypeScript strict** — any kullanma
6. **Admin tema uyumu** — adminTheme.ts palette kullan
7. **console.log temizle**
8. **Mevcut MediaLibrary pattern'ini takip et** — aynı stil, aynı tema
9. **Video upload max 50MB, görsel max 5MB**
10. **YouTube/Vimeo URL input video formlarında KORUNSUN** — kütüphaneden seçim + URL yapıştırma ikisi de olsun

---

## TEST CHECKLIST

### Video Desteği
- [ ] MediaLibrary'ye video upload çalışıyor (mp4, webm)
- [ ] Video max 50MB kontrolü
- [ ] Video dosyaları grid'de VideoCamera badge ile gösteriliyor
- [ ] Video detay panelinde player çalışıyor
- [ ] "Görseller" / "Videolar" filtresi çalışıyor
- [ ] Video dosyalarında AI İyileştir butonu gizli

### MediaPickerModal
- [ ] Modal açılıp kapanıyor
- [ ] accept="image" ile sadece görseller gösteriliyor
- [ ] accept="video" ile sadece videolar gösteriliyor
- [ ] accept="all" ile hepsi gösteriliyor
- [ ] Dosya seçimi çalışıyor (mavi border vurgu)
- [ ] "Yeni Yükle" modal içinde çalışıyor
- [ ] "Seç" butonu doğru URL'i döndürüyor
- [ ] Kota barı gösteriliyor

### Form Entegrasyonu
- [ ] Ürün formu: "Kütüphaneden Seç" ile görsel seçimi çalışıyor
- [ ] Ürün formu: "Video Seç" ile video seçimi çalışıyor
- [ ] Ürün formu: YouTube/Vimeo URL input hâlâ çalışıyor
- [ ] Kategori formu: görsel + video seçimi çalışıyor
- [ ] Profil: logo seçimi çalışıyor
- [ ] Profil: kapak görseli seçimi çalışıyor
- [ ] Promo formu: görsel seçimi çalışıyor
- [ ] Seçilmiş dosya önizleme gösteriliyor
- [ ] "Değiştir" butonu çalışıyor
- [ ] "Kaldır" butonu çalışıyor

### used_in Takibi
- [ ] Dosya seçilince used_in güncelleniyor
- [ ] Dosya kaldırılınca used_in'den çıkarılıyor
- [ ] Medya kütüphanesinde "Kullanılmıyor" doğru gösteriliyor

### Temizlik
- [ ] Eski inline upload kodu kaldırılmış
- [ ] npm run build hatasız

---

## ÖNCELİK SIRASI

1. SQL migration (duration_seconds kolonu)
2. MediaLibrary.tsx video desteği (upload + grid + detay + filtre)
3. MediaPickerModal.tsx bileşeni
4. Ürün formunu güncelle (görsel + video)
5. Kategori formunu güncelle (görsel + video)
6. Profil formunu güncelle (logo + cover)
7. Promo formunu güncelle
8. used_in takibi
9. Eski inline upload kodunu temizle
10. Build test
