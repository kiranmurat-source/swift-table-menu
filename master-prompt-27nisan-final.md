# Tabbled.com — Master Project Prompt
**Versiyon:** 27 Nisan 2026 (final)
**Önceki versiyon:** 11 Ekim 2025 (eski plan yapısı, 3 plan — artık geçersiz)

---

## ÜRÜN & BAĞLAM

Tabbled (tabbled.com), KHP Limited tarafından işletilen bir B2B SaaS platformudur. Türkiye'deki restoran, kafe, lokanta ve pastaneler için QR tabanlı dijital menü, online pazarlama desteği, AI menü araçları ve (yakında) tedarikçi marketplace sunar.

**Yasal bağlam:** 11 Ekim 2025 Resmi Gazete'de yayımlanan Fiyat Etiketi Yönetmeliği ile QR menü zorunluluğu başlamıştır. 1 Ocak 2026 itibarıyla tam zorunluluk yürürlüktedir.

**Pozisyonlama (25 Nisan 2026):** "Yemeksepeti komisyonundan kurtulun." Pain point: %20-25 aggregator komisyon. Tabbled, restoranın kendi dijital varlıklarını kurmasını sağlar.

**Hard launch hedefi:** 15 Mayıs 2026.

---

## TEKNİK ALTYAPI

- **GitHub repo:** kiranmurat-source/swift-table-menu
- **Deploy:** Vercel (otomatik GitHub push ile)
- **Domain:** tabbled.com (DNS: Cloudflare)
- **Auth:** Supabase Auth (qmnrawqvkwehufebbkxp.supabase.co)
- **DB:** Supabase PostgreSQL
- **Email alma:** Cloudflare Email Routing → info@tabbled.com
- **Email gönderme:** Resend SMTP + Gmail "Send As"
- **Stack:** React + Vite + TypeScript + shadcn/ui + Radix + TanStack Query
- **SSR/SSG:** vite-react-ssg@0.9.1-beta.1, react-helmet-async@1.3.0
- **VPS:** root@168.119.234.186, /opt/khp/tabbled
- **Super admin:** kiran.murat@gmail.com (ID: 4834714f-4f6b-41c1-80ef-e21c34b8d207)
- **Demo restoran slug:** abc-restaurant
- **Reference müşteri:** Ramada (canlı, ödemeler aktif)
- **Google Analytics:** G-X70X9BM3SX

---

## FİYATLANDIRMA (final 27 Nisan 2026)

**3 katmanlı yapı: Basic + Premium + Enterprise**

| | Basic | Premium | Enterprise |
|---|---|---|---|
| Aylık karşılığı | 549 TL+VAT | 1.459 TL+VAT | Custom |
| Yıllık | 6.588 TL+VAT | 17.508 TL+VAT | Görüşme ile |
| Maks kullanıcı | 1 | 5 | Unlimited |
| Maks şube | 1 | 1 | Unlimited |

**Ek kurallar:**
- Sadece yıllık üyelik (aylık seçenek yok)
- 25% launch indirimi aktif (hard launch sürecinde)
- Manuel ödeme şu an, online ödeme post-launch
- Üyelik bittiğinde otomatik deaktivasyon yok, sadece uyarı
- Trial yok (14 gün ücretsiz deneme yok)
- Signup yok — kullanıcı super admin tarafından oluşturulur

---

## 4 PILLAR + TEMEL — POZİSYONLAMA YAPISI

Tabbled'ın değer önerisi 4 pillar ile satılır. **Her pillar bir iş hedefini temsil eder**, feature kategorisi değil.

### Pillar 1: PAZARLAMA
*Hedef: Daha fazla müşteri, daha sık dönüş.*
SEO altyapısı, Google Maps entegrasyonu, sosyal medya, müşteri yorumları, kampanyalar, sadakat programı, doğum günü, marketing araçları.

### Pillar 2: GELİR YÖNETİMİ
*Hedef: Aynı müşteriden daha fazla gelir.*
Sepet, indirim kodları, happy hour, ürün beğeni, geçen sipariş önerisi, gift voucher, multi-currency.

