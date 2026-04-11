import { useEffect, useMemo, useState } from 'react';
import { Star, ChatCircle } from '@phosphor-icons/react';
import DOMPurify from 'dompurify';
import { supabase } from '@/lib/supabase';
import StarRating from '@/components/StarRating';
import { getFingerprint } from '@/lib/fingerprint';

interface ReviewsSectionProps {
  restaurantId: string;
  language: string;
  theme: 'white' | 'black' | 'red';
  tableNumber?: string | null;
}

interface Review {
  id: string;
  customer_name: string | null;
  rating: number;
  comment: string;
  created_at: string;
  admin_reply: string | null;
  admin_reply_at: string | null;
}

interface ReviewStats {
  average_rating: number;
  total_reviews: number;
}

type ThemeStyles = {
  sectionBg: string;
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  inputBg: string;
  inputText: string;
  starActive: string;
  starInactive: string;
  replyBg: string;
  buttonBg: string;
  buttonText: string;
};

const getThemeStyles = (theme: 'white' | 'black' | 'red'): ThemeStyles => {
  switch (theme) {
    case 'black':
      return {
        sectionBg: '#1C1C1E', cardBg: '#2C2C2E', textPrimary: '#FFFFFF',
        textSecondary: '#8E8E93', border: '#3A3A3C', inputBg: '#3A3A3C',
        inputText: '#FFFFFF', starActive: '#FF4F7A', starInactive: '#3A3A3C',
        replyBg: '#2A2A2E', buttonBg: '#FF4F7A', buttonText: '#FFFFFF',
      };
    case 'red':
      return {
        sectionBg: '#FFF5F5', cardBg: '#FFFFFF', textPrimary: '#1C1C1E',
        textSecondary: '#6B7280', border: '#FEE2E2', inputBg: '#FFFFFF',
        inputText: '#1C1C1E', starActive: '#FF4F7A', starInactive: '#E5E7EB',
        replyBg: '#FFF1F2', buttonBg: '#FF4F7A', buttonText: '#FFFFFF',
      };
    default:
      return {
        sectionBg: '#F7F7F8', cardBg: '#FFFFFF', textPrimary: '#1C1C1E',
        textSecondary: '#6B7280', border: '#E5E7EB', inputBg: '#FFFFFF',
        inputText: '#1C1C1E', starActive: '#FF4F7A', starInactive: '#E5E7EB',
        replyBg: '#F3F4F6', buttonBg: '#FF4F7A', buttonText: '#FFFFFF',
      };
  }
};

type StringSet = {
  title: string;
  reviews: string;
  writeReview: string;
  yourName: string;
  yourComment: string;
  submit: string;
  submitting: string;
  submitted: string;
  pendingNote: string;
  noReviews: string;
  showMore: string;
  anonymous: string;
  ownerReply: string;
  minChars: string;
  rateFirst: string;
  spamWait: string;
};

