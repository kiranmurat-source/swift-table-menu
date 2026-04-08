# TABBLED — ÇEVİRİ MERKEZİ (Translation Center)
## Claude Code Prompt — 10 Nisan 2026

---

## GENEL BAKIŞ

Restoran sahiplerinin menülerini sınırsız dile çevirebileceği bir Çeviri Merkezi oluşturulacak. FineDine'ın çeviri merkezi referans alınacak. Google Translate API ile auto-translate desteği olacak.

**Kapsam:**
- Ürün adı + açıklama çevirisi
- Kategori adı çevirisi
- Restoran sahibi kendi panelinden yönetir (RestaurantDashboard'a yeni tab)
- Tüm planlara sınırsız dil
- Google Translate API (Cloud Translation v2) ile auto-translate

**Referans:** FineDine Çeviri Merkezi — sol tarafta kategori/ürün ağacı, sağda dil kolonları, her kolonda auto-translate butonu, çeviri yüzdesi gösterimi, "Dil Ekle" butonu.

---

## ADIM 1: VERİTABANI DEĞİŞİKLİKLERİ

### 1.1 restaurants tablosuna enabled_languages kolonu

```sql
ALTER TABLE restaurants
ADD COLUMN enabled_languages text[] DEFAULT ARRAY['tr']::text[];
```

Bu kolon restoranın aktif dillerini tutar. Varsayılan sadece 'tr'. Restoran sahibi dil eklediğinde buraya eklenir.

### 1.2 menu_items tablosuna translations kolonu

```sql
ALTER TABLE menu_items
ADD COLUMN translations jsonb DEFAULT '{}'::jsonb;
```

Yapı:
```json
{
  "fr": { "name": "Assiette déjeuner turque", "description": "Œufs durs, tomates..." },
  "de": { "name": "Türkisches Frühstück", "description": "Hartgekochte Eier..." },
  "ar": { "name": "طبق الإفطار التركي", "description": "بيض مسلوق..." }
}
```

### 1.3 menu_categories tablosuna translations kolonu

```sql
ALTER TABLE menu_categories
ADD COLUMN translations jsonb DEFAULT '{}'::jsonb;
```

Yapı:
```json
{
  "fr": { "name": "Petit-déjeuner" },
  "de": { "name": "Frühstück" },
  "ar": { "name": "فطور" }
}
```

### 1.4 RLS Policy'leri

Mevcut RLS policy'leri zaten yeterli — menu_items ve menu_categories'e SELECT/UPDATE/INSERT/DELETE policy'leri mevcut. Yeni kolonlar otomatik olarak bu policy'lere dahil olur. Ek policy gerekmez.

---

## ADIM 2: SUPABASE EDGE FUNCTION — translate-menu

### 2.1 Dosya: supabase/functions/translate-menu/index.ts

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const GOOGLE_TRANSLATE_API_KEY = Deno.env.get('GOOGLE_TRANSLATE_API_KEY')

interface TranslateRequest {
  texts: { id: string; text: string; field: string }[]
  targetLang: string
  sourceLang?: string // default 'tr'
  type: 'item' | 'category'
}

async function translateText(text: string, targetLang: string, sourceLang: string = 'tr'): Promise<string> {
  if (!text || text.trim() === '') return ''
  
  const url = `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_TRANSLATE_API_KEY}`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: text,
      source: sourceLang,
      target: targetLang,
      format: 'text'
    })
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Google Translate API error: ${error}`)
  }
  
  const data = await response.json()
  return data.data.translations[0].translatedText
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // JWT doğrulama
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Kullanıcı doğrulama
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Kullanıcının restoran_id'sini al
    const { data: profile } = await supabase
      .from('profiles')
      .select('restaurant_id, role')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.restaurant_id) {
      return new Response(JSON.stringify({ error: 'No restaurant found' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { texts, targetLang, sourceLang = 'tr', type } = await req.json() as TranslateRequest

    if (!texts || !targetLang || !type) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Toplu çeviri
    const results: { id: string; translations: Record<string, string> }[] = []

    for (const item of texts) {
      const translated = await translateText(item.text, targetLang, sourceLang)
      
      // Mevcut kaydın translations'ını al
      const table = type === 'item' ? 'menu_items' : 'menu_categories'
      const { data: existing } = await supabase
        .from(table)
        .select('translations')
        .eq('id', item.id)
        .eq('restaurant_id', profile.restaurant_id)
        .single()

      const currentTranslations = existing?.translations || {}
      const langTranslations = currentTranslations[targetLang] || {}
      langTranslations[item.field] = translated
      currentTranslations[targetLang] = langTranslations

      // DB güncelle
      const { error: updateError } = await supabase
        .from(table)
        .update({ translations: currentTranslations })
        .eq('id', item.id)
        .eq('restaurant_id', profile.restaurant_id)

      if (updateError) {
        console.error(`Error updating ${item.id}:`, updateError)
      }

      results.push({ id: item.id, translations: currentTranslations })
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Translation error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
```

