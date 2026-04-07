# CLAUDE CODE PROMPT — 9 Nisan 2026, Görev 5
# Restoran + Kullanıcı Tek Formda Oluşturma (Super Admin)

## PROJE BAĞLAMI
- Repo: /opt/khp/tabbled/ (git repo root)
- Stack: React + Vite + TypeScript + shadcn/ui
- DB: Supabase PostgreSQL (qmnrawqvkwehufebbkxp.supabase.co)
- Auth: Supabase Auth
- Super admin paneli: `src/pages/SuperAdminDashboard.tsx`
- Super admin email: kiran.murat@gmail.com
- Deploy: git push origin main → Vercel otomatik deploy

---

## MEVCUT DURUM

Şu an super admin panelinde restoran ve kullanıcı AYRI formlarla oluşturuluyor:

1. **Restoran oluşturma:** Restoran adı, slug, adres, telefon → `restaurants` tablosuna INSERT
2. **Kullanıcı oluşturma:** Email, şifre, ad soyad, rol, restoran seçimi → Supabase Auth + `profiles` tablosuna INSERT

Bu 2 adımlı süreç zahmetli. Super admin her yeni müşteri için önce restoran, sonra kullanıcı oluşturup, kullanıcıyı restorana bağlamak zorunda.

---

## HEDEF

Tek bir form ile:
1. Restoran bilgilerini gir
2. Restoran sahibi (kullanıcı) bilgilerini gir
3. "Oluştur" butonuyla her ikisi birden oluşsun ve otomatik bağlansın

---

## YAPILACAKLAR

### Adım 1: Mevcut Formu İncele

```bash
# Super admin dashboard'daki mevcut form yapısını anla
cat src/pages/SuperAdminDashboard.tsx | head -100

# Restoran oluşturma formunu bul
grep -n "restoran\|restaurant\|oluştur\|create\|addRestaurant\|newRestaurant" src/pages/SuperAdminDashboard.tsx -i | head -20

# Kullanıcı oluşturma formunu bul
grep -n "kullanıcı\|user\|signup\|createUser\|addUser\|invite" src/pages/SuperAdminDashboard.tsx -i | head -20
```

### Adım 2: Birleşik Form Tasarımı

Mevcut restoran oluşturma formunu genişlet. İki bölüm halinde tek form:

```
┌─────────────────────────────────────────┐
│  Yeni Restoran & Kullanıcı Oluştur      │
│                                         │
│  ── İşletme Bilgileri ──                │
│  Restoran Adı:    [_______________]     │
│  Slug:            [_______________]     │
│  Adres:           [_______________]     │
│  Telefon:         [_______________]     │
│                                         │
│  ── Hesap Bilgileri ──                  │
│  Ad Soyad:        [_______________]     │
│  Email:           [_______________]     │
│  Şifre:           [_______________]     │
│                                         │
│  [İptal]              [Oluştur]         │
└─────────────────────────────────────────┘
```

### Adım 3: Form Alanları

#### İşletme Bilgileri
- `restaurantName` (zorunlu) — Restoran adı
- `slug` (zorunlu) — URL slug, otomatik restoran adından türetilsin (Türkçe karakter dönüşümü: ş→s, ç→c, ğ→g, ı→i, ö→o, ü→u, boşluk→tire, küçük harf, özel karakter kaldır)
- `address` (opsiyonel) — Adres
- `phone` (opsiyonel) — Telefon

#### Hesap Bilgileri
- `fullName` (zorunlu) — Ad soyad
- `email` (zorunlu) — Email adresi
- `password` (zorunlu) — Şifre (min 6 karakter)

### Adım 4: Slug Otomatik Oluşturma

```typescript
function generateSlug(name: string): string {
  const turkishMap: Record<string, string> = {
    'ş': 's', 'Ş': 'S', 'ç': 'c', 'Ç': 'C',
    'ğ': 'g', 'Ğ': 'G', 'ı': 'i', 'I': 'I',
    'ö': 'o', 'Ö': 'O', 'ü': 'u', 'Ü': 'U',
  };
  
  return name
    .split('')
    .map(char => turkishMap[char] || char)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')  // özel karakterleri kaldır
    .replace(/\s+/g, '-')          // boşlukları tire yap
    .replace(/-+/g, '-')           // çoklu tireleri tekle
    .replace(/^-|-$/g, '');        // baştaki/sondaki tireleri kaldır
}
```

- Restoran adı yazıldıkça slug otomatik güncellensin
- Slug alanı düzenlenebilir olsun (kullanıcı isterse değiştirebilsin)
- Slug benzersizliğini kontrol et (opsiyonel — oluşturma sırasında DB hata verirse göster)

### Adım 5: Oluşturma Mantığı (Submit Handler)

Sıralı işlemler — herhangi birinde hata olursa geri al:

```typescript
async function handleCreateRestaurantWithUser() {
  setLoading(true);
  
  try {
    // 1. Restoran oluştur
    const { data: restaurant, error: restError } = await supabase
      .from('restaurants')
      .insert({
        name: restaurantName,
        slug: slug,
        address: address || null,
        phone: phone || null,
        is_active: true,
        // theme_color default 'white' DB'de ayarlı olabilir
      })
      .select()
      .single();
    
    if (restError) throw new Error(`Restoran oluşturulamadı: ${restError.message}`);
    
    // 2. Supabase Auth ile kullanıcı oluştur
    // NOT: Admin API kullanılıyor olabilir — mevcut kullanıcı oluşturma kodunu kontrol et
    // Eğer supabase.auth.admin.createUser varsa onu kullan
    // Yoksa supabase.auth.signUp kullanılıyordur
    
    // Mevcut kullanıcı oluşturma yöntemini koru — sadece restaurant_id'yi ekle
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // email doğrulama gerektirme
      user_metadata: { full_name: fullName },
    });
    
    // EĞER admin.createUser yoksa veya çalışmıyorsa, mevcut yöntemle devam et
    // Alternatif: supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
    
    if (authError) {
      // Rollback: Restoran'ı sil
      await supabase.from('restaurants').delete().eq('id', restaurant.id);
      throw new Error(`Kullanıcı oluşturulamadı: ${authError.message}`);
    }
    
    // 3. Profile'ı güncelle — restaurant_id bağla
    // handle_new_user() trigger zaten profile oluşturur (role: 'restaurant')
    // Sadece restaurant_id'yi güncelle
    const userId = authData.user?.id;
    
    if (userId) {
      // Trigger'ın çalışması için kısa bir bekleme gerekebilir
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          restaurant_id: restaurant.id,
          full_name: fullName,
        })
        .eq('id', userId);
      
      if (profileError) {
        console.error('Profil güncelleme hatası:', profileError);
        // Kritik değil — admin sonra düzeltebilir
      }
    }
    
    // Başarı
    toast.success('Restoran ve kullanıcı başarıyla oluşturuldu!');
    // veya mevcut bildirim sistemi
    
    // Formu temizle
    setRestaurantName('');
    setSlug('');
    setAddress('');
    setPhone('');
    setFullName('');
    setEmail('');
    setPassword('');
    
    // Listeyi yenile
    await loadRestaurants();
    await loadUsers(); // eğer kullanıcı listesi de varsa
    
  } catch (error) {
    console.error(error);
    toast.error(error.message || 'Bir hata oluştu');
    // veya mevcut hata gösterim sistemi
  } finally {
    setLoading(false);
  }
}
```

### Adım 6: Mevcut Ayrı Formları Koru

**ÖNEMLİ:** Mevcut ayrı "Restoran Oluştur" ve "Kullanıcı Oluştur" formlarını KALDIRMA. Birleşik formu ek olarak ekle:

- Restoranlar tabında: "Yeni Restoran & Kullanıcı" butonu → birleşik form açılır
- Mevcut "Restoran Ekle" butonu kalabilir (sadece restoran oluşturma için)
- Mevcut "Kullanıcı Ekle" butonu kalabilir (mevcut restorana kullanıcı ekleme için)

Veya alternatif: Mevcut "Restoran Ekle" butonunu birleşik form ile değiştir, "Kullanıcı Ekle" ayrı kalsın.

**Hangisini seçeceğini mevcut UI yapısına göre karar ver.** En pratik olan: mevcut restoran oluşturma formunu genişletip kullanıcı alanlarını eklemek.

### Adım 7: UI Detayları

- Form shadcn/ui bileşenleri kullan (Input, Button, Label — mevcut formlarla tutarlı)
- İki bölüm arasında görsel ayırıcı (border veya başlık)
- Loading state: buton "Oluşturuluyor..." + disabled
- Hata durumunda hangi adımda hata olduğu gösterilsin
- Başarı durumunda form temizlensin ve liste yenilensin
- Slug alanı restoran adı değiştikçe otomatik güncellensin (ama elle de düzenlenebilir)

---

## MEVCUT AUTH YÖNTEMINI KONTROL ET

Super admin panelinde kullanıcı nasıl oluşturuluyor? Bu çok önemli:

```bash
# Mevcut auth/kullanıcı oluşturma kodunu bul
grep -n "createUser\|signUp\|auth.admin\|invite" src/pages/SuperAdminDashboard.tsx -i | head -10
```

Eğer `supabase.auth.admin.createUser` kullanılıyorsa → service_role key gerekir (anon key ile çalışmaz).
Eğer `supabase.auth.signUp` kullanılıyorsa → anon key ile çalışır ama super admin'in oturumu bozulabilir.

**Mevcut çalışan yöntemi aynen kullan, değiştirme.**

---

## DOKUNMA KURALLARI

1. **Mevcut kullanıcı oluşturma yöntemini değiştirme** — aynı auth API'yi kullan
2. **Mevcut formları silme** — birleşik formu ek olarak ekle veya mevcut restoran formunu genişlet
3. **handle_new_user() trigger'ına dokunma**
4. **RLS policy'lerini değiştirme**
5. **Diğer tab'ları (Kullanıcılar, Üyelikler) değiştirme**
6. İkon olarak `react-icons/ci` (Circum Icons) kullan

---

## TEST ADIMLARI

1. `npm run build` — hata olmadığını doğrula
2. Super admin olarak giriş yap (`kiran.murat@gmail.com`)
3. Restoranlar tabında birleşik formu aç
4. Test verisi gir:
   - Restoran: "Test Cafe", slug otomatik "test-cafe" olmalı
   - Kullanıcı: test email, şifre
5. "Oluştur" butonuna tıkla
6. Kontrol et:
   - `restaurants` tablosunda yeni restoran var mı?
   - `profiles` tablosunda yeni kullanıcı var mı? restaurant_id doğru mu?
   - Yeni kullanıcı ile giriş yapabilir mi?
   - Giriş yapınca kendi restoranını görüyor mu?
7. Hata testi: aynı slug ile tekrar oluşturmayı dene — uygun hata mesajı göstermeli
8. Hata testi: geçersiz email ile dene — auth hatası göstermeli

---

## GIT COMMIT
```bash
git add -A && git commit -m "feat: combined restaurant + user creation form in super admin" && git push origin main
```