const STRINGS: Record<string, StringSet> = {
  tr: {
    title: 'Müşteri Yorumları', reviews: 'yorum', writeReview: 'Deneyiminizi paylaşın',
    yourName: 'İsminiz (opsiyonel)', yourComment: 'Yorumunuz...', submit: 'Gönder',
    submitting: 'Gönderiliyor...', submitted: 'Yorumunuz gönderildi!',
    pendingNote: 'İşletme onayladıktan sonra görünecektir.',
    noReviews: 'Henüz yorum yok. İlk yorumu siz yazın!', showMore: 'Daha fazla göster',
    anonymous: 'Misafir', ownerReply: 'İşletme yanıtı',
    minChars: 'En az 10 karakter', rateFirst: 'Lütfen puan verin', spamWait: 'Lütfen biraz bekleyin',
  },
  en: {
    title: 'Customer Reviews', reviews: 'reviews', writeReview: 'Share your experience',
    yourName: 'Your name (optional)', yourComment: 'Your review...', submit: 'Submit',
    submitting: 'Submitting...', submitted: 'Your review has been submitted!',
    pendingNote: 'It will appear once approved.',
    noReviews: 'No reviews yet. Be the first!', showMore: 'Show more',
    anonymous: 'Guest', ownerReply: 'Business reply',
    minChars: 'Minimum 10 characters', rateFirst: 'Please rate first', spamWait: 'Please wait a moment',
  },
  ar: {
    title: 'آراء العملاء', reviews: 'تقييمات', writeReview: 'شارك تجربتك',
    yourName: 'اسمك (اختياري)', yourComment: 'تعليقك...', submit: 'إرسال',
    submitting: 'جار الإرسال...', submitted: 'تم إرسال تقييمك!',
    pendingNote: 'سيظهر بعد موافقة الإدارة.',
    noReviews: 'لا توجد تقييمات بعد. كن الأول!', showMore: 'عرض المزيد',
    anonymous: 'ضيف', ownerReply: 'رد الإدارة',
    minChars: '10 أحرف على الأقل', rateFirst: 'يرجى التقييم أولاً', spamWait: 'يرجى الانتظار قليلاً',
  },
  zh: {
    title: '顾客评价', reviews: '条评价', writeReview: '分享您的体验',
    yourName: '您的姓名（可选）', yourComment: '您的评价...', submit: '提交',
    submitting: '提交中...', submitted: '您的评价已提交！',
    pendingNote: '审核通过后将显示。',
    noReviews: '暂无评价，快来抢先评论！', showMore: '显示更多',
    anonymous: '访客', ownerReply: '商家回复',
    minChars: '至少10个字符', rateFirst: '请先评分', spamWait: '请稍候',
  },
  de: {
    title: 'Kundenbewertungen', reviews: 'Bewertungen', writeReview: 'Teilen Sie Ihre Erfahrung',
    yourName: 'Ihr Name (optional)', yourComment: 'Ihre Bewertung...', submit: 'Absenden',
    submitting: 'Wird gesendet...', submitted: 'Ihre Bewertung wurde gesendet!',
    pendingNote: 'Sie erscheint nach Genehmigung.',
    noReviews: 'Noch keine Bewertungen. Seien Sie der Erste!', showMore: 'Mehr anzeigen',
    anonymous: 'Gast', ownerReply: 'Antwort des Unternehmens',
    minChars: 'Mindestens 10 Zeichen', rateFirst: 'Bitte bewerten', spamWait: 'Bitte warten Sie',
  },
  fr: {
    title: 'Avis Clients', reviews: 'avis', writeReview: 'Partagez votre expérience',
    yourName: 'Votre nom (optionnel)', yourComment: 'Votre avis...', submit: 'Envoyer',
    submitting: 'Envoi...', submitted: 'Votre avis a été envoyé !',
    pendingNote: 'Il apparaîtra après validation.',
    noReviews: 'Aucun avis pour le moment. Soyez le premier !', showMore: 'Voir plus',
    anonymous: 'Invité', ownerReply: 'Réponse de l\'établissement',
    minChars: 'Minimum 10 caractères', rateFirst: 'Veuillez noter', spamWait: 'Veuillez patienter',
  },
  ru: {
    title: 'Отзывы клиентов', reviews: 'отзывов', writeReview: 'Поделитесь опытом',
    yourName: 'Ваше имя (необязательно)', yourComment: 'Ваш отзыв...', submit: 'Отправить',
    submitting: 'Отправка...', submitted: 'Ваш отзыв отправлен!',
    pendingNote: 'Появится после одобрения.',
    noReviews: 'Отзывов пока нет. Будьте первым!', showMore: 'Показать больше',
    anonymous: 'Гость', ownerReply: 'Ответ заведения',
    minChars: 'Минимум 10 символов', rateFirst: 'Пожалуйста, оцените', spamWait: 'Пожалуйста, подождите',
  },
};

