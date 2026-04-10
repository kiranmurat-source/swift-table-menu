# TABBLED — Garson Çağırma Özelliği
# Public Menü + Admin Panel + DB

---

## PROJE BAĞLAMI

- **Dizin:** /opt/khp/tabbled
- **Stack:** React + Vite + TypeScript + shadcn/ui
- **İkon:** Circum Icons (react-icons/ci)
- **Font:** Playfair Display + Inter
- **Tema:** white/black/red
- **Supabase:** qmnrawqvkwehufebbkxp.supabase.co
- **Mevcut masa desteği:** Public menüde `?table=5` query param ile masa numarası alınıyor ve header'da gösteriliyor.

---

## GENEL BAKIŞ

Garson çağırma, public menüden müşterinin tek tuşla garson talep etmesini sağlar. Basit bir realtime bildirim sistemi — admin panelde çağrılar görünür, garson gelince "tamamlandı" işaretlenir.

### Akış:
1. Müşteri public menüde "Garson Çağır" butonuna basar
2. Supabase'e `waiter_calls` tablosuna kayıt düşer (restoran_id, masa_no, zaman)
3. Admin panelde (RestaurantDashboard) canlı bildirim görünür
4. Garson/admin "Tamamlandı" diyerek çağrıyı kapatır

---

## GÖREV 1: VERİTABANI (Supabase Migration)

### waiter_calls tablosu:

```sql
-- waiter_calls tablosu
CREATE TABLE waiter_calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'completed', 'cancelled')),
  call_type TEXT NOT NULL DEFAULT 'waiter' CHECK (call_type IN ('waiter', 'bill', 'water', 'other')),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- İndeksler
CREATE INDEX idx_waiter_calls_restaurant ON waiter_calls(restaurant_id);
CREATE INDEX idx_waiter_calls_status ON waiter_calls(restaurant_id, status) WHERE status = 'pending';
CREATE INDEX idx_waiter_calls_created ON waiter_calls(created_at DESC);

-- RLS
ALTER TABLE waiter_calls ENABLE ROW LEVEL SECURITY;

-- Public INSERT (auth gerektirmez — müşteriler login değil)
CREATE POLICY "Anyone can create waiter calls"
  ON waiter_calls FOR INSERT
  WITH CHECK (true);

-- Restaurant kullanıcısı kendi restoranının çağrılarını görebilir
CREATE POLICY "Restaurant users can view own calls"
  ON waiter_calls FOR SELECT
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM profiles WHERE id = auth.uid()
    )
    OR is_super_admin()
  );

-- Restaurant kullanıcısı kendi çağrılarını güncelleyebilir (acknowledge/complete)
CREATE POLICY "Restaurant users can update own calls"
  ON waiter_calls FOR UPDATE
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM profiles WHERE id = auth.uid()
    )
    OR is_super_admin()
  );

-- Super admin hepsini silebilir
CREATE POLICY "Super admin can delete calls"
  ON waiter_calls FOR DELETE
  USING (is_super_admin());

-- Realtime enable
ALTER PUBLICATION supabase_realtime ADD TABLE waiter_calls;
```

### Supabase Dashboard'da çalıştır:
Bu SQL'i Supabase Dashboard → SQL Editor'de çalıştır.

---

## GÖREV 2: PUBLIC MENÜ — GARSON ÇAĞIR BUTONU

### Konum:
Sayfanın altında **sticky bottom bar** olarak. Menü scroll edilirken her zaman görünür. Tab bar (üstte) ile benzer ama altta.

### Tasarım:

```
┌─────────────────────────────────────────┐
│  [🔔 Garson Çağır]  [📋 Hesap İste]   │  ← sticky bottom bar
└─────────────────────────────────────────┘
```

### Uygulama:

#### 1. Sticky bottom bar component:

