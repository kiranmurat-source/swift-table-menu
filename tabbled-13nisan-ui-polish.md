# TABBLED — Public Menü UI/UX Polish
# UI/UX Pro Max Skill + SKILL.md Kuralları Birlikte Uygulanacak

---

## PROJE BAĞLAMI

- **Dizin:** /opt/khp/tabbled
- **Ana dosya:** src/pages/PublicMenu.tsx
- **Stack:** React + Vite + TypeScript + shadcn/ui
- **İkon:** Circum Icons (react-icons/ci)
- **Font:** Playfair Display (başlıklar) + Inter (body)
- **Tema:** white/black/red (restoran seçimine göre)
- **Marka:** Strawberry Pink #FF4F7A, Deep Charcoal #1C1C1E, Off-White #F7F7F8

### Mevcut Özellikler (bunlara dokunma, sadece görselini iyileştir):
- Splash ekranı (logo, tagline, cover, sosyal ikonlar)
- Kategori tab bar (sticky, scroll-aware, yatay scroll)
- Grid/List görünüm toggle
- Ürün kartları (fotoğraf, isim, fiyat, açıklama, badge, allerjen)
- Featured ürünler (2x büyük kart)
- Tükendi gösterimi + zamanlama filtresi
- Ürün detay modalı (bottom sheet)
- Garson çağırma sticky bottom bar
- Besin değerleri tablosu (FDA tarzı)
- 3 tema + çok dilli + QR masa numarası

---

## UI/UX PRO MAX SKİLL'İ KULLAN

Bu projede `.claude/skills/ui-ux-pro-max/` skill'i kurulu. Her değişiklik öncesinde bu skill'in kurallarını oku ve uygula. Özellikle:

