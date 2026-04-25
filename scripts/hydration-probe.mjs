import { chromium } from 'playwright';

const url = process.argv[2] || 'https://tabbled.com/menu/ramada-encore-bayrampasa';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (ProductionProbe)' });
const page = await context.newPage();

const consoleMsgs = [];
page.on('console', (msg) => consoleMsgs.push(`[${msg.type()}] ${msg.text()}`));
page.on('pageerror', (err) => consoleMsgs.push(`[pageerror] ${err.message}\n${err.stack}`));
page.on('requestfailed', (req) => consoleMsgs.push(`[netfail] ${req.url()} — ${req.failure()?.errorText}`));

console.log(`Fetching ${url}`);
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);

const ssrAttr = await page.getAttribute('#root', 'data-server-rendered').catch(() => null);

const buttons = await page.$$('button');
let splashBtn = null;
for (const b of buttons) {
  const text = (await b.textContent() || '').trim();
  if (text === 'Menüyü Görüntüle') { splashBtn = b; break; }
}

const beforeClick = {
  splashBtnFound: !!splashBtn,
  splashBtnEnabled: splashBtn ? await splashBtn.isEnabled() : null,
  ssrRootAttr: ssrAttr,
  url: page.url(),
};

if (splashBtn) {
  await splashBtn.click();
  await page.waitForTimeout(2500);
}

const afterClick = {
  url: page.url(),
  stillHasSplashBtn: (await page.$('button:has-text("Menüyü Görüntüle")')) !== null,
  categoryCountByData: await page.$$eval('[data-category-id]', (els) => els.length),
  rootInnerHTMLLen: await page.$eval('#root', (el) => el.innerHTML.length),
  bodyTextStart: (await page.textContent('body') || '').replace(/\s+/g, ' ').slice(0, 400),
};

console.log('=== BEFORE CLICK ===');
console.log(JSON.stringify(beforeClick, null, 2));
console.log('=== AFTER CLICK ===');
console.log(JSON.stringify(afterClick, null, 2));
console.log('=== CONSOLE MESSAGES ===');
consoleMsgs.forEach((m) => console.log(m));
console.log('=== TOTAL MSGS:', consoleMsgs.length, '===');

await browser.close();