```tsx
// src/components/WaiterCallBar.tsx

import { useState } from 'react';
import { CiBellOn, CiReceipt } from 'react-icons/ci';

interface WaiterCallBarProps {
  restaurantId: string;
  tableNumber: string | null;
  theme: 'white' | 'black' | 'red';
}

const WaiterCallBar = ({ restaurantId, tableNumber, theme }: WaiterCallBarProps) => {
  const [calling, setCalling] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showTypeSelect, setShowTypeSelect] = useState(false);

  const themeStyles = {
    white: { bg: '#fff', border: '#eee', text: '#1C1C1E', accent: '#FF4F7A' },
    black: { bg: '#1a1a1a', border: '#333', text: '#fff', accent: '#FF4F7A' },
    red: { bg: '#fff', border: '#eee', text: '#1C1C1E', accent: '#dc2626' },
  };
  const t = themeStyles[theme];

  const handleCall = async (callType: 'waiter' | 'bill') => {
    if (cooldown || calling) return;
    
    setCalling(true);
    
    try {
      // Supabase'e doğrudan insert (anon key ile, RLS public insert izin veriyor)
      const { error } = await supabase
        .from('waiter_calls')
        .insert({
          restaurant_id: restaurantId,
          table_number: tableNumber || 'Bilinmiyor',
          call_type: callType,
          status: 'pending',
        });
      
      if (error) throw error;
      
      // Başarı animasyonu
      setShowSuccess(true);
      setCooldown(true);
      
      // 3 saniye başarı mesajı göster
      setTimeout(() => setShowSuccess(false), 3000);
      
      // 30 saniye cooldown (spam önleme)
      setTimeout(() => setCooldown(false), 30000);
      
    } catch (err) {
      console.error('Garson çağırma hatası:', err);
      // Hata durumunda basit alert
      alert('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setCalling(false);
    }
  };

  // Masa numarası yoksa garson çağırma gösterme
  // (QR kod taratılmamışsa masa bilinmez — bu durumda buton disabled olabilir)
  
  return (
    <>
      {/* Sticky Bottom Bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        backgroundColor: t.bg,
        borderTop: `1px solid ${t.border}`,
        padding: '8px 16px',
        paddingBottom: 'calc(8px + env(safe-area-inset-bottom))', // iPhone notch
        display: 'flex',
        gap: '8px',
        justifyContent: 'center',
        // Hafif blur efekti
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        backgroundColor: `${t.bg}ee`, // hafif şeffaf
      }}>
        {showSuccess ? (
          // Başarı mesajı
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#16a34a',
            fontSize: '14px',
            fontWeight: 600,
            padding: '8px 0',
          }}>
            <span style={{ fontSize: '18px' }}>✓</span>
            Çağrınız iletildi!
          </div>
        ) : (
          <>
            {/* Garson Çağır butonu */}
            <button
              onClick={() => handleCall('waiter')}
              disabled={cooldown || calling}
              style={{
                flex: 1,
                maxWidth: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px 16px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: cooldown ? '#ccc' : t.accent,
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: cooldown ? 'not-allowed' : 'pointer',
                opacity: calling ? 0.7 : 1,
                transition: 'all 0.2s',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              <CiBellOn size={18} />
              {cooldown ? 'Çağrıldı' : calling ? '...' : 'Garson Çağır'}
            </button>
            
            {/* Hesap İste butonu */}
            <button
              onClick={() => handleCall('bill')}
              disabled={cooldown || calling}
              style={{
                flex: 1,
                maxWidth: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px 16px',
                borderRadius: '10px',
                border: `1.5px solid ${cooldown ? '#ccc' : t.accent}`,
                backgroundColor: 'transparent',
                color: cooldown ? '#ccc' : t.accent,
                fontSize: '14px',
                fontWeight: 600,
                cursor: cooldown ? 'not-allowed' : 'pointer',
                opacity: calling ? 0.7 : 1,
                transition: 'all 0.2s',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              <CiReceipt size={18} />
              {cooldown ? 'İstendi' : calling ? '...' : 'Hesap İste'}
            </button>
          </>
        )}
      </div>
      
      {/* Bottom padding spacer (sticky bar'ın arkasında içerik kaybolmasın) */}
      <div style={{ height: '72px' }} />
    </>
  );
};

export default WaiterCallBar;
```

#### 2. PublicMenu.tsx'e entegre:

```tsx
import WaiterCallBar from '../components/WaiterCallBar';

// PublicMenu component içinde, return'ün en altına ekle:
// (tableNumber zaten URL'den parse ediliyordur — ?table=5)

{tableNumber && (
  <WaiterCallBar
    restaurantId={restaurant.id}
    tableNumber={tableNumber}
    theme={restaurant.theme || 'white'}
  />
)}
```

