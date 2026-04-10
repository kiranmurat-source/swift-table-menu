# TABBLED — Sepet + WhatsApp Sipariş Entegrasyonu
## Claude Code Prompt — 14 Nisan 2026

---

## BAĞLAM

Tabbled dijital menü platformu. Public menü sayfası `/menu/:slug` adresinde çalışıyor.
Garson çağırma zaten mevcut (sticky bottom bar, sadece `?table=X` varsa görünür).
Restoran WhatsApp numarası `restaurants.social_whatsapp` kolonunda mevcut.
3 tema var: white, black, red. 7 dil desteği mevcut.
Çoklu fiyat varyantları (price_variants) ve tekli fiyat birlikte çalışıyor.

**Amaç:** Client-side sepet sistemi + WhatsApp ile sipariş gönderme. DB değişikliği YOK.

---

## DOSYA HARİTASI (mevcut yapı)

```
src/
├── pages/
│   └── PublicMenu.tsx          ← Ana public menü sayfası
├── components/
│   └── ... (mevcut bileşenler)
├── lib/
│   ├── supabase.ts
│   └── useAuth.ts
```

Public menü'de mevcut yapı:
- Kategori tab bar (scroll-aware)
- Grid/List toggle
- Ürün kartları (normal + featured)
- Ürün detay modalı
- Garson çağırma (sticky bottom bar — sadece `?table=X` ile)
- Splash ekranı + tema sistemi
- Çok dilli UI string'ler (translations objesi)

---

## YAPILACAKLAR

### 1. Sepet State Yönetimi (useCart hook)

**Dosya:** `src/lib/useCart.ts`

```typescript
interface CartItem {
  id: string;              // menu_item id
  name: string;            // ürün adı (mevcut dilde)
  price: number;           // seçilen fiyat
  variant?: string;        // varyant adı (varsa)
  quantity: number;        // adet
  image_url?: string;      // ürün görseli
}

interface CartState {
  items: CartItem[];
  note: string;            // müşteri notu
}
```

**Hook API:**
```typescript
const {
  items,
  note,
  totalAmount,
  totalItems,
  addItem,         // (item: Omit<CartItem, 'quantity'>) => void — aynı id+variant varsa quantity++
  removeItem,      // (id: string, variant?: string) => void — adet 1'se sil, değilse quantity--
  deleteItem,      // (id: string, variant?: string) => void — tamamen sil
  updateQuantity,  // (id: string, quantity: number, variant?: string) => void
  setNote,         // (note: string) => void
  clearCart,        // () => void
  isInCart,         // (id: string, variant?: string) => boolean
  getItemQuantity, // (id: string, variant?: string) => number
} = useCart();
```

**Kurallar:**
- State: React useState ile (localStorage KULLANMA — artifact kısıtlaması)
- Aynı ürün aynı varyantla eklenirse quantity artır, yeni satır ekleme
- totalAmount = sum(price × quantity)
- totalItems = sum(quantity)

---

### 2. Ürün Kartına "Ekle" Butonu

**Her ürün kartında (hem list hem grid görünümde):**

- Tükenmemiş (`is_sold_out !== true`) ve aktif (`is_available !== false`) ürünlerde:
  - **Tekli fiyat ürünler:** Kartın sağ alt köşesinde küçük yuvarlak "+" butonu
    - Tıklayınca direkt sepete ekle (ürün adı + fiyat)
    - Sepette zaten varsa "+" yerine adet göster: "- 2 +" inline counter
  - **Varyantlı ürünler:** "+" butonuna tıklayınca detay modalı aç (varyant seçimi gerekli)

- Tükenmiş ürünlerde "+" butonu gösterme

**Featured (2x büyük) kartlarda** da aynı mantık.

