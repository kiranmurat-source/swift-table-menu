# Nutri-Score Hibrit Tasarım — Kompakt Strip in Detail Modal

## PROJE BAĞLAMI

Tabbled QR menü platformu (tabbled.com). `src/pages/PublicMenu.tsx` dosyası ~3200 satır. Nutri-Score badge şu an 4 yerde kullanılıyor:

1. Ürün kartı grid view (satır ~2349, size=18)
2. Ürün kartı bento/orta (satır ~2420, size=20)
3. Ürün kartı liste view (satır ~2532, size=20)
4. Ürün detay modal (satır ~2900)

`NutriScoreBadge` bileşeni aynı dosyada satır ~3220'de tanımlı. Şu an tek harf (A-E) renkli kare badge gösteriyor, tıklanınca dropdown açılıyor (5 skala + açıklama).

## HİBRİT TASARIM KARARI

Ürün kartları küçük ve dar alana sahip — **ürün kartlarında tek harf badge korunacak**, değişmeyecek.

Detay modalında (satır ~2900) ise kullanıcı daha fazla bilgi görebilmeli — **resmi Nutri-Score stripi (5 harf yan yana, seçili olan öne çıkmış)** gösterilecek. Bu uluslararası tanınan format, kullanıcının skoru anlamasını sağlar.

## MEVCUT DURUM

Son fix'ten sonra detay modalda şu kod var (satır ~2890-2905):

```jsx
{/* Kalori chip — SADECE nutrition tablosu gösterilmediğinde */}
{!hasVariants(item) && !(item.nutrition && item.nutrition.show_on_menu !== false) && (item.nutrition?.calories ?? item.calories) != null && (
  <div className="flex items-center gap-2 text-sm mb-4" style={{ color: theme.mutedText, position: 'relative' }}>
    <Thermometer size={16} />
    <span>{item.nutrition?.calories ?? item.calories} kcal</span>
  </div>
)}
{/* Nutri-Score badge — nutrition tablosundan bağımsız */}
{!hasVariants(item) && item.nutri_score && (
  <div className="flex items-center gap-2 text-sm mb-4" style={{ color: theme.mutedText, position: 'relative' }}>
    <NutriScoreBadge score={item.nutri_score} lang={lang} theme={theme} />
    <span style={{ fontSize: 13 }}>Nutri-Score</span>
  </div>
)}
```

## GÖREV

Sadece detay modaldaki Nutri-Score gösterimi (satır ~2899-2904, yukarıdaki ikinci blok) değişecek. Ürün kartlarındaki 3 kullanım (satır 2349, 2420, 2532) **kesinlikle dokunulmayacak**.

### Adım 1: Yeni bileşen oluştur

`NutriScoreBadge` fonksiyonunun hemen ALTINA (satır ~3290 civarı, NutriScoreBadge fonksiyonunun bittiği yere) yeni bir `NutriScoreStrip` bileşeni ekle:

```tsx
/* ------------------------------------------------------------------ */
/*  Nutri-Score Kompakt Strip — Detay modal için (5 harf yan yana)    */
/* ------------------------------------------------------------------ */

function NutriScoreStrip({
  score,
  lang,
  theme,
}: {
  score: NutriScore;
  lang: LangCode;
  theme: MenuTheme;
}) {
  const uiLang = toUiLang(lang);
  const labelObj = NUTRI_SCORE_LABELS[score];
  const localized = (o: { tr: string; en: string; ar: string; zh: string }) => o[uiLang] ?? o.en;
  const allScores: NutriScore[] = ['A', 'B', 'C', 'D', 'E'];
  
  return (
    <div style={{ marginBottom: 16 }}>
      <div 
        style={{ 
          fontSize: 13, 
          fontWeight: 500, 
          color: theme.text, 
          marginBottom: 8,
          fontFamily: 'Roboto, sans-serif',
        }}
      >
        Nutri-Score
      </div>
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 3,
        }}
        role="img"
        aria-label={`Nutri-Score ${score}: ${localized(labelObj)}`}
      >
        {allScores.map((s) => {
          const isSelected = s === score;
          const baseColor = NUTRI_SCORE_COLORS[s];
          const textColor = nutriScoreTextColor(s);
          
          return (
            <div
              key={s}
              style={{
                width: isSelected ? 42 : 32,
                height: isSelected ? 42 : 32,
                background: baseColor,
                color: textColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: isSelected ? 900 : 700,
                fontSize: isSelected ? 22 : 16,
                borderRadius: isSelected ? 6 : 4,
                opacity: isSelected ? 1 : 0.35,
                boxShadow: isSelected 
                  ? `0 0 0 2px ${theme.cardBg}, 0 0 0 4px ${baseColor}` 
                  : 'none',
                transition: 'all 0.2s ease',
                flexShrink: 0,
                lineHeight: 1,
                fontFamily: 'Roboto, sans-serif',
              }}
            >
              {s}
            </div>
          );
        })}
      </div>
      <div 
        style={{ 
          fontSize: 12, 
          color: theme.mutedText, 
          marginTop: 8,
          fontFamily: 'Roboto, sans-serif',
          fontWeight: 300,
        }}
      >
        {localized(labelObj)}
      </div>
    </div>
  );
}
```

