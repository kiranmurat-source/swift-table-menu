import { XCircle } from "@phosphor-icons/react";
import { getOptimizedImageUrl, handleImageError } from '../lib/imageUtils';
import type { MenuTheme } from '../lib/themes';
import type { CartItem, AppliedDiscount } from '../lib/useCart';
import QuantitySelector from './QuantitySelector';
import DiscountCodeInput, { type DiscountUIStrings } from './DiscountCodeInput';
import { supabase } from '../lib/supabase';

/* WhatsApp SVG (reused from PublicMenu social icons) */
const WhatsAppIcon = ({ size = 18 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

interface WhatsAppTemplate {
  title: string; table: string; takeaway: string;
  total: string; subtotal: string; discount: string; note: string; sentVia: string;
}

const WA_TEMPLATES: Record<string, WhatsAppTemplate> = {
  tr: { title: 'Yeni Sipariş', table: 'Masa', takeaway: 'Paket', total: 'Toplam', subtotal: 'Ara Toplam', discount: 'İndirim', note: 'Not', sentVia: 'tabbled.com ile gönderildi' },
  en: { title: 'New Order', table: 'Table', takeaway: 'Takeaway', total: 'Total', subtotal: 'Subtotal', discount: 'Discount', note: 'Note', sentVia: 'Sent via tabbled.com' },
  ar: { title: 'طلب جديد', table: 'طاولة', takeaway: 'سفري', total: 'المجموع', subtotal: 'المجموع الفرعي', discount: 'الخصم', note: 'ملاحظة', sentVia: 'tabbled.com أُرسل عبر' },
  zh: { title: '新订单', table: '桌号', takeaway: '外带', total: '合计', subtotal: '小计', discount: '折扣', note: '备注', sentVia: '通过 tabbled.com 发送' },
  de: { title: 'Neue Bestellung', table: 'Tisch', takeaway: 'Zum Mitnehmen', total: 'Gesamt', subtotal: 'Zwischensumme', discount: 'Rabatt', note: 'Notiz', sentVia: 'Gesendet über tabbled.com' },
  fr: { title: 'Nouvelle Commande', table: 'Table', takeaway: 'À emporter', total: 'Total', subtotal: 'Sous-total', discount: 'Réduction', note: 'Note', sentVia: 'Envoyé via tabbled.com' },
  ru: { title: 'Новый заказ', table: 'Стол', takeaway: 'С собой', total: 'Итого', subtotal: 'Подытог', discount: 'Скидка', note: 'Примечание', sentVia: 'Отправлено через tabbled.com' },
};

interface CartUIStrings {
  yourCart: string; emptyCart: string; emptyCartConfirm: string;
  cartEmpty: string; addNote: string; notePlaceholder: string;
  total: string; items: string; sendViaWhatsApp: string;
  whatsappNotAvailable: string;
}

interface Props {
  items: CartItem[];
  note: string;
  totalAmount: number;
  totalItems: number;
  subtotal: number;
  discountAmount: number;
  appliedDiscount: AppliedDiscount | null;
  onUpdateQuantity: (id: string, qty: number, variant?: string) => void;
  onDeleteItem: (id: string, variant?: string) => void;
  onSetNote: (note: string) => void;
  onClearCart: () => void;
  onApplyDiscount: (d: AppliedDiscount) => void;
  onRemoveDiscount: () => void;
  onClose: () => void;
  theme: MenuTheme;
  lang: string;
  ui: CartUIStrings;
  discountUi: DiscountUIStrings;
  restaurantId: string;
  restaurantName: string;
  whatsappNumber: string | null;
  tableNumber: string | null;
  discountEnabled: boolean;
}

function buildWhatsAppUrl(
  number: string,
  restaurantName: string,
  items: CartItem[],
  subtotal: number,
  discountAmount: number,
  totalAmount: number,
  appliedDiscount: AppliedDiscount | null,
  note: string,
  tableNumber: string | null,
  lang: string,
): string {
  const t = WA_TEMPLATES[lang] || WA_TEMPLATES.en;
  const cleanNumber = number.replace(/[^0-9]/g, '');
  const tableInfo = tableNumber ? `${t.table}: ${tableNumber}` : t.takeaway;

  const displayItems = items.slice(0, 15);
  const remaining = items.length - 15;

  const lines = displayItems.map(i => {
    const variantPart = i.variant ? ` (${i.variant})` : '';
    return `• ${i.quantity}x ${i.name}${variantPart} — ${(i.price * i.quantity).toFixed(2)} ₺`;
  });
  if (remaining > 0) lines.push(`... +${remaining}`);

  let msg = `🍽 *${restaurantName}* — ${t.title}\n\n`;
  msg += `📍 ${tableInfo}\n\n`;
  msg += `━━━━━━━━━━━━━━━━\n`;
  msg += lines.join('\n');
  msg += `\n━━━━━━━━━━━━━━━━\n\n`;

  if (appliedDiscount && discountAmount > 0) {
    msg += `💰 ${t.subtotal}: ${subtotal.toFixed(2)} ₺\n`;
    msg += `🏷 ${t.discount} (${appliedDiscount.code}): -${discountAmount.toFixed(2)} ₺\n`;
    msg += `💰 *${t.total}: ${totalAmount.toFixed(2)} ₺*\n`;
  } else {
    msg += `💰 *${t.total}: ${totalAmount.toFixed(2)} ₺*\n`;
  }

  if (note.trim()) msg += `\n📝 ${t.note}: ${note}\n`;
  msg += `\n— ${t.sentVia}`;

  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`;
}

export default function CartDrawer({
  items, note, totalAmount, totalItems, subtotal, discountAmount, appliedDiscount,
  onUpdateQuantity, onDeleteItem, onSetNote, onClearCart, onApplyDiscount, onRemoveDiscount, onClose,
  theme, lang, ui, discountUi, restaurantId, restaurantName, whatsappNumber, tableNumber, discountEnabled,
}: Props) {
  const handleClear = () => {
    if (window.confirm(ui.emptyCartConfirm)) {
      onClearCart();
      onClose();
    }
  };

  const handleWhatsApp = async () => {
    if (!whatsappNumber) return;

    // Increment discount usage via RPC
    if (appliedDiscount) {
      await supabase.rpc('increment_discount_usage', {
        p_restaurant_id: restaurantId,
        p_code: appliedDiscount.code,
      });
    }

    const url = buildWhatsAppUrl(whatsappNumber, restaurantName, items, subtotal, discountAmount, totalAmount, appliedDiscount, note, tableNumber, lang);
    window.open(url, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" style={{ animation: 'modalBackdropIn 0.2s ease-out' }} />
      <div
        className="relative w-full max-w-[480px] flex flex-col"
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: theme.bg,
          color: theme.text,
          borderRadius: '20px 20px 0 0',
          maxHeight: '85vh',
          fontFamily: "'Roboto', sans-serif",
          animation: 'modalSlideUp 0.3s ease-out forwards',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: theme.divider }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 12px' }}>
          <h2 style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 700, fontSize: 18, color: theme.text }}>
            {ui.yourCart} ({totalItems} {ui.items})
          </h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {items.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                style={{ fontSize: 12, fontWeight: 600, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {ui.emptyCart}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.mutedText }}
            >
              <XCircle size={24} />
            </button>
          </div>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>
          {items.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '32px 0', color: theme.mutedText, fontSize: 14 }}>
              {ui.cartEmpty}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map(item => {
                const key = item.variant ? `${item.id}::${item.variant}` : item.id;
                return (
                  <div
                    key={key}
                    style={{
                      display: 'flex',
                      gap: 12,
                      padding: 12,
                      borderRadius: 12,
                      backgroundColor: theme.cardBg,
                      border: `1px solid ${theme.cardBorder}`,
                      position: 'relative',
                    }}
                  >
                    {/* Image */}
                    {item.image_url ? (
                      <img
                        onError={handleImageError}
                        src={getOptimizedImageUrl(item.image_url, 'thumbnail')}
                        alt=""
                        style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                      />
                    ) : (
                      <div style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: theme.divider, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: theme.mutedText, fontFamily: "'Roboto', sans-serif" }}>
                        {item.name.charAt(0)}
                      </div>
                    )}

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: theme.text, marginBottom: 2 }}>{item.name}</div>
                      {item.variant && <div style={{ fontSize: 11, color: theme.mutedText }}>{item.variant}</div>}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                        <QuantitySelector
                          quantity={item.quantity}
                          onIncrement={() => onUpdateQuantity(item.id, item.quantity + 1, item.variant)}
                          onDecrement={() => onUpdateQuantity(item.id, item.quantity - 1, item.variant)}
                          size="sm"
                          theme={theme}
                        />
                        <span style={{ fontSize: 14, fontWeight: 700, color: theme.price, fontFamily: "'Roboto', sans-serif" }}>
                          {(item.price * item.quantity).toFixed(2)} ₺
                        </span>
                      </div>
                    </div>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.id, item.variant)}
                      style={{ position: 'absolute', top: 4, right: 4, background: 'none', border: 'none', cursor: 'pointer', color: theme.mutedText, padding: 4 }}
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Note */}
          {items.length > 0 && (
            <div style={{ marginTop: 12, marginBottom: 12 }}>
              <textarea
                value={note}
                onChange={e => onSetNote(e.target.value)}
                placeholder={`${ui.addNote} (${ui.notePlaceholder})`}
                maxLength={200}
                rows={2}
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 8,
                  border: `1px solid ${theme.cardBorder}`,
                  backgroundColor: theme.cardBg,
                  color: theme.text,
                  fontSize: 13,
                  fontFamily: "'Roboto', sans-serif",
                  resize: 'none',
                  outline: 'none',
                }}
              />
            </div>
          )}
        </div>

        {/* Footer — discount + total + WhatsApp */}
        {items.length > 0 && (
          <div style={{ padding: '12px 20px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))', borderTop: `1px solid ${theme.divider}` }}>
            {/* Discount code input */}
            {discountEnabled && (
              <DiscountCodeInput
                restaurantId={restaurantId}
                subtotal={subtotal}
                appliedDiscount={appliedDiscount}
                onApply={onApplyDiscount}
                onRemove={onRemoveDiscount}
                theme={theme}
                ui={discountUi}
                currency="₺"
              />
            )}

            {/* Subtotal + discount + total */}
            {appliedDiscount && discountAmount > 0 ? (
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: theme.mutedText, marginBottom: 4 }}>
                  <span>{ui.total}</span>
                  <span>{subtotal.toFixed(2)} ₺</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#22c55e', marginBottom: 4 }}>
                  <span>🏷 {appliedDiscount.code}</span>
                  <span>-{discountAmount.toFixed(2)} ₺</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700 }}>
                  <span>{ui.total}</span>
                  <span>{totalAmount.toFixed(2)} ₺</span>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 16, fontWeight: 700 }}>
                <span>{ui.total}</span>
                <span>{totalAmount.toFixed(2)} ₺</span>
              </div>
            )}
            {whatsappNumber ? (
              <button
                type="button"
                onClick={handleWhatsApp}
                style={{
                  width: '100%',
                  height: 48,
                  borderRadius: 12,
                  border: 'none',
                  backgroundColor: '#25D366',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  fontFamily: "'Roboto', sans-serif",
                }}
              >
                <WhatsAppIcon size={18} />
                {ui.sendViaWhatsApp} ({totalAmount.toFixed(2)} ₺)
              </button>
            ) : (
              <p style={{ textAlign: 'center', fontSize: 12, color: theme.mutedText, padding: '8px 0' }}>
                {ui.whatsappNotAvailable}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
