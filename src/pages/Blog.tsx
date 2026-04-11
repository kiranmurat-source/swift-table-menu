import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BlogCard from '../components/BlogCard';
import BlogCTA from '../components/BlogCTA';
import { blogPosts, getAllCategories } from '../lib/blogData';

export default function Blog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || '';
  const [activeCategory, setActiveCategory] = useState(categoryParam);

  const categories = useMemo(() => getAllCategories(), []);

  const filteredPosts = useMemo(
    () => (activeCategory ? blogPosts.filter(p => p.category === activeCategory) : blogPosts),
    [activeCategory],
  );

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    if (cat) {
      setSearchParams({ category: cat });
    } else {
      setSearchParams({});
    }
  };

  return (
    <>
      <Helmet>
        <title>Blog — Restoran Dijital Menu Rehberi | Tabbled</title>
        <meta
          name="description"
          content="QR menu, dijital menu sistemi, restoran pazarlama ve yasal duzenlemeler hakkında rehberler ve ipuclari."
        />
        <link rel="canonical" href="https://tabbled.com/blog" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://tabbled.com/blog" />
        <meta property="og:title" content="Blog — Restoran Dijital Menu Rehberi | Tabbled" />
        <meta
          property="og:description"
          content="QR menu, dijital menu sistemi, restoran pazarlama ve yasal duzenlemeler hakkında rehberler ve ipuclari."
        />
        <meta property="og:image" content="https://tabbled.com/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://tabbled.com/og-image.png" />
      </Helmet>

      <Navbar />

      <main
        style={{
          maxWidth: 960,
          margin: '0 auto',
          padding: '48px 20px 0',
          fontFamily: "'Inter', sans-serif",
          minHeight: '60vh',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 700,
              fontSize: 36,
              color: '#1C1C1E',
              marginBottom: 8,
            }}
          >
            Blog
          </h1>
          <p style={{ fontSize: 15, color: '#6B6B6F', lineHeight: 1.6, maxWidth: 560 }}>
            Restoran dijital menu dunyasından rehberler, ipuclari ve guncel yasal duzenlemeler.
          </p>
        </div>

        {/* Category filter */}
        {categories.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 32,
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={() => handleCategoryChange('')}
              style={{
                padding: '6px 16px',
                borderRadius: 20,
                border: `1px solid ${!activeCategory ? '#FF4F7A' : '#E5E7EB'}`,
                backgroundColor: !activeCategory ? '#FF4F7A' : '#fff',
                color: !activeCategory ? '#fff' : '#6B6B6F',
                fontSize: 13,
                fontWeight: !activeCategory ? 600 : 400,
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Tumu
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id)}
                style={{
                  padding: '6px 16px',
                  borderRadius: 20,
                  border: `1px solid ${activeCategory === cat.id ? '#FF4F7A' : '#E5E7EB'}`,
                  backgroundColor: activeCategory === cat.id ? '#FF4F7A' : '#fff',
                  color: activeCategory === cat.id ? '#fff' : '#6B6B6F',
                  fontSize: 13,
                  fontWeight: activeCategory === cat.id ? 600 : 400,
                  cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Posts grid */}
        {filteredPosts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: '#9CA3AF' }}>
            <p style={{ fontSize: 16, marginBottom: 4 }}>Yakında blog yazıları yayınlanacak.</p>
            <p style={{ fontSize: 13 }}>Takipte kalın!</p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 400px), 1fr))',
              gap: 24,
            }}
          >
            {filteredPosts.map(post => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        )}

        {/* CTA */}
        <BlogCTA />
      </main>

      <Footer />
    </>
  );
}
