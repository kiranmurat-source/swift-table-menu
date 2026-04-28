import React from 'react';
import { Writable } from 'node:stream';
import { renderToPipeableStream } from 'react-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import {
  StaticRouterProvider,
  createStaticHandler,
  createStaticRouter,
} from 'react-router-dom/server';
import { routes } from './routes';
import { SSRDataContext, type SSRData } from './lib/ssrContext';

// Re-exported so the Vercel Function can import both renderPage and
// transformTemplate from the single pre-built SSR bundle (dist-server/).
export { transformTemplate } from './lib/ssrTemplate';

export interface RenderResult {
  appHtml: string;
  headHtml: string;
  htmlAttributes: string;
  bodyAttributes: string;
  status: number;
}

async function collectStream(app: React.ReactElement): Promise<string> {
  return new Promise((resolve, reject) => {
    let output = '';
    const writable = new Writable({
      write(chunk, _enc, cb) {
        output += chunk.toString();
        cb();
      },
    });
    writable.on('finish', () => resolve(output));
    writable.on('error', reject);

    const { pipe } = renderToPipeableStream(app, {
      onError: reject,
      onAllReady() {
        pipe(writable);
      },
    });
  });
}

export async function renderPage(url: string, initialData: SSRData | undefined): Promise<RenderResult> {
  const handler = createStaticHandler(routes as any);
  const request = new Request(url);
  const context = await handler.query(request);

  if (context instanceof Response) {
    // Router threw a Response (redirect, etc.) — surface its status.
    return {
      appHtml: '',
      headHtml: '',
      htmlAttributes: '',
      bodyAttributes: '',
      status: context.status,
    };
  }

  const router = createStaticRouter(handler.dataRoutes, context);
  const helmetContext: { helmet?: any } = {};

  const app = (
    <HelmetProvider context={helmetContext}>
      <SSRDataContext.Provider value={initialData}>
        <StaticRouterProvider router={router} context={context} />
      </SSRDataContext.Provider>
    </HelmetProvider>
  );

  const appHtml = await collectStream(app);
  const h = helmetContext.helmet;

  const headHtml = [
    h?.title?.toString() ?? '',
    h?.meta?.toString() ?? '',
    h?.link?.toString() ?? '',
    h?.script?.toString() ?? '',
  ]
    .map((s) => s.trim())
    .filter(Boolean)
    .join('\n    ');

  return {
    appHtml,
    headHtml,
    htmlAttributes: h?.htmlAttributes?.toString() ?? '',
    bodyAttributes: h?.bodyAttributes?.toString() ?? '',
    status: 200,
  };
}
