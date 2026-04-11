# CLAUDE CODE PROMPT — TAM PROJE AUDIT
## Tabbled.com Kapsamlı Kod ve Altyapı Denetimi

---

## GÖREV

Tabbled.com projesinin tüm katmanlarını denetle. Hata, tutarsızlık, performans sorunu, güvenlik açığı ve iyileştirme fırsatlarını raporla. KOD DEĞİŞİKLİĞİ YAPMA — sadece bulgularını raporla.

---

## PROJE BİLGİLERİ

- **Proje dizini:** /opt/khp/tabbled/
- **Stack:** React + Vite + TypeScript + shadcn/ui
- **Deploy:** Vercel (otomatik GitHub push)
- **Backend:** Supabase (PostgreSQL + RLS + Edge Functions + Storage + Image Transforms)
- **Domain:** tabbled.com

---

## AUDIT KAPSAMI (8 KATEGORİ)

### 1. BUILD & BUNDLE ANALİZİ

```bash
# Build ve chunk analizi
cd /opt/khp/tabbled
npm run build 2>&1

# Bundle boyutları
ls -lhS dist/assets/*.js | head -20
ls -lhS dist/assets/*.css | head -10

# Toplam bundle
du -sh dist/

# Büyük dosyalar (>50KB)
find dist/assets -name "*.js" -size +50k -exec ls -lh {} \;
```

**Kontrol et:**
- Toplam bundle boyutu makul mü? (hedef: <300KB gzip)
- En büyük chunk hangisi? Code split gerekli mi?
- Kullanılmayan bağımlılıklar var mı?
- Tree shaking düzgün çalışıyor mu?

### 2. DOSYA YAPISI & KOD KALİTESİ

```bash
# En büyük kaynak dosyalar (satır sayısı)
find src -name "*.tsx" -o -name "*.ts" | xargs wc -l | sort -rn | head -20

# Kullanılmayan dosyalar (import edilmeyen)
# Her dosyayı kontrol et — orphan bileşen var mı?

# Console.log'lar (production'da olmamalı)
grep -rn "console\.log\|console\.warn\|console\.error" src/ --include="*.tsx" --include="*.ts" | grep -v "node_modules" | grep -v "// " | head -30

# TODO/FIXME/HACK yorumları
grep -rn "TODO\|FIXME\|HACK\|XXX" src/ --include="*.tsx" --include="*.ts" | head -20

# TypeScript any kullanımı
grep -rn ": any\|as any" src/ --include="*.tsx" --include="*.ts" | head -20

# Hardcoded URL'ler veya API key'ler
grep -rn "supabase\.co\|localhost\|127\.0\.0\|api_key\|apikey\|secret" src/ --include="*.tsx" --include="*.ts" | grep -v "node_modules" | head -20
```

**Kontrol et:**
- 1000+ satırlık dosyalar — split gerekli mi?
- Orphan bileşenler (hiçbir yerden import edilmeyen)
- Production'da console.log
- TypeScript any kötüye kullanımı
- Hardcoded credentials

### 3. ROUTING & VERCEL YAPISI

```bash
# Route tanımları
grep -rn "Route\|path=" src/App.tsx src/main.tsx

# Vercel rewrites
cat vercel.json

# Tüm sayfalar
ls src/pages/

# Lazy loading kontrolü
grep -rn "React.lazy\|lazy(" src/App.tsx src/main.tsx
```

**Kontrol et:**
- Her sayfa için vercel.json rewrite var mı? (SPA routing)
- Lazy loading uygulanmış mı? Hangi sayfalar lazy?
- 404 handling düzgün mü?
- /menu/demo route'u çalışıyor mu?
- /iletisim route'u var mı?

### 4. SUPABASE & VERİTABANI

```bash
# Supabase client kullanımı
grep -rn "supabase\." src/ --include="*.tsx" --include="*.ts" | grep -v "node_modules" | grep -v "supabase.ts" | wc -l

# RLS kontrol — her tablo için policy var mı?
# (Bu kısım Supabase Dashboard'dan kontrol edilmeli — burada sadece kullanılan tabloları listele)
grep -rn "from('" src/ --include="*.tsx" --include="*.ts" | sed "s/.*from('\([^']*\)').*/\1/" | sort -u

# Edge Functions
ls -la supabase/functions/

# Supabase client yapılandırması
cat src/lib/supabase.ts
```

**Kontrol et:**
- Kullanılan tüm tablo isimleri
- Edge Function'lar ve deploy durumları
- Supabase URL hardcoded mı yoksa env'den mi geliyor?
- Auth yapılandırması doğru mu?

### 5. SEO & META TAGS

```bash
# index.html meta tags
grep -n "meta\|title\|script.*json" index.html | head -30

# Helmet kullanımı
grep -rn "Helmet" src/pages/ --include="*.tsx" | head -20

# JSON-LD Schema
grep -rn "application/ld+json\|@type.*Organization\|@type.*SoftwareApplication\|@type.*Restaurant\|@type.*Article\|@type.*FAQ" src/ --include="*.tsx" | head -20

# OG tags
grep -rn "og:image\|og:title\|og:description\|twitter:card" src/ --include="*.tsx" index.html | head -20

# robots.txt
cat public/robots.txt

# Sitemap
grep -rn "BLOG_SLUGS" supabase/functions/sitemap/index.ts
```

