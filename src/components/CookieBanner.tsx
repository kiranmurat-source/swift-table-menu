import { useState, useEffect } from 'react';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setVisible(true);
    } else if (consent === 'accepted') {
      loadGA();
    }
  }, []);

  function loadGA() {
    if (document.getElementById('ga-script')) return;
    const s = document.createElement('script');
    s.id = 'ga-script';
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=G-X70X9BM3SX';
    document.head.appendChild(s);
    s.onload = () => {
      (window as any).dataLayer = (window as any).dataLayer || [];
      function gtag(...args: any[]) { (window as any).dataLayer.push(args); }
      gtag('js', new Date());
      gtag('config', 'G-X70X9BM3SX');
    };
  }

  function accept() {
    localStorage.setItem('cookie_consent', 'accepted');
    setVisible(false);
    loadGA();
    window.dispatchEvent(new CustomEvent('cookie-consent-changed'));
  }

  function reject() {
    localStorage.setItem('cookie_consent', 'rejected');
    setVisible(false);
    window.dispatchEvent(new CustomEvent('cookie-consent-changed'));
  }

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: '#1C1C1E', color: '#F0F0EC', padding: '16px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 16, flexWrap: 'wrap', fontSize: 14,
      boxShadow: '0 -2px 12px rgba(0,0,0,0.15)',
    }}>
      <span style={{ maxWidth: 600, lineHeight: 1.6 }}>
        Bu site deneyiminizi iyileştirmek için çerezler kullanmaktadır.{' '}
        <a href="/privacy" style={{ color: '#A0A0A0', textDecoration: 'underline' }}>Gizlilik Politikası</a>
      </span>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={reject} style={{
          padding: '8px 20px', fontSize: 13, fontWeight: 600,
          background: 'transparent', color: '#A0A0A0', border: '1px solid #3A3A3E',
          borderRadius: 8, cursor: 'pointer',
        }}>Reddet</button>
        <button onClick={accept} style={{
          padding: '8px 20px', fontSize: 13, fontWeight: 600,
          background: '#fff', color: '#1C1C1E', border: 'none',
          borderRadius: 8, cursor: 'pointer',
        }}>Kabul Et</button>
      </div>
    </div>
  );
}
