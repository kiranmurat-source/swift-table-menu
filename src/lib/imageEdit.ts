/**
 * Pure helpers for client-side image editing (rotate + crop + measure).
 * Output blobs are always WebP @ 0.88 unless explicitly noted.
 *
 * Pattern reference: src/components/admin/MediaLibrary.tsx (resizeImageIfNeeded)
 */

const OUTPUT_MIME = 'image/webp';
const OUTPUT_QUALITY = 0.88;

function loadImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Görsel yüklenemedi'));
    };
    img.src = url;
  });
}

function canvasToWebp(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('WebP encode başarısız'));
      },
      OUTPUT_MIME,
      OUTPUT_QUALITY,
    );
  });
}

/**
 * Rotate clockwise by `degrees` (90, 180, 270). Output dimensions swap for 90/270.
 */
export async function rotateImage(blob: Blob, degrees: 90 | 180 | 270): Promise<Blob> {
  const img = await loadImage(blob);
  const w = img.naturalWidth;
  const h = img.naturalHeight;

  const swap = degrees === 90 || degrees === 270;
  const canvas = document.createElement('canvas');
  canvas.width = swap ? h : w;
  canvas.height = swap ? w : h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context alınamadı');

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((degrees * Math.PI) / 180);
  ctx.drawImage(img, -w / 2, -h / 2);

  return canvasToWebp(canvas);
}

/**
 * Crop in source-image pixel coordinates (NOT percentages).
 */
export async function cropImage(
  blob: Blob,
  crop: { x: number; y: number; width: number; height: number },
): Promise<Blob> {
  const img = await loadImage(blob);
  const cw = Math.max(1, Math.round(crop.width));
  const ch = Math.max(1, Math.round(crop.height));
  const cx = Math.max(0, Math.round(crop.x));
  const cy = Math.max(0, Math.round(crop.y));

  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context alınamadı');

  ctx.drawImage(img, cx, cy, cw, ch, 0, 0, cw, ch);

  return canvasToWebp(canvas);
}

/**
 * Measure any image blob's natural dimensions and basic metadata.
 */
export async function measureBlob(
  blob: Blob,
): Promise<{ width: number; height: number; mime: string; size: number }> {
  const img = await loadImage(blob);
  return {
    width: img.naturalWidth,
    height: img.naturalHeight,
    mime: blob.type || 'application/octet-stream',
    size: blob.size,
  };
}
