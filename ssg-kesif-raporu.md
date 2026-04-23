# SSG Pre-rendering Keşif Raporu

**Tarih:** 2026-04-22
**Branch:** `main`
**Değişiklik yapıldı mı:** HAYIR (sadece keşif — tek yazma işlemi bu rapor dosyası)
**Baseline build:** bir kez çalıştırıldı (Görev 7, zorunlu)

---

## 1. Router Yapısı

- **Pattern:** `<BrowserRouter>` + inline `<Route>` JSX (flat, nested yok, guard component yok)
- **Dosya:** `src/App.tsx` — router kurulumu satırlar **50–67**
- **Giriş noktası:** `src/main.tsx` yalnızca `createRoot(...).render(<App />)` çağırır; tüm sağlayıcılar (`HelmetProvider`, `QueryClientProvider`, `TooltipProvider`, `BrowserRouter`) `App.tsx` içinde
- **Auth guard yok:** `Dashboard`, `Onboarding` gibi korumalı sayfalar route seviyesinde `ProtectedRoute` benzeri bir wrapper ile sarılmamış; korumayı sayfa içinden `useAuth` ile yapıyorlar (aşama 2 için not: SSG bu sayfaları prerender etmeye çalışmamalı)
- **Refactor gerekli:** **EVET** — bkz. Risk 1

### Route Listesi

| Path              | Component       | Lazy?  | Auth | SSG Aday | Not                                      |
| ----------------- | --------------- | ------ | ---- | -------- | ---------------------------------------- |
| `/`               | `Index`         | HAYIR  | —    | EVET     | Landing, tamamen statik içerik           |
| `/menu/:slug`     | `PublicMenu`    | lazy   | —    | KISMİ    | Sadece `/menu/demo` prerender edilebilir |
| `/privacy`        | `PrivacyPolicy` | lazy   | —    | EVET     | Tamamen statik, iki dilli state içi      |
| `/iletisim`       | `Contact`       | lazy   | —    | EVET     | Supabase yalnız `onSubmit`'te            |
| `/login`          | `Login`         | lazy   | —    | HAYIR    | Auth akışı                               |
| `/onboarding`     | `Onboarding`    | lazy   | auth | HAYIR    | Guard sayfa içinde                       |
| `/dashboard`      | `Dashboard`     | lazy   | auth | HAYIR    | Guard sayfa içinde, büyük bundle         |
| `/blog`           | `Blog`          | lazy   | —    | EVET     | Statik liste, `blogData.ts`'ten          |
| `/blog/:slug`     | `BlogPost`      | lazy   | —    | EVET     | 10 slug build-time prerender             |
| `*`               | `NotFound`      | lazy   | —    | OPSİYON  | 404 sayfası için de prerender edilebilir |

---

## 2. Supabase Audit

### Supabase client'ı import eden tüm dosyalar (34 dosya)

Tam liste (`grep` çıktısından):

```
src/lib/supabase.ts                                  (client tanımı)
src/lib/useAuth.ts
src/lib/aiCredits.ts
src/lib/imageUtils.ts
src/hooks/useAICredits.ts
src/hooks/useCurrency.ts
src/hooks/useLikes.ts
src/pages/Contact.tsx                                  ← SSG scope
src/pages/PublicMenu.tsx                               ← SSG scope (partial)
src/pages/Dashboard.tsx
src/pages/Login.tsx
src/pages/Onboarding.tsx
src/pages/RestaurantDashboard.tsx
src/pages/SuperAdminDashboard.tsx
src/components/admin/{LegalSettings,MediaLibrary,MediaPickerModal,MenuImport,PhotoEnhance}.tsx
src/components/{AnalyticsPanel,CartDrawer,CustomersPanel,DiscountCodeInput,
                DiscountCodesPanel,FeedbackModal,FeedbackPanel,LikesPanel,
                NotificationsPanel,ProfilePanel,PromosPanel,QRManager,
                TranslationCenter,WaiterCallBar,WaiterCallsPanel}.tsx
src/components/dashboard/RestaurantAnalytics.tsx
src/components/public/ReviewsSection.tsx
```

