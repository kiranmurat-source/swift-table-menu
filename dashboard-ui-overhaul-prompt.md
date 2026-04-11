# TABBLED — Dashboard UI/UX Renk Paleti Overhaul

## GÖREV

Dashboard'un (admin panel), super admin panel, login sayfası ve landing page'in tüm renk paletini ve görsel stilini aşağıdaki design token'lara göre elden geçir. **Public menü sayfalarına DOKUNMA.**

## PROJE YOLU
```
/opt/khp/tabbled/
```

## DESIGN TOKENS — YENİ PALET

```
Off-White (arka plan):     #F7F7F5
Charcoal (sidebar, text):  #1C1C1E
Charcoal Light (hover bg): #2A2A2E
Charcoal Muted (subtle):  #3A3A3E
Off-White Text:            #F0F0EC
Muted Text (koyu zemin):   #A0A0A0
Body Text (açık zemin):    #2D2D2F
Subtle Text (açık zemin):  #6B6B6F
Strawberry Pink (CTA):     #FF4F7A
Strawberry Hover:          #E8456E
Strawberry Light (bg):     #FFF0F3
Border (açık zemin):       #E5E5E3
Border (koyu zemin):       #3A3A3E
Card Background:           #FFFFFF
Success:                   #22C55E
Warning:                   #F59E0B
Error:                     #EF4444
Info:                      #3B82F6
```

## KURALLAR

### 1. Genel Arka Plan
- Tüm dashboard sayfalarının ana arka planı: `#F7F7F5` (off-white)
- Landing page arka planı da `#F7F7F5` olacak
- Login sayfası arka planı: `#F7F7F5`
- Kartlar/paneller: `#FFFFFF` (beyaz), hafif border `#E5E5E3`, gölge `box-shadow: 0 1px 3px rgba(0,0,0,0.06)`

### 2. Sidebar (Sol Menü — 220px)
- Arka plan: `#1C1C1E` (charcoal)
- Logo: Mevcut pembe text logo'yu CSS ile beyazlaştır → `filter: brightness(0) invert(1)`
- Menü item'ları:
  - **Normal:** `color: #A0A0A0`, `font-weight: 400`
  - **Hover:** `background: #2A2A2E`, `color: #F0F0EC`, `border-radius: 8px`
  - **Aktif (seçili):** `background: #2A2A2E`, `color: #FFFFFF`, `font-weight: 500`, sol kenar: `border-left: 3px solid #FF4F7A`
  - **Grup başlıkları:** `color: #6B6B6F`, `font-size: 11px`, `text-transform: uppercase`, `letter-spacing: 0.05em`, `font-weight: 600`
- Sidebar alt kısım (kullanıcı bilgisi / çıkış): `border-top: 1px solid #3A3A3E`
- İkon renkleri: item'ın text rengiyle aynı (inherit)
- Padding: item'lar `padding: 8px 16px`, sidebar genel `padding: 16px 12px`

### 3. Üst Bar (Top Bar / Header)
- Arka plan: `#FFFFFF`
- Alt border: `1px solid #E5E5E3`
- Sayfa başlığı: `color: #1C1C1E`, `font-weight: 600`, `font-size: 18px`
- Sağ taraftaki kullanıcı adı/avatar: `color: #2D2D2F`
- Bildirim ikonu: `color: #6B6B6F`, hover'da `color: #1C1C1E`

### 4. Butonlar (CTA)
- **Primary (ana CTA):**
  - `background: #FF4F7A`, `color: #FFFFFF`, `border: none`
  - `border-radius: 8px`, `font-weight: 500`
  - `padding: 10px 24px` (yatay = 2× dikey)
  - Hover: `background: #E8456E`
  - Active/Pressed: `background: #D63D62`
  - Disabled: `opacity: 0.5`, `cursor: not-allowed`
  - Loading: spinner göster, text'i koru

- **Secondary (ikincil):**
  - `background: transparent`, `color: #FF4F7A`, `border: 1.5px solid #FF4F7A`
  - `border-radius: 8px`
  - Hover: `background: #FFF0F3`
  - Active: `background: #FFE0E8`