### Pillar 3: TAHSİLAT
*Hedef: Müşteri kolay öder, restoran komisyonsuz alır.*
Sipariş alma yöntemleri (garson çağırma, WhatsApp sipariş, online sipariş), masadan ödeme, dijital bahşiş, grup ödeme, POS entegrasyonu.

### Pillar 4: SATIN ALMA (Yakında)
*Hedef: Maliyet kontrolü, tedarikçi yönetimi.*
Stok yönetimi ve tedarikçi marketplace — hard launch sonrası roadmap. Pricing sayfasında "Yakında" rozetiyle görünür.

### TEMEL — Pillar dışı, Tabbled altyapısı
*Plan'a göre değişen ama pillar'a girmeyen ürün altyapısı.*
QR menü, alerjen, dil desteği, AI araçları, müşteri kaydı, video, analitik, çoklu şube.

---

## FEATURE MATRİSİ — TAM LİSTE (pricing/landing karşılaştırma tablosu için)

### PILLAR 1: PAZARLAMA (19 özellik)

| Özellik | Basic | Premium | Enterprise |
|---|---|---|---|
| Schema.org SEO altyapısı | ✓ | ✓ | ✓ |
| Hreflang çoklu dil SEO | ✓ | ✓ | ✓ |
| Sitemap dahil | ✓ | ✓ | ✓ |
| Yön bulma + Maps entegrasyonu | ✓ | ✓ | ✓ |
| LocalBusiness Schema | ✓ | ✓ | ✓ |
| Google Reviews yönlendirme | ✓ | ✓ | ✓ |
| Sosyal medya ikonları | ✓ | ✓ | ✓ |
| Müşteri yorumları | ✓ | ✓ | ✓ |
| Custom domain | ✗ | ✓ | ✓ |
| Instagram feed | ✗ | ✓ | ✓ |
| Geri bildirim formu | ✗ | ✓ | ✓ |
| Doğum günü kampanyası | ✗ | ✗ | ✓ |
| Sadakat programı (stamp) | ✗ | ✗ | ✓ |
| Kampanya yönetimi | ✗ | ✗ | ✓ |
| WhatsApp marketing | ✗ | ✗ | ✓ |
| SMS marketing | ✗ | ✗ | ✓ |
| Influencer tracking | ✗ | ✗ | ✓ |
| Arkadaşına öner | ✗ | ✗ | ✓ |
| Instagram story paylaşımı | ✗ | ✗ | ✓ |

### PILLAR 2: GELİR YÖNETİMİ (9 özellik)

| Özellik | Basic | Premium | Enterprise |
|---|---|---|---|
| Sepet | ✓ | ✓ | ✓ |
| Multi-currency | ✗ | ✓ | ✓ |
| İndirim kodları | ✗ | ✓ | ✓ |
| Happy hour / zamanlı fiyat | ✗ | ✓ | ✓ |
| 86'd tükendi güncelleme | ✗ | ✓ | ✓ |
| Ürün beğeni | ✗ | ✓ | ✓ |
| Geçen siparişiniz önerisi | ✗ | ✗ | ✓ |
| Gift voucher | ✗ | ✗ | ✓ |
| Bekleme süresi tahmini | ✗ | ✗ | ✓ |

### PILLAR 3: TAHSİLAT (9 özellik)

| Özellik | Basic | Premium | Enterprise |
|---|---|---|---|
| Garson çağırma | ✗ | ✓ | ✓ |
| WhatsApp sipariş | ✗ | ✓ | ✓ |
| Online sipariş | ✗ | ✗ | ✓ |
| Masa rezervasyonu | ✗ | ✗ | ✓ |
| Masadan ödeme (QR) | ✗ | ✗ | ✓ |
| Dijital bahşiş | ✗ | ✗ | ✓ |
| Grup ödeme | ✗ | ✗ | ✓ |
| Komisyonsuz teslimat | ✗ | ✗ | ✓ |
| POS entegrasyonu | ✗ | ✗ | ✓ |

### PILLAR 4: SATIN ALMA (2 — Yakında)

| Özellik | Basic | Premium | Enterprise |
|---|---|---|---|
| Stok Yönetimi | 🔜 | 🔜 | 🔜 |
| Tedarikçi Marketplace | 🔜 | 🔜 | 🔜 |