### 2.2 Edge Function Deploy

```bash
# Supabase CLI ile deploy
supabase functions deploy translate-menu --project-ref qmnrawqvkwehufebbkxp

# Google Translate API key'i secret olarak ekle
supabase secrets set GOOGLE_TRANSLATE_API_KEY=YOUR_GOOGLE_API_KEY --project-ref qmnrawqvkwehufebbkxp
```

**NOT:** Google Cloud Console'dan Cloud Translation API'yi aktif et ve API key oluştur. Murat'ın bunu yapması gerekecek.

---

## ADIM 3: DİL TANIMLARI

### 3.1 Dosya: src/lib/languages.ts (YENİ DOSYA)

```typescript
export interface Language {
  code: string
  name: string        // İngilizce isim
  nativeName: string  // Kendi dilinde isim
  dir: 'ltr' | 'rtl'  // Yazım yönü
  flag: string        // Emoji bayrak (opsiyonel, dekoratif)
}

export const AVAILABLE_LANGUAGES: Language[] = [
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', dir: 'ltr', flag: '🇹🇷' },
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr', flag: '🇬🇧' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl', flag: '🇸🇦' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', dir: 'ltr', flag: '🇩🇪' },
  { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr', flag: '🇫🇷' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr', flag: '🇪🇸' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', dir: 'ltr', flag: '🇮🇹' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', dir: 'ltr', flag: '🇷🇺' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', dir: 'ltr', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', dir: 'ltr', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', dir: 'ltr', flag: '🇰🇷' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', dir: 'ltr', flag: '🇵🇹' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', dir: 'ltr', flag: '🇳🇱' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', dir: 'ltr', flag: '🇵🇱' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', dir: 'ltr', flag: '🇺🇦' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', dir: 'rtl', flag: '🇮🇷' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', dir: 'rtl', flag: '🇮🇱' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr', flag: '🇮🇳' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', dir: 'ltr', flag: '🇹🇭' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', dir: 'ltr', flag: '🇻🇳' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', dir: 'ltr', flag: '🇬🇷' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', dir: 'ltr', flag: '🇷🇴' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', dir: 'ltr', flag: '🇸🇪' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', dir: 'ltr', flag: '🇳🇴' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', dir: 'ltr', flag: '🇩🇰' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', dir: 'ltr', flag: '🇫🇮' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', dir: 'ltr', flag: '🇭🇺' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', dir: 'ltr', flag: '🇨🇿' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български', dir: 'ltr', flag: '🇧🇬' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', dir: 'ltr', flag: '🇭🇷' },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски', dir: 'ltr', flag: '🇷🇸' },
  { code: 'ka', name: 'Georgian', nativeName: 'ქართული', dir: 'ltr', flag: '🇬🇪' },
  { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycan', dir: 'ltr', flag: '🇦🇿' },
  { code: 'ku', name: 'Kurdish', nativeName: 'Kurdî', dir: 'ltr', flag: '🏳️' },
]

// Dil kodundan Language objesi bul
export function getLanguage(code: string): Language | undefined {
  return AVAILABLE_LANGUAGES.find(l => l.code === code)
}

// Dil kodundan native isim al
export function getLanguageName(code: string): string {
  return getLanguage(code)?.nativeName || code.toUpperCase()
}

// Çeviri yüzdesini hesapla
export function calculateTranslationProgress(
  items: { translations?: Record<string, Record<string, string>>; name_tr?: string; description_tr?: string }[],
  categories: { translations?: Record<string, Record<string, string>>; name_tr?: string }[],
  langCode: string
): number {
  if (langCode === 'tr') return 100
  
  let total = 0
  let translated = 0

  // Ürünler: name + description = 2 alan
  for (const item of items) {
    total += 2 // name + description
    if (langCode === 'en') {
      // name_en ve description_en (mevcut kolonlar) kontrol et
      // Bu kontrol component tarafında yapılacak çünkü burada sadece translations JSONB var
    }
    const t = item.translations?.[langCode]
    if (t?.name && t.name.trim() !== '') translated++
    if (t?.description && t.description.trim() !== '') translated++
  }

  // Kategoriler: name = 1 alan
  for (const cat of categories) {
    total += 1
    const t = cat.translations?.[langCode]
    if (t?.name && t.name.trim() !== '') translated++
  }

  if (total === 0) return 100
  return Math.round((translated / total) * 100)
}
```

