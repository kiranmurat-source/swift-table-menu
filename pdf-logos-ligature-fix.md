# Aşama 3B-1.5 — PDF Logo Entegrasyonu + Ligature Fix

## PROJE BAĞLAMI

Tabbled QR menü. Aşama 3B-1'de PDF export temel özelliği tamamlandı (Ramada Encore için 7 sayfa İngilizce menü üretildi, Türkçe karakterler doğru). Ancak 2 iyileştirme gerekli:

1. **Logo eksikliği** — PDF tamamen text, profesyonel restoran menüsü görünümünde değil
2. **Ligature bug** — "filled" → "flled", "field" → "fled" gibi "fi"/"fl" kombinasyonları bozuk render ediliyor

Bu aşamada ikisi **tek commit**'te çözülecek.

## MEVCUT DURUM

**Dosyalar:**
- `src/components/admin/pdf/MenuPDF.tsx` — ana template (üstte restoran adı+adres, altta Tabbled text footer)
- `src/lib/pdf/pdfSetup.ts` — Roboto font registration

**Var olan public logolar:**
- `/opt/khp/tabbled/public/tabbled-logo-horizontal.png` — horizontal (icon + "Tabbled" text, pembe-siyah)
- `/opt/khp/tabbled/public/tabbled-logo-icon.png` — sadece icon
- `/opt/khp/tabbled/public/tabbled-logo-vertical.png` — dikey (icon üstte, text altta)

