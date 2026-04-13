# TABBLED — Features Tabbed Section Ekleme

---

## KRİTİK KURAL

SADECE bu dosyada yazanı yap. Ekstra değişiklik, iyileştirme, öneri YAPMA. Mevcut dosyalara DOKUNMA.

---

## GÖREV

/opt/khp/tabbled/tabbled__5_.zip içindeki home/index.html dosyasından tabbed features bölümünün HTML yapısını referans alarak bir React bileşeni oluştur. 

Zip'i aç:
```bash
unzip -o /opt/khp/tabbled/tabbled__5_.zip -d /tmp/relume-html
```

Referans HTML: /tmp/relume-html/home/index.html satır 117-400 arası.

---

## BİLEŞEN: FeaturesSection.tsx

Dosya: src/components/landing/FeaturesSection.tsx

- Tailwind class'larını HTML referanstan birebir koru
- Tab switching: useState ile (Radix Tabs KULLANMA, native button + div)
- Aktif tab: data-state="active" class pattern'ını CSS ile simüle et
- Emoji KULLANMA — hiçbir yerde
- Relume placeholder görselleri → `/placeholder-feature.webp` (şimdilik, sonra değişecek)

### Tab İçerikleri:

**Tab 1 — "Menü işlemleri"**
- Tagline: "Dijital"
- Başlık: "İçerik üretimini hızlandıran akıllı araçlar"
- Açıklama: "Tabbled, restoranlar için dijital menüyü statik bir liste olmaktan çıkarır. Saatlik öğünler, happy hour, zamanlı menüler, fiyat varyantları ve tükendi yönetimi gibi operasyonel detayları tek panelden kontrol etmenizi sağlar. Böylece menünüz güncel kalır, servis daha düzenli ilerler ve misafirler her zaman doğru bilgiye ulaşır."

**Tab 2 — "AI araçları"**
- Tagline: "Akıllı"
- Başlık: "QR menü yönetimi, fiyat güncellemeleri ve daha düzenli operasyon"
- Açıklama: "Tabbled, restoranlar için dijital menü yönetimini sadeleştirir. Kategori düzenleme, ürün güncelleme, fiyat varyantları, zamanlı menüler, happy hour, tükendi işareti ve QR menü yayını gibi temel işlemleri tek panelden yönetmenizi sağlar. Böylece menü değişiklikleri daha hızlı yapılır, ekip az zaman kaybeder ve misafirler her zaman güncel menüye ulaşır."

**Tab 3 — "Misafir katılımı"**
- Tagline: "Katılım"
- Başlık: "Garson çağrısı, promosyonlar, geri bildirim"
- Açıklama: "Tabbled, QR menüyü pasif bir ekran olmaktan çıkarır. Garson çağırma, geri bildirim toplama, promosyon gösterimi ve WhatsApp sipariş gibi araçlarla misafir deneyimini daha etkileşimli hale getirir. Restoranlar için bu yapı hem servis akışını iyileştirir hem de misafir memnuniyetini daha görünür hale getirir."

**Tab 4 — "Uyum ve dil"**
- Tagline: "Uyum"
- Başlık: "Çok dilli menü, alerjen bilgisi ve yasal uyuma hazır yayın"
- Açıklama: "Turistlere hizmet veren veya daha düzenli bir menü altyapısı kurmak isteyen işletmeler için çok dilli yayın artık önemli bir standart. Tabbled; çok dilli menü yönetimi, alerjen bilgisi, besin değerleri ve baskıya uygun menü çıktısı gibi özelliklerle restoranların hem misafir beklentilerine hem de uyum gereksinimlerine daha rahat cevap vermesini sağlar."

**Tab 5 — "Görünürlük"**
- Tagline: "Büyüme"
- Başlık: "Restoran görünürlüğünü artıran SEO ve yorum odaklı araçlar"
- Açıklama: "Dijital menü artık sadece masada açılan bir sayfa değil, aynı zamanda restoranın çevrim içi görünürlüğünü destekleyen bir alan. Tabbled, restoran SEO'su, Google yorum yönlendirmeleri, geri bildirim akışı ve arama odaklı içerik yapısıyla işletmelerin dijital görünürlüğünü güçlendirmesine yardımcı olur. Daha iyi görünürlük, daha güçlü güven ve daha yüksek etkileşim anlamına gelir."

### Her tab içinde:
- Sol taraf: tagline + başlık + açıklama + 2 buton ("Keşfet" secondary + "Daha fazla" link with arrow)
- Sağ taraf: placeholder görsel
- Layout: `grid grid-cols-1 md:grid-cols-2` (HTML referanstaki gibi)

### Üst başlık (tab'ların üstünde):
- Tagline: "Yetenekler"
- Başlık: "Beş temel alan"
- Açıklama: "Tabbled, dijital menü yönetiminden misafir etkileşimine kadar restoranların ihtiyaç duyduğu temel araçları tek panelde bir araya getirir. QR menü, çok dilli yayın, AI destekli içerik, geri bildirim ve görünürlük araçlarıyla daha düzenli bir operasyon kurmanıza yardımcı olur."

---

## ENTEGRASYON

src/pages/Index.tsx'te FeaturesSection'ı WhyNowSection ile HowItWorksSection arasına ekle:

```tsx
import { FeaturesSection } from '@/components/landing/FeaturesSection';

// Sıra:
// <WhyNowSection />
// <FeaturesSection />   ← BURAYA EKLE
// <HowItWorksSection />
```

Başka hiçbir dosyaya DOKUNMA.

---

## TEST

```bash
npm run build
```

- [ ] Build başarılı
- [ ] 5 tab görünüyor
- [ ] Tab tıklama çalışıyor (içerik değişiyor)
- [ ] Türkçe içerikler doğru
- [ ] Emoji YOK
- [ ] Placeholder görseller görünüyor
- [ ] Mobil responsive (tab'lar dikey, içerik tek sütun)
