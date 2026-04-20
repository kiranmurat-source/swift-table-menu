// src/components/admin/LegalSettings.tsx
// Yasal Fiyat Bilgileri — Fiyat Etiketi Yönetmeliği uyum alanları
// restaurants.price_effective_date + show_vat_notice

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, Receipt, Info, CheckCircle } from '@phosphor-icons/react';

interface LegalSettingsProps {
  restaurantId: string;
  initialPriceEffectiveDate: string | null;
  initialShowVatNotice: boolean;
  onSaved?: () => void;
}

export function LegalSettings({
  restaurantId,
  initialPriceEffectiveDate,
  initialShowVatNotice,
  onSaved,
}: LegalSettingsProps) {
  const [priceDate, setPriceDate] = useState<string>(
    initialPriceEffectiveDate || new Date().toISOString().slice(0, 10)
  );
  const [showVat, setShowVat] = useState<boolean>(initialShowVatNotice);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (initialPriceEffectiveDate) setPriceDate(initialPriceEffectiveDate);
    setShowVat(initialShowVatNotice);
  }, [initialPriceEffectiveDate, initialShowVatNotice]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('restaurants')
      .update({
        price_effective_date: priceDate,
        show_vat_notice: showVat,
      })
      .eq('id', restaurantId);

    setSaving(false);
    if (!error) {
      setSavedAt(new Date());
      setTimeout(() => setSavedAt(null), 3000);
      onSaved?.();
    } else {
      alert('Kayıt sırasında hata oluştu: ' + error.message);
    }
  };

  const formatDisplayDate = (isoDate: string): string => {
    if (!isoDate) return '';
    const [y, m, d] = isoDate.split('-');
    return `${d}.${m}.${y}`;
  };

  const today = new Date().toISOString().slice(0, 10);
  const isFutureDate = priceDate > today;

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E5E5',
        borderRadius: 12,
        padding: 24,
        marginBottom: 24,
        fontFamily: 'Roboto, sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Receipt size={22} weight="thin" color="#1C1C1E" />
        <h3 style={{ fontSize: 18, fontWeight: 500, margin: 0, color: '#1C1C1E' }}>
          Yasal Fiyat Bilgileri
        </h3>
      </div>
      <p style={{ fontSize: 13, color: '#6B6B70', margin: '0 0 20px', lineHeight: 1.5 }}>
        Fiyat Etiketi Yönetmeliği (11.10.2025, Sayı: 33044) kapsamında menünüzde görüntülenmesi
        gereken yasal bilgiler.
      </p>

      <div
        style={{
          background: '#F0F7FF',
          border: '1px solid #CFE2FF',
          borderRadius: 8,
          padding: 12,
          marginBottom: 20,
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start',
        }}
      >
        <Info size={18} weight="thin" color="#1F6FD6" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 13, color: '#1F6FD6', lineHeight: 1.5 }}>
          Fiyat değişikliği yaptığınızda bu tarihi mutlaka güncelleyin. Bu bilgiler menünüzde
          ve PDF çıktısında görüntülenecektir.
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label
          style={{
            display: 'block',
            fontSize: 14,
            fontWeight: 500,
            color: '#1C1C1E',
            marginBottom: 8,
          }}
        >
          Fiyatların uygulanmaya başladığı tarih
        </label>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 240 }}>
            <Calendar
              size={18}
              weight="thin"
              color="#6B6B70"
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="date"
              value={priceDate}
              onChange={(e) => setPriceDate(e.target.value)}
              max={today}
              style={{
                width: '100%',
                padding: '10px 12px 10px 38px',
                fontSize: 14,
                fontFamily: 'Roboto, sans-serif',
                border: '1px solid #E5E5E5',
                borderRadius: 8,
                background: '#FFFFFF',
                color: '#1C1C1E',
                outline: 'none',
              }}
            />
          </div>
          <span style={{ fontSize: 13, color: '#6B6B70' }}>
            Görünüm: <strong>{formatDisplayDate(priceDate)}</strong>
          </span>
        </div>
        {isFutureDate && (
          <p style={{ fontSize: 12, color: '#D84315', marginTop: 6 }}>
            ⚠ Gelecek tarih seçilemez — menüde görünen tarih geçmiş veya bugün olmalıdır.
          </p>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 14,
          background: '#F9F9FA',
          borderRadius: 8,
          marginBottom: 20,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#1C1C1E', marginBottom: 2 }}>
            "KDV dahildir" ibaresini göster
          </div>
          <div style={{ fontSize: 12, color: '#6B6B70' }}>
            Menü ve PDF çıktısında bu ibare görüntülenir (önerilen)
          </div>
        </div>
        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={showVat}
            onChange={(e) => setShowVat(e.target.checked)}
            style={{ display: 'none' }}
          />
          <div
            style={{
              width: 44,
              height: 24,
              borderRadius: 12,
              background: showVat ? '#1C1C1E' : '#D1D1D6',
              position: 'relative',
              transition: 'background 0.2s',
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                background: '#FFFFFF',
                position: 'absolute',
                top: 2,
                left: showVat ? 22 : 2,
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
            />
          </div>
        </label>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={handleSave}
          disabled={saving || isFutureDate}
          style={{
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 500,
            fontFamily: 'Roboto, sans-serif',
            background: saving || isFutureDate ? '#D1D1D6' : '#1C1C1E',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 8,
            cursor: saving || isFutureDate ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
          }}
        >
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
        {savedAt && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              color: '#2E7D32',
            }}
          >
            <CheckCircle size={16} weight="fill" /> Kaydedildi
          </span>
        )}
      </div>
    </div>
  );
}