**Kontrol et:**
- Her sayfada Helmet ile title ve description var mı?
- JSON-LD Schema'lar: Organization, SoftwareApplication, Restaurant, Article, FAQ — hepsi var mı?
- OG image tüm sayfalarda doğru mu?
- robots.txt sitemap URL'i güncel mi?
- Sitemap'te tüm blog slug'ları (10 makale) var mı?
- Sitemap'te /iletisim var mı?

### 6. GÜVENLİK

```bash
# Auth kontrolü — korumalı route'lar
grep -rn "useAuth\|isAuthenticated\|session\|auth\.getUser\|auth\.getSession" src/ --include="*.tsx" --include="*.ts" | head -20

# RLS bypass riski — service_role key client'ta mı?
grep -rn "service_role\|serviceRole\|SUPABASE_SERVICE_ROLE" src/ --include="*.tsx" --include="*.ts"

# Edge Function güvenliği
grep -rn "verify-jwt\|no-verify-jwt" supabase/ -r

# CORS
grep -rn "Access-Control\|cors" supabase/functions/ -r | head -10

# Secrets kontrolü — .env dosyaları git'te mi?
cat .gitignore | grep -i "env\|secret\|key"
ls -la .env* 2>/dev/null
```

**Kontrol et:**
- Dashboard route'u auth ile korunuyor mu?
- service_role key asla client-side'da olmamalı
- Edge Function'lar hangileri JWT verify, hangileri no-verify?
- .env dosyaları .gitignore'da mı?
- XSS riski: kullanıcı inputu sanitize ediliyor mu?

### 7. PERFORMANS

```bash
# Görsel boyutları
find public -name "*.png" -o -name "*.jpg" -o -name "*.svg" | xargs ls -lhS 2>/dev/null | head -10

# Font dosyaları
find node_modules/@fontsource -name "*.woff2" 2>/dev/null | wc -l

# Bağımlılık sayısı
cat package.json | grep -c "\""  # Yaklaşık
npm ls --depth=0 2>/dev/null | wc -l

# Kullanılmayan bağımlılıklar (package.json'da var ama import edilmemiş)
# Her bağımlılığı kontrol et
cat package.json | grep "\"@" | head -30
```

**Kontrol et:**
- Büyük görseller optimize mi? (>200KB olan var mı?)
- Font yükleme stratejisi (display: swap?)
- Gereksiz bağımlılıklar
- React re-render sorunları (büyük state'ler)

### 8. TUTARLILIK & UX

```bash
# Renk tutarlılığı — marka rengi doğru kullanılıyor mu?
grep -rn "#FF4F7A\|ff4f7a" src/ --include="*.tsx" --include="*.css" | wc -l
grep -rn "pink\|rose\|red-500\|amber\|orange" src/ --include="*.tsx" --include="*.css" | head -20

# İkon tutarlılığı — Circum Icons hala var mı?
grep -rn "react-icons/ci\|Ci[A-Z]" src/ --include="*.tsx" --include="*.ts"

# Phosphor Icons kullanımı
grep -rn "@phosphor-icons" src/ --include="*.tsx" --include="*.ts" | head -5

# Türkçe string tutarlılığı
grep -rn "İletişim\|Iletisim\|iletişim\|iletisim" src/ --include="*.tsx" | head -10

# Blog veri tutarlılığı — 10 makale var mı?
grep -c "slug:" src/lib/blogData.ts src/data/blogData.ts 2>/dev/null

# Demo menü verisi
ls src/data/demoMenu* 2>/dev/null

# Feature toggle tutarlılığı
grep -rn "feature_" src/ --include="*.tsx" --include="*.ts" | sed 's/.*\(feature_[a-z_]*\).*/\1/' | sort -u
```

**Kontrol et:**
- Marka rengi (#FF4F7A) tutarlı mı, yoksa farklı renkler de kullanılıyor mu?
- Eski Circum Icons hala kaldı mı?
- Türkçe/İngilizce string karışıklığı
- 10 blog makalesi var mı?
- Feature toggle'lar neler ve nerede kullanılıyor?

---

## RAPOR FORMATI

Bulgularını şu formatta raporla:

```
## AUDIT RAPORU — Tabbled.com
### Tarih: [bugünün tarihi]

---

### 🔴 KRİTİK (Hemen düzeltilmeli)
1. [Bulgu açıklaması] — [dosya:satır] — [önerilen çözüm]

### 🟡 ÖNEMLİ (Yakın zamanda düzeltilmeli)
1. [Bulgu açıklaması] — [dosya:satır] — [önerilen çözüm]

### 🟢 İYİLEŞTİRME (Nice to have)
1. [Bulgu açıklaması] — [dosya:satır] — [önerilen çözüm]

### ✅ İYİ DURUMDA (Sorun yok)
1. [Kontrol edilen alan] — [durum]

### 📊 İSTATİSTİKLER
- Toplam dosya sayısı: X
- Toplam satır sayısı: X
- Bundle boyutu: X KB (gzip: X KB)
- En büyük dosya: X.tsx (X satır)
- Supabase tabloları: X
- Edge Functions: X
- Blog makaleleri: X
- Feature toggle'lar: X
```

---

## ÖNEMLİ

- **KOD DEĞİŞİKLİĞİ YAPMA** — sadece bul ve raporla
- Her bulgu için dosya adı ve satır numarası ver
- Kritik güvenlik sorunlarını en üste koy
- Performans sorunlarını somut rakamlarla destekle
- Tutarsızlıkları örneklerle göster
- Pozitif bulguları da raporla (neyin iyi durumda olduğu)
