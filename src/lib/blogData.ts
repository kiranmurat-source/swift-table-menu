export interface BlogPost {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  category: 'yasal' | 'rehber' | 'ipuclari' | 'urun';
  categoryLabel: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: string;
  updatedAt: string;
  readingTime: number;
  ogImage?: string;
  tags: string[];
  faq?: { question: string; answer: string }[];
  relatedSlugs: string[];
}

export const CATEGORY_COLORS: Record<string, string> = {
  yasal: '#3B82F6',
  rehber: '#10B981',
  ipuclari: '#F59E0B',
  urun: '#FF4F7A',
};

export const blogPosts: BlogPost[] = [
  {
    slug: 'qr-menu-zorunlulugu-2026',
    title: '2026 QR Menü Zorunluluğu: Restoran Sahipleri İçin Tam Rehber',
    metaTitle: '2026 QR Menü Zorunluluğu | Restoran Rehberi - Tabbled',
    metaDescription: '2026 QR menü zorunluluğu hakkında bilmeniz gereken her şey. Fiyat etiketi yönetmeliği, cezalar, uyum adımları ve dijital menü çözümleri.',
    category: 'yasal',
    categoryLabel: 'Yasal Düzenlemeler',
    excerpt: '11 Ekim 2025 Resmi Gazete\'de yayımlanan yönetmelik ile QR menü zorunluluğu başladı. İşletmelerin bilmesi gerekenler.',
    content: '<p>Bu makale yakında yayınlanacak.</p>',
    author: 'Tabbled Ekibi',
    publishedAt: '2026-04-14T00:00:00Z',
    updatedAt: '2026-04-14T00:00:00Z',
    readingTime: 10,
    tags: ['QR menü', 'zorunluluk', 'fiyat etiketi yönetmeliği', '2026'],
    faq: [
      {
        question: 'QR menü zorunlu mu?',
        answer: '11 Ekim 2025 tarihli Fiyat Etiketi Yönetmeliği ile QR kodlu menü gösterimi yasal olarak desteklenmektedir. 1 Ocak 2026 itibarıyla tam zorunluluk başlamıştır.',
      },
      {
        question: 'QR menü kullanmazsam ne olur?',
        answer: 'Fiyat etiketi yönetmeliğine uymamanın cezası 3.166 TL idari para cezasıdır. Denetimler Ticaret Bakanlığı tarafından yapılmaktadır.',
      },
      {
        question: 'QR menü sistemi ne kadar?',
        answer: 'QR menü sistemi fiyatları aylık 250 TL ile 4.200 TL arasında değişmektedir. Tabbled aylık 300 TL\'den başlayan fiyatlarla hizmet vermektedir.',
      },
    ],
    relatedSlugs: [],
  },
];

export const getPostBySlug = (slug: string): BlogPost | undefined =>
  blogPosts.find(p => p.slug === slug);

export const getPostsByCategory = (category: string): BlogPost[] =>
  blogPosts.filter(p => p.category === category);

export const getRelatedPosts = (post: BlogPost): BlogPost[] =>
  post.relatedSlugs
    .map(slug => getPostBySlug(slug))
    .filter(Boolean) as BlogPost[];

export const getAllCategories = (): { id: string; label: string; count: number }[] => {
  const categories = new Map<string, { label: string; count: number }>();
  blogPosts.forEach(post => {
    const existing = categories.get(post.category);
    if (existing) {
      existing.count++;
    } else {
      categories.set(post.category, { label: post.categoryLabel, count: 1 });
    }
  });
  return Array.from(categories.entries()).map(([id, data]) => ({ id, ...data }));
};
