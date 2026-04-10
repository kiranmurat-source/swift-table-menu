import { useState } from 'react';
import { CiBellOn, CiReceipt } from 'react-icons/ci';
import { supabase } from '../lib/supabase';
import type { MenuTheme } from '../lib/themes';

const translations: Record<string, { callWaiter: string; askBill: string; sent: string; called: string; requested: string }> = {
  tr: { callWaiter: 'Garson Çağır', askBill: 'Hesap İste', sent: 'Çağrınız iletildi!', called: 'Çağrıldı', requested: 'İstendi' },
  en: { callWaiter: 'Call Waiter', askBill: 'Request Bill', sent: 'Your request has been sent!', called: 'Called', requested: 'Requested' },
  ar: { callWaiter: 'استدعاء النادل', askBill: 'طلب الفاتورة', sent: 'تم إرسال طلبك!', called: 'تم الاستدعاء', requested: 'تم الطلب' },
  zh: { callWaiter: '呼叫服务员', askBill: '请求账单', sent: '您的请求已发送！', called: '已呼叫', requested: '已请求' },
  de: { callWaiter: 'Kellner rufen', askBill: 'Rechnung bitte', sent: 'Ihre Anfrage wurde gesendet!', called: 'Gerufen', requested: 'Angefordert' },
  fr: { callWaiter: 'Appeler serveur', askBill: "Demander l'addition", sent: 'Votre demande a été envoyée!', called: 'Appelé', requested: 'Demandé' },
  ru: { callWaiter: 'Позвать официанта', askBill: 'Попросить счёт', sent: 'Ваш запрос отправлен!', called: 'Вызван', requested: 'Запрошено' },
};

interface WaiterCallBarProps {
  restaurantId: string;
  tableNumber: string;
  theme: MenuTheme;
  language: string;
}

export default function WaiterCallBar({ restaurantId, tableNumber, theme, language }: WaiterCallBarProps) {
  const [calling, setCalling] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const t = translations[language] || translations.en;

  const handleCall = async (callType: 'waiter' | 'bill') => {
    if (cooldown || calling) return;
    setCalling(true);

    try {
      const { error } = await supabase
        .from('waiter_calls')
        .insert({
          restaurant_id: restaurantId,
          table_number: tableNumber,
          call_type: callType,
          status: 'pending',
        });

      if (error) throw error;

      setShowSuccess(true);
      setCooldown(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setTimeout(() => setCooldown(false), 30000);
    } catch {
      alert(language === 'tr' ? 'Bir hata oluştu. Lütfen tekrar deneyin.' : 'An error occurred. Please try again.');
    } finally {
      setCalling(false);
    }
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-sm"
      style={{
        backgroundColor: `${theme.bg}ee`,
        borderTop: `1px solid ${theme.divider}`,
        padding: '8px 16px',
        paddingBottom: 'calc(8px + env(safe-area-inset-bottom))',
      }}
    >
      <div className="max-w-[480px] mx-auto flex gap-2 justify-center">
        {showSuccess ? (
          <div className="flex items-center gap-2 py-2" style={{ color: '#16a34a', fontSize: 14, fontWeight: 600 }}>
            <span style={{ fontSize: 18 }}>✓</span>
            {t.sent}
          </div>
        ) : (
          <>
            <button
              onClick={() => handleCall('waiter')}
              disabled={cooldown || calling}
              className="flex-1 flex items-center justify-center gap-1.5 transition-all"
              style={{
                maxWidth: 200,
                padding: '10px 16px',
                borderRadius: 10,
                border: 'none',
                backgroundColor: cooldown ? theme.mutedText : theme.accent,
                color: theme.key === 'white' || theme.key === 'red' ? '#fff' : theme.bg,
                fontSize: 14,
                fontWeight: 600,
                cursor: cooldown ? 'not-allowed' : 'pointer',
                opacity: calling ? 0.7 : 1,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              <CiBellOn size={18} />
              {cooldown ? t.called : calling ? '...' : t.callWaiter}
            </button>

            <button
              onClick={() => handleCall('bill')}
              disabled={cooldown || calling}
              className="flex-1 flex items-center justify-center gap-1.5 transition-all"
              style={{
                maxWidth: 200,
                padding: '10px 16px',
                borderRadius: 10,
                border: `1.5px solid ${cooldown ? theme.mutedText : theme.accent}`,
                backgroundColor: 'transparent',
                color: cooldown ? theme.mutedText : theme.accent,
                fontSize: 14,
                fontWeight: 600,
                cursor: cooldown ? 'not-allowed' : 'pointer',
                opacity: calling ? 0.7 : 1,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              <CiReceipt size={18} />
              {cooldown ? t.requested : calling ? '...' : t.askBill}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
