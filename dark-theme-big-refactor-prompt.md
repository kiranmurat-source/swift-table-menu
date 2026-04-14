# TABBLED — Dark Tema: Menü + Profil + Çeviri Merkezi
## RestaurantDashboard.tsx + TranslationCenter.tsx Dark Tema Tam Uygulama

---

## PROJE BAĞLAMI

- **Repo:** /opt/khp/tabbled/
- **Stack:** React + Vite + TypeScript + shadcn/ui
- **Tema sistemi:** `src/lib/adminTheme.ts` — `getAdminTheme(theme)` → palette objesi döner
- **Tema prop:** `adminTheme` state'i RestaurantDashboard.tsx'te tanımlı, `'light' | 'dark'`
- **DB:** `restaurants.admin_theme` kolonu
- **Emoji yasağı:** Kesinlikle emoji kullanma

---

## MEVCUT DURUM

- `adminTheme.ts` palette zaten genişletildi: inputBg, inputBorder, inputText, inputPlaceholder, inputFocusBorder, cardBg, cardBgHover, border, text, textSecondary, textMuted, hover, successBg, dangerBg, warningBg, infoBg, tableHeaderBg, tableRowHover, tableStripedBg, chartBar, chartGrid, chartLabel vs.
- AnalyticsPanel, CustomersPanel, QRManager zaten tema uyumlu
- **RestaurantDashboard.tsx** (~3500 satır) içinde menü yönetimi + profil/tema sayfası inline — hardcoded beyaz renkler var
- **TranslationCenter.tsx** (~853 satır) — 20+ hardcoded #fff ve beyaz arka plan

---

## STRATEJİ

Bu dosyalar çok büyük. Yaklaşım:
1. Dosyanın başında `const t = getAdminTheme(adminTheme);` zaten varsa kullan, yoksa ekle
2. **Find & Replace pattern'i ile çalış** — tek tek satır aramak yerine sistematik değiştir
3. Önce en yaygın pattern'leri bul, sonra kenar durumları temizle

---

## GÖREV 1: RestaurantDashboard.tsx — MENÜ BÖLÜMLERİ

### Adım 1: Tema değişkenini hazırla
- Dosyanın üstünde `const t = getAdminTheme(adminTheme);` olmalı
- Yoksa ekle, `adminTheme` state'i zaten bu dosyada tanımlı

### Adım 2: Sistematik renk değişimi

Aşağıdaki pattern'leri BUL ve DEĞİŞTİR:

**Arka planlar:**
- `backgroundColor: '#FFFFFF'` → `backgroundColor: t.cardBg`
- `backgroundColor: '#fff'` → `backgroundColor: t.cardBg`
- `backgroundColor: 'white'` → `backgroundColor: t.cardBg`
- `backgroundColor: '#F7F7F8'` → `backgroundColor: t.bg`
- `backgroundColor: '#f5f5f5'` → `backgroundColor: t.bg`
- `backgroundColor: '#FAFAFA'` → `backgroundColor: t.bg`
- `bg-white` (className) → inline style `backgroundColor: t.cardBg`
- `bg-gray-50` → inline style `backgroundColor: t.bg`

