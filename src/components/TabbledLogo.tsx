interface TabbledLogoProps {
  /** Tailwind height class, e.g. 'h-8', 'h-14'. Default: 'h-8' */
  sizeClass?: string;
  /** 'horizontal' = ikon + yazı yan yana, 'vertical' = ikon üst yazı alt, 'icon' = sadece ikon */
  logoType?: 'horizontal' | 'vertical' | 'icon';
  /** Optional link target. Defaults to '/'. Pass null to render without a link. */
  href?: string | null;
  /** Extra classes applied to the outer element. */
  className?: string;
}

const logoSrcMap = {
  horizontal: '/tabbled-logo-horizontal.png',
  vertical: '/tabbled-logo-vertical.png',
  icon: '/tabbled-logo-icon.png',
} as const;

const TabbledLogo = ({
  sizeClass = 'h-8',
  logoType = 'horizontal',
  href = '/',
  className = '',
}: TabbledLogoProps) => {
  const logoSrc = logoSrcMap[logoType];

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
