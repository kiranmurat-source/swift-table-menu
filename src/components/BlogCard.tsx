import { Link } from 'react-router-dom';
import { CiCalendarDate, CiClock2 } from 'react-icons/ci';
import { CATEGORY_COLORS, type BlogPost } from '../lib/blogData';
import { formatDate } from '../lib/blogUtils';

export default function BlogCard({ post }: { post: BlogPost }) {
  const catColor = CATEGORY_COLORS[post.category] || '#6B7280';

  return (
    <Link
      to={`/blog/${post.slug}`}
      style={{
        display: 'block',
        backgroundColor: '#fff',
        borderRadius: 12,
        border: '1px solid #E5E7EB',
        padding: 24,
        textDecoration: 'none',
        color: 'inherit',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      {/* Category badge */}
      <span
        style={{
          display: 'inline-block',
          fontSize: 11,
          fontWeight: 600,
          color: '#fff',
          backgroundColor: catColor,
          padding: '2px 10px',
          borderRadius: 12,
          marginBottom: 12,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {post.categoryLabel}
      </span>

      {/* Title */}
      <h3
        style={{
          fontFamily: "'Playfair Display', serif",
          fontWeight: 600,
          fontSize: 18,
          color: '#1C1C1E',
          lineHeight: 1.3,
          marginBottom: 8,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {post.title}
      </h3>

      {/* Excerpt */}
      <p
        style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 400,
          fontSize: 14,
          color: '#6B7280',
          lineHeight: 1.6,
          marginBottom: 16,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {post.excerpt}
      </p>

      {/* Meta */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontFamily: "'Inter', sans-serif",
          fontSize: 12,
          color: '#9CA3AF',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <CiCalendarDate size={14} /> {formatDate(post.publishedAt)}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <CiClock2 size={14} /> {post.readingTime} dk
        </span>
      </div>
    </Link>
  );
}
