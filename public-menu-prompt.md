# TABBLED — Public Menü Sayfası (/menu/:slug)

Proje: /opt/khp/tabbled

## ÖZET
Restoran slug'ı ile erişilebilen public menü sayfası oluştur. Auth gerektirmez. Mobile-first tasarım.
URL pattern: `https://tabbled.com/menu/cafe-istanbul`

## 1. Route Ekle — App.tsx

```tsx
import PublicMenu from "./pages/PublicMenu.tsx";
```

Routes içine (NotFound'dan ÖNCE) ekle:
```tsx
<Route path="/menu/:slug" element={<PublicMenu />} />
```

## 2. PublicMenu.tsx Oluştur — src/pages/PublicMenu.tsx

### Veri Akışı
1. URL'den `slug` parametresini al (`useParams`)
2. `restaurants` tablosundan slug ile restoranı bul
3. `menu_categories` tablosundan restoranın aktif kategorilerini çek (sort_order sıralı)
4. `menu_items` tablosundan restoranın tüm aktif (is_available=true) ürünlerini çek (sort_order sıralı)
5. URL'de `?table=5` varsa masa numarasını göster

### Sayfa Yapısı (yukarıdan aşağıya)

**A. Header**
- Restoran logo (varsa, restaurants.logo_url) — yoksa ilk harf avatarı
- Restoran adı (h1, Montserrat bold)
- Restoran adresi ve telefonu (varsa, küçük muted text)
- Masa numarası badge (URL param'dan, varsa göster: "Masa 5")
- Background: design system'den `#422B21` (dark chocolate)
- Text: beyaz

**B. Kategori Tab Bar**
- Yatay scroll pill bar
- İlk pill: "Tümü" (tüm ürünleri göster)
- Sonra her aktif kategori bir pill
- Active pill: `#A8B977` (sage/primary) background, beyaz text
- Inactive pill: beyaz background, `#E8E6E0` border, `#6B7280` text
- Sticky top (scroll'da sabit kalsın)
- CSS: `overflow-x: auto`, `scroll-snap-type: x mandatory`, `scrollbar-width: none`

**C. Ürün Kartları**
Her ürün için bir kart:
- Layout: sol taraf metin, sağ taraf kare fotoğraf (80x80px, rounded)
- Fotoğraf yoksa: gradient placeholder (sage/salmon tonları)
- Ürün adı: `#1A1A1A`, bold, 15px
- Açıklama: `#6B7280`, thin (Montserrat 200), 13px, max 2 satır truncate
- Fiyat: `#A8B977` (sage), semibold, 15px — "₺" prefix
- Badge'ler (varsa):
  - is_popular → `<CiStar size={12} />` "Popüler" — background: `#E4D085` (gold), text: `#422B21`
  - is_new → `<CiStar size={12} />` "Yeni" — background: `#fef3c7`, text: `#b45309`
  - is_vegetarian → `<CiApple size={12} />` — background: `#dcfce7`, text: `#16a34a`
- Allerjen ikonları (varsa): küçük ikon row, kullan:
  ```
  gluten → CiWheat
  dairy → CiDroplet
  egg → CiCircleAlert
  nuts → CiApple
  seafood → CiWavePulse1
  soy → CiLemon
  spicy → CiTempHigh
  ```
- Kalori (varsa): `<CiTempHigh size={12} /> 450 kcal` — muted, küçük

**D. Kategori Başlıkları**
- Eğer "Tümü" seçiliyse, ürünleri kategoriye göre grupla
- Her kategori başlığı: uppercase, bold, 12px, muted, üstte border-top divider
- Eğer spesifik kategori seçiliyse, sadece o kategorinin ürünlerini göster (başlık yok)

**E. Footer**
- "Powered by Tabbled" — küçük, ortalı, muted
- tabbled.com linki

**F. Boş/Hata State'leri**
- Restoran bulunamadı → "Bu menü mevcut değil" mesajı + tabbled.com linki
- Restoran var ama ürün yok → "Menü henüz hazırlanıyor" mesajı
- Loading state → basit spinner veya "Menü yükleniyor..."

### Tasarım Kuralları
- Font: Montserrat (zaten global'de tanımlı)
- Başlıklar: font-weight 700
- Body: font-weight 400
- Açıklamalar: font-weight 200
- Zemin: `#F5F3EE`
- Kart: `#FFFFFF`, border: `#E8E6E0`, border-radius: 12px
- Mobile-first: max-width 480px container, ortalı
- Tailwind CSS kullan (inline style KULLANMA)
- İkonlar: `react-icons/ci` (Circum Icons)

### Import'lar
```tsx
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CiWheat, CiDroplet, CiCircleAlert, CiApple, CiLemon, CiStar, CiTempHigh, CiWavePulse1, CiMapPin, CiPhone } from 'react-icons/ci';
```

### Supabase Sorguları
```tsx
// Restoran
const { data: restaurant } = await supabase
  .from('restaurants')
  .select('*')
  .eq('slug', slug)
  .eq('is_active', true)
  .single();

// Kategoriler
const { data: categories } = await supabase
  .from('menu_categories')
  .select('*')
  .eq('restaurant_id', restaurant.id)
  .eq('is_active', true)
  .order('sort_order');

// Ürünler
const { data: items } = await supabase
  .from('menu_items')
  .select('*')
  .eq('restaurant_id', restaurant.id)
  .eq('is_available', true)
  .order('sort_order');
```

### Responsive
- Mobil (default): tek kolon, tam genişlik kartlar
- Tablet+: max-width 480px, ortalı (menü telefon ekranı gibi görünsün)

### ÖNEMLİ
- Auth gerektirmez — public erişim
- RLS policy'de public menü erişimi zaten açık olmalı — eğer yoksa, SQL ekle:
```sql
-- Public read for active restaurants
CREATE POLICY "Public read restaurants" ON restaurants FOR SELECT USING (is_active = true);
-- Public read for menu categories
CREATE POLICY "Public read categories" ON menu_categories FOR SELECT USING (is_active = true);
-- Public read for menu items  
CREATE POLICY "Public read items" ON menu_items FOR SELECT USING (is_available = true);
```
Bu policy'lerin var olup olmadığını kontrol et, yoksa ekle.

- CookieBanner bu sayfada da görünecek (App.tsx'te global)
- Navbar bu sayfada GÖRÜNMEMELI — PublicMenu kendi header'ını kullanacak

## 3. Landing Page CTA Güncelleme

Şu dosyalarda `/menu/cafe-istanbul` olan linkleri kontrol et — eğer DB'de `cafe-istanbul` slug'lı bir restoran yoksa, demek test/demo restoranı lazım. Şimdilik linkleri olduğu gibi bırak.

## Son Adım
```bash
npm run build
git add -A && git commit -m "Add public menu page (/menu/:slug)" && git push origin main
```