---

## ADIM 4: ÇEVİRİ MERKEZİ BİLEŞENİ

### 4.1 Dosya: src/components/TranslationCenter.tsx (YENİ DOSYA)

Bu bileşen RestaurantDashboard'a yeni tab olarak eklenecek.

```
Bileşen yapısı:

┌──────────────────────────────────────────────────────────────────┐
│  Çeviri Merkezi                                                  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 🇹🇷 Türkçe (%100) │ 🇬🇧 English (%49) │ 🇫🇷 Français (%0) │ + Dil Ekle │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  [ ] Sadece çevrilmemiş                                         │
│                                                                  │
│  ┌────────────┬──────────────────────┬──────────────────────────┐│
│  │ Menü Ağacı │     Türkçe (kaynak)  │   English (hedef)       ││
│  │            │                      │                          ││
│  │ ▼ Kahvaltı │  name                │  name           [🔄 AI] ││
│  │   Ürün 1   │  Türk Kahvaltı      │  Turkish Breakfast      ││
│  │   Ürün 2   │                      │                          ││
│  │ ▼ Çorbalar │  description         │  description    [🔄 AI] ││
│  │   Ürün 3   │  Haşlanmış yumurta...│  Boiled eggs...         ││
│  │            │                      │                          ││
│  │            │                      │  [💾 Kaydet]             ││
│  └────────────┴──────────────────────┴──────────────────────────┘│
│                                                                  │
│  [🔄 Tümünü Otomatik Çevir]              [→ Sonraki Öğe]        │
└──────────────────────────────────────────────────────────────────┘
```

**Bileşen gereksinimleri:**

1. **Üst bar — Dil tab'ları:**
   - `restaurants.enabled_languages` array'inden gelen diller
   - Her dilin yanında çeviri yüzdesi (yeşil badge: %100, sarı: %50+, kırmızı: <%50)
   - Türkçe her zaman ilk, readonly (kaynak dil)
   - "+ Dil Ekle" butonu → dropdown ile AVAILABLE_LANGUAGES'dan seçim
   - Dil silme butonu (x ikonu, Türkçe silinemez)

2. **Filtre:**
   - "Sadece çevrilmemiş" checkbox — sadece çevirisi eksik öğeleri gösterir

3. **Sol panel — Menü ağacı:**
   - Kategoriler ana düğüm (▼ açılır/kapanır)
   - Her kategorinin altında ürünler
   - Tıklanan öğe sağ panelde açılır
   - Çevirisi eksik öğelerin yanında 🔴 kırmızı dot
   - Çevirisi tam olan öğelerin yanında 🟢 yeşil dot

4. **Sağ panel — Çeviri alanı (iki kolon):**
   - Sol kolon: Türkçe (kaynak) — readonly, gri arka plan
     - Kategori seçiliyse: sadece `name` alanı
     - Ürün seçiliyse: `name` + `description` alanları
   - Sağ kolon: Hedef dil — düzenlenebilir input/textarea
     - Her alanın yanında 🔄 auto-translate butonu (tek alan çevir)
     - Boş alanlar sarı arka plan (dikkat çekmek için)
   - "Kaydet" butonu — değişiklikleri DB'ye yazar

5. **Alt bar:**
   - "Tümünü Otomatik Çevir" butonu — seçili dil için TÜM ürün ve kategorilerin çevirisini yapar
   - Loading state: "Çevriliyor... (12/50)" progress gösterimi
   - "Sonraki Öğe" / "Önceki Öğe" navigasyon butonları

