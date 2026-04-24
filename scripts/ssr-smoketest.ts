// Local SSR smoke test. Invokes api/menu/[slug].ts handler with a mock
// req/res and writes the resulting HTML to stdout.
//
// Usage: node_modules/.bin/vite-node scripts/ssr-smoketest.ts <slug>
//        node_modules/.bin/vite-node scripts/ssr-smoketest.ts ramada-encore-bayrampasa
//
// This is a developer aid for Phase 1 validation; not committed to prod.
import handler from '../api/menu/[slug]';

interface MockRes {
  statusCode: number;
  headers: Record<string, string>;
  body: string | Buffer;
  setHeader(name: string, value: string): MockRes;
  status(code: number): MockRes;
  send(body: string | Buffer): MockRes;
}

function makeRes(): MockRes {
  const res: MockRes = {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(body) {
      this.body = body;
      return this;
    },
  };
  return res;
}

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error('Usage: vite-node scripts/ssr-smoketest.ts <slug>');
    process.exit(1);
  }

  const req = {
    query: { slug },
    url: `/menu/${slug}`,
    method: 'GET',
    headers: {},
  } as any;
  const res = makeRes();

  await handler(req, res as any);

  const body = typeof res.body === 'string' ? res.body : res.body.toString('utf-8');
  process.stderr.write(`STATUS: ${res.statusCode}\n`);
  process.stderr.write(`HEADERS: ${JSON.stringify(res.headers, null, 2)}\n`);
  process.stderr.write(`BODY LENGTH: ${body.length}\n`);
  // Brief summary on stderr
  const titleMatch = body.match(/<title[^>]*>([^<]*)<\/title>/);
  process.stderr.write(`TITLE: ${titleMatch ? titleMatch[1] : '(none)'}\n`);
  const ssrDataMatch = body.match(/window\.__SSR_DATA__=([^<]{0,200})/);
  process.stderr.write(`SSR_DATA present: ${ssrDataMatch ? 'yes (first 200ch: ' + ssrDataMatch[1].slice(0, 200) + '...)' : 'no'}\n`);
  const dsrMatch = body.match(/data-server-rendered="true"/);
  process.stderr.write(`data-server-rendered: ${dsrMatch ? 'yes' : 'no'}\n`);
  const ogTitleMatch = body.match(/<meta\s+property="og:title"[^>]*>/g);
  process.stderr.write(`og:title tags: ${ogTitleMatch ? ogTitleMatch.length : 0}\n`);

  process.stdout.write(body);
}

main().catch((err) => {
  console.error('SMOKETEST FAILED:', err);
  process.exit(2);
});
