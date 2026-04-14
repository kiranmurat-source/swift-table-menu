# TABBLED — RestaurantDashboard.tsx Bölme (Component Extraction)
## 3500+ satırlık dosyayı mantıksal bileşenlere ayır

---

## PROJE BAĞLAMI

- **Repo:** /opt/khp/tabbled/
- **Stack:** React + Vite + TypeScript + shadcn/ui
- **Tema sistemi:** `src/lib/adminTheme.ts` — `getAdminTheme(theme)`
- **Hedef:** RestaurantDashboard.tsx'i ~500 satıra düşür, geri kalanı ayrı bileşenlere taşı
- **Emoji yasağı:** Kesinlikle emoji kullanma

---

## MEVCUT DURUM

RestaurantDashboard.tsx ~3500+ satır, içinde şunlar inline:
- Sidebar (akordeon sistemi)
- Tab routing mantığı
- Menü yönetimi (kategori CRUD + ürün CRUD + inline düzenleme + drag & drop + görsel yükleme + allerjen seçici + zamanlama + varyantlar)
- Profil/Tema sayfası (görseller + işletme bilgileri + sosyal medya + çalışma saatleri + feature toggle'lar + tema seçici)
- Promosyonlar (varsa inline)
- Yardımcı bileşenler (InlinePrice, Sortable, vb.)

Zaten ayrı dosyalarda olanlar (DOKUNMA):
- AnalyticsPanel.tsx
- CustomersPanel.tsx
- WaiterCallsPanel.tsx
- FeedbackPanel.tsx
- LikesPanel.tsx
- DiscountCodesPanel.tsx
- TranslationCenter.tsx
- QR kodları (QRManager veya benzeri)

---

## STRATEJİ

**Adım adım çıkar, her adımda build test et.** Tek seferde hepsini yapma — bir bileşen çıkar, build kontrol et, sonraki.

---

## GÖREV 1: MenuPanel.tsx Çıkarma

### Yeni dosya: `src/components/MenuPanel.tsx`

Bu dosyaya taşınacaklar:
- Kategori listesi (ekleme, düzenleme, silme, sıralama)
- Ürün listesi (ekleme, düzenleme, silme, sıralama, arama)
- Ürün düzenleme formu/alanı (tüm alanlar: isim, açıklama, fiyat, görsel, allerjen, zamanlama, varyantlar, video URL, nutrition, vb.)
- InlinePrice bileşeni (varsa)
- Sortable/drag-drop yardımcıları (bu dosyaya özel olanlar)
- Kategori fotoğraf yükleme
- Ürün fotoğraf yükleme
- Allerjen seçici
- Tükendi (86'd) toggle
- Öne çıkarma (is_featured) toggle
- Ürün zamanlama (always/date_range/periodic)
- Fiyat varyantları
- Ürün öneri sistemi (item_recommendations)
- AI açıklama yazıcı (generate-description çağrısı varsa)

### Props interface:
```typescript
interface MenuPanelProps {
  restaurantId: string;
  adminTheme: 'light' | 'dark';
}
```

### Dikkat:
- Supabase client import'unu koru
- React state'leri bu bileşene taşı (kategoriler, ürünler, seçili kategori, form state'leri)
- useEffect/fetch'ler bu bileşene taşı
- Toast notifications import'larını koru
- @dnd-kit import'larını koru
- Mevcut tüm fonksiyonaliteyi koru — sadece dosya taşıma, mantık değişikliği YOK

---

## GÖREV 2: ProfilePanel.tsx Çıkarma

### Yeni dosya: `src/components/ProfilePanel.tsx`

Bu dosyaya taşınacaklar:
- Görseller bölümü (logo + kapak görseli + splash video yükleme/URL)
- İşletme bilgileri (restoran adı, slogan, açıklama, adres, telefon)
- Sosyal medya linkleri (7 platform input)
- Çalışma saatleri (gün bazlı açılış/kapanış)
- Public tema seçici (white/black swatch)
- Admin tema seçici (light/dark toggle)
- Feature toggle'lar (garson çağırma, sepet, WhatsApp sipariş, feedback, indirim kodları, beğeniler)
- Google Place ID input
- Menü görünüm modu seçici (menu_view_mode)

### Props interface:
```typescript
interface ProfilePanelProps {
  restaurant: Restaurant; // mevcut restoran tipi
  adminTheme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
  onRestaurantUpdate: () => void; // refetch tetiklemek için
}
```

### Dikkat:
- Restoran verisi prop olarak gelecek (fetch RestaurantDashboard'da kalabilir veya bu bileşene taşınabilir — hangisi daha temizse)
- Görsel yükleme (Supabase Storage) fonksiyonları buraya taşı
- Feature toggle update fonksiyonları buraya taşı
- onThemeChange callback'i ile admin tema değişikliğini üst bileşene bildir

---

## GÖREV 3: PromosPanel.tsx Çıkarma (eğer inline ise)

Promosyonlar yönetimi RestaurantDashboard.tsx içinde inline ise → ayrı `src/components/PromosPanel.tsx` dosyasına çıkar.

Zaten ayrı dosyadaysa → DOKUNMA.

### Props interface:
```typescript
interface PromosPanelProps {
  restaurantId: string;
  adminTheme: 'light' | 'dark';
}
```

---

## GÖREV 4: RestaurantDashboard.tsx Temizleme

Bileşenler çıkarıldıktan sonra RestaurantDashboard.tsx'te SADECE şunlar kalmalı:

1. **Auth & restaurant fetch** — kullanıcı kontrolü, restoran verisi çekme
2. **Sidebar** — akordeon, navigasyon, aktif tab state
3. **Tab routing** — activeTab state, hangi panel gösterilecek switch/if
4. **Admin tema state** — adminTheme state + DB'den okuma
5. **Layout** — sidebar + main content container

```tsx
// RestaurantDashboard.tsx — temizlenmiş hali (~300-500 satır)
import MenuPanel from '@/components/MenuPanel';
import ProfilePanel from '@/components/ProfilePanel';
import AnalyticsPanel from '@/components/AnalyticsPanel';
import CustomersPanel from '@/components/CustomersPanel';
// ... diğer panel import'ları

function RestaurantDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [adminTheme, setAdminTheme] = useState<'light' | 'dark'>('light');
  // ... auth, restaurant fetch

  return (
    <div data-admin-theme={adminTheme} style={{ display: 'flex' }}>
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} theme={adminTheme} />
      
      {/* Main Content */}
      <main>
        {activeTab === 'menu' && <MenuPanel restaurantId={id} adminTheme={adminTheme} />}
        {activeTab === 'profile' && <ProfilePanel restaurant={restaurant} adminTheme={adminTheme} ... />}
        {activeTab === 'analytics' && <AnalyticsPanel ... />}
        {/* ... diğer tab'lar */}
      </main>
    </div>
  );
}
```

### Sidebar da ayrılabilir (opsiyonel):
Eğer sidebar kodu 200+ satırsa → `src/components/AdminSidebar.tsx` olarak çıkar.

---

## GÖREV 5: DARK TEMA — YENİ BİLEŞENLERDE TAMAMLA

Bileşenler ayrıldıktan sonra, menü bölümündeki kalan hardcoded renkler:

### MenuPanel.tsx'te:
- Tüm `#FFFFFF`, `#fff`, `white` → `t.cardBg`
- Tüm metin renkleri → `t.text` / `t.textSecondary`
- Tüm border → `t.border`
- Tüm input → `t.inputBg` + `t.inputBorder` + `t.inputText`
- InlinePrice bileşeni renkleri → tema uyumlu
- Sortable drag handle → dark modda görünür
- Allerjen chip'leri → tema uyumlu
- Kategori kartları/satırları → tema uyumlu
- Ürün satırları → tema uyumlu
- Görsel yükleme alanı → tema uyumlu
- Modal/Dialog → tema uyumlu

### ProfilePanel.tsx'te:
- Görseller kartı → tema uyumlu
- Tüm input'lar → tema uyumlu
- Çalışma saatleri satırları → tema uyumlu
- Feature toggle satırları → tema uyumlu

---

## GENEL KURALLAR

1. **Emoji YASAK**
2. **Phosphor Icons sadece Thin weight**
3. **shadcn/ui internal Lucide ikonlarına DOKUNMA**
4. **İşlevsellik değişikliği YOK** — sadece dosya reorganizasyonu + dark tema
5. **Her bileşen çıkarma sonrası `npm run build` test et**
6. **TypeScript strict — any kullanma, tipleri doğru tanımla**
7. **Import path'leri doğru: `@/components/MenuPanel` pattern'i**
8. **console.log → import.meta.env.DEV kontrolü**

---

## TEST CHECKLIST

### Fonksiyonalite (regresyon)
- [ ] Menü: kategori ekleme/düzenleme/silme çalışıyor
- [ ] Menü: ürün ekleme/düzenleme/silme çalışıyor
- [ ] Menü: drag & drop sıralama çalışıyor
- [ ] Menü: görsel yükleme çalışıyor
- [ ] Menü: allerjen seçimi çalışıyor
- [ ] Menü: fiyat varyantları çalışıyor
- [ ] Menü: ürün zamanlama çalışıyor
- [ ] Menü: AI açıklama yazıcı çalışıyor (varsa)
- [ ] Menü: tükendi toggle çalışıyor
- [ ] Menü: öne çıkarma toggle çalışıyor
- [ ] Profil: restoran bilgileri kaydetme çalışıyor
- [ ] Profil: logo/kapak yükleme çalışıyor
- [ ] Profil: sosyal medya kaydetme çalışıyor
- [ ] Profil: çalışma saatleri kaydetme çalışıyor
- [ ] Profil: feature toggle'lar çalışıyor
- [ ] Profil: tema değiştirme çalışıyor
- [ ] Sidebar tab geçişleri çalışıyor
- [ ] Tüm diğer paneller (analytics, customers, vb.) etkilenmedi

### Dark Tema
- [ ] MenuPanel dark modda tamamen koyu
- [ ] ProfilePanel dark modda tamamen koyu
- [ ] Light modda her şey eskisi gibi beyaz/gri

### Build
- [ ] `npm run build` hatasız
- [ ] Konsolda runtime hata yok

---

## ÖNCELİK SIRASI

1. MenuPanel.tsx çıkar + build test (en büyük iş)
2. ProfilePanel.tsx çıkar + build test
3. PromosPanel.tsx çıkar (varsa inline) + build test
4. RestaurantDashboard.tsx temizle
5. Dark tema — yeni bileşenlerde tamamla
6. Son test — tüm fonksiyonalite + tema

---

## DOSYALAR

```
src/pages/RestaurantDashboard.tsx        → Bölünecek ana dosya
src/components/MenuPanel.tsx             → YENİ — menü yönetimi
src/components/ProfilePanel.tsx          → YENİ — profil/tema
src/components/PromosPanel.tsx           → YENİ (varsa inline)
src/components/AdminSidebar.tsx          → YENİ (opsiyonel)
src/lib/adminTheme.ts                   → Mevcut tema palette
```
