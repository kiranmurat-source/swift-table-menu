# CLAUDE CODE PROMPT — Blog Makaleleri #4, #5, #6
## AEO-Optimize (AI Arama Motorları + Klasik SEO)

---

## GÖREV ÖZETI

blogData.ts dosyasına 3 yeni makale ekle. Her makale AEO (Answer Engine Optimization) prensiplerine göre yazılacak.

---

## PROJE BİLGİLERİ

- **Proje dizini:** /opt/khp/tabbled/
- **Blog veri dosyası:** src/lib/blogData.ts veya src/data/blogData.ts (hangisi mevcutsa)
- **Mevcut makaleler:** 3 adet (#1 QR menü zorunluluğu, #2 QR menü nedir, #3 QR menü fiyatları)
- **Blog route:** /blog ve /blog/:slug
- **Domain:** tabbled.com
- **Marka:** Tabbled — KHP Limited
- **Hedef pazar:** Türkiye (restoran, kafe, otel, pastane)

---

## AEO YAZIM KURALLARI (HER MAKALE İÇİN GEÇERLİ)

### 1. Answer-First Paragraflar
- Her bölümün (h2 altı) İLK CÜMLESİ doğrudan soruyu yanıtlamalı
- Bağlam ve detay sonra gelir
- AI motorları ilk 1-2 cümleyi çeker — bu cümleler kendi başına anlaşılır olmalı

**KÖTÜ:** "Günümüzde birçok restoran sahibi dijital dönüşümü merak etmektedir. Dijital dönüşüm, restoranların teknoloji kullanarak..."
**İYİ:** "Restoran dijital dönüşümü, işletmenin menü, sipariş, ödeme ve müşteri yönetimi süreçlerini teknoloji ile otomatikleştirmesidir. QR menü, online sipariş ve dijital ödeme bu dönüşümün temel bileşenleridir."

### 2. FAQ Cevapları (40-60 kelime)
- Her cevap doğrudan yanıtla başlamalı ("Evet.", "Hayır.", "X, Y'dir.")
- Kendi başına anlaşılır olmalı (soruyu okumadan bile anlam vermeli)
- 40-60 kelime arasında (AI motorlarının optimal çıkarma aralığı)

### 3. Entity Tutarlılığı
- "Tabbled" her makalede aynı şekilde tanımlanmalı: "QR kod tabanlı dijital menü yönetim platformu"
- CTA'larda: "Tabbled ile dijital menünüzü oluşturun → tabbled.com"
- Rakiplerden bahsederken: isim verme, "bazı platformlar" veya "sektördeki çözümler" de

### 4. Yapısal Kurallar
- Her makale ~1800-2200 kelime
- 5-7 ana başlık (h2)
- Her h2 altında 2-4 paragraf
- En az 1 tablo veya karşılaştırma
- En az 5 FAQ sorusu (FAQ Schema için)
- İç linkler: mevcut 3 makaleye + birbirine referans
- Geo optimize: İstanbul, Ankara, İzmir, Antalya, Bursa + ilçeler doğal bağlamda
- CTA: makale ortasında 1 (satır içi) + sonunda 1 (banner tarzı)

### 5. Teknik SEO
- Her makale için: slug, title, metaDescription, category, tags, publishedAt, readTime, content (HTML string), faq dizisi
- Mevcut blogData.ts yapısına uygun format
- publishedAt: "2026-04-11" (bugünün tarihi)

---

## MAKALE #4

### Başlık
"Restoran İçin Dijital Dönüşüm Rehberi 2026: Adım Adım Teknoloji Geçişi"

### Slug
restoran-dijital-donusum-rehberi-2026

### Meta Description
"2026'da restoranınızı dijitalleştirmek için adım adım rehber. QR menü, online sipariş, garson çağırma ve müşteri yönetimi teknolojileri."

### Hedef Anahtar Kelime
Birincil: "restoran dijital dönüşüm"
İkincil: "restoran teknolojisi 2026", "dijital restoran", "restoran otomasyon"

### AI Sorgu Hedefleri (bu sorulara doğrudan cevap verecek içerik)
- "Restoranımı nasıl dijitalleştiririm?"
- "Restoran dijital dönüşüm nedir?"
- "Restoran teknolojileri nelerdir?"
- "2026'da restoran için hangi teknolojiler gerekli?"

### İçerik Outline

**H2: Restoran Dijital Dönüşümü Nedir?**
- Tanım (answer-first): İşletmenin menü, sipariş, ödeme ve müşteri yönetimi süreçlerini teknoloji ile otomatikleştirmesi
- Neden 2026'da zorunlu: Fiyat Etiketi Yönetmeliği + müşteri beklentileri
- Pandemi sonrası kalıcı değişim

**H2: Dijital Dönüşümün 5 Temel Bileşeni**
- 1. QR Dijital Menü (zorunluluk + maliyet tasarrufu)
- 2. Online Sipariş ve WhatsApp Sipariş
- 3. Dijital Ödeme ve Masadan Ödeme
- 4. Müşteri Geri Bildirim ve Değerlendirme Sistemi
- 5. Analitik ve Raporlama
- Her bileşen için 2-3 cümle açıklama + somut fayda

**H2: Adım Adım Dijital Geçiş Planı**
- Adım 1: Mevcut durumu değerlendir (kağıt menü maliyeti, müşteri şikayetleri)
- Adım 2: QR menü platformu seç ve kur (1-2 saat)
- Adım 3: Menü verilerini dijitalleştir (kategoriler, fotoğraflar, fiyatlar, alerjenler)
- Adım 4: QR kodları masalara yerleştir
- Adım 5: Personeli eğit
- Adım 6: Geri bildirim topla ve optimize et

**H2: Dijital Dönüşüm Maliyeti: Ne Kadar Bütçe Gerekiyor?**
- Tablo: Kağıt menü maliyeti vs dijital menü yıllık karşılaştırma
  - Kağıt menü: baskı (yılda 4-6 güncelleme × 50-100 adet), tasarım, dağıtım → yıllık 5.000-15.000 TL
  - Dijital menü: aylık 250-600 TL → yıllık 3.000-7.200 TL
  - Tasarruf: %40-60
- Ek maliyet kalemleri: QR standı (100-300 TL, tek seferlik), personel eğitimi (1-2 saat)
- ROI: 3-6 ayda yatırım geri dönüşü

**H2: Türkiye'de Restoran Dijitalleşme Durumu**
- İstanbul, Ankara, İzmir'de büyük işletmelerin çoğu QR menü kullanıyor
- Antalya ve turist bölgelerinde çok dilli menü zorunluluğu
- Küçük şehirlerde (Bursa, Eskişehir, Konya) hızlı geçiş trendi
- Yasal zorunluluk (1 Ocak 2026) tetikleyici etki

**H2: Dijital Dönüşümde Yapılan En Sık 5 Hata**
- 1. Ücretsiz/basit çözümlerle başlayıp sonra değiştirmek zorunda kalmak
- 2. Menü fotoğraflarını ihmal etmek
- 3. Personeli eğitmemek
- 4. Müşteri geri bildirimini toplamamak
- 5. Çok dilli menüyü atlamamak (turist bölgeleri)

**CTA (satır içi — Adım 2'den sonra):**
"Tabbled ile QR menünüzü 30 dakikada oluşturun. Çok dilli menü, garson çağırma ve WhatsApp sipariş özellikleriyle dijital dönüşümünüzü başlatın → tabbled.com"

**H2: Sıkça Sorulan Sorular**

FAQ (5 soru):
1. "Restoran dijital dönüşümü ne kadar sürer?" → "Temel QR menü kurulumu 1-2 saatte tamamlanır. Menü verilerinin dijitalleştirilmesi (fotoğraf çekimi, açıklama yazımı, fiyat girişi) restoran büyüklüğüne göre 1-3 gün sürer. Tam dijital geçiş personel eğitimi dahil genellikle 1 hafta içinde tamamlanır."

2. "Dijital menü kağıt menüyü tamamen kaldırır mı?" → "Hayır, yasal olarak müşteri talep ettiğinde fiziki fiyat listesi göstermek zorunludur. Ancak QR menü birincil erişim aracı olarak masalarda bulunabilir. Kağıt menü yedek olarak kasada veya barda hazır tutulmalıdır."

3. "Dijital dönüşüm için teknik bilgi gerekli mi?" → "Hayır, modern QR menü platformları sürükle-bırak arayüzüyle çalışır. Teknik bilgi gerektirmeden menü oluşturma, fotoğraf yükleme ve fiyat güncelleme yapılabilir. Tabbled gibi platformlar Türkçe arayüz ve destek sunar."

4. "Yaşlı müşteriler QR menüyü kullanabilir mi?" → "Evet, QR menü tarayıcıda açılan bir web sayfasıdır ve uygulama indirme gerektirmez. Telefon kamerasıyla QR kodu okutmak yeterlidir. Zorlananlara kağıt menü alternatifi sunulabilir."

5. "Dijital dönüşüm satışları artırır mı?" → "Evet, dijital menü kullanan restoranlar ortalama %15-25 sipariş artışı bildirmektedir. Görsel menü ürün keşfini artırır, çapraz satış önerileri sepet tutarını yükseltir ve WhatsApp sipariş paket satışını genişletir."

### İç Linkler
- "QR menü zorunluluğu hakkında detaylı bilgi için → /blog/qr-menu-zorunlulugu-2026"
- "QR menü sistemlerinin karşılaştırmalı fiyatları → /blog/qr-menu-fiyatlari-2026"
- "QR menü nedir ve nasıl çalışır → /blog/qr-menu-nedir"

### Tags
["dijital dönüşüm", "restoran teknolojisi", "QR menü", "restoran otomasyon", "2026"]

---

## MAKALE #5

### Başlık
"Restoran Menü Tasarımı: Satışları Artıran 10 Strateji"

### Slug
restoran-menu-tasarimi-stratejileri

### Meta Description
"Restoran menü tasarımında satışları artıran 10 kanıtlanmış strateji. Dijital menü düzeni, fotoğraf kullanımı, fiyatlandırma psikolojisi ve menü mühendisliği rehberi."

### Hedef Anahtar Kelime
Birincil: "restoran menü tasarımı"
İkincil: "menü mühendisliği", "dijital menü tasarımı", "menü düzeni"

### AI Sorgu Hedefleri
- "Restoran menüsü nasıl tasarlanır?"
- "Menü mühendisliği nedir?"
- "Menü tasarımında satışı artıran teknikler nelerdir?"
- "Dijital menüde ürünleri nasıl sıralamalıyım?"

### İçerik Outline

**H2: Menü Tasarımı Neden Bu Kadar Önemli?**
- Answer-first: İyi tasarlanmış bir menü, restoran satışlarını %15-30 artırabilir
- Menü, restoranın en güçlü pazarlama aracıdır
- Dijital menüde tasarım avantajı: anlık değiştirme, A/B test, fotoğraf ekleme

**H2: Strateji 1-3: Görsel Tasarım İlkeleri**
- 1. Yüksek kaliteli fotoğraflar kullanın (fotoğraflı ürünler %30 daha fazla satılır)
- 2. Kategori düzenini mantıklı sıralayın (aperatif → ana yemek → tatlı → içecek)
- 3. "Öne çıkan ürün" (featured/star item) vurgulayın (büyük kart, farklı arka plan)

**H2: Strateji 4-6: Fiyatlandırma Psikolojisi**
- 4. Para birimi simgesini küçük tutun veya gizleyin (₺ yerine sadece rakam)
- 5. Fiyatları satırın sonuna hizalamayın — açıklamanın devamında doğal akışta bırakın
- 6. "Çapa fiyat" stratejisi: en pahalı ürünü kategorinin başına koyun, diğerleri makul görünsün

**H2: Strateji 7-8: İçerik ve Açıklama**
- 7. Ürün açıklamalarında duyusal kelimeler kullanın ("çıtır", "füme", "ev yapımı", "taze sıkılmış")
- 8. Alerjen ve besin bilgisi ekleyin (güven oluşturur + yasal zorunluluk)

**H2: Strateji 9-10: Dijital Menüye Özel Stratejiler**
- 9. Mobil-first düşünün (müşterilerin %90'ı telefondan bakıyor)
- 10. Zamanlı menü ve happy hour kullanın (kahvaltı/öğle/akşam otomatik geçiş)
- Dijital menünün kağıda göre avantajı: anlık güncelleme, A/B test, çok dilli

**H2: Menü Mühendisliği: Ürünlerinizi Sınıflandırın**
- Tablo: Menü mühendisliği matrisi
  - Yıldız (Star): Yüksek popülerlik + yüksek kâr → Öne çıkar, promosyona koy
  - Bulmaca (Puzzle): Düşük popülerlik + yüksek kâr → Açıklamayı zenginleştir, fotoğraf ekle
  - At (Plow Horse): Yüksek popülerlik + düşük kâr → Fiyatı kademeli artır veya porsiyon ayarla
  - Köpek (Dog): Düşük popülerlik + düşük kâr → Menüden çıkar veya yeniden formüle et
- Bu analiz dijital menüde çok daha kolay: satış verisi otomatik takip

**CTA (satır içi — Strateji 9'dan sonra):**
"Tabbled'ın dijital menü platformuyla bu stratejilerin hepsini uygulayabilirsiniz: fotoğraflı menü, öne çıkan ürünler, zamanlı fiyatlar, çok dilli destek → tabbled.com"

**H2: Sıkça Sorulan Sorular**

FAQ (5 soru):
1. "Menü mühendisliği nedir?" → "Menü mühendisliği, her menü ürününün popülerlik ve kârlılık verilerini analiz ederek menü düzenini, fiyatlandırmayı ve açıklamaları optimize etme sürecidir. Ürünler yıldız, bulmaca, at ve köpek olarak sınıflandırılır ve her kategori için farklı strateji uygulanır."

2. "Dijital menüde fotoğraf kullanmak zorunlu mu?" → "Yasal olarak zorunlu değildir ancak fotoğraflı ürünler fotoğrafsız ürünlere göre ortalama %30 daha fazla sipariş alır. Özellikle turist müşteriler için dil bariyerini aşmanın en etkili yolu görsel menüdür."

3. "Menüdeki ürün sayısı ne kadar olmalı?" → "Araştırmalar, kategori başına 7-10 ürünün ideal olduğunu göstermektedir. Çok fazla seçenek müşteriyi bunaltır ve karar süresini uzatır. Dijital menüde alt kategorilerle ürünleri gruplamak bu sorunu çözer."

4. "Menü tasarımını ne sıklıkla güncellemeliyim?" → "Dijital menüde fiyat ve içerik güncellemesi anlık yapılabilir. Sezonluk menü değişiklikleri yılda 4 kez, fiyat güncellemeleri ihtiyaç duyulduğunda, fotoğraf yenileme yılda 1-2 kez önerilir."

5. "Kağıt menüden dijitale geçişte müşteriler zorluk yaşar mı?" → "İlk haftalarda bazı müşteriler uyum süreci yaşayabilir. QR kodun kolay erişilebilir olması, net yönlendirme işaretleri ve personelin yardımcı olması geçişi kolaylaştırır. Kağıt menü yedek olarak hazır tutulmalıdır."

### İç Linkler
- "QR menü nedir ve nasıl çalışır → /blog/qr-menu-nedir"
- "Dijital dönüşüm rehberi → /blog/restoran-dijital-donusum-rehberi-2026"
- "QR menü fiyatları → /blog/qr-menu-fiyatlari-2026"

### Tags
["menü tasarımı", "menü mühendisliği", "dijital menü", "restoran pazarlama", "fiyatlandırma"]

---

## MAKALE #6

### Başlık
"Restoranlarda Alerjen Bilgilendirme Rehberi 2026: Yasal Zorunluluklar ve Uygulama"

### Slug
restoran-alerjen-bilgilendirme-rehberi

### Meta Description
"Restoranlarda alerjen bilgilendirme zorunluluğu, 14 AB alerjen listesi, menüde alerjen gösterimi ve dijital çözümler. 2026 yasal rehber."

### Hedef Anahtar Kelime
Birincil: "restoran alerjen bilgilendirme"
İkincil: "menüde alerjen gösterimi", "gıda alerjisi restoran", "alerjen yönetmeliği"

### AI Sorgu Hedefleri
- "Restoran menüsünde alerjen bilgisi nasıl gösterilir?"
- "Türkiye'de restoranlarda alerjen zorunluluğu var mı?"
- "14 alerjen nelerdir?"
- "Dijital menüde alerjen bilgisi nasıl eklenir?"

### İçerik Outline

**H2: Restoranlarda Alerjen Bilgilendirme Neden Zorunlu?**
- Answer-first: Türkiye'de Tarım ve Orman Bakanlığı yönetmeliğine göre yeme-içme işletmeleri menülerinde alerjen içerik bilgisi sunmakla yükümlüdür
- AB uyumu: 14 ana alerjen standardı
- Müşteri güvenliği: Gıda alerjisi ciddi sağlık riski taşır
- Yasal yaptırımlar: uymayanlar idari para cezasıyla karşılaşır

**H2: 14 Temel Alerjen Nedir?**
- Tablo: 14 AB Standardı alerjen listesi
  1. Gluten (buğday, arpa, çavdar, yulaf)
  2. Kabuklu deniz ürünleri (karides, yengeç, ıstakoz)
  3. Yumurta
  4. Balık
  5. Yer fıstığı
  6. Soya
  7. Süt (laktoz dahil)
  8. Kabuklu meyveler (badem, fındık, ceviz, kaju, antep fıstığı)
  9. Kereviz
  10. Hardal
  11. Susam
  12. Kükürt dioksit ve sülfitler (>10mg/kg)
  13. Acı bakla (lupin)
  14. Yumuşakçalar (midye, kalamar, ahtapot)
- Her birinin yaygın bulunduğu yemek örnekleri

**H2: Menüde Alerjen Bilgisi Nasıl Gösterilir?**
- Yöntem 1: Her ürünün yanında ikon/sembol (en etkili)
- Yöntem 2: Menü sonunda alerjen tablosu
- Yöntem 3: "Alerjen bilgisi için personele danışın" notu (minimum uyum, önerilmez)
- Dijital menü avantajı: filtreleme özelliği (glütensiz menü, laktoz-free filtre)
- Tabbled'ın alerjen sistemi: 14 AB standardı + vegan/vejetaryen/helal/koşer ikonları

**H2: Dijital Menüde Alerjen Yönetimi**
- Manuel giriş vs otomatik: AI ile alerjen tespiti riskli (liability) → manuel giriş güvenli
- Her ürüne alerjen seçimi (checkbox tarzı)
- Müşteri tarafında filtreleme: "Sadece glutensiz ürünleri göster"
- Çok dilli alerjen bilgisi (turist müşteriler için kritik)
- Güncelleme kolaylığı: tarif değişince alerjen anında güncellenir

**H2: Alerjen Yönetiminde Sık Yapılan Hatalar**
- 1. "Tüm ürünlerde alerjen var" gibi genel uyarıyla geçiştirmek
- 2. Çapraz bulaşma riskini bildirmemek
- 3. Mevsimsel tarif değişikliklerinde alerjen güncellememek
- 4. Personeli alerjen konusunda eğitmemek
- 5. Sadece İngilizce alerjen bilgisi vermek (Türkçe de olmalı)

**H2: İstanbul, Antalya ve Turist Bölgelerinde Özel Dikkat**
- Turist yoğun bölgelerde çok dilli alerjen bilgisi zorunlu
- İstanbul (Sultanahmet, Taksim, Kadıköy): uluslararası müşteri profili
- Antalya, Bodrum, Fethiye: Avrupalı turistler alerjen bilgisine çok hassas
- Bursa, Ankara: iç turizm + yerel müşteri bilinçlenmesi
- Almanya, İngiltere, İskandinav ülkelerinden gelen turistler menüde alerjen bilgisi bekler

**CTA (satır içi — Dijital Menüde Alerjen Yönetimi bölümünden sonra):**
"Tabbled'ın dijital menüsünde 14 AB standardı alerjen + vegan/vejetaryen/helal/koşer ikonları dahili olarak sunulmaktadır. Alerjen uyumlu menünüzü oluşturun → tabbled.com"

**H2: Sıkça Sorulan Sorular**

FAQ (5 soru):
1. "Restoranlarda alerjen bilgilendirme zorunlu mu?" → "Evet, Türkiye'de Tarım ve Orman Bakanlığı yönetmeliğine göre yeme-içme işletmeleri menülerinde alerjen içerik bilgisi sunmakla yükümlüdür. AB standardındaki 14 ana alerjen grubunun menüde belirtilmesi gerekmektedir."

2. "14 alerjen nelerdir?" → "AB standardındaki 14 zorunlu alerjen: gluten, kabuklu deniz ürünleri, yumurta, balık, yer fıstığı, soya, süt, kabuklu meyveler, kereviz, hardal, susam, sülfitler, acı bakla ve yumuşakçalardır. Bu alerjenler menüde ikon veya yazıyla belirtilmelidir."

3. "Dijital menüde alerjen bilgisi nasıl eklenir?" → "QR menü platformlarında her ürüne alerjen seçimi checkbox ile yapılır. Müşteriler menüde filtre uygulayarak belirli alerjenleri içermeyen ürünleri görebilir. Tabbled'da 14 AB standardı alerjen ikonu dahili olarak sunulmaktadır."

4. "Çapraz bulaşma riski menüde belirtilmeli mi?" → "Evet, aynı mutfakta hazırlanan ürünlerde çapraz bulaşma riski varsa bu bilgi menüde belirtilmelidir. 'Bu ürün fıstık içeren ürünlerle aynı ortamda hazırlanmaktadır' gibi uyarılar müşteri güvenliği için kritiktir."

5. "Alerjen bilgisi sadece Türkçe mi olmalı?" → "Hayır, özellikle turist yoğun bölgelerde (İstanbul, Antalya, Bodrum) alerjen bilgisi en az İngilizce olarak da sunulmalıdır. Dijital menü platformları otomatik çeviri ile 30'dan fazla dilde alerjen bilgisi sunabilir."

### İç Linkler
- "QR menü nedir ve nasıl çalışır → /blog/qr-menu-nedir"
- "QR menü zorunluluğu hakkında → /blog/qr-menu-zorunlulugu-2026"
- "Dijital dönüşüm rehberi → /blog/restoran-dijital-donusum-rehberi-2026"

### Tags
["alerjen", "gıda güvenliği", "menü tasarımı", "yasal zorunluluk", "dijital menü"]

---

## UYGULAMA TALİMATLARI

### 1. Mevcut blogData.ts Yapısını Oku
```bash
head -100 src/lib/blogData.ts
# veya
head -100 src/data/blogData.ts
```
Mevcut makale yapısını (alanlar, format, HTML yapısı) anla ve aynı formatta yaz.

### 2. İçerik Yazımı
- HTML string olarak yaz (mevcut makalelerin formatına uy)
- h2, h3, p, ul/li, table, blockquote, .cta-box gibi mevcut CSS sınıflarını kullan
- İç linkleri `<a href="/blog/slug">` formatında ekle
- CTA kutusunu mevcut makalelerdeki formatla aynı yap

### 3. FAQ Dizisi
- Mevcut makalelerdeki faq dizisi formatına uy
- Her FAQ: { question: string, answer: string }

### 4. Sitemap Güncellemesi
Edge Function'daki BLOG_SLUGS dizisine yeni 3 slug ekle:
```bash
# supabase/functions/sitemap/index.ts dosyasında BLOG_SLUGS dizisine ekle:
'restoran-dijital-donusum-rehberi-2026',
'restoran-menu-tasarimi-stratejileri',
'restoran-alerjen-bilgilendirme-rehberi',
```

### 5. Sitemap Redeploy
```bash
supabase functions deploy sitemap --project-ref qmnrawqvkwehufebbkxp --no-verify-jwt
```

### 6. Build Test
```bash
cd /opt/khp/tabbled
npm run build
```

---

## DOĞRULAMA

1. blogData.ts'te 6 makale var mı? (3 eski + 3 yeni)
2. Her yeni makalenin slug, title, metaDescription, content, faq alanları dolu mu?
3. İç linkler doğru slug'lara mı işaret ediyor?
4. FAQ cevapları answer-first mi? (ilk cümle doğrudan yanıt)
5. FAQ cevapları 40-60 kelime arasında mı?
6. Sitemap Edge Function'da yeni slug'lar var mı?
7. Build başarılı mı?
8. `curl -s https://qmnrawqvkwehufebbkxp.supabase.co/functions/v1/sitemap | grep "restoran-dijital"` — yeni URL'ler sitemap'te görünüyor mu?

---

## HATIRLATMALAR

- Mevcut makalelerin HTML yapısını ve CSS sınıflarını referans al — tutarlılık için aynı yapıyı kullan
- Türkçe karakter (ş, ç, ğ, ı, ö, ü) TypeScript string'lerde sorun çıkarmaz
- İçerik tamamen özgün olmalı — rakip sitelerden kopyalama yapma
- Yasal bilgiler (yönetmelik tarihleri, ceza miktarları) doğrulanabilir olmalı — uydurma rakam verme
- Fiyat bilgileri (maliyet karşılaştırması) gerçekçi ve güncel olmalı
- publishedAt tüm yeni makaleler için "2026-04-11"
- Geo optimize: şehir isimleri doğal bağlamda geçmeli, zoraki SEO doldurması yapma
