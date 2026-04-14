export type AdminThemeKey = 'light' | 'dark';

export interface AdminTheme {
  key: AdminThemeKey;
  pageBg: string;
  cardBg: string;
  cardBgHover: string;
  cardBorder: string;
  cardShadow: string;
  heading: string;
  value: string;
  subtle: string;
  icon: string;
  divider: string;
  tableHeaderBg: string;
  tableHeaderText: string;
  tableRowHover: string;
  tableStripedBg: string;
  hoverBg: string;
  inputBg: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;
  inputFocusBorder: string;
  border: string;
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
  info: string;
  successBg: string;
  dangerBg: string;
  warningBg: string;
  infoBg: string;
}

const LIGHT: AdminTheme = {
  key: 'light',
  pageBg: '#F8F9FA',
  cardBg: '#FFFFFF',
  cardBgHover: '#F9FAFB',
  cardBorder: '#E8E8E8',
  cardShadow: '0 1px 3px rgba(0,0,0,0.06)',
  heading: '#6B7280',
  value: '#111827',
  subtle: '#9CA3AF',
  icon: '#9CA3AF',
  divider: '#F3F4F6',
  tableHeaderBg: '#F9FAFB',
  tableHeaderText: '#6B7280',
  tableRowHover: '#F9FAFB',
  tableStripedBg: '#FAFAFA',
  hoverBg: '#F9FAFB',
  inputBg: '#FFFFFF',
  inputBorder: '#E5E7EB',
  inputText: '#111827',
  inputPlaceholder: '#9CA3AF',
  inputFocusBorder: '#FF4F7A',
  border: '#E5E7EB',
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
  info: '#3B82F6',
  successBg: '#ECFDF5',
  dangerBg: '#FEF2F2',
  warningBg: '#FFFBEB',
  infoBg: '#EFF6FF',
};

const DARK: AdminTheme = {
  key: 'dark',
  pageBg: '#0D0D0D',
  cardBg: '#1A1A1A',
  cardBgHover: '#222222',
  cardBorder: '#2A2A2A',
  cardShadow: 'none',
  heading: '#9CA3AF',
  value: '#E5E5E5',
  subtle: '#999999',
  icon: '#666666',
  divider: '#222222',
  tableHeaderBg: '#151515',
  tableHeaderText: '#9CA3AF',
  tableRowHover: '#1F1F1F',
  tableStripedBg: '#141414',
  hoverBg: '#222222',
  inputBg: '#1A1A1A',
  inputBorder: '#333333',
  inputText: '#E5E5E5',
  inputPlaceholder: '#666666',
  inputFocusBorder: '#FF4F7A',
  border: '#2A2A2A',
  chartBar: '#FF6B8A',
  chartBarAlt: '#6B8AFF',
  chartBarHover: '#FF8FA8',
  chartGrid: '#333333',
  chartLabel: '#999999',
  heatmapLow: '#2A1520',
  heatmapMid: '#5C2040',
  heatmapHigh: '#FF4F7A',
  accent: '#FF4F7A',
  accentHover: '#FF6B8A',
  success: '#22C55E',
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  successBg: '#0D2818',
  dangerBg: '#2D1215',
  warningBg: '#2D2106',
  infoBg: '#0D1B2D',
};

export function getAdminTheme(key: string | null | undefined): AdminTheme {
  return key === 'dark' ? DARK : LIGHT;
}
