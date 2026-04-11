# CLAUDE CODE PROMPT — Audit Fix'leri
## Kritik Güvenlik + Önemli Düzeltmeler

---

## GÖREV ÖZETI

Audit raporundan gelen kritik ve önemli bulguları düzelt. Toplam 13 fix.

---

## PROJE BİLGİLERİ

- **Proje dizini:** /opt/khp/tabbled/
- **Stack:** React + Vite + TypeScript + shadcn/ui
- **Supabase project-ref:** qmnrawqvkwehufebbkxp
- **Domain:** tabbled.com
- **Vercel:** otomatik deploy (git push)

---

## 🔴 KRİTİK FIX'LER

### FIX 1: .gitignore — .env* Dosyaları

```bash
# .gitignore dosyasına ekle:
echo "" >> .gitignore
echo "# Environment variables" >> .gitignore
echo ".env" >> .gitignore
echo ".env.*" >> .gitignore
echo "!.env.example" >> .gitignore
```

### FIX 2: Supabase Hardcoded Fallback Kaldırma

**Dosya:** src/lib/supabase.ts

Mevcut kodu oku:
```bash
cat src/lib/supabase.ts
```

Hardcoded fallback URL ve anon key'i kaldır. Env var yoksa hata fırlat:

```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**ÖNEMLİ:** Bu değişiklikten ÖNCE VPS'te .env dosyası oluştur:

```bash
# Mevcut hardcoded değerleri oku
grep -n "supabaseUrl\|supabaseKey\|SUPABASE" src/lib/supabase.ts
```

Okunan değerlerle .env dosyası oluştur:

```bash
cat > /opt/khp/tabbled/.env << 'EOF'
VITE_SUPABASE_URL=https://qmnrawqvkwehufebbkxp.supabase.co
VITE_SUPABASE_ANON_KEY=BURAYA_MEVCUT_ANON_KEY_YAPISTIR
EOF
```

**Anon key'i bulmak için:** src/lib/supabase.ts'deki mevcut hardcoded değeri kopyala.

**Vercel'de de env var set etmeyi UNUTMA** — yoksa production build crash eder:
- Vercel Dashboard → tabbled project → Settings → Environment Variables
- VITE_SUPABASE_URL = https://qmnrawqvkwehufebbkxp.supabase.co
- VITE_SUPABASE_ANON_KEY = (aynı anon key)

**SIRASI KRİTİK:**
1. Önce .env dosyasını oluştur
2. Sonra supabase.ts'i değiştir
3. npm run build ile test et (env var okunuyor mu?)
4. Vercel'de env var set et
5. SONRA git push

### FIX 3: XSS Koruması — DOMPurify

**Dosya:** src/pages/PublicMenu.tsx

dangerouslySetInnerHTML kullanılan yeri bul:
```bash
grep -n "dangerouslySetInnerHTML" src/pages/PublicMenu.tsx
```

DOMPurify kur:
```bash
npm install dompurify
npm install -D @types/dompurify
```

Dosyanın üstüne import ekle:
```typescript
import DOMPurify from 'dompurify';
```

dangerouslySetInnerHTML kullanan her yerde sanitize et:

```typescript
// ÖNCE:
dangerouslySetInnerHTML={{ __html: item.description }}

// SONRA:
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.description || '') }}
```

**Blog sayfasında da kontrol et:**
```bash
grep -n "dangerouslySetInnerHTML" src/pages/BlogPost.tsx
```

BlogPost'ta da aynı sanitize'ı uygula (blog içeriği güvenilir kaynak ama defense in depth):
```typescript
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content || '') }}
```

### FIX 4: Dashboard Auth Loading Gate

**Dosya:** src/pages/Dashboard.tsx

```bash
cat src/pages/Dashboard.tsx
```

Loading state'te erken dönüş ekle:

```typescript
// Mevcut useEffect + navigate mantığından ÖNCE:
if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      {/* Mevcut loading bileşeni veya basit spinner */}
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF4F7A]" />
    </div>
  );
}

if (!user) {
  // navigate zaten useEffect'te yapılıyor ama
  // erken dönüş ile alt bileşenlerin mount olmasını engelle
  return null;
}
```

---

## 🟡 ÖNEMLİ FIX'LER

### FIX 5: Sitemap ↔ blogData Senkronizasyonu

**Sorun:** Sitemap'te 10 slug var ama blogData.ts'te grep ile 6-7 görünüyor. 404 veren URL'ler SEO cezası alır.

**Çözüm:** blogData.ts'teki gerçek slug'ları kontrol et ve sitemap'i senkronize et.

```bash
# blogData.ts'teki tüm slug'ları listele
grep "slug:" src/lib/blogData.ts src/data/blogData.ts 2>/dev/null

