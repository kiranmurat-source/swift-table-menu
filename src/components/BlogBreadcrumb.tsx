import { Link } from 'react-router-dom';

interface Props {
  categoryLabel: string;
  category: string;
}

export default function BlogBreadcrumb({ categoryLabel, category }: Props) {
  return (
    <nav
      style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: 13,
        color: '#9CA3AF',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        flexWrap: 'wrap',
      }}
    >
      <Link to="/" style={{ color: '#9CA3AF', textDecoration: 'none' }}>
        Ana Sayfa
      </Link>
      <span>&gt;</span>
      <Link to="/blog" style={{ color: '#9CA3AF', textDecoration: 'none' }}>
        Blog
      </Link>
      <span>&gt;</span>
      <Link
        to={`/blog?category=${category}`}
        style={{ color: '#6B7280', fontWeight: 600, textDecoration: 'none' }}
      >
        {categoryLabel}
      </Link>
    </nav>
  );
}
