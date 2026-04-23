# Blog #1 Update + Schema Improvements

## Project Context

**This is a Vite + React + TypeScript project, NOT Next.js.** Do not apply Next.js conventions or validators.

This task has two independent sections:
- **Section 1:** Replace content of one blog post (`qr-menu-zorunlulugu-2026`) in `src/lib/blogData.ts`
- **Section 2:** Improve schema generation in `src/pages/BlogPost.tsx` — affects ALL 10 blog posts

Do both in one commit. Both are mechanical edits with low risk.

---

## Section 1 — Blog Content Replacement

### File to modify
`src/lib/blogData.ts`

### What to replace
Find the blog post object with `slug: 'qr-menu-zorunlulugu-2026'` (around line 30). Replace ALL of these fields:

| Field | New Value |
|---|---|
| `title` | `"Restoran Fiyat Etiketi Yönetmeliği 2026: QR Menü Zorunlu Mu? (Tam Rehber)"` |
| `metaTitle` | `"Restoran Fiyat Etiketi Yönetmeliği 2026: QR Menü Zorunlu Mu?"` |
| `metaDescription` | `"11 Ekim 2025 ve 30 Ocak 2026 yönetmelikleriyle restoranlar için yeni dönem başladı. QR menü zorunlu mu, fiziksel menü kalkıyor mu, servis ücreti yasak mı? Resmi kaynaklı tam rehber."` |
| `excerpt` | `"11 Ekim 2025 ve 30 Ocak 2026 yönetmelikleriyle restoran sahipleri için yeni dönem başladı. QR menü gerçekten zorunlu mu? Fiziksel menü hala gerekli mi? Servis ücreti yasağı kimi kapsıyor? Resmi Gazete metnine dayalı tam rehber."` |
| `author` | `"Murat Kıran"` |
| `updatedAt` | `"2026-04-23T00:00:00Z"` |
| `publishedAt` | **DO NOT CHANGE** — keep existing `"2026-04-14T00:00:00Z"` (preserves Google's original publish date signal) |
| `readingTime` | `15` |
| `tags` | `['fiyat etiketi yönetmeliği', 'qr menü zorunluluğu', 'servis ücreti yasağı', 'restoran mevzuat 2026', 'fiziksel menü', 'kuver ücreti']` |

### Add new optional field

In the `BlogPost` interface (top of file), add:

```typescript
authorUrl?: string;
```

Then in the `qr-menu-zorunlulugu-2026` post object, add:

```typescript
authorUrl: 'https://tabbled.com/hakkimizda',
```

(Note: `/hakkimizda` page does not exist yet. The URL is forward-looking — it's planned and will be created in a separate task. The schema reference is fine even if the URL 404s temporarily, Google tolerates this.)

### Replace the `faq` array

Replace the entire existing `faq` array with these 7 entries:

```typescript
faq: [
  {
    question: 'QR menü zorunlu mu?',
    answer: 'Hayır. Yönetmelikte "QR menü zorunlu" diye bir madde yok. Zorunlu olan fiyat listesinin görünür olması. QR sadece bunu sağlamanın bir yöntemi — ve en pratik olanı.'
  },
  {
    question: 'Sadece QR menü kullansam, fiziksel menü kalksa olur mu?',
    answer: 'Hayır. 11 Ekim 2025 yönetmeliği "karekodla erişim sunulması halinde liste ayrıca verilecek" diyor. Yani QR kullansanız bile fiziksel fiyat listesi (en azından PDF çıktısı) bulundurmak zorundasınız.'
  },
  {
    question: 'Servis ücreti hâlâ alabilir miyim?',
    answer: 'Hayır. 30 Ocak 2026 yönetmelik değişikliğiyle servis, masa ve kuver ücreti adı altında alınan tüm ek ücretler yasaklandı. Tek istisna: 4857 sayılı İş Kanunu\'nun 51. maddesi kapsamındaki "yüzde" sistemi.'
  },
  {
    question: 'Hangi işletmeler bu yönetmelikten etkilenir?',
    answer: 'Restoran, kafe, lokanta, pastane, bar, kıraathane gibi tüm yiyecek-içecek hizmeti sunan işletmeler. Seyyar satıcılar (simit arabası, döner arabası gibi) kapsam dışı. Yiyecek-içecek satan otel restoranları da kapsamda.'
  },
  {
    question: 'Yönetmeliğe uymazsam ceza nedir?',
    answer: '2026 itibarıyla her aykırılık için yaklaşık 2.812 TL idari para cezası. Menü-kasa fiyat farkı için ayrıca 3.166 TL/işlem. Birden fazla ürün eksikse ceza katlanır (örnek: 3 ürün eksikse 8.436 TL).'
  },
  {
    question: 'Ticaret Bakanlığı\'nın merkezi sistemine fiyat girmek zorunda mıyım?',
    answer: 'Henüz değil. Yönetmelik bu yükümlülüğü getirdi ama Bakanlık kriterleri ve sistem detaylarını henüz ilan etmedi. İlan edilince işletmelerin 3 ay süresi başlayacak.'
  },
  {
    question: 'QR menü ne kadara mal olur?',
    answer: 'Türkiye pazarında ₺200/ay\'dan ₺2.000/ay\'a kadar çeşitli paketler var. Tabbled paketleri ₺549/ay\'dan başlıyor.'
  },
],
```

### Replace the `content` field

Replace the entire `content: \`...\`` field (the long HTML string) with the new content.

The new content is provided as a separate file. Read from:
`/opt/khp/tabbled/blog-1-fiyat-etiketi-yonetmeligi-2026.md`

**IMPORTANT — Format conversion:**
The source file is markdown. The `content` field expects HTML. Convert the markdown to HTML using these rules:

1. **Headings:**
   - `## Heading` → `<h2>Heading</h2>` (NO id attributes — `addHeadingIds()` in `blogUtils.ts` adds them automatically)
   - `### Subheading` → `<h3>Subheading</h3>`
   - REMOVE the markdown `<a id="..."></a>` anchor tags from headings — they're not needed (the helper auto-generates ids)

2. **Paragraphs:** wrap in `<p>...</p>`

3. **Bold:** `**text**` → `<strong>text</strong>`

4. **Lists:**
   - `- item` → `<li>item</li>` wrapped in `<ul>...</ul>`
   - Numbered lists wrapped in `<ol>...</ol>`

5. **Links:** `[text](url)` → `<a href="url">text</a>`. External links (resmigazete.gov.tr, ticaret.gov.tr) get `target="_blank" rel="noopener noreferrer"`.

6. **Tables:** Convert markdown tables to HTML `<table><thead><tr><th>...</th></tr></thead><tbody><tr><td>...</td></tr></tbody></table>`

7. **Blockquotes:** `> quote` → `<blockquote>quote</blockquote>`

8. **Internal markers:** Skip the markdown `## İçindekiler` section entirely — the `BlogTOC` component auto-generates table of contents from h2/h3 headings via `extractTOC()`.

9. **Frontmatter:** Skip the YAML frontmatter block at the top (lines between the two `---`) — those values are already mapped to BlogPost fields above.

10. **Final markdown horizontal rules (`---`):** Skip them — not rendered as HTML.

### Self-check after content conversion

Run these to verify the converted HTML:

```bash
# Should find h2/h3 tags WITHOUT id attributes
grep -E "<h[23]" src/lib/blogData.ts | head -10

# Should NOT find inline anchor tags like <a id="...">
grep "<a id=" src/lib/blogData.ts && echo "FOUND ANCHORS — REMOVE THEM"

# Should not find markdown syntax leakage
grep -E "^##|\*\*" src/lib/blogData.ts && echo "MARKDOWN LEAKED — convert to HTML"
```

---

## Section 2 — Schema Improvements (BlogPost.tsx)

### File to modify
`src/pages/BlogPost.tsx`

### Change 1 — Add 3 missing Article fields

Find the `articleSchema` object (around line ~28). Add three new fields:

**Before:**
```typescript
const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: post.title,
  description: post.metaDescription,
  author: { '@type': 'Organization', name: 'Tabbled', url: 'https://tabbled.com' },
  publisher: { ... },
  datePublished: post.publishedAt,
  dateModified: post.updatedAt,
  mainEntityOfPage: `https://tabbled.com/blog/${post.slug}`,
  image: post.ogImage || 'https://tabbled.com/tabbled-logo-icon.png',
};
```

**After:**
```typescript
const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: post.title,
  description: post.metaDescription,
  author: {
    '@type': 'Person',
    name: post.author,
    ...(post.authorUrl && { url: post.authorUrl }),
  },
  publisher: {
    '@type': 'Organization',
    name: 'Tabbled',
    url: 'https://tabbled.com',
    logo: { '@type': 'ImageObject', url: 'https://tabbled.com/tabbled-logo-icon.png' },
  },
  datePublished: post.publishedAt,
  dateModified: post.updatedAt,
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': `https://tabbled.com/blog/${post.slug}`,
  },
  image: post.ogImage || 'https://tabbled.com/tabbled-logo-icon.png',
  articleSection: post.categoryLabel,
  keywords: post.tags,
  inLanguage: 'tr-TR',
};
```

**Three structural changes:**
1. `author` is now a `Person` type (was `Organization`), uses `post.author` field, optionally adds `url` from new `authorUrl` field
2. `mainEntityOfPage` is now a proper `WebPage` object (was a plain string — Schema.org spec requires object form for rich result eligibility)
3. Three new fields added at the bottom: `articleSection`, `keywords`, `inLanguage`

### Change 2 — Update BreadcrumbList structure

Find the `breadcrumbSchema` object. Replace the third `ListItem` (which currently links to category page) with the post itself:

**Before:**
```typescript
{ '@type': 'ListItem', position: 3, name: post.categoryLabel, item: `https://tabbled.com/blog?category=${post.category}` },
```

**After:**
```typescript
{ '@type': 'ListItem', position: 3, name: post.title, item: `https://tabbled.com/blog/${post.slug}` },
```

**Why:** Google's rich result preview shows the breadcrumb path. The article-focused pattern (Home > Blog > Article Title) is the documented best practice for blog posts. The category-focused pattern was unusual and didn't match Google's expected breadcrumb structure for articles.

### Change 3 — Verify `BlogPost` interface has new field

After Section 1, the `BlogPost` interface in `src/lib/blogData.ts` should have `authorUrl?: string`. The `articleSchema` change above conditionally spreads it (`...(post.authorUrl && { url: post.authorUrl })`), so posts without it still work. No further interface changes needed.

### What does NOT change

- `faqSchema` build logic — it correctly maps `post.faq` array to `Question`/`Answer` objects. No change needed.
- Any rendering logic outside the schema build.
- Other 9 blog posts will get the same schema improvements automatically (they all flow through this same code).

---

## Build, Test, Commit

```bash
# Build first to catch TypeScript errors
npm run build