**Restaurant.logo_url:** Supabase Storage URL (public menü'de zaten kullanılıyor)

## GÖREV 1 — LIGATURE BUG FIX

### Sorun

Roboto TTF'te "fi" ve "fl" karakterleri ligature olarak tanımlanmış. @react-pdf/renderer bunları yanlış render ediyor, harfler kayboluyor:

- "filled" → "flled"
- "field" → "fled"  
- "Flavors" → "Favors"

### Çözüm

`src/lib/pdf/pdfSetup.ts`'te `Font.register()` çağrısında her font için `format: 'truetype'` ve ligature'ları devre dışı bırakan flag eklenebilir. Ama daha güvenilir yöntem: **Roboto yerine ligature içermeyen bir weight varyantı kullanmak** veya **CSS `fontVariantLigatures` property'si** (react-pdf destekler).

**Uygulanacak çözüm:** `MenuPDF.tsx`'teki her `<Text>` style'ına `fontVariantLigatures` OR tüm sayfaya global style ile ekle:

`MenuPDF.tsx`'teki tüm StyleSheet içeriklerine:

```typescript
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    padding: 40,
    paddingBottom: 70,
    fontSize: 11,
    color: '#1C1C1E',
    // YENİ: Ligature'ları devre dışı bırak (fi, fl bug fix)
    // @ts-expect-error - react-pdf supports this but types may not cover it
    fontVariantLigatures: 'none',
  },
  // ... diğer styles
});
```

**Eğer `fontVariantLigatures` çalışmazsa alternatif:** Font register'da subset özelliği kullan:

```typescript
// pdfSetup.ts içinde alternatif yaklaşım
Font.register({
  family: 'Roboto',
  fonts: [
    { src: '/fonts/Roboto-Light.ttf', fontWeight: 300 },
    { src: '/fonts/Roboto-Regular.ttf', fontWeight: 400 },
    { src: '/fonts/Roboto-Medium.ttf', fontWeight: 500 },
    { src: '/fonts/Roboto-Bold.ttf', fontWeight: 700 },
  ],
  // YENİ: Font'a fontFeatureSettings ile ligature kapatma
});
```

**ÖNCE bu iki yaklaşımdan `fontVariantLigatures` birinciyi dene.** İşe yaramazsa ikinciyi dene. Test için:

1. Build
2. PDF indir
3. "filled" kelimesini ara — "filled" olarak görünüyor mu?

Eğer `fontVariantLigatures` none ile de çalışmıyorsa, son çare olarak `Roboto-Mono` veya ligature-free bir font kullanabiliriz, ama bu son çare.

## GÖREV 2 — PDF HEADER'A RESTORAN LOGOSU EKLE

### Hedef

MenuPDF.tsx'te **ilk sayfanın header'ına** restoran logosu eklensin. Header yapısı:

```
┌────────────────────────────────────────┐
│ [Restoran Logo]   Ramada Encore Bayrampaşa          │  ← Logo solda, isim+adres sağda
│                   Yenidoğan, Şht. Naci Çakar Sk...  │
│                                                      │
│ Fiyatlar geçerli: 01.01.2026       KDV dahildir.    │  ← Alt satır
└────────────────────────────────────────┘
```

### Teknik Detay

@react-pdf/renderer `<Image>` componenti destekler. URL veya base64 kabul eder.

**Restoran logo URL'si nereden geliyor:**
- `restaurant.logo_url` — Supabase Storage URL (örn: `https://qmnrawqvkwehufebbkxp.supabase.co/storage/v1/object/public/menu-images/...`)

**Sorun:** @react-pdf/renderer görsel yüklerken CORS sorunu yaşayabilir. Supabase storage URL'leri genelde CORS allow olur ama bazen sorun çıkarabilir.

**Çözüm yaklaşımı:**

```tsx
import { Image } from '@react-pdf/renderer';

// MenuPDF.tsx içinde
{restaurant.logo_url && (
  <Image 
    src={restaurant.logo_url} 
    style={{ 
      width: 80, 
      height: 80, 
      objectFit: 'contain',
      marginRight: 16,
    }}
  />
)}
```

**Eğer CORS hata verirse alternatif:** Logo'yu Supabase Image Transforms ile getir (zaten optimize var). URL örneği:
```
https://qmnrawqvkwehufebbkxp.supabase.co/storage/v1/render/image/public/menu-images/...?width=160&height=160&resize=contain
```

`getOptimizedImageUrl` helper'ı zaten var ama o URL base64'e çevrilmiş olabilir — react-pdf için URL direkt kullanılmalı.

**PDF Image component için güvenilir URL oluşturma:**

```typescript
// MenuPDF.tsx içinde
const getLogoUrl = (logoUrl: string | null): string | undefined => {
  if (!logoUrl) return undefined;
  // Supabase transforms ile 160x160 contain
  if (logoUrl.includes('/storage/v1/object/public/')) {
    return logoUrl
      .replace('/object/public/', '/render/image/public/')
      + '?width=160&height=160&resize=contain&quality=80';
  }
  return logoUrl;
};
```

### Header Layout Değişikliği

Mevcut `styles.header`:

```typescript
header: {
  marginBottom: 24,
  paddingBottom: 16,
  borderBottomWidth: 2,
  borderBottomColor: '#1C1C1E',
},
```

Yeni yapı — flex row ile logo + metin yan yana:

```typescript
header: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 24,
  paddingBottom: 16,
  borderBottomWidth: 2,
  borderBottomColor: '#1C1C1E',
},
headerLogo: {
  width: 80,
  height: 80,
  objectFit: 'contain',
  marginRight: 16,
},
headerText: {
  flex: 1,
},
restaurantName: {
  fontSize: 22,
  fontWeight: 700,
  color: '#1C1C1E',
  marginBottom: 4,
},
restaurantAddress: {
  fontSize: 11,
  fontWeight: 400,
  color: '#6B6B70',
  marginBottom: 12,
},
legalInfo: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  width: '100%',
  marginTop: 6,
},
```

### JSX Yapısı

```tsx
<View style={styles.header}>
  {restaurant.logo_url && (
    <Image 
      src={getLogoUrl(restaurant.logo_url)!} 
      style={styles.headerLogo} 
    />
  )}
  <View style={styles.headerText}>
    <Text style={styles.restaurantName}>{restaurant.name}</Text>
    {restaurant.address && (
      <Text style={styles.restaurantAddress}>{restaurant.address}</Text>
    )}
    <View style={styles.legalInfo}>
      <Text style={styles.legalText}>
        {strings.priceEffectiveFrom}: {formatDate(restaurant.price_effective_date)}
      </Text>
      {restaurant.show_vat_notice && (
        <Text style={styles.legalText}>{strings.vatIncluded}</Text>
      )}
    </View>
  </View>
</View>
```

## GÖREV 3 — FOOTER'A TABBLED LOGO

### Hedef

Her sayfanın footer'ında `tabbled-logo-horizontal.png` görseli + sayfa numarası:

```
─────────────────────────────────────────────────
[Tabbled Logo]                        Sayfa 1 / 7
```

### Teknik Detay

Logo `public/tabbled-logo-horizontal.png`'den geliyor. Production'da URL: `https://tabbled.com/tabbled-logo-horizontal.png`. Ama **localhost'ta** dev ortamı veya `@react-pdf/renderer` server-side render yaparken (hayır, client-side), URL handling için **absolute path** kullanılmalı.

**Vercel + browser context:** `window.location.origin` kullanarak absolute URL oluştur:

```typescript
// MenuPDF.tsx içinde
function getTabbledLogoUrl(): string {
  // Browser'da çalışır
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/tabbled-logo-horizontal.png`;
  }
  // Fallback
  return 'https://tabbled.com/tabbled-logo-horizontal.png';
}
```

### Footer Layout Değişikliği

Mevcut `styles.footer`:

```typescript
footer: {
  position: 'absolute',
  bottom: 30,
  left: 40,
  right: 40,
  flexDirection: 'row',
  justifyContent: 'space-between',
  borderTopWidth: 0.5,
  borderTopColor: '#E5E5E5',
  paddingTop: 8,
},
```

Yeni yapı — text yerine logo:

```typescript
footer: {
  position: 'absolute',
  bottom: 25,
  left: 40,
  right: 40,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderTopWidth: 0.5,
  borderTopColor: '#E5E5E5',
  paddingTop: 8,
},
footerLogo: {
  width: 80,
  height: 20,
  objectFit: 'contain',
},
pageNumber: {
  fontSize: 9,
  fontWeight: 400,
  color: '#9B9B9E',
},
```

### JSX Yapısı

```tsx
<View style={styles.footer} fixed>
  <Image 
    src={getTabbledLogoUrl()} 
    style={styles.footerLogo}
  />
  <Text 
    style={styles.pageNumber}
    render={({ pageNumber, totalPages }) => 
      `${strings.page} ${pageNumber} / ${totalPages}`
    }
  />
