# TABBLED — Geri Bildirim Formu + Google Reviews Yönlendirme + Lokal SEO
## Claude Code Prompt — 14 Nisan 2026

---

## BAĞLAM

Tabbled dijital menü platformu. Public menü sayfası `/menu/:slug` adresinde çalışıyor.
3 tema var: white, black, red. 7 dil desteği mevcut (TR/EN/AR/ZH/DE/FR/RU).
Restoran bilgileri `restaurants` tablosunda. `social_google_maps` kolonu zaten mevcut.
Admin panel sol sidebar navigasyonu kullanıyor (3 grup).
Mevcut stil: S.* inline style pattern (shadcn className değil).
İkon: Circum Icons (react-icons/ci). Font: Playfair Display + Inter.

**Amaç:** 3 P2 kalemini tek seferde kapatmak:
1. Geri bildirim formu (kendi iç sistemimiz)
2. Google Reviews yönlendirme (akıllı yönlendirme)
3. Lokal SEO desteği (Google Place ID entegrasyonu)

---

## MEVCUT DOSYA YAPISI

```
src/
├── pages/
│   ├── PublicMenu.tsx          ← Public menü sayfası
│   └── RestaurantDashboard.tsx ← Admin panel (sol sidebar)
├── components/
│   ├── CartBottomBar.tsx       ← Sepet sticky bar
│   ├── CartDrawer.tsx          ← Sepet drawer
│   └── WaiterCallBar.tsx       ← Garson çağırma (veya PublicMenu içinde)
├── lib/
│   ├── supabase.ts
│   ├── useAuth.ts
│   └── useCart.ts
```

---

## YAPILACAKLAR

### 1. DB Migration

**Dosya:** `supabase/migrations/20260414_feedback.sql`

```sql
-- Geri bildirim tablosu
CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  customer_name TEXT DEFAULT '',
  table_number TEXT DEFAULT NULL,
  language TEXT DEFAULT 'tr',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index'ler
CREATE INDEX idx_feedback_restaurant ON feedback(restaurant_id);
CREATE INDEX idx_feedback_created ON feedback(restaurant_id, created_at DESC);

-- RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Public (anonim) insert — herkes geri bildirim bırakabilir
CREATE POLICY "Anyone can insert feedback"
  ON feedback FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Sadece restoran sahibi kendi feedback'lerini görebilir
CREATE POLICY "Restaurant owner can view own feedback"
  ON feedback FOR SELECT
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM profiles WHERE id = auth.uid()
    )
    OR is_super_admin()
  );

-- Super admin tümünü silebilir
CREATE POLICY "Super admin can delete feedback"
  ON feedback FOR DELETE
  TO authenticated
  USING (is_super_admin());

-- Restoran sahibi kendi feedback'lerini silebilir
CREATE POLICY "Restaurant owner can delete own feedback"
  ON feedback FOR DELETE
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Google Place ID kolonu (restaurants tablosuna)
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS google_place_id TEXT DEFAULT NULL;

-- Feature toggle
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS feature_feedback BOOLEAN DEFAULT TRUE;
```

**NOT:** Bu SQL, Supabase Dashboard → SQL Editor'de manuel çalıştırılacak.

---

### 2. Admin Panel — Google Place ID Ayarı

**Konum:** RestaurantDashboard.tsx → Profil tabı → Sosyal Medya bölümü

**Mevcut:** social_google_maps input'u zaten var.

**Eklenecek:**
- `google_place_id` input alanı (sosyal medya bölümünün altına veya yanına)
- Label: "Google Place ID"
- Placeholder: "ChIJ... (Google Maps'ten kopyalayın)"
- Altında muted yardım notu: "Google Maps'te işletmenizi arayın → Paylaş → Yer kimliğini kopyalayın"
- İkon: CiLocationOn veya CiMap

**google_place_id nasıl bulunur:**
- https://developers.google.com/maps/documentation/places/web-service/place-id-finder
- Veya Google Maps → İşletme → URL'deki place ID

**Kaydetme:** Mevcut profil kaydetme fonksiyonuna `google_place_id` ekle.

---

### 3. Admin Panel — Geri Bildirim Paneli

