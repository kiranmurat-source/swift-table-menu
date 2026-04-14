// TODO: This file is 3000+ lines. Next sprint, split each tab into a lazy-loaded
// child component to improve maintainability and reduce the Dashboard bundle:
//   - Menü      → components/menu/MenuManager.tsx
//   - Çeviri    → components/translation/TranslationCenter.tsx (already a component, inline this)
//   - QR        → components/qr/QRCodesPanel.tsx (already exists as QRManager)
//   - Profil    → components/profile/ProfileTab.tsx (currently inline)
//   - Promosyon → components/promos/PromosTab.tsx (currently inline)
// Dashboard/Analytics already lives in components/dashboard/RestaurantAnalytics.tsx.
import { useEffect, useMemo, useState, useRef, Fragment, lazy, Suspense, ReactNode, CSSProperties } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';
import { Camera, PencilSimple, CheckCircle, XCircle, AppleLogo, Star, Globe, Pen, Rows, User, Image, Trash, Link, Package, CaretCircleDown, CaretCircleUp, CaretDown, CaretRight, PlusCircle, Clock, Grains, Timer, Info, Bell, List, SquaresFour, Tag, Palette, ChatCircle, Percent, Heart, ChartBar, ArrowsClockwise, Warning, X, VideoCamera, Users } from "@phosphor-icons/react";
import RestaurantAnalytics from "@/components/dashboard/RestaurantAnalytics";
import TabbledLogo from '@/components/TabbledLogo';
import FeedbackPanel from '../components/FeedbackPanel';
import DiscountCodesPanel from '../components/DiscountCodesPanel';
import LikesPanel from '../components/LikesPanel';
import CustomersPanel from '../components/CustomersPanel';
import AnalyticsPanel from '../components/AnalyticsPanel';
import { getAdminTheme, type AdminTheme } from '../lib/adminTheme';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type SortableRenderProps = {
  setNodeRef: (node: HTMLElement | null) => void;
  style: CSSProperties;
  attributes: Record<string, unknown>;
  listeners: Record<string, unknown> | undefined;
  isDragging: boolean;
};

function Sortable({ id, children }: { id: string; children: (p: SortableRenderProps) => ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto',
  };
  return <>{children({ setNodeRef, style, attributes: attributes as Record<string, unknown>, listeners, isDragging })}</>;
}
import QRManager from '../components/QRManager';
import TranslationCenter from '../components/TranslationCenter';
import WaiterCallsPanel from '../components/WaiterCallsPanel';
const RichTextEditor = lazy(() => import('../components/RichTextEditor'));
import { CategoryTabSkeleton, ListSkeleton } from '../components/Skeleton';
import { getOptimizedImageUrl, handleImageError } from '../lib/imageUtils';
import { ALLERGEN_LIST, DIET_LIST, getAllergenInfo } from '../lib/allergens';
import { AllergenIcon } from '../components/AllergenIcon';
import { THEMES } from '../lib/themes';
import type { Promo } from '../components/PromoPopup';

type Translations = {
  [lang: string]: {
    name?: string;
    description?: string;
  };
};

type Category = { id: string; name_tr: string; name_en: string | null; sort_order: number; is_active: boolean; translations: Translations; image_url: string | null; parent_id: string | null; };

type PeriodicDay = { enabled: boolean; start: string; end: string; all_day?: boolean };
type PeriodicSchedule = Partial<Record<'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday', PeriodicDay>>;

type PriceVariant = {
  name_tr: string;
  name_en: string;
  price: number;
  calories: number | null;
};

type Nutrition = {
  serving_size?: string;
  calories?: number;
  calories_from_fat?: number;
  total_fat?: number;
  saturated_fat?: number;
  trans_fat?: number;
  cholesterol?: number;
  sodium?: number;
  total_carb?: number;
  dietary_fiber?: number;
  sugars?: number;
  protein?: number;
  vitamin_a?: number;
  vitamin_c?: number;
  calcium?: number;
  iron?: number;
  show_on_menu?: boolean;
};

type MenuItem = {
  id: string; category_id: string; name_tr: string; name_en: string | null;
  description_tr: string | null; description_en: string | null; price: number;
  image_url: string | null; video_url: string | null; is_available: boolean; is_popular: boolean; sort_order: number;
  calories: number | null; allergens: string[] | null; is_vegetarian: boolean; is_new: boolean;
  is_featured: boolean;
  is_sold_out: boolean;
  schedule_type: 'always' | 'date_range' | 'periodic';
  schedule_start: string | null;
  schedule_end: string | null;
  schedule_periodic: PeriodicSchedule;
  price_variants: PriceVariant[];
  nutrition: Nutrition | null;
  prep_time: number | null;
  translations: Translations;
};
type Restaurant = {
  id: string; name: string; slug: string; enabled_languages: string[]; current_plan: string | null;
  logo_url: string | null; cover_url: string | null; cover_image_url: string | null;
  splash_video_url: string | null;
  address: string | null; phone: string | null; tagline: string | null;
  description_tr: string | null; theme_color: string | null;
  social_instagram: string | null; social_facebook: string | null;
  social_x: string | null; social_tiktok: string | null; social_website: string | null;
  social_whatsapp: string | null; social_google_maps: string | null;
  working_hours: Record<string, { open: string; close: string; closed: boolean }> | null;
  feature_waiter_calls: boolean;
  feature_cart: boolean;
  feature_whatsapp_order: boolean;
  feature_feedback: boolean;
  feature_discount_codes: boolean;
  feature_likes: boolean;
  feature_reviews: boolean;
  google_place_id: string | null;
  google_rating: number | null;
  google_review_count: number | null;
  google_rating_updated_at: string | null;
  menu_view_mode: string | null;
  admin_theme: string | null;
};

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const DAY_LABELS: Record<string, string> = {
  mon: 'Pazartesi', tue: 'Salı', wed: 'Çarşamba', thu: 'Perşembe',
  fri: 'Cuma', sat: 'Cumartesi', sun: 'Pazar',
};
const DEFAULT_DAY = { open: '09:00', close: '22:00', closed: false };
const defaultWorkingHours = (): Record<string, { open: string; close: string; closed: boolean }> => {
  const out: Record<string, { open: string; close: string; closed: boolean }> = {};
  for (const k of DAY_KEYS) out[k] = { ...DEFAULT_DAY };
  return out;
};

const ALLERGEN_OPTIONS = ALLERGEN_LIST.map(a => ({ value: a.key, label: a.name_tr }));
const DIET_OPTIONS = DIET_LIST.map(a => ({ value: a.key, label: a.name_tr }));

const SUPABASE_URL = 'https://qmnrawqvkwehufebbkxp.supabase.co';

function makeStyles(t: AdminTheme): Record<string, React.CSSProperties> {
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
      fontFamily: 'Inter, sans-serif',
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
const toggleSwitchStyle = (on: boolean): React.CSSProperties => ({
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
const toggleKnobStyle = (on: boolean): React.CSSProperties => ({
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

const PERIODIC_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
type PeriodicDayKey = typeof PERIODIC_DAYS[number];
const PERIODIC_DAY_LABELS: Record<PeriodicDayKey, string> = {
  monday: 'Pazartesi', tuesday: 'Salı', wednesday: 'Çarşamba', thursday: 'Perşembe',
  friday: 'Cuma', saturday: 'Cumartesi', sunday: 'Pazar',
};
const defaultPeriodicSchedule = (): Record<PeriodicDayKey, { enabled: boolean; start: string; end: string; all_day: boolean }> => ({
  monday:    { enabled: false, start: '09:00', end: '17:00', all_day: false },
  tuesday:   { enabled: false, start: '09:00', end: '17:00', all_day: false },
  wednesday: { enabled: false, start: '09:00', end: '17:00', all_day: false },
  thursday:  { enabled: false, start: '09:00', end: '17:00', all_day: false },
  friday:    { enabled: false, start: '09:00', end: '17:00', all_day: false },
  saturday:  { enabled: false, start: '09:00', end: '17:00', all_day: false },
  sunday:    { enabled: false, start: '09:00', end: '17:00', all_day: false },
});

function InlinePrice({ value, isSoldOut, onSave }: { value: number; isSoldOut: boolean; onSave: (n: number) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value.toString());
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (!editing) setDraft(value.toString()); }, [value, editing]);
  const commit = async () => {
    const n = parseFloat(draft);
    if (!Number.isFinite(n) || n < 0) { setDraft(value.toString()); setEditing(false); return; }
    if (n === value) { setEditing(false); return; }
    setSaving(true);
    await onSave(n);
    setSaving(false);
    setEditing(false);
  };
  if (editing) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <input
          type="number"
          step="0.01"
          min="0"
          autoFocus
          value={draft}
          disabled={saving}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); commit(); }
            if (e.key === 'Escape') { setDraft(value.toString()); setEditing(false); }
          }}
          style={{ width: 80, padding: '4px 8px', fontSize: 14, fontWeight: 700, border: '1px solid #1C1C1E', borderRadius: 6, outline: 'none' }}
        />
        <span style={{ fontSize: 14, color: '#1C1C1E', fontWeight: 700 }}>₺</span>
        {saving && <span style={{ fontSize: 10, color: '#6B6B6F' }}>...</span>}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); setEditing(true); }}
      style={{
        fontSize: 14,
        fontWeight: 700,
        color: '#1C1C1E',
        background: 'none',
        border: '1px dashed transparent',
        borderRadius: 4,
        padding: '2px 6px',
        cursor: 'pointer',
        textDecoration: isSoldOut ? 'line-through' : 'none',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#E5E5E3')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'transparent')}
      title="Düzenlemek için tıkla"
    >
      ₺{Number(value).toFixed(2)}
    </button>
  );
}

type VariantDraft = { name_tr: string; name_en: string; price: string; calories: string };

type NutritionDraft = {
  show_on_menu: boolean;
  serving_size: string;
  calories: string;
  calories_from_fat: string;
  total_fat: string;
  saturated_fat: string;
  trans_fat: string;
  cholesterol: string;
  sodium: string;
  total_carb: string;
  dietary_fiber: string;
  sugars: string;
  protein: string;
  vitamin_a: string;
  vitamin_c: string;
  calcium: string;
  iron: string;
};

const emptyNutritionDraft = (): NutritionDraft => ({
  show_on_menu: true,
  serving_size: '',
  calories: '',
  calories_from_fat: '',
  total_fat: '',
  saturated_fat: '',
  trans_fat: '',
  cholesterol: '',
  sodium: '',
  total_carb: '',
  dietary_fiber: '',
  sugars: '',
  protein: '',
  vitamin_a: '',
  vitamin_c: '',
  calcium: '',
  iron: '',
});

// Numeric field keys on the nutrition draft (everything except show_on_menu and serving_size)
const NUTRITION_NUMERIC_KEYS: Array<keyof NutritionDraft> = [
  'calories', 'calories_from_fat', 'total_fat', 'saturated_fat', 'trans_fat',
  'cholesterol', 'sodium', 'total_carb', 'dietary_fiber', 'sugars', 'protein',
  'vitamin_a', 'vitamin_c', 'calcium', 'iron',
];

const emptyItemForm = {
  name_tr: '', description_tr: '', price: '', image_url: '', video_url: '',
  recommended_ids: [] as string[],
  recommendation_reasons: {} as Record<string, { tr: string; en: string }>,
  allergens: [] as string[], is_vegetarian: false, is_new: false, is_featured: false,
  is_sold_out: false,
  schedule_type: 'always' as 'always' | 'date_range' | 'periodic',
  schedule_start: '',
  schedule_end: '',
  schedule_periodic: defaultPeriodicSchedule(),
  category_id: '' as string,
  variants: [] as VariantDraft[],
  nutrition: emptyNutritionDraft(),
  nutritionOpen: false,
  prep_time: '',
  happy_hour_active: false,
  happy_hour_price: '' as string | number,
  happy_hour_label: '',
  happy_hour_days: null as string[] | null,
  happy_hour_start_time: '',
  happy_hour_end_time: '',
  happyHourOpen: false,
};

async function triggerTranslation(table: string, recordId: string, languages: string[]) {
  if (languages.length === 0) return;
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/translate-menu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, record_id: recordId, languages }),
    });
  } catch (err) {
    console.error('Translation error:', err);
  }
}

/* ------------------------------------------------------------------ */
/*  Profile Tab Component                                              */
/* ------------------------------------------------------------------ */

