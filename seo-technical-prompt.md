# CLAUDE CODE PROMPT — SEO Teknik Altyapı
## Dinamik Sitemap + OG Image + GSC Hazırlık

---

## GÖREV ÖZETI

3 iş yapılacak:

1. **Dinamik Sitemap XML** — Supabase Edge Function olarak deploy
2. **OG Image** — Varsayılan 1200×630 OG image oluştur (statik dosya)
3. **Meta tag güncellemesi** — Tüm sayfalarda OG image'ı doğru referansla
4. **robots.txt güncelle** — Sitemap URL'ini Edge Function'a yönlendir

---

## PROJE BİLGİLERİ

- **Proje dizini:** /opt/khp/tabbled/
- **GitHub:** kiranmurat-source/swift-table-menu
- **Supabase project-ref:** qmnrawqvkwehufebbkxp
- **Domain:** tabbled.com
- **Stack:** React + Vite + TypeScript
- **Mevcut Edge Functions:** create-user, translate-menu, generate-description
- **Supabase URL:** https://qmnrawqvkwehufebbkxp.supabase.co
- **Blog:** Statik veri, /blog ve /blog/:slug route'ları mevcut
- **Public menü:** /menu/:slug route'ları (restaurants tablosundan slug)
- **Marka renkleri:** #FF4F7A (pembe), #1C1C1E (siyah), #F7F7F8 (açık gri)
- **Font:** Playfair Display (başlık) + Inter (gövde)
- **Logo:** src/assets/ altında mevcut (pembe text logo)

---

## İŞ 1: DİNAMİK SİTEMAP EDGE FUNCTION

### Dosya: supabase/functions/sitemap/index.ts

Edge Function şunları yapacak:
- Supabase'e bağlanıp aktif restoranları ve blog slug'larını çekecek
- XML sitemap formatında döndürecek
- `Content-Type: application/xml` header'ı ile
- `--no-verify-jwt` ile deploy edilecek (public erişim)

### Sitemap İçeriği

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Statik sayfalar -->
  <url>
    <loc>https://tabbled.com</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://tabbled.com/blog</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://tabbled.com/privacy</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>

  <!-- Blog makaleleri (blogData.ts'den slug'lar) -->
  <!-- Şu an statik veri olduğu için hardcode et, ileride DB'ye taşınırsa dinamik olur -->
  <url>
    <loc>https://tabbled.com/blog/qr-menu-zorunlulugu-2026</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://tabbled.com/blog/qr-menu-nedir</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://tabbled.com/blog/qr-menu-fiyatlari-2026</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>

  <!-- Dinamik: Aktif restoran menü sayfaları -->
  <!-- SELECT slug FROM restaurants WHERE is_active = true -->
  <url>
    <loc>https://tabbled.com/menu/{slug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>