**ÖNEMLİ:** Garson çağırma butonu SADECE masa numarası varsa görünsün. Masa numarası yoksa (yani QR taratılmamış, direkt URL ile açılmış) buton görünmez — çünkü garson hangi masaya gideceğini bilemez.

#### 3. Supabase client import:

WaiterCallBar.tsx'te supabase client import et:
```tsx
import { supabase } from '../lib/supabase';
```

#### 4. Çok dilli destek:

Buton textlerini dile göre değiştir. PublicMenu'deki mevcut dil state'ini kullan:

```tsx
const translations: Record<string, { callWaiter: string; askBill: string; sent: string; called: string; requested: string }> = {
  tr: { callWaiter: 'Garson Çağır', askBill: 'Hesap İste', sent: 'Çağrınız iletildi!', called: 'Çağrıldı', requested: 'İstendi' },
  en: { callWaiter: 'Call Waiter', askBill: 'Request Bill', sent: 'Your request has been sent!', called: 'Called', requested: 'Requested' },
  ar: { callWaiter: 'استدعاء النادل', askBill: 'طلب الفاتورة', sent: '!تم إرسال طلبك', called: 'تم الاستدعاء', requested: 'تم الطلب' },
  zh: { callWaiter: '呼叫服务员', askBill: '请求账单', sent: '您的请求已发送！', called: '已呼叫', requested: '已请求' },
  de: { callWaiter: 'Kellner rufen', askBill: 'Rechnung bitte', sent: 'Ihre Anfrage wurde gesendet!', called: 'Gerufen', requested: 'Angefordert' },
  fr: { callWaiter: 'Appeler serveur', askBill: 'Demander addition', sent: 'Votre demande a été envoyée!', called: 'Appelé', requested: 'Demandé' },
  ru: { callWaiter: 'Позвать официанта', askBill: 'Попросить счёт', sent: 'Ваш запрос отправлен!', called: 'Вызван', requested: 'Запрошено' },
};
// Fallback: en
```

**language prop'unu WaiterCallBar'a geçir:**
```tsx
<WaiterCallBar
  restaurantId={restaurant.id}
  tableNumber={tableNumber}
  theme={restaurant.theme || 'white'}
  language={currentLanguage || 'tr'}
/>
```

---

## GÖREV 3: ADMİN PANEL — GARSON ÇAĞRILARI PANELİ

### Konum:
RestaurantDashboard'a yeni bir tab ekle: **"Çağrılar"** (mevcut tab'ların arasına veya sonuna).

### Uygulama:

#### 1. Yeni tab ekleme:
RestaurantDashboard'daki tab sistemi ne ise (muhtemelen state + conditional render), "Çağrılar" tab'ı ekle. İkonu: `CiBellOn`

#### 2. Çağrılar listesi component'ı:

