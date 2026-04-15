import { useCallback, useMemo, useRef, useState, type CSSProperties } from 'react';
import { supabase } from '../../lib/supabase';
import { useAICredits } from '../../hooks/useAICredits';
import { AI_CREDIT_COSTS, consumeAICredits } from '../../lib/aiCredits';
import type { AdminTheme } from '../../lib/adminTheme';
import {
  FileArrowUp,
  UploadSimple,
  CheckCircle,
  Warning,
  X,
  ArrowLeft,
  ArrowRight,
  Sparkle,
  CaretDown,
  CaretRight,
  Trash,
} from '@phosphor-icons/react';

const SUPABASE_URL = 'https://qmnrawqvkwehufebbkxp.supabase.co';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_IMAGES = 10;

type Step = 'upload' | 'loading' | 'preview' | 'done';

interface DraftItem {
  id: string; // client-side uuid
  name_tr: string;
  description_tr: string | null;
  price: number | null;
  selected: boolean;
}

interface DraftCategory {
  id: string;
  name_tr: string;
  items: DraftItem[];
  expanded: boolean;
}

interface Props {
  restaurantId: string;
  theme: AdminTheme;
  onImported?: () => void;
}

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function MenuImport({ restaurantId, theme, onImported }: Props) {
  const credits = useAICredits(restaurantId);
  const [step, setStep] = useState<Step>('upload');
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0); // fake progress (0-100)
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftCategory[]>([]);
  const [importStats, setImportStats] = useState<{ cats: number; items: number; skipped: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const creditsPerFile = AI_CREDIT_COSTS.menuImportPerFile;
  const creditsNeeded = (files.length || 1) * creditsPerFile;
  const notEnoughCredits = credits.creditsRemaining < creditsNeeded;

  const addFiles = (fs: FileList | File[]) => {
    const arr = Array.from(fs).filter((f) => f.type.startsWith('image/'));
    const accepted: File[] = [];
    for (const f of arr) {
      if (f.size > MAX_FILE_SIZE) continue;
      accepted.push(f);
      if (files.length + accepted.length >= MAX_IMAGES) break;
    }
    setFiles((prev) => [...prev, ...accepted].slice(0, MAX_IMAGES));
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const analyze = useCallback(async () => {
    if (files.length === 0) return;
    if (notEnoughCredits) {
      setError('Krediniz yetersiz.');
      return;
    }
    setError(null);
    setStep('loading');
    setProgress(10);

    // Fake progress ticker
    const ticker = window.setInterval(() => {
      setProgress((p) => (p < 85 ? p + 5 : p));
    }, 600);

    try {
      const dataUrls = await Promise.all(files.map(fileToDataUrl));
      setProgress(40);

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch(`${SUPABASE_URL}/functions/v1/import-menu`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ images: dataUrls }),
      });

      const body = await res.json();
      if (!res.ok || !body.ok) {
        throw new Error(body?.error || 'Analiz başarısız');
      }

      setProgress(95);

      type Parsed = { name_tr: string; items: { name_tr: string; description_tr: string | null; price: number | null }[] };
      const parsed: Parsed[] = body.categories || [];
      const draftCats: DraftCategory[] = parsed.map((c) => ({
        id: uid(),
        name_tr: c.name_tr,
        expanded: true,
        items: c.items.map((it) => ({
          id: uid(),
          name_tr: it.name_tr,
          description_tr: it.description_tr,
          price: it.price,
          selected: true,
        })),
      }));
      setDraft(draftCats);
      setProgress(100);
      setStep('preview');
    } catch (e) {
      setError((e as Error).message);
      setStep('upload');
    } finally {
      window.clearInterval(ticker);
    }
  }, [files, notEnoughCredits]);

  const updateItem = (catId: string, itemId: string, patch: Partial<DraftItem>) => {
    setDraft((prev) =>
      prev.map((c) =>
        c.id !== catId ? c : { ...c, items: c.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)) },
      ),
    );
  };
  const updateCategory = (catId: string, patch: Partial<DraftCategory>) => {
    setDraft((prev) => prev.map((c) => (c.id === catId ? { ...c, ...patch } : c)));
  };
  const toggleCatSelectAll = (catId: string, selected: boolean) => {
    setDraft((prev) =>
      prev.map((c) =>
        c.id !== catId ? c : { ...c, items: c.items.map((it) => ({ ...it, selected })) },
      ),
    );
  };
  const removeCategory = (catId: string) => {
    if (!window.confirm('Bu kategoriyi önizlemeden kaldırmak istiyor musunuz?')) return;
    setDraft((prev) => prev.filter((c) => c.id !== catId));
  };

  const totals = useMemo(() => {
    let cats = 0;
    let items = 0;
    let selected = 0;
    for (const c of draft) {
      cats++;
      items += c.items.length;
      selected += c.items.filter((i) => i.selected).length;
    }
    return { cats, items, selected };
  }, [draft]);

  async function runImport() {
    if (totals.selected === 0) {
      setError('İçe aktarmak için en az bir ürün seçin.');
      return;
    }
    setError(null);
    setStep('loading');
    setProgress(20);

    try {
      // Mevcut kategorileri çek (çakışma kontrolü)
      const { data: existingCats } = await supabase
        .from('menu_categories')
        .select('id, name_tr, sort_order, parent_id')
        .eq('restaurant_id', restaurantId);

      const byName = new Map<string, { id: string; sort_order: number }>();
      let rootMaxSort = -1;
      for (const c of existingCats || []) {
        if (c.parent_id) continue;
        byName.set((c.name_tr || '').trim().toLowerCase(), { id: c.id, sort_order: c.sort_order ?? 0 });
        if ((c.sort_order ?? 0) > rootMaxSort) rootMaxSort = c.sort_order ?? 0;
      }

      let importedCats = 0;
      let importedItems = 0;
      let skipped = 0;

      for (const draftCat of draft) {
        const selectedItems = draftCat.items.filter((i) => i.selected);
        if (selectedItems.length === 0) {
          skipped += draftCat.items.length;
          continue;
        }

        let categoryId: string;
        const key = draftCat.name_tr.trim().toLowerCase();
        const existing = byName.get(key);
        if (existing) {
          categoryId = existing.id;
        } else {
          rootMaxSort++;
          const { data: newCat, error: catErr } = await supabase
            .from('menu_categories')
            .insert({
              restaurant_id: restaurantId,
              name_tr: draftCat.name_tr.trim(),
              sort_order: rootMaxSort,
              is_active: true,
              translations: {},
              parent_id: null,
            })
            .select('id, sort_order')
            .single();
          if (catErr || !newCat) {
            skipped += selectedItems.length;
            continue;
          }
          categoryId = newCat.id;
          byName.set(key, { id: categoryId, sort_order: newCat.sort_order ?? rootMaxSort });
          importedCats++;
        }

        // Mevcut ürün sayısı (sort_order başlangıcı)
        const { count } = await supabase
          .from('menu_items')
          .select('id', { count: 'exact', head: true })
          .eq('restaurant_id', restaurantId)
          .eq('category_id', categoryId);
        const baseSort = count ?? 0;

        const rows = selectedItems.map((it, idx) => ({
          restaurant_id: restaurantId,
          category_id: categoryId,
          name_tr: it.name_tr.trim(),
          description_tr: it.description_tr?.trim() || null,
          price: it.price ?? 0,
          is_available: true,
          is_popular: false,
          is_new: false,
          is_vegetarian: false,
          is_featured: false,
          is_sold_out: false,
          schedule_type: 'always',
          price_variants: [],
          sort_order: baseSort + idx,
          translations: {},
        }));

        const { error: itemsErr } = await supabase.from('menu_items').insert(rows);
        if (itemsErr) {
          skipped += rows.length;
          continue;
        }
        importedItems += rows.length;
      }

      // Atomik kredi düş + log
      const creditsToCharge = files.length * AI_CREDIT_COSTS.menuImportPerFile;
      await consumeAICredits({
        restaurantId,
        amount: creditsToCharge,
        actionType: 'menu_import',
        input: { file_count: files.length, image_names: files.map((f) => f.name) },
        output: { categories: importedCats, items: importedItems, skipped },
      });

      setProgress(100);
      setImportStats({ cats: importedCats, items: importedItems, skipped });
      credits.refresh();
      setStep('done');
      onImported?.();
    } catch (e) {
      setError((e as Error).message);
      setStep('preview');
    }
  }

  const reset = () => {
    setStep('upload');
    setFiles([]);
    setDraft([]);
    setProgress(0);
    setError(null);
    setImportStats(null);
  };

  // ---- Styles ----
  const S: Record<string, CSSProperties> = {
    wrap: { display: 'flex', flexDirection: 'column', gap: 16 },
    card: {
      background: theme.cardBg,
      border: `1px solid ${theme.cardBorder}`,
      borderRadius: 12,
      padding: 16,
    },
    title: { fontSize: 20, fontWeight: 700, color: theme.value, display: 'flex', alignItems: 'center', gap: 8 },
    dropzone: {
      marginTop: 12,
      border: `2px dashed ${dragOver ? theme.accent : theme.border}`,
      borderRadius: 10,
      padding: 28,
      textAlign: 'center',
      background: dragOver ? `${theme.accent}10` : theme.pageBg,
      color: theme.heading,
      cursor: 'pointer',
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
    btnDisabled: { opacity: 0.5, cursor: 'not-allowed' } as CSSProperties,
    progressBar: { height: 8, background: theme.border, borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: '100%', background: theme.accent, width: `${progress}%`, transition: 'width 0.3s ease' },
    input: {
      padding: '6px 10px',
      border: `1px solid ${theme.inputBorder}`,
      background: theme.inputBg,
      color: theme.inputText,
      borderRadius: 6,
      fontSize: 13,
      outline: 'none',
      width: '100%',
    },
    priceInput: {
      padding: '6px 10px',
      border: `1px solid ${theme.inputBorder}`,
      background: theme.inputBg,
      color: theme.inputText,
      borderRadius: 6,
      fontSize: 13,
      outline: 'none',
      width: 100,
      textAlign: 'right',
    } as CSSProperties,
    thumb: {
      width: 80,
      height: 80,
      borderRadius: 8,
      objectFit: 'cover',
      border: `1px solid ${theme.border}`,
    } as CSSProperties,
  };

  return (
    <div style={S.wrap}>
      <div style={S.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={S.title}>
            <FileArrowUp size={22} /> Menü İçe Aktar
          </div>
          <div style={{ fontSize: 12, color: theme.heading }}>
            AI Kredisi: <b style={{ color: theme.value }}>{credits.creditsRemaining}/{credits.creditsTotal}</b>
          </div>
        </div>
        <div style={{ fontSize: 12, color: theme.subtle, marginTop: 4 }}>
          Menü fotoğrafından AI ile otomatik olarak kategori + ürün çıkarılır.
        </div>

        {error && (
          <div
            style={{
              marginTop: 12,
              padding: '8px 12px',
              borderRadius: 8,
              fontSize: 12,
              background: theme.dangerBg,
              color: theme.danger,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Warning size={14} /> {error}
          </div>
        )}
      </div>

      {/* Step: upload */}
      {step === 'upload' && (
        <div style={S.card}>
          <div
            style={S.dropzone}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
            }}
            onClick={() => fileRef.current?.click()}
          >
            <UploadSimple size={36} style={{ color: theme.subtle }} />
            <div style={{ marginTop: 8, fontSize: 14, fontWeight: 500, color: theme.value }}>
              Menü fotoğrafını buraya sürükleyin veya tıklayıp seçin
            </div>
            <div style={{ fontSize: 11, color: theme.subtle, marginTop: 4 }}>
              JPG, PNG · Max {MAX_FILE_SIZE / (1024 * 1024)}MB · Birden fazla sayfa için her sayfayı ayrı yükleyin · Max {MAX_IMAGES} görsel
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files?.length) addFiles(e.target.files);
              e.target.value = '';
            }}
          />

          {files.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {files.map((f, idx) => (
                <div key={idx} style={{ position: 'relative' }}>
                  <img src={URL.createObjectURL(f)} alt={f.name} style={S.thumb} />
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: '#EF4444',
                      color: '#fff',
                      border: '2px solid #fff',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    aria-label="Görseli kaldır"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div
            style={{
              marginTop: 14,
              padding: 10,
              borderRadius: 8,
              background: notEnoughCredits ? theme.dangerBg : theme.infoBg,
              color: notEnoughCredits ? theme.danger : theme.info,
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Sparkle size={14} />
            {notEnoughCredits ? (
              <span>Krediniz yetersiz. {creditsNeeded} kredi gerekli, kalan: {credits.creditsRemaining}/{credits.creditsTotal}.</span>
            ) : (
              <span>Fotoğraf başına {creditsPerFile} kredi kullanılır · Kalan: {credits.creditsRemaining}/{credits.creditsTotal}</span>
            )}
          </div>

          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            {files.length > 0 && (
              <button type="button" style={S.btnGhost} onClick={() => setFiles([])}>İptal</button>
            )}
            <button
              type="button"
              style={{ ...S.btn, ...(files.length === 0 || notEnoughCredits ? S.btnDisabled : {}) }}
              disabled={files.length === 0 || notEnoughCredits}
              onClick={analyze}
            >
              Analiz Et <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Step: loading */}
      {step === 'loading' && (
        <div style={S.card}>
          <div style={{ fontSize: 14, fontWeight: 600, color: theme.value, marginBottom: 8 }}>
            {progress < 100 ? 'Menü analiz ediliyor...' : 'İçe aktarılıyor...'}
          </div>
          <div style={S.progressBar}>
            <div style={S.progressFill} />
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: theme.subtle }}>
            {progress < 50 ? 'Fotoğraf gönderiliyor...' : progress < 85 ? 'Kategoriler ve ürünler çıkarılıyor...' : 'Son kontroller...'}
          </div>
        </div>
      )}

      {/* Step: preview */}
      {step === 'preview' && (
        <div style={S.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <CheckCircle size={18} color={theme.success} />
            <span style={{ fontSize: 14, fontWeight: 600, color: theme.value }}>
              {totals.cats} kategori, {totals.items} ürün bulundu · Seçili: {totals.selected}
            </span>
          </div>

          {draft.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 30, color: theme.subtle }}>
              Menüde bir şey bulunamadı. Fotoğrafı tekrar deneyin.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {draft.map((cat) => {
                const allSelected = cat.items.length > 0 && cat.items.every((i) => i.selected);
                return (
                  <div
                    key={cat.id}
                    style={{ border: `1px solid ${theme.cardBorder}`, borderRadius: 8, background: theme.pageBg }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 12px',
                        borderBottom: cat.expanded ? `1px solid ${theme.cardBorder}` : 'none',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => updateCategory(cat.id, { expanded: !cat.expanded })}
                        style={{ background: 'none', border: 'none', color: theme.subtle, cursor: 'pointer', padding: 2, display: 'inline-flex' }}
                        aria-label={cat.expanded ? 'Kapat' : 'Aç'}
                      >
                        {cat.expanded ? <CaretDown size={14} /> : <CaretRight size={14} />}
                      </button>
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(e) => toggleCatSelectAll(cat.id, e.target.checked)}
                      />
                      <input
                        style={{ ...S.input, fontWeight: 600, flex: 1 }}
                        value={cat.name_tr}
                        onChange={(e) => updateCategory(cat.id, { name_tr: e.target.value })}
                      />
                      <span style={{ fontSize: 11, color: theme.subtle }}>
                        {cat.items.filter((i) => i.selected).length}/{cat.items.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeCategory(cat.id)}
                        style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 2, display: 'inline-flex' }}
                        aria-label="Kategoriyi kaldır"
                      >
                        <Trash size={14} />
                      </button>
                    </div>

                    {cat.expanded && (
                      <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {cat.items.map((it) => (
                          <div
                            key={it.id}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'auto 1fr auto',
                              gap: 8,
                              alignItems: 'center',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={it.selected}
                              onChange={(e) => updateItem(cat.id, it.id, { selected: e.target.checked })}
                            />
                            <input
                              style={S.input}
                              value={it.name_tr}
                              onChange={(e) => updateItem(cat.id, it.id, { name_tr: e.target.value })}
                              placeholder="Ürün adı"
                            />
                            <input
                              style={{
                                ...S.priceInput,
                                borderColor: it.price == null ? '#EF4444' : theme.inputBorder,
                              }}
                              type="number"
                              step="any"
                              value={it.price ?? ''}
                              onChange={(e) => {
                                const v = e.target.value;
                                updateItem(cat.id, it.id, { price: v === '' ? null : Number(v) });
                              }}
                              placeholder={it.price == null ? 'Fiyat giriniz' : 'TL'}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <button type="button" style={S.btnGhost} onClick={reset}>
              <ArrowLeft size={14} /> Geri
            </button>
            <button
              type="button"
              style={{ ...S.btn, ...(totals.selected === 0 ? S.btnDisabled : {}) }}
              disabled={totals.selected === 0}
              onClick={runImport}
            >
              {totals.selected} Ürünü İçe Aktar <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Step: done */}
      {step === 'done' && importStats && (
        <div style={S.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <CheckCircle size={22} color={theme.success} />
            <span style={{ fontSize: 16, fontWeight: 700, color: theme.value }}>İçe aktarma tamamlandı!</span>
          </div>
          <div style={{ fontSize: 13, color: theme.heading }}>
            {importStats.cats} yeni kategori, {importStats.items} ürün eklendi
            {importStats.skipped > 0 && ` · ${importStats.skipped} atlandı`}.
          </div>
          <div style={{ marginTop: 16 }}>
            <button type="button" style={S.btn} onClick={reset}>Yeni İçe Aktarma</button>
          </div>
        </div>
      )}
    </div>
  );
}
