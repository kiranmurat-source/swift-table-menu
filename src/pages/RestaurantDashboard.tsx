import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';
import { CiWheat, CiDroplet, CiCircleAlert, CiApple, CiLemon, CiCamera, CiEdit, CiCircleCheck, CiCircleRemove, CiStar, CiTempHigh, CiWavePulse1 } from 'react-icons/ci';

type Category = { id: string; name_tr: string; name_en: string | null; sort_order: number; is_active: boolean; };
type MenuItem = {
  id: string; category_id: string; name_tr: string; name_en: string | null;
  description_tr: string | null; description_en: string | null; price: number;
  image_url: string | null; is_available: boolean; is_popular: boolean; sort_order: number;
  calories: number | null; allergens: string[] | null; is_vegetarian: boolean; is_new: boolean;
};
type Restaurant = { id: string; name: string; slug: string; };

const ALLERGEN_OPTIONS: { value: string; label: string; icon: React.ReactNode }[] = [
  { value: 'gluten', label: 'Gluten', icon: <CiWheat size={14} /> },
  { value: 'dairy', label: 'Süt Ürünü', icon: <CiDroplet size={14} /> },
  { value: 'egg', label: 'Yumurta', icon: <CiCircleAlert size={14} /> },
  { value: 'nuts', label: 'Kuruyemiş', icon: <CiApple size={14} /> },
  { value: 'seafood', label: 'Deniz Ürünü', icon: <CiWavePulse1 size={14} /> },
  { value: 'soy', label: 'Soya', icon: <CiLemon size={14} /> },
  { value: 'spicy', label: 'Acı', icon: <CiTempHigh size={14} /> },
];

