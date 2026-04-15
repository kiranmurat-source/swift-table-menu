# CLAUDE CODE PROMPT — Kategori Video Arka Plan + Bundle Optimizasyonu
## Bento Kartlarda Video Desteği + Teknik Borç

---

## PROJE BAĞLAMI

Tabbled (tabbled.com) bir QR dijital menü SaaS platformu. React + Vite + TypeScript + shadcn/ui. Supabase PostgreSQL backend. Vercel deploy.

- **Repo:** /opt/khp/tabbled/
- **Supabase:** qmnrawqvkwehufebbkxp.supabase.co
- **Supabase project ref:** qmnrawqvkwehufebbkxp
- **İkon:** Phosphor Icons (@phosphor-icons/react) — Thin weight only
- **Font:** Roboto (Bold/Medium/Regular/Light)
- **Tema:** 2 tema (white + black)
- **Marka:** #FF4F7A (pembe), #1C1C1E (koyu), #F7F7F8 (açık)

---

## MEVCUT DURUM

### Bento Grid (az önce yapıldı)
- `categories` view modunda bento layout aktif
- `BentoCategoryCard` bileşeni var — fotoğraf arka plan + gradient overlay + beyaz metin
- Scroll animasyonu (IntersectionObserver) + stagger efekti çalışıyor
- Pattern: full-width → half+half → half+half → full-width → tekrar

### Ürün Video Desteği (14 Nisan'da yapıldı)
- `menu_items.video_url` kolonu mevcut
- Admin'de ürün formunda video URL input + önizleme var
- Public detay modalda video player (mp4/webm/YouTube/Vimeo) çalışıyor

### Kategoriler
- `menu_categories` tablosu: id, restaurant_id, name_tr, name_en, sort_order, is_active, image_url, parent_id, translations
- **video_url kolonu YOK** — eklenecek

---

## GÖREV 1: KATEGORİ VIDEO ARKA PLANI

### 1a. DB Migration (SQL dosyası olarak üret)

```sql
ALTER TABLE menu_categories ADD COLUMN IF NOT EXISTS video_url TEXT DEFAULT NULL;
```

Bu SQL'i `migration-category-video.sql` olarak üret.

### 1b. Admin Panel — Kategori Formuna Video URL Ekleme

- Mevcut kategori formunda `image_url` upload alanı var
- Altına video URL input ekle (ürün formundaki pattern ile aynı):
  - Label: "Video URL (opsiyonel)"
  - Placeholder: "https://... (.mp4, .webm veya YouTube/Vimeo linki)"
  - Input altında küçük açıklama: "3-5 saniyelik kısa loop video önerilir"
  - İkon: Phosphor `VideoCamera` (Thin)
  - Video URL girilmişse altında küçük önizleme (ürün formundaki gibi)

### 1c. Public Menü — BentoCategoryCard Video Arka Plan

**Mantık:** Kategori kartında video_url varsa fotoğraf yerine video göster.

**Öncelik sırası:**
1. `video_url` varsa → `<video>` arka plan
2. `video_url` yoksa, `image_url` varsa → `<img>` arka plan (mevcut)
3. İkisi de yoksa → koyu gradient fallback (mevcut)

**Video element özellikleri:**
```html
<video
  autoPlay
  muted
  loop
  playsInline
  preload="metadata"
  style={{
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  }}
>
  <source src={category.video_url} type="video/mp4" />
</video>
```

**Önemli detaylar:**
- `autoPlay` + `muted` + `playsInline` → iOS/Android'de otomatik oynama için üçü birden gerekli
- `loop` → sürekli döngü
- `preload="metadata"` → ilk kare yüklensin ama tüm video hemen inmesin
- Video üzerindeki gradient overlay aynı kalacak (fotoğraftaki gibi)
- Metin (kategori adı + açıklama + ürün sayısı) video üzerinde görünecek
- Scroll animasyonu video kartlarda da çalışacak

**YouTube/Vimeo desteği:**
- Bento kartlarda YouTube/Vimeo embed YAPMA — sadece doğrudan video dosyaları (.mp4, .webm)
- YouTube/Vimeo linkleri bento kartta çalışmaz (iframe autoplay kısıtlamaları)
- Admin'de uyarı: video_url'de YouTube/Vimeo link girilmişse küçük uyarı göster: "Kategori kartlarında sadece .mp4/.webm dosya URL'leri desteklenir"
- Ürün detay modalında YouTube/Vimeo hâlâ çalışır (mevcut davranış korunur)

**Performans:**
- Video dosyaları Supabase Storage'dan veya harici CDN'den gelebilir
- poster attribute: video_url varsa ve image_url de varsa, image_url'yi poster olarak kullan (video yüklenene kadar fotoğraf göster)
- Mobilde video bandwidth düşünülerek: eğer connection tipi kontrol edilebiliyorsa (navigator.connection) ve `saveData` aktifse video yerine poster/image göster (opsiyonel iyileştirme, zorunlu değil)

