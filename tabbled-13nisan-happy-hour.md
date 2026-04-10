# TABBLED — Happy Hour / Zamanlı Fiyat
# DB + Admin Panel + Public Menü

---

## PROJE BAĞLAMI

- **Dizin:** /opt/khp/tabbled
- **Stack:** React + Vite + TypeScript + shadcn/ui
- **İkon:** Circum Icons (react-icons/ci)
- **Supabase:** qmnrawqvkwehufebbkxp.supabase.co
- **Mevcut zamanlama sistemi:** menu_items'ta schedule_type (always/date_range/periodic), schedule_days, schedule_start_time, schedule_end_time kolonları var — bu ürünün gösterilip gösterilmeyeceğini kontrol ediyor
- **Mevcut fiyat sistemi:** price (tek fiyat) + price_variants (çoklu varyant JSONB)

---

## GENEL BAKIŞ

Happy hour, belirli saat aralıklarında belirli ürünlerin fiyatının otomatik düşmesi. Restoran sahibi admin panelde "Happy Hour fiyat" tanımlar, o saat aralığında public menüde hem normal hem indirimli fiyat gösterilir. Saat dışında normal fiyat.

### Örnekler:
- "17:00-19:00 arası tüm bira %30 indirimli"
- "Hafta içi 11:00-14:00 öğle menüsü 99 ₺" (normalde 149 ₺)
- "Cuma-Cumartesi 22:00-01:00 kokteyl 2 al 1 öde"

---

## GÖREV 1: VERİTABANI

### Yeni kolonlar (menu_items tablosuna):

```sql
-- Happy hour fiyat bilgileri
ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS happy_hour_price DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS happy_hour_label TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS happy_hour_days TEXT[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS happy_hour_start_time TIME DEFAULT NULL,
ADD COLUMN IF NOT EXISTS happy_hour_end_time TIME DEFAULT NULL,
ADD COLUMN IF NOT EXISTS happy_hour_active BOOLEAN DEFAULT FALSE;

-- Varyantlı ürünler için happy hour fiyatları price_variants JSONB içinde tutulacak
-- Her varyant objesine happy_hour_price alanı eklenebilir
-- Örnek: { "name_tr": "Büyük", "price": 95, "happy_hour_price": 65 }

-- İndeks
CREATE INDEX IF NOT EXISTS idx_menu_items_happy_hour 
  ON menu_items(restaurant_id, happy_hour_active) 
  WHERE happy_hour_active = true;
```

### Kolon açıklamaları:
- **happy_hour_price:** İndirimli fiyat (tek fiyatlı ürünler için)
- **happy_hour_label:** Özel etiket ("Happy Hour", "Öğle Menüsü", "Gece Özel" vb.) — boşsa "Happy Hour" varsayılan
- **happy_hour_days:** Hangi günler aktif (mon/tue/wed/thu/fri/sat/sun) — NULL ise her gün
- **happy_hour_start_time:** Başlangıç saati (örn: 17:00)
- **happy_hour_end_time:** Bitiş saati (örn: 19:00) — gece yarısını geçebilir (22:00-01:00)
- **happy_hour_active:** Ana toggle — false ise happy hour devre dışı

### Migration SQL'i Supabase Dashboard'dan çalıştırılacak.

---

## GÖREV 2: ADMIN PANEL — HAPPY HOUR FORMU

### Konum:
Ürün formundaki mevcut zamanlama bölümünün altına veya yanına "Happy Hour" bölümü ekle. Collapsible olmalı (varsayılan kapalı).

### Uygulama:

#### 1. Mevcut ürün formunda zamanlama bölümünü bul

Muhtemelen schedule_type, schedule_days gibi alanlar bir collapsible bölümde. Happy hour'ı ayrı bir collapsible bölüm olarak ekle, hemen altına.

#### 2. Happy Hour form bölümü:

