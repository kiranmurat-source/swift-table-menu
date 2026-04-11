// Static demo data for /menu/demo — no Supabase calls.
// Shapes match the Restaurant / MenuCategory / MenuItem interfaces in PublicMenu.tsx.

const DEMO_RESTAURANT_ID = 'demo-restaurant';

export const demoRestaurant = {
  id: DEMO_RESTAURANT_ID,
  name: 'Örnek Restoran',
  slug: 'demo',
  logo_url: null,
  cover_url: null,
  cover_image_url: null,
  address: 'İstanbul, Türkiye',
  phone: '+90 (212) 555 00 00',
  is_active: true,
  description_tr: 'Tabbled dijital menü platformunun canlı demosu. Kategoriler, ürün detayları, sepet ve WhatsApp sipariş — hepsi çalışıyor.',
  tagline: 'Tabbled ile dijital menü deneyimi',
  enabled_languages: [] as string[],
  translations: {} as Record<string, { name?: string; description?: string; tagline?: string }>,
  theme_color: 'white',
  social_instagram: 'https://instagram.com',
  social_facebook: null,
  social_x: null,
  social_tiktok: null,
  social_website: 'https://tabbled.com',
  social_whatsapp: '905325119484',
  social_google_maps: null,
  working_hours: {
    monday: { open: '09:00', close: '23:00', closed: false },
    tuesday: { open: '09:00', close: '23:00', closed: false },
    wednesday: { open: '09:00', close: '23:00', closed: false },
    thursday: { open: '09:00', close: '23:00', closed: false },
    friday: { open: '09:00', close: '00:00', closed: false },
    saturday: { open: '10:00', close: '00:00', closed: false },
    sunday: { open: '10:00', close: '22:00', closed: false },
  },
  feature_waiter_calls: true,
  feature_cart: true,
  feature_whatsapp_order: true,
  feature_feedback: true,
  feature_discount_codes: false,
  feature_likes: true,
  google_place_id: null,
};

export const demoCategories = [
  { id: 'demo-cat-1', name_tr: 'Kahvaltı', sort_order: 1 },
  { id: 'demo-cat-2', name_tr: 'Ana Yemekler', sort_order: 2 },
  { id: 'demo-cat-3', name_tr: 'Tatlılar', sort_order: 3 },
  { id: 'demo-cat-4', name_tr: 'İçecekler', sort_order: 4 },
].map((c) => ({
  id: c.id,
  restaurant_id: DEMO_RESTAURANT_ID,
  name_tr: c.name_tr,
  description_tr: null as string | null,
  sort_order: c.sort_order,
  is_active: true,
  translations: {} as Record<string, { name?: string; description?: string; tagline?: string }>,
  image_url: null as string | null,
  parent_id: null as string | null,
}));

type DemoItemSeed = {
  id: string;
  category_id: string;
  name_tr: string;
  description_tr: string;
  price: number;
  allergens: string[];
  is_featured?: boolean;
  is_popular?: boolean;
  sort_order: number;
};

