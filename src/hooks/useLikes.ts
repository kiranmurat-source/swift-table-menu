import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getFingerprint } from '../lib/fingerprint';

interface UseLikesReturn {
  likeCounts: Record<string, number>;
  likedItems: Set<string>;
  toggleLike: (itemId: string, restaurantId: string) => Promise<boolean>;
  loading: boolean;
}

export function useLikes(restaurantId: string | undefined): UseLikesReturn {
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const fingerprint = getFingerprint();

  useEffect(() => {
    if (!restaurantId) return;

    const fetchLikes = async () => {
      // 1. Total like counts via RPC
      const { data: counts } = await supabase
        .rpc('get_like_counts', { p_restaurant_id: restaurantId });

      if (counts) {
        const map: Record<string, number> = {};
        counts.forEach((row: { menu_item_id: string; like_count: number }) => {
          map[row.menu_item_id] = row.like_count;
        });
        setLikeCounts(map);
      }

      // 2. This user's likes
      const { data: myLikes } = await supabase
        .from('product_likes')
        .select('menu_item_id')
        .eq('restaurant_id', restaurantId)
        .eq('fingerprint', fingerprint)
        .eq('status', 'approved');

      if (myLikes) {
        setLikedItems(new Set(myLikes.map((l: { menu_item_id: string }) => l.menu_item_id)));
      }

      setLoading(false);
    };

    fetchLikes();
  }, [restaurantId, fingerprint]);

  const toggleLike = useCallback(async (itemId: string, restaurantId: string): Promise<boolean> => {
    if (likedItems.has(itemId)) return false;

    const { error } = await supabase
      .from('product_likes')
      .insert({
        menu_item_id: itemId,
        restaurant_id: restaurantId,
        fingerprint: fingerprint,
        status: 'approved',
      });

    if (error) {
      if (error.code === '23505') return false; // unique constraint
      console.error('Like error:', error);
      return false;
    }

    // Optimistic update
    setLikedItems(prev => new Set([...prev, itemId]));
    setLikeCounts(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
    return true;
  }, [likedItems, fingerprint]);

  return { likeCounts, likedItems, toggleLike, loading };
}
