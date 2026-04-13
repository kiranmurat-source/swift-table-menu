# TABBLED — Landing Page Redesign v2
# Relume Export Doğrudan Kullanım + İçerik Düzeltmeleri

---

## KRİTİK KURAL

**Relume JSX dosyalarının layout'unu, stilini, class'larını DEĞİŞTİRME.**
**Sadece belirtilen içerik düzeltmelerini yap.**
**Tailwind class'larını inline style'a çevirme — Tailwind kurulacak.**

---

## GÖREV ÖZET

1. Tailwind CSS + Relume UI + gerekli bağımlılıkları kur
2. Relume JSX dosyalarını projeye kopyala
3. Sadece belirtilen içerik düzeltmelerini yap (metin, linkler, fiyatlar)
4. Sayfa routing'lerini güncelle

---

## ADIM 1: BAĞIMLILIKLAR

```bash
cd /opt/khp/tabbled

# Tailwind CSS + PostCSS + Autoprefixer
npm install -D tailwindcss @tailwindcss/postcss postcss autoprefixer

# Relume UI + bağımlılıkları
npm install @relume_io/relume-ui

# Relume Tailwind preset
npm install -D @relume_io/relume-tailwind

# Framer Motion (animasyonlar için — zaten kurulu olabilir, kontrol et)
npm install framer-motion

# React Icons (Relume bileşenleri kullanıyor)
npm install react-icons
```

### tailwind.config.js oluştur:

```js
import { relumeTailwind } from '@relume_io/relume-tailwind';

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@relume_io/relume-ui/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  presets: [relumeTailwind],
};
```

### postcss.config.js güncelle:

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### src/index.css'in EN ÜSTÜNE ekle (mevcut stilleri silme):

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**DİKKAT:** Mevcut CSS'leri silme, sadece Tailwind direktiflerini en üste ekle. Mevcut stiller (admin panel, public menü) bozulmamalı.

### Build test:
```bash
npm run build
```

Tailwind kurulumu başarılıysa devam et. Hata varsa ÖNCE düzelt.

---

## ADIM 2: RELUME DOSYALARINI KOPYALA

Relume export dosyaları `/opt/khp/tabbled/tabbled__3_.zip` içinde (veya açılmış hali varsa kullan).

```bash
# Zip'i aç (eğer henüz açılmadıysa)
unzip -o tabbled__3_.zip -d /tmp/relume-export

# Landing page bileşenlerini kopyala
mkdir -p src/components/landing
cp /tmp/relume-export/home/components/Navbar1.jsx src/components/landing/Navbar1.tsx
cp /tmp/relume-export/home/components/Header137.jsx src/components/landing/HeroSection.tsx
cp /tmp/relume-export/home/components/Header64.jsx src/components/landing/WhyNowSection.tsx
cp /tmp/relume-export/home/components/Layout237.jsx src/components/landing/HowItWorksSection.tsx
cp /tmp/relume-export/home/components/Pricing19.jsx src/components/landing/PricingSection.tsx
cp /tmp/relume-export/home/components/Comparison13.jsx src/components/landing/ComparisonSection.tsx
cp /tmp/relume-export/home/components/Faq5.jsx src/components/landing/FAQSection.tsx
cp /tmp/relume-export/home/components/Cta33.jsx src/components/landing/CTASection.tsx
cp /tmp/relume-export/home/components/Footer2.jsx src/components/landing/LandingFooter.tsx

# Blog bileşenlerini kopyala
cp /tmp/relume-export/blog/components/Blog50.jsx src/components/landing/BlogListSection.tsx
cp /tmp/relume-export/blog/components/Cta32.jsx src/components/landing/BlogCTASection.tsx

# Blog post bileşenlerini kopyala
cp /tmp/relume-export/blog-post/components/BlogPostHeader1.jsx src/components/landing/BlogPostHeader.tsx
cp /tmp/relume-export/blog-post/components/Content29.jsx src/components/landing/BlogPostContent.tsx
```

