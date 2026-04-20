// src/components/admin/pdf/PDFDownloadButton.tsx
// Menü tab'ında görünen buton — tıklandığında PDF indirme modal'ını açar

import { useState } from 'react';
import { FilePdf } from '@phosphor-icons/react';
import { PDFDownloadModal } from './PDFDownloadModal';
import type { PDFMenuCategory, PDFMenuItem, PDFRestaurant } from './MenuPDF';

interface PDFDownloadButtonProps {
  restaurant: PDFRestaurant;
  categories: PDFMenuCategory[];
  items: PDFMenuItem[];
  currency: string;
  currencySymbol: string;
  defaultLangCode?: string;
}

export function PDFDownloadButton(props: PDFDownloadButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 16px',
          fontSize: 14,
          fontWeight: 500,
          fontFamily: 'Roboto, sans-serif',
          background: '#1C1C1E',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          transition: 'background 0.2s',
        }}
      >
        <FilePdf size={16} weight="thin" />
        PDF İndir
      </button>

      {modalOpen && (
        <PDFDownloadModal
          {...props}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
