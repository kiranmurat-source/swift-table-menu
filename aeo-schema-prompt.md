# CLAUDE CODE PROMPT — AEO (Answer Engine Optimization)
## Organization Schema + SoftwareApplication Schema + Restaurant Schema + FAQ Answer-First

---

## GÖREV ÖZETI

AI arama motorları (ChatGPT, Perplexity, Google AI Overview, Gemini) tarafından Tabbled'ın bulunup alıntılanmasını sağlamak için 4 iş yapılacak:

1. **Organization + SoftwareApplication Schema** — Landing page'e (Index.tsx)
2. **Restaurant Schema** — Public menü sayfalarına (PublicMenu.tsx)
3. **Blog FAQ cevaplarını answer-first formatına dönüştür** — blogData.ts
4. **Entity tutarlılığı kontrolü** — Tüm sayfalarda Tabbled tanımı aynı olsun

---

## PROJE BİLGİLERİ

- **Proje dizini:** /opt/khp/tabbled/
- **Stack:** React + Vite + TypeScript
- **SEO kütüphanesi:** react-helmet-async
- **Mevcut Schema'lar:** Article Schema, FAQ Schema, BreadcrumbList Schema (blog sayfalarında)
- **Domain:** tabbled.com
- **Marka:** Tabbled — KHP Limited tarafından işletilen QR dijital menü platformu
- **Hedef pazar:** Türkiye (restoran, kafe, otel, pastane)
- **Fiyatlandırma:** Basic 300 TL/ay, Pro 600 TL/ay, Premium 1.200 TL/ay (yıllık ödeme)

---

## İŞ 1: ORGANIZATION + SOFTWAREAPPLICATION SCHEMA

### Dosya: src/pages/Index.tsx

Landing page'in Helmet bölümüne JSON-LD olarak ekle. Mevcut Helmet tag'lerine EKLE, mevcut olanları silme.

### Organization Schema

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://tabbled.com/#organization",
  "name": "Tabbled",
  "legalName": "KHP Limited",
  "url": "https://tabbled.com",
  "logo": "https://tabbled.com/og-image.png",
  "description": "Türkiye'deki restoran, kafe ve oteller için QR kod ile dijital menü platformu. Çok dilli menü, online sipariş ve müşteri yönetimi çözümleri sunar.",
  "foundingDate": "2025",
  "areaServed": {
    "@type": "Country",
    "name": "Turkey"
  },
  "serviceType": ["QR Menü", "Dijital Menü", "Restoran Teknolojisi"],
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "info@tabbled.com",
    "contactType": "customer service",
    "availableLanguage": ["Turkish", "English"]
  },
  "sameAs": []
}
```

**NOT:** `sameAs` dizisi şu an boş çünkü sosyal medya hesapları henüz aktif değil. Sosyal medya hesapları açıldığında buraya eklenecek (Instagram, LinkedIn, X URL'leri).

### SoftwareApplication Schema

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": "https://tabbled.com/#software",
  "name": "Tabbled",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "description": "Restoran, kafe ve oteller için QR kod tabanlı dijital menü yönetim platformu. Çok dilli menü, garson çağırma, WhatsApp sipariş, geri bildirim ve indirim kodu özellikleri sunar.",
  "url": "https://tabbled.com",
  "provider": {
    "@id": "https://tabbled.com/#organization"
  },
  "offers": [
    {
      "@type": "Offer",
      "name": "Basic Plan",
      "price": "3600",
      "priceCurrency": "TRY",
      "billingDuration": "P1Y",
      "description": "QR menü, alerjen bilgisi, QR kod özelleştirme, işletme künyesi. 1 kullanıcı, 1 şube."
    },
    {
      "@type": "Offer",
      "name": "Pro Plan",
      "price": "7200",
      "priceCurrency": "TRY",
      "billingDuration": "P1Y",
      "description": "Basic özellikleri + çok dilli menü (2 dil), happy hour, garson çağırma, WhatsApp sipariş, AI menü açıklaması, geri bildirim, indirim kodları. 3 kullanıcı, 1 şube."
    },
    {
      "@type": "Offer",
      "name": "Premium Plan",
      "price": "14400",
      "priceCurrency": "TRY",
      "billingDuration": "P1Y",
      "description": "Tüm özellikler: 40 özellik, 4 dil, online sipariş, masa rezervasyonu, sadakat programı, analitik, çoklu şube. 5 kullanıcı, 5 şube."
    }
  ],
  "featureList": [
    "QR Kod ile Dijital Menü",
    "Çok Dilli Menü (34 dil desteği)",
    "Garson Çağırma",
    "WhatsApp Sipariş",
    "Geri Bildirim ve Google Reviews Yönlendirme",
    "İndirim Kodları",
    "Happy Hour / Zamanlı Fiyat",
    "Besin Değerleri ve Alerjen Bilgisi",
    "AI Menü Açıklaması Yazıcı",
    "Sepet Sistemi",
    "3 Tema (Beyaz/Siyah/Kırmızı)",
    "Promosyon Yönetimi",
    "QR Kod Özelleştirme (Logo, Renk)"
  ]
}
```

