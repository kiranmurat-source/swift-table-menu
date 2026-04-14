import { useState } from 'react';
import { XCircle } from "@phosphor-icons/react";
import { supabase } from '../lib/supabase';
import type { MenuTheme } from '../lib/themes';
import StarRating from './StarRating';

interface FBStrings {
  rateExperience: string; shareExperience: string; yourName: string;
  submit: string; thankYou: string; feedbackReceived: string;
  feedbackReceivedLow: string; rateOnGoogle: string; googleHelps: string;
  rateOnGoogleBtn: string; noThanks: string; ok: string;
}

interface Props {
  restaurantId: string;
  googlePlaceId: string | null;
  tableNumber: string | null;
  lang: string;
  theme: MenuTheme;
  ui: FBStrings;
  onClose: () => void;
}

export default function FeedbackModal({ restaurantId, googlePlaceId, tableNumber, lang, theme, ui, onClose }: Props) {
  const [step, setStep] = useState<'form' | 'thankyou'>('form');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const bodyFont = "'Roboto', sans-serif";
  const headingFont = "'Roboto', sans-serif";

  const highRating = rating >= 4;
  const showGoogle = highRating && !!googlePlaceId;

  const handleSubmit = async () => {
    if (rating === 0 || submitting) return;

    // Spam protection — 5 min cooldown
    const lastFb = sessionStorage.getItem('tabbled_last_feedback');
    if (lastFb && Date.now() - Number(lastFb) < 300000) return;

    setSubmitting(true);
    const { error } = await supabase.from('feedback').insert({
      restaurant_id: restaurantId,
      rating,
      comment: comment.trim(),
      customer_name: name.trim(),
      table_number: tableNumber || null,
      language: lang,
    });

    if (!error) {
      sessionStorage.setItem('tabbled_last_feedback', String(Date.now()));
      setStep('thankyou');
      if (!showGoogle) setTimeout(onClose, 3000);
    }
    setSubmitting(false);
  };

  const accent = '#FF4F7A';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" style={{ animation: 'modalBackdropIn 0.2s ease-out' }} />
      <div
        className="relative w-full max-w-[480px] rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
        style={{ backgroundColor: theme.modalBg, color: theme.text, fontFamily: bodyFont, animation: 'modalSlideUp 0.3s ease-out forwards' }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: theme.divider }} />
        </div>

        {step === 'form' ? (
          <div style={{ padding: '8px 24px 24px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontFamily: headingFont, fontWeight: 700, fontSize: 20, color: theme.text }}>{ui.rateExperience}</h2>
              <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.mutedText }}>
                <XCircle size={24} />
              </button>
            </div>

            {/* Stars */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <StarRating rating={rating} onRate={setRating} size={44} emptyColor={theme.key === 'black' ? '#555' : '#D1D5DB'} />
            </div>

            {/* Comment */}
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder={ui.shareExperience}
              maxLength={500}
              rows={3}
              style={{
                width: '100%', padding: 12, borderRadius: 8,
                border: `1px solid ${theme.cardBorder}`, backgroundColor: theme.cardBg,
                color: theme.text, fontSize: 13, fontFamily: bodyFont,
                resize: 'none', outline: 'none', marginBottom: 4,
              }}
            />
            <div style={{ textAlign: 'right', fontSize: 10, color: theme.mutedText, marginBottom: 12 }}>
              {comment.length}/500
            </div>

            {/* Name */}
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={ui.yourName}
              maxLength={50}
              style={{
                width: '100%', padding: 12, borderRadius: 8,
                border: `1px solid ${theme.cardBorder}`, backgroundColor: theme.cardBg,
                color: theme.text, fontSize: 13, fontFamily: bodyFont,
                outline: 'none', marginBottom: 16,
              }}
            />

            {/* Submit */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={rating === 0 || submitting}
              style={{
                width: '100%', height: 48, borderRadius: 12, border: 'none',
                backgroundColor: rating === 0 ? theme.mutedText : accent,
                color: '#fff', fontSize: 15, fontWeight: 600, cursor: rating === 0 ? 'not-allowed' : 'pointer',
                fontFamily: bodyFont, opacity: rating === 0 ? 0.5 : 1,
              }}
            >
              {submitting ? '...' : ui.submit}
            </button>
          </div>
        ) : (
          /* Thank you step */
          <div style={{ padding: '32px 24px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{highRating ? '🎉' : '🙏'}</div>
            <h2 style={{ fontFamily: headingFont, fontWeight: 700, fontSize: 22, color: theme.text, marginBottom: 8 }}>
              {ui.thankYou}
            </h2>
            <p style={{ fontSize: 14, color: theme.mutedText, lineHeight: 1.6, marginBottom: 24 }}>
              {highRating ? ui.feedbackReceived : ui.feedbackReceivedLow}
            </p>

            {showGoogle ? (
              <>
                <div style={{ height: 1, backgroundColor: theme.divider, margin: '0 0 24px' }} />
                <p style={{ fontSize: 14, color: theme.text, fontWeight: 500, marginBottom: 4 }}>{ui.rateOnGoogle}</p>
                <p style={{ fontSize: 12, color: theme.mutedText, marginBottom: 16 }}>{ui.googleHelps}</p>
                <a
                  href={`https://search.google.com/local/writereview?placeid=${googlePlaceId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    width: '100%', height: 48, borderRadius: 12,
                    backgroundColor: '#fff', color: '#1C1C1E',
                    border: '1px solid #e5e7eb', fontSize: 15, fontWeight: 600,
                    textDecoration: 'none', fontFamily: bodyFont, marginBottom: 12,
                  }}
                >
                  ⭐ {ui.rateOnGoogleBtn}
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  style={{ background: 'none', border: 'none', color: theme.mutedText, fontSize: 13, cursor: 'pointer' }}
                >
                  {ui.noThanks}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onClose}
                style={{
                  width: '100%', height: 48, borderRadius: 12, border: 'none',
                  backgroundColor: accent, color: '#fff', fontSize: 15, fontWeight: 600,
                  cursor: 'pointer', fontFamily: bodyFont,
                }}
              >
                {ui.ok}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
