# TEKNİK BORÇ TEMİZLİĞİ
## Claude Code Prompt — 14 Nisan 2026 (v8)

---

## PROJE BAĞLAMI

- **Proje dizini:** /opt/khp/tabbled/
- **Stack:** React + Vite + TypeScript + S.* inline styles
- **Supabase project-ref:** qmnrawqvkwehufebbkxp
- **İkonlar:** Phosphor Icons (@phosphor-icons/react) — SADECE "Thin" ağırlık. Emoji YASAK.
- **Font:** Roboto (son migration — çalışıp çalışmadığını kontrol et)

---

## GÖREV 1: ROBOTO FONT KONTROLÜ

Font migration yapıldı ama public menüde restoran adı Roboto gibi görünmüyor. Kontrol et:

1. `grep -r "Playfair\|playfair" src/` — kalan referans var mı?
2. `grep -r "Inter" src/ --include="*.tsx" --include="*.ts" --include="*.css"` — font-family olarak Inter kalmış mı? (dikkat: "Inter" kelimesi interface gibi kodda da geçebilir, sadece font-family kontekstinde ara)
3. `grep -r "font-family" src/` — tüm font-family tanımlarını listele
4. `cat package.json | grep fontsource` — hangi font paketleri kurulu?
5. index.html'de font preload/link var mı?
6. tailwind.config içinde fontFamily ayarı doğru mu?

**Eğer Roboto düzgün yüklenmemişse:**
- Import'ların doğru dosyada olduğundan emin ol (main.tsx veya App.tsx)
- Global CSS'te body font-family: 'Roboto', sans-serif olmalı
- Tüm inline style font-family referanslarını güncelle

**Eğer gereksiz subset'ler varsa:**
- `ls node_modules/@fontsource/roboto/files/` ile hangi font dosyaları var kontrol et
- Sadece latin gerekli — cyrillic, greek, vietnamese, math, symbols gereksiz
- Latin-only import mümkünse kullan: `import '@fontsource/roboto/latin-300.css'` vb.

---

## GÖREV 2: ÇEVİRİ MERKEZİ PARENT→CHILD TREE

Mevcut çeviri merkezi (admin panel) düz liste olarak kategorileri gösteriyor. Alt kategoriler (parent_id) olan kategoriler ağaç yapısında (tree) gösterilmeli.

1. Çeviri merkezi bileşenini bul (muhtemelen RestaurantDashboard.tsx içinde veya ayrı bileşen)
2. Kategorileri parent→child ilişkisine göre grupla:
   - Parent kategori (parent_id = null): normal satır
   - Child kategori (parent_id != null): indent ile (sol padding 24px), alt kategori ikonu
3. Çeviri listesinde:
   - Ana kategori: bold, normal indent
   - Alt kategori: normal weight, sol indent 24px, küçük "└" veya ince çizgi ile bağlantı
4. Çeviri yapılırken parent'ın altındaki child'lar da görünsün

---

## GÖREV 3: AB NUTRİTİON DİSPLAY

Mevcut besin değerleri gösterimi FDA (Amerikan) tarzında. AB/EU formatına dönüştürülmeli.

### Mevcut durum
- menu_items.nutrition JSONB alanı var (16 alan)
- Detay modalda FDA tarzı tablo gösteriliyor
- kcal badge kartlarda görünüyor

### AB formatı gereksinimleri

**Zorunlu 7 öge (bu sırayla):**
1. Enerji — kJ ve kcal (ikisi birlikte gösterilmeli)
2. Yağ (g)
3. — doymuş yağ (g) (alt satır, indent)
4. Karbonhidrat (g)
5. — şekerler (g) (alt satır, indent)
6. Protein (g)
7. Tuz (g)

**Gösterim:**
- Per 100g ve/veya porsiyon başına (iki sütun)
- Trafik ışığı renk kodları:
  - Yeşil: düşük (yağ <3g, doymuş <1.5g, şeker <5g, tuz <0.3g per 100g)
  - Sarı/Amber: orta
  - Kırmızı: yüksek (yağ >17.5g, doymuş >5g, şeker >22.5g, tuz >1.5g per 100g)
- Referans alım (RI%): günlük önerilen değerin yüzdesi
  - Enerji: 8400kJ / 2000kcal
  - Yağ: 70g
  - Doymuş yağ: 20g
  - Karbonhidrat: 260g
  - Şeker: 90g
  - Protein: 50g
  - Tuz: 6g

**Tetikleme:** kcal badge'ine tıklayınca açılır (mevcut davranış korunabilir)

**UI tasarımı:**
- Kompakt tablo, rounded corners
- Başlık: "Besin Değerleri" (çok dil desteği)
- Alt başlık: "100g başına" | "Porsiyon başına (Xg)"
- Her satırda: öge adı | değer | trafik ışığı dot (8px daire) | RI%
- Doymuş yağ ve şekerler indent (sol padding)
- Toplam enerji satırı üstte, bold
- Altta küçük: "*Yetişkin referans alım değerleri (8400kJ/2000kcal)"

**Tema uyumlu:** light ve dark mode

### Mapping (mevcut nutrition JSONB → AB format)
Mevcut JSONB'deki alanları AB formatına map et:
- calories → enerji (kcal), kJ = kcal × 4.184
- totalFat → yağ
- saturatedFat → doymuş yağ
- carbohydrates → karbonhidrat
- sugar → şekerler
- protein → protein
- sodium → tuz (sodium mg → tuz g: tuz = sodium × 2.5 / 1000)

Eksik alan varsa o satır gösterilmesin.

---

