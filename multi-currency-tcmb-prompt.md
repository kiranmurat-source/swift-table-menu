# CLAUDE CODE PROMPT — Multi-Currency (TCMB Kuru)
## Döviz Kuru Sistemi + Public Menü Currency Seçici

---

## PROJE BAĞLAMI

Tabbled (tabbled.com) bir QR dijital menü SaaS platformu. React + Vite + TypeScript + shadcn/ui. Supabase PostgreSQL backend. Vercel deploy.

- **Repo:** /opt/khp/tabbled/
- **Supabase:** qmnrawqvkwehufebbkxp.supabase.co
- **Supabase project ref:** qmnrawqvkwehufebbkxp
- **İkon:** Phosphor Icons (@phosphor-icons/react) — Thin weight only
- **Font:** Roboto (Bold/Medium/Regular/Light)
- **Tema:** 2 tema (white + black)
- **Marka:** #FF4F7A (pembe), #1C1C1E (koyu), #F7F7F8 (açık)
- **Edge Functions deploy:** `supabase functions deploy FUNC_NAME --project-ref qmnrawqvkwehufebbkxp --no-verify-jwt`
- **Secrets:** `supabase secrets set KEY=value --project-ref qmnrawqvkwehufebbkxp`
- **Super admin ID:** 4834714f-4f6b-41c1-80ef-e21c34b8d207

---

## MEVCUT DURUM

