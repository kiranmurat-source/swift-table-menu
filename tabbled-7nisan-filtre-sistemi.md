# TABBLED — Claude Code Prompt
# 7 Nisan 2026 — Public Menü Filtreleme Sistemi

---

## PROJE BAĞLAMI

- **Dizin:** /opt/khp/tabbled
- **Stack:** React + Vite + TypeScript + shadcn/ui
- **Dosya:** src/pages/PublicMenu.tsx (ana dosya)
- **Allerjen sistemi:** src/lib/allergens.ts (ALLERGEN_LIST mevcut)
- **Tema sistemi:** src/lib/themes.ts (getTheme mevcut, MenuTheme tipi)
- **İkon kuralı:** shadcn/ui internal Lucide ikonlarına DOKUNMA. Kendi kodlarımızda Circum Icons (react-icons/ci) kullan.

---

## GÖREV: Filtreleme Sistemi

Public menü sayfasına (/menu/:slug) filtreleme özelliği ekle. Textbox/arama yok, sadece filtre chip'leri.

---

## UI TASARIMI

### Filtre Butonu
- Sağ üst köşede (header'da, dil seçicinin yanında veya altında) küçük bir filtre ikonu
- İkon: CiFilter (react-icons/ci) kullan
- Aktif filtre varsa ikonun yanında küçük sayı badge'i göster (kaç filtre aktif)
- Tıklayınca filtre paneli açılır

### Filtre Paneli
- Bottom sheet / slide-up panel tarzında (ürün detay modalına benzer)
- Backdrop tıklama ile kapanır
- Üstte "Filtreler" başlığı + sağda "Temizle" butonu (tüm filtreleri sıfırlar)
- Altta "Uygula" butonu (paneli kapatır ve filtreleri uygular)
- Panel tema renklerine uyumlu olacak (theme objesi kullanılacak)

### Filtre Grupları (panelin içinde)

#### 1. Allerjen Filtresi
- Başlık: "Alerjen İçermeyen" (TR) / "Free From" (EN)
- Mantık: Seçilen alerjenleri İÇERMEYEN ürünleri göster (exclude logic)
- Sadece en yaygın 10 allerjen göster (hepsini değil):
  - gluten, wheat, milk, eggs, fish, shrimp, nuts, soya, sesame, sulfur-dioxide-sulphites
- Her allerjen bir chip: allerjen ikonu (AllergenIcon, size=16) + Türkçe/İngilizce isim
- Seçili olanlar vurgulanır (accent renk border + hafif bg)
- Çoklu seçim yapılabilir

#### 2. Tercihler Filtresi
- Başlık: "Tercihler" (TR) / "Preferences" (EN)
- Chip'ler:
  - "Popüler" / "Popular" → is_popular === true olan ürünler
  - "Yeni" / "New" → is_new === true olan ürünler (eğer bu field varsa, yoksa atla)
  - "Vejetaryen" / "Vegetarian" → allergens array'inde 'vegetarian' key'i olan VEYA badge olarak işaretli
  - "Vegan" / "Vegan" → allergens array'inde 'vegan' key'i olan VEYA badge olarak işaretli
- Çoklu seçim yapılabilir
- Tercihler OR mantığıyla çalışır (popüler VEYA yeni)

### Filtreleme Mantığı

```
Sonuç = Tüm ürünler
  → Allerjen filtreleri AND (seçilen alerjenlerin HİÇBİRİ ürünün allergens array'inde olmamalı)
  → Tercih filtreleri OR (seçilen tercihlerden EN AZ BİRİ karşılanmalı)
  → İki grup arası AND
```

Örnek: Kullanıcı "Glutensiz" + "Sütsüz" + "Popüler" seçtiyse:
→ Gluten İÇERMEYEN VE Süt İÇERMEYEN VE Popüler olan ürünler gösterilir

### Filtre Aktifken UI Değişiklikleri
- Filtre ikonu yanında aktif filtre sayısı badge'i (küçük daire, accent renk)
- Kategori listesinin üstünde küçük bilgi satırı: "X ürün gösteriliyor" / "Showing X items"
- Eğer hiç ürün kalmadıysa: "Filtreye uygun ürün bulunamadı" mesajı göster
- Kategori tab'larında da filtre uygulanmış sayılar gösterilmeli (boş kategoriler gizlenmeli)

---

## TEKNİK DETAYLAR

### State Yönetimi
```typescript
// Filtre state'leri
const [isFilterOpen, setIsFilterOpen] = useState(false);
const [excludeAllergens, setExcludeAllergens] = useState<string[]>([]);
const [preferences, setPreferences] = useState<string[]>([]); // 'popular', 'new', 'vegetarian', 'vegan'

// Filtrelenmiş ürünler (useMemo)
const filteredItems = useMemo(() => {
  let items = allMenuItems;
  
  // Allerjen exclude filtresi
  if (excludeAllergens.length > 0) {
    items = items.filter(item => {
      const itemAllergens = item.allergens || [];
      return !excludeAllergens.some(a => itemAllergens.includes(a));
    });
  }
  
  // Tercih filtresi (OR mantık)
  if (preferences.length > 0) {
    items = items.filter(item => {
      return preferences.some(pref => {
        if (pref === 'popular') return item.is_popular;
        if (pref === 'new') return item.is_new;
        if (pref === 'vegetarian') return (item.allergens || []).includes('vegetarian') || item.is_vegetarian;
        if (pref === 'vegan') return (item.allergens || []).includes('vegan') || item.is_vegan;
        return false;
      });
    });
  }
  
  return items;
}, [allMenuItems, excludeAllergens, preferences]);

// Aktif filtre sayısı
const activeFilterCount = excludeAllergens.length + preferences.length;
```

### Kategori Filtreleme
Filtre uygulandıktan sonra kategorileri de güncelle:
- Her kategorideki filtrelenmiş ürün sayısını hesapla
- 0 ürünlü kategorileri tab bar'dan gizle
- Kategori pill badge'indeki sayıyı filtrelenmiş sayıyla güncelle

### Tema Uyumu
- Filtre paneli background: theme.cardBg
- Filtre paneli text: theme.text
- Chip seçili: theme.categoryActiveBg + theme.categoryActiveText
- Chip seçili değil: theme.categoryBg + theme.text
- Butonlar: tema accent rengi
- Backdrop: rgba overlay

### Dil Desteği
Mevcut dil sistemi (currentLang state) kullan. Filtre label'ları:
```typescript
const filterLabels = {
  tr: {
    filters: 'Filtreler',
    clearAll: 'Temizle',
    apply: 'Uygula',
    freeFrom: 'Alerjen İçermeyen',
    preferences: 'Tercihler',
    popular: 'Popüler',
    new: 'Yeni',
    vegetarian: 'Vejetaryen',
    vegan: 'Vegan',
    showing: 'ürün gösteriliyor',
    noResults: 'Filtreye uygun ürün bulunamadı',
  },
  en: {
    filters: 'Filters',
    clearAll: 'Clear All',
    apply: 'Apply',
    freeFrom: 'Free From',
    preferences: 'Preferences',
    popular: 'Popular',
    new: 'New',
    vegetarian: 'Vegetarian',
    vegan: 'Vegan',
    showing: 'items showing',
    noResults: 'No items match your filters',
  },
  ar: {
    filters: 'تصفية',
    clearAll: 'مسح الكل',
    apply: 'تطبيق',
    freeFrom: 'خالي من',
    preferences: 'التفضيلات',
    popular: 'شائع',
    new: 'جديد',
    vegetarian: 'نباتي',
    vegan: 'نباتي صرف',
    showing: 'عنصر معروض',
    noResults: 'لا توجد عناصر مطابقة',
  },
  zh: {
    filters: '筛选',
    clearAll: '清除全部',
    apply: '应用',
    freeFrom: '不含',
    preferences: '偏好',
    popular: '热门',
    new: '新品',
    vegetarian: '素食',
    vegan: '纯素',
    showing: '个项目',
    noResults: '没有符合条件的项目',
  },
};
```

---

## YAPMA KURALLARI

1. shadcn/ui internal Lucide ikonlarına DOKUNMA
2. Filtre ikonu için CiFilter (react-icons/ci) kullan
3. Mevcut PublicMenu.tsx yapısını bozma — üstüne ekle
4. Allerjen ikonları için mevcut AllergenIcon bileşenini kullan (src/components/AllergenIcon.tsx)
5. Tema objesini kullan, hardcoded renk yazma
6. is_vegetarian veya is_vegan field'ları DB'de yoksa, sadece allergens array'indeki 'vegetarian' ve 'vegan' key'lerine bak
7. Mevcut kategori tab sistemi çalışmaya devam etmeli
8. Mobil öncelikli düşün — filtre paneli tam genişlik, touch-friendly chip'ler (min 36px yükseklik)

---

## BUILD VE TEST

```bash
npm run build
```

Hatasız build geçmeli. Git push yapma, ben yapacağım.

---

## TEST KONTROL LİSTESİ

- [ ] Filtre ikonu header'da görünüyor
- [ ] Filtre ikonuna tıklayınca panel açılıyor
- [ ] Allerjen chip'lerinde SVG ikonlar görünüyor
- [ ] Allerjen seçince ürünler filtreleniyor (exclude mantığı)
- [ ] Tercih seçince ürünler filtreleniyor (OR mantığı)
- [ ] İkisi birlikte çalışıyor (AND)
- [ ] Aktif filtre sayısı badge'de görünüyor
- [ ] "Temizle" butonu tüm filtreleri sıfırlıyor
- [ ] Boş kategoriler gizleniyor
- [ ] Hiç sonuç yoksa mesaj gösteriliyor
- [ ] 3 temada da doğru renklerde (beyaz/siyah/kırmızı)
- [ ] TR/EN dil desteği çalışıyor
- [ ] Mobilde touch-friendly (chip'ler yeterince büyük)
- [ ] npm run build hatasız
