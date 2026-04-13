# TABBLED — Landing Page Yeniden Tasarım
# Relume Export → Tabbled Stack Çevirisi + İçerik Düzeltmeleri

---

## PROJE BAĞLAMI

- **Dizin:** /opt/khp/tabbled
- **Stack:** React + Vite + TypeScript + shadcn/ui
- **Stil:** S.* inline style objects + native HTML elements (Tailwind KULLANMA)
- **İkon:** Phosphor Icons (@phosphor-icons/react) — Thin weight only
- **Font:** Playfair Display (başlıklar) + Inter (body) — @fontsource ile local
- **Marka renkleri:** #FF4F7A (Strawberry Pink), #1C1C1E (Deep Charcoal), #F7F7F8 (Off-White)
- **Logo:** public/tabbled-logo-horizontal.png (navbar, footer), public/tabbled-logo-icon.png (favicon)
- **Mevcut routing:** vercel.json rewrites SPA, react-router-dom

---

## GÖREV

Relume'dan export edilen JSX bileşenlerini Tabbled stack'ine çevir. Mevcut landing page bileşenlerini (src/components/landing/) tamamen yenileriyle değiştir. **Tailwind class'ları kullanma** — tümünü S.* inline style objects'e çevir.

**3 sayfa etkileniyor:**
1. **Landing page** (src/pages/Index.tsx) — tamamen yeniden
2. **Blog listesi** (src/pages/Blog.tsx) — layout güncelleme
3. **Blog yazı detay** (src/pages/BlogPost.tsx) — layout güncelleme

---

## GENEL KURALLAR

1. **Tailwind → Inline Styles:** Tüm className'leri kaldır, S.* style objects kullan
2. **@relume_io/relume-ui → Native HTML:** Button, Input, Accordion → kendi bileşenlerimiz
3. **react-icons → Phosphor Icons:** BiCheck → Check (Thin), RxPlus → Plus (Thin), RxChevronRight → CaretRight (Thin), RxChevronDown → CaretDown (Thin), BiLogoFacebookCircle/BiLogoInstagram/FaXTwitter/BiLogoLinkedinSquare/BiLogoYoutube → mevcut inline SVG ikonları koru (sosyal medya)
4. **framer-motion KALACAK** — Navbar animasyonları için zaten projede var, sadece import'u kontrol et
5. **Placeholder görseller → Gerçek path'ler:** Relume CDN URL'leri → `/hero-restaurant.webp`, logo → `tabbled-logo-horizontal.png` vb.
6. **Responsive:** Tüm bileşenler mobil-first responsive olmalı (media query veya container query)
7. **Link'ler:** `<a href="#">` → `<Link to="/...">` veya `<a href="#section-id">` (scroll)
8. **"use client"** direktiflerini kaldır (Next.js değil, Vite)
9. **TypeScript:** Tüm dosyalar .tsx olmalı, prop type'ları tanımlanmalı

---

## DOSYA YAPISI

Mevcut landing bileşenlerini SİL ve yenilerini oluştur:

```
src/components/landing/
├── LandingNavbar.tsx        ← Navbar1.jsx'ten
├── HeroSection.tsx          ← Header137.jsx'ten
├── WhyNowSection.tsx        ← Header64.jsx'ten (Neden Şimdi)
├── HowItWorksSection.tsx    ← Layout237.jsx'ten (Üç Adım)
├── PricingSection.tsx       ← Pricing19.jsx'ten
├── ComparisonSection.tsx    ← Comparison13.jsx'ten
├── FAQSection.tsx           ← Faq5.jsx'ten
├── CTASection.tsx           ← Cta33.jsx'ten
├── LandingFooter.tsx        ← Footer2.jsx'ten
├── BlogListSection.tsx      ← Blog50.jsx'ten (blog sayfası + blog-post ilgili yazılar)
├── BlogCTASection.tsx       ← Cta32.jsx'ten (blog CTA)
├── BlogPostHeader.tsx       ← BlogPostHeader1.jsx'ten
└── BlogPostContent.tsx      ← Content29.jsx'ten
```

