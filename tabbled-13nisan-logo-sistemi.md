# TABBLED — Logo Sistemi Entegrasyonu
# Görev 3 (CDN cache, animasyonlu pre-loader, görsel rehberi zaten yapıldı)

---

## PROJE BAĞLAMI
- **Dizin:** /opt/khp/tabbled
- **Marka renkleri:** Strawberry Pink #FF4F7A, Deep Charcoal #1C1C1E, Off-White #F7F7F8

---

## ÖN HAZIRLIK

Logo dosyaları VPS'te /opt/khp/tabbled/ dizininde:
- tabbled-logo-horizontal.png (833×212, şeffaf arka plan — ikon + "Tabbled" yan yana)
- tabbled-logo-vertical.png (282×253, şeffaf arka plan — ikon üst + "Tabbled" alt)
- tabbled-logo-icon.png (268×268, pembe arka planlı app icon)

```bash
# Public klasörüne kopyala
cp /opt/khp/tabbled/tabbled-logo-horizontal.png public/tabbled-logo-horizontal.png
cp /opt/khp/tabbled/tabbled-logo-vertical.png public/tabbled-logo-vertical.png
cp /opt/khp/tabbled/tabbled-logo-icon.png public/tabbled-logo-icon.png
```

---

## LOGO KULLANIM HARİTASI

| Yer | Logo | Dosya | CSS Height |
|-----|------|-------|------------|
| Navbar (landing + admin) | Yatay | tabbled-logo-horizontal.png | h-8 (32px) |
| Footer | Yatay | tabbled-logo-horizontal.png | h-7 (28px) |
| Login sayfası | Dikey | tabbled-logo-vertical.png | h-20 (80px) |
| Public menü "Powered by" (altta) | Yatay küçük | tabbled-logo-horizontal.png | h-4 (16px) |
| Splash ekranı | Dikey | tabbled-logo-vertical.png | h-24 (96px) |
| Favicon | İkon | tabbled-logo-icon.png | 32×32 / 180×180 |

---

## UYGULAMA

### Adım 1: Mevcut logo referanslarını bul
```bash
grep -rn "tabbled-logo\|tabbled_logo\|logo.*\.png\|logo.*\.svg\|lovable-uploads.*logo" src/ index.html --include="*.tsx" --include="*.ts" --include="*.html"
```

### Adım 2: Her referansı güncelle

**Navbar (muhtemelen Navbar.tsx veya Header component):**
```tsx
<img 
  src="/tabbled-logo-horizontal.png" 
  alt="Tabbled" 
  style={{ height: '32px', width: 'auto' }}
/>
```

**Footer:**
```tsx
<img 
  src="/tabbled-logo-horizontal.png" 
  alt="Tabbled" 
  style={{ height: '28px', width: 'auto' }}
/>
```

**Login sayfası:**
```tsx
<img 
  src="/tabbled-logo-vertical.png" 
  alt="Tabbled" 
  style={{ height: '80px', width: 'auto' }}
/>
```

**"Powered by Tabbled" (public menü alt kısmı):**
```tsx
<div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.5 }}>
  <span style={{ fontSize: '11px', color: '#999' }}>Powered by</span>
  <img src="/tabbled-logo-horizontal.png" alt="Tabbled" style={{ height: '16px', width: 'auto' }} />
</div>
```

**Splash ekranı (public menü açılış):**
```tsx
<img 
  src="/tabbled-logo-vertical.png" 
  alt="Tabbled" 
  style={{ height: '96px', width: 'auto' }}
/>
```

### Adım 3: Favicon güncelle

index.html'de:
```html
<link rel="icon" type="image/png" href="/tabbled-logo-icon.png" />
<link rel="apple-touch-icon" href="/tabbled-logo-icon.png" />
```

### Adım 4: Eski logo dosyalarını temizle

```bash
# Önce hiçbir yerde referans kalmadığından emin ol
grep -rn "tabbled-logo-grid\|tabbled-logo-pink\|tabbled-logo-main\|tabbled-logo\.png" src/ index.html --include="*.tsx" --include="*.ts" --include="*.html"

# Referans kalmayanları sil (dikkat — sadece artık kullanılmayanları)
# rm public/tabbled-logo-grid.png  (eğer varsa ve referans kalmadıysa)
# rm public/tabbled-logo-pink.png  (eğer varsa ve referans kalmadıysa)
# rm public/tabbled-logo.png       (eğer varsa ve referans kalmadıysa)
```

### Adım 5: index.html pre-loader'daki logo kontrolü

index.html'deki pre-loader'da (Görev 2'de eklenen) eğer bir `<img>` logo referansı varsa, bunu kaldır — çünkü AnimatedLogo SVG zaten logoyu gösteriyor. Pre-loader'da sadece SVG animasyonu + "Tabbled" text olmalı, ayrıca img tag'ine gerek yok.

---

## ÖNEMLI NOTLAR

- Logo PNG'leri **şeffaf arka planlı** — hem açık hem koyu arka planlarda çalışır
- AMA logo çizgileri koyu (#1C1C1E) olduğu için **siyah temada** (public menü dark mode) görünmez olabilir. Siyah tema kullanıldığında CSS `filter: invert(1) hue-rotate(180deg)` ile ters çevrilebilir. Ama şimdilik sadece beyaz arka planda kullanılıyor (navbar, footer, login hep açık renk) — sorun yok.
- `<title>` tag, meta description, OG tags'teki "Tabbled" TEXT olarak KALSIN — bunları değiştirme
- Logo tıklanabilir olsun → ana sayfaya (`/`) yönlendirsin
- shadcn/ui internal Lucide ikonlarına DOKUNMA

---

## DOĞRULAMA

- [ ] Navbar: yatay logo görünüyor
- [ ] Footer: yatay logo görünüyor
- [ ] Login: dikey logo görünüyor
- [ ] Public menü "Powered by": küçük yatay logo
- [ ] Splash: dikey logo
- [ ] Favicon: pembe ikon logo
- [ ] Eski logo dosyaları temizlendi
- [ ] Hiçbir yerde eski logo referansı kalmadı
- [ ] npm run build başarılı
- [ ] git push origin main
