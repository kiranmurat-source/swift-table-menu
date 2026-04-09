# TABBLED — PUBLIC MENÜ YÜKLEME HIZI DÜZELTMESİ
## Claude Code Prompt — 11 Nisan 2026

---

## PROJE BAĞLAMI

- **Repo:** /opt/khp/tabbled/
- **Stack:** React + Vite + TypeScript + Supabase
- **Supabase:** qmnrawqvkwehufebbkxp.supabase.co
- **Dosya:** src/pages/PublicMenu.tsx
- **Sorun:** QR kod taranınca public menü (/menu/:slug) 5+ saniye yüklenme süresi

---

## SORUN ANALİZİ

QR scan → /menu/:slug → yükleme akışı:
1. Loading ekranı (min 1.5s) — bu bilerek konmuş, sorun değil
2. Splash ekranı — kullanıcı "Menüyü Görüntüle" tıklıyor
3. Menü verisi yükleniyor — BURASI YAVAŞ

Muhtemel sebepler:
- Sıralı (waterfall) query'ler: önce restaurant, sonra categories, sonra items, sonra promos...
- Gereksiz re-fetch (state değişince data tekrar çekiliyor)
- Büyük veri kümesi tek seferde yükleniyor (76 ürün + fotoğraflar)

---

## GÖREV: PublicMenu.tsx yükleme süresini 5+ saniyeden 1-2 saniyeye düşür

### Adım 1: Mevcut query yapısını analiz et

PublicMenu.tsx'i aç ve tüm `supabase.from(...)` çağrılarını bul. Kontrol et:

- Kaç adet query var?
- Sıralı mı (await ... await ... await) yoksa paralel mi (Promise.all)?
- Hangi query'ler hangilerine bağımlı?
- useEffect dependency array'leri ne? Gereksiz tetikleme var mı?

### Adım 2: Query'leri paralelize et

**DOĞRU — Paralel (hepsini aynı anda at):**
```typescript
// Restaurant slug'dan ID'yi al (bu ilk olmalı — diğerleri buna bağımlı)
const { data: restaurant } = await supabase
  .from('restaurants')
  .select('*')
  .eq('slug', slug)
  .eq('is_active', true)
  .single();

if (!restaurant) return;

// Geri kalanı PARALEL çek
const [categoriesRes, itemsRes, promosRes] = await Promise.all([
  supabase
    .from('menu_categories')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .eq('is_active', true)
    .order('sort_order'),
  supabase
    .from('menu_items')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .eq('is_available', true)
    .order('sort_order'),
  supabase
    .from('restaurant_promos')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .eq('is_active', true),
]);
```

**YANLIŞ — Sıralı (waterfall):**
```typescript
// ❌ Her biri öncekinin bitmesini bekliyor
const { data: restaurant } = await supabase.from('restaurants')...
const { data: categories } = await supabase.from('menu_categories')...
const { data: items } = await supabase.from('menu_items')...
const { data: promos } = await supabase.from('restaurant_promos')...
```

### Adım 3: Loading ekranı süresini azalt

Mevcut min 1.5s loading → **1.0 saniyeye** düşür. Kullanıcılar hız istiyor.

Dosyada `1500` veya `1.5` arayarak loading timer'ını bul ve 1000ms yap.

### Adım 4: Gereksiz state tetiklemelerini kaldır

useEffect dependency array'lerini kontrol et:
- Dil değişikliği (lang) data re-fetch TETİKLEMEMELİ — çeviriler zaten yüklenmiş, client-side gösterilmeli
- Filter değişikliği data re-fetch TETİKLEMEMELİ — client-side filtreleme
- Splash → Menü geçişi data re-fetch TETİKLEMEMELİ — veri zaten splash sırasında yüklenmiş olmalı

**Önemli prensip:** Data bir kez yüklensin (sayfa ilk açılışında), sonra tüm işlemler client-side olsun.

### Adım 5: Veri yükleme zamanlaması

Veriyi SPLASH GÖSTERİLİRKEN yükle, splash bitince hazır olsun:

```typescript
// Doğru akış:
// 1. Loading ekranı göster (1s) — AYNI ANDA veri yüklemeye başla
// 2. Veri geldi + 1s doldu → Splash ekranı göster (veri zaten hazır)
// 3. Kullanıcı "Menüyü Görüntüle" tıkladığında → menü ANINDA göster (veri zaten var)

// YANLIŞ akış:
// 1. Loading ekranı göster (1.5s) — bekle
// 2. Loading bitti → veri yüklemeye BAŞLA
// 3. Veri yükleniyor... (2-3s daha bekle)
// 4. Veri geldi → Splash göster
```

### Adım 6: Fotoğraf lazy loading

Ürün fotoğrafları sayfanın yüklenmesini yavaşlatmamalı:
```html
<img loading="lazy" decoding="async" ... />
```

Tüm ürün fotoğraflarında (`<img>` tag) `loading="lazy"` olduğunu kontrol et. Yoksa ekle.

### Adım 7: Console timing log (geçici debug)

Yükleme süresini ölçmek için geçici log ekle:
```typescript
const startTime = performance.now();

// ... veri yükleme ...

console.log(`[Tabbled] Data loaded in ${(performance.now() - startTime).toFixed(0)}ms`);
```

Bu log production'da kalabilir (console.log), ileride kaldırırız.

---

## KONTROL LİSTESİ

- [ ] Tüm Supabase query'leri Promise.all ile paralel çalışıyor (restaurant hariç — o ilk)
- [ ] Loading min süresi 1.5s → 1.0s'ye düşürüldü
- [ ] Veri yükleme loading/splash SIRASINDA başlıyor (sonrasında değil)
- [ ] Dil değişikliği, filtre değişikliği data re-fetch TETİKLEMİYOR
- [ ] Splash → Menü geçişi data re-fetch TETİKLEMİYOR
- [ ] Tüm img tag'lerde loading="lazy" var
- [ ] Console timing log eklendi
- [ ] npm run build başarılı
- [ ] npx tsc --noEmit başarılı

---

## DOKUNULMAYACAKLAR

- RestaurantDashboard.tsx (admin panel — bu prompt'ta değişmez)
- SuperAdminDashboard.tsx
- Landing page bileşenleri
- Edge function'lar
- Mevcut CRUD fonksiyonları
- Splash ekranı UI tasarımı (sadece timing değişiyor)
