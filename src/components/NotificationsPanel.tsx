import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Bell, ChatCircle, Star } from '@phosphor-icons/react';
import type { AdminTheme } from '../lib/adminTheme';
import { getAdminTheme } from '../lib/adminTheme';

type NotificationType = 'waiter_call' | 'feedback' | 'review';

interface NotificationRow {
  id: string;
  type: NotificationType;
  title: string;
  message: string | null;
  is_read: boolean;
  metadata: Record<string, any> | null;
  created_at: string;
}

type FilterKey = 'all' | NotificationType;

const FILTER_LABELS: Record<FilterKey, string> = {
  all: 'Tümü',
  waiter_call: 'Çağrılar',
  feedback: 'Geri Bildirim',
  review: 'Yorumlar',
};

const TYPE_ICON: Record<NotificationType, React.ComponentType<{ size?: number; weight?: any; color?: string }>> = {
  waiter_call: Bell,
  feedback: ChatCircle,
  review: Star,
};

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (diffMin < 1) return 'Az önce';
  if (diffMin < 60) return `${diffMin} dk önce`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} sa önce`;
  return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function NotificationsPanel({
  restaurantId,
  theme,
}: {
  restaurantId: string;
  theme?: AdminTheme;
}) {
  const t = theme ?? getAdminTheme('light');
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('all');

  async function loadNotifications() {
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })
      .limit(100);
    setNotifications((data as NotificationRow[]) || []);
    setLoading(false);
  }

  useEffect(() => { loadNotifications(); }, [restaurantId]);

  useEffect(() => {
    const channel = supabase
      .channel(`notifications-panel-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => { loadNotifications(); },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [restaurantId]);

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

  const filtered = filter === 'all'
    ? notifications
    : notifications.filter(n => n.type === filter);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div style={{ padding: '24px 24px 48px', color: t.value }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: '#1C1C1E', margin: 0 }}>Bildirimler</h1>
          <p style={{ fontSize: 13, color: '#6B6B6F', margin: '4px 0 0' }}>
            {unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : 'Tüm bildirimler okundu'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            style={{
              fontSize: 13, fontWeight: 500, color: '#FF4F7A',
              background: 'transparent', border: '1px solid #E5E5E3',
              padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Tümünü okundu işaretle
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {(Object.keys(FILTER_LABELS) as FilterKey[]).map((key) => {
          const active = filter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              style={{
                fontSize: 13, fontWeight: 500,
                padding: '6px 14px', borderRadius: 9999,
                background: active ? '#1C1C1E' : '#FFFFFF',
                color: active ? '#FFFFFF' : '#2D2D2F',
                border: active ? '1px solid #1C1C1E' : '1px solid #E5E5E3',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {FILTER_LABELS[key]}
            </button>
          );
        })}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: '#A0A0A0', fontSize: 13 }}>Yükleniyor…</div>
      ) : filtered.length === 0 ? (
        <div style={{
          padding: 48, textAlign: 'center',
          background: '#FFFFFF', border: '1px solid #E5E5E3', borderRadius: 12,
          color: '#6B6B6F', fontSize: 14,
        }}>
          Henüz bildirim yok
        </div>
      ) : (
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E5E3', borderRadius: 12, overflow: 'hidden' }}>
          {filtered.map((n) => {
            const Icon = TYPE_ICON[n.type] ?? Bell;
            return (
              <div
                key={n.id}
                onClick={() => markAsRead(n.id)}
                style={{
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  padding: '14px 16px',
                  borderBottom: '1px solid #F7F7F5',
                  cursor: 'pointer',
                  background: n.is_read ? '#FFFFFF' : '#FFF0F3',
                  transition: 'background 0.15s ease',
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: '#F7F7F5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={18} weight="thin" color="#6B6B6F" />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: n.is_read ? 400 : 600, color: '#1C1C1E' }}>{n.title}</span>
                    <span style={{ fontSize: 11, color: '#A0A0A0', whiteSpace: 'nowrap', marginTop: 2 }}>{formatTime(n.created_at)}</span>
                  </div>
                  {n.message && (
                    <div style={{ fontSize: 13, color: '#6B6B6F', marginTop: 4, lineHeight: 1.4 }}>{n.message}</div>
                  )}
                </div>
                {!n.is_read && (
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#10B981', flexShrink: 0, marginTop: 8,
                  }} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
