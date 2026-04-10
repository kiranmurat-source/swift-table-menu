import { useState } from 'react';
import { CiCircleChevDown } from 'react-icons/ci';

interface FAQItem {
  question: string;
  answer: string;
}

export default function BlogFAQ({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState(0);

  if (items.length === 0) return null;

  return (
    <div style={{ marginTop: 40 }}>
      <h2
        style={{
          fontFamily: "'Playfair Display', serif",
          fontWeight: 600,
          fontSize: 24,
          color: '#1C1C1E',
          marginBottom: 16,
        }}
      >
        Sikca Sorulan Sorular
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={i}
              style={{
                border: '1px solid #E5E7EB',
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? -1 : i)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  border: 'none',
                  backgroundColor: isOpen ? '#FAFAFA' : '#fff',
                  cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  fontSize: 15,
                  color: '#1C1C1E',
                  textAlign: 'left',
                }}
              >
                {item.question}
                <CiCircleChevDown
                  size={18}
                  style={{
                    flexShrink: 0,
                    transition: 'transform 0.2s',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                    color: '#6B7280',
                  }}
                />
              </button>
              {isOpen && (
                <div
                  style={{
                    padding: '0 16px 14px',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 14,
                    color: '#6B7280',
                    lineHeight: 1.7,
                    backgroundColor: '#FAFAFA',
                  }}
                >
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
