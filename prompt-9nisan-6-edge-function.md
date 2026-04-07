# CLAUDE CODE PROMPT — 9 Nisan 2026, Görev 6
# Supabase Edge Function: Kullanıcı Oluşturma (Session Bozmadan)

## PROJE BAĞLAMI
- Repo: /opt/khp/tabbled/ (git repo root)
- Stack: React + Vite + TypeScript + shadcn/ui
- DB: Supabase PostgreSQL (qmnrawqvkwehufebbkxp.supabase.co)
- Auth: Supabase Auth
- Super admin paneli: `src/pages/SuperAdminDashboard.tsx`
- Supabase project ref: `qmnrawqvkwehufebbkxp`
- Deploy: git push origin main → Vercel otomatik deploy

---

## SORUN

Super admin panelinde restoran + kullanıcı oluşturma formu `supabase.auth.signUp()` kullanıyor. Bu yöntem:
- Yeni kullanıcı oluşturuyor ✓
- AMA super admin'in aktif oturumunu yeni kullanıcıya geçiriyor ✗
- Super admin her restoran eklemede logout olup tekrar login olmak zorunda kalıyor

## ÇÖZÜM

Supabase Edge Function oluştur. Bu function:
- `service_role` key ile `supabase.auth.admin.createUser()` çağırır
- Super admin'in oturumunu bozmaz
- Sadece super admin'in çağırabilmesini sağlar (JWT kontrolü)

---

## ADIM 1: SUPABASE CLI KURULUMU (eğer yoksa)

```bash
# Supabase CLI var mı kontrol et
supabase --version 2>/dev/null

# Yoksa kur
npm install -g supabase

# Login (eğer daha önce yapılmadıysa)
# NOT: Bu adım interaktif olabilir, kullanıcıya sor
supabase login
```

**ALTERNATİF (CLI olmadan):** Edge Function'ı Supabase Dashboard üzerinden de oluşturabilirsin. Bu durumda dosyaları hazırla ve kullanıcıya Dashboard'dan yapıştırmasını söyle.

---

## ADIM 2: EDGE FUNCTION OLUŞTUR

```bash
# Proje dizininde
cd /opt/khp/tabbled

# Edge functions klasörünü oluştur (yoksa)
mkdir -p supabase/functions/create-user

# Function dosyasını oluştur
cat > supabase/functions/create-user/index.ts << 'EDGEFUNC'
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. İsteği yapan kullanıcının JWT'sini doğrula
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header gerekli" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Anon client ile JWT'yi doğrula ve kullanıcıyı al
    const supabaseAnon = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: caller }, error: authError } = await supabaseAnon.auth.getUser();
    if (authError || !caller) {
      return new Response(
        JSON.stringify({ error: "Yetkisiz erişim" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Super admin kontrolü
    const { data: profile, error: profileError } = await supabaseAnon
      .from("profiles")
      .select("role")
      .eq("id", caller.id)
      .single();

    if (profileError || profile?.role !== "super_admin") {
      return new Response(
        JSON.stringify({ error: "Bu işlem sadece super admin tarafından yapılabilir" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Request body'den kullanıcı bilgilerini al
    const { email, password, full_name, restaurant_id } = await req.json();

    if (!email || !password || !full_name) {
      return new Response(
        JSON.stringify({ error: "email, password ve full_name zorunludur" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Service role client ile kullanıcı oluştur (oturum bozmaz!)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (createError) {
      return new Response(
        JSON.stringify({ error: `Kullanıcı oluşturulamadı: ${createError.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Profile'ı güncelle — restaurant_id bağla
    if (newUser.user && restaurant_id) {
      // handle_new_user trigger'ı profile oluşturur, kısa bekle
      await new Promise((resolve) => setTimeout(resolve, 500));

      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          restaurant_id,
          full_name,
          role: "restaurant",
        })
        .eq("id", newUser.user.id);

      if (updateError) {
        console.error("Profil güncelleme hatası:", updateError);
        // Kritik değil — kullanıcı oluşturuldu, profil sonra güncellenebilir
      }
    }

    // 6. Başarı
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUser.user?.id,
          email: newUser.user?.email,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Sunucu hatası" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
EDGEFUNC
```

### CORS Paylaşımlı Dosya

```bash
mkdir -p supabase/functions/_shared