### Uygulama

Index.tsx'te Helmet içine `<script type="application/ld+json">` olarak ekle. İki ayrı script tag'i olarak (Organization ve SoftwareApplication ayrı ayrı) veya tek bir `@graph` yapısı olarak birleştirilebilir.

**Tercih edilen yöntem — @graph ile tek script:**

```tsx
<Helmet>
  {/* Mevcut meta tag'ler korunacak */}
  <script type="application/ld+json">
    {JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": "https://tabbled.com/#organization",
          // ... yukarıdaki Organization içeriği
        },
        {
          "@type": "SoftwareApplication",
          "@id": "https://tabbled.com/#software",
          // ... yukarıdaki SoftwareApplication içeriği
        }
      ]
    })}
  </script>
</Helmet>
```

**ÖNEMLİ:** Mevcut Helmet tag'lerini silme, sadece JSON-LD script'ini ekle.

---

## İŞ 2: RESTAURANT SCHEMA (Public Menü Sayfaları)

### Dosya: src/pages/PublicMenu.tsx (veya public menü bileşeni)

Her restoran menü sayfasında dinamik Restaurant Schema oluştur. Veri zaten Supabase'den çekiliyor — mevcut `restaurant` objesinden besle.

### Restaurant Schema Yapısı

```tsx
// Restoran verisi yüklendikten sonra, Helmet içinde:
const restaurantSchema = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "@id": `https://tabbled.com/menu/${restaurant.slug}#restaurant`,
  "name": restaurant.name,
  "url": `https://tabbled.com/menu/${restaurant.slug}`,
  "description": restaurant.tagline || `${restaurant.name} dijital menüsü`,
  "address": restaurant.address ? {
    "@type": "PostalAddress",
    "streetAddress": restaurant.address,
    "addressCountry": "TR"
  } : undefined,
  "telephone": restaurant.phone || undefined,
  "image": restaurant.cover_url || restaurant.logo_url || undefined,
  "servesCuisine": [],  // Şu an veri yok, ileride eklenebilir
  "menu": `https://tabbled.com/menu/${restaurant.slug}`,
  "acceptsReservations": false,
  "priceRange": "₺₺",
  "potentialAction": {
    "@type": "ViewAction",
    "target": `https://tabbled.com/menu/${restaurant.slug}`,
    "name": "Menüyü Görüntüle"
  }
};

