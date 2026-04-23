# Blog #3 Update — qr-menu-fiyatlari-2026

## Project Context

**This is a Vite + React + TypeScript project, NOT Next.js.** Do not apply Next.js conventions.

This task replaces content of one blog post (`qr-menu-fiyatlari-2026`) in `src/lib/blogData.ts`.

**Schema infrastructure is already in place** (commit from yesterday's blog #1 work). The schema generation in `BlogPost.tsx` automatically produces Article + FAQPage + BreadcrumbList JSON-LD from the BlogPost data fields. **Do NOT modify `BlogPost.tsx`** — schema will update automatically when content is replaced.

**Do NOT add SoftwareApplication schema** to this post even though the SEO project's schema file suggests it. The landing page already has a comprehensive SoftwareApplication schema; duplicating it on the blog post creates Schema duplication confusion. All 10 blog posts use the same 3-schema set (Article + FAQPage + BreadcrumbList) for consistency.

## File to modify

`src/lib/blogData.ts` — only this file. No other files change.

## What to replace

Find the blog post object with `slug: 'qr-menu-fiyatlari-2026'` in the `blogPosts` array. Replace these fields:

| Field | New Value |
|---|---|
| `title` | `"QR Menü Fiyatları 2026: Türkiye'deki 20 Sistem Karşılaştırması"` |
| `metaTitle` | `"QR Menü Fiyatları 2026: 20 Sistem Karşılaştırması | Tabbled"` |
| `metaDescription` | `"Türkiye'deki QR menü sistemleri ne kadar? Menulux, FineDine, Adisyo, Tabbled ve 16 rakibin güncel fiyatları, gizli maliyetler ve işletme boyutuna göre öneri matrisi."` |
| `excerpt` | `"Türkiye'deki QR menü sağlayıcılarının yarısı fiyatını gizliyor. 20 sistemin açıklanan fiyatları, gizli maliyetleri ve işletme boyutuna göre hangi paketin mantıklı olduğu — Tabbled da rakiplerle aynı kritik merceğin altında."` |
| `categoryLabel` | `"Karşılaştırma"` (if it isn't already this — check current value first) |
| `updatedAt` | `"2026-04-23T00:00:00Z"` |
| `publishedAt` | **DO NOT CHANGE** — keep existing value (preserves Google's original publish date signal) |
| `readingTime` | `14` |
| `tags` | `['qr menü fiyatları', 'qr menü maliyeti', 'dijital menü fiyat', 'restoran yazılım fiyatları', 'qr menü karşılaştırma', 'menulux', 'finedine', 'tabbled fiyat']` |

**Note on `category` field:** The current category enum is `'yasal' | 'rehber' | 'ipuclari' | 'urun'`. "Karşılaştırma" is a new category label but doesn't fit any existing enum value. Use `category: 'rehber'` (most general) and only update `categoryLabel: 'Karşılaştırma'`. Do NOT modify the BlogPost interface enum — that would affect 9 other posts.

## Author field

If `author` is currently `'Tabbled Ekibi'`, change it to `'Murat Kıran'` for E-E-A-T consistency (yesterday's commit standardized all 10 posts to this).

If `authorUrl` field doesn't exist on this post, add:
```typescript
authorUrl: 'https://tabbled.com/hakkimizda',
```

## Replace the `faq` array

Replace the entire existing `faq` array with these 8 entries:

```typescript
faq: [
  {
    question: 'QR menü için ne kadar ödemeliyim?',
    answer: 'Küçük bir kafe için 200-450 TL/ay yeterli. Tek şubeli restoran için 500-800 TL/ay orta noktada. Butik otel veya premium casual dining için 800-1.500 TL/ay mantıklı. Çok şubeli zincirler için 1.500+ TL/ay. Bütçenizin yıllık %0.5-1\'ini aşmamalı.'
  },
  {
    question: 'En ucuz QR menü sistemi hangisi?',
    answer: 'Aylık bazda Menüm.co (~200 TL) en ucuz profesyonel seçenek. Gerçek ücretsiz seçenekler de var — ancak genelde reklam, sınırlı özellik veya sipariş komisyonu içerirler. Uzun vadede gerçek ücretsiz seçenekler genelde profesyonel sistemlerden pahalıya mal olur.'
  },
  {
    question: 'QR menü sistemi yıllık mı aylık mı ödenmeli?',
    answer: 'Yıllık ödeme genelde %15-25 indirim sağlar. Ancak yeni sistem deniyorsanız önce aylık başlayın, sağlayıcı batarsa paranız kaybolur, iade politikasına bakın. Tabbled yıllık ödemede Basic 549 TL/ay\'a eşdeğer, Premium 1.459 TL/ay.'
  },
  {
    question: 'Fiyatlar KDV dahil mi?',
    answer: 'Türkiye\'deki çoğu sağlayıcıda hayır. Fiyatlar +KDV olarak verilir (%20 eklenir). Kıyaslama yaparken hep KDV dahil fiyata çevirin. Tabbled da dahil, fiyatlarımız +KDV olarak listelenir.'
  },
  {
    question: 'Ücretsiz QR menü sistemleri gerçekten ücretsiz mi?',
    answer: 'Genelde hayır. Gizli maliyetler: reklam gösterimi, sipariş komisyonu, sınırlı özellik, yabancı sunucu (KVKK risk), 7 gün sonra ücretli geçiş. Gerçekten ücretsiz olanlar sadece çok küçük işletmeler için uygun.'
  },
  {
    question: 'QR menü fiyatında pazarlık edebilir miyim?',
    answer: 'Açık fiyatı olan sağlayıcılarda (Tabbled, Menulux, Menüm.co) pazarlık yok — liste fiyatı son fiyat. Fiyat gizleyenlerde pazarlık yapılabilir, ama bu başlangıç fiyatının yüksek olduğunun sinyalidir. Şeffaf sağlayıcıyla gidip 10% indirim alamazsınız ama 30% gereksiz ücret ödemezsiniz.'
  },
  {
    question: 'QR menü sistemi değiştirmek kolay mı?',
    answer: 'Değil. Menü verinizi CSV export edebiliyorsanız kolay (Tabbled veriyor). Ancak QR kodları yenilemek zorunda olabilirsiniz (yeni sistemin linkleri farklı), bu da basılı stand/sticker masraflarını yeniden çıkarır. Doğru sistemi ilk seçiminiz olarak belirlemek önemli.'
  },
  {
    question: 'Enterprise paketler için fiyat nasıl belirlenir?',
    answer: 'Genelde şube sayısı, aylık işlem hacmi, özel entegrasyon ihtiyaçları ve sözleşme süresi kriterlerine göre. Her sağlayıcı farklı kriter kullanır. Tabbled Enterprise için 5+ şube veya özel entegrasyon ihtiyacı durumunda teklif verilir.'
  },
],
```

## Replace the `content` field

Replace the entire `content: \`...\`` field (HTML string) with the new content from:
`/opt/khp/tabbled/blog-3-qr-menu-fiyatlari-2026.md`

### Markdown → HTML conversion rules (same as Blog #1)

1. **Headings:**
   - `## Heading` → `<h2>Heading</h2>` (NO id attributes — `addHeadingIds()` in `blogUtils.ts` adds them automatically)
   - `### Subheading` → `<h3>Subheading</h3>`
   - **REMOVE** the markdown `<a id="..."></a>` anchor tags from headings — not needed (helper auto-generates ids)

2. **Paragraphs:** wrap in `<p>...</p>`

3. **Bold:** `**text**` → `<strong>text</strong>`

4. **Lists:**
   - `- item` → `<li>item</li>` wrapped in `<ul>...</ul>`
   - Numbered lists wrapped in `<ol>...</ol>`
   - Checklist items (`- ✅`, `- ❌`, `- ⚠️`) → keep emoji as text, just `<li>✅ item</li>`

5. **Links:**
   - Internal (`/blog/...`) → `<a href="...">text</a>` (no target)
   - External (mevzuat, ticaret, resmigazete, tabbled.com itself) → `<a href="..." target="_blank" rel="noopener noreferrer">text</a>`

6. **Tables:** Convert markdown tables to HTML `<table><thead><tr><th>...</th></tr></thead><tbody><tr><td>...</td></tr></tbody></table>`

7. **Blockquotes:** `> quote` → `<blockquote>quote</blockquote>`

8. **SKIP markdown §10 ("Sıkça Sorulan Sorular")** entirely — the BlogFAQ component renders these from the `post.faq` array. Including them in HTML would show the FAQ twice.

9. **SKIP markdown `## İçindekiler` section** — BlogTOC auto-generates from h2/h3 headings via `extractTOC()`.

10. **SKIP YAML frontmatter** at the top (between the two `---`) — already mapped to BlogPost fields above.

11. **Final markdown horizontal rules (`---`)** at very end → skip.

12. **"İlgili rehberler" link list at end:** Keep this — internal linking is valuable for SEO.

13. **Final disclaimer paragraph:** Keep — it's E-E-A-T and trust signal.

## Self-check after content conversion

```bash
# Should find h2/h3 tags WITHOUT id attributes
grep -E "<h[23]" src/lib/blogData.ts | head -10

# Should NOT find inline anchor tags like <a id="...">
grep "<a id=" src/lib/blogData.ts && echo "FOUND ANCHORS — REMOVE THEM"

# Should not find markdown syntax leakage
grep -E "^##|\*\*[A-Z]" src/lib/blogData.ts && echo "MARKDOWN LEAKED"

# FAQ should not appear twice (once in faq array, not in content HTML)
# Spot check by counting occurrences of one specific question
grep -c "QR menü için ne kadar ödemeliyim" src/lib/blogData.ts
# Expected: 1 (only in faq array, not in content HTML)
```

## Build & Test

```bash
npm run build
```

Build should pass. Then verify:

```bash
echo "=== Built post exists ===" && \
ls -la /opt/khp/tabbled/dist/blog/qr-menu-fiyatlari-2026.html

echo "" && echo "=== New title in built HTML ===" && \
grep -oE '<title[^>]*>[^<]+</title>' /opt/khp/tabbled/dist/blog/qr-menu-fiyatlari-2026.html

echo "" && echo "=== Schema check: Article + FAQPage + Breadcrumb present ===" && \
grep -oE '"@type":"(Article|FAQPage|BreadcrumbList)"' /opt/khp/tabbled/dist/blog/qr-menu-fiyatlari-2026.html | sort -u

echo "" && echo "=== FAQ count (should be 8) ===" && \
grep -oE '"@type":"Question"' /opt/khp/tabbled/dist/blog/qr-menu-fiyatlari-2026.html | wc -l

echo "" && echo "=== Author Person Murat Kıran ===" && \
grep -oE '"author":\{[^}]+\}' /opt/khp/tabbled/dist/blog/qr-menu-fiyatlari-2026.html | head -1

echo "" && echo "=== Single title (no duplicates from index.html bug) ===" && \
grep -c "<title" /opt/khp/tabbled/dist/blog/qr-menu-fiyatlari-2026.html
# Expected: 1
```

## Stop for Review

After build passes and verification looks correct, **STOP. DO NOT COMMIT OR PUSH.** Show the diff and verification output. Wait for Murat's approval before pushing.

## Commit & Deploy (Only After Approval)

```bash
git add src/lib/blogData.ts
git commit -m "feat(blog): rewrite qr-menu-fiyatlari-2026 with full competitor analysis

Content: Full rewrite with 4-segment market map (Entry/Mid/Upper-Mid/Premium),
20 provider comparison tables, hidden cost breakdown, and recommendation matrix
by business size.

Tabbled positioned in Upper-Mid segment alongside Menulux Premium POS, Simpra,
QRall Pro. Pricing transparency emphasized as differentiator.

8 FAQ entries covering pricing, hidden costs, contract terms, switching costs.

Schema infrastructure (Article + FAQPage + BreadcrumbList) already in place
from previous blog #1 commit — auto-generates from BlogPost fields.

publishedAt preserved, updatedAt bumped to 2026-04-23.
Author standardized to 'Murat Kıran' (E-E-A-T)."

git push origin main
```

## Post-Deploy Verification

Wait 1-2 min for Vercel deploy, then:

```bash
echo "=== 1. Page returns 200 ===" && \
curl -sI https://tabbled.com/blog/qr-menu-fiyatlari-2026 | head -3

echo "" && echo "=== 2. New title (single) ===" && \
curl -s https://tabbled.com/blog/qr-menu-fiyatlari-2026 | grep -oE '<title[^>]*>[^<]+</title>'
# Expected: 1 line, contains "QR Menü Fiyatları 2026"

echo "" && echo "=== 3. FAQ count (8 questions) ===" && \
curl -s https://tabbled.com/blog/qr-menu-fiyatlari-2026 | grep -oE '"@type":"Question"' | wc -l
# Expected: 8

echo "" && echo "=== 4. Author Person Murat Kıran ===" && \
curl -s https://tabbled.com/blog/qr-menu-fiyatlari-2026 | grep -oE '"author":\{[^}]+\}' | head -1
# Expected: contains "@type":"Person","name":"Murat Kıran"

echo "" && echo "=== 5. Regression: other blog posts still work ===" && \
for slug in qr-menu-zorunlulugu-2026 qr-menu-nedir restoran-alerjen-bilgilendirme-rehberi; do
  status=$(curl -sI "https://tabbled.com/blog/$slug" | head -1)
  echo "$slug → $status"
done
# Expected: All HTTP/2 200
```

## Rollback Plan

If anything breaks: `git revert HEAD && git push origin main`. Single-file change, easy to revert.

## Notes for Reviewer (Murat)

After this prompt completes:

1. **Google Rich Results Test:** Paste `https://tabbled.com/blog/qr-menu-fiyatlari-2026` into https://search.google.com/test/rich-results. Confirm Article + FAQPage + BreadcrumbList all detected, no errors.

2. **Search Console URL Inspection:** Request indexing for the updated URL.

3. **No SoftwareApplication schema added** — this was a deliberate decision. Pricing rich snippets belong on landing page (which already has comprehensive SoftwareApplication schema with all 3 plans). Keeping blog post schema set consistent across all 10 posts.