---

## GÖREV 2: BUNDLE OPTİMİZASYONU

### Kontrol Et
1. `npm run build` ile mevcut bundle boyutlarını kontrol et
2. Büyük chunk'ları tespit et (vendor, PublicMenu, Dashboard)
3. Gereksiz veya kullanılmayan import'ları bul

### Potansiyel İyileştirmeler
- Phosphor Icons: Eğer tüm paket import ediliyorsa → tree-shaking doğru çalışıyor mu kontrol et
- Kullanılmayan bileşen/sayfa import'ları var mı?
- Lazy loading doğru uygulanmış mı? (Dashboard, PublicMenu zaten lazy olmalı)
- Supabase client lazy loading kontrolü
- Büyük bağımlılıklar: Tiptap (rich text editör) lazy mı?

### Hedef
- Mevcut: ~233KB gzip → **hedefe yakın, büyük kazanım beklenmiyor ama temizlik yapılabilir**
- Gereksiz dependency varsa kaldır
- Import'ları gözden geçir

---

## GÖREV 3: ÇEVİRİ MERKEZİ PARENT→CHILD TREE

### Mevcut Durum
- Çeviri merkezi sol panelde kategoriler ve ürünler flat list olarak gösteriliyor
- Alt kategoriler (parent_id olan) parent'larının altında gösterilmiyor

### Yapılacak
- Sol panelde kategori-ürün ağacını hiyerarşik göster:
  ```
  ▼ Başlangıçlar (Kategori)
      • Çorba Çeşitleri (Alt Kategori)
          - Mercimek Çorbası (Ürün)
          - Domates Çorbası (Ürün)
      • Salatalar (Alt Kategori)
          - Çoban Salatası (Ürün)
      - Humus (Ürün — doğrudan parent altında)
  ▼ Ana Yemekler (Kategori)
      - Adana Kebap (Ürün)
      - İskender (Ürün)
  ```
- Parent kategoriler: kalın, tıklanabilir (collapse/expand), çeviri dot'u
- Child kategoriler: indent (16px sol padding), normal font, çeviri dot'u
- Ürünler: daha fazla indent (32px), küçük dot veya tire prefix
- Collapse durumu localStorage ile hatırlansın (opsiyonel)

---

## GENEL KURALLAR

1. **DB migration → SQL dosyası olarak üret** (migration-category-video.sql)
2. **Phosphor Icons Thin weight** sadece
3. **Emoji ikon YASAK**
4. **4-nokta spacing sistemi** (4, 8, 12, 16, 24, 32px)
5. **TypeScript strict** — any kullanma
6. **console.log temizle** — production'da log bırakma
7. **Mevcut BentoCategoryCard pattern'ini takip et** — video desteği eklerken mevcut yapıyı boz ma
8. **YouTube/Vimeo bento kartta ÇALIŞMAZ** — sadece .mp4/.webm

---

## TEST CHECKLIST

### Kategori Video
- [ ] migration-category-video.sql üretildi
- [ ] Admin: kategori formunda video URL input görünüyor
- [ ] Admin: video URL girilince önizleme çalışıyor
- [ ] Admin: YouTube/Vimeo linki girilince uyarı gösteriyor
- [ ] Public: video_url olan kategoride video arka plan oynuyor
- [ ] Public: autoplay + muted + loop + playsInline çalışıyor
- [ ] Public: video üzerinde gradient overlay + metin okunabilir
- [ ] Public: video yoksa image fallback (mevcut davranış)
- [ ] Public: ikisi de yoksa koyu gradient (mevcut davranış)
- [ ] Public: poster attribute (image_url varsa)
- [ ] Scroll animasyonu video kartlarda da çalışıyor
- [ ] White tema doğru
- [ ] Black tema doğru
- [ ] Mobilde video oynuyor (iOS Safari dahil)

### Bundle
- [ ] Bundle boyutları kontrol edildi
- [ ] Gereksiz import/dependency temizlendi (varsa)

### Çeviri Tree
- [ ] Sol panelde hiyerarşik ağaç gösterimi çalışıyor
- [ ] Parent kategoriler collapse/expand olabiliyor
- [ ] Child kategoriler indentli
- [ ] Ürünler daha fazla indentli
- [ ] Çeviri durumu dot'ları doğru

### Genel
- [ ] npm run build hatasız

---

## ÖNCELİK SIRASI

1. SQL migration dosyası (kategori video_url)
2. Admin kategori formuna video URL input + önizleme
3. BentoCategoryCard video arka plan
4. Video poster + fallback mantığı
5. YouTube/Vimeo uyarısı (admin)
6. Bundle optimizasyonu kontrol
7. Çeviri merkezi parent→child tree
8. Build test
