# TABBLED — P1 TEKNİK İYİLEŞTİRMELER
## Claude Code Prompt — 11 Nisan 2026

---

## PROJE BAĞLAMI

- **Repo:** /opt/khp/tabbled/ (GitHub: kiranmurat-source/swift-table-menu)
- **Stack:** React + Vite + TypeScript + shadcn/ui + Supabase
- **Supabase:** qmnrawqvkwehufebbkxp.supabase.co
- **Deploy:** Vercel (otomatik git push)
- **Domain:** tabbled.com
- **İkon:** Circum Icons (react-icons/ci) — shadcn/ui internal Lucide'a DOKUNMA
- **Font:** Playfair Display (başlıklar) + Inter (body)
- **Mevcut style convention:** S.* inline style objesi (shadcn/ui bileşenleri KULLANILMIYOR, native HTML + S.* pattern)
- **GA ID:** G-X70X9BM3SX

---

## GÖREV: 4 TEKNİK İYİLEŞTİRME

---

## ÖZELLİK 1: GOOGLE TRANSLATE API KEY RESTRICT

### Amaç
Google Cloud Console'da API key'i sadece Cloud Translation API ile sınırla. Bu bir kod değişikliği DEĞİL, sadece talimat.

### Yapılacak (Manuel — Murat yapacak)
1. Google Cloud Console → APIs & Services → Credentials
2. translate-menu Edge Function'da kullanılan API key'i bul
3. "Restrict key" → "API restrictions" → "Restrict key"
4. Sadece "Cloud Translation API" seç
5. Kaydet

### Kod Değişikliği
- YOK. Bu tamamen Google Cloud Console'da yapılacak.
- Edge function'da (`supabase/functions/translate-menu/index.ts`) değişiklik gerekmez.

---

## ÖZELLİK 2: ERROR BOUNDARY COMPONENT

### Amaç
React uygulamasında beklenmeyen hatalar olduğunda beyaz ekran yerine kullanıcı dostu hata sayfası göster.

### Yeni Dosya: src/components/ErrorBoundary.tsx
```typescript
import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'Inter, sans-serif',
          background: '#fafafa',
        }}>
          <img
            src="/tabbled-logo.png"
            alt="Tabbled"
            style={{ height: 40, marginBottom: 24 }}
          />
          <h1 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#111',
            marginBottom: 8,
          }}>
            Bir şeyler ters gitti
          </h1>
          <p style={{
            color: '#666',
            fontSize: '0.95rem',
            fontWeight: 300,
            marginBottom: 24,
            maxWidth: 400,
          }}>
            Sayfa yüklenirken beklenmeyen bir hata oluştu. Lütfen sayfayı yenileyin.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 24px',
              background: '#111',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: '0.9rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Sayfayı Yenile
          </button>
          {import.meta.env.DEV && this.state.error && (
            <pre style={{
              marginTop: 24,
              padding: 16,
              background: '#fee',
              borderRadius: 8,
              fontSize: '0.75rem',
              color: '#c00',
              maxWidth: '90vw',
              overflow: 'auto',
              textAlign: 'left',
            }}>
              {this.state.error.message}
              {'\n'}
              {this.state.error.stack}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### App.tsx veya main.tsx'e Entegrasyon
- En üst seviyede `<ErrorBoundary>` ile sar:
```tsx
import ErrorBoundary from './components/ErrorBoundary';

// Router'ın etrafını sar
<ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      {/* mevcut routes */}
    </BrowserRouter>
  </QueryClientProvider>
</ErrorBoundary>
```

### Lazy Load Sayfaları İçin Ayrı Boundary
- Dashboard, SuperAdmin gibi lazy-loaded sayfalarda Suspense fallback zaten var (PageLoading)
- ErrorBoundary ana seviyede yeterli, her sayfaya ayrı sarmaya gerek yok

---

## ÖZELLİK 3: LOADING SKELETON'LARI

### Amaç
Dashboard ve menü sayfaları yüklenirken içerik alanlarında skeleton (iskelet) animasyonu göster. Mevcut branded loading (pembe logo + bouncing dots) KORUNSUN — skeleton'lar sayfa yüklendikten sonra veri beklerken gösterilsin.

### Yeni Dosya: src/components/Skeleton.tsx
```typescript
import React from 'react';

// Mevcut S.* inline style convention'a uygun
const shimmerStyle: React.CSSProperties = {
  background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
  borderRadius: 8,
};

// CSS animation — index.css'e eklenecek
// @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: number;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => (
  <div style={{ ...shimmerStyle, width, height, borderRadius, ...style }} />
);

// Dashboard stat kartı skeleton
export const StatCardSkeleton: React.FC = () => (
  <div style={{ padding: 20, background: '#fff', borderRadius: 12, border: '1px solid #eee' }}>
    <Skeleton width={80} height={14} style={{ marginBottom: 12 }} />
    <Skeleton width={120} height={32} style={{ marginBottom: 8 }} />
    <Skeleton width={60} height={12} />
  </div>
);