- **Ghost (metin butonu):**
  - `background: transparent`, `color: #6B6B6F`, `border: none`
  - Hover: `background: #F0F0EC`, `color: #1C1C1E`

- **Danger (silme/tehlike):**
  - `background: #EF4444`, `color: #FFFFFF`
  - Hover: `background: #DC2626`

### 5. Form Elemanları (Input, Select, Textarea)
- Default: `border: 1px solid #E5E5E3`, `background: #FFFFFF`, `color: #1C1C1E`, `border-radius: 8px`
- Placeholder: `color: #A0A0A0`
- Focus: `border-color: #FF4F7A`, `box-shadow: 0 0 0 3px rgba(255,79,122,0.1)`, outline none
- Error: `border-color: #EF4444`, `box-shadow: 0 0 0 3px rgba(239,68,68,0.1)`
- Label: `color: #2D2D2F`, `font-weight: 500`, `font-size: 14px`, `margin-bottom: 4px`

### 6. Tablolar
- Header row: `background: #F7F7F5`, `color: #6B6B6F`, `font-weight: 600`, `font-size: 12px`, `text-transform: uppercase`, `letter-spacing: 0.03em`
- Body row: `background: #FFFFFF`, `color: #2D2D2F`
- Row hover: `background: #F7F7F5`
- Row border: `border-bottom: 1px solid #E5E5E3`
- Alternatif satır renklendirmesi YAPMA — hover yeterli

### 7. Kartlar & Paneller
- Arka plan: `#FFFFFF`
- Border: `1px solid #E5E5E3`
- Border-radius: `12px`
- Gölge: `box-shadow: 0 1px 3px rgba(0,0,0,0.06)`
- Kart başlığı: `color: #1C1C1E`, `font-weight: 600`
- Kart alt text: `color: #6B6B6F`
- Kart padding: `24px`

### 8. Badge / Chip / Tag
- Aktif/Başarı: `background: #DCFCE7`, `color: #166534`
- Uyarı: `background: #FEF3C7`, `color: #92400E`
- Hata/Pasif: `background: #FEE2E2`, `color: #991B1B`
- Bilgi: `background: #DBEAFE`, `color: #1E40AF`
- Nötr: `background: #F3F4F6`, `color: #374151`
- Border-radius: `9999px` (pill), padding: `4px 12px`, font-size: `12px`, font-weight: `500`

### 9. Modal / Dialog
- Overlay: `background: rgba(0,0,0,0.5)`, `backdrop-filter: blur(4px)`
- Modal arka plan: `#FFFFFF`
- Border-radius: `16px`
- Padding: `32px`
- Başlık: `color: #1C1C1E`, `font-weight: 600`, `font-size: 20px`
- Kapat butonu: `color: #6B6B6F`, hover `color: #1C1C1E`

### 10. Toast / Bildirim
- Başarı: Sol border `3px solid #22C55E`, ikon yeşil
- Hata: Sol border `3px solid #EF4444`, ikon kırmızı
- Uyarı: Sol border `3px solid #F59E0B`, ikon amber
- Bilgi: Sol border `3px solid #3B82F6`, ikon mavi
- Arka plan: `#FFFFFF`, gölge: `box-shadow: 0 4px 12px rgba(0,0,0,0.1)`

### 11. Tipografi (Dashboard İçin)
- Sayfa başlıkları: `font-size: 24px`, `font-weight: 600`, `color: #1C1C1E`, `letter-spacing: -0.02em`
- Bölüm başlıkları: `font-size: 16px`, `font-weight: 600`, `color: #1C1C1E`
- Body text: `font-size: 14px`, `color: #2D2D2F`, `line-height: 1.5`
- Subtle/secondary text: `font-size: 13px`, `color: #6B6B6F`
- Küçük etiketler: `font-size: 12px`, `color: #6B6B6F`
- Font family değişmiyor: Playfair Display (başlıklar) + Inter (body) aynen kalıyor

