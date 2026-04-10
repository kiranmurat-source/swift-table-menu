import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Bell, CheckCircle, Clock } from "@phosphor-icons/react";

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

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (diffMin < 1) return 'Az önce';
  if (diffMin < 60) return `${diffMin} dk önce`;
  return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    osc.type = 'sine';
    gain.gain.value = 0.3;
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch { /* silent */ }
}

export default function WaiterCallsPanel({ restaurantId }: { restaurantId: string }) {
  const [calls, setCalls] = useState<WaiterCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

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

    const { data } = await query;
    if (data) setCalls(data);
    setLoading(false);
  };

  useEffect(() => { loadCalls(); }, [restaurantId, filter]);

  useEffect(() => {
    const channel = supabase
      .channel('waiter-calls-panel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'waiter_calls',
        filter: `restaurant_id=eq.${restaurantId}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setCalls(prev => [payload.new as WaiterCall, ...prev]);
          playNotificationSound();
        } else if (payload.eventType === 'UPDATE') {
          setCalls(prev => prev.map(c => c.id === (payload.new as WaiterCall).id ? payload.new as WaiterCall : c));
        } else if (payload.eventType === 'DELETE') {
          setCalls(prev => prev.filter(c => c.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [restaurantId]);

  const updateStatus = async (callId: string, newStatus: 'acknowledged' | 'completed') => {
    const updateData: Record<string, string> = { status: newStatus };
    if (newStatus === 'acknowledged') updateData.acknowledged_at = new Date().toISOString();
    if (newStatus === 'completed') updateData.completed_at = new Date().toISOString();
    await supabase.from('waiter_calls').update(updateData).eq('id', callId);
  };

  const pendingCount = calls.filter(c => c.status === 'pending').length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Garson Çağrıları</h2>
          {pendingCount > 0 && (
            <span style={{ backgroundColor: '#ef4444', color: '#fff', fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 12, minWidth: 20, textAlign: 'center' }}>
              {pendingCount}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['pending', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 12px', fontSize: 12, borderRadius: 6, border: 'none',
                backgroundColor: filter === f ? '#FF4F7A' : '#f3f4f6',
                color: filter === f ? '#fff' : '#666',
                cursor: 'pointer',
              }}
            >
              {f === 'pending' ? 'Aktif' : 'Tümü'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Yükleniyor...</div>
      ) : calls.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
          <Bell size={48} style={{ opacity: 0.3, marginBottom: 8 }} />
          <div>Henüz çağrı yok</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {calls.map(call => {
            const typeInfo = callTypeLabels[call.call_type] || callTypeLabels.other;
            const statusInfo = statusLabels[call.status] || statusLabels.pending;
            return (
              <div
                key={call.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderRadius: 10,
                  border: `1px solid ${call.status === 'pending' ? '#fecaca' : '#e5e7eb'}`,
                  backgroundColor: call.status === 'pending' ? '#fef2f2' : '#fff',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 16 }}>Masa {call.table_number}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, backgroundColor: `${typeInfo.color}20`, color: typeInfo.color, fontWeight: 600 }}>
                      {typeInfo.label}
                    </span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, backgroundColor: `${statusInfo.color}20`, color: statusInfo.color, fontWeight: 600 }}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} />
                    {formatTime(call.created_at)}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 4 }}>
                  {call.status === 'pending' && (
                    <button
                      onClick={() => updateStatus(call.id, 'acknowledged')}
                      style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, border: '1px solid #f59e0b', backgroundColor: '#fffbeb', color: '#f59e0b', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Görüldü
                    </button>
                  )}
                  {(call.status === 'pending' || call.status === 'acknowledged') && (
                    <button
                      onClick={() => updateStatus(call.id, 'completed')}
                      style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, border: 'none', backgroundColor: '#22c55e', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
                    >
                      <CheckCircle size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                      Tamamla
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
