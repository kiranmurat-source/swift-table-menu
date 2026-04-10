# TABBLED.COM — CLAUDE CODE PROMPT
## Acil Fix: Public Menü Siyah Ekran Sorunu

---

## PROJE BAĞLAMI

- **Repo:** /opt/khp/tabbled
- **Stack:** React + Vite + TypeScript
- **Deploy:** Vercel
- **Sorun:** QR kod taranınca veya `/menu/:slug` açılınca React mount olmadan önce siyah/boş ekran görünüyor. Tekrar yüklemeden geç açılıyor.

---

## SORUN ANALİZİ

Kullanıcı QR tarayınca şu akış oluyor:

1. **Vercel HTML döner** → `index.html` yüklenir
2. **JS bundle indirilir** → 290KB + vendor chunk'lar (400KB+ toplam)
3. **React mount olur** → İLK ŞİMDİ loading ekranı görünür
4. **Supabase query** → restoran verisi çekilir

Sorun: 2. ve 3. adım arasında (JS parse + execute) kullanıcı **boş/siyah ekran** görüyor. Mobilde bu 2-4 saniye sürebilir.

---

## GÖREV 1: index.html'e Statik Pre-Loading Ekranı

### Çözüm:
React mount olmadan ÖNCE, saf HTML+CSS ile loading ekranı göster. React mount olunca bu ekranı kaldır.

### index.html değişiklikleri:

1. **`<body>` arka planını beyaz yap:**
```html
<body style="margin:0; background:#ffffff;">
```

2. **`<div id="root">` içine statik loading HTML ekle:**
```html
<div id="root">
  <!-- React mount olunca bu içerik otomatik değiştirilir -->
  <div id="pre-loader" style="
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    background: #ffffff;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  ">
    <!-- Tabbled logosu inline SVG veya base64 img olarak -->
    <img 
      src="/tabbled-logo.png" 
      alt="Tabbled" 
      style="height: 48px; margin-bottom: 16px;"
    />
    <!-- 3 nokta bounce animasyonu -->
    <div style="display: flex; gap: 6px;">
      <div style="
        width: 8px; height: 8px; border-radius: 50%; background: #e91e8c;
        animation: bounce 1.4s ease-in-out infinite;
      "></div>
      <div style="
        width: 8px; height: 8px; border-radius: 50%; background: #e91e8c;
        animation: bounce 1.4s ease-in-out 0.2s infinite;
      "></div>
      <div style="
        width: 8px; height: 8px; border-radius: 50%; background: #e91e8c;
        animation: bounce 1.4s ease-in-out 0.4s infinite;
      "></div>
    </div>
    <style>
      @keyframes bounce {
        0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
        40% { transform: scale(1); opacity: 1; }
      }
    </style>
  </div>
</div>
```

3. **React mount olunca `#pre-loader` otomatik kaybolur** çünkü React `<div id="root">`'un innerHTML'ini tamamen değiştirir. Ekstra JS gerekmez.

### Kontrol noktaları:
- Pembe logo rengi: #e91e8c (mevcut branding ile aynı)
- Logo dosyası: `/tabbled-logo.png` (public klasöründe zaten var)
- Arka plan: beyaz (#ffffff) — siyah ekran sorunu çözülür
- Animasyon: mevcut branded loading ekranıyla aynı bounce pattern

---

## GÖREV 2: Minimum Timer Optimizasyonu

### Mevcut durum:
PublicMenu.tsx'te minimum 1.0s loading timer var. Veri 300ms'de gelse bile 700ms boşa bekleniyor.

### Çözüm:
Timer'ı 1.0s → 0.5s'e düşür. Veya tamamen kaldır ve sadece veri gelene kadar loading göster.

```typescript
// ÖNCE:
const MIN_LOADING = 1000; // 1 saniye

// SONRA:
const MIN_LOADING = 500; // 0.5 saniye — yeterli branding exposure
```

DİKKAT: Timer'ı tamamen kaldırma — çok hızlı flash (loading → splash → menü) rahatsız edici olabilir. 500ms iyi bir denge.

---

## GÖREV 3: Font Preload

### Sorun:
Google Fonts (Playfair Display + Inter) render-blocking olabilir. Font yüklenene kadar metin görünmez (FOIT).

### Çözüm:
index.html `<head>`'e font preload ekle:

```html
<!-- Mevcut Google Fonts import'undan ÖNCE ekle -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

<!-- Font dosyalarını preload et (en çok kullanılan weight'ler) -->
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&family=Playfair+Display:wght@700&display=swap" />
```

Eğer Google Fonts import zaten `<link>` olarak varsa, `rel="preconnect"` satırlarını eklemek yeterli.

`display=swap` zaten varsa dokunma. Yoksa ekle — FOIT'u FOUT'a çevirir (metin hemen görünür, font gelince değişir).

---

## GENEL KURALLAR

1. **Sadece performans iyileştirmesi** — özellik ekleme yok
2. **Mevcut branding korunsun** — aynı logo, aynı pembe renk, aynı bounce animasyon
3. **Test:** Mobil cihazda (veya Chrome DevTools throttle: Slow 3G) test et
4. **Deployment:** `npm run build` test → `git add -A && git commit -m "Fix: Siyah ekran sorunu — pre-loader + font preload + timer optimizasyonu" && git push origin main`

---

## TEST CHECKLIST

- [ ] İlk açılışta siyah ekran YOK — hemen beyaz bg + logo + bounce dots görünüyor
- [ ] React mount olunca pre-loader kaybolup normal loading/splash devam ediyor
- [ ] Logo doğru görünüyor (pembe Tabbled logo)
- [ ] Bounce animasyonu çalışıyor
- [ ] Public menü normal akışı bozulmadı (loading → splash → menü)
- [ ] Loading süresi hissedilir şekilde kısaldı (timer 1.0s → 0.5s)
- [ ] Font preconnect/preload eklendi
- [ ] Admin panel ve landing page etkilenmedi
- [ ] Mobilde test edildi (veya Slow 3G throttle)