```

### Edge Function Kodu

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Blog slug'ları (statik — blogData.ts ile senkron tutulmalı)
const BLOG_SLUGS = [
  'qr-menu-zorunlulugu-2026',
  'qr-menu-nedir',
  'qr-menu-fiyatlari-2026',
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Aktif restoranların slug'larını çek
    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select('slug, updated_at')
      .eq('is_active', true)

    if (error) throw error

    const today = new Date().toISOString().split('T')[0]

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://tabbled.com</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://tabbled.com/blog</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://tabbled.com/privacy</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>`

    // Blog makaleleri
    for (const slug of BLOG_SLUGS) {
      xml += `
  <url>
    <loc>https://tabbled.com/blog/${slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
    }

    // Restoran menü sayfaları
    if (restaurants) {
      for (const r of restaurants) {
        const lastmod = r.updated_at
          ? new Date(r.updated_at).toISOString().split('T')[0]
          : today
        xml += `
  <url>
    <loc>https://tabbled.com/menu/${r.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
  </url>`
      }
    }

    xml += `
</urlset>`

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // 1 saat cache
      },
    })
  } catch (err) {
    console.error('Sitemap error:', err)
    return new Response('Sitemap generation error', { status: 500 })
  }
})
```

### Deploy Komutu

```bash
cd /opt/khp/tabbled
supabase functions deploy sitemap --project-ref qmnrawqvkwehufebbkxp --no-verify-jwt
```

### ÖNEMLİ: Blog slug'larını doğrula

Edge Function'ı yazmadan ÖNCE, mevcut blog slug'larını kontrol et:

```bash
grep -r "slug:" src/ | grep -i blog
```

veya blogData.ts dosyasını oku ve gerçek slug'ları kullan. Yukarıdaki BLOG_SLUGS dizisi tahmine dayalı — gerçek dosyadan doğrula.

---

## İŞ 2: OG IMAGE OLUŞTURMA

### Amaç
1200×630 piksel varsayılan OG image. Bu image sosyal medyada (Twitter, Facebook, LinkedIn, WhatsApp) paylaşıldığında görünecek.

### Tasarım

Python3 + Pillow ile oluştur (VPS'te zaten kurulu olmalı, yoksa `pip3 install Pillow`).

**Tasarım Detayları:**
- Boyut: 1200×630 px
- Arka plan: Gradient — sol üst #FF4F7A (pembe) → sağ alt #1C1C1E (koyu)
- Ortalanmış beyaz metin: "tabbled" (büyük, kalın) — logo font kullanılamıyorsa sans-serif bold
- Alt satır: "Dijital Menü Çözümleri" (daha küçük, beyaz, hafif transparan)
- Sağ alt köşe: "tabbled.com" (küçük, beyaz)
- Dosya: public/og-image.png olarak kaydet

### Python Script

```python
python3 -c "
from PIL import Image, ImageDraw, ImageFont
import os

width, height = 1200, 630
img = Image.new('RGB', (width, height), '#1C1C1E')
draw = ImageDraw.Draw(img)

# Gradient arka plan (pembe → koyu, yatay)
for x in range(width):
    r = int(255 - (255 - 28) * (x / width))
    g = int(79 - (79 - 28) * (x / width))
    b = int(122 - (122 - 30) * (x / width))
    for y in range(height):
        # Dikey karartma da ekle
        factor = 1 - (y / height) * 0.3
        draw.point((x, y), fill=(int(r*factor), int(g*factor), int(b*factor)))

# Font — sistem fontu kullan
try:
    font_large = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 80)
    font_medium = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 36)
    font_small = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 24)
except:
    font_large = ImageFont.load_default()
    font_medium = ImageFont.load_default()
    font_small = ImageFont.load_default()

# Ana metin: tabbled
text_main = 'tabbled'
bbox = draw.textbbox((0, 0), text_main, font=font_large)
tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
draw.text(((width - tw) / 2, (height - th) / 2 - 40), text_main, fill='white', font=font_large)

# Alt metin
text_sub = 'Dijital Menu Cozumleri'
bbox2 = draw.textbbox((0, 0), text_sub, font=font_medium)
tw2 = bbox2[2] - bbox2[0]
draw.text(((width - tw2) / 2, (height + th) / 2 + 10), text_sub, fill=(255, 255, 255, 200), font=font_medium)

# Domain
text_domain = 'tabbled.com'
bbox3 = draw.textbbox((0, 0), text_domain, font=font_small)
tw3 = bbox3[2] - bbox3[0]
draw.text((width - tw3 - 40, height - 50), text_domain, fill=(255, 255, 255, 180), font=font_small)

output_path = '/opt/khp/tabbled/public/og-image.png'
img.save(output_path, 'PNG', optimize=True)
print(f'OG image saved: {output_path}')
print(f'Size: {os.path.getsize(output_path)} bytes')
"
```

### NOT: Pillow yoksa

```bash
pip3 install Pillow --break-system-packages
```

---

## İŞ 3: META TAG GÜNCELLEMESİ

### 3a. index.html — Varsayılan OG Tags

`public/index.html` veya `index.html` (Vite root) dosyasında `<head>` içine:

```html
<!-- Open Graph -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://tabbled.com" />
<meta property="og:title" content="Tabbled — Restoran Dijital Menü Çözümleri" />
<meta property="og:description" content="QR kod ile dijital menü. Restoranlar, kafeler ve oteller için profesyonel menü yönetim platformu." />
<meta property="og:image" content="https://tabbled.com/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:locale" content="tr_TR" />
<meta property="og:site_name" content="Tabbled" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Tabbled — Restoran Dijital Menü Çözümleri" />
<meta name="twitter:description" content="QR kod ile dijital menü. Restoranlar, kafeler ve oteller için profesyonel menü yönetim platformu." />
<meta name="twitter:image" content="https://tabbled.com/og-image.png" />
```

**DİKKAT:** index.html'de zaten OG tag'ler olabilir. Varsa güncelle (duplike etme), yoksa ekle.

### 3b. react-helmet-async Güncelleme

Mevcut Helmet kullanımlarında og:image'ı doğru referanslayan tag'ler var mı kontrol et. Eğer sayfa bazlı Helmet ile override ediliyorsa, varsayılan og:image'ı `https://tabbled.com/og-image.png` olarak ayarla.

Blog sayfalarının kendi OG image'ı varsa dokunma. Yoksa varsayılan OG image'ı kullan.

Landing page (Index.tsx) Helmet'ında og:image tag'i yoksa ekle.

---

## İŞ 4: ROBOTS.TXT GÜNCELLEMESİ

`public/robots.txt` dosyasını güncelle — Sitemap URL'ini Edge Function URL'ine yönlendir:

```
User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /login

Sitemap: https://qmnrawqvkwehufebbkxp.supabase.co/functions/v1/sitemap
```

**NOT:** Mevcut robots.txt'yi oku ve sadece Sitemap satırını güncelle/ekle. Diğer kuralları koru.

---

## DOĞRULAMA ADIMLARI

Her iş bittikten sonra:

### 1. Edge Function Deploy
```bash
supabase functions deploy sitemap --project-ref qmnrawqvkwehufebbkxp --no-verify-jwt
```

### 2. Sitemap Test
```bash
curl -s https://qmnrawqvkwehufebbkxp.supabase.co/functions/v1/sitemap | head -50
```
- XML valid mi?
- Statik sayfalar var mı? (/, /blog, /privacy)
- Blog slug'ları var mı?
- Restoran slug'ları var mı?

### 3. OG Image Kontrolü
```bash
ls -la public/og-image.png
# Boyut makul mü? (50-200KB arası beklenir)
```

### 4. Meta Tag Kontrolü
```bash
grep -n "og:image" index.html
grep -rn "og:image" src/pages/Index.tsx
```

### 5. robots.txt Kontrolü
```bash
cat public/robots.txt
```

### 6. Build Test
```bash
cd /opt/khp/tabbled
npm run build
```

Build başarılı ise tamamdır.

---

## SIRALI UYGULAMA

1. Blog slug'larını blogData.ts'den oku ve doğrula
2. Supabase Edge Function oluştur (supabase/functions/sitemap/index.ts)
3. Edge Function deploy et
4. curl ile test et
5. Pillow kur (gerekirse)
6. OG image oluştur (public/og-image.png)
7. index.html OG tag'lerini güncelle/ekle
8. Helmet OG tag'lerini kontrol et ve gerekirse güncelle
9. robots.txt güncelle
10. npm run build
11. Sonuçları raporla

---

## HATIRLATMALAR

- Edge Function'da `SUPABASE_URL` ve `SUPABASE_SERVICE_ROLE_KEY` env'leri otomatik mevcut (Supabase tarafından inject ediliyor)
- `--no-verify-jwt` zorunlu çünkü sitemap public erişim olmalı
- Blog slug'ları şu an statik (blogData.ts) — ileride DB'ye taşınırsa Edge Function da güncellenecek
- OG image Pillow ile oluşturuluyor — font mevcut değilse DejaVu Sans fallback kullanılacak
- Mevcut statik sitemap.xml varsa public/ klasöründe silinebilir (Edge Function onu devraldığı için)
- Ama statik sitemap.xml'i SİLMEDEN ÖNCE robots.txt'nin yeni URL'i gösterdiğinden emin ol
