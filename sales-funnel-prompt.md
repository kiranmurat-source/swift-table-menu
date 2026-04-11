# CLAUDE CODE PROMPT — Satış Funnel Aşama 1
## Demo Menü + İletişim Formu + WhatsApp Butonu + CTA Güncelleme

---

## GÖREV ÖZETI

Satış funnel'ının görünür kısmını oluştur (4 iş):

1. **Demo menü sayfası** — /menu/demo (login gerektirmeyen, örnek verilerle dolu interaktif menü)
2. **İletişim formu** — /iletisim sayfası (isim, restoran adı, telefon, mesaj → email bildirimi)
3. **Floating WhatsApp butonu** — Landing page ve blog sayfalarında (public menüde DEĞİL)
4. **CTA güncelleme** — Landing page + blog CTA'larını yeni funnel hedeflerine yönlendir

---

## PROJE BİLGİLERİ

- **Proje dizini:** /opt/khp/tabbled/
- **Stack:** React + Vite + TypeScript + shadcn/ui
- **Router:** React Router (SPA, vercel.json rewrites)
- **WhatsApp numarası:** 905325119484
- **Email:** info@tabbled.com
- **Supabase project-ref:** qmnrawqvkwehufebbkxp
- **Marka renkleri:** #FF4F7A (pembe), #1C1C1E (siyah), #F7F7F8 (açık gri)
- **Font:** Playfair Display (başlık) + Inter (gövde)
- **İkon:** Phosphor Icons (@phosphor-icons/react)

---

## İŞ 1: DEMO MENÜ SAYFASI

### Route: /menu/demo

### Amaç
Potansiyel müşterinin Tabbled'ın nasıl göründüğünü login olmadan görmesi. Gerçek bir restoran menüsü gibi çalışan, örnek verilerle dolu interaktif demo.

### Yaklaşım

İki seçenek var:
- **A) Statik demo verisi** — Hardcoded örnek restoran + kategoriler + ürünler
- **B) Mevcut restoran slug'ını kullan** — örn. /menu/demo → /menu/ramada-encore-bayrampasa'ya redirect

**Seçenek A'yı uygula** (statik demo verisi). Böylece gerçek müşteri verisi expose edilmez ve demo her zaman tutarlı kalır.

### Demo Restoran Verisi

```typescript
const demoRestaurant = {
  name: "Örnek Restoran",
  slug: "demo",
  tagline: "Tabbled ile dijital menü deneyimi",
  address: "İstanbul, Türkiye",
  phone: "+90 (212) 555 00 00",
  theme_color: "white",
  logo_url: null, // Tabbled logosu kullanılabilir
  cover_url: null,
  is_active: true,
  social_instagram: "https://instagram.com",
  social_whatsapp: "905325119484",
  opening_hours: {
    monday: { is_open: true, open: "09:00", close: "23:00" },
    tuesday: { is_open: true, open: "09:00", close: "23:00" },
    wednesday: { is_open: true, open: "09:00", close: "23:00" },
    thursday: { is_open: true, open: "09:00", close: "23:00" },
    friday: { is_open: true, open: "09:00", close: "00:00" },
    saturday: { is_open: true, open: "10:00", close: "00:00" },
    sunday: { is_open: true, open: "10:00", close: "22:00" },
  },
  feature_waiter_calls: true,
  feature_cart: true,
  feature_whatsapp_order: true,
  feature_feedback: true,
  feature_discount_codes: false,
  feature_likes: true,
};
```

### Demo Kategoriler ve Ürünler

3-4 kategori, her birinde 3-5 ürün. Türk mutfağı temalı:

**Kategori 1: Kahvaltı**
- Serpme Kahvaltı — 450 TL — "2 kişilik zengin serpme kahvaltı tabağı. Taze peynir çeşitleri, zeytin, bal, kaymak, menemen ve sınırsız çay." — allergens: [gluten, milk, eggs]
- Menemen — 120 TL — "Domates, biber ve yumurta ile hazırlanan geleneksel Türk menemen." — allergens: [eggs]
- Simit & Peynir — 80 TL — "Taze simit, beyaz peynir, domates ve salatalık." — allergens: [gluten, milk, sesame]

