# TABBLED — Toplu Güncelleme Prompt'u (8 Nisan 2026)

## PROJE BAĞLAMI
- GitHub: kiranmurat-source/swift-table-menu
- Stack: React + Vite + TypeScript + shadcn/ui
- Supabase: qmnrawqvkwehufebbkxp
- Font: Playfair Display (başlıklar) + Inter (body)
- İkon: Circum Icons (react-icons/ci) — shadcn/ui internal Lucide dokunma
- Tema: 3 tema (white/black/red) → src/lib/themes.ts
- Logo dosyaları: public/tabbled-logo-main.png (grid ikonlu) + public/tabbled-logo.png (pembe text, şeffaf)
- Deploy: Vercel (git push → otomatik)

## YAPILACAK İŞLER (7 GÖREV)

---

### GÖREV 1: LOGO SİSTEMİ GÜNCELLEMESİ

**Dosya: src/components/TabbledLogo.tsx**

TabbledLogo bileşenini güncelle. Artık iki farklı logo var:
- `tabbled-logo-main.png` → Grid ikonlu ana logo (sadece landing page navbar'da)
- `tabbled-logo.png` → Pembe text logo, artık ŞEFFAF arka planlı (siyah kutu sarmalama KALDIRILACAK)

TabbledLogo'yu şu şekilde güncelle:

```tsx
interface TabbledLogoProps {
  sizeClass?: string;
  /** 'main' = grid ikonlu logo (navbar), 'text' = pembe text logo (default) */
  logoType?: 'main' | 'text';
  href?: string | null;
  className?: string;
}

const TabbledLogo = ({
  sizeClass = 'h-8',
  logoType = 'text',
  href = '/',
  className = '',
}: TabbledLogoProps) => {
  const logoSrc = logoType === 'main' ? '/tabbled-logo-main.png' : '/tabbled-logo.png';

  const img = (
    <img
      src={logoSrc}
      alt="Tabbled"
      className={`${sizeClass} w-auto block`}
    />
  );

  if (href === null) {
    return <span className={`inline-flex ${className}`}>{img}</span>;
  }
  return (
    <a
      href={href}
      className={`inline-flex items-center ${className}`}
      aria-label="Tabbled"
    >
      {img}
    </a>
  );
};

export default TabbledLogo;
```

ÖNEMLİ: Eski `variant` prop'u ve siyah kutu (`background: '#111'`) sarmalama tamamen kaldırılacak. Logo artık şeffaf PNG olduğu için doğrudan gösterilecek.

**Dosya: src/components/Navbar.tsx**

`<TabbledLogo />` çağrısını `<TabbledLogo logoType="main" sizeClass="h-10" />` olarak güncelle. Bu, grid ikonlu logoyu navbar'da gösterecek.

**Dosya: src/components/Footer.tsx**

`<TabbledLogo sizeClass="h-7" />` → Bu zaten doğru (text logo). Ama artık `variant` prop yok, sadece `sizeClass` kalacak. Footer'da değişiklik gerekmez çünkü default `logoType='text'`.

**Dosya: src/pages/Login.tsx**

`<TabbledLogo sizeClass="h-14" />` → Bu da doğru, text logo kullanılacak. variant prop yoksa sorun yok.

**Dosya: src/pages/PublicMenu.tsx**

PublicMenu'deki tüm "Powered by Tabbled" alanlarında eski siyah kutu sarmalamayı kaldır. Şu pattern'leri bul ve düzelt:

```tsx
// ESKİ (kaldır):
<span className="inline-flex items-center" style={{ background: '#111', padding: '4px 12px', borderRadius: 6 }}>
  <img src="/tabbled-logo.png" alt="Tabbled" className="h-5 w-auto block" />
</span>

// YENİ:
<img src="/tabbled-logo.png" alt="Tabbled" className="h-5 w-auto block" />
```

Bu pattern PublicMenu.tsx'te 3 yerde var:
1. Not found sayfasında (yaklaşık satır 170)
2. Splash ekranında "Powered by" (yaklaşık satır 280)
3. Menü footer'ında "Powered by" (yaklaşık satır 395)

Her üçünde de siyah kutu span'ını kaldır, sadece img tag'ini bırak.

---

### GÖREV 2: LOADING EKRANI (TABBLED BRANDED)

**Dosya: src/pages/PublicMenu.tsx**

Mevcut loading state'ini güncelle. QR taranınca ilk görünen ekran Tabbled logolu branded bir loading olacak:

Mevcut loading bloğunu (yaklaşık satır 155-165) şu şekilde değiştir:

```tsx
/* ---- Loading ---- */
if (loading) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6"
      style={{ backgroundColor: '#FAFAF7', fontFamily: bodyFont }}
    >
      {/* Tabbled Logo */}
      <img
        src="/tabbled-logo-main.png"
        alt="Tabbled"
        className="h-16 w-auto animate-pulse"
      />
      {/* Subtle loading indicator */}
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[#E8837C] animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-1.5 h-1.5 rounded-full bg-[#E8837C] animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-1.5 h-1.5 rounded-full bg-[#E8837C] animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      {/* Tagline */}
      <p className="text-xs text-stone-400 tracking-widest uppercase">
        Otel ve restoranlar için
      </p>
    </div>
  );
}
```

Bu loading ekranı:
- Her zaman açık arka plan (#FAFAF7) kullanır (tema bağımsız, Tabbled branding)
- Grid ikonlu ana logoyu gösterir (pulse animasyonlu)
- 3 nokta bounce animasyonu (pembe renk, Tabbled brand rengi)
- "Otel ve restoranlar için" tagline'ı

---

### GÖREV 3: ÜRÜN ÖNE ÇIKARMA (is_featured)

**Adım 3a — Supabase SQL (kullanıcı çalıştıracak, prompt'a not olarak ekle):**

```sql
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
```

**Adım 3b — Dosya: src/pages/RestaurantDashboard.tsx**

MenuItem type'ına `is_featured: boolean;` ekle.

emptyItemForm'a `is_featured: false` ekle.

Ürün formunda (addOrUpdateItem fonksiyonu içindeki checkboxlar bölümüne) yeni checkbox ekle:

```tsx
<label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: '#44403c' }}>
  <input type="checkbox" checked={itemForm.is_featured} onChange={e => setItemForm({ ...itemForm, is_featured: e.target.checked })} />
  <CiStar size={14} style={{ color: '#f59e0b' }} /> Öne Çıkar
</label>
```

itemForm state'ine `is_featured` ekle. payload'a `is_featured: itemForm.is_featured` ekle.

startEdit fonksiyonunda `is_featured: item.is_featured || false` ekle.

Ürün listesinde badge olarak göster (is_featured true ise):
```tsx
{item.is_featured && <span style={{ ...S.badge, background: '#fef3c7', color: '#b45309' }}>⭐ Öne Çıkan</span>}
```

**Adım 3c — Dosya: src/pages/PublicMenu.tsx**

MenuItem interface'ine `is_featured: boolean;` ekle.

MenuItemCard bileşeninde, is_featured true olan ürünler için kartı büyük göster. Bileşenin başına ekle:

```tsx
const isFeatured = item.is_featured;
```

Kart div'ini güncelle:
- Normal kart: mevcut düzen (yatay, 88x88 resim)
- Featured kart: dikey düzen (tam genişlik resim üstte, altında bilgiler)

```tsx
if (isFeatured) {
  return (
    <div
      className="rounded-2xl overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.99]"
      style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
      onClick={() => onSelect(item)}
    >
      {item.image_url ? (
        <img src={item.image_url} alt={name} className="w-full h-48 object-cover" />
      ) : (
        <div className="w-full h-32 flex items-center justify-center" style={{ backgroundColor: theme.badgeBg }}>
          <CiForkAndKnife size={40} style={{ color: theme.mutedText }} />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-lg leading-snug" style={{ fontFamily: headingFont, fontWeight: 700, color: theme.text }}>
            {name || <span className="italic" style={{ color: theme.mutedText }}>—</span>}
          </h3>
          <span className="text-lg flex-shrink-0 tabular-nums" style={{ color: theme.price, fontWeight: 500 }}>
            {Number(item.price).toFixed(2)} ₺
          </span>
        </div>
        {description && (
          <p className="text-[13px] mt-1 leading-relaxed" style={{ color: theme.mutedText, fontWeight: 300 }}>
            {description}
          </p>
        )}
        {hasBadges && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {item.is_popular && (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: theme.badgeBg, color: theme.badgeText, fontWeight: 600 }}>
                <CiStar size={11} /> {UI.popular[lang]}
              </span>
            )}
            {item.is_new && (
              <span className="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: theme.badgeBg, color: theme.badgeText, fontWeight: 600 }}>
                {UI.newItem[lang]}
              </span>
            )}
            {item.is_vegetarian && (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: theme.badgeBg, color: theme.badgeText, fontWeight: 600 }}>
                <CiApple size={11} /> {UI.vegetarian[lang]}
              </span>
            )}
          </div>
        )}
        {(item.calories || hasAllergens) && (
          <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: `1px solid ${theme.divider}` }}>
            {item.calories ? (
              <span className="text-[11px]" style={{ color: theme.mutedText, fontWeight: 300 }}>{item.calories} kcal</span>
            ) : <span />}
            {hasAllergens && (
              <AllergenBadgeList allergens={item.allergens} size={16} lang={lang === 'ar' || lang === 'zh' ? 'en' : lang} invert={theme.invertIcons} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

Bu kodu mevcut `return` ifadesinin ÜSTÜne (başına) ekle. Böylece is_featured olan ürünler büyük kart olarak render edilir, diğerleri mevcut compact kart olarak kalır.

---

### GÖREV 4: EKSİK FOTOĞRAF UYARISI

**Dosya: src/pages/RestaurantDashboard.tsx**

Kategori butonları bölümünde (yaklaşık satır "Tümü ({items.length})" butonunun olduğu yer), her kategori butonunun yanına eksik fotoğraf sayısını göster.

Kategoriler bölümünün hemen üstüne helper hesaplama ekle:

```tsx
// Eksik fotoğraf hesaplama
const missingPhotoCounts = new Map<string, number>();
for (const item of items) {
  if (!item.image_url) {
    missingPhotoCounts.set(item.category_id, (missingPhotoCounts.get(item.category_id) || 0) + 1);
  }
}
const totalMissingPhotos = items.filter(i => !i.image_url).length;
```

"Tümü" butonunun yanına toplam eksik fotoğraf uyarısı ekle:

```tsx
<button onClick={() => setSelectedCat(null)} style={{ ...S.btnSm, background: !selectedCat ? '#1c1917' : '#fff', color: !selectedCat ? '#fff' : '#44403c' }}>
  Tümü ({items.length})
  {totalMissingPhotos > 0 && (
    <span style={{ marginLeft: 6, fontSize: 10, color: '#f59e0b', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      <CiCamera size={11} /> {totalMissingPhotos} fotoğraf eksik
    </span>
  )}
</button>
```

Her kategori butonunda da:
```tsx
{(missingPhotoCounts.get(c.id) || 0) > 0 && (
  <span style={{ fontSize: 9, color: '#f59e0b', marginLeft: 2 }}>
    📷{missingPhotoCounts.get(c.id)}
  </span>
)}
```

Bu span'ı kategori butonunun içine, count'tan sonra ekle.

---

### GÖREV 5: ÜRÜN ARAMA (ADMİN PANEL)

**Dosya: src/pages/RestaurantDashboard.tsx**

Menü tab'ında, "Ürünler" başlığının altına bir search input ekle.

Yeni state ekle (component'ın başına):
```tsx
const [searchQuery, setSearchQuery] = useState('');
```

"Ürünler" başlığı ile ürün listesi arasına search input ekle:

```tsx
{/* Search */}
<div style={{ marginBottom: 12 }}>
  <input
    style={{ ...S.input, paddingLeft: 36, position: 'relative' }}
    value={searchQuery}
    onChange={e => setSearchQuery(e.target.value)}
    placeholder="Ürün ara..."
  />
</div>
```

filteredItems hesaplamasını güncelle:

```tsx
const filteredItems = (() => {
  let list = selectedCat ? items.filter(i => i.category_id === selectedCat) : items;
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    list = list.filter(i =>
      i.name_tr.toLowerCase().includes(q) ||
      (i.description_tr && i.description_tr.toLowerCase().includes(q))
    );
  }
  return list;
})();
```

Mevcut `const filteredItems = selectedCat ? items.filter(...)...` satırını bu IIFE ile değiştir.

---

### GÖREV 6: ÇALIŞMA SAATLERİ

**Adım 6a — Supabase SQL (kullanıcı çalıştıracak):**

```sql
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS working_hours jsonb DEFAULT null;
```

working_hours formatı:
```json
{
  "mon": { "open": "09:00", "close": "22:00", "closed": false },
  "tue": { "open": "09:00", "close": "22:00", "closed": false },
  "wed": { "open": "09:00", "close": "22:00", "closed": false },
  "thu": { "open": "09:00", "close": "22:00", "closed": false },
  "fri": { "open": "09:00", "close": "23:00", "closed": false },
  "sat": { "open": "10:00", "close": "23:00", "closed": false },
  "sun": { "open": "10:00", "close": "22:00", "closed": false }
}
```

**Adım 6b — Dosya: src/pages/RestaurantDashboard.tsx**

Restaurant type'ına `working_hours: Record<string, { open: string; close: string; closed: boolean }> | null;` ekle.

ProfileTab bileşeninde, sosyal medya bölümünden sonra "Çalışma Saatleri" bölümü ekle:

```tsx
<h4 style={{ fontSize: 14, fontWeight: 600, color: '#1c1917', marginTop: 8, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
  <CiGlobe size={16} /> Çalışma Saatleri
</h4>
```

Günler için bir form alanı oluştur (Pazartesi-Pazar). Her gün için:
- Açılış saati (time input)
- Kapanış saati (time input)
- "Kapalı" checkbox'ı

State olarak `workingHours` ekle, restaurant.working_hours'dan initialize et. Save'de working_hours'ı da kaydet.

DAY_KEYS tanımı:
```tsx
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const DAY_LABELS: Record<string, string> = {
  mon: 'Pazartesi', tue: 'Salı', wed: 'Çarşamba', thu: 'Perşembe',
  fri: 'Cuma', sat: 'Cumartesi', sun: 'Pazar',
};
```

Varsayılan değer tüm günler için: open: '09:00', close: '22:00', closed: false

**Adım 6c — Dosya: src/pages/PublicMenu.tsx**

Restaurant interface'ine `working_hours: Record<string, { open: string; close: string; closed: boolean }> | null;` ekle.

Menü header'ında (adres ve telefon bilgilerinin altında), çalışma saatlerini göster:

Bugünün günü için açık/kapalı durumu ve saat aralığını küçük bir satır olarak ekle:

```tsx
{restaurant.working_hours && (() => {
  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const today = dayKeys[new Date().getDay()];
  const todayHours = restaurant.working_hours[today];
  if (!todayHours) return null;
  return (
    <p className="text-xs flex items-center gap-1.5" style={{ color: todayHours.closed ? '#dc2626' : theme.mutedText }}>
      <span className={`w-1.5 h-1.5 rounded-full ${todayHours.closed ? 'bg-red-500' : 'bg-green-500'}`} />
      {todayHours.closed ? (lang === 'tr' ? 'Bugün kapalı' : 'Closed today') : `${todayHours.open} - ${todayHours.close}`}
    </p>
  );
})()}
```

Bu kodu adres ve telefon bilgilerinin altına ekle (header bölümünde, gap-0.5 olan div içine).

---

### GÖREV 7: SOSYAL HESAP GENİŞLETME

**Adım 7a — Supabase SQL (kullanıcı çalıştıracak):**

```sql
ALTER TABLE restaurants 
  ADD COLUMN IF NOT EXISTS social_whatsapp text DEFAULT null,
  ADD COLUMN IF NOT EXISTS social_google_maps text DEFAULT null;
```

**Adım 7b — Dosya: src/pages/RestaurantDashboard.tsx**

Restaurant type'ına `social_whatsapp: string | null; social_google_maps: string | null;` ekle.

ProfileTab form state'ine ekle:
```tsx
social_whatsapp: restaurant.social_whatsapp || '',
social_google_maps: restaurant.social_google_maps || '',
```

handleSave payload'ına ekle:
```tsx
social_whatsapp: form.social_whatsapp || null,
social_google_maps: form.social_google_maps || null,
```

onUpdate çağrısına ekle:
```tsx
social_whatsapp: form.social_whatsapp || null,
social_google_maps: form.social_google_maps || null,
```

Sosyal medya form alanlarına 2 yeni alan ekle (web sitesi'nden sonra):

```tsx
<div style={S.grid2}>
  <div>
    <label style={S.label}>WhatsApp</label>
    <input style={S.input} value={form.social_whatsapp} onChange={e => setForm({ ...form, social_whatsapp: e.target.value })} placeholder="https://wa.me/905xxxxxxxxx" />
  </div>
  <div>
    <label style={S.label}>Google Maps</label>
    <input style={S.input} value={form.social_google_maps} onChange={e => setForm({ ...form, social_google_maps: e.target.value })} placeholder="https://maps.google.com/..." />
  </div>
</div>
```

**Adım 7c — Dosya: src/pages/PublicMenu.tsx**

Restaurant interface'ine ekle:
```tsx
social_whatsapp: string | null;
social_google_maps: string | null;
```

socials dizisine ekle (mevcut website'den sonra):
```tsx
{ type: 'whatsapp', url: restaurant.social_whatsapp },
{ type: 'google_maps', url: restaurant.social_google_maps },
```

SocialIcon bileşenine 2 yeni case ekle:

```tsx
case 'whatsapp': return (
  <svg viewBox="0 0 24 24" {...s}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
);
case 'google_maps': return (
  <svg viewBox="0 0 24 24" {...s}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
);
```

---

## SUPABASE SQL — KULLANICI ÇALIŞTIRACAK (tüm SQL'ler birlikte)

Aşağıdaki SQL'i Supabase SQL Editor'dan çalıştırması gerekiyor:

```sql
-- Ürün öne çıkarma
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

-- Çalışma saatleri
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS working_hours jsonb DEFAULT null;

-- Sosyal hesap genişletme
ALTER TABLE restaurants 
  ADD COLUMN IF NOT EXISTS social_whatsapp text DEFAULT null,
  ADD COLUMN IF NOT EXISTS social_google_maps text DEFAULT null;
```

---

## SIRALAMA VE TEST

Değişiklik sırası:
1. Önce SQL'leri çalıştır (kullanıcıya söyle)
2. TabbledLogo.tsx güncelle
3. Navbar.tsx güncelle  
4. PublicMenu.tsx güncelle (logo, loading, featured kart, çalışma saatleri, sosyal ikonlar)
5. RestaurantDashboard.tsx güncelle (featured, eksik fotoğraf, arama, çalışma saatleri, sosyal alanlar)

Build test: `npm run build` — hata olmamalı.

## ÖNEMLİ KURALLAR
- shadcn/ui internal Lucide ikonlarına DOKUNMA
- Circum Icons (react-icons/ci) kullan
- Font: Playfair Display başlıklar, Inter body
- Tema sistemi bozulmamalı (3 tema: white/black/red)
- Türkçe karakter dikkat (bash heredoc sorunlu olabilir → python3 -c kullan)