```tsx
// Collapsible header
<div
  onClick={() => setShowHappyHour(!showHappyHour)}
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 0',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    color: '#1C1C1E',
  }}
>
  <CiDiscount1 size={16} style={{ color: '#FF4F7A' }} />
  Happy Hour
  <span style={{ fontSize: '11px', color: '#999', fontWeight: 400 }}>
    {itemForm.happy_hour_active ? '(Aktif)' : ''}
  </span>
  <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#999' }}>
    {showHappyHour ? '▲' : '▼'}
  </span>
</div>

{showHappyHour && (
  <div style={{
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #f3f4f6',
    backgroundColor: '#fafafa',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  }}>
    {/* Aktif/Pasif toggle */}
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <label style={{ fontSize: '12px', color: '#666' }}>Happy Hour Aktif</label>
      <input
        type="checkbox"
        checked={itemForm.happy_hour_active || false}
        onChange={e => setItemForm(prev => ({ ...prev, happy_hour_active: e.target.checked }))}
      />
    </div>

    {itemForm.happy_hour_active && (
      <>
        {/* Etiket */}
        <div>
          <label style={{ fontSize: '12px', color: '#666', marginBottom: '4px', display: 'block' }}>
            Etiket (opsiyonel)
          </label>
          <input
            type="text"
            value={itemForm.happy_hour_label || ''}
            onChange={e => setItemForm(prev => ({ ...prev, happy_hour_label: e.target.value }))}
            placeholder="Happy Hour"
            style={{ fontSize: '13px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e5e7eb', width: '100%' }}
          />
          <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>
            Boş bırakırsan "Happy Hour" yazılır
          </div>
        </div>

        {/* İndirimli fiyat — tek fiyat modu */}
        {(!itemForm.price_variants || itemForm.price_variants.length === 0) && (
          <div>
            <label style={{ fontSize: '12px', color: '#666', marginBottom: '4px', display: 'block' }}>
              İndirimli Fiyat (₺)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#999', textDecoration: 'line-through' }}>
                {itemForm.price} ₺
              </span>
              <span style={{ fontSize: '12px', color: '#999' }}>→</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={itemForm.happy_hour_price || ''}
                onChange={e => setItemForm(prev => ({ ...prev, happy_hour_price: parseFloat(e.target.value) || null }))}
                placeholder="0.00"
                style={{ fontSize: '13px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e5e7eb', width: '100px' }}
              />
              <span style={{ fontSize: '12px', color: '#22c55e', fontWeight: 600 }}>
                {itemForm.price && itemForm.happy_hour_price
                  ? `%${Math.round((1 - itemForm.happy_hour_price / itemForm.price) * 100)} indirim`
                  : ''}
              </span>
            </div>
          </div>
        )}

        {/* İndirimli fiyat — varyant modu */}
        {itemForm.price_variants && itemForm.price_variants.length > 0 && (
          <div>
            <label style={{ fontSize: '12px', color: '#666', marginBottom: '4px', display: 'block' }}>
              Varyant İndirimli Fiyatları
            </label>
            {itemForm.price_variants.map((variant: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', color: '#666', minWidth: '80px' }}>{variant.name_tr}</span>
                <span style={{ fontSize: '12px', color: '#999', textDecoration: 'line-through' }}>
                  {variant.price} ₺
                </span>
                <span style={{ fontSize: '12px', color: '#999' }}>→</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={variant.happy_hour_price || ''}
                  onChange={e => {
                    const updated = [...itemForm.price_variants];
                    updated[idx] = { ...updated[idx], happy_hour_price: parseFloat(e.target.value) || null };
                    setItemForm(prev => ({ ...prev, price_variants: updated }));
                  }}
                  placeholder="0.00"
                  style={{ fontSize: '13px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #e5e7eb', width: '80px' }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Gün seçimi */}
        <div>
          <label style={{ fontSize: '12px', color: '#666', marginBottom: '4px', display: 'block' }}>
            Günler (boş = her gün)
          </label>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {[
              { key: 'mon', label: 'Pzt' },
              { key: 'tue', label: 'Sal' },
              { key: 'wed', label: 'Çar' },
              { key: 'thu', label: 'Per' },
              { key: 'fri', label: 'Cum' },
              { key: 'sat', label: 'Cmt' },
              { key: 'sun', label: 'Paz' },
            ].map(day => {
              const selected = (itemForm.happy_hour_days || []).includes(day.key);
              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => {
                    const current = itemForm.happy_hour_days || [];
                    const updated = selected
                      ? current.filter((d: string) => d !== day.key)
                      : [...current, day.key];
                    setItemForm(prev => ({ ...prev, happy_hour_days: updated.length > 0 ? updated : null }));
                  }}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    borderRadius: '6px',
                    border: `1px solid ${selected ? '#FF4F7A' : '#e5e7eb'}`,
                    backgroundColor: selected ? '#FF4F7A' : '#fff',
                    color: selected ? '#fff' : '#666',
                    cursor: 'pointer',
                    fontWeight: selected ? 600 : 400,
                  }}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Saat aralığı */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#666', marginBottom: '4px', display: 'block' }}>
              Başlangıç
            </label>
            <input
              type="time"
              value={itemForm.happy_hour_start_time || ''}
              onChange={e => setItemForm(prev => ({ ...prev, happy_hour_start_time: e.target.value }))}
              style={{ fontSize: '13px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e5e7eb' }}
            />
          </div>
          <span style={{ marginTop: '20px', color: '#999' }}>—</span>
          <div>
            <label style={{ fontSize: '12px', color: '#666', marginBottom: '4px', display: 'block' }}>
              Bitiş
            </label>
            <input
              type="time"
              value={itemForm.happy_hour_end_time || ''}
              onChange={e => setItemForm(prev => ({ ...prev, happy_hour_end_time: e.target.value }))}
              style={{ fontSize: '13px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e5e7eb' }}
            />
          </div>
        </div>
        <div style={{ fontSize: '10px', color: '#999' }}>
          Gece yarısını geçebilir (örn: 22:00-02:00)
        </div>
      </>
    )}
  </div>
)}
```