### 12. Super Admin Dashboard Ek Kurallar
- KPI kartları: Beyaz kart üzerinde, ikon `#FF4F7A` arka plan `#FFF0F3` rounded circle
- KPI değer: `font-size: 28px`, `font-weight: 700`, `color: #1C1C1E`
- KPI label: `font-size: 13px`, `color: #6B6B6F`
- Tablo ve listeler yukarıdaki genel tablo kurallarını takip eder

### 13. Login Sayfası
- Arka plan: `#F7F7F5`
- Kart: `#FFFFFF`, `border-radius: 16px`, `box-shadow: 0 4px 24px rgba(0,0,0,0.08)`
- Logo: Normal pembe text logo (açık zemin üzerinde)
- Input'lar: Genel form kurallarını takip et
- Giriş butonu: Primary CTA stili (strawberry pink)
- "Şifremi unuttum" vb. linkler: `color: #FF4F7A`

### 14. Landing Page Güncellemeler
- Genel arka plan: `#FFFFFF` → `#F7F7F5` olacak bölüm arası geçişlerde
- Navbar arka plan: scroll sonrası `background: rgba(255,255,255,0.95)` + `backdrop-filter: blur(12px)` aynen kalabilir ama zemin `#FFFFFF` olsun
- CTA butonları zaten pembe — aynen kalıyor
- Kart arka planları: zaten beyaz — `#FFFFFF` kalacak, off-white zemin üzerinde doğal kontrast
- Footer arka plan: Koyu kalabilir (mevcut charcoal/siyah aynen devam)
- **DİKKAT:** Landing page'deki section'ların arka plan renklerini incele, bazıları `bg-gray-50`, `bg-slate-50` vs. olabilir — hepsini `#F7F7F5` ile uyumlu hale getir. Kontrastı artırmak için bazı section'lar `#FFFFFF` kalabilir (alternatif section renklendirme: off-white → beyaz → off-white)

### 15. Mobil Bottom Nav (Dashboard Mobil)
- Arka plan: `#1C1C1E` (sidebar ile aynı charcoal)
- İkon normal: `color: #A0A0A0`
- İkon aktif: `color: #FF4F7A`
- Label normal: `color: #A0A0A0`, `font-size: 10px`
- Label aktif: `color: #FF4F7A`
- `border-top: 1px solid #3A3A3E`

---

## UYGULAMA PLANI

### Adım 1: CSS Değişkenleri Oluştur
`src/index.css` veya uygun global CSS dosyasında yeni CSS custom properties tanımla:

```css
:root {
  /* Dashboard Palette */
  --db-bg: #F7F7F5;
  --db-card: #FFFFFF;
  --db-sidebar: #1C1C1E;
  --db-sidebar-hover: #2A2A2E;
  --db-sidebar-border: #3A3A3E;
  --db-sidebar-text: #A0A0A0;
  --db-sidebar-text-active: #FFFFFF;
  --db-sidebar-text-hover: #F0F0EC;
  --db-text-primary: #1C1C1E;
  --db-text-body: #2D2D2F;
  --db-text-subtle: #6B6B6F;
  --db-text-muted: #A0A0A0;
  --db-border: #E5E5E3;
  --db-pink: #FF4F7A;
  --db-pink-hover: #E8456E;
  --db-pink-pressed: #D63D62;
  --db-pink-light: #FFF0F3;
  --db-success: #22C55E;
  --db-warning: #F59E0B;
  --db-error: #EF4444;
  --db-info: #3B82F6;
  --db-shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
  --db-shadow-md: 0 4px 12px rgba(0,0,0,0.1);
  --db-shadow-lg: 0 4px 24px rgba(0,0,0,0.08);
}
```

### Adım 2: Sidebar Güncelle
İlgili sidebar bileşenini bul (muhtemelen `src/components/` altında). Inline style veya className güncellemesi yap:
- Sidebar container bg, text renkleri
- Logo'ya `filter: brightness(0) invert(1)` ekle
- Menü item hover/active durumları
- Grup başlıkları stillemesi
- Mobil bottom nav için aynı charcoal palet