// Helmet'ta:
// Sadece tanımlı alanları dahil et (undefined olanları filtrele)
const cleanSchema = JSON.parse(JSON.stringify(restaurantSchema));
```

### Uygulama Notları

1. `restaurant` objesi zaten Supabase'den çekiliyor — ek sorgu gerekmez
2. `undefined` değerleri JSON.stringify otomatik olarak kaldırır
3. `google_place_id` varsa, `sameAs` dizisine Google Maps URL'i eklenebilir:
   ```tsx
   "sameAs": restaurant.google_place_id
     ? [`https://www.google.com/maps/place/?q=place_id:${restaurant.google_place_id}`]
     : []
   ```
4. Mevcut Helmet tag'lerine (og:title, og:description vb.) dokunma, sadece JSON-LD ekle
5. Eğer çalışma saatleri (opening_hours) varsa:
   ```tsx
   "openingHoursSpecification": restaurant.opening_hours
     ? Object.entries(restaurant.opening_hours)
         .filter(([_, v]: any) => v.is_open)
         .map(([day, v]: any) => ({
           "@type": "OpeningHoursSpecification",
           "dayOfWeek": day.charAt(0).toUpperCase() + day.slice(1),
           "opens": v.open,
           "closes": v.close
         }))
     : undefined
   ```

### Helmet Entegrasyonu

```tsx
<Helmet>
  {/* Mevcut meta tag'ler korunacak */}
  <script type="application/ld+json">
    {JSON.stringify(cleanSchema)}
  </script>
</Helmet>
```

---

## İŞ 3: BLOG FAQ ANSWER-FIRST DÖNÜŞÜMÜ

### Dosya: src/data/blogData.ts (veya blog verisi barındıran dosya)

### Neden?

AI motorları bir bölümün ilk 1-2 cümlesini çeker. Eğer ilk cümle "Bu konuda birçok farklı görüş var..." gibi bağlam cümlesiyse, AI atlar. İlk cümle doğrudan cevap olmalı.

### Kurallar

1. **Her FAQ cevabı direkt cevapla başlamalı** — bağlam sonra gelir
2. **Cevap uzunluğu: 40-60 kelime** — AI motorlarının optimal çıkarma aralığı
3. **Kendi başına anlaşılır** — soruyu okumadan bile cevap anlamlı olmalı

### Dönüşüm Örnekleri

**ÖNCE (kötü — bağlam önce):**
```
"Birçok restoran sahibi bu konuyu merak etmektedir. QR menü zorunluluğu, 11 Ekim 2025'te Resmi Gazete'de yayımlanan Fiyat Etiketi Yönetmeliği ile başlamıştır."
```

**SONRA (iyi — cevap önce):**
```
"QR menü zorunluluğu 11 Ekim 2025'te Resmi Gazete'de yayımlanan Fiyat Etiketi Yönetmeliği ile başlamıştır. 1 Ocak 2026 itibarıyla tüm yeme-içme işletmeleri dijital menü sunmak zorundadır. Uymayanlar idari para cezasıyla karşılaşır."
```

### Uygulama

1. blogData.ts dosyasını oku
2. Tüm FAQ bölümlerini (faq dizisi) bul
3. Her cevabı (answer alanı) kontrol et:
   - İlk cümle direkt cevap veriyor mu? → Dokunma
   - İlk cümle bağlam/giriş cümlesi mi? → Cevabı öne al, bağlamı arkaya taşı
4. Cevap 60 kelimeyi aşıyorsa kısalt (öz bilgiyi koru, dolgu metni çıkar)
5. Cevap 30 kelimeden azsa zenginleştir (ama 60'ı geçme)

### ÖNEMLİ

- İçerik bilgisini değiştirme — sadece cümle sırasını ve yapısını düzenle
- Yasal bilgileri (ceza miktarları, tarihler) olduğu gibi koru
- Türkçe dil kalitesini koru
- Eğer cevap zaten answer-first ise dokunma

---

## İŞ 4: ENTITY TUTARLILIĞI KONTROLÜ

### Amaç

"Tabbled" markasının açıklaması tüm sayfalarda tutarlı olmalı. AI motorları entity tanıma yaparken aynı markanın farklı açıklamalarını gördüğünde güven puanı düşer.

### Standart Entity Tanımları (bunları kullan)

**Kısa tanım (1 cümle, meta description tarzı):**
```
Restoran, kafe ve oteller için QR kod tabanlı dijital menü yönetim platformu.
```

**Orta tanım (2 cümle):**
```
Tabbled, Türkiye'deki restoran, kafe ve oteller için QR kod tabanlı dijital menü yönetim platformudur. Çok dilli menü, garson çağırma, WhatsApp sipariş ve müşteri yönetimi çözümleri sunar.
```

**Uzun tanım (3-4 cümle, Schema/OG için):**
```
Tabbled, Türkiye'deki restoran, kafe ve oteller için QR kod tabanlı dijital menü yönetim platformudur. Çok dilli menü desteği, garson çağırma, WhatsApp sipariş, geri bildirim toplama ve indirim kodu yönetimi gibi özellikler sunar. KHP Limited tarafından işletilmektedir.
```

### Kontrol Edilecek Dosyalar

1. **index.html** — `<meta name="description">` ve `og:description`
2. **src/pages/Index.tsx** — Helmet meta description
3. **src/pages/Blog.tsx** — Helmet meta description
4. **robots.txt** — değişiklik gerekmez, ama kontrol et
5. **Yeni eklenen Schema'lar** — Organization ve SoftwareApplication description'ları yukarıdaki tanımlarla tutarlı olmalı

### Uygulama

1. `grep -rn "description" src/pages/Index.tsx src/pages/Blog.tsx index.html` ile mevcut description'ları bul
2. Tutarsız olanları standart tanımlarla güncelle
3. **Türkçe ve İngilizce karışık kullanma** — açıklama dili sayfanın diline göre (landing page Türkçe, İngilizce sayfa yoksa hep Türkçe)

---

## DOĞRULAMA ADIMLARI

### 1. Schema Doğrulama
```bash
# Index.tsx'te Organization + SoftwareApplication JSON-LD var mı?
grep -c "application/ld+json" src/pages/Index.tsx

