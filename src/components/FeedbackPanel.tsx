import { useEffect, useState } from 'react';
import { ChatCircle, Trash } from "@phosphor-icons/react";
import { supabase } from '../lib/supabase';
import StarRating from './StarRating';

interface Feedback {
  id: string;
  rating: number;
  comment: string;
  customer_name: string;
  table_number: string | null;
  language: string;
  created_at: string;
}

const S = {
  card: { padding: '12px 16px', borderRadius: 8, border: '1px solid #E5E5E3', backgroundColor: '#fff', marginBottom: 8 } as React.CSSProperties,
  summaryCard: { flex: 1, padding: 16, borderRadius: 8, border: '1px solid #E5E5E3', backgroundColor: '#F7F7F5', textAlign: 'center' as const },
};

export default function FeedbackPanel({ restaurantId }: { restaurantId: string }) {
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
  }, [restaurantId, filterRating, sortAsc]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu geri bildirimi silmek istediğinize emin misiniz?')) return;
    await supabase.from('feedback').delete().eq('id', id);
    setItems(prev => prev.filter(f => f.id !== id));
  };

  // Summary stats
  const avgRating = items.length > 0 ? items.reduce((s, f) => s + f.rating, 0) / items.length : 0;
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const thisWeek = items.filter(f => f.created_at >= weekAgo).length;

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1C1C1E', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <ChatCircle size={20} /> Geri Bildirimler
      </h2>

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={S.summaryCard}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#F59E0B' }}>{avgRating.toFixed(1)}/5</div>
          <div style={{ fontSize: 11, color: '#6B6B6F' }}>Ortalama</div>
        </div>
        <div style={S.summaryCard}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#1C1C1E' }}>{items.length}</div>
          <div style={{ fontSize: 11, color: '#6B6B6F' }}>Toplam</div>
        </div>
        <div style={S.summaryCard}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#22c55e' }}>+{thisWeek}</div>
          <div style={{ fontSize: 11, color: '#6B6B6F' }}>Bu Hafta</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[null, 5, 4, 3, 2, 1].map(r => (
          <button
            key={String(r)}
            onClick={() => setFilterRating(r)}
            style={{
              padding: '4px 12px', fontSize: 12, borderRadius: 16,
              border: `1px solid ${filterRating === r ? '#FF4F7A' : '#E5E5E3'}`,
              backgroundColor: filterRating === r ? '#FF4F7A' : '#fff',
              color: filterRating === r ? '#fff' : '#666',
              cursor: 'pointer', fontWeight: filterRating === r ? 600 : 400,
            }}
          >
            {r === null ? 'Tümü' : `⭐${r}`}
          </button>
        ))}
        <button
          onClick={() => setSortAsc(!sortAsc)}
          style={{ marginLeft: 'auto', padding: '4px 12px', fontSize: 12, borderRadius: 16, border: '1px solid #E5E5E3', backgroundColor: '#fff', color: '#666', cursor: 'pointer' }}
        >
          {sortAsc ? 'En Eski' : 'En Yeni'}
        </button>
      </div>

      {/* List */}
      {loading ? (
        <p style={{ textAlign: 'center', color: '#A0A0A0', fontSize: 13, padding: 32 }}>Yükleniyor...</p>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <ChatCircle size={48} style={{ color: '#d1d5db', marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: '#6B6B6F' }}>Henüz geri bildirim yok.</p>
          <p style={{ fontSize: 12, color: '#A0A0A0' }}>Müşterileriniz menüden geri bildirim bırakabilir.</p>
        </div>
      ) : (
        <>
          {items.map(fb => (
            <div key={fb.id} style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: fb.comment ? 8 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <StarRating rating={fb.rating} size={14} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1C1C1E' }}>
                    {fb.customer_name || 'Anonim'}
                  </span>
                  {fb.table_number && (
                    <span style={{ fontSize: 10, color: '#6B6B6F', backgroundColor: '#F7F7F5', padding: '1px 6px', borderRadius: 4 }}>
                      Masa {fb.table_number}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: '#A0A0A0' }}>
                    {new Date(fb.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button
                    onClick={() => handleDelete(fb.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 2 }}
                    title="Sil"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>
              {fb.comment && (
                <p style={{ fontSize: 13, color: '#2D2D2F', lineHeight: 1.5, margin: 0 }}>"{fb.comment}"</p>
              )}
            </div>
          ))}
          {hasMore && (
            <button
              onClick={() => fetchFeedback()}
              style={{ width: '100%', padding: '10px', fontSize: 13, color: '#FF4F7A', backgroundColor: '#fff', border: '1px solid #E5E5E3', borderRadius: 8, cursor: 'pointer', fontWeight: 500, marginTop: 8 }}
            >
              Daha Fazla Yükle
            </button>
          )}
        </>
      )}
    </div>
  );
}
