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
  chartBar: string;
  chartBarAlt: string;
  chartBarHover: string;
  chartGrid: string;
  chartLabel: string;
  heatmapLow: string;
  heatmapMid: string;
  heatmapHigh: string;
  accent: string;
  accentHover: string;
  success: string;
  danger: string;
  warning: string;
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
  chartBar: '#FF4F7A',
  chartBarAlt: '#4F7AFF',
  chartBarHover: '#E63E66',
  chartGrid: '#E5E5E5',
  chartLabel: '#6B7280',
  heatmapLow: '#FFF0F3',
  heatmapMid: '#FFB3C6',
  heatmapHigh: '#FF4F7A',
  accent: '#FF4F7A',
  accentHover: '#E63E66',
  success: '#22C55E',
  danger: '#EF4444',
  warning: '#F59E0B',
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
  chartBar: '#FF6B8A',
  chartBarAlt: '#6B8AFF',
  chartBarHover: '#FF8FA8',
  chartGrid: '#2A2D36',
  chartLabel: '#9CA3AF',
  heatmapLow: '#2A1520',
  heatmapMid: '#5C2040',
  heatmapHigh: '#FF4F7A',
  accent: '#FF4F7A',
  accentHover: '#FF6B8A',
  success: '#22C55E',
  danger: '#EF4444',
  warning: '#F59E0B',
};

export function getAdminTheme(key: string | null | undefined): AdminTheme {
  return key === 'dark' ? DARK : LIGHT;
}
