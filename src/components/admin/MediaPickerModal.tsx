import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { supabase } from '../../lib/supabase';
import { getOptimizedImageUrl, handleImageError } from '../../lib/imageUtils';
import { useAICredits } from '../../hooks/useAICredits';
import type { AdminTheme } from '../../lib/adminTheme';
import {
  UploadSimple,
  X,
  MagnifyingGlass,
  Funnel,
  VideoCamera,
  ImageSquare,
  CheckCircle,
  Warning,
  Sparkle,
} from '@phosphor-icons/react';
import type { MediaItem } from './MediaLibrary';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const MAX_WIDTH = 1920;

export type MediaAccept = 'image' | 'video' | 'all';

interface UsedInRef {
  type: string;
  id: string;
  field?: string;
  label?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: { url: string; mediaId: string; fileType: string }) => void;
  accept?: MediaAccept;
  restaurantId: string;
  restaurantSlug: string;
  theme: AdminTheme;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function hashFile(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
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
  const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, 'image/webp', 0.88));
  if (!blob) return { file, width, height };
  const newName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
  return {
    file: new File([blob], newName, { type: 'image/webp' }),
    width: newW,
    height: newH,
  };
}

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

/**
 * media_library.used_in JSONB'sine bir referans ekler (idempotent — aynı type+id+field tek kez).
 */
export async function attachMediaUsage(mediaUrl: string, ref: UsedInRef): Promise<void> {
  const path = mediaUrl.split('/menu-images/')[1];
  if (!path) return;
  const { data } = await supabase
    .from('media_library')
    .select('id, used_in')
    .eq('file_path', path)
    .maybeSingle();
  if (!data) return;
  const list: UsedInRef[] = Array.isArray(data.used_in) ? data.used_in : [];
  const exists = list.some((u) => u.type === ref.type && u.id === ref.id && u.field === ref.field);
  if (exists) return;
  await supabase
    .from('media_library')
    .update({ used_in: [...list, ref] })
    .eq('id', data.id);
}

/**
 * media_library.used_in'den belirli bir referansı çıkarır.
 */
export async function detachMediaUsage(mediaUrl: string, ref: Omit<UsedInRef, 'label'>): Promise<void> {
  if (!mediaUrl) return;
  const path = mediaUrl.split('/menu-images/')[1];
  if (!path) return;
  const { data } = await supabase
    .from('media_library')
    .select('id, used_in')
    .eq('file_path', path)
    .maybeSingle();
  if (!data) return;
  const list: UsedInRef[] = Array.isArray(data.used_in) ? data.used_in : [];
  const next = list.filter((u) => !(u.type === ref.type && u.id === ref.id && u.field === ref.field));
  if (next.length === list.length) return;
  await supabase.from('media_library').update({ used_in: next }).eq('id', data.id);
}