**Metin:**
- `color: '#1C1C1E'` → `color: t.text`
- `color: '#000'` → `color: t.text`
- `color: '#333'` veya `color: '#333333'` → `color: t.text`
- `color: '#666'` veya `color: '#666666'` → `color: t.textSecondary`
- `color: '#999'` veya `color: '#999999'` → `color: t.textMuted`
- `text-gray-900` → `color: t.text` (inline style'a çevir)
- `text-gray-700` → `color: t.text`
- `text-gray-500` → `color: t.textSecondary`
- `text-gray-400` → `color: t.textMuted`

**Border:**
- `borderColor: '#E5E5E3'` → `borderColor: t.border`
- `borderColor: '#E5E5E5'` → `borderColor: t.border`
- `borderColor: '#e5e5e5'` → `borderColor: t.border`
- `borderColor: '#eee'` → `borderColor: t.border`
- `border-gray-200` → inline style `borderColor: t.border`
- `border: '1px solid #...'` → `border: \`1px solid ${t.border}\``

**Hover:**
- `backgroundColor: '#f5f5f5'` (hover context'te) → `backgroundColor: t.hover`
- `hover:bg-gray-50` → onMouseEnter/Leave ile t.hover

**Input/Form alanları:**
- Input, textarea, select elementlerine:
  ```
  backgroundColor: t.inputBg,
  borderColor: t.inputBorder,
  color: t.inputText,
  ```
- Placeholder rengi CSS ile veya inline:
  ```css
  ::placeholder { color: t.inputPlaceholder }
  ```
  (React'te doğrudan style ile placeholder rengi veremezsin — className ile veya global CSS'te dark mod placeholder kuralı ekle)

### Adım 3: Kategori listesi alanı
- Kategori kartları / satırları — arka plan, border, metin tema uyumlu
- Drag handle rengi — dark modda görünür olmalı
- Aktif/seçili kategori vurgusu — t.accent veya t.hover

### Adım 4: Ürün listesi / ürün satırları
- Ürün satır arka planı — t.cardBg
- Ürün satır hover — t.hover
- Fiyat rengi — t.text (bold)
- "Tükendi" badge — t.dangerBg + t.danger
- "Popüler" badge — t.accent
- Ürün düzenleme formu/alanı — tüm input'lar tema uyumlu

### Adım 5: Ürün ekleme/düzenleme modal veya inline form
- Tüm input alanları: t.inputBg, t.inputBorder, t.inputText
- Label'lar: t.text
- Açıklama/yardım metni: t.textSecondary
- Butonlar: kaydet → t.accent, iptal → t.border arka plan
- Allerjen seçici: chip'ler tema uyumlu
- Görsel yükleme alanı: border dashed t.border, arka plan t.bg

---

## GÖREV 2: RestaurantDashboard.tsx — PROFİL / TEMA BÖLÜMÜ

### "Tema & Profil" tab'ı altında:

**Görseller bölümü:**
- Logo ve kapak görseli kartı: t.cardBg arka plan, t.border border
- "Değiştir" / "Sil" butonları: tema uyumlu
- Boyut bilgi metni: t.textMuted

**İşletme Bilgileri:**
- Kart arka planı: t.cardBg
- Tüm input'lar (Restoran Adı, Slogan, Açıklama, Adres, Telefon): t.inputBg + t.inputBorder + t.inputText
- Label'lar: t.text
- Bölüm başlıkları (İşletme Bilgileri, Sosyal Medya): t.text

**Sosyal Medya:**
- Input'lar: t.inputBg + t.inputBorder + t.inputText
- Platform label'ları: t.textSecondary

**Çalışma Saatleri:**
- Gün satırları: alternating t.cardBg / t.bg
- Saat input'ları: t.inputBg
- Açık/Kapalı toggle: tema uyumlu

**Tema Seçici:**
- Public tema swatch'ları (white/black): mevcut stil kalsın — bunlar public menü teması, admin tema değil
- Admin tema toggle (light/dark): mevcut stil kalsın

**Feature Toggle'lar:**
- Toggle satırları: t.cardBg arka plan
- Toggle açıklama: t.textSecondary
- Switch bileşeni: shadcn Switch — accent rengi t.accent

**Plan Banner:**
- Üstteki "Premium" + "AI Kredisi" bar: t.cardBg arka plan, t.text metin

---

## GÖREV 3: TranslationCenter.tsx

### Adım 1: Tema prop'u al
- TranslationCenter bileşeni `adminTheme` prop'u alıyor mu kontrol et
- Almıyorsa ekle: `theme?: 'light' | 'dark'`
- RestaurantDashboard'dan geçir: `<TranslationCenter theme={adminTheme} ... />`
- Bileşen içinde: `const t = getAdminTheme(theme || 'light');`

### Adım 2: Sistematik değişim
Görev 1'deki aynı find & replace pattern'lerini uygula:
- Tüm `#FFFFFF`, `#fff`, `white` → t.cardBg
- Tüm metin renkleri → t.text / t.textSecondary / t.textMuted
- Tüm border → t.border
- Tüm input → t.inputBg + t.inputBorder + t.inputText

### Adım 3: Çeviri tablosu
- Tablo header: t.tableHeaderBg
- Tablo satırları: alternating t.cardBg / t.tableStripedBg
- Tablo satır hover: t.tableRowHover
- Dil seçici dropdown: t.cardBg arka plan
- "Çevir" butonu: t.accent
- İlerleme bar: t.accent fill + t.border arka plan

### Adım 4: Parent→child tree görünümü (varsa)
- Tree node'ları: t.cardBg
- Bağlantı çizgileri: t.border
- Genişlet/daralt ikonu: t.textSecondary

---

## PLACEHOLDER RENGİ ÇÖZÜMÜ

React inline style ile placeholder rengi verilemez. Çözüm:

`src/index.css`'e ekle:
```css
/* Dark tema input placeholder */
[data-theme="dark"] input::placeholder,
[data-theme="dark"] textarea::placeholder {
  color: #666666 !important;
}

[data-theme="dark"] input,
[data-theme="dark"] textarea,
[data-theme="dark"] select {
  color-scheme: dark;
}
```

Ve RestaurantDashboard'un ana container'ına `data-theme={adminTheme}` attribute'u ekle:
```tsx
<div data-theme={adminTheme} style={{ backgroundColor: t.bg }}>
  {/* tüm dashboard içeriği */}
</div>
```

Bu sayede tüm input placeholder'ları ve form elemanları dark modda otomatik koyu olur.

---

## GENEL KURALLAR

1. **Emoji YASAK**
2. **Phosphor Icons sadece Thin weight**
3. **shadcn/ui internal Lucide ikonlarına DOKUNMA**
4. **Light modu BOZMA** — her değişiklik `t.xxx` ile koşullu
5. **Mevcut işlevselliği bozma** — sadece renk değişikliği
6. **console.log → import.meta.env.DEV kontrolü**
7. **TypeScript strict — any kullanma**
8. **Dosya çok büyük — section section çalış, her section sonunda dosyayı kaydet**

---

## TEST CHECKLIST

### Dark Mod
- [ ] Menü sayfası: kategori listesi koyu
- [ ] Menü sayfası: ürün satırları koyu
- [ ] Menü sayfası: ürün düzenleme formu koyu
- [ ] Menü sayfası: allerjen seçici koyu
- [ ] Menü sayfası: görsel yükleme alanı koyu
- [ ] Profil sayfası: görseller kartı koyu
- [ ] Profil sayfası: işletme bilgileri input'ları koyu
- [ ] Profil sayfası: sosyal medya input'ları koyu
- [ ] Profil sayfası: çalışma saatleri koyu
- [ ] Profil sayfası: feature toggle'lar koyu
- [ ] Çeviri merkezi: tablo header koyu
- [ ] Çeviri merkezi: tablo satırları koyu
- [ ] Çeviri merkezi: input/dropdown koyu
- [ ] Plan banner koyu

### Light Mod (regresyon)
- [ ] Menü sayfası beyaz/gri
- [ ] Profil sayfası beyaz/gri
- [ ] Çeviri merkezi beyaz/gri
- [ ] Input'lar beyaz
- [ ] Metin koyu

### Build
- [ ] `npm run build` hatasız

---

## ÖNCELİK SIRASI

1. `data-theme` attribute + index.css placeholder kuralı (5 dk)
2. RestaurantDashboard.tsx — Profil bölümü (daha küçük, hızlı)
3. RestaurantDashboard.tsx — Menü bölümü (en büyük iş)
4. TranslationCenter.tsx
5. Test — light ve dark mod

---

## DOSYALAR

```
src/lib/adminTheme.ts              → Palette (zaten genişletildi, eksik varsa ekle)
src/pages/RestaurantDashboard.tsx   → Ana dosya (~3500 satır)
src/components/TranslationCenter.tsx → Çeviri merkezi (~853 satır)
src/index.css                       → Placeholder CSS kuralı
```
