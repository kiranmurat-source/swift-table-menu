# TABBLED — P1 MENÜ DÜZENLEME UX (FineDine Benchmark)
## Claude Code Prompt — 11 Nisan 2026

---

## PROJE BAĞLAMI

- **Repo:** /opt/khp/tabbled/ (GitHub: kiranmurat-source/swift-table-menu)
- **Stack:** React + Vite + TypeScript + shadcn/ui + Supabase
- **Supabase:** qmnrawqvkwehufebbkxp.supabase.co
- **Deploy:** Vercel (otomatik git push)
- **İkon:** Circum Icons (react-icons/ci) — shadcn/ui internal Lucide'a DOKUNMA
- **Font:** Playfair Display (başlıklar) + Inter (body)
- **Super admin:** kiran.murat@gmail.com

---

## GÖREV: 4 ÖZELLİK — MENÜ DÜZENLEME UX İYİLEŞTİRMELERİ

FineDine admin paneli referans alınarak aşağıdaki 4 özellik eklenecek. FineDine screenshot'ları incelendi, Tabbled'ın mevcut yapısına uyarlanacak.

---

## ÖZELLİK 1: ALT KATEGORİ SİSTEMİ

### Amaç
Kategorilerin altında alt kategoriler oluşturabilme. Örnek:
- Kahvaltı (parent)
  - Kahvaltı Çeşitleri (child)
  - Omlet Çeşitleri (child)
- Başlangıçlar (parent, alt kategorisi yok)

### DB Değişiklikleri
```sql
-- menu_categories tablosuna parent_id ekle
ALTER TABLE menu_categories ADD COLUMN parent_id uuid REFERENCES menu_categories(id) ON DELETE CASCADE;

-- Parent kategoriler: parent_id IS NULL
-- Alt kategoriler: parent_id = üst kategorinin id'si

-- RLS policy güncelleme gerekmez (mevcut restaurant_id bazlı policy yeterli)
```

### Admin Panel (RestaurantDashboard.tsx)
- Kategori listesinde hiyerarşik görünüm:
  - Parent kategoriler tam genişlik, bold başlık
  - Alt kategoriler indentli (sol padding 24px), küçük font
  - FineDine'daki gibi: parent'ın altında child'lar sıralanır
- Kategori oluşturma formuna "Üst Kategori" dropdown ekle:
  - Seçenekler: "Ana Kategori (Yok)" + mevcut parent kategoriler
  - Sadece parent_id IS NULL olan kategoriler seçenek olarak gösterilsin (2 seviye limit)
- Drag & drop: Parent kategoriler kendi aralarında, child kategoriler parent içinde sıralanır
- Kategori silme: parent silinince child'lar da silinir (CASCADE)
- Ürünler alt kategoriye atanır. Parent kategoriye direkt ürün eklenemez (eğer child varsa)
  - Parent'ın child'ı yoksa, ürünler direkt parent'a eklenebilir

### Public Menü (PublicMenu.tsx)
- Kategori tab bar'da SADECE parent kategoriler gösterilsin
- Parent'a tıklayınca altında child kategoriler alt başlık olarak gösterilsin
- Child altındaki ürünler gruplu listelenir
- Parent'ın child'ı yoksa, direkt ürünler listelenir (mevcut davranış korunur)

### Çeviri Merkezi
- Alt kategoriler de çeviri merkezinde görünsün (parent → child tree yapısı)
- translations JSONB mevcut yapı korunur

---

## ÖZELLİK 2: INLINE FİYAT DÜZENLEME

### Amaç
Ürün listesinde fiyatı direkt değiştirebilme — modal açmaya gerek kalmadan.

### Admin Panel (RestaurantDashboard.tsx)
- Ürün listesindeki her satırda fiyat alanı editable input olsun
- Mevcut görünüm: `250.00 ₺` text → tıklayınca input'a dönüşsün
- Input: `type="number"`, step="0.01", min="0"
- Blur veya Enter'da kaydet (Supabase update)
- Kaydetme sırasında küçük loading spinner
- Hata olursa eski değere geri dön + toast mesajı
- Stil: FineDine'daki gibi — border'lı input, sağda ₺ sembolü