# If build passes, verify the modified blog content renders
# (you cannot run dev server here, but check that HTML is valid by sampling output)
grep -A 1 "qr-menu-zorunlulugu-2026" /opt/khp/tabbled/dist/blog/qr-menu-zorunlulugu-2026.html | head -20

# Confirm FAQ schema appears in built HTML
grep -c "FAQPage" /opt/khp/tabbled/dist/blog/qr-menu-zorunlulugu-2026.html
# Expected: 1 (or more)

# Confirm author is Person type
grep "Person" /opt/khp/tabbled/dist/blog/qr-menu-zorunlulugu-2026.html | head -3

# Commit
git add src/lib/blogData.ts src/pages/BlogPost.tsx
git commit -m "feat(blog): rewrite qr-menu-zorunlulugu-2026 with legally accurate content + improve schema

Content: Full rewrite of fiyat etiketi yönetmeliği post with Resmi Gazete sources.
Corrects previous misinformation: 'QR menü zorunlu değil, fiyat şeffaflığı zorunlu',
fiziksel menü hâlâ gerekli (karekod ile birlikte), servis ücreti yasağı (30 Oca 2026).

Schema improvements (affects ALL 10 blog posts):
- author: Organization → Person (post.author + optional post.authorUrl)
  Stronger E-E-A-T signal for YMYL content (legal/financial topics)