**Konum:** Sol sidebar → "Müşteri İlişkileri" grubunda yeni item: "Geri Bildirim" (CiChat1 ikonu)
- Mevcut "Çağrılar" altına ekle
- Okunmamış/yeni feedback sayısı badge (son 24 saat)

**Panel İçeriği:**

#### Üst Kısım — Özet Kartları (3 kart, yatay)
```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ ⭐ 4.3/5    │ │ 📝 47       │ │ 📊 Bu Hafta  │
│ Ortalama    │ │ Toplam      │ │ +12 yeni     │
└─────────────┘ └─────────────┘ └─────────────┘
```

- Kart 1: Ortalama puan (1 decimal) + yıldızlar
- Kart 2: Toplam feedback sayısı
- Kart 3: Son 7 gündeki feedback sayısı

#### Filtre Bar
- Puan filtresi: "Tümü" | "⭐5" | "⭐4" | "⭐3" | "⭐2" | "⭐1" (pill/chip toggle)
- Tarih sıralaması: "En Yeni" / "En Eski" toggle

#### Feedback Listesi
Her satır:
```
┌────────────────────────────────────────────────────────┐
│ ⭐⭐⭐⭐⭐  Mehmet A.              📍 Masa 5           │
│                                     14 Nis 2026, 21:30  │
│ "Yemekler harikaydı, servis biraz yavaş ama genel      │
│  olarak memnun kaldık. Tekrar geleceğiz!"               │
│                                              [🗑 Sil]   │
└────────────────────────────────────────────────────────┘
```

- Sol: yıldız puanı (dolu/boş yıldız ikonları, sarı renk)
- Sağ üst: müşteri adı (varsa, yoksa "Anonim") + masa no (varsa)
- Sağ üst: tarih/saat
- Alt: yorum metni (varsa)
- Sağ alt: silme butonu (CiTrash, kırmızı, onay dialog)
- Yorum yoksa sadece yıldız + isim + tarih göster (tek satır)

#### Boş Durum
- Hiç feedback yoksa: "Henüz geri bildirim yok. Müşterileriniz menüden geri bildirim bırakabilir."
- CiChat1 ikonu büyük, muted

#### Sayfalama
- 20 feedback/sayfa
- "Daha Fazla Yükle" butonu (offset-based pagination)

---

### 4. Admin Panel — Feature Toggle

**Konum:** Profil tabı → "Menü Özellikleri" bölümü (mevcut toggle'ların yanına)

**Eklenecek toggle:**
- "Geri Bildirim" — Müşterilerden yıldız puanı ve yorum toplayın
- İkon: CiChat1 veya CiStar
- feature_feedback kolonu ile kontrol

---

### 5. Public Menü — Geri Bildirim Butonu

**Konum ve Tetikleme:**

İki yerden erişilebilir:

**A) Menü header'ında:**
- Restoran bilgileri bölümünde (sosyal medya ikonlarının yanında veya altında)
- Küçük text link: "Nasıl Buldunuz?" veya "Geri Bildirim"
- CiChat1 ikonu + text

**B) Sepet drawer'ında WhatsApp gönderiminden sonra:**
- WhatsApp ile sipariş gönderdikten sonra otomatik feedback prompt'u (opsiyonel, sonraya bırakılabilir)

**Tıklama:** Feedback modalı açılır.

**Görünürlük:** `feature_feedback !== false` ise göster (null dahil varsayılan aktif).

---

### 6. Public Menü — Geri Bildirim Modalı

**Tasarım:** Alttan açılan bottom sheet (ürün detay modalı gibi).

**Akış — 2 Aşamalı:**

#### Aşama 1: Puan + Yorum

```
╔══════════════════════════════════════════╗
║  ─── (drag handle)                       ║
║                                          ║
║        Deneyiminizi Değerlendirin         ║
║                                          ║
║     ☆   ☆   ☆   ☆   ☆                   ║
║   (büyük, tıklanabilir yıldızlar)        ║
║                                          ║
║  ┌──────────────────────────────────────┐║
║  │ Yorumunuz (isteğe bağlı)...         │║
║  │                                      │║
║  └──────────────────────────────────────┘║
║                                          ║
║  ┌──────────────────────────────────────┐║
║  │ Adınız (isteğe bağlı)...            │║
║  └──────────────────────────────────────┘║
║                                          ║
║  ┌──────────────────────────────────────┐║
║  │        ✓ Gönder                      │║
║  └──────────────────────────────────────┘║
╚══════════════════════════════════════════╝
```

