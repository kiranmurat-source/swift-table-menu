import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface AICreditsState {
  loading: boolean;
  creditsTotal: number;
  creditsUsed: number;
  creditsRemaining: number;
  storageLimitMb: number;
  storageUsedBytes: number;
  storageUsedMb: number;
  storagePercent: number;
  refresh: () => Promise<void>;
}

/**
 * Restoran için AI kredi + storage kota durumunu döner.
 * - `restaurants` tablosundan storage_limit_mb + ai_credits_*
 * - `media_library` tablosundan toplam file_size
 */
export function useAICredits(restaurantId: string | null | undefined): AICreditsState {
  const [loading, setLoading] = useState(true);
  const [creditsTotal, setCreditsTotal] = useState(0);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [storageLimitMb, setStorageLimitMb] = useState(500);
  const [storageUsedBytes, setStorageUsedBytes] = useState(0);

  const load = useCallback(async () => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [restRes, usageRes] = await Promise.all([
      supabase
        .from('restaurants')
        .select('storage_limit_mb, ai_credits_total, ai_credits_used')
        .eq('id', restaurantId)
        .maybeSingle(),
      supabase
        .from('media_library')
        .select('file_size')
        .eq('restaurant_id', restaurantId),
    ]);

    if (restRes.data) {
      setStorageLimitMb(restRes.data.storage_limit_mb ?? 500);
      setCreditsTotal(restRes.data.ai_credits_total ?? 0);
      setCreditsUsed(restRes.data.ai_credits_used ?? 0);
    }

    if (usageRes.data) {
      const total = usageRes.data.reduce((sum, row) => sum + (row.file_size ?? 0), 0);
      setStorageUsedBytes(total);
    }

    setLoading(false);
  }, [restaurantId]);

  useEffect(() => {
    load();
  }, [load]);

  const storageUsedMb = storageUsedBytes / (1024 * 1024);
  const storagePercent = storageLimitMb > 0
    ? Math.min(100, Math.round((storageUsedMb / storageLimitMb) * 100))
    : 0;

  return {
    loading,
    creditsTotal,
    creditsUsed,
    creditsRemaining: Math.max(0, creditsTotal - creditsUsed),
    storageLimitMb,
    storageUsedBytes,
    storageUsedMb,
    storagePercent,
    refresh: load,
  };
}
