import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Heart, Trash } from '@phosphor-icons/react';

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

export default function LikesPanel({ restaurantId }: { restaurantId: string }) {
  const [rows, setRows] = useState<LikeRow[]>([]);
  const [stats, setStats] = useState<LikeStat>({ total: 0, today: 0, week: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);

    // Get all likes with item names
    const { data: likes } = await supabase
      .from('product_likes')
      .select('id, menu_item_id, status, created_at')
      .eq('restaurant_id', restaurantId);

    // Get menu item names
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

    // Group by menu_item_id
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

  useEffect(() => { fetchData(); }, [restaurantId]);

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
      <div className="p-6 text-center text-[#A0A0A0] text-sm">Yükleniyor...</div>
    );
  }

  return (
    <div className="p-4 max-w-2xl">
      <h2 className="text-lg font-semibold text-[#1C1C1E] mb-4 flex items-center gap-2">
        <Heart size={20} weight="fill" className="text-[#FF4F7A]" />
        Beğeniler
      </h2>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Toplam', value: stats.total },
          { label: 'Bugün', value: stats.today },
          { label: 'Son 7 gün', value: stats.week },
        ].map(s => (
          <div
            key={s.label}
            className="rounded-xl border border-[#E5E5E3] p-4 text-center"
            style={{ backgroundColor: '#F7F7F5' }}
          >
            <div className="text-2xl font-bold text-[#1C1C1E]">{s.value}</div>
            <div className="text-xs text-[#6B6B6F] mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Product list */}
      {rows.length === 0 ? (
        <div className="text-center text-[#A0A0A0] text-sm py-8">
          Henüz beğeni yok
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((row, i) => (
            <div
              key={row.menu_item_id}
              className="flex items-center justify-between rounded-xl border border-[#E5E5E3] px-4 py-3"
              style={{ backgroundColor: i === 0 ? '#FFF0F3' : '#F7F7F5' }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Heart
                  size={18}
                  weight="fill"
                  className={i === 0 ? 'text-[#FF4F7A]' : 'text-[#A0A0A0]'}
                />
                <span className="text-sm font-medium text-[#1C1C1E] truncate">
                  {row.item_name}
                </span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-sm font-bold text-[#2D2D2F]">
                  {row.like_count}
                </span>
                <button
                  onClick={() => handleReject(row.menu_item_id)}
                  className="text-[#A0A0A0] hover:text-red-500 transition-colors"
                  title="Beğenileri reddet"
                >
                  <Trash size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
