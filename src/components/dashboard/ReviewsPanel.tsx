import { useEffect, useState } from 'react';
import { ChatCircle, Check, X, Trash, Star, PaperPlaneTilt } from '@phosphor-icons/react';
import { supabase } from '../../lib/supabase';

interface Review {
  id: string;
  restaurant_id: string;
  customer_name: string | null;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  language: string | null;
  table_number: string | null;
  admin_reply: string | null;
  admin_reply_at: string | null;
  created_at: string;
}

type Filter = 'all' | 'pending' | 'approved' | 'rejected';

const S = {
  wrapper: { padding: '4px 0 32px', fontFamily: "'Inter', sans-serif" } as React.CSSProperties,
  header: { fontSize: 22, fontWeight: 700, color: '#1C1C1E', margin: 0, letterSpacing: '-0.01em' } as React.CSSProperties,
  sub: { fontSize: 13, color: '#6B6B6F', marginTop: 4 } as React.CSSProperties,
  statsGrid: {
    display: 'grid',
    gap: 12,
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    marginTop: 16,
    marginBottom: 20,
  } as React.CSSProperties,
  statCard: {
    padding: 16,
    background: '#FFFFFF',
    border: '1px solid #E5E5E3',
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  } as React.CSSProperties,
  statLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: '#6B6B6F',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    marginBottom: 8,
  } as React.CSSProperties,
  statValue: { fontSize: 26, fontWeight: 800, color: '#1C1C1E', lineHeight: 1 } as React.CSSProperties,
  filters: { display: 'flex', gap: 8, flexWrap: 'wrap' as const, marginBottom: 16 } as React.CSSProperties,
  filterBtn: (active: boolean): React.CSSProperties => ({
    padding: '8px 14px',
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    border: active ? '1px solid #1C1C1E' : '1px solid #E5E5E3',
    backgroundColor: active ? '#1C1C1E' : '#FFFFFF',
    color: active ? '#FFFFFF' : '#1C1C1E',
    fontFamily: 'inherit',
  }),
  reviewCard: {
    padding: 16,
    background: '#FFFFFF',
    border: '1px solid #E5E5E3',
    borderRadius: 12,
    marginBottom: 10,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  } as React.CSSProperties,
  badge: (status: Review['status']): React.CSSProperties => ({
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    backgroundColor:
      status === 'pending' ? '#FEF3C7' : status === 'approved' ? '#DCFCE7' : '#FEE2E2',
    color: status === 'pending' ? '#92400E' : status === 'approved' ? '#166534' : '#991B1B',
  }),
  actionBtn: (variant: 'approve' | 'reject' | 'delete'): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 12px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    fontFamily: 'inherit',
    backgroundColor:
      variant === 'approve' ? '#DCFCE7' : variant === 'reject' ? '#FEE2E2' : '#F3F4F6',
    color:
      variant === 'approve' ? '#166534' : variant === 'reject' ? '#991B1B' : '#6B6B6F',
  }),
  input: {
    flex: 1,
    padding: '8px 12px',
    fontSize: 13,
    border: '1px solid #E5E5E3',
    borderRadius: 8,
    outline: 'none',
    fontFamily: 'inherit',
    backgroundColor: '#F7F7F5',
  } as React.CSSProperties,
  replyBox: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#FFF0F3',
    borderLeft: '3px solid #FF4F7A',
    borderRadius: 6,
  } as React.CSSProperties,
};

const LABEL: Record<Filter, string> = {
  all: 'Tümü',
  pending: 'Bekleyen',
  approved: 'Onaylı',
  rejected: 'Reddedilen',
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diffMin < 1) return 'Az önce';
  if (diffMin < 60) return `${diffMin} dk önce`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} saat önce`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} gün önce`;
  return d.toLocaleDateString('tr-TR');
}

