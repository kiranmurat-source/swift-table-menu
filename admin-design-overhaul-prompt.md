# TABBLED — Admin & Super Admin Dashboard Design Overhaul

## GÖREV

RestaurantDashboard.tsx ve SuperAdminDashboard.tsx dosyalarını yerinde düzenle. Mevcut fonksiyonelliği ve yapıyı koru, sadece görsel katmanı elden geçir.

**YAPMA:**
- Yeni dosya/mockup/demo üretme
- Layout yapısını değiştirme (sidebar sol, content sağ — aynen kalacak)
- Yeni font ekleme — Playfair Display + Inter kalıyor
- Bileşen mantığını (state, fetch, CRUD) değiştirme
- Public menü dosyalarına dokunma

**YAP:**
- Renk paletini CLAUDE.md'deki Tabbled Design System'e göre güncelle
- Sidebar'ı charcoal yap
- Hover/active/focus state'leri düzgün uygula
- Spacing'i 4-nokta sistemine uyumlu hale getir
- Mevcut Tailwind class'larını yeni palette çevir

## PROJE YOLU
```
/opt/khp/tabbled/
```

## REFERANS — CLAUDE.md Design System
```
Sidebar: charcoal #1C1C1E, hover #2A2A2E, aktif item sol border #FF4F7A
Arka plan: off-white #F7F7F5
Kartlar: beyaz #FFFFFF, border #E5E5E3, shadow 0 1px 3px rgba(0,0,0,0.06)
CTA: strawberry pink #FF4F7A, hover #E8456E
Text (açık zemin): #1C1C1E başlık, #2D2D2F body, #6B6B6F subtle
Text (koyu zemin): #F0F0EC aktif, #A0A0A0 normal, #6B6B6F grup başlık
```

---

## BÖLÜM 1: RestaurantDashboard.tsx — SIDEBAR

Sidebar şu anda açık gri (`bg-[#fafafa]`), stone/gray Tailwind renkleri kullanıyor. Charcoal paleta geçir.

### 1.1 Ana container
```
bg-white → bg-[#F7F7F5]
```

### 1.2 Desktop sidebar `<aside>`
```
border-r border-gray-200 bg-[#fafafa] → border-r border-[#3A3A3E] bg-[#1C1C1E]
```

### 1.3 Mobile sidebar `<aside>`
```
bg-[#fafafa] → bg-[#1C1C1E]
```

### 1.4 Sidebar header (restoran adı bölümü)
```
border-b border-gray-200 → border-b border-[#3A3A3E]
text-stone-900 → text-[#F0F0EC]
```

### 1.5 Sidebar grup başlıkları
```
text-gray-400 → text-[#6B6B6F]
```
Ayrıca `letterSpacing: '0.05em'` ekle.

### 1.6 Sidebar menü item'ları — style objesi
Mevcut:
```js
background: active ? '#fff' : 'transparent',
borderLeftColor: active ? '#FF4F7A' : 'transparent',
color: active ? '#1C1C1E' : '#6b7280',
fontWeight: active ? 600 : 400,
```
Yeni:
```js
background: active ? '#2A2A2E' : 'transparent',
borderLeftColor: active ? '#FF4F7A' : 'transparent',
color: active ? '#FFFFFF' : '#A0A0A0',
fontWeight: active ? 500 : 400,
```
Ayrıca butona hover handler ekle:
```js
onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#2A2A2E'; e.currentTarget.style.color = '#F0F0EC'; }}}
onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#A0A0A0'; }}}
```

### 1.7 Sidebar footer
```
border-t border-gray-200 text-gray-400 → border-t border-[#3A3A3E] text-[#6B6B6F]
```

### 1.8 Mobile top bar
```
text-stone-900 → text-[#1C1C1E]
text-stone-500 → text-[#6B6B6F]
```

---

## BÖLÜM 2: RestaurantDashboard.tsx — S STYLE OBJESİ

S objesinde şu değişiklikleri yap:

### 2.1 itemsContainer
```
background: '#fafafa' → background: '#F7F7F5'
```

### 2.2 Tüm S objesi renk kontrolü
S objesini tara, aşağıdaki eski renkleri bul ve değiştir:
```
#fafaf9 → #F7F7F5
#fafafa → #F7F7F5
#f5f5f4 → #F7F7F5
#1c1917 → #1C1C1E
#44403c → #2D2D2F
#78716c → #6B6B6F
#a8a29e → #A0A0A0
#57534e → #6B6B6F
#e7e5e4 → #E5E5E3
#d6d3d1 → #E5E5E3
#f3f4f6 → #F7F7F5
#6b7280 → #6B6B6F
```
Eğer bu renkler S objesinde yoksa atla — zaten güncellenmişlerdir.

---

## BÖLÜM 3: RestaurantDashboard.tsx — İÇERİK ALANI

### 3.1 Kategori akordeon satırları
`catAccordionRow` zaten beyaz bg — doğru. Hover efekti ekle:
```js
onMouseEnter={e => e.currentTarget.style.background = '#F7F7F5'}
onMouseLeave={e => e.currentTarget.style.background = '#fff'}
```
Bu zaten varsa dokunma.

### 3.2 Badge renkleri
Mevcut badge kullanımlarını tara. Doğru anlamsal renkler:
- Aktif/Başarı: `background: '#DCFCE7', color: '#166534'`
- Pasif/Hata: `background: '#FEE2E2', color: '#991B1B'`
- Uyarı: `background: '#FEF3C7', color: '#92400E'`
- Bilgi: `background: '#DBEAFE', color: '#1E40AF'`
- Popüler/Özel: `background: '#FFF0F3', color: '#FF4F7A'`