**Kategori 2: Ana Yemekler**
- Adana Kebap — 280 TL — "El yapımı acılı kebap, közlenmiş domates ve biber ile. Lavaş eşliğinde." — allergens: [gluten] — is_featured: true
- Izgara Köfte — 220 TL — "Dana kıyma köfte, pilav ve közlenmiş sebze garnisi." — allergens: [gluten, eggs]
- Karnıyarık — 180 TL — "Kızartılmış patlıcan, kıymalı harç, domates sos." — allergens: []
- Mantı — 200 TL — "El yapımı Kayseri mantısı, yoğurt ve tereyağlı sos." — allergens: [gluten, milk, eggs]

**Kategori 3: Tatlılar**
- Künefe — 160 TL — "Sıcak servis, antep fıstıklı, kaymak peynirli." — allergens: [gluten, milk, nuts] — is_featured: true
- Baklava (6 dilim) — 200 TL — "Antep fıstıklı ev yapımı baklava." — allergens: [gluten, nuts]
- Sütlaç — 90 TL — "Fırında pişirilmiş geleneksel sütlaç." — allergens: [milk]

**Kategori 4: İçecekler**
- Türk Çayı — 30 TL — "Demlik çay, ince belli bardakta." — allergens: []
- Türk Kahvesi — 60 TL — "Orta şekerli, lokum eşliğinde." — allergens: []
- Ayran — 40 TL — "Ev yapımı yoğurttan taze ayran." — allergens: [milk]
- Taze Portakal Suyu — 70 TL — "Sıkma portakal suyu." — allergens: []
- Limonata — 55 TL — "Ev yapımı taze limonata, nane ile." — allergens: []

### Demo Banner

Demo menünün üstünde (sticky top banner veya ilk ekranda görünür bilgi kutusu):

```tsx
<div className="bg-gradient-to-r from-[#FF4F7A] to-[#e8456e] text-white text-center py-3 px-4 text-sm">
  <p className="font-medium">
    🎉 Bu bir demo menüdür. 
    <a href="/iletisim" className="underline font-bold ml-1">
      14 gün ücretsiz deneyin →
    </a>
  </p>
</div>
```

### Uygulama

1. PublicMenu.tsx'in mevcut yapısını kullan ama slug "demo" olduğunda Supabase'den veri çekme yerine statik demo verisini kullan
2. Yeni bir dosya oluşturmak yerine, PublicMenu.tsx'te `if (slug === 'demo')` kontrolü yap
3. Demo verisini ayrı bir dosyada tutabilirsin: `src/data/demoMenuData.ts`
4. Tüm özellikler çalışmalı: kategori tab, ürün kartları, detay modal, sepet, garson çağırma, WhatsApp sipariş (demo restoran WhatsApp numarasına gider)
5. Fotoğraflar: fotoğraf olmadan da güzel görünmeli (placeholder veya fotoğrafsız kart tasarımı mevcut zaten)

### Vercel Rewrites

vercel.json'a /menu/demo route'u ekle (muhtemelen mevcut /menu/:slug zaten yakalar ama kontrol et).

---

## İŞ 2: İLETİŞİM FORMU SAYFASI

### Route: /iletisim

### Sayfa Yapısı

Basit, temiz bir iletişim formu. Landing page tasarım diline uygun.

```
┌─────────────────────────────────────┐
│           Tabbled Navbar            │
├─────────────────────────────────────┤
│                                     │
│   14 Gün Ücretsiz Deneyin          │
│   Dijital menünüzü bugün           │
│   oluşturmaya başlayın.            │
│                                     │
│   ┌──────────────────────────┐     │
│   │ İsim Soyisim             │     │
│   ├──────────────────────────┤     │
│   │ Restoran / İşletme Adı   │     │
│   ├──────────────────────────┤     │
│   │ Telefon Numarası         │     │
│   ├──────────────────────────┤     │
│   │ E-posta (opsiyonel)      │     │
│   ├──────────────────────────┤     │
│   │ Mesajınız (opsiyonel)    │     │
│   │                          │     │
│   ├──────────────────────────┤     │
│   │  [14 Gün Ücretsiz Başla] │     │
│   └──────────────────────────┘     │
│                                     │
│   veya WhatsApp ile ulaşın:        │
│   [WhatsApp ile İletişim]          │
│                                     │
│   ✓ Kredi kartı gerekmez          │
│   ✓ 2 dakikada kurulum            │
│   ✓ Basic plan özellikleri açık    │
│                                     │
├─────────────────────────────────────┤
│           Footer                    │
└─────────────────────────────────────┘
```

