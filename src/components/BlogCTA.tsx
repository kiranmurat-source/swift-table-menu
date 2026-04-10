const WA_LINK = 'https://wa.me/905325119484?text=Merhaba%2C%20Tabbled%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum.';

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
          fontFamily: "'Playfair Display', serif",
          fontWeight: 700,
          fontSize: 24,
          color: '#1C1C1E',
          marginBottom: 8,
        }}
      >
        Dijital menunuzu bugun olusturun
      </h3>
      <p
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 14,
          color: '#6B7280',
          marginBottom: 24,
          maxWidth: 480,
          marginLeft: 'auto',
          marginRight: 'auto',
          lineHeight: 1.6,
        }}
      >
        QR menu zorunluluguna uyum saglayın. FineDine ozellikleri, uygun fiyat.
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
        <a
          href={WA_LINK}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 24px',
            borderRadius: 8,
            backgroundColor: '#FF4F7A',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          WhatsApp ile Iletisim
        </a>
        <a
          href="/#fiyatlar"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '12px 24px',
            borderRadius: 8,
            backgroundColor: 'transparent',
            color: '#1C1C1E',
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
            border: '1px solid #E5E7EB',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Fiyatları Incele
        </a>
      </div>
    </div>
  );
}