```tsx
// WaiterCallsTab (RestaurantDashboard içinde veya ayrı component)

import { useEffect, useState } from 'react';
import { CiBellOn, CiCircleCheck, CiClock2, CiTrash } from 'react-icons/ci';

interface WaiterCall {
  id: string;
  table_number: string;
  call_type: 'waiter' | 'bill' | 'water' | 'other';
  status: 'pending' | 'acknowledged' | 'completed' | 'cancelled';
  note: string | null;
  created_at: string;
  acknowledged_at: string | null;
  completed_at: string | null;
}

const WaiterCallsTab = ({ restaurantId }: { restaurantId: string }) => {
  const [calls, setCalls] = useState<WaiterCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  
  // İlk yükleme
  useEffect(() => {
    loadCalls();
  }, [restaurantId, filter]);
  
  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('waiter-calls')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'waiter_calls',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setCalls(prev => [payload.new as WaiterCall, ...prev]);
            // Ses çal (opsiyonel ama önemli UX)
            playNotificationSound();
          } else if (payload.eventType === 'UPDATE') {
            setCalls(prev => prev.map(c => c.id === (payload.new as WaiterCall).id ? payload.new as WaiterCall : c));
          } else if (payload.eventType === 'DELETE') {
            setCalls(prev => prev.filter(c => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);
  
  const loadCalls = async () => {
    setLoading(true);
    let query = supabase
      .from('waiter_calls')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (filter === 'pending') {
      query = query.in('status', ['pending', 'acknowledged']);
    }
    
    const { data, error } = await query;
    if (!error && data) {
      setCalls(data);
    }
    setLoading(false);
  };
  
  const updateStatus = async (callId: string, newStatus: 'acknowledged' | 'completed') => {
    const updateData: any = { status: newStatus };
    if (newStatus === 'acknowledged') updateData.acknowledged_at = new Date().toISOString();
    if (newStatus === 'completed') updateData.completed_at = new Date().toISOString();
    
    await supabase
      .from('waiter_calls')
      .update(updateData)
      .eq('id', callId);
  };
  
  const playNotificationSound = () => {
    // Basit beep sesi — Web Audio API ile
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      // Audio API yoksa sessizce geç
    }
  };
  
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    
    if (diffMin < 1) return 'Az önce';
    if (diffMin < 60) return `${diffMin} dk önce`;
    
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };
  
  const callTypeLabels: Record<string, { label: string; color: string }> = {
    waiter: { label: 'Garson', color: '#FF4F7A' },
    bill: { label: 'Hesap', color: '#f59e0b' },
    water: { label: 'Su', color: '#3b82f6' },
    other: { label: 'Diğer', color: '#6b7280' },
  };
  
  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: 'Bekliyor', color: '#ef4444' },
    acknowledged: { label: 'Görüldü', color: '#f59e0b' },
    completed: { label: 'Tamamlandı', color: '#22c55e' },
    cancelled: { label: 'İptal', color: '#6b7280' },
  };
  
  const pendingCount = calls.filter(c => c.status === 'pending').length;
  
  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Garson Çağrıları</h2>
          {pendingCount > 0 && (
            <span style={{
              backgroundColor: '#ef4444',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '12px',
              minWidth: '20px',
              textAlign: 'center',
            }}>
              {pendingCount}
            </span>
          )}
        </div>
        
        {/* Filtre */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setFilter('pending')}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: filter === 'pending' ? '#FF4F7A' : '#f3f4f6',
              color: filter === 'pending' ? '#fff' : '#666',
              cursor: 'pointer',
            }}
          >
            Aktif
          </button>
          <button
            onClick={() => setFilter('all')}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: filter === 'all' ? '#FF4F7A' : '#f3f4f6',
              color: filter === 'all' ? '#fff' : '#666',
              cursor: 'pointer',
            }}
          >
            Tümü
          </button>
        </div>
      </div>
      
      {/* Çağrı Listesi */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>Yükleniyor...</div>
      ) : calls.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          <CiBellOn size={48} style={{ opacity: 0.3, marginBottom: '8px' }} />
          <div>Henüz çağrı yok</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {calls.map(call => {
            const typeInfo = callTypeLabels[call.call_type] || callTypeLabels.other;
            const statusInfo = statusLabels[call.status] || statusLabels.pending;
            
            return (
              <div
                key={call.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid',
                  borderColor: call.status === 'pending' ? '#fecaca' : '#e5e7eb',
                  backgroundColor: call.status === 'pending' ? '#fef2f2' : '#fff',
                  // Pending olanlar pulse animasyonu
                  animation: call.status === 'pending' ? 'pulse 2s ease-in-out infinite' : 'none',
                }}
              >
                {/* Sol: Masa + Tip */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontWeight: 700,
                      fontSize: '16px',
                    }}>
                      Masa {call.table_number}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: `${typeInfo.color}20`,
                      color: typeInfo.color,
                      fontWeight: 600,
                    }}>
                      {typeInfo.label}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: `${statusInfo.color}20`,
                      color: statusInfo.color,
                      fontWeight: 600,
                    }}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                    <CiClock2 size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                    {formatTime(call.created_at)}
                  </div>
                </div>
                
                {/* Sağ: Aksiyonlar */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  {call.status === 'pending' && (
                    <button
                      onClick={() => updateStatus(call.id, 'acknowledged')}
                      title="Görüldü"
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        borderRadius: '6px',
                        border: '1px solid #f59e0b',
                        backgroundColor: '#fffbeb',
                        color: '#f59e0b',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Görüldü
                    </button>
                  )}
                  {(call.status === 'pending' || call.status === 'acknowledged') && (
                    <button
                      onClick={() => updateStatus(call.id, 'completed')}
                      title="Tamamla"
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: '#22c55e',
                        color: '#fff',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Tamamla
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
      `}</style>
    </div>
  );
};
```

#### 3. Tab badge (pending sayısı):
RestaurantDashboard'daki tab butonunda "Çağrılar" tab'ına kırmızı badge ekle:

```tsx
// Tab butonunda
<button>
  <CiBellOn size={16} />
  Çağrılar
  {pendingCallCount > 0 && (
    <span style={{
      backgroundColor: '#ef4444',
      color: '#fff',
      fontSize: '10px',
      fontWeight: 700,
      padding: '1px 5px',
      borderRadius: '8px',
      marginLeft: '4px',
    }}>
      {pendingCallCount}
    </span>
  )}
