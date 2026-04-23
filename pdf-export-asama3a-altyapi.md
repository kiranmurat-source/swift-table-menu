# Aşama 3A/3B — PDF Export Altyapı Kurulumu

## PROJE BAĞLAMI

Tabbled QR menü platformu. DB + Admin UI (yasal alanlar) tamamlandı. Şimdi PDF Export işi başlıyor. Bu 2 parçaya bölündü — **bu Aşama 3A (altyapı)**, sonraki Aşama 3B (gerçek menü template).

**Mantık:** `@react-pdf/renderer` ilk kez kuruluyor. Vite uyumluluğu, font embedding (Türkçe karakter), lazy loading gibi konularda sürpriz olabilir. Önce küçük ölçekte test edelim — çalışırsa 3B'de büyütürüz.

## AŞAMA 3A HEDEFİ

**3 kritik test:**
1. ✅ `@react-pdf/renderer` Vite ile uyumlu mu? Build sorun çıkarmıyor mu?
2. ✅ Türkçe karakterler (Ş, ğ, ı, İ, Ü, Ö, Ç) doğru render ediliyor mu?
3. ✅ Lazy loading çalışıyor mu? (Ana bundle'a eklenmeden, sadece "PDF İndir" tıklanınca yükleniyor mu?)

**Bu aşamada YAPILMAYACAK (3B'de):**
- Gerçek menü verisi render etme (kategoriler, ürünler)
- Detaylı modal (dil seçimi, 4 checkbox)
- Nutri-Score, alerjen, besin değerleri
- Sayfalama mantığı
- Çok dilli destek (Arapça RTL)

## ADIM 1: PAKET KURULUMU

```bash
cd /opt/khp/tabbled && \
npm install @react-pdf/renderer --save && \
npm list @react-pdf/renderer
```

Paket versiyonunu raporla. En son stabil versiyon ~4.x serisidir.

## ADIM 2: ROBOTO FONT DOSYALARINI İNDİR

`@react-pdf/renderer` TTF font dosyası bekler. Türkçe karakter desteği için 4 Roboto weight indirilmeli:

```bash
# Roboto font klasörü oluştur
mkdir -p /opt/khp/tabbled/public/fonts

# Google Fonts'tan Roboto TTF indir (4 weight)
cd /opt/khp/tabbled/public/fonts
wget -q https://github.com/googlefonts/roboto-2/raw/main/src/hinted/Roboto-Regular.ttf
wget -q https://github.com/googlefonts/roboto-2/raw/main/src/hinted/Roboto-Medium.ttf
wget -q https://github.com/googlefonts/roboto-2/raw/main/src/hinted/Roboto-Bold.ttf
wget -q https://github.com/googlefonts/roboto-2/raw/main/src/hinted/Roboto-Light.ttf

# Dosyaların indirildiğini doğrula
ls -la /opt/khp/tabbled/public/fonts/
```

**Alternatif:** Eğer wget çalışmazsa, Google Fonts'tan manuel indir:
- https://fonts.google.com/specimen/Roboto → "Download family" → 4 weight (Light 300, Regular 400, Medium 500, Bold 700)
- Veya jsdelivr CDN: `https://cdn.jsdelivr.net/gh/googlefonts/roboto-2@main/src/hinted/`

Her 4 TTF dosyasının `/opt/khp/tabbled/public/fonts/` altında olduğunu doğrula. Dosya boyutları 150-250KB civarı olmalı.

## ADIM 3: PDF ALTYAPI MODÜLÜ OLUŞTUR

`src/lib/pdf/pdfSetup.ts` dosyasını oluştur:

```typescript
// src/lib/pdf/pdfSetup.ts
// PDF export altyapı — font registration, ortak setup
// @react-pdf/renderer konfigürasyonu

import { Font } from '@react-pdf/renderer';

let fontsRegistered = false;

/**
 * Roboto fontunu react-pdf'e kaydet.
 * Türkçe karakter desteği için TTF embed edilir.
 * Idempotent — birden fazla kez çağrılabilir, sadece ilkinde register eder.
 */
export function registerPDFFonts() {
  if (fontsRegistered) return;
  
  Font.register({
    family: 'Roboto',
    fonts: [
      { src: '/fonts/Roboto-Light.ttf', fontWeight: 300 },
      { src: '/fonts/Roboto-Regular.ttf', fontWeight: 400 },
      { src: '/fonts/Roboto-Medium.ttf', fontWeight: 500 },
      { src: '/fonts/Roboto-Bold.ttf', fontWeight: 700 },
    ],
  });
  
  // Hyphenation devre dışı (Türkçe için daha iyi sonuç)
  Font.registerHyphenationCallback((word) => [word]);
  
  fontsRegistered = true;
}
```

## ADIM 4: TEST PDF TEMPLATE OLUŞTUR

`src/components/admin/pdf/TestMenuPDF.tsx` dosyasını oluştur:

```tsx
// src/components/admin/pdf/TestMenuPDF.tsx
// Minimal test PDF — Türkçe karakter doğrulaması için
// Aşama 3B'de gerçek menü template ile değiştirilecek

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { registerPDFFonts } from '../../../lib/pdf/pdfSetup';

// Font kayıt (ilk render'da çalışır)
registerPDFFonts();

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    padding: 40,
    fontSize: 12,
    color: '#1C1C1E',
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 20,
    color: '#1C1C1E',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: 500,
    marginBottom: 12,
    color: '#6B6B70',
  },
  paragraph: {
    fontSize: 12,
    fontWeight: 400,
    lineHeight: 1.6,
    marginBottom: 8,
  },
  highlight: {
    fontWeight: 700,
    color: '#FF4F7A',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    marginVertical: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 10,
    color: '#9B9B9E',
    textAlign: 'center',
  },
});

interface TestMenuPDFProps {
  restaurantName?: string;
}

export function TestMenuPDF({ restaurantName = 'Test Restoran' }: TestMenuPDFProps) {
  return (
    <Document title="Tabbled PDF Test" author="Tabbled">
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>PDF Export Test</Text>
        <Text style={styles.subtitle}>Restoran: {restaurantName}</Text>
        
        <View style={styles.divider} />
        
        <Text style={styles.paragraph}>
          <Text style={styles.highlight}>Türkçe karakter testi:</Text> Şeftali, çilek, İstanbul, 
          Ümraniye, Gümüşhane, Öğretmen, Çağrı Bey, Ğ harfi nadir kullanılır.
        </Text>
        
        <Text style={styles.paragraph}>
          <Text style={styles.highlight}>Ş ğ ı İ Ü Ö Ç — tüm özel karakterler doğru görünmeli.</Text>
        </Text>
        
        <Text style={styles.paragraph}>
          Bu PDF Tabbled PDF export altyapısının doğrulaması için oluşturuldu. Bir sonraki 
          aşamada gerçek menü template'i bu altyapı üzerine inşa edilecek.
        </Text>
        
        <View style={styles.divider} />
        
        <Text style={styles.subtitle}>Font weight testi</Text>
        <Text style={[styles.paragraph, { fontWeight: 300 }]}>Light (300) — İnce yazı</Text>
        <Text style={[styles.paragraph, { fontWeight: 400 }]}>Regular (400) — Normal yazı</Text>
        <Text style={[styles.paragraph, { fontWeight: 500 }]}>Medium (500) — Orta kalın</Text>
        <Text style={[styles.paragraph, { fontWeight: 700 }]}>Bold (700) — Kalın yazı</Text>
        
        <Text style={styles.footer}>
          Tabbled PDF Test · Oluşturulma: {new Date().toLocaleDateString('tr-TR')}
        </Text>
      </Page>
    </Document>
  );
}
```

## ADIM 5: "PDF İNDİR" BUTONU (LAZY LOADED)

`src/components/admin/pdf/PDFDownloadButton.tsx` dosyasını oluştur:

```tsx
// src/components/admin/pdf/PDFDownloadButton.tsx
// PDF indir butonu — lazy-loaded, tıklandığında PDF modülü yüklenir
// Ana bundle'a @react-pdf/renderer eklenmez

import { useState } from 'react';
import { FilePdf, Spinner } from '@phosphor-icons/react';

interface PDFDownloadButtonProps {
  restaurantName?: string;
  label?: string;
}

export function PDFDownloadButton({ 
  restaurantName = 'Tabbled Restoran',
  label = 'PDF İndir (Test)',
}: PDFDownloadButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      // LAZY IMPORT — sadece buton tıklandığında yüklenir
      const [{ pdf }, { TestMenuPDF }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./TestMenuPDF'),
      ]);
      
      const blob = await pdf(<TestMenuPDF restaurantName={restaurantName} />).toBlob();
      
      // İndirme tetikle
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tabbled-test-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('PDF oluşturulurken hata oluştu: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 16px',
        fontSize: 14,
        fontWeight: 500,
        fontFamily: 'Roboto, sans-serif',
        background: loading ? '#D1D1D6' : '#1C1C1E',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: 8,
        cursor: loading ? 'wait' : 'pointer',
        transition: 'background 0.2s',
      }}
    >
      {loading ? (
        <>
          <Spinner size={16} weight="thin" style={{ animation: 'spin 1s linear infinite' }} />
          Oluşturuluyor...
        </>
      ) : (
        <>
          <FilePdf size={16} weight="thin" />
          {label}
        </>
      )}
    </button>
  );
}
```

## ADIM 6: MENÜ TAB'INA BUTON EKLE

`src/pages/RestaurantDashboard.tsx` satır ~1446'da **"Kategoriler"** başlığı var. Bu başlığın aynı satırında (veya hemen yanında) "PDF İndir (Test)" butonu eklenmeli.

### Önce bu kısmı görelim:

```bash
sed -n '1440,1460p' src/pages/RestaurantDashboard.tsx
```

Bu çıktıyı gör, sonra "Kategoriler" başlığı ile aynı satırda flex container içinde buton render edilecek yapıyı oluştur.

### Import ekle:

```tsx
import { PDFDownloadButton } from '../components/admin/pdf/PDFDownloadButton';
```

### Kategoriler başlığının yanına buton ekle:

"Kategoriler" başlığının bulunduğu `<h3>...</h3>` yapısını bir flex container ile sar (eğer zaten değilse), butonu sağa ekle:

```tsx
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
  <h3 style={{ fontSize: 16, fontWeight: 600, color: adminTheme.value, margin: 0 }}>Kategoriler</h3>
  <PDFDownloadButton restaurantName={restaurant.name} />
</div>
```

**DİKKAT:** Mevcut h3 zaten bir parent div içinde olabilir. Mevcut yapıyı BOZMADAN, sadece h3'ün yanına buton ekle. Eğer parent düzenleme gerekiyorsa minimum değişiklikle yap.

## ADIM 7: VITE KONFİGÜRASYON KONTROLÜ

`@react-pdf/renderer` bazen Vite ile sorun çıkarabilir. `vite.config.ts`'yi kontrol et:

```bash
cat /opt/khp/tabbled/vite.config.ts
```

Eğer build hatası çıkarsa, `vite.config.ts`'de `optimizeDeps` bölümüne ekleme gerekebilir:

```typescript
optimizeDeps: {
  include: ['@react-pdf/renderer'],
}
```

**Ama önce buildi dene**, hata çıkmazsa config değiştirme.

## TEST CHECKLIST

1. `npm install` başarılı, paket yüklendi
2. 4 TTF dosya `public/fonts/` altında (Light, Regular, Medium, Bold)
3. 4 yeni dosya oluşturuldu:
   - `src/lib/pdf/pdfSetup.ts`
   - `src/components/admin/pdf/TestMenuPDF.tsx`
   - `src/components/admin/pdf/PDFDownloadButton.tsx`
   - (RestaurantDashboard.tsx'e import ve render)
4. `npm run build` çalıştır
5. **Beklenen build davranışı:**
   - Ana bundle boyutu ~değişmemiş olmalı (lazy loading çalışıyor demek)
   - Ayrı bir chunk'ta `@react-pdf/renderer` görünmeli (code splitting çalışıyor)
   - Bundle analyzer çıktısına bak: `dist/assets/` altında yeni bir chunk (~400-500KB) olmalı

6. Build başarılıysa commit + push:
   ```bash
   git add package.json package-lock.json public/fonts/ \
           src/lib/pdf/pdfSetup.ts \
           src/components/admin/pdf/TestMenuPDF.tsx \
           src/components/admin/pdf/PDFDownloadButton.tsx \
           src/pages/RestaurantDashboard.tsx
   
   git commit -m "feat(pdf): Phase 3A — @react-pdf/renderer setup + Turkish font + test PDF"
   git push git@github.com:kiranmurat-source/swift-table-menu.git main
   ```

7. Vercel deploy bekle (1-2 dk)
8. Production test:
   - Admin panele gir: https://tabbled.com/dashboard
   - Sidebar → Menü Yönetimi → Menü tab'ına git
   - "Kategoriler" başlığının yanında **"PDF İndir (Test)"** butonu olmalı
   - Butona tıkla → 2-5 sn yükleme → PDF indir
   - **PDF'i aç ve kritik kontrolü yap:**
     - ✅ Türkçe karakterler (Ş, ğ, ı, İ, Ü, Ö, Ç) doğru render edildi
     - ✅ 4 font weight doğru görünüyor (ince/normal/orta/kalın farkı belli)
     - ✅ Restoran adı (Ramada Encore by Wyndham Bayrampaşa) doğru
     - ✅ Tarih doğru format (TR locale)

9. Network tab'ı kontrol:
   - Sayfa ilk yüklendiğinde `@react-pdf` içermeyen küçük bundle
   - Buton tıklanınca yeni chunk yüklenir (~400KB)

## BAŞARI KRİTERLERİ

- ✅ `@react-pdf/renderer` kuruldu, build hatasız
- ✅ 4 Roboto TTF font public/fonts altında
- ✅ Test PDF indiriliyor
- ✅ Türkçe karakterler PDF'de doğru render ediliyor
- ✅ Lazy loading çalışıyor (ana bundle şişmemiş)
- ✅ Hiçbir mevcut özellik bozulmadı

## HATA DURUMLARI VE ÇÖZÜMLER

**Hata 1: "Cannot find module '@react-pdf/renderer'"**
→ `npm install` çalıştırılmamış. Tekrar çalıştır.

**Hata 2: Vite build "Cannot use import statement outside a module" veya "Rollup parse error"**
→ `vite.config.ts`'de `optimizeDeps.include: ['@react-pdf/renderer']` ekle.

**Hata 3: PDF'de Türkçe karakterler kutu (□) olarak görünüyor**
→ Font dosyaları eksik veya yol yanlış. `public/fonts/` altında 4 TTF olmalı. Tarayıcıda `https://tabbled.com/fonts/Roboto-Regular.ttf` erişilebilir mi kontrol et.

**Hata 4: Font "not found" hatası**
→ `pdfSetup.ts`'de font URL'leri `/fonts/Roboto-*.ttf` olmalı (başında `/` — absolute path). Prod'da da çalışır.

**Hata 5: Bundle ~600KB+ büyüdü (main chunk)**
→ Lazy loading çalışmıyor. `PDFDownloadButton.tsx`'te `import(...)` statement'ının top-level olmadığından, event handler içinde olduğundan emin ol.

**Hata 6: "pdf is not a function"**
→ Import yanlış. `{ pdf }` named export olarak import edilmeli.

HERHANGİ BİR HATA DURMUNDA DURDUR, raporla, yeni prompt bekle. Commit atma.

## ÖNCELİK SIRASI

1. `npm install @react-pdf/renderer`
2. 4 TTF font dosyasını public/fonts/ altına indir
3. `pdfSetup.ts` oluştur
4. `TestMenuPDF.tsx` oluştur
5. `PDFDownloadButton.tsx` oluştur (lazy import pattern)
6. RestaurantDashboard.tsx'te menü tab'ında Kategoriler başlığı yanına buton ekle
7. `npm run build` — başarılı mı?
8. Commit + push
9. Production test — PDF inen Türkçe karakterli doğru mu?
10. Aşama 3A BİTTİ — "çalışıyor" dersen Aşama 3B (gerçek menü + modal) için prompt hazırlanır
