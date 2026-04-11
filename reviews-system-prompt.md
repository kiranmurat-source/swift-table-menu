# CLAUDE CODE PROMPT — İnceleme/Yorum Sistemi (Public Reviews)
## Public Menüde Görünür Müşteri Yorumları + Admin Yönetimi

---

## GÖREV ÖZETI

Mevcut feedback sistemi (yıldız + yorum, sadece restoran sahibi görür) VAR ve DOKUNULMAYACAK. Bu prompt, public menüde herkese görünür "müşteri yorumları" sistemi ekliyor.

**3 iş:**
1. DB: reviews tablosu + RLS + feature toggle
2. Public menü: yorum listesi + yorum yazma formu
3. Admin panel: yorum yönetimi (onay/red/silme)

---

## PROJE BİLGİLERİ

- **Proje dizini:** /opt/khp/tabbled/
- **Stack:** React + Vite + TypeScript
- **Supabase project-ref:** qmnrawqvkwehufebbkxp
- **Public menü:** src/pages/PublicMenu.tsx
- **Admin sidebar:** src/components/dashboard/RestaurantDashboard.tsx (sidebar tanımı burada)
- **Admin analytics:** src/components/dashboard/RestaurantAnalytics.tsx
- **İkon kütüphanesi:** @phosphor-icons/react (Regular genel, Bold CTA, Fill toggle aktif)
- **Marka rengi:** #FF4F7A
- **Tema:** white/black/red (3 tema desteği zorunlu)
- **Dil:** Public menüde çok dilli (TR/EN/AR/ZH/DE/FR/RU minimum)

---

## MEVCUT SİSTEMDEN FARKLAR

| | Feedback (mevcut) | Reviews (yeni) |
|---|---|---|
| Görünürlük | Sadece restoran sahibi | Public — herkes görür |
| Onay | Hepsi anında kayıt | Moderasyon: pending → approved/rejected |
| Konum | Ayrı buton (menü altı) | Menü sayfasında bölüm olarak |
| Amaç | İşletmeye geri bildirim | Müşteri karar desteği |
| Puan | 1-5 yıldız | 1-5 yıldız |

---

## İŞ 1: SUPABASE SQL (AYRI ÇALIŞTIR — SQL Editor)

Aşağıdaki SQL'i prompt dosyasının başına yaz ki Murat Supabase Dashboard'da çalıştırsın:

