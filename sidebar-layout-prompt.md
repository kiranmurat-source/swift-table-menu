# TABBLED — Restoran Dashboard Sol Sidebar Layout
## Claude Code Prompt — 10 Nisan 2026

---

## GENEL BAKIŞ

RestaurantDashboard.tsx'teki üstteki yatay tab düzenini sol dikey sidebar layout'a dönüştür. Mevcut 5 tab (Menü, Çeviri Merkezi, QR Kodları, Promosyonlar, Profil) sol sidebar'a taşınacak. İleride yeni özellikler eklendikçe sidebar'a rahatça yeni öğeler eklenebilmeli. FineDine admin paneli referans alınacak.

---

## MEVCUT YAPI

RestaurantDashboard.tsx'te şu anda:
- `activeTab` state: `'menu' | 'translations' | 'qr' | 'profile' | 'promos'`
- 5 adet inline styled `<button>` yatay tab çubuğunda sıralanmış
- Her buton `onClick={() => setActiveTab('...')}` ile çalışıyor
- İçerik alanı `{activeTab === '...' && <Component />}` ile render ediliyor

---

## YAPILACAK DEĞİŞİKLİKLER

### 1. Layout Yapısı

Mevcut:
```
┌──────────────────────────────────────┐
│ Restoran Adı                          │
│ [Menü] [Çeviri] [QR] [Promo] [Profil]│
│──────────────────────────────────────│
│           İÇERİK                      │
└──────────────────────────────────────┘
```

Yeni:
```
┌─────────┬────────────────────────────┐
│ SIDEBAR │ Restoran Adı               │
│         │                            │
│ 🍽 Menü  │                            │
│ 🌐 Çeviri│       İÇERİK              │
│ 📱 QR    │                            │
│ 🎉 Promo │                            │
│ 👤 Profil │                            │
│         │                            │
│         │                            │
│─────────│                            │
│ Tabbled │                            │
└─────────┴────────────────────────────┘
```

### 2. Sidebar Tasarım Özellikleri

**Desktop (≥768px):**
- Sidebar genişliği: 220px (sabit)
- Arka plan: `#fafafa` (çok açık gri)
- Sol kenar: `border-right: 1px solid #e5e5e5`
- Yükseklik: `min-height: calc(100vh - navbar yüksekliği)`
- Üstte restoran logosu (varsa, 40x40 rounded) + restoran adı (kısaltılmış)
- Menü öğeleri dikey sıralanmış
- Aktif öğe: `background: #f0f0f0`, `border-left: 3px solid #e11d48` (pembe/kırmızı), `font-weight: 600`, `color: #1c1917`
- Pasif öğe: `color: #78716c`, hover'da `background: #f5f5f5`
- Her öğede: Circum Icon (sol) + metin (sağ), `gap: 10px`, `padding: 12px 16px`
- Alt kısımda: küçük "Powered by Tabbled" logosu

**Mobil (<768px):**
- Sidebar gizlenir
- Üstte hamburger menü butonu (☰) gösterilir
- Hamburger'e tıklanınca sidebar sol taraftan slide-in overlay olarak açılır
- Backdrop (koyu overlay) + sidebar
- Bir menü öğesi seçilince sidebar otomatik kapanır
- Veya alternatif: altta bottom navigation bar (5 ikon, metin yok)

**KARAR: Mobilde bottom navigation bar tercih edilsin** — daha kullanıcı dostu, her zaman görünür, thumb-friendly. 5 öğe bottom bar'a sığar.

### 3. Sidebar Menü Öğeleri

Sıra ve ikonlar:
1. **Menü** — `CiViewList` (veya `CiCircleList`)
2. **Çeviri Merkezi** — `CiGlobe`
3. **QR Kodları** — `CiMobile3` (veya `CiBarcode`)
4. **Promosyonlar** — `CiStar`
5. **Profil** — `CiUser`

İleride eklenecekler (şimdi eklenmeyecek, ama yapı hazır olmalı):
- Siparişler — `CiShoppingCart`
- Raporlar — `CiViewBoard`
- Ayarlar — `CiSettings`

### 4. Kod Değişiklikleri

**RestaurantDashboard.tsx:**

a) Yatay tab çubuğu kodunu (satır ~800-816 civarı, tüm `<button>` elementleri ve container `<div>`) kaldır.

b) Ana layout'u flexbox ile yeniden düzenle:

```tsx
// Desktop: sidebar + content yan yana
// Mobil: content tam genişlik + bottom nav

const sidebarItems = [
  { key: 'menu', label: 'Menü', icon: CiViewList },
  { key: 'translations', label: 'Çeviri Merkezi', icon: CiGlobe },
  { key: 'qr', label: 'QR Kodları', icon: CiMobile3 },
  { key: 'promos', label: 'Promosyonlar', icon: CiStar },
  { key: 'profile', label: 'Profil', icon: CiUser },
] as const;
```

c) Sidebar bileşeni (inline veya ayrı component):

