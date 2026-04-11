# TABBLED — Admin Dashboard Design Overhaul (Final)

## GÖREV

RestaurantDashboard.tsx, SuperAdminDashboard.tsx, Dashboard.tsx ve ilgili bileşenleri yerinde düzenle. Mevcut fonksiyonelliği koru, sadece görsel katmanı güncelle + notification dropdown ekle.

## KRİTİK KURALLAR — HER ADIMDA UYGULA

1. **MOCKUP/DEMO DOSYASI ÜRETME** — doğrudan mevcut kaynak dosyaları düzenle
2. **Public menüye DOKUNMA** — PublicMenu, MenuPage, /menu/ altındaki hiçbir şey
3. **Fonksiyon mantığını değiştirme** — state, fetch, CRUD aynen kalacak
4. **Abartı yok** — süslü animasyon, gradient, texture, gölge efektleri EKLEME
5. **Dosyayı değiştirmeden önce oku** — mevcut kodu anla

## PROJE YOLU
```
/opt/khp/tabbled/
```

---

## RENK PALETİ — SADECE BU RENKLER

Tüm UI'da sadece şu renkler kullanılacak:

| Kullanım | Renk |
|---|---|
| Sidebar arka plan | #1C1C1E (charcoal) |
| Sidebar hover | #2A2A2E |
| Sidebar border | #3A3A3E |
| Sidebar text normal | #A0A0A0 |
| Sidebar text aktif | #FFFFFF |
| Sidebar text hover | #F0F0EC |
| Arka plan (sayfa) | #F7F7F5 (off-white) |
| Kart arka plan | #FFFFFF |
| Border (açık zemin) | #E5E5E3 |
| Başlık text | #1C1C1E |
| Body text | #2D2D2F |
| Subtle text | #6B6B6F |
| Muted text | #A0A0A0 |
| CTA / primary buton | #FF4F7A (strawberry pink) |
| CTA hover | #E8456E |
| CTA light bg | #FFF0F3 |
| Hata / uyarı | #EF4444 (kırmızı) — SADECE hata durumlarında |
| Başarı / onay | #22C55E (yeşil) — SADECE başarı durumlarında |

**BAŞKA RENK KULLANMA.** Mavi, amber, mor, turuncu yok. Badge'ler, chip'ler, tag'ler de bu paletten olacak:
- Aktif/başarı badge: bg #DCFCE7, text #166534
- Hata/pasif badge: bg #FEE2E2, text #991B1B
- Nötr badge: bg #F7F7F5, text #6B6B6F
- Öne çıkan badge: bg #FFF0F3, text #FF4F7A

---

## FONT DEĞİŞİKLİĞİ

### Playfair Display tamamen kaldırılacak. Yeni sistem:
- **Inter** → başlıklar, sidebar, butonlar, label'lar, nav, genel UI — HER YER
- **Manrope** → SADECE açıklama/description text'leri (ürün açıklamaları, subtitle'lar, yardımcı text'ler, placeholder'lar)

### Uygulama:
1. Manrope'u yükle:
```bash
npm install @fontsource/manrope
```

2. `src/main.tsx` veya font import dosyasına ekle:
```ts
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/500.css';
```

3. Playfair Display import'larını kaldır (main.tsx veya index.css'ten).

4. CSS'te:
```css
body {
  font-family: 'Inter', -apple-system, sans-serif;
}
```

5. Açıklama text'lerine inline style veya class ile:
```css
.description-text {
  font-family: 'Manrope', sans-serif;
}
```

6. `grep -rn "Playfair" src/ --include="*.tsx" --include="*.css" --include="*.ts"` ile tüm Playfair referanslarını bul ve Inter ile değiştir.

7. Landing page dahil **tüm Tabbled genelinde** bu font sistemi geçerli.

---

## BÖLÜM 1: SIDEBAR — RestaurantDashboard.tsx

### 1.1 Sidebar'dan TÜM İKONLARI KALDIR

Sidebar menü item'larındaki `<Icon size={16} />` bileşenlerini kaldır. Sadece düz text kalacak.

Mevcut sidebar item render'ı:
```jsx
<Icon size={16} />
<span className="flex-1 text-left">{item.label}</span>
```

Yeni:
```jsx
<span className="flex-1 text-left">{item.label}</span>
```

**NOT:** sidebarGroups tanımında `icon` property'si kalabilir (kullanılmayacak ama kaldırmak gereksiz refactor). Sadece render'dan kaldır.