const S: Record<string, React.CSSProperties> = {
  wrap: { maxWidth: 900, margin: '0 auto', padding: '32px 24px' },
  card: { background: '#fff', border: '1px solid #e7e5e4', borderRadius: 12, padding: 20, marginBottom: 12 },
  input: { width: '100%', padding: '10px 14px', fontSize: 14, border: '1px solid #d6d3d1', borderRadius: 8, outline: 'none', background: '#fff', boxSizing: 'border-box' as const },
  btn: { padding: '10px 20px', fontSize: 13, fontWeight: 700, color: '#fff', background: '#1c1917', border: 'none', borderRadius: 8, cursor: 'pointer' },
  btnSm: { padding: '6px 14px', fontSize: 12, fontWeight: 600, border: '1px solid #d6d3d1', borderRadius: 6, cursor: 'pointer', background: '#fff', color: '#44403c' },
  btnDanger: { padding: '6px 14px', fontSize: 12, fontWeight: 600, border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', background: '#fff', color: '#dc2626' },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#44403c', marginBottom: 6 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 },
  badge: { fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, display: 'inline-block', marginRight: 4 },
};

const emptyItemForm = { name_tr: '', name_en: '', description_tr: '', description_en: '', price: '', image_url: '', calories: '', allergens: [] as string[], is_vegetarian: false, is_new: false };

export default function RestaurantDashboard() {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [showCatForm, setShowCatForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [catForm, setCatForm] = useState({ name_tr: '', name_en: '' });
  const [itemForm, setItemForm] = useState(emptyItemForm);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editCatForm, setEditCatForm] = useState({ name_tr: '', name_en: '' });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('restaurant_id').eq('id', user.id).single()
        .then(({ data }) => {
          if (data?.restaurant_id) {
            supabase.from('restaurants').select('*').eq('id', data.restaurant_id).single()
              .then(({ data: r }) => { if (r) { setRestaurant(r); loadCategories(r.id); loadItems(r.id); } });
          }
        });
    }
  }, [user]);

  async function loadCategories(rid: string) {
    const { data } = await supabase.from('menu_categories').select('*').eq('restaurant_id', rid).order('sort_order');
    setCategories(data || []);
  }
  async function loadItems(rid: string) {
    const { data } = await supabase.from('menu_items').select('*').eq('restaurant_id', rid).order('sort_order');
    setItems(data || []);
  }

  // --- Category CRUD ---
  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!restaurant) return;
    setSaving(true);
    const { error } = await supabase.from('menu_categories').insert({ restaurant_id: restaurant.id, name_tr: catForm.name_tr, name_en: catForm.name_en || null, sort_order: categories.length });
    if (error) setMsg(error.message);
    else { setCatForm({ name_tr: '', name_en: '' }); setShowCatForm(false); loadCategories(restaurant.id); }
    setSaving(false);
  }
  async function updateCategory(id: string) {
    if (!restaurant) return;
    await supabase.from('menu_categories').update({ name_tr: editCatForm.name_tr, name_en: editCatForm.name_en || null }).eq('id', id);
    setEditingCat(null);
    loadCategories(restaurant.id);
  }
  async function deleteCategory(id: string) {
    if (!restaurant || !confirm('Bu kategori ve tüm ürünleri silinecek. Emin misiniz?')) return;
    await supabase.from('menu_categories').delete().eq('id', id);
    loadCategories(restaurant.id); loadItems(restaurant.id);
    if (selectedCat === id) setSelectedCat(null);
  }

  // --- Image Upload ---
  async function handleImageUpload(file: File) {
    if (!restaurant) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `${restaurant.slug}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('menu-images').upload(fileName, file, { upsert: true });
    if (error) { setMsg('Görsel yükleme hatası: ' + error.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('menu-images').getPublicUrl(fileName);
    setItemForm({ ...itemForm, image_url: urlData.publicUrl });
    setUploading(false);
  }

  // --- Item CRUD ---
  async function addOrUpdateItem(e: React.FormEvent) {
    e.preventDefault();
    if (!restaurant || !selectedCat) return;
    setSaving(true);
    const payload = {
      restaurant_id: restaurant.id, category_id: selectedCat,
      name_tr: itemForm.name_tr, name_en: itemForm.name_en || null,
      description_tr: itemForm.description_tr || null, description_en: itemForm.description_en || null,
      price: parseFloat(itemForm.price), image_url: itemForm.image_url || null,
      calories: itemForm.calories ? parseInt(itemForm.calories) : null,
      allergens: itemForm.allergens.length > 0 ? itemForm.allergens : null,
      is_vegetarian: itemForm.is_vegetarian, is_new: itemForm.is_new,
      sort_order: editingItem ? undefined : items.filter(i => i.category_id === selectedCat).length,
    };
    if (editingItem) {
      const { sort_order, ...updatePayload } = payload;
      await supabase.from('menu_items').update(updatePayload).eq('id', editingItem);
    } else {
      await supabase.from('menu_items').insert(payload);
    }
    setItemForm(emptyItemForm); setShowItemForm(false); setEditingItem(null);
    loadItems(restaurant.id);
    setSaving(false);
  }
  async function deleteItem(id: string) {
    if (!restaurant || !confirm('Bu ürün silinecek. Emin misiniz?')) return;
    await supabase.from('menu_items').delete().eq('id', id);
    loadItems(restaurant.id);
  }
  async function toggleItemAvailable(id: string, current: boolean) {
    if (!restaurant) return;
    await supabase.from('menu_items').update({ is_available: !current }).eq('id', id);
    loadItems(restaurant.id);
  }
  function startEdit(item: MenuItem) {
    setEditingItem(item.id);
    setItemForm({
      name_tr: item.name_tr, name_en: item.name_en || '',
      description_tr: item.description_tr || '', description_en: item.description_en || '',
      price: item.price.toString(), image_url: item.image_url || '',
      calories: item.calories?.toString() || '',
      allergens: item.allergens || [],
      is_vegetarian: item.is_vegetarian || false,
      is_new: item.is_new || false,
    });
    setShowItemForm(true);
    setSelectedCat(item.category_id);
  }
  function toggleAllergen(val: string) {
    setItemForm(prev => ({
      ...prev,
      allergens: prev.allergens.includes(val)
        ? prev.allergens.filter(a => a !== val)
        : [...prev.allergens, val]
    }));
  }

  if (!restaurant) return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1c1917', marginBottom: 8 }}>Restoran Atanmadı</h2>
      <p style={{ fontSize: 14, color: '#78716c' }}>Hesabınıza henüz bir restoran atanmamış. Lütfen yönetici ile iletişime geçin.</p>
    </div>
  );

  const filteredItems = selectedCat ? items.filter(i => i.category_id === selectedCat) : items;
  const catName = (id: string) => categories.find(c => c.id === id)?.name_tr || '';

  return (
    <div style={S.wrap}>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1c1917', marginBottom: 4 }}>{restaurant.name}</h2>
      <p style={{ fontSize: 13, color: '#a8a29e', marginBottom: 24 }}>Menü Yönetimi</p>

      {msg && <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 13, marginBottom: 16 }} onClick={() => setMsg('')}>{msg} <span style={{ float: 'right', cursor: 'pointer' }}>✕</span></div>}

      {/* ===== KATEGORILER ===== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1c1917' }}>Kategoriler</h3>
        <button onClick={() => setShowCatForm(!showCatForm)} style={S.btnSm}>{showCatForm ? 'İptal' : '+ Kategori'}</button>
      </div>

      {showCatForm && (
        <form onSubmit={addCategory} style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={S.grid2}>
            <div><label style={S.label}>Kategori Adı (TR) *</label><input style={S.input} value={catForm.name_tr} onChange={e => setCatForm({ ...catForm, name_tr: e.target.value })} required placeholder="Örn: Ana Yemekler" /></div>
            <div><label style={S.label}>Category Name (EN)</label><input style={S.input} value={catForm.name_en} onChange={e => setCatForm({ ...catForm, name_en: e.target.value })} placeholder="e.g. Main Courses" /></div>
          </div>
          <button type="submit" disabled={saving} style={{ ...S.btn, alignSelf: 'flex-start' }}>{saving ? '...' : 'Ekle'}</button>
        </form>
      )}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
        <button onClick={() => setSelectedCat(null)} style={{ ...S.btnSm, background: !selectedCat ? '#1c1917' : '#fff', color: !selectedCat ? '#fff' : '#44403c' }}>Tümü ({items.length})</button>
        {categories.map(c => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {editingCat === c.id ? (
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <input style={{ ...S.input, width: 100, padding: '4px 8px', fontSize: 12 }} value={editCatForm.name_tr} onChange={e => setEditCatForm({ ...editCatForm, name_tr: e.target.value })} />
                <input style={{ ...S.input, width: 80, padding: '4px 8px', fontSize: 12 }} value={editCatForm.name_en} onChange={e => setEditCatForm({ ...editCatForm, name_en: e.target.value })} placeholder="EN" />
                <button onClick={() => updateCategory(c.id)} style={{ ...S.btnSm, padding: '3px 8px', fontSize: 11 }}><CiCircleCheck size={14} /></button>
                <button onClick={() => setEditingCat(null)} style={{ ...S.btnSm, padding: '3px 8px', fontSize: 11 }}><CiCircleRemove size={14} /></button>
              </div>
            ) : (
              <>
                <button onClick={() => setSelectedCat(c.id)} style={{ ...S.btnSm, background: selectedCat === c.id ? '#1c1917' : '#fff', color: selectedCat === c.id ? '#fff' : '#44403c' }}>{c.name_tr} ({items.filter(i => i.category_id === c.id).length})</button>
                <button onClick={() => { setEditingCat(c.id); setEditCatForm({ name_tr: c.name_tr, name_en: c.name_en || '' }); }} style={{ background: 'none', border: 'none', color: '#a8a29e', cursor: 'pointer', fontSize: 12, padding: '0 2px' }} title="Düzenle"><CiEdit size={14} /></button>
                <button onClick={() => deleteCategory(c.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 14, padding: '0 2px' }}>×</button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* ===== ÜRÜNLER ===== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1c1917' }}>Ürünler</h3>
        {selectedCat && <button onClick={() => { setShowItemForm(!showItemForm); setEditingItem(null); setItemForm(emptyItemForm); }} style={S.btnSm}>{showItemForm ? 'İptal' : '+ Ürün Ekle'}</button>}
      </div>

      {!selectedCat && <p style={{ fontSize: 13, color: '#a8a29e', marginBottom: 16 }}>Ürün eklemek için bir kategori seçin.</p>}

      {showItemForm && selectedCat && (
        <form onSubmit={addOrUpdateItem} style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* İsim */}
          <div style={S.grid2}>
            <div><label style={S.label}>Ürün Adı (TR) *</label><input style={S.input} value={itemForm.name_tr} onChange={e => setItemForm({ ...itemForm, name_tr: e.target.value })} required /></div>
            <div><label style={S.label}>Product Name (EN)</label><input style={S.input} value={itemForm.name_en} onChange={e => setItemForm({ ...itemForm, name_en: e.target.value })} /></div>
          </div>
          {/* Açıklama */}
          <div style={S.grid2}>
            <div><label style={S.label}>Açıklama (TR)</label><input style={S.input} value={itemForm.description_tr} onChange={e => setItemForm({ ...itemForm, description_tr: e.target.value })} /></div>
            <div><label style={S.label}>Description (EN)</label><input style={S.input} value={itemForm.description_en} onChange={e => setItemForm({ ...itemForm, description_en: e.target.value })} /></div>
          </div>
          {/* Fiyat + Kalori + Görsel */}
          <div style={S.grid3}>
            <div><label style={S.label}>Fiyat (₺) *</label><input type="number" step="0.01" style={S.input} value={itemForm.price} onChange={e => setItemForm({ ...itemForm, price: e.target.value })} required /></div>
            <div><label style={S.label}>Kalori (kcal)</label><input type="number" style={S.input} value={itemForm.calories} onChange={e => setItemForm({ ...itemForm, calories: e.target.value })} placeholder="Örn: 450" /></div>
            <div>
              <label style={S.label}>Görsel</label>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0]); }} />
              {itemForm.image_url ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img src={itemForm.image_url} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
                  <button type="button" onClick={() => setItemForm({ ...itemForm, image_url: '' })} style={{ ...S.btnSm, padding: '3px 8px', fontSize: 11, color: '#dc2626' }}>Kaldır</button>
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} style={{ ...S.btnSm, width: '100%' }}>
                  {uploading ? 'Yükleniyor...' : <><CiCamera size={14} /> Görsel Seç</>}
                </button>
              )}
            </div>
          </div>
          {/* Alerjenler */}
          <div>
            <label style={S.label}>Alerjenler</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {ALLERGEN_OPTIONS.map(a => (
                <button key={a.value} type="button" onClick={() => toggleAllergen(a.value)} style={{
                  padding: '6px 12px', fontSize: 12, borderRadius: 20, cursor: 'pointer', transition: 'all 0.15s',
                  border: itemForm.allergens.includes(a.value) ? '2px solid #16a34a' : '1px solid #d6d3d1',
                  background: itemForm.allergens.includes(a.value) ? '#dcfce7' : '#fff',
                  color: itemForm.allergens.includes(a.value) ? '#16a34a' : '#44403c',
                  fontWeight: itemForm.allergens.includes(a.value) ? 700 : 400,
                }}>
                  {a.icon} {a.label}
                </button>
              ))}
            </div>
          </div>
          {/* Toggle'lar */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: '#44403c' }}>
              <input type="checkbox" checked={itemForm.is_vegetarian} onChange={e => setItemForm({ ...itemForm, is_vegetarian: e.target.checked })} />
              <CiApple size={14} /> Vejetaryen
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: '#44403c' }}>
              <input type="checkbox" checked={itemForm.is_new} onChange={e => setItemForm({ ...itemForm, is_new: e.target.checked })} />
              <CiStar size={14} /> Yeni Ürün
            </label>
          </div>
          <button type="submit" disabled={saving} style={{ ...S.btn, alignSelf: 'flex-start' }}>{saving ? '...' : editingItem ? 'Güncelle' : 'Ekle'}</button>
        </form>
      )}

      {/* ===== ÜRÜN LİSTESİ ===== */}
      {filteredItems.map(item => {
        const allergenIconList = (item.allergens || []).map(a => ALLERGEN_OPTIONS.find(o => o.value === a)?.icon).filter(Boolean);
        return (
          <div key={item.id} style={{ ...S.card, opacity: item.is_available ? 1 : 0.45 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#1c1917' }}>{item.name_tr}</span>
                  {item.name_en && <span style={{ fontSize: 12, color: '#a8a29e' }}>/ {item.name_en}</span>}
                  {item.is_vegetarian && <span style={{ ...S.badge, background: '#dcfce7', color: '#16a34a' }}><CiApple size={12} /></span>}
                  {item.is_new && <span style={{ ...S.badge, background: '#fef3c7', color: '#b45309' }}><CiStar size={12} /> Yeni</span>}
                  {item.is_popular && <span style={{ ...S.badge, background: '#fef3c7', color: '#b45309' }}><CiStar size={12} /></span>}
                </div>
                {item.description_tr && <div style={{ fontSize: 13, color: '#78716c', marginTop: 2 }}>{item.description_tr}</div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#1c1917' }}>₺{Number(item.price).toFixed(2)}</span>
                  {item.calories && <span style={{ fontSize: 11, color: '#a8a29e', display: 'inline-flex', alignItems: 'center', gap: 2 }}><CiTempHigh size={12} /> {item.calories} kcal</span>}
                  {allergenIconList.length > 0 && <span style={{ fontSize: 12, display: 'inline-flex', gap: 2, alignItems: 'center' }} title={(item.allergens || []).join(', ')}>{allergenIconList.map((icon, idx) => <span key={idx}>{icon}</span>)}</span>}
                </div>
              </div>
              {item.image_url && <img src={item.image_url} alt="" style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', marginLeft: 12 }} />}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 10, borderTop: '1px solid #f5f5f4', paddingTop: 10 }}>
              <button onClick={() => toggleItemAvailable(item.id, item.is_available)} style={{ ...S.btnSm, color: item.is_available ? '#16a34a' : '#dc2626' }}>{item.is_available ? 'Aktif' : 'Pasif'}</button>
              <button onClick={() => startEdit(item)} style={S.btnSm}>Düzenle</button>
              <button onClick={() => deleteItem(item.id)} style={S.btnDanger}>Sil</button>
              {!selectedCat && <span style={{ fontSize: 11, color: '#a8a29e', alignSelf: 'center', marginLeft: 'auto' }}>{catName(item.category_id)}</span>}
            </div>
          </div>
        );
      })}
      {filteredItems.length === 0 && <div style={{ textAlign: 'center', color: '#a8a29e', padding: 40, fontSize: 14 }}>{selectedCat ? 'Bu kategoride henüz ürün yok.' : 'Henüz ürün eklenmedi.'}</div>}
    </div>
  );
}
