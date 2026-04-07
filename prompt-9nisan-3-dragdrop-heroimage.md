# CLAUDE CODE PROMPT — 9 Nisan 2026, Görev 3
# Drag & Drop Sıralama (Kategoriler + Ürünler) + Hero Image Optimizasyonu

## PROJE BAĞLAMI
- Repo: /opt/khp/tabbled/ (git repo root)
- Stack: React + Vite + TypeScript + shadcn/ui
- DB: Supabase PostgreSQL (qmnrawqvkwehufebbkxp.supabase.co)
- Restoran paneli: `src/pages/RestaurantDashboard.tsx`
- DB tabloları:
  - `menu_categories` → `sort_order` kolonu mevcut (integer)
  - `menu_items` → `sort_order` kolonu mevcut (integer)
- RLS aktif: restoran kullanıcısı sadece kendi restoranının verilerini düzenleyebilir
- Deploy: git push origin main → Vercel otomatik deploy

---

## GÖREV 1: DRAG & DROP SIRALAMA

### Gerekli Paket
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**NOT:** `react-beautiful-dnd` KULLANMA — maintenance mode'da ve React 18 strict mode ile sorunlu. `@dnd-kit` modern, aktif, lightweight alternatif.

### 1a. Kategori Sıralaması

#### Mevcut Durum
- Kategoriler `RestaurantDashboard.tsx` içinde listeleniyor (muhtemelen buton/tab/pill şeklinde)
- `menu_categories` tablosunda `sort_order` kolonu var
- Kategoriler `sort_order`'a göre sıralanıyor olmalı

#### Yapılacaklar
- Kategori listesini (pill/buton satırı) drag & drop ile sıralanabilir yap
- Her kategori pill'inin soluna küçük bir drag handle ikonu ekle (CiGrid42 veya 6 nokta grip ikonu — `react-icons/ci`'dan uygun olanı seç)
- Sıralama değiştiğinde `sort_order` değerlerini güncelle
- DB güncelleme: tek tek değil, toplu güncelle

#### Implementasyon
```tsx
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable kategori pill bileşeni
function SortableCategoryPill({ category, isActive, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  };
  
  return (
    <div ref={setNodeRef} style={style} {...attributes} className="flex items-center gap-1">
      {/* Drag handle */}
      <span {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600">
        <CiGrid42 size={14} />
      </span>
      {/* Mevcut pill/buton — onClick korunmalı */}
      <button onClick={onClick} className={/* mevcut className */}>
        {category.name_tr}
      </button>
    </div>
  );
}
```

#### DB Güncelleme Fonksiyonu
```tsx
const updateCategoryOrder = async (reorderedCategories) => {
  // Toplu güncelleme — her kategorinin sort_order'ını index'e göre ayarla
  const updates = reorderedCategories.map((cat, index) => 
    supabase
      .from('menu_categories')
      .update({ sort_order: index })
      .eq('id', cat.id)
  );
  
  await Promise.all(updates);
  // State'i güncelle (optimistic UI — DB hatası olursa geri al)
};
```

#### DndContext handleDragEnd
```tsx
function handleCategoryDragEnd(event) {
  const { active, over } = event;
  if (!over || active.id === over.id) return;
  
  setCategories((items) => {
    const oldIndex = items.findIndex(i => i.id === active.id);
    const newIndex = items.findIndex(i => i.id === over.id);
    const newOrder = arrayMove(items, oldIndex, newIndex);
    
    // DB'ye kaydet (async, optimistic)
    updateCategoryOrder(newOrder);
    
    return newOrder;
  });
}
```

### 1b. Ürün Sıralaması (Kategori İçinde)

#### Mevcut Durum
- Ürünler seçili kategoriye göre listeleniyor
- Her ürün bir kart/satır olarak gösteriliyor
- `menu_items` tablosunda `sort_order` kolonu var

#### Yapılacaklar
- Ürün listesini (kartlar/satırlar) drag & drop ile sıralanabilir yap
- Her ürün kartının sol kenarına drag handle ekle
- `verticalListSortingStrategy` kullan (ürünler dikey liste)
- Sıralama değiştiğinde `sort_order` güncelle

#### Implementasyon
```tsx
// Sortable ürün kartı bileşeni
function SortableMenuItem({ item, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto',
  };
  
  return (
    <div ref={setNodeRef} style={style} {...attributes} className="flex items-center gap-2">
      {/* Drag handle — SOL KENARDA */}
      <span {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600 flex-shrink-0 px-1">
        <CiGrid42 size={18} />
      </span>
      {/* Mevcut ürün kartı içeriği — AYNEN KORU */}
      <div className="flex-1">
        {/* ... mevcut kart layout'u ... */}
      </div>
    </div>
  );
}
```

#### DB Güncelleme
```tsx
const updateItemOrder = async (reorderedItems) => {
  const updates = reorderedItems.map((item, index) => 
    supabase
      .from('menu_items')
      .update({ sort_order: index })
      .eq('id', item.id)
  );
  
  await Promise.all(updates);
};
```

