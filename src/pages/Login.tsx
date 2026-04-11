import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import TabbledLogo from '@/components/TabbledLogo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); }
    else { navigate('/dashboard'); }
    setLoading(false);
  }

  const inputBase: React.CSSProperties = {
    width: '100%', padding: '10px 14px', fontSize: 14,
    border: '1px solid #E5E5E3', borderRadius: 8, outline: 'none',
    background: '#FFFFFF', color: '#1C1C1E', boxSizing: 'border-box',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F7F5', fontFamily: "'Inter', -apple-system, sans-serif", padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#FFFFFF', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <TabbledLogo logoType="vertical" sizeClass="h-20" />
          <p style={{ color: '#6B6B6F', fontSize: 14, marginTop: 12 }}>Hesabınıza giriş yapın</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#2D2D2F', marginBottom: 6 }}>E-posta</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              style={inputBase}
              onFocus={e => { e.currentTarget.style.borderColor = '#FF4F7A'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,79,122,0.1)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#E5E5E3'; e.currentTarget.style.boxShadow = 'none'; }}
              placeholder="ornek@restoran.com" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#2D2D2F', marginBottom: 6 }}>Şifre</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
              style={inputBase}
              onFocus={e => { e.currentTarget.style.borderColor = '#FF4F7A'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,79,122,0.1)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#E5E5E3'; e.currentTarget.style.boxShadow = 'none'; }}
              placeholder="••••••••" />
          </div>
          {error && <div style={{ padding: '10px 14px', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 8, color: '#991B1B', fontSize: 13 }}>{error}</div>}
          <button type="submit" disabled={loading}
            style={{ padding: '11px 20px', fontSize: 14, fontWeight: 500, color: '#FFFFFF', background: '#FF4F7A', border: 'none', borderRadius: 8, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.5 : 1, transition: 'background 0.15s ease' }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#E8456E'; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#FF4F7A'; }}>
            {loading ? '...' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  );
}
