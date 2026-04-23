# Aşama 2/3 — Yasal Fiyat Bilgileri Admin Paneli UI

## PROJE BAĞLAMI

Tabbled QR menü platformu. DB Aşama 1 tamamlandı — `restaurants` tablosuna 2 yeni kolon eklendi:
- `price_effective_date` (DATE) — fiyatların geçerli olduğu tarih
- `show_vat_notice` (BOOLEAN, default true) — "KDV dahildir" göster/gizle

Admin paneli tek dosyada: `src/pages/RestaurantDashboard.tsx` (2819 satır). Sidebar'da 6 grup var:
1. Dashboard, Analitik
2. Menü Yönetimi
3. AI Araçları
4. Müşteri İlişkileri
5. Pazarlama
6. **Görünüm** → "Tema & Profil" (key: `profile`)

Yasal bilgiler "Tema & Profil" sayfasına eklenecek — yeni ayrı bir bileşen dosyasında.

## AŞAMA 2 GÖREVİ

**2 adım:**
1. Yeni bileşen oluştur: `src/components/admin/LegalSettings.tsx`
2. `RestaurantDashboard.tsx` profile tab'ında uygun yere import edip render et

## ADIM 1: YENİ BİLEŞEN OLUŞTUR

`src/components/admin/LegalSettings.tsx` dosyasını oluştur:

```tsx
// src/components/admin/LegalSettings.tsx
// Yasal Fiyat Bilgileri — Fiyat Etiketi Yönetmeliği uyum alanları
// restaurants.price_effective_date + show_vat_notice

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, Receipt, Info, CheckCircle } from '@phosphor-icons/react';

interface LegalSettingsProps {
  restaurantId: string;
  initialPriceEffectiveDate: string | null;
  initialShowVatNotice: boolean;
  onSaved?: () => void;
}

export function LegalSettings({
  restaurantId,
  initialPriceEffectiveDate,
  initialShowVatNotice,
  onSaved,
}: LegalSettingsProps) {
  // Backend'den DATE geliyor (YYYY-MM-DD formatında), 
  // HTML date input da aynı formatı istiyor — direkt kullanılabilir
  const [priceDate, setPriceDate] = useState<string>(
    initialPriceEffectiveDate || new Date().toISOString().slice(0, 10)
  );
  const [showVat, setShowVat] = useState<boolean>(initialShowVatNotice);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  // Props değişirse state'i güncelle (restaurant verisi yeniden yüklenirse)
  useEffect(() => {
    if (initialPriceEffectiveDate) setPriceDate(initialPriceEffectiveDate);
    setShowVat(initialShowVatNotice);
  }, [initialPriceEffectiveDate, initialShowVatNotice]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('restaurants')
      .update({
        price_effective_date: priceDate,
        show_vat_notice: showVat,
      })
      .eq('id', restaurantId);

    setSaving(false);
    if (!error) {
      setSavedAt(new Date());
      setTimeout(() => setSavedAt(null), 3000);
      onSaved?.();
    } else {
      alert('Kayıt sırasında hata oluştu: ' + error.message);
    }
  };

  const formatDisplayDate = (isoDate: string): string => {
    if (!isoDate) return '';
    const [y, m, d] = isoDate.split('-');
    return `${d}.${m}.${y}`;
  };

  const today = new Date().toISOString().slice(0, 10);
  const isFutureDate = priceDate > today;

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E5E5',
        borderRadius: 12,
        padding: 24,
        marginBottom: 24,
        fontFamily: 'Roboto, sans-serif',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Receipt size={22} weight="thin" color="#1C1C1E" />
        <h3 style={{ fontSize: 18, fontWeight: 500, margin: 0, color: '#1C1C1E' }}>
          Yasal Fiyat Bilgileri
        </h3>
      </div>
      <p style={{ fontSize: 13, color: '#6B6B70', margin: '0 0 20px', lineHeight: 1.5 }}>
        Fiyat Etiketi Yönetmeliği (11.10.2025, Sayı: 33044) kapsamında menünüzde görüntülenmesi 
        gereken yasal bilgiler.
      </p>

      {/* Info banner */}
      <div
        style={{
          background: '#F0F7FF',
          border: '1px solid #CFE2FF',
          borderRadius: 8,
          padding: 12,
          marginBottom: 20,
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start',
        }}
      >
        <Info size={18} weight="thin" color="#1F6FD6" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 13, color: '#1F6FD6', lineHeight: 1.5 }}>
          Fiyat değişikliği yaptığınızda bu tarihi mutlaka güncelleyin. Bu bilgiler menünüzde 
          ve PDF çıktısında görüntülenecektir.
        </div>
      </div>

      {/* Price effective date */}
      <div style={{ marginBottom: 20 }}>
        <label
          style={{
            display: 'block',
            fontSize: 14,
            fontWeight: 500,
            color: '#1C1C1E',
            marginBottom: 8,
          }}
        >
          Fiyatların uygulanmaya başladığı tarih
        </label>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 240 }}>
            <Calendar
              size={18}
              weight="thin"
              color="#6B6B70"
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="date"
              value={priceDate}
              onChange={(e) => setPriceDate(e.target.value)}
              max={today}
              style={{
                width: '100%',
                padding: '10px 12px 10px 38px',
                fontSize: 14,
                fontFamily: 'Roboto, sans-serif',
                border: '1px solid #E5E5E5',
                borderRadius: 8,
                background: '#FFFFFF',
                color: '#1C1C1E',
                outline: 'none',
              }}
            />
          </div>
          <span style={{ fontSize: 13, color: '#6B6B70' }}>
            Görünüm: <strong>{formatDisplayDate(priceDate)}</strong>
          </span>
        </div>
        {isFutureDate && (
          <p style={{ fontSize: 12, color: '#D84315', marginTop: 6 }}>
            ⚠ Gelecek tarih seçilemez — menüde görünen tarih geçmiş veya bugün olmalıdır.
          </p>
        )}
      </div>

      {/* VAT notice toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 14,
          background: '#F9F9FA',
          borderRadius: 8,
          marginBottom: 20,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#1C1C1E', marginBottom: 2 }}>
            "KDV dahildir" ibaresini göster
          </div>
          <div style={{ fontSize: 12, color: '#6B6B70' }}>
            Menü ve PDF çıktısında bu ibare görüntülenir (önerilen)
          </div>
        </div>
        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={showVat}
            onChange={(e) => setShowVat(e.target.checked)}
            style={{ display: 'none' }}
          />
          <div
            style={{
              width: 44,
              height: 24,
              borderRadius: 12,
              background: showVat ? '#1C1C1E' : '#D1D1D6',
              position: 'relative',
              transition: 'background 0.2s',
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                background: '#FFFFFF',
                position: 'absolute',
                top: 2,
                left: showVat ? 22 : 2,
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
            />
          </div>
        </label>
      </div>

      {/* Save button + status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={handleSave}
          disabled={saving || isFutureDate}
          style={{
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 500,
            fontFamily: 'Roboto, sans-serif',
            background: saving || isFutureDate ? '#D1D1D6' : '#1C1C1E',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 8,
            cursor: saving || isFutureDate ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
          }}
        >
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
        {savedAt && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              color: '#2E7D32',
            }}
          >
            <CheckCircle size={16} weight="fill" /> Kaydedildi
          </span>
        )}
      </div>
    </div>
  );
}
```

