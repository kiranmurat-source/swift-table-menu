import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Heart, Trash } from '@phosphor-icons/react';
import type { AdminTheme } from '../lib/adminTheme';
import { getAdminTheme } from '../lib/adminTheme';

interface LikeRow {
  menu_item_id: string;
  like_count: number;
  item_name: string;
}

interface LikeStat {
  total: number;
  today: number;
  week: number;
}

export default function LikesPanel({ restaurantId, theme }: { restaurantId: string; theme?: AdminTheme }) {
  const t = theme ?? getAdminTheme('light');
  const [rows, setRows] = useState<LikeRow[]>([]);
  const [stats, setStats] = useState<LikeStat>({ total: 0, today: 0, week: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);

    const { data: likes } = await supabase
      .from('product_likes')
      .select('id, menu_item_id, status, created_at')
      .eq('restaurant_id', restaurantId);

    const { data: items } = await supabase
      .from('menu_items')
      .select('id, name_tr')
      .eq('restaurant_id', restaurantId);

    const itemMap = new Map<string, string>();
    items?.forEach(i => itemMap.set(i.id, i.name_tr));

    const approved = (likes ?? []).filter(l => l.status === 'approved');
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    setStats({
      total: approved.length,
      today: approved.filter(l => l.created_at >= todayStart).length,
      week: approved.filter(l => l.created_at >= weekStart).length,
    });

    const countMap = new Map<string, number>();
    approved.forEach(l => {
      countMap.set(l.menu_item_id, (countMap.get(l.menu_item_id) || 0) + 1);
    });

    const sorted: LikeRow[] = Array.from(countMap.entries())
      .map(([id, count]) => ({
        menu_item_id: id,
        like_count: count,
        item_name: itemMap.get(id) || 'Bilinmeyen ürün',
      }))
      .sort((a, b) => b.like_count - a.like_count);

    setRows(sorted);
    setLoading(false);
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [restaurantId]);

  const handleReject = async (menuItemId: string) => {
    if (!confirm('Bu ürünün tüm beğenilerini reddetmek istediğinize emin misiniz?')) return;
    await supabase
      .from('product_likes')
      .update({ status: 'rejected' })
      .eq('restaurant_id', restaurantId)
      .eq('menu_item_id', menuItemId);
    fetchData();
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: t.subtle, fontSize: 13 }}>Yükleniyor...</div>
    );
  }

  const statCardStyle: React.CSSProperties = {
    borderRadius: 12,
    border: `1px solid ${t.cardBorder}`,
    padding: 16,
    textAlign: 'center',
    backgroundColor: t.cardBg,
    boxShadow: t.cardShadow,
  };

  return (
    <div style={{ padding: 16, maxWidth: 672 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: t.value, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Heart size={20} weight="fill" style={{ color: t.accent }} />
        Beğeniler
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Toplam', value: stats.total },
          { label: 'Bugün', value: stats.today },
          { label: 'Son 7 gün', value: stats.week },
        ].map(s => (
          <div key={s.label} style={statCardStyle}>
            <div style={{ fontSize: 24, fontWeight: 700, color: t.value }}>{s.value}</div>
            <div style={{ fontSize: 12, color: t.subtle, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {rows.length === 0 ? (
        <div style={{ textAlign: 'center', color: t.subtle, fontSize: 13, padding: 32 }}>
          Henüz beğeni yok
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map((row, i) => (
            <div
              key={row.menu_item_id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderRadius: 12,
                border: `1px solid ${i === 0 ? t.accent : t.cardBorder}`,
                padding: '12px 16px',
                backgroundColor: t.cardBg,
                boxShadow: t.cardShadow,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <Heart
                  size={18}
                  weight="fill"
                  style={{ color: i === 0 ? t.accent : t.icon }}
                />
                <span style={{ fontSize: 14, fontWeight: 500, color: t.value, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {row.item_name}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: t.value }}>
                  {row.like_count}
                </span>
                <button
                  onClick={() => handleReject(row.menu_item_id)}
                  style={{ background: 'none', border: 'none', color: t.icon, cursor: 'pointer', padding: 2 }}
                  title="Beğenileri reddet"
                >
                  <Trash size={14} weight="thin" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
