import { createContext, useContext } from 'react';
import type { Restaurant, MenuCategory, MenuItem } from '../types/menu';
import type { Promo } from '../components/PromoPopup';

export interface SSRData {
  slug: string;
  restaurant: Restaurant;
  categories: MenuCategory[];
  items: MenuItem[];
  promos: Promo[];
}

declare global {
  interface Window {
    __SSR_DATA__?: SSRData;
  }
}

export const SSRDataContext = createContext<SSRData | undefined>(undefined);

export function useSSRData(expectedSlug?: string): SSRData | undefined {
  const ctx = useContext(SSRDataContext);
  const data = ctx ?? (typeof window !== 'undefined' ? window.__SSR_DATA__ : undefined);
  if (!data) return undefined;
  if (expectedSlug && data.slug !== expectedSlug) return undefined;
  return data;
}