## ADIM 2: RESTAURANTDASHBOARD.TSX'E ENTEGRE ET

### Adım 2a: Mevcut profile tab'ı bul

```bash
grep -n "activeTab === 'profile'\|case 'profile'\|'profile':" src/pages/RestaurantDashboard.tsx
```

Bu komut profile tab'ının içeriğinin render edildiği yerleri gösterecek. Büyük olasılıkla bir ternary veya switch yapısında. İçerik satır aralığını bul.

### Adım 2b: Restoran verisinin tip tanımını kontrol et

```bash
grep -n "interface Restaurant\|type Restaurant\|restaurant: {" src/pages/RestaurantDashboard.tsx | head -5
```

Restoran state'inde `price_effective_date` ve `show_vat_notice` alanları tiplerde olmayabilir. Eğer Restaurant interface'i dosyada tanımlıysa, bu iki alanı ekle. Eğer `src/types/menu.ts`'ten import ediliyorsa, oradaki interface'i güncelle:

**Eğer `src/types/menu.ts` içindeki Restaurant interface'inde yoksa, oraya ekle:**

```typescript
export interface Restaurant {
  // ... mevcut alanlar
  price_effective_date?: string | null;  // YYYY-MM-DD
  show_vat_notice?: boolean;
}
```

### Adım 2c: Import ekle

`RestaurantDashboard.tsx` üstüne:

```tsx
import { LegalSettings } from '../components/admin/LegalSettings';
```

### Adım 2d: profile tab'ında render et

Profile tab'ının render edildiği yerde, mevcut "Tema" ve "Profil" (restoran bilgileri, logo, adres vb.) kısımlarından sonra (veya mantıklı bir yerde), `<LegalSettings>` bileşenini render et:

```tsx
{/* Mevcut profile tab içeriği... */}

{/* Yeni: Yasal Fiyat Bilgileri */}
<LegalSettings
  restaurantId={restaurant.id}
  initialPriceEffectiveDate={restaurant.price_effective_date ?? null}
  initialShowVatNotice={restaurant.show_vat_notice ?? true}
  onSaved={() => {
    // Opsiyonel: Restoran verisini yeniden çek (toast ya da refresh)
    // Eğer zaten bir fetchRestaurant fonksiyonu varsa onu çağır
  }}
/>
```

