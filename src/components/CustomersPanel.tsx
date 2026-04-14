import { useEffect, useState, useMemo } from 'react';
import {
  Users, PlusCircle, PencilSimple, Trash, X, CheckCircle,
  ChatCircle, ShoppingCart, CalendarBlank, MagnifyingGlass, Star,
} from '@phosphor-icons/react';
import { supabase } from '../lib/supabase';
import type { AdminTheme } from '../lib/adminTheme';
import { getAdminTheme } from '../lib/adminTheme';

type Customer = {
  id: string;
  restaurant_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  source: string;
  first_visit: string;
  last_visit: string;
  visit_count: number;
  total_spent: number;
  tags: string[];
  is_active: boolean;
};

type FormState = {
  name: string;
  email: string;
  phone: string;
  notes: string;
  tags: string[];
};

const EMPTY_FORM: FormState = { name: '', email: '', phone: '', notes: '', tags: [] };
const TAG_OPTIONS = ['VIP', 'Düzenli', 'Yeni', 'Şikayet', 'Özel'];
const SOURCE_LABEL: Record<string, { label: string; Icon: typeof PencilSimple }> = {
  manual: { label: 'El ile', Icon: PencilSimple },
  feedback: { label: 'Geri Bildirim', Icon: ChatCircle },
  order: { label: 'Sipariş', Icon: ShoppingCart },
  reservation: { label: 'Rezervasyon', Icon: CalendarBlank },
};

