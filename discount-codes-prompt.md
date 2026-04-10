# TABBLED — İndirim Kodları Sistemi
## Claude Code Prompt — 14 Nisan 2026

---

## BAĞLAM

Tabbled dijital menü platformu. Sepet sistemi ve WhatsApp sipariş zaten mevcut.
Sepet client-side (useCart hook, useState). CartDrawer.tsx sepet drawer'ı.
WhatsApp mesaj formatı CartDrawer'da oluşturuluyor.
3 tema: white, black, red. 7 dil desteği. Admin sol sidebar navigasyonu.
Mevcut stil: S.* inline style pattern. İkon: Circum Icons (react-icons/ci).
Font: Playfair Display + Inter.

**Amaç:** Restoran sahibinin oluşturduğu indirim kodlarını müşterilerin sepette kullanabilmesi.

---

## YAPILACAKLAR

### 1. DB Migration

**Dosya:** `supabase/migrations/20260414_discount_codes.sql`

```sql
-- İndirim kodları tablosu
CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
  min_order_amount NUMERIC(10,2) DEFAULT 0,
  max_uses INTEGER DEFAULT NULL,
  current_uses INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: aynı restoranda aynı kod olamaz
CREATE UNIQUE INDEX idx_discount_code_unique ON discount_codes(restaurant_id, UPPER(code));

-- Index'ler
CREATE INDEX idx_discount_restaurant ON discount_codes(restaurant_id);
CREATE INDEX idx_discount_active ON discount_codes(restaurant_id, is_active);

-- RLS
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- Restoran sahibi kendi kodlarını yönetebilir
CREATE POLICY "Restaurant owner can manage own discount codes"
  ON discount_codes FOR ALL
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM profiles WHERE id = auth.uid()
    )
    OR is_super_admin()
  )
  WITH CHECK (
    restaurant_id IN (
      SELECT restaurant_id FROM profiles WHERE id = auth.uid()
    )
    OR is_super_admin()
  );

-- Public (anonim) kod doğrulama için SELECT
CREATE POLICY "Anyone can validate discount codes"
  ON discount_codes FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- updated_at trigger
CREATE TRIGGER update_discount_codes_updated_at
  BEFORE UPDATE ON discount_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Feature toggle
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS feature_discount_codes BOOLEAN DEFAULT TRUE;
```

**NOT:** Bu SQL, Supabase Dashboard → SQL Editor'de manuel çalıştırılacak.

---

### 2. Admin Panel — İndirim Kodları Paneli

**Konum:** Sol sidebar → "Pazarlama" adında yeni grup oluştur veya "Müşteri İlişkileri" grubuna ekle.

**Öneri:** Yeni grup oluştur:
```
Müşteri İlişkileri
  - Çağrılar
  - Geri Bildirim
  - Promosyonlar

Pazarlama                    ← YENİ GRUP
  - İndirim Kodları          ← YENİ

Tema & Profil
  - Tema
  - Profil
```

- İkon: CiPercent veya CiDiscount1
- activeTab'a 'discounts' ekle

**Panel İçeriği:**

#### Üst Kısım — Başlık + Oluştur Butonu
```
İndirim Kodları                    [+ Yeni Kod Oluştur]
```

#### Kod Listesi (tablo veya kart listesi)

Her satır/kart:
```
┌────────────────────────────────────────────────────────────┐
│ HOSGELDIN10              %10 İndirim           ● Aktif     │
│ Min: 100 ₺  |  Kullanım: 12/50  |  Son: 30 Nis 2026      │
│                                        [Düzenle] [Sil]     │
└────────────────────────────────────────────────────────────┘
```

```
┌────────────────────────────────────────────────────────────┐
│ YAZ25                    25 ₺ İndirim          ○ Pasif     │
│ Min: Yok  |  Kullanım: 0/∞  |  Son: Süresi dolmuş        │
│                                        [Düzenle] [Sil]     │
└────────────────────────────────────────────────────────────┘
```

- Kod: büyük, bold, monospace font
- İndirim: "% 10 İndirim" veya "25 ₺ İndirim"
- Durum: yeşil dot Aktif, gri dot Pasif, kırmızı dot Süresi Dolmuş
- Kullanım: "12/50" veya "5/∞" (limitsiz)
- Min sipariş: varsa göster, yoksa "Yok"
- Son tarih: varsa göster, dolmuşsa kırmızı "Süresi dolmuş"
- Düzenle/Sil butonları

