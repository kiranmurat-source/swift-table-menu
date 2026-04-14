# TABBLED — Sidebar Fix + Akordeon + Dark Tema Full Fix
## 3 Görev: Sidebar Temizlik & Akordeon + Yükseklik Fix + Dark Tema Tam Uygulama

---

## PROJE BAĞLAMI

- **Repo:** /opt/khp/tabbled/
- **Stack:** React + Vite + TypeScript + shadcn/ui
- **Admin tema sistemi:** `src/lib/adminTheme.ts` — light/dark palette (restaurants.admin_theme kolonu)
- **Marka renkleri:** #FF4F7A (pembe — sadece CTA + aktif state), #1C1C1E (charcoal), #F7F7F8 (açık gri)
- **İkon:** Phosphor Icons (@phosphor-icons/react) — sadece Thin weight
- **Emoji yasağı:** Kesinlikle emoji kullanma

---

## GÖREV 1: SIDEBAR TEMİZLİK + AKORDEON

### 1A: "Yorumlar" Kaldır
- Sidebar'dan "Yorumlar" menü item'ını tamamen kaldır
- İlgili panel bileşeni varsa (ReviewsPanel, CommentsPanel veya benzeri) dosyayı sil
- Import'larını temizle
- "Geri Bildirim" (FeedbackPanel) kalıyor — splash'taki "Değerlendir" butonu bunu besliyor

### 1B: Sidebar Akordeon Yapısı
Sidebar grup başlıklarını tıklanabilir akordeon yap. Kullanıcı sadece çalıştığı bölümü açık tutar.

**Mevcut gruplar (muhtemel):**
- MENÜ YÖNETİMİ (Menü, Çeviri Merkezi, QR Kodları)
- MÜŞTERİ İLİŞKİLERİ (Müşteriler, Çağrılar, Geri Bildirim, Beğeniler, Promosyonlar)
- PAZARLAMA (İndirim Kodları)
- GÖRÜNÜM (Tema & Profil)

**Dashboard ve Analitik** akordeon grubunda DEĞİL — her zaman görünür (en üstte, grupsuz).

**Akordeon davranışı:**
- Grup başlığına tıklayınca altındaki item'lar toggle (göster/gizle)
- Başlığın sağında küçük chevron ikonu: `CaretDown` (açık) / `CaretRight` (kapalı) — Phosphor Thin
- Varsayılan: aktif sidebar item'ın bulunduğu grup açık, diğerleri kapalı
- Birden fazla grup aynı anda açık olabilir (bağımsız toggle, mutual exclusive DEĞİL)
- Açık/kapalı state'i localStorage'da sakla (sayfa yenilenince korunsun): `tabbled_sidebar_groups` key'i
- Animasyon: basit height transition (max-height veya CSS transition, 200ms ease)

**Görsel:**
- Grup başlığı: mevcut uppercase gri stil korunsun
- Chevron: 14px, grup başlığının sağında
- Kapalı grupta sadece başlık görünür, item'lar gizli (height: 0, overflow: hidden)

