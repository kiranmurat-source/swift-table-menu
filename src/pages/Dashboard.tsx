import { useAuth } from '../lib/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import SuperAdminDashboard from './SuperAdminDashboard';
import RestaurantDashboard from './RestaurantDashboard';
import TabbledLogo from '@/components/TabbledLogo';

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('role').eq('id', user.id).single()
        .then(({ data }) => { setRole(data?.role ?? 'restaurant'); setRoleLoading(false); });
    }
  }, [user]);

  if (loading || roleLoading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>Yukleniyor...</div>;
  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf9', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <div style={{ borderBottom: '1px solid #e7e5e4', background: '#fff', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <TabbledLogo sizeClass="h-7" />
          {role === 'super_admin' && <span style={{ fontSize: 11, fontWeight: 600, color: '#fff', background: '#dc2626', padding: '2px 8px', borderRadius: 4 }}>ADMIN</span>}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#78716c' }}>{user.email}</span>
          <button onClick={signOut} style={{ padding: '6px 14px', fontSize: 13, fontWeight: 600, background: '#f5f5f4', border: '1px solid #e7e5e4', borderRadius: 8, cursor: 'pointer', color: '#44403c' }}>Cikis</button>
        </div>
      </div>
      {role === 'super_admin' ? <SuperAdminDashboard /> : <RestaurantDashboard />}
    </div>
  );
}
