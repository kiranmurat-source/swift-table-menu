import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { QRCodeSVG } from 'qrcode.react';
import {
  CaretLeft,
  CaretRight,
  CheckCircle,
  DownloadSimple,
  ImageSquare,
  Sparkle,
  Storefront,
  VideoCamera,
  X,
} from '@phosphor-icons/react';
import { supabase } from '../lib/supabase';
import TabbledLogo from '@/components/TabbledLogo';
import MediaPickerModal, {
  attachMediaUsage,
  detachMediaUsage,
  type MediaAccept,
} from '../components/admin/MediaPickerModal';
import { getAdminTheme } from '../lib/adminTheme';

type RestaurantRow = {
  id: string;
  name: string;
  slug: string;
  restaurant_type: string | null;
  city: string | null;
  district: string | null;
  logo_url: string | null;
  cover_url: string | null;
  theme_color: string | null;
  phone: string | null;
  address: string | null;
  social_instagram: string | null;
  social_facebook: string | null;
  social_google_maps: string | null;
  onboarding_completed_at: string | null;
  trial_ends_at: string | null;
};

const RESTAURANT_TYPES: { value: string; label: string }[] = [
  { value: 'cafe', label: 'Kafe' },
  { value: 'restaurant', label: 'Restoran' },
  { value: 'hotel_restaurant', label: 'Otel Restoranı' },
  { value: 'patisserie', label: 'Pastane' },
  { value: 'bar', label: 'Bar' },
  { value: 'bakery', label: 'Fırın' },
  { value: 'other', label: 'Diğer' },
];

const TOTAL_STEPS = 5;

const C = {
  bg: '#F7F7F5',
  cardBg: '#FFFFFF',
  border: '#E5E5E3',
  text: '#1C1C1E',
  body: '#2D2D2F',
  subtle: '#6B6B6F',
  hint: '#A0A0A0',
  accent: '#FF4F7A',
  accentHover: '#E8456E',
  success: '#10B981',
  danger: '#EF4444',
  dangerBg: '#FEE2E2',
  dangerBorder: '#FECACA',
} as const;

const FONT = "'Roboto', -apple-system, sans-serif";

const inputBase: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  fontSize: 16,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  outline: 'none',
  background: C.cardBg,
  color: C.text,
  boxSizing: 'border-box',
  fontFamily: FONT,
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
};

const label: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  color: C.body,
  marginBottom: 6,
  fontFamily: FONT,
};

const errorStyle: React.CSSProperties = {
  color: C.danger,
  fontSize: 12,
  marginTop: 4,
  fontFamily: FONT,
};

const btnPrimary: React.CSSProperties = {
  padding: '11px 22px',
  fontSize: 14,
  fontWeight: 500,
  color: '#FFFFFF',
  background: C.accent,
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  fontFamily: FONT,
  transition: 'background 0.15s ease, opacity 0.15s ease',
};

const btnSecondary: React.CSSProperties = {
  padding: '11px 20px',
  fontSize: 14,
  fontWeight: 500,
  color: C.body,
  background: C.cardBg,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  fontFamily: FONT,
};

