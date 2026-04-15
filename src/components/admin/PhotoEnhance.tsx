import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { supabase } from '../../lib/supabase';
import type { AdminTheme } from '../../lib/adminTheme';
import {
  Sparkle,
  X,
  ArrowsHorizontal,
  Warning,
  CheckCircle,
  FloppyDisk,
  Aperture,
  SunDim,
  Square,
} from '@phosphor-icons/react';

type AngleOpt = 'original' | '45' | '90';
type LightingOpt = 'original' | 'studio' | 'natural';
type SurfaceOpt = 'original' | 'wood' | 'light_marble' | 'dark_marble' | 'white' | 'black';

const ANGLE_OPTIONS: { value: AngleOpt; label: string; desc: string }[] = [
  { value: 'original', label: 'Orijinal', desc: 'Değiştirme' },
  { value: '45', label: '45° Açı', desc: '3/4 yemek açısı' },
  { value: '90', label: '90° Kuşbakışı', desc: 'Flat lay' },
];
const LIGHTING_OPTIONS: { value: LightingOpt; label: string; desc: string }[] = [
  { value: 'original', label: 'Orijinal', desc: 'Sadece düzeltme' },
  { value: 'studio', label: 'Stüdyo', desc: 'Profesyonel, gölgesiz' },
  { value: 'natural', label: 'Doğal', desc: 'Pencere kenarı, sıcak' },
];
const SURFACE_OPTIONS: { value: SurfaceOpt; label: string; swatch: string }[] = [
  { value: 'original', label: 'Orijinal', swatch: 'transparent' },
  { value: 'wood', label: 'Ahşap', swatch: 'linear-gradient(135deg,#9B6F43,#6B4823)' },
  { value: 'light_marble', label: 'Açık Mermer', swatch: 'linear-gradient(135deg,#F5F2EC,#D8D2C3)' },
  { value: 'dark_marble', label: 'Koyu Mermer', swatch: 'linear-gradient(135deg,#3A3A3C,#1C1C1E)' },
  { value: 'white', label: 'Beyaz Düz', swatch: '#FFFFFF' },
  { value: 'black', label: 'Siyah Düz', swatch: '#111111' },
];

const SUPABASE_URL = 'https://qmnrawqvkwehufebbkxp.supabase.co';

interface Props {
  restaurantId: string;
  /** Kaynak (orijinal) görsel URL — public bir URL olmalı, base64'e çevrilir */
  originalUrl: string;
  theme: AdminTheme;
  onClose: () => void;
  /**
   * Kullanıcı kaydet dedi. `enhancedBlob` yeni görsel, `mimeType` ile beraber.
   * Parent bunu Storage'a yükler + media_library row'u oluşturur + kredi düşer.
   */
  onSave: (enhancedBlob: Blob, mimeType: string) => Promise<void> | void;
}