### Adım 2: Detay modaldaki Nutri-Score gösterimini değiştir

Satır ~2899-2904'teki mevcut kod bloğu:

```jsx
{/* Nutri-Score badge — nutrition tablosundan bağımsız */}
{!hasVariants(item) && item.nutri_score && (
  <div className="flex items-center gap-2 text-sm mb-4" style={{ color: theme.mutedText, position: 'relative' }}>
    <NutriScoreBadge score={item.nutri_score} lang={lang} theme={theme} />
    <span style={{ fontSize: 13 }}>Nutri-Score</span>
  </div>
)}
```

Bu kod bloğunu TAMAMEN şununla değiştir:

```jsx
{/* Nutri-Score kompakt strip — detay modal */}
{!hasVariants(item) && item.nutri_score && (
  <NutriScoreStrip score={item.nutri_score} lang={lang} theme={theme} />
)}
```

## GENEL KURALLAR

1. **Ürün kartlarındaki 3 kullanım** (satır 2349, 2420, 2532) **KESİNLİKLE dokunulmayacak**. Bu yerlerdeki `<NutriScoreBadge size={...} />` aynı kalacak.

2. **`NutriScoreBadge` bileşeni silinmeyecek** — ürün kartlarında hala kullanılıyor. Sadece yeni `NutriScoreStrip` bileşeni eklenecek.

3. **Renk sabitleri** zaten dosyada tanımlı — `NUTRI_SCORE_COLORS`, `NUTRI_SCORE_LABELS`, `nutriScoreTextColor()`, `NutriScore` tipi. Yeniden tanımlama, mevcutları kullan.

4. **Tema uyumu**: `theme.text`, `theme.mutedText`, `theme.cardBg` değişkenleri kullanılacak — mevcut tema sistemine uygun (white/black tema desteği).

5. **Font**: Roboto ailesi (Memory'deki kural) — Bold/Medium/Regular/Light. Strip'te seçili harf 900 weight, diğerleri 700.

6. **Çok dilli**: `localized()` helper ile `NUTRI_SCORE_LABELS` kullanılıyor (TR/EN/AR/ZH) — mevcut pattern korunuyor.

7. **Başka hiçbir dosyaya dokunma**.

## TEST CHECKLIST

1. `npm run build` çalıştır — TypeScript hatası olmamalı, build başarılı olmalı

2. Build başarılıysa commit + push:
   ```bash
   git add src/pages/PublicMenu.tsx
   git commit -m "feat: Nutri-Score compact strip in detail modal (5-letter hybrid design)"
   git push origin main
   ```
   
   Not: HTTPS credentials yoksa SSH'e fallback yap:
   ```bash
   git push git@github.com:kiranmurat-source/swift-table-menu.git main
   ```

3. Vercel deploy bekle (1-2 dk)

4. Production test URL: https://tabbled.com/menu/ramada-encore-bayrampasa

5. Test senaryoları:
   - **"Bol Tahıllı ve Dana Etli Salata"** ürününe tıkla → detay modalda:
     - "Besin Değerleri" tablosu gösteriliyor (1674 kJ / 400 kcal) ✅
     - "Nutri-Score" başlığı
     - A B C D E stripi — A seçili, büyük, yeşil gölgeli; B/C/D/E solgun
     - Altında "Besin değeri en yüksek" açıklaması (TR için)
   - **"Patates Tava"** ürününe tıkla (D skoru) → D seçili, turuncu, büyük; A/B/C/E solgun
   - **Ürün kartlarında** (grid/liste view) — tek harf badge **değişmedi** ✅
   - **White tema ve black tema** her ikisinde de düzgün görünüyor

## BAŞARI KRİTERLERİ

- ✅ `npm run build` hatasız tamamlandı
- ✅ Detay modalında 5 harfli strip doğru renklerle gösteriliyor
- ✅ Seçili harf büyük ve belirgin, diğerleri solgun (opacity 0.35)
- ✅ Ürün kartlarında (grid/liste) mevcut tek harf badge davranışı korundu
- ✅ White ve black tema uyumu korundu
- ✅ Çok dilli label çalışıyor (TR/EN/AR/ZH)

## ÖNCELİK SIRASI

1. NutriScoreStrip bileşenini ekle (NutriScoreBadge altına)
2. Detay modaldaki eski NutriScore bloğunu NutriScoreStrip ile değiştir
3. Build al
4. Commit + push
5. Bitir — başka hiçbir iş yapma
