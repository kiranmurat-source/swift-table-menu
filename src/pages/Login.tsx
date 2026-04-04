import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) { setError(error.message); }
      else { setMessage('Kayıt başarılı! Lütfen e-postanızı kontrol edin.'); }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); }
      else { navigate('/dashboard'); }
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafaf9', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 400, padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <a href="/" style={{ textDecoration: 'none', color: '#1c1917', fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>tabbled</a>
          <p style={{ color: '#78716c', fontSize: 14, marginTop: 8 }}>{isSignUp ? 'Hesap oluşturun' : 'Hesabınıza giriş yapın'}</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#44403c', marginBottom: 6 }}>E-posta</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              style={{ width: '100%', padding: '10px 14px', fontSize: 14, border: '1px solid #d6d3d1', borderRadius: 8, outline: 'none', background: '#fff', boxSizing: 'border-box' }}
              placeholder="ornek@restoran.com" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#44403c', marginBottom: 6 }}>Şifre</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
              style={{ width: '100%', padding: '10px 14px', fontSize: 14, border: '1px solid #d6d3d1', borderRadius: 8, outline: 'none', background: '#fff', boxSizing: 'border-box' }}
              placeholder="••••••••" />
          </div>

          {error && <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 13 }}>{error}</div>}
          {message && <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, color: '#16a34a', fontSize: 13 }}>{message}</div>}

          <button type="submit" disabled={loading}
            style={{ padding: '11px 20px', fontSize: 14, fontWeight: 700, color: '#fff', background: loading ? '#a8a29e' : '#1c1917', border: 'none', borderRadius: 8, cursor: loading ? 'default' : 'pointer', transition: 'background 0.2s' }}>
            {loading ? '...' : isSignUp ? 'Kayıt Ol' : 'Giriş Yap'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#78716c' }}>
          {isSignUp ? 'Zaten hesabınız var mı?' : 'Hesabınız yok mu?'}{' '}
          <button onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage(''); }}
            style={{ background: 'none', border: 'none', color: '#1c1917', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', fontSize: 13 }}>
            {isSignUp ? 'Giriş Yap' : 'Kayıt Ol'}
          </button>
        </p>
      </div>
    </div>
  );
}