</button>
```

Tab badge'i için ayrı bir realtime subscription veya WaiterCallsTab'dan yukarı state kaldırma gerekir. En basit yol: RestaurantDashboard seviyesinde pending count'u çekmek.

#### 4. Admin panel'de realtime subscription başlatma:
RestaurantDashboard mount olduğunda waiter_calls tablosunu subscribe et. Pending count'u tab badge'e yansıt. Yeni çağrı gelince ses çal.

---

## GÖREV 4: SPAM KORUMASI

### Client-side:
- 30 saniye cooldown (zaten WaiterCallBar'da var)
- Masa numarası yoksa buton gösterilmez

### Server-side (opsiyonel, ileride):
- Rate limiting: aynı restoran + masa kombinasyonundan 1 dk'da max 1 çağrı
- Bunu şimdilik YAPMA — client-side cooldown yeterli. İleride Edge Function ile eklenebilir.

### Otomatik temizlik (opsiyonel, ileride):
- 24 saatten eski çağrıları otomatik sil (cron job veya Edge Function)
- Şimdilik YAPMA — admin tamamlandı işaretlesin yeter.

---

## YÜRÜTME SIRASI

1. **GÖREV 1** — DB migration (Supabase SQL Editor'de çalıştır)
2. **GÖREV 2** — WaiterCallBar component + PublicMenu entegrasyonu
3. **GÖREV 3** — WaiterCallsTab + RestaurantDashboard entegrasyonu + realtime
4. Test

**NOT:** Görev 1 (DB migration) Claude Code tarafından Supabase SQL Editor'de çalıştırılamaz. Bu SQL'i terminalde supabase CLI ile veya Supabase Dashboard'dan manuel çalıştır. Claude Code'a şu komutu verebilirsin:

```bash
# Migration SQL dosyası oluştur (referans için)
cat > /opt/khp/tabbled/supabase-migration-waiter-calls.sql << 'SQLEOF'
-- Yukarıdaki SQL buraya
SQLEOF
```

Sonra Supabase Dashboard → SQL Editor'de çalıştır.

---

## KONTROL LİSTESİ

### DB
- [ ] waiter_calls tablosu oluşturuldu
- [ ] RLS policy'leri eklendi (public insert, restaurant select/update, admin delete)
- [ ] Realtime publication eklendi
- [ ] İndeksler oluşturuldu

### Public Menü
- [ ] WaiterCallBar.tsx component oluşturuldu
- [ ] Sticky bottom bar görünüyor (masa numarası varsa)
- [ ] "Garson Çağır" butonu çalışıyor
- [ ] "Hesap İste" butonu çalışıyor
- [ ] 30 sn cooldown çalışıyor
- [ ] Başarı mesajı görünüyor
- [ ] 3 tema uyumlu
- [ ] Çok dilli (en az TR/EN)
- [ ] iPhone safe area (notch) padding

### Admin Panel
- [ ] "Çağrılar" tab'ı eklendi
- [ ] Çağrı listesi görünüyor
- [ ] Realtime: yeni çağrı anında görünüyor
- [ ] "Görüldü" butonu çalışıyor
- [ ] "Tamamla" butonu çalışıyor
- [ ] Pending count tab badge'de
- [ ] Bildirim sesi çalıyor
- [ ] Aktif/Tümü filtresi

### Final
- [ ] npm run build başarılı
- [ ] git push origin main
