# TABBLED — Siyah Ekran Fix + Performans Optimizasyonları

## BAĞLAM
Tabbled.com dijital menü SaaS platformu. React + Vite + TypeScript + shadcn/ui.
QR kod taratılınca public menü sayfası (/menu/:slug) açılıyor. İlk yüklemede siyah/boş ekran görünüyor — React mount olmadan önce kullanıcı hiçbir şey görmüyor. Ayrıca bundle boyutu ve font yükleme optimize edilecek.

## TEKNİK BİLGİLER
- Font: Playfair Display + Inter (Google Fonts'tan)
- Bundle: index 290KB (gzip 91KB), Dashboard 193KB, RichTextEditor 373KB (lazy)
- Supabase vendor chunk: 193KB (gzip)
- Hero image: zaten WebP optimize (136KB)
- Deploy: Vercel
- Logo: /lovable-uploads/ dizininde PNG dosyaları

---

## GÖREV 1: SIYAH EKRAN FIX (index.html pre-loader)

### Ne yapılacak:
`index.html` dosyasında `<div id="root">` içine statik HTML+CSS loading ekranı ekle. React mount olunca bu otomatik kaybolacak (React `<div id="root">`'un innerHTML'ini değiştirir).

### Uygulama:

1. **index.html — `<div id="root">` içine pre-loader ekle:**

```html
<div id="root">
  <!-- Pre-loader: React mount olunca otomatik kaybolur -->
  <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:#fff;font-family:'Inter',system-ui,sans-serif;">
    <!-- Logo -->
    <img src="/lovable-uploads/tabbled-logo-pink.png" alt="Tabbled" style="width:120px;height:auto;margin-bottom:24px;" loading="eager" />
    <!-- Bouncing dots -->
    <div style="display:flex;gap:6px;">
      <div style="width:8px;height:8px;border-radius:50%;background:#e91e63;animation:bounce 1.4s infinite ease-in-out both;animation-delay:-.32s;"></div>
      <div style="width:8px;height:8px;border-radius:50%;background:#e91e63;animation:bounce 1.4s infinite ease-in-out both;animation-delay:-.16s;"></div>
      <div style="width:8px;height:8px;border-radius:50%;background:#e91e63;animation:bounce 1.4s infinite ease-in-out both;"></div>
    </div>
    <style>
      @keyframes bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}
    </style>
  </div>
</div>
```

2. **index.html — `<body>` arka planını beyaz yap:**
`<body>` tag'ine `style="background:#fff;"` ekle. Bu sayede tarayıcı HTML parse ederken bile beyaz arka plan görünür.

3. **index.html — Font preconnect ekle (`<head>` içine, mevcut yoksa):**
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
```

4. **PublicMenu.tsx — Minimum loading timer'ı kontrol et:**
Eğer `setTimeout` veya minimum loading süresi varsa, 1000ms → 500ms'e düşür. Zaten 500ms ise dokunma.

### Doğrulama:
- `npm run build` başarılı olmalı
- Tarayıcıda tabbled.com açıldığında ilk anda beyaz ekran + logo + bouncing dots görünmeli
- React mount olunca pre-loader kaybolup gerçek sayfa görünmeli

---

## GÖREV 2: FONT SELF-HOSTING (Google Fonts → Local)

### Neden:
Google Fonts harici DNS lookup + CORS roundtrip → mobilde 200-400ms ek gecikme. Font'ları local'den serve etmek bu gecikmeyi sıfırlar.

### Uygulama:

1. **Font paketlerini kur:**
```bash
npm install @fontsource/inter @fontsource/playfair-display
```

2. **src/main.tsx (veya src/index.tsx) — en üste import ekle:**
```typescript
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/playfair-display/400.css';
import '@fontsource/playfair-display/700.css';
```

3. **index.html — Google Fonts `<link>` tag'lerini kaldır:**
Şu satırları sil (veya varsa):
```html
<!-- SİL: -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&..." rel="stylesheet" />
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&..." rel="stylesheet" />
```

Ayrıca Görev 1'de eklenen preconnect satırları da artık gereksiz — onları da sil:
```html
<!-- SİL (artık local font kullanıyoruz): -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
```

4. **CSS'te font-family tanımlarının aynı kaldığından emin ol:**
@fontsource paketleri `font-family: 'Inter'` ve `font-family: 'Playfair Display'` isimlerini kullanır — mevcut CSS'le uyumlu.

### ÖNEMLİ NOT:
index.html pre-loader'daki inline font referansını güncelle — artık Google'dan değil local'den yüklenecek. Pre-loader'da `font-family:'Inter',system-ui,sans-serif` zaten fallback olarak system-ui kullanıyor, font yüklenmeden de düzgün görünecek.

### Doğrulama:
- `npm run build` başarılı
- Network tab'da `fonts.googleapis.com` ve `fonts.gstatic.com`'a istek OLMAMALI
- Font'lar bundle içinden yüklenmeli (.woff2 dosyaları)
- Görsel olarak font'lar aynı görünmeli

---

## GÖREV 3: SUPABASE SDK LAZY LOADING

### Neden:
vendor-supabase chunk'ı 193KB (gzip ~60KB). Landing page Supabase kullanmıyor — bu chunk sadece /login, /dashboard, /menu/ route'larında gerekli. Landing page'de yüklememek FCP'yi iyileştirir.

### Uygulama:

1. **src/App.tsx (veya router dosyası) — Supabase kullanan sayfaları lazy import yap:**

Mevcut yapıyı kontrol et. Eğer zaten lazy loading varsa, Supabase'i import eden component'ların lazy olduğundan emin ol:

```typescript
// Bunlar lazy olmalı (Supabase kullanıyorlar):
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));
const RestaurantDashboard = lazy(() => import('./pages/RestaurantDashboard'));

