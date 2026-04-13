#!/usr/bin/env python3
# Fix Turkish characters in FeaturesSection.tsx

filepath = '/opt/khp/tabbled/src/components/landing/FeaturesSection.tsx'
content = open(filepath, 'r').read()

replacements = {
    # Tab labels
    '"Menu islemleri"': '"Menü işlemleri"',
    '"AI araclari"': '"AI araçları"',
    '"Misafir katilimi"': '"Misafir katılımı"',
    '"Gorunurluk"': '"Görünürlük"',
    
    # Taglines
    '"Buyume"': '"Büyüme"',
    
    # Headings
    '"Icerik uretimini hizlandiran akilli araclar"': '"İçerik üretimini hızlandıran akıllı araçlar"',
    '"QR menu yonetimi, fiyat guncellemeleri ve daha duzenli operasyon"': '"QR menü yönetimi, fiyat güncellemeleri ve daha düzenli operasyon"',
    '"Garson cagrisi, promosyonlar, geri bildirim"': '"Garson çağrısı, promosyonlar, geri bildirim"',
    '"Cok dilli menu, alerjen bilgisi ve yasal uyuma hazir yayin"': '"Çok dilli menü, alerjen bilgisi ve yasal uyuma hazır yayın"',
    '"Restoran gorunurlugunu artiran SEO ve yorum odakli araclar"': '"Restoran görünürlüğünü artıran SEO ve yorum odaklı araçlar"',
    
    # Descriptions
    'Tabbled, restoranlar icin dijital menuyu statik bir liste olmaktan cikarir. Saatlik ogunler, happy hour, zamanli menuler, fiyat varyantlari ve tukendi yonetimi gibi operasyonel detaylari tek panelden kontrol etmenizi saglar. Boylece menunuz guncel kalir, servis daha duzenli ilerler ve misafirler her zaman dogru bilgiye ulasir.':
    'Tabbled, restoranlar için dijital menüyü statik bir liste olmaktan çıkarır. Saatlik öğünler, happy hour, zamanlı menüler, fiyat varyantları ve tükendi yönetimi gibi operasyonel detayları tek panelden kontrol etmenizi sağlar. Böylece menünüz güncel kalır, servis daha düzenli ilerler ve misafirler her zaman doğru bilgiye ulaşır.',
    
    'Tabbled, restoranlar icin dijital menu yonetimini sadelestirir. Kategori duzenleme, urun guncelleme, fiyat varyantlari, zamanli menuler, happy hour, tukendi isareti ve QR menu yayini gibi temel islemleri tek panelden yonetmenizi saglar. Boylece menu degisiklikleri daha hizli yapilir, ekip az zaman kaybeder ve misafirler her zaman guncel menuye ulasir.':
    'Tabbled, restoranlar için dijital menü yönetimini sadeleştirir. Kategori düzenleme, ürün güncelleme, fiyat varyantları, zamanlı menüler, happy hour, tükendi işareti ve QR menü yayını gibi temel işlemleri tek panelden yönetmenizi sağlar. Böylece menü değişiklikleri daha hızlı yapılır, ekip az zaman kaybeder ve misafirler her zaman güncel menüye ulaşır.',
    
    'Tabbled, QR menuyu pasif bir ekran olmaktan cikarir. Garson cagirma, geri bildirim toplama, promosyon gosterimi ve WhatsApp siparis gibi araclarla misafir deneyimini daha etkilesimli hale getirir. Restoranlar icin bu yapi hem servis akisini iyilestirir hem de misafir memnuniyetini daha gorunur hale getirir.':
    'Tabbled, QR menüyü pasif bir ekran olmaktan çıkarır. Garson çağırma, geri bildirim toplama, promosyon gösterimi ve WhatsApp sipariş gibi araçlarla misafir deneyimini daha etkileşimli hale getirir. Restoranlar için bu yapı hem servis akışını iyileştirir hem de misafir memnuniyetini daha görünür hale getirir.',
    
    'Turistlere hizmet veren veya daha duzenli bir menu altyapisi kurmak isteyen isletmeler icin cok dilli yayin artik onemli bir standart. Tabbled; cok dilli menu yonetimi, alerjen bilgisi, besin degerleri ve baskiya uygun menu ciktisi gibi ozelliklerle restoranlarin hem misafir beklentilerine hem de uyum gereksinimlerine daha rahat cevap vermesini saglar.':
    'Turistlere hizmet veren veya daha düzenli bir menü altyapısı kurmak isteyen işletmeler için çok dilli yayın artık önemli bir standart. Tabbled; çok dilli menü yönetimi, alerjen bilgisi, besin değerleri ve baskıya uygun menü çıktısı gibi özelliklerle restoranların hem misafir beklentilerine hem de uyum gereksinimlerine daha rahat cevap vermesini sağlar.',
    
    'Dijital menu artik sadece masada acilan bir sayfa degil, ayni zamanda restoranin cevrim ici gorunurlugunu destekleyen bir alan. Tabbled, restoran SEO\'su, Google yorum yonlendirmeleri, geri bildirim akisi ve arama odakli icerik yapisiyla isletmelerin dijital gorunurlugunu guclendirmesine yardimci olur. Daha iyi gorunurluk, daha guclu guven ve daha yuksek etkilesim anlamina gelir.':
    'Dijital menü artık sadece masada açılan bir sayfa değil, aynı zamanda restoranın çevrim içi görünürlüğünü destekleyen bir alan. Tabbled, restoran SEO\'su, Google yorum yönlendirmeleri, geri bildirim akışı ve arama odaklı içerik yapısıyla işletmelerin dijital görünürlüğünü güçlendirmesine yardımcı olur. Daha iyi görünürlük, daha güçlü güven ve daha yüksek etkileşim anlamına gelir.',
    
    # Section header
    'Bes temel alan': 'Beş temel alan',
    'Tabbled, dijital menu yonetiminden misafir etkilesimine kadar': 'Tabbled, dijital menü yönetiminden misafir etkileşimine kadar',
    'restoranlarin ihtiyac duydugu temel araclari tek panelde bir araya': 'restoranların ihtiyaç duyduğu temel araçları tek panelde bir araya',
    'getirir. QR menu, cok dilli yayin, AI destekli icerik, geri bildirim': 'getirir. QR menü, çok dilli yayın, AI destekli içerik, geri bildirim',
    've gorunurluk araclariyla daha duzenli bir operasyon kurmaniza': 've görünürlük araçlarıyla daha düzenli bir operasyon kurmanıza',
    'yardimci olur.': 'yardımcı olur.',
    
    # Buttons
    'Kesfet': 'Keşfet',
}

for old, new in replacements.items():
    content = content.replace(old, new)

open(filepath, 'w', encoding='utf-8').write(content)
print('Türkçe karakterler düzeltildi')