### Her dosyada şu değişiklikleri yap:

1. **"use client" direktifini kaldır** — her dosyanın ilk satırı, sil
2. **Export isimlerini güncelle:**
   - `Navbar1` → `LandingNavbar`
   - `Header137` → `HeroSection`
   - `Header64` → `WhyNowSection`
   - `Layout237` → `HowItWorksSection`
   - `Pricing19` → `PricingSection`
   - `Comparison13` → `ComparisonSection`
   - `Faq5` → `FAQSection`
   - `Cta33` → `CTASection`
   - `Footer2` → `LandingFooter`
   - `Blog50` → `BlogListSection`
   - `Cta32` → `BlogCTASection`
   - `BlogPostHeader1` → `BlogPostHeader`
   - `Content29` → `BlogPostContent`

3. **clsx import'u varsa** (Navbar1.jsx'te): `npm install clsx` veya clsx kullanan satırı düzelt

### Build test:
```bash
npm run build
```

Tüm import'lar çözülmeli. Hata varsa ÖNCE düzelt, sonra devam et.

---

## ADIM 3: İÇERİK DÜZELTMELERİ

**LAYOUT VE STİL'E DOKUNMA. SADECE AŞAĞIDAKİ METİN/LİNK DEĞİŞİKLİKLERİNİ YAP.**

### 3.1 — Navbar1.tsx (LandingNavbar)

**Logo değiştir:**
- `src="https://d22po4pjz3o32e.cloudfront.net/logo-image.svg"` → `src="/tabbled-logo-horizontal.png"`
- `alt="Logo image"` → `alt="Tabbled"`
- Logonun olduğu `<a href="#">` → `<a href="/">`

**Nav link'leri Türkçe (zaten Türkçe olabilir — kontrol et, değilse değiştir):**
- Capabilities → `Özellikler`
- Pricing → `Fiyatlandırma`
- Resources → `Kaynaklar`
- Guides → `Rehberler`
- Dropdown içi: Support → `Destek`, Blog → `Blog`, Pricing → kaldır

**CTA butonları:**
- Demo → `href` veya `onClick` → `/menu/demo` sayfasına yönlendir
- Menu / İletişime Geç → `/iletisim` sayfasına yönlendir

### 3.2 — Header137.tsx (HeroSection)

**Görseller:**
- Portrait placeholder: `src="https://d22po4pjz3o32e.cloudfront.net/placeholder-image-portrait-dim.png"` → `src="/hero-restaurant.webp"`
- Landscape placeholder: `src="https://d22po4pjz3o32e.cloudfront.net/placeholder-image.svg"` → `src="/hero-restaurant.webp"` (aynı görsel veya ikinci bir görsel varsa onu kullan)

**CTA butonları:**
- Demo → `/menu/demo`
- İletişime → `/iletisim`

**Metin değişikliği YAPMA** — mevcut Türkçe metinler doğru.

### 3.3 — Pricing19.tsx (PricingSection)

**Fiyatları değiştir ve lansman banner ekle:**

