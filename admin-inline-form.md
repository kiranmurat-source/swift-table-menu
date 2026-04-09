# TABBLED.COM — CLAUDE CODE PROMPT
## Admin Inline Ürün Düzenleme Formu (Modal → Akordeon)

---

## PROJE BAĞLAMI

- **Repo:** /opt/khp/tabbled (GitHub: kiranmurat-source/swift-table-menu)
- **Stack:** React + Vite + TypeScript + shadcn/ui
- **DB:** Supabase PostgreSQL (qmnrawqvkwehufebbkxp.supabase.co)
- **Font:** Playfair Display (başlıklar) + Inter (body)
- **İkon:** Circum Icons (react-icons/ci) — shadcn/ui internal Lucide'a DOKUNMA
- **Style:** S.* inline styles kullanılıyor

---

## MEVCUT DURUM

### Ürün Düzenleme Akışı (Şu An)
- Ürün satırına tıklayınca **modal (popup)** açılıyor
- Modal sayfanın EN ÜSTÜNDE açılıyor — kullanıcı tıkladığı ürünü göremez
- Modal içinde: ad TR/EN, açıklama TR/EN, fiyat, varyantlar, hazırlanma süresi, görsel, allerjenler, badge'ler, zamanlama, kategori seçici
- Kaydedince modal kapanıyor

### Sorun
- Ürüne tıklayınca sayfa kayıyor, hangi ürünü düzenlediğin belli olmuyor
- Uzun menülerde modal açılınca kontekst kayboluyor
- Her düzenleme için modal aç → düzenle → kapat döngüsü yavaş

---

## GÖREV: MODAL → INLINE AKORDEON FORM

### Amaç
Modal'ı tamamen kaldır. Ürün satırına tıklayınca, o ürünün HEMEN ALTINDA inline form akordeon olarak açılsın. Aynı anda sadece 1 ürünün formu açık olabilir.

### A) Genel Davranış

1. **Ürün satırına tıklama:**
   - Tıklanan ürünün altında form alanı slide-down animasyonla açılır
   - Eğer başka bir ürünün formu açıksa, önce o kapanır (tek açık form kuralı)
   - Açık form olan ürünün satırı hafif vurgulanır (arka plan rengi: açık mavi veya açık gri)

2. **Form kapatma:**
   - Formu kapatma yolları:
     - "İptal" butonu
     - Aynı ürün satırına tekrar tıklama (toggle)
     - Başka bir ürüne tıklama (eski kapanır, yeni açılır)
   - Kaydedilmemiş değişiklik varsa: confirm dialog ("Kaydedilmemiş değişiklikler var. Çıkmak istediğinize emin misiniz?")

3. **Kaydetme:**
   - "Kaydet" butonu → mevcut save logic aynen çalışır
   - Başarılı kayıt sonrası form AÇIK KALIR (kapatmaz) + toast mesajı
   - Kullanıcı isterse "İptal" veya başka ürüne tıklayarak kapatır

4. **Yeni ürün ekleme:**
   - "+ Ürün Ekle" butonuna tıklayınca, o kategorinin EN ALTINDA boş form açılır
   - Aynı akordeon mantığı (tek açık form)

### B) Form Layout (Inline)

Mevcut modal içeriğinin TAMAMI inline forma taşınacak. Ama layout yeniden düzenlenecek — modal'daki dikey liste yerine, yatay gruplama ile kompakt yerleşim:

```
┌─ Ürün Satırı (tıklandı, vurgulu arka plan) ─────────────────────┐
│ 📷 Ürün Adı                    65.00 ₺   [tükendi] [sil]        │
├──────────────────────────────────────────────────────────────────┤
│ ▼ DÜZENLEME FORMU (slide-down)                                   │
│                                                                   │
│ ┌─── Temel Bilgiler ──────────────────────────────────────────┐  │
│ │ Kategori: [dropdown ▼]                                      │  │
│ │                                                             │  │
│ │ Ad (TR): [________________]  Ad (EN): [________________]    │  │
│ │ Açıklama (TR):               Açıklama (EN):                │  │
│ │ [____________________]       [____________________]         │  │
│ │ [____________________]       [____________________]         │  │
│ └─────────────────────────────────────────────────────────────┘  │
│                                                                   │
│ ┌─── Fiyat & Detay ───────────────────────────────────────────┐  │
│ │ Fiyat: [65.00] ₺   Hazırlanma: [15] dk   [+ Varyant Ekle]  │  │
│ │                                                             │  │
│ │ (Varyant listesi burada açılır — mevcut varyant UI korunur) │  │
│ └─────────────────────────────────────────────────────────────┘  │
│                                                                   │
│ ┌─── Görsel ──────────────────────────────────────────────────┐  │
│ │ [Mevcut fotoğraf önizleme]  [Değiştir] [Kaldır]            │  │
│ │ veya [Fotoğraf Yükle]                                       │  │
│ └─────────────────────────────────────────────────────────────┘  │
│                                                                   │
│ ┌─── Özellikler ──────────────────────────────────────────────┐  │
│ │ ☐ Popüler  ☐ Yeni  ☐ Vejetaryen  ☐ Vegan  ☐ Öne Çıkar    │  │
│ │                                                             │  │
│ │ Allerjenler: [chip seçici — mevcut allerjen UI korunur]     │  │
│ └─────────────────────────────────────────────────────────────┘  │
│                                                                   │
│ ┌─── Zamanlama (collapse) ────────────────────────────────────┐  │
│ │ ▶ Zamanlama  (Her zaman / Tarih aralığı / Periyodik)       │  │
│ └─────────────────────────────────────────────────────────────┘  │
│                                                                   │
│ ┌─── Besin Değerleri (collapse) ──────────────────────────────┐  │
│ │ ▶ Besin Değerleri  [450 kcal badge]                        │  │
│ └─────────────────────────────────────────────────────────────┘  │
│                                                                   │
│                              [İptal]  [💾 Kaydet]                │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### C) Layout Kuralları

1. **İki sütunlu layout (desktop, >768px):**
   - Temel Bilgiler: TR ve EN alanları yan yana (50/50)
   - Fiyat & Detay: fiyat + hazırlanma süresi + varyant butonu tek satırda
   - Özellikler: checkbox'lar tek satırda (wrap)

2. **Tek sütunlu layout (mobil, ≤768px):**
   - Her şey alt alta
   - TR ve EN alanları alt alta

3. **Collapse bölümler:**
   - Zamanlama: varsayılan kapalı (schedule_type === 'always' ise)
   - Besin Değerleri: varsayılan kapalı (nutrition === null ise)
   - Açıkken schedule_type !== 'always' veya nutrition !== null ise otomatik açık gelsin

4. **Form arka planı:**
   - Ürün satırından hafif farklı arka plan (açık gri veya tema bazlı subtle renk)
   - Sol kenarında 3px kalınlığında accent border (tema primary rengi)
   - 16px padding her yönden

5. **Animasyon:**
   - Açılma: max-height transition (0 → auto, ~300ms ease-out)
   - CSS: `overflow: hidden; transition: max-height 0.3s ease-out;`
   - Açılınca form alanına smooth scroll (scrollIntoView)

### D) Kaldırılacaklar

1. **Modal (popup) tamamen kaldırılacak:**
   - Modal overlay, backdrop, modal container kodu silinecek
   - Modal open/close state kaldırılacak
   - Mevcut `itemForm` state ve save logic KORUNACAK — sadece render yeri değişecek

2. **Korunacaklar:**
   - Tüm form alanları (input'lar, dropdown'lar, checkbox'lar)
   - Tüm save/update logic
   - Tüm validasyon kuralları
   - Görsel upload logic
   - Varyant UI
   - Allerjen seçici
   - Zamanlama formu
   - Kategori dropdown

### E) State Yönetimi

```typescript
// Mevcut state'ler korunur:
const [itemForm, setItemForm] = useState({...}); // form verileri
const [editingItemId, setEditingItemId] = useState<string | null>(null); // düzenlenen ürün ID

// Yeni state'ler:
const [expandedItemId, setExpandedItemId] = useState<string | null>(null); // açık form olan ürün
const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false); // kaydedilmemiş değişiklik

