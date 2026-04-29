import { useRef, useState, type CSSProperties } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { ArrowCounterClockwise, ArrowClockwise, ArrowsClockwise, X } from '@phosphor-icons/react';
import { supabase } from '../../lib/supabase';
import type { AdminTheme } from '../../lib/adminTheme';
import { rotateImage, cropImage, measureBlob } from '../../lib/imageEdit';

export interface ImageEditorSavedPayload {
  file_path: string;
  file_size: number;
  file_type: string;
  width: number;
  height: number;
}

interface Props {
  mediaId: string;
  oldFilePath: string;
  publicUrl: string;
  restaurantSlug: string;
  theme: AdminTheme;
  mode: 'standalone' | 'inline';
  onSaved: (updated: ImageEditorSavedPayload) => void | Promise<void>;
  onClose: () => void;
}

type Rotation = 0 | 90 | 180 | 270;

export default function ImageEditor({
  mediaId,
  oldFilePath,
  publicUrl,
  restaurantSlug,
  theme,
  mode,
  onSaved,
  onClose,
}: Props) {
  const [crop, setCrop] = useState<Crop | undefined>(undefined);
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | undefined>(undefined);
  const [rotation, setRotation] = useState<Rotation>(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const dirty = rotation !== 0 || (completedCrop !== undefined && completedCrop.width > 0 && completedCrop.height > 0);

  function rotateBy(delta: number) {
    setRotation((prev) => (((prev + delta) % 360) + 360) % 360 as Rotation);
    setCrop(undefined);
    setCompletedCrop(undefined);
  }

  function handleCancel() {
    if (busy) return;
    onClose();
  }

  async function handleSave() {
    if (busy || !dirty) return;
    setBusy(true);
    setError(null);

    let uploadedPath: string | null = null;
    try {
      const sourceRes = await fetch(publicUrl);
      if (!sourceRes.ok) throw new Error(`Görsel indirilemedi (${sourceRes.status})`);
      let working: Blob = await sourceRes.blob();

      if (rotation !== 0) {
        working = await rotateImage(working, rotation as 90 | 180 | 270);
      }

      if (completedCrop && completedCrop.width > 0 && completedCrop.height > 0) {
        const rotatedDims = await measureBlob(working);
        const naturalW = rotatedDims.width;
        const naturalH = rotatedDims.height;

        const img = imgRef.current;
        if (!img) throw new Error('Görsel referansı yok');
        const layoutW = img.width;
        const layoutH = img.height;
        // After CSS rotation by 90/270, the visual bounds the user (and ReactCrop's
        // bounding-rect-based pointer math) sees are swapped; for 0/180 they match
        // the layout dims.
        const swap = rotation === 90 || rotation === 270;
        const visualW = swap ? layoutH : layoutW;
        const visualH = swap ? layoutW : layoutH;

        if (visualW < 1 || visualH < 1) throw new Error('Görsel ölçüleri okunamadı');

        const sx = naturalW / visualW;
        const sy = naturalH / visualH;
        const naturalCrop = {
          x: completedCrop.x * sx,
          y: completedCrop.y * sy,
          width: completedCrop.width * sx,
          height: completedCrop.height * sy,
        };
        if (naturalCrop.width < 8 || naturalCrop.height < 8) {
          throw new Error('Kırpma bölgesi çok küçük (min 8×8 px).');
        }
        working = await cropImage(working, naturalCrop);
      }

      const finalDims = await measureBlob(working);
      const ext = finalDims.mime === 'image/png' ? 'png' : finalDims.mime === 'image/jpeg' ? 'jpg' : 'webp';
      const newPath = `${restaurantSlug}/library/edited-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const up = await supabase.storage
        .from('menu-images')
        .upload(newPath, working, { upsert: false, contentType: finalDims.mime });
      if (up.error) throw new Error(`Yükleme hatası: ${up.error.message}`);
      uploadedPath = newPath;

      const { error: updateErr } = await supabase
        .from('media_library')
        .update({
          file_path: newPath,
          file_size: finalDims.size,
          file_type: finalDims.mime,
          width: finalDims.width,
          height: finalDims.height,
        })
        .eq('id', mediaId);

      if (updateErr) {
        // Roll back the just-uploaded blob so we don't orphan storage.
        await supabase.storage.from('menu-images').remove([newPath]).catch(() => {});
        uploadedPath = null;
        throw new Error(`Kayıt başarısız: ${updateErr.message}`);
      }

      // Best-effort old-file cleanup. Orphan blob is harmless if this fails.
      if (oldFilePath && oldFilePath !== newPath) {
        const removeRes = await supabase.storage.from('menu-images').remove([oldFilePath]);
        if (removeRes.error) {
          console.warn('[ImageEditor] eski dosya silinemedi:', removeRes.error.message);
        }
      }

      const payload: ImageEditorSavedPayload = {
        file_path: newPath,
        file_size: finalDims.size,
        file_type: finalDims.mime,
        width: finalDims.width,
        height: finalDims.height,
      };
      await onSaved(payload);
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Bilinmeyen hata';
      setError(msg);
      setBusy(false);
    }
  }

  const S: Record<string, CSSProperties> = {
    backdrop: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      zIndex: 1100,
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
      fontSize: 16,
      fontWeight: 700,
      color: theme.value,
    },
    closeBtn: {
      background: 'none',
      border: 'none',
      color: theme.subtle,
      cursor: busy ? 'not-allowed' : 'pointer',
      padding: 4,
    },
    cropFrame: {
      background: '#000',
      borderRadius: 10,
      padding: 12,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 240,
    },
    img: {
      maxWidth: '100%',
      maxHeight: '60vh',
      display: 'block',
      transform: `rotate(${rotation}deg)`,
      transition: 'transform 0.2s ease',
      transformOrigin: 'center center',
    },
    rotateRow: {
      marginTop: 14,
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
      justifyContent: 'center',
    },
    rotateBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '8px 14px',
      background: 'transparent',
      color: theme.value,
      border: `1px solid ${theme.border}`,
      borderRadius: 8,
      fontSize: 13,
      cursor: busy ? 'not-allowed' : 'pointer',
    },
    footer: {
      marginTop: 16,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
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
      cursor: busy ? 'not-allowed' : 'pointer',
    },
    error: {
      marginTop: 8,
      fontSize: 12,
      color: '#EF4444',
      textAlign: 'center' as const,
    },
  };

  const saveDisabled = busy || !dirty;
  const saveStyle: CSSProperties = {
    ...S.btn,
    opacity: saveDisabled ? 0.55 : 1,
    cursor: saveDisabled ? 'not-allowed' : 'pointer',
  };

  const panel = (
    <div style={S.card}>
      <div style={S.header}>
        <div style={S.title}>Görseli Düzenle</div>
        <button style={S.closeBtn} onClick={handleCancel} aria-label="Kapat" disabled={busy}>
          <X size={20} />
        </button>
      </div>

      <div style={S.cropFrame}>
        <ReactCrop
          crop={crop}
          onChange={(_, percentCrop) => setCrop(percentCrop)}
          onComplete={(c) => setCompletedCrop(c)}
          keepSelection
        >
          <img
            ref={imgRef}
            src={publicUrl}
            alt="Düzenleniyor"
            style={S.img}
            crossOrigin="anonymous"
          />
        </ReactCrop>
      </div>

      <div style={S.rotateRow}>
        <button style={S.rotateBtn} onClick={() => rotateBy(270)} disabled={busy}>
          <ArrowCounterClockwise size={14} /> Sola
        </button>
        <button style={S.rotateBtn} onClick={() => rotateBy(90)} disabled={busy}>
          <ArrowClockwise size={14} /> Sağa
        </button>
        <button style={S.rotateBtn} onClick={() => rotateBy(180)} disabled={busy}>
          <ArrowsClockwise size={14} /> 180°
        </button>
      </div>

      <div style={S.footer}>
        <button style={S.btnGhost} onClick={handleCancel} disabled={busy}>
          İptal
        </button>
        <span style={{ flex: 1 }} />
        <button style={saveStyle} onClick={handleSave} disabled={saveDisabled}>
          {busy ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
      </div>

      {error && <div style={S.error}>{error}</div>}
    </div>
  );

  if (mode === 'standalone') {
    return (
      <div
        style={S.backdrop}
        onClick={(e) => {
          if (e.target === e.currentTarget && !busy) onClose();
        }}
      >
        {panel}
      </div>
    );
  }

  return panel;
}
