# TABBLED — 13 Nisan Sabah Prompt
# CDN Cache + Animasyonlu Logo Pre-loader + Logo Sistemi + Görsel Boyut Rehberi

---

## PROJE BAĞLAMI

- **Dizin:** /opt/khp/tabbled
- **Deploy:** Vercel (git push → otomatik)
- **Stack:** React + Vite + TypeScript + shadcn/ui
- **İkon:** Circum Icons (react-icons/ci)
- **Font:** Playfair Display + Inter (@fontsource ile local)
- **Tema:** white/black/red
- **Mevcut logo dosyaları VPS'te:** /opt/khp/tabbled/ dizininde 2.png (yatay), 3.png (dikey), 4.png (ikon)

### Marka Renkleri (logo guideline'dan):
- **Strawberry Pink:** #FF4F7A
- **Deep Charcoal:** #1C1C1E
- **Off-White:** #F7F7F8

---

## GÖREV 1: CDN CACHE HEADERS (5 dk)

### Neden:
Vite asset dosyalarına hash ekliyor (index-CqAUk3yO.js gibi). `immutable` cache header ile tekrar ziyaretlerde sıfır network isteği.

### Uygulama:

`vercel.json` dosyasını aç. Mevcut içeriğe `headers` bloğu ekle (rewrites'ı koru):

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*\\.woff2)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### Doğrulama:
- `npm run build` başarılı

---

## GÖREV 2: ANİMASYONLU LOGO PRE-LOADER (TÜM SAYFALARDA)