- Fiyatlar TL (₺) olarak gösteriliyor, sabit
- `restaurants` tablosunda `feature_multi_currency` boolean DEFAULT false eklenecek
- Henüz `exchange_rates` tablosu yok
- Henüz `fetch-exchange-rates` Edge Function yok
- Admin profil tabında diğer feature toggle'lar zaten var (feature_waiter_calls, feature_cart, vs.)
- Public menüde dil seçici zaten var (splash + menü header'da dropdown)

---

## GÖREV

4 parçalı iş:
1. **DB:** `exchange_rates` tablosu oluştur
2. **Edge Function:** `fetch-exchange-rates` — TCMB XML'den kurları çek ve DB'ye yaz
3. **Admin:** `feature_multi_currency` toggle ekle
4. **Public Menü:** Currency seçici dropdown + fiyat çevirimi

---

## PARÇA 1: VERİTABANI

### SQL Migration (Supabase Dashboard'da çalıştırılacak — dosya olarak üret)

```sql
-- exchange_rates tablosu
CREATE TABLE IF NOT EXISTS exchange_rates (
  currency_code TEXT PRIMARY KEY,          -- 'USD', 'EUR', 'GBP' vb.
  currency_name_tr TEXT NOT NULL,          -- 'ABD Doları', 'Euro'
  currency_name_en TEXT NOT NULL,          -- 'US Dollar', 'Euro'
  rate NUMERIC(18,6) NOT NULL,             -- 1 birim = X TL (ForexSelling)
  unit INTEGER NOT NULL DEFAULT 1,         -- TCMB unit (JPY=100, diğerleri=1)
  flag_emoji TEXT,                         -- '🇺🇸', '🇪🇺' vb.
  symbol TEXT NOT NULL DEFAULT '',         -- '$', '€', '£'
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir (public menü için)
CREATE POLICY "exchange_rates_public_read"
  ON exchange_rates FOR SELECT
  USING (true);

-- Sadece service_role yazabilir (Edge Function)
-- (RLS bypass: Edge Function service_role key kullanıyor)

-- Feature toggle
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS feature_multi_currency BOOLEAN DEFAULT false;
```

### Para Birimleri (20 adet — TCMB'de mevcut)

| Kod | TR İsim | EN İsim | Sembol | Unit | Bayrak |
|-----|---------|---------|--------|------|--------|
| USD | ABD Doları | US Dollar | $ | 1 | 🇺🇸 |
| EUR | Euro | Euro | € | 1 | 🇪🇺 |
| GBP | İngiliz Sterlini | British Pound | £ | 1 | 🇬🇧 |
| CHF | İsviçre Frangı | Swiss Franc | CHF | 1 | 🇨🇭 |
| JPY | Japon Yeni | Japanese Yen | ¥ | 100 | 🇯🇵 |
| CAD | Kanada Doları | Canadian Dollar | C$ | 1 | 🇨🇦 |
| AUD | Avustralya Doları | Australian Dollar | A$ | 1 | 🇦🇺 |
| DKK | Danimarka Kronu | Danish Krone | kr | 1 | 🇩🇰 |
| SEK | İsveç Kronu | Swedish Krona | kr | 1 | 🇸🇪 |
| NOK | Norveç Kronu | Norwegian Krone | kr | 1 | 🇳🇴 |
| SAR | Suudi Riyali | Saudi Riyal | ﷼ | 1 | 🇸🇦 |
| KWD | Kuveyt Dinarı | Kuwaiti Dinar | د.ك | 1 | 🇰🇼 |
| RUB | Rus Rublesi | Russian Ruble | ₽ | 1 | 🇷🇺 |
| CNY | Çin Yuanı | Chinese Yuan | ¥ | 1 | 🇨🇳 |
| BGN | Bulgar Levası | Bulgarian Lev | лв | 1 | 🇧🇬 |
| RON | Rumen Leyi | Romanian Leu | lei | 1 | 🇷🇴 |
| IRR | İran Riyali | Iranian Rial | ﷼ | 1 | 🇮🇷 |
| PKR | Pakistan Rupisi | Pakistani Rupee | ₨ | 1 | 🇵🇰 |
| QAR | Katar Riyali | Qatari Riyal | ﷼ | 1 | 🇶🇦 |
| KRW | Güney Kore Wonu | South Korean Won | ₩ | 1 | 🇰🇷 |

---

## PARÇA 2: EDGE FUNCTION — fetch-exchange-rates

### Dosya: `supabase/functions/fetch-exchange-rates/index.ts`

**Mantık:**
1. TCMB XML'ini çek: `https://www.tcmb.gov.tr/kurlar/today.xml`
2. XML parse et (DOMParser veya regex)
3. Her para birimi için `ForexSelling` değerini al
4. `exchange_rates` tablosuna upsert et
5. Hata durumunda loglama

**TCMB XML formatı (örnek):**
```xml
<Tarih_Date Tarih="14.04.2026" Date="04/14/2026">
  <Currency CrossOrder="0" Kod="USD" CurrencyCode="USD">
    <Unit>1</Unit>
    <Isim>ABD DOLARI</Isim>
    <CurrencyName>US DOLLAR</CurrencyName>
    <ForexBuying>38.1234</ForexBuying>
    <ForexSelling>38.2567</ForexSelling>
    <BanknoteBuying>38.0100</BanknoteBuying>
    <BanknoteSelling>38.4500</BanknoteSelling>
    ...
  </Currency>
  ...
</Tarih_Date>
```

**Dikkat edilecekler:**
- TCMB XML'de ondalık ayracı nokta (.)
- Unit değeri bazı para birimlerinde 100 (JPY, KRW vb.)
- Rate hesaplaması: `ForexSelling / Unit` = 1 birim kaç TL
- Hafta sonu/resmi tatillerde TCMB veri yayınlamaz — bu durumda mevcut veriyi koru, hata fırlatma
- Edge Function `--no-verify-jwt` ile deploy edilecek (harici cron tetikleyecek)
- `SUPABASE_URL` ve `SUPABASE_SERVICE_ROLE_KEY` Deno.env'den alınacak (Supabase ortam değişkenleri, otomatik mevcut)

**Currency metadata (flag_emoji, symbol, name_tr, name_en):**
- Edge Function içinde sabit bir map olarak tanımla
- TCMB XML'den gelen `CurrencyCode` ile eşleştir
- TCMB'de olmayan para birimleri atla

**Deploy komutu:**
```bash
supabase functions deploy fetch-exchange-rates --project-ref qmnrawqvkwehufebbkxp --no-verify-jwt
```

**İlk çalıştırma (test):**
```bash
curl -X POST https://qmnrawqvkwehufebbkxp.supabase.co/functions/v1/fetch-exchange-rates
```

**Günlük tetikleme:**
- VPS'te cron job: `0 10 * * 1-5 curl -s -X POST https://qmnrawqvkwehufebbkxp.supabase.co/functions/v1/fetch-exchange-rates > /dev/null`
- Hafta içi saat 10:00'da (TCMB genelde 10:30'a kadar yayınlar, 10:00 yeterli — retry mekanizması ile)
- Alternatif: pg_cron (Supabase Pro plan gerektirir)

