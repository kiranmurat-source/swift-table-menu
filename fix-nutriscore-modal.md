# Nutri-Score Badge Detay Modal Fix

## PROJE BAĞLAMI

Tabbled QR menü platformu (tabbled.com), React + Vite + TypeScript stack'i üzerine kurulu. `PublicMenu.tsx` dosyası ~3200 satır uzunluğunda ve public restoran menüsünün tüm görünümünü yönetiyor. 15 Nisan 2026'da Nutri-Score özelliği eklendi (A-E harfli renkli badge, AB uyumlu besin derecelendirmesi). Nutri-Score badge'i ürün kartlarında (grid view, bento view, liste view) doğru çalışıyor, ancak **ürün detay modalında, nutrition tablosu gösterilen ürünlerde görünmüyor.**

## MEVCUT DURUM

Dosya: `src/pages/PublicMenu.tsx`
İlgili satır aralığı: ~2890-2900

Mevcut kod:

```jsx
{!hasVariants(item) && !(item.nutrition && item.nutrition.show_on_menu !== false) && ((item.nutrition?.calories ?? item.calories) != null || item.nutri_score) && (
  <div className="flex items-center gap-2 text-sm mb-4" style={{ color: theme.mutedText, position: 'relative' }}>
    {(item.nutrition?.calories ?? item.calories) != null && (
      <>
        <Thermometer size={16} />
        <span>{item.nutrition?.calories ?? item.calories} kcal</span>
      </>
    )}
    {item.nutri_score && (
      <NutriScoreBadge score={item.nutri_score} lang={lang} theme={theme} />
    )}
  </div>
)}
```

## SORUN

Dıştaki koşul `!(item.nutrition && item.nutrition.show_on_menu !== false)` — yani "nutrition tablosu gösterilmiyorsa" — içerdeki Nutri-Score badge'i de gizliyor. Ama bu yanlış: nutrition tablosu kalori/protein gibi nicel değerleri gösterirken, Nutri-Score A-E harfli bir derecelendirmedir ve ayrı bir bilgidir. Her ikisi birlikte gösterilebilmelidir.

**Örnek:** "Bol Tahıllı ve Dana Etli Salata" ürününde `nutri_score = 'A'` ve `nutrition.show_on_menu = true`. Detay modalı açıldığında "Besin Değerleri" tablosu gösteriliyor ama Nutri-Score A badge'i görünmüyor.

## GÖREV

Yukarıdaki kod bloğunu (satır ~2890 ile başlayan `{!hasVariants(item) && !(item.nutrition...` ifadesinden, ilgili `)}` kapanışına kadar olan tek JSX bloğu) **TAMAMEN** aşağıdaki kodla değiştir:

```jsx
{/* Kalori chip — SADECE nutrition tablosu gösterilmediğinde (çift gösterimi önlemek için) */}
{!hasVariants(item) && !(item.nutrition && item.nutrition.show_on_menu !== false) && (item.nutrition?.calories ?? item.calories) != null && (
  <div className="flex items-center gap-2 text-sm mb-4" style={{ color: theme.mutedText, position: 'relative' }}>
    <Thermometer size={16} />
    <span>{item.nutrition?.calories ?? item.calories} kcal</span>
  </div>
)}
{/* Nutri-Score badge — nutrition tablosundan bağımsız, her durumda göster */}
{!hasVariants(item) && item.nutri_score && (
  <div className="flex items-center gap-2 text-sm mb-4" style={{ color: theme.mutedText, position: 'relative' }}>
    <NutriScoreBadge score={item.nutri_score} lang={lang} theme={theme} />
    <span style={{ fontSize: 13 }}>Nutri-Score</span>
  </div>
)}
```

## GENEL KURALLAR

1. `PublicMenu.tsx` dosyasının GERİ KALANINA dokunma. Sadece satır ~2890 civarındaki ilgili blok değişecek.
2. Başka hiçbir dosyaya (components/, lib/, pages/ altındaki diğer dosyalar dahil) dokunma.
3. Nutri-Score etiketi "Nutri-Score" olarak sabit kalsın — çok dilli hale getirmeye gerek yok, Nutri-Score bir marka adıdır (AB EFSA uyumlu, uluslararası).
4. Varyantlı ürünlerde (`hasVariants(item) === true`) Nutri-Score zaten gösterilmiyordu, bu davranış korunsun.
5. Badge ve etiket (`gap-2`) arası 8px boşluk, mevcut stile uygun.
6. Kalori chip'inin mevcut koşulunu (sadece `show_on_menu !== false` ise) DEĞİŞTİRME, sadece Nutri-Score'u bu koşuldan bağımsızlaştırıyoruz.

## TEST CHECKLIST

Değişiklikten sonra:

1. `npm run build` çalıştır
2. Build başarılı olmalı (TypeScript hata vermemeli, bundle oluşmalı)
3. Build başarılıysa commit + push:
   ```bash
   git add src/pages/PublicMenu.tsx
   git commit -m "fix: Nutri-Score badge now shows in detail modal alongside nutrition table"
   git push origin main
   ```
4. Vercel deploy bekle (1-2 dk)
5. Production test URL: https://tabbled.com/menu/ramada-encore-bayrampasa
6. "Bol Tahıllı ve Dana Etli Salata" ürününe tıkla
7. Detay modalında beklenen:
   - "Besin Değerleri" tablosu (Enerji: 1674 kJ / 400 kcal) — gösterilmeye devam ediyor
   - **Yeni:** Nutri-Score A badge + "Nutri-Score" etiketi — artık gözükmeli
   - Tıklayınca Nutri-Score dropdown açılıyor (5 skala)

## ÖNCELİK SIRASI

1. Sadece yukarıdaki tek kod bloğunu değiştir
2. Build al
3. Commit + push
4. Bitir — başka hiçbir iş yapma

## BAŞARI KRİTERLERİ

- ✅ `npm run build` hatasız tamamlandı
- ✅ Bol Tahıllı Salata detay modalında Nutri-Score A badge'i görünüyor
- ✅ Patates Tava detay modalında (D skoru) badge görünüyor
- ✅ Diğer ürünlerde (nutri_score olmayanlar) hiçbir şey bozulmadı
- ✅ Ürün kartlarında (grid/liste) mevcut badge davranışı korundu
