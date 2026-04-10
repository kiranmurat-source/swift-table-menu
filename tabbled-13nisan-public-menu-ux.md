# TABBLED — Public Menü UX İyileştirmeleri
# Scroll-Aware Kategori Tab Bar + Grid/List Görünüm Toggle

---

## PROJE BAĞLAMI

- **Dizin:** /opt/khp/tabbled
- **Dosya:** src/pages/PublicMenu.tsx (ana public menü sayfası)
- **Stack:** React + Vite + TypeScript + shadcn/ui
- **İkon:** Circum Icons (react-icons/ci)
- **Font:** Playfair Display + Inter
- **Tema:** white/black/red (restoran seçimine göre)
- **Mevcut yapı:** Kategori tab bar üstte, altında ürün kartları listeleniyor. Tab'a tıklayınca o kategoriye scroll oluyor.

---

## GÖREV 1: SCROLL-AWARE KATEGORİ TAB BAR (Intersection Observer)

### Ne yapılacak:
Kullanıcı menüyü aşağı/yukarı scroll ettikçe, ekranda görünen ürünlerin ait olduğu kategori tab bar'da otomatik olarak aktif/seçili hale gelecek. FineDine ve diğer dijital menü platformlarının standart davranışı.

### Mevcut Davranış:
- Kategori tab'ına tıklayınca → o kategoriye scroll oluyor ✓
- Scroll edince → tab güncellenmıyor ✗ (bu eksik)

### İstenen Davranış:
- Kategori tab'ına tıklayınca → o kategoriye scroll oluyor ✓ (mevcut, koru)
- Scroll edince → viewport'ta en çok görünen kategorinin tab'ı aktif oluyor ✓ (yeni)
- Tab bar sticky kalıyor (zaten öyle olabilir, kontrol et) ✓
- Aktif tab otomatik olarak tab bar'da görünür konuma scroll oluyor (yatay scroll) ✓

### Teknik Uygulama:

#### 1. Her kategori section'ına ref/id ekle:
```tsx
// Her kategori bölümünün wrapper div'ine id ekle
<div id={`category-${category.id}`} ref={/* ... */}>
  <h2>{category.name}</h2>
  {/* ürün kartları */}
</div>
```

#### 2. Intersection Observer kurulumu:
```tsx
import { useEffect, useRef, useState, useCallback } from 'react';

// State
const [activeCategory, setActiveCategory] = useState<string | null>(null);
const isScrollingToCategory = useRef(false); // tab tıklama ile scroll'u ayırt etmek için

useEffect(() => {
  // Tüm kategori section'larını gözlemle
  const sections = document.querySelectorAll('[data-category-id]');
  
  if (sections.length === 0) return;
  
  const observer = new IntersectionObserver(
    (entries) => {
      // Tab tıklanarak scroll yapılıyorsa, observer'ı geçici olarak yoksay
      if (isScrollingToCategory.current) return;
      
      // En çok görünen section'ı bul
      let maxRatio = 0;
      let maxEntry: IntersectionObserverEntry | null = null;
      
      entries.forEach((entry) => {
        if (entry.intersectionRatio > maxRatio) {
          maxRatio = entry.intersectionRatio;
          maxEntry = entry;
        }
      });
      
      // Alternatif yaklaşım: viewport'un üst yarısındaki ilk section
      // Bu daha doğal hissettiriyor
      const viewportMiddle = window.innerHeight * 0.4; // üst %40
      
      for (const entry of entries) {
        const rect = entry.target.getBoundingClientRect();
        if (rect.top <= viewportMiddle && rect.bottom > 0) {
          const categoryId = entry.target.getAttribute('data-category-id');
          if (categoryId) {
            setActiveCategory(categoryId);
          }
        }
      }
    },
    {
      // rootMargin: üstteki sticky tab bar yüksekliğini hesaba kat
      rootMargin: '-80px 0px -60% 0px',
      threshold: [0, 0.1, 0.25, 0.5, 0.75, 1]
    }
  );
  
  sections.forEach((section) => observer.observe(section));
  
  return () => observer.disconnect();
}, [categories]); // kategori listesi değiştiğinde yeniden kur
```