#### 3. Form kaydetme:
Mevcut save fonksiyonuna happy_hour alanlarını ekle:
```tsx
const saveData = {
  // ... mevcut alanlar
  happy_hour_price: itemForm.happy_hour_price || null,
  happy_hour_label: itemForm.happy_hour_label || null,
  happy_hour_days: itemForm.happy_hour_days || null,
  happy_hour_start_time: itemForm.happy_hour_start_time || null,
  happy_hour_end_time: itemForm.happy_hour_end_time || null,
  happy_hour_active: itemForm.happy_hour_active || false,
};
```

#### 4. Form yüklenirken:
Mevcut hydrate/load fonksiyonuna happy_hour alanlarını ekle.

---

## GÖREV 3: PUBLIC MENÜ — HAPPY HOUR GÖSTERİMİ

### Happy Hour Aktif mi Kontrolü:

```tsx
const isHappyHourActive = (item: MenuItem): boolean => {
  if (!item.happy_hour_active) return false;
  if (!item.happy_hour_start_time || !item.happy_hour_end_time) return false;

  const now = new Date();
  
  // Gün kontrolü
  if (item.happy_hour_days && item.happy_hour_days.length > 0) {
    const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const today = dayMap[now.getDay()];
    if (!item.happy_hour_days.includes(today)) return false;
  }

  // Saat kontrolü
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [startH, startM] = item.happy_hour_start_time.split(':').map(Number);
  const [endH, endM] = item.happy_hour_end_time.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  // Gece yarısını geçen aralık (örn: 22:00-02:00)
  if (endMinutes < startMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
  
  // Normal aralık (örn: 17:00-19:00)
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
};
```

### Fiyat Gösterimi:

#### Tek fiyatlı ürün — Happy hour aktif:
```
┌─────────────────────────────┐
│ 🏷 Happy Hour               │  ← pembe/turuncu badge
│ Adana Kebap                 │
│ ̶1̶4̶9̶.̶0̶0̶ ̶₺̶  →  99.00 ₺     │  ← eski fiyat çizili, yeni fiyat büyük+renkli
│ %34 indirim                 │  ← yeşil küçük text
└─────────────────────────────┘
```

#### Kod:
```tsx
const renderPrice = (item: MenuItem) => {
  const happyHour = isHappyHourActive(item);
  
  if (happyHour && item.happy_hour_price) {
    const discount = Math.round((1 - item.happy_hour_price / item.price) * 100);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <span style={{
          fontSize: '11px',
          textDecoration: 'line-through',
          color: '#999',
        }}>
          {item.price.toFixed(2)} ₺
        </span>
        <span style={{
          fontSize: '16px',
          fontWeight: 700,
          color: '#FF4F7A',
        }}>
          {item.happy_hour_price.toFixed(2)} ₺
        </span>
        <span style={{
          fontSize: '10px',
          color: '#22c55e',
          fontWeight: 600,
        }}>
          %{discount} indirim
        </span>
      </div>
    );
  }
  
  // Normal fiyat (mevcut kod)
  return (
    <span style={{ fontSize: '16px', fontWeight: 700, color: themeAccent }}>
      {item.price.toFixed(2)} ₺
    </span>
  );
};
```

### Happy Hour Badge:
Kart üzerinde (fotoğraf köşesinde veya isim yanında) küçük badge:

```tsx
{isHappyHourActive(item) && (
  <span style={{
    position: 'absolute',
    top: '8px',
    left: '8px',
    fontSize: '10px',
    fontWeight: 700,
    color: '#fff',
    backgroundColor: '#f59e0b', // amber/turuncu
    padding: '2px 8px',
    borderRadius: '4px',
    zIndex: 2,
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
  }}>
    <CiDiscount1 size={10} />
    {item.happy_hour_label || 'Happy Hour'}
  </span>
)}
```

