# SSG Pre-rendering — Aşama 2: Implementation

**Proje:** swift-table-menu (tabbled.com)
**Branch:** `feature/ssg-prerendering` (YENİ — main'e DOKUNMA)
**Tahmini süre:** 2-3 saat
**Ön koşul:** Aşama 1 keşif raporu tamamlandı, kararlar verildi

---

## AŞAMA 1'DEN KARARLAR (BU PROMPT BU KARARLARA GÖRE YAZILDI)

1. **Router refactor:** Tam geçiş — `createBrowserRouter` + `RouteRecord[]` config
2. **`/menu/demo` çözümü:** `useState` initial value'da `slug === 'demo'` check
3. **Helmet stratejisi:** v3 ile dry-build yap, meta tag'ler boşsa v6'ya düşür
4. **`Blog.tsx` Helmet:** Ekle
5. **`NotFound` prerender:** Evet
6. **Sitemap:** Supabase Edge Function'da kalsın (vercel.json rewrite korunacak)
7. **Hardcoded Supabase creds:** Bu sprint'te dokunulmayacak

---

## KRİTİK KURALLAR

1. **Feature branch'te çalış.** Main'e direkt push YOK. Main'e merge en sonda, preview deploy doğrulandıktan sonra.
2. **Aşamalı dry-build.** Her büyük adımdan sonra `npm run build` çalıştır, başarılı olduğunu doğrula.
3. **Eğer herhangi bir adım patlarsa DUR.** Bir sonraki adıma geçme, durumu rapor et, müdahale iste.
4. **`build:spa` fallback script'ini koru.** Gerekirse hızlı rollback için.
5. **Vercel preview deploy kullan.** Main'e merge etmeden preview URL'inde test.
6. **SSG kapsam dışı sayfaları SPA olarak koru:** `/menu/:slug`, `/login`, `/onboarding`, `/dashboard`.
7. **Hardcoded Supabase creds'e dokunma.** Ayrı iş.

---

## ADIM 1: Feature branch oluştur

```bash
cd /opt/khp/tabbled
git status  # clean olduğunu doğrula
git checkout -b feature/ssg-prerendering
git push -u origin feature/ssg-prerendering  # remote'a push, Vercel preview tetiklenir
```

**Doğrulama:**
- `git branch --show-current` → `feature/ssg-prerendering`
- Vercel dashboard'da preview deployment başladı

---

## ADIM 2: `vite-react-ssg` kur

```bash
npm install --save-dev vite-react-ssg@latest
```

Versiyon kontrolü:
```bash
cat package.json | grep vite-react-ssg
```

**Not:** README'yi doğrulamak için kurulum sonrası:
```bash
cat node_modules/vite-react-ssg/README.md | head -100
```

Eğer README mevcut değilse:
```bash
# npm page'e bak:
npm view vite-react-ssg
```

---

## ADIM 3: `package.json` scripts güncelle

`build:spa` fallback koru. `build` artık SSG çalıştıracak.

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite-react-ssg build",
    "build:spa": "vite build",
    "preview": "vite preview"
  }
}
```

**Şu an çalıştırma** — önce router refactor gerek.

---

## ADIM 4: Router refactor — `src/routes.tsx` oluştur

Yeni dosya: `src/routes.tsx`

```tsx
import { lazy } from 'react';
import type { RouteRecord } from 'vite-react-ssg';

// Non-lazy: Index (landing) — LCP için kritik
import Index from '@/pages/Index';

