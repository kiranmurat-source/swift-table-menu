import { useEffect, useState } from 'react';
import type { TOCItem } from '../lib/blogUtils';

const WA_LINK = 'https://wa.me/905325119484?text=Merhaba%2C%20Tabbled%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum.';

export default function BlogTOC({ items }: { items: TOCItem[] }) {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    if (items.length === 0) return;
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px' },
    );
    items.forEach(item => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <div style={{ position: 'sticky', top: 100 }}>
      {/* TOC */}
      <div
        style={{
          border: '1px solid #E5E7EB',
          borderRadius: 12,
          padding: 20,
          marginBottom: 16,
        }}
      >
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
            fontSize: 11,
            color: '#9CA3AF',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 12,
          }}
        >
          ICINDEKILER
        </p>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items
            .filter(i => i.level === 2)
            .map(item => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={e => {
                  e.preventDefault();
                  document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 13,
                  color: activeId === item.id ? '#FF4F7A' : '#6B7280',
                  fontWeight: activeId === item.id ? 600 : 400,
                  textDecoration: 'none',
                  lineHeight: 1.5,
                  transition: 'color 0.15s',
                }}
              >
                {item.text}
              </a>
            ))}
        </nav>
      </div>

      {/* Sidebar CTA */}
      <div
        style={{
          border: '1px solid #E5E7EB',
          borderRadius: 12,
          padding: 24,
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: 16, marginBottom: 4, fontFamily: "'Inter', sans-serif" }}>
          Ucretsiz Demo
        </p>
        <p
          style={{
            fontSize: 13,
            color: '#6B7280',
            marginBottom: 16,
            fontFamily: "'Inter', sans-serif",
            lineHeight: 1.5,
          }}
        >
          5 dakikada menunuzu olusturun
        </p>
        <a
          href={WA_LINK}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block',
            padding: '10px 0',
            borderRadius: 8,
            backgroundColor: '#FF4F7A',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Demo Talep Et
        </a>
      </div>
    </div>
  );
}
