# TABBLED — FOTOĞRAF ZOOM FIX
## Claude Code Prompt — 11 Nisan 2026

---

## SORUN

Logo ve kategori fotoğrafları zoomlu/kırpılmış görünüyor. Supabase Image Transforms varsayılan olarak `resize: cover` kullanıyor — bu görseli kare'ye zorluyor ve kırpıyor.

---

## DÜZELTME

src/lib/imageUtils.ts dosyasında SIZE_CONFIG'e `resize` parametresi ekle ve URL'e `&resize=contain` ekle.

### Değişiklik 1: SIZE_CONFIG güncelle

```typescript
const SIZE_CONFIG: Record<ImageSize, { width: number; quality: number; resize: string }> = {
  thumbnail: { width: 80, quality: 60, resize: 'contain' },
  card: { width: 200, quality: 70, resize: 'contain' },
  detail: { width: 480, quality: 80, resize: 'contain' },
  cover: { width: 800, quality: 75, resize: 'cover' },    // Kapak görseli cover OK — tam dolması lazım
  original: { width: 0, quality: 100, resize: 'contain' },
};
```

### Değişiklik 2: URL oluşturmada resize parametresini ekle

Mevcut satır:
```typescript
return `${renderUrl}${separator}width=${config.width}&quality=${config.quality}`;
```

Yeni satır:
```typescript
return `${renderUrl}${separator}width=${config.width}&quality=${config.quality}&resize=${config.resize}`;
```

### Özet
- `thumbnail`, `card`, `detail` → `resize=contain` (görseli kırpmadan sığdır, oranı koru)
- `cover` → `resize=cover` (kapak görseli tam dolmalı, kırpma OK)

Bu tek dosya değişikliği (src/lib/imageUtils.ts). Build sonrası push.
