# TABBLED — Super Admin Panel Geliştirmeleri

Proje: /opt/khp/tabbled
Dosya: src/pages/SuperAdminDashboard.tsx

Bu dosyada 5 geliştirme yapılacak. Mevcut yapıyı koru, inline style pattern'ını (S object) kullan, import'larda `react-icons/ci` Circum Icons kullan (Lucide KULLANMA). shadcn/ui bileşenlerine dokunma.

Türkçe karakter dikkat: bash heredoc kullanma, dosya yazımlarında python3 -c veya doğrudan str_replace kullan.

---

## 1. Dashboard İstatistikleri — Üst Kısım

Tab bar'ın ÜSTÜNE bir istatistik bölümü ekle. 4 kart yan yana:

```
| Toplam Restoran | Aktif Üyelik | Aylık Gelir (TL) | Süresi Dolan |
|       12        |      8       |     4.800         |      2       |
```

Hesaplama:
- **Toplam Restoran:** `restaurants.length`
- **Aktif Üyelik:** `subscriptions.filter(s => s.status === 'active').length`
- **Aylık Gelir:** Aktif üyeliklerin plan'larının `price_monthly` toplamı. Her aktif subscription'ın `plan_id`'sinden plans array'inde bul, `price_monthly`'lerini topla. `toLocaleString('tr-TR')` ile formatla.
- **Süresi Dolan (30 gün içinde):** `subscriptions.filter(s => s.status === 'active' && daysLeft(s.end_date) <= 30 && daysLeft(s.end_date) > 0).length`

Stil: 4'lü grid, her kart S.card gibi ama daha kompakt. Üstte büyük rakam (24px, fontWeight 800), altında label (12px, muted renk). Süresi dolan kart rengi turuncu/kırmızımsı olsun (uyarı).

İkon kullanımı (react-icons/ci):
- Toplam Restoran: `CiShop`
- Aktif Üyelik: `CiCircleCheck`
- Aylık Gelir: `CiMoneyBill`
- Süresi Dolan: `CiWarning`

---

## 2. Restoran Düzenleme

Restoran kartlarına "Düzenle" butonu ekle. Tıklayınca inline edit modu açılsın (aynı kart içinde).

Düzenlenebilir alanlar:
- name (Restoran Adı)
- slug (URL slug)
- address (Adres)
- phone (Telefon)

State'ler ekle:
```tsx
const [editingRest, setEditingRest] = useState<string | null>(null);
const [editRestForm, setEditRestForm] = useState({ name: '', slug: '', address: '', phone: '' });
```

Düzenle butonuna tıklanınca:
```tsx
setEditingRest(r.id);
setEditRestForm({ name: r.name, slug: r.slug, address: r.address || '', phone: r.phone || '' });
```

Kaydet fonksiyonu:
```tsx
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
```

Kart render'ında: `editingRest === r.id` ise input'lu form göster, değilse mevcut görünüm. Kaydet butonu `<CiCircleCheck size={14} />`, İptal butonu `<CiCircleRemove size={14} />`, Düzenle butonu `<CiEdit size={14} />`.

Restaurant type'ına address ve phone ekle:
```tsx
type Restaurant = { id: string; name: string; slug: string; is_active: boolean; subscription_status: string; current_plan: string; created_at: string; address: string | null; phone: string | null; };
```

Restoran kartında adres ve telefon bilgisini de göster (varsa).

---

## 3. Restoran Silme

Restoran kartlarına "Sil" butonu ekle (kırmızı, S.btnDanger stili).

```tsx
async function deleteRestaurant(id: string) {
  if (!confirm('Bu restoran ve tüm verileri (kategoriler, ürünler, üyelikler) silinecek. Emin misiniz?')) return;
  // Önce ilişkili verileri sil
  await supabase.from('menu_items').delete().eq('restaurant_id', id);
  await supabase.from('menu_categories').delete().eq('restaurant_id', id);
  await supabase.from('subscriptions').delete().eq('restaurant_id', id);
  await supabase.from('qr_codes').delete().eq('restaurant_id', id);
  // Profillerdeki restaurant_id'yi null yap
  await supabase.from('profiles').update({ restaurant_id: null }).eq('restaurant_id', id);
  // Son olarak restoranı sil
  await supabase.from('restaurants').delete().eq('id', id);
  loadAll();
}
```

