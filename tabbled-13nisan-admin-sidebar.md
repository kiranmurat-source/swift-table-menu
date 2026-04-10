# TABBLED — Admin Panel Sol Sidebar Navigasyonu
# Yatay Tab → Sol Sidebar + Gruplu Menü

---

## PROJE BAĞLAMI

- **Dizin:** /opt/khp/tabbled
- **Dosya:** src/pages/RestaurantDashboard.tsx
- **Stack:** React + Vite + TypeScript + shadcn/ui
- **İkon:** Circum Icons (react-icons/ci)
- **Font:** Playfair Display + Inter
- **Mevcut tab'lar:** Menü, Çeviri Merkezi, QR Kodları, Promosyonlar, Tema, Profil
- **Eklenen tab:** Çağrılar (garson çağırma — ayrı prompt ile eklendi)

---

## SORUN

Mevcut yatay tab düzeni 7+ sekmeye ulaştı ve ileride daha da büyüyecek (Siparişler, Raporlar, Ayarlar, Müşteriler vb.). Yatay tab bar mobilde taşıyor, desktop'ta da karmaşık görünüyor.

---

## ÇÖZÜM: SOL SIDEBAR + GRUPLU NAVİGASYON (FineDine Referans)

### Layout Yapısı:

FineDine'ın sidebar'ından ilham alarak özellikleri anlamlı gruplarda topluyoruz. Grup başlıkları BÜYÜK HARF, muted gri, küçük font — FineDine'daki gibi.

```
┌──────────────────┬──────────────────────────────────────────┐
│   SIDEBAR        │                                          │
│                  │                                          │
│  [Logo]          │         AKTİF SAYFA İÇERİĞİ             │
│  Restoran Adı    │                                          │
│                  │                                          │
│  MENÜ YÖNETİMİ  │                                          │
│  ├─ Menü         │                                          │
│  ├─ Çeviri       │                                          │
│  └─ QR Kodları   │                                          │
│                  │                                          │
│  MÜŞTERİ İLİŞK. │                                          │
│  ├─ Çağrılar 🔴  │                                          │
│  └─ Promosyonlar │                                          │
│                  │                                          │
│  GÖRÜNÜM         │                                          │
│  └─ Tema         │                                          │
│                  │                                          │
│  ────────────    │                                          │
│  İŞLETME        │                                          │
│  └─ Profil       │                                          │
│                  │                                          │
│  ────────────    │                                          │
│  tabbled.com/    │                                          │
│  menu/slug       │                                          │
└──────────────────┴──────────────────────────────────────────┘
```

### İleride eklenecek öğeler (şimdi yapma, sadece yapının hazır olmasını sağla):

```
MENÜ YÖNETİMİ          → + AI Menü Yazıcı, + Medya Kütüphanesi
MÜŞTERİ İLİŞKİLERİ     → + Siparişler, + Geri Bildirimler, + İncelemeler, + Müşteri Listesi
GÖRÜNÜM                 → (şimdilik sadece Tema)
İÇGÖRÜLER               → + Raporlar, + Analitik (yeni grup — P3'te eklenecek)
İŞLETME                 → + Abonelik, + Entegrasyonlar
```

### Mobilde: 
- Sidebar gizlenir
- Üstte hamburger menü butonu → sidebar overlay/drawer olarak açılır
- Menü öğesine tıklayınca sidebar otomatik kapanır

---

## UYGULAMA

### 1. Sidebar Navigasyon Yapısı:

```tsx
const sidebarGroups = [
  {
    title: 'Menü Yönetimi',
    items: [
      { key: 'menu', label: 'Menü', icon: CiGrid41 },
      { key: 'translations', label: 'Çeviri Merkezi', icon: CiGlobe },
      { key: 'qr', label: 'QR Kodları', icon: CiGrid2H },
    ],
  },
  {
    title: 'Müşteri İlişkileri',
    items: [
      { key: 'calls', label: 'Çağrılar', icon: CiBellOn, badge: pendingCallCount },
      { key: 'promos', label: 'Promosyonlar', icon: CiDiscount1 },
    ],
  },
  {
    title: 'Görünüm',
    items: [
      { key: 'theme', label: 'Tema', icon: CiPalette },
    ],
  },
  {
    title: 'İşletme',
    items: [
      { key: 'profile', label: 'Profil', icon: CiUser },
    ],
  },
];
```

### 2. Sidebar Component:

```tsx
interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  restaurantName: string;
  pendingCallCount: number;
  isOpen: boolean;        // mobil için
  onClose: () => void;    // mobil için
}

const Sidebar = ({ activeTab, onTabChange, restaurantName, pendingCallCount, isOpen, onClose }: SidebarProps) => {

  const handleItemClick = (key: string) => {
    onTabChange(key);
    onClose(); // mobilde sidebar'ı kapat
  };

  return (
    <aside style={{
      width: '240px',
      minHeight: '100vh',
      backgroundColor: '#fafafa',
      borderRight: '1px solid #e5e7eb',
      padding: '16px 0',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      // Mobilde overlay
      position: window.innerWidth < 768 ? 'fixed' : 'relative',
      top: 0,
      left: 0,
      zIndex: 50,
      transform: (window.innerWidth < 768 && !isOpen) ? 'translateX(-100%)' : 'translateX(0)',
      transition: 'transform 0.3s ease',
    }}>
      {/* Logo + Restoran ismi */}
      <div style={{
        padding: '0 16px 16px',
        borderBottom: '1px solid #e5e7eb',
        marginBottom: '8px',
      }}>
        <img
          src="/tabbled-logo-horizontal.png"
          alt="Tabbled"
          style={{ height: '28px', width: 'auto', marginBottom: '8px' }}
        />
        <div style={{
          fontSize: '13px',
          fontWeight: 600,
          color: '#1C1C1E',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {restaurantName}
        </div>
      </div>

      {/* Gruplu menü */}
      <nav style={{ flex: 1, overflow: 'auto' }}>
        {sidebarGroups.map((group) => (
          <div key={group.title} style={{ marginBottom: '16px' }}>
            {/* Grup başlığı */}
            <div style={{
              padding: '4px 16px',
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#9ca3af',
            }}>
              {group.title}
            </div>

            {/* Menü öğeleri */}
            {group.items.map((item) => {
              const isActive = activeTab === item.key;
              const Icon = item.icon;

              return (
                <button
                  key={item.key}
                  onClick={() => handleItemClick(item.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px 16px',
                    border: 'none',
                    background: isActive ? '#fff' : 'transparent',
                    borderLeft: isActive ? '3px solid #FF4F7A' : '3px solid transparent',
                    color: isActive ? '#1C1C1E' : '#6b7280',
                    fontSize: '13px',
                    fontWeight: isActive ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: "'Inter', sans-serif",
                    textAlign: 'left',
                  }}
                >
                  <Icon size={16} />
                  <span style={{ flex: 1 }}>{item.label}</span>

                  {/* Badge (pending calls vs.) */}
                  {item.badge && item.badge > 0 && (
                    <span style={{
                      backgroundColor: '#ef4444',
                      color: '#fff',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '8px',
                      minWidth: '18px',
                      textAlign: 'center',
                    }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Alt kısım: Menü linki */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid #e5e7eb',
        fontSize: '11px',
        color: '#9ca3af',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <CiLink size={12} />
          tabbled.com/menu/{restaurant.slug}
        </div>
      </div>
    </aside>
  );
};
```

### 3. Mobil Hamburger Butonu:

```tsx
// Mobilde sidebar kapalıyken üstte bar göster
{window.innerWidth < 768 && (
  <div style={{
    position: 'sticky',
    top: 0,
    zIndex: 40,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #e5e7eb',
  }}>
    <button
      onClick={() => setSidebarOpen(true)}
      style={{
        padding: '6px',
        border: 'none',
        background: 'none',
        cursor: 'pointer',
      }}
    >
      <CiMenuBurger size={24} />
    </button>
    <span style={{ fontSize: '14px', fontWeight: 600 }}>
      {sidebarGroups.flatMap(g => g.items).find(i => i.key === activeTab)?.label}
    </span>
  </div>
)}
```

### 4. Mobilde Backdrop/Overlay:

```tsx
// Sidebar açıkken arka planı karart
{sidebarOpen && window.innerWidth < 768 && (
  <div
    onClick={() => setSidebarOpen(false)}
    style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.3)',
      zIndex: 45,
    }}
  />
)}
```

### 5. Ana Layout Değişikliği:

Mevcut RestaurantDashboard yapısı muhtemelen:
```tsx
<div>
  <TabBar />
  <Content />
</div>
```