function ProfileTab({ restaurant, onUpdate, theme }: { restaurant: Restaurant; onUpdate: (r: Restaurant) => void; theme: AdminTheme }) {
  const S = useMemo(() => makeStyles(theme), [theme]);
  const [currentTheme, setCurrentTheme] = useState<string>(restaurant.theme_color || 'white');
  const [currentViewMode, setCurrentViewMode] = useState<string>(restaurant.menu_view_mode || 'categories');
  const [currentAdminTheme, setCurrentAdminTheme] = useState<string>(restaurant.admin_theme || 'light');
  const [form, setForm] = useState({
    name: restaurant.name,
    address: restaurant.address || '',
    phone: restaurant.phone || '',
    tagline: restaurant.tagline || '',
    description_tr: restaurant.description_tr || '',
    social_instagram: restaurant.social_instagram || '',
    social_facebook: restaurant.social_facebook || '',
    social_x: restaurant.social_x || '',
    social_tiktok: restaurant.social_tiktok || '',
    social_website: restaurant.social_website || '',
    social_whatsapp: restaurant.social_whatsapp || '',
    social_google_maps: restaurant.social_google_maps || '',
    splash_video_url: restaurant.splash_video_url || '',
    feature_waiter_calls: restaurant.feature_waiter_calls ?? true,
    feature_cart: restaurant.feature_cart ?? true,
    feature_whatsapp_order: restaurant.feature_whatsapp_order ?? true,
    feature_feedback: restaurant.feature_feedback ?? true,
    feature_discount_codes: restaurant.feature_discount_codes ?? true,
    feature_likes: restaurant.feature_likes ?? true,
    feature_reviews: restaurant.feature_reviews ?? true,
    google_place_id: restaurant.google_place_id || '',
  });
  const [workingHours, setWorkingHours] = useState<Record<string, { open: string; close: string; closed: boolean }>>(() => {
    const wh = restaurant.working_hours || {};
    const out: Record<string, { open: string; close: string; closed: boolean }> = {};
    for (const k of DAY_KEYS) out[k] = wh[k] ? { ...wh[k] } : { ...DEFAULT_DAY };
    return out;
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [googleRating, setGoogleRating] = useState<number | null>(restaurant.google_rating ?? null);
  const [googleReviewCount, setGoogleReviewCount] = useState<number | null>(restaurant.google_review_count ?? null);
  const [googleRatingUpdatedAt, setGoogleRatingUpdatedAt] = useState<string | null>(restaurant.google_rating_updated_at ?? null);
  const logoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('restaurants').update({
      name: form.name,
      address: form.address || null,
      phone: form.phone || null,
      tagline: form.tagline || null,
      description_tr: form.description_tr || null,
      social_instagram: form.social_instagram || null,
      social_facebook: form.social_facebook || null,
      social_x: form.social_x || null,
      social_tiktok: form.social_tiktok || null,
      social_website: form.social_website || null,
      social_whatsapp: form.social_whatsapp || null,
      social_google_maps: form.social_google_maps || null,
      splash_video_url: form.splash_video_url.trim() || null,
      working_hours: workingHours,
      feature_waiter_calls: form.feature_waiter_calls,
      feature_cart: form.feature_cart,
      feature_whatsapp_order: form.feature_whatsapp_order,
      feature_feedback: form.feature_feedback,
      feature_discount_codes: form.feature_discount_codes,
      feature_likes: form.feature_likes,
      feature_reviews: form.feature_reviews,
      google_place_id: form.google_place_id || null,
    }).eq('id', restaurant.id);

    if (error) {
      setMsg('Hata: ' + error.message);
    } else {
      setMsg('Bilgiler kaydedildi');
      onUpdate({
        ...restaurant,
        name: form.name,
        address: form.address || null,
        phone: form.phone || null,
        tagline: form.tagline || null,
        description_tr: form.description_tr || null,
        social_instagram: form.social_instagram || null,
        social_facebook: form.social_facebook || null,
        social_x: form.social_x || null,
        social_tiktok: form.social_tiktok || null,
        social_website: form.social_website || null,
        social_whatsapp: form.social_whatsapp || null,
        social_google_maps: form.social_google_maps || null,
        splash_video_url: form.splash_video_url.trim() || null,
        working_hours: workingHours,
        feature_waiter_calls: form.feature_waiter_calls,
        feature_cart: form.feature_cart,
        feature_whatsapp_order: form.feature_whatsapp_order,
        feature_feedback: form.feature_feedback,
        feature_discount_codes: form.feature_discount_codes,
        feature_likes: form.feature_likes,
        feature_reviews: form.feature_reviews,
        google_place_id: form.google_place_id || null,
      });
    }
    setSaving(false);
    setTimeout(() => setMsg(''), 3000);
  }

  async function uploadImage(file: File, type: 'logo' | 'cover') {
    const setUploading = type === 'logo' ? setUploadingLogo : setUploadingCover;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `${restaurant.slug}/${type}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('menu-images').upload(fileName, file, { upsert: true });
    if (error) { setMsg('Yukleme hatasi: ' + error.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('menu-images').getPublicUrl(fileName);
    const field = type === 'logo' ? 'logo_url' : 'cover_url';
    await supabase.from('restaurants').update({ [field]: urlData.publicUrl }).eq('id', restaurant.id);
    onUpdate({ ...restaurant, [field]: urlData.publicUrl });
    setMsg(type === 'logo' ? 'Logo guncellendi' : 'Kapak gorseli guncellendi');
    setUploading(false);
    setTimeout(() => setMsg(''), 3000);
  }

  async function removeImage(type: 'logo' | 'cover') {
    const field = type === 'logo' ? 'logo_url' : 'cover_url';
    await supabase.from('restaurants').update({ [field]: null }).eq('id', restaurant.id);
    onUpdate({ ...restaurant, [field]: null });
    setMsg(type === 'logo' ? 'Logo kaldirildi' : 'Kapak gorseli kaldirildi');
    setTimeout(() => setMsg(''), 3000);
  }

  async function handleThemeChange(themeKey: string) {
    const prev = currentTheme;
    setCurrentTheme(themeKey);
    const { error } = await supabase
      .from('restaurants')
      .update({ theme_color: themeKey })
      .eq('id', restaurant.id);
    if (error) {
      setCurrentTheme(prev);
      setMsg('Hata: ' + error.message);
    } else {
      onUpdate({ ...restaurant, theme_color: themeKey });
      setMsg('Tema güncellendi');
    }
    setTimeout(() => setMsg(''), 3000);
  }

  async function handleViewModeChange(mode: string) {
    const prev = currentViewMode;
    setCurrentViewMode(mode);
    const { error } = await supabase
      .from('restaurants')
      .update({ menu_view_mode: mode })
      .eq('id', restaurant.id);
    if (error) {
      setCurrentViewMode(prev);
      setMsg('Hata: ' + error.message);
    } else {
      onUpdate({ ...restaurant, menu_view_mode: mode });
      setMsg('Menü görünümü güncellendi');
    }
    setTimeout(() => setMsg(''), 3000);
  }

  async function handleAdminThemeChange(mode: string) {
    const prev = currentAdminTheme;
    setCurrentAdminTheme(mode);
    const { error } = await supabase
      .from('restaurants')
      .update({ admin_theme: mode })
      .eq('id', restaurant.id);
    if (error) {
      setCurrentAdminTheme(prev);
      setMsg('Hata: ' + error.message);
    } else {
      onUpdate({ ...restaurant, admin_theme: mode });
      setMsg('Yönetim paneli teması güncellendi');
    }
    setTimeout(() => setMsg(''), 3000);
  }

  const coverImage = restaurant.cover_image_url || restaurant.cover_url;

  return (
    <div>
      {msg && (
        <div style={{ padding: '10px 14px', background: msg.includes('Hata') ? '#FEE2E2' : '#DCFCE7', border: `1px solid ${msg.includes('Hata') ? '#FECACA' : '#DCFCE7'}`, borderRadius: 8, color: msg.includes('Hata') ? '#EF4444' : '#22C55E', fontSize: 13, marginBottom: 16, cursor: 'pointer' }} onClick={() => setMsg('')}>
          {msg} <span style={{ float: 'right' }}>✕</span>
        </div>
      )}

      {/* Images Section */}
      <div style={S.card}>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: theme.value, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Image size={16} /> Gorseller
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <label style={{ ...S.label, marginBottom: 10 }}>Logo</label>
            <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) uploadImage(e.target.files[0], 'logo'); }} />
            {restaurant.logo_url ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <img onError={handleImageError} src={getOptimizedImageUrl(restaurant.logo_url, 'card')} alt="Logo" style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover', border: `1px solid ${theme.border}` }} />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" onClick={() => logoRef.current?.click()} disabled={uploadingLogo} style={{ ...S.btnSm, fontSize: 11, padding: '4px 10px' }}>{uploadingLogo ? '...' : 'Degistir'}</button>
                  <button type="button" onClick={() => removeImage('logo')} style={{ ...S.btnDanger, fontSize: 11, padding: '4px 10px' }}><Trash size={12} /></button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => logoRef.current?.click()} disabled={uploadingLogo} style={{ ...S.btnSm, width: '100%', padding: '20px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: theme.subtle }}>
                <Camera size={24} />
                <span style={{ fontSize: 12 }}>{uploadingLogo ? 'Yukleniyor...' : 'Logo Yukle'}</span>
              </button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: theme.subtle, marginTop: 4 }}><Info size={14} /><span>500×500px, kare, şeffaf arka plan, max 2MB</span></div>
          </div>
          <div>
            <label style={{ ...S.label, marginBottom: 10 }}>Kapak Gorseli</label>
            <input ref={coverRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) uploadImage(e.target.files[0], 'cover'); }} />
            {coverImage ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <img onError={handleImageError} src={getOptimizedImageUrl(coverImage, 'detail')} alt="Cover" style={{ width: '100%', height: 80, borderRadius: 8, objectFit: 'cover', border: `1px solid ${theme.border}` }} />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" onClick={() => coverRef.current?.click()} disabled={uploadingCover} style={{ ...S.btnSm, fontSize: 11, padding: '4px 10px' }}>{uploadingCover ? '...' : 'Degistir'}</button>
                  <button type="button" onClick={() => removeImage('cover')} style={{ ...S.btnDanger, fontSize: 11, padding: '4px 10px' }}><Trash size={12} /></button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => coverRef.current?.click()} disabled={uploadingCover} style={{ ...S.btnSm, width: '100%', padding: '20px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: theme.subtle }}>
                <Camera size={24} />
                <span style={{ fontSize: 12 }}>{uploadingCover ? 'Yukleniyor...' : 'Kapak Yukle'}</span>
              </button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: theme.subtle, marginTop: 4 }}><Info size={14} /><span>1200×400px, yatay geniş, max 5MB</span></div>
          </div>
        </div>

        <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${theme.border}` }}>
          <label style={{ ...S.label, marginBottom: 6 }}>Splash Video URL</label>
          <div style={{ fontSize: 11, color: theme.subtle, marginBottom: 8 }}>MP4 veya WebM formatında video linki. Video varsa splash ekranında arka plan olarak gösterilir.</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
            <input
              style={{ ...S.input, flex: 1 }}
              type="url"
              value={form.splash_video_url}
              onChange={e => setForm({ ...form, splash_video_url: e.target.value })}
              placeholder="https://example.com/video.mp4"
            />
            {form.splash_video_url && (
              <button
                type="button"
                onClick={() => setForm({ ...form, splash_video_url: '' })}
                style={{ ...S.btnSm, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Trash size={14} /> Kaldır
              </button>
            )}
          </div>
          {form.splash_video_url.trim() && (
            <video
              key={form.splash_video_url}
              src={form.splash_video_url}
              muted
              autoPlay
              loop
              playsInline
              style={{ marginTop: 10, width: 200, maxWidth: '100%', borderRadius: 8, border: `1px solid ${theme.border}`, backgroundColor: theme.pageBg }}
            />
          )}
        </div>
      </div>

      {/* Info Form */}
      <form onSubmit={handleSave} style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: theme.value, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
          <User size={16} /> Isletme Bilgileri
        </h4>
        <div>
          <label style={S.label}>Restoran Adi *</label>
          <input style={S.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div>
          <label style={S.label}>Slogan / Tagline</label>
          <input style={S.input} value={form.tagline} onChange={e => setForm({ ...form, tagline: e.target.value })} placeholder="Ornegin: 1985'ten beri lezzet duragi" />
        </div>
        <div>
          <label style={S.label}>Aciklama</label>
          <textarea style={{ ...S.input, minHeight: 80, resize: 'vertical' }} value={form.description_tr} onChange={e => setForm({ ...form, description_tr: e.target.value })} placeholder="Isletmenizi kisa bir cumleyle tanitin" />
        </div>
        <div style={S.grid2}>
          <div>
            <label style={S.label}>Adres</label>
            <input style={S.input} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Sokak, mahalle, ilce / sehir" />
          </div>
          <div>
            <label style={S.label}>Telefon</label>
            <input style={S.input} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="0212 123 4567" />
          </div>
        </div>

        {/* Social Media */}
        <h4 style={{ fontSize: 14, fontWeight: 600, color: theme.value, marginTop: 8, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Link size={16} /> Sosyal Medya
        </h4>
        <div style={S.grid2}>
          <div>
            <label style={S.label}>Instagram</label>
            <input style={S.input} value={form.social_instagram} onChange={e => setForm({ ...form, social_instagram: e.target.value })} placeholder="https://instagram.com/restoraniniz" />
          </div>
          <div>
            <label style={S.label}>Facebook</label>
            <input style={S.input} value={form.social_facebook} onChange={e => setForm({ ...form, social_facebook: e.target.value })} placeholder="https://facebook.com/restoraniniz" />
          </div>
        </div>
        <div style={S.grid2}>
          <div>
            <label style={S.label}>X (Twitter)</label>
            <input style={S.input} value={form.social_x} onChange={e => setForm({ ...form, social_x: e.target.value })} placeholder="https://x.com/restoraniniz" />
          </div>
          <div>
            <label style={S.label}>TikTok</label>
            <input style={S.input} value={form.social_tiktok} onChange={e => setForm({ ...form, social_tiktok: e.target.value })} placeholder="https://tiktok.com/@restoraniniz" />
          </div>
        </div>
        <div>
          <label style={S.label}>Web Sitesi</label>
          <input style={S.input} value={form.social_website} onChange={e => setForm({ ...form, social_website: e.target.value })} placeholder="https://restoraniniz.com" />
        </div>
        <div style={S.grid2}>
          <div>
            <label style={S.label}>WhatsApp</label>
            <input style={S.input} value={form.social_whatsapp} onChange={e => setForm({ ...form, social_whatsapp: e.target.value })} placeholder="https://wa.me/905xxxxxxxxx" />
          </div>
          <div>
            <label style={S.label}>Google Maps</label>
            <input style={S.input} value={form.social_google_maps} onChange={e => setForm({ ...form, social_google_maps: e.target.value })} placeholder="https://maps.google.com/..." />
          </div>
        </div>
        <div style={{ marginTop: 8 }}>
          <label style={S.label}>Google Place ID</label>
          <input style={S.input} value={form.google_place_id} onChange={e => setForm({ ...form, google_place_id: e.target.value })} placeholder="ChIJ... (Google Maps'ten kopyalayın)" />
          <div style={{ fontSize: 10, color: theme.subtle, marginTop: 2 }}>Yüksek puanlı müşterileri Google Reviews'a yönlendirmek için gerekli</div>
          {form.google_place_id && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
              {googleRating ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: theme.heading }}>
                  <Star size={16} weight="fill" style={{ color: theme.warning }} />
                  <span style={{ fontWeight: 600, color: theme.value }}>{googleRating.toFixed(1)}</span>
                  <span style={{ color: theme.subtle }}>({googleReviewCount || 0} yorum)</span>
                  {googleRatingUpdatedAt && (
                    <span style={{ color: theme.subtle, fontSize: 11, marginLeft: 2 }}>
                      · {new Date(googleRatingUpdatedAt).toLocaleDateString('tr-TR')}
                    </span>
                  )}
                </div>
              ) : (
                <span style={{ fontSize: 12, color: theme.subtle }}>Puan henüz çekilmedi</span>
              )}
              <button
                type="button"
                onClick={async () => {
                  setRatingLoading(true);
                  try {
                    const { data: { session } } = await supabase.auth.getSession();
                    const res = await fetch(
                      `${SUPABASE_URL}/functions/v1/fetch-google-rating`,
                      {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${session?.access_token}`,
                        },
                        body: JSON.stringify({
                          restaurant_id: restaurant.id,
                          google_place_id: form.google_place_id,
                        }),
                      }
                    );
                    const result = await res.json();
                    if (result.success) {
                      setGoogleRating(result.rating);
                      setGoogleReviewCount(result.review_count);
                      setGoogleRatingUpdatedAt(new Date().toISOString());
                      setMsg('Google puanı güncellendi');
                    } else {
                      setMsg(result.error || 'Puan çekilemedi');
                    }
                  } catch {
                    setMsg('Bağlantı hatası');
                  } finally {
                    setRatingLoading(false);
                  }
                }}
                disabled={ratingLoading}
                style={{ fontSize: 12, color: theme.accent, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, opacity: ratingLoading ? 0.5 : 1 }}
              >
                <ArrowsClockwise size={14} className={ratingLoading ? 'animate-spin' : ''} />
                {ratingLoading ? 'Çekiliyor...' : 'Puanı Güncelle'}
              </button>
            </div>
          )}
        </div>

        {/* Working Hours */}
        <h4 style={{ fontSize: 14, fontWeight: 600, color: theme.value, marginTop: 8, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Globe size={16} /> Çalışma Saatleri
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {DAY_KEYS.map(day => {
            const dh = workingHours[day] || { ...DEFAULT_DAY };
            return (
              <div key={day} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 1fr auto', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: theme.value, fontWeight: 500 }}>{DAY_LABELS[day]}</span>
                <input
                  type="time"
                  style={{ ...S.input, padding: '6px 10px', fontSize: 12, opacity: dh.closed ? 0.4 : 1 }}
                  value={dh.open}
                  disabled={dh.closed}
                  onChange={e => setWorkingHours({ ...workingHours, [day]: { ...dh, open: e.target.value } })}
                />
                <input
                  type="time"
                  style={{ ...S.input, padding: '6px 10px', fontSize: 12, opacity: dh.closed ? 0.4 : 1 }}
                  value={dh.close}
                  disabled={dh.closed}
                  onChange={e => setWorkingHours({ ...workingHours, [day]: { ...dh, close: e.target.value } })}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: theme.heading, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={dh.closed}
                    onChange={e => setWorkingHours({ ...workingHours, [day]: { ...dh, closed: e.target.checked } })}
                  />
                  Kapalı
                </label>
              </div>
            );
          })}
        </div>

        {/* Feature Toggles */}
        <h4 style={{ fontSize: 14, fontWeight: 600, color: theme.value, marginTop: 8, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <SquaresFour size={16} /> Menü Özellikleri
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {([
            { key: 'feature_waiter_calls' as const, label: 'Garson Çağırma', desc: 'QR menüde garson çağırma butonları' },
            { key: 'feature_cart' as const, label: 'Sepet', desc: 'Müşteriler sepete ürün ekleyebilir' },
            { key: 'feature_whatsapp_order' as const, label: 'WhatsApp Sipariş', desc: 'Sepetten WhatsApp ile sipariş gönderme' },
            { key: 'feature_feedback' as const, label: 'Geri Bildirim', desc: 'Müşterilerden yıldız puanı ve yorum toplayın' },
            { key: 'feature_reviews' as const, label: 'Müşteri Yorumları', desc: 'Menü sayfasında müşteri yorumları bölümü göster' },
            { key: 'feature_discount_codes' as const, label: 'İndirim Kodları', desc: 'Müşteriler sepette indirim kodu kullanabilir' },
            { key: 'feature_likes' as const, label: 'Ürün Beğeni', desc: 'Müşteriler ürünleri beğenebilir (kalp butonu)' },
          ]).map(feat => (
            <label key={feat.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, border: `1px solid ${theme.border}`, backgroundColor: form[feat.key] ? theme.successBg : theme.pageBg, cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: theme.value }}>{feat.label}</div>
                <div style={{ fontSize: 11, color: theme.heading }}>{feat.desc}</div>
              </div>
              <input
                type="checkbox"
                checked={form[feat.key]}
                onChange={e => setForm({ ...form, [feat.key]: e.target.checked })}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
            </label>
          ))}
        </div>

        {/* Theme Selector */}
        <h4 style={{ fontSize: 14, fontWeight: 600, color: theme.value, marginTop: 8, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Package size={16} /> Menü Teması
        </h4>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {Object.values(THEMES).map((t) => {
            const selected = currentTheme === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => handleThemeChange(t.key)}
                style={{
                  width: 96,
                  height: 72,
                  borderRadius: 10,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  border: selected ? '2px solid #1C1C1E' : '1px solid #E5E5E3',
                  boxShadow: selected ? '0 0 0 2px #fff, 0 0 0 4px #1C1C1E' : 'none',
                  background: t.bg,
                  color: t.text,
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                }}
              >
                <span>{t.label_tr.split(' ')[0]}</span>
                <span style={{ fontSize: 10, opacity: 0.7 }}>{t.label_tr.split(' ').slice(1).join(' ')}</span>
              </button>
            );
          })}
        </div>
        <p style={{ fontSize: 11, color: theme.heading, margin: 0 }}>
          Tema sadece müşterilerinizin göreceği genel menü sayfasını etkiler.
        </p>

        {/* Menu View Mode Selector */}
        <h4 style={{ fontSize: 14, fontWeight: 600, color: theme.value, marginTop: 16, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Package size={16} /> Menü Görünümü
        </h4>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {([
            { key: 'categories', label: 'Kategoriler', desc: 'Büyük kategori kartlarıyla açılış' },
            { key: 'grid', label: 'Grid', desc: '2 sütun ürün kartları' },
            { key: 'list', label: 'List', desc: 'Yatay ürün kartları' },
          ] as const).map((opt) => {
            const selected = currentViewMode === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => handleViewModeChange(opt.key)}
                style={{
                  flex: '1 1 140px',
                  padding: '10px 12px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  border: selected ? '2px solid #1C1C1E' : '1px solid #E5E5E3',
                  background: selected ? '#1C1C1E' : '#FFFFFF',
                  color: selected ? '#FFFFFF' : '#1C1C1E',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600 }}>{opt.label}</span>
                <span style={{ fontSize: 11, opacity: 0.7 }}>{opt.desc}</span>
              </button>
            );
          })}
        </div>
        <p style={{ fontSize: 11, color: theme.heading, margin: 0 }}>
          Müşterilerinizin menüyü nasıl göreceğini seçin.
        </p>

        {/* Admin Panel Theme Selector */}
        <h4 style={{ fontSize: 14, fontWeight: 600, color: theme.value, marginTop: 16, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Palette size={16} /> Yönetim Paneli Teması
        </h4>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {([
            { key: 'light', label: 'Açık', bg: '#FFFFFF', fg: '#111827' },
            { key: 'dark', label: 'Koyu', bg: '#1A1D26', fg: '#F9FAFB' },
          ] as const).map((opt) => {
            const selected = currentAdminTheme === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => handleAdminThemeChange(opt.key)}
                style={{
                  flex: '1 1 120px',
                  padding: '12px 14px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  border: selected ? '2px solid #1C1C1E' : '1px solid #E5E5E3',
                  background: opt.bg,
                  color: opt.fg,
                  fontSize: 13,
                  fontWeight: 600,
                  textAlign: 'left',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <p style={{ fontSize: 11, color: theme.heading, margin: 0 }}>
          Yönetim panelinin görünümünü seçin (sidebar koyu kalır).
        </p>

        {/* Menu Preview Link */}
        <div style={{ padding: '10px 14px', background: theme.pageBg, borderRadius: 8, fontSize: 13, color: theme.heading }}>
          Menu linkiniz:{' '}
          <a href={`/menu/${restaurant.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: theme.accent, fontWeight: 600 }}>
            tabbled.com/menu/{restaurant.slug}
          </a>
        </div>

        <button type="submit" disabled={saving} style={{ ...S.btn, alignSelf: 'flex-start' }}>
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function RestaurantDashboard() {
  const { user, signOut } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCatForm, setShowCatForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [catForm, setCatForm] = useState<{ name_tr: string; image_url: string; parent_id: string | null }>({ name_tr: '', image_url: '', parent_id: null });
  const [uploadingCatImage, setUploadingCatImage] = useState<string | null>(null); // 'new' or category id
  const catFileRef = useRef<HTMLInputElement>(null);
  const [itemForm, setItemForm] = useState(emptyItemForm);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState<string | null>(null);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiTone, setAiTone] = useState<'elegant' | 'casual' | 'descriptive'>('descriptive');
  const [aiPreview, setAiPreview] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editCatForm, setEditCatForm] = useState({ name_tr: '' });
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'menu' | 'translations' | 'qr' | 'profile' | 'promos' | 'calls' | 'feedback' | 'discounts' | 'likes' | 'customers' | 'analytics'>('dashboard');
  const [pendingCallCount, setPendingCallCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const raw = localStorage.getItem('tabbled_sidebar_groups');
      if (raw) return JSON.parse(raw);
    } catch {}
    return {};
  });
  const toggleGroup = (title: string) => {
    setOpenGroups(prev => {
      const next = { ...prev, [title]: !prev[title] };
      try { localStorage.setItem('tabbled_sidebar_groups', JSON.stringify(next)); } catch {}
      return next;
    });
  };
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  const [loadingData, setLoadingData] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const initialFormJsonRef = useRef<string>('');
  const formContainerRef = useRef<HTMLDivElement | null>(null);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const toggleExpand = (catId: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [trialExpired, setTrialExpired] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [planName, setPlanName] = useState<string | null>(null);

  const enabledLangs = (restaurant?.enabled_languages ?? []).filter(l => l !== 'tr');
  const plan = (restaurant?.current_plan || '').toLowerCase();
  const hasAI = plan === 'pro' || plan === 'premium';

  // Smooth-scroll the inline item form into view when it opens.
  useEffect(() => {
    if (showItemForm && formContainerRef.current) {
      formContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [showItemForm, editingItem]);

  useEffect(() => {
    if (user) {
      setLoadingData(true);
      supabase.from('profiles').select('restaurant_id').eq('id', user.id).single()
        .then(({ data }) => {
          if (data?.restaurant_id) {
            supabase.from('restaurants').select('*').eq('id', data.restaurant_id).single()
              .then(({ data: r }) => {
                if (r) {
                  setRestaurant(r);
                  Promise.all([loadCategories(r.id), loadItems(r.id)]).finally(() => setLoadingData(false));
                } else {
                  setLoadingData(false);
                }
              });
          } else {
            setLoadingData(false);
          }
        });
    }
  }, [user]);

  // Waiter calls: pending count + realtime
  useEffect(() => {
    if (!restaurant) return;
    const rid = restaurant.id;

    // Initial count
    supabase
      .from('waiter_calls')
      .select('id', { count: 'exact', head: true })
      .eq('restaurant_id', rid)
      .in('status', ['pending', 'acknowledged'])
      .then(({ count }) => { if (count != null) setPendingCallCount(count); });

    // Realtime
    const channel = supabase
      .channel('waiter-calls-badge')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'waiter_calls', filter: `restaurant_id=eq.${rid}` }, () => {
        // Re-fetch count on any change
        supabase
          .from('waiter_calls')
          .select('id', { count: 'exact', head: true })
          .eq('restaurant_id', rid)
          .in('status', ['pending', 'acknowledged'])
          .then(({ count }) => { if (count != null) setPendingCallCount(count); });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [restaurant?.id]);

  // Trial subscription check
  useEffect(() => {
    if (!restaurant?.id) return;

    const checkSubscription = async () => {
      const { data: subs } = await supabase
        .from('subscriptions')
        .select('*, subscription_plans(name)')
        .eq('restaurant_id', restaurant.id)
        .order('end_date', { ascending: false })
        .limit(1);

      const activeSub = subs?.[0];

      if (!activeSub) {
        setTrialExpired(true);
        setPlanName(null);
        return;
      }

      const subPlanName = (activeSub as { subscription_plans?: { name?: string } }).subscription_plans?.name || null;
      setPlanName(subPlanName);

      const endDate = new Date(activeSub.end_date);
      const now = new Date();
      const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysLeft <= 0) {
        setTrialExpired(true);
        if (activeSub.status !== 'expired') {
          await supabase
            .from('subscriptions')
            .update({ status: 'expired' })
            .eq('id', activeSub.id);
        }
      } else {
        setTrialDaysLeft(daysLeft);
      }
    };

    checkSubscription();
  }, [restaurant?.id]);

  // Responsive: track mobile breakpoint
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  async function loadCategories(rid: string) {
    const { data } = await supabase.from('menu_categories').select('*').eq('restaurant_id', rid).order('sort_order');
    setCategories(data || []);
  }
  async function loadItems(rid: string) {
    const { data } = await supabase.from('menu_items').select('*').eq('restaurant_id', rid).order('sort_order');
    setItems(data || []);
  }

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function persistCategoryOrder(ordered: Category[]) {
    await Promise.all(
      ordered.map((c, i) => supabase.from('menu_categories').update({ sort_order: i }).eq('id', c.id))
    );
  }

  async function persistItemOrder(ordered: MenuItem[]) {
    await Promise.all(
      ordered.map((it, i) => supabase.from('menu_items').update({ sort_order: i }).eq('id', it.id))
    );
  }

  function handleCategoryDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setCategories((prev) => {
      const activeCat = prev.find((c) => c.id === active.id);
      const overCat = prev.find((c) => c.id === over.id);
      if (!activeCat || !overCat) return prev;
      // Only reorder within the same parent scope
      if ((activeCat.parent_id ?? null) !== (overCat.parent_id ?? null)) return prev;
      const scope = prev.filter((c) => (c.parent_id ?? null) === (activeCat.parent_id ?? null));
      const others = prev.filter((c) => (c.parent_id ?? null) !== (activeCat.parent_id ?? null));
      const oldIndex = scope.findIndex((c) => c.id === active.id);
      const newIndex = scope.findIndex((c) => c.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      const reordered = arrayMove(scope, oldIndex, newIndex);
      persistCategoryOrder(reordered);
      return [...others, ...reordered];
    });
  }

  function handleChildCategoryDragEnd(parentId: string, event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setCategories((prev) => {
      const scope = prev.filter((c) => c.parent_id === parentId);
      const others = prev.filter((c) => c.parent_id !== parentId);
      const oldIndex = scope.findIndex((c) => c.id === active.id);
      const newIndex = scope.findIndex((c) => c.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      const reordered = arrayMove(scope, oldIndex, newIndex);
      persistCategoryOrder(reordered);
      return [...others, ...reordered];
    });
  }

  function handleItemDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !selectedCat) return;
    setItems((prev) => {
      const inCat = prev.filter((i) => i.category_id === selectedCat);
      const others = prev.filter((i) => i.category_id !== selectedCat);
      const oldIndex = inCat.findIndex((i) => i.id === active.id);
      const newIndex = inCat.findIndex((i) => i.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      const reordered = arrayMove(inCat, oldIndex, newIndex);
      persistItemOrder(reordered);
      return [...others, ...reordered];
    });
  }

  async function generateAIDescription() {
    if (!restaurant || !itemForm.name_tr) return;
    setGeneratingAI(true);
    setAiPreview(null);
    try {
      const catNameVal = selectedCat ? categories.find(c => c.id === selectedCat)?.name_tr || '' : '';
      const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-description`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: restaurant.id,
          item_id: editingItem || 'new',
          name_tr: itemForm.name_tr,
          category_name: catNameVal,
          price: itemForm.price,
          allergens: itemForm.allergens,
          is_vegetarian: itemForm.allergens.includes('vegetarian'),
          calories: itemForm.nutrition.calories ? parseInt(itemForm.nutrition.calories) : null,
          tone: aiTone,
          currentDesc: itemForm.description_tr || '',
        }),
      });
      const data = await res.json();
      if (data.success && data.description) {
        setAiPreview(data.description);
        if (data.usage && data.limit !== 'unlimited') {
          setMsg(`AI açıklama oluşturuldu (${data.usage}/${data.limit} kullanım)`);
          setTimeout(() => setMsg(''), 4000);
        }
      } else {
        setMsg(data.error || 'AI açıklama oluşturulamadı');
      }
    } catch (err) {
      setMsg('AI servisi bağlantı hatası');
    }
    setGeneratingAI(false);
  }

  function acceptAiDescription() {
    if (aiPreview) {
      setItemForm(prev => ({ ...prev, description_tr: aiPreview }));
      setAiPreview(null);
    }
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!restaurant) return;
    setSaving(true);
    const { data: newCat, error } = await supabase.from('menu_categories').insert({
      restaurant_id: restaurant.id,
      name_tr: catForm.name_tr,
      image_url: catForm.image_url || null,
      parent_id: catForm.parent_id,
      sort_order: categories.filter(c => (c.parent_id ?? null) === (catForm.parent_id ?? null)).length,
      translations: {},
    }).select().single();
    if (error) { setMsg(error.message); }
    else {
      setCatForm({ name_tr: '', image_url: '', parent_id: null }); setShowCatForm(false);
      loadCategories(restaurant.id);
      if (newCat && enabledLangs.length > 0) {
        setTranslating(newCat.id);
        await triggerTranslation('menu_categories', newCat.id, enabledLangs);
        setTranslating(null);
        loadCategories(restaurant.id);
      }
    }
    setSaving(false);
  }

  async function uploadCategoryImage(file: File, target: 'new' | string) {
    if (!restaurant) return;
    setUploadingCatImage(target);
    const ext = file.name.split('.').pop();
    const fileName = `${restaurant.slug}/categories/${target === 'new' ? Date.now() : target}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('menu-images').upload(fileName, file, { upsert: true });
    if (error) { setMsg('Görsel yükleme hatası: ' + error.message); setUploadingCatImage(null); return; }
    const { data: urlData } = supabase.storage.from('menu-images').getPublicUrl(fileName);
    if (target === 'new') {
      setCatForm(prev => ({ ...prev, image_url: urlData.publicUrl }));
    } else {
      await supabase.from('menu_categories').update({ image_url: urlData.publicUrl }).eq('id', target);
      loadCategories(restaurant.id);
    }
    setUploadingCatImage(null);
  }

  async function removeCategoryImage(id: string) {
    if (!restaurant) return;
    await supabase.from('menu_categories').update({ image_url: null }).eq('id', id);
    loadCategories(restaurant.id);
  }
  async function updateCategory(id: string) {
    if (!restaurant) return;
    await supabase.from('menu_categories').update({ name_tr: editCatForm.name_tr }).eq('id', id);
    setEditingCat(null);
    loadCategories(restaurant.id);
    if (enabledLangs.length > 0) {
      setTranslating(id);
      await triggerTranslation('menu_categories', id, enabledLangs);
      setTranslating(null);
      loadCategories(restaurant.id);
    }
  }
  async function deleteCategory(id: string) {
    if (!restaurant || !confirm('Bu kategori ve tüm ürünleri silinecek. Emin misiniz?')) return;
    await supabase.from('menu_categories').delete().eq('id', id);
    loadCategories(restaurant.id); loadItems(restaurant.id);
    if (selectedCat === id) setSelectedCat(null);
  }

  async function handleImageUpload(file: File) {
    if (!restaurant) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `${restaurant.slug}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('menu-images').upload(fileName, file, { upsert: true });
    if (error) { setMsg('Görsel yükleme hatası: ' + error.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('menu-images').getPublicUrl(fileName);
    setItemForm({ ...itemForm, image_url: urlData.publicUrl });
    setUploading(false);
  }

  async function addOrUpdateItem(e: React.FormEvent) {
    e.preventDefault();
    if (!restaurant || !selectedCat) return;

    // Resolve target category: form dropdown overrides the currently-open list
    const targetCategoryId = itemForm.category_id || selectedCat;

    // Validate + normalise variants
    let priceForDb = parseFloat(itemForm.price);
    let priceVariants: PriceVariant[] = [];
    if (itemForm.variants.length > 0) {
      if (itemForm.variants.length < 2) {
        setMsg('Çoklu fiyat modu için en az 2 varyant gerekir. Tek fiyata dönmek için "Tek fiyata dön" linkini kullanın.');
        return;
      }
      const parsed: PriceVariant[] = [];
      for (const v of itemForm.variants) {
        const price = parseFloat(v.price);
        if (!v.name_tr.trim() || !Number.isFinite(price) || price <= 0) {
          setMsg('Her varyant için TR isim ve geçerli fiyat zorunludur.');
          return;
        }
        parsed.push({
          name_tr: v.name_tr.trim(),
          name_en: v.name_en.trim(),
          price,
          calories: v.calories ? parseInt(v.calories) : null,
        });
      }
      priceVariants = parsed;
      priceForDb = Math.min(...parsed.map((p) => p.price));
    } else if (!Number.isFinite(priceForDb) || priceForDb < 0) {
      setMsg('Geçerli bir fiyat girin.');
      return;
    }

    // Build nutrition jsonb from draft; NULL if nothing filled
    const nd = itemForm.nutrition;
    const nutritionPayload: Nutrition | null = (() => {
      const anyNumeric = NUTRITION_NUMERIC_KEYS.some((k) => (nd[k] || '').trim() !== '');
      const hasServing = nd.serving_size.trim() !== '';
      if (!anyNumeric && !hasServing) return null;
      const out: Nutrition = { show_on_menu: nd.show_on_menu };
      if (hasServing) out.serving_size = nd.serving_size.trim();
      for (const k of NUTRITION_NUMERIC_KEYS) {
        const raw = (nd[k] || '').trim();
        if (raw === '') continue;
        const num = parseFloat(raw);
        if (!Number.isFinite(num) || num < 0) continue;
        (out as Record<string, unknown>)[k] = num;
      }
      return out;
    })();

    // calories column stays in sync with nutrition.calories (or clears when
    // nutrition is blank)
    const caloriesForDb: number | null = nutritionPayload?.calories != null
      ? nutritionPayload.calories
      : null;

    setSaving(true);

    // If category changed during edit, append to the new category's end
    const movedCategory = editingItem && targetCategoryId !== selectedCat;
    const newSortOrder =
      movedCategory
        ? items.filter((i) => i.category_id === targetCategoryId).length
        : editingItem
        ? undefined
        : items.filter((i) => i.category_id === targetCategoryId).length;

    const payload = {
      restaurant_id: restaurant.id,
      category_id: targetCategoryId,
      name_tr: itemForm.name_tr,
      description_tr: itemForm.description_tr || null,
      price: priceForDb,
      price_variants: priceVariants,
      nutrition: nutritionPayload,
      prep_time: itemForm.prep_time && Number.isFinite(parseInt(itemForm.prep_time))
        ? Math.max(1, Math.min(999, parseInt(itemForm.prep_time)))
        : null,
      image_url: itemForm.image_url || null,
      video_url: itemForm.video_url || null,
      calories: caloriesForDb,
      allergens: itemForm.allergens.length > 0 ? itemForm.allergens : null,
      is_vegetarian: itemForm.allergens.includes('vegetarian'),
      is_new: itemForm.is_new,
      is_featured: itemForm.is_featured,
      is_sold_out: itemForm.is_sold_out,
      schedule_type: itemForm.schedule_type,
      schedule_start: itemForm.schedule_type === 'date_range' && itemForm.schedule_start ? itemForm.schedule_start : null,
      schedule_end: itemForm.schedule_type === 'date_range' && itemForm.schedule_end ? itemForm.schedule_end : null,
      schedule_periodic: itemForm.schedule_type === 'periodic' ? itemForm.schedule_periodic : {},
      sort_order: newSortOrder,
      happy_hour_active: itemForm.happy_hour_active || false,
      happy_hour_price: itemForm.happy_hour_active && itemForm.happy_hour_price ? parseFloat(String(itemForm.happy_hour_price)) : null,
      happy_hour_label: itemForm.happy_hour_active && itemForm.happy_hour_label ? itemForm.happy_hour_label : null,
      happy_hour_days: itemForm.happy_hour_active && itemForm.happy_hour_days && itemForm.happy_hour_days.length > 0 ? itemForm.happy_hour_days : null,
      happy_hour_start_time: itemForm.happy_hour_active && itemForm.happy_hour_start_time ? itemForm.happy_hour_start_time : null,
      happy_hour_end_time: itemForm.happy_hour_active && itemForm.happy_hour_end_time ? itemForm.happy_hour_end_time : null,
    };

    let savedId = editingItem;

    if (editingItem) {
      const { sort_order, ...updatePayload } = payload;
      await supabase.from('menu_items').update(updatePayload).eq('id', editingItem);
    } else {
      const { data: newItem } = await supabase.from('menu_items').insert({ ...payload, translations: {} }).select().single();
      if (newItem) savedId = newItem.id;
    }

    // Sync recommendations
    if (savedId) {
      await supabase.from('item_recommendations').delete().eq('menu_item_id', savedId);
      const recRows = itemForm.recommended_ids.slice(0, 5).map((rid, idx) => ({
        menu_item_id: savedId,
        recommended_item_id: rid,
        reason_tr: itemForm.recommendation_reasons[rid]?.tr || null,
        reason_en: itemForm.recommendation_reasons[rid]?.en || null,
        sort_order: idx,
      }));
      if (recRows.length > 0) {
        await supabase.from('item_recommendations').insert(recRows);
      }
    }

    // Keep the form open after save; just reset dirty snapshot and toast.
    if (!editingItem && savedId) {
      setEditingItem(savedId);
    }
    snapshotForm(itemForm);
    setMsg(editingItem ? 'Ürün güncellendi' : 'Ürün eklendi');
    setTimeout(() => setMsg(''), 3000);
    loadItems(restaurant.id);

    if (savedId && enabledLangs.length > 0) {
      setTranslating(savedId);
      await triggerTranslation('menu_items', savedId, enabledLangs);
      setTranslating(null);
      loadItems(restaurant.id);
    }

    setSaving(false);
  }
  async function deleteItem(id: string) {
    if (!restaurant || !confirm('Bu ürün silinecek. Emin misiniz?')) return;
    await supabase.from('menu_items').delete().eq('id', id);
    loadItems(restaurant.id);
  }
  async function toggleItemAvailable(id: string, current: boolean) {
    if (!restaurant) return;
    await supabase.from('menu_items').update({ is_available: !current }).eq('id', id);
    loadItems(restaurant.id);
  }
  function snapshotForm(form: typeof itemForm) {
    initialFormJsonRef.current = JSON.stringify(form);
  }
  const hasUnsavedChanges = (() => {
    if (!showItemForm) return false;
    return JSON.stringify(itemForm) !== initialFormJsonRef.current;
  })();

  function openNewItemForm(catId: string) {
    if (hasUnsavedChanges && !confirm('Kaydedilmemiş değişiklikler var. Çıkmak istediğinize emin misiniz?')) return;
    setSelectedCat(catId);
    setShowItemForm(true);
    setEditingItem(null);
    const fresh = { ...emptyItemForm, category_id: catId };
    setItemForm(fresh);
    snapshotForm(fresh);
  }

  function handleItemClick(item: MenuItem) {
    if (showItemForm && editingItem === item.id) {
      if (hasUnsavedChanges && !confirm('Kaydedilmemiş değişiklikler var. Çıkmak istediğinize emin misiniz?')) return;
      setShowItemForm(false);
      setEditingItem(null);
      setItemForm(emptyItemForm);
      initialFormJsonRef.current = '';
      return;
    }
    if (hasUnsavedChanges && !confirm('Kaydedilmemiş değişiklikler var. Çıkmak istediğinize emin misiniz?')) return;
    startEdit(item);
  }

  function closeItemForm() {
    if (hasUnsavedChanges && !confirm('Kaydedilmemiş değişiklikler var. Çıkmak istediğinize emin misiniz?')) return;
    setShowItemForm(false);
    setEditingItem(null);
    setItemForm(emptyItemForm);
    initialFormJsonRef.current = '';
  }

  async function startEdit(item: MenuItem) {
    setEditingItem(item.id);
    const { data: recs } = await supabase
      .from('item_recommendations')
      .select('recommended_item_id, reason_tr, reason_en, sort_order')
      .eq('menu_item_id', item.id)
      .order('sort_order');
    const recommended_ids = (recs ?? []).map((r: any) => r.recommended_item_id as string);
    const recommendation_reasons: Record<string, { tr: string; en: string }> = {};
    for (const r of recs ?? []) {
      recommendation_reasons[r.recommended_item_id] = {
        tr: r.reason_tr ?? '',
        en: r.reason_en ?? '',
      };
    }
    const baseSchedule = defaultPeriodicSchedule();
    const mergedPeriodic = { ...baseSchedule };
    if (item.schedule_periodic) {
      for (const day of PERIODIC_DAYS) {
        const v = (item.schedule_periodic as Record<string, { enabled?: boolean; start?: string; end?: string; all_day?: boolean }>)[day];
        if (v) {
          mergedPeriodic[day] = {
            enabled: !!v.enabled,
            start: v.start || '09:00',
            end: v.end || '17:00',
            all_day: !!v.all_day,
          };
        }
      }
    }
    const variantDrafts: VariantDraft[] = Array.isArray(item.price_variants)
      ? item.price_variants.map((v) => ({
          name_tr: v.name_tr || '',
          name_en: v.name_en || '',
          price: v.price != null ? v.price.toString() : '',
          calories: v.calories != null ? v.calories.toString() : '',
        }))
      : [];

    // Hydrate nutrition draft: if item has nutrition use it, otherwise fall
    // back to legacy calories column so nothing silently disappears.
    const srcNutr = item.nutrition;
    const nutrDraft: NutritionDraft = emptyNutritionDraft();
    if (srcNutr && typeof srcNutr === 'object') {
      nutrDraft.show_on_menu = srcNutr.show_on_menu !== false;
      nutrDraft.serving_size = srcNutr.serving_size || '';
      for (const key of NUTRITION_NUMERIC_KEYS) {
        const val = (srcNutr as Record<string, unknown>)[key];
        if (typeof val === 'number') nutrDraft[key] = val.toString();
      }
    } else if (item.calories != null) {
      nutrDraft.calories = item.calories.toString();
    }
    const nutritionOpen = !!srcNutr;
    const nextForm = {
      name_tr: item.name_tr,
      description_tr: item.description_tr || '',
      price: item.price.toString(),
      image_url: item.image_url || '',
      video_url: item.video_url || '',
      recommended_ids,
      recommendation_reasons,
      allergens: item.allergens || [],
      is_vegetarian: item.is_vegetarian || false,
      is_new: item.is_new || false,
      is_featured: item.is_featured || false,
      is_sold_out: item.is_sold_out || false,
      schedule_type: item.schedule_type || 'always',
      schedule_start: item.schedule_start ? item.schedule_start.slice(0, 16) : '',
      schedule_end: item.schedule_end ? item.schedule_end.slice(0, 16) : '',
      schedule_periodic: mergedPeriodic,
      category_id: item.category_id,
      variants: variantDrafts,
      nutrition: nutrDraft,
      nutritionOpen,
      prep_time: item.prep_time != null ? item.prep_time.toString() : '',
      happy_hour_active: (item as any).happy_hour_active || false,
      happy_hour_price: (item as any).happy_hour_price != null ? String((item as any).happy_hour_price) : '',
      happy_hour_label: (item as any).happy_hour_label || '',
      happy_hour_days: (item as any).happy_hour_days || null,
      happy_hour_start_time: (item as any).happy_hour_start_time ? String((item as any).happy_hour_start_time).slice(0, 5) : '',
      happy_hour_end_time: (item as any).happy_hour_end_time ? String((item as any).happy_hour_end_time).slice(0, 5) : '',
      happyHourOpen: !!(item as any).happy_hour_active,
    };
    setItemForm(nextForm);
    snapshotForm(nextForm);
    setShowItemForm(true);
    setSelectedCat(item.category_id);
  }

  // --- Inline price edit helper ---
  async function updateItemPrice(itemId: string, newPrice: number) {
    const prev = items;
    setItems(prev.map(it => it.id === itemId ? { ...it, price: newPrice } : it));
    const { error } = await supabase.from('menu_items').update({ price: newPrice }).eq('id', itemId);
    if (error) {
      setItems(prev);
      setMsg('Fiyat güncellenemedi: ' + error.message);
    }
  }

  // --- Sold-out toggle helper ---
  async function toggleSoldOut(itemId: string, current: boolean) {
    const prev = items;
    setItems(prev.map(it => it.id === itemId ? { ...it, is_sold_out: !current } : it));
    const { error } = await supabase.from('menu_items').update({ is_sold_out: !current }).eq('id', itemId);
    if (error) {
      setItems(prev);
      setMsg('Tükendi durumu güncellenemedi');
    }
  }
  function toggleAllergen(val: string) {
    setItemForm(prev => ({
      ...prev,
      allergens: prev.allergens.includes(val)
        ? prev.allergens.filter(a => a !== val)
        : [...prev.allergens, val]
    }));
  }

  function TranslationBadges({ translations }: { translations: Translations }) {
    if (!translations || Object.keys(translations).length === 0) return null;
    return (
      <span style={{ display: 'inline-flex', gap: 3, marginLeft: 6 }}>
        {Object.keys(translations).map(lang => (
          <span key={lang} style={{ ...S.badge, background: '#EEF2FF', color: '#4338CA', fontSize: 9 }}>
            {lang.toUpperCase()}
          </span>
        ))}
      </span>
    );
  }

  if (trialExpired) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F7F5', padding: 16 }}>
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <TabbledLogo logoType="vertical" sizeClass="h-16" />
          <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', marginTop: 24 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Warning size={28} weight="regular" color="#EF4444" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1C1C1E', marginBottom: 8 }}>
              Deneme Süreniz Doldu
            </h2>
            <p style={{ fontSize: 14, color: '#6B6B6F', marginBottom: 24, lineHeight: 1.5 }}>
              14 günlük ücretsiz deneme süreniz sona erdi. Tabbled'ı kullanmaya devam etmek için bir plan seçin.
            </p>
            <a
              href="/iletisim?plan=basic&source=trial_expired"
              style={{
                display: 'block', width: '100%', padding: '11px 20px', fontSize: 14, fontWeight: 600,
                color: '#FFFFFF', background: '#FF4F7A', border: 'none', borderRadius: 8,
                textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box',
              }}
            >
              Plan Seçin
            </a>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = '/login';
              }}
              style={{
                display: 'block', width: '100%', marginTop: 12, padding: '11px 20px',
                fontSize: 13, color: '#A0A0A0', background: 'none', border: 'none',
                cursor: 'pointer',
              }}
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loadingData) return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
      <CategoryTabSkeleton />
      <div style={{ marginTop: 16 }}>
        <ListSkeleton rows={5} />
      </div>
    </div>
  );

  if (!restaurant) return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1C1C1E', marginBottom: 8 }}>Restoran Atanmadı</h2>
      <p style={{ fontSize: 14, color: '#6B6B6F' }}>Hesabınıza henüz bir restoran atanmamış. Lütfen yönetici ile iletişime geçin.</p>
    </div>
  );

  // Category id → ids including direct children (for parent selection)
  const categoryScopeIds = (catId: string): string[] => {
    const children = categories.filter(c => c.parent_id === catId).map(c => c.id);
    return [catId, ...children];
  };
  const filteredItems = (() => {
    let list = selectedCat
      ? items.filter(i => categoryScopeIds(selectedCat).includes(i.category_id))
      : items;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(i =>
        i.name_tr.toLowerCase().includes(q) ||
        (i.description_tr && i.description_tr.toLowerCase().includes(q))
      );
    }
    return list;
  })();
  // Eksik fotoğraf hesaplama
  const missingPhotoCounts = new Map<string, number>();
  for (const item of items) {
    if (!item.image_url) {
      missingPhotoCounts.set(item.category_id, (missingPhotoCounts.get(item.category_id) || 0) + 1);
    }
  }
  const totalMissingPhotos = items.filter(i => !i.image_url).length;
  const catName = (id: string) => categories.find(c => c.id === id)?.name_tr || '';

  const sidebarGroups = [
    {
      title: '',
      items: [
        { key: 'dashboard' as const, label: 'Dashboard', icon: ChartBar },
        { key: 'analytics' as const, label: 'Analitik', icon: ChartBar },
      ],
    },
    {
      title: 'Menü Yönetimi',
      items: [
        { key: 'menu' as const, label: 'Menü', icon: SquaresFour },
        { key: 'translations' as const, label: 'Çeviri Merkezi', icon: Globe },
        { key: 'qr' as const, label: 'QR Kodları', icon: Rows },
      ],
    },
    {
      title: 'Müşteri İlişkileri',
      items: [
        { key: 'customers' as const, label: 'Müşteriler', icon: Users },
        { key: 'calls' as const, label: 'Çağrılar', icon: Bell, badge: pendingCallCount },
        { key: 'feedback' as const, label: 'Geri Bildirim', icon: ChatCircle },
        { key: 'likes' as const, label: 'Beğeniler', icon: Heart },
        { key: 'promos' as const, label: 'Promosyonlar', icon: Tag },
      ],
    },
    {
      title: 'Pazarlama',
      items: [
        { key: 'discounts' as const, label: 'İndirim Kodları', icon: Percent },
      ],
    },
    {
      title: 'Görünüm',
      items: [
        { key: 'profile' as const, label: 'Tema & Profil', icon: Palette },
      ],
    },
  ];

  const allSidebarItems = sidebarGroups.flatMap(g => g.items);
  const activeLabel = allSidebarItems.find(i => i.key === activeTab)?.label ?? 'Dashboard';
  const activeGroupTitle = sidebarGroups.find(g => g.items.some(i => i.key === activeTab))?.title || '';
  const isGroupOpen = (title: string) => {
    if (!title) return true;
    if (title in openGroups) return openGroups[title];
    return title === activeGroupTitle;
  };

  // Inline item form renderer. Assigned during render by the IIFE below so we
  // can keep the large JSX tree in-place while calling it from inside the
  // category accordion.
  let renderItemForm: () => ReactNode = () => null;

  const handleSidebarNav = (key: typeof activeTab) => {
    setActiveTab(key);
    setSidebarOpen(false);
  };

  const sidebarContent = (
    <>
      {/* Header — restaurant branding */}
      <div className="sb-header">
        {restaurant.logo_url && (
          <img onError={handleImageError} src={getOptimizedImageUrl(restaurant.logo_url, 'thumbnail')} alt="" className="sb-header-logo" />
        )}
        <p className="sb-header-name">{restaurant.name}</p>
      </div>

      {/* Navigation groups */}
      <nav className="flex-1 overflow-auto py-3">
        {sidebarGroups.map((group, gIdx) => {
          const open = isGroupOpen(group.title);
          return (
            <div key={group.title || `grp-${gIdx}`} className="sb-group">
              {group.title && (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.title)}
                  className="sb-group-title"
                  style={{ display: 'flex', alignItems: 'center', width: '100%', background: 'transparent', border: 'none', cursor: 'pointer' }}
                  aria-expanded={open}
                >
                  <span style={{ flex: 1, textAlign: 'left' }}>{group.title}</span>
                  {open ? <CaretDown size={12} weight="thin" /> : <CaretRight size={12} weight="thin" />}
                </button>
              )}
              <div
                style={{
                  maxHeight: open ? `${group.items.length * 50}px` : 0,
                  overflow: 'hidden',
                  transition: 'max-height 200ms ease',
                }}
              >
                {group.items.map((item, iIdx) => {
                  const active = activeTab === item.key;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleSidebarNav(item.key)}
                      className="sb-item"
                      data-active={active}
                      style={{ animationDelay: `${gIdx * 40 + iIdx * 25}ms` }}
                    >
                      <Icon size={16} weight={active ? 'fill' : 'regular'} className="sb-icon" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {'badge' in item && (item as any).badge > 0 && (
                        <span className="sb-badge">{(item as any).badge}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer — public menu link */}
      <div className="sb-footer">
        <Link size={13} /> tabbled.com/menu/{restaurant.slug}
      </div>
    </>
  );

  const adminTheme = getAdminTheme(restaurant?.admin_theme);
  const S = useMemo(() => makeStyles(adminTheme), [adminTheme]);

  return (
    <div className="flex min-h-screen" data-admin-theme={restaurant?.admin_theme === 'dark' ? 'dark' : 'light'} style={{ backgroundColor: adminTheme.pageBg, color: adminTheme.value }}>
      {/* Desktop Sidebar */}
      <aside className="sb-rail hidden md:flex flex-col w-[240px] shrink-0 border-r border-[#3A3A3E] bg-[#1C1C1E] sticky top-0 self-start h-screen overflow-hidden">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="sb-backdrop" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-10 flex flex-col w-[260px] bg-[#1C1C1E] min-h-screen shadow-2xl animate-sidebar-slide-in">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Mobile top bar — hamburger + section label */}
        {isMobile && (
          <div className="sticky top-0 z-40 flex items-center gap-3 px-4 py-3 bg-white border-b border-[#E5E5E3]">
            <button onClick={() => setSidebarOpen(true)} className="p-1" aria-label="Menü">
              <List size={22} />
            </button>
            <span className="text-sm font-semibold text-[#1C1C1E]">{activeLabel}</span>
            {pendingCallCount > 0 && activeTab !== 'calls' && (
              <button onClick={() => setActiveTab('calls')} className="ml-auto relative p-1">
                <Bell size={20} className="text-[#6B6B6F]" />
                <span className="absolute -top-0.5 -right-0.5 text-[8px] font-bold text-white rounded-full w-4 h-4 flex items-center justify-center" style={{ background: '#FF4F7A' }}>{pendingCallCount}</span>
              </button>
            )}
          </div>
        )}

        {trialDaysLeft !== null && trialDaysLeft <= 3 && !trialExpired && (
          <div style={{ margin: '16px 16px 0', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Warning size={18} weight="regular" color="#D97706" />
              <span style={{ fontSize: 13, color: '#92400E' }}>
                Deneme süreniz {trialDaysLeft} gün sonra doluyor.
              </span>
            </div>
            <a
              href="/iletisim?plan=basic&source=trial_warning"
              style={{ fontSize: 13, fontWeight: 500, color: '#FF4F7A', textDecoration: 'none', whiteSpace: 'nowrap' }}
            >
              Plan Seçin →
            </a>
          </div>
        )}

        <div style={S.wrap}>
          <div
            className="hidden md:flex"
            style={{
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 16,
              background: planName ? 'rgba(255,79,122,0.08)' : '#F3F4F6',
              borderLeft: `3px solid ${planName ? '#FF4F7A' : '#D1D5DB'}`,
              borderRadius: 8,
              padding: '10px 14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {planName ? (
                <span style={{ background: '#FF4F7A', color: '#FFFFFF', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 12 }}>
                  {planName}
                </span>
              ) : (
                <span style={{ fontSize: 13, color: '#6B6B6F' }}>Henüz plan atanmadı</span>
              )}
            </div>
            {hasAI && planName && (
              <div style={{ fontSize: 12, color: '#6B6B6F' }}>
                AI Kredisi: <span style={{ color: '#FF4F7A', fontWeight: 600 }}>—/{plan === 'enterprise' ? '∞' : '150'}</span>
              </div>
            )}
            {planName && plan !== 'enterprise' ? (
              <a
                href="https://wa.me/905325119484?text=Plan%C4%B1m%C4%B1%20y%C3%BCkseltmek%20istiyorum"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 12, fontWeight: 600, color: '#FF4F7A', border: '1px solid #FF4F7A', padding: '4px 12px', borderRadius: 12, textDecoration: 'none' }}
              >
                Yükselt
              </a>
            ) : !planName ? (
              <a
                href="https://wa.me/905325119484?text=Plan%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 12, fontWeight: 600, color: '#FF4F7A', border: '1px solid #FF4F7A', padding: '4px 12px', borderRadius: 12, textDecoration: 'none' }}
              >
                İletişime Geç
              </a>
            ) : null}
          </div>

          {activeTab === 'dashboard' && (
            <RestaurantAnalytics
              restaurantId={restaurant.id}
              featureWaiterCalls={restaurant.feature_waiter_calls !== false}
              featureFeedback={restaurant.feature_feedback !== false}
              featureLikes={restaurant.feature_likes !== false}
              featureDiscountCodes={restaurant.feature_discount_codes !== false}
              featureReviews={restaurant.feature_reviews !== false}
              onNavigate={(tab) => setActiveTab(tab as typeof activeTab)}
              theme={adminTheme}
            />
          )}
          {activeTab === 'profile' && <ProfileTab restaurant={restaurant} onUpdate={(r) => setRestaurant(r)} theme={adminTheme} />}
      {activeTab === 'qr' && <QRManager restaurant={restaurant} theme={adminTheme} />}
      {activeTab === 'promos' && <PromosTab restaurant={restaurant} theme={adminTheme} />}
      {activeTab === 'calls' && <WaiterCallsPanel restaurantId={restaurant.id} theme={adminTheme} />}
      {activeTab === 'feedback' && <FeedbackPanel restaurantId={restaurant.id} theme={adminTheme} />}
      {activeTab === 'customers' && <CustomersPanel restaurantId={restaurant.id} theme={adminTheme} />}
      {activeTab === 'analytics' && <AnalyticsPanel restaurantId={restaurant.id} theme={adminTheme} />}
      {activeTab === 'discounts' && <DiscountCodesPanel restaurantId={restaurant.id} theme={adminTheme} />}
      {activeTab === 'likes' && <LikesPanel restaurantId={restaurant.id} theme={adminTheme} />}
      {activeTab === 'translations' && (
        <TranslationCenter
          restaurantId={restaurant.id}
          enabledLanguages={restaurant.enabled_languages ?? ['tr']}
          onEnabledLanguagesChange={(langs) =>
            setRestaurant({ ...restaurant, enabled_languages: langs })
          }
          theme={restaurant?.admin_theme === 'dark' ? 'dark' : 'light'}
        />
      )}

      {activeTab === 'menu' && (
        <>
          {translating && (
            <div style={{ padding: '8px 14px', background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 8, color: '#4338CA', fontSize: 12, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Globe size={14} /> Çeviriler oluşturuluyor...
            </div>
          )}

          {msg && <div style={{ padding: '10px 14px', background: msg.includes('oluşturuldu') ? '#DCFCE7' : '#FEE2E2', border: `1px solid ${msg.includes('oluşturuldu') ? '#DCFCE7' : '#FECACA'}`, borderRadius: 8, color: msg.includes('oluşturuldu') ? '#22C55E' : '#EF4444', fontSize: 13, marginBottom: 16 }} onClick={() => setMsg('')}>{msg} <span style={{ float: 'right', cursor: 'pointer' }}>✕</span></div>}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: adminTheme.value }}>Kategoriler</h3>
            <button onClick={() => setShowCatForm(!showCatForm)} style={S.btnSm}>{showCatForm ? 'İptal' : '+ Kategori'}</button>
          </div>

          {showCatForm && (
            <form onSubmit={addCategory} style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={S.label}>Kategori Adı *</label>
                <input style={S.input} value={catForm.name_tr} onChange={e => setCatForm({ ...catForm, name_tr: e.target.value })} required placeholder="Örn: Ana Yemekler" />
              </div>
              <div>
                <label style={S.label}>Üst Kategori</label>
                <select
                  style={S.input}
                  value={catForm.parent_id || ''}
                  onChange={e => setCatForm({ ...catForm, parent_id: e.target.value || null })}
                >
                  <option value="">Ana Kategori (Yok)</option>
                  {categories.filter(c => !c.parent_id).map(c => (
                    <option key={c.id} value={c.id}>{c.name_tr}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={S.label}>Kategori Görseli</label>
                <input ref={catFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) uploadCategoryImage(e.target.files[0], 'new'); }} />
                {catForm.image_url ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img onError={handleImageError} src={getOptimizedImageUrl(catForm.image_url, 'thumbnail')} alt="" style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', border: '1px solid #E5E5E3' }} />
                    <button type="button" onClick={() => catFileRef.current?.click()} disabled={uploadingCatImage === 'new'} style={{ ...S.btnSm, fontSize: 11 }}>{uploadingCatImage === 'new' ? '...' : 'Değiştir'}</button>
                    <button type="button" onClick={() => setCatForm({ ...catForm, image_url: '' })} style={{ ...S.btnDanger, fontSize: 11 }}><Trash size={12} /></button>
                  </div>
                ) : (
                  <button type="button" onClick={() => catFileRef.current?.click()} disabled={uploadingCatImage === 'new'} style={{ ...S.btnSm, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Camera size={14} /> {uploadingCatImage === 'new' ? 'Yükleniyor...' : 'Görsel Yükle'}
                  </button>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: adminTheme.subtle, marginTop: 4 }}><Info size={14} /><span>800×600px, yatay, max 3MB</span></div>
              </div>
              <button type="submit" disabled={saving} style={{ ...S.btn, alignSelf: 'flex-start' }}>{saving ? '...' : 'Ekle'}</button>
            </form>
          )}

          {/* Summary line */}
          <div style={{ fontSize: 13, color: adminTheme.heading, marginBottom: 10 }}>
            Toplam: <b style={{ color: adminTheme.value }}>{items.length}</b> ürün
            {totalMissingPhotos > 0 && <> · <span style={S.missingPhotoWarning}>{totalMissingPhotos} fotoğraf eksik</span></>}
          </div>

          {/* Search */}
          <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
            <input
              style={{ ...S.input, flex: 1 }}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Bir ürün veya kategori ara..."
            />
          </div>

          {(() => { renderItemForm = () => (
            <form onSubmit={addOrUpdateItem} style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: 10, background: '#F7F7F5', borderLeft: '3px solid #1C1C1E' }}>
              <div>
                <label style={S.label}>Kategori *</label>
                <select
                  style={S.input}
                  value={itemForm.category_id || selectedCat}
                  onChange={e => setItemForm({ ...itemForm, category_id: e.target.value })}
                  required
                >
                  {(() => {
                    const options: React.ReactElement[] = [];
                    const parents = categories.filter(c => !c.parent_id).sort((a, b) => a.sort_order - b.sort_order);
                    for (const p of parents) {
                      const kids = categories.filter(c => c.parent_id === p.id).sort((a, b) => a.sort_order - b.sort_order);
                      // Parent is selectable only when it has no children (items can live there directly)
                      if (kids.length === 0) {
                        options.push(<option key={p.id} value={p.id}>{p.name_tr}</option>);
                      } else {
                        options.push(
                          <option key={p.id} value={p.id} disabled>
                            {p.name_tr}
                          </option>,
                        );
                        for (const k of kids) {
                          options.push(
                            <option key={k.id} value={k.id}>
                              {'\u00A0\u00A0\u00A0\u00A0— '}{k.name_tr}
                            </option>,
                          );
                        }
                      }
                    }
                    return options;
                  })()}
                </select>
              </div>
              <div>
                <label style={S.label}>Ürün Adı *</label>
                <input style={S.input} value={itemForm.name_tr} onChange={e => setItemForm({ ...itemForm, name_tr: e.target.value })} required placeholder="Örn: Mercimek Çorbası" />
              </div>
              <div>
                {/* AI Açıklama Yazıcı header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={S.label}>Açıklama (TR)</label>
                  {hasAI && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <select
                        value={aiTone}
                        onChange={e => setAiTone(e.target.value as 'elegant' | 'casual' | 'descriptive')}
                        style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: `1px solid ${adminTheme.border}`, backgroundColor: adminTheme.pageBg, color: adminTheme.heading, cursor: 'pointer' }}
                      >
                        <option value="descriptive">Detaylı</option>
                        <option value="elegant">Şık</option>
                        <option value="casual">Samimi</option>
                      </select>
                      <button
                        type="button"
                        onClick={generateAIDescription}
                        disabled={generatingAI || !itemForm.name_tr}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 6, border: 'none', backgroundColor: generatingAI ? '#E5E5E3' : '#FF4F7A', color: generatingAI ? '#999' : '#fff', cursor: generatingAI ? 'not-allowed' : 'pointer', transition: 'all 0.15s', opacity: !itemForm.name_tr ? 0.5 : 1, fontFamily: "'Roboto', sans-serif" }}
                        title="AI ile açıklama oluştur"
                      >
                        {generatingAI ? (
                          <><div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> Yazılıyor...</>
                        ) : (
                          <><Pen size={14} /> AI ile Yaz</>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* AI Önizleme */}
                {aiPreview && (
                  <div style={{ padding: 12, marginBottom: 8, borderRadius: 8, border: '1px solid #FF4F7A40', backgroundColor: '#FFF5F7' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#FF4F7A', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Pen size={12} /> AI Önizleme
                    </div>
                    <div style={{ fontSize: 13, color: adminTheme.value, lineHeight: 1.5, marginBottom: 8 }}>
                      {aiPreview}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button type="button" onClick={acceptAiDescription} style={{ padding: '4px 12px', fontSize: 11, fontWeight: 600, borderRadius: 6, border: 'none', backgroundColor: '#22c55e', color: '#fff', cursor: 'pointer' }}>
                        Kullan
                      </button>
                      <button type="button" onClick={generateAIDescription} style={{ padding: '4px 12px', fontSize: 11, fontWeight: 600, borderRadius: 6, border: `1px solid ${adminTheme.border}`, backgroundColor: adminTheme.cardBg, color: adminTheme.heading, cursor: 'pointer' }}>
                        Tekrar Üret
                      </button>
                      <button type="button" onClick={() => setAiPreview(null)} style={{ padding: '4px 12px', fontSize: 11, fontWeight: 600, borderRadius: 6, border: 'none', backgroundColor: 'transparent', color: adminTheme.subtle, cursor: 'pointer' }}>
                        İptal
                      </button>
                    </div>
                  </div>
                )}

                <Suspense fallback={
                  <div style={{ ...S.input, minHeight: 112, display: 'flex', alignItems: 'center', justifyContent: 'center', color: adminTheme.subtle, fontSize: 12, backgroundColor: adminTheme.inputBg, borderColor: adminTheme.inputBorder }}>
                    Editör yükleniyor...
                  </div>
                }>
                  <RichTextEditor
                    content={itemForm.description_tr}
                    onChange={(html) => setItemForm({ ...itemForm, description_tr: html })}
                    placeholder="Kısa bir açıklama yazın veya AI ile oluşturun"
                    minHeight={80}
                  />
                </Suspense>
              </div>
              {/* Single price vs variant mode */}
              {itemForm.variants.length === 0 ? (
                <div style={S.grid2}>
                  <div>
                    <label style={S.label}>Fiyat (₺) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      style={S.input}
                      value={itemForm.price}
                      onChange={e => setItemForm({ ...itemForm, price: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setItemForm({
                          ...itemForm,
                          variants: [
                            { name_tr: '', name_en: '', price: itemForm.price || '', calories: '' },
                            { name_tr: '', name_en: '', price: '', calories: '' },
                          ],
                        })
                      }
                      style={{ ...S.btnSm, marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11 }}
                    >
                      <PlusCircle size={14} /> Varyant Ekle (Boyut)
                    </button>
                  </div>
                  <div>
                    <label style={S.label}>Görsel</label>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0]); }} />
                    {itemForm.image_url ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img onError={handleImageError} src={getOptimizedImageUrl(itemForm.image_url, 'thumbnail')} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
                        <button type="button" onClick={() => setItemForm({ ...itemForm, image_url: '' })} style={{ ...S.btnSm, padding: '3px 8px', fontSize: 11, color: '#EF4444' }}>Kaldır</button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} style={{ ...S.btnSm, width: '100%' }}>
                        {uploading ? 'Yükleniyor...' : <><Camera size={14} /> Görsel Seç</>}
                      </button>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#A0A0A0', marginTop: 4 }}><Info size={14} /><span>1200×800px, yatay, max 5MB</span></div>
                  </div>
                  <div>
                    <label style={S.label}>Video</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        style={{ ...S.input, flex: 1 }}
                        value={itemForm.video_url}
                        onChange={e => setItemForm({ ...itemForm, video_url: e.target.value })}
                        placeholder="https://...mp4 veya YouTube/Vimeo linki"
                      />
                      {itemForm.video_url && (
                        <button
                          type="button"
                          onClick={() => setItemForm({ ...itemForm, video_url: '' })}
                          style={{ ...S.btnSm, padding: '6px 10px', fontSize: 11, color: '#EF4444' }}
                          title="Video URL'ini kaldır"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    {itemForm.video_url && (
                      <div style={{ marginTop: 8, borderRadius: 8, overflow: 'hidden', maxWidth: 320, border: '1px solid #E5E5E3' }}>
                        {(() => {
                          const v = itemForm.video_url.trim();
                          const yt = v.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
                          const vm = v.match(/vimeo\.com\/(?:video\/)?(\d+)/);
                          if (yt) return <iframe src={`https://www.youtube.com/embed/${yt[1]}`} style={{ width: '100%', aspectRatio: '16/9', border: 'none' }} allow="encrypted-media" />;
                          if (vm) return <iframe src={`https://player.vimeo.com/video/${vm[1]}`} style={{ width: '100%', aspectRatio: '16/9', border: 'none' }} allow="encrypted-media" />;
                          return <video src={v} controls style={{ width: '100%', maxHeight: 240 }} />;
                        })()}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#A0A0A0', marginTop: 4 }}><Info size={14} /><span>.mp4/.webm direkt URL veya YouTube/Vimeo linki — Storage'a yüklenmez</span></div>
                  </div>
                  <div>
                    <label style={S.label}>Önerilen Ürünler ({itemForm.recommended_ids.length}/5)</label>
                    {itemForm.recommended_ids.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
                        {itemForm.recommended_ids.map((rid) => {
                          const recItem = items.find((it) => it.id === rid);
                          if (!recItem) return null;
                          const reasons = itemForm.recommendation_reasons[rid] || { tr: '', en: '' };
                          return (
                            <div key={rid} style={{ border: '1px solid #E5E5E3', borderRadius: 8, padding: 10, background: '#F7F7F5' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{recItem.name_tr}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next_ids = itemForm.recommended_ids.filter((x) => x !== rid);
                                    const next_reasons = { ...itemForm.recommendation_reasons };
                                    delete next_reasons[rid];
                                    setItemForm({ ...itemForm, recommended_ids: next_ids, recommendation_reasons: next_reasons });
                                  }}
                                  style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 2, display: 'inline-flex' }}
                                  title="Kaldır"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                              <input
                                style={{ ...S.input, padding: '6px 10px', fontSize: 12, marginBottom: 4 }}
                                value={reasons.tr}
                                onChange={(e) => setItemForm({ ...itemForm, recommendation_reasons: { ...itemForm.recommendation_reasons, [rid]: { ...reasons, tr: e.target.value } } })}
                                placeholder="Neden? (TR) — ör: Acılı nachos'u serinleten bir eşlik"
                              />
                              <input
                                style={{ ...S.input, padding: '6px 10px', fontSize: 12 }}
                                value={reasons.en}
                                onChange={(e) => setItemForm({ ...itemForm, recommendation_reasons: { ...itemForm.recommendation_reasons, [rid]: { ...reasons, en: e.target.value } } })}
                                placeholder="Why? (EN) — optional"
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {itemForm.recommended_ids.length < 5 && (
                      <select
                        style={S.input}
                        value=""
                        onChange={(e) => {
                          const id = e.target.value;
                          if (!id) return;
                          if (itemForm.recommended_ids.includes(id)) return;
                          setItemForm({
                            ...itemForm,
                            recommended_ids: [...itemForm.recommended_ids, id],
                            recommendation_reasons: { ...itemForm.recommendation_reasons, [id]: { tr: '', en: '' } },
                          });
                        }}
                      >
                        <option value="">+ Öneri ekle...</option>
                        {items
                          .filter((it) => it.id !== editingItem && !itemForm.recommended_ids.includes(it.id))
                          .map((it) => (
                            <option key={it.id} value={it.id}>{it.name_tr}</option>
                          ))}
                      </select>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#A0A0A0', marginTop: 4 }}><Info size={14} /><span>Ürün detayında "Yanında İyi Gider" olarak gösterilir. Max 5.</span></div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ ...S.label, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <PlusCircle size={14} /> Fiyat Varyantları
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (!confirm('Tüm varyantlar silinecek ve tek fiyata dönülecek. Devam edilsin mi?')) return;
                        const fallback = itemForm.variants[0]?.price || itemForm.price || '';
                        setItemForm({ ...itemForm, variants: [], price: fallback });
                      }}
                      style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Tek fiyata dön
                    </button>
                  </div>
                  {itemForm.variants.map((v, idx) => (
                    <div key={idx} style={{ border: '1px solid #E5E5E3', borderRadius: 8, padding: 10, background: '#F7F7F5' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#6B6B6F', textTransform: 'uppercase', letterSpacing: 0.5 }}>Varyant {idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = itemForm.variants.filter((_, i) => i !== idx);
                            setItemForm({ ...itemForm, variants: next });
                          }}
                          style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 2, display: 'inline-flex', alignItems: 'center' }}
                          title="Varyantı sil"
                          disabled={itemForm.variants.length <= 2}
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                      <div style={S.grid2}>
                        <div>
                          <label style={{ ...S.label, fontSize: 11 }}>İsim (TR) *</label>
                          <input
                            style={{ ...S.input, padding: '6px 10px', fontSize: 13 }}
                            value={v.name_tr}
                            onChange={e => {
                              const next = [...itemForm.variants];
                              next[idx] = { ...next[idx], name_tr: e.target.value };
                              setItemForm({ ...itemForm, variants: next });
                            }}
                            placeholder="Küçük"
                            required
                          />
                        </div>
                        <div>
                          <label style={{ ...S.label, fontSize: 11 }}>İsim (EN)</label>
                          <input
                            style={{ ...S.input, padding: '6px 10px', fontSize: 13 }}
                            value={v.name_en}
                            onChange={e => {
                              const next = [...itemForm.variants];
                              next[idx] = { ...next[idx], name_en: e.target.value };
                              setItemForm({ ...itemForm, variants: next });
                            }}
                            placeholder="Small"
                          />
                        </div>
                      </div>
                      <div style={{ ...S.grid2, marginTop: 6 }}>
                        <div>
                          <label style={{ ...S.label, fontSize: 11 }}>Fiyat (₺) *</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            style={{ ...S.input, padding: '6px 10px', fontSize: 13 }}
                            value={v.price}
                            onChange={e => {
                              const next = [...itemForm.variants];
                              next[idx] = { ...next[idx], price: e.target.value };
                              setItemForm({ ...itemForm, variants: next });
                            }}
                            required
                          />
                        </div>
                        <div>
                          <label style={{ ...S.label, fontSize: 11 }}>Kalori (kcal)</label>
                          <input
                            type="number"
                            style={{ ...S.input, padding: '6px 10px', fontSize: 13 }}
                            value={v.calories}
                            onChange={e => {
                              const next = [...itemForm.variants];
                              next[idx] = { ...next[idx], calories: e.target.value };
                              setItemForm({ ...itemForm, variants: next });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {itemForm.variants.length < 10 && (
                    <button
                      type="button"
                      onClick={() => setItemForm({ ...itemForm, variants: [...itemForm.variants, { name_tr: '', name_en: '', price: '', calories: '' }] })}
                      style={{ ...S.btnSm, alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11 }}
                    >
                      <PlusCircle size={14} /> Varyant Ekle
                    </button>
                  )}
                  {/* Görsel yine gerekli */}
                  <div>
                    <label style={S.label}>Görsel</label>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0]); }} />
                    {itemForm.image_url ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img onError={handleImageError} src={getOptimizedImageUrl(itemForm.image_url, 'thumbnail')} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
                        <button type="button" onClick={() => setItemForm({ ...itemForm, image_url: '' })} style={{ ...S.btnSm, padding: '3px 8px', fontSize: 11, color: '#EF4444' }}>Kaldır</button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} style={{ ...S.btnSm }}>
                        {uploading ? 'Yükleniyor...' : <><Camera size={14} /> Görsel Seç</>}
                      </button>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#A0A0A0', marginTop: 4 }}><Info size={14} /><span>1200×800px, yatay, max 5MB</span></div>
                  </div>
                </div>
              )}
              <div>
                <label style={S.label}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Timer size={16} /> Hazırlanma Süresi
                  </span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="number"
                    min={1}
                    max={999}
                    step={1}
                    placeholder="15"
                    value={itemForm.prep_time}
                    onChange={e => setItemForm({ ...itemForm, prep_time: e.target.value })}
                    style={{ ...S.input, width: 100 }}
                  />
                  <span style={{ fontSize: 13, color: '#6B6B6F' }}>dk</span>
                </div>
              </div>
              <div>
                <label style={S.label}>Alerjenler</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {ALLERGEN_OPTIONS.map(a => {
                    const selected = itemForm.allergens.includes(a.value);
                    return (
                      <button
                        key={a.value}
                        type="button"
                        onClick={() => toggleAllergen(a.value)}
                        style={{
                          padding: '6px 10px',
                          fontSize: 12,
                          borderRadius: 20,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          border: selected ? '2px solid #FF4F7A' : '1px solid #E5E5E3',
                          background: selected ? '#fdf2f8' : '#fff',
                          color: selected ? '#FF4F7A' : '#2D2D2F',
                          fontWeight: selected ? 700 : 400,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        {a.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label style={S.label}>Diyet Tercihleri</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {DIET_OPTIONS.map(a => {
                    const selected = itemForm.allergens.includes(a.value);
                    return (
                      <button
                        key={a.value}
                        type="button"
                        onClick={() => toggleAllergen(a.value)}
                        style={{
                          padding: '6px 10px',
                          fontSize: 12,
                          borderRadius: 20,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          border: selected ? '2px solid #FF4F7A' : '1px solid #E5E5E3',
                          background: selected ? '#fdf2f8' : '#fff',
                          color: selected ? '#FF4F7A' : '#2D2D2F',
                          fontWeight: selected ? 700 : 400,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        {a.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: '#2D2D2F' }}>
                  <input type="checkbox" checked={itemForm.is_new} onChange={e => setItemForm({ ...itemForm, is_new: e.target.checked })} />
                  <Star size={14} /> Yeni Ürün
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: '#2D2D2F' }}>
                  <input type="checkbox" checked={itemForm.is_featured} onChange={e => setItemForm({ ...itemForm, is_featured: e.target.checked })} />
                  <Star size={14} style={{ color: '#FF4F7A' }} /> Öne Çıkar
                </label>
              </div>
              {/* Sold-out toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: '#2D2D2F' }}>
                <input type="checkbox" checked={itemForm.is_sold_out} onChange={e => setItemForm({ ...itemForm, is_sold_out: e.target.checked })} />
                <XCircle size={14} /> Tükendi olarak işaretle
              </label>

              {/* Scheduling */}
              <div style={{ borderTop: '1px solid #E5E5E3', paddingTop: 12, marginTop: 4 }}>
                <label style={{ ...S.label, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={14} /> Zamanlama
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                  {[
                    { v: 'always', label: 'Her zaman göster' },
                    { v: 'date_range', label: 'Zaman aralığı (başlangıç – bitiş)' },
                    { v: 'periodic', label: 'Periyodik (haftalık saat aralığı)' },
                  ].map(opt => (
                    <label key={opt.v} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#2D2D2F', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="schedule_type"
                        value={opt.v}
                        checked={itemForm.schedule_type === opt.v}
                        onChange={() => setItemForm({ ...itemForm, schedule_type: opt.v as 'always' | 'date_range' | 'periodic' })}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
                {itemForm.schedule_type === 'date_range' && (
                  <div style={S.grid2}>
                    <div>
                      <label style={S.label}>Başlangıç</label>
                      <input
                        type="datetime-local"
                        style={S.input}
                        value={itemForm.schedule_start}
                        onChange={e => setItemForm({ ...itemForm, schedule_start: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={S.label}>Bitiş</label>
                      <input
                        type="datetime-local"
                        style={S.input}
                        value={itemForm.schedule_end}
                        onChange={e => setItemForm({ ...itemForm, schedule_end: e.target.value })}
                      />
                    </div>
                  </div>
                )}
                {itemForm.schedule_type === 'periodic' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {PERIODIC_DAYS.map(day => {
                      const d = itemForm.schedule_periodic[day];
                      return (
                        <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, flexWrap: 'wrap' }}>
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4, minWidth: 110 }}>
                            <input
                              type="checkbox"
                              checked={d.enabled}
                              onChange={e => setItemForm({
                                ...itemForm,
                                schedule_periodic: { ...itemForm.schedule_periodic, [day]: { ...d, enabled: e.target.checked } },
                              })}
                            />
                            {PERIODIC_DAY_LABELS[day]}
                          </label>
                          {d.enabled && (
                            <>
                              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <input
                                  type="checkbox"
                                  checked={d.all_day}
                                  onChange={e => setItemForm({
                                    ...itemForm,
                                    schedule_periodic: {
                                      ...itemForm.schedule_periodic,
                                      [day]: {
                                        ...d,
                                        all_day: e.target.checked,
                                        start: e.target.checked ? '00:00' : d.start,
                                        end: e.target.checked ? '23:59' : d.end,
                                      },
                                    },
                                  })}
                                />
                                Tüm gün
                              </label>
                              {!d.all_day && (
                                <>
                                  <input
                                    type="time"
                                    value={d.start}
                                    onChange={e => setItemForm({
                                      ...itemForm,
                                      schedule_periodic: { ...itemForm.schedule_periodic, [day]: { ...d, start: e.target.value } },
                                    })}
                                    style={{ ...S.input, width: 100, padding: '4px 8px' }}
                                  />
                                  <span>–</span>
                                  <input
                                    type="time"
                                    value={d.end}
                                    onChange={e => setItemForm({
                                      ...itemForm,
                                      schedule_periodic: { ...itemForm.schedule_periodic, [day]: { ...d, end: e.target.value } },
                                    })}
                                    style={{ ...S.input, width: 100, padding: '4px 8px' }}
                                  />
                                </>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Happy Hour (collapsible) */}
              <div style={{ borderTop: '1px solid #E5E5E3', paddingTop: 12, marginTop: 4 }}>
                <div
                  onClick={() => setItemForm({ ...itemForm, happyHourOpen: !itemForm.happyHourOpen })}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#1C1C1E' }}
                >
                  <Tag size={16} style={{ color: '#FF4F7A' }} />
                  Happy Hour
                  {itemForm.happy_hour_active && <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 400 }}>(Aktif)</span>}
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: '#999' }}>{itemForm.happyHourOpen ? '▲' : '▼'}</span>
                </div>

                {itemForm.happyHourOpen && (
                  <div style={{ padding: 12, borderRadius: 8, border: '1px solid #E5E5E3', backgroundColor: '#F7F7F5', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ fontSize: 12, color: '#666' }}>Happy Hour Aktif</label>
                      <input type="checkbox" checked={itemForm.happy_hour_active || false} onChange={e => setItemForm({ ...itemForm, happy_hour_active: e.target.checked })} />
                    </div>

                    {itemForm.happy_hour_active && (
                      <>
                        {/* Label */}
                        <div>
                          <label style={{ fontSize: 12, color: '#666', marginBottom: 4, display: 'block' }}>Etiket (opsiyonel)</label>
                          <input type="text" value={itemForm.happy_hour_label || ''} onChange={e => setItemForm({ ...itemForm, happy_hour_label: e.target.value })} placeholder="Happy Hour" style={{ ...S.input, fontSize: 13 }} />
                          <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>Boş bırakırsan "Happy Hour" yazılır</div>
                        </div>

                        {/* Price — single price mode */}
                        {itemForm.variants.length === 0 && (
                          <div>
                            <label style={{ fontSize: 12, color: '#666', marginBottom: 4, display: 'block' }}>İndirimli Fiyat (₺)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 12, color: '#999', textDecoration: 'line-through' }}>{itemForm.price} ₺</span>
                              <span style={{ fontSize: 12, color: '#999' }}>→</span>
                              <input type="number" step="0.01" min="0" value={itemForm.happy_hour_price || ''} onChange={e => setItemForm({ ...itemForm, happy_hour_price: e.target.value })} placeholder="0.00" style={{ ...S.input, width: 100, fontSize: 13 }} />
                              <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>
                                {itemForm.price && itemForm.happy_hour_price ? `%${Math.round((1 - parseFloat(String(itemForm.happy_hour_price)) / parseFloat(String(itemForm.price))) * 100)} indirim` : ''}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Price — variant mode */}
                        {itemForm.variants.length > 0 && (
                          <div>
                            <label style={{ fontSize: 12, color: '#666', marginBottom: 4, display: 'block' }}>Varyant İndirimli Fiyatları</label>
                            {itemForm.variants.map((v, idx) => (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <span style={{ fontSize: 12, color: '#666', minWidth: 80 }}>{v.name_tr}</span>
                                <span style={{ fontSize: 12, color: '#999', textDecoration: 'line-through' }}>{v.price} ₺</span>
                                <span style={{ fontSize: 12, color: '#999' }}>→</span>
                                <input type="number" step="0.01" min="0" value={(v as any).happy_hour_price || ''} onChange={e => {
                                  const updated = [...itemForm.variants];
                                  updated[idx] = { ...updated[idx], happy_hour_price: e.target.value } as any;
                                  setItemForm({ ...itemForm, variants: updated });
                                }} placeholder="0.00" style={{ ...S.input, width: 80, fontSize: 13, padding: '4px 8px' }} />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Days */}
                        <div>
                          <label style={{ fontSize: 12, color: '#666', marginBottom: 4, display: 'block' }}>Günler (boş = her gün)</label>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {[{ key: 'mon', label: 'Pzt' }, { key: 'tue', label: 'Sal' }, { key: 'wed', label: 'Çar' }, { key: 'thu', label: 'Per' }, { key: 'fri', label: 'Cum' }, { key: 'sat', label: 'Cmt' }, { key: 'sun', label: 'Paz' }].map(day => {
                              const selected = (itemForm.happy_hour_days || []).includes(day.key);
                              return (
                                <button key={day.key} type="button" onClick={() => {
                                  const current = itemForm.happy_hour_days || [];
                                  const updated = selected ? current.filter(d => d !== day.key) : [...current, day.key];
                                  setItemForm({ ...itemForm, happy_hour_days: updated.length > 0 ? updated : null });
                                }} style={{ padding: '4px 8px', fontSize: 11, borderRadius: 6, border: `1px solid ${selected ? '#FF4F7A' : '#E5E5E3'}`, backgroundColor: selected ? '#FF4F7A' : '#fff', color: selected ? '#fff' : '#666', cursor: 'pointer', fontWeight: selected ? 600 : 400 }}>
                                  {day.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Time range */}
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <div>
                            <label style={{ fontSize: 12, color: '#666', marginBottom: 4, display: 'block' }}>Başlangıç</label>
                            <input type="time" value={itemForm.happy_hour_start_time || ''} onChange={e => setItemForm({ ...itemForm, happy_hour_start_time: e.target.value })} style={{ ...S.input, fontSize: 13 }} />
                          </div>
                          <span style={{ marginTop: 20, color: '#999' }}>—</span>
                          <div>
                            <label style={{ fontSize: 12, color: '#666', marginBottom: 4, display: 'block' }}>Bitiş</label>
                            <input type="time" value={itemForm.happy_hour_end_time || ''} onChange={e => setItemForm({ ...itemForm, happy_hour_end_time: e.target.value })} style={{ ...S.input, fontSize: 13 }} />
                          </div>
                        </div>
                        <div style={{ fontSize: 10, color: '#999' }}>Gece yarısını geçebilir (örn: 22:00-02:00)</div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Nutrition Facts (collapsible) */}
              <div style={{ borderTop: '1px solid #E5E5E3', paddingTop: 12, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setItemForm({ ...itemForm, nutritionOpen: !itemForm.nutritionOpen })}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: '#1C1C1E',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
                    <Grains size={16} /> Besin Değerleri
                    {!itemForm.nutritionOpen && itemForm.nutrition.calories && (
                      <span style={{ ...S.badge, background: '#EEF2FF', color: '#4338CA', marginLeft: 6 }}>
                        {itemForm.nutrition.calories} kcal
                      </span>
                    )}
                  </span>
                  {itemForm.nutritionOpen ? <CaretCircleUp size={18} /> : <CaretCircleDown size={18} />}
                </button>
                {itemForm.nutritionOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#2D2D2F', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={itemForm.nutrition.show_on_menu}
                        onChange={e => setItemForm({ ...itemForm, nutrition: { ...itemForm.nutrition, show_on_menu: e.target.checked } })}
                      />
                      Menüde Göster
                    </label>
                    <div>
                      <label style={{ ...S.label, fontSize: 11 }}>Porsiyon Boyutu</label>
                      <input
                        style={S.input}
                        value={itemForm.nutrition.serving_size}
                        onChange={e => setItemForm({ ...itemForm, nutrition: { ...itemForm.nutrition, serving_size: e.target.value } })}
                        placeholder="Örn: 1 porsiyon (250g)"
                      />
                    </div>

                    {(() => {
                      type NutrNumKey = typeof NUTRITION_NUMERIC_KEYS[number];
                      const setNutr = (k: NutrNumKey, val: string) =>
                        setItemForm({ ...itemForm, nutrition: { ...itemForm.nutrition, [k]: val } });
                      const numField = (k: NutrNumKey, label: string, unit: string) => (
                        <div key={k}>
                          <label style={{ ...S.label, fontSize: 11 }}>{label}</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              style={{ ...S.input, padding: '6px 10px', fontSize: 13, flex: 1 }}
                              value={itemForm.nutrition[k]}
                              onChange={e => setNutr(k, e.target.value)}
                            />
                            <span style={{ fontSize: 11, color: '#6B6B6F', minWidth: 26 }}>{unit}</span>
                          </div>
                        </div>
                      );
                      const Group = ({ title, children }: { title: string; children: React.ReactNode }) => (
                        <div style={{ border: '1px solid #E5E5E3', borderRadius: 8, padding: 10, background: '#F7F7F5' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#6B6B6F', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                            {title}
                          </div>
                          <div style={S.grid2}>{children}</div>
                        </div>
                      );
                      return (
                        <>
                          <Group title="Temel">
                            {numField('calories', 'Kalori', 'kcal')}
                            {numField('calories_from_fat', 'Yağdan Kalori', 'kcal')}
                          </Group>
                          <Group title="Yağlar">
                            {numField('total_fat', 'Toplam Yağ', 'g')}
                            {numField('saturated_fat', 'Doymuş Yağ', 'g')}
                            {numField('trans_fat', 'Trans Yağ', 'g')}
                          </Group>
                          <Group title="Diğer">
                            {numField('cholesterol', 'Kolesterol', 'mg')}
                            {numField('sodium', 'Sodyum', 'mg')}
                          </Group>
                          <Group title="Karbonhidratlar">
                            {numField('total_carb', 'Toplam Karbonhidrat', 'g')}
                            {numField('dietary_fiber', 'Lif', 'g')}
                            {numField('sugars', 'Şeker', 'g')}
                          </Group>
                          <div>
                            {numField('protein', 'Protein', 'g')}
                          </div>
                          <Group title="Vitaminler & Mineraller (% GRD)">
                            {numField('vitamin_a', 'A Vitamini', '%')}
                            {numField('vitamin_c', 'C Vitamini', '%')}
                            {numField('calcium', 'Kalsiyum', '%')}
                            {numField('iron', 'Demir', '%')}
                          </Group>
                        </>
                      );
                    })()}

                    <button
                      type="button"
                      onClick={() => {
                        if (!confirm('Tüm besin değerleri silinecek. Devam edilsin mi?')) return;
                        setItemForm({ ...itemForm, nutrition: emptyNutritionDraft() });
                      }}
                      style={{ ...S.btnDanger, alignSelf: 'flex-start', fontSize: 11 }}
                    >
                      <Trash size={12} /> Besin Değerlerini Temizle
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-end', justifyContent: 'flex-end' }}>
                <button type="button" onClick={closeItemForm} disabled={saving} style={{ ...S.btnSm, padding: '8px 16px' }}>İptal</button>
                <button type="submit" disabled={saving} style={{ ...S.btn }}>{saving ? '...' : editingItem ? 'Güncelle' : 'Ekle'}</button>
              </div>
            </form>
          ); return null; })()}

          {/* ================= FineDine-style Category Accordion ================= */}
          {(() => {
            const renderItemRow = (item: MenuItem, dragListeners?: Record<string, unknown>) => {
              const allergenKeys = (item.allergens || []).filter(a => getAllergenInfo(a));
              const isTranslating = translating === item.id;
              const faded = !item.is_available || item.is_sold_out;
              const isActiveForm = showItemForm && editingItem === item.id;
              return (
                <div
                  key={item.id}
                  style={{
                    ...S.itemRow,
                    opacity: faded ? 0.6 : 1,
                    background: isActiveForm ? '#eef2ff' : hoveredItem === item.id ? adminTheme.hoverBg : adminTheme.cardBg,
                  }}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={() => handleItemClick(item)}
                >
                  {dragListeners && !isActiveForm && (
                    <span
                      {...dragListeners}
                      onClick={(e) => e.stopPropagation()}
                      style={{ cursor: 'grab', color: '#A0A0A0', display: 'inline-flex', alignItems: 'center', touchAction: 'none', flexShrink: 0 }}
                      title="Sürükleyerek sırala"
                    >
                      <Package size={16} />
                    </span>
                  )}
                  {dragListeners && isActiveForm && (
                    <span style={{ width: 16, flexShrink: 0 }} />
                  )}
                  {item.image_url ? (
                    <img onError={handleImageError} src={getOptimizedImageUrl(item.image_url, 'card')} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} loading="lazy" decoding="async" />
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: 8, background: adminTheme.pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: adminTheme.border, flexShrink: 0 }}>
                      <Camera size={20} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: adminTheme.value, textDecoration: item.is_sold_out ? 'line-through' : 'none' }}>{item.name_tr}</span>
                      {item.translations && Object.keys(item.translations).length > 0 && (
                        <span style={S.translationBadge}>EN</span>
                      )}
                      {item.is_sold_out && <span style={S.soldOutBadge}><XCircle size={10} /> Tükendi</span>}
                      {item.is_vegetarian && <span style={{ ...S.badge, background: '#DCFCE7', color: '#22C55E', marginRight: 0 }}><AppleLogo size={10} /></span>}
                      {item.is_new && <span style={{ ...S.badge, background: '#fef3c7', color: '#b45309', marginRight: 0 }}>Yeni</span>}
                      {item.is_featured && <span style={{ ...S.badge, background: '#fef3c7', color: '#b45309', marginRight: 0 }}>Öne Çıkan</span>}
                      {item.schedule_type !== 'always' && <span style={{ ...S.badge, background: '#dbeafe', color: '#1d4ed8', marginRight: 0, display: 'inline-flex', alignItems: 'center', gap: 2 }}><Clock size={10} />Zamanlı</span>}
                      {(item as any).happy_hour_active && <span style={{ ...S.badge, background: '#fffbeb', color: '#f59e0b', marginRight: 0, display: 'inline-flex', alignItems: 'center', gap: 2 }}><Tag size={10} />HH</span>}
                      {allergenKeys.length > 0 && (
                        <span style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }} title={allergenKeys.join(', ')}>
                          {allergenKeys.slice(0, 3).map(a => <AllergenIcon key={a} allergenKey={a} size={12} />)}
                        </span>
                      )}
                      {isTranslating && <span style={{ fontSize: 9, color: '#4338CA' }}><Globe size={10} /> Çevriliyor...</span>}
                    </div>
                    {item.description_tr && (
                      <div style={{ fontSize: 12, color: '#A0A0A0', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.description_tr}
                      </div>
                    )}
                  </div>
                  <div onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}>
                    {Array.isArray(item.price_variants) && item.price_variants.length > 0 ? (
                      (() => {
                        const prices = item.price_variants.map(v => Number(v.price));
                        const min = Math.min(...prices);
                        const max = Math.max(...prices);
                        return (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); startEdit(item); }}
                            title="Varyantları düzenle"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 13,
                              fontWeight: 600,
                              color: '#1C1C1E',
                              textDecoration: item.is_sold_out ? 'line-through' : 'none',
                              background: '#fff',
                              border: '1px dashed #E5E5E3',
                              borderRadius: 6,
                              padding: '4px 8px',
                              cursor: 'pointer',
                            }}
                          >
                            <Package size={13} />
                            {min.toFixed(0)} ₺ – {max.toFixed(0)} ₺
                          </button>
                        );
                      })()
                    ) : isActiveForm ? (
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#A0A0A0', padding: '4px 8px' }}>
                        {Number(item.price).toFixed(2)} ₺
                      </span>
                    ) : (
                      <InlinePrice value={Number(item.price)} isSoldOut={item.is_sold_out} onSave={(n) => updateItemPrice(item.id, n)} />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleItemAvailable(item.id, item.is_available); }}
                    style={toggleSwitchStyle(item.is_available)}
                    title={item.is_available ? 'Pasif yap' : 'Aktif yap'}
                  >
                    <span style={toggleKnobStyle(item.is_available)} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: hoveredItem === item.id ? '#EF4444' : 'transparent',
                      cursor: 'pointer',
                      padding: 4,
                      display: 'inline-flex',
                      alignItems: 'center',
                      transition: 'color 0.15s',
                      flexShrink: 0,
                    }}
                    title="Sil"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              );
            };

            const makeItemDragHandler = (catId: string) => (event: DragEndEvent) => {
              const { active, over } = event;
              if (!over || active.id === over.id) return;
              setItems(prev => {
                const inCat = prev.filter(i => i.category_id === catId);
                const others = prev.filter(i => i.category_id !== catId);
                const oldIndex = inCat.findIndex(i => i.id === active.id);
                const newIndex = inCat.findIndex(i => i.id === over.id);
                if (oldIndex < 0 || newIndex < 0) return prev;
                const reordered = arrayMove(inCat, oldIndex, newIndex);
                persistItemOrder(reordered);
                return [...others, ...reordered];
              });
            };

            const renderItemsSection = (catId: string) => {
              const catItems = items.filter(i => i.category_id === catId).sort((a, b) => a.sort_order - b.sort_order);
              const showNewFormHere = showItemForm && editingItem === null && selectedCat === catId;
              if (catItems.length === 0) {
                return (
                  <>
                    <div style={{ fontSize: 12, color: '#A0A0A0', padding: '12px 16px', fontStyle: 'italic' }}>
                      Bu kategoride henüz ürün yok.
                    </div>
                    {showNewFormHere && (
                      <div ref={formContainerRef} style={{ padding: '0 0 8px 0' }}>
                        {renderItemForm()}
                      </div>
                    )}
                  </>
                );
              }
              return (
                <>
                  <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={makeItemDragHandler(catId)}>
                    <SortableContext items={catItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                      {catItems.map(item => (
                        <Fragment key={item.id}>
                          <Sortable id={item.id}>
                            {({ setNodeRef, style, attributes, listeners }) => (
                              <div ref={setNodeRef} style={style} {...attributes}>
                                {renderItemRow(item, listeners as Record<string, unknown>)}
                              </div>
                            )}
                          </Sortable>
                          {showItemForm && editingItem === item.id && (
                            <div ref={formContainerRef} style={{ padding: '0 0 8px 0' }}>
                              {renderItemForm()}
                            </div>
                          )}
                        </Fragment>
                      ))}
                    </SortableContext>
                  </DndContext>
                  {showNewFormHere && (
                    <div ref={formContainerRef} style={{ padding: '0 0 8px 0' }}>
                      {renderItemForm()}
                    </div>
                  )}
                </>
              );
            };

            const renderCategoryHeader = (
              c: Category,
              dragListeners: Record<string, unknown> | undefined,
              opts: { isSub?: boolean } = {}
            ) => {
              const isOpen = expandedCats.has(c.id);
              const totalInScope = items.filter(i => categoryScopeIds(c.id).includes(i.category_id)).length;
              const missing = missingPhotoCounts.get(c.id) || 0;
              const isEditing = editingCat === c.id;
              return (
                <div style={{ ...S.catAccordionRow, padding: opts.isSub ? '10px 14px' : '12px 16px' }}>
                  {dragListeners && (
                    <span
                      {...dragListeners}
                      style={{ cursor: 'grab', color: '#A0A0A0', display: 'inline-flex', alignItems: 'center', touchAction: 'none', flexShrink: 0 }}
                      title="Sürükleyerek sırala"
                    >
                      <Package size={16} />
                    </span>
                  )}
                  {c.image_url ? (
                    <img onError={handleImageError} src={getOptimizedImageUrl(c.image_url, 'thumbnail')} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: adminTheme.pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: adminTheme.border, flexShrink: 0 }}>
                      <Camera size={18} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => !isEditing && toggleExpand(c.id)}>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <input style={{ ...S.input, width: 220, padding: '6px 10px', fontSize: 13 }} value={editCatForm.name_tr} onChange={e => setEditCatForm({ name_tr: e.target.value })} autoFocus />
                        <button onClick={() => updateCategory(c.id)} style={{ ...S.btnSm, padding: '4px 8px' }}><CheckCircle size={14} /></button>
                        <button onClick={() => setEditingCat(null)} style={{ ...S.btnSm, padding: '4px 8px' }}><XCircle size={14} /></button>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: opts.isSub ? 13 : 15, fontWeight: 600, color: adminTheme.value }}>{c.name_tr}</span>
                          {c.translations && Object.keys(c.translations).length > 0 && <span style={S.translationBadge}>EN</span>}
                        </div>
                        <div style={{ fontSize: 11, color: adminTheme.heading, marginTop: 2 }}>
                          {totalInScope} ürün
                          {missing > 0 && <> · <span style={S.missingPhotoWarning}>{missing} fotoğraf eksik</span></>}
                        </div>
                      </>
                    )}
                  </div>
                  {!isEditing && (
                    <div style={S.accordionActions} onClick={(e) => e.stopPropagation()}>
                      <label style={{ color: '#A0A0A0', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', padding: 4 }} title="Kategori görseli">
                        <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploadingCatImage === c.id} onChange={e => { if (e.target.files?.[0]) uploadCategoryImage(e.target.files[0], c.id); }} />
                        {uploadingCatImage === c.id ? <span style={{ fontSize: 10 }}>...</span> : <Camera size={16} />}
                      </label>
                      {c.image_url && (
                        <button onClick={() => removeCategoryImage(c.id)} style={{ background: 'none', border: 'none', color: '#A0A0A0', cursor: 'pointer', padding: 4, display: 'inline-flex', alignItems: 'center' }} title="Görseli kaldır"><Trash size={14} /></button>
                      )}
                      <button onClick={() => { setEditingCat(c.id); setEditCatForm({ name_tr: c.name_tr }); }} style={{ background: 'none', border: 'none', color: '#A0A0A0', cursor: 'pointer', padding: 4, display: 'inline-flex', alignItems: 'center' }} title="Düzenle"><PencilSimple size={16} /></button>
                      <button onClick={() => deleteCategory(c.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 4, display: 'inline-flex', alignItems: 'center' }} title="Sil"><Trash size={16} /></button>
                      <button
                        type="button"
                        onClick={() => toggleExpand(c.id)}
                        style={{ background: 'none', border: 'none', color: '#6B6B6F', cursor: 'pointer', padding: 4, display: 'inline-flex', alignItems: 'center' }}
                        title={isOpen ? 'Kapat' : 'Aç'}
                      >
                        {isOpen ? <CaretCircleUp size={20} /> : <CaretCircleDown size={20} />}
                      </button>
                    </div>
                  )}
                </div>
              );
            };

            // Search mode: flat compact list
            if (searchQuery.trim()) {
              if (filteredItems.length === 0) {
                return <div style={{ textAlign: 'center', color: adminTheme.subtle, padding: 40, fontSize: 14 }}>Eşleşen ürün bulunamadı.</div>;
              }
              return (
                <div style={{ border: `1px solid ${adminTheme.border}`, borderRadius: 12, overflow: 'hidden', background: adminTheme.cardBg }}>
                  {filteredItems.map(item => renderItemRow(item))}
                </div>
              );
            }

            const rootCats = categories.filter(c => !c.parent_id);
            if (rootCats.length === 0) {
              return <div style={{ textAlign: 'center', color: adminTheme.subtle, padding: 40, fontSize: 14 }}>Henüz kategori eklenmedi.</div>;
            }

            return (
              <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
                <SortableContext items={rootCats.map(c => c.id)} strategy={verticalListSortingStrategy}>
                  {rootCats.map(c => {
                    const isOpen = expandedCats.has(c.id);
                    const childCats = categories.filter(cc => cc.parent_id === c.id).sort((a, b) => a.sort_order - b.sort_order);
                    return (
                      <Sortable key={c.id} id={c.id}>
                        {({ setNodeRef, style, attributes, listeners }) => (
                          <div ref={setNodeRef} style={style} {...attributes}>
                            {renderCategoryHeader(c, listeners as Record<string, unknown>)}
                            {isOpen && (
                              <div style={{ marginBottom: 12 }}>
                                {childCats.length > 0 ? (
                                  <div style={S.subCatWrap}>
                                    {/* Direct items under parent (if any) */}
                                    {items.some(i => i.category_id === c.id) && (
                                      <div style={{ ...S.itemsContainer, margin: '4px 0 8px 0' }}>
                                        {renderItemsSection(c.id)}
                                      </div>
                                    )}
                                    <DndContext
                                      sensors={dndSensors}
                                      collisionDetection={closestCenter}
                                      onDragEnd={(event) => handleChildCategoryDragEnd(c.id, event)}
                                    >
                                      <SortableContext items={childCats.map(cc => cc.id)} strategy={verticalListSortingStrategy}>
                                        {childCats.map(child => {
                                          const childOpen = expandedCats.has(child.id);
                                          return (
                                            <Sortable key={child.id} id={child.id}>
                                              {({ setNodeRef: setChildRef, style: childStyle, attributes: childAttrs, listeners: childListeners }) => (
                                                <div ref={setChildRef} style={childStyle} {...childAttrs}>
                                                  {renderCategoryHeader(child, childListeners as Record<string, unknown>, { isSub: true })}
                                                  {childOpen && (
                                                    <>
                                                      <div style={{ ...S.itemsContainer, marginLeft: 0 }}>
                                                        {renderItemsSection(child.id)}
                                                      </div>
                                                      <button
                                                        onClick={() => openNewItemForm(child.id)}
                                                        style={{ ...S.btnSm, marginLeft: 0, marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                                      >
                                                        <PlusCircle size={14} /> Ürün Ekle
                                                      </button>
                                                    </>
                                                  )}
                                                </div>
                                              )}
                                            </Sortable>
                                          );
                                        })}
                                      </SortableContext>
                                    </DndContext>
                                  </div>
                                ) : (
                                  <>
                                    <div style={S.itemsContainer}>
                                      {renderItemsSection(c.id)}
                                    </div>
                                    <button
                                      onClick={() => openNewItemForm(c.id)}
                                      style={{ ...S.btnSm, marginLeft: 36, marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                    >
                                      <PlusCircle size={14} /> Ürün Ekle
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </Sortable>
                    );
                  })}
                </SortableContext>
              </DndContext>
            );
          })()}
        </>
      )}
        </div>
      </main>

      {/* Mobile bottom nav removed — replaced by hamburger sidebar drawer */}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Promos Tab Component                                               */
/* ------------------------------------------------------------------ */

const DAYS_TR = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

type PromoFormState = {
  id: string | null;
  title_tr: string;
  title_en: string;
  description_tr: string;
  description_en: string;
  image_url: string;
  cta_text_tr: string;
  cta_text_en: string;
  cta_url: string;
  is_active: boolean;
  schedule_enabled: boolean;
  schedule_start_time: string;
  schedule_end_time: string;
  schedule_days: number[];
  show_once_per_session: boolean;
};

const emptyPromoForm: PromoFormState = {
  id: null,
  title_tr: '',
  title_en: '',
  description_tr: '',
  description_en: '',
  image_url: '',
  cta_text_tr: 'Detaylar',
  cta_text_en: 'Details',
  cta_url: '',
  is_active: true,
  schedule_enabled: false,
  schedule_start_time: '00:00',
  schedule_end_time: '23:59',
  schedule_days: [0, 1, 2, 3, 4, 5, 6],
  show_once_per_session: true,
};

function PromosTab({ restaurant, theme }: { restaurant: Restaurant; theme: AdminTheme }) {
  const S = useMemo(() => makeStyles(theme), [theme]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [promoCategories, setPromoCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<PromoFormState>(emptyPromoForm);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [uploading, setUploading] = useState(false);
  const promoFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant.id]);

  async function load() {
    const [{ data: promoData }, { data: catData }] = await Promise.all([
      supabase.from('restaurant_promos').select('*').eq('restaurant_id', restaurant.id).order('sort_order'),
      supabase.from('menu_categories').select('*').eq('restaurant_id', restaurant.id).eq('is_active', true).order('sort_order'),
    ]);
    setPromos((promoData || []) as Promo[]);
    setPromoCategories((catData || []) as Category[]);
  }

  function normalizeTime(t: string): string {
    // DB may return 'HH:MM:SS'; form expects 'HH:MM'
    return (t || '').split(':').slice(0, 2).join(':').padStart(5, '0');
  }

  function startEdit(p: Promo) {
    setForm({
      id: p.id,
      title_tr: p.title_tr || '',
      title_en: p.title_en || '',
      description_tr: p.description_tr || '',
      description_en: p.description_en || '',
      image_url: p.image_url || '',
      cta_text_tr: p.cta_text_tr || 'Detaylar',
      cta_text_en: p.cta_text_en || 'Details',
      cta_url: p.cta_url || '',
      is_active: p.is_active,
      schedule_enabled: p.schedule_enabled,
      schedule_start_time: normalizeTime(p.schedule_start_time),
      schedule_end_time: normalizeTime(p.schedule_end_time),
      schedule_days: p.schedule_days || [0, 1, 2, 3, 4, 5, 6],
      show_once_per_session: p.show_once_per_session,
    });
    setShowForm(true);
  }

  function resetForm() {
    setForm(emptyPromoForm);
    setShowForm(false);
  }

  async function uploadImage(file: File) {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `${restaurant.slug}/promos/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('menu-images').upload(fileName, file, { upsert: true });
    if (error) { setMsg('Görsel yükleme hatası: ' + error.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('menu-images').getPublicUrl(fileName);
    setForm(prev => ({ ...prev, image_url: urlData.publicUrl }));
    setUploading(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      restaurant_id: restaurant.id,
      title_tr: form.title_tr,
      title_en: form.title_en || null,
      description_tr: form.description_tr || null,
      description_en: form.description_en || null,
      image_url: form.image_url || null,
      cta_text_tr: form.cta_text_tr || null,
      cta_text_en: form.cta_text_en || null,
      cta_url: form.cta_url || null,
      is_active: form.is_active,
      schedule_enabled: form.schedule_enabled,
      schedule_start_time: form.schedule_start_time,
      schedule_end_time: form.schedule_end_time,
      schedule_days: form.schedule_days,
      show_once_per_session: form.show_once_per_session,
    };
    if (form.id) {
      const { error } = await supabase.from('restaurant_promos').update(payload).eq('id', form.id);
      if (error) setMsg('Hata: ' + error.message);
      else setMsg('Promo güncellendi');
    } else {
      const { error } = await supabase.from('restaurant_promos').insert({ ...payload, sort_order: promos.length });
      if (error) setMsg('Hata: ' + error.message);
      else setMsg('Promo eklendi');
    }
    setSaving(false);
    resetForm();
    load();
    setTimeout(() => setMsg(''), 3000);
  }

  async function toggleActive(p: Promo) {
    await supabase.from('restaurant_promos').update({ is_active: !p.is_active }).eq('id', p.id);
    load();
  }

  async function remove(id: string) {
    if (!confirm('Bu promo silinecek. Emin misiniz?')) return;
    await supabase.from('restaurant_promos').delete().eq('id', id);
    load();
  }

  function toggleDay(day: number) {
    setForm(prev => ({
      ...prev,
      schedule_days: prev.schedule_days.includes(day)
        ? prev.schedule_days.filter(d => d !== day)
        : [...prev.schedule_days, day].sort(),
    }));
  }

  return (
    <div>
      {msg && (
        <div style={{ padding: '10px 14px', background: msg.includes('Hata') ? '#FEE2E2' : '#DCFCE7', border: `1px solid ${msg.includes('Hata') ? '#FECACA' : '#DCFCE7'}`, borderRadius: 8, color: msg.includes('Hata') ? '#EF4444' : '#22C55E', fontSize: 13, marginBottom: 16, cursor: 'pointer' }} onClick={() => setMsg('')}>
          {msg} <span style={{ float: 'right' }}>✕</span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1C1C1E' }}>Promosyonlar</h3>
        <button onClick={() => { if (showForm) resetForm(); else { setForm(emptyPromoForm); setShowForm(true); } }} style={S.btnSm}>
          {showForm ? 'İptal' : '+ Yeni Promo'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={save} style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Image */}
          <div>
            <label style={S.label}>Promo Görseli</label>
            <input ref={promoFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) uploadImage(e.target.files[0]); }} />
            {form.image_url ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <img onError={handleImageError} src={getOptimizedImageUrl(form.image_url, 'card')} alt="" style={{ width: 120, height: 72, borderRadius: 8, objectFit: 'cover', border: '1px solid #E5E5E3' }} />
                <button type="button" onClick={() => promoFileRef.current?.click()} disabled={uploading} style={S.btnSm}>{uploading ? '...' : 'Değiştir'}</button>
                <button type="button" onClick={() => setForm({ ...form, image_url: '' })} style={S.btnDanger}><Trash size={12} /></button>
              </div>
            ) : (
              <button type="button" onClick={() => promoFileRef.current?.click()} disabled={uploading} style={{ ...S.btnSm, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Camera size={14} /> {uploading ? 'Yükleniyor...' : 'Görsel Yükle'}
              </button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#A0A0A0', marginTop: 4 }}><Info size={14} /><span>1080×1080px, kare, max 5MB</span></div>
          </div>

          <div style={S.grid2}>
            <div>
              <label style={S.label}>Başlık (TR) *</label>
              <input style={S.input} value={form.title_tr} onChange={e => setForm({ ...form, title_tr: e.target.value })} required placeholder="Happy Hour!" />
            </div>
            <div>
              <label style={S.label}>Başlık (EN)</label>
              <input style={S.input} value={form.title_en} onChange={e => setForm({ ...form, title_en: e.target.value })} placeholder="Happy Hour!" />
            </div>
          </div>

          <div style={S.grid2}>
            <div>
              <label style={S.label}>Açıklama (TR)</label>
              <input style={S.input} value={form.description_tr} onChange={e => setForm({ ...form, description_tr: e.target.value })} placeholder="Tüm içeceklerde %30 indirim" />
            </div>
            <div>
              <label style={S.label}>Açıklama (EN)</label>
              <input style={S.input} value={form.description_en} onChange={e => setForm({ ...form, description_en: e.target.value })} placeholder="30% off all drinks" />
            </div>
          </div>

          <div style={S.grid3}>
            <div>
              <label style={S.label}>CTA Metin (TR)</label>
              <input style={S.input} value={form.cta_text_tr} onChange={e => setForm({ ...form, cta_text_tr: e.target.value })} placeholder="Detaylar" />
            </div>
            <div>
              <label style={S.label}>CTA Metin (EN)</label>
              <input style={S.input} value={form.cta_text_en} onChange={e => setForm({ ...form, cta_text_en: e.target.value })} placeholder="Details" />
            </div>
            <div>
              <label style={S.label}>CTA Yönlendirme</label>
              <select
                style={S.input}
                value={form.cta_url}
                onChange={e => setForm({ ...form, cta_url: e.target.value })}
              >
                <option value="">Popup'ı kapat (yönlendirme yok)</option>
                {promoCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.name_tr}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Schedule */}
          <div style={{ borderTop: '1px solid #F7F7F5', paddingTop: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: '#2D2D2F', fontWeight: 600 }}>
              <input type="checkbox" checked={form.schedule_enabled} onChange={e => setForm({ ...form, schedule_enabled: e.target.checked })} />
              Saat Planlaması
            </label>
            {form.schedule_enabled && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={S.grid2}>
                  <div>
                    <label style={S.label}>Başlangıç</label>
                    <input type="time" style={S.input} value={form.schedule_start_time} onChange={e => setForm({ ...form, schedule_start_time: e.target.value })} />
                  </div>
                  <div>
                    <label style={S.label}>Bitiş</label>
                    <input type="time" style={S.input} value={form.schedule_end_time} onChange={e => setForm({ ...form, schedule_end_time: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label style={S.label}>Günler</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {DAYS_TR.map((label, idx) => {
                      const selected = form.schedule_days.includes(idx);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => toggleDay(idx)}
                          style={{
                            padding: '6px 12px',
                            fontSize: 12,
                            borderRadius: 20,
                            cursor: 'pointer',
                            border: selected ? '2px solid #22C55E' : '1px solid #E5E5E3',
                            background: selected ? '#DCFCE7' : '#fff',
                            color: selected ? '#22C55E' : '#2D2D2F',
                            fontWeight: selected ? 700 : 400,
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: '#2D2D2F' }}>
              <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
              Aktif
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: '#2D2D2F' }}>
              <input type="checkbox" checked={form.show_once_per_session} onChange={e => setForm({ ...form, show_once_per_session: e.target.checked })} />
              Session başına bir kez göster
            </label>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" disabled={saving} style={S.btn}>{saving ? '...' : form.id ? 'Güncelle' : 'Kaydet'}</button>
            <button type="button" onClick={resetForm} style={S.btnSm}>İptal</button>
          </div>
        </form>
      )}

      {promos.length === 0 && !showForm && (
        <div style={{ textAlign: 'center', color: '#A0A0A0', padding: 40, fontSize: 14 }}>
          Henüz promo eklenmedi.
        </div>
      )}

      {promos.map(p => (
        <div key={p.id} style={{ ...S.card, opacity: p.is_active ? 1 : 0.55 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            {p.image_url ? (
              <img onError={handleImageError} src={getOptimizedImageUrl(p.image_url, 'card')} alt="" style={{ width: 84, height: 56, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 84, height: 56, borderRadius: 8, background: '#F7F7F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Image size={24} style={{ color: '#A0A0A0' }} />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#1C1C1E' }}>{p.title_tr}</div>
              {p.description_tr && <div style={{ fontSize: 13, color: '#6B6B6F', marginTop: 2 }}>{p.description_tr}</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ ...S.badge, background: p.is_active ? '#DCFCE7' : '#FEE2E2', color: p.is_active ? '#22C55E' : '#EF4444' }}>
                  {p.is_active ? 'Aktif' : 'Pasif'}
                </span>
                {p.schedule_enabled && (
                  <span style={{ fontSize: 11, color: '#6B6B6F' }}>
                    {normalizeTime(p.schedule_start_time)} - {normalizeTime(p.schedule_end_time)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10, borderTop: '1px solid #F7F7F5', paddingTop: 10 }}>
            <button onClick={() => toggleActive(p)} style={{ ...S.btnSm, color: p.is_active ? '#22C55E' : '#EF4444' }}>
              {p.is_active ? 'Aktif' : 'Pasif'}
            </button>
            <button onClick={() => startEdit(p)} style={S.btnSm}>Düzenle</button>
            <button onClick={() => remove(p.id)} style={S.btnDanger}>Sil</button>
          </div>
        </div>
      ))}
    </div>
  );
}
