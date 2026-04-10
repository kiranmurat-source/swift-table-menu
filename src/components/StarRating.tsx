import { useState } from 'react';
import { Star } from "@phosphor-icons/react";

interface Props {
  rating: number;
  onRate?: (n: number) => void;
  size?: number;
  color?: string;
  emptyColor?: string;
}

export default function StarRating({ rating, onRate, size = 40, color = '#F59E0B', emptyColor = '#D1D5DB' }: Props) {
  const [hover, setHover] = useState(0);
  const interactive = !!onRate;

  return (
    <div style={{ display: 'inline-flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => {
        const filled = interactive ? n <= (hover || rating) : n <= rating;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onRate?.(n)}
            onMouseEnter={() => interactive && setHover(n)}
            onMouseLeave={() => interactive && setHover(0)}
            disabled={!interactive}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: interactive ? 'pointer' : 'default',
              color: filled ? color : emptyColor,
              transition: 'transform 0.15s, color 0.15s',
              transform: interactive && n === hover ? 'scale(1.15)' : 'scale(1)',
              lineHeight: 0,
            }}
            aria-label={`${n} star`}
          >
            <Star size={size} style={{ fill: filled ? color : 'none', strokeWidth: filled ? 0 : 1 }} />
          </button>
        );
      })}
    </div>
  );
}