const btnGhost: React.CSSProperties = {
  padding: '11px 18px',
  fontSize: 14,
  fontWeight: 500,
  color: C.subtle,
  background: 'transparent',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  fontFamily: FONT,
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function formatTrialEnd(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function Onboarding() {
  const navigate = useNavigate();
  const mediaTheme = useMemo(() => getAdminTheme('light'), []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restaurant, setRestaurant] = useState<RestaurantRow | null>(null);
  const [step, setStep] = useState(1);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Step 1
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const [restaurantType, setRestaurantType] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({});

  // Step 2
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [themeColor, setThemeColor] = useState<'white' | 'black'>('white');

  // Step 3
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [googleMaps, setGoogleMaps] = useState('');
  const [step3Errors, setStep3Errors] = useState<Record<string, string>>({});

  // Step 4
  const [catName, setCatName] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemImageUrl, setItemImageUrl] = useState<string | null>(null);
  const [itemDescription, setItemDescription] = useState('');
  const [step4Error, setStep4Error] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiUsed, setAiUsed] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Step 5
  const [qrCreated, setQrCreated] = useState(false);
  const [qrRowId, setQrRowId] = useState<string | null>(null);
  const [qrFullUrl, setQrFullUrl] = useState('');

  // Media picker
  const [picker, setPicker] = useState<{ accept: MediaAccept; onPick: (url: string) => void | Promise<void> } | null>(null);

  // --- Initial load ---
  useEffect(() => {
    const run = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) {
        navigate('/login', { replace: true });
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('restaurant_id, role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'super_admin') {
        navigate('/dashboard', { replace: true });
        return;
      }
      if (!profile?.restaurant_id) {
        navigate('/dashboard', { replace: true });
        return;
      }

      const { data: rest } = await supabase
        .from('restaurants')
        .select(
          'id, name, slug, restaurant_type, city, district, logo_url, cover_url, theme_color, phone, address, social_instagram, social_facebook, social_google_maps, onboarding_completed_at, trial_ends_at',
        )
        .eq('id', profile.restaurant_id)
        .single();

      if (!rest) {
        navigate('/dashboard', { replace: true });
        return;
      }
      if (rest.onboarding_completed_at) {
        navigate('/dashboard', { replace: true });
        return;
      }

      const r = rest as RestaurantRow;
      setRestaurant(r);
      setName(r.name === 'İsimsiz Restoran' ? '' : r.name);
      setSlug(r.slug.startsWith('temp-') ? '' : r.slug);
      setRestaurantType(r.restaurant_type ?? '');
      setCity(r.city ?? '');
      setDistrict(r.district ?? '');
      setLogoUrl(r.logo_url);
      setCoverUrl(r.cover_url);
      setThemeColor(r.theme_color === 'black' ? 'black' : 'white');
      setPhone(r.phone ?? '');
      setAddress(r.address ?? '');
      setInstagram(r.social_instagram ?? '');
      setFacebook(r.social_facebook ?? '');
      setGoogleMaps(r.social_google_maps ?? '');

      setLoading(false);
    };
    run();
  }, [navigate]);

  // Auto-derive slug from name until user edits it directly
  useEffect(() => {
    if (slugTouched) return;
    if (!name) return;
    setSlug(slugify(name));
  }, [name, slugTouched]);

  // Debounced slug-uniqueness check
  useEffect(() => {
    if (!restaurant) return;
    if (!slug) {
      setSlugError(null);
      return;
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      setSlugError('Sadece küçük harf, rakam ve tire kullanılabilir');
      return;
    }
    let cancelled = false;
    setSlugChecking(true);
    const handle = window.setTimeout(async () => {
      const { data } = await supabase
        .from('restaurants')
        .select('id')
        .eq('slug', slug)
        .neq('id', restaurant.id)
        .limit(1);
      if (cancelled) return;
      setSlugChecking(false);
      if (data && data.length > 0) setSlugError('Bu URL zaten kullanılıyor');
      else setSlugError(null);
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [slug, restaurant]);

  // Step 5: on first enter, create QR + mark trial started (idempotent)
  useEffect(() => {
    if (step !== 5 || !restaurant || qrCreated) return;
    const run = async () => {
      const effectiveSlug = slug || restaurant.slug;
      const url = `https://tabbled.com/menu/${effectiveSlug}?table=1`;

      const { data: existing } = await supabase
        .from('qr_codes')
        .select('id')
        .eq('restaurant_id', restaurant.id)
        .eq('table_number', '1')
        .limit(1);

      let rowId = existing?.[0]?.id ?? null;
      if (!rowId) {
        const { data: inserted, error: insErr } = await supabase
          .from('qr_codes')
          .insert({
            restaurant_id: restaurant.id,
            label: 'Masa 1',
            table_number: '1',
            url,
            color: '#422B21',
            include_logo: true,
          })
          .select('id')
          .single();
        if (insErr) {
          setGlobalError(`QR kodu oluşturulamadı: ${insErr.message}`);
          return;
        }
        rowId = inserted?.id ?? null;
      }
      setQrRowId(rowId);
      setQrFullUrl(url);
      setQrCreated(true);

      const { error: rpcErr } = await supabase.rpc('start_trial', {
        p_restaurant_id: restaurant.id,
      });
      if (rpcErr) {
        setGlobalError(`Deneme başlatılamadı: ${rpcErr.message}`);
      } else {
        const { data: updated } = await supabase
          .from('restaurants')
          .select('onboarding_completed_at, trial_ends_at')
          .eq('id', restaurant.id)
          .single();
        if (updated) {
          setRestaurant((prev) =>
            prev
              ? {
                  ...prev,
                  onboarding_completed_at: updated.onboarding_completed_at,
                  trial_ends_at: updated.trial_ends_at,
                }
              : prev,
          );
        }
      }
    };
    run();
  }, [step, restaurant, qrCreated, slug]);

  // --- Validation + per-step persistence ---
  const validateStep1 = (): boolean => {
    const errs: Record<string, string> = {};
    const trimmed = name.trim();
    if (!trimmed) errs.name = 'Restoran adı zorunludur';
    else if (trimmed.length > 80) errs.name = 'En fazla 80 karakter';
    if (!slug) errs.slug = 'URL zorunludur';
    if (!restaurantType) errs.restaurantType = 'Restoran tipi seçiniz';
    if (!city.trim()) errs.city = 'Şehir zorunludur';
    setStep1Errors(errs);
    return Object.keys(errs).length === 0 && !slugError && !slugChecking;
  };

  const saveStep1 = async (): Promise<boolean> => {
    if (!restaurant) return false;
    const { error } = await supabase
      .from('restaurants')
      .update({
        name: name.trim(),
        slug,
        restaurant_type: restaurantType,
        city: city.trim(),
        district: district.trim() || null,
      })
      .eq('id', restaurant.id);
    if (error) {
      setGlobalError(`Kayıt hatası: ${error.message}`);
      return false;
    }
    return true;
  };

  const saveStep2 = async (): Promise<boolean> => {
    if (!restaurant) return false;
    const { error } = await supabase
      .from('restaurants')
      .update({
        logo_url: logoUrl,
        cover_url: coverUrl,
        theme_color: themeColor,
      })
      .eq('id', restaurant.id);
    if (error) {
      setGlobalError(`Kayıt hatası: ${error.message}`);
      return false;
    }
    return true;
  };

  const validateStep3 = (): boolean => {
    const errs: Record<string, string> = {};
    const gm = googleMaps.trim();
    if (gm && !/^https?:\/\//i.test(gm)) {
      errs.googleMaps = 'Geçerli bir URL girin (https:// ile başlamalı)';
    }
    setStep3Errors(errs);
    return Object.keys(errs).length === 0;
  };

  const saveStep3 = async (): Promise<boolean> => {
    if (!restaurant) return false;
    const { error } = await supabase
      .from('restaurants')
      .update({
        phone: phone.trim() || null,
        address: address.trim() || null,
        social_instagram: instagram.trim() || null,
        social_facebook: facebook.trim() || null,
        social_google_maps: googleMaps.trim() || null,
      })
      .eq('id', restaurant.id);
    if (error) {
      setGlobalError(`Kayıt hatası: ${error.message}`);
      return false;
    }
    return true;
  };

  const saveStep4 = async (): Promise<boolean> => {
    if (!restaurant) return false;
    setStep4Error(null);
    const catTrim = catName.trim();
    const itemTrim = itemName.trim();
    const priceTrim = itemPrice.trim();
    const descTrim = itemDescription.trim();
    const hasItem = Boolean(itemTrim || priceTrim || itemImageUrl || descTrim);
    if (hasItem && !catTrim) {
      setStep4Error('Önce kategori ekleyin');
      return false;
    }
    if (!catTrim) return true;

    const { data: cat, error: catErr } = await supabase
      .from('menu_categories')
      .insert({
        restaurant_id: restaurant.id,
        name_tr: catTrim,
        parent_id: null,
        sort_order: 0,
        translations: {},
      })
      .select('id')
      .single();
    if (catErr || !cat) {
      setGlobalError(`Kategori kaydedilemedi: ${catErr?.message ?? 'bilinmeyen hata'}`);
      return false;
    }

    if (itemTrim) {
      const priceNum = priceTrim ? parseFloat(priceTrim) : 0;
      if (Number.isNaN(priceNum) || priceNum < 0) {
        setStep4Error('Fiyat 0 veya daha büyük olmalı');
        return false;
      }
      const { data: newItem, error: itemErr } = await supabase
        .from('menu_items')
        .insert({
          restaurant_id: restaurant.id,
          category_id: cat.id,
          name_tr: itemTrim,
          description_tr: descTrim || null,
          price: priceNum,
          image_url: itemImageUrl,
          sort_order: 0,
          translations: {},
        })
        .select('id')
        .single();
      if (itemErr) {
        setGlobalError(`Ürün kaydedilemedi: ${itemErr.message}`);
        return false;
      }
      if (newItem && itemImageUrl) {
        await attachMediaUsage(itemImageUrl, {
          type: 'menu_item',
          id: newItem.id,
          field: 'image_url',
          label: itemTrim,
        });
      }
    }
    return true;
  };

  const handleGenerateDescription = async () => {
    if (!restaurant) return;
    const nameTrim = itemName.trim();
    if (!nameTrim || aiLoading || aiUsed) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://qmnrawqvkwehufebbkxp.supabase.co';
      const priceNum = itemPrice ? parseFloat(itemPrice) : 0;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-description`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: restaurant.id,
          item_id: 'new',
          name_tr: nameTrim,
          category_name: catName.trim() || '',
          price: Number.isFinite(priceNum) ? priceNum : 0,
          allergens: [],
          is_vegetarian: false,
          calories: null,
          tone: 'descriptive',
          currentDesc: itemDescription.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.description) {
        setItemDescription(data.description);
        setAiUsed(true);
      } else if (res.status === 402 && data.code === 'INSUFFICIENT_CREDITS') {
        setAiError('AI krediniz yetersiz. Plan yükselterek daha fazla açıklama üretebilirsiniz.');
      } else {
        setAiError(data.error || 'AI açıklama oluşturulamadı.');
      }
    } catch {
      setAiError('AI servisi bağlantı hatası.');
    } finally {
      setAiLoading(false);
    }
  };

  const goNext = async () => {
    if (saving) return;
    setGlobalError(null);
    setSaving(true);
    try {
      if (step === 1) {
        if (!validateStep1()) return;
        if (!(await saveStep1())) return;
        setStep(2);
      } else if (step === 2) {
        if (!(await saveStep2())) return;
        setStep(3);
      } else if (step === 3) {
        if (!validateStep3()) return;
        if (!(await saveStep3())) return;
        setStep(4);
      } else if (step === 4) {
        if (!(await saveStep4())) return;
        setStep(5);
      }
    } finally {
      setSaving(false);
    }
  };

  const goSkip = () => {
    if (saving) return;
    setGlobalError(null);
    if (step === 2) setStep(3);
    else if (step === 3) setStep(4);
    else if (step === 4) {
      setCatName('');
      setItemName('');
      setItemPrice('');
      setItemImageUrl(null);
      setStep4Error(null);
      setStep(5);
    }
  };

  const goBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const goComplete = () => {
    navigate('/dashboard', { replace: true });
  };

  const openPublicMenu = () => {
    if (!restaurant) return;
    const s = slug || restaurant.slug;
    window.open(`/menu/${s}`, '_blank', 'noopener,noreferrer');
    navigate('/dashboard', { replace: true });
  };

  // PNG download — adapted from QRManager.tsx:124-160
  const downloadPng = () => {
    if (!qrRowId) return;
    const svgEl = document.getElementById(`onboarding-qr-${qrRowId}`)?.querySelector('svg');
    if (!svgEl) return;
    const canvas = document.createElement('canvas');
    const size = 1024;
    canvas.width = size;
    canvas.height = size + 80;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 32, 32, size - 64, size - 64);
      ctx.fillStyle = C.text;
      ctx.font = "bold 32px 'Roboto', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText('Masa 1', size / 2, size + 48);
      const link = document.createElement('a');
      const s = restaurant?.slug || 'tabbled';
      link.download = `${s}-masa-1.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const openPicker = (accept: MediaAccept, onPick: (url: string) => void | Promise<void>) =>
    setPicker({ accept, onPick });

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
        <div style={{ width: 32, height: 32, border: `2px solid ${C.border}`, borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
      </div>
    );
  }

  const canAdvanceStep1 =
    Boolean(name.trim()) && Boolean(slug) && Boolean(restaurantType) && Boolean(city.trim()) && !slugError && !slugChecking;

  const showSkip = step === 2 || step === 3 || step === 4;
  const nextDisabled = saving || (step === 1 && !canAdvanceStep1);

  return (
    <>
      <Helmet>
        <title>Kuruluma Başla | Tabbled</title>
      </Helmet>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.bg, fontFamily: FONT }}>
        {/* Header */}
        <header
          style={{
            padding: '16px 24px',
            borderBottom: `1px solid ${C.border}`,
            background: C.cardBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <TabbledLogo logoType="horizontal" sizeClass="h-8" href={null} />
          <span style={{ fontSize: 13, color: C.subtle, fontWeight: 500, fontFamily: FONT }}>
            {step}/{TOTAL_STEPS}
          </span>
        </header>

        {/* Progress dots */}
        <div
          style={{
            padding: '14px 24px',
            background: C.cardBg,
            borderBottom: `1px solid ${C.border}`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {[1, 2, 3, 4, 5].map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: s === step ? 12 : 10,
                  height: s === step ? 12 : 10,
                  borderRadius: '50%',
                  background: s <= step ? C.accent : C.border,
                  transition: 'all 0.2s ease',
                }}
              />
              {i < 4 && (
                <div
                  style={{
                    width: 28,
                    height: 2,
                    background: s < step ? C.accent : C.border,
                    transition: 'background 0.2s ease',
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Body */}
        <main
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            padding: '32px 20px 120px',
          }}
        >
          <div style={{ width: '100%', maxWidth: 480 }}>
            {globalError && (
              <div
                style={{
                  padding: '10px 14px',
                  background: C.dangerBg,
                  border: `1px solid ${C.dangerBorder}`,
                  borderRadius: 8,
                  color: '#991B1B',
                  fontSize: 13,
                  marginBottom: 16,
                }}
              >
                {globalError}
              </div>
            )}

            {step === 1 && (
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 6, fontFamily: FONT }}>
                  Restoran bilgileri
                </h1>
                <p style={{ fontSize: 14, color: C.subtle, marginBottom: 24 }}>
                  Temel bilgilerle başlayalım — istediğin zaman düzenleyebilirsin.
                </p>

                <div style={{ marginBottom: 16 }}>
                  <label style={label}>
                    Restoran Adı <span style={{ color: C.danger }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={80}
                    placeholder="Örn: Café Istanbul"
                    style={{ ...inputBase, borderColor: step1Errors.name ? C.danger : C.border }}
                    autoFocus
                  />
                  {step1Errors.name && <p style={errorStyle}>{step1Errors.name}</p>}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={label}>
                    URL Slug <span style={{ color: C.danger }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                    }}
                    placeholder="cafe-istanbul"
                    style={{ ...inputBase, borderColor: slugError ? C.danger : C.border }}
                  />
                  <p style={{ fontSize: 12, color: C.hint, marginTop: 4 }}>
                    tabbled.com/menu/<strong style={{ color: C.body }}>{slug || '...'}</strong>
                    {slugChecking && <span style={{ marginLeft: 8 }}>kontrol ediliyor…</span>}
                  </p>
                  {slugError && <p style={errorStyle}>{slugError}</p>}
                  {step1Errors.slug && <p style={errorStyle}>{step1Errors.slug}</p>}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={label}>
                    Restoran Tipi <span style={{ color: C.danger }}>*</span>
                  </label>
                  <select
                    value={restaurantType}
                    onChange={(e) => setRestaurantType(e.target.value)}
                    style={{ ...inputBase, borderColor: step1Errors.restaurantType ? C.danger : C.border, appearance: 'auto' }}
                  >
                    <option value="">Seçiniz…</option>
                    {RESTAURANT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  {step1Errors.restaurantType && <p style={errorStyle}>{step1Errors.restaurantType}</p>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 8 }}>
                  <div>
                    <label style={label}>
                      Şehir <span style={{ color: C.danger }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Örn: İstanbul"
                      style={{ ...inputBase, borderColor: step1Errors.city ? C.danger : C.border }}
                    />
                    {step1Errors.city && <p style={errorStyle}>{step1Errors.city}</p>}
                  </div>
                  <div>
                    <label style={label}>İlçe</label>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="Örn: Beyoğlu"
                      style={inputBase}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 6, fontFamily: FONT }}>
                  Markanız
                </h1>
                <p style={{ fontSize: 14, color: C.subtle, marginBottom: 24 }}>
                  Logo, kapak ve tema — istediğin zaman değiştirebilirsin.
                </p>

                <div style={{ marginBottom: 20 }}>
                  <label style={label}>Logo</label>
                  {logoUrl ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img
                        src={logoUrl}
                        alt=""
                        style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: `1px solid ${C.border}`, background: C.cardBg }}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          openPicker('image', async (url) => {
                            if (!restaurant) return;
                            if (logoUrl)
                              await detachMediaUsage(logoUrl, { type: 'restaurant', id: restaurant.id, field: 'logo_url' });
                            await attachMediaUsage(url, {
                              type: 'restaurant',
                              id: restaurant.id,
                              field: 'logo_url',
                              label: 'Logo',
                            });
                            setLogoUrl(url);
                          })
                        }
                        style={btnSecondary}
                      >
                        Değiştir
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!restaurant || !logoUrl) return;
                          await detachMediaUsage(logoUrl, { type: 'restaurant', id: restaurant.id, field: 'logo_url' });
                          setLogoUrl(null);
                        }}
                        style={{ ...btnGhost, color: C.danger }}
                      >
                        Kaldır
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        openPicker('image', async (url) => {
                          if (!restaurant) return;
                          await attachMediaUsage(url, {
                            type: 'restaurant',
                            id: restaurant.id,
                            field: 'logo_url',
                            label: 'Logo',
                          });
                          setLogoUrl(url);
                        })
                      }
                      style={btnSecondary}
                    >
                      <ImageSquare size={18} weight="thin" /> Logo yükle
                    </button>
                  )}
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={label}>Kapak Görseli / Video</label>
                  {coverUrl ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 120,
                          height: 72,
                          borderRadius: 8,
                          border: `1px solid ${C.border}`,
                          background: `center/cover no-repeat url(${coverUrl})`,
                        }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() =>
                            openPicker('image', async (url) => {
                              if (!restaurant) return;
                              if (coverUrl)
                                await detachMediaUsage(coverUrl, { type: 'restaurant', id: restaurant.id, field: 'cover_url' });
                              await attachMediaUsage(url, {
                                type: 'restaurant',
                                id: restaurant.id,
                                field: 'cover_url',
                                label: 'Cover',
                              });
                              setCoverUrl(url);
                            })
                          }
                          style={btnSecondary}
                        >
                          Değiştir
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!restaurant || !coverUrl) return;
                            await detachMediaUsage(coverUrl, { type: 'restaurant', id: restaurant.id, field: 'cover_url' });
                            setCoverUrl(null);
                          }}
                          style={{ ...btnGhost, color: C.danger, alignSelf: 'flex-start', padding: '4px 0' }}
                        >
                          Kaldır
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() =>
                          openPicker('image', async (url) => {
                            if (!restaurant) return;
                            await attachMediaUsage(url, {
                              type: 'restaurant',
                              id: restaurant.id,
                              field: 'cover_url',
                              label: 'Cover',
                            });
                            setCoverUrl(url);
                          })
                        }
                        style={btnSecondary}
                      >
                        <ImageSquare size={18} weight="thin" /> Görsel
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          openPicker('video', async (url) => {
                            if (!restaurant) return;
                            await attachMediaUsage(url, {
                              type: 'restaurant',
                              id: restaurant.id,
                              field: 'cover_url',
                              label: 'Cover',
                            });
                            setCoverUrl(url);
                          })
                        }
                        style={btnSecondary}
                      >
                        <VideoCamera size={18} weight="thin" /> Video
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label style={label}>Tema</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {(['white', 'black'] as const).map((mode) => {
                      const active = themeColor === mode;
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setThemeColor(mode)}
                          style={{
                            padding: 12,
                            background: mode === 'white' ? '#FFFFFF' : '#1C1C1E',
                            color: mode === 'white' ? C.text : '#F0F0EC',
                            border: `2px solid ${active ? C.accent : C.border}`,
                            borderRadius: 10,
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontFamily: FONT,
                            transition: 'border-color 0.15s ease',
                          }}
                        >
                          <div style={{ fontSize: 14, fontWeight: 500 }}>
                            {mode === 'white' ? 'Açık' : 'Koyu'}
                          </div>
                          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                            {mode === 'white' ? 'Beyaz zemin, koyu yazı' : 'Siyah zemin, açık yazı'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 6, fontFamily: FONT }}>
                  İletişim
                </h1>
                <p style={{ fontSize: 14, color: C.subtle, marginBottom: 24 }}>
                  Müşterilerinizin size ulaşmasını kolaylaştırın.
                </p>

                <div style={{ marginBottom: 16 }}>
                  <label style={label}>Telefon</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Örn: +90 212 555 1234"
                    style={inputBase}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={label}>Adres</label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    maxLength={300}
                    placeholder="Örn: Beyoğlu, İstanbul"
                    style={{ ...inputBase, resize: 'none' as const }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={label}>Instagram</label>
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@kullaniciadi"
                    style={inputBase}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={label}>Facebook</label>
                  <input
                    type="text"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    placeholder="facebook.com/sayfaniz veya kullanici adı"
                    style={inputBase}
                  />
                </div>

                <div>
                  <label style={label}>Google Maps URL</label>
                  <input
                    type="url"
                    value={googleMaps}
                    onChange={(e) => setGoogleMaps(e.target.value)}
                    placeholder="https://maps.google.com/..."
                    style={{ ...inputBase, borderColor: step3Errors.googleMaps ? C.danger : C.border }}
                  />
                  {step3Errors.googleMaps && <p style={errorStyle}>{step3Errors.googleMaps}</p>}
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 6, fontFamily: FONT }}>
                  İlk menü öğeniz
                </h1>
                <p style={{ fontSize: 14, color: C.subtle, marginBottom: 24 }}>
                  Hızlıca başlayabilmeniz için bir kategori ve ilk ürününüzü ekleyelim.
                </p>

                <div style={{ marginBottom: 16 }}>
                  <label style={label}>İlk Kategori Adı</label>
                  <input
                    type="text"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="Örn: Sıcak İçecekler"
                    style={inputBase}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={label}>İlk Ürün Adı</label>
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="Örn: Türk Kahvesi"
                    style={inputBase}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={label}>Fiyat (₺)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={itemPrice}
                      onChange={(e) => setItemPrice(e.target.value)}
                      placeholder="0.00"
                      style={inputBase}
                    />
                  </div>
                  <div>
                    <label style={label}>Ürün Fotoğrafı</label>
                    {itemImageUrl ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img
                          src={itemImageUrl}
                          alt=""
                          style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, border: `1px solid ${C.border}` }}
                        />
                        <button
                          type="button"
                          onClick={() => setItemImageUrl(null)}
                          style={{ ...btnGhost, color: C.danger, padding: '6px 8px' }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          openPicker('image', (url) => {
                            setItemImageUrl(url);
                          })
                        }
                        style={{ ...btnSecondary, width: '100%' }}
                      >
                        <ImageSquare size={16} weight="thin" /> Seç
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 8, flexWrap: 'wrap' }}>
                    <label style={{ ...label, marginBottom: 0 }}>Açıklama</label>
                    <button
                      type="button"
                      onClick={handleGenerateDescription}
                      disabled={!itemName.trim() || aiLoading || aiUsed}
                      aria-label="AI ile açıklama oluştur"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 10px',
                        background: aiUsed ? '#F3F4F6' : '#FDF2F8',
                        color: aiUsed ? '#9CA3AF' : '#DB2777',
                        border: `1px solid ${aiUsed ? '#E5E7EB' : '#FBCFE8'}`,
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: (!itemName.trim() || aiLoading || aiUsed) ? 'not-allowed' : 'pointer',
                        opacity: !itemName.trim() ? 0.5 : 1,
                        fontFamily: FONT,
                      }}
                    >
                      <Sparkle size={14} weight="thin" />
                      {aiLoading ? 'Oluşturuluyor…' : aiUsed ? 'AI ile oluşturuldu' : 'AI ile oluştur'}
                    </button>
                  </div>
                  <textarea
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    rows={3}
                    maxLength={300}
                    placeholder="Ürününüzü kısaca tanıtın veya AI'ya yazdırın."
                    style={{ ...inputBase, resize: 'none' as const }}
                  />
                  {aiError && <p style={errorStyle}>{aiError}</p>}
                  {aiUsed && (
                    <p style={{ fontSize: 12, color: C.hint, marginTop: 4 }}>
                      Trial'da 1 AI kullanımı hakkınız vardı. Daha fazlası için Premium'a yükseltin.
                    </p>
                  )}
                </div>

                {step4Error && (
                  <div
                    style={{
                      padding: '10px 14px',
                      background: C.dangerBg,
                      border: `1px solid ${C.dangerBorder}`,
                      borderRadius: 8,
                      color: '#991B1B',
                      fontSize: 13,
                      marginBottom: 12,
                    }}
                  >
                    {step4Error}
                  </div>
                )}

                <p style={{ fontSize: 12, color: C.hint, margin: 0 }}>
                  Sonradan istediğiniz kadar ürün ekleyebilirsiniz.
                </p>
              </div>
            )}

            {step === 5 && (
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: '#ECFDF5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <CheckCircle size={32} weight="thin" color={C.success} />
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 6, fontFamily: FONT }}>
                  Menünüz Hazır!
                </h1>
                <p style={{ fontSize: 14, color: C.subtle, marginBottom: 24 }}>
                  QR kodunuzu indirip masalarınıza yerleştirin.
                </p>

                <div
                  style={{
                    display: 'inline-block',
                    padding: 20,
                    background: C.cardBg,
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                    marginBottom: 16,
                  }}
                >
                  {qrRowId ? (
                    <div id={`onboarding-qr-${qrRowId}`}>
                      <QRCodeSVG
                        value={qrFullUrl}
                        size={240}
                        fgColor="#422B21"
                        bgColor="#ffffff"
                        level="M"
                        imageSettings={
                          logoUrl
                            ? { src: logoUrl, height: 48, width: 48, excavate: true }
                            : undefined
                        }
                      />
                    </div>
                  ) : (
                    <div style={{ width: 240, height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 28, height: 28, border: `2px solid ${C.border}`, borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                    </div>
                  )}
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginTop: 12 }}>
                    {restaurant?.name || name || '—'}
                  </div>
                  <div style={{ fontSize: 12, color: C.hint, marginTop: 2 }}>Masa 1</div>
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
                  <button type="button" onClick={downloadPng} disabled={!qrRowId} style={{ ...btnSecondary, opacity: qrRowId ? 1 : 0.5 }}>
                    <DownloadSimple size={16} weight="thin" /> PNG İndir
                  </button>
                </div>

                <div
                  style={{
                    padding: 16,
                    background: '#FFFBEB',
                    border: '1px solid #FDE68A',
                    borderRadius: 10,
                    textAlign: 'left',
                    marginBottom: 20,
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#92400E', marginBottom: 4 }}>
                    14 günlük ücretsiz denemeniz başladı
                  </div>
                  <div style={{ fontSize: 13, color: '#78350F', marginBottom: 4 }}>
                    Deneme bitiminden önce bir plan seçerek devam edebilirsiniz.
                  </div>
                  {restaurant?.trial_ends_at && (
                    <div style={{ fontSize: 12, color: '#92400E' }}>
                      Bitiş: {formatTrialEnd(restaurant.trial_ends_at)}
                    </div>
                  )}
                </div>

                <button type="button" onClick={openPublicMenu} style={{ ...btnPrimary, width: '100%', padding: '13px 22px' }}>
                  <Storefront size={18} weight="thin" /> Public Menüye Git
                </button>
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer
          style={{
            position: 'sticky',
            bottom: 0,
            background: C.cardBg,
            borderTop: `1px solid ${C.border}`,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <button type="button" onClick={goBack} disabled={step === 1 || saving} style={{ ...btnGhost, opacity: step === 1 ? 0.4 : 1 }}>
            <CaretLeft size={16} weight="thin" /> Geri
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {showSkip && (
              <button type="button" onClick={goSkip} disabled={saving} style={btnGhost}>
                Atla
              </button>
            )}
            {step < 5 && (
              <button
                type="button"
                onClick={goNext}
                disabled={nextDisabled}
                style={{ ...btnPrimary, opacity: nextDisabled ? 0.5 : 1, cursor: nextDisabled ? 'default' : 'pointer' }}
              >
                {saving ? 'Kaydediliyor…' : 'İleri'} <CaretRight size={16} weight="thin" />
              </button>
            )}
            {step === 5 && (
              <button type="button" onClick={goComplete} style={btnPrimary}>
                Tamamla <CaretRight size={16} weight="thin" />
              </button>
            )}
          </div>
        </footer>
      </div>

      {/* Media Picker */}
      {restaurant && (
        <MediaPickerModal
          isOpen={!!picker}
          onClose={() => setPicker(null)}
          onSelect={({ url }) => {
            const cb = picker?.onPick;
            setPicker(null);
            if (cb) Promise.resolve(cb(url)).catch(() => { /* swallow */ });
          }}
          accept={picker?.accept ?? 'image'}
          restaurantId={restaurant.id}
          restaurantSlug={restaurant.slug}
          theme={mediaTheme}
        />
      )}
    </>
  );
}