### TEMEL — Pillar dışı (17 özellik)

| Özellik | Basic | Premium | Enterprise |
|---|---|---|---|
| QR Menü | ✓ | ✓ | ✓ |
| Alerjen / kalori bilgisi | ✓ | ✓ | ✓ |
| QR kod özelleştirme | ✓ | ✓ | ✓ |
| İşletme künyesi | ✓ | ✓ | ✓ |
| 34 dil çeviri | ✓ | ✓ | ✓ |
| AI menü import (kredi sistemi) | ✓ | ✓ | ✓ |
| AI foto iyileştirme (kredi sistemi) | ✓ | ✓ | ✓ |
| AI açıklama yazıcı (kredi sistemi) | ✓ | ✓ | ✓ |
| Müşteri kaydı (CRM altyapı) | ✓ | ✓ | ✓ |
| Cihaz hafızası | ✓ | ✓ | ✓ |
| Returning visitor UI | ✗ | ✓ | ✓ |
| Cross-device telefon eşleme | ✗ | ✗ | ✓ |
| Social Login | ✗ | ✗ | ✓ |
| Videolu menü | ✗ | ✓ | ✓ |
| Analitik / raporlama | ✗ | ✗ | ✓ |
| Çoklu şube yönetimi | ✗ | ✗ | ✓ |
| Dedike destek | ✗ | ✗ | ✓ |

### Destek

| | Basic | Premium | Enterprise |
|---|---|---|---|
| Öncelikli destek | ✓ | ✓ | ✓ |
| Dedike hesap yöneticisi | ✗ | ✗ | ✓ |

### Özellik sayım toplamı