---

## BİLEŞEN DETAYLARI VE İÇERİK DÜZELTMELERİ

### 1. LandingNavbar.tsx (← Navbar1.jsx)

**Layout'u koru**, içerik düzelt:

- Logo: `src` → `/tabbled-logo-horizontal.png`, `alt="Tabbled"`, `href="/"` ile `<Link to="/">`
- Mobil hamburger menü animasyonu koru (framer-motion)
- **Nav link'leri Türkçeye çevir:**
  - Capabilities → `Özellikler` (href="#ozellikler" veya /ozellikler)
  - Pricing → `Fiyatlandırma` (href="#fiyatlandirma")
  - Resources → `Kaynaklar` (href="#kaynaklar")
  - Guides dropdown:
    - Label: `Rehberler`
    - Alt menü: Support → `Destek`, Blog → `Blog` (Link to="/blog"), Pricing → kaldır (zaten üstte var)
- **CTA butonları:**
  - Demo → `Demo` (Link to="/menu/demo")
  - Menu → `İletişime Geç` (Link to="/iletisim"), arka plan: #FF4F7A, renk: #fff
- RxChevronDown → `CaretDown` from `@phosphor-icons/react` (Thin weight)

### 2. HeroSection.tsx (← Header137.jsx)

**Layout'u koru** (sol metin + sağ görsel grid):

- Başlık: "QR menüden fazlası: restoranınız için tek dijital merkez" — **koru**
- Açıklama: "Menü yönetimini hızlandırın..." — **koru**
- **CTA butonları:**
  - Demo → Link to="/menu/demo", arka plan: #FF4F7A, renk: #fff, border-radius: 8px
  - İletişime → Link to="/iletisim", border: 1px solid #1C1C1E, arka plan: transparent
- **Görseller:**
  - Placeholder portrait image → `/hero-restaurant.webp` (mevcut hero görsel)
  - Placeholder landscape image → telefon mockup görseli (şimdilik placeholder kalabilir, sonra değişecek)
- Responsive: mobilde tek sütun (görsel altta), desktop'ta 2 sütun

### 3. WhyNowSection.tsx (← Header64.jsx)

