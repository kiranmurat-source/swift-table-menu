# FONT MİGRATİON — ROBOTO TEK FONT AİLESİ
## Claude Code Prompt — 14 Nisan 2026 (v7)

---

## PROJE BAĞLAMI

- **Proje dizini:** /opt/khp/tabbled/
- **Stack:** React + Vite + TypeScript + S.* inline styles
- **Mevcut fontlar:** Playfair Display (başlıklar) + Inter (body) — @fontsource ile self-hosted
- **Hedef font:** Roboto — tek font ailesi

---

## MEVCUT DURUM

- `@fontsource/playfair-display` ve `@fontsource/inter` paketleri kurulu
- CSS/inline styles'da `font-family: 'Playfair Display'` ve `font-family: 'Inter'` referansları var
- Font import'ları muhtemelen main.tsx veya index.css'te

---

## GÖREV: ROBOTO MİGRATİONU

### 1. Paket değişikliği
```bash
npm uninstall @fontsource/playfair-display @fontsource/inter
npm install @fontsource/roboto
```

### 2. Font import güncelleme
Mevcut Playfair Display + Inter import'larını kaldır, Roboto import'larını ekle:

```typescript
// Sadece kullanılacak ağırlıklar:
import '@fontsource/roboto/300.css';  // Light
import '@fontsource/roboto/400.css';  // Regular
import '@fontsource/roboto/500.css';  // Medium
import '@fontsource/roboto/700.css';  // Bold
```

**İMPORT ETMEYECEKLERİN:**
- 100 (Thin) — KULLANILMAYACAK
- 900 (Black) — KULLANILMAYACAK
- italic varyantları — şimdilik gereksiz
- cyrillic, greek, math, symbols subset'leri — gereksiz, bundle şişirir

Sadece `latin` ve `latin-ext` subset'leri yeterli. @fontsource varsayılan olarak tüm subset'leri dahil edebilir — mümkünse sadece latin import et:
```typescript
import '@fontsource/roboto/latin-300.css';
import '@fontsource/roboto/latin-400.css';
import '@fontsource/roboto/latin-500.css';
import '@fontsource/roboto/latin-700.css';
```
Eğer latin-spesifik import çalışmazsa normal import yap (300/400/500/700.css).

### 3. CSS / Inline Style güncellemeleri

Tüm projede font-family referanslarını güncelle:

**Ara ve değiştir:**
- `'Playfair Display'` → `'Roboto'`
- `'Inter'` → `'Roboto'`
- `"Playfair Display"` → `"Roboto"`
- `"Inter"` → `"Roboto"`
- `fontFamily: "'Playfair Display'"` → `fontFamily: "'Roboto'"`
- `fontFamily: "'Inter'"` → `fontFamily: "'Roboto'"`
- CSS'te: `font-family: 'Playfair Display', serif` → `font-family: 'Roboto', sans-serif`
- CSS'te: `font-family: 'Inter', sans-serif` → `font-family: 'Roboto', sans-serif`

**Global fallback (index.css veya base CSS):**
```css
body {
  font-family: 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif;
}
```

### 4. Font ağırlık kuralları (KESİN UYULMALI)

| Ağırlık | Kullanım Yeri | CSS |
|---------|--------------|-----|
| **Bold (700)** | Başlıklar, fiyatlar, önemli değerler | `font-weight: 700` |
| **Medium (500)** | Butonlar, etiketler, alt başlıklar, tab başlıkları | `font-weight: 500` |
| **Regular (400)** | Gövde metin, açıklamalar, form input'ları | `font-weight: 400` |
| **Light (300)** | SADECE menü ürün açıklamaları (public menü) | `font-weight: 300` |

**KULLANILMAYACAK:**
- Thin (100) — hiçbir yerde
- Black (900) — hiçbir yerde
- 200, 600, 800 — hiçbir yerde

### 5. Tipografi kuralları

- **Minimum gövde font:** 16px (asla daha küçük body text yok)
- **Light (300) minimum:** 14px, line-height: 1.6+ (okunabilirlik için)
- **Başlıklar:** letter-spacing: -0.03em, line-height: 1.15 (SKILL.md kuralı)
- **Body:** letter-spacing: normal, line-height: 1.5

### 6. Kontrol edilecek dosyalar

Aşağıdaki dosyalarda font referansı olabilir — HEPSİNİ kontrol et:

**Stil dosyaları:**
- src/index.css (veya global CSS)
- tailwind.config.js / tailwind.config.ts (fontFamily ayarı)

**Sayfa bileşenleri:**
- src/pages/PublicMenu.tsx
- src/pages/RestaurantDashboard.tsx
- src/pages/Index.tsx (Landing page)
- src/pages/Login.tsx
- src/pages/Dashboard.tsx

**Landing page bileşenleri:**
- src/components/ altındaki tüm landing page bileşenleri (Navbar, Hero, Features, Pricing, FAQ, Footer vb.)

**Public menü bileşenleri:**
- Splash ekranı, kart bileşenleri, detay modal

**Admin bileşenleri:**
- Dashboard, panel bileşenleri

**Diğer:**
- index.html (varsa font preload/link)
- vite.config.ts
- vercel.json

### 7. Tailwind Config

Eğer tailwind.config'de fontFamily tanımı varsa güncelle:
```javascript
fontFamily: {
  sans: ['Roboto', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
}
```

Playfair Display ve Inter'e özel fontFamily alias'ları varsa kaldır.

---

## GENEL KURALLAR

1. Playfair Display ve Inter'in HİÇBİR İZİ kalmamalı (import, CSS, inline style)
2. Sadece 4 ağırlık: 300, 400, 500, 700
3. Light (300) SADECE public menü ürün açıklamalarında
4. Min body font 16px
5. Bundle boyutunu kontrol et — gereksiz subset import etme
6. `npm run build` ile test et

---

## TEST CHECKLIST

- [ ] Playfair Display referansı projede YOK (grep ile kontrol)
- [ ] Inter referansı projede YOK (grep ile kontrol)
- [ ] @fontsource/playfair-display paketi kaldırıldı
- [ ] @fontsource/inter paketi kaldırıldı
- [ ] @fontsource/roboto kuruldu
- [ ] Sadece 300/400/500/700 ağırlıklar import ediliyor
- [ ] Landing page: başlıklar Bold, body Regular
- [ ] Public menü: ürün adı Bold, fiyat Bold, açıklama Light (300)
- [ ] Admin panel: başlıklar Bold, butonlar Medium, body Regular
- [ ] Login sayfası: Roboto font
- [ ] Tüm sayfalarda font tutarlı
- [ ] Bundle boyutu artmadı (hatta düştü — Playfair Display büyük font)
- [ ] Türkçe karakterler düzgün görünüyor (ş, ç, ğ, ı, ö, ü)

---

## ÖNCELİK SIRASI

1. Paket kaldır/kur (npm uninstall/install)
2. Import güncelle (main.tsx veya index)
3. Global CSS güncelle
4. Tailwind config güncelle
5. Tüm dosyalarda font-family ara/değiştir
6. Font-weight kontrolü (kurallar tablosuna göre)
7. Build test + grep kontrolü