- **Basic:** 17 açık özellik
- **Premium:** 27 açık özellik
- **Enterprise:** 56 açık özellik (ayrıca SATIN ALMA pillar'ı yakında)

---

## ADMIN PLAN-AWARE UI — KRİTİK AYRIM

Plan'a bağlı feature'ların **hepsi otomatik açılır** — restoran sahibi karışmaz, kapatamaz, "satın aldım = kullanırım." Bu plan'ın doğal sonucu.

**Sadece restoran tercihine bırakılan feature'lar plan-aware admin UI'da görünür.** Bunlar marka/tarz tercihleri — bir kafe "WhatsApp sipariş istemiyorum, fine-dining'iz" diyebilir.

### UI'da görünecek 7 feature (toggle edilebilir)

| # | Özellik | DB kolonu | Pillar | Basic | Premium | Enterprise |
|---|---|---|---|---|---|---|
| 1 | Sepet | `feature_cart` (mevcut) | Gelir Yönetimi | ✓ | ✓ | ✓ |
| 2 | Garson çağırma | `feature_waiter_calls` (mevcut) | Tahsilat | ✗ | ✓ | ✓ |
| 3 | WhatsApp sipariş | `feature_whatsapp_order` (mevcut) | Tahsilat | ✗ | ✓ | ✓ |
| 4 | Masa rezervasyonu | `feature_table_reservation` (yeni) | Tahsilat | ✗ | ✗ | ✓ |
| 5 | Masadan ödeme | `feature_table_payment` (yeni) | Tahsilat | ✗ | ✗ | ✓ |
| 6 | Dijital bahşiş | `feature_digital_tip` (yeni) | Tahsilat | ✗ | ✗ | ✓ |
| 7 | Grup ödeme | `feature_group_payment` (yeni) | Tahsilat | ✗ | ✗ | ✓ |

### UI davranışı

**Plan dahilinde + restoran açtı:**
- Toggle pembe/aktif
- Public menüde feature görünür/çalışır

**Plan dahilinde + restoran kapattı:**
- Toggle gri/kapalı
- Public menüde feature gizli (restoran tercih etti)

**Plan dışında:**
- Toggle disabled, soluk
- "Premium'a yükselt" veya "Enterprise'a yükselt" inline link
- Plan rozeti (Premium / Enterprise) feature label yanında

### Yeni DB kolonları için migration

```sql
ALTER TABLE restaurants ADD COLUMN feature_table_reservation BOOLEAN DEFAULT TRUE;
ALTER TABLE restaurants ADD COLUMN feature_table_payment BOOLEAN DEFAULT TRUE;
ALTER TABLE restaurants ADD COLUMN feature_digital_tip BOOLEAN DEFAULT TRUE;
ALTER TABLE restaurants ADD COLUMN feature_group_payment BOOLEAN DEFAULT TRUE;
```

**Default TRUE rationale:** Plan dahilindeki feature, restoran kapatana kadar otomatik açık. "Hiçbir şey çalışmıyor" sürtünmesi engellenir.

---

## VERİTABANI ŞEMASI (Supabase)

**Ana tablolar:**
- `restaurants` (id, name, slug, is_active, subscription_status, current_plan, plan_overrides JSONB, address, phone, logo_url, cover_url, **feature_*** kolonları)
- `profiles` (id→auth.users, email, full_name, role[super_admin|restaurant], restaurant_id)
- `menu_categories` (restaurant_id, name_tr, name_en, sort_order, is_active)
- `menu_items` (category_id, restaurant_id, name_tr/en, description_tr/en, price, image_url, is_available, is_popular, allergens[], sort_order)
- `qr_codes` (restaurant_id, label, table_number, url)
- `subscription_plans` (name, price_yearly, features JSONB, sort_order)
- `subscriptions` (restaurant_id, plan_id, start_date, end_date, status, payment_method, notes)
- `item_recommendations` (menu_item_id, recommended_item_id, recommended_category_id, sort_order)
- `menu_views` / `menu_item_views` (analytics)

**Plan-feature kontrolü:**
- `restaurants.current_plan` strict: `'basic' | 'premium' | 'enterprise'`
- `src/lib/planFeatures.ts` — `hasFeature(restaurant, key)` resolution: `plan_overrides → PLAN_FEATURES[plan] → false`
- Super admin `restaurants.plan_overrides` JSONB üzerinden per-restaurant override yapabilir

**RLS:**
- `is_super_admin()` security definer function
- Super admin tüm tablolara erişir
- Restaurant kullanıcısı sadece kendi restoranını görür
- Public menü erişimi auth gerektirmez

**Trigger:**
- `handle_new_user()` → yeni auth user otomatik profiles'a eklenir (role: restaurant)
- `update_updated_at()` → restaurants, menu_items

**Storage:**
- `menu-images` bucket (public read, authenticated write)

---

## DOSYA YAPISI

```
src/
├── lib/
│   ├── supabase.ts          (Supabase client)
│   ├── useAuth.ts           (Auth hook)
│   └── planFeatures.ts      (hasFeature, PLAN_FEATURES, FeatureKey)
├── pages/
│   ├── Index.tsx            (Landing page)
│   ├── Login.tsx
│   ├── Dashboard.tsx        (Role router → SuperAdmin veya Restaurant)
│   ├── SuperAdminDashboard.tsx
│   ├── RestaurantDashboard.tsx
│   ├── PublicMenu.tsx       (SSR + horizontal scroll recommendations)
│   ├── PrivacyPolicy.tsx
│   ├── Onboarding.tsx
│   ├── Contact.tsx
│   └── NotFound.tsx
├── components/
│   ├── ProfilePanel.tsx     (legacy feature toggles SHOW_LEGACY_FEATURE_TOGGLES=false)
│   ├── admin/
│   │   ├── DirtySaveButtons.tsx  (floating save bar, bottom-right)
│   │   ├── MediaLibrary.tsx
│   │   └── ...
│   ├── dashboard/
│   │   └── RestaurantAnalytics.tsx
│   ├── CookieBanner.tsx
│   └── ... (landing page bileşenleri)
├── contexts/
│   └── DirtySaveContext.tsx (form dirty state + save hooks)
├── hooks/
│   └── useDirtyState.ts
└── routes.tsx               (createBrowserRouter + RouteRecord)
```

---

## ALINAN KARARLAR (değiştirmeden uygula)

- 3 plan: Basic / Premium / Enterprise (Pro plan kaldırıldı)
- Sadece yıllık üyelik
- 25% launch indirimi aktif
- Signup yok — super admin oluşturur
- 14 gün trial yok
- Üyelik bittiğinde otomatik deaktif olmaz, uyarı verir
- Sosyal medya linkleri özellik değil, künye parçası
- AI menü fotoğraf iyileştirme tüm planlarda açık (kredi sistemi ile)
- AI menü import + AI açıklama yazıcı tüm planlarda (kredi sistemi)
- Tablet menü kaldırıldı (offline maliyet sebebiyle)
- Zamanlı menüler kaldırıldı (ürün bazında zaman ayarı yeterli)
- Memory'deki "Pro plan" / "Pro 600 TL" gibi referanslar geçersiz
- Veri sorumlusu: KHP Limited
- KVKK uyumlu: /privacy sayfası + cookie consent banner aktif

---

## DEPLOY WORKFLOW

1. VPS'te kod düzenle: `/opt/khp/tabbled/`
2. Build test: `npm run build`
3. Push: `git add -A && git commit -m "mesaj" && git push origin main`
4. Vercel otomatik deploy (1-2 dk)
5. Test: tabbled.com üzerinde kontrol

---

## RAKİP BİLGİSİ

- **Menulux:** 250 TL/ay, temel QR menü, sınırlı özellik, Türkiye merkezli
- **FineDine:** $39-119/ay (~1.400-4.200 TL/ay), 3 plan, AI özellikler, POS entegrasyonu, Türkiye merkezli ama USD fiyat
- **Foost:** Modern QR menü + sipariş, 3-pillar yapı (Dijital Menü / Sipariş & Ödeme / Operasyonlar)
- **MyDigiMenu:** 69 özellik, Accor/ITC enterprise müşteriler, Dubai merkezli, video menü, CRM, stamp kartı

**Tabbled diferansiyel:**
- TL bazlı fiyat
- AI özellikleri tüm planlarda (kredi ile)
- 4-pillar pozisyonlama (Pazarlama/Gelir/Tahsilat/Satın Alma)
- Yakında: tedarikçi marketplace (rakiplerde yok)
- Yerel Türkçe destek

---

## GELİŞTİRME PRENSİPLERİ

1. Murat tek geliştirici, VPS üzerinden SSH ile çalışır
2. Audit-first disiplin: her büyük değişiklikten önce 5-6 maddelik audit raporu
3. shadcn/ui + Radix bileşenleri kullan, mevcut tasarım diline uy
4. Supabase RLS her zaman aktif
5. Her değişiklikte `npm run build` ile test, sonra push
6. Türkçe karakter bash heredoc'larda sorun çıkarabilir — `python3 -c` veya `cat <<'EOF'` ile yaz
7. Vercel SPA routing için vercel.json rewrites gerekli
8. Cookie banner GA'yı onay olmadan yüklemez (KVKK)
9. Public menü tema token'ları kullanır, hardcoded color forbidden
10. shadcn/ui internal Lucide ikonları değiştirilmez
11. TypeScript clean build sonra commit
12. Customer-facing bug'lar her zaman P1 (admin/internal sorunlardan önce)

---

## SONRAKİ ADIMLAR (öncelik sırası)

### Hard launch öncesi (P1)
1. **Plan-aware feature toggle UI** — 7 toggle edilebilir feature, ProfilePanel'de yeni "Özellikler" bölümü (legacy toggle'ları replace)
2. **`subscription_plans` JSONB** — bu master prompt'taki final 40+ feature listesiyle güncelle
3. **Pricing sayfası** — yeni 4-pillar yapısı + 3 plan kartı + karşılaştırma tablosu (collapse/expand)
4. **Landing hero** — Suiten Resto-style 3-phone mockup hero (mevcut karar)
5. **Multilingual AR/ZH testing**
6. **Footer social links**

### Hard launch sonrası (P2)
- Memory'deki post-launch listesi geçerliliğini koruyor (sticky save global rollout, SSG cleanup, performance phase 2-3, vs.)
- AI kredi sistemi: kullanıcıya kredi sayacı + kredi satışı
- SATIN ALMA pillar'ı: Stok yönetimi MVP + Tedarikçi marketplace MVP
- Legacy `feature_*` kolonlarını `plan_overrides` JSONB'ye migrate et
- `handle_new_user()` SECURITY DEFINER trigger anon revoke
- `app.tabbled.com` Function fallback fix