### 1.2 Ana container
```
className="flex min-h-screen bg-white"
→
className="flex min-h-screen bg-[#F7F7F5]"
```

### 1.3 Desktop sidebar
```
className="hidden md:flex flex-col w-[240px] shrink-0 border-r border-gray-200 bg-[#fafafa] sticky top-0 self-start min-h-screen"
→
className="hidden md:flex flex-col w-[240px] shrink-0 border-r border-[#3A3A3E] bg-[#1C1C1E] sticky top-0 self-start min-h-screen"
```

### 1.4 Mobile sidebar
```
className="relative z-10 flex flex-col w-[260px] bg-[#fafafa] min-h-screen shadow-xl animate-slide-in"
→
className="relative z-10 flex flex-col w-[260px] bg-[#1C1C1E] min-h-screen shadow-xl animate-slide-in"
```

### 1.5 Sidebar header
```
className="p-4 border-b border-gray-200"
→
className="p-4 border-b border-[#3A3A3E]"
```

```
className="font-semibold text-[13px] text-stone-900 truncate"
→
className="font-semibold text-[13px] text-[#F0F0EC] truncate"
```

### 1.6 Sidebar grup başlıkları
```
className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400"
→
className="px-4 py-1 text-[10px] font-semibold uppercase text-[#6B6B6F]"
style={{ letterSpacing: '0.05em' }}
```

### 1.7 Sidebar menü item style objesi
Mevcut:
```js
style={{
  background: active ? '#fff' : 'transparent',
  borderLeftColor: active ? '#FF4F7A' : 'transparent',
  color: active ? '#1C1C1E' : '#6b7280',
  fontWeight: active ? 600 : 400,
}}
```
Yeni:
```js
style={{
  background: active ? '#2A2A2E' : 'transparent',
  borderLeftColor: active ? '#FF4F7A' : 'transparent',
  color: active ? '#FFFFFF' : '#A0A0A0',
  fontWeight: active ? 500 : 400,
  transition: 'background 0.15s ease, color 0.15s ease',
}}
onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#2A2A2E'; e.currentTarget.style.color = '#F0F0EC'; }}}
onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#A0A0A0'; }}}
```

### 1.8 Sidebar footer
```
className="p-4 border-t border-gray-200 text-[11px] text-gray-400 flex items-center gap-1"
→
className="p-4 border-t border-[#3A3A3E] text-[11px] text-[#6B6B6F] flex items-center gap-1"
```

### 1.9 Mobile top bar text renkleri
```
text-stone-900 → text-[#1C1C1E]
text-stone-500 → text-[#6B6B6F]
```

---

## BÖLÜM 2: S STYLE OBJESİ — RestaurantDashboard.tsx

### 2.1 itemsContainer background
```
background: '#fafafa' → background: '#F7F7F5'
```

### 2.2 Eski renk mapping — S objesi ve dosya genelinde
Dosya genelinde şu eski renkleri ara ve değiştir:
```
#fafafa → #F7F7F5
#f5f5f4 → #F7F7F5
#fafaf9 → #F7F7F5
#f3f4f6 → #F7F7F5
#6b7280 → #6B6B6F
#e7e5e4 → #E5E5E3
#d6d3d1 → #E5E5E3
```

---

## BÖLÜM 3: KPI KARTLARI — SuperAdminDashboard.tsx

### 3.1 İkon container'larını kaldır
KPI kartlarında renkli arka planlı yuvarlak ikon container'ları varsa (background: '#FFF0F3' + border-radius: 50% gibi) **kaldır**. Sadece sayı + label kalacak:

```
KPI değer: fontSize 28, fontWeight 700, color '#1C1C1E'
KPI label: fontSize 13, color '#6B6B6F'
```

