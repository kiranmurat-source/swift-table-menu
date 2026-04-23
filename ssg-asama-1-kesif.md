# SSG Pre-rendering — Aşama 1: Keşif & Hazırlık

**Proje:** swift-table-menu (tabbled.com)
**Branch:** `main` üzerinde çalış ama HİÇBİR DEĞİŞİKLİK YAPMA, sadece oku ve rapor et
**Tahmini süre:** 45-60 dakika
**Aşama amacı:** Kod yazmadan mevcut yapıyı keşfet, riskleri çıkar, Aşama 2 için karar verilmesi gereken noktaları netleştir

---

## KRİTİK KURAL

**Bu session'da HİÇBİR DOSYA DEĞİŞTİRİLMEYECEK, HİÇBİR PAKET YÜKLENMEYECEK, HİÇBİR COMMIT YAPILMAYACAK.**

Sadece:
- Dosyaları oku
- `grep` / `find` komutlarıyla kod ara
- `package.json` içeriğini oku (değiştirme)
- Output olarak bir rapor dosyası oluştur: `/opt/khp/tabbled/ssg-kesif-raporu.md`

Herhangi bir `npm install`, `git add`, `git commit`, dosya düzenleme YOK.

---

## GÖREV 1: Router yapısını çıkar

Projede kullanılan React Router konfigürasyonunu tespit et.

### Sorular (raporda cevapla):

1. **Hangi pattern kullanılıyor?**
   - [ ] `<BrowserRouter>` + inline `<Route>` JSX
   - [ ] `createBrowserRouter` + route config array
   - [ ] Başka pattern (açıkla)

2. **Router kurulumu hangi dosyada?**
   - Ana giriş: `src/main.tsx` mi `src/App.tsx` mi?
   - Tam dosya yolunu ve router tanımının satır numaralarını ver

3. **Tüm route'ları listele.** Her biri için:
   - Path (örn. `/`, `/blog/:slug`, `/dashboard`)
   - Hangi component render ediliyor
   - Auth-gated mi? (ProtectedRoute / guard var mı?)
   - Nested route'lar var mı?

### Komutlar:

```bash
cd /opt/khp/tabbled
cat src/main.tsx
cat src/App.tsx
grep -rn "BrowserRouter\|createBrowserRouter\|Route " src/ --include="*.tsx" --include="*.ts" | head -50
grep -rn "path=" src/ --include="*.tsx" --include="*.ts" | head -50
```

---

## GÖREV 2: Supabase kullanım audit'i

SSG build zamanında Supabase'e bağlanmaya çalışan componentler build'i patlatır. Hangi componentlerin risk taşıdığını çıkar.

### Sorular (raporda cevapla):

1. **Supabase client hangi dosyalarda import ediliyor?**
2. **Bu import'lardan hangileri aşağıdaki SSG kapsamındaki sayfaların render tree'sinde?**