```tsx
{/* Desktop Sidebar */}
<aside className="hidden md:flex flex-col w-[220px] min-h-[calc(100vh-64px)] border-r border-gray-200 bg-[#fafafa]">
  {/* Restoran bilgisi */}
  <div className="p-4 border-b border-gray-200">
    <div className="flex items-center gap-3">
      {restaurant?.logo_url && (
        <img src={restaurant.logo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
      )}
      <div>
        <p className="font-semibold text-sm text-gray-900 truncate max-w-[140px]">{restaurant?.name}</p>
        <p className="text-xs text-gray-500">Restoran Yönetimi</p>
      </div>
    </div>
  </div>
  
  {/* Menü öğeleri */}
  <nav className="flex-1 py-2">
    {sidebarItems.map((item) => (
      <button
        key={item.key}
        onClick={() => setActiveTab(item.key)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
          activeTab === item.key
            ? 'bg-gray-100 text-gray-900 font-semibold border-l-3 border-rose-600'
            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
        }`}
      >
        <item.icon size={20} />
        {item.label}
      </button>
    ))}
  </nav>
  
  {/* Alt logo */}
  <div className="p-4 border-t border-gray-200">
    <img src="/tabbled-logo.png" alt="Tabbled" className="h-6 opacity-50" />
  </div>
</aside>

{/* Mobil Bottom Navigation */}
<nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 flex justify-around py-2">
  {sidebarItems.map((item) => (
    <button
      key={item.key}
      onClick={() => setActiveTab(item.key)}
      className={`flex flex-col items-center gap-1 px-2 py-1 text-xs ${
        activeTab === item.key ? 'text-rose-600' : 'text-gray-400'
      }`}
    >
      <item.icon size={20} />
      <span className="truncate max-w-[60px]">{item.label}</span>
    </button>
  ))}
</nav>
```

d) Ana içerik alanı:

```tsx
<main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
  {/* Restoran başlığı - sadece mobilde göster (desktop'ta sidebar'da) */}
  <div className="md:hidden mb-4">
    <h1 className="text-2xl font-bold">{restaurant?.name}</h1>
    <p className="text-gray-500 text-sm">Restoran Yönetimi</p>
  </div>
  
  {/* Tab içerikleri - mevcut activeTab render kodu aynen kalır */}
  {activeTab === 'profile' && <ProfileTab ... />}
  {activeTab === 'qr' && <QRManager ... />}
  {activeTab === 'promos' && <PromosTab ... />}
  {activeTab === 'translations' && <TranslationCenter ... />}
  {activeTab === 'menu' && ( ... )}
</main>
```

e) Tüm yapıyı saran container:

```tsx
<div className="flex min-h-screen">
  {/* Desktop Sidebar */}
  <aside className="hidden md:flex ...">...</aside>
  
  {/* Content */}
  <main className="flex-1 ...">...</main>
  
  {/* Mobil Bottom Nav */}
  <nav className="md:hidden fixed ...">...</nav>
</div>
```

### 5. Restoran Başlık Alanı Güncelleme

Mevcut üstteki "ABC Restaurant / Restoran Yönetimi / EN, ZH / AI Açıklama" bloğu:
- Desktop: Sidebar'ın üst kısmına restoran adı + logo taşınır. Badge'ler (EN, ZH, AI Açıklama) content alanının üstüne kalır.
- Mobil: Başlık content'in üstünde kalır.

### 6. Tailwind Uyumluluğu

Mevcut projede Tailwind kullanılıyor. Tüm stiller Tailwind utility class'ları ile yazılacak. Inline style kullanılmayacak (mevcut inline style'lar da Tailwind'e dönüştürülecek).

NOT: Eğer `border-l-3` Tailwind'de yoksa, `border-l-[3px]` kullan.

---

## İKON IMPORTLARI

```typescript
// Mevcut importlara ekle (eğer yoksa)
import { CiViewList, CiGlobe, CiMobile3, CiStar, CiUser } from 'react-icons/ci';
```

NOT: Bu ikonlar zaten projede kullanılıyor olabilir, mevcut importları kontrol et. CiMobile3 yoksa CiMobile1 veya başka uygun Circum Icon kullan.

---

## ÖNEMLİ KURALLAR

1. **Circum Icons kullan** — Lucide KULLANMA (shadcn/ui internal hariç)
2. **Font:** Playfair Display başlıklar, Inter body
3. **Mevcut tab içerik kodlarına DOKUNMA** — sadece layout/container değişecek
4. **activeTab state ve tüm tab render mantığı aynen kalacak**
5. **Mobil bottom nav'da padding-bottom ekle** — içerik bottom nav'ın altında kalmasın
6. **Sidebar'daki aktif öğe vurgusu:** sol kenarda pembe/kırmızı çizgi (Tabbled brand rengi)
7. **Responsive breakpoint:** `md:` (768px) kullan

---

## TEST

1. Desktop (>768px): Sol sidebar görünür, tüm menü öğeleri tıklanabilir, aktif öğe vurgulu
2. Mobil (<768px): Bottom nav görünür, sidebar gizli, tüm tab'lar erişilebilir
3. Tüm tab içerikleri eskisi gibi çalışıyor (menü CRUD, çeviri merkezi, QR, promosyonlar, profil)
4. Sidebar'da restoran logosu ve adı görünüyor
5. npm run build başarılı
