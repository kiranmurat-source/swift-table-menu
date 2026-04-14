# TABBLED — Dashboard Polish & Teknik Borç Prompt
## 5 Görev: Font Fix + Sosyal İkonlar + Feedback→CRM + Dashboard Tema Uyumu

---

## PROJE BAĞLAMI

- **Repo:** /opt/khp/tabbled/
- **Stack:** React + Vite + TypeScript + shadcn/ui
- **Font:** Roboto (tek font — Bold 700, Medium 500, Regular 400, Light 300)
- **İkon:** Phosphor Icons (@phosphor-icons/react) — sadece Thin weight
- **Admin tema:** `src/lib/adminTheme.ts` — light/dark palette sistemi (admin_theme kolonu DB'de)
- **Marka renkleri:** #FF4F7A (pembe — sadece CTA + aktif state), #1C1C1E (charcoal), #F7F7F8 (açık gri)
- **Emoji yasağı:** Kesinlikle emoji kullanma, tüm ikonlar Phosphor Icons Thin weight

---

## MEVCUT DURUM

- Roboto paketi 14 Nisan'da eklendi ama gerçekten doğru yüklenip yüklenmediği doğrulanmadı
- Playfair Display ve Inter referansları hâlâ kalıntı olabilir
- Admin panelde `adminTheme.ts` palette sistemi var, AnalyticsPanel + CustomersPanel uyumlu
- Kalan paneller (RestaurantAnalytics, WaiterCallsPanel, FeedbackPanel, LikesPanel, DiscountCodesPanel) hâlâ hardcoded renkler kullanıyor olabilir
- Splash ekranında sosyal medya ikonları eksik
- Feedback geldiğinde customers tablosuna otomatik kayıt yok

---

## GÖREV 1: ROBOTO FONT DOĞRULAMA VE FIX

### Kontrol noktaları:
1. `index.html` — Google Fonts import link'inde Roboto olmalı (weight: 300,400,500,700)
2. Eski font import'ları tamamen kaldırılmalı:
   - Playfair Display → SİL
   - Inter → SİL  
   - Montserrat → SİL (varsa)
3. `tailwind.config.ts` veya `tailwind.config.js` — fontFamily.sans = ['Roboto', ...defaultTheme.fontFamily.sans]
4. `src/index.css` — body font-family: 'Roboto', sans-serif
5. Tüm dosyalarda grep yap: `grep -rn "Playfair\|Inter\|Montserrat\|DM Sans\|Nunito" src/` — hiçbir sonuç olmamalı
6. Eğer Tailwind yoksa (inline style kullanılıyor), tüm `fontFamily` inline style'ları kontrol et
7. Google Fonts URL'de gereksiz subset'ler varsa kaldır (cyrillic, greek, math, symbols — sadece latin + latin-ext yeterli)

### Roboto ağırlık rehberi:
- **700 (Bold):** Başlıklar, fiyatlar
- **500 (Medium):** Butonlar, label'lar, alt başlıklar
- **400 (Regular):** Body metin
- **300 (Light):** Sadece menü ürün açıklamaları (min 14px, line-height 1.6+)
- **100 (Thin) ve 900 (Black):** ASLA kullanma

---

## GÖREV 2: SPLASH SOSYAL MEDYA İKONLARI

### Bağlam:
- Public menü splash ekranı (PublicMenu.tsx veya SplashScreen bileşeni)
- Restoran profil bilgilerinde sosyal medya URL'leri var: social_instagram, social_facebook, social_twitter, social_tiktok, social_youtube, social_linkedin, social_website
- Şu an splash ekranında bu ikonlar gösterilmiyor

### Yapılacak:
1. Splash ekranında restoran logosunun altına sosyal medya ikonları ekle
2. Phosphor Icons Thin weight kullan:
   - Instagram: `InstagramLogo`
   - Facebook: `FacebookLogo`
   - Twitter/X: `XLogo` (veya `TwitterLogo`)
   - TikTok: `TiktokLogo`
   - YouTube: `YoutubeLogo`
   - LinkedIn: `LinkedinLogo`
   - Website: `Globe`
3. Sadece değeri dolu olanları göster (boş URL → ikon gizle)
4. İkon boyutu: 24px, renk: tema uyumlu (white tema → #1C1C1E, black tema → #FFFFFF)
5. Yatay sıralı, gap: 16px, flex center
6. Tıklanınca yeni sekmede aç (target="_blank" rel="noopener noreferrer")

---

## GÖREV 3: FEEDBACK → OTOMATİK MÜŞTERİ EKLEME

### Bağlam:
- `feedback` tablosu: customer_name, customer_email, customer_phone, table_number, rating, comment
- `customers` tablosu: restaurant_id, name, email, phone, tags[], notes, visit_count, last_visit
- Feedback geldiğinde müşteri bilgileri customers'a otomatik eklenmelidir

### Yapılacak:
1. Feedback insert sonrası (frontend tarafında, feedback submit başarılı olunca):
   - customer_name veya customer_email veya customer_phone doluysa:
   - Önce customers'ta aynı restaurant_id + (email VEYA phone) ile mevcut kayıt var mı kontrol et
   - Varsa: `visit_count` +1 yap, `last_visit` güncelle
   - Yoksa: yeni customer oluştur:
     - name: customer_name
     - email: customer_email (varsa)
     - phone: customer_phone (varsa)
     - tags: ['feedback']
     - notes: `İlk geri bildirim: ${rating}★`
     - visit_count: 1
     - last_visit: now()
2. Hiçbir müşteri alanı dolmadıysa (anonim feedback) → customers'a ekleme yapma
3. Bu mantık frontend'de, feedback submit success callback'inde olmalı
4. Hata olursa sessizce logla, feedback submit'i etkilemesin (try-catch)

---

## GÖREV 4: DASHBOARD PANELLERİ TEMA UYUMU

### Bağlam:
- `src/lib/adminTheme.ts` dosyasında tema palette sistemi var
- AnalyticsPanel ve CustomersPanel zaten tema uyumlu
- Kalan paneller hardcoded renkler kullanıyor olabilir

### Tema uyumlu yapılacak paneller:
1. **RestaurantAnalytics.tsx** (ana dashboard kartları)
2. **WaiterCallsPanel.tsx** (garson çağrıları)
3. **FeedbackPanel.tsx** (geri bildirimler)
4. **LikesPanel.tsx** (beğeniler)
5. **DiscountCodesPanel.tsx** (indirim kodları)

### Uygulama pattern'i (AnalyticsPanel'den referans al):
```typescript
import { getAdminTheme } from '@/lib/adminTheme';

// Bileşen içinde:
const theme = getAdminTheme(adminTheme); // adminTheme prop olarak gelir ('light' | 'dark')

// Kullanım:
style={{ 
  backgroundColor: theme.cardBg, 
  color: theme.text,
  borderColor: theme.border 
}}
```

### Kontrol noktaları:
- Hardcoded `#fff`, `#000`, `white`, `black`, `#f5f5f5`, `bg-white`, `text-gray-*` gibi değerler → tema değişkenleriyle değiştir
- Kart arka planları: `theme.cardBg`
- Metin renkleri: `theme.text` (ana), `theme.textSecondary` (ikincil)
- Border: `theme.border`
- Hover: `theme.hover`
- Ana arka plan: `theme.bg`

### Her panelde:
1. adminTheme prop'unu al (zaten RestaurantDashboard'dan geçiyor olabilir — kontrol et)
2. getAdminTheme() çağır
3. Tüm hardcoded renkleri tema değişkenleriyle değiştir
4. Light modda okunur, dark modda okunur olduğunu doğrula

---

## GÖREV 5: CHART VE ISI HARİTASI RENK VARYANTLARI

### Bağlam:
- AnalyticsPanel'de bar chart ve ısı haritası var
- Bu grafiklerdeki renkler light/dark moda göre ayarlanmalı

### Yapılacak:
1. `adminTheme.ts`'e chart renkleri ekle (yoksa):
```typescript
// Light tema
chartBar: '#FF4F7A',        // pembe bar
chartBarHover: '#E63E66',   // hover
chartGrid: '#E5E5E5',       // grid çizgileri
chartLabel: '#666666',      // eksen label
heatmapLow: '#FFF0F3',      // düşük yoğunluk
heatmapMid: '#FFB3C6',      // orta
heatmapHigh: '#FF4F7A',     // yüksek

// Dark tema
chartBar: '#FF6B8A',        // açık pembe bar (dark bg'de daha iyi görünür)
chartBarHover: '#FF8FA8',
chartGrid: '#333333',
chartLabel: '#999999',
heatmapLow: '#2A1520',      // koyu düşük
heatmapMid: '#5C2040',      // koyu orta
heatmapHigh: '#FF4F7A',     // aynı yüksek
```
2. AnalyticsPanel'deki chart ve ısı haritası bileşenlerinde bu değerleri kullan
3. Garson çağrıları bar chart'ı da aynı pattern'e çevir (WaiterCallsPanel)

---

## GENEL KURALLAR

1. **Emoji YASAK** — hiçbir yerde emoji kullanma
2. **Phosphor Icons sadece Thin weight** — `<Icon weight="thin" />`
3. **shadcn/ui internal Lucide ikonlarına DOKUNMA**
4. **Marka renkleri:** #FF4F7A (pembe), #1C1C1E (charcoal), #F7F7F8 (açık gri)
5. **console.log production'da olmamalı** — import.meta.env.DEV kontrolü
6. **TypeScript strict** — any kullanma, tip tanımla
7. **Her dosyayı kaydetmeden önce oku, anla, sonra değiştir**

---

## TEST CHECKLIST

- [ ] `npm run build` hatasız geçiyor
- [ ] Tarayıcı DevTools → Computed Styles → body font: Roboto
- [ ] Playfair/Inter/Montserrat referansı yok: `grep -rn "Playfair\|Inter\|Montserrat" src/`
- [ ] Splash ekranında sosyal medya ikonları görünüyor (dolu URL varsa)
- [ ] Boş URL'li sosyal medya ikonları gizli
- [ ] Feedback gönderince customers tablosunda yeni kayıt oluşuyor
- [ ] Aynı email/phone ile ikinci feedback → visit_count +1
- [ ] Anonim feedback → customer oluşturmuyor
- [ ] Admin panel light modda tüm paneller okunur
- [ ] Admin panel dark modda tüm paneller okunur (beyaz metin / koyu kart)
- [ ] Bar chart light/dark modda renkler uygun
- [ ] Isı haritası light/dark modda renkler uygun

---

## ÖNCELİK SIRASI

1. Roboto font fix (en hızlı, en temel)
2. Splash sosyal medya ikonları (küçük iş)
3. Feedback → müşteri ekleme (orta iş)
4. Dashboard panel tema uyumu (en büyük iş — 5 panel)
5. Chart renk varyantları (tema uyumuyla birlikte yapılabilir)

---

## DOSYA HARİTASI (muhtemel dosyalar)

```
index.html                          → Font import kontrol
src/index.css                       → Font-family kontrol
tailwind.config.ts                  → Font config
src/lib/adminTheme.ts               → Tema palette + chart renkleri
src/pages/PublicMenu.tsx             → Splash sosyal ikonlar
src/components/SplashScreen.tsx      → (varsa) Splash bileşeni
src/components/FeedbackModal.tsx     → Feedback submit → müşteri ekleme
src/pages/RestaurantDashboard.tsx    → Ana dashboard (tema prop geçiyor mu?)
src/components/RestaurantAnalytics.tsx → Dashboard kartları
src/components/WaiterCallsPanel.tsx  → Garson çağrıları paneli
src/components/FeedbackPanel.tsx     → Geri bildirim paneli
src/components/LikesPanel.tsx        → Beğeniler paneli
src/components/DiscountCodesPanel.tsx → İndirim kodları paneli
src/components/AnalyticsPanel.tsx    → Analytics (zaten tema uyumlu — referans)
src/components/CustomersPanel.tsx    → Müşteriler (zaten tema uyumlu — referans)
```
