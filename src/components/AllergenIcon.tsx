import { getAllergenInfo, normalizeAllergenKey } from '@/lib/allergens';

interface AllergenIconProps {
  allergenKey: string;
  size?: number;
  showLabel?: boolean;
  lang?: 'tr' | 'en' | 'ar' | 'zh';
  className?: string;
  invert?: boolean;
  labelColor?: string;
}

export function AllergenIcon({
  allergenKey,
  size = 20,
  showLabel = false,
  lang = 'tr',
  className = '',
  invert = false,
  labelColor,
}: AllergenIconProps) {
  const normalized = normalizeAllergenKey(allergenKey);
  const info = getAllergenInfo(normalized);
  if (!info) return null;

  const label = lang === 'en' ? info.name_en : info.name_tr;

  return (
    <div className={`inline-flex items-center gap-1 ${className}`} title={label}>
      <img
        src={`/allergens-erudus/${info.icon}.svg`}
        alt={label}
        width={size}
        height={size}
        className="flex-shrink-0"
        style={invert ? { filter: 'invert(1) brightness(2)' } : undefined}
      />
      {showLabel && (
        <span
          className="text-xs"
          style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, color: labelColor }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

interface AllergenBadgeListProps {
  allergens: string[] | null | undefined;
  size?: number;
  showLabel?: boolean;
  lang?: 'tr' | 'en' | 'ar' | 'zh';
  className?: string;
  invert?: boolean;
  labelColor?: string;
}

export function AllergenBadgeList({
  allergens,
  size = 18,
  showLabel = false,
  lang = 'tr',
  className = '',
  invert = false,
  labelColor,
}: AllergenBadgeListProps) {
  if (!allergens || allergens.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {allergens.map((key) => (
        <AllergenIcon
          key={key}
          allergenKey={key}
          size={size}
          showLabel={showLabel}
          lang={lang}
          invert={invert}
          labelColor={labelColor}
        />
      ))}
    </div>
  );
}