# Sitemap'teki slug'ları listele
grep "BLOG_SLUGS" supabase/functions/sitemap/index.ts -A 20
```

İki listeyi karşılaştır:
- blogData.ts'te OLMAYAN ama sitemap'te OLAN slug'ları sitemap'ten kaldır
- blogData.ts'te OLAN ama sitemap'te OLMAYAN slug'ları sitemap'e ekle

Düzeltme yapıldıktan sonra sitemap redeploy:
```bash
supabase functions deploy sitemap --project-ref qmnrawqvkwehufebbkxp --no-verify-jwt
```

### FIX 6: robots.txt — Sitemap URL Proxy

**Dosya:** public/robots.txt

Supabase project URL'ini gizle:

```
User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /login

Sitemap: https://tabbled.com/sitemap.xml
```

**Dosya:** vercel.json

Sitemap rewrite ekle:
```json
{
  "source": "/sitemap.xml",
  "destination": "https://qmnrawqvkwehufebbkxp.supabase.co/functions/v1/sitemap"
}
```

Bu rewrite'ı vercel.json'daki mevcut rewrites dizisine ekle. MEVCUT rewrites'ları silme — sadece bu satırı ekle. SPA catch-all'dan ÖNCE yerleştir (yoksa catch-all yakalar).

### FIX 7: contact-form Spam Koruması

**Dosya:** supabase/functions/contact-form/index.ts

**7a. Origin whitelist:**

```typescript
// Request origin kontrolü (CORS header'dan ayrı, server-side validation)
const origin = req.headers.get('origin') || '';
const allowedOrigins = [
  'https://tabbled.com',
  'https://www.tabbled.com',
];

// Development'ta localhost da kabul et
if (Deno.env.get('ENVIRONMENT') !== 'production') {
  allowedOrigins.push('http://localhost:5173', 'http://localhost:3000');
}

if (!allowedOrigins.some(o => origin.startsWith(o)) && origin !== '') {
  return new Response(
    JSON.stringify({ error: 'Unauthorized origin' }),
    { status: 403, headers: { 'Content-Type': 'application/json' } }
  );
}
```

**7b. Basit rate limit (IP bazlı, in-memory):**

```typescript
// Edge Function üstüne (global scope):
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5; // 5 request
const RATE_WINDOW = 3600000; // 1 saat (ms)

// Handler içinde, validation'dan önce:
const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
const now = Date.now();
const rateEntry = rateLimitMap.get(clientIP);

