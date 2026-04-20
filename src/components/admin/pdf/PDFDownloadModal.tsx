// src/components/admin/pdf/PDFDownloadModal.tsx
// PDF indir modal — dil seçimi + opsiyonel checkbox'lar

import { useState } from 'react';
import { X, Download, FilePdf } from '@phosphor-icons/react';
import { PDF_SUPPORTED_LANGUAGES } from '../../../lib/pdf/pdfLanguages';
import type { PDFMenuCategory, PDFMenuItem, PDFRestaurant } from './MenuPDF';

export interface PDFDownloadOptions {
  langCode: string;
  showAllergens: boolean;
  showCalories: boolean;
  showDescription: boolean;
}

interface PDFDownloadModalProps {
  restaurant: PDFRestaurant;
  categories: PDFMenuCategory[];
  items: PDFMenuItem[];
  currency: string;
  currencySymbol: string;
  defaultLangCode?: string;
  onClose: () => void;
}

export function PDFDownloadModal({
  restaurant,
  categories,
  items,
  currency,
  currencySymbol,
  defaultLangCode = 'tr',
  onClose,
}: PDFDownloadModalProps) {
  const [langCode, setLangCode] = useState<string>(defaultLangCode);
  const [showAllergens, setShowAllergens] = useState(true);
  const [showCalories, setShowCalories] = useState(true);
  const [showDescription, setShowDescription] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const [{ pdf }, { MenuPDF }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./MenuPDF'),
      ]);

      const blob = await pdf(
        <MenuPDF
          restaurant={restaurant}
          categories={categories}
          items={items}
          langCode={langCode}
          currency={currency}
          currencySymbol={currencySymbol}
          options={{
            showAllergens,
            showCalories,
            showDescription,
          }}
        />
      ).toBlob();

      const safeName = restaurant.name
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9-]/g, '');
      const today = new Date().toISOString().slice(0, 10);
      const filename = `${safeName}-menu-${today}.pdf`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onClose();
    } catch (err) {
      console.error('PDF generation error:', err);
      alert(
        'PDF oluşturulurken hata oluştu: ' +
          (err instanceof Error ? err.message : 'Bilinmeyen hata')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          borderRadius: 12,
          maxWidth: 440,
          width: '100%',
          padding: 24,
          fontFamily: 'Roboto, sans-serif',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FilePdf size={22} weight="thin" color="#1C1C1E" />
            <h3 style={{ fontSize: 18, fontWeight: 500, margin: 0, color: '#1C1C1E' }}>
              Menü PDF İndir
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} weight="thin" color="#6B6B70" />
          </button>
        </div>

        <p style={{ fontSize: 13, color: '#6B6B70', margin: '0 0 20px', lineHeight: 1.5 }}>
          Yasal yedek menü olarak kullanabileceğiniz PDF dosyasını oluşturun.
        </p>

        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 500,
              color: '#1C1C1E',
              marginBottom: 6,
            }}
          >
            Dil
          </label>
          <select
            value={langCode}
            onChange={(e) => setLangCode(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: 14,
              fontFamily: 'Roboto, sans-serif',
              border: '1px solid #E5E5E5',
              borderRadius: 8,
              background: '#FFFFFF',
              color: '#1C1C1E',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {PDF_SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeName} ({lang.englishName})
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 500,
              color: '#1C1C1E',
              marginBottom: 10,
            }}
          >
            İçerik Seçenekleri
          </label>

          {[
            { key: 'description', label: 'Ürün açıklaması', state: showDescription, setter: setShowDescription },
            { key: 'allergens', label: 'Alerjen bilgileri', state: showAllergens, setter: setShowAllergens },
            { key: 'calories', label: 'Kalori bilgisi', state: showCalories, setter: setShowCalories },
          ].map((opt) => (
            <label
              key={opt.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 0',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={opt.state}
                onChange={(e) => opt.setter(e.target.checked)}
                style={{
                  width: 18,
                  height: 18,
                  cursor: 'pointer',
                  accentColor: '#1C1C1E',
                }}
              />
              <span style={{ fontSize: 14, color: '#1C1C1E' }}>{opt.label}</span>
            </label>
          ))}
        </div>

        <div
          style={{
            background: '#F9F9FA',
            borderRadius: 8,
            padding: 12,
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 12, color: '#6B6B70', lineHeight: 1.5 }}>
            PDF'te şunlar zorunlu olarak yer alır: işletme adı, adres, menü tarihi, fiyatlar,
            KDV bildirimi (ayarlardan yönetilir).
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 500,
              fontFamily: 'Roboto, sans-serif',
              background: '#FFFFFF',
              color: '#1C1C1E',
              border: '1px solid #E5E5E5',
              borderRadius: 8,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            İptal
          </button>
          <button
            onClick={handleDownload}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 500,
              fontFamily: 'Roboto, sans-serif',
              background: loading ? '#D1D1D6' : '#1C1C1E',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              cursor: loading ? 'wait' : 'pointer',
            }}
          >
            <Download size={16} weight="thin" />
            {loading ? 'Oluşturuluyor...' : 'PDF İndir'}
          </button>
        </div>
      </div>
    </div>
  );
}
