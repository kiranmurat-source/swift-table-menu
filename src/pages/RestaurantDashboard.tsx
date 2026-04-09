import { useEffect, useState, useRef, Fragment, lazy, Suspense, ReactNode, CSSProperties } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';
import { CiCamera, CiEdit, CiCircleCheck, CiCircleRemove, CiApple, CiStar, CiGlobe, CiPen, CiGrid2H, CiUser, CiImageOn, CiTrash, CiLink, CiBoxes, CiCircleChevDown, CiCircleChevUp, CiCirclePlus, CiClock1, CiWheat, CiTimer } from 'react-icons/ci';
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
const RichTextEditor = lazy(() => import('../components/RichTextEditor'));
import { CategoryTabSkeleton, ListSkeleton } from '../components/Skeleton';
import { getOptimizedImageUrl, handleImageError } from '../lib/imageUtils';
import { ALLERGEN_LIST, getAllergenInfo } from '../lib/allergens';
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
  image_url: string | null; is_available: boolean; is_popular: boolean; sort_order: number;
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
  address: string | null; phone: string | null; tagline: string | null;
  description_tr: string | null; theme_color: string | null;
  social_instagram: string | null; social_facebook: string | null;
  social_x: string | null; social_tiktok: string | null; social_website: string | null;
  social_whatsapp: string | null; social_google_maps: string | null;
  working_hours: Record<string, { open: string; close: string; closed: boolean }> | null;
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

const ALLERGEN_OPTIONS = ALLERGEN_LIST.map(a => ({ value: a.key, label: a.label_tr }));

const SUPABASE_URL = 'https://qmnrawqvkwehufebbkxp.supabase.co';

const S: Record<string, React.CSSProperties> = {
  wrap: { maxWidth: 900, margin: '0 auto', padding: '32px 24px' },
  card: { background: '#fff', border: '1px solid #e7e5e4', borderRadius: 12, padding: 20, marginBottom: 12 },
  input: { width: '100%', padding: '10px 14px', fontSize: 14, border: '1px solid #d6d3d1', borderRadius: 8, outline: 'none', background: '#fff', boxSizing: 'border-box' as const },
  btn: { padding: '10px 20px', fontSize: 13, fontWeight: 700, color: '#fff', background: '#1c1917', border: 'none', borderRadius: 8, cursor: 'pointer' },
  btnSm: { padding: '6px 14px', fontSize: 12, fontWeight: 600, border: '1px solid #d6d3d1', borderRadius: 6, cursor: 'pointer', background: '#fff', color: '#44403c' },
  btnDanger: { padding: '6px 14px', fontSize: 12, fontWeight: 600, border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', background: '#fff', color: '#dc2626' },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#44403c', marginBottom: 6 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 },
  badge: { fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, display: 'inline-block', marginRight: 4 },
  // FineDine-style accordion & compact rows
  catAccordionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    background: '#fff',
    borderRadius: 12,
    border: '1px solid #e7e5e4',
    marginBottom: 8,
    transition: 'all 0.15s',
  },
  subCatWrap: {
    marginLeft: 24,
    borderLeft: '2px solid #e7e5e4',
    paddingLeft: 12,
  },
  itemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 12px',
    borderBottom: '1px solid #f5f5f4',
    background: '#fff',
    cursor: 'pointer',
    transition: 'background 0.1s',
  },
  itemsContainer: {
    background: '#fafafa',
    border: '1px solid #e7e5e4',
    borderRadius: 8,
    margin: '4px 0 12px 36px',
    padding: '4px 0',
    overflow: 'hidden',
  },
  inlinePriceBox: {
    width: 110,
    padding: '6px 10px',
    border: '1px solid #d6d3d1',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    textAlign: 'right' as const,
    fontFamily: 'Inter, sans-serif',
    background: '#fff',
    outline: 'none',
  },
  soldOutBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
    padding: '2px 8px',
    background: '#fee2e2',
    color: '#dc2626',
    borderRadius: 12,
    fontSize: 10,
    fontWeight: 600,
  },
  translationBadge: {
    display: 'inline-flex',
    padding: '1px 6px',
    background: '#EEF2FF',
    color: '#4338CA',
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 600,
  },
  missingPhotoWarning: {
    fontSize: 11,
    color: '#dc2626',
    fontWeight: 500,
  },
  accordionActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginLeft: 'auto',
  },
};

