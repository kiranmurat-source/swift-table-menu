import { useAuth } from '../lib/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>Yükleniyor...</div>;
  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf9', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <div style={{ borderBottom: '1px solid #e7e5e4', background: '#fff', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.3px', color: '#1c1917' }}>tabbled</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#78716c' }}>{user.email}</span>
          <button onClick={signOut} style={{ padding: '6px 14px', fontSize: 13, fontWeight: 600, background: '#f5f5f4', border: '1px solid #e7e5e4', borderRadius: 8, cursor: 'pointer', color: '#44403c' }}>Çıkış</button>
        </div>
      </div>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1c1917', marginBottom: 8 }}>Hoş geldiniz</h1>
        <p style={{ fontSize: 15, color: '#78716c', marginBottom: 32 }}>Menü yönetim paneliniz hazırlanıyor.</p>
        <div style={{ padding: 32, background: '#fff', border: '1px solid #e7e5e4', borderRadius: 12, textAlign: 'center', color: '#a8a29e', fontSize: 14 }}>
          Menü düzenleme modülü yakında aktif olacak.
        </div>
      </div>
    </div>
  );
}