### Adım 3: Top Bar / Header Güncelle
- Beyaz arka plan, alt border, sayfa başlığı rengi
- Kullanıcı bilgisi, bildirim ikonu renkleri

### Adım 4: Ana İçerik Alanı
- Dashboard wrapper/container arka planını `#F7F7F5` yap
- Tüm kartları beyaz bg + border + shadow ile güncelle
- Tablo stillerini güncelle

### Adım 5: Buton Stilleri
- Tüm primary butonları strawberry pink yap
- Secondary, ghost, danger buton varyantlarını uygula
- Hover/active/disabled durumlarını ekle

### Adım 6: Form Elemanları
- Input, select, textarea'lar: border, focus ring, placeholder renkleri
- Label'lar: renk ve ağırlık

### Adım 7: Badge, Toast, Modal
- Badge renk şemasını güncelle
- Toast bildirimlerinde sol border + ikon rengi
- Modal overlay ve stil güncellemesi

### Adım 8: Login Sayfası
- Arka plan off-white
- Login kartı beyaz, büyük border-radius, gölge
- Buton ve linkler pembe

### Adım 9: Landing Page
- Bölüm arka planlarını off-white / beyaz alternasyonuna çevir
- CTA butonları zaten pembe — dokunma
- Section bg renklerini taramak için grep kullan:
  ```bash
  grep -rn "bg-gray\|bg-slate\|bg-zinc\|bg-neutral\|bg-stone\|background.*#f\|background.*rgb" src/ --include="*.tsx" --include="*.css" | grep -v node_modules | grep -v "public-menu\|PublicMenu\|MenuPage"
  ```

### Adım 10: Test ve Doğrulama
```bash
cd /opt/khp/tabbled
npm run build
```
Build başarılı olursa bildir, hata varsa düzelt.

---

## ÖNEMLİ NOTLAR

1. **Public menüye DOKUNMA** — `PublicMenuPage`, `MenuPage`, `PublicMenu` ve `/menu/` altındaki hiçbir bileşene dokunma
2. **Mevcut shadcn/ui bileşenlerini koru** — sadece renk/stil override'ları yap, bileşen yapısını değiştirme
3. **Tailwind class'ları varsa** CSS custom property'lere çevir veya inline style kullan — mevcut pattern'a uyum sağla
4. **4-nokta spacing sistemi** — tüm boşluklar 4'ün katı (4, 8, 12, 16, 20, 24, 32px)
5. **Transition ekle** — renk değişimlerinde `transition: all 0.15s ease` veya `transition: background 0.15s ease, color 0.15s ease`
6. **Grep ile tara** — değişiklik öncesi ilgili dosyaları bul:
   ```bash
   grep -rn "sidebar\|Sidebar" src/ --include="*.tsx" -l
   grep -rn "bg-\[#\|background" src/pages/ src/components/ --include="*.tsx" -l 2>/dev/null
   ```
7. **Bir dosyayı değiştirmeden önce oku** — mevcut kodu anla, sonra değiştir
8. **Build kırmadan ilerle** — her major adımdan sonra `npm run build` çalıştır

---

## KONTROL LİSTESİ

Tamamladığında şu soruları evet ile cevaplayabilmelisin:

- [ ] Sidebar charcoal mu? (#1C1C1E)
- [ ] Sidebar'daki logo beyaz mı? (filter: brightness(0) invert(1))
- [ ] Sidebar menü item hover/active durumları çalışıyor mu?
- [ ] Dashboard ana arka plan off-white mi? (#F7F7F5)
- [ ] Kartlar beyaz + border + gölge mi?
- [ ] Primary butonlar strawberry pink mi? (#FF4F7A)
- [ ] Input focus ring pembe mi?
- [ ] Login sayfası off-white arka plan + beyaz kart mı?
- [ ] Landing page section arka planları uyumlu mu?
- [ ] Mobil bottom nav charcoal mu?
- [ ] Public menü sayfalarına DOKUNULMADI mı?
- [ ] Build başarılı mı? (npm run build)