function getRelativeTime(dateStr: string, lang: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  const t: Record<string, Record<string, string>> = {
    tr: { now: 'Az önce', min: ' dk önce', hour: ' saat önce', day: ' gün önce', week: ' hafta önce', month: ' ay önce' },
    en: { now: 'Just now', min: ' min ago', hour: ' hours ago', day: ' days ago', week: ' weeks ago', month: ' months ago' },
    ar: { now: 'الآن', min: ' دقيقة', hour: ' ساعة', day: ' يوم', week: ' أسبوع', month: ' شهر' },
    zh: { now: '刚刚', min: '分钟前', hour: '小时前', day: '天前', week: '周前', month: '月前' },
    de: { now: 'Gerade', min: ' Min.', hour: ' Std.', day: ' Tage', week: ' Wochen', month: ' Monate' },
    fr: { now: 'À l\'instant', min: ' min', hour: ' h', day: ' jours', week: ' sem.', month: ' mois' },
    ru: { now: 'Только что', min: ' мин.', hour: ' ч.', day: ' дн.', week: ' нед.', month: ' мес.' },
  };

  const l = t[lang] || t['en'];
  if (diffMins < 1) return l.now;
  if (diffMins < 60) return diffMins + l.min;
  if (diffHours < 24) return diffHours + l.hour;
  if (diffDays < 7) return diffDays + l.day;
  if (diffWeeks < 4) return diffWeeks + l.week;
  return diffMonths + l.month;
}

const COOLDOWN_MS = 10 * 60 * 1000;

