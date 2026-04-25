import React from 'react';
import type { AdminTheme } from '../../lib/adminTheme';

export type Restaurant = {
  id: string; name: string; slug: string; enabled_languages: string[];
  current_plan: 'basic' | 'premium' | 'enterprise';
  plan_overrides: Record<string, boolean>;
  logo_url: string | null; cover_url: string | null; cover_image_url: string | null;
  splash_video_url: string | null;
  address: string | null; phone: string | null; tagline: string | null;
  description_tr: string | null; theme_color: string | null;
  social_instagram: string | null; social_facebook: string | null;
  social_x: string | null; social_tiktok: string | null; social_website: string | null;
  social_whatsapp: string | null; social_google_maps: string | null;
  working_hours: Record<string, { open: string; close: string; closed: boolean }> | null;
  /** @deprecated Use hasFeature(restaurant, 'key') from @/lib/planFeatures. Field kept until cleanup migration drops DB columns. */
  feature_waiter_calls?: boolean;
  feature_cart?: boolean;
  feature_whatsapp_order?: boolean;
  feature_feedback?: boolean;
  feature_discount_codes?: boolean;
  feature_likes?: boolean;
  feature_reviews: boolean;
  feature_multi_currency?: boolean;
  base_currency: string;
  google_place_id: string | null;
  google_rating: number | null;
  google_review_count: number | null;
  google_rating_updated_at: string | null;
  latitude: number | null;
  longitude: number | null;
  menu_view_mode: string | null;
  admin_theme: string | null;
  price_effective_date?: string | null;
  show_vat_notice?: boolean;
};

export const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export const DAY_LABELS: Record<string, string> = {
  mon: 'Pazartesi', tue: 'Salı', wed: 'Çarşamba', thu: 'Perşembe',
  fri: 'Cuma', sat: 'Cumartesi', sun: 'Pazar',
};
export const DEFAULT_DAY = { open: '09:00', close: '22:00', closed: false };
export const defaultWorkingHours = (): Record<string, { open: string; close: string; closed: boolean }> => {
  const out: Record<string, { open: string; close: string; closed: boolean }> = {};
  for (const k of DAY_KEYS) out[k] = { ...DEFAULT_DAY };
  return out;
};

export function makeStyles(t: AdminTheme): Record<string, React.CSSProperties> {
  return {
    wrap: { maxWidth: 900, margin: '0 auto', padding: '32px 24px' },
    card: { background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 12, padding: 20, marginBottom: 12, boxShadow: t.cardShadow },
    input: { width: '100%', padding: '10px 14px', fontSize: 14, border: `1px solid ${t.inputBorder}`, borderRadius: 8, outline: 'none', background: t.inputBg, color: t.inputText, boxSizing: 'border-box' as const, transition: 'border-color 0.15s ease, box-shadow 0.15s ease' },
    btn: { padding: '10px 24px', fontSize: 13, fontWeight: 500, color: '#FFFFFF', background: t.accent, border: 'none', borderRadius: 8, cursor: 'pointer', transition: 'background 0.15s ease' },
    btnSm: { padding: '6px 14px', fontSize: 12, fontWeight: 500, border: `1px solid ${t.border}`, borderRadius: 6, cursor: 'pointer', background: t.cardBg, color: t.value, transition: 'all 0.15s ease' },
    btnDanger: { padding: '6px 14px', fontSize: 12, fontWeight: 500, border: `1px solid ${t.border}`, borderRadius: 6, cursor: 'pointer', background: t.cardBg, color: t.danger, transition: 'all 0.15s ease' },
    label: { display: 'block', fontSize: 13, fontWeight: 500, color: t.value, marginBottom: 6 },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
    grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 },
    badge: { fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, display: 'inline-block', marginRight: 4 },
    catAccordionRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 16px',
      background: t.cardBg,
      borderRadius: 12,
      border: `1px solid ${t.border}`,
      marginBottom: 8,
      transition: 'all 0.15s',
    },
    subCatWrap: {
      marginLeft: 24,
      borderLeft: `2px solid ${t.border}`,
      paddingLeft: 12,
    },
    itemRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '8px 12px',
      borderBottom: `1px solid ${t.divider}`,
      background: t.cardBg,
      cursor: 'pointer',
      transition: 'background 0.1s',
    },
    itemsContainer: {
      background: t.pageBg,
      border: `1px solid ${t.border}`,
      borderRadius: 8,
      margin: '4px 0 12px 36px',
      padding: '4px 0',
      overflow: 'hidden',
    },
    inlinePriceBox: {
      width: 110,
      padding: '6px 10px',
      border: `1px solid ${t.inputBorder}`,
      borderRadius: 8,
      fontSize: 13,
      fontWeight: 600,
      textAlign: 'right' as const,
      fontFamily: 'Roboto, sans-serif',
      background: t.inputBg,
      outline: 'none',
    },
    soldOutBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 3,
      padding: '2px 8px',
      background: t.dangerBg,
      color: t.danger,
      borderRadius: 12,
      fontSize: 10,
      fontWeight: 600,
    },
    translationBadge: {
      display: 'inline-flex',
      padding: '1px 6px',
      background: t.infoBg,
      color: t.info,
      borderRadius: 4,
      fontSize: 9,
      fontWeight: 600,
    },
    missingPhotoWarning: {
      fontSize: 11,
      color: t.danger,
      fontWeight: 500,
    },
    accordionActions: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginLeft: 'auto',
    },
  };
}

// Toggle switch style helpers
export const toggleSwitchStyle = (on: boolean): React.CSSProperties => ({
  position: 'relative',
  display: 'inline-block',
  width: 36,
  height: 20,
  borderRadius: 999,
  background: on ? '#22C55E' : '#E5E5E3',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  transition: 'background 0.15s',
  flexShrink: 0,
});
export const toggleKnobStyle = (on: boolean): React.CSSProperties => ({
  position: 'absolute',
  top: 2,
  left: on ? 18 : 2,
  width: 16,
  height: 16,
  background: '#fff',
  borderRadius: '50%',
  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  transition: 'left 0.15s',
});
