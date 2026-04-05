# TABBLED — Icon + Font Migration

Proje: /opt/khp/tabbled (GitHub: kiranmurat-source/swift-table-menu)

## Yapılacak 2 iş var:

### 1. Circum Icons Migration
Tüm uygulamadaki Lucide React ikonlarını ve emoji'leri Circum Icons (react-icons/ci) ile değiştir.

**Kural:** shadcn/ui internal bileşenlerine (src/components/ui/) DOKUNMA — sadece bizim yazdığımız dosyaları değiştir.

Önce paketi kur:
```bash
npm install react-icons --save
```

Değiştirilecek dosyalar ve eşleştirmeler:

**Landing page bileşenleri (src/components/):**

| Dosya | Eski (Lucide) | Yeni (Circum) |
|---|---|---|
| Navbar.tsx | `Menu, X` from lucide-react | `CiMenuBurger, CiCircleRemove` from react-icons/ci |
| HeroSection.tsx | `ArrowRight, Play, Star` | `CiCircleChevRight, CiPlay1, CiStar` |
| FeaturesSection.tsx | `QrCode, ShoppingCart, Bell, BarChart3, Globe, Activity` | `CiBarcode, CiShoppingCart, CiBellOn, CiViewBoard, CiGlobe, CiWavePulse1` |
| CTABanner.tsx | `ArrowRight` | `CiCircleChevRight` |
| TestimonialsSection.tsx | `Star` | `CiStar` |
| ValueProposition.tsx | `ArrowRight, Layers, Globe, Activity, Bell` | `CiCircleChevRight, CiBoxes, CiGlobe, CiWavePulse1, CiBellOn` |
| PhoneMockup.tsx | `Wifi, Battery, Signal` + 🍳 emoji | `CiWifiOn, CiBatteryFull, CiWavePulse1, CiForkAndKnife` |
| PricingSection.tsx | `Check, X` | `CiCircleCheck, CiCircleRemove` |
| FeatureComparisonTable.tsx | `Check, X, Minus` | `CiCircleCheck, CiCircleRemove, CiCircleMinus` |

**Dashboard'lar (src/pages/):**

RestaurantDashboard.tsx:
- Import ekle: `import { CiWheat, CiDroplet, CiCircleAlert, CiApple, CiLemon, CiCamera, CiEdit, CiCircleCheck, CiCircleRemove, CiStar, CiTempHigh } from 'react-icons/ci';`
- ALLERGEN_OPTIONS: emoji string'leri (`'🌾'`, `'🥛'` vs.) → React element (`<CiWheat size={14} />` vs.) olarak değiştir. Type'ı `icon: string` → `icon: React.ReactNode` yap
- allergenIcons join logic'ini güncelle — artık string değil ReactNode, `.map` ile render et
- `📷 Görsel Seç` → `<CiCamera size={14} /> Görsel Seç`
- `🌱 Vejetaryen` → `<CiApple size={14} /> Vejetaryen`
- `✨ Yeni Ürün` → `<CiStar size={14} /> Yeni Ürün`
- Badge'lerdeki `🌱`, `✨ Yeni`, `⭐` → `<CiApple size={12} />`, `<CiStar size={12} /> Yeni`, `<CiStar size={12} />`
- `🔥 {calories} kcal` → `<CiTempHigh size={12} /> {calories} kcal`
- `✓` butonları → `<CiCircleCheck size={14} />`
- `✕` butonları → `<CiCircleRemove size={14} />`
- `✎` düzenle butonu → `<CiEdit size={14} />`

SuperAdminDashboard.tsx:
- Import ekle: `import { CiCircleCheck, CiCircleRemove } from 'react-icons/ci';`
- `✓` → `<CiCircleCheck size={14} />`
- `✕` → `<CiCircleRemove size={14} />`
- `val === 'true' ? '✓'` → `val === 'true' ? <CiCircleCheck size={14} style={{ display: 'inline' }} />`

### 2. Montserrat Font Migration
Tüm uygulamayı Montserrat font'una geçir.

**index.css:**
- Google Fonts import'unu değiştir:
  - Eski: `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Nunito:wght@700;800;900&display=swap');`
  - Yeni: `@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@100;200;300;400;500;600;700;800;900&display=swap');`
- body'ye `font-weight: 400;` ekle
- h1-h6'ya `font-weight: 700;` ekle
- `.text-muted-foreground` selector'una `font-weight: 200;` ekle (açıklamalar thin olacak)

**tailwind.config.ts:**
- `fontFamily.heading`: `["Nunito", "sans-serif"]` → `["Montserrat", "sans-serif"]`
- `fontFamily.body`: `["DM Sans", "sans-serif"]` → `["Montserrat", "sans-serif"]`

### Son adım
```bash
npm run build
git add -A && git commit -m "Circum Icons + Montserrat font migration" && git push origin main
```

Build başarılı olmalı — hata varsa düzelt ve tekrar dene.
