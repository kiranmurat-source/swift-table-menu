export default function BlogCTA() {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #FFF0F3 0%, #FFFFFF 100%)',
        borderRadius: 16,
        padding: '40px 32px',
        textAlign: 'center',
        marginTop: 48,
      }}
    >
      <h3
        style={{
          fontFamily: "'Roboto', sans-serif",
          fontWeight: 700,
          fontSize: 24,
          color: '#1C1C1E',
          marginBottom: 8,
        }}
      >
        14 Gün Ücretsiz Deneyin
      </h3>
      <p
        style={{
          fontFamily: "'Roboto', sans-serif",
          fontSize: 14,
          color: '#6B6B6F',
          marginBottom: 24,
          maxWidth: 480,
          marginLeft: 'auto',
          marginRight: 'auto',
          lineHeight: 1.6,
        }}
      >
        Kredi kartı gerekmez. 2 dakikada kurulum. Basic plan özellikleri ile başlayın.
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
        <a
          href="/iletisim"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 24px',
            borderRadius: 999,
            backgroundColor: '#FF4F7A',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
            fontFamily: "'Roboto', sans-serif",
          }}
        >
          Ücretsiz Başla
        </a>
        <a
          href="/menu/ramada-encore-bayrampasa"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '12px 24px',
            borderRadius: 999,
            backgroundColor: 'transparent',
            color: '#1C1C1E',
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
            border: '1px solid #E5E7EB',
            fontFamily: "'Roboto', sans-serif",
          }}
        >
          Demo Menüyü İncele →
        </a>
      </div>
    </div>
  );
}