#### 3. DAHA İYİ ALTERNATİF — Scroll Event ile (daha güvenilir):

Intersection Observer bazen edge case'lerde tutarsız olabiliyor. Daha güvenilir bir yaklaşım:

```tsx
useEffect(() => {
  const handleScroll = () => {
    if (isScrollingToCategory.current) return;
    
    const sections = document.querySelectorAll('[data-category-id]');
    const tabBarHeight = 120; // sticky tab bar + padding yüksekliği
    
    let currentCategory: string | null = null;
    
    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      // Section'ın üst kenarı tab bar'ın altında mı?
      if (rect.top <= tabBarHeight + 20 && rect.bottom > tabBarHeight) {
        currentCategory = section.getAttribute('data-category-id');
      }
    });
    
    if (currentCategory && currentCategory !== activeCategory) {
      setActiveCategory(currentCategory);
    }
  };
  
  // Throttle (performans için)
  let ticking = false;
  const throttledScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        handleScroll();
        ticking = false;
      });
      ticking = true;
    }
  };
  
  window.addEventListener('scroll', throttledScroll, { passive: true });
  return () => window.removeEventListener('scroll', throttledScroll);
}, [categories, activeCategory]);
```

#### 4. Tab tıklanınca scroll (mevcut mantığı koru + isScrolling flag):
```tsx
const handleTabClick = useCallback((categoryId: string) => {
  setActiveCategory(categoryId);
  isScrollingToCategory.current = true;
  
  const section = document.querySelector(`[data-category-id="${categoryId}"]`);
  if (section) {
    const tabBarHeight = 120; // sticky tab bar yüksekliği
    const top = section.getBoundingClientRect().top + window.scrollY - tabBarHeight;
    
    window.scrollTo({ top, behavior: 'smooth' });
    
    // Smooth scroll bitene kadar observer'ı durdur
    setTimeout(() => {
      isScrollingToCategory.current = false;
    }, 800); // smooth scroll yaklaşık 500-800ms sürer
  }
}, []);
```

#### 5. Aktif tab'ı tab bar'da görünür konuma scroll et:
```tsx
useEffect(() => {
  if (!activeCategory) return;
  
  const tabElement = document.querySelector(`[data-tab-id="${activeCategory}"]`);
  if (tabElement) {
    tabElement.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center' // yatay olarak ortala
    });
  }
}, [activeCategory]);
```

#### 6. Tab bar sticky olmalı:
```tsx
// Tab bar container
<div style={{
  position: 'sticky',
  top: 0, // veya header yüksekliği kadar
  zIndex: 40,
  backgroundColor: /* tema arka plan rengi */,
  borderBottom: '1px solid rgba(0,0,0,0.08)',
  // backdrop-filter ile blur efekti (opsiyonel ama güzel görünür)
  backdropFilter: 'blur(8px)',
}}>
  {/* tab butonları */}
</div>
```

### ÖNEMLİ NOTLAR:
- Alt kategoriler varsa (parent → child), parent kategori seçildiğinde alt kategoriler de görünür olmalı
- Tab bar zaten yatay scroll olabilir — aktif tab'ın scrollIntoView ile görünür olması lazım
- `isScrollingToCategory` ref kullanarak tab tıklama vs. manuel scroll'u ayırt et — yoksa tab tıklayınca hem scroll hem observer aynı anda çalışır ve sıçrama olur
- Performans: scroll event'i requestAnimationFrame ile throttle et
- 3 tema desteği: tab bar arka planı ve aktif tab rengi temaya uygun olmalı

---

## GÖREV 2: GRID/LIST GÖRÜNÜM TOGGLE