### Modül seviyesi davranış (kritik)

`src/lib/supabase.ts` (11 satır):

```ts
const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

- `createClient` modül import edildiğinde çağrılır — **ağ isteği yapmaz**, sadece bir istemci nesnesi kurar. SSG/SSR sırasında Node'da bunun çalışması güvenlidir.
- URL ve anon key için **hardcoded fallback** mevcut (`qmnrawqvkwehufebbkxp.supabase.co` + anon JWT). Env var olmadan build patlamaz.
- Ama: `@supabase/supabase-js`'in kendisi bazı sürümlerinde `WebSocket` / `globalThis.window` referansları içerebilir. Aşama 2'de ilk dry-build'te doğrulanmalı.

### Risk: YÜKSEK olan sayfalar (SSG'de patlar)

**Yok — render-zamanı Supabase çağrısı yapan SSG-scope sayfa yok.**

Tüm SSG aday sayfalarında Supabase çağrıları ya `useEffect` içinde (render sonrası, browser-only) ya da event handler'da (örn. form submit). SSG ilk HTML'i üretmek için component'i bir kez render eder — `useEffect` tetiklenmez.

### Risk: ORTA (içerik eksik kalır)

- **`/menu/demo`** — `PublicMenu.tsx` satır 397'de demo bypass var:
  ```ts
  if (slug === 'demo') {
    setRestaurant(demoRestaurant as unknown as Restaurant);
    setCategories(demoCategories as unknown as MenuCategory[]);
    setItems(demoItems as unknown as MenuItem[]);
  }
  ```
  Ama bu kod bir `useEffect` içinde (satır 391). SSG, component'i ilk kez render ettiğinde `restaurant` state'i hâlâ `null`; prerender edilen HTML "yükleniyor" ekranıdır, demo menü içeriği değil. SEO/OG açısından bu çoğu için yeterli (`<Helmet>` yine de doluyor mu? Hayır — satır 1061 Helmet `!restaurant` erken dönüşünden SONRA). **Aşama 2'de demo verisi render'da (useEffect dışı) hydrate edilmeli** — bkz. Risk 2.

### Risk: DÜŞÜK (render-safe)

| Sayfa          | Supabase import | Render'da çağrı? | Not                                                     |
| -------------- | --------------- | ---------------- | ------------------------------------------------------- |
| `Index.tsx`    | HAYIR           | —                | Landing tamamen statik                                  |
| `Blog.tsx`     | HAYIR           | —                | `blogData.ts`'ten okur                                  |
| `BlogPost.tsx` | HAYIR           | —                | `blogData.ts` + `blogUtils.ts`; DOMPurify var (aşağıda) |
| `Contact.tsx`  | EVET            | HAYIR            | `supabase.functions.invoke("contact-form")` sadece `onSubmit` |
| `PrivacyPolicy.tsx` | HAYIR      | —                | İki dilli static içerik, useState(lang)                 |
| `NotFound.tsx` | HAYIR           | —                | Basit 404, Helmet dışında bağımlılık yok                |

Ayrıca `src/components/landing/*` alt ağacı ve blog componentleri (`BlogBreadcrumb`, `BlogTOC`, `BlogFAQ`, `BlogCard`, `BlogCTA`), `CookieBanner`, `FloatingWhatsApp`, `ErrorBoundary` — **Supabase'siz**, prerender-safe.

### Ek risk: DOMPurify

`BlogPost.tsx` ve `PublicMenu.tsx` `dompurify` kullanıyor. `dompurify` `window`/`DOMParser` ister; Node.js'te doğrudan çalışmaz. `vite-react-ssg` JSDOM sağlar ama yine de aşama 2'de doğrulanmalı.

---

## 3. Route: /hakkimizda

- **Mevcut mu:** HAYIR
- `src/pages/` içinde `Hakkimizda.tsx`, `About.tsx` veya benzeri bir dosya yok
- `App.tsx` route tablosunda `/hakkimizda` veya `/about` yok
- Tek eşleşme `src/pages/PrivacyPolicy.tsx:71`'de gövde metni içinde "hakkında" kelimesi — route/sayfa ile ilgisi yok
- **Aşama 2 kararı:** ya SSG kapsamından çıkar, ya da önce sayfa oluştur (ayrı bir iş)

---

## 4. Blog Data

- **Dosya:** `src/lib/blogData.ts` (`src/data/` değil — dikkat)
- **Export:** `blogPosts: BlogPost[]` + yardımcılar `getPostBySlug`, `getPostsByCategory`, `getRelatedPosts`, `getAllCategories`
- **Yapı alanları:** `slug`, `title`, `metaTitle`, `metaDescription`, `category`, `categoryLabel`, `excerpt`, `content` (HTML string), `author`, `publishedAt`, `updatedAt`, `readingTime`, `image?`, `ogImage?`, `tags`, `faq?`, `relatedSlugs`
- **Kategori enum'u:** `'yasal' | 'rehber' | 'ipuclari' | 'urun'`
- **Blog sayısı:** **10 post**

### Slug listesi (SSG `getStaticPaths` için hazır)

```
qr-menu-zorunlulugu-2026
qr-menu-nedir
qr-menu-fiyatlari-2026
restoran-dijital-donusum-rehberi-2026
restoran-menu-tasarimi-stratejileri
restoran-alerjen-bilgilendirme-rehberi
restoran-musteri-deneyimi-dijital-yolculuk
restoran-seo-google-haritalar-rehberi
cok-dilli-menu-rehberi-turist-restoran
restoran-acmak-teknoloji-yatirim-rehberi-2026
```

- **SSG import:** `import { blogPosts } from '../lib/blogData'` veya `'@/lib/blogData'` (alias `tsconfig` / `vite.config`'te tanımlı)
- **getStaticPaths bir tek satırla türetilir:** `blogPosts.map(p => \`/blog/${p.slug}\`)`

---

## 5. Helmet Kullanımı

- **Sürüm:** `react-helmet-async: ^3.0.0` (`package.json`'dan)
- **Provider:** `src/App.tsx:44` — tüm ağacı sarıyor (`<HelmetProvider>`)
- **Sağlayıcı import:** `src/App.tsx:7`
- **Kullanan sayfalar:**
  - `src/pages/Index.tsx:99` (landing schema + meta)
  - `src/pages/Contact.tsx:78`
  - `src/pages/BlogPost.tsx:70` (Article + Breadcrumb + FAQ JSON-LD)
  - `src/pages/Onboarding.tsx:681`
  - `src/pages/NotFound.tsx:14`
  - `src/pages/PublicMenu.tsx:1061` (restaurant/menu schema)
  - `src/pages/PrivacyPolicy.tsx:43`
- **Not:** `Blog.tsx` (liste sayfası) Helmet kullanmıyor! SSG'de `<title>/<meta description>` default `index.html`'den gelir — **Aşama 2'de Blog.tsx'e Helmet eklenmeli** (küçük iş, beklenmedik bulgu).

### SSG uyumluluğu

- `react-helmet-async` v3 React 18 concurrent mode ile çalışır, SSR API'si mevcut (`HelmetProvider` `context` prop'u ile).
- **ANCAK:** `vite-react-ssg` dokümantasyonu kendi `<Head>` bileşeninin **react-helmet** (async olmayan) etrafında wrapper olduğunu belirtiyor. `react-helmet-async` v3 ile uyumlu olup olmadığı **aşama 2'de doğrulanmalı**. Bkz. Risk 5.

---

## 6. Vercel Config

- **`vercel.json` mevcut mu:** EVET
- **İçerik özeti:**
  - `rewrites`:
    - `/sitemap.xml` → `https://qmnrawqvkwehufebbkxp.supabase.co/functions/v1/sitemap` (Supabase Edge Function)
    - `/(.*)` → `/index.html` (**SPA catch-all** — SSG için DEĞİŞTİRİLECEK)
  - `headers`:
    - `/assets/(.*)` → `Cache-Control: public, max-age=31536000, immutable`
    - `/(.*\.woff2)` → aynı immutable cache
- **Build script:** `"build": "vite build"` (paket.json)
- **Vite sürümü:** `^5.4.19` (dev dependency)
- **React Router sürümü:** `^6.30.1` — Data Router API (`createBrowserRouter`) destekler, refactor için uygun

### SSG sonrası vercel.json değişikliği

- **SPA catch-all kaldırılmalı** — SSG her sayfanın kendi `.html`'ini üretir; `/(.*) → /index.html` bunu ezer.
- Yalnızca prerender edilmeyen dinamik rotalar (örn. `/menu/:slug` demo harici) için fallback rewrite gerekir — örn. `/menu/(.*) → /menu/[slug]-fallback.html` veya client-side yönlendirme.
- Sitemap rewrite korunmalı.
- 404: `NotFound.tsx` prerender edilirse Vercel `notFound` config ile bağlanabilir.

---

## 7. Baseline Metrikleri

- **Build süresi (mevcut SPA):** **17.27 s** (`time` wall-clock: 17.91 s real, 30.45 s user — SWC paralelliği)
- **dist/ toplam boyutu:** **18 MB** (büyük `hero-restaurant.png` 8.8 MB bu rakamın yaklaşık yarısı)
- **HTML dosya sayısı:** **1** (`dist/index.html` 5.7 KB)
- **Chunk uyarıları:**
  - `react-pdf.browser`: **1,461 KB** (gzip 491 KB) — PDF export için, lazy
  - `index-BHqsfb-O.js` (ana bundle): **663 KB** (gzip 207 KB) — büyük, ama SSG bunu etkilemez
  - `Dashboard`: 443 KB — lazy, SSG'de prerender edilmiyor zaten
  - `vendor-supabase`: 194 KB — SSG sayfaları için ayrı chunk (PublicMenu demo dahil tüm public sayfalar bu chunk'a ihtiyaç duyacak)
- **dist/ yapısı:** `allergens-erudus/`, `assets/`, `blog/` (sanırım blog görselleri), `fonts/` + root'ta public assetler

### Vercel build limiti

- Vercel Free/Hobby: 45 dakika build timeout
- SSG sonrası tahmini: **15 sayfa × ~1.5 s/sayfa = 22–45 s ek süre** → toplam ~40–60 s. Limit uzak; sorun yok.

---

## 8. Risk Analizi ve Aşama 2 Kararları

### Risk 1: Router refactor gerekli mi?

**EVET — ZORUNLU.**

`vite-react-ssg` dokümantasyonu (WebFetch ile doğrulandı):

> vite-react-ssg **requires `createBrowserRouter` with route config arrays**, not inline JSX Route definitions. Routes are defined as `RouteRecord[]` objects passed to `ViteReactSSG()`.

**Mevcut yapı:** `App.tsx` içinde `<BrowserRouter>` + `<Routes>` + inline `<Route>` JSX (10 route).
**Hedef yapı:**

```ts
// src/main.tsx (refactored)
import { ViteReactSSG } from 'vite-react-ssg';
import { routes } from './routes';
export const createRoot = ViteReactSSG(
  { routes },
  ({ router, isClient }) => { /* provider'ları burada sar */ }
);
```

**Refactor kapsamı (tahmini):**
- Yeni dosya: `src/routes.tsx` — `RouteRecord[]` export'u
- `App.tsx`'ten `<BrowserRouter>/<Routes>/<Route>` bloğu kaldırılır; provider wrapping `ViteReactSSG` callback'ine taşınır
- `ConditionalWhatsApp` (useLocation kullanıyor) yeni router context'inde çalıştığı doğrulanmalı — `react-router-dom` v6.4+ data router API ile uyumlu, teorik olarak sorun yok
- Lazy import'lar route object'lerinde `lazy: () => import(...)` olarak tanımlanır; `<Suspense>` fallback'i `ViteReactSSG` callback içinde kalır

**"Manual path list" kaçış yolu:** `vite-react-ssg`'nin `includedRoutes` option'ı vite.config.ts'te path listesi almayı destekler, ama ÖNCE router yapısı yine route-config olmalı. Refactor'dan kaçış yok.

### Risk 2: `/menu/demo` Supabase'den mi çekiyor?

**Kısmen — demo bypass var ama useEffect içinde.**

- Demo verisi hardcoded (`src/data/demoMenuData.ts`) ve Supabase'e hiç gitmiyor (`PublicMenu.tsx:397`).
- **Ama** bypass bir `useEffect`'te (satır 391). SSG ilk render'da `restaurant === null` görür ve "yükleniyor" döndürür.

**Çözüm seçenekleri (Aşama 2'de seçilecek):**
- [ ] **(a) Demo verisi senkron initial state'e hydrate edilsin** (`const [restaurant, setRestaurant] = useState(slug === 'demo' ? demoRestaurant : null)`). En az değişiklik; prerender edilen HTML demo menüyü içerir.
- [ ] **(b) `/menu/demo` SSG kapsamından çıkarılsın** (SPA kalsın). Ana sayfada demo linki zaten JS ile yükleniyor, SEO'da demo sayfasının öne çıkması kritik değil.
- [ ] **(c) `/menu/demo` ayrı bir component'e taşınsın** (`DemoMenu.tsx`), saf statik render — en temiz ama iş yükü yüksek.
- [ ] **(d) `ClientOnly` wrapper + SSR iskelet** — kullanıcı deneyimi aynı kalır, SEO yalnız iskelet alır.

**Öneri:** (a) en iyi maliyet/fayda. PublicMenu içindeki diğer `useEffect`'ler (analitik, auth, vb.) browser-only çalışmaya devam eder.

### Risk 3: `ClientOnly` guard hangi componentler için gerekli?

Render-zamanında tarayıcı API'si gerektiren veya hydration mismatch riski olan componentler:

| Component                 | Neden                                                            | Guard yöntemi                          |
| ------------------------- | ---------------------------------------------------------------- | -------------------------------------- |
| `CookieBanner.tsx`        | `localStorage`/`document.cookie` okur                            | `useEffect` + state veya `ClientOnly`  |
| `FloatingWhatsApp.tsx`    | Muhtemelen `window`/`scroll` dinler                              | `ClientOnly`                           |
| `ConditionalWhatsApp`     | `useLocation`'a bağlı, provider içinde kalmalı                   | Halihazırda doğru yapıda               |
| `AnimatedLogo`            | `framer-motion` animasyonları                                    | Hydration-safe olmalı; doğrulanmalı   |
| DOMPurify (BlogPost, PublicMenu) | `window.DOMParser` ister                                  | `vite-react-ssg` JSDOM sağlar, dry-run |
| `embla-carousel-react`    | DOM ölçüm                                                        | Public sayfalarda kullanılıyorsa guard |
| `qrcode.react`            | Canvas — ama public sayfalarda var mı? (QRManager dashboard-only)| —                                      |
| `@tiptap/*`               | Admin/onboarding dışında değil                                   | SSG scope dışında                      |

Ayrıca `Index.tsx` içindeki landing componentleri (Hero, Features, Pricing, FAQ, CTA, Comparison) — bunlarda `window` veya `document` referansı olup olmadığı aşama 2 dry-build'te netleşir.

### Risk 4: Build süresi sorunu var mı?

- Baseline: **17.3 s**
- SSG prerender hedefi: **~15 sayfa** (`/`, `/blog`, `/iletisim`, `/menu/demo`, `/privacy`, `/blog/:slug` × 10, opsiyonel `/404`)
- Tahmini artış: **1.5–2.5×** → 26–45 s
- **Vercel Hobby/Pro build limiti:** 45 dk → sorun YOK
- **Risk:** `react-pdf.browser` (1.5 MB) prerender sırasında SSR yapmaya çalışırsa zaman ekler; `react-pdf` import'u `Dashboard`/admin lazy chunk'larında olduğundan SSG scope sayfalarından çekilmemeli — **dry-build'te doğrulanmalı**.

### Risk 5: `react-helmet-async` v3 ile `vite-react-ssg` uyumu

- `vite-react-ssg` kendi `<Head>` wrapper'ını `react-helmet` (async olmayan) üstünde sunar.
- Proje `react-helmet-async ^3.0.0` kullanıyor. v3, React 18 concurrent renderer için yazıldı.
- **Belirsizlik:** `vite-react-ssg` SSR sırasında `react-helmet-async`'in `HelmetProvider` context'ini yakalar mı?
- **Aşama 2 testi:** İlk dry-build sonrası `dist/*/index.html` dosyalarını `<title>`/`<meta description>`/`<script type="application/ld+json">` için kontrol et. Eğer eksikse: (i) `<Helmet>` çağrılarını `vite-react-ssg`'nin `<Head>`'ine geçir, VEYA (ii) `react-helmet-async`'i `react-helmet@6.1.0`'a düşür (küçük API değişikliği).

---

## Aşama 2'ye Geçmeden Önce Karar Verilmesi Gerekenler

1. **Router refactor scope:** `createBrowserRouter` route config'ine tam geçiş mi (önerilen), yoksa SSG için ayrı `routes.tsx` + eski `App.tsx`'yi koruma mı? (İkincisi çift bakım maliyeti getirir — önermiyorum.)
2. **`/menu/demo` çözüm seçeneği:** (a) synchronous init state / (b) SSG'den çıkar / (c) ayrı component / (d) ClientOnly — yukarıda (a) öneriliyor.
3. **`react-helmet-async` v3 deneme-yanılma veya proaktif `react-helmet@6.x`'e düşürme?** Dry-build'i deneyip yolu seçmek daha ucuz.
4. **Blog.tsx'e Helmet eklensin mi?** (evet, küçük iş — beklenmedik bulgu).
5. **SSG kapsamında `NotFound` olsun mu?** Vercel `notFound` fallback için mantıklı.
6. **Sitemap:** Şu anda Supabase Edge Function'dan rewrite ile geliyor. SSG sonrası otomatik sitemap (`vite-react-ssg` plugin veya build script) mi, yoksa Edge Function'da kalmaya mı devam?
7. **Hardcoded Supabase creds `src/lib/supabase.ts`'te:** güvenlik notu — build-time fallback değer anon key de olsa public repo'da asılı; env zorunluluğa çevirme (ayrı iş, SSG kapsamı dışı).

---

## Sonraki Adımlar (Aşama 2 taslağı)

Aşama 2'de aşağıdaki sıra önerilir:

1. **Router refactor** — `src/routes.tsx` oluştur, `App.tsx`'i `ViteReactSSG`'e uygun sağlayıcı-only bileşene indir; lokal `npm run dev` ile tüm rotaların açıldığını doğrula.
2. **`vite-react-ssg` kurulumu** — `package.json` ve `vite.config.ts`'e ekle; `includedRoutes`'ta SSG aday path listesini ver:
   ```
   ['/', '/blog', '/iletisim', '/menu/demo', '/privacy',
    ...blogPosts.map(p => `/blog/${p.slug}`)]
   ```
3. **`/menu/demo` fix** — Risk 2 seçenek (a): `useState` initial değerinde `slug === 'demo'` kontrolü.
4. **Blog.tsx'e Helmet ekle** (beklenmedik bulgu; küçük).
5. **Dry-build** — `dist/` içindeki HTML dosyalarını inceleyip Helmet/JSON-LD içeriklerini doğrula; `vercel-supabase` chunk'ının SSR'a sızmadığını teyit et; DOMPurify ve framer-motion hydration warning'leri için konsol kontrol et.
6. **vercel.json güncelle** — SPA catch-all'ı kaldır, `/menu/(.*)` için fallback rewrite ekle.
7. **Performans baseline karşılaştırma** — SSG sonrası build süresi + Lighthouse LCP/TBT ölçümü.

---

## Beklenmedik Bulgular

1. **Blog liste sayfasında `<Helmet>` yok.** `src/pages/Blog.tsx` meta tag eklemiyor; SEO için aşama 2'de eklenmeli.
2. **Router'da `ProtectedRoute` yok.** `Dashboard` ve `Onboarding` guard'ı sayfa içinde yapıyor; SSG'de bu sayfaların **kesinlikle** prerender edilmemesi gerek (aksi halde auth kontrolü öncesi boş iskelet HTML üretilir, yanlış içerik cachelenir).
3. **`src/lib/supabase.ts`'te hardcoded production URL ve anon JWT fallback'i.** İşlev bakımından SSG'yi etkilemiyor ama security hygiene açısından not. Ayrı iş.
4. **`PublicMenu.tsx`'teki `useEffect`'lerin demo slug'ı kontrol etmesi düzensiz.** Satır 391'deki efekt demo kontrolü yapar ama satır 368 (`menu_page_views.insert`) demo/real ayrımı yapmadan Supabase'e yazmayı dener. Şu an bu tarayıcıda her zaman çalışıyor; önemli bir analitik kaynağı olabilir. Aşama 2'de demo için bu yazmayı atlamayı düşün (ayrı karar).
5. **`vercel.json` headers sadece `/assets/*` ve `*.woff2`'yi cacheliyor.** SSG sonrası üretilen `*.html` dosyalarına default no-cache gelir — bu doğru davranış (HTML taze kalmalı) ama `immutable` hash'lerle eşleştirilmiş asset path'i korunuyor, iyi.

---

## Test Checklist Karşılığı

- [x] Mevcut router pattern nedir? → `<BrowserRouter>` + inline `<Route>` JSX (bkz. §1)
- [x] `vite-react-ssg` mevcut router ile uyumlu mu? → **HAYIR, refactor gerekli** (Risk 1)
- [x] Hangi sayfalar render zamanında Supabase'ten veri çekiyor? → **Hiçbiri** (hepsi `useEffect`/`onSubmit`'te; bkz. §2)
- [x] `/menu/demo` SSG-safe mi? → Kod olarak safe (Supabase çağırmıyor) ama demo verisi `useEffect`'te hydrate olduğundan içerik prerender'a düşmez; Risk 2 çözümü gerek
- [x] Blog slug listesi nerede, kaç tane? → `src/lib/blogData.ts`, **10 post** (§4)
- [x] `/hakkimizda` var mı? → **YOK** (§3)
- [x] Helmet SSG'ye hazır mı? → Provider doğru, v3/vite-react-ssg uyumu dry-build'te doğrulanmalı (Risk 5)
- [x] vercel.json durumu? → SPA catch-all var, SSG sonrası kaldırılmalı (§6)
- [x] Build süresi? → **17.3 s baseline** (§7)
- [x] Aşama 2 soruları? → 7 kalem, yukarıda listelendi

---

**Aşama 1 tamam — Aşama 2'ye hazır.**
