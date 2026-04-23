# TABBLED — NEDEN ŞİMDİ BÖLÜMÜ: DEMO MENÜ CTA EKLEME

## PROJE BAĞLAMI

Tabbled.com landing page'inde "Neden şimdi" bölümü mevcut (koyu charcoal arka plan #1C1C1E, beyaz yazı). Bu bölümün altına demo menü için bir Call-to-Action eklenecek.

Demo menü olarak **Ramada Encore by Wyndham İstanbul (Bayrampaşa)** canlı menüsü kullanılacak. Bu zaten aktif müşterimizdir.

**Restaurant bilgileri:**
- Restaurant ID: `6f263390-0e8a-4948-89f6-26f30fd909c4`
- Restaurant Name: "Ramada Encore Bayrampaşa"
- Canlı menü URL'i: `https://tabbled.com/r/{slug}` — slug'ı DB'den kontrol etmek yerine koddan bul (aşağıya bak)

---

## MEVCUT DURUM

- Landing page'de "Neden şimdi" bölümü var (koyu arka plan, başlık + paragraf, CTA yok)
- Ekran görüntüsüne göre paragrafın altında boş alan var
- Brand colors: #FF4F7A (Strawberry Pink), #1C1C1E (Deep Charcoal), #F7F7F8 (Off-White)
- Icon set: Phosphor Icons Thin weight
- Font: Roboto (Bold 700 / Medium 500 / Regular 400 / Light 300)
- Style pattern: `S.*` inline style objects + native HTML elements (shadcn/ui doğrudan kullanılmıyor)

---

## GÖREV

### 1. Dosyayı Bul

`src/` içinde "Neden şimdi" metnini içeren component'i bul:

```bash
cd /opt/khp/tabbled && grep -rln "Neden şimdi" src/
```

Muhtemelen `WhyNowSection.tsx` veya landing page'de benzer isimli bir component. Eğer Türkçe karakter grep'te sorun çıkarırsa, `grep -rln "Neden" src/` veya `grep -rln "QR menü artık başlangıç" src/` ile dene.

### 2. Ramada'nın Slug'ını Bul

Ramada'nın slug'ını bulmak için:

```bash
grep -rn "Ramada" /opt/khp/tabbled/src 2>/dev/null
```

veya restaurant ID ile:

```bash
grep -rn "6f263390-0e8a-4948-89f6-26f30fd909c4" /opt/khp/tabbled/src 2>/dev/null
```

