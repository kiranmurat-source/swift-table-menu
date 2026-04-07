# CLAUDE CODE PROMPT — 9 Nisan 2026, Görev 4
# Eski Allerjen Key Migration

## PROJE BAĞLAMI
- Repo: /opt/khp/tabbled/ (git repo root)
- Stack: React + Vite + TypeScript + shadcn/ui
- DB: Supabase PostgreSQL (qmnrawqvkwehufebbkxp.supabase.co)
- Allerjen sistemi:
  - `src/lib/allergens.ts` → ALLERGEN_LIST (31 allerjen tanımı, her birinin key/label/icon bilgisi)
  - `src/components/AllergenIcon.tsx` → AllergenIcon + AllergenBadgeList bileşenleri
  - SVG ikonlar: `public/allergens/` klasöründe 33 SVG dosyası
- DB: `menu_items.allergens` → text[] (allerjen key'lerinin string array'i)
- Super admin: kiran.murat@gmail.com
- Deploy: git push origin main → Vercel otomatik deploy

---

## SORUN
7 Nisan'da allerjen sistemi yenilendi — 33 SVG ikon + yeni key yapısı (`src/lib/allergens.ts` içinde ALLERGEN_LIST) oluşturuldu. Ancak DB'deki mevcut `menu_items` kayıtlarında ESKİ allerjen key'leri var. Bu eski key'ler yeni ALLERGEN_LIST'teki key'lerle eşleşmiyor, dolayısıyla:
- Public menüde bazı ürünlerin allerjen ikonları görünmüyor
- Admin panelde bazı ürünlerin alerjen seçimleri kayıp görünüyor

---

## YAPILACAKLAR

### Adım 1: Mevcut Allerjen Key Yapısını Anla

Önce yeni sistemdeki key'leri oku:
```bash
cat src/lib/allergens.ts
```

Sonra DB'deki mevcut ürünlerin allerjen verilerini kontrol et:
```bash
# Supabase'e doğrudan SQL çalıştırmak için npx kullanılabilir
# veya mevcut supabase client ile bir script yazılabilir

# Önce DB'deki benzersiz allerjen key'lerini bul
cat << 'SCRIPT' > /tmp/check-allergens.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qmnrawqvkwehufebbkxp.supabase.co',
  // anon key'i .env dosyasından al
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function checkAllergens() {
  const { data, error } = await supabase
    .from('menu_items')
    .select('id, name_tr, allergens')
    .not('allergens', 'is', null);
  
  if (error) { console.error(error); return; }
  
  // Benzersiz key'leri topla
  const allKeys = new Set();
  data?.forEach(item => {
    item.allergens?.forEach(key => allKeys.add(key));
  });
  
  console.log('DB\'deki benzersiz allerjen key\'leri:', [...allKeys].sort());
  console.log('Toplam ürün (allerjen bilgisi olan):', data?.length);
}

checkAllergens();
SCRIPT
```

**ALTERNATİF (daha basit):** Supabase Dashboard'dan SQL çalıştır veya curl ile:
```bash
# .env dosyasındaki key'leri oku
source .env 2>/dev/null || source .env.local 2>/dev/null

# Eğer VITE_SUPABASE_ANON_KEY varsa
echo "Anon key: ${VITE_SUPABASE_ANON_KEY:0:20}..."
```

### Adım 2: Key Mapping Tablosu Oluştur

`src/lib/allergens.ts` dosyasındaki ALLERGEN_LIST'i oku ve yeni key'leri listele. Sonra DB'deki eski key'lerle karşılaştır.

Muhtemel eski key → yeni key eşleştirmeleri (dosyayı okuduktan sonra kesin listeyi oluştur):

```typescript
// Olası mapping — ALLERGEN_LIST'i okuduktan sonra doğrula ve güncelle
const ALLERGEN_KEY_MIGRATION: Record<string, string> = {
  // Eski key → Yeni key
  // Örnekler (gerçek key'ler dosyadan belirlenecek):
  'gluten': 'gluten',           // aynı kalabilir
  'dairy': 'dairy',             // aynı kalabilir
  'milk': 'dairy',              // eski "milk" → yeni "dairy" olabilir
  'nuts': 'tree_nuts',          // eski "nuts" → yeni "tree_nuts" olabilir
  'peanuts': 'peanut',          // çoğul → tekil
  'shellfish': 'crustacean',    // isim değişikliği
  'fish': 'fish',               // aynı
  'soy': 'soy',                 // aynı
  'eggs': 'egg',                // çoğul → tekil
  'wheat': 'wheat',             // aynı
  'sesame': 'sesame',           // aynı
  'sulfites': 'sulphite',       // yazım farkı
  'mustard': 'mustard',         // aynı
  'celery': 'celery',           // aynı
  'lupin': 'lupin',             // aynı
  'molluscs': 'mollusc',        // çoğul → tekil
  // ... diğerleri dosyadan belirlenecek
};
```

**ÖNEMLİ:** Bu mapping'i oluşturmak için:
1. `src/lib/allergens.ts`'deki ALLERGEN_LIST'in tüm key'lerini listele
2. DB'deki tüm benzersiz allerjen key'lerini listele
3. Eşleşmeyenleri bul
4. Her eşleşmeyen eski key için doğru yeni key'i belirle