**Kart 1 — Basic:**
- Relume icon placeholder → kaldır veya bir emoji/ikon koy (opsiyonel)
- Plan ismini ekle: fiyatın üstüne `<p className="font-semibold text-lg mb-2">Basic</p>`
- Eski fiyat + indirim badge ekle (mevcut fiyat elementini değiştir):
```jsx
<div className="flex items-center gap-2 mb-1">
  <span className="text-lg line-through text-gray-400">549 TL+KDV</span>
  <span className="bg-pink-50 text-pink-500 text-xs font-semibold px-2 py-0.5 rounded-full">%20 indirim</span>
</div>
<h3 className="my-2 text-6xl font-bold md:text-9xl lg:text-10xl">
  439 TL <span className="text-base font-normal text-gray-500">+KDV/ay</span>
</h3>
```
- "ayda bir kez faturalandırılır" → `senelik faturalandırılır`
- Kartın EN ÜSTÜNE (border div'in içine, ilk child olarak) lansman banner ekle:
```jsx
<div className="bg-[#FF4F7A] text-white text-sm font-medium text-center py-2 -mx-6 -mt-8 md:-mx-8 md:-mt-8 mb-6 rounded-t-none">
  Lansman Fırsatı — %20 İndirim
</div>
```
- CTA "Başla" butonu → onClick veya href → `/iletisim?plan=basic`

**Kart 2 — Premium:**
- Plan ismi: `<p className="font-semibold text-lg mb-2">Premium</p>`
- Aynı lansman banner (kopyala)
- Eski fiyat: `<span className="text-lg line-through text-gray-400">1.459 TL+KDV</span>` + badge
- Yeni fiyat: `1.167 TL` + `+KDV/ay`
- "senelik faturalandırılır"
- CTA → `/iletisim?plan=premium`

**Kart 3 — Enterprise:**
- Plan ismi: `<p className="font-semibold text-lg mb-2">Enterprise</p>`
- Lansman banner **EKLEME** (bu kartta yok)
- Fiyat "Özel" olarak kalsın
- "senelik faturalandırılır"
- Son özellik satırındaki "İletişime geç" → kaldır (CTA butonu zaten var)
- CTA → `/iletisim?plan=enterprise`

**Tüm kartlarda:**
- Relume icon placeholder görselleri (`relume-icon.svg`) → kaldır veya küçük bir div ile değiştir

### 3.4 — Faq5.tsx (FAQSection)

**4. soruyu değiştir (item-3):**

Eski:
```
Basılı menüler otomatik olarak güncellenir mi?
Evet. Basılı menü şablonlarını tasarlayın...
```

Yeni:
```
AccordionTrigger: "Alerjen ve besin bilgisi nasıl yönetiliyor?"
AccordionContent: "Tabbled, 14 AB zorunlu alerjen ve 4 diyet tercihini (vejetaryen, vegan, helal, koşer) destekler. Her ürün için besin değerleri tablosu ekleyebilir ve bunları menüde gösterebilirsiniz. Yasal uyum otomatik olarak sağlanır."
```

**3. sorunun cevabını düzelt (item-2 — dil desteği):**

Eski cevap yerine:
```
"Tabbled tüm planlarda 34 dile kadar destek sunar. Google Translate API ile otomatik çeviri yapılır. Türkçe, İngilizce, Arapça, Almanca, Fransızca, Rusça, Çince ve daha fazlası dahildir."
```

**5. sorunun cevabını düzelt (item-4 — destek):**

Eski cevap yerine:
```
"Tüm planlar e-posta ve WhatsApp desteğine sahiptir. Enterprise müşteriler adanmış bir hesap yöneticisi alır. Canlı demo ve kurulum desteği ücretsizdir."
```

### 3.5 — Footer2.tsx (LandingFooter)

**Logo:**
- `src="https://d22po4pjz3o32e.cloudfront.net/logo-image.svg"` → `src="/tabbled-logo-horizontal.png"`
- `alt="Logo image"` → `alt="Tabbled"`

**Sütun başlıkları ve linkler Türkçeye çevir:**

Sütun 1 — "Product" → **"Ürün"**:
- Features → `Özellikler` (href="#ozellikler")
- Pricing → `Fiyatlandırma` (href="#fiyatlandirma")
- How it works → `Nasıl Çalışır` (href="#nasil-calisir")
- FAQ → `SSS` (href="#sss")
- Company → `Demo` (href="/menu/demo")

Sütun 2 — "About" → **"Şirket"**:
- Blog → `Blog` (href="/blog")
- Careers → kaldır
- Contact → `İletişim` (href="/iletisim")
- Support → `Destek` (href="/iletisim")
- Resources → kaldır

Sütun 3 — "Documentation" → **"Yasal"**:
- API → kaldır
- Status → kaldır
- Community → kaldır
- Legal → `Kullanım Koşulları` (href="#")
- Privacy → `Gizlilik Politikası` (href="/privacy")

**Newsletter bölümü Türkçeye çevir:**
- "Updates" → `Güncellemeler`
- "Stay informed about product updates and new features." → `Ürün güncellemeleri ve yeni özelliklerden haberdar olun.`
- placeholder: "your@email.com" → `e-posta@adresiniz.com`
- "Subscribe" → `Abone Ol`
- "We respect your privacy. Unsubscribe at any time." → `Gizliliğinize saygı duyuyoruz. İstediğiniz zaman abonelikten çıkabilirsiniz.`

**Copyright:**
- "© 2024 Tabbled. All rights reserved." → `© 2026 KHP Limited. Tüm hakları saklıdır.`

### 3.6 — Cta33.tsx (CTASection)

**CTA butonları:**
- Demo → `/menu/demo`
- İletişime Geç → `/iletisim`

**Partner logoları (Webflow/Relume placeholder) → TAMAMEN KALDIR.** Logo img'lerini ve sarmalayan div'i sil. Sadece başlık + açıklama + butonlar kalsın.

### 3.7 — Layout237.tsx (HowItWorksSection)

**İkon placeholder'ları değiştir:**
- 3 adet `relume-icon.svg` → kaldır veya basit bir numara/emoji ile değiştir:
  - Adım 1: `<span className="text-4xl">1</span>` veya `📋`
  - Adım 2: `<span className="text-4xl">2</span>` veya `📱`
  - Adım 3: `<span className="text-4xl">3</span>` veya `📊`

**CTA butonları:**
- Demo → `/menu/demo`
- "Daha fazla" → href="#ozellikler"

### 3.8 — Comparison13.tsx (ComparisonSection)

**İkon placeholder'ları değiştir:**
- Sol kart (Tabbled): `relume-icon.svg` → `/tabbled-logo-icon.png`
- Sağ kart (Basit QR): `relume-icon.svg` → kaldır veya basit QR emoji `📱`

### 3.9 — BlogListSection.tsx, BlogCTASection.tsx

**Blog başlıkları Türkçeye çevir:**
- "Insights" → `Blog`
- "What's happening in hospitality" → `Restoran dünyasından içgörüler`
- "Stories, strategies, and lessons from the table" → `Stratejiler, rehberler ve sektör trendleri`
- Blog kart başlıkları ve açıklamaları → Türkçe (mevcut blogData'dan alınacak veya Türkçe placeholder yazılacak)
- "Read more" → `Devamını oku`
- "View all" → `Tümünü gör`
- Kategori badge'leri: Operations → `Operasyon`, Technology → `Teknoloji`, Growth → `Büyüme`, Strategy → `Strateji`

**BlogCTASection:**
- "Stay ahead in hospitality" → `Restoran sektöründe bir adım önde olun`
- "Get weekly insights..." → `Menü yönetimi, misafir deneyimi ve restoran operasyonları hakkında haftalık içgörüler alın`
- "Your email address" → `E-posta adresiniz`
- "Subscribe" → `Abone Ol`
- Alt metin Türkçe: `Gizliliğinize saygı duyuyoruz. Her e-postadan abonelikten çıkabilirsiniz.`

---

## ADIM 4: SAYFA ROUTING

### src/pages/Index.tsx — Landing Page

Mevcut Index.tsx'i yeniden yaz. ESKİ bileşen import'larını kaldır, YENİ bileşenleri kullan:

```tsx
import { Helmet } from 'react-helmet-async';
import { LandingNavbar } from '@/components/landing/Navbar1';
import { HeroSection } from '@/components/landing/HeroSection';
import { WhyNowSection } from '@/components/landing/WhyNowSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { ComparisonSection } from '@/components/landing/ComparisonSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { CTASection } from '@/components/landing/CTASection';
import { LandingFooter } from '@/components/landing/LandingFooter';
import CookieBanner from '@/components/CookieBanner';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';

export default function Index() {
  return (
    <>
      <Helmet>
        <title>Tabbled — Restoran Dijital Menü Platformu</title>
        <meta name="description" content="QR menüden fazlası: restoranınız için tek dijital merkez. Menü yönetimi, AI araçları, garson çağırma, çok dilli destek." />
      </Helmet>
      <LandingNavbar />
      <HeroSection />
      <WhyNowSection />
      <HowItWorksSection />
      <PricingSection />
      <ComparisonSection />
      <FAQSection />
      <CTASection />
      <LandingFooter />
      <CookieBanner />
      <FloatingWhatsApp />
    </>
  );
}
```

**NOT:** Import path'lerini dosya isimlerine göre ayarla. Export isimleri ADIM 2'de değiştirildi.

**ESKİ landing bileşenlerini SİLME** — yeni bileşenler farklı dosya isimlerinde. Eski dosyalar kullanılmıyorsa build sonrası tree-shake ile temizlenir. Eğer import hatası çıkmazsa dokunma.

### Blog ve BlogPost sayfaları

Şimdilik dokunma. Landing page başarılı olduktan sonra ayrı bir adımda güncellenecek.

---

## ADIM 5: BUILD VE TEST

```bash
npm run build
```

### Kontrol listesi:
- [ ] Build başarılı (hata yok)
- [ ] Landing page'de 9 bölüm sırayla görünüyor
- [ ] Logo doğru (tabbled-logo-horizontal.png)
- [ ] Navbar linkleri Türkçe
- [ ] Hero görseli görünüyor (hero-restaurant.webp)
- [ ] Fiyatlandırma: 3 kart, doğru fiyatlar (439/1.167/Özel)
- [ ] Lansman banner Basic ve Premium'da var, Enterprise'da yok
- [ ] Üzeri çizili eski fiyat görünüyor
- [ ] %20 indirim badge görünüyor
- [ ] "senelik faturalandırılır" yazıyor
- [ ] FAQ: 5 soru, basılı menü sorusu YOK, alerjen sorusu VAR
- [ ] Footer tamamen Türkçe
- [ ] Copyright "© 2026 KHP Limited"
- [ ] CTA bölümünde Webflow/Relume logoları YOK
- [ ] Placeholder relume-icon.svg görselleri kaldırılmış
- [ ] CookieBanner çalışıyor
- [ ] FloatingWhatsApp çalışıyor
- [ ] /login çalışıyor (etkilenmedi)
- [ ] /dashboard çalışıyor (etkilenmedi)
- [ ] /menu/:slug çalışıyor (etkilenmedi)
- [ ] Mobil hamburger menü çalışıyor

### Başarılıysa:
```bash
git add -A
git commit -m "feat: landing page redesign — Relume layout + Tailwind + içerik düzeltmeleri"
git push origin main
```

---

## ÖNCELİK SIRASI

1. ADIM 1 — Tailwind + Relume UI kur → build test
2. ADIM 2 — Relume dosyalarını kopyala, "use client" kaldır, export isimlerini güncelle → build test
3. ADIM 3 — İçerik düzeltmeleri (logo, fiyat, Türkçe, FAQ, footer) → build test
4. ADIM 4 — Index.tsx routing → build test
5. ADIM 5 — Final build + git push

**HER ADIM SONRASI `npm run build` ÇALIŞTIR. Hata varsa ÖNCE düzelt, sonra sonraki adıma geç.**

---

## DOKUNMA LİSTESİ

Bu dosyalara DOKUNMA:
- src/pages/Login.tsx
- src/pages/Dashboard.tsx
- src/pages/RestaurantDashboard.tsx
- src/pages/SuperAdminDashboard.tsx
- src/pages/PublicMenu.tsx
- src/pages/Blog.tsx (şimdilik)
- src/pages/BlogPost.tsx (şimdilik)
- src/components/dashboard/*
- src/components/CookieBanner.tsx
- src/components/FloatingWhatsApp.tsx
- src/lib/*
- src/hooks/*
- supabase/*