export default function ReviewsPanel({ restaurantId }: { restaurantId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('pending');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchReviews = async () => {
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });
    setReviews((data || []) as Review[]);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    fetchReviews();
  }, [restaurantId]);

  const counts = {
    pending: reviews.filter((r) => r.status === 'pending').length,
    approved: reviews.filter((r) => r.status === 'approved').length,
    rejected: reviews.filter((r) => r.status === 'rejected').length,
  };

  const approvedRatings = reviews.filter((r) => r.status === 'approved').map((r) => r.rating);
  const avg = approvedRatings.length > 0
    ? approvedRatings.reduce((s, r) => s + r, 0) / approvedRatings.length
    : null;

  const filtered = filter === 'all' ? reviews : reviews.filter((r) => r.status === filter);

  const updateStatus = async (id: string, status: Review['status']) => {
    setBusyId(id);
    const { error } = await supabase.from('reviews').update({ status }).eq('id', id);
    if (!error) {
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    }
    setBusyId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu yorumu silmek istediğinize emin misiniz?')) return;
    setBusyId(id);
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    if (!error) {
      setReviews((prev) => prev.filter((r) => r.id !== id));
    }
    setBusyId(null);
  };

  const handleReply = async (id: string) => {
    const reply = (replyDrafts[id] || '').trim();
    if (!reply) return;
    setBusyId(id);
    const nowIso = new Date().toISOString();
    const { error } = await supabase
      .from('reviews')
      .update({ admin_reply: reply, admin_reply_at: nowIso })
      .eq('id', id);
    if (!error) {
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, admin_reply: reply, admin_reply_at: nowIso } : r)),
      );
      setReplyDrafts((d) => ({ ...d, [id]: '' }));
    }
    setBusyId(null);
  };

  const handleRemoveReply = async (id: string) => {
    setBusyId(id);
    const { error } = await supabase
      .from('reviews')
      .update({ admin_reply: null, admin_reply_at: null })
      .eq('id', id);
    if (!error) {
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, admin_reply: null, admin_reply_at: null } : r)),
      );
    }
    setBusyId(null);
  };

  return (
    <div style={S.wrapper}>
      <div>
        <h1 style={S.header}>Yorumlar</h1>
        <p style={S.sub}>Müşteri yorumlarını inceleyin, onaylayın veya yanıtlayın</p>
      </div>

      <div style={S.statsGrid}>
        <div style={S.statCard}>
          <div style={S.statLabel}>Bekleyen</div>
          <div style={S.statValue}>{counts.pending}</div>
        </div>
        <div style={S.statCard}>
          <div style={S.statLabel}>Onaylı</div>
          <div style={S.statValue}>{counts.approved}</div>
        </div>
        <div style={S.statCard}>
          <div style={S.statLabel}>Reddedilen</div>
          <div style={S.statValue}>{counts.rejected}</div>
        </div>
        <div style={S.statCard}>
          <div style={S.statLabel}>Ortalama</div>
          <div style={{ ...S.statValue, display: 'flex', alignItems: 'center', gap: 6 }}>
            {avg !== null ? (
              <>
                <Star size={22} color="#FF4F7A" weight="fill" />
                {avg.toFixed(1)}
              </>
            ) : (
              '—'
            )}
          </div>
        </div>
      </div>

      <div style={S.filters}>
        {(['all', 'pending', 'approved', 'rejected'] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            style={S.filterBtn(filter === f)}
            onClick={() => setFilter(f)}
          >
            {LABEL[f]}
            {f !== 'all' && ` (${counts[f]})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF', fontSize: 13 }}>
          Yükleniyor...
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 40,
            color: '#9CA3AF',
            fontSize: 13,
            border: '1px dashed #E5E5E3',
            borderRadius: 12,
            backgroundColor: '#FAFAF8',
          }}
        >
          <ChatCircle size={32} color="#D1D5DB" style={{ marginBottom: 8 }} />
          <div>Bu filtre için yorum bulunamadı</div>
        </div>
      ) : (
        <div>
          {filtered.map((r) => {
            const busy = busyId === r.id;
            return (
              <div key={r.id} style={S.reviewCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={14}
                        color={n <= r.rating ? '#FF4F7A' : '#E5E7EB'}
                        weight={n <= r.rating ? 'fill' : 'regular'}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1C1C1E' }}>
                    {r.customer_name || 'Misafir'}
                  </span>
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>· {timeAgo(r.created_at)}</span>
                  {r.table_number && (
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>· Masa {r.table_number}</span>
                  )}
                  <span style={S.badge(r.status)}>{LABEL[r.status]}</span>
                </div>

                <p
                  style={{
                    fontSize: 14,
                    color: '#1C1C1E',
                    margin: '0 0 12px',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {r.comment}
                </p>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {r.status !== 'approved' && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => updateStatus(r.id, 'approved')}
                      style={S.actionBtn('approve')}
                    >
                      <Check size={14} /> Onayla
                    </button>
                  )}
                  {r.status !== 'rejected' && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => updateStatus(r.id, 'rejected')}
                      style={S.actionBtn('reject')}
                    >
                      <X size={14} /> Reddet
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleDelete(r.id)}
                    style={S.actionBtn('delete')}
                  >
                    <Trash size={14} /> Sil
                  </button>
                </div>

                {r.admin_reply ? (
                  <div style={S.replyBox}>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#FF4F7A',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: 4,
                      }}
                    >
                      İşletme Yanıtı
                    </div>
                    <p
                      style={{
                        fontSize: 13,
                        color: '#1C1C1E',
                        margin: '0 0 8px',
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {r.admin_reply}
                    </p>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleRemoveReply(r.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#991B1B',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                        fontFamily: 'inherit',
                      }}
                    >
                      Yanıtı kaldır
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <input
                      type="text"
                      placeholder="Yanıtınızı yazın..."
                      value={replyDrafts[r.id] || ''}
                      onChange={(e) => setReplyDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
                      style={S.input}
                      maxLength={500}
                    />
                    <button
                      type="button"
                      disabled={busy || !(replyDrafts[r.id] || '').trim()}
                      onClick={() => handleReply(r.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 14px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: 'none',
                        backgroundColor: '#FF4F7A',
                        color: '#FFFFFF',
                        fontFamily: 'inherit',
                        opacity: busy || !(replyDrafts[r.id] || '').trim() ? 0.6 : 1,
                      }}
                    >
                      <PaperPlaneTilt size={14} /> Gönder
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
