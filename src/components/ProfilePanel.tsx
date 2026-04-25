import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Star, Globe, Image, Trash, Link, Package, Info, SquaresFour, Palette, ArrowsClockwise, User, CurrencyCircleDollar, Warning } from "@phosphor-icons/react";
import type { AdminTheme } from '../lib/adminTheme';
import { getOptimizedImageUrl, handleImageError } from '../lib/imageUtils';
import { THEMES } from '../lib/themes';
import { Restaurant, DAY_KEYS, DAY_LABELS, DEFAULT_DAY, makeStyles } from './admin/dashboardShared';
import MediaPickerModal, { type MediaAccept, attachMediaUsage, detachMediaUsage } from './admin/MediaPickerModal';

const SUPABASE_URL = 'https://qmnrawqvkwehufebbkxp.supabase.co';

// LEGACY: feature_* toggles deprecated 25 Apr 2026.
// Features now controlled by plan tier + plan_overrides JSONB (super admin only).
// Keeping code dormant until cleanup migration removes feature_* DB columns.
const SHOW_LEGACY_FEATURE_TOGGLES = false;

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
    feature_multi_currency: restaurant.feature_multi_currency ?? false,
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
      feature_multi_currency: form.feature_multi_currency,
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
        feature_waiter_calls: form.feature_waiter_calls,
        feature_cart: form.feature_cart,
        feature_whatsapp_order: form.feature_whatsapp_order,
        feature_feedback: form.feature_feedback,
        feature_discount_codes: form.feature_discount_codes,
        feature_likes: form.feature_likes,
        feature_reviews: form.feature_reviews,
        feature_multi_currency: form.feature_multi_currency,
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