if (rateEntry) {
  if (now < rateEntry.resetAt) {
    if (rateEntry.count >= RATE_LIMIT) {
      return new Response(
        JSON.stringify({ error: 'Çok fazla istek. Lütfen daha sonra tekrar deneyin.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    rateEntry.count++;
  } else {
    rateLimitMap.set(clientIP, { count: 1, resetAt: now + RATE_WINDOW });
  }
} else {
  rateLimitMap.set(clientIP, { count: 1, resetAt: now + RATE_WINDOW });
}
```

**NOT:** Deno Deploy edge function'ları her request'te yeni instance olabilir — in-memory rate limit %100 güvenilir değil ama basit saldırıları önler. Kalıcı çözüm: Supabase'de rate limit tablosu veya Cloudflare WAF.

**7c. CORS header'ını sıkılaştır:**

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://tabbled.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

**7d. Redeploy:**
```bash
supabase functions deploy contact-form --project-ref qmnrawqvkwehufebbkxp --no-verify-jwt
```

### FIX 8: PrivacyPolicy + NotFound Helmet

**Dosya:** src/pages/PrivacyPolicy.tsx

Helmet ekle:
```typescript
import { Helmet } from 'react-helmet-async';

// Render'ın en üstüne:
<Helmet>
  <title>Gizlilik Politikası — Tabbled</title>
  <meta name="description" content="Tabbled KVKK ve gizlilik politikası. Kişisel verilerin korunması hakkında bilgilendirme." />
  <link rel="canonical" href="https://tabbled.com/privacy" />
</Helmet>
```

**Dosya:** src/pages/NotFound.tsx

```typescript
import { Helmet } from 'react-helmet-async';

<Helmet>
  <title>Sayfa Bulunamadı — Tabbled</title>
  <meta name="robots" content="noindex, nofollow" />
</Helmet>
```

### FIX 9: Login "Şifremi Unuttum" Kırık Link

**Dosya:** src/pages/Login.tsx

```bash
grep -n "şifremi\|forgot\|reset\|href=\"#\"" src/pages/Login.tsx
```

Kırık linki kaldır veya fonksiyonlandır. Şimdilik kaldırmak daha güvenli (reset password akışı ayrı iş):

```typescript
// ÖNCE:
<a href="#">Şifremi unuttum</a>

// SONRA — tamamen kaldır veya:
// Hiçbir şey koyma (signup yok, admin oluşturuyor — şifre resetlemesi admin'den istenir)
```

Eğer link'i tamamen kaldırmak istemiyorsan, çalışan bir versiyon:

```typescript
<button
  onClick={async () => {
    const email = /* form'daki email değerini al */;
    if (!email) {
      toast.error('Lütfen e-posta adresinizi girin.');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://tabbled.com/login',
    });
    if (error) {
      toast.error('Şifre sıfırlama e-postası gönderilemedi.');
    } else {
      toast.success('Şifre sıfırlama e-postası gönderildi.');
    }
  }}
  className="text-sm text-gray-400 hover:text-[#FF4F7A] transition-colors"
>
  Şifremi unuttum
</button>
```

**TERCİH:** Eğer kullanıcı sayısı çok azsa (şu an sadece Ramada + admin), linki kaldır. Kullanıcı sayısı artınca (social login sonrası) resetPasswordForEmail'i implement et.

**Karar: Linki kaldır (en güvenli).**

### FIX 10: recharts Kaldırma

```bash
# ui/chart.tsx'i kimse import ediyor mu?
grep -rn "from.*ui/chart\|from.*components/ui/chart" src/ --include="*.tsx" --include="*.ts"
```

Eğer hiçbir yerden import edilmiyorsa:

```bash
rm src/components/ui/chart.tsx
npm uninstall recharts
```

### FIX 11: Kullanılmayan Dosyaları Temizle

```bash
# logo_tabbled.png orphan mı?
grep -rn "logo_tabbled" src/ --include="*.tsx" --include="*.ts"
# Eğer sıfır match → sil
rm src/assets/logo_tabbled.png 2>/dev/null

# Manrope font kullanılıyor mu?
grep -rn "manrope\|Manrope" src/ --include="*.tsx" --include="*.ts" --include="*.css"
# Eğer sıfır match → kaldır
npm uninstall @fontsource/manrope 2>/dev/null

# Eski allergen ikonları — hangisi aktif?
grep -rn "allergens/" src/ --include="*.tsx" --include="*.ts" | head -5
# Aktif olmayanı sil (public/allergens/ veya public/allergens-erudus/)
```

### FIX 12: hero-restaurant.jpg Optimizasyonu

```bash
# Mevcut boyut
ls -lh src/assets/hero-restaurant.jpg

# Optimize et (ImageMagick veya cwebp varsa)
# jpg'yi optimize et
convert src/assets/hero-restaurant.jpg -quality 80 -resize 1920x1080\> src/assets/hero-restaurant-opt.jpg 2>/dev/null
# Boyut karşılaştır
ls -lh src/assets/hero-restaurant.jpg src/assets/hero-restaurant-opt.jpg
# Daha küçükse değiştir
mv src/assets/hero-restaurant-opt.jpg src/assets/hero-restaurant.jpg
```

Eğer ImageMagick yoksa:
```bash
pip3 install Pillow --break-system-packages 2>/dev/null
python3 -c "
from PIL import Image
import os
img = Image.open('src/assets/hero-restaurant.jpg')
# Resize if larger than 1920px wide
if img.width > 1920:
    ratio = 1920 / img.width
    img = img.resize((1920, int(img.height * ratio)), Image.LANCZOS)
img.save('src/assets/hero-restaurant.jpg', 'JPEG', quality=80, optimize=True)
print(f'Optimized: {os.path.getsize(\"src/assets/hero-restaurant.jpg\")} bytes')
"
```

### FIX 13: CORS Sıkılaştırma — translate-menu ve generate-description

**Dosyalar:**
- supabase/functions/translate-menu/index.ts
- supabase/functions/generate-description/index.ts

Bu function'lar JWT zorunlu (doğru) ama CORS yine de sıkılaştır:

```typescript
// Her iki dosyada da corsHeaders'ı güncelle:
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://tabbled.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

**Redeploy:**
```bash
supabase functions deploy translate-menu --project-ref qmnrawqvkwehufebbkxp
supabase functions deploy generate-description --project-ref qmnrawqvkwehufebbkxp
```

**NOT:** translate-menu `--no-verify-jwt` ile deploy edilmeli (mevcut davranış), generate-description JWT zorunlu (mevcut davranış). Deploy flag'lerini DEĞİŞTİRME — sadece CORS header'ını güncelle.

---

## UYGULAMA SIRASI (KRİTİK!)

1. **FIX 1:** .gitignore güncelle
2. **FIX 2:** .env dosyası oluştur → supabase.ts güncelle → npm run build TEST ET
3. **FIX 3:** DOMPurify kur ve uygula
4. **FIX 4:** Dashboard loading gate
5. **FIX 5:** Sitemap ↔ blogData senkronizasyonu
6. **FIX 6:** robots.txt + vercel.json sitemap proxy
7. **FIX 7:** contact-form spam koruması
8. **FIX 8:** Helmet eksikleri
9. **FIX 9:** Login kırık link kaldır
10. **FIX 10:** recharts kaldır
11. **FIX 11:** Orphan dosyalar temizle
12. **FIX 12:** hero-restaurant.jpg optimize
13. **FIX 13:** CORS sıkılaştır + Edge Functions redeploy
14. **npm run build** — MUTLAKA test et
15. Sonuçları raporla

**FIX 2 SONRASI MUTLAKA BUILD TEST ET** — env var okunmuyorsa production crash eder!

---

## EDGE FUNCTION REDEPLOY (FIX 7 + 13 sonrası)

```bash
supabase functions deploy contact-form --project-ref qmnrawqvkwehufebbkxp --no-verify-jwt
supabase functions deploy translate-menu --project-ref qmnrawqvkwehufebbkxp --no-verify-jwt
supabase functions deploy generate-description --project-ref qmnrawqvkwehufebbkxp
supabase functions deploy sitemap --project-ref qmnrawqvkwehufebbkxp --no-verify-jwt
```

---

## DOĞRULAMA

```bash
# .gitignore
grep "\.env" .gitignore

# supabase.ts — hardcoded fallback yok mu?
grep -n "supabaseUrl\|supabaseKey\|eyJ" src/lib/supabase.ts

# DOMPurify
grep -n "DOMPurify\|sanitize" src/pages/PublicMenu.tsx src/pages/BlogPost.tsx

# Dashboard loading gate
grep -n "if.*loading.*return\|loading.*spinner" src/pages/Dashboard.tsx

# Sitemap slug count
grep "BLOG_SLUGS" supabase/functions/sitemap/index.ts -A 15 | grep "'" | wc -l

# robots.txt
cat public/robots.txt | grep "Sitemap"

# vercel.json sitemap rewrite
grep "sitemap" vercel.json

# Helmet
grep -rn "Helmet" src/pages/PrivacyPolicy.tsx src/pages/NotFound.tsx

# Login şifremi unuttum
grep -n "href=\"#\"\|şifremi unuttum\|forgot" src/pages/Login.tsx

# recharts kaldırıldı mı?
grep "recharts" package.json
ls src/components/ui/chart.tsx 2>/dev/null

# CORS
grep -n "Access-Control-Allow-Origin" supabase/functions/contact-form/index.ts supabase/functions/translate-menu/index.ts supabase/functions/generate-description/index.ts

# Build
cd /opt/khp/tabbled
npm run build
```

---

## HATIRLATMALAR

- **FIX 2 KRİTİK SIRA:** Önce .env oluştur, sonra kodu değiştir, sonra build test. Aksi halde build CRASH eder.
- **Vercel env var'ları AYRI set edilmeli** — VPS'teki .env sadece local build için. Vercel Dashboard'dan VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY set et.
- DOMPurify ~15KB gzip — kabul edilebilir güvenlik yatırımı
- recharts kaldırılınca bundle ~150KB+ küçülür (tree-shake edilmiyorsa)
- Edge Function in-memory rate limit instance bazlı — kalıcı çözüm değil ama basit saldırıları önler
- CORS origin whitelist'e Vercel preview URL'lerini de ekle (gerekirse)
- Login şifremi unuttum: kaldır, social login gelince farklı akış olacak
- translate-menu deploy flag'i --no-verify-jwt OLMALI (mevcut davranış)
- generate-description deploy flag'i JWT zorunlu (flag ekleme, varsayılan)
