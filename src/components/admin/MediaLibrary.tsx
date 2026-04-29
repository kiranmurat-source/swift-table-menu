import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { supabase } from '../../lib/supabase';
import { getOptimizedImageUrl, handleImageError } from '../../lib/imageUtils';
import { useAICredits } from '../../hooks/useAICredits';
import { AI_CREDIT_COSTS, consumeAICredits } from '../../lib/aiCredits';
import type { AdminTheme } from '../../lib/adminTheme';
import {
  UploadSimple,
  Images,
  Trash,
  Sparkle,
  X,
  MagnifyingGlass,
  Tag as TagIcon,
  Copy,
  Warning,
  CheckCircle,
  Funnel,
  VideoCamera,
  PencilSimple,
} from '@phosphor-icons/react';
import PhotoEnhance from './PhotoEnhance';
import ImageEditor from './ImageEditor';
import { measureBlob } from '../../lib/imageEdit';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_WIDTH = 1920;

export type MediaTag = 'product' | 'category' | 'logo' | 'cover' | 'promo';

export interface MediaItem {
  id: string;
  restaurant_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  width: number | null;
  height: number | null;
  file_hash: string | null;
  tags: string[];
  used_in: Array<{ type: string; id: string; label?: string }>;
  ai_enhanced: boolean;
  original_id: string | null;
  duration_seconds: number | null;
  created_at: string;
}

interface Props {
  restaurantId: string;
  restaurantSlug: string;
  theme: AdminTheme;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** SHA-256 of file contents (hex) */
async function hashFile(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Client-side resize (canvas). Genişlik > MAX_WIDTH ise oransal küçültür.
 * Mümkünse WebP olarak döndürür; değilse orijinal tipi korur.
 * Küçültme gerekmiyorsa orijinal File'ı geri döner.
 */
async function probeVideoMeta(file: File): Promise<{ duration: number; width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.src = url;
    const cleanup = () => URL.revokeObjectURL(url);
    video.onloadedmetadata = () => {
      const meta = {
        duration: Math.round(video.duration || 0),
        width: video.videoWidth || 0,
        height: video.videoHeight || 0,
      };
      cleanup();
      resolve(meta);
    };
    video.onerror = () => {
      cleanup();
      resolve(null);
    };
  });
}

async function resizeImageIfNeeded(file: File): Promise<{ file: File; width: number; height: number }> {
  const imgBitmap = await createImageBitmap(file).catch(() => null);
  if (!imgBitmap) return { file, width: 0, height: 0 };
  const { width, height } = imgBitmap;

  if (width <= MAX_WIDTH) {
    imgBitmap.close();
    return { file, width, height };
  }

  const scale = MAX_WIDTH / width;
  const newW = Math.round(width * scale);
  const newH = Math.round(height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = newW;
  canvas.height = newH;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    imgBitmap.close();
    return { file, width, height };
  }
  ctx.drawImage(imgBitmap, 0, 0, newW, newH);
  imgBitmap.close();

  const preferWebp = file.type !== 'image/png' || true;
  const targetType = preferWebp ? 'image/webp' : file.type;
  const blob: Blob | null = await new Promise((res) =>
    canvas.toBlob(res, targetType, 0.88),
  );
  if (!blob) return { file, width, height };
  const newName = file.name.replace(/\.[^/.]+$/, '') + (preferWebp ? '.webp' : `.${file.name.split('.').pop()}`);
  return {
    file: new File([blob], newName, { type: targetType }),
    width: newW,
    height: newH,
  };
}

