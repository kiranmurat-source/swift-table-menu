# TABBLED — Blog Altyapısı
## Claude Code Prompt — 14 Nisan 2026

---

## BAĞLAM

Tabbled.com React + Vite + TypeScript SPA. Vercel'de deploy, vercel.json rewrites ile SPA routing.
Mevcut sayfalar: Index (landing), Login, Dashboard, PublicMenu, PrivacyPolicy, NotFound.
SEO: react-helmet-async mevcut. JSON-LD (Organization) mevcut.
Font: Playfair Display (başlıklar) + Inter (body). Marka: #FF4F7A / #1C1C1E / #F7F7F8.
Navbar ve Footer bileşenleri mevcut (landing page'de).

**Amaç:** tabbled.com/blog ve tabbled.com/blog/:slug rotalarını oluşturmak. Makale verisi statik JS dosyasında tutulacak (DB yok). SEO optimize (Article Schema, FAQ Schema, breadcrumb, OG tags). Blog landing page'in parçası gibi hissedecek (aynı navbar, footer).

---

## YAPILACAKLAR

### 1. Routing Güncellemesi

**Dosya:** `src/App.tsx` (veya routing dosyası)

Yeni rotalar ekle:
```typescript
<Route path="/blog" element={<Blog />} />
<Route path="/blog/:slug" element={<BlogPost />} />
```

Lazy loading:
```typescript
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
```

### 2. Vercel Rewrites

**Dosya:** `vercel.json`

Mevcut rewrites'a ekle (SPA routing için):
```json
{
  "rewrites": [
    { "source": "/blog", "destination": "/index.html" },
    { "source": "/blog/:slug", "destination": "/index.html" },
    // ... mevcut rewrites
  ]
}
```

**ÖNEMLİ:** Mevcut rewrites'ı bozmadan ekle. Sıralama önemli — spesifik rotalar genel catch-all'dan önce gelmeli.

---

### 3. Makale Veri Yapısı

**Dosya:** `src/lib/blogData.ts`

```typescript
export interface BlogPost {
  slug: string;
  title: string;
  metaTitle: string;          // SEO title (max 60 karakter)
  metaDescription: string;    // SEO description (max 160 karakter)
  category: 'yasal' | 'rehber' | 'ipuclari' | 'urun';
  categoryLabel: string;      // "Yasal Düzenlemeler" | "Rehberler" | "İpuçları" | "Ürün"
  excerpt: string;            // Kart özeti (max 200 karakter)
  content: string;            // HTML içerik (markdown'dan dönüştürülmüş)
  author: string;
  publishedAt: string;        // ISO date
  updatedAt: string;          // ISO date
  readingTime: number;        // dakika
  ogImage?: string;           // OG görsel URL (opsiyonel)
  tags: string[];
  faq?: { question: string; answer: string }[];  // FAQ Schema için
  relatedSlugs: string[];     // İlgili makale slug'ları
}

export const blogPosts: BlogPost[] = [
  // Makaleler buraya eklenecek
  // Şimdilik boş dizi — makaleler ayrı prompt ile eklenecek
];

// Helper fonksiyonlar
export const getPostBySlug = (slug: string): BlogPost | undefined =>
  blogPosts.find(p => p.slug === slug);

export const getPostsByCategory = (category: string): BlogPost[] =>
  blogPosts.filter(p => p.category === category);

export const getRelatedPosts = (post: BlogPost): BlogPost[] =>
  post.relatedSlugs
    .map(slug => getPostBySlug(slug))
    .filter(Boolean) as BlogPost[];

export const getAllCategories = (): { id: string; label: string; count: number }[] => {
  const categories = new Map<string, { label: string; count: number }>();
  blogPosts.forEach(post => {
    const existing = categories.get(post.category);
    if (existing) {
      existing.count++;
    } else {
      categories.set(post.category, { label: post.categoryLabel, count: 1 });
    }
  });
  return Array.from(categories.entries()).map(([id, data]) => ({ id, ...data }));
};
```

**Placeholder makale (test için 1 tane ekle):**
```typescript
{
  slug: 'qr-menu-zorunlulugu-2026',
  title: '2026 QR Menü Zorunluluğu: Restoran Sahipleri İçin Tam Rehber',
  metaTitle: '2026 QR Menü Zorunluluğu | Restoran Rehberi - Tabbled',
  metaDescription: '2026 QR menü zorunluluğu hakkında bilmeniz gereken her şey. Fiyat etiketi yönetmeliği, cezalar, uyum adımları ve dijital menü çözümleri.',
  category: 'yasal',
  categoryLabel: 'Yasal Düzenlemeler',
  excerpt: '11 Ekim 2025 Resmi Gazete\'de yayımlanan yönetmelik ile QR menü zorunluluğu başladı. İşletmelerin bilmesi gerekenler.',
  content: '<p>Bu makale yakında yayınlanacak.</p>',
  author: 'Tabbled Ekibi',
  publishedAt: '2026-04-14T00:00:00Z',
  updatedAt: '2026-04-14T00:00:00Z',
  readingTime: 10,
  tags: ['QR menü', 'zorunluluk', 'fiyat etiketi yönetmeliği', '2026'],
  faq: [
    {
      question: 'QR menü zorunlu mu?',
      answer: '11 Ekim 2025 tarihli Fiyat Etiketi Yönetmeliği ile QR kodlu menü gösterimi yasal olarak desteklenmektedir. 1 Ocak 2026 itibarıyla tam zorunluluk başlamıştır.'
    },
    {
      question: 'QR menü kullanmazsam ne olur?',
      answer: 'Fiyat etiketi yönetmeliğine uymamanın cezası 3.166 TL idari para cezasıdır. Denetimler Ticaret Bakanlığı tarafından yapılmaktadır.'
    },
    {
      question: 'QR menü sistemi ne kadar?',
      answer: 'QR menü sistemi fiyatları aylık 250 TL ile 4.200 TL arasında değişmektedir. Tabbled aylık 300 TL\'den başlayan fiyatlarla hizmet vermektedir.'
    }
  ],
  relatedSlugs: ['qr-menu-nedir', 'qr-menu-fiyatlari-2026']
}
```

---

### 4. Blog Ana Sayfa (/blog)

**Dosya:** `src/pages/Blog.tsx`

**Tasarım:**

```
┌─────────────────────────────────────────────────────────────┐
│  [Navbar — mevcut landing page navbar'ı]                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Blog                                                       │
│  Restoran dijital menü dünyasından rehberler,               │
│  ipuçları ve güncel yasal düzenlemeler.                     │
│                                                             │
│  [Tümü] [Yasal Düzenlemeler] [Rehberler] [İpuçları] [Ürün] │
│                                                             │
│  ┌─────────────────────────┐ ┌─────────────────────────┐   │
│  │ [Kategori Badge]        │ │ [Kategori Badge]        │   │
│  │                         │ │                         │   │
│  │ Makale Başlığı Buraya   │ │ Makale Başlığı Buraya   │   │
│  │ Gelecek İki Satır       │ │ Gelecek İki Satır       │   │
│  │                         │ │                         │   │
│  │ Özet metni burada...    │ │ Özet metni burada...    │   │
│  │                         │ │                         │   │
│  │ 📅 14 Nis 2026 · 10 dk │ │ 📅 14 Nis 2026 · 8 dk  │   │
│  └─────────────────────────┘ └─────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────┐ ┌─────────────────────────┐   │
│  │ ...                     │ │ ...                     │   │
│  └─────────────────────────┘ └─────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🚀 Dijital menünüzü bugün oluşturun                │   │
│  │ [WhatsApp ile İletişim]    [Fiyatları İncele]       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [Footer — mevcut landing page footer'ı]                    │
└─────────────────────────────────────────────────────────────┘
```

**Kategori Filtresi:**
- Pill/chip toggle'lar: Tümü, Yasal Düzenlemeler, Rehberler, İpuçları, Ürün
- Aktif: #FF4F7A arka plan, beyaz metin
- Pasif: gri border, koyu metin
- Tıklayınca makale kartları filtrelenir

**Makale Kartı:**
- Beyaz arka plan, hafif gölge, border-radius 12px
- Üst sol: kategori badge (küçük, renkli pill)
  - Yasal: mavi (#3B82F6)
  - Rehber: yeşil (#10B981)
  - İpuçları: turuncu (#F59E0B)
  - Ürün: pembe (#FF4F7A)
- Başlık: Playfair Display 600, 18-20px, max 2 satır
- Özet: Inter 400, 14px, muted renk, max 3 satır
- Alt: tarih + okuma süresi (Inter 300, 12px, muted)
- Hover: translateY(-2px) + gölge artışı
- Tıklama: /blog/{slug}'a yönlendir

**Grid:**
- Desktop: 2 sütun
- Tablet: 2 sütun
- Mobil: 1 sütun
- Gap: 24px

**SEO (Helmet):**
```
title: "Blog — Restoran Dijital Menü Rehberi | Tabbled"
description: "QR menü, dijital menü sistemi, restoran pazarlama ve yasal düzenlemeler hakkında rehberler ve ipuçları."
og:type: "website"
og:url: "https://tabbled.com/blog"
canonical: "https://tabbled.com/blog"
```

**Alt CTA Banner:**
- Makale listesinin altında
- Arka plan: açık pembe gradient (#FFF0F3 → #FFFFFF)
- Başlık: "Dijital menünüzü bugün oluşturun"
- Alt metin: "QR menü zorunluluğuna uyum sağlayın. FineDine özellikleri, uygun fiyat."
- 2 buton: "WhatsApp ile İletişim" (pembe) + "Fiyatları İncele" (outline)
- WhatsApp linki: `https://wa.me/905325119484?text=Merhaba, Tabbled hakkında bilgi almak istiyorum.`
- Fiyatlar linki: `/#pricing`

**Boş Durum (makale yoksa):**
- "Yakında blog yazıları yayınlanacak. Takipte kalın!"

---

### 5. Blog Makale Sayfası (/blog/:slug)

**Dosya:** `src/pages/BlogPost.tsx`

**Tasarım:**

```
┌─────────────────────────────────────────────────────────────┐
│  [Navbar]                                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Ana Sayfa > Blog > Yasal Düzenlemeler                      │
│  (breadcrumb — küçük, muted, tıklanabilir)                  │
│                                                             │
│  [Yasal Düzenlemeler]  (kategori badge)                     │
│                                                             │
│  2026 QR Menü Zorunluluğu:                                  │
│  Restoran Sahipleri İçin Tam Rehber                         │
│  (H1, Playfair Display 700, 28-36px)                        │
│                                                             │
│  📅 14 Nisan 2026 · ⏱ 10 dk okuma · Tabbled Ekibi         │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  ┌──────────────────────────────┐ ┌──────────────────────┐ │
│  │                              │ │ İÇİNDEKİLER         │ │
│  │  Makale içeriği burada       │ │                      │ │
│  │  H2 başlıklar, paragraflar  │ │ 1. Giriş             │ │
│  │  listeler, tablolar,        │ │ 2. Yönetmelik        │ │
│  │  görseller...               │ │ 3. Zorunluluklar     │ │
│  │                              │ │ 4. Cezalar           │ │
│  │  [Satır İçi CTA]            │ │ 5. Nasıl Uyum        │ │
│  │                              │ │                      │ │
│  │  Devam eden içerik...       │ │ ────────────────────  │ │
│  │                              │ │                      │ │
│  │                              │ │ 📱 Ücretsiz Demo    │ │
│  │                              │ │ 5 dakikada           │ │
│  │                              │ │ menünüzü oluşturun   │ │
│  │                              │ │ [Demo Talep Et]      │ │
│  │                              │ └──────────────────────┘ │
│  │                              │                          │
│  │  SSS (FAQ)                   │                          │
│  │  ─────────                   │                          │
│  │  Q: Soru 1?                  │                          │
│  │  A: Cevap 1...               │                          │
│  │  Q: Soru 2?                  │                          │
│  │  A: Cevap 2...               │                          │
│  └──────────────────────────────┘                          │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  İlgili Yazılar                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                   │
│  │ Makale 1 │ │ Makale 2 │ │ Makale 3 │                   │
│  └──────────┘ └──────────┘ └──────────┘                   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🚀 Alt CTA Banner                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [Footer]                                                   │
└─────────────────────────────────────────────────────────────┘
```

**Breadcrumb:**
- `Ana Sayfa > Blog > {Kategori Adı}`
- Her parça tıklanabilir link
- Son parça bold, tıklanamaz
- BreadcrumbList Schema (JSON-LD)

**Başlık Alanı:**
- Kategori badge (renkli pill)
- H1 başlık: Playfair Display 700, 28px (mobil) / 36px (desktop)
- Meta bilgi: tarih + okuma süresi + yazar (Inter 300, 14px, muted)
- Separator çizgi

**İçerik Alanı:**
- Sol: makale içeriği (max-width 720px)
  - HTML render (dangerouslySetInnerHTML)
  - H2: Playfair Display 600, 24px, margin-top 32px
  - H3: Inter 600, 20px, margin-top 24px
  - Paragraf: Inter 400, 16px, line-height 1.75, renk #374151
  - Liste: disc/decimal, padding-left 24px
  - Tablo: border, alternatif satır rengi
  - Blockquote: sol pembe border, açık pembe arka plan
  - Link: #FF4F7A renk, underline on hover
  - Görsel: max-width 100%, border-radius 8px, margin 24px 0

- Sağ (desktop only, sticky): İçindekiler + CTA kutusu
  - İçindekiler (TOC): makale H2'lerinden otomatik oluşturulur
    - Başlık: "İÇİNDEKİLER" (Inter 600, 12px, uppercase, muted)
    - Liste: H2'ler link olarak, tıklayınca smooth scroll
    - Aktif bölüm vurgulanır (scroll-spy)
  - CTA kutusu: "Ücretsiz Demo" + buton
    - Border: 1px solid #E5E7EB, border-radius 12px
    - Padding: 24px
    - Buton: "Demo Talep Et" → WhatsApp linki

- Mobil: TOC gizli, CTA makale sonunda

**FAQ Bölümü:**
- Makale sonunda, content'in altında
- Başlık: "Sıkça Sorulan Sorular" (H2)
- Akordeon tarzı: soru tıklanınca cevap açılır
- Varsayılan: ilk soru açık, diğerleri kapalı
- Soru: Inter 600, 16px
- Cevap: Inter 400, 14px, muted renk

**İlgili Yazılar:**
- FAQ'nun altında
- Başlık: "İlgili Yazılar" (H2)
- 3 makale kartı (Blog ana sayfadaki kartlarla aynı bileşen)
- relatedSlugs'dan çekilir
- Mobil: yatay scroll veya tek sütun

**Alt CTA Banner:**
- Blog ana sayfadakiyle aynı

**404 Durumu:**
- Slug bulunamazsa NotFound sayfasına yönlendir

---

### 6. SEO Bileşenleri

**Article Schema (JSON-LD) — her makale sayfasında:**
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "{title}",
  "description": "{metaDescription}",
  "author": {
    "@type": "Organization",
    "name": "Tabbled",
    "url": "https://tabbled.com"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Tabbled",
    "url": "https://tabbled.com",
    "logo": {
      "@type": "ImageObject",
      "url": "https://tabbled.com/tabbled-logo-icon.png"
    }
  },
  "datePublished": "{publishedAt}",
  "dateModified": "{updatedAt}",
  "mainEntityOfPage": "https://tabbled.com/blog/{slug}",
  "image": "{ogImage || default}"
}
```

**FAQ Schema (JSON-LD) — FAQ'su olan makalelerde:**
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "{question}",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "{answer}"
      }
    }
  ]
}
```

**BreadcrumbList Schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Ana Sayfa", "item": "https://tabbled.com" },
    { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://tabbled.com/blog" },
    { "@type": "ListItem", "position": 3, "name": "{categoryLabel}", "item": "https://tabbled.com/blog?category={category}" }
  ]
}
```

**Helmet (her makale):**
```
title: "{metaTitle}"
description: "{metaDescription}"
canonical: "https://tabbled.com/blog/{slug}"
og:type: "article"
og:title: "{metaTitle}"
og:description: "{metaDescription}"
og:url: "https://tabbled.com/blog/{slug}"
og:image: "{ogImage}"
article:published_time: "{publishedAt}"
article:modified_time: "{updatedAt}"
article:author: "Tabbled"
article:section: "{categoryLabel}"
article:tag: "{tags}"
```

---

### 7. Navbar + Footer Güncellemesi

**Navbar:**
- Mevcut menü item'larının arasına "Blog" ekle
- Link: `/blog`
- Konumu: "Fiyatlandırma" ile "Giriş" arasında (veya uygun yere)

**Footer:**
- "Kaynaklar" veya "Blog" bölümü ekle
- İlk 3-5 makale başlığı link olarak
- "Tüm yazılar →" linki `/blog`'a

---

### 8. İçerik Stilleri

**Dosya:** `src/index.css` (veya ayrı blog.css)

Blog makale içeriği için stiller:

```css
.blog-content h2 {
  font-family: 'Playfair Display', serif;
  font-weight: 600;
  font-size: 24px;
  margin-top: 40px;
  margin-bottom: 16px;
  color: #1C1C1E;
  letter-spacing: -0.03em;
  line-height: 1.15;
}

.blog-content h3 {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 20px;
  margin-top: 32px;
  margin-bottom: 12px;
  color: #1C1C1E;
}

.blog-content p {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 1.75;
  margin-bottom: 16px;
  color: #374151;
}

.blog-content ul, .blog-content ol {
  padding-left: 24px;
  margin-bottom: 16px;
}

.blog-content li {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  line-height: 1.75;
  margin-bottom: 8px;
  color: #374151;
}

.blog-content table {
  width: 100%;
  border-collapse: collapse;
  margin: 24px 0;
  font-size: 14px;
}

.blog-content th, .blog-content td {
  border: 1px solid #E5E7EB;
  padding: 12px 16px;
  text-align: left;
}

.blog-content th {
  background: #F9FAFB;
  font-weight: 600;
}

.blog-content tr:nth-child(even) {
  background: #F9FAFB;
}

.blog-content blockquote {
  border-left: 4px solid #FF4F7A;
  background: #FFF0F3;
  padding: 16px 24px;
  margin: 24px 0;
  border-radius: 0 8px 8px 0;
  font-style: italic;
  color: #6B7280;
}

.blog-content a {
  color: #FF4F7A;
  text-decoration: none;
}

.blog-content a:hover {
  text-decoration: underline;
}

.blog-content img {
  max-width: 100%;
  border-radius: 8px;
  margin: 24px 0;
}

/* Satır içi CTA kutusu */
.blog-cta-inline {
  background: #FFF0F3;
  border: 1px solid #FECDD3;
  border-radius: 12px;
  padding: 20px 24px;
  margin: 32px 0;
  text-align: center;
}

.blog-cta-inline a {
  display: inline-block;
  background: #FF4F7A;
  color: white;
  padding: 10px 24px;
  border-radius: 8px;
  font-weight: 500;
  margin-top: 8px;
  text-decoration: none;
}

.blog-cta-inline a:hover {
  background: #E63E68;
  text-decoration: none;
}
```

---

### 9. TOC (İçindekiler) Otomatik Oluşturma

**Dosya:** `src/lib/blogUtils.ts`

```typescript
export interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export const extractTOC = (htmlContent: string): TOCItem[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const headings = doc.querySelectorAll('h2, h3');
  return Array.from(headings).map((heading, index) => ({
    id: `heading-${index}`,
    text: heading.textContent || '',
    level: parseInt(heading.tagName[1]),
  }));
};

// Content'e heading ID'leri ekle (scroll-to-section için)
export const addHeadingIds = (htmlContent: string): string => {
  let index = 0;
  return htmlContent.replace(/<h([23])>(.*?)<\/h[23]>/g, (match, level, text) => {
    const id = `heading-${index++}`;
    return `<h${level} id="${id}">${text}</h${level}>`;
  });
};

// Okuma süresi hesapla
export const calculateReadingTime = (htmlContent: string): number => {
  const text = htmlContent.replace(/<[^>]*>/g, '');
  const words = text.split(/\s+/).length;
  return Math.ceil(words / 200);
};

// Tarih formatla
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};
```

---

### 10. Bileşen Listesi

| Dosya | Açıklama |
|-------|----------|
| `src/pages/Blog.tsx` | Blog ana sayfa (makale listesi + kategori filtre) |
| `src/pages/BlogPost.tsx` | Makale detay (içerik + TOC + FAQ + ilgili yazılar) |
| `src/components/BlogCard.tsx` | Makale kartı (tekrar kullanılabilir) |
| `src/components/BlogCTA.tsx` | CTA banner (alt + sidebar, tekrar kullanılabilir) |
| `src/components/BlogFAQ.tsx` | FAQ akordeon bileşeni |
| `src/components/BlogTOC.tsx` | İçindekiler sidebar (desktop sticky) |
| `src/components/BlogBreadcrumb.tsx` | Breadcrumb navigasyonu |
| `src/lib/blogData.ts` | Makale veri yapısı + helper fonksiyonlar |
| `src/lib/blogUtils.ts` | TOC, okuma süresi, tarih format utils |

---

## TEKNİK KISITLAMALAR

1. **DB kullanma** — tüm veri statik JS dosyasında
2. **Yeni npm paketi kurma** — mevcut paketlerle çöz
3. **shadcn/ui iç Lucide'a dokunma**
4. **İkon:** Circum Icons (CiCalendarDate, CiClock2, CiUser, CiHashtag)
5. **Font:** Playfair Display (başlıklar) + Inter (body)
6. **Marka:** #FF4F7A, #1C1C1E, #F7F7F8
7. **Spacing:** 4'ün katları
8. **Mevcut Navbar ve Footer bileşenlerini kullan** (yeni oluşturma, mevcut olanı import et)
9. **Lazy loading:** Blog ve BlogPost sayfaları lazy loaded
10. **Responsive:** mobil-first, TOC mobilde gizli

---

## TEST SENARYOLARI

1. `/blog` → makale listesi görünsün
2. `/blog` → kategori filtre çalışsın
3. `/blog/qr-menu-zorunlulugu-2026` → makale görünsün
4. `/blog/olmayan-slug` → 404 sayfası
5. Breadcrumb linkleri çalışsın
6. TOC linklerine tıkla → smooth scroll
7. FAQ akordeon aç/kapat
8. İlgili yazılar kartları doğru
9. CTA butonları doğru linklere gitsin
10. Navbar'da "Blog" linki çalışsın
11. Footer'da blog linkleri çalışsın
12. Mobilde responsive (TOC gizli, tek sütun)
13. SEO: page source'ta Article Schema, FAQ Schema, breadcrumb
14. SEO: title, description, canonical, OG tags doğru
15. Vercel deploy sonrası `/blog` ve `/blog/:slug` çalışsın (SPA routing)

---

## ÖNCELİK SIRASI

1. `blogData.ts` + `blogUtils.ts` (veri yapısı + helpers)
2. `Blog.tsx` (ana sayfa)
3. `BlogPost.tsx` (makale detay)
4. `BlogCard.tsx` + `BlogCTA.tsx` + `BlogFAQ.tsx` + `BlogTOC.tsx` + `BlogBreadcrumb.tsx`
5. CSS stilleri (blog-content)
6. Routing güncellemesi (App.tsx)
7. Vercel rewrites
8. Navbar + Footer güncelle
9. SEO: Schema'lar (Article, FAQ, Breadcrumb)
10. Test