Yeni yapı:
```tsx
<div style={{ display: 'flex', minHeight: '100vh' }}>
  {/* Sidebar */}
  <Sidebar ... />
  
  {/* Mobil backdrop */}
  {sidebarOpen && isMobile && <Backdrop />}
  
  {/* İçerik */}
  <main style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
    {/* Mobil header (hamburger + sayfa ismi) */}
    {isMobile && <MobileHeader />}
    
    {/* Sayfa içeriği (mevcut tab render'ları aynen kalır) */}
    {activeTab === 'menu' && <MenuContent />}
    {activeTab === 'translations' && <TranslationCenter />}
    {activeTab === 'qr' && <QRManager />}
    {activeTab === 'promos' && <PromosTab />}
    {activeTab === 'theme' && <ThemeSelector />}
    {activeTab === 'calls' && <WaiterCallsTab />}
    {activeTab === 'profile' && <ProfileTab />}
  </main>
</div>
```

### 6. Responsive Hook:

```tsx
const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
const [sidebarOpen, setSidebarOpen] = useState(false);

useEffect(() => {
  const handleResize = () => {
    const mobile = window.innerWidth < 768;
    setIsMobile(mobile);
    if (!mobile) setSidebarOpen(false); // desktop'ta sidebar her zaman açık
  };
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

---

## ÖNEMLİ KURALLAR

1. **Mevcut tab key'lerini koru** — `activeTab` state'inin değerleri (menu, translations, qr, promos, theme, calls, profile) mevcut conditional render'larla uyumlu olmalı.

2. **Mevcut tab içerik component'larına DOKUNMA** — sadece layout wrapper'ı değiştir. ProfileTab, QRManager, TranslationCenter, PromosTab hepsi aynen kalır.

3. **İkon import'larını kontrol et** — Yeni gerekebilecek ikonlar:
   - `CiMenuBurger` — hamburger menü
   - `CiBellOn` — çağrılar (zaten var olabilir)
   - `CiDiscount1` — promosyonlar
   - `CiPalette` — tema
   - `CiLink` — link
   - `CiGrid41` — menü (grid)
   - Hepsi `react-icons/ci`'den import edilecek

4. **Yatay tab bar'ı tamamen kaldır** — eski tab butonları silinecek, yerine sidebar gelecek.

5. **Super Admin Dashboard'a DOKUNMA** — bu değişiklik sadece RestaurantDashboard için. SuperAdminDashboard kendi layout'unu koruyor.

6. **Sidebar genişliği:** Desktop'ta 240px sabit. İçerik alanı `flex: 1` ile geri kalanı dolduruyor.

7. **Sidebar scroll:** Eğer menü öğeleri sidebar yüksekliğini aşarsa, sidebar kendi içinde scroll olmalı (`overflow: auto`).

---

## İLERİDE EKLENEBİLECEK ÖĞELER (şimdi yapma, sadece yapının buna hazır olduğundan emin ol):

```
MENÜ YÖNETİMİ (mevcut 3 + ileride)
├─ Menü                    ← mevcut
├─ Çeviri Merkezi          ← mevcut
├─ QR Kodları              ← mevcut
├─ AI Menü Yazıcı          ← P2 (ileride)
└─ Medya Kütüphanesi       ← P3 (ileride)

MÜŞTERİ İLİŞKİLERİ (mevcut 2 + ileride)
├─ Çağrılar                ← mevcut (garson çağırma)
├─ Promosyonlar            ← mevcut
├─ Siparişler              ← P2 (WhatsApp sipariş sonrası)
├─ Geri Bildirimler        ← P2
├─ İncelemeler             ← P2
└─ Müşteri Listesi (CRM)   ← P2

GÖRÜNÜM (mevcut 1)
└─ Tema                    ← mevcut

İÇGÖRÜLER (tamamen yeni grup — P3)
├─ Raporlar
└─ Analitik Dashboard

İŞLETME (mevcut 1 + ileride)
├─ Profil                  ← mevcut
├─ Abonelik                ← P3
└─ Entegrasyonlar          ← P3 (POS, Iyzipay vb.)
```

---

## KONTROL LİSTESİ

- [ ] Yatay tab bar kaldırıldı
- [ ] Sol sidebar component oluşturuldu
- [ ] 4 grup: Menü Yönetimi, Müşteri İlişkileri, Görünüm, İşletme
- [ ] Her menü öğesinde Circum Icon
- [ ] Aktif sayfa vurgulu (sol border + bold + beyaz arka plan)
- [ ] Çağrılar badge'i (pending count)
- [ ] Sidebar üstte logo + restoran ismi
- [ ] Sidebar altta menü linki
- [ ] Flex layout: sidebar (240px) + main (flex:1)
- [ ] Mobil: sidebar gizli, hamburger butonu ile açılır
- [ ] Mobil: backdrop overlay
- [ ] Mobil: menü öğesine tıklayınca sidebar kapanır
- [ ] Tüm mevcut tab içerikleri çalışıyor
- [ ] npm run build başarılı
- [ ] git push origin main