**Yıldız Puanlama:**
- 5 yıldız, büyük (40x40px), boş/dolu toggle
- Tıklayınca dolsun, animasyonlu (scale pulse)
- Renk: sarı/gold (#F59E0B veya #FBBF24)
- Puan seçmeden "Gönder" butonu disabled

**Yorum Alanı:**
- Textarea, 3 satır, max 500 karakter
- Placeholder: "Deneyiminizi paylaşın... (isteğe bağlı)"
- Karakter sayacı sağ alt köşede

**Ad Alanı:**
- Tek satır input
- Placeholder: "Adınız (isteğe bağlı)"

**Gönder Butonu:**
- Full-width, tema ana rengi, 48px yükseklik
- Puan seçilmeden disabled
- Loading durumu: spinner

#### Aşama 2: Teşekkür + Akıllı Google Yönlendirme

**Puan 4 veya 5 ise VE google_place_id doluysa:**
```
╔══════════════════════════════════════════╗
║                                          ║
║           🎉 Teşekkür Ederiz!            ║
║                                          ║
║   Geri bildiriminiz restoran için çok     ║
║   değerli.                               ║
║                                          ║
║   ──────────────────────────────────────  ║
║                                          ║
║   Google'da da değerlendirir misiniz?     ║
║   Restoranımıza çok yardımcı olursunuz.  ║
║                                          ║
║  ┌──────────────────────────────────────┐║
║  │  ⭐ Google'da Değerlendir            │║
║  └──────────────────────────────────────┘║
║                                          ║
║          Hayır, teşekkürler              ║
║                                          ║
╚══════════════════════════════════════════╝
```

- "Google'da Değerlendir" butonu: beyaz arka plan, Google renkleri veya tema rengi
  - Tıklayınca: `https://search.google.com/local/writereview?placeid={google_place_id}` yeni sekmede açılır
- "Hayır, teşekkürler" text link: modalı kapatır
- Konfeti veya checkmark animasyonu

**Puan 1-3 ise VEYA google_place_id boşsa:**
```
╔══════════════════════════════════════════╗
║                                          ║
║           🙏 Teşekkür Ederiz!            ║
║                                          ║
║   Geri bildiriminiz bize ulaştı.         ║
║   Deneyiminizi iyileştirmek için          ║
║   çalışacağız.                           ║
║                                          ║
║          [Tamam]                          ║
║                                          ║
╚══════════════════════════════════════════╝
```

- Düşük puan Google'a yönlendirilMEZ (akıllı yönlendirme)
- "Tamam" butonu: modalı kapatır
- 3 saniye sonra otomatik kapanma

---

### 7. Geri Bildirim Gönderim Mantığı

```typescript
const submitFeedback = async () => {
  // Supabase'e anonim insert (RLS: anon insert izni var)
  const { error } = await supabase
    .from('feedback')
    .insert({
      restaurant_id: restaurant.id,
      rating: selectedRating,
      comment: comment.trim(),
      customer_name: customerName.trim(),
      table_number: tableNumber || null,  // URL'den ?table=X
      language: currentLanguage,           // mevcut dil
    });

  if (!error) {
    // Aşama 2'ye geç (teşekkür ekranı)
    setFeedbackStep('thankyou');
  }
};
```

**Önemli:**
- Auth gerekmez — anonim insert (anon key ile)
- Supabase client zaten PublicMenu'de mevcut (menü verisi çekmek için)
- Spam koruması: aynı tarayıcıdan 5 dakikada 1 feedback (client-side, sessionStorage ile)

---

### 8. Çok Dilli UI String'ler

Mevcut translations objesine eklenecek (7 dil):

```typescript
// Geri Bildirim
feedback: 'Geri Bildirim',
howWasIt: 'Nasıl Buldunuz?',
rateExperience: 'Deneyiminizi Değerlendirin',
yourComment: 'Yorumunuz (isteğe bağlı)...',
shareExperience: 'Deneyiminizi paylaşın...',
yourName: 'Adınız (isteğe bağlı)',
submit: 'Gönder',
thankYou: 'Teşekkür Ederiz!',
feedbackReceived: 'Geri bildiriminiz restoran için çok değerli.',
feedbackReceivedLow: 'Geri bildiriminiz bize ulaştı. Deneyiminizi iyileştirmek için çalışacağız.',
rateOnGoogle: 'Google\'da da değerlendirir misiniz?',
googleHelps: 'Restoranımıza çok yardımcı olursunuz.',
rateOnGoogleBtn: 'Google\'da Değerlendir',
noThanks: 'Hayır, teşekkürler',
ok: 'Tamam',
```

**İngilizce:**
```typescript
feedback: 'Feedback',
howWasIt: 'How Was It?',
rateExperience: 'Rate Your Experience',
yourComment: 'Your comment (optional)...',
shareExperience: 'Share your experience...',
yourName: 'Your name (optional)',
submit: 'Submit',
thankYou: 'Thank You!',
feedbackReceived: 'Your feedback is very valuable to the restaurant.',
feedbackReceivedLow: 'Your feedback has been received. We will work to improve your experience.',
rateOnGoogle: 'Would you also rate us on Google?',
googleHelps: 'It would really help our restaurant.',
rateOnGoogleBtn: 'Rate on Google',
noThanks: 'No, thanks',
ok: 'OK',
```

**Arapça:**
```typescript
feedback: 'تقييم',
howWasIt: 'كيف كانت تجربتك؟',
rateExperience: 'قيّم تجربتك',
yourComment: '...تعليقك (اختياري)',
shareExperience: '...شاركنا تجربتك',
yourName: '(اسمك (اختياري',
submit: 'إرسال',
thankYou: '!شكراً لك',
feedbackReceived: '.تقييمك قيّم جداً للمطعم',
feedbackReceivedLow: '.تم استلام تقييمك. سنعمل على تحسين تجربتك',
rateOnGoogle: 'هل يمكنك تقييمنا على جوجل أيضاً؟',
googleHelps: '.سيساعد مطعمنا كثيراً',
rateOnGoogleBtn: 'قيّم على جوجل',
noThanks: 'لا، شكراً',
ok: 'حسناً',
```

**Almanca:**
```typescript
feedback: 'Feedback',
howWasIt: 'Wie war es?',
rateExperience: 'Bewerten Sie Ihr Erlebnis',
yourComment: 'Ihr Kommentar (optional)...',
shareExperience: 'Teilen Sie Ihr Erlebnis...',
yourName: 'Ihr Name (optional)',
submit: 'Absenden',
thankYou: 'Vielen Dank!',
feedbackReceived: 'Ihr Feedback ist für das Restaurant sehr wertvoll.',
feedbackReceivedLow: 'Ihr Feedback wurde empfangen. Wir werden daran arbeiten, Ihr Erlebnis zu verbessern.',
rateOnGoogle: 'Würden Sie uns auch bei Google bewerten?',
googleHelps: 'Es würde unserem Restaurant sehr helfen.',
rateOnGoogleBtn: 'Bei Google bewerten',
noThanks: 'Nein, danke',
ok: 'OK',
```

**Fransızca:**
```typescript
feedback: 'Avis',
howWasIt: 'Comment c\'était ?',
rateExperience: 'Évaluez votre expérience',
yourComment: 'Votre commentaire (facultatif)...',
shareExperience: 'Partagez votre expérience...',
yourName: 'Votre nom (facultatif)',
submit: 'Envoyer',
thankYou: 'Merci !',
feedbackReceived: 'Votre avis est très précieux pour le restaurant.',
feedbackReceivedLow: 'Votre avis a été reçu. Nous travaillerons à améliorer votre expérience.',
rateOnGoogle: 'Pourriez-vous aussi nous évaluer sur Google ?',
googleHelps: 'Cela aiderait beaucoup notre restaurant.',
rateOnGoogleBtn: 'Évaluer sur Google',
noThanks: 'Non, merci',
ok: 'OK',
```

**Rusça:**
```typescript
feedback: 'Отзыв',
howWasIt: 'Как вам?',
rateExperience: 'Оцените ваш опыт',
yourComment: 'Ваш комментарий (необязательно)...',
shareExperience: 'Поделитесь впечатлениями...',
yourName: 'Ваше имя (необязательно)',
submit: 'Отправить',
thankYou: 'Спасибо!',
feedbackReceived: 'Ваш отзыв очень ценен для ресторана.',
feedbackReceivedLow: 'Ваш отзыв получен. Мы будем работать над улучшением.',
rateOnGoogle: 'Оцените нас также в Google?',
googleHelps: 'Это очень поможет нашему ресторану.',
rateOnGoogleBtn: 'Оценить в Google',
noThanks: 'Нет, спасибо',
ok: 'ОК',
```

**Çince:**
```typescript
feedback: '反馈',
howWasIt: '感觉如何？',
rateExperience: '评价您的体验',
yourComment: '您的评论（可选）...',
shareExperience: '分享您的体验...',
yourName: '您的姓名（可选）',
submit: '提交',
thankYou: '谢谢！',
feedbackReceived: '您的反馈对餐厅非常有价值。',
feedbackReceivedLow: '我们已收到您的反馈，将努力改善您的体验。',
rateOnGoogle: '您也可以在Google上评价我们吗？',
googleHelps: '这对我们的餐厅非常有帮助。',
rateOnGoogleBtn: '在Google上评价',
noThanks: '不了，谢谢',
ok: '好的',
```

---

### 9. Yıldız Bileşeni

**Dosya:** `src/components/StarRating.tsx`

Tekrar kullanılabilir yıldız puanlama bileşeni:

```typescript
interface StarRatingProps {
  rating: number;           // mevcut puan (0-5)
  onRate?: (n: number) => void;  // tıklama callback (yoksa read-only)
  size?: number;            // ikon boyutu (px), default 40
  color?: string;           // dolu renk, default '#F59E0B'
}
```

**Davranış:**
- `onRate` varsa: interactive (tıklanabilir, hover efekti)
- `onRate` yoksa: read-only (admin panelde gösterim için)
- Yıldız ikonu: CiStar (Circum Icons)
- Dolu yıldız: sarı (#F59E0B), boş yıldız: gri (tema uyumlu)
- Hover: yıldızların üzerine gelince önizleme (hover'daki yıldıza kadar doldur)
- Tıklama: scale pulse animasyonu

---

### 10. Admin Panel — Sidebar Güncelleme

**Mevcut sidebar grupları:**
```
Menü Yönetimi
  - Menü
  - Çeviri
  - QR Kodları

Müşteri İlişkileri
  - Çağrılar (badge: pending count)
  - Promosyonlar

Tema & Profil
  - Tema
  - Profil
```

**Güncelleme — "Müşteri İlişkileri" grubuna ekle:**
```
Müşteri İlişkileri
  - Çağrılar (badge: pending count)
  - Geri Bildirim (badge: son 24 saat yeni feedback sayısı)  ← YENİ
  - Promosyonlar
```

- İkon: CiChat1
- Badge: son 24 saatteki feedback sayısı (yeni olanlar)
- Badge renk: yeşil (yeni feedback olumlu bir şey)

---

### 11. Edge Case'ler

1. **google_place_id boşsa:** Google yönlendirme adımı hiç gösterilmez, sadece teşekkür mesajı
2. **feature_feedback kapalıysa:** Public menüde feedback butonu gizli
3. **Spam koruması:** sessionStorage ile aynı tarayıcıdan 5 dakikada 1 feedback
4. **Çok uzun yorum:** max 500 karakter, karakter sayacı göster
5. **Boş yorum:** OK — sadece yıldız puanı yeterli
6. **Anonim:** İsim alanı boşsa "Anonim" olarak kaydet (DB'de boş string)
7. **Masa numarası:** URL'den ?table=X varsa otomatik kaydet
8. **Dil:** Feedback gönderilirken mevcut menü dili kaydedilir (hangi dilde bırakıldığını bilmek için)
9. **Silme:** Admin feedback silebilir (confirm dialog)
10. **Puan yok hata:** Puan seçmeden submit butonu disabled, tıklanamaz

---

## TEKNİK KISITLAMALAR

1. **Yeni npm paketi KURMA** — mevcut paketlerle çöz
2. **shadcn/ui iç Lucide ikonlarına DOKUNMA** — yeni ikonlar sadece Circum Icons
3. **Font:** Playfair Display (başlıklar) + Inter (body)
4. **Marka renkleri:** #FF4F7A (Strawberry Pink), #1C1C1E (Deep Charcoal), #F7F7F8 (Off-White)
5. **Spacing:** 4'ün katları (4, 8, 12, 16, 24, 32px)
6. **İkon boyutu:** Yanındaki metnin line-height'ına eşit
7. **3 tema uyumu zorunlu:** white, black, red
8. **Mevcut S.* inline style pattern'ını kullan**
9. **Anonim Supabase insert:** `.from('feedback').insert()` — anon key yeterli, auth gerekmez
10. **Google Reviews URL:** `https://search.google.com/local/writereview?placeid={PLACE_ID}`

---

## DOSYA PLANI

| Dosya | Aksiyon | Açıklama |
|-------|---------|----------|
| `supabase/migrations/20260414_feedback.sql` | YENİ | feedback tablosu + RLS + google_place_id + feature_feedback |
| `src/components/StarRating.tsx` | YENİ | Tekrar kullanılabilir yıldız puanlama (interactive + read-only) |
| `src/components/FeedbackModal.tsx` | YENİ | 2 aşamalı modal (puan+yorum → teşekkür+Google) |
| `src/components/FeedbackPanel.tsx` | YENİ | Admin panel feedback listesi (özet + filtre + liste) |
| `src/pages/PublicMenu.tsx` | DÜZENLE | Feedback butonu + modal entegrasyonu |
| `src/pages/RestaurantDashboard.tsx` | DÜZENLE | Sidebar'a feedback item + profilde google_place_id + feature toggle |

---

## TEST SENARYOLARI

1. Public menüde "Nasıl Buldunuz?" butonuna tıkla → modal açılsın
2. Yıldız seçmeden "Gönder" → buton disabled olmalı
3. 4 yıldız seç + yorum yaz + isim gir → "Gönder" → başarılı
4. Puan 4-5 + google_place_id dolu → Google yönlendirme göster
5. Puan 1-3 → Google yönlendirme gösterME, sadece teşekkür
6. google_place_id boş + puan 5 → Google yönlendirme gösterME
7. "Google'da Değerlendir" tıkla → yeni sekmede Google Reviews açılsın
8. "Hayır, teşekkürler" tıkla → modal kapansın
9. 5 dakika içinde 2. feedback → engelle (spam koruması)
10. Admin panelde feedback listesi → veriler doğru gösteriliyor
11. Admin filtre: sadece 5 yıldız → doğru filtreleme
12. Admin silme → onay dialog → silinsin
13. feature_feedback kapalı → public menüde buton gizli
14. 3 temada test: white, black, red
15. 7 dilde test: string'ler doğru

---

## ÖNCELİK SIRASI

1. DB migration dosyası
2. `StarRating.tsx` bileşeni
3. `FeedbackModal.tsx` (2 aşamalı)
4. PublicMenu.tsx'e feedback butonu + modal entegrasyonu
5. `FeedbackPanel.tsx` (admin)
6. RestaurantDashboard.tsx sidebar + profil güncellemeleri
7. Çok dilli string'ler (7 dil)
8. Spam koruması + edge case'ler
9. Test

---

## NOTLAR

- Bu prompt ~400-500 satır yeni kod.
- Feedback tablosu anonim insert destekliyor — auth gerekmez.
- Google Reviews yönlendirme en önemli parça — restoran sahipleri bunu çok sevecek.
- Akıllı yönlendirme (4-5 yıldız → Google, 1-3 → iç) sektörde yaygın best practice.
- StarRating bileşeni hem public modal hem admin panelde kullanılacak (tekrar kullanılabilir).
- Admin sidebar badge'i: basit count query (son 24 saat).