### Teknik
```typescript
// Optimistic update pattern
const updatePrice = async (itemId: string, newPrice: number) => {
  const { error } = await supabase
    .from('menu_items')
    .update({ price: newPrice })
    .eq('id', itemId);
  if (error) {
    toast.error('Fiyat güncellenemedi');
    // revert
  }
};
```

---

## ÖZELLİK 3: TÜKENDİ (86'd) TOGGLE

### Amaç
Ürünü hızlıca "Tükendi" olarak işaretleyebilme. Tükenen ürünler menüde görünür ama sipariş edilemez.

### DB Değişiklikleri
```sql
-- menu_items tablosuna is_sold_out ekle
ALTER TABLE menu_items ADD COLUMN is_sold_out boolean DEFAULT false;
```

### Admin Panel (RestaurantDashboard.tsx)
- Ürün listesinde her satırda tükendi toggle (Switch component)
- FineDine'daki gibi: "Tükendi olarak işaretle" toggle
- Toggle değişince anında DB güncelleme (optimistic)
- Tükendi olan ürünler listede soluk görünsün (opacity-50) + "Tükendi" badge
- Ürün düzenleme formunda (modal) da "Tükendi" toggle olsun
- Toplu işlem: birden fazla ürünü tükendi yapma (gelecekte, şimdi tek tek yeterli)

### Public Menü (PublicMenu.tsx)
- Tükendi ürünler kartda gösterilsin AMA:
  - Fotoğraf ve isim soluk (opacity-50 veya grayscale)
  - Fiyat üzeri çizili (line-through)
  - "Tükendi" kırmızı badge (tema uyumlu)
  - Kart tıklanabilir olsun (detay modal açılsın) ama sipariş butonu disabled
- Detay modalında da "Tükendi" uyarısı gösterilsin
- 3 tema (white/black/red) uyumlu olmalı

---

## ÖZELLİK 4: ÜRÜN ZAMANLAMA / PERİYODİK GÖSTERİM

### Amaç
Ürünleri belirli gün ve saatlerde gösterme. Kahvaltı menüsü sabah, akşam menüsü akşam gibi.

### DB Değişiklikleri
```sql
-- menu_items tablosuna zamanlama kolonları ekle
ALTER TABLE menu_items ADD COLUMN schedule_type text DEFAULT 'always' CHECK (schedule_type IN ('always', 'date_range', 'periodic'));
ALTER TABLE menu_items ADD COLUMN schedule_start timestamptz;
ALTER TABLE menu_items ADD COLUMN schedule_end timestamptz;
ALTER TABLE menu_items ADD COLUMN schedule_periodic jsonb DEFAULT '{}';
-- schedule_periodic format:
-- {
--   "monday": { "enabled": true, "start": "08:00", "end": "11:00" },
--   "tuesday": { "enabled": true, "start": "08:00", "end": "11:00" },
--   ...
-- }
```

### Admin Panel (RestaurantDashboard.tsx)
- Ürün düzenleme formunda (modal içinde) yeni "Zamanlama" bölümü
- FineDine'daki gibi 3 seçenek (radio group):
  1. **Her zaman** — Menüyü hep göster (default)
  2. **Zaman Aralığı** — Başlangıç ve bitiş tarihi (date picker)
  3. **Periyodik** — Gün bazlı saat aralığı
     - 7 gün checkbox'ı (Pazartesi-Pazar)
     - Her gün için başlangıç/bitiş saati (time input: HH:MM)
     - "Tüm Gün" checkbox'ı (saat seçimini devre dışı bırakır)
- UI: FineDine screenshot'undaki gibi temiz form layout