// Lazy routes
const PublicMenu = lazy(() => import('@/pages/PublicMenu'));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
const Contact = lazy(() => import('@/pages/Contact'));
const Login = lazy(() => import('@/pages/Login'));
const Onboarding = lazy(() => import('@/pages/Onboarding'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Blog = lazy(() => import('@/pages/Blog'));
const BlogPost = lazy(() => import('@/pages/BlogPost'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Blog slug'larını build-time'da import et
import { blogPosts } from '@/lib/blogData';

export const routes: RouteRecord[] = [
  {
    path: '/',
    Component: Index,
    entry: 'src/pages/Index.tsx',  // vite-react-ssg için gerekirse
  },
  {
    path: '/blog',
    Component: Blog,
  },
  {
    path: '/blog/:slug',
    Component: BlogPost,
    // Dynamic route: SSG için blog slug'larını listele
    getStaticPaths: () => blogPosts.map(p => ({ slug: p.slug })),
  },
  {
    path: '/privacy',
    Component: PrivacyPolicy,
  },
  {
    path: '/iletisim',
    Component: Contact,
  },
  {
    path: '/menu/:slug',
    Component: PublicMenu,
    // Sadece /menu/demo prerender edilecek
    getStaticPaths: () => [{ slug: 'demo' }],
  },
  {
    path: '/login',
    Component: Login,
    entry: 'src/pages/Login.tsx',
  },
  {
    path: '/onboarding',
    Component: Onboarding,
  },
  {
    path: '/dashboard',
    Component: Dashboard,
  },
  {
    path: '*',
    Component: NotFound,
  },
];

// SSG için hangi path'ler prerender edilecek
export const includedRoutes = [
  '/',
  '/blog',
  '/iletisim',
  '/menu/demo',
  '/privacy',
  '/404',  // NotFound prerender
  ...blogPosts.map(p => `/blog/${p.slug}`),
];

// SSG dışında kalanlar (SPA fallback):
// '/menu/:slug' (demo hariç), '/login', '/onboarding', '/dashboard'
```

**DİKKAT:** `vite-react-ssg`'nin tam API'si versiyon bazında değişebilir. Önce `node_modules/vite-react-ssg/README.md` ve `node_modules/vite-react-ssg/dist/types.d.ts` dosyalarını oku, `RouteRecord` tipinin gerçek alanlarını kontrol et. Yukarıdaki kod taslaktır, mevcut API'ye uyarla.

---

## ADIM 5: `src/main.tsx` güncelle

Mevcut `main.tsx`:
```tsx
createRoot(document.getElementById("root")!).render(<App />);
```

Yeni `main.tsx`:
```tsx
import { ViteReactSSG } from 'vite-react-ssg';
import { routes } from './routes';

// Providers ve tüm App setup burada olacak
export const createRoot = ViteReactSSG(
  {
    routes,
    // includedRoutes vite.config.ts'e konulabilir veya buradan export edilebilir
  },
  ({ router, isClient, initialState }) => {
    // Router setup, provider'lar
    // App.tsx'ten taşınacak provider'lar burada
  }
);
```

**Önemli:** Provider'lar (`HelmetProvider`, `QueryClientProvider`, `TooltipProvider`) SSG callback içinde router'ı sarmalayacak şekilde düzenlenecek.

---

## ADIM 6: `src/App.tsx` refactor

Eski `App.tsx` içindeki `<BrowserRouter>`, `<Routes>`, `<Route>` blokları **kaldırılacak**. App.tsx artık **sadece provider'lar ve global UI** (Toaster, CookieBanner, FloatingWhatsApp vs.) içerecek.

```tsx
// src/App.tsx — REFACTORED
import { Outlet } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { queryClient } from '@/lib/queryClient';  // ayrı dosyaya almayı düşün
import CookieBanner from '@/components/CookieBanner';
import ConditionalWhatsApp from '@/components/ConditionalWhatsApp';
import ErrorBoundary from '@/components/ErrorBoundary';

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ErrorBoundary>
            <Outlet />  {/* Child route'lar burada render edilir */}
          </ErrorBoundary>
          <Toaster />
          <CookieBanner />
          <ConditionalWhatsApp />
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
```

**App artık bir route olacak** — `routes.tsx`'te root route olarak:

```tsx
export const routes: RouteRecord[] = [
  {
    path: '/',
    Component: App,  // Root layout
    children: [
      { path: '', Component: Index },
      { path: 'blog', Component: Blog },
      { path: 'blog/:slug', Component: BlogPost, getStaticPaths: ... },
      // ... diğerleri
    ],
  },
];
```

---

## ADIM 7: İlk dry-build (router refactor sonrası, SSG paketi öncesi test)

Henüz SSG build çalıştırma — önce dev sunucusu ile test et:

```bash
npm run dev
```

- http://localhost:5173/ → landing açılıyor mu?
- http://localhost:5173/blog → blog listesi?
- http://localhost:5173/blog/qr-menu-nedir → blog yazısı?
- http://localhost:5173/menu/ramada-encore-bayrampasa → Ramada menüsü?
- http://localhost:5173/dashboard → auth redirect çalışıyor mu?

**Eğer dev sunucusunda herhangi bir route patlıyorsa DUR.** Router refactor'u düzelt, devam etme.

---

## ADIM 8: `/menu/demo` fix

`src/pages/PublicMenu.tsx` içinde demo data'yı initial state'e hydrate et:

```tsx
import { demoRestaurant, demoCategories, demoItems } from '@/data/demoMenuData';

export default function PublicMenu() {
  const { slug } = useParams<{ slug: string }>();

  // Eskiden:
  // const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  // const [categories, setCategories] = useState<MenuCategory[]>([]);
  // const [items, setItems] = useState<MenuItem[]>([]);

  // Yeni:
  const isDemo = slug === 'demo';
  const [restaurant, setRestaurant] = useState<Restaurant | null>(
    isDemo ? (demoRestaurant as unknown as Restaurant) : null
  );
  const [categories, setCategories] = useState<MenuCategory[]>(
    isDemo ? (demoCategories as unknown as MenuCategory[]) : []
  );
  const [items, setItems] = useState<MenuItem[]>(
    isDemo ? (demoItems as unknown as MenuItem[]) : []
  );

  // Mevcut useEffect'ler kalır — demo olmayan slug'lar için Supabase'den çekmeye devam
  useEffect(() => {
    if (slug === 'demo') return;  // demo zaten initial state'te
    // ... mevcut Supabase fetch
  }, [slug]);

  // ...
}
```

**Ek:** `menu_page_views.insert` demo için atlansın (keşif raporunda Bulgu 4):

```tsx
useEffect(() => {
  if (slug === 'demo') return;  // demo için analitik yazma
  supabase.from('menu_page_views').insert({ ... });
}, [slug]);
```

---

## ADIM 9: `Blog.tsx`'e Helmet ekle

`src/pages/Blog.tsx` başına:

```tsx
import { Helmet } from 'react-helmet-async';

export default function Blog() {
  return (
    <>
      <Helmet>
        <title>Blog — Tabbled | QR Menü ve Restoran Dijital Dönüşüm Rehberi</title>
        <meta
          name="description"
          content="QR menü, dijital menü, restoran SEO, yasal uyum ve dijital dönüşüm rehberleri. Tabbled blog ile restoranınızı 2026 için hazırlayın."
        />
        <link rel="canonical" href="https://tabbled.com/blog" />
        <meta property="og:title" content="Tabbled Blog — QR Menü ve Restoran Rehberi" />
        <meta property="og:description" content="QR menü yönetmeliği, fiyatlandırma, tasarım stratejileri ve daha fazlası." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://tabbled.com/blog" />
      </Helmet>
      {/* Mevcut içerik */}
    </>
  );
}
```

---

## ADIM 10: İlk SSG build denemesi

```bash
npm run build
```

**Beklenen output:**
```
dist/
  index.html          (ana landing)
  blog/
    index.html        (blog listesi)
    qr-menu-nedir/index.html
    qr-menu-fiyatlari-2026/index.html
    ... (tüm 10 blog)
  iletisim/index.html
  menu/
    demo/index.html
  privacy/index.html
  404.html
  assets/ (JS/CSS bundles)
```

**Eğer build PATLAR:**
- Hata mesajını oku
- Yaygın hatalar:
  - `window is not defined` → ilgili component'i `ClientOnly` ile sar veya `typeof window !== 'undefined'` guard ekle
  - `document is not defined` → aynı şekilde
  - `ReferenceError: X is not defined` → SSR-uyumsuz bir paket var, izole et
- Çözüm bulunamıyorsa **DUR**, durumu raporla

---

## ADIM 11: Helmet doğrulaması (KRİTİK TEST)

Build başarılıysa, üretilen HTML'de meta tag'lerin dolu olduğunu kontrol et:

```bash
# Blog yazısı title'ı yazıya özel mi?
cat dist/blog/qr-menu-nedir/index.html | grep -o "<title>[^<]*</title>"

# Landing title'ı doğru mu?
cat dist/index.html | grep -o "<title>[^<]*</title>"

# Meta description dolu mu?
cat dist/blog/qr-menu-nedir/index.html | grep -o '<meta name="description"[^>]*>'

# JSON-LD schema var mı?
cat dist/blog/qr-menu-nedir/index.html | grep -c "application/ld+json"

# Canonical link yazıya özel mi?
cat dist/blog/qr-menu-nedir/index.html | grep "canonical"
```

### Helmet BAŞARI kriteri:
- [ ] Landing title: "Tabbled — Otel ve Restoranlar için QR Dijital Menü" (veya mevcut olan)
- [ ] Blog yazısı title'ı **YAZIYA ÖZEL** (örn. "QR Menü Nedir? 2026 Rehberi")
- [ ] Her blog yazısının meta description'ı farklı
- [ ] JSON-LD schema dolu
- [ ] Canonical link yazı path'ine özel

### Helmet BAŞARISIZSA (v3 uyumsuzsa):

Semptom: Tüm HTML dosyalarında aynı generic title var (sayfa-özel değil).

**Rollback planı:**

```bash
# react-helmet-async'i v6 (non-async)'a düşür
npm uninstall react-helmet-async
npm install react-helmet@6.1.0
npm install --save-dev @types/react-helmet

# Import'ları güncelle (7 dosya):
# - src/pages/Index.tsx:99
# - src/pages/Contact.tsx:78
# - src/pages/BlogPost.tsx:70
# - src/pages/Onboarding.tsx:681
# - src/pages/NotFound.tsx:14
# - src/pages/PublicMenu.tsx:1061
# - src/pages/PrivacyPolicy.tsx:43
# - src/pages/Blog.tsx (yeni)

# Her dosyada:
# import { Helmet } from 'react-helmet-async'  →  import { Helmet } from 'react-helmet'

# App.tsx'te:
# import { HelmetProvider } from 'react-helmet-async'  →  (kaldır, react-helmet v6'da provider yok)
# <HelmetProvider>...</HelmetProvider>  →  sadece children
```

sed ile toplu değiştirme:
```bash
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's|from .react-helmet-async.|from "react-helmet"|g' {} \;
```

Sonra `App.tsx`'te `HelmetProvider` wrapper'ını kaldır.

Tekrar build et ve Helmet testini yeniden çalıştır.

---

## ADIM 12: ClientOnly guard audit

Build başarılı ama bazı componentler hydration warning veriyorsa:

**Öncelikli audit hedefleri (keşif raporundan):**

1. **`CookieBanner.tsx`** — `localStorage`/`document.cookie` okur
```tsx
useEffect(() => {
  const consent = localStorage.getItem('cookie-consent');
  // ...
}, []);
```
Zaten `useEffect`'te olduğu için SSG-safe olmalı. Hydration mismatch varsa `ClientOnly` sar.

2. **`FloatingWhatsApp.tsx`** — `window`/`scroll` dinleyebilir
   - Dosyayı aç, `window`/`document` referanslarını kontrol et
   - Varsa `useEffect`'e al veya `ClientOnly` sar

3. **`AnimatedLogo`** — `framer-motion`
   - Hydration warning geliyorsa `initial={false}` prop'u ekle (framer-motion SSR fix)

4. **`DOMPurify`** (`BlogPost.tsx`, `PublicMenu.tsx`)
   - Node'da çalışmaz; `vite-react-ssg` JSDOM sağlıyorsa sorun yok
   - Hata varsa `typeof window !== 'undefined' ? DOMPurify.sanitize(html) : html` guard

**ClientOnly component (gerekirse oluştur):**

```tsx
// src/components/ClientOnly.tsx
import { useState, useEffect, ReactNode } from 'react';

export function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <>{fallback}</>;
  return <>{children}</>;
}
```

---

## ADIM 13: `vercel.json` güncelle

Mevcut `vercel.json`:
```json
{
  "rewrites": [
    { "source": "/sitemap.xml", "destination": "..." },
    { "source": "/(.*)", "destination": "/index.html" }   // ← BU SPA CATCH-ALL
  ]
}
```

**Sorun:** SSG sonrası her sayfa kendi `index.html`'ini üretti. `/(.*) → /index.html` rewrite'ı bu dosyaları ezer — Google yine generic shell görür.

**Yeni `vercel.json`:**

```json
{
  "rewrites": [
    { "source": "/sitemap.xml", "destination": "https://qmnrawqvkwehufebbkxp.supabase.co/functions/v1/sitemap" },
    { "source": "/menu/:slug((?!demo$).*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    },
    {
      "source": "/(.*\\.woff2)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }
  ]
}
```

**Açıklama:**
- Sitemap rewrite korundu
- Yeni rewrite: `/menu/demo` HARİÇ tüm `/menu/:slug`'lar SPA fallback olarak `/index.html`'e yönlenir (dinamik restoran menüleri)
- SPA catch-all kaldırıldı — diğer path'ler Vercel'in static file serving'ine düşer (SSG'nin ürettiği HTML'leri)
- Login, dashboard, onboarding SSG'de yok → Vercel 404'e düşer → client-side router alır (SPA behavior)

**Dikkat:** Regex `:slug((?!demo$).*)` negative lookahead. Vercel rewrite syntax'ına göre alternatif: iki ayrı rewrite.

Alternatif (basit):
```json
{
  "rewrites": [
    { "source": "/sitemap.xml", "destination": "..." },
    { "source": "/login", "destination": "/index.html" },
    { "source": "/onboarding", "destination": "/index.html" },
    { "source": "/dashboard", "destination": "/index.html" },
    { "source": "/dashboard/(.*)", "destination": "/index.html" },
    { "source": "/menu/((?!demo$).*)", "destination": "/index.html" }
  ]
}
```

---

## ADIM 14: Feature branch push & preview deploy

```bash
git add -A
git status  # değişen dosyaları gözden geçir
git diff --stat

git commit -m "feat: ssg pre-rendering with vite-react-ssg

- router refactor to createBrowserRouter + RouteRecord
- /menu/demo initial state hydration for prerender
- Blog.tsx helmet meta tags
- vercel.json SPA fallback only for dynamic routes
- clientonly guards for browser-dependent components"

git push origin feature/ssg-prerendering
```

**Vercel preview URL:** Dashboard'dan al (genelde `swift-table-menu-git-feature-ssg-prerendering-[user].vercel.app`)

---

## ADIM 15: Preview URL üzerinde curl testi

```bash
# Preview URL'i bir değişkene koy
PREVIEW="https://swift-table-menu-git-feature-ssg-prerendering-XXX.vercel.app"

# Her SSG sayfası için title kontrolü
curl -s $PREVIEW/ | grep -oE "<title>[^<]+</title>"
curl -s $PREVIEW/blog | grep -oE "<title>[^<]+</title>"
curl -s $PREVIEW/blog/qr-menu-nedir | grep -oE "<title>[^<]+</title>"
curl -s $PREVIEW/blog/qr-menu-fiyatlari-2026 | grep -oE "<title>[^<]+</title>"
curl -s $PREVIEW/iletisim | grep -oE "<title>[^<]+</title>"
curl -s $PREVIEW/privacy | grep -oE "<title>[^<]+</title>"
curl -s $PREVIEW/menu/demo | grep -oE "<title>[^<]+</title>"

# Her biri farklı, sayfaya özel title vermeli

# Hash testi: farklı URL'lerin HTML'i farklı mı?
curl -s $PREVIEW/ | md5sum
curl -s $PREVIEW/blog/qr-menu-nedir | md5sum
curl -s $PREVIEW/iletisim | md5sum
# Üç hash de farklı olmalı

# Dinamik route'un SPA fallback'i:
curl -s $PREVIEW/menu/ramada-encore-bayrampasa | grep -oE "<title>[^<]+</title>"
# Bu generic "Tabbled" title verebilir — sorun değil, bu sayfa SPA olarak kalıyor

# Auth route'lar:
curl -s $PREVIEW/dashboard | head -20
curl -s $PREVIEW/login | head -20
# SPA shell dönmeli (generic HTML, JS yüklenecek)
```

---

## ADIM 16: Tarayıcı testi (manuel)

Preview URL'i tarayıcıda aç:

**SSG sayfaları — view-source ile HTML'e bak, içerik dolu mu:**
- [ ] `/` — Hero, Features, Pricing, FAQ dolu
- [ ] `/blog` — 10 yazının listesi görünüyor
- [ ] `/blog/qr-menu-nedir` — yazı içeriği HTML'de
- [ ] `/iletisim` — form ve başlık dolu
- [ ] `/privacy` — privacy content
- [ ] `/menu/demo` — demo menü kategorileri ve ürünleri HTML'de

**Dinamik/auth sayfaları — tarayıcıda JS render sonrası çalışıyor mu:**
- [ ] `/menu/ramada-encore-bayrampasa` — Ramada menüsü yükleniyor (SPA)
- [ ] `/dashboard` — login'e redirect
- [ ] `/login` — login formu çalışıyor
- [ ] Login sonrası dashboard açılıyor

**Cookie banner, WhatsApp float, 404 sayfası — çalışıyor mu?**

---

## ADIM 17: Lighthouse testi (opsiyonel ama önerilen)

Preview URL için:
```bash
# Chrome DevTools Lighthouse ya da:
npx lighthouse $PREVIEW/blog/qr-menu-nedir --only-categories=seo,performance --output=html --output-path=./lighthouse-blog.html
```

**Beklenen:**
- SEO: 95-100
- Performance: LCP < 2.5s
- Meta tag'ler doğru algılanıyor

---

## ADIM 18: Main'e merge (son adım)

Eğer tüm testler geçtiyse:

```bash
git checkout main
git pull origin main
git merge feature/ssg-prerendering
git push origin main
```

Production deploy Vercel'de otomatik başlar. Production URL üzerinde Adım 15-16'daki testleri tekrarla:

```bash
curl -s https://tabbled.com/ | grep -oE "<title>[^<]+</title>"
curl -s https://tabbled.com/blog/qr-menu-nedir | grep -oE "<title>[^<]+</title>"
```

---

## ROLLBACK PLANI

Production patlar ve hızlı geri dönmek gerekirse:

### Plan A — Vercel'de instant rollback
Vercel dashboard → Deployments → bir önceki deploy → "Promote to Production"

### Plan B — Build script'i SPA'ya döndür
```bash
# package.json: "build": "vite build" (yani build:spa)
sed -i 's|"build": "vite-react-ssg build"|"build": "vite build"|' package.json
git add package.json
git commit -m "revert: rollback to SPA build"
git push origin main
```

### Plan C — Tam revert
```bash
git revert <merge-commit-hash>
git push origin main
```

---

## SUCCESS CRITERIA — BU PROMPT'UN BİTMİŞ SAYILMASI İÇİN

- [ ] Feature branch'te çalışıldı, main'e sadece preview doğrulaması sonrası merge edildi
- [ ] `npm run build` başarıyla tamamlanıyor
- [ ] `dist/` içinde 16 adet `.html` dosyası var: landing + blog listesi + 10 blog yazısı + iletisim + privacy + menu/demo + 404
- [ ] Her HTML dosyasında sayfa-özel title, description, canonical, JSON-LD var
- [ ] `md5sum` ile 3 farklı URL'in hash'i farklı
- [ ] Dinamik restoran menüleri (`/menu/ramada-encore-bayrampasa`) hâlâ SPA olarak çalışıyor
- [ ] Auth route'lar (login, onboarding, dashboard) SPA olarak çalışıyor
- [ ] Preview deploy'da tarayıcıda gözle kontrol edildi — regresyon yok
- [ ] Cookie banner, WhatsApp widget, toast'lar çalışıyor
- [ ] Production deploy canlı, `curl https://tabbled.com/blog/qr-menu-nedir` yazıya özel title dönüyor

---

## RAPOR FORMATI (Aşama 2 sonu)

İş bitince `/opt/khp/tabbled/ssg-asama-2-rapor.md` dosyasına aşağıdakileri yaz:

```markdown
# SSG Aşama 2 Raporu

- Branch: feature/ssg-prerendering (merged to main: EVET/HAYIR)
- Build süresi (SSG sonrası): X saniye (baseline 17.3s idi)
- Helmet stratejisi: v3 çalıştı / v6'ya düşüldü
- Build'de karşılaşılan hatalar ve çözümleri: [...]
- ClientOnly guard eklenen componentler: [...]
- Beklenmedik bulgular / tech debt: [...]
- Preview URL: [...]
- Production smoke test sonuçları: [...]
- Lighthouse SEO skoru: [...]

## Kalan işler (bu sprint'te yapılmayan)
- /hakkimizda sayfası oluşturulmadı (ayrı iş)
- Supabase creds env zorunluluğuna çevrilmedi (ayrı iş)
- /menu/:slug için SSR/ISR (gelecek sprint)
```

---

## GENEL KURALLAR

1. **Her adım sonrası doğrulama yap.** Atla demeden bir sonrakine geçme.
2. **Hata çıkarsa DUR.** Bir sonraki adıma geçmeden önce hatayı anla ve düzelt.
3. **Türkçe ile İngilizce karışmasın.** Commit mesajları İngilizce, kod yorumları İngilizce, UI string'leri Türkçe (mevcut durum korunacak).
4. **Hardcoded Supabase creds'e DOKUNMA.** Ayrı iş.
5. **`/menu/:slug` için SSR denemesi YAPMA.** Sadece `/menu/demo` prerender. Diğer slug'lar SPA.

---

**END OF PROMPT — Aşama 2**

İş bitince raporu `/opt/khp/tabbled/ssg-asama-2-rapor.md`'ye yaz, Murat'a ilet.
