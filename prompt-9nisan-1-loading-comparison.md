# CLAUDE CODE PROMPT — 9 Nisan 2026, Görev 1
# Loading Ekranı Düzeltme + Landing Page Comparison Section Renk Fix

## PROJE BAĞLAMI
- Repo: /opt/khp/tabbled/ (git repo root)
- Stack: React + Vite + TypeScript + shadcn/ui
- Font: Playfair Display (başlıklar) + Inter (body)
- Logo dosyaları:
  - `public/tabbled-logo.png` → Pembe text logo (şeffaf arka plan)
  - `public/tabbled-logo-main.png` → Grid ikonlu logo (sadece navbar'da kullanılır)
- TabbledLogo bileşeni: `src/components/TabbledLogo.tsx` — `logoType` prop: 'main' | 'text'
- Deploy: git push origin main → Vercel otomatik deploy

---

## GÖREV 1: LOADING EKRANI DÜZELTMESİ

### Sorun
Şu an QR taranınca gösterilen loading ekranında:
1. Grid ikonlu logo (`tabbled-logo-main.png`) kullanılıyor — **pembe logo (`tabbled-logo.png`) kullanılmalı**
2. Loading ekranı veri gelince hemen kayboluyor — **minimum 1.5 saniye gösterilmeli**
3. Veri fetch işlemi loading ekranı gösterilirken başlamalı (lazy fetch)

### Yapılacaklar

#### 1a. Logo Değişikliği
- `src/pages/PublicMenu.tsx` dosyasını bul
- Loading ekranındaki logo referansını bul (muhtemelen `tabbled-logo-main.png` veya `logoType="main"`)
- **Pembe logoya çevir**: `tabbled-logo.png` veya `logoType="text"` kullan
- Logo boyutu: genişlik 180-200px arası, ortalanmış
- `animate-pulse` animasyonu kalabilir

#### 1b. Minimum 1.5s Display + Lazy Data Fetch
- Loading ekranı state'i için bir `showLoading` state ekle (başlangıç: `true`)
- Bir `minLoadTime` state ekle veya `useRef` ile timestamp tut
- Uygulama mantığı:

```typescript
// Pseudocode — gerçek implementasyon dosya yapısına göre uyarla
const [showLoading, setShowLoading] = useState(true);
const loadStartTime = useRef(Date.now());

useEffect(() => {
  const fetchData = async () => {
    // Mevcut veri fetch kodunu buraya taşı (restoran bilgileri, menü, kategoriler vs.)
    await fetchRestaurantData();
    
    // Minimum 1.5s bekle
    const elapsed = Date.now() - loadStartTime.current;
    const remaining = Math.max(0, 1500 - elapsed);
    
    if (remaining > 0) {
      await new Promise(resolve => setTimeout(resolve, remaining));
    }
    
    setShowLoading(false);
  };
  
  fetchData();
}, [slug]);
```

- Loading ekranı `showLoading === true` iken gösterilecek
- Veri fetch başarısız olursa da loading ekranı kapanmalı (hata durumu gösterilmeli)
- Splash ekranı loading'den SONRA gösterilecek (mevcut akış: loading → splash → menü)

#### 1c. Loading Ekranı Görünümü
Mevcut tasarımı koru ama logoyu değiştir:
- Tam ekran beyaz arka plan
- Ortada pembe Tabbled logosu (180-200px genişlik)
- Logo altında `animate-pulse` veya fade animasyonu
- 3 nokta bounce animasyonu (pembe renk) — mevcut hali kalabilir
- "Otel ve restoranlar için" veya "Menünüz yükleniyor..." tagline (opsiyonel)

---

## GÖREV 2: LANDING PAGE COMPARISON SECTION RENK DÜZELTMESİ

### Sorun
Landing page'deki "Tüm özellikler, plan bazında" karşılaştırma tablosunda:
1. **Check (✓) ikonları çok soluk** — açık arka planda zor okunuyor
2. **X (✗) ikonları neredeyse görünmez** — çok açık gri
3. **Özellik metin rengi** çok soluk, okunması zor
4. "2 dil", "3 tablet", "4 dil", "5 tablet" gibi özel değerler de soluk

### Dosya
- Büyük ihtimalle `src/components/ComparisonSection.tsx` veya `src/components/PricingSection.tsx` veya benzeri bir isimde
- Landing page bileşenleri `src/components/` altında

### Yapılacaklar

#### 2a. Check İkonları (Özellik VAR)
- Mevcut soluk yeşil/gri rengi → **daha belirgin yeşil** yap
- Önerilen: `text-emerald-600` veya `text-green-600` veya `#16a34a`
- İkon boyutu yeterli (mevcut hali uygun), sadece renk değişecek

#### 2b. X İkonları (Özellik YOK)  
- Mevcut neredeyse görünmez ikon → **daha belirgin** yap
- Önerilen: `text-gray-400` veya `text-red-300` — yani görünür ama check kadar dikkat çekmeyen
- Alternatif: `text-slate-400` (#94a3b8)

#### 2c. Özellik Metin Rengi
- Mevcut soluk metin → **daha koyu ve okunabilir** yap
- Önerilen: `text-gray-800` veya `text-slate-800` (#1e293b)
- Kategori başlıkları (MENÜ, AI ARAÇLARI, vs.) zaten bold — onlar da daha koyu olabilir

#### 2d. Özel Değer Metinleri
- "2 dil", "3 tablet", "4 dil", "5 tablet" gibi değerler
- Bunlar da okunabilir olmalı — `text-gray-700` veya `text-emerald-700` ile öne çıkarılabilir
- Font weight: `font-medium` (500) yapılabilir

### Önemli
- Pro sütununun arka plan vurgusu (mevcut açık gri/pembe şerit) korunmalı
- Tablo genel layout'u değişmemeli
- Sadece renk kontrastı artırılacak
- Mobil görünümü de kontrol et

---

## TEST ADIMLARI

1. `npm run build` — hata olmadığını doğrula
2. Loading testi: Tarayıcıda `/menu/abc-restaurant` aç
   - Pembe logo göründüğünü doğrula
   - Loading ekranının en az 1.5 saniye göründüğünü doğrula
   - Sonra splash ekranına geçtiğini doğrula
3. Landing page testi: Ana sayfayı aç, aşağı scroll et
   - Comparison tablosunda check ikonlarının belirgin yeşil olduğunu doğrula
   - X ikonlarının görünür olduğunu doğrula
   - Metin renginin rahat okunabildiğini doğrula
4. Mobil görünümü kontrol et (responsive)

---

## DOSYA DEĞİŞİKLİK ÖZETİ (Tahmini)
1. `src/pages/PublicMenu.tsx` — Loading ekranı logo + timing mantığı
2. `src/components/ComparisonSection.tsx` (veya benzeri) — Renk değişiklikleri
3. Başka dosya değişikliği gerekmemeli

---

## GIT COMMIT
```bash
git add -A && git commit -m "fix: loading screen pink logo + 1.5s min display, comparison section contrast fix" && git push origin main
```