// Bunlar ZATEN lazy olabilir veya olmayabilir:
const PublicMenu = lazy(() => import('./pages/PublicMenu'));

// Landing page (Index.tsx) Supabase KULLANMIYORSA normal import kalabilir:
import Index from './pages/Index';
```

2. **Vite build'in tree-shaking'ini kontrol et:**
`npm run build` çalıştır ve çıktıda Supabase chunk'ının ayrı bir lazy chunk olarak göründüğünü doğrula.

3. **Eğer Index.tsx'te Supabase import varsa** (useAuth, supabase client vs.), bunları kaldır veya Landing page'de gerek yoksa temizle. Landing page'de auth durumuna göre "Dashboard'a git" butonu varsa, bu kontrolü window.location veya basit bir cookie/localStorage check ile yap.

### ÖNEMLİ: 
- Bu değişiklik riskli olabilir — Index.tsx'in Supabase'e bağımlılığını dikkatlice kontrol et
- Eğer Index.tsx useAuth() kullanıyorsa ve bu hook supabase client import ediyorsa, lazy loading Supabase chunk'ını ayıramaz. Bu durumda bu görevi ATLA ve sadece not bırak.

### Doğrulama:
- `npm run build` başarılı
- Build çıktısında chunk boyutlarını raporla
- Landing page (/) yüklenirken Network tab'da Supabase chunk'ı yüklenmemeli

---

## GÖREV 4: CRITICAL CSS + CSS ASYNC LOADING

### Neden:
77KB CSS tamamı render-blocking. İlk ekranda görünen CSS'i inline etmek ve geri kalanını async yüklemek FCP'yi iyileştirir.

### Uygulama:

Bu görev Vite'ın build sisteminde otomatik yapılabilir. Eğer zaten Vite handle ediyorsa (ki genellikle eder — CSS module olarak yükleniyor), bu görev büyük bir kazanç getirmeyebilir.

**Basit yaklaşım — sadece font display swap ekle:**

1. CSS'te font-face tanımlarında `font-display: swap;` olduğundan emin ol. @fontsource paketleri bunu varsayılan olarak yapar ama kontrol et.

2. Eğer global CSS dosyasında (`src/index.css`) çok büyük bir dosya varsa ve gereksiz stiller varsa, kullanılmayan CSS'leri temizle.

**ÖNEMLİ:** Vite zaten CSS'i otomatik olarak chunk'lara ayırır ve lazy component'ların CSS'ini sadece o component yüklendiğinde yükler. Bu yüzden bu görev düşük öncelikli — GÖREV 1, 2, 3'ten sonra zaman kalırsa yap.

### Doğrulama:
- `npm run build` başarılı
- CSS chunk boyutlarını raporla

---

## GÖREV 5: HERO IMAGE <picture> + srcset

### Neden:
Hero image zaten WebP'ye optimize (136KB) ama tarayıcıya WebP desteği varsa otomatik seçtirmek ve responsive boyutlar sunmak daha iyi.

### Uygulama:

1. Hero image'ın kullanıldığı component'ı bul (muhtemelen `HeroSection.tsx`).

2. Mevcut `<img>` tag'ini `<picture>` ile sar:

```tsx
<picture>
  <source 
    srcSet="/lovable-uploads/hero-restaurant.webp" 
    type="image/webp" 
  />
  <img 
    src="/lovable-uploads/hero-restaurant.jpg" 
    alt="Restaurant" 
    loading="eager"
    fetchPriority="high"
    width={1200}
    height={800}
    style={{ ... }}
  />
</picture>
```

3. Hero image'a `loading="eager"` ve `fetchPriority="high"` ekle (above-the-fold, hemen yüklenmeli).

### ÖNEMLİ:
- Hero image dosya isimlerini kontrol et — yukarıdaki isimler varsayım, gerçek dosya isimlerini kullan
- Eğer sadece .webp versiyonu varsa (.jpg yok), `<picture>` tag'ine gerek yok, sadece `fetchPriority="high"` ekle

### Doğrulama:
- `npm run build` başarılı
- Network tab'da hero image WebP olarak yüklenmeli

---

## YÜRÜTME SIRASI

1. **GÖREV 1** — Siyah ekran fix (EN KRİTİK — QR deneyimi)
2. **GÖREV 2** — Font self-hosting (kolay + garanti kazanç)
3. **GÖREV 5** — Hero image optimize (kolay + küçük kazanç)
4. **GÖREV 3** — Supabase lazy loading (riskli — dikkatli kontrol)
5. **GÖREV 4** — Critical CSS (düşük öncelik — zaman kalırsa)

Her görev sonrası `npm run build` çalıştır ve sonucu raporla.

---

## KONTROL LİSTESİ (tamamlanınca işaretle)

- [ ] Siyah ekran fix — pre-loader eklendi
- [ ] Body background beyaz
- [ ] Font preconnect eklendi (sonra Görev 2'de silinecek)
- [ ] PublicMenu.tsx timer kontrol (500ms)
- [ ] @fontsource/inter + @fontsource/playfair-display kuruldu
- [ ] Google Fonts link'leri silindi
- [ ] Preconnect satırları silindi
- [ ] Font import'ları main.tsx'e eklendi
- [ ] Hero image fetchPriority="high" + picture tag
- [ ] Supabase lazy loading kontrol (risk değerlendirmesi)
- [ ] Final bundle raporu
- [ ] npm run build başarılı
- [ ] git push origin main