export default function MediaLibrary({ restaurantId, restaurantSlug, theme }: Props) {
  const credits = useAICredits(restaurantId);

  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [msg, setMsg] = useState<{ text: string; kind: 'ok' | 'err' | 'warn' } | null>(null);
  const [filter, setFilter] = useState<'all' | MediaTag | 'unused' | 'ai' | 'images' | 'videos'>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [enhanceTarget, setEnhanceTarget] = useState<MediaItem | null>(null);
  const [editTarget, setEditTarget] = useState<MediaItem | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadMedia = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('media_library')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });
    if (!error && data) setItems(data as MediaItem[]);
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  const flash = (text: string, kind: 'ok' | 'err' | 'warn' = 'ok') => {
    setMsg({ text, kind });
    window.setTimeout(() => setMsg(null), 4000);
  };

  const doUpload = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files).filter(
        (f) => f.type.startsWith('image/') || f.type.startsWith('video/'),
      );
      if (arr.length === 0) return;

      // Kota kontrolü
      const willExceed = credits.storageUsedBytes + arr.reduce((s, f) => s + f.size, 0);
      if (willExceed > credits.storageLimitMb * 1024 * 1024) {
        flash(`Storage kotası aşılacak (${credits.storageLimitMb} MB). Bazı dosyaları silin.`, 'err');
        return;
      }

      setUploading(true);
      setProgress({ current: 0, total: arr.length });
      let done = 0;
      let duplicates = 0;
      let errors = 0;

      for (const rawFile of arr) {
        try {
          const isVideo = rawFile.type.startsWith('video/');
          const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
          if (rawFile.size > maxSize) {
            flash(`"${rawFile.name}" ${isVideo ? '50' : '5'}MB sınırını aşıyor — atlandı.`, 'warn');
            errors++;
            setProgress({ current: ++done, total: arr.length });
            continue;
          }

          const hash = await hashFile(rawFile);

          const dup = await supabase
            .from('media_library')
            .select('id, file_name')
            .eq('restaurant_id', restaurantId)
            .eq('file_hash', hash)
            .maybeSingle();
          if (dup.data) {
            duplicates++;
            setProgress({ current: ++done, total: arr.length });
            continue;
          }

          let toUpload: File = rawFile;
          let width = 0;
          let height = 0;
          let duration: number | null = null;
          let folder = 'images';

          if (isVideo) {
            folder = 'videos';
            const meta = await probeVideoMeta(rawFile);
            if (meta) {
              width = meta.width;
              height = meta.height;
              duration = meta.duration;
            }
          } else {
            const r = await resizeImageIfNeeded(rawFile);
            toUpload = r.file;
            width = r.width;
            height = r.height;
          }

          const ext = toUpload.name.split('.').pop() || (isVideo ? 'mp4' : 'webp');
          const path = `${restaurantSlug}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

          const up = await supabase.storage
            .from('menu-images')
            .upload(path, toUpload, { upsert: false, contentType: toUpload.type });
          if (up.error) {
            errors++;
            setProgress({ current: ++done, total: arr.length });
            continue;
          }

          await supabase.from('media_library').insert({
            restaurant_id: restaurantId,
            file_name: rawFile.name,
            file_path: path,
            file_size: toUpload.size,
            file_type: toUpload.type,
            width: width || null,
            height: height || null,
            file_hash: hash,
            tags: [],
            used_in: [],
            duration_seconds: duration,
          });
        } catch {
          errors++;
        }
        setProgress({ current: ++done, total: arr.length });
      }

      setUploading(false);
      setProgress(null);
      if (duplicates > 0) flash(`${arr.length - errors} yüklendi · ${duplicates} zaten mevcut`, 'warn');
      else if (errors > 0) flash(`${arr.length - errors} yüklendi · ${errors} hata`, 'warn');
      else flash(`${arr.length} görsel yüklendi.`, 'ok');
      loadMedia();
      credits.refresh();
    },
    [credits, restaurantId, restaurantSlug, loadMedia],
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) doUpload(e.dataTransfer.files);
  };

  async function deleteItem(item: MediaItem) {
    if (item.used_in && item.used_in.length > 0) {
      if (!window.confirm(`Bu görsel ${item.used_in.length} yerde kullanılıyor. Yine de silmek istiyor musunuz?`)) return;
    } else {
      if (!window.confirm('Bu görseli silmek istediğinizden emin misiniz?')) return;
    }
    await supabase.storage.from('menu-images').remove([item.file_path]);
    await supabase.from('media_library').delete().eq('id', item.id);
    setSelected(null);
    flash('Silindi', 'ok');
    loadMedia();
    credits.refresh();
  }

  function getPublicUrl(path: string): string {
    const { data } = supabase.storage.from('menu-images').getPublicUrl(path);
    return data.publicUrl;
  }

  /**
   * PhotoEnhance'ten gelen iyileştirilmiş blob'u Storage'a yükler, media_library'ye
   * ai_enhanced=true + original_id olarak yeni row ekler, kredi düşer, log yazar.
   */
  async function handleEnhanceSave(
    source: MediaItem,
    blob: Blob,
    mimeType: string,
  ): Promise<{ id: string; file_path: string } | null> {
    // Kota kontrolü
    if (credits.storageUsedBytes + blob.size > credits.storageLimitMb * 1024 * 1024) {
      flash('Storage kotası aşılacak — önce eski görseller silinmeli.', 'err');
      return null;
    }

    const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
    const path = `${restaurantSlug}/library/enhanced-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const up = await supabase.storage
      .from('menu-images')
      .upload(path, blob, { upsert: false, contentType: mimeType });
    if (up.error) throw new Error(`Yükleme hatası: ${up.error.message}`);

    // Hash hesapla (duplicate için)
    const hashBuf = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
    const hash = Array.from(new Uint8Array(hashBuf)).map((b) => b.toString(16).padStart(2, '0')).join('');

    const dims = await measureBlob(blob).catch(() => ({ width: 0, height: 0 } as { width: number; height: number }));

    const { data: inserted, error: insErr } = await supabase
      .from('media_library')
      .insert({
        restaurant_id: restaurantId,
        file_name: `enhanced-${source.file_name}`,
        file_path: path,
        file_size: blob.size,
        file_type: mimeType,
        width: dims.width || null,
        height: dims.height || null,
        file_hash: hash,
        tags: source.tags,
        used_in: [],
        ai_enhanced: true,
        original_id: source.id,
      })
      .select()
      .single();
    if (insErr || !inserted) throw new Error(insErr?.message || 'Kayıt başarısız');

    // Atomik kredi düş + log
    const consumed = await consumeAICredits({
      restaurantId,
      amount: AI_CREDIT_COSTS.photoEnhance,
      actionType: 'photo_enhance',
      input: { source_id: source.id, source_path: source.file_path },
      output: { new_id: inserted.id, new_path: path },
    });
    if (!consumed) {
      flash('Kredi düşürülemedi — yetersiz kredi olabilir.', 'warn');
    }

    flash('Fotoğraf iyileştirildi ve kaydedildi.', 'ok');
    setSelected(null);
    loadMedia();
    credits.refresh();
    return { id: inserted.id, file_path: path };
  }

  async function deleteItemSilent(id: string) {
    try {
      const { data: row } = await supabase
        .from('media_library')
        .select('file_path')
        .eq('id', id)
        .single();
      if (row?.file_path) {
        await supabase.storage.from('menu-images').remove([row.file_path]);
      }
      await supabase.from('media_library').delete().eq('id', id);
      loadMedia();
      credits.refresh();
    } catch (e) {
      console.error('Geri al başarısız', e);
      flash('Geri al başarısız', 'err');
    }
  }

  function copyUrl(item: MediaItem) {
    const url = getPublicUrl(item.file_path);
    navigator.clipboard?.writeText(url).then(
      () => flash('URL kopyalandı', 'ok'),
      () => flash('Kopyalama başarısız', 'err'),
    );
  }

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      const isVideo = it.file_type.startsWith('video/');
      if (filter === 'images' && isVideo) return false;
      if (filter === 'videos' && !isVideo) return false;
      if (filter === 'unused' && it.used_in.length > 0) return false;
      if (filter === 'ai' && !it.ai_enhanced) return false;
      if (filter !== 'all' && filter !== 'unused' && filter !== 'ai' && filter !== 'images' && filter !== 'videos') {
        if (!it.tags.includes(filter)) return false;
      }
      if (q && !it.file_name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, filter, search]);

  const quotaColor = credits.storagePercent < 50 ? '#22C55E' : credits.storagePercent < 80 ? '#F59E0B' : '#EF4444';

  const S: Record<string, CSSProperties> = {
    wrap: { display: 'flex', flexDirection: 'column', gap: 16 },
    card: {
      background: theme.cardBg,
      border: `1px solid ${theme.cardBorder}`,
      borderRadius: 12,
      padding: 16,
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 12,
    },
    title: {
      fontSize: 20,
      fontWeight: 700,
      color: theme.value,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    },
    btn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '8px 14px',
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
      padding: '8px 14px',
      background: 'transparent',
      color: theme.value,
      border: `1px solid ${theme.border}`,
      borderRadius: 8,
      fontSize: 13,
      cursor: 'pointer',
    },
    quotaBar: {
      height: 8,
      background: theme.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    quotaFill: {
      height: '100%',
      background: quotaColor,
      width: `${credits.storagePercent}%`,
      transition: 'width 0.3s ease',
    },
    dropzone: {
      marginTop: 12,
      border: `2px dashed ${dragOver ? theme.accent : theme.border}`,
      borderRadius: 10,
      padding: 20,
      textAlign: 'center',
      background: dragOver ? `${theme.accent}10` : theme.pageBg,
      color: theme.heading,
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    },
    filterRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    },
    chip: (active: boolean): CSSProperties => ({
      padding: '6px 12px',
      borderRadius: 20,
      border: `1px solid ${active ? theme.accent : theme.border}`,
      background: active ? theme.accent : 'transparent',
      color: active ? '#FFFFFF' : theme.value,
      fontSize: 12,
      cursor: 'pointer',
    }),
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
      gap: 12,
    },
    thumbCard: {
      position: 'relative',
      borderRadius: 10,
      overflow: 'hidden',
      background: theme.pageBg,
      border: `1px solid ${theme.cardBorder}`,
      cursor: 'pointer',
      aspectRatio: '1/1',
    },
    thumbImg: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    } as CSSProperties,
    thumbMeta: {
      position: 'absolute',
      left: 6,
      right: 6,
      bottom: 6,
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      flexWrap: 'wrap',
    },
    metaTag: {
      fontSize: 10,
      background: 'rgba(0,0,0,0.6)',
      color: '#FFFFFF',
      padding: '2px 6px',
      borderRadius: 4,
    },
    aiBadge: {
      position: 'absolute',
      top: 6,
      right: 6,
      background: '#A855F7',
      color: '#fff',
      borderRadius: '50%',
      width: 22,
      height: 22,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    unusedBadge: {
      position: 'absolute',
      top: 6,
      left: 6,
      background: '#F59E0B',
      color: '#fff',
      fontSize: 9,
      fontWeight: 600,
      padding: '2px 6px',
      borderRadius: 4,
    },
    modal: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      zIndex: 999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    modalCard: {
      background: theme.cardBg,
      border: `1px solid ${theme.cardBorder}`,
      borderRadius: 12,
      padding: 20,
      maxWidth: 640,
      width: '100%',
      maxHeight: '90vh',
      overflowY: 'auto',
    },
    input: {
      padding: '8px 12px',
      border: `1px solid ${theme.inputBorder}`,
      background: theme.inputBg,
      color: theme.inputText,
      borderRadius: 8,
      fontSize: 13,
      outline: 'none',
      minWidth: 180,
    },
  };

  return (
    <div style={S.wrap}>
      {/* Header + quota + credits */}
      <div style={S.card}>
        <div style={S.header}>
          <div style={S.title}>
            <Images size={22} /> Medya Kütüphanesi
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 12, color: theme.heading }}>
              AI Kredisi: <b style={{ color: theme.value }}>{credits.creditsRemaining}/{credits.creditsTotal}</b>
            </div>
            <button style={S.btn} onClick={() => fileRef.current?.click()} disabled={uploading}>
              <UploadSimple size={16} /> {uploading ? 'Yükleniyor...' : 'Medya Yükle'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files?.length) doUpload(e.target.files);
                e.target.value = '';
              }}
            />
          </div>
        </div>

        {/* Quota bar */}
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: theme.heading, minWidth: 160 }}>
            Kullanım:{' '}
            <b style={{ color: theme.value }}>
              {credits.storageUsedMb.toFixed(1)} MB
            </b>{' '}
            / {credits.storageLimitMb} MB
          </span>
          <div style={{ ...S.quotaBar, flex: 1 }}>
            <div style={S.quotaFill} />
          </div>
          <span style={{ fontSize: 12, color: quotaColor, fontWeight: 600, minWidth: 40, textAlign: 'right' }}>
            %{credits.storagePercent}
          </span>
        </div>

        {/* Dropzone */}
        <div
          style={S.dropzone}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <UploadSimple size={28} style={{ color: theme.subtle }} />
          <div style={{ marginTop: 6, fontSize: 13, fontWeight: 500 }}>
            Dosyaları buraya sürükleyin veya tıklayıp seçin
          </div>
          <div style={{ fontSize: 11, color: theme.subtle, marginTop: 2 }}>
            Görsel: JPG/PNG/WebP, max 5MB · Video: MP4/WebM, max 50MB
          </div>
          {progress && (
            <div style={{ marginTop: 10, fontSize: 11, color: theme.heading }}>
              {progress.current} / {progress.total} işleniyor...
            </div>
          )}
        </div>

        {msg && (
          <div
            style={{
              marginTop: 12,
              padding: '8px 12px',
              borderRadius: 8,
              fontSize: 12,
              background: msg.kind === 'ok' ? theme.successBg : msg.kind === 'warn' ? theme.warningBg : theme.dangerBg,
              color: msg.kind === 'ok' ? theme.success : msg.kind === 'warn' ? theme.warning : theme.danger,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {msg.kind === 'ok' ? <CheckCircle size={14} /> : <Warning size={14} />}
            {msg.text}
          </div>
        )}
      </div>

      {/* Filters */}
      <div style={{ ...S.card, padding: 12 }}>
        <div style={S.filterRow}>
          <Funnel size={16} style={{ color: theme.subtle }} />
          {(['all', 'images', 'videos', 'product', 'category', 'logo', 'cover', 'promo', 'unused', 'ai'] as const).map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)} style={S.chip(filter === f)}>
              {{
                all: 'Tümü',
                images: 'Görseller',
                videos: 'Videolar',
                product: 'Ürün',
                category: 'Kategori',
                logo: 'Logo',
                cover: 'Kapak',
                promo: 'Promo',
                unused: 'Kullanılmıyor',
                ai: 'AI İyileştirilmiş',
              }[f]}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <div style={{ position: 'relative' }}>
            <MagnifyingGlass size={14} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: theme.subtle }} />
            <input
              style={{ ...S.input, paddingLeft: 28 }}
              placeholder="Dosya adı ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={S.card}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: theme.subtle }}>Yükleniyor...</div>
        ) : filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: theme.subtle }}>
            {items.length === 0 ? 'Henüz görsel yüklenmemiş.' : 'Filtreyle eşleşen görsel yok.'}
          </div>
        ) : (
          <>
            <div style={S.grid}>
              {filteredItems.map((it) => {
                const url = getPublicUrl(it.file_path);
                const isVideo = it.file_type.startsWith('video/');
                const isUnused = it.used_in.length === 0;
                return (
                  <div key={it.id} style={S.thumbCard} onClick={() => setSelected(it)}>
                    {isVideo ? (
                      <video src={url} muted playsInline preload="metadata" style={S.thumbImg} />
                    ) : (
                      <img src={getOptimizedImageUrl(url, 'thumbnail')} alt={it.file_name} onError={handleImageError} style={S.thumbImg} loading="lazy" />
                    )}
                    {isVideo && (
                      <span style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(0,0,0,0.7)', color: '#FFFFFF', borderRadius: 4, padding: '2px 5px', display: 'flex', alignItems: 'center', gap: 3, fontSize: 10 }}>
                        <VideoCamera size={11} weight="fill" />
                        {it.duration_seconds ? `${it.duration_seconds}s` : 'Video'}
                      </span>
                    )}
                    {it.ai_enhanced && (
                      <span style={S.aiBadge} title="AI ile iyileştirildi"><Sparkle size={14} /></span>
                    )}
                    {isUnused && (
                      <span style={S.unusedBadge}>Kullanılmıyor</span>
                    )}
                    <div style={S.thumbMeta}>
                      <span style={S.metaTag}>{formatBytes(it.file_size)}</span>
                      {it.width && it.height && (
                        <span style={S.metaTag}>{it.width}×{it.height}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: theme.subtle, textAlign: 'center' }}>
              Toplam: {filteredItems.length} dosya · {formatBytes(filteredItems.reduce((s, i) => s + i.file_size, 0))}
            </div>
          </>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div style={S.modal} onClick={() => setSelected(null)}>
          <div style={S.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: theme.value, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selected.file_name}
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: theme.subtle, cursor: 'pointer' }} aria-label="Kapat"><X size={20} /></button>
            </div>
            {selected.file_type.startsWith('video/') ? (
              <video
                src={getPublicUrl(selected.file_path)}
                controls
                autoPlay
                muted
                loop
                preload="metadata"
                style={{ width: '100%', borderRadius: 8, maxHeight: 360, background: '#000' }}
              />
            ) : (
              <img
                src={getOptimizedImageUrl(getPublicUrl(selected.file_path), 'cover')}
                alt={selected.file_name}
                onError={handleImageError}
                style={{ width: '100%', borderRadius: 8, maxHeight: 360, objectFit: 'contain', background: theme.pageBg }}
              />
            )}
            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, color: theme.heading }}>
              <div><b style={{ color: theme.value }}>Boyut:</b> {formatBytes(selected.file_size)}</div>
              <div><b style={{ color: theme.value }}>Tip:</b> {selected.file_type}</div>
              <div><b style={{ color: theme.value }}>Çözünürlük:</b> {selected.width && selected.height ? `${selected.width} × ${selected.height}` : '—'}</div>
              <div><b style={{ color: theme.value }}>Yüklenme:</b> {new Date(selected.created_at).toLocaleDateString('tr-TR')}</div>
              {selected.duration_seconds != null && (
                <div><b style={{ color: theme.value }}>Süre:</b> {selected.duration_seconds}s</div>
              )}
            </div>

            {selected.tags.length > 0 && (
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <TagIcon size={14} style={{ color: theme.subtle }} />
                {selected.tags.map((t) => (
                  <span key={t} style={{ ...S.metaTag, background: `${theme.accent}20`, color: theme.accent }}>{t}</span>
                ))}
              </div>
            )}

            <div style={{ marginTop: 12, fontSize: 12, color: theme.heading }}>
              <b style={{ color: theme.value }}>Kullanıldığı yerler:</b>{' '}
              {selected.used_in.length === 0 ? (
                <span style={{ color: theme.subtle }}>Henüz kullanılmıyor.</span>
              ) : (
                <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                  {selected.used_in.map((u, idx) => (
                    <li key={idx}>{u.label || u.type}</li>
                  ))}
                </ul>
              )}
            </div>

            <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button style={S.btnGhost} onClick={() => copyUrl(selected)}>
                <Copy size={14} /> URL Kopyala
              </button>
              {!selected.ai_enhanced && !selected.file_type.startsWith('video/') && (
                <button
                  style={{
                    ...S.btnGhost,
                    color: credits.creditsRemaining < 1 ? theme.subtle : '#A855F7',
                    borderColor: credits.creditsRemaining < 1 ? theme.border : '#A855F7',
                    cursor: credits.creditsRemaining < 1 ? 'not-allowed' : 'pointer',
                    opacity: credits.creditsRemaining < 1 ? 0.6 : 1,
                  }}
                  disabled={credits.creditsRemaining < 1}
                  onClick={() => setEnhanceTarget(selected)}
                  title={credits.creditsRemaining < 1 ? 'Krediniz tükendi' : 'AI ile iyileştir (1 kredi)'}
                >
                  <Sparkle size={14} weight="fill" /> AI İyileştir
                </button>
              )}
              {!selected.file_type.startsWith('video/') && (
                <button
                  style={S.btnGhost}
                  onClick={() => {
                    setEditTarget(selected);
                    setSelected(null);
                  }}
                >
                  <PencilSimple size={14} /> Düzenle
                </button>
              )}
              <button
                style={{ ...S.btnGhost, color: '#EF4444', borderColor: '#EF4444' }}
                onClick={() => deleteItem(selected)}
              >
                <Trash size={14} /> Sil
              </button>
              <span style={{ flex: 1 }} />
              <span style={{ fontSize: 11, color: theme.subtle, alignSelf: 'center' }}>
                {selected.ai_enhanced ? 'Bu görsel zaten AI ile iyileştirildi' : `Kalan kredi: ${credits.creditsRemaining}`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* PhotoEnhance modal */}
      {enhanceTarget && (
        <PhotoEnhance
          restaurantId={restaurantId}
          restaurantSlug={restaurantSlug}
          originalUrl={getPublicUrl(enhanceTarget.file_path)}
          theme={theme}
          onClose={() => {
            setEnhanceTarget(null);
            loadMedia();
          }}
          onAutoSave={async (blob, mime) => {
            return await handleEnhanceSave(enhanceTarget, blob, mime);
          }}
          onUndo={async (id) => {
            await deleteItemSilent(id);
          }}
        />
      )}

      {/* ImageEditor modal */}
      {editTarget && (
        <ImageEditor
          mediaId={editTarget.id}
          oldFilePath={editTarget.file_path}
          publicUrl={getPublicUrl(editTarget.file_path)}
          restaurantSlug={restaurantSlug}
          theme={theme}
          mode="standalone"
          onClose={() => setEditTarget(null)}
          onSaved={async () => {
            await loadMedia();
            credits.refresh();
          }}
        />
      )}
    </div>
  );
}
