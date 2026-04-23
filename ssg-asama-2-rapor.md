# SSG Aşama 2 Raporu

**Tarih:** 2026-04-22
**Branch:** `feature/ssg-prerendering` (HEAD: `b5bf9d3`)
**Remote:** push edildi, Vercel preview tetiklendi
**Main'e merge:** **HAYIR** — Murat onayı bekleniyor (Adım 18)

---

## Özet

- `vite-react-ssg@0.9.1-beta.1` ile 18 sayfa build-time prerender ediliyor
- Her SSG-hedef sayfada sayfaya özel `<title>`, `<meta description>`, `<link rel="canonical">` ve JSON-LD (Article vb.) HTML'e gömülü
- Clean build süresi **22.6 s** (baseline SPA 17.3 s → ~1.3× artış, planın 2–3× tahmininin çok altında)
- `dist/` 20 MB (baseline 18 MB → +2 MB, 17 ek HTML için)
- `/menu/:slug` dinamik rotası (demo dışı) SPA fallback ile çalışmaya devam ediyor; auth sayfaları (`/login`, `/dashboard`, `/onboarding`) hem prerender shell hem SPA hydration alıyor

---

## Helmet stratejisi sonucu

- **v3 ile ÇALIŞMADI.** `react-helmet-async@3.0.0` ile ilk build — client HTML'leri üretti ama `<title>/<meta>`'lar sayfaya özel değildi (hepsi index.html template'indeki generic title geliyordu).
- **Kök neden:** Projede `react-helmet-async@3.0.0`, `vite-react-ssg` içinde `react-helmet-async@1.3.0`. İki farklı major → dispatcher context'leri uyumsuz, SSG'nin extractor'ı boş context gördü.
- **Çözüm:** projede sürümü `react-helmet-async@1.3.0`'a hizaladım (`npm install react-helmet-async@1.3.0`). `npm ls react-helmet-async` → her iki yer de `1.3.0 deduped`. User-facing `<Helmet>` API aynı, kodda değişiklik gerekmedi.
- **Planın "v6'ya düşür" yolu alınmadı** — o daha invaziftir (7+ dosyada import değişikliği). Sürüm hizalama tek komut ile çözdü.

Sonuç (örnek):

```
/                         : Tabbled — Restoran Dijital Menü Platformu
/blog                     : Blog — Tabbled | QR Menü ve Restoran Dijital Dönüşüm Rehberi
/blog/qr-menu-nedir       : QR Menü Nedir? Dijital Menü Sistemi Rehberi | Tabbled
/blog/qr-menu-fiyatlari-2026 : QR Menü Fiyatları 2026 — Karşılaştırma Rehberi | Tabbled
/iletisim                 : İletişim — Tabbled | 14 Gün Ücretsiz Deneyin
/privacy                  : Gizlilik Politikası — Tabbled
/menu/demo                : Örnek Restoran — Menü | Tabbled
```

Tüm 10 blog slug'ının `<title data-rh="true">`, per-post `<meta description>` ve `Article` JSON-LD şeması HTML'de gömülü (her birinde 3 JSON-LD bloğu: Organization + SoftwareApplication template + per-post Article).

---

## Build'de karşılaşılan hatalar ve çözümler

1. **Duplicate `isDemo` symbol** (PublicMenu.tsx:1011)
   - Sebep: component gövdesinde zaten `isDemo = slug === 'demo'` vardı (line 1011); top-level ekledim, çakıştı.
   - Fix: alttaki silindi, üstteki initial-state hydration için tek kaynak.

2. **`manualChunks` SSR build'de patladı** — "react cannot be included in manualChunks because it is resolved as external"
   - Sebep: vite.config.ts'teki `manualChunks` SSR build'inde de çalışıyordu; SSR'de React external, chunk'lanamaz.
   - Fix: `isSsrBuild` parametresine göre SSR'de `output: undefined`, yalnız client'ta manuel chunk.

3. **`DOMParser is not defined`** (blogUtils.extractTOC → BlogPost render zincirinde)
   - Sebep: `extractTOC` DOM API'lerinden `DOMParser`/`querySelectorAll` kullanıyordu, Node'da yok.
   - Fix: regex tabanlı SSR-uyumlu implementasyon. `addHeadingIds` zaten regex; aynı `heading-N` ID'lerini üretir → SSR/client output parite, hydration mismatch yok.

4. **`DOMPurify.sanitize is not a function`** (BlogPost.tsx:180)
   - Sebep: DOMPurify Node'da window olmadan `sanitize`'ı expose etmiyor.
   - Fix: `typeof DOMPurify.sanitize === 'function'` guard. İçerik authored (blogData.ts'ten) olduğundan SSR'de raw HTML → client'ta sanitize. Hydration mismatch yok çünkü authored HTML sanitizer'dan geçtiğinde değişmiyor.

5. **`HelmetDispatcher.init` ReferenceError** (Helmet v3 context)
   - Sebep: App.tsx'te `<HelmetProvider>` vardı; vite-react-ssg kendi HelmetProvider'ını dıştan sarıyor. User `<Helmet>`'leri iç provider'a push ediyor, SSG'nin dış context'i boş.
   - İlk fix: App.tsx'ten `<HelmetProvider>` kaldırıldı.
   - İkinci fix (yukarıdaki "v3 çalışmadı" bloğunda): helmet-async sürümleri hizalandı (v1.3.0).

6. **`/menu/demo` Helmet yakalanmadı** (ilk build'de title generic)
   - Sebep: `if (showSplash) return <splash/>` early return Helmet bloğunu içeren `return`'den ÖNCEDE; demo SSR'da splash ekranı render ediyordu, Helmet erişilmeden return.
   - Fix: `restaurant` state'i hazır olduktan sonra — splash return'den önce — sayfaya özel `<Helmet>` bloğu eklendi. Splash ekranı da artık `{pageHead}` içeriyor.

---

## ClientOnly guard eklenen componentler

**Hiçbiri (proaktif).** Audit:

- `CookieBanner`: initial `visible=false`, useEffect'te `localStorage` okur → SSR safe (null döner).
- `FloatingWhatsApp`: zaten `typeof window === "undefined"` guard'ı var, useState initializer'da.
- `AnimatedLogo`: `framer-motion` — build warning yok.
- `DOMPurify`: sanitize çağrısı `typeof` guard'ı ile korundu (yukarıda).
- Render-zamanı `window.`/`document.` arandı; bulunanlar ya event handler (onClick) ya useEffect içinde.

**Öneri:** Preview'da tarayıcıda hydration warning kontrolü yap. Görülürse o component için `<ClientOnly>` (vite-react-ssg'nin kendi export'u).

---

## Beklenmedik bulgular

1. **`src/pages/Blog.tsx` main'de 0 byte.** Commit `d91aff4` ("fix: blog başlığı Türkçe karakter düzeltildi") dosyanın tamamını sildi (145 satır → 0). `/blog` route'u main'de fiilen broken durumda (lazy import boş modülü çözüyordu, runtime'da crash). Bu commit'te dosyayı `d91aff4^`'den geri yükledim + planın gerektirdiği gelişmiş Helmet'i ekledim + commit'in gerçek amacı olan Türkçe diakritikleri uyguladım ("Tumu"→"Tümü", "Yakin"→"Yakın", "Devamini"→"Devamını", "icgoruler"→"içgörüler", "sektor"→"sektör", "yazilari"→"yazıları", "kalin"→"kalın").

2. **`react-helmet-async@3.0.0`'nin varlığı.** NPM'de latest dist-tag olarak v3 yayında. Vite-react-ssg v1'e pin'li; ekosistem kısa vadede v3'e geçemez.

3. **`dashboard`, `login`, `onboarding` de prerender edildi.** Route'ta `path: '*'` catch-all dışında static olan her rotayı vite-react-ssg otomatik prerender ediyor. SEO için istenmese de zarar yok (auth logic JS ile hydration sonrası çalışır; boş shell render, crawler'lar index etmez çünkü noindex olabilir). Aşama 3'te `includedRoutes` whitelistlenebilir.

4. **`/menu/:slug` (demo harici) için `getStaticPaths` sadece `['menu/demo']` döndürüyor.** Gelecek sprint'te gerçek restoran slug'ları (örn. `blogPosts.map(...)` benzeri) ile burayı beslemeye karar verilebilir — ama o zaman Supabase'i build-time'da çağırma gereksinimi gelir (daha büyük iş).

5. **NotFound (`*`) için ayrı `/404.html` ÜRETİLMEDİ.** Plan "NotFound prerender: Evet" diyordu ama catch-all route olduğu için vite-react-ssg onu static olarak çekmedi. Vercel otomatik 404 fallback veriyor (index.html'e hit etmeden). İlerde `path: '/404'` diye explicit route eklenebilir.

---

## Preview URL

- Branch: `feature/ssg-prerendering`
- Push edildi: `150eae7..b5bf9d3`
- Vercel dashboard'dan preview URL'i al (kalıp: `swift-table-menu-git-feature-ssg-prerendering-<user>.vercel.app`)
- URL bende yok (lokal ortam, Vercel token yok)

---

## Production smoke test sonuçları

**Henüz yapılmadı.** Main'e merge edilmediği için production URL değişmedi.

**Murat'ın yapması gereken preview testi:**

```bash
PREVIEW="https://swift-table-menu-git-feature-ssg-prerendering-xxx.vercel.app"

# Sayfa-özel title kontrolü (tüm SSG path'leri için):
for p in / /blog /blog/qr-menu-nedir /blog/qr-menu-fiyatlari-2026 /iletisim /privacy /menu/demo; do
  echo "$p:"
  curl -s "$PREVIEW$p" | grep -oE '<title data-rh="true">[^<]*</title>'
done

# md5 uniqueness:
for p in / /blog /blog/qr-menu-nedir /iletisim; do
  echo -n "$p: "; curl -s "$PREVIEW$p" | md5sum
done

# Dinamik /menu fallback hâlâ SPA?
curl -s "$PREVIEW/menu/ramada-encore-bayrampasa" | head -20
# Sonuç: generic shell dönmeli, JS ile restoran yüklenmeli

# /sitemap.xml Supabase Edge Function'dan gelsin
curl -sI "$PREVIEW/sitemap.xml" | head -5
```

**Tarayıcı testi:**

- [ ] view-source ile `/` → body HTML dolu mu (landing hero, pricing, FAQ)
- [ ] view-source ile `/blog/qr-menu-nedir` → yazı içeriği markup'ta var mı
- [ ] view-source ile `/menu/demo` → demo kategoriler/ürünler markup'ta var mı
- [ ] `/menu/ramada-encore-bayrampasa` tarayıcıda — Ramada menüsü yükleniyor mu (SPA path)
- [ ] `/dashboard` tarayıcıda — login'e redirect ediyor mu
- [ ] Cookie banner, WhatsApp float, Toast'lar çalışıyor mu

---

## Lighthouse SEO skoru

**Henüz yapılmadı** (headless Chrome bu ortamda kurulu değil).

Murat Lighthouse çalıştırabilir:

```bash
npx lighthouse $PREVIEW/blog/qr-menu-nedir \
  --only-categories=seo,performance \
  --output=html --output-path=./lighthouse-blog-ssg.html
```

Beklenti: SEO 95–100, LCP < 2.5s.

---

## Kalan işler (bu sprint'te yapılmayan)

- `/hakkimizda` sayfası oluşturulmadı (Aşama 1 keşif raporunda yoktu).
- Supabase creds env zorunluluğuna çevrilmedi (kararen ayrı iş olarak bırakıldı).
- `/menu/:slug` için SSR/ISR (sadece `/menu/demo` prerender; diğerleri SPA olarak kalıyor).
- `NotFound` ayrı `/404.html` üretmek için `path: '/404'` rotası eklenebilir (opsiyonel).
- `includedRoutes` whitelistleyerek dashboard/login/onboarding shell'lerini prerender'dan çıkarma (cozmetik, SEO'ya etki etmez çünkü robots.txt/noindex ile kapatılabilir).
- Hydration warning/regression taraması için preview üzerinde tarayıcı testi (ClientOnly'nin gerçekten gerekip gerekmediği burada görülür).
- **ÖNEMLİ:** `src/pages/Blog.tsx`'in main'de 0 byte olduğu bug'ı — main branch'te `/blog` route'u fiilen bozuk. Bu PR merge edildiğinde beraberinde düzelecek.

---

## Merge hazırlığı — Murat onayı bekleniyor

Bu PR merge için **aşağıdakilerin Murat tarafından doğrulanması** gerekir (plan Adım 18):

1. Vercel preview URL'inde `curl` ile sayfa-özel title'lar kontrol edildi → OK
2. Preview'de tarayıcıda regression yok (landing, blog, menu demo, auth akışları) → OK
3. Lighthouse SEO skoru kabul edilebilir (>90) → OK

Sonra `main`'e merge:

```bash
git checkout main
git pull origin main
git merge --no-ff feature/ssg-prerendering
git push origin main
```

`--no-ff` eklendi çünkü plan history'nin yalın kalmasını önemsemiyordu; merge commit ssg'nin nerede başladığını kolayca işaretler.

---

## Rollback planı (önceden hazır)

- **Plan A:** Vercel dashboard → bir önceki production deploy'u "Promote to Production"
- **Plan B:** `package.json`'da `"build": "vite-react-ssg build"` → `"build": "vite build"` (aka `build:spa`). Tek commit, tek push.
- **Plan C:** `git revert <merge-commit>` + push.

`build:spa` zaten script olarak dursun; revert yapılmadan hızlı geri dönülebilir.