### Adım 3: Migration Script Yaz ve Çalıştır

```typescript
// migration-allergens.ts veya doğrudan bir Node script
// Bu script'i bir kez çalıştır, sonra sil

const MIGRATION_MAP: Record<string, string> = {
  // Adım 2'de belirlenen mapping buraya
};

async function migrateAllergens() {
  // 1. Allerjen bilgisi olan tüm ürünleri çek
  const { data: items, error } = await supabase
    .from('menu_items')
    .select('id, allergens')
    .not('allergens', 'is', null);
  
  if (error || !items) { console.error(error); return; }
  
  let updatedCount = 0;
  
  for (const item of items) {
    if (!item.allergens || item.allergens.length === 0) continue;
    
    const newAllergens = item.allergens.map(key => {
      return MIGRATION_MAP[key] || key; // mapping varsa dönüştür, yoksa aynı bırak
    });
    
    // Duplicate'ları temizle
    const uniqueAllergens = [...new Set(newAllergens)];
    
    // Değişiklik varsa güncelle
    const changed = JSON.stringify(item.allergens.sort()) !== JSON.stringify(uniqueAllergens.sort());
    
    if (changed) {
      const { error: updateError } = await supabase
        .from('menu_items')
        .update({ allergens: uniqueAllergens })
        .eq('id', item.id);
      
      if (updateError) {
        console.error(`Hata (${item.id}):`, updateError);
      } else {
        updatedCount++;
        console.log(`Güncellendi: ${item.id} | ${item.allergens} → ${uniqueAllergens}`);
      }
    }
  }
  
  console.log(`\nToplam güncellenen: ${updatedCount} ürün`);
}
```

### Adım 4: Script'i Çalıştır

Bu script'i çalıştırmanın en pratik yolu:

**Seçenek A — Geçici bir .mjs dosyası ile:**
```bash
# Supabase client import'u için
cat > /tmp/migrate-allergens.mjs << 'EOF'
import { createClient } from '@supabase/supabase-js';

// .env'den al
const SUPABASE_URL = 'https://qmnrawqvkwehufebbkxp.supabase.co';
const SUPABASE_KEY = '...'; // .env dosyasından VITE_SUPABASE_ANON_KEY'i kopyala

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Migration map'i src/lib/allergens.ts'i okuduktan sonra doldur
const MIGRATION_MAP = {
  // eski_key: 'yeni_key',
};

// ... (yukarıdaki migrateAllergens fonksiyonu)
EOF

node /tmp/migrate-allergens.mjs
```

**Seçenek B — Supabase SQL ile (daha güvenli):**
```sql
-- Eğer eski key'ler belirli ise SQL ile toplu değiştir
-- Örnek: 'milk' → 'dairy'
UPDATE menu_items 
SET allergens = array_replace(allergens, 'milk', 'dairy')
WHERE 'milk' = ANY(allergens);

-- Veya tüm eski key'ler için tek tek:
UPDATE menu_items SET allergens = array_replace(allergens, 'eski_key1', 'yeni_key1') WHERE 'eski_key1' = ANY(allergens);
UPDATE menu_items SET allergens = array_replace(allergens, 'eski_key2', 'yeni_key2') WHERE 'eski_key2' = ANY(allergens);
-- vs.
```

**ÖNEMLİ:** Hangi yöntemi kullanırsan kullan, önce mevcut veriyi YEDEKLE:
```sql
-- Yedek tablo oluştur
CREATE TABLE menu_items_allergen_backup AS 
SELECT id, allergens FROM menu_items WHERE allergens IS NOT NULL;
```

### Adım 5: Doğrulama

Migration sonrası kontrol:
```bash
# DB'de artık eski key kalmamalı
# Tüm key'ler src/lib/allergens.ts'deki ALLERGEN_LIST ile eşleşmeli
```

- Admin panelde ürünleri kontrol et — allerjen seçimleri doğru görünüyor mu?
- Public menüde ürün kartlarında allerjen ikonları doğru gösteriliyor mu?
- Filtreleme çalışıyor mu? (allerjen exclude filtresi)

---

## DOKUNMA KURALLARI

1. **ALLERGEN_LIST yapısını değiştirme** — sadece DB'deki eski key'leri yeni key'lere çevir
2. **AllergenIcon bileşenini değiştirme**
3. **SVG dosyalarını değiştirme**
4. **Yedek almadan migration çalıştırma**
5. Migration script'ini repoya commit etme (geçici dosya, çalıştır ve sil)

---

## OLASI EDGE CASE'LER

1. **Eski key yeni listede zaten varsa** → değiştirme, olduğu gibi bırak
2. **Bir ürünün allergens array'i boşsa veya null ise** → atla
3. **Migration sonrası duplicate key oluşursa** → Set ile unique yap
4. **DB'de hiç eski key yoksa** → migration gerekmiyor, sadece doğrula ve raporla

---

## GIT COMMIT
```bash
# Eğer kod değişikliği yoksa (sadece DB migration) commit gerekmez
# Eğer bir fallback/uyumluluk kodu eklendiyse:
git add -A && git commit -m "fix: migrate legacy allergen keys to new SVG system" && git push origin main
```
