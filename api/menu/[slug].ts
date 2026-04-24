import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
// The SSR runtime is pre-built by `vite build --ssr` into dist-server/ so
// that all `@/*` aliases, JSX, and any transitive CSS side-effects are
// resolved at build time rather than at Function runtime. Vercel bundles
// this file via `includeFiles` in vercel.json.
import { renderPage, transformTemplate } from '../../dist-server/entry-server.js';
import type { SSRData } from '../../src/lib/ssrContext';
import type { Restaurant, MenuCategory, MenuItem } from '../../src/types/menu';
import type { Promo } from '../../src/components/PromoPopup';

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://qmnrawqvkwehufebbkxp.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbnJhd3F2a3dlaHVmZWJia3hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMTk5OTQsImV4cCI6MjA5MDc5NTk5NH0.cQeGl66uJAy3Q4FpAgh6hgNImEx4RsVK-CfBuukJuEc';

const CACHE_CONTROL = 's-maxage=60, stale-while-revalidate=300';

let cachedTemplate: string | null = null;
function readTemplate(): string {
  if (cachedTemplate) return cachedTemplate;
  const indexPath = path.join(process.cwd(), 'dist', 'index.html');
  cachedTemplate = fs.readFileSync(indexPath, 'utf-8');
  return cachedTemplate;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const rawSlug = req.query.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;

  if (!slug || typeof slug !== 'string') {
    res.status(400).send('Bad Request');
    return;
  }

  let template: string;
  try {
    template = readTemplate();
  } catch (err) {
    console.error('[SSR] template read failed:', err);
    res.status(500).send('Internal Server Error');
    return;
  }

  // Kill switch: env SSR_MODE=off bypasses the render path and serves
  // the untouched landing template. The client SPA routes to /menu/:slug
  // on mount and fetches as before (loading state visible). Use this if
  // hydration mismatch or perf regression is detected in prod — flip the
  // flag and redeploy is not required.
  if (process.env.SSR_MODE === 'off') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(template);
    return;
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data: restaurant, error: restaurantErr } = await supabase
      .from('restaurants')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    if (restaurantErr) throw restaurantErr;

    if (!restaurant) {
      // Unknown slug: serve the plain template with 404 so the SPA's
      // NotFound route can take over and the response still carries
      // the right status for crawlers.
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=30');
      res.status(404).send(template);
      return;
    }

    const [categoriesRes, itemsRes, promosRes] = await Promise.all([
      supabase
        .from('menu_categories')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('is_active', true)
        .order('sort_order'),
      supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('is_available', true)
        .order('sort_order'),
      supabase
        .from('restaurant_promos')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('is_active', true)
        .order('sort_order'),
    ]);

    const initialData: SSRData = {
      slug,
      restaurant: restaurant as Restaurant,
      categories: (categoriesRes.data ?? []) as MenuCategory[],
      items: (itemsRes.data ?? []) as MenuItem[],
      promos: (promosRes.data ?? []) as Promo[],
    };

    // The Function is mounted at /api/menu/:slug (via vercel.json rewrite),
    // but the React router only knows /menu/:slug. Construct the user-facing
    // URL here so createStaticHandler.query() matches the real route instead
    // of falling through to NotFound.
    const fullUrl = `http://localhost/menu/${slug}`;
    const rendered = await renderPage(fullUrl, initialData);

    if (rendered.status !== 200) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.status(rendered.status).send(template);
      return;
    }

    const html = transformTemplate({
      template,
      appHtml: rendered.appHtml,
      headHtml: rendered.headHtml,
      ssrDataJson: JSON.stringify(initialData),
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', CACHE_CONTROL);
    res.status(200).send(html);
  } catch (err) {
    console.error('[SSR] render failed for slug', slug, ':', err);
    // Graceful degradation: serve the unmodified template so the SPA
    // still loads on the client and the user sees a working page.
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('x-ssr-fallback', '1');
    res.status(200).send(template);
  }
}