export default function ReviewsSection({ restaurantId, language, theme, tableNumber }: ReviewsSectionProps) {
  const t = STRINGS[language] || STRINGS.en;
  const S = useMemo(() => getThemeStyles(theme), [theme]);
  const isRTL = language === 'ar';

  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({ average_rating: 0, total_reviews: 0 });
  const [visibleCount, setVisibleCount] = useState(5);
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(0);
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const [reviewsRes, statsRes] = await Promise.all([
        supabase
          .from('reviews')
          .select('id, customer_name, rating, comment, created_at, admin_reply, admin_reply_at')
          .eq('restaurant_id', restaurantId)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase.rpc('get_review_stats', { p_restaurant_id: restaurantId }),
      ]);
      if (cancelled) return;
      setReviews((reviewsRes.data as Review[]) || []);
      const statsRow = Array.isArray(statsRes.data) ? statsRes.data[0] : statsRes.data;
      if (statsRow && typeof statsRow === 'object') {
        setStats({
          average_rating: Number((statsRow as { average_rating?: number }).average_rating || 0),
          total_reviews: Number((statsRow as { total_reviews?: number }).total_reviews || 0),
        });
      }
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (rating < 1) {
      setFormError(t.rateFirst);
      return;
    }
    const sanitizedComment = DOMPurify.sanitize(comment.trim(), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
    if (sanitizedComment.length < 10) {
      setFormError(t.minChars);
      return;
    }
    if (sanitizedComment.length > 500) {
      setFormError(t.minChars);
      return;
    }

    try {
      const cooldownKey = `review_submitted_${restaurantId}`;
      const last = sessionStorage.getItem(cooldownKey);
      if (last && Date.now() - Number(last) < COOLDOWN_MS) {
        setFormError(t.spamWait);
        return;
      }

      setSubmitting(true);
      const sanitizedName = DOMPurify.sanitize(name.trim().slice(0, 50), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
      const { error } = await supabase.from('reviews').insert({
        restaurant_id: restaurantId,
        customer_name: sanitizedName || t.anonymous,
        rating,
        comment: sanitizedComment,
        language,
        table_number: tableNumber || null,
        fingerprint: getFingerprint(),
      });
      if (error) throw error;

      sessionStorage.setItem(cooldownKey, String(Date.now()));
      setSubmitted(true);
      setRating(0);
      setName('');
      setComment('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  const visibleReviews = reviews.slice(0, visibleCount);
  const hasMore = reviews.length > visibleCount;

  return (
    <section
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{
        backgroundColor: S.sectionBg,
        padding: '32px 16px 40px',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <ChatCircle size={22} color={S.textPrimary} weight="fill" />
          <h2 style={{ fontSize: 20, fontWeight: 700, color: S.textPrimary, margin: 0 }}>
            {t.title}
          </h2>
        </div>

        {/* Stats */}
        {stats.total_reviews > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 16px',
              backgroundColor: S.cardBg,
              border: `1px solid ${S.border}`,
              borderRadius: 12,
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 800, color: S.textPrimary, lineHeight: 1 }}>
              {stats.average_rating.toFixed(1)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', gap: 2 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    size={16}
                    color={n <= Math.round(stats.average_rating) ? S.starActive : S.starInactive}
                    weight={n <= Math.round(stats.average_rating) ? 'fill' : 'regular'}
                  />
                ))}
              </div>
              <div style={{ fontSize: 12, color: S.textSecondary }}>
                {stats.total_reviews} {t.reviews}
              </div>
            </div>
          </div>
        )}

        {/* Review list */}
        {!loading && reviews.length === 0 && (
          <div
            style={{
              padding: '24px 16px',
              backgroundColor: S.cardBg,
              border: `1px solid ${S.border}`,
              borderRadius: 12,
              textAlign: 'center',
              color: S.textSecondary,
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            {t.noReviews}
          </div>
        )}

        {visibleReviews.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            {visibleReviews.map((r) => (
              <div
                key={r.id}
                style={{
                  padding: 16,
                  backgroundColor: S.cardBg,
                  border: `1px solid ${S.border}`,
                  borderRadius: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={14}
                        color={n <= r.rating ? S.starActive : S.starInactive}
                        weight={n <= r.rating ? 'fill' : 'regular'}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: S.textPrimary }}>
                    {r.customer_name || t.anonymous}
                  </span>
                  <span style={{ fontSize: 11, color: S.textSecondary }}>
                    · {getRelativeTime(r.created_at, language)}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 14,
                    color: S.textPrimary,
                    margin: 0,
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {r.comment}
                </p>
                {r.admin_reply && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: 12,
                      backgroundColor: S.replyBg,
                      borderRadius: 8,
                      borderLeft: `3px solid ${S.starActive}`,
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, color: S.starActive, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {t.ownerReply}
                    </div>
                    <p style={{ fontSize: 13, color: S.textPrimary, margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {r.admin_reply}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {hasMore && (
          <button
            type="button"
            onClick={() => setVisibleCount((c) => c + 5)}
            style={{
              width: '100%',
              padding: '10px 16px',
              backgroundColor: 'transparent',
              border: `1px solid ${S.border}`,
              borderRadius: 10,
              color: S.textPrimary,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: 20,
              fontFamily: 'inherit',
            }}
          >
            {t.showMore}
          </button>
        )}

        {/* Submission form */}
        <div
          style={{
            marginTop: 8,
            padding: 20,
            backgroundColor: S.cardBg,
            border: `1px solid ${S.border}`,
            borderRadius: 12,
          }}
        >
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: S.textPrimary, marginBottom: 4 }}>
                {t.submitted}
              </div>
              <div style={{ fontSize: 12, color: S.textSecondary }}>{t.pendingNote}</div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ fontSize: 14, fontWeight: 700, color: S.textPrimary, marginBottom: 12 }}>
                {t.writeReview}
              </div>

              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
                <StarRating
                  rating={rating}
                  onRate={setRating}
                  size={32}
                  color={S.starActive}
                  emptyColor={S.starInactive}
                />
              </div>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.yourName}
                maxLength={50}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: S.inputBg,
                  color: S.inputText,
                  border: `1px solid ${S.border}`,
                  borderRadius: 8,
                  fontSize: 14,
                  marginBottom: 10,
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t.yourComment}
                minLength={10}
                maxLength={500}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: S.inputBg,
                  color: S.inputText,
                  border: `1px solid ${S.border}`,
                  borderRadius: 8,
                  fontSize: 14,
                  marginBottom: 8,
                  fontFamily: 'inherit',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />

              {formError && (
                <div style={{ fontSize: 12, color: '#FF4F7A', marginBottom: 8 }}>{formError}</div>
              )}

              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: S.buttonBg,
                  color: S.buttonText,
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.6 : 1,
                  fontFamily: 'inherit',
                }}
              >
                {submitting ? t.submitting : t.submit}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
