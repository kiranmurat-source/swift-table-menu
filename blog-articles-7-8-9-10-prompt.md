# CLAUDE CODE PROMPT — Blog Makaleleri #7, #8, #9, #10
## AEO-Optimize (AI Arama Motorları + Klasik SEO)

---

## GÖREV ÖZETI

blogData.ts dosyasına 4 yeni makale ekle. Dosyada şu an 6 makale olmalı (#1-#6). Bu prompt ile toplam 10'a tamamlanacak.

---

## PROJE BİLGİLERİ

- **Proje dizini:** /opt/khp/tabbled/
- **Blog veri dosyası:** src/lib/blogData.ts veya src/data/blogData.ts (hangisi mevcutsa)
- **Mevcut makaleler:** 6 adet (#1-#6)
- **Blog route:** /blog ve /blog/:slug
- **Domain:** tabbled.com
- **Marka:** Tabbled — KHP Limited, QR kod tabanlı dijital menü yönetim platformu
- **Hedef pazar:** Türkiye (restoran, kafe, otel, pastane)

---

## AEO YAZIM KURALLARI (ÖNCEKİ PROMPT İLE AYNI — HER MAKALE İÇİN GEÇERLİ)

### 1. Answer-First Paragraflar
- Her bölümün (h2 altı) İLK CÜMLESİ doğrudan soruyu yanıtlamalı
- Bağlam ve detay sonra gelir
- AI motorları ilk 1-2 cümleyi çeker — bu cümleler kendi başına anlaşılır olmalı

### 2. FAQ Cevapları (40-60 kelime)
- Her cevap doğrudan yanıtla başlamalı ("Evet.", "Hayır.", "X, Y'dir.")
- Kendi başına anlaşılır olmalı
- 40-60 kelime arasında

### 3. Entity Tutarlılığı
- "Tabbled" → "QR kod tabanlı dijital menü yönetim platformu"
- CTA'larda: "Tabbled ile dijital menünüzü oluşturun → tabbled.com"

### 4. Yapısal Kurallar
- Her makale ~1800-2200 kelime
- 5-7 ana başlık (h2)
- En az 1 tablo veya karşılaştırma
- En az 5 FAQ sorusu
- İç linkler: mevcut makalelere + birbirine referans
- Geo optimize: İstanbul, Ankara, İzmir, Antalya, Bursa + ilçeler doğal bağlamda
- CTA: makale ortasında 1 + sonunda 1
- publishedAt: "2026-04-11"

### 5. Mevcut Makale Slug'ları (iç link için)
- /blog/qr-menu-zorunlulugu-2026
- /blog/qr-menu-nedir
- /blog/qr-menu-fiyatlari-2026
- /blog/restoran-dijital-donusum-rehberi-2026
- /blog/restoran-menu-tasarimi-stratejileri
- /blog/restoran-alerjen-bilgilendirme-rehberi

---

## MAKALE #7

### Başlık
"Restoran Müşteri Deneyimi 2026: QR Menüden WhatsApp Siparişe Dijital Yolculuk"

### Slug
restoran-musteri-deneyimi-dijital-yolculuk

### Meta Description
"Restoranlarda müşteri deneyimini iyileştiren dijital çözümler: QR menü, garson çağırma, WhatsApp sipariş, geri bildirim ve beğeni sistemi. 2026 rehberi."

### Hedef Anahtar Kelime
Birincil: "restoran müşteri deneyimi"
İkincil: "dijital müşteri deneyimi restoran", "WhatsApp sipariş restoran", "garson çağırma sistemi"

### AI Sorgu Hedefleri
- "Restoranda müşteri deneyimi nasıl iyileştirilir?"
- "WhatsApp ile restoran siparişi nasıl verilir?"
- "QR menüden garson nasıl çağrılır?"
- "Restoranlarda dijital müşteri yolculuğu nedir?"

### İçerik Outline

**H2: Dijital Müşteri Yolculuğu Nedir?**
- Answer-first: Müşterinin restoranda masaya oturduğu andan ayrıldığı ana kadar geçen tüm dijital temas noktalarının bütünüdür
- 2026'da müşteri beklentisi: hızlı, temassız, kişiselleştirilmiş
- Geleneksel vs dijital yolculuk karşılaştırması

**H2: Adım 1 — QR Menü ile İlk Temas**
- Müşteri masaya oturur, QR kodu tarar
- Uygulama indirme gerektirmez (web tabanlı)
- Fotoğraflı, çok dilli, alerjen bilgili menü
- Çalışma saatleri, sosyal medya, adres bilgisi tek ekranda
- İlk izlenim: profesyonel menü = güven

**H2: Adım 2 — Sipariş ve Sepet Deneyimi**
- Sepet sistemi: ürün ekle, adet seç, not yaz
- Varyant seçimi (porsiyon boyutu, sos tercihi)
- İndirim kodu uygulama
- WhatsApp ile sipariş gönderimi (komisyonsuz, doğrudan restoran)
- Telefon sipariş vs WhatsApp sipariş karşılaştırma tablosu

**H2: Adım 3 — Garson Çağırma ve İletişim**
- Dijital garson çağırma: masadan buton yerine QR menüden tek tıkla
- Avantajları: el kaldırma/bağırma yok, anında bildirim, masa numarası otomatik
- Bekleme süresi kısalır, servis hızlanır
- Donanım maliyeti yok (fiziksel buton/pager gerekmez)

**H2: Adım 4 — Geri Bildirim ve Değerlendirme**
- Hesap sonrası otomatik geri bildirim formu
- Yıldız puanlama + yorum
- Akıllı yönlendirme: 4-5 yıldız → Google Reviews'a yönlendir
- 1-3 yıldız → dahili geri bildirim (restorana özel, public değil)
- Restoran sahibi için: dashboard'da geri bildirim analizi

**H2: Adım 5 — Sadakat ve Tekrar Ziyaret**
- Ürün beğenme (kalp butonu): favori ürünleri kaydet
- Promosyon popup'ları: tekrar ziyaret teşviki
- Happy hour fiyatları: zaman bazlı teklifler
- Sosyal medya bağlantısı: Instagram takip, Google yorum

**CTA (satır içi — Adım 3'ten sonra):**
"Tabbled ile müşterilerinize kesintisiz dijital deneyim sunun: QR menü, garson çağırma, WhatsApp sipariş, geri bildirim — hepsi tek platformda → tabbled.com"

**H2: Sıkça Sorulan Sorular**

FAQ (5 soru):
1. "Restoranda dijital müşteri deneyimi nedir?" → "Dijital müşteri deneyimi, müşterinin QR menü tarama, sipariş verme, garson çağırma, ödeme yapma ve geri bildirim bırakma gibi tüm süreçlerin teknoloji ile desteklenmesidir. Amaç bekleme süresini azaltmak, kişiselleştirilmiş hizmet sunmak ve memnuniyeti artırmaktır."

2. "WhatsApp sipariş sistemi nasıl çalışır?" → "Müşteri QR menüden ürünleri sepete ekler, 'WhatsApp ile Gönder' butonuna tıklar. Sipariş otomatik olarak restoran numarasına formatlanmış mesaj olarak iletilir. Komisyon yoktur, mesaj doğrudan restoran WhatsApp hattına düşer."

3. "Dijital garson çağırma için donanım gerekli mi?" → "Hayır, QR menü tabanlı garson çağırma sistemi donanım gerektirmez. Müşteri menüdeki 'Garson Çağır' butonuna tıklar, bildirim anında restoran paneline düşer. Fiziksel buton veya pager satın almaya gerek yoktur."

4. "Geri bildirim sistemi Google yorumlarından farklı mı?" → "Evet, dahili geri bildirim sistemi restorana özeldir ve tüm puanlar restoran panelinden yönetilir. Ancak yüksek puan veren müşteriler otomatik olarak Google Reviews'a yönlendirilerek restoranın online itibarı güçlendirilir."

5. "Dijital deneyim yaşlı müşterileri dışlar mı?" → "Hayır, QR menü basit bir web sayfası olup uygulama indirme gerektirmez. Telefon kamerasıyla taramak yeterlidir. Dijital sisteme uyum sağlayamayan müşteriler için kağıt menü yedek olarak bulundurulmalıdır."

### İç Linkler
- /blog/qr-menu-nedir
- /blog/restoran-dijital-donusum-rehberi-2026
- /blog/restoran-menu-tasarimi-stratejileri

### Tags
["müşteri deneyimi", "WhatsApp sipariş", "garson çağırma", "dijital restoran", "geri bildirim"]

---

## MAKALE #8

### Başlık
"Restoran SEO ve Google Haritalar Optimizasyonu Rehberi 2026"

### Slug
restoran-seo-google-haritalar-rehberi

### Meta Description
"Restoranınızı Google'da üst sıralara çıkarın. Google İşletme Profili, yerel SEO, QR menü SEO avantajı ve müşteri yorumları optimizasyonu rehberi."

### Hedef Anahtar Kelime
Birincil: "restoran SEO"
İkincil: "Google haritalar restoran", "yerel SEO restoran", "Google İşletme Profili restoran"

### AI Sorgu Hedefleri
- "Restoranımı Google'da nasıl üst sıralara çıkarırım?"
- "Restoran SEO nasıl yapılır?"
- "Google İşletme Profili restoran için nasıl optimize edilir?"
- "Yerel SEO restoran için neden önemli?"

### İçerik Outline

**H2: Neden Restoran SEO Bu Kadar Kritik?**
- Answer-first: Müşterilerin %70'inden fazlası restoran seçmeden önce Google'da arama yapıyor
- "Yakınımdaki restoran", "en iyi kafe [şehir]" aramaları mobilde patlıyor
- Google Haritalar'da görünmek = doğrudan müşteri

**H2: Google İşletme Profili (GBP) Optimizasyonu**
- Profil oluşturma ve doğrulama (ücretsiz)
- Zorunlu alanlar: isim, adres, telefon, çalışma saatleri, web sitesi, kategori
- Fotoğraf ekleme: menü, mekan, yemek (en az 10 fotoğraf)
- Haftalık güncelleme: yeni fotoğraf, gönderi, etkinlik
- Menü linki: QR menü URL'ini GBP'ye eklemek (tabbled.com/menu/slug)

**H2: Yerel SEO: Şehir ve İlçe Bazlı Anahtar Kelimeler**
- "Kadıköy restoran", "Nişantaşı kafe", "Antalya Kaleiçi restoran" gibi yerel anahtar kelimeler
- Web sitesi ve blog içeriğinde doğal kullanım
- NAP tutarlılığı (İsim, Adres, Telefon) tüm platformlarda aynı olmalı
- Yerel backlink: şehir rehberleri, yerel bloglar, turizm siteleri

**H2: QR Menünün SEO Avantajı**
- QR menü = ayrı bir web sayfası (tabbled.com/menu/slug)
- Google tarafından indexlenebilir → organik arama sonuçlarında görünür
- Restaurant Schema (JSON-LD) → zengin sonuçlar (yıldız, adres, çalışma saatleri)
- Kağıt menünün SEO değeri = sıfır
- Tablo: Kağıt menü vs dijital menü SEO karşılaştırması

**H2: Müşteri Yorumları ve Online İtibar Yönetimi**
- Google yorumları SEO sıralamasını doğrudan etkiler
- Yorum sayısı ve ortalama puan: ne kadar çok yorum, o kadar üst sıra
- Olumsuz yorumlara profesyonel yanıt vermek → güven artışı
- Dijital menüden Google Reviews'a otomatik yönlendirme
- QR menüdeki geri bildirim sistemi ile yorum toplama

**H2: İstanbul, Ankara, İzmir İçin Özel SEO Taktikleri**
- İstanbul: ilçe bazlı rekabet çok yoğun (Beşiktaş, Kadıköy, Beyoğlu, Bakırköy)
- Ankara: Çankaya, Kızılay, Tunalı bölge odaklı
- İzmir: Alsancak, Karşıyaka, Bornova
- Antalya/Bodrum: İngilizce anahtar kelimeler de gerekli (turist odaklı)
- Bursa: "Bursa kebap restoran" gibi mutfak odaklı anahtar kelimeler

**CTA (satır içi — QR Menünün SEO Avantajı bölümünden sonra):**
"Tabbled'ın dijital menüsü Google tarafından indexlenir ve Restaurant Schema ile zengin sonuçlarda görünür. Restoranınızın SEO'sunu güçlendirin → tabbled.com"

**H2: Sıkça Sorulan Sorular**

FAQ (5 soru):
1. "Restoran SEO nedir?" → "Restoran SEO, işletmenizin Google arama sonuçlarında ve Google Haritalar'da üst sıralarda görünmesini sağlayan optimizasyon çalışmalarıdır. Google İşletme Profili, yerel anahtar kelimeler, müşteri yorumları ve web sitesi optimizasyonunu kapsar."

2. "Google İşletme Profili ücretsiz mi?" → "Evet, Google İşletme Profili tamamen ücretsizdir. Google Haritalar'da işletmenizi oluşturabilir, fotoğraf ekleyebilir, çalışma saatlerinizi belirtebilir ve müşteri yorumlarını yönetebilirsiniz. Doğrulama işlemi genellikle telefon veya posta ile yapılır."

3. "QR menü Google'da görünür mü?" → "Evet, web tabanlı QR menü sayfaları Google tarafından indexlenir ve arama sonuçlarında görünür. Restaurant Schema markup ile restoran adı, adres, çalışma saatleri gibi bilgiler zengin sonuç olarak gösterilir. Kağıt menünün SEO değeri yoktur."

4. "Kaç Google yorumu gerekli?" → "Minimum 20-30 yorum ile Google Haritalar sıralamasında önemli bir fark görülür. Ancak yorum sayısından çok, düzenli yeni yorum almak ve yüksek ortalama puan tutmak daha etkilidir. Haftada 2-3 yeni yorum hedeflemek idealdir."

5. "Olumsuz Google yorumları silinebilir mi?" → "Hayır, Google olumsuz yorumları silmez ancak sahte veya spam yorumlar bildirilebilir. Olumsuz yorumlara profesyonel ve çözüm odaklı yanıt vermek daha etkilidir. İyi yanıtlanmış olumsuz yorumlar, potansiyel müşterilere güven verir."

### İç Linkler
- /blog/qr-menu-nedir
- /blog/restoran-dijital-donusum-rehberi-2026
- /blog/restoran-musteri-deneyimi-dijital-yolculuk

### Tags
["restoran SEO", "Google Haritalar", "yerel SEO", "Google İşletme Profili", "online itibar"]

---

## MAKALE #9

### Başlık
"Çok Dilli Menü Rehberi: Turistlere Hizmet Veren Restoranlar İçin 2026 Kılavuzu"

### Slug
cok-dilli-menu-rehberi-turist-restoran

### Meta Description
"Turist müşterilere hizmet veren restoranlar için çok dilli dijital menü rehberi. Otomatik çeviri, dil seçimi ve kültürel adaptasyon ipuçları."

### Hedef Anahtar Kelime
Birincil: "çok dilli menü"
İkincil: "turist restoran menü", "dijital menü çeviri", "multilingual restaurant menu"

### AI Sorgu Hedefleri
- "Turistler için çok dilli menü nasıl hazırlanır?"
- "Restoran menüsü kaç dilde olmalı?"
- "Dijital menü çevirisi nasıl yapılır?"
- "Turist restoranı için hangi diller gerekli?"

### İçerik Outline

**H2: Neden Çok Dilli Menü Artık Zorunluluk?**
- Answer-first: Türkiye yılda 50 milyonu aşan turist ağırlıyor ve bu turistlerin büyük çoğunluğu menüyü kendi dillerinde görmek istiyor
- İstanbul, Antalya, Bodrum, Kapadokya'da turist oranı
- İngilizce tek başına yeterli değil: Arap, Alman, Rus turist profili
- Kağıt menüde çok dilli basım maliyeti vs dijital menü çevirisi

**H2: Hangi Diller Gerekli? Bölgeye Göre Dil Rehberi**
- Tablo: Bölge → Öncelikli diller
  - İstanbul (Sultanahmet, Taksim): İngilizce, Arapça, Almanca, Fransızca, İspanyolca
  - Antalya/Alanya: İngilizce, Almanca, Rusça, İskandinav dilleri
  - Bodrum/Fethiye: İngilizce, Almanca, Hollandaca
  - Kapadokya: İngilizce, Çince, Japonca, Korece
  - Trabzon: Arapça, İngilizce
  - Ankara: İngilizce (diplomatik profil)
  - Bursa: Arapça, İngilizce (Körfez turizmi)

**H2: Otomatik Çeviri vs Manuel Çeviri**
- Otomatik çeviri (Google Translate API): hızlı, uygun maliyetli, 30+ dil
- Manuel çeviri: daha doğru ama pahalı ve yavaş
- Hibrit yaklaşım: otomatik çeviri + kritik ürünlerde manuel düzeltme
- Yemek isimleri: bazıları çevrilmemeli ("Adana Kebap", "Baklava" → orijinal kalmalı)
- Dikkat: "Hünkar Beğendi"yi doğrudan çevirmek komik sonuçlar doğurur

**H2: Dijital Menüde Çok Dilli Deneyim Nasıl Olmalı?**
- Dil seçici: bayrak ikonu veya dil kodu (EN, DE, AR, RU)
- Otomatik dil algılama: tarayıcı diline göre varsayılan dil
- Alerjen bilgileri her dilde: kritik güvenlik bilgisi
- Fiyat formatı: TL bazlı (döviz gösterimi kafa karıştırır)
- Fotoğraflar: dil bağımsız → evrensel iletişim aracı

**H2: Kültürel Adaptasyon İpuçları**
- Arap müşteriler: helal sertifikası önemli, domuz eti uyarısı
- Alman müşteriler: porsiyon bilgisi ve besin değerleri
- Rus müşteriler: görsel ağırlıklı menü, büyük fotoğraflar
- Uzak Doğu (Çin, Japon, Kore): baharat seviyesi uyarısı
- Vejetaryen/vegan: uluslararası simgeler kullanın

**CTA (satır içi — Dijital Menüde Çok Dilli Deneyim bölümünden sonra):**
"Tabbled 34 dil desteği ile otomatik menü çevirisi sunar. Turistlere ana dillerinde menü sunarak satışlarınızı artırın → tabbled.com"

**H2: Sıkça Sorulan Sorular**

FAQ (5 soru):
1. "Restoran menüsü kaç dilde olmalı?" → "Minimum İngilizce ve Türkçe olmalıdır. Bölgeye göre 3-5 dil idealdir: İstanbul için İngilizce, Arapça, Almanca; Antalya için İngilizce, Almanca, Rusça eklenmelidir. Dijital menü platformları 30'dan fazla dili destekler."

2. "Otomatik çeviri yemek isimleri için güvenilir mi?" → "Genel açıklamalar için otomatik çeviri yeterlidir ancak geleneksel yemek isimleri orijinal kalmalıdır. 'Adana Kebap', 'Baklava', 'Lahmacun' gibi isimler çevrilmemeli, yanlarına kısa İngilizce açıklama eklenmelidir."

3. "Çok dilli menü maliyeti ne kadar?" → "Kağıt menüde her dil için ayrı baskı gerekir ve güncelleme maliyetlidir. Dijital menü platformlarında otomatik çeviri dahildir ve ek maliyet oluşturmaz. Tabbled'da Pro plan 2 dil, Premium plan 4 dil desteği sunar."

4. "Menüde döviz fiyatı da gösterilmeli mi?" → "Hayır, fiyatları sadece Türk Lirası (TL) olarak göstermek yeterlidir. Döviz fiyatı kur değişimlerinde karışıklık yaratır. Turistler genellikle dönüşüm uygulaması kullanır veya garsondan bilgi alır."

5. "Alerjen bilgileri de çevrilmeli mi?" → "Evet, alerjen bilgileri tüm desteklenen dillerde gösterilmelidir. Gıda alerjisi hayati bir sağlık konusudur ve dil bariyeri nedeniyle yanlış anlaşılma ciddi sonuçlar doğurabilir. Dijital menü platformları alerjen çevirisini otomatik yapar."

### İç Linkler
- /blog/restoran-alerjen-bilgilendirme-rehberi
- /blog/qr-menu-nedir
- /blog/restoran-musteri-deneyimi-dijital-yolculuk

### Tags
["çok dilli menü", "turist restoran", "menü çevirisi", "dijital menü", "uluslararası restoran"]

---

## MAKALE #10

### Başlık
"2026'da Restoran Açmak: Teknoloji Yatırım Rehberi ve Dijital Altyapı Kontrol Listesi"

### Slug
restoran-acmak-teknoloji-yatirim-rehberi-2026

### Meta Description
"2026'da restoran açarken ihtiyacınız olan teknoloji yatırımları: QR menü, POS sistemi, sosyal medya, Google İşletme Profili ve dijital altyapı kontrol listesi."

### Hedef Anahtar Kelime
Birincil: "restoran açmak 2026"
İkincil: "restoran teknoloji yatırımı", "restoran dijital altyapı", "yeni restoran açarken gerekenler"

### AI Sorgu Hedefleri
- "Restoran açarken hangi teknolojiler gerekli?"
- "2026'da restoran açmak için ne kadar teknoloji yatırımı lazım?"
- "Yeni restoran için dijital altyapı nasıl kurulur?"
- "Restoran açarken QR menü zorunlu mu?"

### İçerik Outline

**H2: 2026'da Restoran Açmak: Dijital Hazırlık Neden İlk Sırada?**
- Answer-first: 2026'da restoran açarken dijital altyapı kurmak, mutfak ekipmanı kadar öncelikli hale gelmiştir
- Yasal zorunluluklar (QR menü, fiyat etiketi yönetmeliği)
- Müşteri beklentileri değişti: telefondan menü, WhatsApp sipariş, Google'da bulunabilirlik
- Erken dijitalleşme = rekabet avantajı

**H2: Teknoloji Yatırım Kategorileri ve Bütçe**
- Tablo: Teknoloji kalemi → Maliyet → Öncelik
  - QR Dijital Menü Platformu: 3.600-14.400 TL/yıl → Zorunlu
  - POS Sistemi: 5.000-20.000 TL (donanım + yazılım) → Zorunlu
  - Google İşletme Profili: Ücretsiz → Zorunlu
  - Web sitesi (basit): 3.000-10.000 TL → Önemli
  - Sosyal medya kurulumu: Ücretsiz (içerik üretimi hariç) → Önemli
  - Profesyonel yemek fotoğrafçılığı: 3.000-8.000 TL → Önemli
  - Wi-Fi altyapısı: 2.000-5.000 TL → Gerekli
  - QR kod standları: 100-300 TL/adet → Gerekli
  - Güvenlik kamerası: 3.000-10.000 TL → Gerekli
- Toplam minimum dijital yatırım: ~20.000-40.000 TL (tek seferlik + yıllık)

**H2: Açılış Öncesi Dijital Kontrol Listesi**
- ☐ Google İşletme Profili oluştur ve doğrula
- ☐ QR dijital menü platformu seç ve kur
- ☐ Menü verilerini dijitalleştir (fotoğraf, fiyat, açıklama, alerjen)
- ☐ QR kod standlarını masalara yerleştir
- ☐ Instagram ve Google hesaplarını aç
- ☐ Web sitesi veya dijital menü URL'ini tüm platformlara ekle
- ☐ POS sistemini kur ve menü ile entegre et
- ☐ Personeli dijital araçlar konusunda eğit
- ☐ Wi-Fi altyapısını test et (müşteri ve operasyon ayrı ağ)
- ☐ İlk hafta geri bildirim toplamaya başla

**H2: En Kritik 3 Dijital Araç: Önce Bunları Kurun**
- 1. QR Dijital Menü: Yasal zorunluluk + ilk müşteri izlenimi
- 2. Google İşletme Profili: "Yakınımdaki restoran" aramalarında görünme
- 3. Sosyal medya (Instagram): Açılış öncesi hype, menü tanıtımı, müşteri çekme
- Bu üçü kurulmadan açılış yapılmamalı

**H2: Restoran Türüne Göre Teknoloji İhtiyaçları**
- Fast food/Quick service: self sipariş, hızlı POS, paket servis entegrasyonu
- Fine dining: tablet menü, ayrıntılı besin bilgisi, şarap kartı, çok dilli
- Kafe: basit QR menü, sosyal medya entegrasyonu, Wi-Fi
- Otel restoranı: oda servisi entegrasyonu, çok dilli (en az 4 dil), alerjen zorunlu
- Pastane/Fırın: görsel ağırlıklı menü, online sipariş, paket servis

**H2: İlk 3 Ayda Yapılması Gerekenler**
- Ay 1: Temel dijital altyapı kur, personeli eğit, geri bildirim topla
- Ay 2: Google yorumlarını artır (minimum 20), sosyal medya içerik üretimine başla
- Ay 3: Verileri analiz et (en çok satılan, en az satılan, ortalama puan), menüyü optimize et

**CTA (satır içi — Dijital Kontrol Listesi'nden sonra):**
"Tabbled ile restoranınızın dijital altyapısını 1 günde kurun. QR menü, garson çağırma, WhatsApp sipariş, geri bildirim ve çok dilli menü tek platformda → tabbled.com"

**H2: Sıkça Sorulan Sorular**

FAQ (5 soru):
1. "Restoran açarken QR menü zorunlu mu?" → "Evet, 1 Ocak 2026 itibarıyla Fiyat Etiketi Yönetmeliği gereği yeme-içme işletmelerinin dijital menü sunması zorunludur. QR menü bu zorunluluğu karşılamanın en pratik ve uygun maliyetli yoludur."

2. "Restoran için minimum teknoloji bütçesi ne kadar?" → "2026'da yeni bir restoran için minimum dijital teknoloji yatırımı yaklaşık 20.000-40.000 TL arasındadır. Bu tutara QR menü platformu, POS sistemi, profesyonel fotoğrafçılık, Wi-Fi altyapısı ve QR kod standları dahildir."

3. "POS sistemi ile QR menü entegre olur mu?" → "Bazı QR menü platformları POS entegrasyonu sunar ancak çoğu bağımsız çalışır. Tabbled gibi platformlar menü yönetimini kendi başlarına üstlenir ve POS'tan bağımsız olarak fiyat güncelleme, sipariş alma yapabilir."

4. "Sosyal medya hesabı açılış öncesinde mi kurulmalı?" → "Evet, restoran açılışından en az 2-4 hafta önce Instagram hesabı açılmalı ve açılış öncesi içerikler paylaşılmalıdır. Mutfak hazırlıkları, dekor çalışmaları ve menü tanıtımları ile açılışa ilgi oluşturulmalıdır."

5. "İlk müşteri geri bildirimi ne zaman toplanmalı?" → "İlk günden itibaren geri bildirim toplamaya başlanmalıdır. Dijital menüdeki geri bildirim formu veya Google Reviews yönlendirmesi ile müşteri görüşleri anında toplanır. İlk ay en kritik dönemdir çünkü erken geri bildirimlerle hızlı iyileştirme yapılabilir."

### İç Linkler
- /blog/qr-menu-zorunlulugu-2026
- /blog/qr-menu-fiyatlari-2026
- /blog/restoran-dijital-donusum-rehberi-2026
- /blog/restoran-seo-google-haritalar-rehberi
- /blog/restoran-alerjen-bilgilendirme-rehberi

### Tags
["restoran açmak", "teknoloji yatırımı", "dijital altyapı", "yeni restoran", "2026"]

---

## UYGULAMA TALİMATLARI

### 1. Mevcut blogData.ts'i Oku
```bash
# Dosyadaki mevcut makale sayısını kontrol et
grep -c "slug:" src/lib/blogData.ts
# veya
grep -c "slug:" src/data/blogData.ts
```
6 makale olmalı. Yapıyı anla ve aynı formatta devam et.

### 2. 4 Yeni Makaleyi Ekle
Mevcut diziye (articles array) sona ekle. Format, CSS sınıfları ve HTML yapısı mevcut makalelerle aynı olmalı.

### 3. Sitemap Edge Function Güncelle
supabase/functions/sitemap/index.ts dosyasındaki BLOG_SLUGS dizisine 4 yeni slug ekle:
```
'restoran-musteri-deneyimi-dijital-yolculuk',
'restoran-seo-google-haritalar-rehberi',
'cok-dilli-menu-rehberi-turist-restoran',
'restoran-acmak-teknoloji-yatirim-rehberi-2026',
```

### 4. Sitemap Redeploy
```bash
supabase functions deploy sitemap --project-ref qmnrawqvkwehufebbkxp --no-verify-jwt
```

### 5. Build & Doğrulama
```bash
cd /opt/khp/tabbled
npm run build

# 10 makale var mı?
grep -c "slug:" src/lib/blogData.ts

# Sitemap'te yeni slug'lar var mı?
curl -s https://qmnrawqvkwehufebbkxp.supabase.co/functions/v1/sitemap | grep "restoran-musteri"
curl -s https://qmnrawqvkwehufebbkxp.supabase.co/functions/v1/sitemap | grep "restoran-seo"
curl -s https://qmnrawqvkwehufebbkxp.supabase.co/functions/v1/sitemap | grep "cok-dilli"
curl -s https://qmnrawqvkwehufebbkxp.supabase.co/functions/v1/sitemap | grep "restoran-acmak"
```

---

## HATIRLATMALAR

- Mevcut makalelerin HTML yapısını ve CSS sınıflarını birebir referans al
- İçerik tamamen özgün olmalı — rakip sitelerden kopyalama yapma
- Yasal bilgiler doğrulanabilir olmalı — uydurma istatistik verme
- Fiyat bilgileri gerçekçi ve 2026 Türkiye piyasasına uygun olmalı
- Her makale kendi başına değer vermeli — sadece Tabbled reklamı olmamalı
- Geo optimize: şehir isimleri doğal bağlamda geçmeli
- publishedAt tüm yeni makaleler için "2026-04-11"
- AEO: her h2'nin ilk cümlesi AI motorlarının çekebileceği bağımsız cevap olmalı