- mainEntityOfPage: string → WebPage object (Schema.org spec compliance)
- BreadcrumbList: category-focused → article-focused (Google best practice)
- New fields: articleSection, keywords, inLanguage='tr-TR'

Interface: BlogPost.authorUrl added (optional, backwards-compatible).

publishedAt preserved (2026-04-14), updatedAt bumped to 2026-04-23.
Author changed to 'Murat Kıran' (founder) for E-E-A-T."

git push origin main
```

---

## Post-Deploy Verification

Wait 1-2 min for Vercel auto-deploy, then run:

```bash
echo "=== 1. Page returns 200 ===" && \
curl -sI https://tabbled.com/blog/qr-menu-zorunlulugu-2026 | head -3

echo "" && echo "=== 2. New title in HTML (SSG output) ===" && \
curl -s https://tabbled.com/blog/qr-menu-zorunlulugu-2026 | grep -oE '<title>[^<]+</title>' | head -1
# Expected: contains "Fiyat Etiketi Yönetmeliği"

echo "" && echo "=== 3. Author = Person Murat Kıran ===" && \
curl -s https://tabbled.com/blog/qr-menu-zorunlulugu-2026 | grep -oE '"author":\{[^}]+\}' | head -1
# Expected: contains "@type":"Person","name":"Murat Kıran"

