import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { RxChevronRight } from 'react-icons/rx';
import { LandingNavbar } from '../components/landing/Navbar1';
import { LandingFooter } from '../components/landing/LandingFooter';
import { BlogCTASection } from '../components/landing/BlogCTASection';
import FloatingWhatsApp from '../components/FloatingWhatsApp';
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

      <LandingNavbar />

      <section className="px-[5%] py-16 md:py-24 lg:py-28">
        <div className="container">
          <div className="mb-12 md:mb-18 lg:mb-20">
            <div className="mx-auto w-full max-w-lg text-center">
              <p className="mb-3 font-semibold md:mb-4">Blog</p>
              <h1 className="mb-5 text-5xl font-bold md:mb-6 md:text-7xl lg:text-8xl">
                Restoran dunyasindan icgoruler
              </h1>
              <p className="md:text-md">
                Stratejiler, rehberler ve sektor trendleri
              </p>
            </div>
          </div>

          {categories.length > 0 && (
            <div className="mb-12 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => handleCategoryChange('')}
                className={
                  !activeCategory
                    ? 'rounded-full bg-[#FF4F7A] px-4 py-2 text-sm font-semibold text-white'
                    : 'rounded-full border border-border-primary px-4 py-2 text-sm font-semibold'
                }
              >
                Tumu
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryChange(cat.id)}
                  className={
                    activeCategory === cat.id
                      ? 'rounded-full bg-[#FF4F7A] px-4 py-2 text-sm font-semibold text-white'
                      : 'rounded-full border border-border-primary px-4 py-2 text-sm font-semibold'
                  }
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}

          {filteredPosts.length === 0 ? (
            <div className="py-16 text-center text-text-secondary">
              <p className="mb-1 text-base">Yakin zamanda blog yazilari yayinlanacak.</p>
              <p className="text-sm">Takipte kalin!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-x-12 gap-y-12 md:gap-y-16 lg:grid-cols-2">
              {filteredPosts.map(post => (
                <div key={post.slug} className="grid gap-x-8 gap-y-6 md:grid-cols-[.75fr_1fr] md:gap-y-4">
                  <a href={`/blog/${post.slug}`} className="w-full">
                    <img
                      src={post.image || post.ogImage || ''}
                      alt={post.title}
                      className="aspect-square w-full object-cover"
                    />
                  </a>
                  <div className="flex h-full flex-col items-start justify-start">
                    <div className="mb-3 flex w-full items-center justify-start sm:mb-4">
                      <p className="mr-4 bg-background-secondary px-2 py-1 text-sm font-semibold">
                        {post.categoryLabel}
                      </p>
                      <p className="inline text-sm font-semibold">{post.readingTime} dk okuma</p>
                    </div>
                    <a className="mb-2" href={`/blog/${post.slug}`}>
                      <h3 className="text-xl font-bold md:text-2xl">{post.title}</h3>
                    </a>
                    <p>{post.excerpt}</p>
                    <a
                      href={`/blog/${post.slug}`}
                      className="mt-5 flex items-center gap-2 md:mt-6"
                    >
                      Devamini oku <RxChevronRight />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <BlogCTASection />
      <LandingFooter />
      <FloatingWhatsApp />
    </>
  );
}
