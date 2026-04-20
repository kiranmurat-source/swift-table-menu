// src/components/admin/pdf/PDFDownloadButton.tsx
// PDF indir butonu — lazy-loaded, tıklandığında PDF modülü yüklenir
// Ana bundle'a @react-pdf/renderer eklenmez

import { useState } from 'react';
import { FilePdf, Spinner } from '@phosphor-icons/react';

interface PDFDownloadButtonProps {
  restaurantName?: string;
  label?: string;
}

export function PDFDownloadButton({
  restaurantName = 'Tabbled Restoran',
  label = 'PDF İndir (Test)',
}: PDFDownloadButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      // LAZY IMPORT — sadece buton tıklandığında yüklenir
      const [{ pdf }, { TestMenuPDF }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./TestMenuPDF'),
      ]);

      const blob = await pdf(<TestMenuPDF restaurantName={restaurantName} />).toBlob();

      // İndirme tetikle
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tabbled-test-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('PDF oluşturulurken hata oluştu: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 16px',
        fontSize: 14,
        fontWeight: 500,
        fontFamily: 'Roboto, sans-serif',
        background: loading ? '#D1D1D6' : '#1C1C1E',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: 8,
        cursor: loading ? 'wait' : 'pointer',
        transition: 'background 0.2s',
      }}
    >
      {loading ? (
        <>
          <Spinner size={16} weight="thin" style={{ animation: 'spin 1s linear infinite' }} />
          Oluşturuluyor...
        </>
      ) : (
        <>
          <FilePdf size={16} weight="thin" />
          {label}
        </>
      )}
    </button>
  );
}
