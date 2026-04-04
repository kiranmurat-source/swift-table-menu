import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type Restaurant = { id: string; name: string; slug: string; is_active: boolean; subscription_status: string; created_at: string; };
type Profile = { id: string; email: string; full_name: string | null; role: string; restaurant_id: string | null; };

const S: Record<string, React.CSSProperties> = {
  wrap: { maxWidth: 1000, margin: '0 auto', padding: '32px 24px' },
  card: { background: '#fff', border: '1px solid #e7e5e4', borderRadius: 12, padding: 24, marginBottom: 16 },
  input: { width: '100%', padding: '10px 14px', fontSize: 14, border: '1px solid #d6d3d1', borderRadius: 8, outline: 'none', background: '#fff', boxSizing: 'border-box' as const },
  btn: { padding: '10px 20px', fontSize: 13, fontWeight: 700, color: '#fff', background: '#1c1917', border: 'none', borderRadius: 8, cursor: 'pointer' },
  btnSm: { padding: '6px 14px', fontSize: 12, fontWeight: 600, border: '1px solid #d6d3d1', borderRadius: 6, cursor: 'pointer', background: '#fff', color: '#44403c' },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#44403c', marginBottom: 6 },
  badge: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4 },
  tabs: { display: 'flex', gap: 4, marginBottom: 24, background: '#f5f5f4', borderRadius: 8, padding: 3, width: 'fit-content' },
  tab: { padding: '8px 20px', fontSize: 13, fontWeight: 600, border: 'none', borderRadius: 6, cursor: 'pointer', transition: 'all 0.2s' },
};

export default function SuperAdminDashboard() {
  const [tab, setTab] = useState<'restaurants' | 'users'>('restaurants');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', address: '', phone: '' });
  const [userForm, setUserForm] = useState({ email: '', password: '', full_name: '', restaurant_id: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { loadRestaurants(); loadUsers(); }, []);

  async function loadRestaurants() {
    const { data } = await supabase.from('restaurants').select('*').order('created_at', { ascending: false });
    setRestaurants(data || []);
  }
  async function loadUsers() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setUsers(data || []);
  }
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
  async function addUser(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setMsg('');
    const res = await fetch('https://qmnrawqvkwehufebbkxp.supabase.co/auth/v1/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbnJhd3F2a3dlaHVmZWJia3hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMTk5OTQsImV4cCI6MjA5MDc5NTk5NH0.cQeGl66uJAy3Q4FpAgh6hgNImEx4RsVK-CfBuukJuEc' },
      body: JSON.stringify({ email: userForm.email, password: userForm.password, email_confirm: true })
    });
    if (!res.ok) { setMsg('Kullanici olusturulamadi. Supabase service_role key gerekli olabilir.'); setSaving(false); return; }
    const data = await res.json();
    if (data.id) {
      await supabase.from('profiles').update({ full_name: userForm.full_name || null, restaurant_id: userForm.restaurant_id || null }).eq('id', data.id);
    }
    setUserForm({ email: '', password: '', full_name: '', restaurant_id: '' }); setShowUserForm(false); loadUsers();
    setSaving(false);
  }
  const statusColor = (s: string) => {
    if (s === 'active') return { background: '#dcfce7', color: '#16a34a' };
    if (s === 'trial') return { background: '#fef9c3', color: '#ca8a04' };
    return { background: '#fee2e2', color: '#dc2626' };
  };
  return (
    <div style={S.wrap}>
      <div style={S.tabs}>
        {(['restaurants', 'users'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ ...S.tab, background: tab === t ? '#fff' : 'transparent', color: tab === t ? '#1c1917' : '#78716c', boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>
            {t === 'restaurants' ? 'Restoranlar (' + restaurants.length + ')' : 'Kullanicilar (' + users.length + ')'}
          </button>
        ))}
      </div>
      {msg && <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 13, marginBottom: 16 }}>{msg}</div>}
      {tab === 'restaurants' && (<>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1c1917' }}>Restoranlar</h2>
          <button onClick={() => setShowForm(!showForm)} style={S.btn}>{showForm ? 'Iptal' : '+ Restoran Ekle'}</button>
        </div>
        {showForm && (
          <form onSubmit={addRestaurant} style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div><label style={S.label}>Restoran Adi *</label><input style={S.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Orn: Cafe Istanbul" /></div>
            <div><label style={S.label}>Slug (URL)</label><input style={S.input} value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="otomatik olusturulur" /></div>
            <div><label style={S.label}>Adres</label><input style={S.input} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
            <div><label style={S.label}>Telefon</label><input style={S.input} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <button type="submit" disabled={saving} style={S.btn}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
          </form>
        )}
        {restaurants.map(r => (
          <div key={r.id} style={{ ...S.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#1c1917' }}>{r.name}</div>
              <div style={{ fontSize: 13, color: '#a8a29e', marginTop: 2 }}>/{r.slug}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ ...S.badge, ...statusColor(r.subscription_status) }}>{r.subscription_status}</span>
              <button onClick={() => toggleActive(r.id, r.is_active)} style={{ ...S.btnSm, color: r.is_active ? '#16a34a' : '#dc2626' }}>{r.is_active ? 'Aktif' : 'Pasif'}</button>
            </div>
          </div>
        ))}
        {restaurants.length === 0 && <div style={{ textAlign: 'center', color: '#a8a29e', padding: 40, fontSize: 14 }}>Henuz restoran eklenmedi.</div>}
      </>)}
      {tab === 'users' && (<>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1c1917' }}>Kullanicilar</h2>
          <button onClick={() => setShowUserForm(!showUserForm)} style={S.btn}>{showUserForm ? 'Iptal' : '+ Kullanici Ekle'}</button>
        </div>
        {showUserForm && (
          <form onSubmit={addUser} style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div><label style={S.label}>E-posta *</label><input type="email" style={S.input} value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} required /></div>
            <div><label style={S.label}>Sifre *</label><input type="password" style={S.input} value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} required minLength={6} /></div>
            <div><label style={S.label}>Ad Soyad</label><input style={S.input} value={userForm.full_name} onChange={e => setUserForm({ ...userForm, full_name: e.target.value })} /></div>
            <div><label style={S.label}>Restoran</label>
              <select style={S.input} value={userForm.restaurant_id} onChange={e => setUserForm({ ...userForm, restaurant_id: e.target.value })}>
                <option value="">-- Seciniz --</option>
                {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <button type="submit" disabled={saving} style={S.btn}>{saving ? 'Kaydediliyor...' : 'Kullanici Olustur'}</button>
          </form>
        )}
        {users.map(u => (
          <div key={u.id} style={{ ...S.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#1c1917' }}>{u.full_name || u.email}</div>
              <div style={{ fontSize: 13, color: '#a8a29e' }}>{u.email}</div>
            </div>
            <span style={{ ...S.badge, background: u.role === 'super_admin' ? '#fee2e2' : '#e0e7ff', color: u.role === 'super_admin' ? '#dc2626' : '#4f46e5' }}>{u.role}</span>
          </div>
        ))}
      </>)}
    </div>
  );
}