### 1C: Sidebar Yükseklik Fix
- Sidebar uzun sayfalarda arka planı erken bitiyor
- Sidebar container: `min-h-screen` + `h-full` veya `position: sticky; top: 0; height: 100vh; overflow-y: auto`
- Sidebar scroll edilebilir olmalı (içerik viewport'tan uzunsa kendi içinde scroll)
- Ana içerik alanı bağımsız scroll etmeli
- Sidebar arka plan rengi (#1C1C1E dark sidebar) sayfanın en altına kadar uzanmalı

**Önerilen layout pattern:**
```css
/* Sidebar container */
.sidebar {
  position: fixed; /* veya sticky */
  top: 0;
  left: 0;
  width: 220px; /* mevcut genişlik neyse */
  height: 100vh;
  overflow-y: auto;
  background: #1C1C1E;
}

/* Main content */
.main-content {
  margin-left: 220px;
  min-height: 100vh;
}
```

- Mobilde sidebar zaten drawer/hamburger olmalı — masaüstü fix'i mobili bozmasın

---

## GÖREV 2: DARK TEMA TAM UYGULAMA

### Felsefe
Dark tema "tam dark" olacak — hiçbir yerde beyaz kart, beyaz input, beyaz arka plan kalmayacak.

### adminTheme.ts Palette Kontrolü
Önce `src/lib/adminTheme.ts` dosyasını oku. Mevcut dark palette'te şu değerler olmalı (yoksa ekle/düzelt):

```typescript
dark: {
  // Ana arka planlar
  bg: '#0D0D0D',              // sayfa arka planı — gerçekten koyu
  cardBg: '#1A1A1A',          // kart arka planı — bg'den biraz açık
  cardBgHover: '#222222',     // kart hover
  
  // Input & Form
  inputBg: '#1A1A1A',         // input arka planı — koyu
  inputBorder: '#333333',     // input border
  inputText: '#E5E5E5',       // input metin
  inputPlaceholder: '#666666', // placeholder
  inputFocusBorder: '#FF4F7A', // focus border — pembe
  
  // Metin
  text: '#E5E5E5',            // ana metin — açık gri (tam beyaz değil)
  textSecondary: '#999999',   // ikincil metin
  textMuted: '#666666',       // soluk metin
  
  // Border & Divider
  border: '#2A2A2A',          // genel border
  divider: '#222222',         // ayırıcı çizgi
  
  // Etkileşim
  hover: '#222222',           // hover arka plan
  activeItem: '#1F1F1F',      // aktif sidebar item bg
  
  // Aksanlar
  accent: '#FF4F7A',          // pembe — CTA, aktif state
  accentHover: '#E63E66',     // pembe hover
  
  // Durum renkleri
  success: '#22C55E',
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  
  // Badge / Chip arka planları (dark modda pastel DEĞİL, koyu tonlar)
  successBg: '#0D2818',       // yeşil badge bg
  dangerBg: '#2D1215',        // kırmızı badge bg
  warningBg: '#2D2106',       // sarı badge bg
  infoBg: '#0D1B2D',          // mavi badge bg
  
  // Chart
  chartBar: '#FF6B8A',
  chartBarHover: '#FF8FA8',
  chartGrid: '#333333',
  chartLabel: '#999999',
  heatmapLow: '#2A1520',
  heatmapMid: '#5C2040',
  heatmapHigh: '#FF4F7A',
  
  // Tablo
  tableHeaderBg: '#151515',
  tableRowHover: '#1F1F1F',
  tableStripedBg: '#141414',
}
```

### Uygulanacak Sayfalar/Bileşenler (TÜMÜ)

Aşağıdaki TÜM dosyaları kontrol et ve dark temada beyaz kalan her yeri düzelt:

1. **RestaurantDashboard.tsx** — ana container arka planı, tab bar, genel layout
2. **Tema & Profil sayfası** — görseller bölümü, işletme bilgileri kartları, input'lar, sosyal medya alanları, çalışma saatleri, tema seçici, feature toggle'lar
3. **RestaurantAnalytics.tsx** — dashboard kartları
4. **WaiterCallsPanel.tsx**
5. **FeedbackPanel.tsx**
6. **LikesPanel.tsx**
7. **DiscountCodesPanel.tsx**
8. **CustomersPanel.tsx**
9. **AnalyticsPanel.tsx**
10. **Menü sayfası** — kategori listesi, ürün satırları, ürün düzenleme formu/modal
11. **Çeviri Merkezi**
12. **QR Kodları** sayfası

### Uygulama Kuralları

**Her bileşende şu pattern'i uygula:**
```typescript
import { getAdminTheme } from '@/lib/adminTheme';

// Props'tan adminTheme al (yoksa prop ekle)
const t = getAdminTheme(adminTheme || 'light');

// Kullanım örnekleri:
// Container
style={{ backgroundColor: t.bg, color: t.text }}

// Kart
style={{ backgroundColor: t.cardBg, borderColor: t.border }}

// Input
style={{ 
  backgroundColor: t.inputBg, 
  borderColor: t.inputBorder, 
  color: t.inputText 
}}

// Tablo header
style={{ backgroundColor: t.tableHeaderBg }}

// Badge (başarı)
style={{ backgroundColor: t.successBg, color: t.success }}
```

**Dikkat edilecekler:**
- `bg-white` → `t.cardBg` veya `t.bg`
- `text-gray-900` / `text-black` → `t.text`
- `text-gray-500` → `t.textSecondary`
- `border-gray-200` → `t.border`
- `hover:bg-gray-50` → `t.hover`
- Tailwind class'ları yerine inline style kullan (tema dinamik olduğu için)
- shadcn/ui bileşenleri (Select, Input, Dialog, Sheet vb.) tema override'a ihtiyaç duyabilir — className ile veya wrapper style ile
- Eğer shadcn/ui bileşeni var ve style override zor ise, bileşeni sarmalayan div'e tema renklerini CSS custom property olarak set et

**Input özel durumu — shadcn/ui Input override:**
```typescript
// shadcn Input'un dark modda görünmesi için:
<Input 
  className="..."
  style={{
    backgroundColor: t.inputBg,
    borderColor: t.inputBorder,
    color: t.inputText,
  }}
/>
```

**Select/Dropdown dark modu:**
Select bileşenlerinin dropdown menüsü de koyu olmalı. shadcn Select kullanılıyorsa, SelectContent'e style ekle:
```typescript
<SelectContent style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
  <SelectItem style={{ color: t.text }}>...</SelectItem>
</SelectContent>
```

**Modal/Dialog dark modu:**
```typescript
<DialogContent style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.text }}>
```

**Plan bilgi banner (üstteki Premium + AI Kredisi bar):**
Dark modda da okunur olmalı — arka plan: `t.cardBg`, text: `t.text`

---

## GÖREV 3: GENEL DARK TEMA KALİTE KONTROL

### Son geçiş — tüm sayfalarda şu kontrolü yap:

1. Sayfa arka planı koyu mu? (beyaz kalmamış mı?)
2. Kartlar arka plandan ayrışıyor mu? (cardBg > bg biraz açık)
3. Tüm input'lar koyu mu?
4. Tüm metin okunur mu? (beyaz/açık gri metin + koyu arka plan)
5. Border'lar görünür ama baskın değil mi?
6. Badge'ler okunur mu? (koyu bg + parlak metin)
7. Hover state'ler çalışıyor mu?
8. Modal/Dialog açılınca koyu mu?
9. Dropdown/Select açılınca koyu mu?
10. Tablo header/row alternating koyu mu?

### Light tema bozulmasın!
- Tüm değişiklikler tema koşullu olmalı (`t.xxx` ile)
- Light modda mevcut beyaz/gri görünüm korunmalı
- Her iki temada da test et

---

## GENEL KURALLAR

1. **Emoji YASAK** — hiçbir yerde emoji kullanma
2. **Phosphor Icons sadece Thin weight** — `<Icon weight="thin" />`
3. **shadcn/ui internal Lucide ikonlarına DOKUNMA**
4. **console.log → import.meta.env.DEV kontrolü**
5. **TypeScript strict — any kullanma**
6. **Her dosyayı kaydetmeden önce oku, anla, sonra değiştir**
7. **Mevcut işlevselliği bozma — sadece görsel iyileştirme**

---

## TEST CHECKLIST

### Sidebar
- [ ] "Yorumlar" sidebar'da yok
- [ ] Grup başlıkları tıklanabilir (akordeon)
- [ ] Chevron ikonu açık/kapalı duruma göre döner
- [ ] Aktif item'ın grubu varsayılan açık
- [ ] Birden fazla grup aynı anda açık olabiliyor
- [ ] Sayfa yenilenince akordeon state korunuyor (localStorage)
- [ ] Sidebar tüm sayfa boyunca uzanıyor (yükseklik fix)
- [ ] Sidebar içeriği uzunsa kendi içinde scroll ediyor
- [ ] Mobil hamburger menü hâlâ çalışıyor
- [ ] Sidebar alt kısmında restoran adı + menü linki görünüyor

### Dark Tema
- [ ] Sayfa arka planı koyu (#0D0D0D civarı)
- [ ] Kartlar biraz daha açık koyu (#1A1A1A civarı)
- [ ] Tüm input arka planları koyu
- [ ] Tüm input border'ları koyu gri
- [ ] Input placeholder'ları görünür ama soluk
- [ ] Metin renkleri açık gri (#E5E5E5)
- [ ] Badge'ler okunur (koyu bg + parlak text)
- [ ] Select/Dropdown açılınca koyu
- [ ] Modal/Dialog açılınca koyu
- [ ] Tablo satırları koyu
- [ ] Chart bar'ları dark modda görünür
- [ ] Isı haritası dark modda görünür
- [ ] Plan banner koyu ve okunur
- [ ] Tema & Profil sayfası tamamen koyu
- [ ] Menü sayfası (kategori + ürün) tamamen koyu
- [ ] QR Kodları sayfası koyu
- [ ] Çeviri Merkezi koyu

### Light Tema (regresyon)
- [ ] Light modda her şey hâlâ beyaz/gri
- [ ] Light modda input'lar beyaz
- [ ] Light modda kartlar beyaz
- [ ] Light modda metin koyu

### Build
- [ ] `npm run build` hatasız
- [ ] Konsolda hata yok

---

## ÖNCELİK SIRASI

1. Sidebar: Yorumlar kaldır + yükseklik fix (en hızlı)
2. Sidebar akordeon (orta karmaşıklık)
3. adminTheme.ts palette genişlet (input, badge, tablo renkleri ekle)
4. Dark tema tam uygulama — sayfa sayfa gez, beyaz kalan her yeri düzelt
5. Kalite kontrol — light ve dark modda tüm sayfaları test et

---

## DOSYA HARİTASI

```
src/lib/adminTheme.ts                    → Tema palette genişletme
src/pages/RestaurantDashboard.tsx         → Ana layout + sidebar + tab routing
src/components/Sidebar.tsx               → (varsa ayrı bileşen) Akordeon + yükseklik
src/components/RestaurantAnalytics.tsx   → Dashboard kartları
src/components/WaiterCallsPanel.tsx      → Garson çağrıları
src/components/FeedbackPanel.tsx         → Geri bildirim
src/components/LikesPanel.tsx            → Beğeniler
src/components/DiscountCodesPanel.tsx    → İndirim kodları
src/components/CustomersPanel.tsx        → Müşteriler
src/components/AnalyticsPanel.tsx        → Analitik
src/components/TranslationCenter.tsx     → Çeviri merkezi (varsa)
src/components/QRCodesPanel.tsx          → QR kodları (varsa)
src/components/MenuPanel.tsx             → Menü (varsa ayrı bileşen)
```

NOT: Sidebar RestaurantDashboard.tsx içinde inline olabilir veya ayrı bir bileşen olabilir — önce dosya yapısını kontrol et.
