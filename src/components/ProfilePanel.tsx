import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Star, Globe, Image, Trash, Link, Package, Info, SquaresFour, Palette, ArrowsClockwise, User, CurrencyCircleDollar, Warning } from "@phosphor-icons/react";
import type { AdminTheme } from '../lib/adminTheme';
import { getOptimizedImageUrl, handleImageError } from '../lib/imageUtils';
import { THEMES } from '../lib/themes';
import { Restaurant, DAY_KEYS, DAY_LABELS, DEFAULT_DAY, makeStyles } from './admin/dashboardShared';
import MediaPickerModal, { type MediaAccept, attachMediaUsage, detachMediaUsage } from './admin/MediaPickerModal';
import { hasFeature, PLAN_FEATURES, type FeatureKey } from '../lib/planFeatures';

const SUPABASE_URL = 'https://qmnrawqvkwehufebbkxp.supabase.co';

// LEGACY: feature_* toggles deprecated 25 Apr 2026.
// Features now controlled by plan tier + plan_overrides JSONB (super admin only).
// Keeping code dormant until cleanup migration removes feature_* DB columns.
const SHOW_LEGACY_FEATURE_TOGGLES = false;

type ToggleColumn =
  | 'feature_cart'
  | 'feature_waiter_calls'
  | 'feature_whatsapp_order'
  | 'feature_table_reservation'
  | 'feature_table_payment'
  | 'feature_digital_tip'
  | 'feature_group_payment';

function getRequiredPlan(feature: FeatureKey): string {
  if (PLAN_FEATURES.premium[feature]) return 'Premium';
  if (PLAN_FEATURES.enterprise[feature]) return 'Enterprise';
  return 'Premium';
}

function PillarHeader({ title, accent, theme }: { title: string; accent: string; theme: AdminTheme }) {
  return (
    <div style={{ marginTop: 18, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 4, height: 14, background: accent, borderRadius: 1 }} />
      <span style={{ fontSize: 11, fontWeight: 500, color: theme.subtle, letterSpacing: 0.4, textTransform: 'uppercase' }}>
        {title}
      </span>
    </div>
  );
}

function PillSwitch({ checked, onCheckedChange, disabled, theme }: { checked: boolean; onCheckedChange?: (v: boolean) => void; disabled?: boolean; theme: AdminTheme }) {
  if (disabled) {
    return (
      <div style={{ width: 36, height: 22, background: theme.pageBg, border: `0.5px solid ${theme.border}`, borderRadius: 11, position: 'relative', flexShrink: 0, opacity: 0.6 }}>
        <div style={{ width: 18, height: 18, background: '#D3D1C7', borderRadius: '50%', position: 'absolute', top: 1.5, left: 1.5 }} />
      </div>
    );
  }
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange?.(!checked)}
      style={{
        width: 36,
        height: 22,
        background: checked ? theme.accent : theme.subtle,
        borderRadius: 11,
        border: 'none',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 150ms ease',
        flexShrink: 0,
      }}
    >
      <div style={{
        width: 18,
        height: 18,
        background: 'white',
        borderRadius: '50%',
        position: 'absolute',
        top: 2,
        left: checked ? 16 : 2,
        transition: 'left 150ms ease',
        boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
      }} />
    </button>
  );
}

type ToggleRowProps = {
  feature: FeatureKey;
  dbColumn: ToggleColumn;
  label: string;
  description: string;
  restaurant: Restaurant;
  form: any;
  setForm: (next: any) => void;
  theme: AdminTheme;
};