**DİKKAT:**
- `restaurant` objesinde `price_effective_date` ve `show_vat_notice` alanları var olmalı. Eğer Supabase fetch'te `select('*')` kullanılıyorsa otomatik gelir. Eğer explicit kolon listesi varsa bu iki kolonu ekle.
- İlk kez yüklenen bir restoran için (DB default'tan ötürü) bu alanlar dolu gelir (migration sonrası).

## GENEL KURALLAR

1. **RestaurantDashboard.tsx'e minimum dokunuş** — sadece import + profile tab'ına 1 bileşen çağrısı + Restaurant interface güncelleme. Başka hiçbir mantığı değiştirme.
2. **Tasarım dili:** Roboto font, Phosphor Icons thin weight, mevcut admin tema paletindeki renkler. İkonlar: `Calendar`, `Receipt`, `Info`, `CheckCircle`.
3. **Gelecek tarih engelleme:** `max={today}` ile HTML tarafından ve `isFutureDate` kontrolü ile save disable.
4. **Toggle UX:** Native checkbox gizli, custom pill toggle görünür (yukarıdaki kod).
5. **"KDV dahildir" default true** — bu tavsiye edilen davranış.
6. **Başka dosyaya dokunma** (hariç: `src/types/menu.ts` eğer Restaurant interface oradaysa).

## TEST CHECKLIST

1. `src/components/admin/LegalSettings.tsx` oluşturuldu
2. `src/types/menu.ts`'deki Restaurant interface'inde iki yeni alan var (price_effective_date, show_vat_notice)
3. `RestaurantDashboard.tsx` profile tab'ında `<LegalSettings>` render ediliyor
4. `npm run build` çalıştır — TypeScript hatası olmamalı
5. Build başarılıysa commit + push:
   ```bash
   git add src/components/admin/LegalSettings.tsx \
           src/pages/RestaurantDashboard.tsx \
           src/types/menu.ts
   git commit -m "feat: Legal price settings UI in admin panel (Fiyat Etiketi Yönetmeliği)"
   git push git@github.com:kiranmurat-source/source/swift-table-menu.git main
   ```
   
   **DÜZELTME (yanlış remote):**
   ```bash
   git push git@github.com:kiranmurat-source/swift-table-menu.git main
   ```

6. Vercel deploy bekle (1-2 dk)
7. Production test:
   - Admin panele gir: https://tabbled.com/dashboard
   - Sidebar → Görünüm → Tema & Profil tab'ına git
   - "Yasal Fiyat Bilgileri" kartı görünmeli
   - Tarih seçici var, bugünün tarihi default
   - Gelecek tarih seçilemiyor (uyarı çıkıyor)
   - "KDV dahildir" toggle var, default açık
   - "Kaydet" butonu çalışıyor, "Kaydedildi" yeşil mesajı 3 sn görünüp kayboluyor
   - Sayfayı yenile → değerler korunmuş (DB'ye yazıldı)

## BAŞARI KRİTERLERİ

- ✅ `LegalSettings.tsx` oluşturuldu, tek self-contained bileşen
- ✅ RestaurantDashboard.tsx'e import edildi ve profile tab'ında render ediliyor
- ✅ Restaurant interface iki yeni alan içeriyor
- ✅ Build hatasız
- ✅ Production'da admin panelde görünüyor, kaydet çalışıyor
- ✅ Ramada Encore admin'i olarak test: tarih + KDV toggle kaydedilip persisted

## HATA DURUMU

- **TypeScript "Property 'price_effective_date' does not exist on type 'Restaurant'"** → `src/types/menu.ts`'teki Restaurant interface'ine iki alanı eklemeyi unuttun
- **Supabase update hatası** → RLS policy sorun çıkarabilir (restaurant sahibi kendi restoranını update edebilmeli — zaten RLS var), hata mesajına bak
- **Tarih inputunda garip format** → HTML date input 'YYYY-MM-DD' istiyor, Supabase de aynısını döner, dönüşüm gerekmez

Hata varsa DURDUR, raporla, yeni prompt bekle.

## ÖNCELİK SIRASI

1. `src/types/menu.ts`'teki Restaurant interface'ine iki alan ekle (varsa)
2. `src/components/admin/LegalSettings.tsx` oluştur
3. `RestaurantDashboard.tsx` profile tab'ına import ve render ekle
4. Build → commit → push
5. Aşama 2 bitir — Aşama 3 (PDF Export) için ayrı prompt gelecek