cat > supabase/functions/_shared/cors.ts << 'CORSFILE'
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
CORSFILE
```

---

## ADIM 3: EDGE FUNCTION'I DEPLOY ET

```bash
# Supabase projesine link et (ilk seferde gerekli)
supabase link --project-ref qmnrawqvkwehufebbkxp

# Function'ı deploy et
supabase functions deploy create-user --no-verify-jwt
```

**NOT:** `--no-verify-jwt` kullanıyoruz çünkü JWT doğrulamasını function içinde kendimiz yapıyoruz (super admin kontrolü dahil).

**Eğer supabase CLI login/link sorun çıkarırsa:** Function kodunu Supabase Dashboard → Edge Functions → Create Function bölümünden manuel olarak oluşturabilirsin. Kullanıcıya bu seçeneği sun.

---

## ADIM 4: FRONTEND'İ GÜNCELLE

`src/pages/SuperAdminDashboard.tsx`'te mevcut `addRestaurant` fonksiyonundaki `supabase.auth.signUp` çağrısını Edge Function çağrısıyla değiştir:

### Değiştirilecek Kod (mevcut — signUp kullanan)
Mevcut `addRestaurant` fonksiyonunda şuna benzer bir bölüm var:
```typescript
// ESKİ — BUNU BUL VE DEĞİŞTİR
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: newUserEmail,
  password: newUserPassword,
  // ...
});
```

### Yeni Kod (Edge Function çağrısı)
```typescript
// YENİ — Edge Function ile kullanıcı oluştur
const { data: { session } } = await supabase.auth.getSession();

const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify({
      email: newUserEmail,       // veya mevcut state değişken adı
      password: newUserPassword, // veya mevcut state değişken adı
      full_name: newFullName,    // veya mevcut state değişken adı
      restaurant_id: restaurant.id, // az önce oluşturulan restoran
    }),
  }
);

const result = await response.json();

if (!response.ok) {
  // Rollback: Restoran'ı sil
  await supabase.from('restaurants').delete().eq('id', restaurant.id);
  throw new Error(result.error || 'Kullanıcı oluşturulamadı');
}

// Başarı — super admin oturumu bozulmadı!
```

### Önemli
- `VITE_SUPABASE_URL` zaten `.env` dosyasında var olmalı — kontrol et
- Eğer yoksa, Supabase URL'i doğrudan kullan: `https://qmnrawqvkwehufebbkxp.supabase.co`
- Edge Function URL formatı: `{SUPABASE_URL}/functions/v1/{function-name}`
- Mevcut profile güncelleme kodu (500ms delay + update) KALDIR — Edge Function bunu yapıyor
- signUp sonrası yapılan diğer işlemleri de temizle (artık gerekli değil)

---

## ADIM 5: .ENV KONTROLÜ

```bash
# .env dosyasında VITE_SUPABASE_URL var mı kontrol et
grep "SUPABASE_URL" .env .env.local 2>/dev/null

# Yoksa ekle (sadece VITE_ prefix'li olanı frontend kullanabilir)
# VITE_SUPABASE_URL=https://qmnrawqvkwehufebbkxp.supabase.co
```

---

## DOKUNMA KURALLARI

1. **service_role key'i ASLA frontend koduna koyma** — sadece Edge Function'da (Deno.env ile)
2. **Mevcut restoran oluşturma mantığını değiştirme** — sadece auth kısmını değiştir
3. **handle_new_user() trigger'ına dokunma**
4. **Mevcut ayrı kullanıcı oluşturma formunu silme** (eğer varsa, kalsın)
5. **RLS policy'lerini değiştirme**

---

## TEST ADIMLARI

1. `npm run build` — hata olmadığını doğrula
2. Edge Function deploy edildiğini doğrula:
   ```bash
   supabase functions list
   ```
3. Super admin ile giriş yap
4. Birleşik formdan yeni restoran + kullanıcı oluştur
5. **KRİTİK TEST:** Oluşturma sonrası super admin hâlâ login mi? Sayfa yenilenince dashboard'a geri dönüyor mu?
6. Yeni oluşturulan kullanıcı ile farklı tarayıcıda login ol — kendi restoranını görüyor mu?
7. Hata testi: aynı email ile tekrar oluşturmayı dene

---

## GIT COMMIT
```bash
git add -A && git commit -m "feat: edge function for user creation, fix session hijack on signup" && git push origin main
```
