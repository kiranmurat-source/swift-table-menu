# TABBLED — BEĞENİ BUTONU FIX PROMPT

---

## SORUNLAR

1. **Profil bölümünde restoran seviyesi kalp butonu hala duruyor** — kaldırılması gerekiyor
2. **Ürün detay modalında kalp butonu yok** — eklenmesi gerekiyor
3. **Ürün kartlarında (grid/list) kalp butonu** olup olmadığını kontrol et, yoksa ekle

---

## FIX 1: PROFİL SEVİYESİ KALP KALDIRMA

PublicMenu.tsx'te profil/header bölümündeki restoran seviyesi beğeni butonunu bul ve KALDIR.

```bash
grep -n "Beğendiniz\|Beğen\|liked\|handleLike\|Heart" src/pages/PublicMenu.tsx | head -30
```

Profil bölümündeki (adres/telefon/saat akordeonunun yakınında) kalp butonunu kaldır. Sadece profil bölümündekini — ürün kartlarındakilere DOKUNMA.

Aranacak pattern:
- Akordeon içinde veya altında bir `<button>` içinde `<Heart` kullanan kod
- `liked` / `handleLike` / `Beğendiniz` / `Beğen` text'i içeren profil seviyesi buton
- `showReviewPrompt` state'i profil seviyesi beğeniye bağlıysa, onu da kaldır

**DİKKAT:** useLikes hook'una ve ürün kartlarındaki kalp butonlarına DOKUNMA. Sadece profil bölümündeki restoran seviyesi kalbi kaldır.

---

## FIX 2: ÜRÜN DETAY MODALINA KALP BUTONU EKLE

Ürün detay modalını (bottom sheet / popup) bul. Genellikle `selectedItem` state'i ile kontrol edilen modal.

```bash
grep -n "selectedItem\|detail.*modal\|detay.*modal\|ItemDetail\|showDetail" src/pages/PublicMenu.tsx | head -20
```

Modal içinde, ürün bilgilerinin (isim, fiyat, açıklama, allerjenler) altına kalp butonu ekle:

```tsx
{/* Detay modal — beğeni butonu */}
{restaurant?.feature_likes !== false && selectedItem && (
  <div className="flex items-center mt-4 pt-3 border-t border-gray-100">
    <button
      onClick={async () => {
        const success = await toggleLike(selectedItem.id, restaurant.id);
        if (success && restaurant.google_place_id) {
          setTimeout(() => setShowReviewPrompt(true), 800);
        }
      }}
      className={`flex items-center gap-1.5 text-sm transition-colors ${
        likedItems.has(selectedItem.id)
          ? 'text-[#FF4F7A]'
          : 'text-gray-500 hover:text-[#FF4F7A]'
      }`}
    >
      <Heart
        size={20}
        weight={likedItems.has(selectedItem.id) ? "fill" : "regular"}
      />
      <span>
        {likedItems.has(selectedItem.id) ? (t('liked') || 'Beğendiniz') : (t('like') || 'Beğen')}
      </span>
      {(likeCounts[selectedItem.id] || 0) > 0 && (
        <span className="text-gray-400 text-xs">({likeCounts[selectedItem.id]})</span>
      )}
    </button>
  </div>
)}
```

---

## FIX 3: ÜRÜN KARTLARINDA KALP KONTROL

Ürün kartlarında (grid ve list görünümlerinde) kalp butonu olup olmadığını kontrol et:

```bash
grep -n "Heart\|toggleLike\|likeCounts\|likedItems" src/pages/PublicMenu.tsx | head -30
```

Eğer ürün kartlarında kalp yoksa, her kart türüne (featured, grid, list) ekle. Konum: fiyatın yanında veya kartın sağ alt köşesinde.

```tsx
{/* Ürün kartında — beğeni butonu */}
{restaurant?.feature_likes !== false && (
  <button
    onClick={async (e) => {
      e.stopPropagation(); // detay modalı açılmasını engelle
      const success = await toggleLike(item.id, restaurant.id);
      if (success && restaurant.google_place_id) {
        setTimeout(() => setShowReviewPrompt(true), 800);
      }
    }}
    className={`flex items-center gap-1 text-xs transition-colors ${
      likedItems.has(item.id)
        ? 'text-[#FF4F7A]'
        : 'text-gray-400 hover:text-[#FF4F7A]'
    }`}
  >
    <Heart
      size={16}
      weight={likedItems.has(item.id) ? "fill" : "regular"}
    />
    {(likeCounts[item.id] || 0) > 0 && (
      <span>{likeCounts[item.id]}</span>
    )}
  </button>
)}
```

---

## BUILD VE PUSH

```bash
cd /opt/khp/tabbled
npm run build
git add -A
git commit -m "fix: remove profile-level like, add like button to product detail modal and cards"
git push origin main
```

---

## KONTROL LİSTESİ

- [ ] Profil bölümündeki restoran seviyesi kalp butonu kaldırıldı
- [ ] Ürün detay modalına kalp butonu eklendi
- [ ] Ürün kartlarında (grid/list/featured) kalp butonu var
- [ ] e.stopPropagation() ile kart tıklaması engelleniyor
- [ ] useLikes hook'u düzgün çalışıyor
- [ ] `npm run build` başarılı
- [ ] Git push yapıldı