### Form Alanları

| Alan | Tip | Zorunlu | Validation |
|------|-----|---------|------------|
| İsim Soyisim | text | Evet | min 2 karakter |
| Restoran / İşletme Adı | text | Evet | min 2 karakter |
| Telefon Numarası | tel | Evet | 10-11 rakam |
| E-posta | email | Hayır | email format |
| Mesaj | textarea | Hayır | max 500 karakter |

### Form Submit

**Seçenek A: Supabase Edge Function (önerilen)**

Yeni Edge Function: `contact-form`

```typescript
// supabase/functions/contact-form/index.ts
// 1. Form verisini al
// 2. Resend API ile info@tabbled.com'a email gönder
// 3. Opsiyonel: Supabase'de contact_submissions tablosuna kaydet
```

**Email formatı:**
```
Konu: Yeni Demo Talebi — {restoran_adı}

İsim: {isim}
Restoran: {restoran_adı}
Telefon: {telefon}
E-posta: {email}
Mesaj: {mesaj}

---
Bu email Tabbled iletişim formundan otomatik gönderilmiştir.
```

**Seçenek B: Basit mailto link (edge function yoksa fallback)**

Form submit'te `mailto:info@tabbled.com?subject=...&body=...` — ama bu kötü UX.

**Seçenek A'yı uygula.**

### Edge Function — contact-form

```typescript
import { Resend } from 'npm:resend@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name, restaurant, phone, email, message } = await req.json()

    // Validation
    if (!name || !restaurant || !phone) {
      return new Response(
        JSON.stringify({ error: 'İsim, restoran adı ve telefon zorunludur.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) throw new Error('RESEND_API_KEY not set')

    const resend = new Resend(resendApiKey)

    await resend.emails.send({
      from: 'Tabbled <noreply@tabbled.com>',
      to: 'info@tabbled.com',
      subject: `Yeni Demo Talebi — ${restaurant}`,
      html: `
        <h2>Yeni Demo Talebi</h2>
        <p><strong>İsim:</strong> ${name}</p>
        <p><strong>Restoran:</strong> ${restaurant}</p>
        <p><strong>Telefon:</strong> ${phone}</p>
        ${email ? `<p><strong>E-posta:</strong> ${email}</p>` : ''}
        ${message ? `<p><strong>Mesaj:</strong> ${message}</p>` : ''}
        <hr>
        <p style="color: #888; font-size: 12px;">Bu email tabbled.com iletişim formundan otomatik gönderilmiştir.</p>
      `,
    })

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Contact form error:', err)
    return new Response(
      JSON.stringify({ error: 'Mesaj gönderilemedi. Lütfen WhatsApp ile ulaşın.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

### Deploy

```bash
supabase functions deploy contact-form --project-ref qmnrawqvkwehufebbkxp --no-verify-jwt
```

### RESEND_API_KEY

Resend API key zaten Supabase secrets'ta mevcut olmalı (email gönderimi için daha önce kurulmuş). Kontrol et:

```bash
# Mevcut secrets'ları kontrol et — RESEND_API_KEY var mı?
# Yoksa ekle:
# supabase secrets set RESEND_API_KEY=re_xxxxxxx --project-ref qmnrawqvkwehufebbkxp
```

### Başarılı Gönderim Sonrası

Form gönderildikten sonra:
```tsx
<div className="text-center py-8">
  <div className="text-4xl mb-3">✓</div>
  <h3 className="text-xl font-semibold mb-2">Talebiniz Alındı!</h3>
  <p className="text-gray-600 mb-4">
    En kısa sürede sizinle iletişime geçeceğiz.
  </p>
  <a href="/menu/demo" className="text-[#FF4F7A] underline">
    Demo menüyü inceleyin →
  </a>
