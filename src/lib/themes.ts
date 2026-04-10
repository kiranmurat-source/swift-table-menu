export interface MenuTheme {
  key: string;
  label_tr: string;
  bg: string;
  text: string;
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
  modalBg: string;
  price: string;
  accent: string;
  mutedText: string;
  splashOverlay: string;
  badgeBg: string;
  badgeText: string;
  categoryBg: string;
  categoryActiveBg: string;
  categoryActiveText: string;
  inputBg: string;
  divider: string;
  /** Whether allergen SVG icons need to be inverted to be visible on the bg */
  invertIcons: boolean;
}

export const THEMES: Record<string, MenuTheme> = {
  white: {
    key: 'white',
    label_tr: 'Beyaz (Klasik)',
    bg: '#FFFFFF',
    text: '#111111',
    cardBg: '#FFFFFF',
    cardBorder: 'rgba(0,0,0,0.06)',
    cardShadow: '0 1px 3px rgba(0,0,0,0.04)',
    modalBg: '#FFFFFF',
    price: '#FF4F7A',
    accent: '#111111',
    mutedText: '#6B7280',
    splashOverlay: 'rgba(0,0,0,0.5)',
    badgeBg: '#F3F4F6',
    badgeText: '#374151',
    categoryBg: '#F5F5F5',
    categoryActiveBg: '#111111',
    categoryActiveText: '#FFFFFF',
    inputBg: '#F9FAFB',
    divider: '#E5E5E5',
    invertIcons: false,
  },
  black: {
    key: 'black',
    label_tr: 'Siyah (Elegance)',
    bg: '#111111',
    text: '#FFFFFF',
    cardBg: '#1a1a1a',
    cardBorder: 'rgba(255,255,255,0.08)',
    cardShadow: 'none',
    modalBg: '#222222',
    price: '#FF6B8A',
    accent: '#FFFFFF',
    mutedText: '#9CA3AF',
    splashOverlay: 'rgba(0,0,0,0.7)',
    badgeBg: '#374151',
    badgeText: '#D1D5DB',
    categoryBg: '#1a1a1a',
    categoryActiveBg: '#FFFFFF',
    categoryActiveText: '#111111',
    inputBg: '#1a1a1a',
    divider: 'rgba(255,255,255,0.08)',
    invertIcons: true,
  },
  red: {
    key: 'red',
    label_tr: 'Kırmızı (Bold)',
    bg: '#DC2626',
    text: '#FFFFFF',
    cardBg: 'rgba(255,255,255,0.15)',
    cardBorder: 'rgba(255,255,255,0.25)',
    cardShadow: '0 1px 3px rgba(0,0,0,0.04)',
    modalBg: '#DC2626',
    price: '#FFFFFF',
    accent: '#FFFFFF',
    mutedText: 'rgba(255,255,255,0.7)',
    splashOverlay: 'rgba(0,0,0,0.5)',
    badgeBg: 'rgba(255,255,255,0.2)',
    badgeText: '#FFFFFF',
    categoryBg: 'rgba(255,255,255,0.1)',
    categoryActiveBg: '#FFFFFF',
    categoryActiveText: '#DC2626',
    inputBg: 'rgba(255,255,255,0.1)',
    divider: 'rgba(255,255,255,0.2)',
    invertIcons: true,
  },
};

export function getTheme(key: string | null | undefined): MenuTheme {
  return THEMES[key || 'white'] || THEMES.white;
}