### Konsept:
Tabbled logosu (4 noktalı grid ikonu) loading animasyonu olarak kullanılacak. 4 nokta saat yönünde sırayla pembe (#FF4F7A) yanıyor, diğerleri koyu (#1C1C1E). Altında "Tabbled" yazısı (b harfi pembe). En altta "Menünüz hazırlanıyor..." veya bağlama uygun mesaj.

### A) index.html Global Pre-loader

Mevcut `<div id="root">` içindeki pre-loader'ı (bouncing dots) bu animasyonlu logo ile DEĞİŞTİR:

```html
<div id="root">
  <div id="app-preloader" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:#fff;font-family:'Inter',system-ui,sans-serif;">
    <!-- Animasyonlu Logo İkonu -->
    <svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" style="margin-bottom:16px;">
      <style>
        @keyframes l1{0%,100%{fill:#1C1C1E}10%,30%{fill:#FF4F7A}}
        @keyframes l2{0%,100%{fill:#1C1C1E}35%,55%{fill:#FF4F7A}}
        @keyframes l3{0%,100%{fill:#1C1C1E}60%,80%{fill:#FF4F7A}}
        @keyframes l4{0%,100%{fill:#1C1C1E}85%,95%{fill:#FF4F7A}}
      </style>
      <rect x="0" y="0" width="120" height="120" rx="24" fill="none" stroke="#1C1C1E" stroke-width="3"/>
      <rect x="20" y="20" width="80" height="80" rx="16" fill="none" stroke="#1C1C1E" stroke-width="3"/>
      <line x1="40" y1="40" x2="80" y2="40" stroke="#1C1C1E" stroke-width="2.5"/>
      <line x1="40" y1="80" x2="80" y2="80" stroke="#1C1C1E" stroke-width="2.5"/>
      <line x1="40" y1="40" x2="40" y2="80" stroke="#1C1C1E" stroke-width="2.5"/>
      <line x1="80" y1="40" x2="80" y2="80" stroke="#1C1C1E" stroke-width="2.5"/>
      <circle cx="40" cy="40" r="7" style="animation:l1 2s ease-in-out infinite"/>
      <circle cx="80" cy="40" r="7" style="animation:l2 2s ease-in-out infinite"/>
      <circle cx="80" cy="80" r="7" style="animation:l3 2s ease-in-out infinite"/>
      <circle cx="40" cy="80" r="7" style="animation:l4 2s ease-in-out infinite"/>
    </svg>
    <!-- Logo Text -->
    <div style="font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:#1C1C1E;letter-spacing:-0.5px;">
      Tab<span style="color:#FF4F7A;">b</span>led
    </div>
    <!-- Loading mesajı -->
    <div style="margin-top:12px;font-size:13px;color:#1C1C1E;opacity:0.4;">
      Yükleniyor...
    </div>
  </div>
</div>
```

`<body>` tag'inde `style="background:#fff;"` olduğundan emin ol.

### B) React Loading Component Güncelleme

Projede loading/splash ekranları gösteren component'ları bul:
```bash
grep -rn "loading\|Loading\|spinner\|Spinner\|bouncing\|splash\|Splash" src/ --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v ".d.ts"
```

Bir ortak `AnimatedLogo` component'ı oluştur:

**src/components/AnimatedLogo.tsx:**
```tsx
interface AnimatedLogoProps {
  size?: number;
  message?: string;
  showText?: boolean;
}

const AnimatedLogo = ({ size = 80, message, showText = true }: AnimatedLogoProps) => {
  const scale = size / 120;
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        xmlns="http://www.w3.org/2000/svg"
      >
        <style>{`
          @keyframes l1{0%,100%{fill:#1C1C1E}10%,30%{fill:#FF4F7A}}
          @keyframes l2{0%,100%{fill:#1C1C1E}35%,55%{fill:#FF4F7A}}
          @keyframes l3{0%,100%{fill:#1C1C1E}60%,80%{fill:#FF4F7A}}
          @keyframes l4{0%,100%{fill:#1C1C1E}85%,95%{fill:#FF4F7A}}
        `}</style>
        <rect x="0" y="0" width="120" height="120" rx="24" fill="none" stroke="#1C1C1E" strokeWidth="3"/>
        <rect x="20" y="20" width="80" height="80" rx="16" fill="none" stroke="#1C1C1E" strokeWidth="3"/>
        <line x1="40" y1="40" x2="80" y2="40" stroke="#1C1C1E" strokeWidth="2.5"/>
        <line x1="40" y1="80" x2="80" y2="80" stroke="#1C1C1E" strokeWidth="2.5"/>
        <line x1="40" y1="40" x2="40" y2="80" stroke="#1C1C1E" strokeWidth="2.5"/>
        <line x1="80" y1="40" x2="80" y2="80" stroke="#1C1C1E" strokeWidth="2.5"/>
        <circle cx="40" cy="40" r="7" style={{ animation: 'l1 2s ease-in-out infinite' }}/>
        <circle cx="80" cy="40" r="7" style={{ animation: 'l2 2s ease-in-out infinite' }}/>
        <circle cx="80" cy="80" r="7" style={{ animation: 'l3 2s ease-in-out infinite' }}/>
        <circle cx="40" cy="80" r="7" style={{ animation: 'l4 2s ease-in-out infinite' }}/>
      </svg>
      
      {showText && (
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: `${Math.max(18, size * 0.3)}px`,
          fontWeight: 700,
          color: '#1C1C1E',
          letterSpacing: '-0.5px'
        }}>
          Tab<span style={{ color: '#FF4F7A' }}>b</span>led
        </div>
      )}
      
      {message && (
        <div style={{
          fontSize: '13px',
          color: '#1C1C1E',
          opacity: 0.4
        }}>
          {message}
        </div>
      )}
    </div>
  );
};

export default AnimatedLogo;
```

### C) Bu component'ı şu yerlerde kullan:

1. **PublicMenu.tsx loading ekranı** — mevcut loading/splash'ı AnimatedLogo ile değiştir:
```tsx
<AnimatedLogo size={80} message="Menünüz hazırlanıyor..." />
```

2. **Landing page yükleme** — eğer lazy component Suspense fallback varsa:
```tsx
<AnimatedLogo size={60} message="Yükleniyor..." />
```

3. **Dashboard loading** — admin panel loading'lerinde:
```tsx
<AnimatedLogo size={60} showText={false} />
```

4. **Login sayfası** — eğer loading state varsa:
```tsx
<AnimatedLogo size={60} />
```

### TEMA UYUMU:
Şu an animasyon hardcoded #1C1C1E ve #FF4F7A kullanıyor. Siyah ve kırmızı temalarda da çalışır çünkü:
- Beyaz tema: koyu çizgiler beyaz arka planda ✓
- Siyah tema: arka plan siyah ise çizgiler görünmez olur ⚠️
- Kırmızı tema: pembe ile kırmızı karışabilir ⚠️

**FIX:** AnimatedLogo'ya tema desteği ekle. Siyah tema ise çizgi rengini beyaza (#F7F7F8), kırmızı tema ise pembeyi beyaza çevir. Bunu component'a prop olarak veya CSS custom property ile yap. AMA index.html pre-loader'da tema bilinmediği için orada her zaman beyaz arka plan + koyu çizgi kullan (bu zaten doğru).

**ÖNEMLİ:** Mevcut PublicMenu.tsx'teki branded loading ekranı (pembe logo + bouncing dots) varsa, bunu tamamen AnimatedLogo ile değiştir. Eski bouncing dots kodu silinebilir.

---

## GÖREV 3: STATİK LOGO SİSTEMİ

### Logo Dosyalarını Hazırla:

```bash
# Yeni logoları public'e kopyala
cp /opt/khp/tabbled/2.png public/tabbled-logo-horizontal.png
cp /opt/khp/tabbled/3.png public/tabbled-logo-vertical.png  
cp /opt/khp/tabbled/4.png public/tabbled-logo-icon.png
```

### Logo Kullanım Haritası:

| Yer | Logo Tipi | Dosya | Boyut |
|-----|-----------|-------|-------|
| **Navbar (landing)** | Yatay (ikon + yazı) | tabbled-logo-horizontal.png | h-8 (32px) |
| **Navbar (admin/dashboard)** | Yatay (ikon + yazı) | tabbled-logo-horizontal.png | h-8 (32px) |
| **Footer** | Yatay (ikon + yazı) | tabbled-logo-horizontal.png | h-7 (28px) |
| **Login sayfası** | Dikey (ikon üst + yazı alt) | tabbled-logo-vertical.png | h-20 (80px) |
| **Public menü header** | Sadece ikon | tabbled-logo-icon.png | h-8 (32px) |
| **Powered by (public menü alt)** | Yatay küçük | tabbled-logo-horizontal.png | h-5 (20px) |
| **Splash ekranı** | Dikey | tabbled-logo-vertical.png | h-24 (96px) |
| **Favicon** | İkon | tabbled-logo-icon.png | 32x32 ve 180x180 |

### Uygulama:

1. **Önce mevcut logo referanslarını bul:**
```bash
grep -rn "tabbled-logo\|tabbled_logo\|logo.*png\|logo.*svg\|Tabbled.*logo" src/ --include="*.tsx" --include="*.ts"
grep -rn "tabbled-logo" public/ index.html
```

2. **Her referansı yukarıdaki haritaya göre güncelle.** Örnek:

**Navbar:**
```tsx
<img 
  src="/tabbled-logo-horizontal.png" 
  alt="Tabbled" 
  style={{ height: '32px', width: 'auto' }}
/>
```

**Footer:**
```tsx
<img 
  src="/tabbled-logo-horizontal.png" 
  alt="Tabbled" 
  style={{ height: '28px', width: 'auto' }}
/>
```

**Login:**
```tsx
<img 
  src="/tabbled-logo-vertical.png" 
  alt="Tabbled" 
  style={{ height: '80px', width: 'auto' }}
/>
```

**Powered by:**
```tsx
<div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.5 }}>
  <span style={{ fontSize: '11px', color: '#999' }}>Powered by</span>
  <img src="/tabbled-logo-horizontal.png" alt="Tabbled" style={{ height: '16px', width: 'auto' }} />
</div>
```

3. **Eski logo dosyalarını temizle:**
Mevcut kullanılmayan logo PNG'lerini sil (hangileri kullanılıyordu kontrol et):
```bash
# Önce eski referansları kontrol et
grep -rn "lovable-uploads.*logo\|tabbled-logo-grid\|tabbled-logo-pink\|tabbled-logo-main" src/ index.html --include="*.tsx" --include="*.ts" --include="*.html"
# Referans kalmayanları sil
```

4. **Favicon güncelle:**
```bash
# Favicon için ikon logoyu kopyala
cp /opt/khp/tabbled/4.png public/favicon-192.png
```

index.html'de:
```html
<link rel="icon" type="image/png" href="/tabbled-logo-icon.png" />
<link rel="apple-touch-icon" href="/favicon-192.png" />
```

### ÖNEMLİ:
- Logo PNG'leri şeffaf arka planlı olmalı. Eğer beyaz veya renkli arka planları varsa, koyu temalarda sorun çıkar. Kontrol et: dosyayı aç, arka plan şeffaf mi?
- Eğer şeffaf DEĞİLSE, CSS ile `mix-blend-mode: multiply` (açık arka plan) veya `filter: invert(1)` (koyu arka plan) kullan
- Logolardaki "b" harfi pembe (#FF4F7A) — bu hem statik logoda hem animasyonda tutarlı

---

## GÖREV 4: GÖRSEL BOYUT REHBERİ (Admin Panel)

### Neden:
Restoran sahipleri yanlış boyutta fotoğraf yüklüyor. Upload alanında ideal boyutları göstermek UX'i iyileştirir.

### Supabase Image Transforms Preset'leri (mevcut):
- thumbnail: 100x100
- card: 400x300
- detail: 800x600
- cover: 1200x400
- original: transform yok

### Uygulama:

Admin panelinde fotoğraf upload alanlarının yanına/altına küçük bilgi notu ekle:

1. **Ürün fotoğrafı upload alanı** (RestaurantDashboard.tsx veya inline form):

Upload butonunun altına:
```tsx
<div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '11px',
  color: '#999',
  marginTop: '4px'
}}>
  <CiCircleInfo size={14} />
  <span>Önerilen: 1200×800px, yatay, max 5MB</span>
</div>
```

2. **Kategori fotoğrafı upload alanı:**
```tsx
<div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#999', marginTop: '4px' }}>
  <CiCircleInfo size={14} />
  <span>Önerilen: 800×600px, yatay, max 3MB</span>
</div>
```

3. **Logo upload alanı (Profil tabı):**
```tsx
<div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#999', marginTop: '4px' }}>
  <CiCircleInfo size={14} />
  <span>Önerilen: 500×500px, kare, şeffaf arka plan, max 2MB</span>
</div>
```

4. **Cover fotoğrafı upload alanı (Profil tabı):**
```tsx
<div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#999', marginTop: '4px' }}>
  <CiCircleInfo size={14} />
  <span>Önerilen: 1200×400px, yatay geniş, max 5MB</span>
</div>
```

5. **Promosyon görseli upload alanı:**
```tsx
<div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#999', marginTop: '4px' }}>
  <CiCircleInfo size={14} />
  <span>Önerilen: 1080×1080px, kare, max 5MB</span>
</div>
```

### ÖNEMLİ:
- `CiCircleInfo` import'unu ekle: `import { CiCircleInfo } from 'react-icons/ci';`
- Mevcut import'lara ekle, yeni satır açma (zaten CiXxx import'ları varsa oraya dahil et)
- Bilgi notu çok küçük ve muted olmalı — kullanıcıyı rahatsız etmemeli
- İngilizce ve Türkçe: şimdilik sadece Türkçe, çok dilli destek sonra

---

## YÜRÜTME SIRASI

1. **GÖREV 1** — CDN Cache Headers (vercel.json, 2 dk)
2. **GÖREV 2** — Animasyonlu Logo Pre-loader (index.html + AnimatedLogo component + tüm loading ekranlar)
3. **GÖREV 3** — Statik Logo Sistemi (yatay/dikey/ikon logoları tüm sayfalara yerleştir)
4. **GÖREV 4** — Görsel Boyut Rehberi (admin upload alanlarına bilgi notu)

Her görev sonrası `npm run build` çalıştır.

---

## KONTROL LİSTESİ

- [ ] vercel.json'a cache headers eklendi
- [ ] index.html pre-loader: animasyonlu logo (bouncing dots değil)
- [ ] AnimatedLogo.tsx component oluşturuldu
- [ ] PublicMenu loading → AnimatedLogo
- [ ] Dashboard/Suspense fallback → AnimatedLogo
- [ ] Login loading → AnimatedLogo (varsa)
- [ ] Splash ekranı → AnimatedLogo veya statik dikey logo
- [ ] Navbar: yatay logo (tabbled-logo-horizontal.png)
- [ ] Footer: yatay logo
- [ ] Login: dikey logo
- [ ] Public menü header: ikon logo
- [ ] Powered by: küçük yatay logo
- [ ] Favicon: ikon logo
- [ ] Eski logo dosyaları temizlendi
- [ ] Ürün upload: boyut rehberi eklendi
- [ ] Kategori upload: boyut rehberi eklendi
- [ ] Logo upload: boyut rehberi eklendi
- [ ] Cover upload: boyut rehberi eklendi
- [ ] Promo upload: boyut rehberi eklendi
- [ ] npm run build başarılı
- [ ] git push origin main
