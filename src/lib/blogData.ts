export interface BlogPost {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  category: 'yasal' | 'rehber' | 'ipuclari' | 'urun';
  categoryLabel: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: string;
  updatedAt: string;
  readingTime: number;
  ogImage?: string;
  tags: string[];
  faq?: { question: string; answer: string }[];
  relatedSlugs: string[];
}

export const CATEGORY_COLORS: Record<string, string> = {
  yasal: '#3B82F6',
  rehber: '#10B981',
  ipuclari: '#F59E0B',
  urun: '#FF4F7A',
};

export const blogPosts: BlogPost[] = [
  {
    slug: 'qr-menu-zorunlulugu-2026',
    title: '2026 QR Menü Zorunluluğu: Restoran Sahipleri İçin Tam Rehber',
    metaTitle: '2026 QR Menü Zorunluluğu — Restoran Rehberi | Tabbled',
    metaDescription: 'QR menü zorunluluğu 2026: Fiyat etiketi yönetmeliği, ceza miktarları, geçiş takvimi ve dijital menüye nasıl uyum sağlanır. Restoran sahipleri için kapsamlı rehber.',
    category: 'yasal',
    categoryLabel: 'Yasal Düzenlemeler',
    excerpt: '11 Ekim 2025 Resmi Gazete\'de yayımlanan Fiyat Etiketi Yönetmeliği ile QR menü dönemi resmen başladı. Restoran sahiplerinin bilmesi gereken her şey bu rehberde.',
    author: 'Tabbled Ekibi',
    publishedAt: '2026-04-14T00:00:00Z',
    updatedAt: '2026-04-14T00:00:00Z',
    readingTime: 12,
    tags: ['QR menü', 'zorunluluk', 'fiyat etiketi yönetmeliği', '2026', 'restoran', 'dijital menü'],
    relatedSlugs: ['qr-menu-nedir', 'qr-menu-fiyatlari-2026'],
    faq: [
      { question: 'QR menü zorunlu mu?', answer: 'Evet. 11 Ekim 2025 tarihli Fiyat Etiketi Yönetmeliği değişikliği ile QR kodlu menü gösterimi yasal olarak tanınmıştır. 1 Ocak 2026 itibarıyla restoran, kafe, lokanta ve pastanelerin fiyat listelerini dijital ortamda erişilebilir kılması zorunludur.' },
      { question: 'QR menü kullanmazsam ceza var mı?', answer: 'Fiyat etiketi yönetmeliğine aykırılık durumunda her bir eksik ürün için 2.172 TL idari para cezası uygulanmaktadır. Haksız fiyat artışı tespit edilirse ceza 1.860.170 TL\'ye kadar çıkabilir.' },
      { question: 'Fiziksel menü tamamen kalkıyor mu?', answer: 'Hayır. QR kodlu dijital menü masalarda kullanılabilir ancak müşteri talep ettiğinde fiziksel menü sunmak hâlâ zorunludur. İkisi birlikte kullanılabilir.' },
      { question: 'Servis ücreti ve kuver kalktı mı?', answer: '30 Ocak 2026 tarihli yönetmelik değişikliği ile restoran, kafe ve benzeri işletmelerde servis ücreti, masa ücreti ve kuver ücreti adı altında ilave ödeme talep edilmesi yasaklanmıştır. Tüketiciler yalnızca sipariş ettiklerinin bedelini öderler.' },
      { question: 'Küçük işletmeler de QR menü kullanmak zorunda mı?', answer: 'Evet. Yönetmelik tüm yiyecek-içecek hizmeti sunan işletmeleri kapsamaktadır. Ancak geçiş takvimi işletme büyüklüğüne göre farklıdır: ulusal zincirler 1 Temmuz 2026, 3+ şubeli işletmeler 31 Aralık 2026, diğerleri için de aynı tarihler geçerlidir.' },
    ],
    content: `<h2>2026'da Restoran Sektöründe Ne Değişti?</h2>

<p>Türkiye'de yeme-içme sektörü 2025-2026 döneminde köklü bir dijital dönüşüm sürecine girdi. Ticaret Bakanlığı'nın 11 Ekim 2025 tarihinde Resmi Gazete'de yayımladığı Fiyat Etiketi Yönetmeliği değişikliği, ardından 30 Ocak 2026 tarihli servis ücreti yasağı düzenlemesi ile birlikte restoranlar için yeni bir dönem başladı.</p>

<p>Bu düzenlemeler İstanbul, Ankara, İzmir ve Antalya başta olmak üzere Türkiye genelindeki yüz binlerce restoran, kafe, lokanta ve pastaneyi doğrudan etkiliyor. Peki bu değişiklikler tam olarak ne getiriyor ve siz nasıl uyum sağlayabilirsiniz?</p>

<h2>Fiyat Etiketi Yönetmeliği Nedir?</h2>

<p>6502 sayılı Tüketicinin Korunması Hakkında Kanun kapsamında çıkarılan Fiyat Etiketi Yönetmeliği, işletmelerin fiyat bilgilerini tüketicilere nasıl sunacağını düzenler. 11 Ekim 2025 tarihinde yapılan değişiklik ile yiyecek-içecek sektörüne yönelik önemli yenilikler getirildi.</p>

<p>En dikkat çekici yenilik, masalarda QR kod ile fiyat listesi gösteriminin resmen yasal hale gelmesidir. Daha önce Bakanlık'ın "fiziksel menü esas, QR kod ikincil" yaklaşımı varken, artık QR kodlu dijital menü birincil gösterim yöntemi olarak kabul ediliyor.</p>

<h2>İşletmeler İçin Zorunluluklar</h2>

<h3>Fiyat Listesi Gösterimi</h3>

<p>Yönetmeliğe göre restoran, kafe, lokanta, pastane ve benzeri tüm yiyecek-içecek işletmeleri şu yükümlülüklere tabidir:</p>

<ul>
<li>İşyerinin giriş kapısı önünde fiyat listesi bulundurulmalıdır. Birden fazla giriş varsa her kapıya ayrı liste konulmalıdır.</li>
<li>Masalarda fiyat listesi sunulmalıdır — bu QR kod ile yapılabilir.</li>
<li>Müşteri talep ettiğinde fiziksel menü verilmelidir.</li>
<li>Fiyat listesindeki fiyatlar ile kasa fiyatları arasında fark olmamalıdır.</li>
</ul>

<h3>Servis Ücreti ve Kuver Yasağı</h3>

<p>30 Ocak 2026 tarihli düzenleme ile restoran ve kafelerde servis ücreti, masa ücreti, kuver ücreti ve benzeri herhangi bir ad altında ilave ödeme talep edilmesi yasaklandı. Tüketiciler yalnızca sipariş ettikleri yiyecek ve içeceklerin bedelini ödeyecek; bahşiş tamamen gönüllülük esasına dayalı olacaktır.</p>

<h3>Bakanlığa Veri Aktarımı</h3>

<p>Yönetmeliğin getirdiği bir diğer önemli yenilik, fiyat listelerine ilişkin verilerin Ticaret Bakanlığı tarafından kurulacak elektronik sisteme aktarılması zorunluluğudur. Bu sistem henüz tam olarak devreye girmemiş olsa da, işletmelerin bu konuda hazırlıklı olması gerekmektedir.</p>

<h2>Geçiş Takvimi</h2>

<p>Yönetmelik kademeli olarak uygulanıyor:</p>

<table>
<thead>
<tr><th>İşletme Tipi</th><th>İçerik Bilgisi Son Tarih</th><th>Kalori Bilgisi Son Tarih</th></tr>
</thead>
<tbody>
<tr><td>Ulusal zincir restoranlar</td><td>1 Temmuz 2026</td><td>1 Temmuz 2026</td></tr>
<tr><td>Aynı ilde 3+ şubesi olan işletmeler</td><td>31 Aralık 2026</td><td>31 Aralık 2026</td></tr>
<tr><td>Diğer tüm işletmeler</td><td>31 Aralık 2026</td><td>31 Aralık 2027</td></tr>
</tbody>
</table>

<p>QR kodlu fiyat listesi gösterimi ise 11 Ekim 2025 itibarıyla tüm işletmeler için geçerlidir.</p>

<h2>Uymazsanız Ne Olur? Ceza Miktarları</h2>

<p>Fiyat etiketi yönetmeliğine uyulmamasının ciddi mali sonuçları vardır:</p>

<ul>
<li>Fiyat listesinde eksik ürün bulunması: her bir aykırılık için <strong>2.172 TL</strong> idari para cezası. Örneğin tarifesinde 5 ürünün fiyatı bulunmayan bir işletmeye 5 ayrı ceza uygulanabilir.</li>
<li>Menü fiyatı ile kasa fiyatı arasında fark: <strong>2.172 TL</strong> ve üzeri ceza.</li>
<li>Haksız fiyat artışı (servis ücretini fiyata yedirme gibi): <strong>1.860.170 TL</strong>'ye kadar idari para cezası.</li>
</ul>

<p>2026 yılında ceza miktarları bir önceki yıla göre %49 oranında artırılmıştır. Ticaret Bakanlığı denetimlerini aktif olarak sürdürmekte ve sosyal medya şikayetlerini de takip etmektedir.</p>

<h2>Dijital Menüye Nasıl Geçersiniz? Adım Adım</h2>

<p>İster İstanbul Kadıköy'deki bir kafe olun, ister Antalya'da turistik bir restoran — dijital menüye geçiş süreci aynıdır:</p>

<ol>
<li><strong>Menü içeriğinizi hazırlayın:</strong> Kategoriler, ürünler, fiyatlar ve mümkünse profesyonel fotoğraflar.</li>
<li><strong>QR menü platformu seçin:</strong> Fiyat, özellik ve Türkçe destek açısından karşılaştırma yapın.</li>
<li><strong>Menüyü sisteme girin:</strong> Çoğu platform 30 dakika içinde menünüzü oluşturmanıza imkân tanır.</li>
<li><strong>QR kodlarınızı oluşturun:</strong> Her masa için ayrı veya tek QR kod. Logo ve markanızla özelleştirin.</li>
<li><strong>Masalara yerleştirin:</strong> Pleksi standlar veya yapışkanlı QR kodlar en yaygın yöntemlerdir.</li>
<li><strong>Test edin:</strong> Farklı telefonlardan taratarak menünüzün doğru görüntülendiğinden emin olun.</li>
</ol>

<div class="blog-cta-inline">
<p><strong>Tabbled ile dijital menünüzü 5 dakikada oluşturun.</strong></p>
<p>QR menü zorunluluğuna tam uyum, çok dilli menü, alerjen bilgisi ve daha fazlası.</p>
<a href="https://wa.me/905325119484?text=Merhaba%2C%20Tabbled%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum." target="_blank" rel="noopener">WhatsApp ile İletişim</a>
</div>

<h2>QR Menü Seçerken Nelere Dikkat Etmelisiniz?</h2>

<p>Türkiye'de onlarca QR menü sağlayıcısı bulunuyor. Doğru tercih yapmak için şu kriterlere bakın:</p>

<ul>
<li><strong>Türkçe arayüz ve destek:</strong> Yönetim paneli ve müşteri desteğinin Türkçe olması önemlidir.</li>
<li><strong>Çok dilli menü:</strong> Özellikle İstanbul, Antalya ve İzmir gibi turist yoğun şehirlerde İngilizce, Arapça ve diğer dillerde menü sunabilmek büyük avantajdır.</li>
<li><strong>Alerjen bilgisi gösterimi:</strong> Tarım ve Orman Bakanlığı'nın getirdiği alerjen bilgilendirme zorunluluğuna uyum.</li>
<li><strong>Anlık güncelleme:</strong> Fiyat veya ürün değişikliğinin saniyeler içinde menüye yansıması.</li>
<li><strong>Uygun fiyat:</strong> Aylık 250-300 TL aralığında kaliteli çözümler mevcuttur.</li>
<li><strong>WhatsApp sipariş:</strong> Özellikle paket servis yapan işletmeler için komisyonsuz sipariş alma imkânı.</li>
</ul>

<h2>Sonuç: Zorunluluk mu, Fırsat mı?</h2>

<p>Fiyat Etiketi Yönetmeliği değişikliği ilk bakışta ek bir yük gibi görünebilir. Ancak doğru değerlendirildiğinde, dijital menüye geçiş aslında işletmenizi modernleştirme, müşteri deneyimini iyileştirme ve operasyonel maliyetleri düşürme fırsatıdır.</p>

<p>Kağıt menü basım maliyetlerinden kurtulursunuz, fiyat güncellemelerini anında yaparsınız, yabancı turistlere kendi dillerinde menü sunarsınız ve Google'da bulunabilirliğinizi artırırsınız. Denetimlerin sıkılaştığı bu dönemde erken adapte olan işletmeler hem cezai risklerden uzak kalır hem de rekabet avantajı elde eder.</p>

<p>Ankara'dan Bursa'ya, İzmir'den Trabzon'a — Türkiye'nin her yerindeki restoran sahipleri için dijital menüye geçişin tam zamanıdır.</p>`,
  },
  {
    slug: 'qr-menu-nedir',
    title: 'QR Menü Nedir? Restoran İçin Dijital Menü Sistemi Rehberi',
    metaTitle: 'QR Menü Nedir? Dijital Menü Sistemi Rehberi | Tabbled',
    metaDescription: 'QR menü nedir, nasıl çalışır, avantajları nelerdir? Restoran, kafe ve lokantalar için dijital menü sistemi hakkında bilmeniz gereken her şey.',
    category: 'rehber',
    categoryLabel: 'Rehberler',
    excerpt: 'QR menü, müşterilerin akıllı telefonlarıyla karekod okutarak dijital menüye erişmesini sağlayan modern bir çözümdür. Nasıl çalışır, ne avantaj sağlar?',
    author: 'Tabbled Ekibi',
    publishedAt: '2026-04-14T00:00:00Z',
    updatedAt: '2026-04-14T00:00:00Z',
    readingTime: 10,
    tags: ['QR menü', 'dijital menü', 'karekod menü', 'restoran', 'kafe', 'rehber'],
    relatedSlugs: ['qr-menu-zorunlulugu-2026', 'qr-menu-fiyatlari-2026'],
    faq: [
      { question: 'QR menü için uygulama indirmek gerekiyor mu?', answer: 'Hayır. QR menü web tabanlı çalışır. Müşteriler telefonlarının kamerasıyla QR kodu okuttuğunda tarayıcıda menü sayfası açılır. Herhangi bir uygulama indirmeye gerek yoktur.' },
      { question: 'QR menü tüm telefonlarda çalışır mı?', answer: 'Evet. Hem Android hem iOS telefonlarda sorunsuz çalışır. 2018 ve sonrası üretilen neredeyse tüm akıllı telefonlar QR kodu doğrudan kamerayla okuyabilir.' },
      { question: 'QR menü hangi işletmeler için uygundur?', answer: 'Restoran, kafe, lokanta, pastane, bar, otel restoranı, fast food, beach bar, çay bahçesi — menü sunan her işletme QR menü kullanabilir.' },
      { question: 'QR menü ile sipariş de verilebilir mi?', answer: 'Evet. Gelişmiş QR menü sistemleri sepet oluşturma, WhatsApp ile sipariş gönderme ve hatta online ödeme gibi özellikler sunar. Temel sistemlerde ise sadece menü görüntüleme yapılır.' },
    ],
    content: `<h2>QR Menü Nedir?</h2>

<p>QR menü (karekod menü), restoran ve kafelerde müşterilerin akıllı telefonlarıyla masadaki QR kodu okutarak dijital menüye erişmesini sağlayan modern bir teknolojidir. Müşteri herhangi bir uygulama indirmeden, telefonunun kamerasıyla kodu okutur ve saniyeler içinde menüyü görüntüler.</p>

<p>2025 yılından bu yana Türkiye'de yasal düzenlemelerle desteklenen QR menü, artık restoran sektörünün standart uygulamalarından biri haline gelmiştir.</p>

<h2>QR Menü Nasıl Çalışır?</h2>

<p>Süreç son derece basittir:</p>

<ol>
<li><strong>QR kod taranır:</strong> Müşteri telefonunun kamerasını masadaki QR koda tutar.</li>
<li><strong>Menü açılır:</strong> Ekranda otomatik olarak restoranın dijital menüsü görüntülenir.</li>
<li><strong>Ürünler incelenir:</strong> Fotoğraflar, açıklamalar, fiyatlar, alerjen bilgileri ve kalori değerleri görülür.</li>
<li><strong>Sipariş verilir:</strong> Gelişmiş sistemlerde sepete ürün eklenip WhatsApp veya online sipariş gönderilebilir.</li>
</ol>

<p>Tüm bu süreç herhangi bir uygulama indirmeden, sadece telefonun kamerası ve tarayıcısı ile gerçekleşir.</p>

<h2>Kağıt Menü ile Dijital Menü Karşılaştırması</h2>

<table>
<thead>
<tr><th>Kriter</th><th>Kağıt Menü</th><th>Dijital QR Menü</th></tr>
</thead>
<tbody>
<tr><td>Güncelleme hızı</td><td>Yeniden basım gerekir (günler)</td><td>Anında (saniyeler)</td></tr>
<tr><td>Yıllık maliyet</td><td>2.000-10.000 TL (basım)</td><td>3.600-14.400 TL (yazılım)</td></tr>
<tr><td>Hijyen</td><td>Elden ele geçer</td><td>Temassız</td></tr>
<tr><td>Çok dilli</td><td>Her dil için ayrı basım</td><td>Otomatik çeviri (34+ dil)</td></tr>
<tr><td>Fotoğraf kalitesi</td><td>Basım kalitesine bağlı</td><td>Yüksek çözünürlük</td></tr>
<tr><td>Alerjen bilgisi</td><td>Sınırlı alan</td><td>Detaylı filtreleme</td></tr>
<tr><td>Stok durumu</td><td>Manuel "tükendi" notu</td><td>Anlık güncelleme</td></tr>
<tr><td>Analitik</td><td>Yok</td><td>Hangi ürün kaç kez görüntülendi</td></tr>
<tr><td>Çevresel etki</td><td>Kağıt israfı</td><td>Sıfır atık</td></tr>
</tbody>
</table>

<h2>QR Menünün 10 Avantajı</h2>

<h3>1. Baskı Maliyeti Sıfır</h3>
<p>Kağıt menü yılda en az 2-3 kez güncellenir. Her güncelleme tasarım + basım + laminasyon maliyeti demektir. QR menü ile bu maliyet tamamen ortadan kalkar.</p>

<h3>2. Anlık Fiyat Güncellemesi</h3>
<p>Enflasyon döneminde sık fiyat değişikliği yapmak kaçınılmaz. Dijital menüde fiyatı değiştirdiğiniz an, tüm masalardaki menü güncellenir. Menü fiyatı ile kasa fiyatı arasında tutarsızlık riski sıfıra iner.</p>

<h3>3. Çok Dilli Menü</h3>
<p>İstanbul'un Sultanahmet bölgesinde, Antalya'nın Kaleiçi'nde veya İzmir'in Alsancak'ında turist yoğunluğu yüksektir. QR menü sayesinde müşteriniz menüyü İngilizce, Arapça, Almanca veya Rusça gibi kendi dilinde görür. Çoğu sistem otomatik çeviri sunar.</p>

<h3>4. Hijyenik ve Temassız</h3>
<p>COVID-19 sonrası dönemde müşteriler temassız deneyimi tercih ediyor. QR menü ile fiziksel menüye dokunmak zorunda kalmadan sipariş verebilirler.</p>

<h3>5. Alerjen ve Kalori Bilgisi</h3>
<p>Tarım ve Orman Bakanlığı düzenlemeleri ile alerjen bilgisi gösterimi zorunlu hale geliyor. Dijital menüde 14 temel alerjen ikonu, kalori değeri ve besin tablosu kolayca gösterilebilir. Müşteriler alerjen filtresi uygulayarak güvenli seçimler yapabilir.</p>

<h3>6. Görsel Zenginlik</h3>
<p>Kağıt menüde sınırlı alan ve basım kalitesi vardır. Dijital menüde her ürüne yüksek çözünürlüklü fotoğraf, detaylı açıklama ve hatta video eklenebilir. Görsel sunum sipariş kararını hızlandırır ve ortalama sipariş tutarını artırır.</p>

<h3>7. Tükendi Yönetimi</h3>
<p>Bir ürün tükendiğinde kağıt menüde üstüne not yapıştırmak profesyonel bir görünüm vermez. Dijital menüde tek tıkla "tükendi" işaretleyebilir, müşteri hayal kırıklığını önleyebilirsiniz.</p>

<h3>8. WhatsApp ile Komisyonsuz Sipariş</h3>
<p>Getir veya Trendyol Yemek gibi platformlara %15-25 komisyon ödemek yerine, QR menünüz üzerinden doğrudan WhatsApp ile sipariş alabilirsiniz. Müşteri sepetini oluşturur, tek tuşla WhatsApp mesajı olarak gönderir — komisyon sıfırdır.</p>

<h3>9. Google Görünürlüğü (Lokal SEO)</h3>
<p>Web tabanlı QR menünüz arama motorlarında indekslenir. "Kadıköy restoran menü" veya "Alsancak kafe menü" gibi aramalarda restoranınız öne çıkabilir. Ayrıca Google İşletme Profilinize menü linkinizi ekleyerek müşterilerin daha girmeden menünüzü görmesini sağlayabilirsiniz.</p>

<h3>10. Yasal Uyum</h3>
<p>2025-2026 düzenlemeleri ile QR menü artık sadece tercih değil, yasal bir gereklilik. Dijital menüye geçen işletmeler hem denetimlere hazır olur hem de modernlik algısını güçlendirir.</p>

<div class="blog-cta-inline">
<p><strong>Ücretsiz demo ile Tabbled'ı keşfedin.</strong></p>
<p>34 dilde otomatik çeviri, alerjen filtreleme, WhatsApp sipariş ve daha fazlası.</p>
<a href="https://wa.me/905325119484?text=Merhaba%2C%20Tabbled%20demo%20g%C3%B6rmek%20istiyorum." target="_blank" rel="noopener">Demo Talep Et</a>
</div>

<h2>Hangi İşletmeler QR Menü Kullanabilir?</h2>

<p>QR menü sistemi, menü sunan her işletme için uygundur:</p>

<ul>
<li>Restoranlar (fine dining, casual dining, fast casual)</li>
<li>Kafeler ve kahve dükkanları</li>
<li>Lokantalar ve ev yemekleri</li>
<li>Pastaneler ve fırınlar</li>
<li>Barlar ve gece kulüpleri</li>
<li>Otel restoranları ve oda servisi</li>
<li>Beach bar ve havuz başı servis</li>
<li>Çay bahçeleri</li>
<li>Fast food zincirleri</li>
<li>Food court alanları</li>
</ul>

<p>İstanbul'daki bir fine dining restorandan Antalya'daki bir beach bara, Ankara'daki bir ev yemekleri lokantasından İzmir'deki bir brunch kafesine kadar — QR menü her ölçekte işletmeye uyum sağlar.</p>

<h2>QR Menü Sistemi Seçerken 5 Kritik Kriter</h2>

<ol>
<li><strong>Kullanım kolaylığı:</strong> Teknik bilgi gerektirmeden menü oluşturabilmeli ve güncelleyebilmelisiniz.</li>
<li><strong>Çok dilli destek:</strong> Özellikle turistik bölgelerde otomatik çeviri olmazsa olmazdır.</li>
<li><strong>Fiyat/performans dengesi:</strong> Aylık 250-300 TL aralığında kaliteli çözümler mevcuttur. USD bazlı fiyatlandırma yapan global rakipler çok daha pahalı olabilir.</li>
<li><strong>Türkçe destek:</strong> Sorun yaşadığınızda Türkçe yardım alabilmeniz önemlidir.</li>
<li><strong>Gelecek uyum:</strong> Sipariş, ödeme, alerjen bilgisi gibi gelecekte ihtiyaç duyacağınız özelliklerin yol haritasında olması.</li>
</ol>

<h2>Sonuç</h2>

<p>QR menü artık "olsa iyi olur" değil, "olmazsa olmaz" bir araçtır. Yasal zorunluluklar, müşteri beklentileri ve operasyonel verimlilik — üçü de dijital menüye geçişi işaret ediyor.</p>

<p>Doğru platform seçimiyle hem yasalara uyum sağlar, hem müşteri deneyimini iyileştirir, hem de baskı maliyetlerinden kurtulursunuz. Türkiye'nin her köşesindeki restoran sahipleri için dijital dönüşüm artık tek tuş uzağınızda.</p>`,
  },
  {
    slug: 'qr-menu-fiyatlari-2026',
    title: 'QR Menü Sistemi Fiyatları 2026: Karşılaştırmalı Rehber',
    metaTitle: 'QR Menü Fiyatları 2026 — Karşılaştırma Rehberi | Tabbled',
    metaDescription: 'QR menü sistemi fiyatları 2026: Menulux, FineDine ve Tabbled karşılaştırması. Hangisi daha uygun, hangisi daha çok özellik sunuyor?',
    category: 'rehber',
    categoryLabel: 'Rehberler',
    excerpt: 'Türkiye\'deki QR menü sağlayıcılarının 2026 fiyatlarını, özelliklerini ve gizli maliyetlerini karşılaştırdık. Hangi plan işletmenize uygun?',
    author: 'Tabbled Ekibi',
    publishedAt: '2026-04-14T00:00:00Z',
    updatedAt: '2026-04-14T00:00:00Z',
    readingTime: 8,
    tags: ['QR menü fiyatları', 'dijital menü fiyat', 'karşılaştırma', 'Menulux', 'FineDine', 'Tabbled'],
    relatedSlugs: ['qr-menu-nedir', 'qr-menu-zorunlulugu-2026'],
    faq: [
      { question: 'En ucuz QR menü sistemi hangisi?', answer: 'Türkiye\'de en uygun fiyatlı profesyonel QR menü sistemi aylık 250-300 TL aralığında başlamaktadır. Ücretsiz çözümler de mevcut olmakla birlikte genellikle sınırlı özellik sunar ve profesyonel destek içermez.' },
      { question: 'QR menü için yıllık ne kadar ödenir?', answer: 'Temel QR menü paketleri yıllık 3.000-3.600 TL, orta seviye paketler 7.200-8.400 TL, premium paketler ise 14.400 TL ve üzeri fiyatlandırılmaktadır. Yıllık ödeme yapıldığında genellikle %10-20 indirim uygulanır.' },
      { question: 'FineDine neden bu kadar pahalı?', answer: 'FineDine USD bazlı fiyatlandırma yapmaktadır ve global pazara hitap eder. Aylık $39-119 aralığındaki fiyatları TL\'ye çevrildiğinde aylık 1.400-4.200 TL arasına denk gelir. Buna karşın Türkiye pazarına özel fiyatlandırma yapan alternatifler çok daha uygun fiyatlıdır.' },
      { question: 'QR menü sisteminin gizli maliyetleri var mı?', answer: 'Bazı sağlayıcılarda kurulum ücreti, eğitim bedeli, ek kullanıcı ücreti, SMS/bildirim paketi veya ek şube ücreti olabilir. Sözleşme imzalamadan önce tüm maliyetleri netleştirmeniz önerilir.' },
    ],
    content: `<h2>QR Menü Sistemi Fiyatını Belirleyen Faktörler</h2>

<p>QR menü sistemi fiyatları sağlayıcıdan sağlayıcıya önemli farklılıklar gösterir. Fiyatı belirleyen temel faktörler şunlardır:</p>

<ul>
<li><strong>Özellik kapsamı:</strong> Temel menü görüntüleme mi, yoksa sipariş, ödeme, CRM dahil tam paket mi?</li>
<li><strong>Şube sayısı:</strong> Tek şube ile çoklu şube arasında ciddi fiyat farkları olabilir.</li>
<li><strong>Kullanıcı sayısı:</strong> Kaç kişi panele erişebilecek?</li>
<li><strong>Dil desteği:</strong> Kaç dilde menü sunulabilecek?</li>
<li><strong>Destek seviyesi:</strong> E-posta destek mi, telefon desteği mi, 7/24 mi?</li>
<li><strong>Para birimi:</strong> TL bazlı mı, USD bazlı mı? Kur farkı büyük maliyet farkı yaratır.</li>
</ul>

<h2>Türkiye'deki QR Menü Sağlayıcıları ve Fiyatları</h2>

<h3>Menulux</h3>

<p>Türkiye merkezli QR menü ve restoran otomasyon çözümü. POS entegrasyonu güçlü.</p>

<table>
<thead>
<tr><th>Kriter</th><th>Detay</th></tr>
</thead>
<tbody>
<tr><td>Aylık fiyat</td><td>250 TL'den başlayan</td></tr>
<tr><td>Yıllık fiyat</td><td>~3.000 TL</td></tr>
<tr><td>Para birimi</td><td>TL</td></tr>
<tr><td>Dil desteği</td><td>80+ dil, otomatik çeviri</td></tr>
<tr><td>POS entegrasyonu</td><td>Var (kendi POS sistemi ile)</td></tr>
<tr><td>Sipariş</td><td>Var (masa + gel-al)</td></tr>
<tr><td>Güçlü yön</td><td>POS entegrasyonu, Türkiye odaklı</td></tr>
<tr><td>Zayıf yön</td><td>Tek ürün, POS olmadan sınırlı</td></tr>
</tbody>
</table>

<h3>FineDine</h3>

<p>Türkiye merkezli ama global pazara hitap eden premium dijital menü platformu. Güçlü özellik seti.</p>

<table>
<thead>
<tr><th>Plan</th><th>Aylık Fiyat (USD)</th><th>TL Karşılığı (Yaklaşık)</th></tr>
</thead>
<tbody>
<tr><td>Base</td><td>$39/ay</td><td>~1.400 TL/ay</td></tr>
<tr><td>Essentials</td><td>$79/ay</td><td>~2.800 TL/ay</td></tr>
<tr><td>Premium</td><td>$119/ay</td><td>~4.200 TL/ay</td></tr>
</tbody>
</table>

<p>Yıllık ödeme yapıldığında indirim uygulanır. FineDine güçlü özellikler sunar — AI menü açıklaması, POS entegrasyonu, gelişmiş analitik — ancak USD bazlı fiyatlandırma Türkiye'deki KOBİ'ler için yüksek olabilir.</p>

<h3>Tabbled</h3>

<p>Türkiye pazarı için özel olarak geliştirilmiş dijital menü platformu. "FineDine özellikleri, yerel fiyat" konumlandırması.</p>

<table>
<thead>
<tr><th>Plan</th><th>Aylık Karşılığı</th><th>Yıllık Fiyat</th><th>Özellik Sayısı</th></tr>
</thead>
<tbody>
<tr><td>Basic</td><td>300 TL/ay</td><td>3.600 TL/yıl</td><td>4 temel özellik</td></tr>
<tr><td>Pro</td><td>600 TL/ay</td><td>7.200 TL/yıl</td><td>18 özellik</td></tr>
<tr><td>Premium</td><td>1.200 TL/ay</td><td>14.400 TL/yıl</td><td>40 özellik</td></tr>
</tbody>
</table>

<p>Tabbled sadece yıllık ödeme kabul eder. Tüm planlar TL bazlıdır, kur riski yoktur. Pro ve Premium planlarda AI menü açıklaması, çok dilli menü (34 dil), WhatsApp sipariş, garson çağırma, geri bildirim sistemi ve indirim kodları dahildir.</p>

<h2>Karşılaştırma Tablosu</h2>

<table>
<thead>
<tr><th>Özellik</th><th>Menulux</th><th>FineDine Base</th><th>Tabbled Basic</th><th>Tabbled Pro</th></tr>
</thead>
<tbody>
<tr><td>Aylık maliyet</td><td>250 TL</td><td>~1.400 TL</td><td>300 TL</td><td>600 TL</td></tr>
<tr><td>Para birimi</td><td>TL</td><td>USD</td><td>TL</td><td>TL</td></tr>
<tr><td>QR menü</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td></tr>
<tr><td>Çok dilli</td><td>✓ (80+ dil)</td><td>✓ (22 dil)</td><td>Sadece TR</td><td>2 dil</td></tr>
<tr><td>Alerjen bilgisi</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td></tr>
<tr><td>WhatsApp sipariş</td><td>✗</td><td>✗</td><td>✗</td><td>✓</td></tr>
<tr><td>AI açıklama yazıcı</td><td>✗</td><td>✓ (Premium)</td><td>✗</td><td>✓</td></tr>
<tr><td>Garson çağırma</td><td>✗</td><td>✗</td><td>✗</td><td>✓</td></tr>
<tr><td>Geri bildirim</td><td>✗</td><td>✗</td><td>✗</td><td>✓</td></tr>
<tr><td>Google yönlendirme</td><td>✗</td><td>✗</td><td>✗</td><td>✓</td></tr>
<tr><td>POS entegrasyonu</td><td>✓</td><td>✓ (Premium)</td><td>✗</td><td>✗</td></tr>
<tr><td>Türkçe destek</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td></tr>
</tbody>
</table>

<h2>Gizli Maliyetler: Nelere Dikkat Etmelisiniz?</h2>

<p>QR menü sağlayıcılarının ilan ettikleri fiyat her zaman toplam maliyeti yansıtmaz. Şu kalemleri sorgulamanızı öneririz:</p>

<ul>
<li><strong>Kurulum ücreti:</strong> Bazı sağlayıcılar tek seferlik kurulum bedeli alır.</li>
<li><strong>Eğitim ücreti:</strong> Panel eğitimi için ek ücret talep edilebilir.</li>
<li><strong>Ek kullanıcı ücreti:</strong> Temel planlarda genellikle 1 kullanıcı dahildir, ek kullanıcılar ücretli olabilir.</li>
<li><strong>SMS/bildirim paketi:</strong> Sipariş bildirimi için SMS paketi gerekebilir.</li>
<li><strong>Ek şube ücreti:</strong> İkinci şubeniz için tam fiyat ödemek zorunda kalabilirsiniz.</li>
<li><strong>QR kod basım ücreti:</strong> Profesyonel QR standları bazı sağlayıcılardan ayrıca satın alınır.</li>
<li><strong>Kur riski:</strong> USD veya EUR bazlı fiyatlarda TL değer kaybettiğinde maliyetiniz artar.</li>
</ul>

<div class="blog-cta-inline">
<p><strong>Tabbled'da gizli maliyet yoktur.</strong></p>
<p>TL bazlı şeffaf fiyatlandırma, kurulum ücreti yok, eğitim dahil.</p>
<a href="/#pricing">Fiyatları İncele</a>
</div>

<h2>Hangi Plan Size Uygun?</h2>

<h3>Tek şubeli küçük kafe veya lokanta</h3>
<p>İstanbul Kadıköy'deki bir brunch kafesi veya Ankara Kızılay'daki bir ev yemekleri lokantası iseniz, aylık 250-300 TL aralığındaki temel paketler yeterli olacaktır. QR menü, fotoğraflı ürünler ve alerjen bilgisi bu paketle karşılanır.</p>

<h3>Turist bölgesindeki restoran</h3>
<p>Antalya Kaleiçi'nde, İstanbul Sultanahmet'te veya İzmir Alsancak'ta çok uluslu müşteri ağırlıyorsanız, çok dilli menü ve WhatsApp sipariş özellikleri olan orta seviye bir pakete ihtiyacınız var. Aylık 600-800 TL aralığı.</p>

<h3>Zincir restoran veya çoklu şube</h3>
<p>Birden fazla şubeniz varsa ve merkezi yönetim, analitik ve POS entegrasyonu istiyorsanız premium paketlere bakmalısınız. Aylık 1.200+ TL. POS entegrasyonu şu an sadece Menulux ve FineDine'da mevcut.</p>

<h2>Kağıt Menü ile Dijital Menü Maliyet Karşılaştırması</h2>

<p>Dijital menüyü bir maliyet olarak değil, tasarruf olarak düşünün:</p>

<table>
<thead>
<tr><th>Kalem</th><th>Kağıt Menü (Yıllık)</th><th>Dijital Menü (Yıllık)</th></tr>
</thead>
<tbody>
<tr><td>İlk basım (50 adet)</td><td>2.000-5.000 TL</td><td>0 TL</td></tr>
<tr><td>Yıl içi güncelleme (3x)</td><td>3.000-6.000 TL</td><td>0 TL</td></tr>
<tr><td>Laminasyon / ciltleme</td><td>500-1.500 TL</td><td>0 TL</td></tr>
<tr><td>Dijital menü yazılım ücreti</td><td>0 TL</td><td>3.600-14.400 TL</td></tr>
<tr><td><strong>Toplam</strong></td><td><strong>5.500-12.500 TL</strong></td><td><strong>3.600-14.400 TL</strong></td></tr>
</tbody>
</table>

<p>Temel QR menü paketi (yıllık 3.600 TL) çoğu durumda kağıt menüden daha ekonomiktir. Üstelik kağıt menüde olmayan çok dilli destek, anlık güncelleme ve alerjen filtreleme gibi özellikler bonus olarak gelir.</p>

<h2>Sonuç ve Tavsiyemiz</h2>

<p>Eğer POS entegrasyonu birincil önceliğinizse Menulux, global ölçekte premium özellikler istiyorsanız ve bütçeniz uygunsa FineDine değerlendirilecek seçeneklerdir. Ancak Türkiye pazarında uygun fiyatla kapsamlı özellikler arıyorsanız — çok dilli menü, WhatsApp sipariş, AI açıklama yazıcı, garson çağırma ve geri bildirim sistemi dahil — Tabbled en dengeli seçimdir.</p>

<p>Unutmayın: en pahalı sistem en iyi sistem değildir. İşletmenizin büyüklüğüne, müşteri profilinize ve önceliklerinize göre doğru planı seçmek, hem bütçenizi hem de müşteri memnuniyetinizi koruyacaktır.</p>`,
  },
];

export const getPostBySlug = (slug: string): BlogPost | undefined =>
  blogPosts.find(p => p.slug === slug);

export const getPostsByCategory = (category: string): BlogPost[] =>
  blogPosts.filter(p => p.category === category);

export const getRelatedPosts = (post: BlogPost): BlogPost[] =>
  post.relatedSlugs
    .map(slug => getPostBySlug(slug))
    .filter(Boolean) as BlogPost[];

export const getAllCategories = (): { id: string; label: string; count: number }[] => {
  const categories = new Map<string, { label: string; count: number }>();
  blogPosts.forEach(post => {
    const existing = categories.get(post.category);
    if (existing) {
      existing.count++;
    } else {
      categories.set(post.category, { label: post.categoryLabel, count: 1 });
    }
  });
  return Array.from(categories.entries()).map(([id, data]) => ({ id, ...data }));
};