**Alternatif:** Slug'ı sabit yazmak yerine, CTA'da doğrudan `https://tabbled.com/r/ramada-encore-bayrampasa` kullan (Türkçe karakterler slug'a çevrildiğinde bu format olur). Eğer bu URL açılmazsa, canlı menü URL'ini Murat'a sor.

**En güvenli yol:** Supabase'den slug çekmek yerine URL'i environment variable veya component prop'u olarak geçir ki ileride değiştirmek kolay olsun:

```tsx
const DEMO_MENU_URL = "https://tabbled.com/r/ramada-encore-bayrampasa";
```

### 3. CTA Tasarımı

"Neden şimdi" paragrafının altına (mevcut section içinde, kapanış `</div>`den önce) aşağıdaki yapı eklenecek:

**Yapı:**
- Paragraf sonrasında ~48-64px spacing
- **Tek pembe buton:** "Canlı Demo Menüyü Gör"
  - Arka plan: #FF4F7A
  - Yazı: beyaz, Roboto Medium 500, 16px
  - Padding: 16px 32px
  - Border radius: 8px (veya site standardı — mevcut buton stilini kopyala)
  - Hover: hafif darken (örn. #E5456C) + transform translateY(-2px)
  - Transition: all 0.2s ease
  - İkon: Phosphor Thin `ArrowRight` (buton içi, sağda, 20px, beyaz)
  - Yeni sekmede açılır (`target="_blank" rel="noopener noreferrer"`)
- Butonun altında ~16px spacing
- **Attribution metni:**
  - "Ramada Encore by Wyndham İstanbul — aktif müşterimiz"
  - Renk: rgba(255, 255, 255, 0.6) (beyaz %60 opacity)
  - Font: Roboto Regular 400, 14px
  - Text-align: center

**Düzen:**
- Tüm CTA alanı `text-align: center`
- Max-width mevcut paragraf ile aynı (text-align: center kaldığı sürece zaten merkezde görünür)
- Mobile: buton full-width olmasın, ama padding rahat olsun — buton doğal genişlikte kalsın

### 4. Analytics Tracking (Opsiyonel ama önerilir)

Butona tıklama event'i Google Analytics'e gönderilmeli:

```tsx
const handleDemoClick = () => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'demo_menu_click', {
      event_category: 'engagement',
      event_label: 'why_now_cta',
    });
  }
};
```

`onClick={handleDemoClick}` olarak butona ekle. `target="_blank"` yine çalışır, onClick önce tetiklenir.

---

## KOD ÖRNEĞİ (ADAPT ET, KOPYALAMA)

Mevcut S.* pattern'a uygun olarak (dosyadaki mevcut stilleri referans al):

```tsx
import { ArrowRight } from "@phosphor-icons/react";

// S objesine ekle:
const S = {
  // ... mevcut stiller
  ctaWrapper: {
    marginTop: '48px',
    textAlign: 'center' as const,
  },
  ctaButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#FF4F7A',
    color: '#FFFFFF',
    fontFamily: 'Roboto, sans-serif',
    fontWeight: 500,
    fontSize: '16px',
    padding: '16px 32px',
    borderRadius: '8px',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    border: 'none',
    cursor: 'pointer',
  },
  ctaAttribution: {
    marginTop: '16px',
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'Roboto, sans-serif',
    fontWeight: 400,
    fontSize: '14px',
    textAlign: 'center' as const,
  },
};

// JSX içinde, mevcut paragrafın altında:
<div style={S.ctaWrapper}>
  <a
    href="https://tabbled.com/r/ramada-encore-bayrampasa"
    target="_blank"
    rel="noopener noreferrer"
    style={S.ctaButton}
    onClick={handleDemoClick}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = '#E5456C';
      e.currentTarget.style.transform = 'translateY(-2px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = '#FF4F7A';
      e.currentTarget.style.transform = 'translateY(0)';
    }}
  >
    Canlı Demo Menüyü Gör
    <ArrowRight size={20} weight="thin" />
  </a>
  <p style={S.ctaAttribution}>
    Ramada Encore by Wyndham İstanbul — aktif müşterimiz
  </p>
</div>
```

---

## GENEL KURALLAR

1. **Stil:** S.* inline style pattern kullan, Tailwind veya CSS file ekleme
2. **İkon:** Phosphor Thin weight — `weight="thin"` prop'u şart
3. **Font:** Sadece Roboto — başka font family eklenmez
4. **Renk:** Sabit hex değerleri yerine brand colors kullan (#FF4F7A, #1C1C1E, vs.)
5. **Responsive:** Mobile'da buton düzgün görünmeli, padding rahat kalmalı
6. **Link:** `target="_blank" rel="noopener noreferrer"` zorunlu
7. **Accessibility:** Buton için `aria-label="Canlı demo menüyü yeni sekmede aç"` ekle

---

## TEST CHECKLIST

- [ ] `npm run build` hatasız
- [ ] Desktop'ta CTA "Neden şimdi" paragrafının altında, ortalanmış görünüyor
- [ ] Mobile'da CTA overflow yapmıyor, düzgün ortalanıyor
- [ ] Butona tıklayınca yeni sekmede `tabbled.com/r/ramada-encore-bayrampasa` açılıyor (slug doğru mu kontrol et)
- [ ] Hover'da buton rengi değişiyor + hafif yukarı kalkıyor
- [ ] Attribution metni buton altında, beyaz %60 opacity
- [ ] ArrowRight ikonu Phosphor Thin weight
- [ ] Font Roboto Medium (buton) ve Regular (attribution)
- [ ] Console'da hata yok

---

## ÖNCELİK SIRASI

1. Dosyayı bul
2. Ramada slug'ını doğrula (canlı menü açılıyor mu test et)
3. CTA bileşenini ekle
4. `npm run build` çalıştır
5. Build ok ise Murat'a haber ver — push için hazır

---

## NOTLAR

- Eğer slug `ramada-encore-bayrampasa` ile menü açılmıyorsa, veri tabanında farklı bir format olabilir (örn. `ramada-encore-istanbul` veya başka). Önce `curl -I https://tabbled.com/r/ramada-encore-bayrampasa` ile test et. 404 ise Murat'a slug sor, sabit URL olarak bırakma.
- Git push yapma — Murat build sonrası kendi push'layacak.
- Bu prompt dosyası iş bitince silinebilir: `rm /opt/khp/tabbled/DEMO_CTA_PROMPT.md`