---

## PARÇA 3: ADMİN — Feature Toggle

### Dosya: Profil tabındaki mevcut feature toggle bölümü

- `feature_multi_currency` toggle ekle
- Label: "Çoklu Para Birimi" / "Multi Currency"
- Açıklama: "Menüde döviz kurları ile fiyat gösterimi"
- İkon: Phosphor `CurrencyCircleDollar` (Thin)
- Mevcut toggle pattern'ini takip et (switch + label + description)
- Toggle değişince `restaurants` tablosunda güncelle

---

## PARÇA 4: PUBLIC MENÜ — Currency Seçici

### Konum
- Menü header'da, dil seçicinin YANINDA (sağında)
- Küçük dropdown butonu

### Dropdown Tasarımı (Booking.com ilhamı)
- **Buton:** Seçili para birimi kodu gösterir: "₺ TRY" (varsayılan)
- **Açılınca:** Dropdown listesi
  - Her satır: Bayrak emoji + Para birimi kodu + İsim (dile göre TR/EN)
  - Örnek: "🇺🇸 USD — ABD Doları" veya "🇺🇸 USD — US Dollar"
  - TRY (₺) her zaman en üstte, sabit (Türk Lirası / Turkish Lira)
  - Diğerleri alfabetik sırada
- **Arama:** Dropdown'da arama input'u (para birimi adı veya kodunda ara)
- **Seçim sonrası:** Dropdown kapanır, tüm fiyatlar anlık güncellenir

### Fiyat Çevirimi
- **Formül:** `fiyat_tl / kur_rate = fiyat_döviz`
  - Örnek: 500 TL / 38.25 (USD kuru) = $13.07
- **Gösterim:** Seçilen para birimi sembolü + 2 ondalık
  - TRY: "500,00 ₺" (Türk formatı, virgül ondalık)
  - USD: "$13.07" (nokta ondalık, sembol önde)
  - EUR: "€12.15" (nokta ondalık, sembol önde)
  - GBP: "£10.42"
- **Varyant fiyatları:** Aynı mantık — her varyant fiyatı çevrilir
- **"...den başlayan" text:** Çevrilen minimum fiyatla gösterilir
- **Happy hour fiyatları:** Hem normal hem indirimli fiyat çevrilir

### Sepet + WhatsApp Sipariş
- **Sepette:** Seçilen para biriminde fiyat GÖSTERİLİR (bilgi amaçlı)
- **AMA** WhatsApp mesajında orijinal TL fiyatlar kullanılır
- Sepet alt toplamında küçük not: "* Fiyatlar TCMB günlük kuru ile hesaplanmıştır" (çok dilli)
- İndirim kodu hesaplaması TL üzerinden yapılır, sonuç çevrilerek gösterilir

### Disclaimer
- Menü alt kısmında veya currency seçici yanında küçük metin:
  - TR: "Fiyatlar TCMB günlük kuru ile tahminidir"
  - EN: "Prices are estimated using daily TCMB exchange rates"
- Muted renk, 11px font

### localStorage
- Seçilen para birimi `localStorage.setItem('tabbled_currency', 'USD')` ile kaydedilir
- Sayfa açılışında okunur, varsayılan TRY
- TRY seçiliyse çevirim yapılmaz (orijinal fiyatlar)

### Data Fetching
- Public menü açılışında `exchange_rates` tablosundan tüm kurları çek
- Supabase query: `supabase.from('exchange_rates').select('*')`
- State'de tut: `exchangeRates: Record<string, ExchangeRate>`
- Kur verisi yoksa (tablo boş veya hata): currency seçici gizlenir, sadece TRY gösterilir

