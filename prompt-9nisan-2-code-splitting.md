# CLAUDE CODE PROMPT — 9 Nisan 2026, Görev 2
# Code Splitting — Bundle Küçültme (680KB+ → React.lazy + Suspense)

## PROJE BAĞLAMI
- Repo: /opt/khp/tabbled/ (git repo root)
- Stack: React + Vite + TypeScript + shadcn/ui
- Mevcut bundle: 680KB+ (tek chunk, tüm sayfalar birlikte)
- Router: React Router DOM (src/App.tsx veya src/main.tsx'te tanımlı)
- Deploy: git push origin main → Vercel otomatik deploy

---

## SORUN
Tüm sayfalar tek bundle'da. QR tarayıp menü açan müşteri, SuperAdminDashboard ve RestaurantDashboard kodlarını da indiriyor. Bu gereksiz yük mobilde yavaşlık yaratıyor.

---

## YAPILACAKLAR

### Adım 1: Mevcut Route Yapısını İncele
```bash
cat src/App.tsx
# veya
cat src/main.tsx
```
Route tanımlarını bul. Muhtemelen şuna benzer:
```tsx
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import RestaurantDashboard from './pages/RestaurantDashboard';
import PublicMenu from './pages/PublicMenu';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Index from './pages/Index';
import PrivacyPolicy from './pages/PrivacyPolicy';
```

### Adım 2: Lazy Import'lara Çevir
Static import'ları React.lazy ile değiştir. **Index (landing page) ve PublicMenu lazy YAPILMAMALI** — bunlar ilk yüklenen sayfalar, lazy yapmak UX'i bozar.

```tsx
import React, { Suspense, lazy } from 'react';

// Hemen yüklenen sayfalar (kritik, ilk görünen)
import Index from './pages/Index';
import PublicMenu from './pages/PublicMenu';

// Lazy yüklenen sayfalar (login sonrası, admin panelleri)
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));
const RestaurantDashboard = lazy(() => import('./pages/RestaurantDashboard'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const NotFound = lazy(() => import('./pages/NotFound'));
```

### Adım 3: Suspense Wrapper Ekle
Route'ları Suspense ile sar. Loading fallback olarak basit bir loading göster:

```tsx
// Basit loading fallback bileşeni
const PageLoading = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <img 
        src="/tabbled-logo.png" 
        alt="Tabbled" 
        className="w-32 animate-pulse" 
      />
      <div className="flex gap-1">
        <div className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  </div>
);
```

Route'larda:
```tsx
<Route path="/login" element={
  <Suspense fallback={<PageLoading />}>
    <Login />
  </Suspense>
} />

<Route path="/dashboard" element={
  <Suspense fallback={<PageLoading />}>
    <Dashboard />
  </Suspense>
} />

// vs. tüm lazy sayfalar için
```

**Alternatif:** Tüm route'ları tek bir Suspense ile sarabilirsin:
```tsx
<Suspense fallback={<PageLoading />}>
  <Routes>
    {/* Eager loaded */}
    <Route path="/" element={<Index />} />
    <Route path="/menu/:slug" element={<PublicMenu />} />
    
    {/* Lazy loaded */}
    <Route path="/login" element={<Login />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/super-admin" element={<SuperAdminDashboard />} />
    <Route path="/restaurant" element={<RestaurantDashboard />} />
    <Route path="/privacy" element={<PrivacyPolicy />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
</Suspense>
```

### Adım 4: Vite Build Optimizasyonu Kontrol
`vite.config.ts` dosyasında `build.rollupOptions.output.manualChunks` ekle (eğer yoksa):

```typescript
// vite.config.ts
export default defineConfig({
  // ... mevcut config
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs', '@radix-ui/react-toast'],
        }
      }
    }
  }
});
```

**ÖNEMLİ:** manualChunks'a sadece package.json'da GERÇEKTEN OLAN paketleri ekle. Önce kontrol et:
```bash
cat package.json | grep -E "radix|supabase|react-dom|react-router"
```
Olmayan paketi ekleme, build hata verir.

### Adım 5: Build ve Sonuç Karşılaştırması

```bash
# Önce mevcut bundle boyutunu kaydet
npm run build 2>&1 | grep -E "dist/|chunk|index" | head -20

# Değişiklikleri yap, sonra tekrar build et
npm run build 2>&1 | grep -E "dist/|chunk|index" | head -20
```

Beklenen sonuç:
- Ana bundle (index): ~200-300KB (önceki: 680KB+)
- Admin chunk'lar: ayrı dosyalar olarak lazy yüklenecek
- Vendor chunk'lar: ayrı, cache'lenebilir dosyalar

---

## DOKUNMA KURALLARI

1. **Index.tsx (landing page) ve PublicMenu.tsx LAZY YAPMA** — bunlar eager yüklenmeli
2. **Mevcut route path'lerini değiştirme** — sadece import yöntemini değiştir
3. **shadcn/ui bileşenlerini değiştirme**
4. **Circum Icons import'larını değiştirme**
5. Eğer App.tsx'te `BrowserRouter` veya `RouterProvider` kullanılıyorsa yapısını bozma

---

## TEST ADIMLARI

1. `npm run build` — hata olmadığını doğrula
2. Build output'ta birden fazla chunk dosyası olduğunu doğrula
3. Ana chunk boyutunun öncekinden küçük olduğunu doğrula
4. Tarayıcıda test:
   - `tabbled.com` → landing page normal yüklensin
   - `tabbled.com/menu/abc-restaurant` → menü normal yüklensin
   - `tabbled.com/login` → login sayfası yüklensin (kısa loading flash olabilir, normal)
   - `tabbled.com/dashboard` → dashboard yüklensin
5. Console'da React lazy/Suspense hatası olmadığını doğrula

---

## GIT COMMIT
```bash
git add -A && git commit -m "perf: code splitting with React.lazy, reduce initial bundle size" && git push origin main
```
