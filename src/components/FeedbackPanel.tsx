import { useEffect, useState } from 'react';
import { ChatCircle, Trash, Star } from "@phosphor-icons/react";
import { supabase } from '../lib/supabase';
import StarRating from './StarRating';
import type { AdminTheme } from '../lib/adminTheme';
import { getAdminTheme } from '../lib/adminTheme';

interface Feedback {
  id: string;
  rating: number;
  comment: string;
  customer_name: string;
  table_number: string | null;
  language: string;
  created_at: string;
}

export default function FeedbackPanel({ restaurantId, theme }: { restaurantId: string; theme?: AdminTheme }) {
  const t = theme ?? getAdminTheme('light');
  const cardStyle: React.CSSProperties = {
    padding: '12px 16px',
    borderRadius: 8,
    border: `1px solid ${t.cardBorder}`,
    backgroundColor: t.cardBg,
    marginBottom: 8,
    boxShadow: t.cardShadow,
  };
  const summaryCardStyle: React.CSSProperties = {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    border: `1px solid ${t.cardBorder}`,
    backgroundColor: t.cardBg,
    textAlign: 'center',
    boxShadow: t.cardShadow,
  };

  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [sortAsc, setSortAsc] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE = 20;

  const fetchFeedback = async (reset = false) => {
    const start = reset ? 0 : offset;
    let q = supabase
      .from('feedback')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: sortAsc })
      .range(start, start + PAGE - 1);

    if (filterRating) q = q.eq('rating', filterRating);

    const { data } = await q;
    const rows = (data ?? []) as Feedback[];

    if (reset) {
      setItems(rows);
      setOffset(rows.length);
    } else {
      setItems(prev => [...prev, ...rows]);
      setOffset(start + rows.length);
    }
    setHasMore(rows.length === PAGE);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    fetchFeedback(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId, filterRating, sortAsc]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu geri bildirimi silmek istediğinize emin misiniz?')) return;
    await supabase.from('feedback').delete().eq('id', id);
    setItems(prev => prev.filter(f => f.id !== id));
  };

  const avgRating = items.length > 0 ? items.reduce((s, f) => s + f.rating, 0) / items.length : 0;
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const thisWeek = items.filter(f => f.created_at >= weekAgo).length;

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: t.value, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <ChatCircle size={20} weight="thin" /> Geri Bildirimler
      </h2>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={summaryCardStyle}>
          <div style={{ fontSize: 24, fontWeight: 700, color: t.accent }}>{avgRating.toFixed(1)}/5</div>
          <div style={{ fontSize: 11, color: t.subtle }}>Ortalama</div>
        </div>
        <div style={summaryCardStyle}>
          <div style={{ fontSize: 24, fontWeight: 700, color: t.value }}>{items.length}</div>
          <div style={{ fontSize: 11, color: t.subtle }}>Toplam</div>
        </div>
        <div style={summaryCardStyle}>
          <div style={{ fontSize: 24, fontWeight: 700, color: t.value }}>+{thisWeek}</div>
          <div style={{ fontSize: 11, color: t.subtle }}>Bu Hafta</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[null, 5, 4, 3, 2, 1].map(r => {
          const active = filterRating === r;
          return (
            <button
              key={String(r)}
              onClick={() => setFilterRating(r)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '4px 12px', fontSize: 12, borderRadius: 16,
                border: `1px solid ${active ? t.accent : t.cardBorder}`,
                backgroundColor: active ? t.accent : t.cardBg,
                color: active ? '#fff' : t.heading,
                cursor: 'pointer', fontWeight: active ? 600 : 400,
              }}
            >
              {r === null ? 'Tümü' : (
                <>
                  <Star size={12} weight="fill" />
                  {r}
                </>
              )}
            </button>
          );
        })}
        <button
          onClick={() => setSortAsc(!sortAsc)}
          style={{ marginLeft: 'auto', padding: '4px 12px', fontSize: 12, borderRadius: 16, border: `1px solid ${t.cardBorder}`, backgroundColor: t.cardBg, color: t.heading, cursor: 'pointer' }}
        >
          {sortAsc ? 'En Eski' : 'En Yeni'}
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: t.subtle, fontSize: 13, padding: 32 }}>Yükleniyor...</p>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <ChatCircle size={48} weight="thin" style={{ color: t.icon, marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: t.subtle }}>Henüz geri bildirim yok.</p>
          <p style={{ fontSize: 12, color: t.subtle }}>Müşterileriniz menüden geri bildirim bırakabilir.</p>
        </div>
      ) : (
        <>
          {items.map(fb => (
            <div key={fb.id} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: fb.comment ? 8 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <StarRating rating={fb.rating} size={14} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: t.value }}>
                    {fb.customer_name || 'Anonim'}
                  </span>
                  {fb.table_number && (
                    <span style={{ fontSize: 10, color: t.subtle, backgroundColor: t.hoverBg, padding: '1px 6px', borderRadius: 4 }}>
                      Masa {fb.table_number}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: t.subtle }}>
                    {new Date(fb.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button
                    onClick={() => handleDelete(fb.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.danger, padding: 2 }}
                    title="Sil"
                  >
                    <Trash size={16} weight="thin" />
                  </button>
                </div>
              </div>
              {fb.comment && (
                <p style={{ fontSize: 13, color: t.value, lineHeight: 1.5, margin: 0, opacity: 0.85 }}>"{fb.comment}"</p>
              )}
            </div>
          ))}
          {hasMore && (
            <button
              onClick={() => fetchFeedback()}
              style={{ width: '100%', padding: '10px', fontSize: 13, color: t.accent, backgroundColor: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 8, cursor: 'pointer', fontWeight: 500, marginTop: 8 }}
            >
              Daha Fazla Yükle
            </button>
          )}
        </>
      )}
    </div>
  );
}