### Ne yapılacak:
Public menüde ürün kartlarını iki farklı görünümde gösterme seçeneği:
- **Grid (varsayılan):** Mevcut kart grid'i (2 sütun mobil, 3 sütun tablet, 4 sütun desktop)
- **List:** Tek sütun, yatay kart (fotoğraf solda küçük, bilgiler sağda)

### Teknik Uygulama:

#### 1. Toggle butonu:
Tab bar'ın sağ köşesine veya filtreleme alanına iki ikon butonu ekle:

```tsx
import { CiGrid41, CiViewList } from 'react-icons/ci';

// State
const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

// Toggle butonları
<div style={{ display: 'flex', gap: '4px' }}>
  <button
    onClick={() => setViewMode('grid')}
    style={{
      padding: '6px',
      borderRadius: '6px',
      border: 'none',
      backgroundColor: viewMode === 'grid' ? '#FF4F7A' : 'transparent',
      color: viewMode === 'grid' ? '#fff' : '#999',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
    }}
    aria-label="Grid görünüm"
  >
    <CiGrid41 size={18} />
  </button>
  <button
    onClick={() => setViewMode('list')}
    style={{
      padding: '6px',
      borderRadius: '6px',
      border: 'none',
      backgroundColor: viewMode === 'list' ? '#FF4F7A' : 'transparent',
      color: viewMode === 'list' ? '#fff' : '#999',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
    }}
    aria-label="Liste görünüm"
  >
    <CiViewList size={18} />
  </button>
</div>
```

#### 2. Toggle butonunun konumu:
Tab bar satırının sağ köşesine yerleştir. Tab butonları sola, toggle sağa:

```tsx
<div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  position: 'sticky',
  top: 0,
  /* ... */
}}>
  {/* Sol: Kategori tab'ları (yatay scroll) */}
  <div style={{ flex: 1, overflow: 'auto', display: 'flex', gap: '8px' }}>
    {categories.map(cat => /* tab butonları */)}
  </div>
  
  {/* Sağ: Grid/List toggle */}
  <div style={{ flexShrink: 0, marginLeft: '8px', display: 'flex', gap: '4px' }}>
    {/* grid ve list butonları */}
  </div>
</div>
```

#### 3. Grid görünümü (mevcut):
Mevcut kart grid'i aynen kalır. Sadece viewMode === 'grid' olduğunda göster.

#### 4. List görünümü:
```tsx
{viewMode === 'list' ? (
  // LIST GÖRÜNÜM
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    {items.map(item => (
      <div
        key={item.id}
        onClick={() => openDetail(item)}
        style={{
          display: 'flex',
          gap: '12px',
          padding: '10px',
          borderRadius: '10px',
          backgroundColor: /* tema kart rengi */,
          cursor: 'pointer',
          border: '1px solid rgba(0,0,0,0.06)',
          // tükendi ise opacity düşür
          opacity: item.is_sold_out ? 0.5 : 1,
        }}
      >
        {/* Sol: Küçük kare fotoğraf */}
        {item.image_url && (
          <img
            src={getImageUrl(item.image_url, 'thumbnail')} // 100x100 preset
            alt={item.name_tr}
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '8px',
              objectFit: 'cover',
              flexShrink: 0,
            }}
            loading="lazy"
            onError={handleImageError}
          />
        )}
        
        {/* Sağ: Bilgiler */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Üst: İsim + Fiyat */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
            <div style={{
              fontWeight: 600,
              fontSize: '14px',
              color: /* tema text rengi */,
              // Tek satır, taşarsa ... ile kes
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {item.name_tr || item.name_en}
              {item.is_sold_out && (
                <span style={{
                  marginLeft: '6px',
                  fontSize: '10px',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                }}>
                  Tükendi
                </span>
              )}
            </div>
            <div style={{
              fontWeight: 700,
              fontSize: '14px',
              color: '#FF4F7A',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}>
              {formatPrice(item)}
            </div>
          </div>
          
          {/* Alt: Açıklama (1-2 satır) */}
          {item.description_tr && (
            <div style={{
              fontSize: '12px',
              color: /* tema muted rengi */,
              marginTop: '4px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical' as const,
            }}>
              {stripHtml(item.description_tr)}
            </div>
          )}
          
          {/* Badge'ler: kalori, prep_time, allerjenler */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
            {item.calories && (
              <span style={{ fontSize: '10px', color: '#999' }}>
                {item.calories} kcal
              </span>
            )}
            {item.prep_time && (
              <span style={{ fontSize: '10px', color: '#999' }}>
                ⏱ {item.prep_time} dk
              </span>
            )}
          </div>
        </div>
      </div>
    ))}
  </div>
) : (
  // GRID GÖRÜNÜM (mevcut kart grid)
  <div style={{ /* mevcut grid stili */ }}>
    {/* mevcut kart map'i */}
  </div>
)}
```

