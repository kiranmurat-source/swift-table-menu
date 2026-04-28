import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'node:fs';
import path from 'node:path';
// Pre-built SSR runtime — same bundle the /menu/:slug Function uses.
// Vercel includes dist-server/** for this Function via vercel.json's
// `functions` config (mirrors the menu Function setup).
import { renderPage, transformTemplate } from '../dist-server/entry-server.js';

let cachedTemplate: string | null = null;
function readTemplate(): string {
  if (cachedTemplate) return cachedTemplate;
  const indexPath = path.join(process.cwd(), 'dist', 'index.html');
  cachedTemplate = fs.readFileSync(indexPath, 'utf-8');
  return cachedTemplate;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    res.status(405).send('Method Not Allowed');
    return;
  }

  let template: string;
  try {
    template = readTemplate();
  } catch (err) {
    console.error('[SSR /spa] template read failed:', err);
    res.status(500).send('Internal Server Error');
    return;
  }

  // Vercel rewrites preserve req.url as the original requested path
  // (e.g. /login, /dashboard, /dashboard/menu) even though the Function
  // is mounted at /api/spa.
  const originalUrl = req.url ?? '/';
  const fullUrl = `http://localhost${originalUrl.startsWith('/') ? originalUrl : `/${originalUrl}`}`;

  try {
    const rendered = await renderPage(fullUrl, undefined);

    if (rendered.status !== 200) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('x-ssr-fallback', 'redirect');
      res.status(rendered.status).send(template);
      return;
    }

    const html = transformTemplate({
      template,
      appHtml: rendered.appHtml,
      headHtml: rendered.headHtml,
      // No SSRData for auth-gated pages. `null` keeps the literal valid
      // for window.__SSR_DATA__ and useSSRData() already returns undefined
      // when the global is falsy.
      ssrDataJson: 'null',
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    // Auth-gated pages must never be CDN-cached.
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(html);
  } catch (err) {
    console.error('[SSR /spa] render failed for', originalUrl, ':', err);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('x-ssr-fallback', '1');
    res.status(200).send(template);
  }
}
