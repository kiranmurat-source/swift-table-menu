import { useEffect, useState } from 'react';
import { PlusCircle, XCircle, PencilSimple, Trash, Percent } from "@phosphor-icons/react";
import { supabase } from '../lib/supabase';

interface DiscountCode {
  id: string;
  restaurant_id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  current_uses: number;
  starts_at: string;
  expires_at: string | null;
  is_active: boolean;
  description: string;
  created_at: string;
}

const S = {
  card: { padding: '12px 16px', borderRadius: 8, border: '1px solid #E5E5E3', backgroundColor: '#fff', marginBottom: 8 } as React.CSSProperties,
  input: { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E5E3', fontSize: 13, outline: 'none', fontFamily: "'Roboto', sans-serif" } as React.CSSProperties,
  label: { fontSize: 12, fontWeight: 600, color: '#1C1C1E', marginBottom: 4, display: 'block' } as React.CSSProperties,
};

const EMPTY_FORM = {
  code: '', discount_type: 'percentage' as const, discount_value: '',
  min_order_amount: '', max_uses: '', starts_at: '', expires_at: '',
  description: '', is_active: true,
};

function generateCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export default function DiscountCodesPanel({ restaurantId }: { restaurantId: string }) {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchCodes = async () => {
    const { data } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });
    setCodes((data ?? []) as DiscountCode[]);
    setLoading(false);
  };

  useEffect(() => { fetchCodes(); }, [restaurantId]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowForm(true);
  };

  const openEdit = (c: DiscountCode) => {
    setEditingId(c.id);
    setForm({
      code: c.code,
      discount_type: c.discount_type,
      discount_value: String(c.discount_value),
      min_order_amount: c.min_order_amount ? String(c.min_order_amount) : '',
      max_uses: c.max_uses !== null ? String(c.max_uses) : '',
      starts_at: c.starts_at ? c.starts_at.slice(0, 16) : '',
      expires_at: c.expires_at ? c.expires_at.slice(0, 16) : '',
      description: c.description || '',
      is_active: c.is_active,
    });
    setError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    setError('');
    const trimCode = form.code.trim().toUpperCase();
    if (!trimCode || trimCode.length < 3) { setError('Kod en az 3 karakter olmalı'); return; }
    if (!/^[A-Z0-9-]+$/.test(trimCode)) { setError('Kod sadece büyük harf, rakam ve tire içerebilir'); return; }

    const val = Number(form.discount_value);
    if (!val || val <= 0) { setError('İndirim miktarı 0\'dan büyük olmalı'); return; }
    if (form.discount_type === 'percentage' && val > 100) { setError('Yüzde indirimi 100\'den büyük olamaz'); return; }
    if (form.discount_type === 'fixed' && val > 10000) { setError('Sabit tutar 10000\'den büyük olamaz'); return; }

    if (form.starts_at && form.expires_at && new Date(form.starts_at) >= new Date(form.expires_at)) {
      setError('Başlangıç tarihi bitiş tarihinden önce olmalı');
      return;
    }

    setSaving(true);
    const payload = {
      restaurant_id: restaurantId,
      code: trimCode,
      discount_type: form.discount_type,
      discount_value: val,
      min_order_amount: Number(form.min_order_amount) || 0,
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      starts_at: form.starts_at || new Date().toISOString(),
      expires_at: form.expires_at || null,
      description: form.description.trim(),
      is_active: form.is_active,
    };

    let err;
    if (editingId) {
      ({ error: err } = await supabase.from('discount_codes').update(payload).eq('id', editingId));
    } else {
      ({ error: err } = await supabase.from('discount_codes').insert(payload));
    }

    if (err) {
      setError(err.message.includes('idx_discount_code_unique') ? 'Bu kod zaten mevcut' : err.message);
    } else {
      setShowForm(false);
      fetchCodes();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu indirim kodunu silmek istediğinize emin misiniz?')) return;
    await supabase.from('discount_codes').delete().eq('id', id);
    setCodes(prev => prev.filter(c => c.id !== id));
  };

  const toggleActive = async (c: DiscountCode) => {
    await supabase.from('discount_codes').update({ is_active: !c.is_active }).eq('id', c.id);
    setCodes(prev => prev.map(x => x.id === c.id ? { ...x, is_active: !x.is_active } : x));
  };

  const getStatus = (c: DiscountCode): { label: string; color: string; dotColor: string } => {
    if (!c.is_active) return { label: 'Pasif', color: '#6B6B6F', dotColor: '#9ca3af' };
    if (c.expires_at && new Date(c.expires_at) < new Date()) return { label: 'Süresi Dolmuş', color: '#EF4444', dotColor: '#EF4444' };
    return { label: 'Aktif', color: '#22C55E', dotColor: '#22c55e' };
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1C1C1E', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Percent size={20} /> İndirim Kodları
        </h2>
        <button
          onClick={openCreate}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '6px 14px', borderRadius: 8, border: 'none',
            backgroundColor: '#FF4F7A', color: '#fff', fontSize: 13,
            fontWeight: 600, cursor: 'pointer',
          }}
        >
          <PlusCircle size={16} /> Yeni Kod Oluştur
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ ...S.card, backgroundColor: '#F7F7F5', marginBottom: 16, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1C1C1E' }}>
              {editingId ? 'Kodu Düzenle' : 'Yeni İndirim Kodu'}
            </h3>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B6B6F' }}>
              <XCircle size={20} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Code */}
            <div>
              <label style={S.label}>İndirim Kodu</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  style={S.input}
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '') })}
                  placeholder="HOSGELDIN10"
                  maxLength={20}
                />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, code: generateCode() })}
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E5E3', backgroundColor: '#fff', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap', color: '#6B6B6F' }}
                >
                  Rastgele
                </button>
              </div>
            </div>

            {/* Type */}
            <div>
              <label style={S.label}>İndirim Tipi</label>
              <div style={{ display: 'flex', gap: 12 }}>
                {(['percentage', 'fixed'] as const).map(t => (
                  <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer', color: '#1C1C1E' }}>
                    <input
                      type="radio"
                      checked={form.discount_type === t}
                      onChange={() => setForm({ ...form, discount_type: t })}
                    />
                    {t === 'percentage' ? 'Yüzde (%)' : 'Sabit Tutar (₺)'}
                  </label>
                ))}
              </div>
            </div>

            {/* Value */}
            <div>
              <label style={S.label}>İndirim Miktarı</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="number"
                  style={{ ...S.input, width: 120 }}
                  value={form.discount_value}
                  onChange={e => setForm({ ...form, discount_value: e.target.value })}
                  placeholder="10"
                  min={1}
                  max={form.discount_type === 'percentage' ? 100 : 10000}
                />
                <span style={{ fontSize: 13, color: '#6B6B6F' }}>{form.discount_type === 'percentage' ? '%' : '₺'}</span>
              </div>
            </div>

            {/* Min order */}
            <div>
              <label style={S.label}>Minimum Sipariş Tutarı (isteğe bağlı)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="number"
                  style={{ ...S.input, width: 120 }}
                  value={form.min_order_amount}
                  onChange={e => setForm({ ...form, min_order_amount: e.target.value })}
                  placeholder="0"
                  min={0}
                />
                <span style={{ fontSize: 13, color: '#6B6B6F' }}>₺</span>
              </div>
            </div>

            {/* Max uses */}
            <div>
              <label style={S.label}>Kullanım Limiti (isteğe bağlı)</label>
              <input
                type="number"
                style={{ ...S.input, width: 120 }}
                value={form.max_uses}
                onChange={e => setForm({ ...form, max_uses: e.target.value })}
                placeholder="Sınırsız"
                min={1}
              />
            </div>

            {/* Dates */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 140 }}>
                <label style={S.label}>Başlangıç</label>
                <input
                  type="datetime-local"
                  style={S.input}
                  value={form.starts_at}
                  onChange={e => setForm({ ...form, starts_at: e.target.value })}
                />
              </div>
              <div style={{ flex: 1, minWidth: 140 }}>
                <label style={S.label}>Bitiş (isteğe bağlı)</label>
                <input
                  type="datetime-local"
                  style={S.input}
                  value={form.expires_at}
                  onChange={e => setForm({ ...form, expires_at: e.target.value })}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={S.label}>Açıklama (isteğe bağlı)</label>
              <input
                style={S.input}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Yeni müşterilere özel"
                maxLength={100}
              />
            </div>

            {/* Active toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: '#1C1C1E' }}>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={e => setForm({ ...form, is_active: e.target.checked })}
                style={{ width: 16, height: 16 }}
              />
              Aktif
            </label>

            {error && <p style={{ fontSize: 12, color: '#EF4444' }}>{error}</p>}

            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '10px 0', borderRadius: 8, border: 'none',
                backgroundColor: '#FF4F7A', color: '#fff', fontSize: 14,
                fontWeight: 600, cursor: 'pointer',
              }}
            >
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <p style={{ textAlign: 'center', color: '#A0A0A0', fontSize: 13, padding: 32 }}>Yükleniyor...</p>
      ) : codes.length === 0 && !showForm ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Percent size={48} style={{ color: '#d1d5db', marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: '#6B6B6F' }}>Henüz indirim kodu oluşturmadınız.</p>
          <button
            onClick={openCreate}
            style={{
              marginTop: 12, padding: '8px 16px', borderRadius: 8, border: 'none',
              backgroundColor: '#FF4F7A', color: '#fff', fontSize: 13,
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            + İlk Kodunuzu Oluşturun
          </button>
        </div>
      ) : (
        codes.map(c => {
          const status = getStatus(c);
          return (
            <div key={c.id} style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'monospace', color: '#1C1C1E', letterSpacing: '0.05em' }}>
                    {c.code}
                  </span>
                  <span style={{ fontSize: 12, color: '#6B6B6F' }}>
                    {c.discount_type === 'percentage' ? `%${c.discount_value}` : `${Number(c.discount_value).toFixed(2)} ₺`} İndirim
                  </span>
                </div>
                <button
                  onClick={() => toggleActive(c)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 11, fontWeight: 600, color: status.color,
                    background: 'none', border: 'none', cursor: 'pointer',
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: status.dotColor, display: 'inline-block' }} />
                  {status.label}
                </button>
              </div>
              <div style={{ fontSize: 11, color: '#6B6B6F', display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 4 }}>
                <span>Min: {Number(c.min_order_amount) > 0 ? `${Number(c.min_order_amount).toFixed(0)} ₺` : 'Yok'}</span>
                <span>Kullanım: {c.current_uses}/{c.max_uses ?? '∞'}</span>
                <span>
                  Son: {c.expires_at
                    ? (new Date(c.expires_at) < new Date()
                      ? <span style={{ color: '#EF4444' }}>Süresi dolmuş</span>
                      : new Date(c.expires_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }))
                    : 'Süresiz'}
                </span>
              </div>
              {c.description && (
                <p style={{ fontSize: 11, color: '#A0A0A0', margin: '2px 0' }}>{c.description}</p>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                <button
                  onClick={() => openEdit(c)}
                  style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 11, color: '#6B6B6F', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <PencilSimple size={14} /> Düzenle
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 11, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <Trash size={14} /> Sil
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