</View>
```

**KRİTİK:** @react-pdf/renderer `<Image>` componenti `fixed` View içinde de çalışır. Test edilecek.

## GENEL KURALLAR

1. **`MenuPDF.tsx` DIŞINDAKİ dosyalara dokunma** — sadece template değişiyor
2. **Ligature fix çalışmayı garantile** — "filled", "field", "Flavors" kelimelerinin doğru göründüğünden emin ol
3. **Logo yükseklik/oran:** Restoran logosu kare area'da contain (80x80), Tabbled logo yatay oranda (80x20)
4. **Fallback'ler:**
   - `restaurant.logo_url` null ise logo gösterme, sadece text göster
   - Tabbled logo yüklenmezse (hata) PDF yine üretilebilmeli (try/catch veya Image onError)
5. **CORS sorunu çıkarsa:** Supabase transform URL'i kullan (yukarıda `getLogoUrl` fonksiyonu)

## TEST CHECKLIST

### Build testi
1. `npm run build` çalıştır
2. TypeScript hatası olmamalı
3. Lazy loading hala çalışıyor (react-pdf ayrı chunk)

### Production test
1. Commit + push:
   ```bash
   git add src/components/admin/pdf/MenuPDF.tsx
   # Eğer pdfSetup.ts'de değişiklik varsa onu da ekle
   git add -A
   
   git commit -m "feat(pdf): Phase 3B-1.5 — logo integration (restaurant header + Tabbled footer) + ligature fix"
   git push git@github.com:kiranmurat-source/swift-table-menu.git main
   ```

2. Vercel deploy bekle (1-2 dk)

3. Admin → Menü Yönetimi → Menü → "PDF İndir" butonu → modal aç → Türkçe seç → İndir

4. **PDF'i aç ve kontrol listesi:**
   - ✅ İlk sayfa header'da Ramada Encore logosu solda (80x80)
   - ✅ Logo sağında restoran adı + adres + yasal bilgi
   - ✅ Her sayfa footer'ında Tabbled horizontal logo (80x20)
   - ✅ Footer'ın sağında "Sayfa N / 7"
   - ✅ **Ligature fix:** "filled", "field", "Flavors" doğru yazıyor
   - ✅ Türkçe karakterler hala doğru
   - ✅ Sayfa 2-7'de de footer logo görünüyor

5. **İngilizce PDF testi:**
   - Modal'da İngilizce seç → İndir
   - "filled" doğru yazıyor mu? ("flled" değil)
   - "field" doğru yazıyor mu?

## BAŞARI KRİTERLERİ

- ✅ Build temiz
- ✅ Restoran logosu header'da görünüyor
- ✅ Tabbled logosu her sayfa footer'ında görünüyor
- ✅ Ligature bug düzeldi (filled, field, Flavors doğru)
- ✅ Türkçe karakterler hala çalışıyor
- ✅ Sayfa numaraları doğru (Sayfa N / 7)

## HATA DURUMLARI VE ÇÖZÜMLER

**Hata 1: "Image failed to load" veya logo görünmüyor**
→ CORS sorunu olabilir. Browser console'da hata mesajına bak.
→ Çözüm 1: Supabase transform URL'i kullan (getLogoUrl fonksiyonu)
→ Çözüm 2: Logo URL'i base64'e çevir (fetch + FileReader)
→ Çözüm 3 (son çare): Restoran logosunu kaldır, sadece text header bırak

**Hata 2: Tabbled logo görünmüyor (footer)**
→ URL sorun olabilir. Browser console'da network tab kontrol.
→ Çözüm: `window.location.origin` yerine hardcoded `https://tabbled.com` dene.