async function urlToBase64DataUrl(url: string): Promise<string> {
  const res = await fetch(url, { mode: 'cors' });
  const blob = await res.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64: string, mime: string): Blob {
  const binStr = atob(base64);
  const len = binStr.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binStr.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export default function PhotoEnhance({ restaurantId, originalUrl, theme, onClose, onSave }: Props) {
  const [status, setStatus] = useState<'confirm' | 'loading' | 'compare' | 'saving' | 'error'>('confirm');
  const [error, setError] = useState<string | null>(null);
  const [enhanced, setEnhanced] = useState<{ base64: string; mime: string } | null>(null);
  const [sliderPercent, setSliderPercent] = useState(50);
  const [angle, setAngle] = useState<AngleOpt>('original');
  const [lighting, setLighting] = useState<LightingOpt>('original');
  const [surface, setSurface] = useState<SurfaceOpt>('original');

  const runEnhance = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const dataUrl = await urlToBase64DataUrl(originalUrl);

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch(`${SUPABASE_URL}/functions/v1/enhance-photo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          image: dataUrl,
          restaurant_id: restaurantId,
          options: { angle, lighting, surface },
        }),
      });

      const body = await res.json();
      if (!res.ok || !body.ok) {
        throw new Error(body?.error || 'İyileştirme başarısız');
      }

      setEnhanced({ base64: body.enhanced_base64, mime: body.mime_type || 'image/png' });
      setStatus('compare');
    } catch (e) {
      setError((e as Error).message);
      setStatus('error');
    }
  }, [originalUrl, restaurantId, angle, lighting, surface]);

  // Drag slider
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const handleMove = (clientX: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setSliderPercent(Math.max(0, Math.min(100, pct)));
  };
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => { if (dragging.current) handleMove(e.clientX); };
    const onTouchMove = (e: TouchEvent) => { if (dragging.current && e.touches[0]) handleMove(e.touches[0].clientX); };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onUp);
    };
  }, []);

  async function save() {
    if (!enhanced) return;
    setStatus('saving');
    try {
      const blob = base64ToBlob(enhanced.base64, enhanced.mime);
      await onSave(blob, enhanced.mime);
      onClose();
    } catch (e) {
      setError((e as Error).message);
      setStatus('error');
    }
  }

  const S: Record<string, CSSProperties> = {
    backdrop: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    card: {
      background: theme.cardBg,
      border: `1px solid ${theme.cardBorder}`,
      borderRadius: 12,
      padding: 20,
      maxWidth: 760,
      width: '100%',
      maxHeight: '92vh',
      overflowY: 'auto',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    title: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 18,
      fontWeight: 700,
      color: theme.value,
    },
    btn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '10px 16px',
      background: theme.accent,
      color: '#FFFFFF',
      border: 'none',
      borderRadius: 8,
      fontSize: 13,
      fontWeight: 500,
      cursor: 'pointer',
    },
    btnGhost: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '10px 16px',
      background: 'transparent',
      color: theme.value,
      border: `1px solid ${theme.border}`,
      borderRadius: 8,
      fontSize: 13,
      cursor: 'pointer',
    },
    compareWrap: {
      position: 'relative',
      width: '100%',
      aspectRatio: '4/3',
      background: '#000',
      borderRadius: 10,
      overflow: 'hidden',
      userSelect: 'none',
      touchAction: 'none',
    },
    imgFull: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      background: '#000',
    } as CSSProperties,
    clipLayer: {
      position: 'absolute',
      inset: 0,
      clipPath: `inset(0 ${100 - sliderPercent}% 0 0)`,
      transition: dragging.current ? 'none' : 'clip-path 0.1s ease',
    },
    handle: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: `${sliderPercent}%`,
      width: 3,
      background: '#FFFFFF',
      boxShadow: '0 0 8px rgba(0,0,0,0.5)',
      cursor: 'ew-resize',
      transform: 'translateX(-50%)',
    },
    handleKnob: {
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      width: 36,
      height: 36,
      borderRadius: '50%',
      background: '#FFFFFF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      color: theme.accent,
    },
    label: {
      position: 'absolute',
      top: 10,
      padding: '4px 10px',
      borderRadius: 6,
      fontSize: 11,
      fontWeight: 600,
      color: '#FFFFFF',
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)',
    },
    groupLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 12,
      fontWeight: 600,
      color: theme.value,
      marginBottom: 8,
    },
    radioRow: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 8,
    },
    radioCard: {
      padding: '10px 8px',
      borderRadius: 8,
      border: `1px solid ${theme.border}`,
      background: theme.pageBg,
      cursor: 'pointer',
      textAlign: 'center',
      transition: 'all 0.15s',
    },
    radioCardActive: {
      borderColor: theme.accent,
      background: theme.infoBg,
    },
    surfaceGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 8,
    },
    surfaceCard: {
      padding: 8,
      borderRadius: 8,
      border: `1px solid ${theme.border}`,
      background: theme.pageBg,
      cursor: 'pointer',
      textAlign: 'center',
      transition: 'all 0.15s',
    },
  };

  return (
    <div style={S.backdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={S.card}>
        <div style={S.header}>
          <div style={S.title}>
            <Sparkle size={20} weight="fill" color="#A855F7" /> AI Fotoğraf İyileştirme
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: theme.subtle, cursor: 'pointer', padding: 4 }}
            aria-label="Kapat"
          >
            <X size={20} />
          </button>
        </div>

        {status === 'confirm' && (
          <div>
            <img src={originalUrl} alt="" style={{ width: '100%', borderRadius: 10, maxHeight: 280, objectFit: 'contain', background: theme.pageBg }} />

            {/* Açı */}
            <div style={{ marginTop: 16 }}>
              <div style={S.groupLabel}>
                <Aperture size={14} weight="thin" /> Çekim Açısı
              </div>
              <div style={S.radioRow}>
                {ANGLE_OPTIONS.map((o) => {
                  const active = angle === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setAngle(o.value)}
                      style={{ ...S.radioCard, ...(active ? S.radioCardActive : null) }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 600, color: active ? theme.accent : theme.value }}>
                        {o.label}
                      </div>
                      <div style={{ fontSize: 10, color: theme.subtle, marginTop: 2 }}>{o.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Işık */}
            <div style={{ marginTop: 14 }}>
              <div style={S.groupLabel}>
                <SunDim size={14} weight="thin" /> Işıklandırma
              </div>
              <div style={S.radioRow}>
                {LIGHTING_OPTIONS.map((o) => {
                  const active = lighting === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setLighting(o.value)}
                      style={{ ...S.radioCard, ...(active ? S.radioCardActive : null) }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 600, color: active ? theme.accent : theme.value }}>
                        {o.label}
                      </div>
                      <div style={{ fontSize: 10, color: theme.subtle, marginTop: 2 }}>{o.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Zemin */}
            <div style={{ marginTop: 14 }}>
              <div style={S.groupLabel}>
                <Square size={14} weight="thin" /> Zemin
              </div>
              <div style={S.surfaceGrid}>
                {SURFACE_OPTIONS.map((o) => {
                  const active = surface === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setSurface(o.value)}
                      style={{ ...S.surfaceCard, ...(active ? S.radioCardActive : null) }}
                    >
                      <div
                        style={{
                          width: '100%',
                          height: 28,
                          borderRadius: 6,
                          background: o.swatch,
                          border: `1px solid ${theme.border}`,
                          marginBottom: 6,
                          position: 'relative',
                        }}
                      >
                        {o.value === 'original' && (
                          <div style={{
                            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: 10, color: theme.subtle,
                          }}>—</div>
                        )}
                        {active && (
                          <div style={{ position: 'absolute', top: 2, right: 2, color: theme.accent }}>
                            <CheckCircle size={14} weight="fill" />
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: active ? theme.accent : theme.value }}>
                        {o.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                marginTop: 14,
                padding: 10,
                borderRadius: 8,
                background: theme.infoBg,
                color: theme.info,
                fontSize: 11,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Sparkle size={12} />
              <span>1 kredi kullanılacak. Yemek asla değiştirilmez — sadece seçtiğiniz iyileştirmeler uygulanır.</span>
            </div>
            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button style={S.btnGhost} onClick={onClose}>İptal</button>
              <button style={S.btn} onClick={runEnhance}>
                <Sparkle size={14} weight="fill" /> İyileştir
              </button>
            </div>
          </div>
        )}

        {status === 'loading' && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                border: `3px solid ${theme.border}`,
                borderTopColor: theme.accent,
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto',
              }}
            />
            <div style={{ marginTop: 12, fontSize: 14, color: theme.value, fontWeight: 500 }}>
              İyileştiriliyor...
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: theme.subtle }}>
              Bu işlem 10-20 saniye sürebilir
            </div>
          </div>
        )}

        {status === 'compare' && enhanced && (
          <div>
            <div
              ref={wrapRef}
              style={S.compareWrap}
              onMouseDown={(e) => { dragging.current = true; handleMove(e.clientX); }}
              onTouchStart={(e) => { dragging.current = true; if (e.touches[0]) handleMove(e.touches[0].clientX); }}
            >
              <img src={originalUrl} alt="Orijinal" style={S.imgFull} draggable={false} />
              <div style={S.clipLayer}>
                <img
                  src={`data:${enhanced.mime};base64,${enhanced.base64}`}
                  alt="İyileştirilmiş"
                  style={S.imgFull}
                  draggable={false}
                />
              </div>
              <div style={S.handle}>
                <div style={S.handleKnob}><ArrowsHorizontal size={18} /></div>
              </div>
              <div style={{ ...S.label, left: 10 }}>İyileştirilmiş</div>
              <div style={{ ...S.label, right: 10 }}>Orijinal</div>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: theme.subtle, textAlign: 'center' }}>
              Karşılaştırmak için sürükleyin
            </div>
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <button style={S.btnGhost} onClick={onClose}>İptal (kredi iade edilmez)</button>
              <button style={S.btn} onClick={save}>
                <FloppyDisk size={14} /> Kaydet
              </button>
            </div>
          </div>
        )}

        {status === 'saving' && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: `3px solid ${theme.border}`,
                borderTopColor: theme.accent,
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto',
              }}
            />
            <div style={{ marginTop: 12, fontSize: 13, color: theme.value }}>Kaydediliyor...</div>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div
              style={{
                padding: 12,
                borderRadius: 8,
                background: theme.dangerBg,
                color: theme.danger,
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Warning size={16} /> {error || 'Bilinmeyen hata'}
            </div>
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button style={S.btnGhost} onClick={onClose}>Kapat</button>
              <button style={S.btn} onClick={runEnhance}>Tekrar Dene</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
