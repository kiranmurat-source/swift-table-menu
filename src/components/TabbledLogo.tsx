interface TabbledLogoProps {
  /** Tailwind height class, e.g. 'h-8', 'h-14'. Default: 'h-8' */
  sizeClass?: string;
  /**
   * 'light' (default) — logo is displayed on a light background, so wrap it in a
   * dark box for contrast. 'dark' — logo is displayed on a dark background and
   * can be used directly.
   */
  variant?: 'light' | 'dark';
  /** Optional link target. Defaults to '/'. Pass null to render without a link. */
  href?: string | null;
  /** Extra classes applied to the outer element. */
  className?: string;
}

const TabbledLogo = ({
  sizeClass = 'h-8',
  variant = 'light',
  href = '/',
  className = '',
}: TabbledLogoProps) => {
  const img = (
    <img
      src="/tabbled-logo.png"
      alt="Tabbled"
      className={`${sizeClass} w-auto block`}
    />
  );

  const wrapped =
    variant === 'light' ? (
      <span
        className="inline-flex items-center"
        style={{ background: '#111', padding: '4px 12px', borderRadius: 6 }}
      >
        {img}
      </span>
    ) : (
      img
    );

  if (href === null) {
    return <span className={`inline-flex ${className}`}>{wrapped}</span>;
  }

  return (
    <a
      href={href}
      className={`inline-flex items-center ${className}`}
      aria-label="Tabbled"
    >
      {wrapped}
    </a>
  );
};

export default TabbledLogo;
