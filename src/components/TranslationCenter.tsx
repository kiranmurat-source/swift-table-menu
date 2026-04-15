import { useEffect, useMemo, useState, CSSProperties } from 'react';
import { supabase } from '../lib/supabase';
import { stripHtml } from '../lib/html';
import {
  AVAILABLE_LANGUAGES,
  calculateTranslationProgress,
  getLanguage,
  isRTL,
  type Language,
} from '../lib/languages';
import { Globe, CheckCircle, XCircle, Funnel, PlusCircle, CaretDown, CaretRight } from "@phosphor-icons/react";
import { getAdminTheme, type AdminTheme } from '../lib/adminTheme';

type Translations = Record<string, Record<string, string>>;

type Category = {
  id: string;
  restaurant_id: string;
  name_tr: string;
  name_en: string | null;
  sort_order: number;
  parent_id: string | null;
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
  theme?: 'light' | 'dark';
};

const SUPABASE_URL = 'https://qmnrawqvkwehufebbkxp.supabase.co';

function makeStyles(t: AdminTheme) {
  const S = {} as Record<string, CSSProperties> & {
    langTab: (active: boolean) => CSSProperties;
    progressBadge: (pct: number) => CSSProperties;
    treeItem: (active: boolean) => CSSProperties;
    dot: (done: boolean) => CSSProperties;
  };
  Object.assign(S, {
    wrap: { display: 'flex', flexDirection: 'column', gap: 16 },
    card: {
      background: t.cardBg,
      border: `1px solid ${t.border}`,
      borderRadius: 12,
      padding: 16,
    },
    title: {
      fontFamily: "'Roboto', sans-serif",
      fontSize: 22,
      fontWeight: 700,
      color: t.value,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    },
    langTabs: { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
    langTab: (active: boolean): CSSProperties => ({
      padding: '8px 14px',
      borderRadius: 20,
      border: active ? `2px solid ${t.value}` : `1px solid ${t.border}`,
      background: active ? t.hoverBg : t.cardBg,
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: 600,
      color: active ? t.value : t.heading,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
    }),
    progressBadge: (pct: number): CSSProperties => ({
      fontSize: 11,
      fontWeight: 700,
      padding: '2px 7px',
      borderRadius: 10,
      background: pct === 100 ? t.successBg : pct >= 50 ? t.warningBg : t.dangerBg,
      color: pct === 100 ? t.success : pct >= 50 ? t.accent : t.danger,
    }),
    addBtn: {
      padding: '8px 14px',
      borderRadius: 20,
      border: `1px dashed ${t.subtle}`,
      background: t.cardBg,
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: 600,
      color: t.heading,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
    },
    removeX: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: t.subtle,
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
      background: t.cardBg,
      border: `1px solid ${t.border}`,
      borderRadius: 12,
      padding: 12,
      maxHeight: 560,
      overflowY: 'auto',
    },
    treeCat: {
      padding: '8px 10px',
      fontWeight: 700,
      fontSize: 13,
      color: t.value,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: 6,
    },
    treeItem: (active: boolean): CSSProperties => ({
      padding: '6px 10px 6px 22px',
      fontSize: 13,
      color: active ? t.value : t.heading,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: 6,
      background: active ? t.hoverBg : 'transparent',
      fontWeight: active ? 600 : 400,
    }),
    dot: (done: boolean): CSSProperties => ({
      width: 8,
      height: 8,
      borderRadius: 4,
      background: done ? t.success : t.danger,
      display: 'inline-block',
      flexShrink: 0,
    }),
    editor: {
      background: t.cardBg,
      border: `1px solid ${t.border}`,
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
      color: t.heading,
      marginBottom: 6,
    },
    fieldLabel: { fontSize: 12, fontWeight: 600, color: t.value, marginBottom: 4 },
    readOnlyBox: {
      padding: 10,
      background: t.hoverBg,
      border: `1px solid ${t.border}`,
      borderRadius: 8,
      fontSize: 13,
      color: t.value,
      whiteSpace: 'pre-wrap',
      minHeight: 40,
    },
    input: {
      width: '100%',
      padding: 10,
      border: `1px solid ${t.inputBorder}`,
      borderRadius: 8,
      fontSize: 13,
      color: t.inputText,
      background: t.inputBg,
      boxSizing: 'border-box',
      outline: 'none',
    },
    inputEmpty: { background: t.key === 'dark' ? '#3A3418' : '#fefce8' },
    textarea: {
      width: '100%',
      padding: 10,
      border: `1px solid ${t.inputBorder}`,
      borderRadius: 8,
      fontSize: 13,
      color: t.inputText,
      background: t.inputBg,
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
      background: t.infoBg,
      color: t.info,
      border: `1px solid ${t.border}`,
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
      background: t.accent,
      color: '#fff',
      border: 'none',
      borderRadius: 8,
      cursor: 'pointer',
    },
    btnSecondary: {
      padding: '10px 14px',
      fontSize: 13,
      fontWeight: 600,
      background: t.cardBg,
      color: t.value,
      border: `1px solid ${t.border}`,
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
      color: t.value,
    },
    emptyState: {
      padding: '40px 20px',
      textAlign: 'center',
      color: t.subtle,
      fontSize: 13,
    },
  } satisfies Record<string, CSSProperties | ((...args: never[]) => CSSProperties)>);
  return S;
}

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
  theme,
}: Props) {
  const th = getAdminTheme(theme);
  const S = useMemo(() => makeStyles(th), [th]);
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
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('translationCenter:collapsedCats');
      return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
    } catch { return new Set(); }
  });
  const toggleCollapse = (id: string) => {
    setCollapsedCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      try { localStorage.setItem('translationCenter:collapsedCats', JSON.stringify(Array.from(next))); } catch { /* noop */ }
      return next;
    });
  };
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

    // Description (only for items) — translations are plain text;
    // strip HTML from TR/EN source in case admin uses rich text editor.
    if (selection.kind === 'item') {
      const item = record as MenuItem;
      if (targetLang === 'tr') {
        setDraftDesc(stripHtml(item.description_tr));
      } else if (targetLang === 'en' && item.description_en && item.description_en.trim() !== '') {
        setDraftDesc(stripHtml(item.description_en));
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

  // Next / prev navigation — flatten tree into ordered list (parents → children → items)
  const flatList = useMemo(() => {
    const list: Selection[] = [];
    const roots = categories.filter((c) => !c.parent_id).sort((a, b) => a.sort_order - b.sort_order);
    for (const parent of roots) {
      list.push({ kind: 'category', id: parent.id });
      // Ürünler doğrudan parent altında
      const directItems = items.filter((i) => i.category_id === parent.id);
      for (const it of directItems) list.push({ kind: 'item', id: it.id });
      // Alt kategoriler ve onların ürünleri
      const children = categories
        .filter((c) => c.parent_id === parent.id)
        .sort((a, b) => a.sort_order - b.sort_order);
      for (const child of children) {
        list.push({ kind: 'category', id: child.id });
        const childItems = items.filter((i) => i.category_id === child.id);
        for (const it of childItems) list.push({ kind: 'item', id: it.id });
      }
    }
    // Orphan kategoriler (parent'ı silinmiş olabilir)
    const seen = new Set(list.filter((s): s is { kind: 'category'; id: string } => !!s && s.kind === 'category').map((s) => s.id));
    for (const c of categories) {
      if (!seen.has(c.id)) {
        list.push({ kind: 'category', id: c.id });
        for (const it of items.filter((i) => i.category_id === c.id)) list.push({ kind: 'item', id: it.id });
      }
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
          <Globe size={22} /> Çeviri Merkezi
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
                    <XCircle size={16} />
                  </button>
                )}
              </div>
            );
          })}
          <div style={{ position: 'relative' }}>
            <button style={S.addBtn} onClick={() => setShowAddLang((v) => !v)}>
              <PlusCircle size={16} /> Dil Ekle
            </button>
            {showAddLang && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: 6,
                  background: th.cardBg,
                  border: `1px solid ${th.border}`,
                  borderRadius: 8,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                  maxHeight: 320,
                  overflowY: 'auto',
                  minWidth: 220,
                  zIndex: 100,
                }}
              >
                {addableLanguages.length === 0 && (
                  <div style={{ padding: 12, fontSize: 12, color: th.subtle }}>
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
                    onMouseEnter={(e) => (e.currentTarget.style.background = th.hoverBg)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = th.cardBg)}
                  >
                    <span>{l.flag}</span>
                    <span>{l.nativeName}</span>
                    <span style={{ color: th.subtle, fontSize: 11 }}>{l.code}</span>
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
              background: msg.kind === 'ok' ? th.successBg : th.dangerBg,
              color: msg.kind === 'ok' ? th.success : th.danger,
              border: `1px solid ${msg.kind === 'ok' ? th.successBg : th.dangerBg}`,
            }}
          >
            {msg.text}
          </div>
        )}
      </div>

      <div style={S.filterRow}>
        <Funnel size={16} />
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
          {(() => {
            const renderItem = (it: MenuItem, indent: number) => {
              const itDone = isRecordDone(it, targetLang);
              if (onlyUntranslated && itDone) return null;
              const itActive = selection?.kind === 'item' && selection.id === it.id;
              return (
                <div
                  key={it.id}
                  style={{ ...S.treeItem(itActive), paddingLeft: indent }}
                  onClick={() => setSelection({ kind: 'item', id: it.id })}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                    <span style={{ color: th.subtle, fontSize: 11, width: 10, textAlign: 'center' }}>—</span>
                    <span style={S.dot(itDone)} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {it.name_tr}
                    </span>
                  </span>
                </div>
              );
            };

            const renderCat = (cat: Category, opts: { isChild: boolean; hasChildren: boolean }) => {
              const catItems = items.filter((i) => i.category_id === cat.id);
              const catDone = isRecordDone(cat, targetLang);
              const anyChildUntranslated = catItems.some((ch) => !isRecordDone(ch, targetLang));
              const descendantUntranslated = !opts.isChild
                ? categories
                    .filter((c) => c.parent_id === cat.id)
                    .some((child) => !isRecordDone(child, targetLang) || items.filter((i) => i.category_id === child.id).some((it) => !isRecordDone(it, targetLang)))
                : false;
              const showCat = !onlyUntranslated || !catDone || anyChildUntranslated || descendantUntranslated;
              if (!showCat) return null;
              const catActive = selection?.kind === 'category' && selection.id === cat.id;
              const isCollapsed = collapsedCats.has(cat.id);
              const childCats = !opts.isChild
                ? categories.filter((c) => c.parent_id === cat.id).sort((a, b) => a.sort_order - b.sort_order)
                : [];
              const canToggle = opts.hasChildren || catItems.length > 0;
              return (
                <div key={cat.id} style={{ marginBottom: 2 }}>
                  <div
                    style={{
                      ...S.treeCat,
                      background: catActive ? th.hoverBg : 'transparent',
                      paddingLeft: opts.isChild ? 16 : 8,
                      fontWeight: opts.isChild ? 400 : 600,
                      fontSize: opts.isChild ? 13 : 14,
                    }}
                    onClick={() => setSelection({ kind: 'category', id: cat.id })}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                      {canToggle ? (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleCollapse(cat.id); }}
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: th.subtle, display: 'inline-flex', alignItems: 'center' }}
                          aria-label={isCollapsed ? 'Aç' : 'Kapat'}
                        >
                          {isCollapsed ? <CaretRight size={12} /> : <CaretDown size={12} />}
                        </button>
                      ) : (
                        <span style={{ width: 12, display: 'inline-block' }} />
                      )}
                      <span style={S.dot(catDone)} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name_tr}</span>
                    </span>
                    {catDone && <CheckCircle size={14} color={th.success} />}
                  </div>
                  {!isCollapsed && (
                    <>
                      {catItems.map((it) => renderItem(it, opts.isChild ? 48 : 32))}
                      {childCats.map((child) => renderCat(child, { isChild: true, hasChildren: false }))}
                    </>
                  )}
                </div>
              );
            };

            const rootCats = categories.filter((c) => !c.parent_id).sort((a, b) => a.sort_order - b.sort_order);
            const childMap = new Map<string, Category[]>();
            for (const c of categories) {
              if (c.parent_id) {
                if (!childMap.has(c.parent_id)) childMap.set(c.parent_id, []);
                childMap.get(c.parent_id)!.push(c);
              }
            }
            const rendered = rootCats.map((cat) =>
              renderCat(cat, { isChild: false, hasChildren: (childMap.get(cat.id)?.length ?? 0) > 0 }),
            );
            // Orphan kategoriler (parent'ı artık mevcut değilse)
            const rootIds = new Set(rootCats.map((c) => c.id));
            const orphans = categories.filter((c) => c.parent_id && !categories.some((p) => p.id === c.parent_id) && !rootIds.has(c.id));
            const orphanRendered = orphans.map((cat) => renderCat(cat, { isChild: false, hasChildren: false }));
            return <>{rendered}{orphanRendered}</>;
          })()}
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
                        {stripHtml((selectedRecord as MenuItem).description_tr) || '—'}
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
                        <Globe size={12} /> Otomatik çevir
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
          <Globe size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
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
