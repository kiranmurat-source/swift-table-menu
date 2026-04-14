# PUBLIC MENÜ DÜZELTMELER — GÖRÜNÜM MODU + GERİ BİLDİRİM
## Claude Code Prompt — 14 Nisan 2026 (v2)

---

## PROJE BAĞLAMI

- **Proje dizini:** /opt/khp/tabbled/
- **Stack:** React + Vite + TypeScript + shadcn/ui (S.* inline styles)
- **Supabase project-ref:** qmnrawqvkwehufebbkxp
- **Public menü:** src/pages/PublicMenu.tsx
- **İkonlar:** Phosphor Icons (@phosphor-icons/react) — SADECE "Thin" ağırlık. Emoji ikon YASAK.
- **Temalar:** white / black (2 tema)
- **Marka renkleri:** #FF4F7A / #1C1C1E / #F7F7F8

---

## GÖREV 1: GÖRÜNÜM MODU TERCİHİ — ADMİN TARAFI

### Konsept
Menü görünüm modu (Kategoriler / Grid / List) müşterinin değil, restoran sahibinin tercihi olmalı. Public menüde toggle OLMAYACAK. Admin panelinden seçilecek.

### DB Değişikliği (AYRI SQL — Supabase Dashboard'dan çalıştırılacak)

```sql
-- restaurants tablosuna menu_view_mode kolonu ekle
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS menu_view_mode TEXT DEFAULT 'categories';
-- Geçerli değerler: 'categories', 'grid', 'list'
```

### Admin Paneli
- **Tema & Profil** (veya Görünüm) bölümünde, tema seçicinin yanına/altına **"Menü Görünümü"** seçeneği ekle
- 3 seçenek radio/select:
  - **Kategoriler** (varsayılan) — büyük kategori kartlarıyla açılış
  - **Grid** — 2 sütun ürün kartları
  - **List** — yatay ürün kartları
- Seçim yapılınca `restaurants.menu_view_mode` güncellenir
- Küçük açıklama: "Müşterilerinizin menüyü nasıl göreceğini seçin"

### Public Menü
- **Toggle ikonlarını KALDIR** (tab bar sağındaki SquaresFour / GridFour / List butonları)
- `restaurant.menu_view_mode` değerine göre menü açılır:
  - `'categories'` → kategori grid ekranı (varsayılan)
  - `'grid'` → 2 sütun ürün kartları
  - `'list'` → yatay ürün kartları
- Müşteri modu değiştiremez — sabit

---

## GÖREV 2: GERİ BİLDİRİM İKONU — SADECE SPLASH EKRAN

### Konsept
Mevcut geri bildirim tab'ı/bölümü menü altından kaldırılacak. Yerine splash ekranın sağ alt köşesinde floating feedback ikonu olacak (Foost referansı).

### Splash Ekranı
- Sağ alt köşeye **floating feedback butonu** ekle:
  - İkon: `ChatCircle` (Phosphor Icons, Thin ağırlık)
  - Arka plan: koyu daire (#1C1C1E veya tema uyumlu)
  - İkon rengi: beyaz
  - Boyut: 48px daire, ikon 24px
  - Konum: `position: fixed`, `bottom: 24px`, `right: 24px` (veya splash layout'a göre absolute)
  - z-index: splash içeriğinin üstünde
- Tıklayınca **mevcut FeedbackModal açılır** (aynı modal, değişiklik yok)
- `feature_feedback` toggle'ı kapalıysa ikon GÖRÜNMESİN

### Menü Sayfası
- Menü içindeki geri bildirim tab'ını / bölümünü / butonunu **KALDIR**
- Feedback sadece splash ekrandan erişilebilir olacak
- FeedbackModal bileşeni korunacak (silinmeyecek, sadece tetikleme noktası değişiyor)

---

## GENEL KURALLAR

1. **Phosphor Icons:** SADECE Thin ağırlık
2. **Emoji YASAK**
3. **S.* inline styles** kullan
4. **DB migration SQL'ini ÇALIŞTIRMA** — dosyaya yaz, Murat çalıştıracak
5. **Mevcut özellikleri BOZMA:** sepet, WhatsApp, garson, beğeni, indirim, video, öneri sistemi
6. **Build test:** `npm run build` — hata yoksa devam

---

## SQL DOSYASI

`/opt/khp/tabbled/supabase-migration-menu-view-mode.sql` dosyasına yaz:

```sql
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS menu_view_mode TEXT DEFAULT 'categories';
```

---

## TEST CHECKLIST

### Görünüm Modu
- [ ] Admin: Tema/Görünüm bölümünde "Menü Görünümü" seçeneği var
- [ ] Admin: 3 seçenek (Kategoriler / Grid / List) seçilebiliyor
- [ ] Admin: seçim DB'ye kaydediliyor
- [ ] Public: toggle ikonları KALDIRILDI
- [ ] Public: menu_view_mode='categories' → kategori grid açılıyor
- [ ] Public: menu_view_mode='grid' → 2 sütun ürün kartları açılıyor
- [ ] Public: menu_view_mode='list' → yatay kartlar açılıyor

### Geri Bildirim
- [ ] Splash ekranında sağ alt köşede ChatCircle ikonu var
- [ ] İkona tıklayınca FeedbackModal açılıyor
- [ ] feature_feedback kapalıysa ikon gizli
- [ ] Menü sayfasından geri bildirim tab'ı/butonu KALDIRILDI
- [ ] FeedbackModal hâlâ çalışıyor (yıldız + yorum + Google yönlendirme)

### Regresyon
- [ ] Sepet çalışıyor
- [ ] WhatsApp sipariş çalışıyor
- [ ] Garson çağırma çalışıyor
- [ ] Beğeni sistemi çalışıyor
- [ ] İndirim kodları çalışıyor
- [ ] Video player çalışıyor
- [ ] Öneri sistemi çalışıyor
- [ ] Kategori grid açılışı çalışıyor (categories modu)

---

## ÖNCELİK SIRASI

1. **SQL dosyası oluştur** (menu_view_mode kolonu)
2. **Public menüde toggle kaldır** + menu_view_mode'a göre render
3. **Admin'e menü görünümü seçeneği ekle**
4. **Splash'a feedback ikonu ekle**
5. **Menüden feedback tab/bölümünü kaldır**