</div>
```

### Vercel Rewrites

vercel.json'a `/iletisim` ekle:
```json
{ "source": "/iletisim", "destination": "/index.html" }
```

### SEO

Helmet:
```tsx
<Helmet>
  <title>İletişim — Tabbled | 14 Gün Ücretsiz Deneyin</title>
  <meta name="description" content="Tabbled dijital menü platformunu 14 gün ücretsiz deneyin. Hemen iletişime geçin." />
  <meta name="robots" content="index, follow" />
</Helmet>
```

### Sitemap

Sitemap Edge Function'a /iletisim ekle:
```xml
<url>
  <loc>https://tabbled.com/iletisim</loc>
  <changefreq>monthly</changefreq>
  <priority>0.6</priority>
</url>
```

---

## İŞ 3: FLOATING WHATSAPP BUTONU

### Görünürlük
- Landing page (/) → GÖRÜNSİN
- Blog sayfaları (/blog, /blog/:slug) → GÖRÜNSİN
- İletişim (/iletisim) → GÖRÜNSİN
- Privacy (/privacy) → GÖRÜNSİN
- Public menü (/menu/:slug) → GÖRÜNMESİN (menünün kendi WhatsApp'ı var)
- Dashboard → GÖRÜNMESİN
- Login → GÖRÜNMESİN

### Bileşen: FloatingWhatsApp.tsx

```tsx
import { WhatsappLogo } from "@phosphor-icons/react";

