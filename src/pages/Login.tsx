import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import TabbledLogo from '@/components/TabbledLogo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('suspended') === '1') {
      setError('Hesabınız aktif değil. Lütfen info@tabbled.com adresinden bizimle iletişime geçin.');
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); }
    else { navigate('/dashboard'); }
    setLoading(false);
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) {
        setError(error.message);
      }
    } catch {
      setError('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setGoogleLoading(false);
    }
  }

  const inputBase: React.CSSProperties = {
    width: '100%', padding: '10px 14px', fontSize: 14,
    border: '1px solid #E5E5E3', borderRadius: 8, outline: 'none',
    background: '#FFFFFF', color: '#1C1C1E', boxSizing: 'border-box',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F7F5', fontFamily: "'Roboto', -apple-system, sans-serif", padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#FFFFFF', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <TabbledLogo logoType="vertical" sizeClass="h-20" />
          <p style={{ color: '#6B6B6F', fontSize: 14, marginTop: 12 }}>Hesabınıza giriş yapın</p>
        </div>

        {/* Google Login */}
        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            padding: '11px 20px', fontSize: 14, fontWeight: 500, color: '#1C1C1E',
            background: '#FFFFFF', border: '1px solid #E5E5E3', borderRadius: 8,
            cursor: googleLoading ? 'default' : 'pointer', opacity: googleLoading ? 0.5 : 1,
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={e => { if (!googleLoading) e.currentTarget.style.background = '#F7F7F5'; }}
          onMouseLeave={e => { if (!googleLoading) e.currentTarget.style.background = '#FFFFFF'; }}
        >
          {googleLoading ? (
            <div style={{ width: 20, height: 20, border: '2px solid #E5E5E3', borderTopColor: '#FF4F7A', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          {googleLoading ? 'Bağlanıyor...' : 'Google ile Giriş Yap'}
        </button>

        {/* Ayırıcı */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '24px 0' }}>
          <div style={{ flex: 1, height: 1, background: '#E5E5E3' }} />
          <span style={{ fontSize: 13, color: '#A0A0A0' }}>veya</span>
          <div style={{ flex: 1, height: 1, background: '#E5E5E3' }} />
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
