# PUBLIC MENÜ FIX'LER — FEEDBACK UI + YORUMLAR
## Claude Code Prompt — 14 Nisan 2026 (v3)

---

## PROJE BAĞLAMI

- **Proje dizini:** /opt/khp/tabbled/
- **Stack:** React + Vite + TypeScript + S.* inline styles
- **Public menü:** src/pages/PublicMenu.tsx
- **İkonlar:** Phosphor Icons (@phosphor-icons/react) — SADECE "Thin" ağırlık
- **Marka renkleri:** #FF4F7A / #1C1C1E / #F7F7F8

---

## GÖREV 1: MÜŞTERİ YORUMLARI BÖLÜMÜNÜ KALDIR

Menü sayfasında (PublicMenu.tsx) "Müşteri Yorumları" bölümü var — ReviewsSection veya benzeri bileşen. Bu bölümü menü sayfasından tamamen kaldır:

- "Müşteri Yorumları" başlığı
- "Henüz yorum yok. İlk yorumu siz yazın!" kartı
- "Deneyiminizi paylaşın" formu (isim + yorum + gönder)
- Bu bölümün tüm render'ını kaldır

**NOT:** Bileşen dosyasını silme — sadece PublicMenu'daki render/import'unu kaldır. İleride farklı yerde kullanılabilir.

---

## GÖREV 2: SPLASH FEEDBACK BUTONU İYİLEŞTİRME

Şu an splash'ta sağ alt köşede sadece ChatCircle ikonu var — ne olduğu anlaşılmıyor.

### Değişiklik:
- Sadece ikon yerine **pill buton** yap:
  - İçinde: Star ikonu (Phosphor, Thin) + "Değerlendir" yazısı
  - Arka plan: yarı saydam koyu (#1C1C1E, opacity 0.8) veya tema uyumlu
  - Yazı rengi: beyaz
  - Border-radius: 24px (pill şekli)
  - Padding: 8px 16px
  - Font-size: 13px
  - Konum: splash ekranın alt kısmında, "Powered by Tabbled" üstünde veya sağ alt köşe
- Tıklayınca mevcut FeedbackModal açılır (değişiklik yok)
- feature_feedback kapalıysa buton GÖRÜNMESİN

---

## GÖREV 3: YILDIZ DEĞERLENDİRME UI FIX

FeedbackModal'daki yıldızlar beyaz zeminde görünmüyor.

### Değişiklik:
- Varsayılan (seçilmemiş) yıldızlar: **pembe çerçeve** (stroke/outline), içi boş
  - Phosphor Icons: `Star` weight="thin" ile outline, renk #FF4F7A
- Seçilmiş yıldızlar: **pembe dolu** (fill)
  - Phosphor Icons: `Star` weight="fill", renk #FF4F7A
- Hover: yıldız üzerine gelince geçici fill efekti (1'den hover edilen yıldıza kadar hepsi fill)
- Yıldız boyutu: 32px (yeterince büyük, tıklanabilir)
- Yıldızlar arası boşluk: 8px

**Örnek:**
- 0 yıldız seçili: ☆☆☆☆☆ (hepsi pembe outline)
- 3 yıldız seçili: ★★★☆☆ (ilk 3 pembe fill, son 2 pembe outline)

---

## GENEL KURALLAR

1. Phosphor Icons SADECE Thin ağırlık (fill yıldızlar hariç — onlar weight="fill")
2. Emoji YASAK
3. S.* inline styles kullan
4. Mevcut özellikleri BOZMA
5. `npm run build` ile test et

---

## TEST CHECKLIST

- [ ] Menü sayfasından "Müşteri Yorumları" bölümü kaldırıldı
- [ ] Splash'ta "Değerlendir" pill butonu görünüyor (Star ikon + yazı)
- [ ] Pill butona tıklayınca FeedbackModal açılıyor
- [ ] feature_feedback kapalıysa buton gizli
- [ ] Yıldızlar: seçilmemiş = pembe outline, seçilmiş = pembe fill
- [ ] Hover efekti çalışıyor
- [ ] FeedbackModal mevcut işlevselliği bozulmadı (yorum gönderme, Google yönlendirme)
- [ ] White + Black tema uyumlu

---

## ÖNCELİK SIRASI

1. Müşteri Yorumları bölümünü menüden kaldır
2. Yıldız UI fix (outline → fill)
3. Splash feedback butonunu pill'e çevir
