import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';

type Category = { id: string; name_tr: string; name_en: string | null; sort_order: number; is_active: boolean; };
type MenuItem = { id: string; category_id: string; name_tr: string; name_en: string | null; description_tr: string | null; description_en: string | null; price: number; image_url: string | null; is_available: boolean; is_popular: boolean; sort_order: number; };
type Restaurant = { id: string; name: string; slug: string; };

const S: Record<string, React.CSSProperties> = {
  wrap: { maxWidth: 900, margin: '0 auto', padding: '32px 24px' },
  card: { background: '#fff', border: '1px solid #e7e5e4', borderRadius: 12, padding: 20, marginBottom: 12 },
  input: { width: '100%', padding: '10px 14px', fontSize: 14, border: '1px solid #d6d3d1', borderRadius: 8, outline: 'none', background: '#fff', boxSizing: 'border-box' as const },
  btn: { padding: '10px 20px', fontSize: 13, fontWeight: 700, color: '#fff', background: '#1c1917', border: 'none', borderRadius: 8, cursor: 'pointer' },
  btnSm: { padding: '6px 14px', fontSize: 12, fontWeight: 600, border: '1px solid #d6d3d1', borderRadius: 6, cursor: 'pointer', background: '#fff', color: '#44403c' },
  btnDanger: { padding: '6px 14px', fontSize: 12, fontWeight: 600, border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', background: '#fff', color: '#dc2626' },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#44403c', marginBottom: 6 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
};

export default function RestaurantDashboard() {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [showCatForm, setShowCatForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [catForm, setCatForm] = useState({ name_tr: '', name_en: '' });
  const [itemForm, setItemForm] = useState({ name_tr: '', name_en: '', description_tr: '', description_en: '', price: '', image_url: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [editingItem, setEditingItem] = useState<string | null>(null);

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

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!restaurant) return;
    setSaving(true);
    const { error } = await supabase.from('menu_categories').insert({ restaurant_id: restaurant.id, name_tr: catForm.name_tr, name_en: catForm.name_en || null, sort_order: categories.length });
    if (error) setMsg(error.message);
    else { setCatForm({ name_tr: '', name_en: '' }); setShowCatForm(false); loadCategories(restaurant.id); }
    setSaving(false);
  }

  async function deleteCategory(id: string) {
    if (!restaurant || !confirm('Bu kategori ve tüm ürünleri silinecek. Emin misiniz?')) return;
    await supabase.from('menu_categories').delete().eq('id', id);
    loadCategories(restaurant.id); loadItems(restaurant.id);
    if (selectedCat === id) setSelectedCat(null);
  }

  async function addOrUpdateItem(e: React.FormEvent) {
    e.preventDefault();
    if (!restaurant || !selectedCat) return;
    setSaving(true);
    const payload = { restaurant_id: restaurant.id, category_id: selectedCat, name_tr: itemForm.name_tr, name_en: itemForm.name_en || null, description_tr: itemForm.description_tr || null, description_en: itemForm.description_en || null, price: parseFloat(itemForm.price), image_url: itemForm.image_url || null, sort_order: items.filter(i => i.category_id === selectedCat).length };
    if (editingItem) {
      await supabase.from('menu_items').update(payload).eq('id', editingItem);
    } else {
      await supabase.from('menu_items').insert(payload);
    }
    setItemForm({ name_tr: '', name_en: '', description_tr: '', description_en: '', price: '', image_url: '' });
    setShowItemForm(false); setEditingItem(null); loadItems(restaurant.id);
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
    setItemForm({ name_tr: item.name_tr, name_en: item.name_en || '', description_tr: item.description_tr || '', description_en: item.description_en || '', price: item.price.toString(), image_url: item.image_url || '' });
    setShowItemForm(true);
    setSelectedCat(item.category_id);
  }

  if (!restaurant) return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1c1917', marginBottom: 8 }}>Restoran Atanmadı</h2>
      <p style={{ fontSize: 14, color: '#78716c' }}>Hesabınıza henüz bir restoran atanmamış. Lütfen yönetici ile iletişime geçin.</p>
    </div>
  );

  const filteredItems = selectedCat ? items.filter(i => i.category_id === selectedCat) : items;

  return (
    <div style={S.wrap}>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1c1917', marginBottom: 4 }}>{restaurant.name}</h2>
      <p style={{ fontSize: 13, color: '#a8a29e', marginBottom: 24 }}>Menü Yönetimi</p>

      {msg && <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 13, marginBottom: 16 }}>{msg}</div>}

      {/* Categories */}
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
            <button onClick={() => setSelectedCat(c.id)} style={{ ...S.btnSm, background: selectedCat === c.id ? '#1c1917' : '#fff', color: selectedCat === c.id ? '#fff' : '#44403c' }}>{c.name_tr} ({items.filter(i => i.category_id === c.id).length})</button>
            <button onClick={() => deleteCategory(c.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 14, padding: '0 4px' }}>×</button>
          </div>
        ))}
      </div>

      {/* Items */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1c1917' }}>Ürünler</h3>
        {selectedCat && <button onClick={() => { setShowItemForm(!showItemForm); setEditingItem(null); setItemForm({ name_tr: '', name_en: '', description_tr: '', description_en: '', price: '', image_url: '' }); }} style={S.btnSm}>{showItemForm ? 'İptal' : '+ Ürün Ekle'}</button>}
      </div>

      {!selectedCat && <p style={{ fontSize: 13, color: '#a8a29e', marginBottom: 16 }}>Ürün eklemek için bir kategori seçin.</p>}

      {showItemForm && selectedCat && (
        <form onSubmit={addOrUpdateItem} style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={S.grid2}>
            <div><label style={S.label}>Ürün Adı (TR) *</label><input style={S.input} value={itemForm.name_tr} onChange={e => setItemForm({ ...itemForm, name_tr: e.target.value })} required /></div>
            <div><label style={S.label}>Product Name (EN)</label><input style={S.input} value={itemForm.name_en} onChange={e => setItemForm({ ...itemForm, name_en: e.target.value })} /></div>
          </div>
          <div style={S.grid2}>
            <div><label style={S.label}>Açıklama (TR)</label><input style={S.input} value={itemForm.description_tr} onChange={e => setItemForm({ ...itemForm, description_tr: e.target.value })} /></div>
            <div><label style={S.label}>Description (EN)</label><input style={S.input} value={itemForm.description_en} onChange={e => setItemForm({ ...itemForm, description_en: e.target.value })} /></div>
          </div>
          <div style={S.grid2}>
            <div><label style={S.label}>Fiyat (₺) *</label><input type="number" step="0.01" style={S.input} value={itemForm.price} onChange={e => setItemForm({ ...itemForm, price: e.target.value })} required /></div>
            <div><label style={S.label}>Görsel URL</label><input style={S.input} value={itemForm.image_url} onChange={e => setItemForm({ ...itemForm, image_url: e.target.value })} placeholder="https://..." /></div>
          </div>
          <button type="submit" disabled={saving} style={{ ...S.btn, alignSelf: 'flex-start' }}>{saving ? '...' : editingItem ? 'Güncelle' : 'Ekle'}</button>
        </form>
      )}

      {filteredItems.map(item => (
        <div key={item.id} style={{ ...S.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: item.is_available ? 1 : 0.5 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#1c1917' }}>{item.name_tr}</span>
              {item.name_en && <span style={{ fontSize: 12, color: '#a8a29e' }}>/ {item.name_en}</span>}
            </div>
            {item.description_tr && <div style={{ fontSize: 13, color: '#78716c', marginTop: 2 }}>{item.description_tr}</div>}
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1c1917', marginTop: 4 }}>₺{Number(item.price).toFixed(2)}</div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button onClick={() => toggleItemAvailable(item.id, item.is_available)} style={{ ...S.btnSm, color: item.is_available ? '#16a34a' : '#dc2626' }}>{item.is_available ? 'Aktif' : 'Pasif'}</button>
            <button onClick={() => startEdit(item)} style={S.btnSm}>Düzenle</button>
            <button onClick={() => deleteItem(item.id)} style={S.btnDanger}>Sil</button>
          </div>
        </div>
      ))}
      {filteredItems.length === 0 && <div style={{ textAlign: 'center', color: '#a8a29e', padding: 40, fontSize: 14 }}>{selectedCat ? 'Bu kategoride henüz ürün yok.' : 'Henüz ürün eklenmedi.'}</div>}
    </div>
  );
}
