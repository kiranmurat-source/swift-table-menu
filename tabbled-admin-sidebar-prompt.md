# TABBLED — Admin Panel Sidebar Redesign

---

## KRİTİK KURAL

SADECE sidebar tasarımını değiştir. Sayfa içeriklerine (dashboard, form, tablo, panel) DOKUNMA. Emoji KULLANMA. Mevcut işlevselliği bozma. Pembe (#FF4F7A) sadece aktif nav item ve bildirim dot'u için kullan — başka hiçbir yerde kullanma.

---

## GÖREV

RestaurantDashboard.tsx'deki mevcut sol sidebar'ı koyu charcoal tasarıma çevir. Referans: FINEbank.io ve CoinSpace dashboard sidebar stili.

---

## DOSYA

`src/pages/RestaurantDashboard.tsx` — sidebar bölümü

---

## YENİ SIDEBAR TASARIMI

### Renk Paleti (SADECE bunlar)
- Sidebar arka plan: #1C1C1E
- Aktif item arka plan: rgba(255, 255, 255, 0.08)
- Aktif item text: #FFFFFF
- Aktif item sol border: 3px solid #FF4F7A
- Pasif item text: #9CA3AF
- Hover arka plan: rgba(255, 255, 255, 0.04)
- Grup başlık text: #6B7280 (uppercase, 11px, letter-spacing: 0.05em)
- Ayırıcı çizgi: rgba(255, 255, 255, 0.06)
- Logo text: #FFFFFF
- Logo "b" harfi: #FF4F7A

### Yapı (Üstten Alta)

**1. Logo Alanı (padding: 20px 16px)**
```
Tab[b]led  (beyaz, "b" pembe, font-weight: 700, font-size: 20px)
```
İnce ayırıcı çizgi altında.

**2. Navigasyon Grupları**

Her grup: uppercase küçük gri başlık + altında item'lar.

```
DASHBOARD
  ● Dashboard            (aktif: beyaz text, sol pembe border, açık arka plan)

MENÜ
  ○ Kategoriler
  ○ Ürünler
  ○ Çeviri Merkezi

MÜŞTERİ İLİŞKİLERİ
  ○ Garson Çağrıları     (bildirim dot: küçük kırmızı/pembe daire — bekleyen çağrı varsa)
  ○ Geri Bildirim
  ○ Beğeniler

PAZARLAMA
  ○ İndirim Kodları
  ○ Promosyonlar

GÖRÜNÜM
  ○ Tema
  ○ Profil & Ayarlar
  ○ QR Kodları
```

**3. Her Nav Item Stili**
```css
/* Pasif */
padding: 10px 16px;
color: #9CA3AF;
font-size: 14px;
font-weight: 400;
cursor: pointer;
border-left: 3px solid transparent;
transition: all 0.15s ease;

/* Hover */
background: rgba(255, 255, 255, 0.04);
color: #D1D5DB;

/* Aktif */
background: rgba(255, 255, 255, 0.08);
color: #FFFFFF;
font-weight: 500;
border-left: 3px solid #FF4F7A;
```

**4. Alt Bölüm (sidebar bottom)**
İnce ayırıcı çizgi üstünde:
```
[Kullanıcı avatarı: gri daire, baş harfler]  Restoran Adı
                                              Çıkış Yap (text link, #6B7280)
```

**5. Mobil (hamburger drawer)**
- Aynı koyu tasarım
- Drawer arka plan: #1C1C1E
- Overlay: rgba(0, 0, 0, 0.5)
- Kapatma butonu: beyaz X ikonu

### Sidebar Genişlik
- Desktop: 240px (mevcut ile aynı)
- Sidebar ile main content arasında border YOK — sadece renk farkı yeterli

### İkonlar
Mevcut Phosphor Icons'ı koru. İkon rengi:
- Pasif: #6B7280
- Aktif: #FFFFFF
- Hover: #9CA3AF

### Main Content Area
Ana içerik alanına DOKUNMA. Sadece sidebar'ın yanındaki alanın sol kenarında border varsa kaldır — koyu sidebar ile beyaz content arasında doğal kontrast yeterli.

---

## YAPMA LİSTESİ

- Pembeyi sidebar arka planına, grup başlıklarına, ikonlara KOYMA
- Dashboard içeriğine (kartlar, chart, listeler) DOKUNMA
- Kategori/ürün formlarına DOKUNMA
- Feature toggle'lara DOKUNMA
- Routing mantığına DOKUNMA
- Yeni npm paketi KURMA
- Emoji KULLANMA

---

## TEST

```bash
npm run build
```

- [ ] Build başarılı
- [ ] Sidebar koyu charcoal (#1C1C1E) arka plan
- [ ] Logo beyaz, "b" pembe
- [ ] Aktif item: beyaz text + sol pembe border + açık arka plan
- [ ] Pasif item: gri text (#9CA3AF)
- [ ] Hover efekti çalışıyor
- [ ] Grup başlıkları uppercase gri
- [ ] Mobil hamburger drawer koyu
- [ ] Main content alanı etkilenmedi
- [ ] Tüm nav item'ları tıklanabilir, doğru paneli açıyor
- [ ] Alt bölümde restoran adı + çıkış görünüyor