**Layout'u ve içeriği koru:**
- Başlık: "Neden şimdi" — koru
- Açıklama: "QR menü artık başlangıç noktası..." — koru
- Arka plan rengi: siyah (#1C1C1E) ise koru, metin beyaz

### 4. HowItWorksSection.tsx (← Layout237.jsx)

**Layout'u koru** (3 sütunlu kart grid):

- Üst etiket: "Başlangıç" — koru
- Başlık: "Üç adımda başlayın" — koru
- **İkon placeholder'ları → Phosphor Icons (Thin):**
  - Adım 1: `UploadSimple` (Thin) — "Kaydolun ve menünüzü yükleyin"
  - Adım 2: `QrCode` (Thin) — "QR kodunuzu paylaşın ve yönetmeye başlayın"
  - Adım 3: `ChartLineUp` (Thin) — "Deneyimi ve büyümeyi izleyin"
- İkon boyutu: 48px, renk: #FF4F7A
- **CTA butonları:**
  - Demo → Link to="/menu/demo"
  - "Daha fazla" → Link to="/ozellikler" veya href="#ozellikler", ikonda CaretRight (Thin)

### 5. PricingSection.tsx (← Pricing19.jsx)

**Layout'u koru** (3 sütunlu kart grid), **fiyatları ve içeriği düzelt:**

- Üst etiket: "Fiyatlandırma" — koru
- Başlık: "Basit, şeffaf planlar" — koru
- Açıklama: "Başlangıçtan kurumsal ölçeğe kadar..." — koru

**Kart 1 — Basic:**
- İkon placeholder → Phosphor `Package` (Thin), 48px, #FF4F7A
- **Plan ismi ekle:** "Basic" (h4, bold, kartın üstünde veya ikon altında)
- **Lansman banner:** Kartın üstünde tam genişlik şerit: "Lansman Fırsatı — %20 İndirim", arka plan: #FF4F7A, renk: #fff, border-radius: üst köşeler kartla aynı
- **Eski fiyat (üzeri çizili):** ~~549 TL+KDV~~ (text-decoration: line-through, renk: gri)
- **Yanında soft badge:** "%20 indirim" (arka plan: rgba(255,79,122,0.1), renk: #FF4F7A, border-radius: 10px, font-size: small)
- **Yeni fiyat:** 439 TL (büyük, bold) + "+KDV/ay" (küçük, gri)
- **Altında:** "senelik faturalandırılır"
- **Özellik listesi:**
  - ✓ QR menü ve temel yönetim
  - ✓ Türkçe ve İngilizce dil desteği
  - ✓ Alerjen ve besin bilgisi
- BiCheck → `Check` (Thin), renk: #FF4F7A
- **CTA:** "Başla" → Link to="/iletisim?plan=basic"

**Kart 2 — Premium:**
- İkon placeholder → Phosphor `Star` (Thin), 48px, #FF4F7A
- **Plan ismi:** "Premium"
- **Lansman banner:** Aynı şerit: "Lansman Fırsatı — %20 İndirim"
- **Eski fiyat:** ~~1.459 TL+KDV~~ (line-through)
- **Soft badge:** "%20 indirim"
- **Yeni fiyat:** 1.167 TL + "+KDV/ay"
- **Altında:** "senelik faturalandırılır"
- **Özellik listesi:**
  - ✓ AI menü içeriği önerileri
  - ✓ Garson çağrısı ve promosyonlar
  - ✓ Google yorumlar ve geri bildirim
  - ✓ Etkinlik yönetimi
- **CTA:** "Başla" → Link to="/iletisim?plan=premium"

**Kart 3 — Enterprise:**
- İkon placeholder → Phosphor `Buildings` (Thin), 48px, #FF4F7A
- **Plan ismi:** "Enterprise"
- **Lansman banner YOK** (Enterprise'da indirim yok)
- **Fiyat:** "Özel" (büyük, bold)
- **Altında:** "senelik faturalandırılır"
- **Özellik listesi:**
  - ✓ Sınırsız dil ve alerjen yönetimi
  - ✓ Özel entegrasyonlar ve API erişimi
  - ✓ Adanmış destek ve eğitim
  - ✓ Zincir ve multi-lokasyon yönetimi
- **Son satırdaki "İletişime geç" → kaldır** (zaten CTA butonu var)
- **CTA:** "İletişime Geç" → Link to="/iletisim?plan=enterprise"

### 6. ComparisonSection.tsx (← Comparison13.jsx)

**Layout'u koru** (2 sütunlu karşılaştırma kartları), içerik düzelt:

- Başlık: "İşletmeciler İçin Üretildi" — koru
- Açıklama: "QR menüler ürünlerinizi listeler. Tabbled işinizi yönetir." — koru
- İkon placeholder'ları → Tabbled logo (sol kart), generic QR ikon (sağ kart)
- BiCheck → `Check` (Thin), renk: #FF4F7A (Tabbled kartında), gri (rakip kartında)
- **İçerik olduğu gibi koru** — "Etkinlik Yönetimi: Anında vs Hayır" formatı iyi

### 7. FAQSection.tsx (← Faq5.jsx)

**Layout'u koru** (akordeon), **içerik düzelt:**

- Başlık ve açıklama — koru
- @relume_io Accordion → **kendi akordeon bileşeni yaz** (useState ile open/close, animasyonlu height transition)
- RxPlus → `Plus` (Thin), rotate-45 animasyonu koru

**FAQ soruları (5 adet):**

1. **"Tabbled'i kurmak ne kadar sürer?"** — Cevap koru (15 dakika)

2. **"Menüyü ne sıklıkta güncelleyebilirim?"** — Cevap koru

3. **"Kaç dili destekliyor?"** — Cevabı düzelt:
   > "Tabbled tüm planlarda 34 dile kadar destek sunar. Google Translate API ile otomatik çeviri yapılır. Türkçe, İngilizce, Arapça, Almanca, Fransızca, Rusça, Çince ve daha fazlası dahildir."

4. **"Basılı menüler otomatik olarak güncellenir mi?"** — **BU SORUYU DEĞİŞTİR:**
   > Soru: "Alerjen ve besin bilgisi nasıl yönetiliyor?"
   > Cevap: "Tabbled, 14 AB zorunlu alerjen ve 4 diyet tercihini (vejetaryen, vegan, helal, koşer) destekler. Her ürün için besin değerleri tablosu ekleyebilir ve bunları menüde gösterebilirsiniz. Yasal uyum otomatik olarak sağlanır."

5. **"Destek nasıl çalışır?"** — Cevabı düzelt:
   > "Tüm planlar e-posta ve WhatsApp desteğine sahiptir. Enterprise müşteriler adanmış bir hesap yöneticisi alır. Canlı demo ve kurulum desteği ücretsizdir."

- **Alt bölüm** ("Demo menüyü görebilir miyim?"):
  - İçerik koru
  - Buton: "Hangi plan benim için uygun?" → Link to="/iletisim"

### 8. CTASection.tsx (← Cta33.jsx)

**Layout'u koru**, içerik düzelt:

- Başlık: "Restoranınızı büyütmeye hazır mısınız?" — koru
- Açıklama — koru
- **CTA butonları:**
  - Demo → Link to="/menu/demo", #FF4F7A bg
  - İletişime Geç → Link to="/iletisim", secondary style
- **Partner logoları KALDIR** — placeholder Webflow/Relume logolarını tamamen kaldır. Bu bölümü sadece başlık + açıklama + butonlar olarak bırak. (Müşteri referansları gelince eklenecek)

### 9. LandingFooter.tsx (← Footer2.jsx)

**Layout'u koru**, **tamamen Türkçeye çevir:**

- Logo: `/tabbled-logo-horizontal.png`, Link to="/"
- **Sütun 1 — "Ürün":**
  - Özellikler → href="#ozellikler" veya /ozellikler
  - Fiyatlandırma → href="#fiyatlandirma"
  - Nasıl Çalışır → href="#nasil-calisir"
  - SSS → href="#sss"
  - Demo → Link to="/menu/demo"
- **Sütun 2 — "Şirket":**
  - Blog → Link to="/blog"
  - İletişim → Link to="/iletisim"
  - Hakkımızda → (şimdilik # placeholder)
  - Destek → (şimdilik # placeholder)
- **Sütun 3 — "Yasal":**
  - Gizlilik Politikası → Link to="/privacy"
  - Kullanım Koşulları → (şimdilik # placeholder)
  - KVKK → Link to="/privacy"
- **"Documentation" sütununu kaldır** (API/Status/Community gereksiz)
- **Newsletter bölümü Türkçeye çevir:**
  - Başlık: "Güncellemeler"
  - Açıklama: "Ürün güncellemeleri ve yeni özelliklerden haberdar olun."
  - Placeholder: "e-posta@adresiniz.com"
  - Buton: "Abone Ol"
  - Alt metin: "Gizliliğinize saygı duyuyoruz. İstediğiniz zaman abonelikten çıkabilirsiniz."
  - **NOT:** Newsletter şimdilik frontend-only (console.log). Backend entegrasyonu ileride yapılacak.
- **Copyright:** "© 2024 Tabbled" → "© 2026 KHP Limited. Tüm hakları saklıdır."
- **Sosyal medya ikonları:** Mevcut inline SVG ikonlarını koru (BiLogo* → inline SVG). href="#" → gerçek link'ler gelince güncellenecek.
- @relume_io Input/Button → native `<input>` + `<button>` elementleri

### 10. BlogListSection.tsx (← Blog50.jsx)

**Layout'u koru** (2×2 kart grid), **içeriği Türkçeye çevir ve mevcut blogData ile entegre et:**

- Üst etiket: "Insights" → "Blog"
- Başlık: "What's happening in hospitality" → "Restoran dünyasından içgörüler"
- Açıklama: → "Stratejiler, rehberler ve sektör trendleri"
- **Blog kartları → src/lib/blogData.ts'den dinamik çek:**
  ```tsx
  import { blogArticles } from '@/lib/blogData';
  // İlk 4 makaleyi göster
  const displayArticles = blogArticles.slice(0, 4);
  ```
- Her kart: fotoğraf (placeholder), kategori badge (Türkçe), okuma süresi, başlık, açıklama, "Devamını oku" linki
- "Read more" → "Devamını oku", CaretRight (Thin) ikonu
- "View all" butonu → "Tümünü gör" → Link to="/blog"
- Kategori badge'leri Türkçe: Operations → "Operasyon", Technology → "Teknoloji", Growth → "Büyüme", Strategy → "Strateji"

### 11. BlogCTASection.tsx (← Cta32.jsx)

**Layout'u koru**, **Türkçeye çevir:**

- Başlık: "Stay ahead in hospitality" → "Restoran sektöründe bir adım önde olun"
- Açıklama: → "Menü yönetimi, misafir deneyimi ve restoran operasyonları hakkında haftalık içgörüler alın"
- Input placeholder: "Your email address" → "E-posta adresiniz"
- Buton: "Subscribe" → "Abone Ol"
- Alt metin: → "Gizliliğinize saygı duyuyoruz. Her e-postadan abonelikten çıkabilirsiniz."
- Alt görsel: placeholder → kaldır veya restoran görseli ekle

### 12. BlogPostHeader.tsx (← BlogPostHeader1.jsx)

**Layout'u koru**, **Türkçeye çevir ve dinamik yap:**

- Breadcrumb: @relume_io Breadcrumb → native HTML + JSON-LD BreadcrumbList (mevcut BlogBreadcrumb.tsx'den al)
- "Strategy" → dinamik kategori (makale verisinden)
- Başlık, yazar, tarih, okuma süresi → blogData'dan prop olarak al
- Sosyal paylaşım ikonları: BiLinkAlt → Phosphor `Link` (Thin), diğerleri inline SVG olarak koru
- Yazar: "Emre Yilmaz" → makale verisinden dinamik
- "Founder, Tabbled" → makale verisinden

### 13. BlogPostContent.tsx (← Content29.jsx)

**Layout'u koru** (prose tipografi), **içeriği dinamik yap:**

- Lorem ipsum → prop olarak gelen makale HTML içeriği
- `dangerouslySetInnerHTML` ile render (mevcut BlogPost.tsx'deki gibi, DOMPurify ile)
- Sosyal paylaşım bölümü Türkçe: "Share this post" → "Bu yazıyı paylaş"
- Tag'ler → makale verisinden dinamik
- Yazar bilgi kartı → makale verisinden

---

## SAYFA ENTEGRASYONU

### src/pages/Index.tsx (Landing Page)

```tsx
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { WhyNowSection } from '@/components/landing/WhyNowSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { ComparisonSection } from '@/components/landing/ComparisonSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { CTASection } from '@/components/landing/CTASection';
import { LandingFooter } from '@/components/landing/LandingFooter';

// Mevcut: Helmet, CookieBanner, FloatingWhatsApp KORU
```

Bölüm sırası (Relume'daki gibi):
1. LandingNavbar
2. HeroSection
3. WhyNowSection ("Neden şimdi" — siyah arka plan bölümü)
4. HowItWorksSection ("Üç adımda başlayın")
5. PricingSection ("Basit, şeffaf planlar")
6. ComparisonSection ("İşletmeciler İçin Üretildi")
7. FAQSection ("Sık sorulan sorular")
8. CTASection ("Restoranınızı büyütmeye hazır mısınız?")
9. LandingFooter

**Korunacak mevcut özellikler:**
- `<Helmet>` SEO meta tags (Index.tsx'de mevcut)
- `<CookieBanner />` (KVKK)
- `<FloatingWhatsApp />` (landing + blog'da görünür)
- GA tracking koşullu yükleme

### src/pages/Blog.tsx

Mevcut yapıyı koru ama layout'u güncelle:
- LandingNavbar (üstte)
- Mevcut blog içerik (blogData'dan makale kartları)
- BlogCTASection (altta, newsletter)
- LandingFooter

### src/pages/BlogPost.tsx

Mevcut yapıyı koru ama layout'u güncelle:
- LandingNavbar (üstte)
- BlogPostHeader (breadcrumb + başlık + yazar)
- BlogPostContent (makale içeriği + paylaşım + tag'ler)
- BlogCTASection (newsletter)
- BlogListSection (ilgili yazılar — son 4 makale)
- LandingFooter

---

## STİL DÖNÜŞÜM REHBERİ

Tailwind → Inline style çeviri örnekleri:

```
className="px-[5%] py-16 md:py-24 lg:py-28"
→ style={{ padding: '64px 5%' }} // Desktop
→ Responsive için: CSS media query veya window.innerWidth check

className="text-5xl font-bold"
→ style={{ fontSize: '3rem', fontWeight: 700 }}

className="grid grid-cols-1 lg:grid-cols-3 gap-8"
→ style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}
// Mobilde: gridTemplateColumns: '1fr'

className="flex items-center justify-between"
→ style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}

className="border border-border-primary"
→ style={{ border: '1px solid #E5E5E5' }}

className="mb-5 md:mb-6"
→ style={{ marginBottom: '24px' }}
```

**Responsive pattern:**
```tsx
// useMediaQuery hook kullan veya CSS-in-JS media query
const isMobile = window.innerWidth < 768;
const isDesktop = window.innerWidth >= 1024;

// Veya mevcut projede varsa useMediaQuery hook'u kullan
```

**VEYA daha iyi yaklaşım — CSS dosyası:**
```
src/styles/landing.css oluştur, responsive class'ları burada tanımla.
Bileşenlerde className + style birlikte kullanılabilir.
```

---

## AKORDEON BİLEŞENİ (FAQ için)

@relume_io/relume-ui Accordion'u kaldırılacak. Kendi basit akordeon bileşenini yaz:

```tsx
// src/components/landing/Accordion.tsx
import { useState } from 'react';
import { Plus } from '@phosphor-icons/react';

interface AccordionItemProps {
  question: string;
  answer: string;
}

// useState ile open/close
// Plus ikonu açıkken 45° rotate (CSS transition)
// height animasyonu: maxHeight: isOpen ? scrollHeight : 0, overflow: hidden, transition
```

---

## SİLİNECEK DOSYALAR

Eski landing bileşenleri silinecek (yenileriyle değişiyor):
- Mevcut src/components/landing/ altındaki ESKİ dosyaları kontrol et
- Yeni dosyalarla çakışan eski dosyaları sil
- Kullanılmayan import'ları temizle

**SİLME — şu dosyalara DOKUNMA:**
- src/components/CookieBanner.tsx
- src/components/FloatingWhatsApp.tsx
- src/components/AnimatedLogo.tsx
- src/lib/* dosyaları
- src/hooks/* dosyaları
- src/pages/PublicMenu.tsx
- src/pages/Login.tsx
- src/pages/Dashboard.tsx
- src/pages/RestaurantDashboard.tsx
- src/pages/SuperAdminDashboard.tsx
- src/components/dashboard/* dosyaları

---

## TEST CHECKLIST

- [ ] npm run build başarılı (TypeScript hata yok)
- [ ] Landing page tüm bölümler görünüyor (9 bölüm doğru sırada)
- [ ] Navbar: logo tıklanınca / 'ye gidiyor
- [ ] Navbar: mobil hamburger menü açılıp kapanıyor
- [ ] Navbar: dropdown menü çalışıyor
- [ ] Hero: Demo butonu /menu/demo'ya gidiyor
- [ ] Hero: İletişime butonu /iletisim'e gidiyor
- [ ] Fiyatlandırma: 3 kart görünüyor, fiyatlar doğru (439/1.167/Özel)
- [ ] Fiyatlandırma: Lansman banner Basic ve Premium kartlarında var, Enterprise'da yok
- [ ] Fiyatlandırma: Üzeri çizili eski fiyat + %20 indirim badge görünüyor
- [ ] Fiyatlandırma: "senelik faturalandırılır" yazıyor
- [ ] Fiyatlandırma: Başla butonları /iletisim?plan=X'e gidiyor
- [ ] FAQ: Akordeon açılıp kapanıyor (animasyonlu)
- [ ] FAQ: 5 soru doğru içerikle (basılı menü sorusu kaldırıldı, alerjen sorusu eklendi)
- [ ] Footer: Tamamı Türkçe
- [ ] Footer: Logo, ürün/şirket/yasal linkleri doğru
- [ ] Footer: Copyright "© 2026 KHP Limited"
- [ ] Footer: Newsletter input + buton görünüyor
- [ ] Blog sayfası: Navbar + Footer yeni tasarım
- [ ] Blog yazı: Navbar + Footer yeni tasarım
- [ ] CTA bölümü: Placeholder logoları kaldırılmış
- [ ] Comparison: BiCheck → Phosphor Check (Thin)
- [ ] HowItWorks: Placeholder ikonları → Phosphor ikonları
- [ ] Tüm placeholder görseller düzeltilmiş (Relume CDN URL'leri kaldırılmış)
- [ ] CookieBanner hâlâ çalışıyor
- [ ] FloatingWhatsApp hâlâ çalışıyor
- [ ] Mobil responsive (hamburger, tek sütun, vs.)
- [ ] /login sayfası etkilenmedi
- [ ] /dashboard sayfası etkilenmedi
- [ ] /menu/:slug sayfası etkilenmedi

---

## ÖNCELİK SIRASI

1. **LandingNavbar** — tüm sayfalarda kullanılacak, önce bunu bitir
2. **LandingFooter** — aynı şekilde tüm sayfalarda
3. **HeroSection** — ana görsel etki
4. **WhyNowSection** — basit, hızlı
5. **HowItWorksSection** — 3 kart
6. **PricingSection** — en karmaşık (lansman banner + fiyat formatı)
7. **ComparisonSection** — 2 kart
8. **FAQSection** — custom akordeon bileşeni gerekiyor
9. **CTASection** — basit
10. **Index.tsx entegrasyonu** — tüm bileşenleri birleştir
11. **Blog sayfaları** — Navbar + Footer güncelleme
12. **Temizlik** — eski dosyaları sil, import'ları düzelt

Her adım sonrası `npm run build` çalıştır.

---

## ÖNEMLİ NOTLAR

- **Tailwind class'ı KULLANMA** — projede Tailwind kurulu değil, tüm stiller inline
- **@relume_io/relume-ui import'u KULLANMA** — bu paket projede yok
- **clsx import'u KULLANMA** — Navbar1.jsx'te var ama projede yok, kaldır
- **"use client" KULLANMA** — bu Next.js direktifi, Vite projesinde gereksiz
- **react-icons KULLANMA** — projede Phosphor Icons var
- **Mevcut Helmet, CookieBanner, FloatingWhatsApp'a DOKUNMA**
- **Mevcut blog verileri (blogData.ts) korunacak** — sadece layout değişiyor
- **framer-motion kullanılabilir** — zaten projede var (kontrol et, yoksa `npm install framer-motion`)
