import { createContext, useContext, type Context } from 'react';
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

// Dedupe the React context via a global Symbol registry. The SSR runtime can
// load this module twice — once via the CJS-style require chain that reaches
// `dist-server/entry-server.js`, and once via the native ESM `import()` that
// resolves the lazy-loaded PublicMenu chunk. Each instance would otherwise
// create its own `createContext()` object, so the Provider in entry-server
// would set a value on context A while PublicMenu's `useContext` reads from
// context B → `useContext` returns the default `undefined` and SSR data
// never reaches the component, producing a server/client hydration mismatch.
const CONTEXT_KEY = Symbol.for('@tabbled/SSRDataContext');
type GlobalWithCtx = { [k: symbol]: Context<SSRData | undefined> | undefined };
const g = globalThis as unknown as GlobalWithCtx;
export const SSRDataContext: Context<SSRData | undefined> =
  g[CONTEXT_KEY] ?? (g[CONTEXT_KEY] = createContext<SSRData | undefined>(undefined));

export function useSSRData(expectedSlug?: string): SSRData | undefined {
  const ctx = useContext(SSRDataContext);
  const data = ctx ?? (typeof window !== 'undefined' ? window.__SSR_DATA__ : undefined);
  if (!data) return undefined;
  if (expectedSlug && data.slug !== expectedSlug) return undefined;
  return data;
}