// Ürün satırı skeleton
export const MenuItemSkeleton: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
    <Skeleton width={56} height={56} borderRadius={8} />
    <div style={{ flex: 1 }}>
      <Skeleton width="60%" height={16} style={{ marginBottom: 6 }} />
      <Skeleton width="40%" height={12} />
    </div>
    <Skeleton width={80} height={20} />
  </div>
);

// Kategori tab skeleton
export const CategoryTabSkeleton: React.FC = () => (
  <div style={{ display: 'flex', gap: 8, padding: '12px 0', overflowX: 'hidden' }}>
    {[1, 2, 3, 4].map(i => (
      <Skeleton key={i} width={90} height={36} borderRadius={20} />
    ))}
  </div>
);

// Genel liste skeleton
export const ListSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div>
    {Array.from({ length: rows }).map((_, i) => (
      <MenuItemSkeleton key={i} />
    ))}
  </div>
);
```

### index.css'e Ekle
```css
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Kullanım Yerleri

#### RestaurantDashboard.tsx
- Kategoriler yüklenirken: `<CategoryTabSkeleton />`
- Ürünler yüklenirken: `<ListSkeleton rows={5} />`
- Mevcut loading state'lerini kontrol et, `isLoading` veya `!data` durumunda skeleton göster

#### PublicMenu.tsx
- Public menüde branded loading (pembe logo) zaten var — skeleton EKLEME
- Branded loading yeterli, skeleton sadece admin panel için

#### SuperAdminDashboard.tsx
- KPI dashboard yüklenirken: `<StatCardSkeleton />` × 4
- Restoran listesi yüklenirken: `<ListSkeleton rows={8} />`

---

## ÖZELLİK 4: SEO OPTİMİZASYONU

### Amaç
Public menü sayfaları ve landing page için SEO iyileştirmesi. Meta tags, Open Graph, sitemap.

### 4a. react-helmet-async Kurulumu
```bash
npm install react-helmet-async
```

### 4b. HelmetProvider — App.tsx veya main.tsx
```tsx
import { HelmetProvider } from 'react-helmet-async';

// Router'ın etrafını sar
<HelmetProvider>
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* routes */}
      </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>
</HelmetProvider>
```

### 4c. Landing Page (Index.tsx) — Meta Tags
```tsx
import { Helmet } from 'react-helmet-async';

// Index component içinde
<Helmet>
  <title>Tabbled — Dijital Menü ve QR Kod Platformu | Restoran, Kafe, Otel</title>
  <meta name="description" content="Tabbled ile restoranınız için QR menü oluşturun. Dijital menü, çok dilli destek, allerjen bilgisi, promosyon yönetimi. Türkiye'nin en uygun fiyatlı dijital menü platformu." />
  <meta name="keywords" content="dijital menü, QR menü, restoran menü, kafe menü, otel menü, QR kod, Türkiye, fiyat etiketi yönetmeliği" />
  
  {/* Open Graph */}
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Tabbled — Dijital Menü ve QR Kod Platformu" />
  <meta property="og:description" content="Restoranınız için profesyonel dijital menü. Aylık 300₺'den başlayan fiyatlarla." />
  <meta property="og:image" content="https://tabbled.com/tabbled-logo.png" />
  <meta property="og:url" content="https://tabbled.com" />
  <meta property="og:site_name" content="Tabbled" />
  <meta property="og:locale" content="tr_TR" />
  
  {/* Twitter */}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Tabbled — Dijital Menü ve QR Kod Platformu" />
  <meta name="twitter:description" content="Restoranınız için profesyonel dijital menü. Aylık 300₺'den başlayan fiyatlarla." />
  <meta name="twitter:image" content="https://tabbled.com/tabbled-logo.png" />
  
  <link rel="canonical" href="https://tabbled.com" />
</Helmet>
```

### 4d. Public Menü (PublicMenu.tsx) — Dinamik Meta Tags
```tsx
import { Helmet } from 'react-helmet-async';

// restaurant verisi yüklendikten sonra
{restaurant && (
  <Helmet>
    <title>{restaurant.name} — Menü | Tabbled</title>
    <meta name="description" content={`${restaurant.name} dijital menüsü. ${restaurant.tagline || ''} ${restaurant.address || ''}`} />
    
    <meta property="og:type" content="restaurant.menu" />
    <meta property="og:title" content={`${restaurant.name} — Menü`} />
    <meta property="og:description" content={restaurant.tagline || `${restaurant.name} dijital menüsü`} />
    <meta property="og:image" content={restaurant.cover_url || restaurant.logo_url || 'https://tabbled.com/tabbled-logo.png'} />
    <meta property="og:url" content={`https://tabbled.com/menu/${restaurant.slug}`} />
    <meta property="og:site_name" content="Tabbled" />
    <meta property="og:locale" content="tr_TR" />
    
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={`${restaurant.name} — Menü`} />
    <meta name="twitter:description" content={restaurant.tagline || `${restaurant.name} dijital menüsü`} />
    <meta name="twitter:image" content={restaurant.cover_url || restaurant.logo_url || ''} />
    
    <link rel="canonical" href={`https://tabbled.com/menu/${restaurant.slug}`} />
  </Helmet>
)}
```

### 4e. robots.txt — public/robots.txt
```
User-agent: *
Allow: /
Allow: /menu/
Disallow: /dashboard
Disallow: /login