const demoItemSeeds: DemoItemSeed[] = [
  // Kahvaltı
  { id: 'd-1', category_id: 'demo-cat-1', name_tr: 'Serpme Kahvaltı', description_tr: '2 kişilik zengin serpme kahvaltı tabağı. Taze peynir çeşitleri, zeytin, bal, kaymak, menemen ve sınırsız çay.', price: 450, allergens: ['gluten', 'milk', 'eggs'], is_featured: true, sort_order: 1 },
  { id: 'd-2', category_id: 'demo-cat-1', name_tr: 'Menemen', description_tr: 'Domates, biber ve yumurta ile hazırlanan geleneksel Türk menemen.', price: 120, allergens: ['eggs'], sort_order: 2 },
  { id: 'd-3', category_id: 'demo-cat-1', name_tr: 'Simit & Peynir', description_tr: 'Taze simit, beyaz peynir, domates ve salatalık.', price: 80, allergens: ['gluten', 'milk', 'sesame'], sort_order: 3 },
  // Ana Yemekler
  { id: 'd-4', category_id: 'demo-cat-2', name_tr: 'Adana Kebap', description_tr: 'El yapımı acılı kebap, közlenmiş domates ve biber ile. Lavaş eşliğinde.', price: 280, allergens: ['gluten'], is_featured: true, is_popular: true, sort_order: 1 },
  { id: 'd-5', category_id: 'demo-cat-2', name_tr: 'Izgara Köfte', description_tr: 'Dana kıyma köfte, pilav ve közlenmiş sebze garnisi.', price: 220, allergens: ['gluten', 'eggs'], sort_order: 2 },
  { id: 'd-6', category_id: 'demo-cat-2', name_tr: 'Karnıyarık', description_tr: 'Kızartılmış patlıcan, kıymalı harç, domates sos.', price: 180, allergens: [], sort_order: 3 },
  { id: 'd-7', category_id: 'demo-cat-2', name_tr: 'Mantı', description_tr: 'El yapımı Kayseri mantısı, yoğurt ve tereyağlı sos.', price: 200, allergens: ['gluten', 'milk', 'eggs'], sort_order: 4 },
  // Tatlılar
  { id: 'd-8', category_id: 'demo-cat-3', name_tr: 'Künefe', description_tr: 'Sıcak servis, antep fıstıklı, kaymak peynirli.', price: 160, allergens: ['gluten', 'milk', 'nuts'], is_featured: true, sort_order: 1 },
  { id: 'd-9', category_id: 'demo-cat-3', name_tr: 'Baklava (6 dilim)', description_tr: 'Antep fıstıklı ev yapımı baklava.', price: 200, allergens: ['gluten', 'nuts'], sort_order: 2 },
  { id: 'd-10', category_id: 'demo-cat-3', name_tr: 'Sütlaç', description_tr: 'Fırında pişirilmiş geleneksel sütlaç.', price: 90, allergens: ['milk'], sort_order: 3 },
  // İçecekler
  { id: 'd-11', category_id: 'demo-cat-4', name_tr: 'Türk Çayı', description_tr: 'Demlik çay, ince belli bardakta.', price: 30, allergens: [], sort_order: 1 },
  { id: 'd-12', category_id: 'demo-cat-4', name_tr: 'Türk Kahvesi', description_tr: 'Orta şekerli, lokum eşliğinde.', price: 60, allergens: [], sort_order: 2 },
  { id: 'd-13', category_id: 'demo-cat-4', name_tr: 'Ayran', description_tr: 'Ev yapımı yoğurttan taze ayran.', price: 40, allergens: ['milk'], sort_order: 3 },
  { id: 'd-14', category_id: 'demo-cat-4', name_tr: 'Taze Portakal Suyu', description_tr: 'Sıkma portakal suyu.', price: 70, allergens: [], sort_order: 4 },
  { id: 'd-15', category_id: 'demo-cat-4', name_tr: 'Limonata', description_tr: 'Ev yapımı taze limonata, nane ile.', price: 55, allergens: [], sort_order: 5 },
];

export const demoItems = demoItemSeeds.map((s) => ({
  id: s.id,
  restaurant_id: DEMO_RESTAURANT_ID,
  category_id: s.category_id,
  name_tr: s.name_tr,
  description_tr: s.description_tr,
  price: s.price,
  image_url: null as string | null,
  is_available: true,
  is_popular: s.is_popular ?? false,
  is_new: false,
  is_vegetarian: false,
  is_featured: s.is_featured ?? false,
  is_sold_out: false,
  schedule_type: 'always' as const,
  schedule_start: null as string | null,
  schedule_end: null as string | null,
  schedule_periodic: {},
  price_variants: [] as Array<{ name_tr: string; name_en: string; price: number; calories: number | null }>,
  nutrition: null,
  prep_time: null as number | null,
  allergens: s.allergens,
  calories: null as number | null,
  sort_order: s.sort_order,
  translations: {} as Record<string, { name?: string; description?: string; tagline?: string }>,
  happy_hour_active: false,
  happy_hour_price: null as number | null,
  happy_hour_label: null as string | null,
  happy_hour_days: null as string[] | null,
  happy_hour_start_time: null as string | null,
  happy_hour_end_time: null as string | null,
}));
