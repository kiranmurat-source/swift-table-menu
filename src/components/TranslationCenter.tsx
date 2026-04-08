import { useEffect, useMemo, useState, CSSProperties } from 'react';
import { supabase } from '../lib/supabase';
import {
  AVAILABLE_LANGUAGES,
  calculateTranslationProgress,
  getLanguage,
  isRTL,
  type Language,
} from '../lib/languages';
import {
  CiGlobe,
  CiCircleCheck,
  CiCircleRemove,
  CiFilter,
  CiCirclePlus,
} from 'react-icons/ci';

type Translations = Record<string, Record<string, string>>;

type Category = {
  id: string;
  restaurant_id: string;
  name_tr: string;
  name_en: string | null;
  sort_order: number;
  translations: Translations | null;
};

type MenuItem = {
  id: string;
  restaurant_id: string;
  category_id: string;
  name_tr: string;
  name_en: string | null;
  description_tr: string | null;
  description_en: string | null;
  sort_order: number;
  translations: Translations | null;
};

type Selection =
  | { kind: 'category'; id: string }
  | { kind: 'item'; id: string }
  | null;

type Props = {
  restaurantId: string;
  enabledLanguages: string[];
  onEnabledLanguagesChange: (langs: string[]) => void;
};

const SUPABASE_URL = 'https://qmnrawqvkwehufebbkxp.supabase.co';

const S = {} as Record<string, CSSProperties> & {
  langTab: (active: boolean) => CSSProperties;
  progressBadge: (pct: number) => CSSProperties;
  treeItem: (active: boolean) => CSSProperties;
  dot: (done: boolean) => CSSProperties;
};
Object.assign(S, {
  wrap: { display: 'flex', flexDirection: 'column', gap: 16 },
  card: {
    background: '#fff',
    border: '1px solid #e7e5e4',
    borderRadius: 12,
    padding: 16,
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 22,
    fontWeight: 700,
    color: '#1c1917',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  langTabs: { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  langTab: (active: boolean): CSSProperties => ({
    padding: '8px 14px',
    borderRadius: 20,
    border: active ? '2px solid #1c1917' : '1px solid #d6d3d1',
    background: active ? '#fafaf9' : '#fff',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    color: active ? '#1c1917' : '#57534e',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  }),
  progressBadge: (pct: number): CSSProperties => ({
    fontSize: 11,
    fontWeight: 700,
    padding: '2px 7px',
    borderRadius: 10,
    background: pct === 100 ? '#dcfce7' : pct >= 50 ? '#fef9c3' : '#fee2e2',
    color: pct === 100 ? '#15803d' : pct >= 50 ? '#a16207' : '#b91c1c',
  }),
  addBtn: {
    padding: '8px 14px',
    borderRadius: 20,
    border: '1px dashed #a8a29e',
    background: '#fff',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    color: '#57534e',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  },
  removeX: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#a8a29e',
    padding: 0,
    marginLeft: 2,
    display: 'inline-flex',
    alignItems: 'center',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '260px 1fr',
    gap: 16,
    alignItems: 'start',
  },
  tree: {
    background: '#fff',
    border: '1px solid #e7e5e4',
    borderRadius: 12,
    padding: 12,
    maxHeight: 560,
    overflowY: 'auto',
  },
  treeCat: {
    padding: '8px 10px',
    fontWeight: 700,
    fontSize: 13,
    color: '#1c1917',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 6,
  },
  treeItem: (active: boolean): CSSProperties => ({
    padding: '6px 10px 6px 22px',
    fontSize: 13,
    color: active ? '#1c1917' : '#57534e',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 6,
    background: active ? '#f5f5f4' : 'transparent',
    fontWeight: active ? 600 : 400,
  }),
  dot: (done: boolean): CSSProperties => ({
    width: 8,
    height: 8,
    borderRadius: 4,
    background: done ? '#16a34a' : '#dc2626',
    display: 'inline-block',
    flexShrink: 0,
  }),
  editor: {
    background: '#fff',
    border: '1px solid #e7e5e4',
    borderRadius: 12,
    padding: 16,
  },
  editorGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  },
  colLabel: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#78716c',
    marginBottom: 6,
  },
  fieldLabel: { fontSize: 12, fontWeight: 600, color: '#44403c', marginBottom: 4 },
  readOnlyBox: {
    padding: 10,
    background: '#fafaf9',
    border: '1px solid #e7e5e4',
    borderRadius: 8,
    fontSize: 13,
    color: '#44403c',
    whiteSpace: 'pre-wrap',
    minHeight: 40,
  },
  input: {
    width: '100%',
    padding: 10,
    border: '1px solid #d6d3d1',
    borderRadius: 8,
    fontSize: 13,
    color: '#1c1917',
    background: '#fff',
    boxSizing: 'border-box',
    outline: 'none',
  },
  inputEmpty: { background: '#fefce8' },
  textarea: {
    width: '100%',
    padding: 10,
    border: '1px solid #d6d3d1',
    borderRadius: 8,
    fontSize: 13,
    color: '#1c1917',
    background: '#fff',
    boxSizing: 'border-box',
    outline: 'none',
    minHeight: 90,
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  aiBtn: {
    padding: '6px 10px',
    fontSize: 11,
    fontWeight: 600,
    background: '#eef2ff',
    color: '#4338ca',
    border: '1px solid #c7d2fe',
    borderRadius: 6,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  },
  saveBtn: {
    padding: '10px 18px',
    fontSize: 13,
    fontWeight: 700,
    background: '#1c1917',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  },
  btnSecondary: {
    padding: '10px 14px',
    fontSize: 13,
    fontWeight: 600,
    background: '#fff',
    color: '#1c1917',
    border: '1px solid #d6d3d1',
    borderRadius: 8,
    cursor: 'pointer',
  },
  bottomBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    color: '#44403c',
  },
  emptyState: {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#a8a29e',
    fontSize: 13,
  },
} satisfies Record<string, CSSProperties | ((...args: never[]) => CSSProperties)>);