Sitemap: https://tabbled.com/sitemap.xml
```

### 4f. Sitemap — Dinamik Oluşturma

SPA olduğu için sitemap'i Vercel serverless function veya statik dosya olarak oluştur.

#### Seçenek A: Statik sitemap.xml (basit, şimdilik yeterli)
`public/sitemap.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.w3.org/2000/svg"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  <url>
    <loc>https://tabbled.com/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://tabbled.com/privacy</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>
```

NOT: Restoran menü sayfaları (/menu/:slug) dinamik olduğu için, ileride Supabase Edge Function ile dinamik sitemap oluşturulabilir. Şimdilik statik yeterli.

### 4g. index.html Güncellemeleri
Mevcut `index.html`'deki `<head>` bölümüne fallback meta tag'ler ekle (react-helmet override edecek ama SSR/crawler için):
```html
<meta name="description" content="Tabbled — Restoran, kafe ve oteller için dijital menü ve QR kod platformu. Aylık 300₺'den başlayan fiyatlarla." />
<meta property="og:title" content="Tabbled — Dijital Menü Platformu" />
<meta property="og:description" content="Restoranınız için profesyonel dijital menü." />
<meta property="og:image" content="https://tabbled.com/tabbled-logo.png" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
```

### 4h. Structured Data (JSON-LD) — Public Menü
PublicMenu.tsx'e restaurant schema ekle:
```tsx
{restaurant && (
  <Helmet>
    {/* ... diğer meta tags ... */}
    <script type="application/ld+json">
      {JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Restaurant",
        "name": restaurant.name,
        "description": restaurant.tagline || '',
        "address": restaurant.address || '',
        "telephone": restaurant.phone || '',
        "url": `https://tabbled.com/menu/${restaurant.slug}`,
        "image": restaurant.cover_url || restaurant.logo_url || '',
        "hasMenu": {
          "@type": "Menu",
          "url": `https://tabbled.com/menu/${restaurant.slug}`
        }
      })}
    </script>
  </Helmet>
)}
```

---

## UYGULAMA SIRASI

1. **Error boundary** — yeni dosya oluştur + App.tsx'e sar
2. **Loading skeleton** — yeni dosya oluştur + index.css shimmer animation + dashboard'lara ekle
3. **SEO** — react-helmet-async kur + meta tags ekle + robots.txt + sitemap.xml + JSON-LD
4. **Build & test**

Google Translate API key restrict → kod değişikliği yok, Murat manuel yapacak.

---

## DOSYALAR

### Yeni Dosyalar
- `src/components/ErrorBoundary.tsx`
- `src/components/Skeleton.tsx`
- `public/robots.txt`
- `public/sitemap.xml`

### Değişecek Dosyalar
- `src/App.tsx` veya `src/main.tsx` — ErrorBoundary + HelmetProvider wrapper
- `src/pages/Index.tsx` — Helmet meta tags
- `src/pages/PublicMenu.tsx` — Helmet dinamik meta tags + JSON-LD
- `src/pages/RestaurantDashboard.tsx` — skeleton kullanımı (loading state'lerde)
- `src/pages/SuperAdminDashboard.tsx` — skeleton kullanımı (loading state'lerde)
- `src/index.css` — shimmer keyframe animation
- `index.html` — fallback meta tags

### Dokunulmayacak
- Landing page bileşenleri (Navbar, Hero vs.) — sadece Index.tsx'e Helmet eklenir
- Login.tsx
- Edge function'lar
- public/allergens/
- shadcn/ui internal bileşenleri

---

## DİKKAT EDİLECEKLER

- `react-helmet-async` kullan (`react-helmet` DEĞİL — deprecated)
- ErrorBoundary class component olmalı (React hook'lar error boundary desteklemez)
- Skeleton sadece admin panel'de — public menüde branded loading (pembe logo) korunacak
- sitemap.xml namespace: `http://www.sitemaps.org/schemas/sitemap/0.9` (SVG değil!)
- robots.txt /dashboard ve /login'i disallow et
- Open Graph image için tabbled-logo.png kullanılıyor — ileride özel OG image yapılabilir
- Mevcut style convention: S.* inline styles (shadcn/ui kullanma)