#### 5. Featured ürünler list görünümünde:
Featured ürünler grid'de 2x büyük kart. List görünümünde farklılaştırmak için:
- Sol kenara ince pembe border ekle
- Veya küçük "Öne Çıkan" badge

#### 6. localStorage ile tercih kaydet:
```tsx
// Sayfa yüklenirken
const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
  // localStorage kullanma — React state ile session bazlı tut
  return 'grid';
});
```
**NOT:** localStorage kullanma — sadece session içi state yeterli. Her ziyarette grid varsayılan.

### ÖNEMLİ NOTLAR:
- List görünümünde fotoğraf yoksa sadece bilgi alanı göster (fotoğrafsız kart daha kompakt)
- List görünümünde detay modal'a tıklama hâlâ çalışmalı
- 3 tema desteği: kart arka planı, text renkleri, border'lar temaya uyumlu
- Çok dilli: list görünümünde de name_tr/name_en seçimine göre göster
- Tükendi ürünler list'te de opacity düşük + "Tükendi" badge
- Varyant fiyat: list'te de "XX ₺'den başlayan" gösterimi
- Mobilde toggle butonları yeterince büyük olmalı (min 36px touch target)

---

## YÜRÜTME SIRASI

1. **GÖREV 1** — Scroll-aware kategori tab bar
   - Her kategori section'ına `data-category-id` ekle
   - Scroll event listener (throttled) ile aktif kategoriyi takip et
   - Tab bar'da aktif kategoriyi vurgula
   - Aktif tab'ı yatay scroll ile görünür yap
   - `isScrollingToCategory` flag ile tab tıklama/scroll çakışmasını önle
   
2. **GÖREV 2** — Grid/List toggle
   - Tab bar'a toggle butonları ekle
   - List görünümü kart component'ı yaz
   - viewMode state'ine göre koşullu render

Her görev sonrası `npm run build` çalıştır.

---

## KONTROL LİSTESİ

### Görev 1 - Scroll-Aware Tab Bar
- [ ] Kategori section'larına data-category-id eklendi
- [ ] Scroll listener aktif kategoriyi güncelliyor
- [ ] Tab bar'da aktif kategori vurgulu
- [ ] Aktif tab yatay scroll ile görünür
- [ ] Tab tıklama smooth scroll çalışıyor (mevcut)
- [ ] Tab tıklama ve scroll çakışmıyor (isScrolling flag)
- [ ] Alt kategorilerde doğru parent seçiliyor
- [ ] 3 tema uyumlu

### Görev 2 - Grid/List Toggle
- [ ] Toggle butonları tab bar'ın sağında
- [ ] Grid görünüm (varsayılan) çalışıyor
- [ ] List görünüm kartları çalışıyor
- [ ] List'te fotoğraf, isim, fiyat, açıklama görünüyor
- [ ] List'te tükendi gösterimi
- [ ] List'te varyant fiyat gösterimi
- [ ] List'te tıklama → detay modal açılıyor
- [ ] Featured ürünler list'te farklılaştırılmış
- [ ] 3 tema uyumlu
- [ ] Mobil responsive

### Final
- [ ] npm run build başarılı
- [ ] git push origin main
