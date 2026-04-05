import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { CiCircleCheck, CiCircleRemove } from 'react-icons/ci';

type Restaurant = { id: string; name: string; slug: string; is_active: boolean; subscription_status: string; current_plan: string; created_at: string; };
type Profile = { id: string; email: string; full_name: string | null; role: string; restaurant_id: string | null; };
type Plan = { id: string; name: string; price_monthly: number | null; price_yearly: number; features: string[]; sort_order: number; };
type Subscription = { id: string; restaurant_id: string; plan_id: string; start_date: string; end_date: string; status: string; payment_method: string; notes: string | null; };
type Feature = { id: string; category: string; name: string; description: string | null; sort_order: number; };
type PlanFeature = { id: string; plan_id: string; feature_id: string; value: string; };

const CATEGORIES = ['MENÜ', 'AI ARAÇLARI', 'SİPARİŞ & SERVİS', 'MÜŞTERİ DENEYİMİ', 'PAZARLAMA & SOSYAL', 'YÖNETİM'];

const S: Record<string, React.CSSProperties> = {
  wrap: { maxWidth: 1100, margin: '0 auto', padding: '32px 24px' },
  card: { background: '#fff', border: '1px solid #e7e5e4', borderRadius: 12, padding: 24, marginBottom: 16 },
  input: { width: '100%', padding: '10px 14px', fontSize: 14, border: '1px solid #d6d3d1', borderRadius: 8, outline: 'none', background: '#fff', boxSizing: 'border-box' as const },
  btn: { padding: '10px 20px', fontSize: 13, fontWeight: 700, color: '#fff', background: '#1c1917', border: 'none', borderRadius: 8, cursor: 'pointer' },
  btnSm: { padding: '6px 14px', fontSize: 12, fontWeight: 600, border: '1px solid #d6d3d1', borderRadius: 6, cursor: 'pointer', background: '#fff', color: '#44403c' },
  btnDanger: { padding: '6px 14px', fontSize: 12, fontWeight: 600, border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', background: '#fff', color: '#dc2626' },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#44403c', marginBottom: 6 },
  badge: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, display: 'inline-block' },
  tabs: { display: 'flex', gap: 4, marginBottom: 24, background: '#f5f5f4', borderRadius: 8, padding: 3, width: 'fit-content', flexWrap: 'wrap' as const },
  tab: { padding: '8px 20px', fontSize: 13, fontWeight: 600, border: 'none', borderRadius: 6, cursor: 'pointer', transition: 'all 0.2s' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
};

export default function SuperAdminDashboard() {
  const [tab, setTab] = useState<'restaurants' | 'users' | 'subscriptions' | 'features'>('restaurants');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [allFeatures, setAllFeatures] = useState<Feature[]>([]);
  const [planFeatures, setPlanFeatures] = useState<PlanFeature[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showSubForm, setShowSubForm] = useState(false);
  const [showFeatureForm, setShowFeatureForm] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', address: '', phone: '' });
  const [userForm, setUserForm] = useState({ email: '', password: '', full_name: '', restaurant_id: '' });
  const [subForm, setSubForm] = useState({ restaurant_id: '', plan_id: '', start_date: '', notes: '' });
  const [featureForm, setFeatureForm] = useState({ category: 'MENÜ', name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [editingPF, setEditingPF] = useState<string | null>(null);
  const [editPFValue, setEditPFValue] = useState('');

  useEffect(() => { loadAll(); }, []);

  async function loadAll() { loadRestaurants(); loadUsers(); loadPlans(); loadSubscriptions(); loadFeatures(); loadPlanFeatures(); }
  async function loadRestaurants() {
    const { data } = await supabase.from('restaurants').select('*').order('created_at', { ascending: false });
    setRestaurants(data || []);
  }
  async function loadUsers() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setUsers(data || []);
  }
  async function loadPlans() {
    const { data } = await supabase.from('subscription_plans').select('*').order('sort_order');
    setPlans(data || []);
  }
  async function loadSubscriptions() {
    const { data } = await supabase.from('subscriptions').select('*').order('created_at', { ascending: false });
    setSubscriptions(data || []);
  }
  async function loadFeatures() {
    const { data } = await supabase.from('features').select('*').order('sort_order');
    setAllFeatures(data || []);
  }
  async function loadPlanFeatures() {
    const { data } = await supabase.from('plan_features').select('*');
    setPlanFeatures(data || []);
  }

  // --- Restaurant ---
  async function addRestaurant(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setMsg('');
    const slug = form.slug || form.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const { error } = await supabase.from('restaurants').insert({ name: form.name, slug, address: form.address || null, phone: form.phone || null });
    if (error) setMsg(error.message);
    else { setForm({ name: '', slug: '', address: '', phone: '' }); setShowForm(false); loadRestaurants(); }
    setSaving(false);
  }
  async function toggleActive(id: string, current: boolean) {
    await supabase.from('restaurants').update({ is_active: !current }).eq('id', id);
    loadRestaurants();
  }

  // --- User ---
  async function addUser(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setMsg('');
    const { data, error } = await supabase.auth.signUp({ email: userForm.email, password: userForm.password });
    if (error) { setMsg(error.message); setSaving(false); return; }
    if (data.user) {
      await supabase.from('profiles').update({ full_name: userForm.full_name || null, restaurant_id: userForm.restaurant_id || null }).eq('id', data.user.id);
    }
    setUserForm({ email: '', password: '', full_name: '', restaurant_id: '' }); setShowUserForm(false); loadUsers();
    setSaving(false);
  }

  // --- Subscription ---
  async function addSubscription(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setMsg('');
    const startDate = subForm.start_date || new Date().toISOString().split('T')[0];
    const endDate = new Date(new Date(startDate).getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const plan = plans.find(p => p.id === subForm.plan_id);
    const { error } = await supabase.from('subscriptions').insert({
      restaurant_id: subForm.restaurant_id, plan_id: subForm.plan_id,
      start_date: startDate, end_date: endDate, status: 'active', notes: subForm.notes || null
    });
    if (error) { setMsg(error.message); setSaving(false); return; }
    if (plan) {
      await supabase.from('restaurants').update({ subscription_status: 'active', current_plan: plan.name }).eq('id', subForm.restaurant_id);
    }
    setSubForm({ restaurant_id: '', plan_id: '', start_date: '', notes: '' }); setShowSubForm(false); loadAll();
    setSaving(false);
  }
  async function cancelSubscription(id: string, rid: string) {
    if (!confirm('Bu uyeligi iptal etmek istediginize emin misiniz?')) return;
    await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('id', id);
    await supabase.from('restaurants').update({ subscription_status: 'cancelled', current_plan: 'cancelled' }).eq('id', rid);
    loadAll();
  }

  // --- Feature ---
  async function addFeature(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setMsg('');
    const maxOrder = allFeatures.filter(f => f.category === featureForm.category).reduce((max, f) => Math.max(max, f.sort_order), 0);
    const { data: inserted, error } = await supabase.from('features').insert({
      category: featureForm.category, name: featureForm.name,
      description: featureForm.description || null, sort_order: maxOrder + 1
    }).select().single();
    if (error) { setMsg(error.message); setSaving(false); return; }
    // Yeni özellik için tüm planlara default 'false' ekle
    if (inserted) {
      const inserts = plans.map(p => ({ plan_id: p.id, feature_id: inserted.id, value: 'false' }));
      await supabase.from('plan_features').insert(inserts);
    }
    setFeatureForm({ ...featureForm, name: '', description: '' }); setShowFeatureForm(false);
    loadFeatures(); loadPlanFeatures();
    setSaving(false);
  }
  async function deleteFeature(id: string) {
    if (!confirm('Bu ozelligi silmek istediginize emin misiniz? Tum plan atamalar da silinecek.')) return;
    await supabase.from('plan_features').delete().eq('feature_id', id);
    await supabase.from('features').delete().eq('id', id);
    loadFeatures(); loadPlanFeatures();
  }
  async function savePlanFeatureValue(planId: string, featureId: string, value: string) {
    const existing = planFeatures.find(pf => pf.plan_id === planId && pf.feature_id === featureId);
    if (existing) {
      await supabase.from('plan_features').update({ value }).eq('id', existing.id);
    } else {
      await supabase.from('plan_features').insert({ plan_id: planId, feature_id: featureId, value });
    }
    loadPlanFeatures();
    setEditingPF(null);
    setEditPFValue('');
  }

  // --- Helpers ---
  const statusColor = (s: string) => {
    if (s === 'active') return { background: '#dcfce7', color: '#16a34a' };
    if (s === 'trial') return { background: '#fef9c3', color: '#ca8a04' };
    if (s === 'expiring') return { background: '#ffedd5', color: '#ea580c' };
    return { background: '#fee2e2', color: '#dc2626' };
  };
  function daysLeft(endDate: string) {
    return Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }
  const restName = (id: string) => restaurants.find(r => r.id === id)?.name || id;
  const planName = (id: string) => plans.find(p => p.id === id)?.name || id;
  function getPFValue(planId: string, featureId: string): string {
    return planFeatures.find(pf => pf.plan_id === planId && pf.feature_id === featureId)?.value || 'false';
  }
  function pfKey(planId: string, featureId: string) { return `${planId}:${featureId}`; }

  const tabLabels: Record<string, string> = {
    restaurants: `Restoranlar (${restaurants.length})`,
    users: `Kullanicilar (${users.length})`,
    subscriptions: `Uyelikler (${subscriptions.length})`,
    features: `Ozellikler (${allFeatures.length})`,
  };

  function planActiveCount(planId: string): number {
    return planFeatures.filter(pf => pf.plan_id === planId && pf.value !== 'false').length;
  }

  return (
    <div style={S.wrap}>
      <div style={S.tabs}>
        {(['restaurants', 'users', 'subscriptions', 'features'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ ...S.tab, background: tab === t ? '#fff' : 'transparent', color: tab === t ? '#1c1917' : '#78716c', boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>
            {tabLabels[t]}
          </button>
        ))}
      </div>
      {msg && <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 13, marginBottom: 16 }}>{msg}</div>}

      {/* ============ RESTORANLAR ============ */}
      {tab === 'restaurants' && (<>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1c1917' }}>Restoranlar</h2>
          <button onClick={() => setShowForm(!showForm)} style={S.btn}>{showForm ? 'Iptal' : '+ Restoran Ekle'}</button>
        </div>
        {showForm && (
          <form onSubmit={addRestaurant} style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div><label style={S.label}>Restoran Adi *</label><input style={S.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Orn: Cafe Istanbul" /></div>
            <div><label style={S.label}>Slug (URL)</label><input style={S.input} value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="otomatik olusturulur" /></div>
            <div style={S.grid2}>
              <div><label style={S.label}>Adres</label><input style={S.input} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
              <div><label style={S.label}>Telefon</label><input style={S.input} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <button type="submit" disabled={saving} style={S.btn}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
          </form>
        )}
        {restaurants.map(r => (
          <div key={r.id} style={{ ...S.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#1c1917' }}>{r.name}</div>
              <div style={{ fontSize: 13, color: '#a8a29e', marginTop: 2 }}>/{r.slug} &middot; {r.current_plan}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ ...S.badge, ...statusColor(r.subscription_status) }}>{r.subscription_status}</span>
              <button onClick={() => toggleActive(r.id, r.is_active)} style={{ ...S.btnSm, color: r.is_active ? '#16a34a' : '#dc2626' }}>{r.is_active ? 'Aktif' : 'Pasif'}</button>
            </div>
          </div>
        ))}
        {restaurants.length === 0 && <div style={{ textAlign: 'center', color: '#a8a29e', padding: 40, fontSize: 14 }}>Henuz restoran eklenmedi.</div>}
      </>)}

      {/* ============ KULLANICILAR ============ */}
      {tab === 'users' && (<>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1c1917' }}>Kullanicilar</h2>
          <button onClick={() => setShowUserForm(!showUserForm)} style={S.btn}>{showUserForm ? 'Iptal' : '+ Kullanici Ekle'}</button>
        </div>
        {showUserForm && (
          <form onSubmit={addUser} style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div><label style={S.label}>E-posta *</label><input type="email" style={S.input} value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} required /></div>
            <div><label style={S.label}>Sifre *</label><input type="password" style={S.input} value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} required minLength={6} /></div>
            <div style={S.grid2}>
              <div><label style={S.label}>Ad Soyad</label><input style={S.input} value={userForm.full_name} onChange={e => setUserForm({ ...userForm, full_name: e.target.value })} /></div>
              <div><label style={S.label}>Restoran</label>
                <select style={S.input} value={userForm.restaurant_id} onChange={e => setUserForm({ ...userForm, restaurant_id: e.target.value })}>
                  <option value="">-- Seciniz --</option>
                  {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" disabled={saving} style={S.btn}>{saving ? 'Kaydediliyor...' : 'Kullanici Olustur'}</button>
          </form>
        )}
        {users.map(u => (
          <div key={u.id} style={{ ...S.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#1c1917' }}>{u.full_name || u.email}</div>
              <div style={{ fontSize: 13, color: '#a8a29e' }}>{u.email}{u.restaurant_id ? ' · ' + restName(u.restaurant_id) : ''}</div>
            </div>
            <span style={{ ...S.badge, background: u.role === 'super_admin' ? '#fee2e2' : '#e0e7ff', color: u.role === 'super_admin' ? '#dc2626' : '#4f46e5' }}>{u.role}</span>
          </div>
        ))}
      </>)}

      {/* ============ ÜYELİKLER ============ */}
      {tab === 'subscriptions' && (<>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1c1917' }}>Uyelikler</h2>
          <button onClick={() => setShowSubForm(!showSubForm)} style={S.btn}>{showSubForm ? 'Iptal' : '+ Uyelik Ekle'}</button>
        </div>

        {/* Plan kartları — features + plan_features tablolarından */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {plans.map(p => {
            const activeCount = planActiveCount(p.id);
            const pFeats = allFeatures.filter(f => getPFValue(p.id, f.id) !== 'false').slice(0, 8);
            return (
              <div key={p.id} style={{ ...S.card, textAlign: 'center', marginBottom: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1c1917' }}>{p.name}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#1c1917', margin: '8px 0' }}>
                  {p.price_monthly ? Number(p.price_monthly).toLocaleString('tr-TR') : '—'} TL
                  <span style={{ fontSize: 13, fontWeight: 400, color: '#a8a29e' }}>/ay</span>
                </div>
                <div style={{ fontSize: 12, color: '#78716c', marginBottom: 8 }}>
                  {Number(p.price_yearly).toLocaleString('tr-TR')} TL/yil
                </div>
                <div style={{ fontSize: 12, color: '#78716c', lineHeight: 1.8, textAlign: 'left', padding: '0 8px' }}>
                  {pFeats.map(f => {
                    const val = getPFValue(p.id, f.id);
                    return <div key={f.id}>• {f.name}{val !== 'true' ? ` (${val})` : ''}</div>;
                  })}
                  {activeCount > 8 && <div style={{ color: '#a8a29e', fontStyle: 'italic' }}>+{activeCount - 8} ozellik daha</div>}
                </div>
                <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: '#1c1917' }}>{activeCount} ozellik</div>
              </div>
            );
          })}
        </div>

        {showSubForm && (
          <form onSubmit={addSubscription} style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={S.grid2}>
              <div><label style={S.label}>Restoran *</label>
                <select style={S.input} value={subForm.restaurant_id} onChange={e => setSubForm({ ...subForm, restaurant_id: e.target.value })} required>
                  <option value="">-- Seciniz --</option>
                  {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div><label style={S.label}>Paket *</label>
                <select style={S.input} value={subForm.plan_id} onChange={e => setSubForm({ ...subForm, plan_id: e.target.value })} required>
                  <option value="">-- Seciniz --</option>
                  {plans.map(p => <option key={p.id} value={p.id}>{p.name} - {Number(p.price_yearly).toLocaleString('tr-TR')} TL/yil</option>)}
                </select>
              </div>
            </div>
            <div style={S.grid2}>
              <div><label style={S.label}>Baslangic Tarihi</label><input type="date" style={S.input} value={subForm.start_date} onChange={e => setSubForm({ ...subForm, start_date: e.target.value })} /></div>
              <div><label style={S.label}>Not</label><input style={S.input} value={subForm.notes} onChange={e => setSubForm({ ...subForm, notes: e.target.value })} placeholder="Odeme notu, fatura bilgisi vs." /></div>
            </div>
            <button type="submit" disabled={saving} style={S.btn}>{saving ? 'Kaydediliyor...' : 'Uyelik Baslat'}</button>
          </form>
        )}

        {subscriptions.map(s => {
          const days = daysLeft(s.end_date);
          const expiring = days <= 30 && days > 0;
          const expired = days <= 0;
          return (
            <div key={s.id} style={{ ...S.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#1c1917' }}>{restName(s.restaurant_id)}</div>
                <div style={{ fontSize: 13, color: '#78716c', marginTop: 2 }}>
                  {planName(s.plan_id)} &middot; {s.start_date} - {s.end_date}
                </div>
                {expiring && <div style={{ fontSize: 12, color: '#ea580c', fontWeight: 600, marginTop: 4 }}>Son {days} gun!</div>}
                {expired && <div style={{ fontSize: 12, color: '#dc2626', fontWeight: 600, marginTop: 4 }}>Suresi doldu ({Math.abs(days)} gun once)</div>}
                {s.notes && <div style={{ fontSize: 12, color: '#a8a29e', marginTop: 2 }}>{s.notes}</div>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ ...S.badge, ...statusColor(expired ? 'expired' : expiring ? 'expiring' : s.status) }}>{expired ? 'expired' : expiring ? 'expiring' : s.status}</span>
                {s.status === 'active' && <button onClick={() => cancelSubscription(s.id, s.restaurant_id)} style={S.btnDanger}>Iptal</button>}
              </div>
            </div>
          );
        })}
        {subscriptions.length === 0 && <div style={{ textAlign: 'center', color: '#a8a29e', padding: 40, fontSize: 14 }}>Henuz uyelik bulunmuyor.</div>}
      </>)}

      {/* ============ ÖZELLİKLER ============ */}
      {tab === 'features' && (<>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1c1917' }}>Ozellik Yonetimi</h2>
          <button onClick={() => setShowFeatureForm(!showFeatureForm)} style={S.btn}>{showFeatureForm ? 'Iptal' : '+ Ozellik Ekle'}</button>
        </div>

        {showFeatureForm && (
          <form onSubmit={addFeature} style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={S.grid2}>
              <div><label style={S.label}>Kategori *</label>
                <select style={S.input} value={featureForm.category} onChange={e => setFeatureForm({ ...featureForm, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div><label style={S.label}>Ozellik Adi *</label><input style={S.input} value={featureForm.name} onChange={e => setFeatureForm({ ...featureForm, name: e.target.value })} required placeholder="Orn: QR Menu" /></div>
            </div>
            <div><label style={S.label}>Aciklama</label><input style={S.input} value={featureForm.description} onChange={e => setFeatureForm({ ...featureForm, description: e.target.value })} placeholder="Opsiyonel" /></div>
            <button type="submit" disabled={saving} style={S.btn}>{saving ? 'Kaydediliyor...' : 'Ozellik Ekle'}</button>
          </form>
        )}

        {/* Matris tablosu */}
        <div style={{ ...S.card, overflowX: 'auto', padding: 16 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e7e5e4' }}>
                <th style={{ textAlign: 'left', padding: '10px 8px', fontWeight: 700, color: '#1c1917', minWidth: 220 }}>Ozellik</th>
                {plans.map(p => (
                  <th key={p.id} style={{ textAlign: 'center', padding: '10px 8px', fontWeight: 700, color: '#1c1917', minWidth: 100 }}>
                    {p.name}
                    <div style={{ fontSize: 10, fontWeight: 400, color: '#a8a29e' }}>{planActiveCount(p.id)} aktif</div>
                  </th>
                ))}
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map(cat => {
                const catFeatures = allFeatures.filter(f => f.category === cat);
                if (catFeatures.length === 0) return null;
                return [
                  <tr key={`cat-${cat}`}>
                    <td colSpan={plans.length + 2} style={{ padding: '14px 8px 6px', fontWeight: 800, fontSize: 11, color: '#78716c', textTransform: 'uppercase' as const, letterSpacing: 1, borderTop: '1px solid #e7e5e4' }}>
                      {cat} ({catFeatures.length})
                    </td>
                  </tr>,
                  ...catFeatures.map(feat => (
                    <tr key={feat.id} style={{ borderBottom: '1px solid #f5f5f4' }}>
                      <td style={{ padding: '8px', color: '#44403c' }}>
                        {feat.name}
                        {feat.description && <div style={{ fontSize: 11, color: '#a8a29e' }}>{feat.description}</div>}
                      </td>
                      {plans.map(p => {
                        const val = getPFValue(p.id, feat.id);
                        const key = pfKey(p.id, feat.id);
                        const isEditing = editingPF === key;
                        return (
                          <td key={p.id} style={{ textAlign: 'center', padding: '6px 4px' }}>
                            {isEditing ? (
                              <div style={{ display: 'flex', gap: 3, justifyContent: 'center', alignItems: 'center' }}>
                                <input
                                  style={{ ...S.input, width: 80, padding: '4px 8px', fontSize: 12 }}
                                  value={editPFValue}
                                  onChange={e => setEditPFValue(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') savePlanFeatureValue(p.id, feat.id, editPFValue);
                                    if (e.key === 'Escape') { setEditingPF(null); setEditPFValue(''); }
                                  }}
                                  autoFocus
                                />
                                <button onClick={() => savePlanFeatureValue(p.id, feat.id, editPFValue)} style={{ ...S.btnSm, padding: '3px 6px', fontSize: 11 }}><CiCircleCheck size={14} /></button>
                              </div>
                            ) : (
                              <span
                                onClick={() => { setEditingPF(key); setEditPFValue(val); }}
                                style={{
                                  cursor: 'pointer', padding: '3px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600,
                                  background: val === 'false' ? '#f5f5f4' : '#dcfce7',
                                  color: val === 'false' ? '#a8a29e' : '#16a34a',
                                  display: 'inline-block', minWidth: 36,
                                }}
                                title="Tikla: deger degistir"
                              >
                                {val === 'true' ? <CiCircleCheck size={14} style={{ display: 'inline' }} /> : val === 'false' ? '—' : val}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td style={{ textAlign: 'center' }}>
                        <button onClick={() => deleteFeature(feat.id)} style={{ background: 'none', border: 'none', color: '#d6d3d1', cursor: 'pointer', fontSize: 14, padding: 4 }} title="Sil"><CiCircleRemove size={14} /></button>
                      </td>
                    </tr>
                  ))
                ];
              })}
            </tbody>
          </table>
        </div>

        <div style={{ fontSize: 12, color: '#a8a29e', marginTop: 8, padding: '0 4px' }}>
          Degerlere tikla ve duzenle: true, false veya ozel deger (2 dil, 3 tablet, 5 vs.) girebilirsin. Enter ile kaydet, Escape ile iptal.
        </div>
      </>)}
    </div>
  );
}