**Hata 3: "filled" hala "flled" olarak görünüyor**
→ `fontVariantLigatures: 'none'` çalışmamış. TypeScript @ts-expect-error kontrol.
→ Alternatif: Her `<Text>` component'ine `style={{ ...styles.xxx, fontVariantLigatures: 'none' }}` ekle (verbose ama garantili).
→ Son çare: Başka bir font'a geç (ör. Noto Sans, ligature-free versiyon).

**Hata 4: Logo çok büyük/küçük**
→ Header logo: width=80, height=80 değerlerini ayarla
→ Footer logo: width=80, height=20 değerlerini ayarla
→ objectFit: 'contain' olduğundan emin ol (distort olmasın)

**Hata 5: "fixed" footer'da Image component çalışmıyor**
→ @react-pdf/renderer 4.5.1'de test edilmeli
→ Eğer çalışmıyorsa: `fixed` property'i kaldır, her sayfada manual render et (daha az ideal ama çalışır)

HERHANGİ BİR HATADA DURDUR, raporla, yeni prompt bekle.

## ÖNCELİK SIRASI

1. `MenuPDF.tsx`'te ligature fix ekle (`fontVariantLigatures: 'none'`)
2. `MenuPDF.tsx`'te `getLogoUrl` ve `getTabbledLogoUrl` helper fonksiyonları ekle
3. `MenuPDF.tsx`'te `Image` import et (`@react-pdf/renderer`)
4. `MenuPDF.tsx`'te `styles.header`, `styles.headerLogo`, `styles.headerText` güncelle
5. `MenuPDF.tsx`'te header JSX'i flex row + logo + text yapısına çevir
6. `MenuPDF.tsx`'te `styles.footer` ve `styles.footerLogo` güncelle
7. `MenuPDF.tsx`'te footer JSX'e `<Image src={getTabbledLogoUrl()} />` ekle
8. `npm run build` test
9. Commit + push
10. Production test — logo + ligature fix çalışıyor mu
11. Aşama 3B-1.5 bitir