```sql
-- =====================================================
-- REVIEWS TABLOSU
-- =====================================================

CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL DEFAULT '',
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  language TEXT DEFAULT 'tr',
  table_number TEXT,
  fingerprint TEXT,
  admin_reply TEXT,
  admin_reply_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant ON reviews(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant_status ON reviews(restaurant_id, status);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at);

-- RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Anonim insert (public menüden yorum yazma)
CREATE POLICY "Anyone can insert reviews"
  ON reviews FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Public okuma: SADECE onaylanmış yorumlar
CREATE POLICY "Anyone can read approved reviews"
  ON reviews FOR SELECT
  TO anon, authenticated
  USING (
    status = 'approved'
    OR restaurant_id IN (SELECT restaurant_id FROM profiles WHERE id = auth.uid())
    OR is_super_admin()
  );

-- Restoran sahibi güncelleme (onay/red/yanıt)
CREATE POLICY "Owner can update own reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (
    restaurant_id IN (SELECT restaurant_id FROM profiles WHERE id = auth.uid())
    OR is_super_admin()
  )
  WITH CHECK (
    restaurant_id IN (SELECT restaurant_id FROM profiles WHERE id = auth.uid())
    OR is_super_admin()
  );

-- Restoran sahibi silme
CREATE POLICY "Owner can delete own reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (
    restaurant_id IN (SELECT restaurant_id FROM profiles WHERE id = auth.uid())
    OR is_super_admin()
  );

-- Feature toggle
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS feature_reviews BOOLEAN DEFAULT TRUE;

-- Updated_at trigger
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RPC: Restoran ortalama puan ve yorum sayısı (onaylanmış)
CREATE OR REPLACE FUNCTION get_review_stats(p_restaurant_id UUID)
RETURNS TABLE(avg_rating NUMERIC, review_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROUND(AVG(r.rating)::NUMERIC, 1) as avg_rating,
    COUNT(*)::BIGINT as review_count
  FROM reviews r
  WHERE r.restaurant_id = p_restaurant_id
    AND r.status = 'approved';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## İŞ 2: PUBLIC MENÜ — YORUM LİSTESİ + YORUM YAZMA

### 2A: Yeni Bileşen — src/components/public/ReviewsSection.tsx

Public menüde, menü ürünleri bittikten sonra (footer'dan önce) bir "Müşteri Yorumları" bölümü.

**Yapı:**

```
┌─────────────────────────────────────────────┐
│  ⭐ 4.3  ·  24 yorum                        │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │ ★★★★★  Ali K.                       │   │
│  │ Harika lezzetler, çok memnun kaldık │   │
│  │ 2 gün önce                          │   │
│  │                                      │   │
│  │ 💬 İşletme yanıtı:                  │   │
│  │ Teşekkürler Ali Bey, yine bekleriz! │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │ ★★★★☆  Elif D.                      │   │
│  │ Yemekler güzel ama servis biraz yavaş│   │
│  │ 5 gün önce                          │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  [Daha fazla göster]  (ilk 5, sonra 5'er)  │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │  Deneyiminizi paylaşın              │   │
│  │  ┌────┐  İsminiz: [___________]     │   │
│  │  │★★★★│  [Yorumunuz...         ]     │   │
│  │  └────┘  [    Gönder    ]            │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

**Props:**

```typescript
interface ReviewsSectionProps {
  restaurantId: string;
  language: string;
  theme: 'white' | 'black' | 'red';
  tableNumber?: string | null;
}
```

**Veri çekme:**

```typescript
// Onaylanmış yorumları çek (son 20, en yeni önce)
const { data: reviews } = await supabase
  .from('reviews')
  .select('*')
  .eq('restaurant_id', restaurantId)
  .eq('status', 'approved')
  .order('created_at', { ascending: false })
  .limit(20);

// Ortalama puan + yorum sayısı
const { data: stats } = await supabase.rpc('get_review_stats', {
  p_restaurant_id: restaurantId,
});
```

**Yorum yazma formu:**

```typescript
// Form state
const [reviewName, setReviewName] = useState('');
const [reviewRating, setReviewRating] = useState(0);
const [reviewComment, setReviewComment] = useState('');
const [reviewSubmitting, setReviewSubmitting] = useState(false);
const [reviewSubmitted, setReviewSubmitted] = useState(false);

// Submit
const handleReviewSubmit = async () => {
  if (reviewRating === 0 || !reviewComment.trim()) return;
  
  setReviewSubmitting(true);
  try {
    await supabase.from('reviews').insert({
      restaurant_id: restaurantId,
      customer_name: reviewName.trim() || getAnonymousLabel(language),
      rating: reviewRating,
      comment: reviewComment.trim(),
      language,
      table_number: tableNumber,
      fingerprint: getFingerprint(), // mevcut fingerprint.ts kullan
    });
    
    setReviewSubmitted(true);
    setReviewName('');
    setReviewRating(0);
    setReviewComment('');
  } catch (err) {
    console.error('Review submit error:', err);
  } finally {
    setReviewSubmitting(false);
  }
};
```

**Spam koruması:**
- sessionStorage ile aynı restoranda 10 dakikada 1 yorum
- Fingerprint kaydı (mevcut src/lib/fingerprint.ts kullan)
- Yorum min 10 karakter, max 500 karakter
- İsim max 50 karakter

**Başarı durumu:**
```
✅ Yorumunuz gönderildi!
İşletme onayladıktan sonra burada görünecektir.
```

**Zaman gösterimi (relative time):**
```typescript
function getRelativeTime(date: string, lang: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  
  const labels: Record<string, Record<string, string>> = {
    tr: { now: 'Az önce', min: ' dk önce', hour: ' saat önce', day: ' gün önce', week: ' hafta önce', month: ' ay önce' },
    en: { now: 'Just now', min: ' min ago', hour: ' hours ago', day: ' days ago', week: ' weeks ago', month: ' months ago' },
    ar: { now: 'الآن', min: ' دقيقة', hour: ' ساعة', day: ' يوم', week: ' أسبوع', month: ' شهر' },
    zh: { now: '刚刚', min: '分钟前', hour: '小时前', day: '天前', week: '周前', month: '月前' },
    de: { now: 'Gerade', min: ' Min.', hour: ' Std.', day: ' Tage', week: ' Wochen', month: ' Monate' },
    fr: { now: 'À l\'instant', min: ' min', hour: ' h', day: ' jours', week: ' sem.', month: ' mois' },
    ru: { now: 'Только что', min: ' мин.', hour: ' ч.', day: ' дн.', week: ' нед.', month: ' мес.' },
  };
  
  const l = labels[lang] || labels['en'];
  if (diffMins < 1) return l.now;
  if (diffMins < 60) return diffMins + l.min;
  if (diffHours < 24) return diffHours + l.hour;
  if (diffDays < 7) return diffDays + l.day;
  if (diffWeeks < 4) return diffWeeks + l.week;
  return diffMonths + l.month;
}
```

**Çok dilli string'ler:**

```typescript
const reviewStrings: Record<string, Record<string, string>> = {
  tr: {
    title: 'Müşteri Yorumları',
    reviews: 'yorum',
    writeReview: 'Deneyiminizi paylaşın',
    yourName: 'İsminiz (opsiyonel)',
    yourComment: 'Yorumunuz...',
    submit: 'Gönder',
    submitting: 'Gönderiliyor...',
    submitted: 'Yorumunuz gönderildi!',
    pendingNote: 'İşletme onayladıktan sonra burada görünecektir.',
    noReviews: 'Henüz yorum yok. İlk yorumu siz yazın!',
    showMore: 'Daha fazla göster',
    showLess: 'Daha az göster',
    anonymous: 'Misafir',
    ownerReply: 'İşletme yanıtı',
    minChars: 'En az 10 karakter yazın',
    rateFirst: 'Lütfen puan verin',
    spamWait: 'Lütfen biraz bekleyin',
    charCount: 'karakter',
  },
  en: {
    title: 'Customer Reviews',
    reviews: 'reviews',
    writeReview: 'Share your experience',
    yourName: 'Your name (optional)',
    yourComment: 'Your review...',
    submit: 'Submit',
    submitting: 'Submitting...',
    submitted: 'Your review has been submitted!',
    pendingNote: 'It will appear here once approved by the business.',
    noReviews: 'No reviews yet. Be the first to review!',
    showMore: 'Show more',
    showLess: 'Show less',
    anonymous: 'Guest',
    ownerReply: 'Business reply',
    minChars: 'Minimum 10 characters',
    rateFirst: 'Please rate first',
    spamWait: 'Please wait a moment',
    charCount: 'characters',
  },
  ar: {
    title: 'آراء العملاء',
    reviews: 'تقييم',
    writeReview: 'شاركنا تجربتك',
    yourName: 'اسمك (اختياري)',
    yourComment: 'تعليقك...',
    submit: 'إرسال',
    submitting: 'جاري الإرسال...',
    submitted: 'تم إرسال تقييمك!',
    pendingNote: 'سيظهر هنا بعد موافقة المنشأة.',
    noReviews: 'لا توجد تقييمات بعد. كن أول من يقيم!',
    showMore: 'عرض المزيد',
    showLess: 'عرض أقل',
    anonymous: 'ضيف',
    ownerReply: 'رد المنشأة',
    minChars: '10 أحرف على الأقل',
    rateFirst: 'يرجى التقييم أولاً',
    spamWait: 'يرجى الانتظار قليلاً',
    charCount: 'حرف',
  },
  zh: {
    title: '顾客评价',
    reviews: '条评价',
    writeReview: '分享您的体验',
    yourName: '您的姓名（可选）',
    yourComment: '您的评价...',
    submit: '提交',
    submitting: '提交中...',
    submitted: '您的评价已提交！',
    pendingNote: '经商家审核后将在此显示。',
    noReviews: '暂无评价，成为第一个评价者！',
    showMore: '查看更多',
    showLess: '收起',
    anonymous: '访客',
    ownerReply: '商家回复',
    minChars: '至少10个字符',
    rateFirst: '请先评分',
    spamWait: '请稍候',
    charCount: '字符',
  },
  de: {
    title: 'Kundenbewertungen',
    reviews: 'Bewertungen',
    writeReview: 'Teilen Sie Ihre Erfahrung',
    yourName: 'Ihr Name (optional)',
    yourComment: 'Ihre Bewertung...',
    submit: 'Absenden',
    submitting: 'Wird gesendet...',
    submitted: 'Ihre Bewertung wurde gesendet!',
    pendingNote: 'Sie wird nach Freigabe hier angezeigt.',
    noReviews: 'Noch keine Bewertungen. Schreiben Sie die erste!',
    showMore: 'Mehr anzeigen',
    showLess: 'Weniger anzeigen',
    anonymous: 'Gast',
    ownerReply: 'Antwort des Unternehmens',
    minChars: 'Mindestens 10 Zeichen',
    rateFirst: 'Bitte bewerten Sie zuerst',
    spamWait: 'Bitte warten Sie einen Moment',
    charCount: 'Zeichen',
  },
  fr: {
    title: 'Avis clients',
    reviews: 'avis',
    writeReview: 'Partagez votre expérience',
    yourName: 'Votre nom (optionnel)',
    yourComment: 'Votre avis...',
    submit: 'Envoyer',
    submitting: 'Envoi en cours...',
    submitted: 'Votre avis a été envoyé !',
    pendingNote: 'Il apparaîtra ici après approbation.',
    noReviews: 'Pas encore d\'avis. Soyez le premier !',
    showMore: 'Voir plus',
    showLess: 'Voir moins',
    anonymous: 'Invité',
    ownerReply: 'Réponse de l\'établissement',
    minChars: '10 caractères minimum',
    rateFirst: 'Veuillez noter d\'abord',
    spamWait: 'Veuillez patienter',
    charCount: 'caractères',
  },
  ru: {
    title: 'Отзывы клиентов',
    reviews: 'отзывов',
    writeReview: 'Поделитесь впечатлениями',
    yourName: 'Ваше имя (необязательно)',
    yourComment: 'Ваш отзыв...',
    submit: 'Отправить',
    submitting: 'Отправка...',
    submitted: 'Ваш отзыв отправлен!',
    pendingNote: 'Он появится здесь после одобрения.',
    noReviews: 'Отзывов пока нет. Будьте первым!',
    showMore: 'Показать ещё',
    showLess: 'Свернуть',
    anonymous: 'Гость',
    ownerReply: 'Ответ заведения',
    minChars: 'Минимум 10 символов',
    rateFirst: 'Сначала поставьте оценку',
    spamWait: 'Пожалуйста, подождите',
    charCount: 'символов',
  },
};
```

**Tema stilleri (inline S.* pattern — shadcn bileşenleri KULLANMA):**

ReviewsSection'da tüm stiller inline style objesi ile olmalı. Public menüdeki mevcut patterne uy.

```typescript
// Tema bazlı stiller
const getThemeStyles = (theme: string) => {
  switch (theme) {
    case 'black':
      return {
        sectionBg: '#1C1C1E',
        cardBg: '#2C2C2E',
        textPrimary: '#FFFFFF',
        textSecondary: '#8E8E93',
        border: '#3A3A3C',
        inputBg: '#3A3A3C',
        inputText: '#FFFFFF',
        starActive: '#FF4F7A',
        starInactive: '#3A3A3C',
        replyBg: '#2A2A2E',
      };
    case 'red':
      return {
        sectionBg: '#FFF5F5',
        cardBg: '#FFFFFF',
        textPrimary: '#1C1C1E',
        textSecondary: '#6B7280',
        border: '#FEE2E2',
        inputBg: '#FFFFFF',
        inputText: '#1C1C1E',
        starActive: '#FF4F7A',
        starInactive: '#E5E7EB',
        replyBg: '#FFF1F2',
      };
    default: // white
      return {
        sectionBg: '#F7F7F8',
        cardBg: '#FFFFFF',
        textPrimary: '#1C1C1E',
        textSecondary: '#6B7280',
        border: '#E5E7EB',
        inputBg: '#FFFFFF',
        inputText: '#1C1C1E',
        starActive: '#FF4F7A',
        starInactive: '#E5E7EB',
        replyBg: '#F3F4F6',
      };
  }
};
```

**Yıldız bileşeni:**
Mevcut StarRating.tsx'i import et ve kullan (src/components/StarRating.tsx). Eğer interactive ve read-only modları zaten varsa, aynısını kullan.

**"Daha fazla göster" mekanizması:**
- İlk 5 yorum göster
- "Daha fazla göster" → 5'er 5'er yükle
- Toplam 20'den fazla varsa "Daha fazla göster" son kez tıklandığında durak

**Boş durum:**
Hiç onaylanmış yorum yoksa:
```tsx
<div style={{ textAlign: 'center', padding: '32px 16px', color: ts.textSecondary }}>
  <ChatCircle size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
  <p>{str.noReviews}</p>
</div>
```

### 2B: PublicMenu.tsx'e ReviewsSection Ekleme

Menü içeriğinin sonunda, footer/powered-by'dan önce ekle:

```typescript
import ReviewsSection from '../components/public/ReviewsSection';

// feature_reviews kontrolü
{restaurant?.feature_reviews !== false && (
  <ReviewsSection
    restaurantId={restaurant.id}
    language={currentLanguage}
    theme={currentTheme}
    tableNumber={tableNumber}
  />
)}
```

**Konum:** Promosyon bölümü ve "Powered by Tabbled" arasında.

---

## İŞ 3: ADMIN PANEL — YORUM YÖNETİMİ

### 3A: Yeni Bileşen — src/components/dashboard/ReviewsPanel.tsx

**Layout:**

```
┌─────────────────────────────────────────────────────┐
│  Yorumlar                                           │
│                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ Bekleyen │ │ Onaylı   │ │ Reddedilen│            │
│  │    5     │ │   18     │ │    3      │            │
│  └──────────┘ └──────────┘ └──────────┘            │
│                                                     │
│  [Bekleyen ▼] filtre                                │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ ★★★★★  Ali K.  ·  2 saat önce  · Masa 5    │   │
│  │ "Harika lezzetler, çok memnun kaldık"       │   │
│  │                                              │   │
│  │ [✓ Onayla]  [✕ Reddet]  [🗑 Sil]            │   │
│  │                                              │   │
│  │ Yanıtla: [________________________] [Gönder] │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ ★★★☆☆  Mehmet A.  ·  1 gün önce            │   │
│  │ "Servis biraz yavaştı ama yemekler güzel"   │   │
│  │                                              │   │
│  │ [✓ Onayla]  [✕ Reddet]  [🗑 Sil]            │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**Veri çekme:**

```typescript
// Tüm yorumları çek (admin tüm status'leri görebilir)
const { data: reviews } = await supabase
  .from('reviews')
  .select('*')
  .eq('restaurant_id', restaurantId)
  .order('created_at', { ascending: false });
```

**Filtre:**
```typescript
const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
```

Varsayılan filtre: "Bekleyen" — admin önce onay bekleyenleri görsün.

**Aksiyonlar:**

```typescript
// Onayla
const handleApprove = async (id: string) => {
  await supabase.from('reviews').update({ status: 'approved' }).eq('id', id);
  refetch();
};

// Reddet
const handleReject = async (id: string) => {
  await supabase.from('reviews').update({ status: 'rejected' }).eq('id', id);
  refetch();
};

// Sil (confirm dialog ile)
const handleDelete = async (id: string) => {
  if (!confirm('Bu yorumu silmek istediğinize emin misiniz?')) return;
  await supabase.from('reviews').delete().eq('id', id);
  refetch();
};

// Yanıtla
const handleReply = async (id: string, reply: string) => {
  await supabase.from('reviews').update({
    admin_reply: reply.trim(),
    admin_reply_at: new Date().toISOString(),
  }).eq('id', id);
  refetch();
};
```

**Özet kartları (bölümün üst kısmı):**
- Bekleyen: sarı/amber arka plan, sayı büyük
- Onaylı: yeşil arka plan, sayı
- Reddedilen: kırmızı/gri arka plan, sayı
- Ortalama puan: yıldız + sayı

**Status badge renkleri:**
- pending: amber-100 bg, amber-700 text
- approved: green-100 bg, green-700 text
- rejected: red-100 bg, red-700 text

**Yanıt mekanizması:**
- Her yorum kartında "Yanıtla" input + "Gönder" butonu
- Yanıt yazıldıktan sonra kart içinde "İşletme yanıtı:" olarak görünür
- Yanıt düzenleme: mevcut yanıtı input'a doldur, "Güncelle" butonu
- Yanıt silme: "Yanıtı Kaldır" linki

### 3B: Sidebar'a Ekleme

RestaurantDashboard.tsx'te sidebar tanımında "Müşteri İlişkileri" grubuna ekle:

```typescript
// Mevcut Müşteri İlişkileri grubunda:
{ name: 'Yorumlar', icon: ChatCircle, tab: 'reviews' },
```

Phosphor ikon: `ChatCircle` (Regular)

### 3C: Feature Toggle

Admin profil tabında (mevcut feature toggle'ların yanına):

```typescript
// feature_reviews toggle
{ label: 'Müşteri Yorumları', field: 'feature_reviews' },
```

### 3D: Dashboard (RestaurantAnalytics.tsx) Entegrasyonu

Mevcut "Son Geri Bildirimler" bölümünün yanına veya altına:

```
Bekleyen Yorumlar (3)
┌──────────────────────────────────────┐
│ ★★★★★ Ali K. — "Harika lezzetler.." │
│ ★★★☆☆ Elif — "Servis yavaştı..."    │
│ ★★★★☆ Mehmet — "Güzel mekan..."     │
│                                      │
│ [Tümünü Gör →]                       │
└──────────────────────────────────────┘
```

- Sadece pending yorumları göster (max 5)
- "Tümünü Gör" → reviews tabına geç
- Bekleyen yoksa bu bölüm gizli
- feature_reviews kapalıysa bölüm gizli

---

## DOMPurify

Yorum metinleri public menüde gösterilirken DOMPurify ile sanitize et:

```typescript
import DOMPurify from 'dompurify';

// Yorum gösteriminde
<p>{DOMPurify.sanitize(review.comment)}</p>
```

---

## DOĞRULAMA

```bash
# ReviewsSection bileşeni oluşturulmuş mu?
ls -la src/components/public/ReviewsSection.tsx

# ReviewsPanel bileşeni oluşturulmuş mu?
ls -la src/components/dashboard/ReviewsPanel.tsx

# PublicMenu'de ReviewsSection import edilmiş mi?
grep -n "ReviewsSection\|feature_reviews" src/pages/PublicMenu.tsx

# Sidebar'da reviews tab'ı var mı?
grep -n "reviews\|Yorumlar\|ChatCircle" src/components/dashboard/RestaurantDashboard.tsx

# Feature toggle var mı?
grep -n "feature_reviews" src/components/dashboard/RestaurantDashboard.tsx

# Build test
cd /opt/khp/tabbled
npm run build
```

---

## HATIRLATMALAR

- SQL'i Supabase Dashboard → SQL Editor'de AYRI çalıştır
- Public menüde shadcn bileşenleri KULLANMA — inline style pattern (S.*)
- Admin panelde shadcn kullanılabilir
- Mevcut feedback sistemi DOKUNULMAYACAK — tamamen ayrı bir sistem
- StarRating.tsx zaten var — onu import et, yeniden yazma
- DOMPurify zaten kurulu — import et
- fingerprint.ts zaten var — import et
- Phosphor Icons kullan (ChatCircle, Star, Check, X, Trash)
- 3 tema desteği zorunlu (white/black/red)
- Minimum 7 dil string'i (TR/EN/AR/ZH/DE/FR/RU)
- Spam koruması: sessionStorage 10dk cooldown
- Yorum onay sistemi: pending → approved (public'te görünür) veya rejected
- Admin yanıt: public'te "İşletme yanıtı" olarak görünür
- Feature toggle: feature_reviews (varsayılan TRUE)
