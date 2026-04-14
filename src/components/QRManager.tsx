import { useEffect, useState, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../lib/supabase';
import { XCircle, DownloadSimple } from "@phosphor-icons/react";
import type { AdminTheme } from '../lib/adminTheme';

type QRCode = {
  id: string;
  restaurant_id: string;
  label: string;
  table_number: string;
  url: string;
  is_active: boolean;
  scan_count: number;
  color: string;
  include_logo: boolean;
  created_at: string;
};

type Restaurant = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
};

const makeStyles = (t?: AdminTheme): Record<string, React.CSSProperties> => ({
  input: { width: '100%', padding: '10px 14px', fontSize: 14, border: `1px solid ${t?.inputBorder || '#E5E5E3'}`, borderRadius: 8, outline: 'none', background: t?.inputBg || '#fff', color: t?.inputText || '#2D2D2F', boxSizing: 'border-box' as const },
  btn: { padding: '10px 20px', fontSize: 13, fontWeight: 700, color: '#fff', background: '#FF4F7A', border: 'none', borderRadius: 8, cursor: 'pointer' },
  btnSm: { padding: '6px 14px', fontSize: 12, fontWeight: 600, border: `1px solid ${t?.cardBorder || '#E5E5E3'}`, borderRadius: 6, cursor: 'pointer', background: t?.cardBg || '#fff', color: t?.value || '#2D2D2F' },
  btnDanger: { padding: '6px 14px', fontSize: 12, fontWeight: 600, border: '1px solid #FECACA', borderRadius: 6, cursor: 'pointer', background: t?.cardBg || '#fff', color: '#EF4444' },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: t?.value || '#2D2D2F', marginBottom: 6 },
  card: { background: t?.cardBg || '#fff', border: `1px solid ${t?.cardBorder || '#E5E5E3'}`, borderRadius: 12, padding: 20, marginBottom: 12, color: t?.value },
});

const COLOR_OPTIONS = [
  { value: '#422B21', label: 'Kahve' },
  { value: '#1C1C1E', label: 'Siyah' },
  { value: '#A8B977', label: 'Sage' },
  { value: '#9333EA', label: 'Mor' },
  { value: '#1D4ED8', label: 'Mavi' },
  { value: '#DC2626', label: 'Kırmızı' },
];

interface QRManagerProps {
  restaurant: Restaurant;
  theme?: AdminTheme;
}