const FloatingWhatsApp = () => {
  const whatsappUrl = `https://wa.me/905325119484?text=${encodeURIComponent(
    "Merhaba, Tabbled dijital menü hakkında bilgi almak istiyorum."
  )}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 bg-[#25D366] hover:bg-[#20BA5C] text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
      aria-label="WhatsApp ile iletişime geçin"
    >
      <WhatsappLogo size={28} weight="fill" />
    </a>
  );
};

export default FloatingWhatsApp;
```

### Yerleştirme

App.tsx veya layout bileşeninde, route'a göre koşullu render:

```tsx
// Public menü, dashboard ve login sayfalarında gösterme
const showWhatsApp = !pathname.startsWith('/menu/') 
  && !pathname.startsWith('/dashboard') 
  && pathname !== '/login';

{showWhatsApp && <FloatingWhatsApp />}
```

### Mobil uyumluk
- Bottom: 24px (bottom-6)
- Right: 24px (right-6)
- CookieBanner ile çakışma kontrolü: WhatsApp butonu z-40, cookie banner z-50 olmalı
- Mobilde garson çağırma bar'ı ile çakışmamalı (public menüde zaten gösterilmiyor)

---

## İŞ 4: CTA GÜNCELLEMELERİ

### Landing Page CTA'ları

Mevcut durumu kontrol et ve güncelle:

**HeroSection.tsx:**
- Birincil CTA: "Demo Menüyü İncele" → `/menu/demo`
- İkincil CTA: "14 Gün Ücretsiz Deneyin" → `/iletisim`

**PricingSection.tsx:**
- Her plan kartının altındaki CTA: "Hemen Başla" → `/iletisim`
- Veya "14 Gün Ücretsiz Deneyin" → `/iletisim`
- Fiyat kartlarına "14 gün ücretsiz deneme" etiketi ekle

**CTABanner.tsx / CTASection.tsx:**
- Ana CTA: "14 Gün Ücretsiz Deneyin" → `/iletisim`
- İkincil: "Demo Menüyü İncele" → `/menu/demo`

**Navbar.tsx:**
- Sağ üstte CTA butonu varsa: "Ücretsiz Deneyin" → `/iletisim`
- Veya "Demo" → `/menu/demo`

**Footer.tsx:**
- CTA linki: "/iletisim" ve "/menu/demo" ekle

### Blog CTA'ları

blogData.ts'teki CTA metinlerini güncelle. Mevcut CTA'lar muhtemelen "tabbled.com" a yönlendiriyor — bunları `/iletisim` veya `/menu/demo`'ya yönlendir.

Blog CTA kutusu (BlogCTA bileşeni) varsa:
- Başlık: "14 Gün Ücretsiz Deneyin"
- Alt metin: "Kredi kartı gerekmez. 2 dakikada kurulum."
- Birincil buton: "Ücretsiz Başla" → `/iletisim`
- İkincil link: "Demo menüyü inceleyin →" → `/menu/demo`

### CTA Mesajları (standart)

Tutarlılık için tüm CTA'larda şu mesajları kullan:

**Birincil CTA:** "14 Gün Ücretsiz Deneyin" veya "Ücretsiz Deneyin"
**İkincil CTA:** "Demo Menüyü İncele"
**Altında güven işaretleri:**
- ✓ Kredi kartı gerekmez
- ✓ 2 dakikada kurulum  
- ✓ Basic plan özellikleri açık
- ✓ İstediğiniz zaman iptal

---

## DOĞRULAMA

### 1. Demo Menü
```bash
# Route çalışıyor mu?
grep -rn "demo" src/pages/PublicMenu.tsx src/data/demoMenuData.ts
# Build test
npm run build
```
Deploy sonrası: tabbled.com/menu/demo açılıyor mu?

### 2. İletişim Formu
```bash
# Sayfa var mı?
grep -rn "iletisim\|Contact" src/pages/
# Edge Function deploy
supabase functions deploy contact-form --project-ref qmnrawqvkwehufebbkxp --no-verify-jwt
# Test
curl -X POST https://qmnrawqvkwehufebbkxp.supabase.co/functions/v1/contact-form \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","restaurant":"Test Restoran","phone":"5551234567"}'
```

### 3. WhatsApp Butonu
```bash
grep -rn "FloatingWhatsApp" src/
```
Deploy sonrası: tabbled.com'da sağ alt köşede yeşil WhatsApp butonu görünüyor mu?

### 4. CTA'lar
```bash
grep -rn "/iletisim\|/menu/demo\|Ücretsiz Dene" src/pages/ src/components/ src/lib/blogData.ts src/data/blogData.ts
```

### 5. Vercel Rewrites
```bash
cat vercel.json | grep -E "iletisim|demo"
```

### 6. Sitemap
```bash
supabase functions deploy sitemap --project-ref qmnrawqvkwehufebbkxp --no-verify-jwt
curl -s https://qmnrawqvkwehufebbkxp.supabase.co/functions/v1/sitemap | grep "iletisim"
```

### 7. Build
```bash
cd /opt/khp/tabbled
npm run build
```

---

## SIRALI UYGULAMA

1. demoMenuData.ts oluştur (statik demo verisi)
2. PublicMenu.tsx'te slug === 'demo' kontrolü ekle + demo banner
3. Contact.tsx (veya Iletisim.tsx) sayfası oluştur
4. contact-form Edge Function oluştur ve deploy et
5. FloatingWhatsApp.tsx bileşeni oluştur
6. App.tsx'te route'ları ve FloatingWhatsApp'ı ekle
7. vercel.json rewrites güncelle
8. Landing page CTA'larını güncelle (Hero, Pricing, CTA, Navbar, Footer)
9. Blog CTA'larını güncelle (blogData.ts + BlogCTA bileşeni)
10. Sitemap'e /iletisim ekle ve redeploy
11. npm run build
12. Sonuçları raporla

---

## HATIRLATMALAR

- Demo menü Supabase'den veri çekmemeli — tamamen statik/hardcoded
- Demo menüdeki tüm özellikler çalışmalı (sepet, garson çağırma, WhatsApp) — ama demo verisi üzerinde
- İletişim formu spam koruması: basit honeypot field (gizli input, bot dolarsa reject) veya rate limit
- FloatingWhatsApp public menüde (/menu/:slug) GÖRÜNMEMELİ — menünün kendi WhatsApp butonu var
- RESEND_API_KEY Supabase secrets'ta olmalı — yoksa Edge Function çalışmaz
- Edge Function noreply@tabbled.com'dan gönderecek — Resend'de domain verified olmalı (zaten olmalı)
- Mevcut CTA butonlarının href'lerini değiştirirken, buton metnini de güncelle
- Blog CTA'larında 10 makalenin hepsindeki CTA metinleri güncellenecek — büyük iş, dikkatli ol
- "14 Gün Ücretsiz" mesajı her yerde tutarlı olmalı (14 gün, ücretsiz, kredi kartı gerekmez)
