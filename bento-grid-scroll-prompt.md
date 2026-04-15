# CLAUDE CODE PROMPT — Bento Grid + Scroll Animasyonu
## Public Menü Kategori Kartları Redesign

---

## PROJE BAĞLAMI

Tabbled (tabbled.com) bir QR dijital menü SaaS platformu. React + Vite + TypeScript + shadcn/ui. Supabase PostgreSQL backend. Vercel deploy.

- **Repo:** /opt/khp/tabbled/
- **Supabase:** qmnrawqvkwehufebbkxp.supabase.co
- **İkon:** Phosphor Icons (@phosphor-icons/react) — Thin weight only
- **Font:** Roboto (Bold/Medium/Regular/Light)
- **Tema:** 2 tema (white + black)
- **Marka:** #FF4F7A (pembe), #1C1C1E (koyu), #F7F7F8 (açık)

---

## MEVCUT DURUM

Public menüde `menu_view_mode` ile 3 görünüm modu var:
- `categories` — Kategori grid view (büyük fotoğraflı kategori kartları)
- `grid` — 2 sütunlu ürün grid
- `list` — Yatay ürün listesi

Admin panelde `restaurants.menu_view_mode` ile seçiliyor (public'te toggle yok).

**Şu an `categories` modundaki kartlar:** Basit grid, kategori fotoğrafı + isim + açıklama. Düz bir layout.

---

## GÖREV

`categories` görünüm modunu **Bento/Masonry layout**'a çevir ve tüm kategorilere **scroll animasyonu** ekle. Foost (foost.ae) tarzı modern, etkileyici görünüm.

---

## BENTO GRID DETAYLARI

### Layout Pattern (Sabit Tekrar)
Kategoriler sırasıyla şu pattern'de yerleşir:

```
[  FULL-WIDTH  ]        ← 1. kategori: tam genişlik
[ HALF ][ HALF ]        ← 2-3. kategoriler: yan yana
[ HALF ][ HALF ]        ← 4-5. kategoriler: yan yana
[  FULL-WIDTH  ]        ← 6. kategori: tam genişlik
[ HALF ][ HALF ]        ← 7-8. kategoriler: yan yana
[ HALF ][ HALF ]        ← 9-10. kategoriler: yan yana
[  FULL-WIDTH  ]        ← 11. kategori: tekrar full (döngü devam)
...
```

**Pattern mantığı:** Her 5 kategoride bir tekrar:
- index % 5 === 0 → full-width
- diğerleri → half (2'şerli grid)

### Kart Boyutları
- **Full-width:** width 100%, height ~200px
- **Half:** width ~50% (gap dahil), height ~220px
- **Gap:** 8px (SKILL.md'deki 4-nokta sistemi)
- **Kenar padding:** 16px (her iki yanda)

### Kart Tasarımı
- **Arka plan:** Kategori fotoğrafı `object-fit: cover` ile kartı tamamen kaplar
- **Overlay:** Alttan yukarı doğru koyu gradient (SKILL.md #10 — siyah overlay değil, linear-gradient)
  ```css
  background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0) 100%);
  ```
- **Tipografi:** Beyaz metin, sol alt köşede
  - Kategori adı: Roboto Bold, 18px (full-width) / 16px (half)
  - Kategori açıklaması: Roboto Light, 13px, opacity 0.85, max 2 satır, text-overflow ellipsis
  - Ürün sayısı: Roboto Regular, 12px, opacity 0.7 — "12 ürün" / "12 items"
- **Köşe radius:** 12px (SKILL.md)
- **Fotoğraf yoksa:** Koyu gradient arka plan (#1C1C1E → #2C2C2E), sadece metin görünür
- **Border:** Yok (fotoğraf kartlarda gereksiz)

### Tıklama Davranışı
- Mevcut davranış korunacak: kategoriye tıklayınca o kategorinin ürünlerine geçiş
- Hover: scale(1.02) + shadow-lg (sadece desktop, mobilde yok)

### Responsive
- Mobil (< 640px): Tam genişlik padding 12px, half kartlar gap 6px
- Desktop (>= 640px): Padding 16px, gap 8px

---

## SCROLL ANİMASYONU DETAYLARI

### Intersection Observer
- Her kategori kartı viewport'a girince animasyon tetiklenir
- **Başlangıç durumu:** `opacity: 0; transform: scale(0.92);`
- **Bitiş durumu:** `opacity: 1; transform: scale(1);`
- **Transition:** `transform 0.5s ease-out, opacity 0.5s ease-out`
- **once: true** — sadece ilk girişte animasyon (yukarı scroll'da tekrar etmez)
- **threshold:** 0.15 (kartın %15'i görününce tetikle)

### Stagger Efekti
- Full-width kartlar: delay yok (0ms)
- 2'li grid'de sol kart: delay 0ms
- 2'li grid'de sağ kart: delay 100ms
- Bu "sırayla belirme" hissi verir

### Implementasyon
- Custom hook: `useScrollAnimation` veya inline `useEffect` + `IntersectionObserver`
- Her kart `ref` alır
- React state ile `isVisible` kontrol edilir
- CSS class toggle veya inline style ile animasyon

```tsx
// Örnek yaklaşım (kopyalama, sadece referans):
const useScrollAnimation = (options = { threshold: 0.15 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target); // once: true
      }
    }, options);
    
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  
  return { ref, isVisible };
};
```

---

## TEMA UYUMU

### White Tema
- Gradient overlay: rgba(0,0,0,...) → standart koyu
- Metin: beyaz (#FFFFFF)
- Fotoğraf yoksa arka plan: #E5E5E5, metin: #1C1C1E (koyu)

### Black Tema
- Gradient overlay: rgba(0,0,0,...) → biraz daha yoğun (0.8 max)
- Metin: beyaz (#FFFFFF)
- Fotoğraf yoksa arka plan: #2C2C2E, metin: #FFFFFF

---

## GENEL KURALLAR

1. **Mevcut dosyaları değiştir**, yeni dosya oluşturma (hook hariç)
2. **Sadece `categories` view mode** etkilenecek — `grid` ve `list` modlarına dokunma
3. **Phosphor Icons Thin weight** — yeni ikon gerekirse Thin kullan
4. **Emoji ikon YASAK** — hiçbir yerde emoji kullanma
5. **shadcn/ui internal Lucide'a dokunma**
6. **4-nokta spacing sistemi** (4, 8, 12, 16, 20, 24, 32px)
7. **TypeScript strict** — any kullanma, tipleri doğru yaz
8. **console.log temizle** — geliştirme logları bırakma

---

## TEST CHECKLIST

- [ ] Categories view mode'da bento layout doğru çalışıyor
- [ ] Pattern: full → half+half → half+half → full → tekrar
- [ ] Fotoğraflı kategoriler: gradient overlay + beyaz metin
- [ ] Fotoğrafsız kategoriler: koyu arka plan + metin
- [ ] Scroll animasyonu: kartlar viewport'a girince fade+scale
- [ ] Stagger: 2'li grid'de sağ kart 100ms gecikmeyle
- [ ] once: true — yukarı scroll'da animasyon tekrarlanmıyor
- [ ] White tema doğru görünüyor
- [ ] Black tema doğru görünüyor
- [ ] Mobilde responsive (tek sütun değil, half kartlar yan yana kalmalı)
- [ ] Kategoriye tıklama çalışıyor (ürünlere geçiş)
- [ ] Desktop hover efekti çalışıyor
- [ ] Grid ve list modları bozulmamış
- [ ] npm run build hatasız

---

## ÖNCELİK SIRASI

1. Bento layout (pattern + kart tasarımı + gradient)
2. Fotoğrafsız fallback
3. Tema uyumu (white + black)
4. Scroll animasyonu (Intersection Observer)
5. Stagger efekti
6. Responsive kontrol
7. Build test
