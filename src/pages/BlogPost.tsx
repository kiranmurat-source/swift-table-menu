import { useMemo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import DOMPurify from 'isomorphic-dompurify';
import { CalendarBlank, Clock, User } from "@phosphor-icons/react";
import { LandingNavbar } from '../components/landing/Navbar1';
import { LandingFooter } from '../components/landing/LandingFooter';
import BlogBreadcrumb from '../components/BlogBreadcrumb';
import BlogTOC from '../components/BlogTOC';
import BlogFAQ from '../components/BlogFAQ';
import BlogCard from '../components/BlogCard';
import BlogCTA from '../components/BlogCTA';
import { getPostBySlug, getRelatedPosts, CATEGORY_COLORS } from '../lib/blogData';
import { extractTOC, addHeadingIds, formatDate } from '../lib/blogUtils';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getPostBySlug(slug) : undefined;

  const tocItems = useMemo(() => (post ? extractTOC(post.content) : []), [post]);
  const processedContent = useMemo(() => (post ? addHeadingIds(post.content) : ''), [post]);
  const relatedPosts = useMemo(() => (post ? getRelatedPosts(post) : []), [post]);

  if (!post) return <Navigate to="/404" replace />;

  const catColor = CATEGORY_COLORS[post.category] || '#6B6B6F';

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

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: 'https://tabbled.com' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://tabbled.com/blog' },
      { '@type': 'ListItem', position: 3, name: post.title, item: `https://tabbled.com/blog/${post.slug}` },
    ],
  };

  const faqSchema = post.faq?.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: post.faq.map(f => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      }
    : null;

  return (
    <>
      <Helmet>
        <title>{post.metaTitle}</title>
        <meta name="description" content={post.metaDescription} />
        <link rel="canonical" href={`https://tabbled.com/blog/${post.slug}`} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.metaTitle} />
        <meta property="og:description" content={post.metaDescription} />
        <meta property="og:url" content={`https://tabbled.com/blog/${post.slug}`} />
        {post.ogImage && <meta property="og:image" content={post.ogImage} />}
        <meta property="article:published_time" content={post.publishedAt} />
        <meta property="article:modified_time" content={post.updatedAt} />
        <meta property="article:author" content="Tabbled" />
        <meta property="article:section" content={post.categoryLabel} />
        {post.tags.map(tag => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        {faqSchema && <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>}
      </Helmet>

      <LandingNavbar />

      <main
        style={{
          maxWidth: 1080,
          margin: '0 auto',
          padding: '32px 20px 0',
          fontFamily: "'Roboto', sans-serif",
          minHeight: '60vh',
        }}
      >
        <BlogBreadcrumb categoryLabel={post.categoryLabel} category={post.category} />

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <span
            style={{
              display: 'inline-block',
              fontSize: 11,
              fontWeight: 600,
              color: '#fff',
              backgroundColor: catColor,
              padding: '2px 10px',
              borderRadius: 12,
              marginBottom: 16,
            }}
          >
            {post.categoryLabel}
          </span>

          <h1
            style={{
              fontFamily: "'Roboto', sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(26px, 4vw, 36px)',
              color: '#1C1C1E',
              lineHeight: 1.2,
              marginBottom: 16,
              letterSpacing: '-0.02em',
            }}
          >
            {post.title}
          </h1>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              fontSize: 13,
              color: '#9CA3AF',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <CalendarBlank size={15} /> {formatDate(post.publishedAt)}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={15} /> {post.readingTime} dk okuma
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <User size={15} /> {post.author}
            </span>
          </div>
        </div>

        {/* Hero image */}
        {post.image && (
          <img
            src={post.image}
            alt={post.title}
            style={{
              width: '100%',
              maxHeight: 420,
              objectFit: 'cover',
              borderRadius: 12,
              marginBottom: 32,
            }}
          />
        )}

        <div style={{ height: 1, backgroundColor: '#E5E7EB', marginBottom: 32 }} />

        {/* Content + TOC layout */}
        <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start' }}>
          {/* Article content */}
          <article
            className="blog-content"
            style={{ flex: 1, minWidth: 0, maxWidth: 720 }}
            dangerouslySetInnerHTML={{
              __html:
                typeof DOMPurify.sanitize === 'function'
                  ? DOMPurify.sanitize(processedContent || '')
                  : processedContent || '',
            }}
          />

          {/* TOC sidebar — desktop only */}
          {tocItems.length > 0 && (
            <aside
              style={{
                width: 240,
                flexShrink: 0,
                display: 'none',
              }}
              className="blog-toc-sidebar"
            >
              <BlogTOC items={tocItems} />
            </aside>
          )}
        </div>

        {/* FAQ */}
        {post.faq && post.faq.length > 0 && <BlogFAQ items={post.faq} />}

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <h2
              style={{
                fontFamily: "'Roboto', sans-serif",
                fontWeight: 600,
                fontSize: 24,
                color: '#1C1C1E',
                marginBottom: 16,
              }}
            >
              Ilgili Yazılar
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
                gap: 20,
              }}
            >
              {relatedPosts.slice(0, 3).map(rp => (
                <BlogCard key={rp.slug} post={rp} />
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <BlogCTA />
      </main>

      <LandingFooter />
    </>
  );
}
