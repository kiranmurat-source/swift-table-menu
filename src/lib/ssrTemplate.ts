/**
 * Template transform for SSR'd /menu/:slug pages.
 *
 * Input: the built dist/index.html (which is the landing page prerender by
 * vite-react-ssg — it contains landing-specific <head> tags and a populated
 * <div id="root">).
 *
 * Output: the same template with the landing <head> neutralized, the root
 * div emptied and re-seeded with the caller-supplied appHtml, the caller's
 * Helmet head injected, and a <script>window.__SSR_DATA__=...</script>
 * placed immediately before the main bundle script.
 */

export interface TransformArgs {
  template: string;
  appHtml: string;
  headHtml: string;
  ssrDataJson: string; // JSON.stringify-ed SSRData, ready for embedding
}

export function transformTemplate({ template, appHtml, headHtml, ssrDataJson }: TransformArgs): string {
  // Locate the root <div id="root" ...> and the matching close before </body>.
  const openIdx = template.indexOf('<div id="root"');
  if (openIdx < 0) {
    throw new Error('[ssrTemplate] dist/index.html has no <div id="root"> — cannot inject SSR output');
  }
  const openTagEnd = template.indexOf('>', openIdx);
  if (openTagEnd < 0) throw new Error('[ssrTemplate] unterminated <div id="root"> opening tag');

  const bodyCloseIdx = template.indexOf('</body>');
  if (bodyCloseIdx < 0) throw new Error('[ssrTemplate] template has no </body>');

  // Greedy lastIndexOf picks the last </div> before </body> — this is the
  // root div's close even if rendered content contains nested divs.
  const tailBeforeBody = template.slice(0, bodyCloseIdx);
  const rootCloseIdx = tailBeforeBody.lastIndexOf('</div>');
  if (rootCloseIdx <= openTagEnd) {
    throw new Error('[ssrTemplate] could not locate root div close');
  }

  const beforeRoot = template.slice(0, openIdx);
  const afterRoot = template.slice(rootCloseIdx + '</div>'.length);

  const rootReplacement =
    `<div id="root" data-server-rendered="true">${appHtml}</div>`;

  let result = beforeRoot + rootReplacement + afterRoot;

  // Strip landing Helmet output. React-helmet-async marks server-emitted
  // tags with data-rh="true". meta/link are void elements (no closing
  // tag); title/script/noscript use an explicit close. Handle separately.
  result = result.replace(
    /<(meta|link)\b[^>]*\sdata-rh="true"[^>]*>\s*/g,
    '',
  );
  result = result.replace(
    /<(title|script|noscript)\b[^>]*\sdata-rh="true"[^>]*>[\s\S]*?<\/\1>\s*/g,
    '',
  );

  // Strip landing-baked JSON-LD blocks (SoftwareApplication, Organization)
  // from the dist/index.html template. Helmet-emitted JSON-LD scripts
  // (with data-rh="true") are preserved — those carry per-restaurant
  // schema like Restaurant. Callback form tolerates any attribute order
  // on the data-rh marker.
  result = result.replace(
    /<script[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>\s*/g,
    (match) => (match.includes('data-rh') ? match : ''),
  );

  // Strip static landing-specific og:/twitter: meta + canonical from source
  // index.html. These don't carry data-rh; we match by known landing keys.
  const landingMetaKeys = [
    'og:title',
    'og:description',
    'og:url',
    'og:site_name',
    'og:locale',
    'og:image',
    'og:image:width',
    'og:image:height',
    'og:type',
    'twitter:title',
    'twitter:description',
    'twitter:card',
    'twitter:image',
  ];
  for (const key of landingMetaKeys) {
    const [attr, value] = key.startsWith('og:') ? ['property', key] : ['name', key];
    const pattern = new RegExp(
      `<meta\\s+${attr}="${value.replace(/:/g, '\\:')}"[^>]*>\\s*`,
      'g',
    );
    result = result.replace(pattern, '');
  }
  // Strip any remaining raw <title> from template (source or stray).
  result = result.replace(/<title[^>]*>[^<]*<\/title>\s*/g, '');
  // Strip static name="description" / "keywords" / canonical.
  result = result.replace(/<meta\s+name="description"[^>]*>\s*/g, '');
  result = result.replace(/<meta\s+name="keywords"[^>]*>\s*/g, '');
  result = result.replace(/<link\s+rel="canonical"[^>]*>\s*/g, '');

  // Inject our head html just before </head>.
  if (headHtml) {
    result = result.replace('</head>', `    ${headHtml}\n</head>`);
  }

  // Inject the SSR-data blob immediately before the main bundle <script>.
  const ssrDataScript = `<script>window.__SSR_DATA__=${ssrDataJson.replace(/</g, '\\u003c')}</script>`;
  const mainBundleRegex = /(<script type="module"[^>]+src="\/assets\/app-[^"]+"[^>]*><\/script>)/;
  if (mainBundleRegex.test(result)) {
    result = result.replace(mainBundleRegex, `${ssrDataScript}\n  $1`);
  } else {
    // Fallback: place right before </body>.
    result = result.replace('</body>', `  ${ssrDataScript}\n</body>`);
  }

  return result;
}