Buton: `<button onClick={() => deleteRestaurant(r.id)} style={S.btnDanger}>Sil</button>` — mevcut butonların yanına ekle.

---

## 4. Kullanıcı Düzenleme ve Silme

Kullanıcı kartlarına "Düzenle" ve "Sil" butonları ekle.

State'ler:
```tsx
const [editingUser, setEditingUser] = useState<string | null>(null);
const [editUserForm, setEditUserForm] = useState({ full_name: '', restaurant_id: '' });
```

Düzenleme — sadece full_name ve restaurant_id değiştirilebilir (email ve role değişmez):
```tsx
async function updateUser(id: string) {
  await supabase.from('profiles').update({
    full_name: editUserForm.full_name || null,
    restaurant_id: editUserForm.restaurant_id || null,
  }).eq('id', id);
  setEditingUser(null);
  loadUsers();
}
```

Silme — super_admin silinemez:
```tsx
async function deleteUser(id: string) {
  const user = users.find(u => u.id === id);
  if (user?.role === 'super_admin') { setMsg('Super admin silinemez.'); return; }
  if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;
  await supabase.from('profiles').delete().eq('id', id);
  loadUsers();
}
```

Kart render'ında:
- `editingUser === u.id` ise → inline form (full_name input + restoran dropdown + kaydet/iptal butonları)
- Değilse → mevcut görünüm + sağ tarafta Düzenle ve Sil butonları
- super_admin role'ündeki kullanıcılarda Sil butonu gizle

İkonlar: Düzenle → `<CiEdit size={14} />`, Kaydet → `<CiCircleCheck size={14} />`, İptal → `<CiCircleRemove size={14} />`.

---

## 5. Üyelik Uzatma ve Plan Değiştirme

Üyelik kartlarına "Uzat" ve "Plan Değiştir" butonları ekle.

**Uzatma (1 yıl ekle):**
```tsx
async function extendSubscription(id: string, currentEndDate: string) {
  if (!confirm('Üyelik 1 yıl uzatılacak. Emin misiniz?')) return;
  const newEnd = new Date(new Date(currentEndDate).getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  await supabase.from('subscriptions').update({ end_date: newEnd, status: 'active' }).eq('id', id);
  loadAll();
}
```

**Plan Değiştirme:**
State:
```tsx
const [changingPlan, setChangingPlan] = useState<string | null>(null);
const [newPlanId, setNewPlanId] = useState('');
```

Fonksiyon:
```tsx
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
```

Üyelik kartında:
- `s.status === 'active'` ise → "Uzat" butonu (S.btnSm stili) + "Plan Değiştir" butonu
- "Plan Değiştir" tıklayınca → inline dropdown (plans listesi) + Kaydet/İptal butonları
- Mevcut İptal butonu da kalacak

---

## ÖNEMLİ KURALLAR

1. Tüm ikonlar `react-icons/ci` (Circum Icons) kullan — Lucide KULLANMA
2. Mevcut S style object'ini kullan, yeni stiller gerekirse S'ye ekle
3. Mevcut fonksiyonları bozmadan yeni fonksiyonlar ekle
4. confirm() ile silme/değiştirme onayı al
5. loadAll() veya ilgili load fonksiyonunu işlem sonrası çağır
6. Türkçe karakter içeren string'lerde dikkatli ol

## İmport güncellemesi

Mevcut:
```tsx
import { CiCircleCheck, CiCircleRemove } from 'react-icons/ci';
```

Yeni:
```tsx
import { CiCircleCheck, CiCircleRemove, CiEdit, CiShop, CiMoneyBill, CiWarning } from 'react-icons/ci';
```

## Son adım
```bash
npm run build
git add -A && git commit -m "Super admin panel: dashboard stats, CRUD improvements, subscription management" && git push origin main
```