export default function QRManager({ restaurant, theme }: QRManagerProps) {
  const S = makeStyles(theme);
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ label: '', table_number: '', color: '#422B21', include_logo: true });
  const [saving, setSaving] = useState(false);
  const [bulkCount, setBulkCount] = useState('');

  const loadQRCodes = useCallback(async () => {
    const { data } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('created_at', { ascending: true });
    setQrCodes(data || []);
  }, [restaurant.id]);

  useEffect(() => { loadQRCodes(); }, [loadQRCodes]);

  function getMenuUrl(tableNumber: string) {
    return `https://tabbled.com/menu/${restaurant.slug}${tableNumber ? `?table=${tableNumber}` : ''}`;
  }

  async function addQRCode(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const url = getMenuUrl(form.table_number);
    await supabase.from('qr_codes').insert({
      restaurant_id: restaurant.id,
      label: form.label || `Masa ${form.table_number}`,
      table_number: form.table_number,
      url,
      color: form.color,
      include_logo: form.include_logo,
    });
    setForm({ label: '', table_number: '', color: '#422B21', include_logo: true });
    setShowForm(false);
    loadQRCodes();
    setSaving(false);
  }

  async function bulkAdd() {
    const count = parseInt(bulkCount);
    if (!count || count < 1 || count > 100) return;
    setSaving(true);
    const existing = qrCodes.length;
    const inserts = Array.from({ length: count }, (_, i) => {
      const num = (existing + i + 1).toString();
      return {
        restaurant_id: restaurant.id,
        label: `Masa ${num}`,
        table_number: num,
        url: getMenuUrl(num),
        color: '#422B21',
        include_logo: true,
      };
    });
    await supabase.from('qr_codes').insert(inserts);
    setBulkCount('');
    loadQRCodes();
    setSaving(false);
  }

  async function deleteQR(id: string) {
    if (!confirm('Bu QR kodu silinecek. Emin misiniz?')) return;
    await supabase.from('qr_codes').delete().eq('id', id);
    loadQRCodes();
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('qr_codes').update({ is_active: !current }).eq('id', id);
    loadQRCodes();
  }

  function downloadQR(qr: QRCode) {
    const svgEl = document.getElementById(`qr-${qr.id}`)?.querySelector('svg');
    if (!svgEl) return;

    const canvas = document.createElement('canvas');
    const size = 1024;
    canvas.width = size;
    canvas.height = size + 80;
    const ctx = canvas.getContext('2d')!;

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 32, 32, size - 64, size - 64);

      // Label at bottom
      ctx.fillStyle = '#1C1C1E';
      ctx.font = "bold 32px 'Roboto', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText(qr.label, size / 2, size + 48);

      const link = document.createElement('a');
      link.download = `${restaurant.slug}-${qr.table_number || qr.label}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  function downloadAll() {
    qrCodes.filter(q => q.is_active).forEach((qr, i) => {
      setTimeout(() => downloadQR(qr), i * 300);
    });
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1C1C1E' }}>QR Kodları</h3>
        <div style={{ display: 'flex', gap: 6 }}>
          {qrCodes.length > 0 && (
            <button onClick={downloadAll} style={{ ...S.btnSm, color: '#A8B977' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><DownloadSimple size={14} /> Hepsini İndir</span>
            </button>
          )}
          <button onClick={() => setShowForm(!showForm)} style={S.btnSm}>{showForm ? 'İptal' : '+ QR Kod'}</button>
        </div>
      </div>

      {/* Bulk add */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
        <input
          type="number"
          min="1"
          max="100"
          placeholder="Masa sayısı"
          value={bulkCount}
          onChange={e => setBulkCount(e.target.value)}
          style={{ ...S.input, width: 120, padding: '6px 10px', fontSize: 13 }}
        />
        <button
          onClick={bulkAdd}
          disabled={saving || !bulkCount}
          style={{ ...S.btnSm, opacity: !bulkCount ? 0.5 : 1 }}
        >
          Toplu Oluştur
        </button>
        <span style={{ fontSize: 11, color: '#A0A0A0' }}>Mevcut: {qrCodes.length} QR kod</span>
      </div>

      {/* Single add form */}
      {showForm && (
        <form onSubmit={addQRCode} style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={S.label}>Etiket</label>
              <input style={S.input} value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="Örn: Bahçe Masa 1" />
            </div>
            <div>
              <label style={S.label}>Masa No *</label>
              <input style={S.input} value={form.table_number} onChange={e => setForm({ ...form, table_number: e.target.value })} required placeholder="Örn: 1" />
            </div>
          </div>
          <div>
            <label style={S.label}>QR Kod Rengi</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setForm({ ...form, color: c.value })}
                  style={{
                    width: 32, height: 32, borderRadius: 8, border: form.color === c.value ? '3px solid #A8B977' : '2px solid #E5E5E3',
                    background: c.value, cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  title={c.label}
                />
              ))}
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: '#2D2D2F' }}>
            <input type="checkbox" checked={form.include_logo} onChange={e => setForm({ ...form, include_logo: e.target.checked })} />
            QR kodun ortasına logo ekle
          </label>
          <button type="submit" disabled={saving} style={{ ...S.btn, alignSelf: 'flex-start' }}>{saving ? '...' : 'Oluştur'}</button>
        </form>
      )}

      {/* QR Code Grid */}
      {qrCodes.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#A0A0A0', padding: 40, fontSize: 14 }}>
          Henüz QR kod oluşturulmadı. Yukarıdan masa sayısı girerek toplu oluşturabilirsiniz.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          {qrCodes.map(qr => (
            <div
              key={qr.id}
              style={{
                ...S.card,
                textAlign: 'center',
                opacity: qr.is_active ? 1 : 0.4,
                padding: 16,
                marginBottom: 0,
              }}
            >
              <div id={`qr-${qr.id}`}>
                <QRCodeSVG
                  value={qr.url}
                  size={140}
                  fgColor={qr.color}
                  bgColor="#ffffff"
                  level="M"
                  imageSettings={
                    qr.include_logo && restaurant.logo_url
                      ? { src: restaurant.logo_url, height: 28, width: 28, excavate: true }
                      : undefined
                  }
                />
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#1C1C1E', marginTop: 8, marginBottom: 2 }}>{qr.label}</p>
              <p style={{ fontSize: 11, color: '#A0A0A0', margin: 0 }}>Masa {qr.table_number}</p>
              <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 10 }}>
                <button onClick={() => downloadQR(qr)} style={{ ...S.btnSm, padding: '4px 8px', fontSize: 11 }}>
                  <DownloadSimple size={12} />
                </button>
                <button onClick={() => toggleActive(qr.id, qr.is_active)} style={{ ...S.btnSm, padding: '4px 8px', fontSize: 11, color: qr.is_active ? '#22C55E' : '#EF4444' }}>
                  {qr.is_active ? 'Aktif' : 'Pasif'}
                </button>
                <button onClick={() => deleteQR(qr.id)} style={{ ...S.btnSm, padding: '4px 8px', fontSize: 11, color: '#EF4444', borderColor: '#FECACA' }}>
                  <XCircle size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
