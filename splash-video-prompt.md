# TABBLED — Splash Video Arka Plan Desteği
## Admin'de Video URL Input + Public Splash'ta Video Arka Plan

---

## PROJE BAĞLAMI

- **Repo:** /opt/khp/tabbled/
- **Stack:** React + Vite + TypeScript + shadcn/ui
- **Tema sistemi:** `src/lib/adminTheme.ts` — `getAdminTheme(theme)` 
- **DB:** `restaurants.splash_video_url` kolonu yeni eklendi (TEXT, nullable)
- **Emoji yasağı:** Kesinlikle emoji kullanma
- **İkon:** Phosphor Icons Thin weight only

---

## GÖREV 1: ADMIN — VIDEO URL INPUT

### Konum: Tema & Profil sayfası → Görseller bölümü

Kapak Görseli'nin altına yeni bir alan ekle:

**"Splash Video"** bölümü:
- Label: "Splash Video URL"
- Alt açıklama: "MP4 veya WebM formatında video linki. Video varsa splash ekranında arka plan olarak gösterilir."
- Input tipi: text (URL input)
- Placeholder: "https://example.com/video.mp4"
- Input tema uyumlu olmalı (t.inputBg, t.inputBorder, t.inputText)
- Kaydet butonuyla birlikte DB'ye yazılmalı (mevcut profil kaydetme akışına ekle)
- Mevcut `splash_video_url` değeri varsa input'ta gösterilmeli
- "Kaldır" butonu: URL'i temizler (null yapar)
- Video URL doluysa küçük bir önizleme göster (max 200px genişlik, muted autoplay, 3 saniye)

### DB alanı:
- Kolon: `splash_video_url` (TEXT, nullable) — zaten eklendi
- Fetch: mevcut restaurant fetch query'sine ekle
- Save: mevcut profil update mutation'ına ekle

---

## GÖREV 2: PUBLIC SPLASH — VIDEO ARKA PLAN

### Konum: Public menü splash ekranı

**Mantık:**
1. `restaurant.splash_video_url` doluysa → video arka plan göster
2. Boşsa → mevcut kapak görseli davranışı korunsun (cover_url)
3. Her ikisi de boşsa → mevcut fallback (gradient veya düz renk)

**Video implementasyonu:**
```tsx
{restaurant.splash_video_url && (
  <video
    autoPlay
    muted
    loop
    playsInline
    preload="auto"
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      zIndex: 0,
    }}
  >
    <source src={restaurant.splash_video_url} type="video/mp4" />
  </video>
)}
```

**Dikkat edilecekler:**
- Video üzerine yarı saydam overlay (koyu gradient) koy — logo ve metin okunabilir olmalı
  ```tsx
  <div style={{
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%)',
    zIndex: 1,
  }} />
  ```
- Splash içeriği (logo, restoran adı, butonlar) overlay'in üstünde: `zIndex: 2, position: 'relative'`
- Video yüklenene kadar cover_url görseli fallback olarak göster
- `poster` attribute'u cover_url'e set et (video yüklenirken görsel gösterilir):
  ```tsx
  poster={restaurant.cover_url || ''}
  ```
- Mobilde video autoplay çalışması için `playsInline` ve `muted` ŞART
- Video başarısız yüklenirse (onError) sessizce cover_url'e fallback yap
- Video dosya boyutu konusunda uyarı yok — bu kullanıcının sorumluluğu

**Tema uyumu:**
- White tema: overlay biraz daha açık (rgba(0,0,0,0.2) → rgba(0,0,0,0.5))
- Black tema: overlay biraz daha koyu (rgba(0,0,0,0.4) → rgba(0,0,0,0.7))
- Metin rengi video varken her zaman beyaz (#FFFFFF) — hem white hem black temada

---

## GENEL KURALLAR

1. **Emoji YASAK**
2. **Phosphor Icons sadece Thin weight**
3. **shadcn/ui internal Lucide ikonlarına DOKUNMA**
4. **Mevcut splash davranışını bozma** — video yoksa her şey eskisi gibi çalışmalı
5. **TypeScript strict — any kullanma**

---

## TEST CHECKLIST

- [ ] Admin Tema & Profil'de "Splash Video URL" input'u görünüyor
- [ ] Input tema uyumlu (dark modda koyu)
- [ ] URL girilip kaydedince DB'ye yazılıyor
- [ ] URL temizlenip kaydedince null oluyor
- [ ] Video URL doluyken önizleme görünüyor
- [ ] Public splash'ta video arka plan oynuyor (autoplay, muted, loop)
- [ ] Video üzerinde overlay var, logo/metin okunuyor
- [ ] Video yoksa kapak görseli gösteriliyor (eski davranış)
- [ ] Her ikisi de yoksa fallback çalışıyor
- [ ] Mobilde video autoplay çalışıyor (playsInline + muted)
- [ ] Video yüklenmezse cover_url'e fallback
- [ ] `npm run build` hatasız

---

## ÖNCELİK SIRASI

1. Admin input + DB save/fetch (10 dk)
2. Public splash video arka plan (15 dk)
3. Overlay + fallback mantığı (5 dk)
4. Test

---

## DOSYALAR

```
src/pages/RestaurantDashboard.tsx   → Profil bölümüne video input ekle
src/pages/PublicMenu.tsx            → Splash bölümüne video arka plan ekle
```