### 1c. UX Detayları
- Drag sırasında sürüklenen öğe hafif şeffaf (opacity: 0.5) ve hafif büyük (scale 1.02)
- Bırakma noktası belirgin olmalı (öğeler kayarak yer açmalı — @dnd-kit bunu otomatik yapar)
- Mobilde de çalışmalı (touch sensör @dnd-kit'te default)
- Drag handle olmadan kartın kendisine tıklamak mevcut işlevleri tetiklemeli (düzenleme vs.)
- Sıralama kaydedilirken kısa bir toast/bildirim gösterilebilir (opsiyonel)

### 1d. Public Menüde Sıralama Yansıması
- `PublicMenu.tsx`'te kategoriler ve ürünler zaten `sort_order`'a göre sıralanıyor olmalı
- Kontrol et: `ORDER BY sort_order ASC` query'lerde var mı?
- Yoksa ekle — hem kategoriler hem ürünler için

---

## GÖREV 2: HERO IMAGE OPTİMİZASYONU

### Sorun
`public/hero-restaurant.png` dosyası 2.9MB — çok büyük, landing page'i yavaşlatıyor.

### Yapılacaklar
```bash
# Mevcut boyutu kontrol et
ls -lh public/hero-restaurant.png

# Python ile optimize et (Pillow kullanarak)
pip install Pillow 2>/dev/null

python3 << 'EOF'
from PIL import Image
import os

img = Image.open('public/hero-restaurant.png')
print(f"Orijinal boyut: {os.path.getsize('public/hero-restaurant.png') / 1024 / 1024:.1f} MB")
print(f"Orijinal çözünürlük: {img.size}")

# WebP olarak kaydet (çok daha küçük, modern tarayıcılarda destekleniyor)
# Kalite 85 genellikle görsel fark yaratmadan %70-80 küçültür
img.save('public/hero-restaurant.webp', 'WebP', quality=85, method=6)
print(f"WebP boyut: {os.path.getsize('public/hero-restaurant.webp') / 1024 / 1024:.1f} MB")

# Ayrıca PNG'yi de optimize et (fallback için)
# Genişliği max 1920px'e düşür (retina yeterli)
if img.width > 1920:
    ratio = 1920 / img.width
    new_size = (1920, int(img.height * ratio))
    img = img.resize(new_size, Image.LANCZOS)

img.save('public/hero-restaurant-optimized.png', 'PNG', optimize=True)
print(f"Optimized PNG boyut: {os.path.getsize('public/hero-restaurant-optimized.png') / 1024 / 1024:.1f} MB")
EOF
```

### Kodu Güncelle
- Hero görseli kullanılan bileşeni bul (muhtemelen `src/components/HeroSection.tsx`)
- `<picture>` tag'i ile WebP + PNG fallback kullan:

```tsx
<picture>
  <source srcSet="/hero-restaurant.webp" type="image/webp" />
  <img src="/hero-restaurant-optimized.png" alt="..." className="..." loading="eager" />
</picture>
```

- Orijinal `hero-restaurant.png` dosyasını sil (veya yedekle):
```bash
# Orijinal büyük dosyayı sil
rm public/hero-restaurant.png
# Optimize edilmiş PNG'yi yerine koy
mv public/hero-restaurant-optimized.png public/hero-restaurant.png
```

**Alternatif (daha basit):** Sadece PNG'yi optimize edip aynı isimle kaydet, WebP desteğini sonraya bırak:
```bash
python3 -c "
from PIL import Image
img = Image.open('public/hero-restaurant.png')
if img.width > 1920:
    ratio = 1920 / img.width
    img = img.resize((1920, int(img.height * ratio)), Image.LANCZOS)
img.save('public/hero-restaurant.png', 'PNG', optimize=True)
"
```

---

## DOKUNMA KURALLARI

1. **PublicMenu.tsx'e dokunma** — sadece sort_order query kontrolü yap
2. **Mevcut ürün kartı layout'unu değiştirme** — sadece drag handle ekle
3. **shadcn/ui bileşenlerini değiştirme**
4. **Kategori ve ürün CRUD fonksiyonlarını değiştirme** — sadece sıralama ekle
5. İkon olarak `react-icons/ci` (Circum Icons) kullan, Lucide ekleme

---

## TEST ADIMLARI

1. `npm run build` — hata olmadığını doğrula
2. Tarayıcıda `/dashboard` → restoran paneli:
   - Kategori pill'lerini sürükle-bırak ile sırala → sıra değişiyor mu?
   - Sayfa yenilenince sıra korunuyor mu? (DB'ye kaydedildi mi?)
   - Ürünleri sürükle-bırak ile sırala → sıra değişiyor mu?
   - Sayfa yenilenince sıra korunuyor mu?
3. Public menü (`/menu/abc-restaurant`):
   - Kategoriler ve ürünler yeni sırada mı?
4. Hero image:
   - Landing page'de görsel düzgün yükleniyor mu?
   - Network tab'da görsel boyutu küçülmüş mü?

---

## GIT COMMIT
```bash
git add -A && git commit -m "feat: drag & drop sorting for categories and items, optimize hero image" && git push origin main
```