// Toggle switch style helpers
const toggleSwitchStyle = (on: boolean): React.CSSProperties => ({
  position: 'relative',
  display: 'inline-block',
  width: 36,
  height: 20,
  borderRadius: 999,
  background: on ? '#16a34a' : '#d6d3d1',
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
          style={{ width: 80, padding: '4px 8px', fontSize: 14, fontWeight: 700, border: '1px solid #1c1917', borderRadius: 6, outline: 'none' }}
        />
        <span style={{ fontSize: 14, color: '#1c1917', fontWeight: 700 }}>₺</span>
        {saving && <span style={{ fontSize: 10, color: '#78716c' }}>...</span>}
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
        color: '#1c1917',
        background: 'none',
        border: '1px dashed transparent',
        borderRadius: 4,
        padding: '2px 6px',
        cursor: 'pointer',
        textDecoration: isSoldOut ? 'line-through' : 'none',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#d6d3d1')}
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
  name_tr: '', description_tr: '', price: '', image_url: '',
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

function ProfileTab({ restaurant, onUpdate }: { restaurant: Restaurant; onUpdate: (r: Restaurant) => void }) {
  const [currentTheme, setCurrentTheme] = useState<string>(restaurant.theme_color || 'white');
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
      working_hours: workingHours,
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
        working_hours: workingHours,
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

  const coverImage = restaurant.cover_image_url || restaurant.cover_url;

  return (
    <div>
      {msg && (
        <div style={{ padding: '10px 14px', background: msg.includes('Hata') ? '#fef2f2' : '#f0fdf4', border: `1px solid ${msg.includes('Hata') ? '#fecaca' : '#bbf7d0'}`, borderRadius: 8, color: msg.includes('Hata') ? '#dc2626' : '#16a34a', fontSize: 13, marginBottom: 16, cursor: 'pointer' }} onClick={() => setMsg('')}>
          {msg} <span style={{ float: 'right' }}>✕</span>
        </div>
      )}

      {/* Images Section */}
      <div style={S.card}>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: '#1c1917', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
          <CiImageOn size={16} /> Gorseller
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <label style={{ ...S.label, marginBottom: 10 }}>Logo</label>
            <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) uploadImage(e.target.files[0], 'logo'); }} />
            {restaurant.logo_url ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <img onError={handleImageError} src={getOptimizedImageUrl(restaurant.logo_url, 'card')} alt="Logo" style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover', border: '1px solid #e7e5e4' }} />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" onClick={() => logoRef.current?.click()} disabled={uploadingLogo} style={{ ...S.btnSm, fontSize: 11, padding: '4px 10px' }}>{uploadingLogo ? '...' : 'Degistir'}</button>
                  <button type="button" onClick={() => removeImage('logo')} style={{ ...S.btnDanger, fontSize: 11, padding: '4px 10px' }}><CiTrash size={12} /></button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => logoRef.current?.click()} disabled={uploadingLogo} style={{ ...S.btnSm, width: '100%', padding: '20px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: '#a8a29e' }}>
                <CiCamera size={24} />
                <span style={{ fontSize: 12 }}>{uploadingLogo ? 'Yukleniyor...' : 'Logo Yukle'}</span>
              </button>
            )}
          </div>
          <div>
            <label style={{ ...S.label, marginBottom: 10 }}>Kapak Gorseli</label>
            <input ref={coverRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) uploadImage(e.target.files[0], 'cover'); }} />
            {coverImage ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <img onError={handleImageError} src={getOptimizedImageUrl(coverImage, 'detail')} alt="Cover" style={{ width: '100%', height: 80, borderRadius: 8, objectFit: 'cover', border: '1px solid #e7e5e4' }} />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" onClick={() => coverRef.current?.click()} disabled={uploadingCover} style={{ ...S.btnSm, fontSize: 11, padding: '4px 10px' }}>{uploadingCover ? '...' : 'Degistir'}</button>
                  <button type="button" onClick={() => removeImage('cover')} style={{ ...S.btnDanger, fontSize: 11, padding: '4px 10px' }}><CiTrash size={12} /></button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => coverRef.current?.click()} disabled={uploadingCover} style={{ ...S.btnSm, width: '100%', padding: '20px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: '#a8a29e' }}>
                <CiCamera size={24} />
                <span style={{ fontSize: 12 }}>{uploadingCover ? 'Yukleniyor...' : 'Kapak Yukle'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Info Form */}
      <form onSubmit={handleSave} style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: '#1c1917', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
          <CiUser size={16} /> Isletme Bilgileri
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
        <h4 style={{ fontSize: 14, fontWeight: 600, color: '#1c1917', marginTop: 8, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
          <CiLink size={16} /> Sosyal Medya
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

        {/* Working Hours */}
        <h4 style={{ fontSize: 14, fontWeight: 600, color: '#1c1917', marginTop: 8, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
          <CiGlobe size={16} /> Çalışma Saatleri
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {DAY_KEYS.map(day => {
            const dh = workingHours[day] || { ...DEFAULT_DAY };
            return (
              <div key={day} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 1fr auto', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#44403c', fontWeight: 500 }}>{DAY_LABELS[day]}</span>
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
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#78716c', cursor: 'pointer' }}>
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

        {/* Theme Selector */}
        <h4 style={{ fontSize: 14, fontWeight: 600, color: '#1c1917', marginTop: 8, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
          <CiBoxes size={16} /> Menü Teması
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
                  border: selected ? '2px solid #1c1917' : '1px solid #d6d3d1',
                  boxShadow: selected ? '0 0 0 2px #fff, 0 0 0 4px #1c1917' : 'none',
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
        <p style={{ fontSize: 11, color: '#78716c', margin: 0 }}>
          Tema sadece müşterilerinizin göreceği genel menü sayfasını etkiler.
        </p>

        {/* Menu Preview Link */}
        <div style={{ padding: '10px 14px', background: '#f5f5f4', borderRadius: 8, fontSize: 13, color: '#78716c' }}>
          Menu linkiniz:{' '}
          <a href={`/menu/${restaurant.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: '#A8B977', fontWeight: 600 }}>
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
  const { user } = useAuth();
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
  const [msg, setMsg] = useState('');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editCatForm, setEditCatForm] = useState({ name_tr: '' });
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'menu' | 'translations' | 'qr' | 'profile' | 'promos'>('menu');
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
          is_vegetarian: itemForm.is_vegetarian,
          calories: itemForm.nutrition.calories ? parseInt(itemForm.nutrition.calories) : null,
        }),
      });
      const data = await res.json();
      if (data.success && data.description) {
        setItemForm(prev => ({ ...prev, description_tr: data.description }));
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
      calories: caloriesForDb,
      allergens: itemForm.allergens.length > 0 ? itemForm.allergens : null,
      is_vegetarian: itemForm.is_vegetarian,
      is_new: itemForm.is_new,
      is_featured: itemForm.is_featured,
      is_sold_out: itemForm.is_sold_out,
      schedule_type: itemForm.schedule_type,
      schedule_start: itemForm.schedule_type === 'date_range' && itemForm.schedule_start ? itemForm.schedule_start : null,
      schedule_end: itemForm.schedule_type === 'date_range' && itemForm.schedule_end ? itemForm.schedule_end : null,
      schedule_periodic: itemForm.schedule_type === 'periodic' ? itemForm.schedule_periodic : {},
      sort_order: newSortOrder,
    };

    let savedId = editingItem;

    if (editingItem) {
      const { sort_order, ...updatePayload } = payload;
      await supabase.from('menu_items').update(updatePayload).eq('id', editingItem);
    } else {
      const { data: newItem } = await supabase.from('menu_items').insert({ ...payload, translations: {} }).select().single();
      if (newItem) savedId = newItem.id;
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

  function startEdit(item: MenuItem) {
    setEditingItem(item.id);
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
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1c1917', marginBottom: 8 }}>Restoran Atanmadı</h2>
      <p style={{ fontSize: 14, color: '#78716c' }}>Hesabınıza henüz bir restoran atanmamış. Lütfen yönetici ile iletişime geçin.</p>
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

  const sidebarItems = [
    { key: 'menu', label: 'Menü', icon: CiEdit },
    { key: 'translations', label: 'Çeviri Merkezi', icon: CiGlobe },
    { key: 'qr', label: 'QR Kodları', icon: CiGrid2H },
    { key: 'promos', label: 'Promosyonlar', icon: CiStar },
    { key: 'profile', label: 'Profil', icon: CiUser },
  ] as const;

  // Inline item form renderer. Assigned during render by the IIFE below so we
  // can keep the large JSX tree in-place while calling it from inside the
  // category accordion.
  let renderItemForm: () => ReactNode = () => null;

  return (
    <div className="flex min-h-screen bg-white">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[220px] shrink-0 border-r border-gray-200 bg-[#fafafa] sticky top-0 self-start min-h-screen">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {restaurant.logo_url && (
              <img onError={handleImageError} src={getOptimizedImageUrl(restaurant.logo_url, 'thumbnail')} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
            )}
            <div className="min-w-0">
              <p className="font-semibold text-sm text-stone-900 truncate">{restaurant.name}</p>
              <p className="text-xs text-stone-500">Restoran Yönetimi</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors border-l-[3px] ${
                  active
                    ? 'bg-gray-100 text-stone-900 font-semibold border-rose-600'
                    : 'text-stone-500 hover:bg-gray-50 hover:text-stone-700 border-transparent'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <p className="text-xs text-stone-400">Powered by Tabbled</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 pb-24 md:pb-0">
        <div style={S.wrap}>
          <h2 className="md:hidden" style={{ fontSize: 22, fontWeight: 700, color: '#1c1917', marginBottom: 4 }}>{restaurant.name}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <p className="md:hidden" style={{ fontSize: 13, color: '#a8a29e', margin: 0 }}>Restoran Yönetimi</p>
            {enabledLangs.length > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#4338CA', background: '#EEF2FF', padding: '2px 8px', borderRadius: 12 }}>
                <CiGlobe size={12} /> {enabledLangs.map(l => l.toUpperCase()).join(', ')}
              </span>
            )}
            {hasAI && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#9333EA', background: '#F3E8FF', padding: '2px 8px', borderRadius: 12 }}>
                <CiPen size={12} /> AI Açıklama
              </span>
            )}
          </div>

          {activeTab === 'profile' && <ProfileTab restaurant={restaurant} onUpdate={(r) => setRestaurant(r)} />}
      {activeTab === 'qr' && <QRManager restaurant={restaurant} />}
      {activeTab === 'promos' && <PromosTab restaurant={restaurant} />}
      {activeTab === 'translations' && (
        <TranslationCenter
          restaurantId={restaurant.id}
          enabledLanguages={restaurant.enabled_languages ?? ['tr']}
          onEnabledLanguagesChange={(langs) =>
            setRestaurant({ ...restaurant, enabled_languages: langs })
          }
        />
      )}

      {activeTab === 'menu' && (
        <>
          {translating && (
            <div style={{ padding: '8px 14px', background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 8, color: '#4338CA', fontSize: 12, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CiGlobe size={14} /> Çeviriler oluşturuluyor...
            </div>
          )}

          {msg && <div style={{ padding: '10px 14px', background: msg.includes('oluşturuldu') ? '#f0fdf4' : '#fef2f2', border: `1px solid ${msg.includes('oluşturuldu') ? '#bbf7d0' : '#fecaca'}`, borderRadius: 8, color: msg.includes('oluşturuldu') ? '#16a34a' : '#dc2626', fontSize: 13, marginBottom: 16 }} onClick={() => setMsg('')}>{msg} <span style={{ float: 'right', cursor: 'pointer' }}>✕</span></div>}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1c1917' }}>Kategoriler</h3>
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
                    <img onError={handleImageError} src={getOptimizedImageUrl(catForm.image_url, 'thumbnail')} alt="" style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', border: '1px solid #e7e5e4' }} />
                    <button type="button" onClick={() => catFileRef.current?.click()} disabled={uploadingCatImage === 'new'} style={{ ...S.btnSm, fontSize: 11 }}>{uploadingCatImage === 'new' ? '...' : 'Değiştir'}</button>
                    <button type="button" onClick={() => setCatForm({ ...catForm, image_url: '' })} style={{ ...S.btnDanger, fontSize: 11 }}><CiTrash size={12} /></button>
                  </div>
                ) : (
                  <button type="button" onClick={() => catFileRef.current?.click()} disabled={uploadingCatImage === 'new'} style={{ ...S.btnSm, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <CiCamera size={14} /> {uploadingCatImage === 'new' ? 'Yükleniyor...' : 'Görsel Yükle'}
                  </button>
                )}
              </div>
              <button type="submit" disabled={saving} style={{ ...S.btn, alignSelf: 'flex-start' }}>{saving ? '...' : 'Ekle'}</button>
            </form>
          )}

          {/* Summary line */}
          <div style={{ fontSize: 13, color: '#78716c', marginBottom: 10 }}>
            Toplam: <b style={{ color: '#1c1917' }}>{items.length}</b> ürün
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
            <form onSubmit={addOrUpdateItem} style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: 10, background: '#fafaf9', borderLeft: '3px solid #1c1917' }}>
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
                <label style={S.label}>Açıklama</label>
                <Suspense fallback={
                  <div style={{ ...S.input, minHeight: 112, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a8a29e', fontSize: 12 }}>
                    Editör yükleniyor...
                  </div>
                }>
                  <RichTextEditor
                    content={itemForm.description_tr}
                    onChange={(html) => setItemForm({ ...itemForm, description_tr: html })}
                    placeholder="Kısa bir açıklama yazın veya AI ile oluşturun"
                    minHeight={80}
                    rightSlot={hasAI ? (
                      <button
                        type="button"
                        onClick={generateAIDescription}
                        disabled={generatingAI || !itemForm.name_tr}
                        style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer', border: 'none', background: generatingAI ? '#E9D5FF' : '#9333EA', color: '#fff', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s', opacity: !itemForm.name_tr ? 0.5 : 1 }}
                        title="AI ile açıklama oluştur"
                      >
                        <CiPen size={12} /> {generatingAI ? 'Yazılıyor...' : 'AI Yaz'}
                      </button>
                    ) : undefined}
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
                      <CiCirclePlus size={14} /> Varyant Ekle (Boyut)
                    </button>
                  </div>
                  <div>
                    <label style={S.label}>Görsel</label>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0]); }} />
                    {itemForm.image_url ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img onError={handleImageError} src={getOptimizedImageUrl(itemForm.image_url, 'thumbnail')} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
                        <button type="button" onClick={() => setItemForm({ ...itemForm, image_url: '' })} style={{ ...S.btnSm, padding: '3px 8px', fontSize: 11, color: '#dc2626' }}>Kaldır</button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} style={{ ...S.btnSm, width: '100%' }}>
                        {uploading ? 'Yükleniyor...' : <><CiCamera size={14} /> Görsel Seç</>}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ ...S.label, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CiCirclePlus size={14} /> Fiyat Varyantları
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (!confirm('Tüm varyantlar silinecek ve tek fiyata dönülecek. Devam edilsin mi?')) return;
                        const fallback = itemForm.variants[0]?.price || itemForm.price || '';
                        setItemForm({ ...itemForm, variants: [], price: fallback });
                      }}
                      style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Tek fiyata dön
                    </button>
                  </div>
                  {itemForm.variants.map((v, idx) => (
                    <div key={idx} style={{ border: '1px solid #e7e5e4', borderRadius: 8, padding: 10, background: '#fafaf9' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#78716c', textTransform: 'uppercase', letterSpacing: 0.5 }}>Varyant {idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = itemForm.variants.filter((_, i) => i !== idx);
                            setItemForm({ ...itemForm, variants: next });
                          }}
                          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 2, display: 'inline-flex', alignItems: 'center' }}
                          title="Varyantı sil"
                          disabled={itemForm.variants.length <= 2}
                        >
                          <CiTrash size={14} />
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
                      <CiCirclePlus size={14} /> Varyant Ekle
                    </button>
                  )}
                  {/* Görsel yine gerekli */}
                  <div>
                    <label style={S.label}>Görsel</label>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0]); }} />
                    {itemForm.image_url ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img onError={handleImageError} src={getOptimizedImageUrl(itemForm.image_url, 'thumbnail')} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
                        <button type="button" onClick={() => setItemForm({ ...itemForm, image_url: '' })} style={{ ...S.btnSm, padding: '3px 8px', fontSize: 11, color: '#dc2626' }}>Kaldır</button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} style={{ ...S.btnSm }}>
                        {uploading ? 'Yükleniyor...' : <><CiCamera size={14} /> Görsel Seç</>}
                      </button>
                    )}
                  </div>
                </div>
              )}
              <div>
                <label style={S.label}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <CiTimer size={16} /> Hazırlanma Süresi
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
                  <span style={{ fontSize: 13, color: '#78716c' }}>dk</span>
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
                          border: selected ? '2px solid #16a34a' : '1px solid #d6d3d1',
                          background: selected ? '#dcfce7' : '#fff',
                          color: selected ? '#16a34a' : '#44403c',
                          fontWeight: selected ? 700 : 400,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <AllergenIcon allergenKey={a.value} size={16} />
                        {a.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: '#44403c' }}>
                  <input type="checkbox" checked={itemForm.is_vegetarian} onChange={e => setItemForm({ ...itemForm, is_vegetarian: e.target.checked })} />
                  <CiApple size={14} /> Vejetaryen
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: '#44403c' }}>
                  <input type="checkbox" checked={itemForm.is_new} onChange={e => setItemForm({ ...itemForm, is_new: e.target.checked })} />
                  <CiStar size={14} /> Yeni Ürün
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: '#44403c' }}>
                  <input type="checkbox" checked={itemForm.is_featured} onChange={e => setItemForm({ ...itemForm, is_featured: e.target.checked })} />
                  <CiStar size={14} style={{ color: '#f59e0b' }} /> Öne Çıkar
                </label>
              </div>
              {/* Sold-out toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: '#44403c' }}>
                <input type="checkbox" checked={itemForm.is_sold_out} onChange={e => setItemForm({ ...itemForm, is_sold_out: e.target.checked })} />
                <CiCircleRemove size={14} /> Tükendi olarak işaretle
              </label>

              {/* Scheduling */}
              <div style={{ borderTop: '1px solid #e7e5e4', paddingTop: 12, marginTop: 4 }}>
                <label style={{ ...S.label, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CiClock1 size={14} /> Zamanlama
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                  {[
                    { v: 'always', label: 'Her zaman göster' },
                    { v: 'date_range', label: 'Zaman aralığı (başlangıç – bitiş)' },
                    { v: 'periodic', label: 'Periyodik (haftalık saat aralığı)' },
                  ].map(opt => (
                    <label key={opt.v} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#44403c', cursor: 'pointer' }}>
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

              {/* Nutrition Facts (collapsible) */}
              <div style={{ borderTop: '1px solid #e7e5e4', paddingTop: 12, marginTop: 4 }}>
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
                    color: '#1c1917',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
                    <CiWheat size={16} /> Besin Değerleri
                    {!itemForm.nutritionOpen && itemForm.nutrition.calories && (
                      <span style={{ ...S.badge, background: '#EEF2FF', color: '#4338CA', marginLeft: 6 }}>
                        {itemForm.nutrition.calories} kcal
                      </span>
                    )}
                  </span>
                  {itemForm.nutritionOpen ? <CiCircleChevUp size={18} /> : <CiCircleChevDown size={18} />}
                </button>
                {itemForm.nutritionOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#44403c', cursor: 'pointer' }}>
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
                            <span style={{ fontSize: 11, color: '#78716c', minWidth: 26 }}>{unit}</span>
                          </div>
                        </div>
                      );
                      const Group = ({ title, children }: { title: string; children: React.ReactNode }) => (
                        <div style={{ border: '1px solid #e7e5e4', borderRadius: 8, padding: 10, background: '#fafaf9' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#78716c', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
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
                      <CiTrash size={12} /> Besin Değerlerini Temizle
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
                    background: isActiveForm ? '#eef2ff' : hoveredItem === item.id ? '#fafafa' : '#fff',
                  }}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={() => handleItemClick(item)}
                >
                  {dragListeners && !isActiveForm && (
                    <span
                      {...dragListeners}
                      onClick={(e) => e.stopPropagation()}
                      style={{ cursor: 'grab', color: '#a8a29e', display: 'inline-flex', alignItems: 'center', touchAction: 'none', flexShrink: 0 }}
                      title="Sürükleyerek sırala"
                    >
                      <CiBoxes size={16} />
                    </span>
                  )}
                  {dragListeners && isActiveForm && (
                    <span style={{ width: 16, flexShrink: 0 }} />
                  )}
                  {item.image_url ? (
                    <img onError={handleImageError} src={getOptimizedImageUrl(item.image_url, 'card')} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} loading="lazy" decoding="async" />
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: 8, background: '#f5f5f4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d6d3d1', flexShrink: 0 }}>
                      <CiCamera size={20} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: '#1c1917', textDecoration: item.is_sold_out ? 'line-through' : 'none' }}>{item.name_tr}</span>
                      {item.translations && Object.keys(item.translations).length > 0 && (
                        <span style={S.translationBadge}>EN</span>
                      )}
                      {item.is_sold_out && <span style={S.soldOutBadge}><CiCircleRemove size={10} /> Tükendi</span>}
                      {item.is_vegetarian && <span style={{ ...S.badge, background: '#dcfce7', color: '#16a34a', marginRight: 0 }}><CiApple size={10} /></span>}
                      {item.is_new && <span style={{ ...S.badge, background: '#fef3c7', color: '#b45309', marginRight: 0 }}>Yeni</span>}
                      {item.is_featured && <span style={{ ...S.badge, background: '#fef3c7', color: '#b45309', marginRight: 0 }}>Öne Çıkan</span>}
                      {item.schedule_type !== 'always' && <span style={{ ...S.badge, background: '#dbeafe', color: '#1d4ed8', marginRight: 0, display: 'inline-flex', alignItems: 'center', gap: 2 }}><CiClock1 size={10} />Zamanlı</span>}
                      {allergenKeys.length > 0 && (
                        <span style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }} title={allergenKeys.join(', ')}>
                          {allergenKeys.slice(0, 3).map(a => <AllergenIcon key={a} allergenKey={a} size={12} />)}
                        </span>
                      )}
                      {isTranslating && <span style={{ fontSize: 9, color: '#4338CA' }}><CiGlobe size={10} /> Çevriliyor...</span>}
                    </div>
                    {item.description_tr && (
                      <div style={{ fontSize: 12, color: '#a8a29e', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                              color: '#1c1917',
                              textDecoration: item.is_sold_out ? 'line-through' : 'none',
                              background: '#fff',
                              border: '1px dashed #d6d3d1',
                              borderRadius: 6,
                              padding: '4px 8px',
                              cursor: 'pointer',
                            }}
                          >
                            <CiBoxes size={13} />
                            {min.toFixed(0)} ₺ – {max.toFixed(0)} ₺
                          </button>
                        );
                      })()
                    ) : isActiveForm ? (
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#a8a29e', padding: '4px 8px' }}>
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
                      color: hoveredItem === item.id ? '#dc2626' : 'transparent',
                      cursor: 'pointer',
                      padding: 4,
                      display: 'inline-flex',
                      alignItems: 'center',
                      transition: 'color 0.15s',
                      flexShrink: 0,
                    }}
                    title="Sil"
                  >
                    <CiTrash size={16} />
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
                    <div style={{ fontSize: 12, color: '#a8a29e', padding: '12px 16px', fontStyle: 'italic' }}>
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
                      style={{ cursor: 'grab', color: '#a8a29e', display: 'inline-flex', alignItems: 'center', touchAction: 'none', flexShrink: 0 }}
                      title="Sürükleyerek sırala"
                    >
                      <CiBoxes size={16} />
                    </span>
                  )}
                  {c.image_url ? (
                    <img onError={handleImageError} src={getOptimizedImageUrl(c.image_url, 'thumbnail')} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f5f5f4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d6d3d1', flexShrink: 0 }}>
                      <CiCamera size={18} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => !isEditing && toggleExpand(c.id)}>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <input style={{ ...S.input, width: 220, padding: '6px 10px', fontSize: 13 }} value={editCatForm.name_tr} onChange={e => setEditCatForm({ name_tr: e.target.value })} autoFocus />
                        <button onClick={() => updateCategory(c.id)} style={{ ...S.btnSm, padding: '4px 8px' }}><CiCircleCheck size={14} /></button>
                        <button onClick={() => setEditingCat(null)} style={{ ...S.btnSm, padding: '4px 8px' }}><CiCircleRemove size={14} /></button>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: opts.isSub ? 13 : 15, fontWeight: 600, color: '#1c1917' }}>{c.name_tr}</span>
                          {c.translations && Object.keys(c.translations).length > 0 && <span style={S.translationBadge}>EN</span>}
                        </div>
                        <div style={{ fontSize: 11, color: '#78716c', marginTop: 2 }}>
                          {totalInScope} ürün
                          {missing > 0 && <> · <span style={S.missingPhotoWarning}>{missing} fotoğraf eksik</span></>}
                        </div>
                      </>
                    )}
                  </div>
                  {!isEditing && (
                    <div style={S.accordionActions} onClick={(e) => e.stopPropagation()}>
                      <label style={{ color: '#a8a29e', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', padding: 4 }} title="Kategori görseli">
                        <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploadingCatImage === c.id} onChange={e => { if (e.target.files?.[0]) uploadCategoryImage(e.target.files[0], c.id); }} />
                        {uploadingCatImage === c.id ? <span style={{ fontSize: 10 }}>...</span> : <CiCamera size={16} />}
                      </label>
                      {c.image_url && (
                        <button onClick={() => removeCategoryImage(c.id)} style={{ background: 'none', border: 'none', color: '#a8a29e', cursor: 'pointer', padding: 4, display: 'inline-flex', alignItems: 'center' }} title="Görseli kaldır"><CiTrash size={14} /></button>
                      )}
                      <button onClick={() => { setEditingCat(c.id); setEditCatForm({ name_tr: c.name_tr }); }} style={{ background: 'none', border: 'none', color: '#a8a29e', cursor: 'pointer', padding: 4, display: 'inline-flex', alignItems: 'center' }} title="Düzenle"><CiEdit size={16} /></button>
                      <button onClick={() => deleteCategory(c.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 4, display: 'inline-flex', alignItems: 'center' }} title="Sil"><CiTrash size={16} /></button>
                      <button
                        type="button"
                        onClick={() => toggleExpand(c.id)}
                        style={{ background: 'none', border: 'none', color: '#78716c', cursor: 'pointer', padding: 4, display: 'inline-flex', alignItems: 'center' }}
                        title={isOpen ? 'Kapat' : 'Aç'}
                      >
                        {isOpen ? <CiCircleChevUp size={20} /> : <CiCircleChevDown size={20} />}
                      </button>
                    </div>
                  )}
                </div>
              );
            };

            // Search mode: flat compact list
            if (searchQuery.trim()) {
              if (filteredItems.length === 0) {
                return <div style={{ textAlign: 'center', color: '#a8a29e', padding: 40, fontSize: 14 }}>Eşleşen ürün bulunamadı.</div>;
              }
              return (
                <div style={{ border: '1px solid #e7e5e4', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
                  {filteredItems.map(item => renderItemRow(item))}
                </div>
              );
            }

            const rootCats = categories.filter(c => !c.parent_id);
            if (rootCats.length === 0) {
              return <div style={{ textAlign: 'center', color: '#a8a29e', padding: 40, fontSize: 14 }}>Henüz kategori eklenmedi.</div>;
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
                                                        <CiCirclePlus size={14} /> Ürün Ekle
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
                                      <CiCirclePlus size={14} /> Ürün Ekle
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

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 flex justify-around py-2">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`flex flex-col items-center gap-1 px-2 py-1 text-[10px] transition-colors ${
                active ? 'text-rose-600' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              <Icon size={20} />
              <span className="truncate max-w-[64px]">{item.label}</span>
            </button>
          );
        })}
      </nav>
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

function PromosTab({ restaurant }: { restaurant: Restaurant }) {
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
        <div style={{ padding: '10px 14px', background: msg.includes('Hata') ? '#fef2f2' : '#f0fdf4', border: `1px solid ${msg.includes('Hata') ? '#fecaca' : '#bbf7d0'}`, borderRadius: 8, color: msg.includes('Hata') ? '#dc2626' : '#16a34a', fontSize: 13, marginBottom: 16, cursor: 'pointer' }} onClick={() => setMsg('')}>
          {msg} <span style={{ float: 'right' }}>✕</span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1c1917' }}>Promosyonlar</h3>
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
                <img onError={handleImageError} src={getOptimizedImageUrl(form.image_url, 'card')} alt="" style={{ width: 120, height: 72, borderRadius: 8, objectFit: 'cover', border: '1px solid #e7e5e4' }} />
                <button type="button" onClick={() => promoFileRef.current?.click()} disabled={uploading} style={S.btnSm}>{uploading ? '...' : 'Değiştir'}</button>
                <button type="button" onClick={() => setForm({ ...form, image_url: '' })} style={S.btnDanger}><CiTrash size={12} /></button>
              </div>
            ) : (
              <button type="button" onClick={() => promoFileRef.current?.click()} disabled={uploading} style={{ ...S.btnSm, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <CiCamera size={14} /> {uploading ? 'Yükleniyor...' : 'Görsel Yükle'}
              </button>
            )}
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
          <div style={{ borderTop: '1px solid #f5f5f4', paddingTop: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: '#44403c', fontWeight: 600 }}>
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
                            border: selected ? '2px solid #16a34a' : '1px solid #d6d3d1',
                            background: selected ? '#dcfce7' : '#fff',
                            color: selected ? '#16a34a' : '#44403c',
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
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: '#44403c' }}>
              <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
              Aktif
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: '#44403c' }}>
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
        <div style={{ textAlign: 'center', color: '#a8a29e', padding: 40, fontSize: 14 }}>
          Henüz promo eklenmedi.
        </div>
      )}

      {promos.map(p => (
        <div key={p.id} style={{ ...S.card, opacity: p.is_active ? 1 : 0.55 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            {p.image_url ? (
              <img onError={handleImageError} src={getOptimizedImageUrl(p.image_url, 'card')} alt="" style={{ width: 84, height: 56, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 84, height: 56, borderRadius: 8, background: '#f5f5f4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CiImageOn size={24} style={{ color: '#a8a29e' }} />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#1c1917' }}>{p.title_tr}</div>
              {p.description_tr && <div style={{ fontSize: 13, color: '#78716c', marginTop: 2 }}>{p.description_tr}</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ ...S.badge, background: p.is_active ? '#dcfce7' : '#fee2e2', color: p.is_active ? '#16a34a' : '#dc2626' }}>
                  {p.is_active ? 'Aktif' : 'Pasif'}
                </span>
                {p.schedule_enabled && (
                  <span style={{ fontSize: 11, color: '#78716c' }}>
                    {normalizeTime(p.schedule_start_time)} - {normalizeTime(p.schedule_end_time)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10, borderTop: '1px solid #f5f5f4', paddingTop: 10 }}>
            <button onClick={() => toggleActive(p)} style={{ ...S.btnSm, color: p.is_active ? '#16a34a' : '#dc2626' }}>
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