export default function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  accept = 'all',
  restaurantId,
  restaurantSlug,
  theme,
}: Props) {
  const credits = useAICredits(restaurantId);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<MediaAccept>(accept);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; kind: 'ok' | 'err' | 'warn' } | null>(null);
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
    if (isOpen) {
      setPickedId(null);
      setSearch('');
      setTypeFilter(accept);
      loadMedia();
    }
  }, [isOpen, accept, loadMedia]);

  const flash = (text: string, kind: 'ok' | 'err' | 'warn' = 'ok') => {
    setMsg({ text, kind });
    window.setTimeout(() => setMsg(null), 3500);
  };

  function getPublicUrl(path: string): string {
    const { data } = supabase.storage.from('menu-images').getPublicUrl(path);
    return data.publicUrl;
  }

  const acceptAttr = accept === 'image' ? 'image/*' : accept === 'video' ? 'video/*' : 'image/*,video/*';

  const doUpload = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files).filter((f) => {
        if (accept === 'image') return f.type.startsWith('image/');
        if (accept === 'video') return f.type.startsWith('video/');
        return f.type.startsWith('image/') || f.type.startsWith('video/');
      });
      if (arr.length === 0) return;

      const totalSize = arr.reduce((s, f) => s + f.size, 0);
      if (credits.storageUsedBytes + totalSize > credits.storageLimitMb * 1024 * 1024) {
        flash(`Storage kotası aşılacak (${credits.storageLimitMb} MB).`, 'err');
        return;
      }

      setUploading(true);
      let lastInsertedId: string | null = null;

      for (const rawFile of arr) {
        try {
          const isVideo = rawFile.type.startsWith('video/');
          const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
          if (rawFile.size > maxSize) {
            flash(`"${rawFile.name}" ${isVideo ? '50' : '5'}MB sınırını aşıyor — atlandı.`, 'warn');
            continue;
          }

          const hash = await hashFile(rawFile);
          const dup = await supabase
            .from('media_library')
            .select('id')
            .eq('restaurant_id', restaurantId)
            .eq('file_hash', hash)
            .maybeSingle();
          if (dup.data) {
            lastInsertedId = dup.data.id;
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
          if (up.error) continue;

          const ins = await supabase
            .from('media_library')
            .insert({
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
            })
            .select('id')
            .single();
          if (ins.data) lastInsertedId = ins.data.id;
        } catch {
          // skip
        }
      }

      setUploading(false);
      flash('Yükleme tamamlandı.', 'ok');
      await loadMedia();
      credits.refresh();
      if (lastInsertedId) setPickedId(lastInsertedId);
    },
    [accept, credits, restaurantId, restaurantSlug, loadMedia],
  );

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      const isVideo = it.file_type.startsWith('video/');
      const isImage = it.file_type.startsWith('image/');
      if (accept === 'image' && !isImage) return false;
      if (accept === 'video' && !isVideo) return false;
      if (accept === 'all') {
        if (typeFilter === 'image' && !isImage) return false;
        if (typeFilter === 'video' && !isVideo) return false;
      }
      if (q && !it.file_name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, search, accept, typeFilter]);

  if (!isOpen) return null;

  const quotaColor = credits.storagePercent < 50 ? '#22C55E' : credits.storagePercent < 80 ? '#F59E0B' : '#EF4444';

  const S: Record<string, CSSProperties> = {
    overlay: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    modal: {
      background: theme.cardBg,
      border: `1px solid ${theme.cardBorder}`,
      borderRadius: 12,
      width: '100%',
      maxWidth: 920,
      maxHeight: '92vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    },
    header: {
      padding: '14px 18px',
      borderBottom: `1px solid ${theme.divider}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: { fontSize: 16, fontWeight: 700, color: theme.value, display: 'flex', alignItems: 'center', gap: 8 },
    closeBtn: { background: 'none', border: 'none', color: theme.subtle, cursor: 'pointer' },
    toolbar: {
      padding: '12px 18px',
      borderBottom: `1px solid ${theme.divider}`,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      flexWrap: 'wrap',
    },
    body: { padding: 16, overflowY: 'auto', flex: 1, background: theme.pageBg },
    footer: {
      padding: '12px 18px',
      borderTop: `1px solid ${theme.divider}`,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
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
    chip: (active: boolean): CSSProperties => ({
      padding: '5px 10px',
      borderRadius: 16,
      border: `1px solid ${active ? theme.accent : theme.border}`,
      background: active ? theme.accent : 'transparent',
      color: active ? '#FFFFFF' : theme.value,
      fontSize: 12,
      cursor: 'pointer',
    }),
    input: {
      padding: '8px 12px 8px 28px',
      border: `1px solid ${theme.inputBorder}`,
      background: theme.inputBg,
      color: theme.inputText,
      borderRadius: 8,
      fontSize: 13,
      outline: 'none',
      minWidth: 200,
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
      gap: 10,
    },
    thumb: (picked: boolean): CSSProperties => ({
      position: 'relative',
      borderRadius: 10,
      overflow: 'hidden',
      background: theme.cardBg,
      border: `2px solid ${picked ? theme.accent : theme.cardBorder}`,
      cursor: 'pointer',
      aspectRatio: '1/1',
    }),
    thumbImg: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' } as CSSProperties,
    videoBadge: {
      position: 'absolute',
      top: 6,
      left: 6,
      background: 'rgba(0,0,0,0.7)',
      color: '#FFFFFF',
      borderRadius: 4,
      padding: '2px 5px',
      display: 'flex',
      alignItems: 'center',
      gap: 3,
      fontSize: 10,
    },
    aiBadge: {
      position: 'absolute',
      top: 6,
      right: 6,
      background: '#A855F7',
      color: '#fff',
      borderRadius: '50%',
      width: 20,
      height: 20,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    pickedTick: {
      position: 'absolute',
      bottom: 6,
      right: 6,
      background: theme.accent,
      color: '#fff',
      borderRadius: '50%',
      width: 22,
      height: 22,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    metaTag: {
      position: 'absolute',
      left: 6,
      bottom: 6,
      fontSize: 10,
      background: 'rgba(0,0,0,0.6)',
      color: '#fff',
      padding: '2px 5px',
      borderRadius: 4,
    },
    quotaBar: { height: 6, background: theme.border, borderRadius: 3, overflow: 'hidden', flex: 1 },
    quotaFill: { height: '100%', background: quotaColor, width: `${credits.storagePercent}%` },
  };

  const picked = items.find((i) => i.id === pickedId) || null;

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>
        <div style={S.header}>
          <div style={S.title}>
            {accept === 'video' ? <VideoCamera size={20} /> : <ImageSquare size={20} />}
            Medya Seç
          </div>
          <button style={S.closeBtn} onClick={onClose} aria-label="Kapat">
            <X size={20} />
          </button>
        </div>

        <div style={S.toolbar}>
          <button style={S.btn} onClick={() => fileRef.current?.click()} disabled={uploading}>
            <UploadSimple size={16} /> {uploading ? 'Yükleniyor...' : 'Yeni Yükle'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept={acceptAttr}
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files?.length) doUpload(e.target.files);
              e.target.value = '';
            }}
          />

          {accept === 'all' && (
            <>
              <Funnel size={14} style={{ color: theme.subtle, marginLeft: 4 }} />
              <button style={S.chip(typeFilter === 'all')} onClick={() => setTypeFilter('all')}>
                Tümü
              </button>
              <button style={S.chip(typeFilter === 'image')} onClick={() => setTypeFilter('image')}>
                Görseller
              </button>
              <button style={S.chip(typeFilter === 'video')} onClick={() => setTypeFilter('video')}>
                Videolar
              </button>
            </>
          )}

          <div style={{ flex: 1 }} />

          <div style={{ position: 'relative' }}>
            <MagnifyingGlass
              size={14}
              style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: theme.subtle }}
            />
            <input
              style={S.input}
              placeholder="Dosya adı ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div style={S.body}>
          {msg && (
            <div
              style={{
                marginBottom: 12,
                padding: '8px 12px',
                borderRadius: 8,
                fontSize: 12,
                background:
                  msg.kind === 'ok' ? theme.successBg : msg.kind === 'warn' ? theme.warningBg : theme.dangerBg,
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

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: theme.subtle }}>Yükleniyor...</div>
          ) : filteredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: theme.subtle }}>
              {accept === 'video'
                ? 'Henüz video yok. "Yeni Yükle" ile ekleyebilirsiniz.'
                : accept === 'image'
                  ? 'Henüz görsel yok. "Yeni Yükle" ile ekleyebilirsiniz.'
                  : 'Henüz medya yok.'}
            </div>
          ) : (
            <div style={S.grid}>
              {filteredItems.map((it) => {
                const url = getPublicUrl(it.file_path);
                const isVideo = it.file_type.startsWith('video/');
                const isPicked = it.id === pickedId;
                return (
                  <div key={it.id} style={S.thumb(isPicked)} onClick={() => setPickedId(it.id)} onDoubleClick={() => {
                    setPickedId(it.id);
                    onSelect({ url, mediaId: it.id, fileType: it.file_type });
                  }}>
                    {isVideo ? (
                      <video
                        src={url}
                        muted
                        playsInline
                        preload="metadata"
                        style={S.thumbImg}
                      />
                    ) : (
                      <img
                        src={getOptimizedImageUrl(url, 'thumbnail')}
                        alt={it.file_name}
                        onError={handleImageError}
                        style={S.thumbImg}
                        loading="lazy"
                      />
                    )}
                    {isVideo && (
                      <span style={S.videoBadge}>
                        <VideoCamera size={11} weight="fill" />
                        {it.duration_seconds ? `${it.duration_seconds}s` : 'Video'}
                      </span>
                    )}
                    {it.ai_enhanced && (
                      <span style={S.aiBadge} title="AI ile iyileştirildi">
                        <Sparkle size={12} weight="fill" />
                      </span>
                    )}
                    <span style={S.metaTag}>{formatBytes(it.file_size)}</span>
                    {isPicked && (
                      <span style={S.pickedTick}>
                        <CheckCircle size={14} weight="fill" />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={S.footer}>
          <span style={{ fontSize: 11, color: theme.subtle, minWidth: 120 }}>
            {credits.storageUsedMb.toFixed(1)} / {credits.storageLimitMb} MB
          </span>
          <div style={S.quotaBar}>
            <div style={S.quotaFill} />
          </div>
          <span style={{ fontSize: 11, color: quotaColor, fontWeight: 600, minWidth: 32, textAlign: 'right' }}>
            %{credits.storagePercent}
          </span>
          <span style={{ flex: 0.1 }} />
          <button style={S.btnGhost} onClick={onClose}>
            İptal
          </button>
          <button
            style={{ ...S.btn, opacity: picked ? 1 : 0.5, cursor: picked ? 'pointer' : 'not-allowed' }}
            disabled={!picked}
            onClick={() => {
              if (picked) onSelect({ url: getPublicUrl(picked.file_path), mediaId: picked.id, fileType: picked.file_type });
            }}
          >
            <CheckCircle size={16} /> Seç
          </button>
        </div>
      </div>
    </div>
  );
}