// Modal state'leri kaldırılacak:
// const [showItemModal, setShowItemModal] = useState(false); // KALDIR
```

**Tıklama mantığı:**
```typescript
const handleItemClick = (item: MenuItem) => {
  if (expandedItemId === item.id) {
    // Aynı ürüne tıklandı — toggle (kapat)
    if (hasUnsavedChanges && !confirm('Kaydedilmemiş değişiklikler var...')) return;
    setExpandedItemId(null);
    return;
  }
  
  if (hasUnsavedChanges && !confirm('Kaydedilmemiş değişiklikler var...')) return;
  
  // Yeni ürün aç
  setExpandedItemId(item.id);
  setEditingItemId(item.id);
  // Form'u item verileriyle doldur (mevcut hydrate logic)
  hydrateForm(item);
  setHasUnsavedChanges(false);
};
```

### F) Inline Fiyat ile Entegrasyon

- Ürün satırındaki inline fiyat editable input KORUNACAK (tek fiyatlı ürünler için)
- Çoklu fiyatlı ürünlerde range gösterimi KORUNACAK
- Form açıkken inline fiyat devre dışı olsun (form içindeki fiyat kullanılır)
- Form kapalıyken inline fiyat düzenleme çalışmaya devam etsin

### G) Drag & Drop ile Entegrasyon

- Form açıkken o ürün drag edilemez olmalı (drag handle gizle veya devre dışı bırak)
- Diğer ürünler hala drag edilebilir
- Form açıkken yapılan drag-drop, form'u kapatmamalı

### H) Tükendi Toggle ile Entegrasyon

- Ürün satırındaki tükendi toggle KORUNACAK (form kapalıyken de çalışır)
- Form açıkken toggle'a tıklamak hem satırdaki hem formdaki değeri günceller

---

## GENEL KURALLAR

1. **İkon:** Sadece `react-icons/ci` (Circum Icons). shadcn/ui internal Lucide'a DOKUNMA.
2. **Font:** Playfair Display (başlıklar), Inter (body/muted)
3. **Style:** S.* inline styles pattern
4. **4-Nokta Sistemi:** Tüm spacing değerleri 4'ün katı (4, 8, 12, 16, 24, 32px)
5. **Etkileşim Durumları:** Butonlar 5 durum (default/hover/pressed/loading/disabled), Input'lar 3 durum (default/focus/error)
6. **DB değişikliği YOK** — sadece frontend refactor
7. **Deployment:** `npm run build` test → `git add -A && git commit -m "Admin: Modal → Inline akordeon ürün düzenleme formu" && git push origin main`

---

## TEST CHECKLIST

### Temel Akış:
- [ ] Ürün satırına tıkla → form satırın ALTINDA açılıyor (modal değil)
- [ ] Aynı ürüne tekrar tıkla → form kapanıyor (toggle)
- [ ] Başka ürüne tıkla → eski form kapanıyor, yeni açılıyor
- [ ] "+ Ürün Ekle" → kategorinin altında boş form açılıyor
- [ ] "Kaydet" → toast + form açık kalıyor
- [ ] "İptal" → form kapanıyor

### Kaydedilmemiş Değişiklik:
- [ ] Form'da değişiklik yap → başka ürüne tıkla → confirm dialog çıkıyor
- [ ] "Evet" → eski form kapanır, yeni açılır
- [ ] "Hayır" → eski form açık kalır

### Form İçeriği:
- [ ] Tüm mevcut alanlar çalışıyor (ad, açıklama, fiyat, görsel, allerjen, badge, zamanlama)
- [ ] Kategori dropdown çalışıyor (P2-1'de eklenmişti)
- [ ] Varyant ekleme/silme çalışıyor
- [ ] Hazırlanma süresi input'u çalışıyor
- [ ] Görsel upload/değiştir/kaldır çalışıyor

### Entegrasyon:
- [ ] Inline fiyat: form kapalıyken editable, form açıkken devre dışı
- [ ] Tükendi toggle: her iki durumda da çalışıyor
- [ ] Drag & drop: form açık ürün drag edilemez, diğerleri edilebilir
- [ ] Collapse bölümler (zamanlama, besin değerleri) çalışıyor

### Responsive:
- [ ] Desktop: iki sütunlu layout (TR/EN yan yana)
- [ ] Mobil: tek sütunlu layout (alt alta)
- [ ] Form scroll into view çalışıyor

### Regression:
- [ ] Mevcut kaydetme logic bozulmadı
- [ ] Mevcut validasyon çalışıyor
- [ ] Public menü etkilenmedi

---

## DOSYA DEĞİŞİKLİK LİSTESİ

1. `src/pages/RestaurantDashboard.tsx` — Modal kaldırma + inline akordeon form ekleme

Tek dosya değişikliği — tüm form logic zaten RestaurantDashboard.tsx içinde.

---

## ÖNCELİK SIRASI

1. Modal render'ı kaldır (overlay + container)
2. Ürün satırı tıklama → expandedItemId state
3. Form'u ürün satırının altına render et (conditional)
4. Slide-down animasyon (max-height transition)
5. İki sütunlu responsive layout
6. Unsaved changes kontrolü
7. Inline fiyat / drag & drop / tükendi entegrasyonu
8. ScrollIntoView
9. Build test + deploy