6. **Mevcut name_en ile entegrasyon:**
   - İngilizce (en) seçildiğinde:
     - Eğer `name_en` / `description_en` doluysa → onları göster ve düzenlenebilir yap
     - Eğer boşsa → `translations.en.name` / `translations.en.description` kontrol et
   - İngilizce kayıt: Hem `name_en`/`description_en` kolonlarını hem `translations.en` JSONB'yi güncelle (senkron tut)
   - Diğer diller: Sadece `translations` JSONB'den oku/yaz

7. **Stil:**
   - Font: Playfair Display başlıklar, Inter body
   - İkon: Circum Icons (CiGlobe, CiSearch, CiCircleCheck, CiCircleRemove, CiFilter)
   - shadcn/ui bileşenleri: Card, Button, Input, Textarea, Badge, Select, Checkbox, Tabs
   - RTL diller için sağ panelde `dir="rtl"` ve `text-align: right`

---

## ADIM 5: RestaurantDashboard'a TAB EKLEME

### 5.1 RestaurantDashboard.tsx değişiklikleri

Mevcut tab yapısı: "Menü" | "QR Kodları" | "Promosyonlar" | "Profil"

Yeni tab ekle: "Menü" | "Çeviri Merkezi" | "QR Kodları" | "Promosyonlar" | "Profil"

```typescript
// Import ekle
import TranslationCenter from '@/components/TranslationCenter'

// Tab listesine ekle (Menü'den hemen sonra)
// CiGlobe ikonu kullan
```

---

## ADIM 6: PUBLIC MENÜ GÜNCELLEME

### 6.1 PublicMenu.tsx değişiklikleri

Mevcut durum: Dil seçici var, TR/EN/AR/ZH destekliyor. `name_tr` / `name_en` kullanıyor.

Güncellenecek:
1. Dil seçicideki diller `restaurants.enabled_languages` array'inden gelecek
2. Seçilen dil için metin gösterimi:
   - `tr` → `name_tr` / `description_tr` (mevcut)
   - `en` → Önce `name_en` kontrol et, boşsa `translations.en.name` (mevcut name_en backward compat)
   - Diğer diller → `translations[lang].name` / `translations[lang].description`
   - Fallback: Çeviri yoksa Türkçe göster

3. Kategori isimleri aynı mantık:
   - `tr` → `name_tr`
   - `en` → Önce `name_en`, boşsa `translations.en.name`
   - Diğer → `translations[lang].name`
   - Fallback: Türkçe

4. RTL dil seçildiğinde tüm menü `dir="rtl"` olacak

5. Mevcut hardcoded dil listesi (TR/EN/AR/ZH) kaldırılacak → `enabled_languages` array'inden dinamik

### 6.2 Helper fonksiyon (src/lib/languages.ts'e ekle)

```typescript
// Ürün veya kategori için çevrilmiş metin al
export function getTranslatedText(
  item: { 
    name_tr?: string; name_en?: string; 
    description_tr?: string; description_en?: string;
    translations?: Record<string, Record<string, string>> 
  },
  field: 'name' | 'description',
  lang: string
): string {
  // Türkçe
  if (lang === 'tr') {
    return item[`${field}_tr` as keyof typeof item] as string || ''
  }
  
  // İngilizce — önce mevcut kolon, sonra translations
  if (lang === 'en') {
    const existing = item[`${field}_en` as keyof typeof item] as string
    if (existing && existing.trim() !== '') return existing
  }
  
  // translations JSONB'den
  const translated = item.translations?.[lang]?.[field]
  if (translated && translated.trim() !== '') return translated
  
  // Fallback: Türkçe
  return item[`${field}_tr` as keyof typeof item] as string || ''
}
```

---

## ADIM 7: SUPABASE SORGU GÜNCELLEMELERİ

### 7.1 Mevcut sorgulara translations kolonu ekle

PublicMenu.tsx'teki sorgular `translations` kolonunu da çekmeli:

```typescript
// menu_items sorgusu
.select('*, translations')

// menu_categories sorgusu  
.select('*, translations')
```

Eğer mevcut select `*` kullanıyorsa zaten otomatik gelir, değişiklik gerekmez.

### 7.2 restaurants sorgusuna enabled_languages ekle

```typescript
// PublicMenu'deki restoran sorgusu
.select('*, enabled_languages')
```

