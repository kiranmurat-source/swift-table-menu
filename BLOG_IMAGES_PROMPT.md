# BLOG GÖRSELLERİ DEPLOYMENT PROMPT
## Tabbled.com — 16 Nisan 2026

---

## PROJE BAĞLAMI

Tabbled.com blog sayfaları şu anda görsel içermiyor. 9 adet AI üretimi blog görseli hazır,
bunları projeye ekleyip blog data dosyasında ilgili makalelere atayacağız.

---

## GÖREV

### Adım 1 — Görselleri Kontrol Et

```bash
ls /opt/khp/tabbled/public/blog/ 2>/dev/null || echo "klasör yok"
```

Eğer klasör yoksa oluştur:
```bash
mkdir -p /opt/khp/tabbled/public/blog
```

### Adım 2 — Görselleri Kopyala

Görseller SCP ile yüklenecek. Önce SCP komutunu çalıştır (bunu sen yapacaksın):
```
scp blog-01-qr-menu-yonetim.png root@168.119.234.186:/opt/khp/tabbled/public/blog/
scp blog-02-lokal-seo.png root@168.119.234.186:/opt/khp/tabbled/public/blog/
scp blog-03-alerjen.png root@168.119.234.186:/opt/khp/tabbled/public/blog/
scp blog-04-musteri-deneyimi.png root@168.119.234.186:/opt/khp/tabbled/public/blog/
scp blog-05-dijital-menu.png root@168.119.234.186:/opt/khp/tabbled/public/blog/
scp blog-06-analitik.png root@168.119.234.186:/opt/khp/tabbled/public/blog/
scp blog-07-qr-zorunluluk.png root@168.119.234.186:/opt/khp/tabbled/public/blog/
scp blog-08-nasil-gecilir.png root@168.119.234.186:/opt/khp/tabbled/public/blog/
scp blog-09-cok-dilli.png root@168.119.234.186:/opt/khp/tabbled/public/blog/
```

### Adım 3 — Blog Data Dosyasını Bul

```bash
find /opt/khp/tabbled/src -name "*.ts" -o -name "*.tsx" | xargs grep -l "slug\|blogPost\|blog_post" 2>/dev/null | head -10
```

Muhtemelen şu dosyalardan biri:
- `src/data/blogPosts.ts`
- `src/lib/blog.ts`
- `src/pages/Blog.tsx` (inline data)

Dosyayı bul ve içindeki slug'ları listele:
```bash
# Dosyayı bulduktan sonra:
cat /opt/khp/tabbled/src/data/blogPosts.ts | grep -E "slug|image|coverImage|thumbnail"
```

### Adım 4 — Görsel → Slug Eşleştirmesi

Görseller içeriklerine göre şu makalelere atanacak:

| Dosya | Makale Konusu | image path |
|-------|---------------|------------|
| blog-01-qr-menu-yonetim.png | Restoran yönetim / dashboard | `/blog/blog-01-qr-menu-yonetim.png` |
| blog-02-lokal-seo.png | Lokal SEO / Google Maps | `/blog/blog-02-lokal-seo.png` |
| blog-03-alerjen.png | Alerjen zorunluluk | `/blog/blog-03-alerjen.png` |
| blog-04-musteri-deneyimi.png | Müşteri deneyimi | `/blog/blog-04-musteri-deneyimi.png` |
| blog-05-dijital-menu.png | Dijital menü genel / featured | `/blog/blog-05-dijital-menu.png` |
| blog-06-analitik.png | Analitik / raporlama | `/blog/blog-06-analitik.png` |
| blog-07-qr-zorunluluk.png | QR menü yasal zorunluluk | `/blog/blog-07-qr-zorunluluk.png` |
| blog-08-nasil-gecilir.png | QR menüye nasıl geçilir | `/blog/blog-08-nasil-gecilir.png` |
| blog-09-cok-dilli.png | Çok dilli menü / turizm | `/blog/blog-09-cok-dilli.png` |

### Adım 5 — Blog Data Dosyasını Güncelle

Blog data dosyasındaki her makaleye `image` (veya `coverImage` / `thumbnail`) alanını ekle.
Mevcut alan adını kullan — yoksa `image` ekle.

Örnek (mevcut yapıya göre uyarla):
```ts
{
  slug: "qr-menu-zorunluluk",
  title: "...",
  image: "/blog/blog-07-qr-zorunluluk.png",
  // ...
}
```

### Adım 6 — Blog Card Bileşenini Kontrol Et

Blog listesinde ve makale sayfasında görsel gösterilip gösterilmediğini kontrol et:

```bash
grep -n "image\|coverImage\|thumbnail\|<img\|src=" /opt/khp/tabbled/src/pages/Blog.tsx 2>/dev/null | head -20
```

Eğer görsel render edilmiyorsa, blog card'a ekle:

```tsx
{post.image && (
  <img
    src={post.image}
    alt={post.title}
    style={{
      width: '100%',
      height: '200px',
      objectFit: 'cover',
      borderRadius: '8px 8px 0 0',
    }}
  />
)}
```

### Adım 7 — Build & Deploy

```bash
cd /opt/khp/tabbled
npm run build
```

Build OK ise:
```bash
git add -A && git commit -m "feat: blog görselleri eklendi (9 makale)" && git push origin main
```

---

## GENEL KURALLAR

- Mevcut blog data yapısını bozmadan sadece image alanı ekle
- PNG dosyaları public/blog/ altında kalacak (Vercel public/ klasörünü static olarak serve eder)
- Görsel yoksa (`!post.image`) blog card bozulmamalı — her zaman conditional render
- Roboto font, Phosphor Icons — blog sayfasında zaten var, dokunma

---

## TEST CHECKLİST

- [ ] /blog sayfasında kartlarda görsel görünüyor
- [ ] /blog/[slug] sayfasında hero görseli var
- [ ] Görsel olmayan makale varsa kart düzgün görünüyor (fallback)
- [ ] Mobile'da görsel kırılmıyor
- [ ] Build uyarısız tamamlandı