#### Boş Durum
- "Henüz indirim kodu oluşturmadınız."
- CiPercent ikonu büyük, muted
- [+ İlk Kodunuzu Oluşturun] butonu

---

### 3. İndirim Kodu Oluşturma/Düzenleme Formu

**Stil:** Inline akordeon form (mevcut ürün ekleme pattern'ı gibi) veya modal.
Önceki pattern'a uyum için inline akordeon tercih edilir.

**Form Alanları:**

```
┌──────────────────────────────────────────────────┐
│ İndirim Kodu                                     │
│ ┌──────────────────────────────┐ [Rastgele Üret] │
│ │ HOSGELDIN10                  │                  │
│ └──────────────────────────────┘                  │
│ Büyük harf, boşluksuz                            │
│                                                   │
│ İndirim Tipi                                      │
│ ○ Yüzde (%)    ● Sabit Tutar (₺)                │
│                                                   │
│ İndirim Miktarı                                   │
│ ┌──────────────┐                                  │
│ │ 25           │ ₺                                │
│ └──────────────┘                                  │
│                                                   │
│ Minimum Sipariş Tutarı (isteğe bağlı)            │
│ ┌──────────────┐                                  │
│ │ 100          │ ₺                                │
│ └──────────────┘                                  │
│                                                   │
│ Kullanım Limiti (isteğe bağlı)                    │
│ ┌──────────────┐                                  │
│ │ 50           │                                  │
│ └──────────────┘                                  │
│ Boş bırakılırsa sınırsız                         │
│                                                   │
│ Geçerlilik Tarihi                                 │
│ ┌──────────────┐  ┌──────────────┐               │
│ │ Başlangıç    │  │ Bitiş        │               │
│ │ 14/04/2026   │  │ 30/04/2026   │               │
│ └──────────────┘  └──────────────┘               │
│ Bitiş boş bırakılırsa süresiz                    │
│                                                   │
│ Açıklama (isteğe bağlı)                           │
│ ┌──────────────────────────────┐                  │
│ │ Yeni müşterilere özel       │                  │
│ └──────────────────────────────┘                  │
│                                                   │
│ ┌────────────┐                                    │
│ │   Kaydet   │                                    │
│ └────────────┘                                    │
└──────────────────────────────────────────────────┘
```

**"Rastgele Üret" butonu:**
- 8 karakterlik rastgele kod üretir (büyük harf + rakam)
- Örnek: "XK4M9T2P"
- Fonksiyon: `Math.random().toString(36).substring(2, 10).toUpperCase()`

**Validasyonlar:**
- Kod: zorunlu, min 3, max 20, büyük harf + rakam + tire, boşluk yok
- Kod otomatik UPPERCASE'e çevrilsin (input onChange'de)
- İndirim miktarı: zorunlu, > 0
- Yüzde ise max 100
- Sabit tutar ise mantıklı limit (max 10000)
- Başlangıç < bitiş (ikisi de doluysa)
- Aynı restoranda aynı kod varsa hata mesajı

---

### 4. Sepet Drawer'da İndirim Kodu Uygulama

**Konum:** CartDrawer.tsx → Toplam satırının üstünde

**UI:**

```
┌──────────────────────────────────────────────┐
│ ürün listesi...                               │
│                                               │
│ ┌──────────────────────────────┐ [Uygula]    │
│ │ İndirim kodu girin...       │              │
│ └──────────────────────────────┘              │
│                                               │
│ ──────────────────────────────────────────    │
│ Ara Toplam                        200 ₺      │
│ İndirim (HOSGELDIN10)             -20 ₺      │  ← yeşil renk
│ Toplam                            180 ₺      │
│                                               │
│ [WhatsApp ile Gönder (180 ₺)]                │
└──────────────────────────────────────────────┘
```

**İndirim kodu uygulandığında:**
```
┌──────────────────────────────────────────────┐
│ ✓ HOSGELDIN10 — %10 indirim uygulandı  [✕]  │
└──────────────────────────────────────────────┘
```

- Yeşil arka plan, başarı tonu
- Kod adı + indirim açıklaması
- ✕ butonu ile kaldır

**Akış:**

1. Müşteri kodu girer + "Uygula" butonuna tıklar
2. Supabase'den kod doğrulanır:
   ```typescript
   const { data } = await supabase
     .from('discount_codes')
     .select('*')
     .eq('restaurant_id', restaurant.id)
     .ilike('code', inputCode.trim())
     .eq('is_active', true)
     .single();
   ```
