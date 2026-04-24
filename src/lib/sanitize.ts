// Client-only DOMPurify wrapper. `isomorphic-dompurify` pulled in a nested
// `html-encoding-sniffer` that `require()`d an ESM-only `@exodus/bytes`, which
// broke Vercel's Node runtime (ERR_REQUIRE_ESM) on the /menu/:slug SSR path.
// Plain `dompurify` is loaded lazily on the client; during SSR/SSG and in the
// brief window before the dynamic import resolves, the raw input is returned.
// Interaction-gated callers get `sanitize()`; render-time callers get
// `useSanitize()` which triggers a rerender once dompurify is ready.
import { useEffect, useState } from 'react';

type Sanitizer = {
  sanitize: (html: string, config?: Record<string, unknown>) => string;
};

let instance: Sanitizer | null = null;
let loadPromise: Promise<Sanitizer> | null = null;

function load(): Promise<Sanitizer> {
  if (instance) return Promise.resolve(instance);
  if (!loadPromise) {
    loadPromise = import('dompurify').then((mod) => {
      instance = mod.default as unknown as Sanitizer;
      return instance;
    });
  }
  return loadPromise;
}

if (typeof window !== 'undefined') {
  void load();
}

export function sanitize(html: string, config?: Record<string, unknown>): string {
  return instance ? instance.sanitize(html, config) : html;
}

export function useSanitize(
  html: string | null | undefined,
  config?: Record<string, unknown>,
): string {
  const input = html ?? '';
  // Initial state matches server output (raw) to avoid hydration mismatch; the
  // effect replaces it with sanitized output after dompurify loads.
  const [output, setOutput] = useState<string>(input);
  const configKey = config ? JSON.stringify(config) : '';
  useEffect(() => {
    let cancelled = false;
    load().then((d) => {
      if (!cancelled) setOutput(d.sanitize(input, config));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, configKey]);
  return output;
}