### Public Menü (PublicMenu.tsx)
- Zamanlama kontrolü client-side:
```typescript
const isItemVisible = (item: MenuItem): boolean => {
  if (item.schedule_type === 'always') return true;
  
  const now = new Date();
  
  if (item.schedule_type === 'date_range') {
    const start = new Date(item.schedule_start);
    const end = new Date(item.schedule_end);
    return now >= start && now <= end;
  }
  
  if (item.schedule_type === 'periodic') {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[now.getDay()];
    const schedule = item.schedule_periodic?.[today];
    
    if (!schedule?.enabled) return false;
    
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    if (schedule.start === '00:00' && schedule.end === '23:59') return true; // Tüm gün
    
    return currentTime >= schedule.start && currentTime <= schedule.end;
  }
  
  return true;
};
```
- Görünmez ürünler tamamen gizlensin (DOM'da bile olmasın)
- Boş kalan kategoriler de gizlensin

---

## GENEL TEKNİK KURALLAR

### İkon Kuralları
- YENİ ikonlar eklerken: Circum Icons (`react-icons/ci`) kullan
- shadcn/ui bileşenlerinin (Button, Switch, Dialog vs.) INTERNAL Lucide ikonlarına DOKUNMA
- Emoji KULLANMA — her yerde Circum Icons

### Önerilen Circum İkonlar
- Alt kategori: CiViewList veya CiBoxList
- Tükendi: CiNoWaitingSign veya CiCircleRemove
- Zamanlama: CiClock1 veya CiTimer
- Fiyat: CiMoneyBill veya CiDollar
- Grip handle (drag): CiBoxes (mevcut)

### Stil
- shadcn/ui bileşenlerini kullan (Switch, Input, Select, RadioGroup, Label, Badge)
- Tailwind CSS class'ları
- Tema uyumlu renkler (public menüde)
- Toast mesajları: shadcn/ui toast veya sonner

### Test
- `npm run build` ile build kontrolü yap
- TypeScript hataları olmamalı
- Mevcut özellikler bozulmamalı (drag & drop, çeviri merkezi, promo popup vs.)

---

## UYGULAMA SIRASI (ÖNERİLEN)

1. **DB migration'ları çalıştır** (parent_id, is_sold_out, schedule kolonları)
2. **Alt kategori sistemi** — en kapsamlı değişiklik, önce DB yapısı doğru olmalı
3. **Inline fiyat düzenleme** — basit, hızlı kazanım
4. **Tükendi toggle** — basit, hızlı kazanım
5. **Ürün zamanlama** — en son, karmaşık UI
6. **Public menü güncellemeleri** — tüm özellikler admin'de çalıştıktan sonra
7. **Build & test**

---

## DİKKAT EDİLECEKLER

- menu_categories.parent_id eklendikten sonra mevcut kategorilerin parent_id'si NULL kalacak (doğru davranış — hepsi parent)
- Drag & drop sıralama alt kategorilerde de çalışmalı
- Çeviri merkezi alt kategorileri de göstermeli
- Public menüde schedule kontrolü Türkiye saatine göre olmalı (client timezone)
- is_sold_out ve schedule_type birlikte çalışmalı (tükendi AND zamanlanmış → her iki kontrol de geçerli)
- RLS policy'lere dokunma gerekmez (mevcut restaurant_id bazlı policy'ler yeni kolonları da kapsar)

---

## DOSYALAR (DOKUNULACAK)

### Kesin Değişecek
- `src/pages/RestaurantDashboard.tsx` — ana dosya, tüm 4 özellik burada
- `src/pages/PublicMenu.tsx` — alt kategori görünümü, tükendi, zamanlama
- Supabase SQL (migration)

### Muhtemelen Değişecek
- `src/lib/supabase.ts` — type güncellemeleri (varsa)
- Çeviri merkezi bölümü (RestaurantDashboard içinde)

### Dokunulmayacak
- Landing page bileşenleri
- Login.tsx
- SuperAdminDashboard.tsx
- shadcn/ui internal bileşenleri
- public/allergens/ SVG dosyaları