İkon tamamen kaldır veya küçük (14px) ve text rengiyle aynı (#6B6B6F) yap — renkli container YOK.

### 3.2 Eski renk taraması
```bash
grep -n "stone\|gray-\|slate\|#fafaf\|#f5f5\|#78716\|#44403\|#1c1917\|#a8a29\|#57534\|#e7e5e4\|#d6d3d1\|#f3f4f6\|#6b7280" src/pages/SuperAdminDashboard.tsx
```
Bulunan eski renkleri Bölüm 2.2'deki mapping'e göre değiştir.

### 3.3 Tab stilleri
Aktif tab: `background: '#FF4F7A', color: '#FFFFFF'`
Pasif tab: `background: 'transparent', color: '#6B6B6F'`

---

## BÖLÜM 4: NOTIFICATION DROPDOWN — Dashboard.tsx

### 4.1 Çan ikonu ekle
Dashboard.tsx'in header'ındaki sağ tarafta (email + Çıkış yanına) bir çan ikonu ekle.

```tsx
import { Bell } from "@phosphor-icons/react";
```

Çan ikonunun yanında okunmamış bildirim sayısı badge'i göster (küçük kırmızı nokta + sayı).

### 4.2 Notification state
```tsx
const [notifications, setNotifications] = useState<any[]>([]);
const [showNotifDropdown, setShowNotifDropdown] = useState(false);
const unreadCount = notifications.filter(n => !n.is_read).length;
```

### 4.3 Bildirimleri yükle
```tsx
useEffect(() => {
  if (!user) return;
  loadNotifications();
}, [user]);

async function loadNotifications() {
  // Super admin: tüm bildirimler, restaurant: kendi restoranının
  const query = supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);
  
  const { data } = await query;
  setNotifications(data || []);
}
```

### 4.4 Okundu yap
```tsx
async function markAsRead(id: string) {
  await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
}

async function markAllRead() {
  const ids = notifications.filter(n => !n.is_read).map(n => n.id);
  if (ids.length === 0) return;
  await supabase.from('notifications').update({ is_read: true }).in('id', ids);
  setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
}
```

### 4.5 Dropdown UI
Header'da çan ikonunun tıklanmasıyla açılan dropdown:

```tsx
{/* Notification Bell */}
<div style={{ position: 'relative' }}>
  <button
    onClick={() => setShowNotifDropdown(!showNotifDropdown)}
    style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
  >
    <Bell size={20} color="#6B6B6F" />
    {unreadCount > 0 && (
      <span style={{
        position: 'absolute', top: -2, right: -2,
        background: '#EF4444', color: '#fff',
        fontSize: 10, fontWeight: 700,
        borderRadius: 9999, minWidth: 16, height: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 4px',
      }}>{unreadCount}</span>
    )}
  </button>

  {showNotifDropdown && (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowNotifDropdown(false)} />
      <div style={{
        position: 'absolute', right: 0, top: '100%', marginTop: 8,
        width: 360, maxHeight: 400, overflowY: 'auto',
        background: '#FFFFFF', border: '1px solid #E5E5E3',
        borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        zIndex: 50,
      }}>
        {/* Header */}
        <div style={{
          padding: '12px 16px', borderBottom: '1px solid #E5E5E3',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#1C1C1E' }}>Bildirimler</span>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              style={{ fontSize: 12, color: '#FF4F7A', background: 'none', border: 'none', cursor: 'pointer' }}
            >Tümünü okundu yap</button>
          )}
        </div>

        {/* List */}
        {notifications.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#A0A0A0', fontSize: 13 }}>
            Bildirim yok
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              onClick={() => markAsRead(n.id)}
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #F7F7F5',
                cursor: 'pointer',
                background: n.is_read ? '#FFFFFF' : '#FFF0F3',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#F7F7F5'}
              onMouseLeave={e => e.currentTarget.style.background = n.is_read ? '#FFFFFF' : '#FFF0F3'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: n.is_read ? 400 : 600, color: '#1C1C1E' }}>{n.title}</div>
                  {n.message && (
                    <div style={{ fontSize: 12, color: '#6B6B6F', marginTop: 2, fontFamily: "'Manrope', sans-serif" }}>{n.message}</div>
                  )}
                </div>
                {!n.is_read && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF4F7A', flexShrink: 0, marginTop: 4 }} />
                )}
              </div>
              <div style={{ fontSize: 11, color: '#A0A0A0', marginTop: 4 }}>
                {new Date(n.created_at).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )}
</div>
```

### 4.6 Okunmamış bildirim pembe nokta
Okunmamış bildirimde **kırmızı badge değil, pembe (#FF4F7A) nokta** kullan. Kırmızı sadece hata/uyarı için.

Çan badge'i (sayı göstergesi) için de:
```
background: '#FF4F7A' (kırmızı #EF4444 DEĞİL)
```

---

## BÖLÜM 5: YAN BİLEŞENLER

### 5.1 Eski renkleri temizle
```bash
grep -rn "#fafafa\|#f5f5f4\|#fafaf9\|#f3f4f6\|#e7e5e4\|#d6d3d1\|#78716c\|#57534e\|#44403c\|#a8a29e\|#6b7280\|text-stone-\|text-gray-[4-9]00\|bg-stone-\|bg-gray-50\|border-gray-200\|border-stone-200" src/components/ src/pages/ --include="*.tsx" | grep -v node_modules | grep -v PublicMenu | grep -v MenuPage | grep -v public-menu
```

Her sonucu palet tablosuna göre güncelle. Mapping:
```
#fafafa → #F7F7F5
#f5f5f4 → #F7F7F5
#fafaf9 → #F7F7F5
#f3f4f6 → #F7F7F5
#e7e5e4 → #E5E5E3
#d6d3d1 → #E5E5E3
#78716c → #6B6B6F
#57534e → #6B6B6F
#44403c → #2D2D2F
#a8a29e → #A0A0A0
#6b7280 → #6B6B6F
text-stone-900 → text-[#1C1C1E]
text-stone-700 → text-[#2D2D2F]
text-stone-600 → text-[#6B6B6F]
text-stone-500 → text-[#6B6B6F]
text-stone-400 → text-[#A0A0A0]
text-gray-900 → text-[#1C1C1E]
text-gray-700 → text-[#2D2D2F]
text-gray-600 → text-[#6B6B6F]
text-gray-500 → text-[#6B6B6F]
text-gray-400 → text-[#A0A0A0]
bg-stone-50 → bg-[#F7F7F5]
bg-gray-50 → bg-[#F7F7F5]
border-gray-200 → border-[#E5E5E3]
border-stone-200 → border-[#E5E5E3]
```

### 5.2 Mavi/amber/mor badge'leri kaldır
Herhangi bir yerde `#3B82F6` (mavi), `#F59E0B` (amber), `#DBEAFE`, `#FEF3C7` gibi renkler varsa, bunları nötr veya pembe badge'e çevir:
- Bilgi badge → nötr: bg #F7F7F5, text #6B6B6F
- Uyarı badge → nötr: bg #F7F7F5, text #6B6B6F (sadece gerçek hata ise kırmızı)

---

## BÖLÜM 6: LANDING PAGE

### 6.1 Section arka planları
```bash
grep -rn "bg-stone-50\|bg-gray-50\|bg-slate-50\|bg-neutral-50" src/components/HeroSection.tsx src/components/FeaturesSection.tsx src/components/PricingSection.tsx src/components/RoadmapSection.tsx src/components/TestimonialsSection.tsx src/components/FAQSection.tsx src/components/HowItWorks.tsx 2>/dev/null
```
Bulunan → `bg-[#F7F7F5]`

### 6.2 Text renkleri
Aynı mapping (Bölüm 5.1). Footer'a DOKUNMA.

### 6.3 Font
Playfair Display referanslarını kaldır, Inter ile değiştir. Açıklama text'lerine Manrope.

---

## UYGULAMA SIRASI

1. Font kurulumu (npm install + import'lar + Playfair kaldır)
2. RestaurantDashboard sidebar (Bölüm 1)
3. RestaurantDashboard S objesi ve renkler (Bölüm 2)
4. SuperAdminDashboard (Bölüm 3)
5. Dashboard.tsx notification dropdown (Bölüm 4)
6. Yan bileşenler renk temizliği (Bölüm 5)
7. Landing page (Bölüm 6)
8. Toplu tarama — kaçan eski renkler
9. `npm run build` — hata varsa düzelt

---

## DOKUNMA LİSTESİ

- src/pages/PublicMenuPage.tsx
- src/components/PublicMenu*
- src/components/MenuPage*
- /menu/ route'undaki tüm bileşenler
- Footer bileşeni (koyu tema aynen kalacak)

---

## KONTROL LİSTESİ

- [ ] Sidebar charcoal (#1C1C1E), ikon YOK, sadece text
- [ ] Sidebar hover/active düzgün çalışıyor
- [ ] Ana arka plan off-white (#F7F7F5)
- [ ] Kartlar beyaz, tek tip border + gölge
- [ ] Primary butonlar pembe (#FF4F7A)
- [ ] Font: Inter genel, Manrope sadece açıklamalar, Playfair YOK
- [ ] KPI kartlarında renkli ikon container YOK
- [ ] Notification çan ikonu + dropdown çalışıyor
- [ ] Okundu/okunmadı durumu çalışıyor
- [ ] Mavi/amber/mor renkler YOK — sadece pembe, charcoal, off-white + kırmızı hata + yeşil başarı
- [ ] Eski stone/gray Tailwind class'ları temizlendi
- [ ] Public menüye DOKUNULMADI
- [ ] npm run build başarılı