## GÖREV 4: FEEDBACK → OTOMATİK MÜŞTERİ EKLEME

PublicMenu.tsx'teki feedback submit handler'ına otomatik müşteri kaydı ekle:

1. Feedback gönderilirken "Adınız" alanı doluysa:
2. customers tablosunda aynı isim + restaurant_id ile müşteri var mı kontrol et
3. Varsa: `last_visit` güncelle, `visit_count` 1 artır
4. Yoksa: yeni müşteri oluştur (source: 'feedback', name: adı)
5. Hata olursa sessizce logla (feedback gönderimini engelleme)

```typescript
// Pseudo-code
if (customerName && customerName.trim()) {
  const { data: existing } = await supabase
    .from('customers')
    .select('id, visit_count')
    .eq('restaurant_id', restaurantId)
    .eq('name', customerName.trim())
    .maybeSingle();

  if (existing) {
    await supabase.from('customers').update({
      last_visit: new Date().toISOString(),
      visit_count: (existing.visit_count || 1) + 1
    }).eq('id', existing.id);
  } else {
    await supabase.from('customers').insert({
      restaurant_id: restaurantId,
      name: customerName.trim(),
      source: 'feedback',
    });
  }
}
```

---

## GÖREV 5: SPLASH SOSYAL MEDYA İKONLARI

Splash ekranında sosyal medya ikonları görünmüyor. Ekle:

- Konum: dil seçeneklerinin ÜSTÜNDE
- Sıralama: Logo → Ad → Tagline → **Sosyal medya** → "Menüyü Görüntüle" → Dil → Powered by → Değerlendir
- Restaurant verisinden: social_instagram, social_facebook, social_x, social_tiktok, social_website, social_whatsapp, social_google_maps
- Sadece dolu olanlar gösterilsin
- İkon stili: 36px daire (yarı saydam beyaz bg), ikon 18px, gap 12px, yatay center
- Mevcut inline SVG ikonları kullan (7 platform zaten projede var)
- Tıklayınca yeni sekme (target="_blank", rel="noopener")
- Hiç sosyal medya yoksa bölüm gizli
- Tema uyumlu (white/black)

---

## GÖREV 6: BUNDLE OPTİMİZASYONU

1. `npm run build` çıktısındaki chunk boyutlarını raporla
2. Büyük chunk'ları tespit et
3. Kullanılmayan import'ları temizle
4. Mümkünse lazy loading ekle (henüz lazy olmayan büyük bileşenler)
5. Tree-shaking kontrolü (Phosphor Icons doğru import ediliyor mu? Barrel import yerine direkt import)

```bash
# Barrel import (KÖTÜ — tüm ikonları dahil eder):
import { Star, Heart, List } from "@phosphor-icons/react"

# Direkt import (İYİ — sadece kullanılanlar):
import { Star } from "@phosphor-icons/react/dist/ssr/Star"
```

**NOT:** @phosphor-icons/react zaten tree-shakeable olabilir — kontrol et. Eğer barrel import sorun yaratmıyorsa değiştirme.

---

## GENEL KURALLAR

1. **Phosphor Icons:** SADECE Thin ağırlık
2. **Emoji YASAK**
3. **S.* inline styles**
4. **Build test:** `npm run build` — her görev sonrası
5. **Mevcut özellikleri BOZMA**
6. **DB değişikliği YOK** — bu prompt'ta SQL migration yok

---

## TEST CHECKLIST

### Font
- [ ] Roboto tüm sayfalarda yükleniyor (DevTools → Computed → font-family)
- [ ] Playfair Display / Inter referansı projede yok
- [ ] Gereksiz font subset'leri kaldırıldı (mümkünse)
- [ ] Restoran adı başlığı Bold (700)

### Çeviri Tree
- [ ] Çeviri merkezinde parent kategoriler normal
- [ ] Child kategoriler indent ile gösteriliyor
- [ ] Çeviri işlevi bozulmadı

### Nutrition
- [ ] kcal badge'ine tıklayınca AB format besin tablosu açılıyor
- [ ] 7 zorunlu öge doğru sırada
- [ ] Trafik ışığı renkleri doğru (yeşil/sarı/kırmızı)
- [ ] RI% gösteriliyor
- [ ] kJ + kcal birlikte
- [ ] Tuz = sodium × 2.5 / 1000 hesabı doğru
- [ ] Eksik alan gösterilmiyor
- [ ] Light + Dark tema uyumlu

### Feedback → Müşteri
- [ ] İsimli feedback gönderdikten sonra customers tablosunda kayıt var
- [ ] Aynı isimle tekrar feedback → visit_count artıyor
- [ ] İsimsiz feedback → müşteri kaydı yapılmıyor
- [ ] Hata olursa feedback gönderimi engellenmedi

### Splash Sosyal Medya
- [ ] İkonlar splash'ta, dil seçeneklerinin üstünde
- [ ] Sadece dolu alanlar gösteriliyor
- [ ] Tıklayınca yeni sekme
- [ ] Hiç yoksa bölüm gizli

### Bundle
- [ ] Build boyutu raporlandı
- [ ] Gereksiz import yok
- [ ] Büyük chunk'lar tespit edildi

---

## ÖNCELİK SIRASI

1. **Roboto font kontrolü ve fix** (en hızlı, görsel etki büyük)
2. **Splash sosyal medya ikonları** (hızlı, kullanıcı görecek)
3. **Feedback → otomatik müşteri** (basit, CRM değeri)
4. **AB nutrition display** (orta karmaşıklık)
5. **Çeviri tree** (orta karmaşıklık)
6. **Bundle optimizasyonu** (son — analiz + rapor)