echo "" && echo "=== 4. articleSection + keywords + inLanguage present ===" && \
curl -s https://tabbled.com/blog/qr-menu-zorunlulugu-2026 | grep -oE '"(articleSection|keywords|inLanguage)"' | sort -u
# Expected: 3 lines

echo "" && echo "=== 5. Breadcrumb has article title (not category) ===" && \
curl -s https://tabbled.com/blog/qr-menu-zorunlulugu-2026 | grep -oE '"position":3[^}]+\}' | head -1
# Expected: name contains article title, item ends with /qr-menu-zorunlulugu-2026

echo "" && echo "=== 6. FAQPage schema present (7 questions) ===" && \
curl -s https://tabbled.com/blog/qr-menu-zorunlulugu-2026 | grep -oE '"@type":"Question"' | wc -l
# Expected: 7

echo "" && echo "=== 7. Regression: other blog posts still build correctly ===" && \
for slug in qr-menu-nedir restoran-alerjen-bilgilendirme-rehberi qr-menu-fiyatlari-2026; do
  status=$(curl -sI "https://tabbled.com/blog/$slug" | head -1)
  echo "$slug → $status"
done
# Expected: All HTTP/2 200

echo "" && echo "=== 8. Validate JSON-LD with Google Rich Results Test ===" && \
echo "Manual step: paste this URL into https://search.google.com/test/rich-results"
echo "https://tabbled.com/blog/qr-menu-zorunlulugu-2026"
echo "Expected results: Article + FAQPage + BreadcrumbList all detected, no errors"
```

---

## Rollback Plan

If anything breaks:

**Section 1 issue (content):** `git revert HEAD` reverts both content and schema changes. Acceptable — schema improvements can wait.

**Section 2 issue (schema):** Manually edit `src/pages/BlogPost.tsx` to revert just the schema changes (3 changes: articleSchema fields, mainEntityOfPage shape, breadcrumbSchema structure). Keep content rewrite. Push.

**Build fails:** Likely cause is HTML conversion error in Section 1 (unclosed tag, escaped quote issue). Run `npm run build 2>&1 | tail -20` and share output.

---

## Notes for Reviewer (Murat)

After this prompt completes, two things to do manually:

1. **Google Rich Results Test:** Paste `https://tabbled.com/blog/qr-menu-zorunlulugu-2026` into https://search.google.com/test/rich-results. Confirm:
   - Article schema detected, no errors
   - FAQPage schema detected, all 7 questions visible
   - BreadcrumbList shows Home > Blog > [article title]

2. **Search Console URL Inspection:** In Search Console, request indexing for the updated URL. Tells Google "I've updated this, please re-crawl now" — speeds up the new content showing in search results from weeks to days.

3. **About page (`/hakkimizda`):** This task references `authorUrl: 'https://tabbled.com/hakkimizda'` but that page does not exist yet. Currently it 404s. Acceptable temporarily — Google tolerates broken authorUrl. But About page is a planned task from the SEO project; once it's live, the link starts working naturally with no further code change needed.