---

## ADIM 8: DİL SEÇİCİ GÜNCELLEMESİ

### 8.1 PublicMenu dil seçici

Mevcut hardcoded dil listesi:
```typescript
const languages = ['tr', 'en', 'ar', 'zh']
```

Yeni dinamik:
```typescript
const languages = restaurant?.enabled_languages || ['tr']
```

Dil seçici butonlarında bayrak emoji + native isim göster:
```typescript
import { getLanguage } from '@/lib/languages'

// Her buton:
{languages.map(code => {
  const lang = getLanguage(code)
  return (
    <button key={code} onClick={() => setSelectedLang(code)}>
      {lang?.flag} {lang?.nativeName}
    </button>
  )
})}
```

---

## ÖNEMLİ NOTLAR

### Mevcut name_en backward compatibility
- name_en / description_en kolonları SİLİNMEYECEK
- İngilizce çeviriler hem name_en hem translations.en'e yazılacak
- Okurken önce name_en kontrol edilir (eski veriler korunur)

### Google Translate API Key
- Murat'ın Google Cloud Console'dan Cloud Translation API'yi aktif etmesi gerekiyor
- API key oluşturup Supabase secret'a eklemesi gerekiyor
- Edge function API key olmadan çalışmaz — UI'da "API key ayarlanmadı" uyarısı gösterilebilir

### Performans
- Auto-translate toplu yapılacak — tek tek API çağrısı yerine batch
- Google Translate API: istek başına 30.000 karakter limiti var
- Büyük menülerde (100+ ürün) progress gösterimi gerekli
- Çeviriler cache'lenir (DB'ye yazılır), her görüntülemede tekrar çevrilmez

### Edge Function Rate Limiting
- Google Translate free tier: 500K karakter/ay
- Aşım durumunda kullanıcıya uyarı göster
- İleride Supabase'de karakter sayacı tutulabilir

### Circum Icons kullanımı
- CiGlobe → Çeviri Merkezi tab ikonu
- CiSearch → Menü ağacında arama
- CiCircleCheck → Çevirisi tam öğe
- CiCircleRemove → Dil silme
- CiFilter → Filtre
- CiTranslate yok → CiGlobe kullan
- shadcn/ui internal Lucide ikonlarına DOKUNMA

### Font
- Başlıklar: Playfair Display 700
- Body: Inter 400
- Muted: Inter 300

### Test senaryoları
1. Yeni dil ekle (Fransızca) → enabled_languages güncellenir
2. Tek ürün auto-translate → translations JSONB güncellenir
3. Tümünü çevir → tüm ürün + kategoriler çevrilir, progress gösterilir
4. Manuel çeviri düzenle → kaydet tıkla → DB güncellenir
5. İngilizce çeviri → hem name_en hem translations.en güncellenir
6. Public menü Fransızca seç → translations.fr'den çeker
7. Çevirisi olmayan ürün → Türkçe fallback gösterir
8. RTL dil (Arapça) → dir="rtl" uygulanır
9. Dil sil → enabled_languages'dan çıkar (translations verisi silinmez)
10. Untranslated filtre → sadece eksik çevirileri göster

---

## DOSYA LİSTESİ (oluşturulacak/düzenlenecek)

### Yeni dosyalar:
- `src/lib/languages.ts`
- `src/components/TranslationCenter.tsx`
- `supabase/functions/translate-menu/index.ts`

### Düzenlenecek dosyalar:
- `src/pages/RestaurantDashboard.tsx` (yeni tab ekleme)
- `src/pages/PublicMenu.tsx` (dinamik dil seçici, translations okuma)

### DB migration:
- `restaurants.enabled_languages` text[] DEFAULT ARRAY['tr']
- `menu_items.translations` jsonb DEFAULT '{}'
- `menu_categories.translations` jsonb DEFAULT '{}'

---

## ÇALIŞTIRMA SIRASI

1. DB migration'ları çalıştır (SQL)
2. `src/lib/languages.ts` oluştur
3. `src/components/TranslationCenter.tsx` oluştur
4. `RestaurantDashboard.tsx` düzenle (tab ekle)
5. `PublicMenu.tsx` düzenle (dinamik dil, translations okuma)
6. Edge function oluştur ve deploy et
7. npm run build && test
8. git push
