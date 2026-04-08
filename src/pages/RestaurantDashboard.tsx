import { useEffect, useState, useRef, ReactNode, CSSProperties } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';
import { CiCamera, CiEdit, CiCircleCheck, CiCircleRemove, CiApple, CiStar, CiTempHigh, CiGlobe, CiPen, CiGrid2H, CiUser, CiImageOn, CiTrash, CiLink, CiBoxes } from 'react-icons/ci';
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

type Category = { id: string; name_tr: string; name_en: string | null; sort_order: number; is_active: boolean; translations: Translations; image_url: string | null; };
type MenuItem = {
  id: string; category_id: string; name_tr: string; name_en: string | null;
  description_tr: string | null; description_en: string | null; price: number;
  image_url: string | null; is_available: boolean; is_popular: boolean; sort_order: number;
  calories: number | null; allergens: string[] | null; is_vegetarian: boolean; is_new: boolean;
  is_featured: boolean;
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
};

const emptyItemForm = { name_tr: '', description_tr: '', price: '', image_url: '', calories: '', allergens: [] as string[], is_vegetarian: false, is_new: false, is_featured: false };

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
                <img src={restaurant.logo_url} alt="Logo" style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover', border: '1px solid #e7e5e4' }} />
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
                <img src={coverImage} alt="Cover" style={{ width: '100%', height: 80, borderRadius: 8, objectFit: 'cover', border: '1px solid #e7e5e4' }} />
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
  const [catForm, setCatForm] = useState<{ name_tr: string; image_url: string }>({ name_tr: '', image_url: '' });
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
  const fileRef = useRef<HTMLInputElement>(null);

  const enabledLangs = (restaurant?.enabled_languages ?? []).filter(l => l !== 'tr');
  const plan = (restaurant?.current_plan || '').toLowerCase();
  const hasAI = plan === 'pro' || plan === 'premium';

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('restaurant_id').eq('id', user.id).single()
        .then(({ data }) => {
          if (data?.restaurant_id) {
            supabase.from('restaurants').select('*').eq('id', data.restaurant_id).single()
              .then(({ data: r }) => { if (r) { setRestaurant(r); loadCategories(r.id); loadItems(r.id); } });
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
      const oldIndex = prev.findIndex((c) => c.id === active.id);
      const newIndex = prev.findIndex((c) => c.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      const next = arrayMove(prev, oldIndex, newIndex);
      persistCategoryOrder(next);
      return next;
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
          calories: itemForm.calories ? parseInt(itemForm.calories) : null,
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
      sort_order: categories.length,
      translations: {},
    }).select().single();
    if (error) { setMsg(error.message); }
    else {
      setCatForm({ name_tr: '', image_url: '' }); setShowCatForm(false);
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
    setSaving(true);
    const payload = {
      restaurant_id: restaurant.id,
      category_id: selectedCat,
      name_tr: itemForm.name_tr,
      description_tr: itemForm.description_tr || null,
      price: parseFloat(itemForm.price),
      image_url: itemForm.image_url || null,
      calories: itemForm.calories ? parseInt(itemForm.calories) : null,
      allergens: itemForm.allergens.length > 0 ? itemForm.allergens : null,
      is_vegetarian: itemForm.is_vegetarian,
      is_new: itemForm.is_new,
      is_featured: itemForm.is_featured,
      sort_order: editingItem ? undefined : items.filter(i => i.category_id === selectedCat).length,
    };

    let savedId = editingItem;

    if (editingItem) {
      const { sort_order, ...updatePayload } = payload;
      await supabase.from('menu_items').update(updatePayload).eq('id', editingItem);
    } else {
      const { data: newItem } = await supabase.from('menu_items').insert({ ...payload, translations: {} }).select().single();
      if (newItem) savedId = newItem.id;
    }

    setItemForm(emptyItemForm); setShowItemForm(false); setEditingItem(null);
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
  function startEdit(item: MenuItem) {
    setEditingItem(item.id);
    setItemForm({
      name_tr: item.name_tr,
      description_tr: item.description_tr || '',
      price: item.price.toString(),
      image_url: item.image_url || '',
      calories: item.calories?.toString() || '',
      allergens: item.allergens || [],
      is_vegetarian: item.is_vegetarian || false,
      is_new: item.is_new || false,
      is_featured: item.is_featured || false,
    });
    setShowItemForm(true);
    setSelectedCat(item.category_id);
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

  if (!restaurant) return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1c1917', marginBottom: 8 }}>Restoran Atanmadı</h2>
      <p style={{ fontSize: 14, color: '#78716c' }}>Hesabınıza henüz bir restoran atanmamış. Lütfen yönetici ile iletişime geçin.</p>
    </div>
  );

  const filteredItems = (() => {
    let list = selectedCat ? items.filter(i => i.category_id === selectedCat) : items;
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

  return (
    <div className="flex min-h-screen bg-white">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[220px] shrink-0 border-r border-gray-200 bg-[#fafafa] sticky top-0 self-start min-h-screen">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {restaurant.logo_url && (
              <img src={restaurant.logo_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
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
                <label style={S.label}>Kategori Görseli</label>
                <input ref={catFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) uploadCategoryImage(e.target.files[0], 'new'); }} />
                {catForm.image_url ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img src={catForm.image_url} alt="" style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', border: '1px solid #e7e5e4' }} />
                    <button type="button" onClick={() => catFileRef.current?.click()} disabled={uploadingCatImage === 'new'} style={{ ...S.btnSm, fontSize: 11 }}>{uploadingCatImage === 'new' ? '...' : 'Değiştir'}</button>
                    <button type="button" onClick={() => setCatForm({ ...catForm, image_url: '' })} style={{ ...S.btnDanger, fontSize: 11 }}><CiTrash size={12} /></button>
                  </div>
                ) : (
                  <button type="button" onClick={() => catFileRef.current?.click()} disabled={uploadingCatImage === 'new'} style={{ ...S.btnSm, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <CiCamera size={14} /> {uploadingCatImage === 'new' ? 'Yükleniyor...' : 'Görsel Yükle'}
                  </button>
                )}
              </div>
              {enabledLangs.length > 0 && (
                <p style={{ fontSize: 11, color: '#4338CA', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CiGlobe size={12} /> Çeviriler kaydettikten sonra otomatik oluşturulacak
                </p>
              )}
              <button type="submit" disabled={saving} style={{ ...S.btn, alignSelf: 'flex-start' }}>{saving ? '...' : 'Ekle'}</button>
            </form>
          )}

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
            <button onClick={() => setSelectedCat(null)} style={{ ...S.btnSm, background: !selectedCat ? '#1c1917' : '#fff', color: !selectedCat ? '#fff' : '#44403c' }}>
              Tümü ({items.length})
              {totalMissingPhotos > 0 && (
                <span style={{ marginLeft: 6, fontSize: 10, color: '#f59e0b', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                  <CiCamera size={11} /> {totalMissingPhotos} fotoğraf eksik
                </span>
              )}
            </button>
            <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
              <SortableContext items={categories.map(c => c.id)} strategy={horizontalListSortingStrategy}>
            {categories.map(c => (
              <Sortable key={c.id} id={c.id}>
                {({ setNodeRef, style, attributes, listeners }) => (
              <div ref={setNodeRef} style={{ display: 'flex', alignItems: 'center', gap: 2, ...style }} {...attributes}>
                {editingCat === c.id ? (
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <input style={{ ...S.input, width: 140, padding: '4px 8px', fontSize: 12 }} value={editCatForm.name_tr} onChange={e => setEditCatForm({ name_tr: e.target.value })} />
                    <button onClick={() => updateCategory(c.id)} style={{ ...S.btnSm, padding: '3px 8px', fontSize: 11 }}><CiCircleCheck size={14} /></button>
                    <button onClick={() => setEditingCat(null)} style={{ ...S.btnSm, padding: '3px 8px', fontSize: 11 }}><CiCircleRemove size={14} /></button>
                  </div>
                ) : (
                  <>
                    <span {...(listeners as Record<string, unknown>)} style={{ cursor: 'grab', color: '#a8a29e', display: 'inline-flex', alignItems: 'center', padding: '0 2px', touchAction: 'none' }} title="Sürükleyerek sırala">
                      <CiBoxes size={14} />
                    </span>
                    <button onClick={() => setSelectedCat(c.id)} style={{ ...S.btnSm, background: selectedCat === c.id ? '#1c1917' : '#fff', color: selectedCat === c.id ? '#fff' : '#44403c', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {c.image_url ? (
                        <img src={c.image_url} alt="" style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }} />
                      ) : null}
                      {c.name_tr} ({items.filter(i => i.category_id === c.id).length})
                      {(missingPhotoCounts.get(c.id) || 0) > 0 && (
                        <span style={{ fontSize: 9, color: '#f59e0b', marginLeft: 2 }}>
                          📷{missingPhotoCounts.get(c.id)}
                        </span>
                      )}
                      <TranslationBadges translations={c.translations} />
                    </button>
                    <label style={{ background: 'none', border: 'none', color: '#a8a29e', cursor: 'pointer', fontSize: 12, padding: '0 2px', display: 'inline-flex', alignItems: 'center' }} title="Kategori görseli">
                      <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploadingCatImage === c.id} onChange={e => { if (e.target.files?.[0]) uploadCategoryImage(e.target.files[0], c.id); }} />
                      {uploadingCatImage === c.id ? <span style={{ fontSize: 10 }}>...</span> : <CiCamera size={14} />}
                    </label>
                    {c.image_url && (
                      <button onClick={() => removeCategoryImage(c.id)} style={{ background: 'none', border: 'none', color: '#a8a29e', cursor: 'pointer', padding: '0 2px' }} title="Görseli kaldır"><CiTrash size={13} /></button>
                    )}
                    <button onClick={() => { setEditingCat(c.id); setEditCatForm({ name_tr: c.name_tr }); }} style={{ background: 'none', border: 'none', color: '#a8a29e', cursor: 'pointer', fontSize: 12, padding: '0 2px' }} title="Düzenle"><CiEdit size={14} /></button>
                    <button onClick={() => deleteCategory(c.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 14, padding: '0 2px' }}>×</button>
                  </>
                )}
              </div>
                )}
              </Sortable>
            ))}
              </SortableContext>
            </DndContext>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1c1917' }}>Ürünler</h3>
            {selectedCat && <button onClick={() => { setShowItemForm(!showItemForm); setEditingItem(null); setItemForm(emptyItemForm); }} style={S.btnSm}>{showItemForm ? 'İptal' : '+ Ürün Ekle'}</button>}
          </div>

          {/* Search */}
          <div style={{ marginBottom: 12 }}>
            <input
              style={S.input}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Ürün ara..."
            />
          </div>

          {!selectedCat && <p style={{ fontSize: 13, color: '#a8a29e', marginBottom: 16 }}>Ürün eklemek için bir kategori seçin.</p>}

          {showItemForm && selectedCat && (
            <form onSubmit={addOrUpdateItem} style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={S.label}>Ürün Adı *</label>
                <input style={S.input} value={itemForm.name_tr} onChange={e => setItemForm({ ...itemForm, name_tr: e.target.value })} required placeholder="Örn: Mercimek Çorbası" />
              </div>
              <div>
                <label style={S.label}>Açıklama</label>
                <div style={{ position: 'relative' }}>
                  <input style={S.input} value={itemForm.description_tr} onChange={e => setItemForm({ ...itemForm, description_tr: e.target.value })} placeholder="Kısa bir açıklama yazın veya AI ile oluşturun" />
                  {hasAI && (
                    <button type="button" onClick={generateAIDescription} disabled={generatingAI || !itemForm.name_tr} style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', padding: '5px 10px', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer', border: 'none', background: generatingAI ? '#E9D5FF' : '#9333EA', color: '#fff', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s', opacity: !itemForm.name_tr ? 0.5 : 1 }} title="AI ile açıklama oluştur">
                      <CiPen size={12} /> {generatingAI ? 'Yazılıyor...' : 'AI Yaz'}
                    </button>
                  )}
                </div>
              </div>
              {enabledLangs.length > 0 && (
                <p style={{ fontSize: 11, color: '#4338CA', margin: '-4px 0 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CiGlobe size={12} /> Çeviriler kaydettikten sonra otomatik oluşturulacak
                </p>
              )}
              <div style={S.grid3}>
                <div><label style={S.label}>Fiyat (₺) *</label><input type="number" step="0.01" style={S.input} value={itemForm.price} onChange={e => setItemForm({ ...itemForm, price: e.target.value })} required /></div>
                <div><label style={S.label}>Kalori (kcal)</label><input type="number" style={S.input} value={itemForm.calories} onChange={e => setItemForm({ ...itemForm, calories: e.target.value })} placeholder="Örn: 450" /></div>
                <div>
                  <label style={S.label}>Görsel</label>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0]); }} />
                  {itemForm.image_url ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <img src={itemForm.image_url} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
                      <button type="button" onClick={() => setItemForm({ ...itemForm, image_url: '' })} style={{ ...S.btnSm, padding: '3px 8px', fontSize: 11, color: '#dc2626' }}>Kaldır</button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} style={{ ...S.btnSm, width: '100%' }}>
                      {uploading ? 'Yükleniyor...' : <><CiCamera size={14} /> Görsel Seç</>}
                    </button>
                  )}
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
              <button type="submit" disabled={saving} style={{ ...S.btn, alignSelf: 'flex-start' }}>{saving ? '...' : editingItem ? 'Güncelle' : 'Ekle'}</button>
            </form>
          )}

          <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleItemDragEnd}>
            <SortableContext items={filteredItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {filteredItems.map(item => {
            const allergenKeys = (item.allergens || []).filter(a => getAllergenInfo(a));
            const isTranslating = translating === item.id;
            const dragEnabled = !!selectedCat && !searchQuery.trim();
            return (
              <Sortable key={item.id} id={item.id}>
                {({ setNodeRef, style, attributes, listeners }) => (
              <div ref={setNodeRef} style={{ ...S.card, opacity: item.is_available ? 1 : 0.45, position: 'relative', ...style }} {...attributes}>
                {isTranslating && (
                  <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 10, color: '#4338CA', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CiGlobe size={12} /> Çevriliyor...
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  {dragEnabled && (
                    <span {...(listeners as Record<string, unknown>)} style={{ cursor: 'grab', color: '#a8a29e', display: 'inline-flex', alignItems: 'center', padding: '4px 6px 4px 0', marginRight: 4, touchAction: 'none', alignSelf: 'center' }} title="Sürükleyerek sırala">
                      <CiBoxes size={18} />
                    </span>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#1c1917' }}>{item.name_tr}</span>
                      <TranslationBadges translations={item.translations} />
                      {item.is_vegetarian && <span style={{ ...S.badge, background: '#dcfce7', color: '#16a34a' }}><CiApple size={12} /></span>}
                      {item.is_new && <span style={{ ...S.badge, background: '#fef3c7', color: '#b45309' }}><CiStar size={12} /> Yeni</span>}
                      {item.is_popular && <span style={{ ...S.badge, background: '#fef3c7', color: '#b45309' }}><CiStar size={12} /></span>}
                      {item.is_featured && <span style={{ ...S.badge, background: '#fef3c7', color: '#b45309' }}>⭐ Öne Çıkan</span>}
                    </div>
                    {item.description_tr && <div style={{ fontSize: 13, color: '#78716c', marginTop: 2 }}>{item.description_tr}</div>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#1c1917' }}>₺{Number(item.price).toFixed(2)}</span>
                      {item.calories && <span style={{ fontSize: 11, color: '#a8a29e', display: 'inline-flex', alignItems: 'center', gap: 2 }}><CiTempHigh size={12} /> {item.calories} kcal</span>}
                      {allergenKeys.length > 0 && (
                        <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }} title={allergenKeys.join(', ')}>
                          {allergenKeys.map(a => <AllergenIcon key={a} allergenKey={a} size={14} />)}
                        </span>
                      )}
                    </div>
                  </div>
                  {item.image_url && <img src={item.image_url} alt="" style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', marginLeft: 12 }} />}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10, borderTop: '1px solid #f5f5f4', paddingTop: 10 }}>
                  <button onClick={() => toggleItemAvailable(item.id, item.is_available)} style={{ ...S.btnSm, color: item.is_available ? '#16a34a' : '#dc2626' }}>{item.is_available ? 'Aktif' : 'Pasif'}</button>
                  <button onClick={() => startEdit(item)} style={S.btnSm}>Düzenle</button>
                  <button onClick={() => deleteItem(item.id)} style={S.btnDanger}>Sil</button>
                  {!selectedCat && <span style={{ fontSize: 11, color: '#a8a29e', alignSelf: 'center', marginLeft: 'auto' }}>{catName(item.category_id)}</span>}
                </div>
              </div>
                )}
              </Sortable>
            );
          })}
            </SortableContext>
          </DndContext>
          {filteredItems.length === 0 && <div style={{ textAlign: 'center', color: '#a8a29e', padding: 40, fontSize: 14 }}>{selectedCat ? 'Bu kategoride henüz ürün yok.' : 'Henüz ürün eklenmedi.'}</div>}
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
                <img src={form.image_url} alt="" style={{ width: 120, height: 72, borderRadius: 8, objectFit: 'cover', border: '1px solid #e7e5e4' }} />
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
              <img src={p.image_url} alt="" style={{ width: 84, height: 56, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
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
