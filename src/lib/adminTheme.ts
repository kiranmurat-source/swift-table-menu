export type AdminThemeKey = 'light' | 'dark';

export interface AdminTheme {
  key: AdminThemeKey;
  pageBg: string;
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
  heading: string;
  value: string;
  subtle: string;
  icon: string;
  divider: string;
  tableHeaderBg: string;
  tableHeaderText: string;
  hoverBg: string;
  inputBg: string;
}

const LIGHT: AdminTheme = {
  key: 'light',
  pageBg: '#F8F9FA',
  cardBg: '#FFFFFF',
  cardBorder: '#E8E8E8',
  cardShadow: '0 1px 3px rgba(0,0,0,0.06)',
  heading: '#6B7280',
  value: '#111827',
  subtle: '#9CA3AF',
  icon: '#9CA3AF',
  divider: '#F3F4F6',
  tableHeaderBg: '#F9FAFB',
  tableHeaderText: '#6B7280',
  hoverBg: '#F9FAFB',
  inputBg: '#FFFFFF',
};

const DARK: AdminTheme = {
  key: 'dark',
  pageBg: '#0F1117',
  cardBg: '#1A1D26',
  cardBorder: '#2A2D36',
  cardShadow: 'none',
  heading: '#6B7280',
  value: '#F9FAFB',
  subtle: '#6B7280',
  icon: '#4B5563',
  divider: '#2A2D36',
  tableHeaderBg: '#1F2229',
  tableHeaderText: '#9CA3AF',
  hoverBg: '#1F2229',
  inputBg: '#1F2229',
};

export function getAdminTheme(key: string | null | undefined): AdminTheme {
  return key === 'dark' ? DARK : LIGHT;
}
