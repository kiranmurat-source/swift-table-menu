import { useEffect, useState } from 'react';
import { StatCardSkeleton } from '../components/Skeleton';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle, PencilSimple, Storefront, Money, Warning, ListBullets, Camera, Calendar, Kanban, CurrencyDollar, Timer, ListChecks, Pulse, Rows } from "@phosphor-icons/react";

type Restaurant = { id: string; name: string; slug: string; is_active: boolean; subscription_status: string; current_plan: string; created_at: string; address: string | null; phone: string | null; };
type Profile = { id: string; email: string; full_name: string | null; role: string; restaurant_id: string | null; };
type Plan = { id: string; name: string; price_monthly: number | null; price_yearly: number; features: string[]; sort_order: number; };
type Subscription = { id: string; restaurant_id: string; plan_id: string; start_date: string; end_date: string; status: string; payment_method: string; notes: string | null; };
type Feature = { id: string; category: string; name: string; description: string | null; sort_order: number; };
type PlanFeature = { id: string; plan_id: string; feature_id: string; value: string; };
type KPIData = {
  totalItems: number; activeItems: number; passiveItems: number;
  photoPercentage: number;
  activeRestaurants: number; passiveRestaurants: number;
  weeklyNewItems: number;
  planDistribution: { name: string; count: number }[];
  monthlyRevenue: number;
  expiringSoon: number; expiringNames: string[];
  avgMenuSize: number;
  recentlyActiveRestaurants: number;
  emptyMenuRestaurants: number; emptyMenuNames: string[];
  qrCreatedRestaurants: number;
  totalRestaurants: number;
};

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
  const [form, setForm] = useState({ name: '', slug: '', address: '', phone: '', full_name: '', email: '', password: '' });
  const [userForm, setUserForm] = useState({ email: '', password: '', full_name: '', restaurant_id: '' });
  const [subForm, setSubForm] = useState({ restaurant_id: '', plan_id: '', start_date: '', notes: '' });
  const [featureForm, setFeatureForm] = useState({ category: 'MENÜ', name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [editingPF, setEditingPF] = useState<string | null>(null);
  const [editPFValue, setEditPFValue] = useState('');
  const [editingRest, setEditingRest] = useState<string | null>(null);
  const [editRestForm, setEditRestForm] = useState({ name: '', slug: '', address: '', phone: '' });
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editUserForm, setEditUserForm] = useState({ full_name: '', restaurant_id: '' });
  const [changingPlan, setChangingPlan] = useState<string | null>(null);
  const [newPlanId, setNewPlanId] = useState('');
  const [kpiData, setKpiData] = useState<KPIData | null>(null);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() { loadRestaurants(); loadUsers(); loadPlans(); loadSubscriptions(); loadFeatures(); loadPlanFeatures(); loadKPIData(); }

  async function loadKPIData() {
    const [itemsRes, restsRes, subsRes, plansRes, qrsRes] = await Promise.all([
      supabase.from('menu_items').select('id, is_available, image_url, restaurant_id, created_at, updated_at'),
      supabase.from('restaurants').select('id, name, is_active'),
      supabase.from('subscriptions').select('id, restaurant_id, plan_id, end_date, status'),
      supabase.from('subscription_plans').select('id, name, price_yearly'),
      supabase.from('qr_codes').select('restaurant_id'),
    ]);
    const itemsList = itemsRes.data || [];
    const restsList = restsRes.data || [];
    const subsList = subsRes.data || [];
    const plansList = plansRes.data || [];
    const qrsList = qrsRes.data || [];

    const totalItems = itemsList.length;
    const activeItems = itemsList.filter((i: any) => i.is_available).length;
    const passiveItems = totalItems - activeItems;
    const withPhoto = itemsList.filter((i: any) => i.image_url && i.image_url !== '').length;
    const photoPercentage = totalItems > 0 ? Math.round((withPhoto / totalItems) * 100) : 0;
    const activeRestaurants = restsList.filter((r: any) => r.is_active).length;
    const passiveRestaurants = restsList.length - activeRestaurants;
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weeklyNewItems = itemsList.filter((i: any) => i.created_at && new Date(i.created_at).getTime() >= weekAgo).length;

    const activeSubsLocal = subsList.filter((s: any) => s.status === 'active');
    const planDistribution = plansList
      .map((p: any) => ({ name: p.name, count: activeSubsLocal.filter((s: any) => s.plan_id === p.id).length }))
      .filter((p: any) => p.count > 0);
    const monthlyRev = activeSubsLocal.reduce((sum: number, s: any) => {
      const plan = plansList.find((p: any) => p.id === s.plan_id);
      return sum + (plan?.price_yearly ? Number(plan.price_yearly) / 12 : 0);
    }, 0);
    const now = Date.now();
    const in30Days = now + 30 * 24 * 60 * 60 * 1000;
    const expiringList = activeSubsLocal.filter((s: any) => {
      const end = new Date(s.end_date).getTime();
      return end > now && end <= in30Days;
    });
    const expiringNames = expiringList
      .map((s: any) => restsList.find((r: any) => r.id === s.restaurant_id)?.name)
      .filter(Boolean) as string[];

    const itemCountByRest: Record<string, number> = {};
    itemsList.forEach((i: any) => {
      if (i.restaurant_id) itemCountByRest[i.restaurant_id] = (itemCountByRest[i.restaurant_id] || 0) + 1;
    });
    const counts = Object.values(itemCountByRest);
    const avgMenuSize = counts.length > 0 ? counts.reduce((a, b) => a + b, 0) / counts.length : 0;

    const recentRestIds = new Set(
      itemsList
        .filter((i: any) => i.updated_at && new Date(i.updated_at).getTime() >= weekAgo)
        .map((i: any) => i.restaurant_id)
    );
    const recentlyActiveRestaurants = recentRestIds.size;

    const restsWithItems = new Set(itemsList.map((i: any) => i.restaurant_id));
    const emptyMenuList = restsList.filter((r: any) => !restsWithItems.has(r.id));
    const qrCreatedRestaurants = new Set(qrsList.map((q: any) => q.restaurant_id)).size;

    setKpiData({
      totalItems, activeItems, passiveItems, photoPercentage,
      activeRestaurants, passiveRestaurants, weeklyNewItems,
      planDistribution, monthlyRevenue: monthlyRev,
      expiringSoon: expiringList.length, expiringNames,
      avgMenuSize,
      recentlyActiveRestaurants,
      emptyMenuRestaurants: emptyMenuList.length,
      emptyMenuNames: emptyMenuList.map((r: any) => r.name),
      qrCreatedRestaurants,
      totalRestaurants: restsList.length,
    });
  }
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

  // --- Slug helper (Turkish-aware) ---
  function generateSlug(name: string): string {
    const map: Record<string, string> = { 'ş':'s','Ş':'s','ç':'c','Ç':'c','ğ':'g','Ğ':'g','ı':'i','İ':'i','ö':'o','Ö':'o','ü':'u','Ü':'u' };
    return name.split('').map(c => map[c] || c).join('')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // --- Restaurant + User (combined) ---
  async function addRestaurant(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setMsg('');
    const slug = form.slug || generateSlug(form.name);

    // 1. Restoran olustur
    const { data: restaurant, error: restError } = await supabase
      .from('restaurants')
      .insert({ name: form.name, slug, address: form.address || null, phone: form.phone || null })
      .select()
      .single();
    if (restError || !restaurant) { setMsg(`Restoran olusturulamadi: ${restError?.message || 'bilinmeyen hata'}`); setSaving(false); return; }

    // 2. Kullanici olustur (Edge Function — super admin oturumu bozulmaz)
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(
      'https://qmnrawqvkwehufebbkxp.supabase.co/functions/v1/create-user',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          full_name: form.full_name,
          restaurant_id: restaurant.id,
        }),
      }
    );
    const result = await response.json();
    if (!response.ok) {
      // Rollback restoran
      await supabase.from('restaurants').delete().eq('id', restaurant.id);
      setMsg(result.error || 'Kullanici olusturulamadi');
      setSaving(false);
      return;
    }

    setForm({ name: '', slug: '', address: '', phone: '', full_name: '', email: '', password: '' });
    setShowForm(false);
    await loadRestaurants();
    await loadUsers();
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
  // --- Restaurant Edit/Delete ---
  async function updateRestaurant(id: string) {
    await supabase.from('restaurants').update({
      name: editRestForm.name,
      slug: editRestForm.slug,
      address: editRestForm.address || null,
      phone: editRestForm.phone || null,
    }).eq('id', id);
    setEditingRest(null);
    loadRestaurants();
  }
  async function deleteRestaurant(id: string) {
    if (!confirm('Bu restoran ve tum verileri (kategoriler, urunler, uyelikler) silinecek. Emin misiniz?')) return;
    await supabase.from('menu_items').delete().eq('restaurant_id', id);
    await supabase.from('menu_categories').delete().eq('restaurant_id', id);
    await supabase.from('subscriptions').delete().eq('restaurant_id', id);
    await supabase.from('qr_codes').delete().eq('restaurant_id', id);
    await supabase.from('profiles').update({ restaurant_id: null }).eq('restaurant_id', id);
    await supabase.from('restaurants').delete().eq('id', id);
    loadAll();
  }

  // --- User Edit/Delete ---
  async function updateUser(id: string) {
    await supabase.from('profiles').update({
      full_name: editUserForm.full_name || null,
      restaurant_id: editUserForm.restaurant_id || null,
    }).eq('id', id);
    setEditingUser(null);
    loadUsers();
  }
  async function deleteUser(id: string) {
    const user = users.find(u => u.id === id);
    if (user?.role === 'super_admin') { setMsg('Super admin silinemez.'); return; }
    if (!confirm('Bu kullaniciyi silmek istediginize emin misiniz?')) return;
    await supabase.from('profiles').delete().eq('id', id);
    loadUsers();
  }

  // --- Subscription Extend/Change Plan ---
  async function extendSubscription(id: string, currentEndDate: string) {
    if (!confirm('Uyelik 1 yil uzatilacak. Emin misiniz?')) return;
    const newEnd = new Date(new Date(currentEndDate).getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    await supabase.from('subscriptions').update({ end_date: newEnd, status: 'active' }).eq('id', id);
    loadAll();
  }
  async function changePlan(subId: string, restaurantId: string) {
    if (!newPlanId) return;
    const plan = plans.find(p => p.id === newPlanId);
    if (!plan) return;
    await supabase.from('subscriptions').update({ plan_id: newPlanId }).eq('id', subId);
    await supabase.from('restaurants').update({ current_plan: plan.name }).eq('id', restaurantId);
    setChangingPlan(null);
    setNewPlanId('');
    loadAll();
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

  const activeSubs = subscriptions.filter(s => s.status === 'active');
  const monthlyRevenue = activeSubs.reduce((sum, s) => {
    const plan = plans.find(p => p.id === s.plan_id);
    return sum + (plan?.price_monthly ? Number(plan.price_monthly) : 0);
  }, 0);
  const expiringSubs = activeSubs.filter(s => daysLeft(s.end_date) <= 30 && daysLeft(s.end_date) > 0);

  return (
    <div style={S.wrap}>
      {/* Dashboard Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <div style={{ ...S.card, marginBottom: 0, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Storefront size={20} style={{ color: '#4f46e5' }} /></div>
          <div><div style={{ fontSize: 24, fontWeight: 800, color: '#1c1917' }}>{restaurants.length}</div><div style={{ fontSize: 12, color: '#a8a29e' }}>Toplam Restoran</div></div>
        </div>
        <div style={{ ...S.card, marginBottom: 0, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle size={20} style={{ color: '#16a34a' }} /></div>
          <div><div style={{ fontSize: 24, fontWeight: 800, color: '#1c1917' }}>{activeSubs.length}</div><div style={{ fontSize: 12, color: '#a8a29e' }}>Aktif Uyelik</div></div>
        </div>
        <div style={{ ...S.card, marginBottom: 0, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Money size={20} style={{ color: '#4f46e5' }} /></div>
          <div><div style={{ fontSize: 24, fontWeight: 800, color: '#1c1917' }}>{monthlyRevenue.toLocaleString('tr-TR')}</div><div style={{ fontSize: 12, color: '#a8a29e' }}>Aylik Gelir (TL)</div></div>
        </div>
        <div style={{ ...S.card, marginBottom: 0, padding: 16, display: 'flex', alignItems: 'center', gap: 12, border: expiringSubs.length > 0 ? '1px solid #fed7aa' : undefined, background: expiringSubs.length > 0 ? '#fff7ed' : '#fff' }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Warning size={20} style={{ color: '#ea580c' }} /></div>
          <div><div style={{ fontSize: 24, fontWeight: 800, color: expiringSubs.length > 0 ? '#ea580c' : '#1c1917' }}>{expiringSubs.length}</div><div style={{ fontSize: 12, color: '#a8a29e' }}>Suresi Dolan</div></div>
        </div>
      </div>

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
        {kpiData ? (
          <KPISections data={kpiData} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
            {[0, 1, 2, 3].map((i) => <StatCardSkeleton key={i} />)}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1c1917' }}>Restoranlar</h2>
          <button onClick={() => setShowForm(!showForm)} style={S.btn}>{showForm ? 'Iptal' : '+ Restoran & Kullanici Ekle'}</button>
        </div>
        {showForm && (
          <form onSubmit={addRestaurant} style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#78716c', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #e7e5e4', paddingBottom: 6 }}>Isletme Bilgileri</div>
            <div><label style={S.label}>Restoran Adi *</label><input style={S.input} value={form.name} onChange={e => { const name = e.target.value; setForm({ ...form, name, slug: generateSlug(name) }); }} required placeholder="Orn: Cafe Istanbul" /></div>
            <div><label style={S.label}>Slug (URL)</label><input style={S.input} value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="otomatik olusturulur" /></div>
            <div style={S.grid2}>
              <div><label style={S.label}>Adres</label><input style={S.input} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
              <div><label style={S.label}>Telefon</label><input style={S.input} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#78716c', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #e7e5e4', paddingBottom: 6, marginTop: 8 }}>Hesap Bilgileri</div>
            <div><label style={S.label}>Ad Soyad *</label><input style={S.input} value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required placeholder="Restoran sahibi adi" /></div>
            <div style={S.grid2}>
              <div><label style={S.label}>E-posta *</label><input type="email" style={S.input} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
              <div><label style={S.label}>Sifre *</label><input type="password" style={S.input} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} /></div>
            </div>
            <button type="submit" disabled={saving} style={S.btn}>{saving ? 'Olusturuluyor...' : 'Restoran & Kullanici Olustur'}</button>
          </form>
        )}
        {restaurants.map(r => (
          <div key={r.id} style={S.card}>
            {editingRest === r.id ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={S.grid2}>
                  <div><label style={S.label}>Restoran Adi</label><input style={S.input} value={editRestForm.name} onChange={e => setEditRestForm({ ...editRestForm, name: e.target.value })} /></div>
                  <div><label style={S.label}>Slug</label><input style={S.input} value={editRestForm.slug} onChange={e => setEditRestForm({ ...editRestForm, slug: e.target.value })} /></div>
                </div>
                <div style={S.grid2}>
                  <div><label style={S.label}>Adres</label><input style={S.input} value={editRestForm.address} onChange={e => setEditRestForm({ ...editRestForm, address: e.target.value })} /></div>
                  <div><label style={S.label}>Telefon</label><input style={S.input} value={editRestForm.phone} onChange={e => setEditRestForm({ ...editRestForm, phone: e.target.value })} /></div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => updateRestaurant(r.id)} style={S.btnSm}><CheckCircle size={14} /> Kaydet</button>
                  <button onClick={() => setEditingRest(null)} style={S.btnSm}><XCircle size={14} /> Iptal</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1c1917' }}>{r.name}</div>
                  <div style={{ fontSize: 13, color: '#a8a29e', marginTop: 2 }}>/{r.slug} &middot; {r.current_plan}</div>
                  {(r.address || r.phone) && <div style={{ fontSize: 12, color: '#78716c', marginTop: 2 }}>{r.address}{r.address && r.phone ? ' · ' : ''}{r.phone}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ ...S.badge, ...statusColor(r.subscription_status) }}>{r.subscription_status}</span>
                  <button onClick={() => toggleActive(r.id, r.is_active)} style={{ ...S.btnSm, color: r.is_active ? '#16a34a' : '#dc2626' }}>{r.is_active ? 'Aktif' : 'Pasif'}</button>
                  <button onClick={() => { setEditingRest(r.id); setEditRestForm({ name: r.name, slug: r.slug, address: r.address || '', phone: r.phone || '' }); }} style={S.btnSm}><PencilSimple size={14} /></button>
                  <button onClick={() => deleteRestaurant(r.id)} style={S.btnDanger}>Sil</button>
                </div>
              </div>
            )}
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
          <div key={u.id} style={S.card}>
            {editingUser === u.id ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={S.grid2}>
                  <div><label style={S.label}>Ad Soyad</label><input style={S.input} value={editUserForm.full_name} onChange={e => setEditUserForm({ ...editUserForm, full_name: e.target.value })} /></div>
                  <div><label style={S.label}>Restoran</label>
                    <select style={S.input} value={editUserForm.restaurant_id} onChange={e => setEditUserForm({ ...editUserForm, restaurant_id: e.target.value })}>
                      <option value="">-- Seciniz --</option>
                      {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => updateUser(u.id)} style={S.btnSm}><CheckCircle size={14} /> Kaydet</button>
                  <button onClick={() => setEditingUser(null)} style={S.btnSm}><XCircle size={14} /> Iptal</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#1c1917' }}>{u.full_name || u.email}</div>
                  <div style={{ fontSize: 13, color: '#a8a29e' }}>{u.email}{u.restaurant_id ? ' · ' + restName(u.restaurant_id) : ''}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ ...S.badge, background: u.role === 'super_admin' ? '#fee2e2' : '#e0e7ff', color: u.role === 'super_admin' ? '#dc2626' : '#4f46e5' }}>{u.role}</span>
                  <button onClick={() => { setEditingUser(u.id); setEditUserForm({ full_name: u.full_name || '', restaurant_id: u.restaurant_id || '' }); }} style={S.btnSm}><PencilSimple size={14} /></button>
                  {u.role !== 'super_admin' && <button onClick={() => deleteUser(u.id)} style={S.btnDanger}>Sil</button>}
                </div>
              </div>
            )}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ ...S.badge, ...statusColor(expired ? 'expired' : expiring ? 'expiring' : s.status) }}>{expired ? 'expired' : expiring ? 'expiring' : s.status}</span>
                {s.status === 'active' && (
                  <>
                    <button onClick={() => extendSubscription(s.id, s.end_date)} style={S.btnSm}>Uzat</button>
                    {changingPlan === s.id ? (
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <select style={{ ...S.input, width: 120, padding: '4px 8px', fontSize: 12 }} value={newPlanId} onChange={e => setNewPlanId(e.target.value)}>
                          <option value="">Plan sec</option>
                          {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <button onClick={() => changePlan(s.id, s.restaurant_id)} style={{ ...S.btnSm, padding: '3px 8px', fontSize: 11 }}><CheckCircle size={14} /></button>
                        <button onClick={() => { setChangingPlan(null); setNewPlanId(''); }} style={{ ...S.btnSm, padding: '3px 8px', fontSize: 11 }}><XCircle size={14} /></button>
                      </div>
                    ) : (
                      <button onClick={() => { setChangingPlan(s.id); setNewPlanId(''); }} style={S.btnSm}>Plan Degistir</button>
                    )}
                    <button onClick={() => cancelSubscription(s.id, s.restaurant_id)} style={S.btnDanger}>Iptal</button>
                  </>
                )}
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
                                <button onClick={() => savePlanFeatureValue(p.id, feat.id, editPFValue)} style={{ ...S.btnSm, padding: '3px 6px', fontSize: 11 }}><CheckCircle size={14} /></button>
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
                                {val === 'true' ? <CheckCircle size={14} style={{ display: 'inline' }} /> : val === 'false' ? '—' : val}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td style={{ textAlign: 'center' }}>
                        <button onClick={() => deleteFeature(feat.id)} style={{ background: 'none', border: 'none', color: '#d6d3d1', cursor: 'pointer', fontSize: 14, padding: 4 }} title="Sil"><XCircle size={14} /></button>
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

// ============ KPI DASHBOARD COMPONENTS ============

const KPI_STYLES: Record<string, React.CSSProperties> = {
  sectionWrap: { marginBottom: 24 },
  sectionHeader: {
    fontSize: 13, fontWeight: 700, color: '#a8a29e',
    textTransform: 'uppercase', letterSpacing: 1,
    borderBottom: '1px solid #e7e5e4', paddingBottom: 8, marginBottom: 16,
  },
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 },
  card: {
    background: '#fff', border: '1px solid #e7e5e4', borderRadius: 12,
    padding: 20, display: 'flex', flexDirection: 'column', gap: 8,
  },
  cardHeader: { display: 'flex', alignItems: 'center', gap: 8, color: '#78716c' },
  cardTitle: { fontSize: 13, fontWeight: 600, color: '#44403c' },
  cardMetric: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 30, fontWeight: 700, color: '#1c1917', lineHeight: 1.1, marginTop: 4,
  },
  cardSub: { fontSize: 12, color: '#a8a29e', fontWeight: 300 },
};

function KPICard({ icon, title, value, sub, valueColor, titleAttr }: {
  icon: React.ReactNode; title: string; value: React.ReactNode; sub?: string;
  valueColor?: string; titleAttr?: string;
}) {
  return (
    <div style={KPI_STYLES.card} title={titleAttr}>
      <div style={KPI_STYLES.cardHeader}>
        {icon}
        <span style={KPI_STYLES.cardTitle}>{title}</span>
      </div>
      <div style={{ ...KPI_STYLES.cardMetric, color: valueColor || '#1c1917' }}>{value}</div>
      {sub && <div style={KPI_STYLES.cardSub}>{sub}</div>}
    </div>
  );
}

function KPISections({ data }: { data: KPIData }) {
  const photoColor = data.photoPercentage >= 80 ? '#16a34a' : data.photoPercentage >= 50 ? '#d97706' : '#dc2626';
  const expiringColor = data.expiringSoon > 0 ? '#d97706' : '#1c1917';
  const emptyColor = data.emptyMenuRestaurants > 0 ? '#dc2626' : '#16a34a';
  const iconProps = { size: 18, style: { color: '#78716c' } };

  return (
    <div>
      {/* SISTEM SAGLIGI */}
      <div style={KPI_STYLES.sectionWrap}>
        <div style={KPI_STYLES.sectionHeader}>SISTEM SAGLIGI</div>
        <div style={KPI_STYLES.grid4}>
          <KPICard
            icon={<ListBullets {...iconProps} />}
            title="Toplam Menu Urunu"
            value={data.totalItems}
            sub={`${data.activeItems} aktif, ${data.passiveItems} pasif`}
          />
          <KPICard
            icon={<Camera {...iconProps} />}
            title="Fotografli Urun Orani"
            value={`%${data.photoPercentage}`}
            valueColor={photoColor}
            sub="Gorseli olan urunler"
          />
          <KPICard
            icon={<Storefront {...iconProps} />}
            title="Aktif / Pasif Restoran"
            value={`${data.activeRestaurants} / ${data.passiveRestaurants}`}
            sub={`Toplam ${data.totalRestaurants} restoran`}
          />
          <KPICard
            icon={<Calendar {...iconProps} />}
            title="Bu Hafta Eklenen Urun"
            value={data.weeklyNewItems}
            sub="Son 7 gun"
          />
        </div>
      </div>

      {/* IS METRIKLERI */}
      <div style={KPI_STYLES.sectionWrap}>
        <div style={KPI_STYLES.sectionHeader}>IS METRIKLERI</div>
        <div style={KPI_STYLES.grid4}>
          <KPICard
            icon={<Kanban {...iconProps} />}
            title="Plan Dagilimi"
            value={
              <span style={{ fontSize: 18 }}>
                {data.planDistribution.length > 0
                  ? data.planDistribution.map(p => `${p.name}: ${p.count}`).join(' | ')
                  : '—'}
              </span>
            }
            sub="Aktif uyelikler"
          />
          <KPICard
            icon={<CurrencyDollar {...iconProps} />}
            title="Aylik Gelir"
            value={`₺${Math.round(data.monthlyRevenue).toLocaleString('tr-TR')}`}
            sub="/ ay (yillik/12)"
          />
          <KPICard
            icon={<Timer {...iconProps} />}
            title="30 Gun Icinde Dolacak"
            value={data.expiringSoon}
            valueColor={expiringColor}
            sub={data.expiringNames.length > 0 ? data.expiringNames.slice(0, 3).join(', ') + (data.expiringNames.length > 3 ? '...' : '') : 'Yok'}
            titleAttr={data.expiringNames.join('\n')}
          />
          <KPICard
            icon={<ListChecks {...iconProps} />}
            title="Ortalama Menu Boyutu"
            value={data.avgMenuSize.toFixed(1)}
            sub="urun/restoran"
          />
        </div>
      </div>

      {/* KULLANIM */}
      <div style={KPI_STYLES.sectionWrap}>
        <div style={KPI_STYLES.sectionHeader}>KULLANIM</div>
        <div style={KPI_STYLES.grid3}>
          <KPICard
            icon={<Pulse {...iconProps} />}
            title="Son 7 Gunde Aktif"
            value={data.recentlyActiveRestaurants}
            sub="Menusunu guncelleyenler"
          />
          <KPICard
            icon={<XCircle {...iconProps} />}
            title="Bos Menulu Restoran"
            value={data.emptyMenuRestaurants}
            valueColor={emptyColor}
            sub={data.emptyMenuNames.length > 0 ? data.emptyMenuNames.slice(0, 3).join(', ') + (data.emptyMenuNames.length > 3 ? '...' : '') : 'Yok'}
            titleAttr={data.emptyMenuNames.join('\n')}
          />
          <KPICard
            icon={<Rows {...iconProps} />}
            title="QR Kodlu Restoran"
            value={`${data.qrCreatedRestaurants} / ${data.totalRestaurants}`}
            sub="QR olusturulmus"
          />
        </div>
      </div>
    </div>
  );
}
