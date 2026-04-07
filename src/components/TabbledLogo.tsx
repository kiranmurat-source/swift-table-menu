interface TabbledLogoProps {
  /** Tailwind height class, e.g. 'h-8', 'h-14'. Default: 'h-8' */
  sizeClass?: string;
  /** 'main' = grid ikonlu logo (navbar), 'text' = pembe text logo (default) */
  logoType?: 'main' | 'text';
  /** Optional link target. Defaults to '/'. Pass null to render without a link. */
  href?: string | null;
  /** Extra classes applied to the outer element. */
  className?: string;
}

const TabbledLogo = ({
  sizeClass = 'h-8',
  logoType = 'text',
  href = '/',
  className = '',
}: TabbledLogoProps) => {
  const logoSrc = logoType === 'main' ? '/tabbled-logo-main.png' : '/tabbled-logo.png';

  const img = (
    <img
      src={logoSrc}
      alt="Tabbled"
      className={`${sizeClass} w-auto block`}
    />
  );

  if (href === null) {
    return <span className={`inline-flex ${className}`}>{img}</span>;
  }

  return (
    <a
      href={href}
      className={`inline-flex items-center ${className}`}
      aria-label="Tabbled"
    >
      {img}
    </a>
  );
};

export default TabbledLogo;