1. **Restaurant/Booking** kategorisindeki reasoning rule'ları kontrol et
2. **Soft UI Evolution** veya **Minimalism & Swiss Style** stilinden birini seç (Tabbled'ın markasına uygun)
3. **Anti-pattern checklist'ini** uygula (emoji ikon yok, cursor pointer, hover states, contrast ratio)
4. **Pre-delivery checklist** ile doğrula

---

## 12 İYİLEŞTİRME GÖREVİ

### GRUP 1: GÖRSEL HİYERARŞİ & TİPOGRAFİ

#### 1.1 Fiyat Görsel Ağırlığı (KRİTİK)
**Sorun:** Fiyat menünün en önemli bilgisi ama yeterince öne çıkmıyor.
**Çözüm:**
- Fiyat font: Inter (sans-serif), font-weight 700, font-size 16px (list) / 15px (grid)
- Renk: Her temada belirgin — white temada #FF4F7A, black temada #FF6B8A, red temada #fff
- Konum: Sağ tarafa sabitlenmiş, isimle aynı satırda ama görsel olarak ayrık
- Varyant fiyat ("XX ₺'den başlayan"): fiyat kısmı bold, "den başlayan" kısmı muted 12px
- Tükendi ürünlerde fiyat üstü çizili (text-decoration: line-through) + opacity 0.5

#### 1.2 Kategori Başlıkları
**Sorun:** Kategoriler arası geçiş net değil, başlıklar kayboluyorw.
**Çözüm:**
- Kategori başlığı: Playfair Display, 20px, font-weight 700, letter-spacing: -0.03em
- Altında ince 1px separator çizgi (tema border rengi, %15 opacity)
- Üstünde 32px boşluk (bölümler arası), altında 12px (başlık-içerik arası)
- Kategori adının yanında ürün sayısı: muted 12px "(8 ürün)"

#### 1.3 Ürün Açıklama Hiyerarşisi
**Sorun:** İsim, açıklama ve fiyat arasındaki görsel fark yetersiz.
**Çözüm:**
- Ürün adı: Inter, 14px, font-weight 600, color: tema primary text, line-height 1.3
- Açıklama: Inter, 12px, font-weight 400, color: tema secondary text (muted), line-height 1.5, max 2 satır, overflow ellipsis
- Bu 3 katmanlı hiyerarşi: İSİM (güçlü) → FİYAT (renkli+bold) → AÇIKLAMA (muted+küçük)

---

### GRUP 2: KART TASARIMI & BOŞLUKLAR

#### 2.1 4-Nokta Spacing Sistemi (KRİTİK)
**Sorun:** Kart içi boşluklar tutarsız.
**Çözüm:** TÜM spacing değerleri 4'ün katı olmalı:
- Kart içi padding: 12px
- Fotoğraf-text arası gap: 12px (list), 8px (grid)
- İsim-açıklama arası: 4px
- Açıklama-badge arası: 8px
- Kart arası gap: 8px
- Kategori bölümleri arası: 32px
- Sayfa kenar padding: 16px
- Tab bar height: 48px

#### 2.2 Fotoğrafsız Ürünler (Grid Modunda)
**Sorun:** CiForkAndKnife placeholder profesyonel değil.
**Çözüm:**
- Placeholder: tema accent renginin %10 opacity arka planı + ürün adının ilk harfi (avatar tarzı)
- Harf: 24px, font-weight 700, tema accent rengi
- Border-radius: fotoğrafla aynı (8px grid, 8px list)
- Bu hem grid hem list'te tutarlı görünsün

```tsx
// Placeholder örneği
<div style={{
  width: '100%',
  aspectRatio: '4/3', // grid
  borderRadius: '8px',
  backgroundColor: `${themeAccent}15`, // %8 opacity
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '28px',
  fontWeight: 700,
  color: `${themeAccent}80`, // %50 opacity
  fontFamily: "'Playfair Display', serif",
}}>
  {itemName.charAt(0).toUpperCase()}
</div>
```

#### 2.3 Tükendi Gösterimi Güçlendirme
**Sorun:** Sadece opacity düşürme yeterli değil.
**Çözüm — 3 katmanlı:**
1. Fotoğraf üzerine yarı-şeffaf beyaz/koyu overlay (%40 opacity)
2. Fotoğraf ortasında "Tükendi" / "Sold Out" badge (kırmızı arka plan, beyaz text, 10px, rounded-full)
3. Fiyat üstü çizili (line-through)
4. Kart opacity: 0.6 (tüm kart)

```tsx
// Tükendi overlay
{item.is_sold_out && (
  <div style={{
    position: 'absolute',
    inset: 0,
    borderRadius: '8px',
    backgroundColor: theme === 'black' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }}>
    <span style={{
      fontSize: '11px',
      fontWeight: 700,
      color: '#fff',
      backgroundColor: '#dc2626',
      padding: '3px 10px',
      borderRadius: '12px',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    }}>
      {translations.soldOut}
    </span>
  </div>
)}
```

---

### GRUP 3: ETKİLEŞİM & ANİMASYONLAR

#### 3.1 Splash Overlay Gradient (KRİTİK)
**Sorun:** Kapak görseli üzerinde düz siyah overlay görseli mahvediyor.
**Çözüm:**
- Tam siyah overlay KALDIR
- Yerine linear gradient: `linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%)`
- Üst kısımda görsel görünür, alt kısımda metin okunur
- Opsiyonel: `backdrop-filter: blur(2px)` alt %30'a

```tsx
// Splash overlay — ESKİ:
// backgroundColor: 'rgba(0,0,0,0.6)'

// YENİ:
<div style={{
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%)',
}} />
```

#### 3.2 Detay Modal Animasyonu
**Sorun:** Modal aniden açılıyor, fiziksel his yok.
**Çözüm:**
- Modal açılış: `translateY(100%) → translateY(0)` + `opacity(0 → 1)`, 300ms ease-out
- Modal kapanış: aynı animasyonun tersi, 200ms ease-in
- Backdrop: `opacity(0 → 1)`, 200ms

```tsx
// CSS animasyon tanımla (index.css veya inline style tag)
const modalAnimation = `
  @keyframes slideUp {
    from { transform: translateY(100%); opacity: 0.5; }
    to { transform: translateY(0); opacity: 1; }
  }
  @keyframes slideDown {
    from { transform: translateY(0); opacity: 1; }
    to { transform: translateY(100%); opacity: 0.5; }
  }
`;
// Modal container:
// animation: 'slideUp 0.3s ease-out forwards'
// Kapanırken: 'slideDown 0.2s ease-in forwards' (setTimeout ile unmount)
```

#### 3.3 Kart Tıklama Geri Bildirimi
**Sorun:** Kartlara tıklanabilirlik ipucu eksik.
**Çözüm:**
- cursor: pointer (zaten olabilir, kontrol et)
- Hover (desktop): border rengi hafif koyulaşır VEYA çok hafif shadow (box-shadow: 0 2px 8px rgba(0,0,0,0.06))
- Active (tıklama anı): transform: scale(0.98), transition: 100ms
- Touch (mobil): active state önemli, :active pseudo-class veya onTouchStart

```tsx
// Kart stil — hover ve active state'leri ekle
const cardStyle = {
  cursor: 'pointer',
  transition: 'transform 0.1s ease, box-shadow 0.2s ease',
  // Hover için onMouseEnter/onMouseLeave ile state yönet
  // veya CSS class ile:
};
// Active state:
// transform: 'scale(0.98)'
```

---

### GRUP 4: TEMA & RENK SİSTEMİ

#### 4.1 Siyah Tema Derinlik Hiyerarşisi (KRİTİK)
**Sorun:** Dark modda gölge çalışmaz, kart arka planı düz siyah.
**Çözüm:**
- Sayfa arka plan: #111111
- Kart arka plan: #1a1a1a (ana bg'den DAHA AÇIK — derinlik hiyerarşisi)
- Modal arka plan: #222222 (karttan daha açık)
- Border: rgba(255,255,255,0.08) (düşük kontrast, ışık patlaması olmasın)
- Tab bar arka plan: #111111 + backdrop-filter: blur(8px)
- Gölge KULLANMA — sadece bg renk farkı ile derinlik

```tsx
const themeColors = {
  white: {
    pageBg: '#ffffff',
    cardBg: '#ffffff',
    cardBorder: 'rgba(0,0,0,0.06)',
    cardShadow: '0 1px 3px rgba(0,0,0,0.04)',
    modalBg: '#ffffff',
  },
  black: {
    pageBg: '#111111',
    cardBg: '#1a1a1a', // daha açık = daha yüksek katman
    cardBorder: 'rgba(255,255,255,0.08)',
    cardShadow: 'none', // dark modda gölge YOK
    modalBg: '#222222',
  },
  red: {
    pageBg: '#fafafa',
    cardBg: '#ffffff',
    cardBorder: 'rgba(220,38,38,0.1)',
    cardShadow: '0 1px 3px rgba(0,0,0,0.04)',
    modalBg: '#ffffff',
  },
};
```

#### 4.2 Garson Çağırma Buton 5 Durum
**Sorun:** Sadece default ve disabled var.
**Çözüm — 5 durum:**
1. **Default:** Dolgu rengi (accent), beyaz text
2. **Hover (desktop):** Renk biraz koyulaşır (darken %10)
3. **Pressed/Active:** scale(0.97) + renk daha koyu
4. **Loading:** Text yerine küçük spinner (CSS animation)
5. **Disabled/Cooldown:** Gri arka plan, cursor not-allowed, opacity 0.6

```tsx
// Loading spinner (CSS only)
const spinnerStyle = `
  @keyframes spin { to { transform: rotate(360deg); } }
`;
// <div style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.3)', borderTop:'2px solid #fff', borderRadius:'50%', animation:'spin 0.6s linear infinite' }} />
```

#### 4.3 İkon-Metin Oran Uyumu
**Sorun:** Allerjen ikonları, badge ikonları ve prep_time ikonu farklı boyutlarda.
**Çözüm — Kural: İkon Yüksekliği = Font Line-Height:**
- 14px text yanındaki ikon: 14px (size={14})
- 12px text yanındaki ikon: 12px (size={12})
- 11px badge text yanındaki ikon: 11px
- prep_time ve kalori badge'lerindeki ikonlar text boyutuyla eşleşmeli
- verticalAlign: 'middle' veya flex align-items: center ile hizala

---

## YÜRÜTME KURALLARI

1. **UI/UX Pro Max skill'ini oku** — `.claude/skills/ui-ux-pro-max/` dizinindeki kuralları kontrol et
2. **Mevcut fonksiyonaliteyi BOZMA** — sadece görsel iyileştirme, mantık değişikliği YOK
3. **3 temayı da test et** — her değişiklik white, black ve red'de çalışmalı
4. **4-nokta sistemi** — tüm yeni spacing değerleri 4'ün katı
5. **Circum Icons** — yeni ikon eklenecekse sadece react-icons/ci'den
6. **shadcn/ui internal'lerine DOKUNMA**
7. **Mevcut responsive davranışı koru**
8. **Her grup sonrası npm run build çalıştır**

---

## YÜRÜTME SIRASI

1. **GRUP 4 önce** — tema renk sistemi düzelt (diğer tüm gruplar buna bağlı)
2. **GRUP 1** — tipografi hiyerarşisi
3. **GRUP 2** — kart spacing + placeholder + tükendi
4. **GRUP 3** — animasyonlar ve etkileşim

---

## KONTROL LİSTESİ

### Tema & Renk
- [ ] Siyah tema: kart bg > sayfa bg (derinlik hiyerarşisi)
- [ ] Siyah tema: gölge yok, border düşük kontrast
- [ ] Kırmızı tema: accent renk uyumu
- [ ] Beyaz tema: hafif gölge + belirgin border

### Tipografi
- [ ] Fiyat: Inter 700, accent renk, sağa sabit
- [ ] Kategori başlığı: Playfair 700, 20px, letter-spacing -0.03em
- [ ] Ürün adı: Inter 600, 14px
- [ ] Açıklama: Inter 400, 12px, muted, max 2 satır

### Kart & Boşluk
- [ ] Tüm spacing 4'ün katı
- [ ] Fotoğrafsız placeholder: ilk harf avatar
- [ ] Tükendi: overlay + badge + çizili fiyat
- [ ] Kart arası gap: 8px

### Etkileşim
- [ ] Splash: gradient overlay (düz siyah değil)
- [ ] Modal: slideUp animasyonu
- [ ] Kart: hover shadow + active scale(0.98)
- [ ] Garson buton: 5 durum (default/hover/pressed/loading/disabled)
- [ ] İkon boyutu = text line-height

### Final
- [ ] White tema test ✓
- [ ] Black tema test ✓
- [ ] Red tema test ✓
- [ ] Mobil responsive test ✓
- [ ] npm run build başarılı
- [ ] git push origin main