function cardStyle(t: AdminTheme): React.CSSProperties {
  return {
    background: t.cardBg,
    border: `1px solid ${t.cardBorder}`,
    borderRadius: 10,
    padding: 14,
    boxShadow: t.cardShadow,
  };
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

export default function CustomersPanel({ restaurantId, theme }: { restaurantId: string; theme?: AdminTheme }) {
  const t = theme ?? getAdminTheme('light');
  const card = cardStyle(t);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<string>('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    void load();
  }, [restaurantId]);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('last_visit', { ascending: false });
    setCustomers((data as Customer[]) ?? []);
    setLoading(false);
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(c: Customer) {
    setEditingId(c.id);
    setForm({
      name: c.name ?? '',
      email: c.email ?? '',
      phone: c.phone ?? '',
      notes: c.notes ?? '',
      tags: c.tags ?? [],
    });
    setShowForm(true);
  }

  async function saveCustomer() {
    if (!form.name.trim()) {
      setMsg('İsim zorunlu');
      setTimeout(() => setMsg(''), 2000);
      return;
    }
    const payload = {
      restaurant_id: restaurantId,
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      notes: form.notes.trim() || null,
      tags: form.tags,
    };
    if (editingId) {
      const { error } = await supabase.from('customers').update(payload).eq('id', editingId);
      if (error) { setMsg('Hata: ' + error.message); return; }
      setMsg('Müşteri güncellendi');
    } else {
      const { error } = await supabase.from('customers').insert({ ...payload, source: 'manual' });
      if (error) { setMsg('Hata: ' + error.message); return; }
      setMsg('Müşteri eklendi');
    }
    resetForm();
    await load();
    setTimeout(() => setMsg(''), 2000);
  }

  async function deleteCustomer(id: string) {
    if (!confirm('Bu müşteriyi silmek istediğinize emin misiniz?')) return;
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (!error) {
      setCustomers(prev => prev.filter(c => c.id !== id));
      setMsg('Müşteri silindi');
      setTimeout(() => setMsg(''), 2000);
    }
  }

  function toggleTag(tag: string) {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag],
    }));
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter(c => {
      if (tagFilter && !(c.tags ?? []).includes(tagFilter)) return false;
      if (!q) return true;
      return (
        (c.name ?? '').toLowerCase().includes(q) ||
        (c.email ?? '').toLowerCase().includes(q) ||
        (c.phone ?? '').toLowerCase().includes(q)
      );
    });
  }, [customers, search, tagFilter]);

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      total: customers.length,
      newThisMonth: customers.filter(c => new Date(c.first_visit) >= monthStart).length,
      vip: customers.filter(c => (c.tags ?? []).some(t => t.toLowerCase() === 'vip')).length,
      active: customers.filter(c => c.is_active).length,
    };
  }, [customers]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        {[
          { label: 'Toplam Müşteri', value: stats.total, Icon: Users },
          { label: 'Bu Ay Yeni', value: stats.newThisMonth, Icon: PlusCircle },
          { label: 'VIP', value: stats.vip, Icon: Star },
          { label: 'Aktif', value: stats.active, Icon: CheckCircle },
        ].map(s => (
          <div key={s.label} style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: t.subtle, fontSize: 12, marginBottom: 4 }}>
              <s.Icon size={16} weight="thin" /> {s.label}
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: t.value }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
          <MagnifyingGlass size={16} weight="thin" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: t.subtle }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="İsim, email veya telefon ara..."
            style={{ width: '100%', padding: '8px 10px 8px 32px', border: `1px solid ${t.cardBorder}`, borderRadius: 8, fontSize: 13 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {['', ...TAG_OPTIONS].map(tag => {
            const active = tagFilter === tag;
            return (
              <button
                key={tag || 'all'}
                type="button"
                onClick={() => setTagFilter(tag)}
                style={{
                  padding: '4px 10px', borderRadius: 12, fontSize: 12,
                  border: active ? '1px solid #FF4F7A' : '1px solid #E5E5E3',
                  background: active ? '#FF4F7A' : '#FFFFFF',
                  color: active ? '#FFFFFF' : '#1C1C1E',
                  cursor: 'pointer',
                }}
              >
                {tag || 'Tümü'}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => { resetForm(); setShowForm(true); }}
          style={{ marginLeft: 'auto', background: '#FF4F7A', color: '#FFFFFF', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <PlusCircle size={16} weight="thin" /> Müşteri Ekle
        </button>
      </div>

      {msg && (
        <div style={{ fontSize: 13, color: '#FF4F7A' }}>{msg}</div>
      )}

      {/* Inline Form */}
      {showForm && (
        <div style={{ ...card, borderLeft: '3px solid #FF4F7A' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: t.value, margin: 0 }}>
              {editingId ? 'Müşteriyi Düzenle' : 'Yeni Müşteri'}
            </h4>
            <button type="button" onClick={resetForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.subtle }}>
              <X size={18} weight="thin" />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            <label style={{ fontSize: 12, color: t.subtle }}>
              İsim *
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ width: '100%', padding: '8px 10px', border: `1px solid ${t.cardBorder}`, borderRadius: 6, fontSize: 13, marginTop: 4 }} />
            </label>
            <label style={{ fontSize: 12, color: t.subtle }}>
              Email
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ width: '100%', padding: '8px 10px', border: `1px solid ${t.cardBorder}`, borderRadius: 6, fontSize: 13, marginTop: 4 }} />
            </label>
            <label style={{ fontSize: 12, color: t.subtle }}>
              Telefon
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ width: '100%', padding: '8px 10px', border: `1px solid ${t.cardBorder}`, borderRadius: 6, fontSize: 13, marginTop: 4 }} />
            </label>
          </div>
          <label style={{ fontSize: 12, color: t.subtle, display: 'block', marginTop: 10 }}>
            Notlar
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} style={{ width: '100%', padding: '8px 10px', border: `1px solid ${t.cardBorder}`, borderRadius: 6, fontSize: 13, marginTop: 4, resize: 'vertical' }} />
          </label>
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 12, color: t.subtle, marginBottom: 6 }}>Etiketler</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {TAG_OPTIONS.map(tag => {
                const active = form.tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    style={{
                      padding: '4px 10px', borderRadius: 12, fontSize: 12,
                      border: active ? '1px solid #FF4F7A' : '1px solid #E5E5E3',
                      background: active ? '#FF4F7A' : '#FFFFFF',
                      color: active ? '#FFFFFF' : '#1C1C1E',
                      cursor: 'pointer',
                    }}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button type="button" onClick={saveCustomer} style={{ background: '#FF4F7A', color: '#FFFFFF', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              {editingId ? 'Güncelle' : 'Kaydet'}
            </button>
            <button type="button" onClick={resetForm} style={{ background: '#FFFFFF', color: t.value, border: `1px solid ${t.cardBorder}`, padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
              İptal
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ ...card, textAlign: 'center', color: t.subtle, fontSize: 13 }}>Yükleniyor...</div>
      ) : filtered.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', color: t.subtle, fontSize: 13 }}>
          {customers.length === 0 ? 'Henüz müşteri yok. Müşteri ekleyerek başlayın.' : 'Arama sonucu bulunamadı.'}
        </div>
      ) : (
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: t.tableHeaderBg, color: t.subtle, fontSize: 12 }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>İsim</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>İletişim</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Kaynak</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Etiketler</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>İlk/Son</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>#</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const src = SOURCE_LABEL[c.source] || SOURCE_LABEL.manual;
                  return (
                    <tr key={c.id} style={{ borderTop: `1px solid ${t.divider}` }}>
                      <td style={{ padding: '10px 12px', fontWeight: 500, color: t.value }}>
                        {c.name ?? '—'}
                        {!c.is_active && <span style={{ marginLeft: 6, fontSize: 11, color: t.subtle }}>(pasif)</span>}
                      </td>
                      <td style={{ padding: '10px 12px', color: t.value }}>
                        <div>{c.email ?? '—'}</div>
                        <div style={{ color: t.subtle, fontSize: 12 }}>{c.phone ?? ''}</div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: t.subtle }}>
                          <src.Icon size={14} weight="thin" /> {src.label}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {(c.tags ?? []).map(tag => (
                            <span key={tag} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'rgba(255,79,122,0.1)', color: '#FF4F7A' }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: t.subtle }}>
                        <div>{formatDate(c.first_visit)}</div>
                        <div>{formatDate(c.last_visit)}</div>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: t.value }}>{c.visit_count}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button type="button" onClick={() => startEdit(c)} style={{ background: 'none', border: 'none', color: t.subtle, cursor: 'pointer', padding: 4 }} title="Düzenle">
                          <PencilSimple size={16} weight="thin" />
                        </button>
                        <button type="button" onClick={() => deleteCustomer(c.id)} style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: 4 }} title="Sil">
                          <Trash size={16} weight="thin" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