SSG kapsamındaki sayfalar (prompt'ta belirlenmişti):
- `/` (landing — `Index.tsx`)
- `/blog` (blog list)
- `/blog/:slug` (blog detail)
- `/iletisim` (contact)
- `/menu/demo` (demo menu)
- `/privacy`
- `/hakkimizda` (varsa)

Her biri için: render tree'sinde Supabase çağrısı var mı, varsa `useEffect` içinde mi yoksa render'da mı (riskli olan ikincisi)?

### Komutlar:

```bash
grep -rn "from.*supabase\|supabase\." src/ --include="*.tsx" --include="*.ts" | head -80
find src/pages -name "*.tsx" -exec echo "=== {} ===" \; -exec grep -l "supabase" {} \;
```

Her bir SSG sayfası için:
```bash
cat src/pages/Index.tsx | grep -n "supabase\|useEffect\|useQuery" | head -20
# diğer sayfalar için tekrarla
```

---

## GÖREV 3: `/hakkimizda` route'u var mı?

Orijinal prompt "varsa pre-render et" diyor. Mevcut mu kontrol et.

```bash
grep -rn "hakkimizda\|Hakkimizda\|About" src/ --include="*.tsx" | head -20
ls src/pages/ | grep -i "hakki\|about"
```

---

## GÖREV 4: Blog data yapısını çıkar

Blog slug'ları SSG config'inde kullanılacak. Nasıl saklanıyor?

### Sorular:

1. `blogData.ts` dosyası nerede? (`src/data/blogData.ts` olabilir)
2. Kaç blog postu var?
3. Her postun yapısı nasıl (slug, title, description, content alanları var mı)?
4. Slug'ları nasıl import edilir? (`import { blogPosts } from ...`)

### Komutlar:

```bash
find src/ -name "blogData*" -o -name "blog-data*" -o -name "blogs.ts"
# bulduğun dosyayı oku:
cat src/data/blogData.ts | head -60
# slug sayısını say:
grep -c "slug:" src/data/blogData.ts
```

---

## GÖREV 5: `react-helmet-async` kullanımı

SSG'de helmet tag'lerinin yakalanması için mevcut kurulumu anla.

### Sorular:

1. `HelmetProvider` nerede sarıyor? (`main.tsx` muhtemelen)
2. Hangi sayfalar `<Helmet>` kullanıyor?
3. `react-helmet-async` versiyon kaç? (`package.json`'dan)

### Komutlar:

```bash
grep -rn "HelmetProvider\|<Helmet" src/ --include="*.tsx" | head -30
grep "react-helmet-async" package.json
```

---

## GÖREV 6: Vercel konfigürasyonu

Deploy ayarlarını anla — SSG sonrası değişiklik gerekecek mi?

### Sorular:

1. `vercel.json` var mı? İçeriği nedir?
2. `package.json`'da `build` script ne çalıştırıyor?
3. Vite version kaç? (SSG paketi uyumluluğu için)
4. SPA rewrite'ları var mı (`vercel.json` `rewrites` field)?

### Komutlar:

```bash
cat vercel.json 2>/dev/null || echo "vercel.json yok"
cat package.json | grep -A 10 "scripts"
cat package.json | grep -E "vite|react-router"
```

---

## GÖREV 7: Mevcut build'in boyutu ve süresi

Baseline ölçümü — SSG sonrası karşılaştırma için.

### Komutlar:

```bash
# Build zamanı ölç (mevcut SPA build)
cd /opt/khp/tabbled
time npm run build 2>&1 | tail -30

# Build output boyutu
du -sh dist/
ls -la dist/
find dist -name "*.html" | wc -l
find dist -name "*.js" | head -5
```

---

## GÖREV 8: Risk analizi

Yukarıdaki 7 görevden topladığın bilgiyle, aşağıdaki soruları cevapla:

### Risk 1: Router refactor gerekecek mi?

Eğer GÖREV 1'de `<BrowserRouter>` + inline `<Route>` pattern bulunduysa, `vite-react-ssg`'nin bunu kabul edip etmediğini `vite-react-ssg` README'sinden kontrol et:

```bash
# vite-react-ssg henüz kurulu değil, README'yi webden oku:
# https://github.com/zhongjyuan/vite-react-ssg
# veya:
# https://www.npmjs.com/package/vite-react-ssg
```

Cevapla: **"Mevcut router pattern ile `vite-react-ssg` direkt çalışır mı, yoksa refactor gerekir mi?"**

### Risk 2: `/menu/demo` Supabase'den mi çekiyor?

GÖREV 2'deki audit'ten. Eğer `/menu/demo` Supabase'den veri çekiyorsa SSG'de sorun olur. Çözüm ne olabilir:
- [ ] Demo data'yı hardcode et
- [ ] `/menu/demo`'yu SSG kapsamından çıkar
- [ ] `ClientOnly` wrapper kullan

### Risk 3: Hangi componentler `ClientOnly` guard'a ihtiyaç duyacak?

GÖREV 2'deki liste + hangi sayfalarda görünüyorlar.

### Risk 4: Build süresi sorunu var mı?

GÖREV 7'den baseline. SSG ~15 sayfa render edeceği için build 2-3x uzayabilir. Vercel build timeout limiti var mı?

---

## ÇIKTI FORMATI

Raporu `/opt/khp/tabbled/ssg-kesif-raporu.md` dosyasına yaz. Format:

```markdown
# SSG Pre-rendering Keşif Raporu

Tarih: [bugünün tarihi]
Branch: main
Değişiklik yapıldı mı: HAYIR (sadece keşif)

## 1. Router Yapısı

- Pattern: [cevap]
- Dosya: [yol]
- Refactor gerekli: EVET/HAYIR
- Route listesi:
  - `/` → `Index.tsx`, auth: hayır
  - ...

## 2. Supabase Audit

### Risk: YÜKSEK olan sayfalar (SSG'de patlar)
- [sayfa adı] — [hangi component] — [neden riskli]

### Risk: DÜŞÜK olan sayfalar (render-safe)
- ...

## 3. Route: /hakkimizda

Mevcut mu: EVET / HAYIR

## 4. Blog Data

- Dosya: [yol]
- Blog sayısı: [N]
- Slug listesi: [liste]

## 5. Helmet Kullanımı

- HelmetProvider: [dosya, satır]
- Kullanan sayfalar: [liste]
- Versiyon: [x.y.z]

## 6. Vercel Config

- vercel.json mevcut mu: EVET/HAYIR
- Build script: [komut]
- Vite versiyon: [x.y.z]
- SPA rewrites: [varsa içeriği]

## 7. Baseline Metrikleri

- Build süresi: [X saniye]
- dist/ boyutu: [N MB]
- HTML dosya sayısı: [N]

## 8. Risk Analizi ve Aşama 2 Kararları

### Router refactor kararı
- [Öneri: refactor yap VEYA manual path list modu kullan]
- Gerekçe: ...

### Supabase-dependent sayfalar için çözüm
- `/menu/demo`: [çözüm]
- Diğer componentler: [çözüm listesi]

### Aşama 2'ye geçmeden önce sorulması gereken sorular
- [soru 1]
- [soru 2]

## Sonraki Adımlar

Aşama 2'de yapılacaklar:
1. ...
2. ...

## Beklenmedik Bulgular

[Varsa: "PublicMenu.tsx içinde X garip bir pattern var" gibi]
```

---

## GENEL KURALLAR

1. **HİÇBİR DEĞİŞİKLİK YAPMA.** Dosya düzenleme, `npm install`, `git commit` — hepsi yasak.
2. **Sadece okuma ve arama komutları kullan.** `cat`, `grep`, `find`, `ls`, `cat package.json`.
3. **Build sadece bir kez, baseline için çalıştır.** Başka build yok.
4. **Rapor dosyasını `/opt/khp/tabbled/ssg-kesif-raporu.md` yoluna yaz.** Bu dosyanın oluşturulması bu session'ın TEK yazma işlemidir.
5. **Emin değilsen not düş.** "Bu kısmı tam anlayamadım, Aşama 2'de dikkat edilmeli" gibi.
6. **Türkçe yaz raporu.** Murat okuyacak.

---

## TEST CHECKLIST

Aşama 1 bitince şu soruların hepsinin cevabı raporda olmalı:

- [ ] Mevcut router pattern nedir?
- [ ] `vite-react-ssg` mevcut router ile uyumlu mu yoksa refactor mi gerekli?
- [ ] Hangi sayfalar Supabase'den render zamanında veri çekiyor?
- [ ] `/menu/demo` SSG-safe mi?
- [ ] Blog slug listesi nerede, kaç tane var?
- [ ] `/hakkimizda` route'u var mı?
- [ ] Helmet kurulumu SSG'ye hazır mı?
- [ ] `vercel.json` ve build script'i ne durumda?
- [ ] Mevcut build süresi ne kadar (baseline)?
- [ ] Aşama 2'de karar verilmesi gereken sorular neler?

---

## ÖNCELİK SIRASI

1. GÖREV 1, 2, 4 — kritik (Aşama 2 kararlarını belirliyor)
2. GÖREV 5, 6 — önemli (kurulum detayları)
3. GÖREV 3 — basit (var/yok sorusu)
4. GÖREV 7 — baseline (sadece karşılaştırma için)
5. GÖREV 8 — sentez (diğerlerinden sonra yaz)

---

**END OF PROMPT — Aşama 1**

Bu prompt sadece keşif ve raporlama içindir. Aşama 2 (implementation) ayrı bir prompt'ta verilecek, rapor incelendikten sonra.