### Varyantlı ürün — Happy Hour:
Detay modalda her varyantın yanında normal ve indirimli fiyat:
```
Küçük:  ̶6̶5̶ ̶₺̶  →  45 ₺
Orta:   ̶7̶5̶ ̶₺̶  →  55 ₺
Büyük:  ̶9̶5̶ ̶₺̶  →  65 ₺
```

### Detay Modalda Happy Hour Bilgisi:
```tsx
{item.happy_hour_active && (
  <div style={{
    padding: '8px 12px',
    borderRadius: '8px',
    backgroundColor: '#fffbeb',
    border: '1px solid #fde68a',
    fontSize: '12px',
    color: '#92400e',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  }}>
    <CiDiscount1 size={14} />
    <div>
      <div style={{ fontWeight: 600 }}>
        {item.happy_hour_label || 'Happy Hour'}
      </div>
      <div style={{ fontSize: '11px', opacity: 0.8 }}>
        {item.happy_hour_start_time} - {item.happy_hour_end_time}
        {item.happy_hour_days && item.happy_hour_days.length > 0 && (
          <> · {item.happy_hour_days.map((d: string) => {
            const labels: Record<string, string> = { mon: 'Pzt', tue: 'Sal', wed: 'Çar', thu: 'Per', fri: 'Cum', sat: 'Cmt', sun: 'Paz' };
            return labels[d] || d;
          }).join(', ')}</>
        )}
      </div>
    </div>
  </div>
)}
```

### Çok Dilli:
```tsx
const happyHourTranslations: Record<string, { discount: string }> = {
  tr: { discount: 'indirim' },
  en: { discount: 'off' },
  ar: { discount: 'خصم' },
  zh: { discount: '折扣' },
  de: { discount: 'Rabatt' },
  fr: { discount: 'réduction' },
  ru: { discount: 'скидка' },
};
```

---

## GÖREV 4: ADMIN PANEL — ÜRÜN LİSTESİNDE HAPPY HOUR GÖSTERGESİ

Ürün satırında (inline list'te) happy hour aktif olan ürünlerin yanına küçük gösterge:

```tsx
{item.happy_hour_active && (
  <span style={{
    fontSize: '10px',
    padding: '1px 6px',
    borderRadius: '4px',
    backgroundColor: '#fffbeb',
    color: '#f59e0b',
    fontWeight: 600,
    marginLeft: '6px',
  }}>
    HH
  </span>
)}
```

---

## YÜRÜTME SIRASI

1. **GÖREV 1** — DB migration (Supabase Dashboard'dan çalıştır — migration SQL'i dosyaya yaz)
2. **GÖREV 2** — Admin panel happy hour formu
3. **GÖREV 3** — Public menü happy hour gösterimi
4. **GÖREV 4** — Admin ürün listesinde HH göstergesi

Her görev sonrası `npm run build` çalıştır.

**NOT:** DB migration'ı Claude Code çalıştıramaz. SQL dosyasını oluşturup Supabase Dashboard'dan manuel çalıştırılacak.

---

## KONTROL LİSTESİ

### DB
- [ ] happy_hour_price, happy_hour_label, happy_hour_days, happy_hour_start_time, happy_hour_end_time, happy_hour_active kolonları eklendi
- [ ] İndeks oluşturuldu

### Admin Panel
- [ ] Happy Hour collapsible bölümü (CiDiscount1 ikonu)
- [ ] Aktif/Pasif toggle
- [ ] Etiket input (opsiyonel)
- [ ] İndirimli fiyat input (tek fiyat modu)
- [ ] Varyant indirimli fiyatları (varyant modu)
- [ ] Gün seçimi (Pzt-Paz butonları)
- [ ] Saat aralığı (time input)
- [ ] Gece yarısını geçen aralık desteği
- [ ] % indirim otomatik hesaplama gösterimi
- [ ] Kaydetme + yükleme çalışıyor

### Public Menü
- [ ] isHappyHourActive() fonksiyonu (gün + saat kontrolü)
- [ ] Gece yarısı geçiş desteği (22:00-02:00)
- [ ] Normal fiyat çizili + indirimli fiyat büyük
- [ ] % indirim gösterimi
- [ ] Happy Hour badge (amber renk, kart üzerinde)
- [ ] Detay modalda HH bilgi kutusu (saat + günler)
- [ ] Varyantlı ürünlerde her varyant için HH fiyat
- [ ] 3 tema uyumlu
- [ ] Çok dilli (en az TR/EN)

### Final
- [ ] npm run build başarılı
- [ ] git push origin main