3. Doğrulama kontrolleri:
   - Kod var mı? → yoksa "Geçersiz indirim kodu"
   - is_active = true? → değilse "Bu kod artık geçerli değil"
   - starts_at geçmiş mi? → değilse "Bu kod henüz aktif değil"
   - expires_at geçmemiş mi? → geçmişse "Bu kodun süresi dolmuş"
   - max_uses null değilse current_uses < max_uses? → değilse "Bu kod kullanım limitine ulaşmış"
   - min_order_amount kontrolü → sepet tutarı yeterli mi? → değilse "Minimum sipariş tutarı: {amount} ₺"
4. Başarılıysa:
   - İndirim uygulanır (useCart'a discount state eklenir)
   - Yeşil başarı gösterimi
   - Toplam güncellenir
5. Hata varsa:
   - Kırmızı hata mesajı input altında
   - Input temizlenmez (düzeltme şansı)

**İndirim hesaplama:**
```typescript
const calculateDiscount = (subtotal: number, code: DiscountCode): number => {
  if (code.discount_type === 'percentage') {
    return Math.round(subtotal * code.discount_value / 100 * 100) / 100;
  } else {
    // Sabit tutar — sepet tutarını aşamaz
    return Math.min(code.discount_value, subtotal);
  }
};
```

**useCart hook'a eklenecekler:**
```typescript
// Yeni state'ler
appliedDiscount: {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  discountAmount: number;  // hesaplanmış indirim tutarı
} | null;

// Yeni fonksiyonlar
applyDiscount: (discount: AppliedDiscount) => void;
removeDiscount: () => void;

// Güncellenecek
totalAmount: subtotal - discountAmount
```

---

### 5. WhatsApp Mesajında İndirim Gösterimi

**Mevcut mesaj formatına ekle:**

```
🍽 *{restaurant_name}* — Yeni Sipariş

📍 Masa: {table_number}

━━━━━━━━━━━━━━━━
• 2x Türk Kahvesi — 130 ₺
• 1x Künefe — 85 ₺
━━━━━━━━━━━━━━━━

💰 Ara Toplam: 215 ₺
🏷 İndirim (HOSGELDIN10): -21.50 ₺
💰 *Toplam: 193.50 ₺*

📝 Not: {note}

— tabbled.com ile gönderildi
```

- İndirim yoksa ara toplam satırı gösterilmez, sadece toplam
- İndirim varsa: ara toplam + indirim satırı + indirimli toplam

**Çok dilli indirim string'leri:**
```typescript
subtotal: 'Ara Toplam',
discount: 'İndirim',
// ... 7 dilde
```

---

### 6. Kullanım Sayacı Artırma

**WhatsApp gönderimi yapıldığında** (CartDrawer'da WhatsApp butonu tıklanınca):

```typescript
// İndirim kodu uygulanmışsa kullanım sayacını artır
if (appliedDiscount) {
  await supabase
    .from('discount_codes')
    .update({ current_uses: currentUses + 1 })
    .eq('restaurant_id', restaurant.id)
    .ilike('code', appliedDiscount.code);
}
```

**Not:** Bu anonim user'dan yapılacak. RLS'de anon UPDATE izni gerekir:

Migration'a ekle:
```sql
-- Anonim kullanıcı sadece current_uses'ı artırabilir
CREATE POLICY "Anyone can increment discount usage"
  ON discount_codes FOR UPDATE
  TO anon, authenticated
  USING (is_active = true)
  WITH CHECK (is_active = true);
```

Alternatif güvenli yaklaşım: Supabase RPC fonksiyonu ile sadece increment yapılabilir:
```sql
CREATE OR REPLACE FUNCTION increment_discount_usage(p_restaurant_id UUID, p_code TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE discount_codes
  SET current_uses = current_uses + 1
  WHERE restaurant_id = p_restaurant_id
    AND UPPER(code) = UPPER(p_code)
    AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**RPC kullanımı tercih edilir** — daha güvenli, anon user sadece increment yapabilir, başka alan değiştiremez.

---

### 7. Feature Toggle

**Profil tabında mevcut toggle'ların yanına:**
- "İndirim Kodları" — Müşteriler sepette indirim kodu kullanabilir
- İkon: CiPercent
- feature_discount_codes kolonu

**Public menüde:**
- `feature_discount_codes !== false` ise sepet drawer'da indirim kodu inputu göster
- Kapalıysa input gizli

---

### 8. Çok Dilli UI String'ler (7 dil)

```typescript
// TR
discountCode: 'İndirim Kodu',
enterDiscountCode: 'İndirim kodu girin...',
apply: 'Uygula',
applied: 'uygulandı',
remove: 'Kaldır',
invalidCode: 'Geçersiz indirim kodu',
codeExpired: 'Bu kodun süresi dolmuş',
codeInactive: 'Bu kod artık geçerli değil',
codeNotYetActive: 'Bu kod henüz aktif değil',
codeLimitReached: 'Bu kod kullanım limitine ulaşmış',
minOrderRequired: 'Minimum sipariş tutarı:',
subtotal: 'Ara Toplam',
discount: 'İndirim',
percentOff: 'indirim',
discountApplied: 'indirim uygulandı',

// EN
discountCode: 'Discount Code',
enterDiscountCode: 'Enter discount code...',
apply: 'Apply',
applied: 'applied',
remove: 'Remove',
invalidCode: 'Invalid discount code',
codeExpired: 'This code has expired',
codeInactive: 'This code is no longer valid',
codeNotYetActive: 'This code is not yet active',
codeLimitReached: 'This code has reached its usage limit',
minOrderRequired: 'Minimum order amount:',
subtotal: 'Subtotal',
discount: 'Discount',
percentOff: 'off',
discountApplied: 'discount applied',

// AR
discountCode: 'رمز الخصم',
enterDiscountCode: '...أدخل رمز الخصم',
apply: 'تطبيق',
applied: 'مطبّق',
remove: 'إزالة',
invalidCode: 'رمز خصم غير صالح',
codeExpired: 'انتهت صلاحية هذا الرمز',
codeInactive: 'هذا الرمز لم يعد صالحاً',
codeNotYetActive: 'هذا الرمز ليس نشطاً بعد',
codeLimitReached: 'وصل هذا الرمز لحد الاستخدام',
minOrderRequired: ':الحد الأدنى للطلب',
subtotal: 'المجموع الفرعي',
discount: 'الخصم',
percentOff: 'خصم',
discountApplied: 'تم تطبيق الخصم',

// DE
discountCode: 'Rabattcode',
enterDiscountCode: 'Rabattcode eingeben...',
apply: 'Anwenden',
applied: 'angewendet',
remove: 'Entfernen',
invalidCode: 'Ungültiger Rabattcode',
codeExpired: 'Dieser Code ist abgelaufen',
codeInactive: 'Dieser Code ist nicht mehr gültig',
codeNotYetActive: 'Dieser Code ist noch nicht aktiv',
codeLimitReached: 'Dieser Code hat sein Nutzungslimit erreicht',
minOrderRequired: 'Mindestbestellwert:',
subtotal: 'Zwischensumme',
discount: 'Rabatt',
percentOff: 'Rabatt',
discountApplied: 'Rabatt angewendet',

// FR
discountCode: 'Code promo',
enterDiscountCode: 'Entrez le code promo...',
apply: 'Appliquer',
applied: 'appliqué',
remove: 'Supprimer',
invalidCode: 'Code promo invalide',
codeExpired: 'Ce code a expiré',
codeInactive: 'Ce code n\'est plus valide',
codeNotYetActive: 'Ce code n\'est pas encore actif',
codeLimitReached: 'Ce code a atteint sa limite d\'utilisation',
minOrderRequired: 'Montant minimum de commande :',
subtotal: 'Sous-total',
discount: 'Réduction',
percentOff: 'de réduction',
discountApplied: 'réduction appliquée',

// RU
discountCode: 'Промокод',
enterDiscountCode: 'Введите промокод...',
apply: 'Применить',
applied: 'применён',
remove: 'Удалить',
invalidCode: 'Недействительный промокод',
codeExpired: 'Срок действия кода истёк',
codeInactive: 'Этот код больше не действителен',
codeNotYetActive: 'Этот код ещё не активен',
codeLimitReached: 'Код достиг лимита использования',
minOrderRequired: 'Минимальная сумма заказа:',
subtotal: 'Подытог',
discount: 'Скидка',
percentOff: 'скидка',
discountApplied: 'скидка применена',

// ZH
discountCode: '折扣码',
enterDiscountCode: '请输入折扣码...',
apply: '应用',
applied: '已应用',
remove: '移除',
invalidCode: '无效的折扣码',
codeExpired: '此折扣码已过期',
codeInactive: '此折扣码已失效',
codeNotYetActive: '此折扣码尚未生效',
codeLimitReached: '此折扣码已达使用上限',
minOrderRequired: '最低订单金额：',
subtotal: '小计',
discount: '折扣',
percentOff: '折扣',
discountApplied: '折扣已应用',
```

---

### 9. Edge Case'ler

1. **Sepet değişirse:** İndirim kodu uygulanmışken sepet tutarı minimum tutarın altına düşerse → indirim otomatik kaldırılsın + uyarı mesajı
2. **Sepet boşaltılırsa:** İndirim kodu da kaldırılsın
3. **Büyük/küçük harf:** Kod karşılaştırması case-insensitive (ILIKE veya UPPER)
4. **Kod girişi:** Input otomatik uppercase'e çevirsin
5. **Yüzde indirim max:** %100'den fazla olamaz
6. **Sabit tutar max:** Sepet tutarını aşamaz (negatif toplam olmaz)
7. **Aynı kod tekrar:** Zaten uygulanmış kodu tekrar girerse "Bu kod zaten uygulandı" mesajı
8. **Süresi dolmuş ama aktif:** expires_at geçmişse is_active true olsa bile kabul etme
9. **feature_discount_codes kapalıysa:** Sepet drawer'da input gizli, admin panelde kodlar yönetilebilir ama müşteriler kullanamaz
10. **WhatsApp gönderimi sonrası:** Kullanım sayacı artır (RPC ile)

---

## TEKNİK KISITLAMALAR

1. **Yeni npm paketi KURMA**
2. **shadcn/ui iç Lucide'a DOKUNMA**
3. **İkon:** Circum Icons (CiPercent, CiDiscount1, CiCircleCheck, CiCircleRemove)
4. **Font:** Playfair Display + Inter
5. **Spacing:** 4'ün katları
6. **3 tema uyumu zorunlu**
7. **Mevcut S.* inline style pattern**
8. **Anonim Supabase:** Kod doğrulama SELECT + RPC increment

---

## DOSYA PLANI

| Dosya | Aksiyon | Açıklama |
|-------|---------|----------|
| `supabase/migrations/20260414_discount_codes.sql` | YENİ | discount_codes tablo + RLS + RPC + feature toggle |
| `src/components/DiscountCodesPanel.tsx` | YENİ | Admin panel: kod listesi + oluşturma/düzenleme formu |
| `src/components/DiscountCodeInput.tsx` | YENİ | Sepet drawer'daki kod giriş + doğrulama UI |
| `src/lib/useCart.ts` | DÜZENLE | appliedDiscount state + apply/remove fonksiyonları |
| `src/components/CartDrawer.tsx` | DÜZENLE | İndirim kodu input + ara toplam/indirim/toplam gösterimi + WhatsApp mesajı güncelleme |
| `src/pages/RestaurantDashboard.tsx` | DÜZENLE | Sidebar'a indirim kodları + DiscountCodesPanel render + feature toggle |

---

## TEST SENARYOLARI

1. Admin: yeni kod oluştur (%10, min 100₺, 50 kullanım, 30 gün) → kaydet
2. Admin: "Rastgele Üret" → 8 karakterlik kod
3. Admin: aynı kod tekrar → hata (unique constraint)
4. Admin: kodu düzenle → güncelleme başarılı
5. Admin: kodu sil → onay → silinsin
6. Admin: kodu pasif yap → müşteri kullanamaz
7. Sepet: geçerli kod gir → "Uygula" → indirim uygulandı, toplam güncellendi
8. Sepet: geçersiz kod → "Geçersiz indirim kodu" hatası
9. Sepet: süresi dolmuş kod → "Bu kodun süresi dolmuş"
10. Sepet: limitine ulaşmış kod → "Bu kod kullanım limitine ulaşmış"
11. Sepet: min tutar karşılanmıyor → "Minimum sipariş tutarı: 100 ₺"
12. Sepet: indirim kaldır (✕) → ara toplam = toplam
13. Sepet: indirim uygulanmışken ürün sil → tutar min altına düşerse indirim kaldır
14. WhatsApp: indirimli mesaj → ara toplam + indirim satırı + indirimli toplam
15. WhatsApp gönder → kullanım sayacı +1
16. feature_discount_codes kapalı → sepette input gizli
17. 3 temada test
18. Mobilde test

---

## ÖNCELİK SIRASI

1. DB migration
2. useCart hook güncellemesi (appliedDiscount state)
3. DiscountCodeInput.tsx (sepet drawer'daki giriş)
4. CartDrawer.tsx güncelleme (input entegrasyonu + toplam gösterimi + WhatsApp mesajı)
5. DiscountCodesPanel.tsx (admin)
6. RestaurantDashboard.tsx (sidebar + panel + feature toggle)
7. Çok dilli string'ler
8. RPC fonksiyonu (increment)
9. Edge case'ler + test