**Stil:**
- "+" butonu: 32x32px yuvarlak, tema ana rengi (white→#FF4F7A, black→#FF4F7A, red→white)
- Adet counter: aynı boyut, "- N +" şeklinde pill/capsule
- Transition: scale + opacity animasyonu
- 3 tema uyumlu

---

### 3. Detay Modalda Sepete Ekleme

**Mevcut detay modalına ekle:**

- **Tekli fiyat ürünler:**
  - Modal alt kısmında: Adet seçici (- 1 +) + "Sepete Ekle — 65.00 ₺" butonu
  - Sepette zaten varsa: "Sepeti Güncelle — 130.00 ₺" yazısı + mevcut adet göster

- **Varyantlı ürünler:**
  - Varyant listesinden birini seçmeden "Sepete Ekle" butonu disabled
  - Varyant seçilince buton aktif: "Sepete Ekle — 95.00 ₺"
  - Varyant seçimi: radio button tarzı, seçili olan tema rengiyle vurgulu

- **Tükenmiş ürünlerde** sepete ekleme butonu gösterme, "Tükendi" badge'i göster

**Stil:**
- Buton: full-width, tema ana rengi, beyaz text, 48px yükseklik, border-radius 12px
- Adet seçici: "-" ve "+" butonları 36x36px, ortada rakam
- 3 tema uyumlu

---

### 4. Sticky Sepet Bottom Bar

**Konum:** Ekranın altında sticky bar. Garson çağırma bar'ının ÜSTÜNDE (varsa).

**Görünürlük:** Sepette en az 1 ürün varken görünür. Sepet boşsa gizli.

**İçerik:**
```
[🛒 Sepeti Gör (3 ürün)]                    [125.00 ₺]
```

- Sol: sepet ikonu (CiShoppingCart) + "Sepeti Gör" + ürün sayısı badge
- Sağ: toplam tutar

**Tıklama:** Sepet drawer/modal açar.

**Stil:**
- Arka plan: tema ana rengi (white/black→#FF4F7A, red→#1C1C1E)
- Metin: beyaz
- Yükseklik: 56px
- Border-radius top: 16px
- Box-shadow: yukarı doğru gölge
- iPhone safe area: padding-bottom env(safe-area-inset-bottom)
- Animate: slide-up (sepete ilk ürün eklenince)
- z-index: garson bar'ın altında değil, ÜSTÜNDE (sepet bar daha öncelikli)

**Z-index hiyerarşi:**
- Sepet bottom bar: z-50
- Garson çağırma bar: z-40
- Kategori tab bar: z-30

**Garson bar ile birlikte gösterim:**
- Eğer hem sepet bar hem garson bar aktifse, garson bar sepet bar'ın üstüne stack olarak yerleşir
- Yani: sayfa → garson bar (altta) → sepet bar (garson bar'ın üstünde)
- Aslında hayır — düzelt: Sepet bar en altta, garson bar onun üstünde. İkisi ayrı sticky.
- **DOĞRU YAKLAŞIM:** İkisini tek bir container'da birleştir:
  ```
  <div class="fixed bottom-0 w-full">
    {cartHasItems && <CartBar />}      ← üst satır
    {hasTable && <WaiterCallBar />}    ← alt satır
  </div>
  ```
  - Böylece ikisi alt alta oturur, safe area sadece en alttakine uygulanır

---

### 5. Sepet Drawer (Bottom Sheet)

**Açılış:** Sepet bottom bar'a tıklayınca veya ürün detay modalının "Sepeti Gör" linki ile.

**Tasarım:** Alttan açılan drawer/bottom sheet (ekranın %80'i kadar).

**İçerik:**

```
╔══════════════════════════════════════════╗
║  ─── (drag handle)                       ║
║                                          ║
║  Sepetiniz (3 ürün)              [Boşalt]║
║                                          ║
║  ┌──────────────────────────────────────┐║
║  │ [img] Türk Kahvesi                   │║
║  │       Orta Şekerli   - 1 +    65 ₺  │║
║  └──────────────────────────────────────┘║
║  ┌──────────────────────────────────────┐║
║  │ [img] Künefe                         │║
║  │                      - 2 +   120 ₺  │║
║  └──────────────────────────────────────┘║
║  ┌──────────────────────────────────────┐║
║  │ [img] Su (500ml)                     │║
║  │                      - 1 +    15 ₺  │║
║  └──────────────────────────────────────┘║
║                                          ║
║  ┌──────────────────────────────────────┐║
║  │ Not ekleyin...                       │║
║  │ (ör: Alerjim var, sosları ayrı...)   │║
║  └──────────────────────────────────────┘║
║                                          ║
║  ──────────────────────────────────────  ║
║  Toplam                         200 ₺   ║
║                                          ║
║  ┌──────────────────────────────────────┐║
║  │ 📱 WhatsApp ile Gönder  (200 ₺)     │║
║  └──────────────────────────────────────┘║
╚══════════════════════════════════════════╝
```

**Ürün satırı:**
- Sol: küçük kare fotoğraf (48x48, border-radius 8px)
- Orta: ürün adı (bold) + varyant adı (muted, küçük)
- Sağ: adet counter (- N +) + satır toplam fiyat
- Sola swipe veya uzun basınca silme seçeneği (basit: her satırda küçük × butonu sağ üstte)

**Not alanı:**
- Textarea, 2 satır max, placeholder: "Not ekleyin... (ör: alerjim var, sosları ayrı istiyorum)"
- Karakter limiti: 200

**"Boşalt" butonu:**
- Sağ üst köşede ghost/text buton, kırmızı renk
- Tıklayınca onay: "Sepeti boşaltmak istediğinize emin misiniz?"

**WhatsApp butonu:**
- Full-width, yeşil arka plan (#25D366 WhatsApp yeşili), beyaz metin
- İkon: WhatsApp SVG ikonu (mevcut sosyal medya ikonlarından)
- Text: "WhatsApp ile Gönder" + toplam tutar
- **Restoranın social_whatsapp'ı boşsa bu buton görünmez** → yerine bilgi notu: "Bu restoran henüz WhatsApp siparişi kabul etmiyor"

**Drawer Stil:**
- Arka plan: tema arka plan rengi
- Drag handle: üstte 40x4px gri bar
- Border-radius top: 20px
- Backdrop: rgba(0,0,0,0.5)
- Max-height: 85vh
- Scroll: ürün listesi scrollable, alt kısım (toplam + buton) sticky
- 3 tema uyumlu
- Animasyon: slide-up

---

### 6. WhatsApp Mesaj Formatı

**URL format:** `https://wa.me/{whatsapp_number}?text={encoded_message}`

**whatsapp_number:** Restoranın social_whatsapp değeri. Başındaki + veya 0 varsa temizle, sadece rakam.

**Mesaj şablonu (Türkçe):**
```
🍽 *{restaurant_name}* — Yeni Sipariş

📍 Masa: {table_number veya "Paket"}

━━━━━━━━━━━━━━━━
{ürün listesi}
━━━━━━━━━━━━━━━━

💰 *Toplam: {total} ₺*

📝 Not: {note veya yok}

— tabbled.com ile gönderildi
```

**Ürün listesi formatı:**
```
• 2x Türk Kahvesi (Orta Şekerli) — 130 ₺
• 1x Künefe — 85 ₺
• 1x Su (500ml) — 15 ₺
```

**Masa numarası:**
- URL'de `?table=X` varsa "Masa: X"
- Yoksa "Paket" veya "Belirtilmedi"

**Çok dilli mesaj şablonları:**
```typescript
const whatsappTemplates: Record<string, WhatsAppTemplate> = {
  tr: {
    title: 'Yeni Sipariş',
    table: 'Masa',
    takeaway: 'Paket',
    total: 'Toplam',
    note: 'Not',
    sentVia: 'tabbled.com ile gönderildi',
  },
  en: {
    title: 'New Order',
    table: 'Table',
    takeaway: 'Takeaway',
    total: 'Total',
    note: 'Note',
    sentVia: 'Sent via tabbled.com',
  },
  ar: {
    title: 'طلب جديد',
    table: 'طاولة',
    takeaway: 'سفري',
    total: 'المجموع',
    note: 'ملاحظة',
    sentVia: 'tabbled.com أُرسل عبر',
  },
  de: {
    title: 'Neue Bestellung',
    table: 'Tisch',
    takeaway: 'Zum Mitnehmen',
    total: 'Gesamt',
    note: 'Notiz',
    sentVia: 'Gesendet über tabbled.com',
  },
  fr: {
    title: 'Nouvelle Commande',
    table: 'Table',
    takeaway: 'À emporter',
    total: 'Total',
    note: 'Note',
    sentVia: 'Envoyé via tabbled.com',
  },
  ru: {
    title: 'Новый заказ',
    table: 'Стол',
    takeaway: 'С собой',
    total: 'Итого',
    note: 'Примечание',
    sentVia: 'Отправлено через tabbled.com',
  },
  zh: {
    title: '新订单',
    table: '桌号',
    takeaway: '外带',
    total: '合计',
    note: '备注',
    sentVia: '通过 tabbled.com 发送',
  },
};
```

---

### 7. Sepete Ekleme Animasyonları & Feedback

**Ürün eklendiğinde:**
- "+" butonu kısa pulse animasyonu (scale 1→1.2→1)
- Sepet bottom bar badge bounce animasyonu
- Kısa toast/snackbar: "Sepete eklendi" (1.5 saniye, alt kısımda, bottom bar'ın üstünde)

**Sepet boşaltıldığında:**
- Items fade-out animasyonu
- Bottom bar slide-down ve kaybol

**WhatsApp gönderiminde:**
- Butona tıklayınca WhatsApp açılır (yeni sekme)
- Sepet otomatik TEMİZLENMEZ — kullanıcı geri geldiğinde sepet hâlâ dolu
- Drawer kapanır

---

### 8. Çok Dilli UI String'ler

Mevcut translations objesine eklenecek string'ler:

```typescript
// Sepet
cart: 'Sepet',
viewCart: 'Sepeti Gör',
yourCart: 'Sepetiniz',
addToCart: 'Sepete Ekle',
updateCart: 'Sepeti Güncelle',
emptyCart: 'Boşalt',
emptyCartConfirm: 'Sepeti boşaltmak istediğinize emin misiniz?',
cartEmpty: 'Sepetiniz boş',
addNote: 'Not ekleyin...',
notePlaceholder: 'ör: Alerjim var, sosları ayrı istiyorum',
total: 'Toplam',
items: 'ürün',
addedToCart: 'Sepete eklendi',
selectVariant: 'Seçenek seçin',
sendViaWhatsApp: 'WhatsApp ile Gönder',
whatsappNotAvailable: 'Bu restoran henüz WhatsApp siparişi kabul etmiyor',
```

Bu string'ler 7 dilde (TR/EN/AR/ZH/DE/FR/RU) tanımlanacak.

---

### 9. Edge Case'ler

1. **Restoranın social_whatsapp'ı boşsa:** Sepet sistemi yine çalışır ama WhatsApp butonu yerine bilgi mesajı göster
2. **Ürün tükendiyse:** Sepetteki tükenmiş ürünlerin üstüne "Tükendi" badge'i koy, WhatsApp butonunu disable etme ama mesajda belirt
3. **Varyantlı ürüne farklı varyant eklenirse:** Ayrı satır olarak ekle (aynı ürün, farklı varyant = farklı CartItem)
4. **Çok uzun mesaj:** WhatsApp URL limiti ~2000 karakter. Ürün sayısı çok fazlaysa mesajı kısalt (max 15 ürün, kalanı "...ve X ürün daha")
5. **Fiyat formatı:** Mevcut formatPrice fonksiyonunu kullan (nokta/virgül locale'e göre)
6. **Sayfa yenilenirse:** Sepet sıfırlanır (localStorage yok, bu beklenen davranış)
7. **Tema değişirse:** Sepet UI otomatik güncellenir (tema prop'ları zaten mevcut)

---

## TEKNİK KISITLAMALAR

1. **localStorage KULLANMA** — React useState ile state tut
2. **DB değişikliği YOK** — tüm sepet client-side
3. **Yeni npm paketi KURMA** — mevcut paketlerle (react, shadcn/ui, Circum Icons) çöz
4. **shadcn/ui iç Lucide ikonlarına DOKUNMA** — yeni ikonlar sadece Circum Icons'dan
5. **Font:** Playfair Display (başlıklar) + Inter (body)
6. **Marka renkleri:** #FF4F7A (Strawberry Pink), #1C1C1E (Deep Charcoal), #F7F7F8 (Off-White)
7. **Spacing:** 4'ün katları (4, 8, 12, 16, 24, 32px)
8. **İkon boyutu:** Yanındaki metnin line-height'ına eşit
9. **Buton padding:** Yatay = 2 × Dikey
10. **3 tema uyumu zorunlu:** white, black, red
11. **Mevcut S.* inline style pattern'ını kullan** (shadcn className değil)

---

## DOSYA PLANI

| Dosya | Aksiyon | Açıklama |
|-------|---------|----------|
| `src/lib/useCart.ts` | YENİ | Sepet hook (state + actions) |
| `src/components/CartBottomBar.tsx` | YENİ | Sticky alt bar (ürün sayısı + tutar) |
| `src/components/CartDrawer.tsx` | YENİ | Sepet bottom sheet (ürün listesi + not + WhatsApp) |
| `src/components/CartItemRow.tsx` | YENİ | Sepet satırı (fotoğraf + isim + adet + fiyat) |
| `src/components/QuantitySelector.tsx` | YENİ | Tekrar kullanılabilir adet seçici (- N +) |
| `src/pages/PublicMenu.tsx` | DÜZENLE | useCart entegre, "+" butonları, bottom bar, drawer |

---

## TEST SENARYOLARI

1. Tekli fiyat ürünü karttan ekle → sepet bar görünsün, adet 1
2. Aynı ürünü tekrar ekle → adet 2 olsun
3. Varyantlı ürünü karttan ekle → detay modal açılsın, varyant seçtir
4. Aynı ürün farklı varyant → ayrı satır
5. Detay modaldan ekle → sepete eklensin, modal kapansın
6. Sepet bar'a tıkla → drawer açılsın
7. Drawer'da adet artır/azalt → toplam güncelle
8. Drawer'da ürün sil → satır kaybolsun
9. "Boşalt" → onay → sepet temizlensin, bar kaybolsun
10. Not ekle → WhatsApp mesajında görünsün
11. "WhatsApp ile Gönder" → wa.me açılsın, doğru format
12. Masa numarası varsa → mesajda "Masa: X"
13. Masa numarası yoksa → mesajda "Paket"
14. social_whatsapp boşsa → WhatsApp butonu yerine bilgi mesajı
15. Tükenmiş ürün → "+" butonu yok
16. Garson bar + Sepet bar → ikisi alt alta doğru stack
17. 3 temada test: white, black, red
18. Mobilde test: iPhone safe area, touch hedefleri

---

## ÖNCELİK SIRASI

1. `useCart.ts` hook
2. `QuantitySelector.tsx` component
3. Ürün kartlarına "+" butonu
4. Detay modalına sepet ekleme
5. `CartBottomBar.tsx`
6. `CartDrawer.tsx` + `CartItemRow.tsx`
7. WhatsApp mesaj formatı + gönderim
8. Çok dilli string'ler (7 dil)
9. Animasyonlar ve feedback
10. Edge case'ler ve test

---

## NOTLAR

- Bu prompt tek seferde uygulanacak büyük bir özellik. ~500-700 satır yeni kod.
- PublicMenu.tsx zaten büyük bir dosya — yeni bileşenleri ayrı dosyalara çıkarmak önemli.
- Garson çağırma bar'ı ile entegrasyon dikkatli yapılmalı (z-index, positioning).
- WhatsApp URL encoding: encodeURIComponent kullan, emoji'ler destekleniyor.
- Test menüsü: tabbled.com/menu/abc-restaurant (veya mevcut slug)