---

## BÖLÜM 4: SuperAdminDashboard.tsx

Bu dosyanın S objesi zaten büyük ölçüde doğru palette. Şu kontrolleri yap:

### 4.1 S objesi renk taraması
```bash
grep -n "stone\|gray\|slate\|#fafaf\|#f5f5\|#78716\|#44403\|#1c1917\|#a8a29\|#57534\|#e7e5e4\|#d6d3d1" src/pages/SuperAdminDashboard.tsx
```
Bulunan eski renkleri Bölüm 2.2'deki mapping'e göre değiştir.

### 4.2 Tab (sekme) stilleri
Aktif tab:
```js
background: '#FF4F7A', color: '#FFFFFF'
```
Pasif tab:
```js
background: 'transparent', color: '#6B6B6F'
```
Hover (pasif):
```js
background: '#FFF0F3', color: '#FF4F7A'
```

### 4.3 KPI kartları
İkon container'ları:
```js
background: '#FFF0F3', color: '#FF4F7A', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center'
```
KPI değer: `fontSize: 28, fontWeight: 700, color: '#1C1C1E'`
KPI label: `fontSize: 13, color: '#6B6B6F'`

### 4.4 Tablo header
```js
background: '#F7F7F5', color: '#6B6B6F', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em'
```

### 4.5 Tablo satır hover
Tablo satırlarında hover efekti:
```js
onMouseEnter={e => e.currentTarget.style.background = '#F7F7F5'}
onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
```

---

## BÖLÜM 5: YAN BİLEŞENLER

Aşağıdaki dosyalarda eski `#fafafa` ve `#f3f4f6` renklerini güncelle:

### 5.1 src/components/ErrorBoundary.tsx
```
background: '#fafafa' → background: '#F7F7F5'
```

### 5.2 src/components/FeedbackPanel.tsx
```
border: '1px solid #f3f4f6' → border: '1px solid #E5E5E3'
backgroundColor: '#fafafa' → backgroundColor: '#F7F7F5'
```

### 5.3 src/components/LikesPanel.tsx
```
backgroundColor: '#fafafa' → backgroundColor: '#F7F7F5'
backgroundColor: i === 0 ? '#fff1f2' : '#fafafa' → backgroundColor: i === 0 ? '#FFF0F3' : '#F7F7F5'
```

### 5.4 src/components/DiscountCodesPanel.tsx
```
backgroundColor: '#fafafa' → backgroundColor: '#F7F7F5'
```

### 5.5 src/components/RichTextEditor.tsx
```
background: '#f5f5f4' → background: '#F7F7F5'
```

### 5.6 Diğer bileşenler — toplu tarama
```bash
grep -rn "#fafafa\|#f5f5f4\|#fafaf9\|#f3f4f6\|#e7e5e4\|#d6d3d1\|#78716c\|#57534e\|#44403c\|#a8a29e\|text-stone-\|text-gray-[4-9]00\|bg-stone-\|bg-gray-50\|border-gray-200\|border-stone-200" src/components/ src/pages/ --include="*.tsx" | grep -v node_modules | grep -v PublicMenu | grep -v MenuPage | grep -v public-menu
```
Bulunan her sonucu uygun yeni renge çevir. Public menü dosyalarına DOKUNMA.

---

## BÖLÜM 6: LANDING PAGE

Landing page section bileşenlerinde eski Tailwind bg renklerini güncelle:

```bash
grep -rn "bg-stone-50\|bg-gray-50\|bg-slate-50\|bg-neutral-50" src/components/HeroSection.tsx src/components/FeaturesSection.tsx src/components/PricingSection.tsx src/components/RoadmapSection.tsx src/components/TestimonialsSection.tsx src/components/FAQSection.tsx src/components/HowItWorks.tsx 2>/dev/null
```

Bulunan her `bg-stone-50` / `bg-gray-50` → `bg-[#F7F7F5]` ile değiştir.

`text-stone-*` / `text-gray-*` renkleri:
- `text-stone-900` / `text-gray-900` → `text-[#1C1C1E]`
- `text-stone-700` / `text-gray-700` → `text-[#2D2D2F]`
- `text-stone-600` / `text-gray-600` → `text-[#6B6B6F]`
- `text-stone-500` / `text-gray-500` → `text-[#6B6B6F]`
- `text-stone-400` / `text-gray-400` → `text-[#A0A0A0]`
- `border-stone-200` / `border-gray-200` → `border-[#E5E5E3]`

**Footer'a DOKUNMA** — zaten koyu tema, kendi renk sistemi var.

---

## UYGULAMA SIRASI

1. RestaurantDashboard.tsx — sidebar (Bölüm 1)
2. RestaurantDashboard.tsx — S objesi (Bölüm 2)
3. RestaurantDashboard.tsx — içerik alanı (Bölüm 3)
4. SuperAdminDashboard.tsx (Bölüm 4)
5. Yan bileşenler (Bölüm 5)
6. Landing page (Bölüm 6)
7. Toplu tarama — kaçan eski renkler (Bölüm 5.6)
8. `npm run build` — hata varsa düzelt, build başarılı olana kadar devam et

---

## KRİTİK KURALLAR

1. **Dosyayı değiştirmeden önce oku** — mevcut kodu anla
2. **String match ile bul** — satır numarasına güvenme, kayabilir
3. **Fonksiyon mantığına DOKUNMA** — sadece style/className değişiklikleri
4. **Public menü dosyalarına DOKUNMA**
5. **Mockup/demo dosyası ÜRETME** — doğrudan kaynak dosyaları düzenle
6. **Build kır, düzelt** — son adımda `npm run build` çalıştır
