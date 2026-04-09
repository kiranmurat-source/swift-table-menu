import React from 'react';

// Shimmer animation is defined in src/index.css (@keyframes shimmer)
const shimmerStyle: React.CSSProperties = {
  background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
  borderRadius: 8,
};

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: number;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => <div style={{ ...shimmerStyle, width, height, borderRadius, ...style }} />;

export const StatCardSkeleton: React.FC = () => (
  <div style={{ padding: 20, background: '#fff', borderRadius: 12, border: '1px solid #eee' }}>
    <Skeleton width={80} height={14} style={{ marginBottom: 12 }} />
    <Skeleton width={120} height={32} style={{ marginBottom: 8 }} />
    <Skeleton width={60} height={12} />
  </div>
);

export const MenuItemSkeleton: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
    <Skeleton width={56} height={56} borderRadius={8} />
    <div style={{ flex: 1 }}>
      <Skeleton width="60%" height={16} style={{ marginBottom: 6 }} />
      <Skeleton width="40%" height={12} />
    </div>
    <Skeleton width={80} height={20} />
  </div>
);

export const CategoryTabSkeleton: React.FC = () => (
  <div style={{ display: 'flex', gap: 8, padding: '12px 0', overflowX: 'hidden' }}>
    {[1, 2, 3, 4].map((i) => (
      <Skeleton key={i} width={90} height={36} borderRadius={20} />
    ))}
  </div>
);

export const ListSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div>
    {Array.from({ length: rows }).map((_, i) => (
      <MenuItemSkeleton key={i} />
    ))}
  </div>
);