# PublicMenu'de Restaurant JSON-LD var mı?
grep -c "application/ld+json" src/pages/PublicMenu.tsx

# JSON parse test — build'de hata vermemeli
npm run build
```

### 2. FAQ Kontrol
```bash
# Blog FAQ'larının ilk cümleleri
grep -A2 '"answer"' src/data/blogData.ts | head -30
```

### 3. Entity Tutarlılık
```bash
# Tüm description'ları listele
grep -n "description" index.html src/pages/Index.tsx src/pages/Blog.tsx | grep -i "content\|description"
```

### 4. Build Test
```bash
cd /opt/khp/tabbled
npm run build
```

---

## SIRALI UYGULAMA

1. Index.tsx'i oku — mevcut Helmet yapısını anla
2. Organization + SoftwareApplication Schema'yı @graph ile ekle
3. PublicMenu.tsx'i oku — mevcut Helmet ve restaurant veri yapısını anla
4. Restaurant Schema'yı dinamik olarak ekle
5. blogData.ts'i oku — FAQ cevaplarını kontrol et
6. Answer-first olmayan cevapları dönüştür
7. Entity tutarlılığı kontrolü — description'ları standartlaştır
8. npm run build
9. Sonuçları raporla

---

## HATIRLATMALAR

- react-helmet-async kullanılıyor — `<Helmet>` bileşeni içinde `<script>` tag'i desteklenir
- JSON.stringify ile JSON-LD oluşturulurken Türkçe karakterler (ş, ç, ğ, ı, ö, ü) sorun çıkarmaz — UTF-8 varsayılan
- `@id` kullanarak schema'lar arası referans oluştur (Organization → SoftwareApplication provider bağlantısı)
- undefined değerler JSON.stringify ile otomatik temizlenir
- Mevcut Helmet tag'lerini (title, meta, link) SİLME — sadece JSON-LD script ekle
- Blog FAQ içeriklerinde bilgi değiştirme, sadece cümle sırasını düzenle
- PublicMenu'de restaurant verisi async olarak yükleniyor — Schema'yı veri yüklendikten sonra render et (loading state'te JSON-LD olmasın)