function isFieldDone(
  record: Category | MenuItem,
  field: 'name' | 'description',
  lang: string,
): boolean {
  if (lang === 'tr') return true;
  if (field === 'description' && !(record as MenuItem).description_tr) return true; // nothing to translate
  if (lang === 'en') {
    const enKey = `${field}_en` as 'name_en' | 'description_en';
    const existing = (record as MenuItem)[enKey];
    if (existing && existing.trim() !== '') return true;
  }
  const t = record.translations?.[lang]?.[field];
  return !!(t && t.trim() !== '');
}

function isRecordDone(record: Category | MenuItem, lang: string): boolean {
  const kind = 'category_id' in record ? 'item' : 'category';
  const nameDone = isFieldDone(record, 'name', lang);
  if (kind === 'category') return nameDone;
  return nameDone && isFieldDone(record, 'description', lang);
}

export default function TranslationCenter({
  restaurantId,
  enabledLanguages,
  onEnabledLanguagesChange,
}: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetLang, setTargetLang] = useState<string>(() => {
    const first = enabledLanguages.find((l) => l !== 'tr');
    return first || 'en';
  });
  const [selection, setSelection] = useState<Selection>(null);
  const [draftName, setDraftName] = useState('');
  const [draftDesc, setDraftDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null);
  const [onlyUntranslated, setOnlyUntranslated] = useState(false);
  const [showAddLang, setShowAddLang] = useState(false);
  const [msg, setMsg] = useState<{ text: string; kind: 'ok' | 'err' } | null>(null);

  const tabLanguages = useMemo<string[]>(
    () => ['tr', ...enabledLanguages.filter((l) => l !== 'tr')],
    [enabledLanguages],
  );

  const addableLanguages = useMemo<Language[]>(
    () => AVAILABLE_LANGUAGES.filter((l) => !tabLanguages.includes(l.code)),
    [tabLanguages],
  );

  useEffect(() => {
    if (!restaurantId) return;
    setLoading(true);
    Promise.all([
      supabase.from('menu_categories').select('*').eq('restaurant_id', restaurantId).order('sort_order'),
      supabase.from('menu_items').select('*').eq('restaurant_id', restaurantId).order('sort_order'),
    ]).then(([{ data: cats }, { data: its }]) => {
      setCategories((cats || []) as Category[]);
      setItems((its || []) as MenuItem[]);
      setLoading(false);
    });
  }, [restaurantId]);

  // Load draft when selection or target language changes
  useEffect(() => {
    if (!selection) {
      setDraftName('');
      setDraftDesc('');
      return;
    }
    const record =
      selection.kind === 'category'
        ? categories.find((c) => c.id === selection.id)
        : items.find((i) => i.id === selection.id);
    if (!record) return;

    // Name
    if (targetLang === 'tr') {
      setDraftName(record.name_tr || '');
    } else if (targetLang === 'en' && record.name_en && record.name_en.trim() !== '') {
      setDraftName(record.name_en);
    } else {
      setDraftName(record.translations?.[targetLang]?.name || '');
    }

    // Description (only for items)
    if (selection.kind === 'item') {
      const item = record as MenuItem;
      if (targetLang === 'tr') {
        setDraftDesc(item.description_tr || '');
      } else if (targetLang === 'en' && item.description_en && item.description_en.trim() !== '') {
        setDraftDesc(item.description_en);
      } else {
        setDraftDesc(item.translations?.[targetLang]?.description || '');
      }
    } else {
      setDraftDesc('');
    }
  }, [selection, targetLang, categories, items]);

  function flash(text: string, kind: 'ok' | 'err' = 'ok') {
    setMsg({ text, kind });
    setTimeout(() => setMsg(null), 3000);
  }

  const progressByLang = useMemo(() => {
    const out: Record<string, number> = {};
    for (const lc of tabLanguages) {
      out[lc] = calculateTranslationProgress(items, categories, lc);
    }
    return out;
  }, [items, categories, tabLanguages]);

  const selectedRecord = useMemo(() => {
    if (!selection) return null;
    return selection.kind === 'category'
      ? categories.find((c) => c.id === selection.id) || null
      : items.find((i) => i.id === selection.id) || null;
  }, [selection, categories, items]);

  async function handleAddLanguage(code: string) {
    const next = [...enabledLanguages];
    if (!next.includes('tr')) next.unshift('tr');
    if (!next.includes(code)) next.push(code);
    const { error } = await supabase
      .from('restaurants')
      .update({ enabled_languages: next })
      .eq('id', restaurantId);
    if (error) {
      flash(`Dil eklenemedi: ${error.message}`, 'err');
      return;
    }
    onEnabledLanguagesChange(next);
    setTargetLang(code);
    setShowAddLang(false);
    flash(`${getLanguage(code)?.nativeName || code} eklendi`);
  }

  async function handleRemoveLanguage(code: string) {
    if (code === 'tr') return;
    if (!confirm(`${getLanguage(code)?.nativeName || code} dilini devre dışı bırakmak istediğinize emin misiniz? (Mevcut çeviri verileri silinmez)`)) return;
    const next = enabledLanguages.filter((l) => l !== code);
    const { error } = await supabase
      .from('restaurants')
      .update({ enabled_languages: next })
      .eq('id', restaurantId);
    if (error) {
      flash(`Dil silinemedi: ${error.message}`, 'err');
      return;
    }
    onEnabledLanguagesChange(next);
    if (targetLang === code) {
      const firstOther = next.find((l) => l !== 'tr');
      setTargetLang(firstOther || 'en');
    }
    flash('Dil devre dışı bırakıldı');
  }

  async function callTranslateFn(table: 'menu_items' | 'menu_categories', recordId: string, langs: string[]) {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/translate-menu`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbnJhd3F2a3dlaHVmZWJia3hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMTk5OTQsImV4cCI6MjA5MDc5NTk5NH0.cQeGl66uJAy3Q4FpAgh6hgNImEx4RsVK-CfBuukJuEc',
      },
      body: JSON.stringify({ table, record_id: recordId, languages: langs }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || 'Translation failed');
    }
    return res.json();
  }

  async function autoTranslateCurrent() {
    if (!selection || targetLang === 'tr') return;
    const table = selection.kind === 'item' ? 'menu_items' : 'menu_categories';
    setBusy('single');
    try {
      await callTranslateFn(table, selection.id, [targetLang]);
      await reloadOne(table, selection.id);
      flash('Otomatik çeviri tamamlandı');
    } catch (e) {
      flash(`Çeviri başarısız: ${(e as Error).message}`, 'err');
    } finally {
      setBusy(null);
    }
  }

  async function reloadOne(table: 'menu_items' | 'menu_categories', id: string) {
    const { data } = await supabase.from(table).select('*').eq('id', id).single();
    if (!data) return;
    if (table === 'menu_items') {
      setItems((prev) => prev.map((x) => (x.id === id ? (data as MenuItem) : x)));
    } else {
      setCategories((prev) => prev.map((x) => (x.id === id ? (data as Category) : x)));
    }
  }

  async function handleSave() {
    if (!selection || !selectedRecord || targetLang === 'tr') return;
    setSaving(true);
    try {
      const table = selection.kind === 'item' ? 'menu_items' : 'menu_categories';
      const current: Translations = selectedRecord.translations || {};
      const langObj = { ...(current[targetLang] || {}) };
      langObj.name = draftName;
      if (selection.kind === 'item') langObj.description = draftDesc;
      const nextTranslations: Translations = { ...current, [targetLang]: langObj };

      const update: Record<string, unknown> = { translations: nextTranslations };
      // Keep name_en / description_en in sync for backward compat
      if (targetLang === 'en') {
        update.name_en = draftName;
        if (selection.kind === 'item') update.description_en = draftDesc;
      }
      const { error } = await supabase.from(table).update(update).eq('id', selection.id);
      if (error) throw error;
      await reloadOne(table, selection.id);
      flash('Çeviri kaydedildi');
    } catch (e) {
      flash(`Kaydedilemedi: ${(e as Error).message}`, 'err');
    } finally {
      setSaving(false);
    }
  }

  async function translateAll() {
    if (targetLang === 'tr') return;
    // Only records that are missing translations for this language
    const catTargets = categories.filter((c) => !isRecordDone(c, targetLang));
    const itemTargets = items.filter((i) => !isRecordDone(i, targetLang));
    const total = catTargets.length + itemTargets.length;
    if (total === 0) {
      flash('Bu dil için çevrilecek öğe yok');
      return;
    }
    setBulkProgress({ current: 0, total });
    setBusy('bulk');
    let done = 0;
    try {
      for (const c of catTargets) {
        await callTranslateFn('menu_categories', c.id, [targetLang]);
        await reloadOne('menu_categories', c.id);
        done++;
        setBulkProgress({ current: done, total });
      }
      for (const it of itemTargets) {
        await callTranslateFn('menu_items', it.id, [targetLang]);
        await reloadOne('menu_items', it.id);
        done++;
        setBulkProgress({ current: done, total });
      }
      flash(`${total} öğe çevrildi`);
    } catch (e) {
      flash(`Toplu çeviri sırasında hata: ${(e as Error).message}`, 'err');
    } finally {
      setBusy(null);
      setBulkProgress(null);
    }
  }

  // Next / prev navigation — flatten tree into ordered list
  const flatList = useMemo(() => {
    const list: Selection[] = [];
    for (const cat of categories) {
      list.push({ kind: 'category', id: cat.id });
      const children = items.filter((i) => i.category_id === cat.id);
      for (const it of children) list.push({ kind: 'item', id: it.id });
    }
    return list;
  }, [categories, items]);

  const filteredFlat = useMemo(() => {
    if (!onlyUntranslated) return flatList;
    return flatList.filter((s) => {
      if (!s) return false;
      const rec =
        s.kind === 'category'
          ? categories.find((c) => c.id === s.id)
          : items.find((i) => i.id === s.id);
      return rec ? !isRecordDone(rec, targetLang) : false;
    });
  }, [flatList, onlyUntranslated, categories, items, targetLang]);

  function navigate(direction: 1 | -1) {
    if (!selection) {
      if (filteredFlat[0]) setSelection(filteredFlat[0]);
      return;
    }
    const idx = filteredFlat.findIndex(
      (s) => s && selection && s.kind === selection.kind && s.id === selection.id,
    );
    const nextIdx = idx + direction;
    if (nextIdx >= 0 && nextIdx < filteredFlat.length) {
      setSelection(filteredFlat[nextIdx]);
    }
  }

  const targetLangObj = getLanguage(targetLang);
  const targetDir = isRTL(targetLang) ? 'rtl' : 'ltr';
  const isCategorySelected = selection?.kind === 'category';

  return (
    <div style={S.wrap}>
      <div style={S.card}>
        <div style={{ ...S.title, marginBottom: 12 }}>
          <CiGlobe size={22} /> Çeviri Merkezi
        </div>
        <div style={S.langTabs}>
          {tabLanguages.map((code) => {
            const lang = getLanguage(code);
            const pct = progressByLang[code] ?? 0;
            const active = targetLang === code;
            return (
              <div
                key={code}
                style={S.langTab(active)}
                onClick={() => setTargetLang(code)}
              >
                <span>{lang?.flag}</span>
                <span>{lang?.nativeName || code}</span>
                <span style={S.progressBadge(pct)}>%{pct}</span>
                {code !== 'tr' && (
                  <button
                    style={S.removeX}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveLanguage(code);
                    }}
                    aria-label="Dili kaldır"
                  >
                    <CiCircleRemove size={16} />
                  </button>
                )}
              </div>
            );
          })}
          <div style={{ position: 'relative' }}>
            <button style={S.addBtn} onClick={() => setShowAddLang((v) => !v)}>
              <CiCirclePlus size={16} /> Dil Ekle
            </button>
            {showAddLang && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: 6,
                  background: '#fff',
                  border: '1px solid #e7e5e4',
                  borderRadius: 8,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                  maxHeight: 320,
                  overflowY: 'auto',
                  minWidth: 220,
                  zIndex: 100,
                }}
              >
                {addableLanguages.length === 0 && (
                  <div style={{ padding: 12, fontSize: 12, color: '#a8a29e' }}>
                    Tüm diller eklendi.
                  </div>
                )}
                {addableLanguages.map((l) => (
                  <div
                    key={l.code}
                    onClick={() => handleAddLanguage(l.code)}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#fafaf9')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                  >
                    <span>{l.flag}</span>
                    <span>{l.nativeName}</span>
                    <span style={{ color: '#a8a29e', fontSize: 11 }}>{l.code}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {msg && (
          <div
            style={{
              marginTop: 10,
              padding: '8px 12px',
              borderRadius: 8,
              fontSize: 12,
              background: msg.kind === 'ok' ? '#f0fdf4' : '#fef2f2',
              color: msg.kind === 'ok' ? '#166534' : '#b91c1c',
              border: `1px solid ${msg.kind === 'ok' ? '#bbf7d0' : '#fecaca'}`,
            }}
          >
            {msg.text}
          </div>
        )}
      </div>

      <div style={S.filterRow}>
        <CiFilter size={16} />
        <label style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={onlyUntranslated}
            onChange={(e) => setOnlyUntranslated(e.target.checked)}
          />
          Sadece çevrilmemiş
        </label>
      </div>

      <div style={S.grid}>
        {/* Menu tree */}
        <div style={S.tree}>
          {loading && <div style={S.emptyState}>Yükleniyor...</div>}
          {!loading && categories.length === 0 && (
            <div style={S.emptyState}>Menüde henüz kategori yok.</div>
          )}
          {categories.map((cat) => {
            const children = items.filter((i) => i.category_id === cat.id);
            const catDone = isRecordDone(cat, targetLang);
            const showCat = !onlyUntranslated || !catDone || children.some((ch) => !isRecordDone(ch, targetLang));
            if (!showCat) return null;
            const catActive = selection?.kind === 'category' && selection.id === cat.id;
            return (
              <div key={cat.id} style={{ marginBottom: 4 }}>
                <div
                  style={{
                    ...S.treeCat,
                    background: catActive ? '#f5f5f4' : 'transparent',
                  }}
                  onClick={() => setSelection({ kind: 'category', id: cat.id })}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={S.dot(catDone)} />
                    <span>{cat.name_tr}</span>
                  </span>
                  {catDone && <CiCircleCheck size={14} color="#16a34a" />}
                </div>
                {children.map((it) => {
                  const itDone = isRecordDone(it, targetLang);
                  if (onlyUntranslated && itDone) return null;
                  const itActive = selection?.kind === 'item' && selection.id === it.id;
                  return (
                    <div
                      key={it.id}
                      style={S.treeItem(itActive)}
                      onClick={() => setSelection({ kind: 'item', id: it.id })}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                        <span style={S.dot(itDone)} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {it.name_tr}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Editor */}
        <div style={S.editor}>
          {!selection || !selectedRecord ? (
            <div style={S.emptyState}>Çevirmek için soldan bir öğe seçin.</div>
          ) : (
            <>
              <div style={S.editorGrid}>
                {/* Source (TR) */}
                <div>
                  <div style={S.colLabel}>🇹🇷 Türkçe (Kaynak)</div>
                  <div style={S.fieldLabel}>Ad</div>
                  <div style={S.readOnlyBox}>{selectedRecord.name_tr || '—'}</div>
                  {!isCategorySelected && (
                    <>
                      <div style={{ ...S.fieldLabel, marginTop: 12 }}>Açıklama</div>
                      <div style={S.readOnlyBox}>
                        {(selectedRecord as MenuItem).description_tr || '—'}
                      </div>
                    </>
                  )}
                </div>
                {/* Target */}
                <div>
                  <div style={S.colLabel}>
                    {targetLangObj?.flag} {targetLangObj?.nativeName || targetLang} (Hedef)
                  </div>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div style={S.fieldLabel}>Ad</div>
                    {targetLang !== 'tr' && (
                      <button
                        style={S.aiBtn}
                        disabled={busy !== null}
                        onClick={autoTranslateCurrent}
                      >
                        <CiGlobe size={12} /> Otomatik çevir
                      </button>
                    )}
                  </div>
                  <input
                    dir={targetDir}
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    style={{
                      ...S.input,
                      ...(draftName.trim() === '' ? S.inputEmpty : {}),
                      textAlign: targetDir === 'rtl' ? 'right' : 'left',
                    }}
                    disabled={targetLang === 'tr'}
                  />
                  {!isCategorySelected && (
                    <>
                      <div style={{ ...S.fieldLabel, marginTop: 12 }}>Açıklama</div>
                      <textarea
                        dir={targetDir}
                        value={draftDesc}
                        onChange={(e) => setDraftDesc(e.target.value)}
                        style={{
                          ...S.textarea,
                          ...(draftDesc.trim() === '' ? S.inputEmpty : {}),
                          textAlign: targetDir === 'rtl' ? 'right' : 'left',
                        }}
                        disabled={targetLang === 'tr'}
                      />
                    </>
                  )}
                  {targetLang !== 'tr' && (
                    <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        style={S.saveBtn}
                        onClick={handleSave}
                        disabled={saving}
                      >
                        {saving ? 'Kaydediliyor...' : 'Kaydet'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div style={S.bottomBar}>
        <button
          style={S.btnSecondary}
          onClick={translateAll}
          disabled={busy !== null || targetLang === 'tr'}
        >
          <CiGlobe size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          {bulkProgress
            ? `Çevriliyor... (${bulkProgress.current}/${bulkProgress.total})`
            : 'Tümünü Otomatik Çevir'}
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={S.btnSecondary} onClick={() => navigate(-1)}>← Önceki</button>
          <button style={S.btnSecondary} onClick={() => navigate(1)}>Sonraki →</button>
        </div>
      </div>
    </div>
  );
}
