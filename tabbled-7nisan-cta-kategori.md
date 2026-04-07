# TABBLED — Claude Code Prompt
# 7 Nisan 2026 — Promo CTA Kategori Yönlendirme + Logo Entegrasyonu

---

## PROJE BAĞLAMI

- **Dizin:** /opt/khp/tabbled
- **Dosyalar:**
  - src/pages/RestaurantDashboard.tsx (promo formu burada)
  - src/components/PromoPopup.tsx (popup bileşeni)
  - src/pages/PublicMenu.tsx (popup entegrasyonu + kategori state)
  - src/pages/Index.tsx (landing page)
  - src/pages/Login.tsx (login sayfası)
  - src/components/ (Navbar, Footer, vb.)
- **Logo dosyası:** /opt/khp/tabbled/tabbled-logo.png (VPS'e yüklenmiş olacak)

---

## GÖREV

Promo formundaki CTA link alanını (serbest text input) dropdown'a çevir. Restoran sahibi CTA butonunun hangi kategoriye yönlendireceğini seçsin. CTA tıklanınca popup kapansın ve menüde o kategoriye scroll etsin.

---

## ADMIN PANEL DEĞİŞİKLİĞİ (RestaurantDashboard.tsx)

### Mevcut durum:
- CTA Link: serbest text input (cta_url)

### Yapılacak:
1. cta_url text input'unu kaldır
2. Yerine dropdown (select) koy:
   - Label: "CTA Yönlendirme" (TR) 
   - İlk seçenek: "Popup'ı kapat (yönlendirme yok)" — value: "" (boş string)
   - Sonra restoranın mevcut kategorileri listelenir — value: kategori ID'si
   - Örnek:
     ```
     [Popup'ı kapat              ▼]
     [Popup'ı kapat                ]
     [Kahvaltı                     ]
     [Ana Yemekler                 ]
     [İçecekler                    ]
     [Tatlılar                     ]
     ```

3. Seçilen kategori ID'si cta_url alanına kaydedilir (DB'de cta_url olarak kalır, ama artık kategori ID tutar)
   - Boş = yönlendirme yok, sadece kapat
   - UUID = kategori ID'si

4. Kategorileri zaten çekiyorsun (categories state), onu kullan.

---

## PROMO POPUP DEĞİŞİKLİĞİ (PromoPopup.tsx)

### Mevcut durum:
- CTA butonu tıklanınca `window.open(promo.cta_url, '_blank')` yapıyor

### Yapılacak:
1. PromoPopup props'una yeni bir callback ekle: `onNavigateCategory?: (categoryId: string) => void`
2. CTA butonu tıklanınca:
   - cta_url boşsa: sadece popup'ı kapat
   - cta_url doluysa (kategori ID): `onNavigateCategory(cta_url)` çağır + popup'ı kapat

---

## PUBLIC MENÜ DEĞİŞİKLİĞİ (PublicMenu.tsx)

### Yapılacak:
1. PromoPopup'a `onNavigateCategory` callback ver:
```typescript
const handlePromoNavigate = (categoryId: string) => {
  setSelectedCategory(categoryId);
  // Kategoriye scroll et
  const element = document.getElementById(`category-${categoryId}`);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};
```

2. Kategori başlıklarına veya section'lara `id={`category-${category.id}`}` ekle (scroll target için). Eğer zaten varsa dokunma.

---

## KURALLAR

1. DB şeması değişmiyor — cta_url kolonu string olarak kalır, artık kategori ID tutar
2. Eski promo'larda cta_url harici link olabilir — UUID formatında değilse eski mantıkla çalışsın (window.open)
3. shadcn/ui Lucide ikonlarına dokunma
4. Tema uyumlu (select/dropdown da tema renklerinde)
5. npm run build hatasız

---

## TEST

- [ ] Admin: CTA alanı dropdown oldu
- [ ] Admin: Kategoriler dropdown'da listeleniyor
- [ ] Admin: "Popup'ı kapat" seçeneği var
- [ ] Public: CTA tıklanınca popup kapanıyor + kategoriye scroll
- [ ] Public: CTA boşsa sadece kapanıyor
- [ ] Build hatasız