function ToggleRow({ feature, dbColumn, label, description, restaurant, form, setForm, theme }: ToggleRowProps) {
  const isInPlan = hasFeature(restaurant, feature);
  const isOn = !!form[dbColumn];
  const requiredPlan = getRequiredPlan(feature);

  if (!isInPlan) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 0',
        borderBottom: `0.5px solid ${theme.border}`,
        opacity: 0.6,
      }}>
        <div style={{ flex: 1, paddingRight: 16 }}>
          <div style={{ fontSize: 14, color: theme.subtle, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>{label}</span>
            <span style={{
              background: theme.pageBg,
              color: theme.subtle,
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 3,
              fontWeight: 500,
              letterSpacing: 0.3,
              textTransform: 'uppercase',
            }}>
              {requiredPlan}
            </span>
          </div>
          <div style={{ fontSize: 12, color: theme.subtle }}>
            {description}{' '}
            <a
              href="/iletisim?subject=plan-upgrade"
              style={{ color: theme.accent, textDecoration: 'none', fontWeight: 500 }}
            >
              {requiredPlan}'a yükselt →
            </a>
          </div>
        </div>
        <PillSwitch checked={false} disabled theme={theme} />
      </div>
    );
  }

  return (
    <label style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 0',
      borderBottom: `0.5px solid ${theme.border}`,
      cursor: 'pointer',
    }}>
      <div style={{ flex: 1, paddingRight: 16 }}>
        <div style={{ fontSize: 14, color: theme.value, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 12, color: theme.subtle }}>{description}</div>
      </div>
      <PillSwitch
        checked={isOn}
        onCheckedChange={(checked) => setForm({ ...form, [dbColumn]: checked })}
        theme={theme}
      />
    </label>
  );
}

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
    feature_waiter_calls: hasFeature(restaurant, 'waiter_calls'),
    feature_cart: hasFeature(restaurant, 'cart'),
    feature_whatsapp_order: hasFeature(restaurant, 'whatsapp_order'),
    feature_feedback: hasFeature(restaurant, 'feedback'),
    feature_discount_codes: hasFeature(restaurant, 'discount_codes'),
    feature_likes: hasFeature(restaurant, 'likes'),
    feature_reviews: restaurant.feature_reviews ?? true,
    feature_multi_currency: hasFeature(restaurant, 'multi_currency'),
    feature_table_reservation: hasFeature(restaurant, 'table_reservation'),
    feature_table_payment: hasFeature(restaurant, 'table_payment'),
    feature_digital_tip: hasFeature(restaurant, 'digital_tip'),
    feature_group_payment: hasFeature(restaurant, 'group_payment'),
    base_currency: restaurant.base_currency || 'TRY',
    google_place_id: restaurant.google_place_id || '',
  });
  type CurrencyOption = { currency_code: string; currency_name_tr: string; symbol: string; flag_emoji: string | null };
  const TRY_OPTION_ADMIN: CurrencyOption = { currency_code: 'TRY', currency_name_tr: 'Türk Lirası', symbol: '₺', flag_emoji: '🇹🇷' };
  const [currencyOptions, setCurrencyOptions] = useState<CurrencyOption[]>([TRY_OPTION_ADMIN]);
  const [showBaseModal, setShowBaseModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('currency_code, currency_name_tr, symbol, flag_emoji')
        .order('currency_code');
      if (cancelled) return;
      if (error || !data) return;
      setCurrencyOptions([TRY_OPTION_ADMIN, ...(data as CurrencyOption[])]);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [workingHours, setWorkingHours] = useState<Record<string, { open: string; close: string; closed: boolean }>>(() => {
    const wh = restaurant.working_hours || {};
    const out: Record<string, { open: string; close: string; closed: boolean }> = {};
    for (const k of DAY_KEYS) out[k] = wh[k] ? { ...wh[k] } : { ...DEFAULT_DAY };
    return out;
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [ratingLoading, setRatingLoading] = useState(false);
  const [googleRating, setGoogleRating] = useState<number | null>(restaurant.google_rating ?? null);
  const [googleReviewCount, setGoogleReviewCount] = useState<number | null>(restaurant.google_review_count ?? null);
  const [googleRatingUpdatedAt, setGoogleRatingUpdatedAt] = useState<string | null>(restaurant.google_rating_updated_at ?? null);
  const [latitude, setLatitude] = useState<number | null>(restaurant.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(restaurant.longitude ?? null);
  const [picker, setPicker] = useState<{ accept: MediaAccept; onPick: (url: string) => void } | null>(null);
  const openPicker = (accept: MediaAccept, onPick: (url: string) => void) => setPicker({ accept, onPick });

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    // base_currency changed → show confirmation modal, defer actual save to confirm handler.
    if (form.base_currency !== (restaurant.base_currency || 'TRY')) {
      setShowBaseModal(true);
      return;
    }
    await performSave();
  }

  async function performSave() {
    setSaving(true);

    // Build new plan_overrides from form state. Preserve any keys not managed
    // by this form (super-admin-only flags), then explicitly write each toggle
    // this form controls. Mirrors SuperAdminDashboard.updateOverride's
    // 'on'/'off' paths — always explicit boolean, no delete-on-default.
    const newOverrides: Record<string, boolean> = {
      ...(restaurant.plan_overrides ?? {}),
      cart: form.feature_cart,
      waiter_calls: form.feature_waiter_calls,
      whatsapp_order: form.feature_whatsapp_order,
      feedback: form.feature_feedback,
      discount_codes: form.feature_discount_codes,
      likes: form.feature_likes,
      multi_currency: form.feature_multi_currency,
      table_reservation: form.feature_table_reservation,
      table_payment: form.feature_table_payment,
      digital_tip: form.feature_digital_tip,
      group_payment: form.feature_group_payment,
    };

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
      plan_overrides: newOverrides,
      feature_reviews: form.feature_reviews,
      base_currency: form.base_currency,
      google_place_id: form.google_place_id || null,
    }).eq('id', restaurant.id);

    if (error) {
      // Trigger raises a generic exception for invalid currency codes; surface a friendlier message.
      const friendly = /base_currency/i.test(error.message)
        ? 'Bu para birimi şu anda desteklenmiyor.'
        : 'Hata: ' + error.message;
      setMsg(friendly);
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
        plan_overrides: newOverrides,
        feature_reviews: form.feature_reviews,
        base_currency: form.base_currency,
        google_place_id: form.google_place_id || null,
      });
    }
    setSaving(false);
    setTimeout(() => setMsg(''), 3000);
  }

  async function applyPickedImage(type: 'logo' | 'cover', url: string) {
    const field = type === 'logo' ? 'logo_url' : 'cover_url';
    const oldUrl = type === 'logo' ? restaurant.logo_url : restaurant.cover_url;
    if (oldUrl) await detachMediaUsage(oldUrl, { type: 'restaurant', id: restaurant.id, field });
    await supabase.from('restaurants').update({ [field]: url }).eq('id', restaurant.id);
    await attachMediaUsage(url, { type: 'restaurant', id: restaurant.id, field, label: restaurant.name });
    onUpdate({ ...restaurant, [field]: url });
    setMsg(type === 'logo' ? 'Logo guncellendi' : 'Kapak gorseli guncellendi');
    setTimeout(() => setMsg(''), 3000);
  }

  async function removeImage(type: 'logo' | 'cover') {
    const field = type === 'logo' ? 'logo_url' : 'cover_url';
    const oldUrl = type === 'logo' ? restaurant.logo_url : restaurant.cover_url;
    if (oldUrl) await detachMediaUsage(oldUrl, { type: 'restaurant', id: restaurant.id, field });
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
            {restaurant.logo_url ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <img onError={handleImageError} src={getOptimizedImageUrl(restaurant.logo_url, 'card')} alt="Logo" style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover', border: `1px solid ${theme.border}` }} />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" onClick={() => openPicker('image', (url) => applyPickedImage('logo', url))} style={{ ...S.btnSm, fontSize: 11, padding: '4px 10px' }}>Degistir</button>
                  <button type="button" onClick={() => removeImage('logo')} style={{ ...S.btnDanger, fontSize: 11, padding: '4px 10px' }}><Trash size={12} /></button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => openPicker('image', (url) => applyPickedImage('logo', url))} style={{ ...S.btnSm, width: '100%', padding: '20px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: theme.subtle }}>
                <Image size={24} />
                <span style={{ fontSize: 12 }}>Kütüphaneden Seç</span>
              </button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: theme.subtle, marginTop: 4 }}><Info size={14} /><span>500×500px, kare, şeffaf arka plan, max 5MB</span></div>
          </div>
          <div>
            <label style={{ ...S.label, marginBottom: 10 }}>Kapak Gorseli</label>
            {coverImage ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <img onError={handleImageError} src={getOptimizedImageUrl(coverImage, 'detail')} alt="Cover" style={{ width: '100%', height: 80, borderRadius: 8, objectFit: 'cover', border: `1px solid ${theme.border}` }} />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" onClick={() => openPicker('image', (url) => applyPickedImage('cover', url))} style={{ ...S.btnSm, fontSize: 11, padding: '4px 10px' }}>Degistir</button>
                  <button type="button" onClick={() => removeImage('cover')} style={{ ...S.btnDanger, fontSize: 11, padding: '4px 10px' }}><Trash size={12} /></button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => openPicker('image', (url) => applyPickedImage('cover', url))} style={{ ...S.btnSm, width: '100%', padding: '20px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: theme.subtle }}>
                <Image size={24} />
                <span style={{ fontSize: 12 }}>Kütüphaneden Seç</span>
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
              preload="metadata"
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
          {form.google_place_id && (() => {
            const COOLDOWN_MS = 72 * 60 * 60 * 1000;
            const lastFetchedMs = googleRatingUpdatedAt ? new Date(googleRatingUpdatedAt).getTime() : null;
            const cooldownEndsAt = lastFetchedMs ? lastFetchedMs + COOLDOWN_MS : null;
            const cooldownActive = cooldownEndsAt !== null && cooldownEndsAt > Date.now();
            const remainingHours = cooldownActive && cooldownEndsAt
              ? Math.ceil((cooldownEndsAt - Date.now()) / (60 * 60 * 1000))
              : 0;
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
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
                        if (res.status === 429 && result.error === 'cooldown_active') {
                          setGoogleRatingUpdatedAt(
                            new Date(new Date(result.next_available_at).getTime() - COOLDOWN_MS).toISOString()
                          );
                          setMsg(`${result.remaining_hours} saat sonra tekrar güncellenebilir`);
                        } else if (result.success && result.updated) {
                          const u = result.updated;
                          setGoogleRating(u.google_rating ?? null);
                          setGoogleReviewCount(u.google_review_count ?? 0);
                          setLatitude(u.latitude ?? null);
                          setLongitude(u.longitude ?? null);
                          setGoogleRatingUpdatedAt(new Date().toISOString());

                          const fields: string[] = [];
                          if (u.address) fields.push('adres');
                          if (u.phone) fields.push('telefon');
                          if (u.working_hours) fields.push('çalışma saatleri');
                          if (u.google_rating != null) fields.push('puan');
                          if (u.latitude != null && u.longitude != null) fields.push('konum');
                          setMsg(
                            fields.length > 0
                              ? `Google'dan güncellendi: ${fields.join(', ')}`
                              : "Google'dan güncellendi (yeni veri yok)"
                          );
                        } else {
                          setMsg(result.message || result.error || 'Puan çekilemedi');
                        }
                      } catch {
                        setMsg('Bağlantı hatası');
                      } finally {
                        setRatingLoading(false);
                      }
                    }}
                    disabled={ratingLoading || cooldownActive}
                    style={{ fontSize: 12, color: cooldownActive ? theme.subtle : theme.accent, fontWeight: 500, background: 'none', border: 'none', cursor: cooldownActive || ratingLoading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 4, opacity: ratingLoading ? 0.5 : 1 }}
                  >
                    <ArrowsClockwise size={14} className={ratingLoading ? 'animate-spin' : ''} />
                    {ratingLoading
                      ? 'Çekiliyor...'
                      : cooldownActive
                        ? `${remainingHours} saat sonra güncellenebilir`
                        : 'Google Bilgilerini Güncelle'}
                  </button>
                </div>
                {latitude !== null && longitude !== null && (
                  <div style={{ fontSize: 11, color: theme.subtle }}>
                    ✓ Konum bilgisi alındı (lat: {latitude.toFixed(4)}, lng: {longitude.toFixed(4)})
                  </div>
                )}
              </div>
            );
          })()}
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

        {/* Base Currency — operational currency for prices, cart, orders. */}
        <h4 style={{ fontSize: 14, fontWeight: 600, color: theme.value, marginTop: 8, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
          <CurrencyCircleDollar size={16} weight="thin" /> Para Birimi
        </h4>
        <div>
          <select
            style={S.input}
            value={form.base_currency}
            onChange={e => setForm({ ...form, base_currency: e.target.value })}
          >
            {currencyOptions.map(c => (
              <option key={c.currency_code} value={c.currency_code}>
                {(c.flag_emoji || '')} {c.currency_code} — {c.currency_name_tr}
              </option>
            ))}
          </select>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, fontSize: 11, color: theme.subtle, marginTop: 6, lineHeight: 1.4 }}>
            <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>Fiyatlarınız bu para biriminde girilir ve gösterilir. Müşteriler farklı bir para birimi seçerek görüntüleyebilir, ancak siparişler bu para biriminde işlenir.</span>
          </div>
        </div>

        {/* LEGACY: feature_* toggles — hidden 25 Apr 2026.
            Features now controlled by plan tier + plan_overrides (super admin).
            Code kept dormant until cleanup migration drops feature_* DB columns. */}
        {SHOW_LEGACY_FEATURE_TOGGLES && (
          <>
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
                { key: 'feature_multi_currency' as const, label: 'Çoklu Para Birimi', desc: 'Menüde TCMB günlük kuru ile döviz fiyat gösterimi' },
              ]).map(feat => (
                <label key={feat.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, border: `1px solid ${theme.border}`, backgroundColor: form[feat.key] ? theme.successBg : theme.pageBg, cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: theme.value, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {feat.key === 'feature_multi_currency' && <CurrencyCircleDollar size={14} weight="thin" />}
                      {feat.label}
                    </div>
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
          </>
        )}

        {/* Plan-aware feature toggles — added 27 Apr 2026 */}
        <h4 style={{ fontSize: 14, fontWeight: 600, color: theme.value, marginTop: 8, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
          <SquaresFour size={16} /> Özellikler
        </h4>
        <p style={{ fontSize: 12, color: theme.subtle, marginTop: 0, marginBottom: 12 }}>
          Plan dahilindeki özellikleri açıp kapatabilirsiniz. Plan dışındakiler için yükseltme gerekir.
        </p>

        <PillarHeader title="Gelir Yönetimi" accent="#1D9E75" theme={theme} />
        <ToggleRow
          feature="cart"
          dbColumn="feature_cart"
          label="Sepet"
          description="Müşteriler menüden sepete ürün ekleyebilir."
          restaurant={restaurant}
          form={form}
          setForm={setForm}
          theme={theme}
        />

        <PillarHeader title="Tahsilat" accent="#534AB7" theme={theme} />
        <ToggleRow
          feature="waiter_calls"
          dbColumn="feature_waiter_calls"
          label="Garson çağırma"
          description="Müşteri masadan tek tıkla garson çağırır."
          restaurant={restaurant}
          form={form}
          setForm={setForm}
          theme={theme}
        />
        <ToggleRow
          feature="whatsapp_order"
          dbColumn="feature_whatsapp_order"
          label="WhatsApp sipariş"
          description="Müşteri sepetini WhatsApp üzerinden gönderir."
          restaurant={restaurant}
          form={form}
          setForm={setForm}
          theme={theme}
        />
        <ToggleRow
          feature="table_reservation"
          dbColumn="feature_table_reservation"
          label="Masa rezervasyonu"
          description="Müşteri menüden masa rezervasyonu yapabilir."
          restaurant={restaurant}
          form={form}
          setForm={setForm}
          theme={theme}
        />
        <ToggleRow
          feature="table_payment"
          dbColumn="feature_table_payment"
          label="Masadan ödeme (QR)"
          description="Müşteri QR ile masadan online ödeme yapar."
          restaurant={restaurant}
          form={form}
          setForm={setForm}
          theme={theme}
        />
        <ToggleRow
          feature="digital_tip"
          dbColumn="feature_digital_tip"
          label="Dijital bahşiş"
          description="Ödeme sırasında garsona online bahşiş seçeneği."
          restaurant={restaurant}
          form={form}
          setForm={setForm}
          theme={theme}
        />
        <ToggleRow
          feature="group_payment"
          dbColumn="feature_group_payment"
          label="Grup ödeme"
          description="Hesap birden fazla kişiye paylaştırılabilir."
          restaurant={restaurant}
          form={form}
          setForm={setForm}
          theme={theme}
        />

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

      <MediaPickerModal
        isOpen={picker !== null}
        accept={picker?.accept || 'image'}
        onClose={() => setPicker(null)}
        onSelect={({ url }) => {
          picker?.onPick(url);
          setPicker(null);
        }}
        restaurantId={restaurant.id}
        restaurantSlug={restaurant.slug}
        theme={theme}
      />

      {showBaseModal && (
        <div
          onClick={() => setShowBaseModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: theme.cardBg, borderRadius: 12, border: `1px solid ${theme.border}`, padding: 24, maxWidth: 440, width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', fontFamily: "'Roboto', sans-serif" }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Warning size={20} weight="thin" style={{ color: theme.danger }} />
              <h3 style={{ fontSize: 16, fontWeight: 600, color: theme.value, margin: 0 }}>Para Birimi Değişikliği</h3>
            </div>
            <p style={{ fontSize: 13, color: theme.heading, lineHeight: 1.5, margin: '0 0 16px' }}>
              Para birimini <strong style={{ color: theme.value }}>{restaurant.base_currency || 'TRY'}</strong> → <strong style={{ color: theme.value }}>{form.base_currency}</strong> olarak değiştiriyorsunuz.
              Bu işlem <strong style={{ color: theme.value }}>mevcut menü fiyatlarınızı otomatik olarak dönüştürmez</strong>. Değişikliği onayladıktan sonra tüm ürün fiyatlarınızı yeni para biriminde manuel olarak kontrol etmeniz gerekir.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowBaseModal(false)}
                style={{ ...S.btnSm, padding: '8px 16px' }}
              >
                İptal
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowBaseModal(false);
                  await performSave();
                }}
                style={{ ...S.btn, background: theme.danger, padding: '8px 16px' }}
              >
                Onayla ve Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { ProfileTab };