### Feature Toggle Kontrolü
- `restaurant.feature_multi_currency === true` ise currency seçici görünür
- `false` ise hiçbir şey gösterme, tüm fiyatlar TRY

---

## DOSYA YAPISI

```
Yeni dosyalar:
- supabase/functions/fetch-exchange-rates/index.ts
- src/hooks/useCurrency.ts (currency state + conversion helper)
- migration-exchange-rates.sql (SQL dosyası — Supabase Dashboard'da çalıştırılacak)

Değişecek dosyalar:
- PublicMenu.tsx (currency seçici + fiyat çevirimi)
- Profil tabı (feature toggle)
- Sepet/WhatsApp bileşenleri (TL korunması + disclaimer)
```

---

## GENEL KURALLAR

1. **DB migration'ı SQL dosyası olarak üret** — Claude Code `apply_migration` kullanma, Murat Supabase Dashboard'dan çalıştıracak
2. **Edge Function'ı dosya olarak yaz**, deploy komutunu çıktıya yaz
3. **Phosphor Icons Thin weight** — CurrencyCircleDollar vb.
4. **Emoji ikon YASAK** (flag_emoji'ler veri olarak OK, UI ikonu olarak emoji kullanma)
5. **shadcn/ui internal Lucide'a dokunma**
6. **4-nokta spacing sistemi**
7. **TypeScript strict** — any kullanma
8. **console.log temizle** — production'da log bırakma
9. **Mevcut code pattern'lerini takip et** — useAuth, useQuery, toast pattern'leri
10. **Tema uyumu** — white ve black temalarda doğru görünecek

---

## TEST CHECKLIST

### DB
- [ ] exchange_rates tablosu oluştu
- [ ] RLS: public read aktif
- [ ] restaurants.feature_multi_currency kolonu eklendi

### Edge Function
- [ ] fetch-exchange-rates deploy edildi
- [ ] curl ile tetiklendiğinde TCMB'den veri çekiyor
- [ ] exchange_rates tablosuna 20 para birimi yazılıyor
- [ ] Rate, unit, symbol, flag_emoji doğru
- [ ] Tekrar çalıştırılınca upsert (duplicate hata yok)
- [ ] TCMB erişilemezse hata loglama (crash yok)

### Admin
- [ ] Profil tabında "Çoklu Para Birimi" toggle görünüyor
- [ ] Toggle çalışıyor (DB'ye kaydediyor)

### Public Menü
- [ ] feature_multi_currency=true ise currency seçici görünüyor
- [ ] feature_multi_currency=false ise gizli
- [ ] TRY seçiliyse orijinal fiyatlar (çevirim yok)
- [ ] USD seçilince tüm fiyatlar dolar olarak gösteriliyor
- [ ] EUR seçilince tüm fiyatlar euro olarak gösteriliyor
- [ ] Varyant fiyatları da çevriliyor
- [ ] Happy hour fiyatları da çevriliyor
- [ ] "...den başlayan" çevrilen minimum fiyatla
- [ ] Sepette fiyatlar çevrilmiş gösteriliyor
- [ ] WhatsApp mesajında orijinal TL fiyatlar
- [ ] Disclaimer metni görünüyor
- [ ] localStorage ile seçim hatırlanıyor
- [ ] Kur verisi yoksa seçici gizleniyor
- [ ] Arama çalışıyor (dropdown'da)
- [ ] White tema doğru
- [ ] Black tema doğru
- [ ] Mobilde responsive
- [ ] npm run build hatasız

---

## ÖNCELİK SIRASI

1. SQL migration dosyası oluştur
2. Edge Function yaz + deploy komutu
3. Admin feature toggle ekle
4. useCurrency hook yaz
5. Public menü currency seçici UI
6. Fiyat çevirimi (kartlar + detay modal + varyantlar)
7. Sepet + WhatsApp TL korunması
8. Disclaimer ekleme
9. localStorage persist
10. Tema uyumu kontrolü
11. Build test
