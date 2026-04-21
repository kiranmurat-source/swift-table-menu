import { useAuth } from '../lib/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import SuperAdminDashboard from './SuperAdminDashboard';
import RestaurantDashboard from './RestaurantDashboard';
import { Bell, List } from '@phosphor-icons/react';

type NotificationType = 'waiter_call' | 'feedback' | 'review';

type NotificationRow = {
  id: string;
  type: NotificationType;
  title: string;
  message?: string | null;
  is_read: boolean;
  metadata?: Record<string, any> | null;
  created_at: string;
};

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' && window.innerWidth >= 1024,
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('role, restaurant_id, restaurant:restaurants(onboarding_completed_at)')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data && data.role !== 'super_admin') {
            const rel = (data as { restaurant?: { onboarding_completed_at?: string | null } | Array<{ onboarding_completed_at?: string | null }> | null }).restaurant;
            const completedAt = Array.isArray(rel) ? rel[0]?.onboarding_completed_at : rel?.onboarding_completed_at;
            const needsOnboarding = !data.restaurant_id || !completedAt;
            if (needsOnboarding) {
              navigate('/onboarding', { replace: true });
              return;
            }
          }
          setRole(data?.role ?? 'restaurant');
          setRestaurantId(data?.restaurant_id ?? null);
          setRoleLoading(false);
        });
    }
  }, [user]);

  // Initialize notification sound once
  useEffect(() => {
    audioRef.current = new Audio('/sounds/notification.mp3');
    audioRef.current.volume = 0.6;
    audioRef.current.preload = 'auto';
  }, []);

  // Realtime subscription — fires on notification INSERTs, refetches list
  // and plays sound for waiter calls. Scoped to user's restaurant_id.
  useEffect(() => {
    if (!restaurantId) return;
    const channel = supabase
      .channel(`notifications-realtime-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          const newNotif = payload.new as NotificationRow;
          if (newNotif.type === 'waiter_call' && audioRef.current) {
            try {
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch(() => { /* browser autoplay block — silent */ });
            } catch { /* ignore */ }
          }
          loadNotifications();
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [restaurantId]);

  useEffect(() => {
    if (!user) return;
    loadNotifications();
  }, [user]);

  async function loadNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    setNotifications((data as NotificationRow[]) || []);
  }

  async function markAsRead(id: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  }

  async function markAllRead() {
    const ids = notifications.filter(n => !n.is_read).map(n => n.id);
    if (ids.length === 0) return;
    await supabase.from('notifications').update({ is_read: true }).in('id', ids);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  }

  async function handleNotifClick(n: NotificationRow) {
    await markAsRead(n.id);
    setShowNotifDropdown(false);
    const tabKey =
      n.type === 'waiter_call' ? 'calls'
      : n.type === 'feedback' ? 'feedback'
      : n.type === 'review' ? 'feedback'
      : null;
    if (tabKey) {
      window.dispatchEvent(new CustomEvent('tabbled:set-tab', { detail: tabKey }));
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading || roleLoading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Roboto', sans-serif" }}>Yukleniyor...</div>;
  if (!user) return null;

  const showBell = role === 'restaurant';

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', fontFamily: "'Roboto', -apple-system, sans-serif" }}>
      {/* Consolidated top bar — hamburger (mobile) / spacer (desktop) | centered logo | bell (restaurant only) */}
      <header
        style={{
          height: 56,
          background: '#FFFFFF',
          borderBottom: '1px solid #E5E7EB',
          display: 'grid',
          gridTemplateColumns: isDesktop ? '64px 1fr auto' : 'auto 1fr auto',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 30,
          paddingLeft: isDesktop ? 0 : 12,
          paddingRight: 16,
        }}
      >
        {/* Left: empty spacer on desktop (matches 64px rail), hamburger on mobile (restaurant only — SuperAdminDashboard has no sidebar listener) */}
        {isDesktop || role !== 'restaurant' ? (
          <div />
        ) : (
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('tabbled:open-sidebar'))}
            aria-label="Menü"
            style={{
              width: 36,
              height: 36,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              color: '#1C1C1E',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#F3F4F6'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <List size={22} weight="thin" />
          </button>
        )}

        {/* Center: Tabbled logo */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
          <img
            src="/tabbled-logo-horizontal.png"
            alt="Tabbled"
            style={{ height: 24, objectFit: 'contain' }}
          />
          {role === 'super_admin' && (
            <span style={{ fontSize: 11, fontWeight: 600, color: '#FFFFFF', background: '#FF4F7A', padding: '2px 8px', borderRadius: 4 }}>
              ADMIN
            </span>
          )}
        </div>

        {/* Right: Bell + dropdown (restaurant users only) */}
        {showBell ? (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifDropdown(v => !v)}
              aria-label="Bildirimler"
              style={{
                position: 'relative',
                width: 36,
                height: 36,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                color: '#6B7280',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#F3F4F6'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <Bell size={20} weight="thin" />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: 4, right: 4,
                  minWidth: 16, height: 16,
                  padding: '0 4px',
                  background: '#EF4444', color: '#FFFFFF',
                  fontSize: 10, fontWeight: 600,
                  borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </button>

            {showNotifDropdown && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowNotifDropdown(false)} />
                <div style={{
                  position: 'absolute', right: 0, top: '100%', marginTop: 8,
                  width: 360, maxHeight: 400, overflowY: 'auto',
                  background: '#FFFFFF', border: '1px solid #E5E5E3',
                  borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                  zIndex: 50,
                }}>
                  <div style={{
                    padding: '12px 16px', borderBottom: '1px solid #E5E5E3',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    position: 'sticky', top: 0, background: '#FFFFFF',
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#1C1C1E' }}>Bildirimler</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        style={{ fontSize: 12, color: '#FF4F7A', background: 'none', border: 'none', cursor: 'pointer' }}
                      >Tümünü okundu yap</button>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: '#A0A0A0', fontSize: 13 }}>
                      Bildirim yok
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => handleNotifClick(n)}
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid #F7F7F5',
                          cursor: 'pointer',
                          background: n.is_read ? '#FFFFFF' : '#FFF0F3',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: n.is_read ? 400 : 600, color: '#1C1C1E' }}>{n.title}</div>
                            {n.message && (
                              <div style={{ fontSize: 12, color: '#6B6B6F', marginTop: 2 }}>{n.message}</div>
                            )}
                          </div>
                          {!n.is_read && (
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', flexShrink: 0, marginTop: 4 }} />
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: '#A0A0A0', marginTop: 4 }}>
                          {new Date(n.created_at).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          <div />
        )}
      </header>
      {role === 'super_admin' ? <SuperAdminDashboard /> : <RestaurantDashboard />}
    </div>
  );
}
