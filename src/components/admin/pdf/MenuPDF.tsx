// src/components/admin/pdf/MenuPDF.tsx
// Ana menü PDF template — kategorili, ürünlü, çok sayfalı
// Yasal yedek menü formatında (Fiyat Etiketi Yönetmeliği uyumlu)

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { registerPDFFonts } from '../../../lib/pdf/pdfSetup';
import { getPDFStrings, localizedField } from '../../../lib/pdf/pdfLanguages';

registerPDFFonts();

export interface PDFMenuItem {
  id: string;
  name_tr: string | null;
  name_en: string | null;
  description_tr: string | null;
  description_en: string | null;
  translations?: Record<string, { name?: string; description?: string }> | null;
  price: number;
  calories: number | null;
  allergens: string[] | null;
  category_id: string;
  is_available: boolean;
  is_sold_out?: boolean;
  sort_order: number;
}

export interface PDFMenuCategory {
  id: string;
  name_tr: string | null;
  name_en: string | null;
  translations?: Record<string, { name?: string; description?: string }> | null;
  sort_order: number;
  is_active: boolean;
  parent_id: string | null;
}

export interface PDFRestaurant {
  id: string;
  name: string;
  address: string | null;
  price_effective_date: string | null; // YYYY-MM-DD
  show_vat_notice: boolean;
}

export interface MenuPDFProps {
  restaurant: PDFRestaurant;
  categories: PDFMenuCategory[];
  items: PDFMenuItem[];
  langCode: string;
  currency: string;
  currencySymbol: string;
  options: {
    showAllergens: boolean;
    showCalories: boolean;
    showDescription: boolean;
  };
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    padding: 40,
    paddingBottom: 70,
    fontSize: 11,
    color: '#1C1C1E',
  },
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#1C1C1E',
  },
  restaurantName: {
    fontSize: 22,
    fontWeight: 700,
    color: '#1C1C1E',
    marginBottom: 4,
  },
  restaurantAddress: {
    fontSize: 11,
    fontWeight: 400,
    color: '#6B6B70',
    marginBottom: 12,
  },
  legalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  legalText: {
    fontSize: 10,
    fontWeight: 400,
    color: '#6B6B70',
  },
  category: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1C1C1E',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  categoryDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
    marginBottom: 12,
    width: '100%',
  },
  item: {
    marginBottom: 14,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 12,
    fontWeight: 500,
    color: '#1C1C1E',
    flex: 1,
    marginRight: 12,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: 700,
    color: '#1C1C1E',
  },
  itemDescription: {
    fontSize: 10,
    fontWeight: 300,
    color: '#6B6B70',
    lineHeight: 1.4,
    marginBottom: 3,
  },
  itemMeta: {
    fontSize: 9,
    fontWeight: 400,
    color: '#6B6B70',
  },
  itemDivider: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
    marginTop: 10,
  },
  soldOut: {
    textDecoration: 'line-through',
    color: '#9B9B9E',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5E5',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 9,
    fontWeight: 400,
    color: '#9B9B9E',
  },
  pageNumber: {
    fontSize: 9,
    fontWeight: 400,
    color: '#9B9B9E',
  },
});

function formatDate(isoDate: string | null): string {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  return `${d}.${m}.${y}`;
}

function formatPrice(price: number, symbol: string): string {
  const formatted = price.toFixed(2).replace('.', ',');
  return `${formatted} ${symbol}`;
}

function groupItemsByCategory(
  items: PDFMenuItem[],
  categories: PDFMenuCategory[]
): Map<string, PDFMenuItem[]> {
  const map = new Map<string, PDFMenuItem[]>();
  for (const cat of categories) {
    map.set(cat.id, []);
  }
  for (const item of items) {
    if (!item.is_available) continue;
    const list = map.get(item.category_id);
    if (list) {
      list.push(item);
    }
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.sort_order - b.sort_order);
  }
  return map;
}

function formatAllergens(allergens: string[] | null, langCode: string): string {
  if (!allergens || allergens.length === 0) return '';

  const allergenMap: Record<string, Record<string, string>> = {
    tr: {
      milk: 'Süt', gluten: 'Gluten', eggs: 'Yumurta', nuts: 'Fındık',
      peanuts: 'Yer Fıstığı', soy: 'Soya', fish: 'Balık', shellfish: 'Kabuklu',
      sesame: 'Susam', celery: 'Kereviz', mustard: 'Hardal', sulphites: 'Sülfit',
      lupin: 'Acı Bakla', molluscs: 'Yumuşakça',
    },
    en: {
      milk: 'Milk', gluten: 'Gluten', eggs: 'Eggs', nuts: 'Nuts',
      peanuts: 'Peanuts', soy: 'Soy', fish: 'Fish', shellfish: 'Shellfish',
      sesame: 'Sesame', celery: 'Celery', mustard: 'Mustard', sulphites: 'Sulphites',
      lupin: 'Lupin', molluscs: 'Molluscs',
    },
  };

  const langMap = allergenMap[langCode] ?? allergenMap.en;
  return allergens.map(a => langMap[a] ?? a).join(', ');
}

export function MenuPDF({
  restaurant,
  categories,
  items,
  langCode,
  currencySymbol,
  options,
}: MenuPDFProps) {
  const strings = getPDFStrings(langCode);
  const itemsByCategory = groupItemsByCategory(items, categories);

  const visibleCategories = categories
    .filter(cat => cat.is_active && (itemsByCategory.get(cat.id)?.length ?? 0) > 0)
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <Document
      title={`${restaurant.name} — Menü`}
      author="Tabbled"
      subject="Restoran menüsü"
    >
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          {restaurant.address && (
            <Text style={styles.restaurantAddress}>{restaurant.address}</Text>
          )}
          <View style={styles.legalInfo}>
            <Text style={styles.legalText}>
              {strings.priceEffectiveFrom}: {formatDate(restaurant.price_effective_date)}
            </Text>
            {restaurant.show_vat_notice && (
              <Text style={styles.legalText}>{strings.vatIncluded}</Text>
            )}
          </View>
        </View>

        {visibleCategories.map((category) => {
          const categoryItems = itemsByCategory.get(category.id) ?? [];
          const categoryName = localizedField(category, 'name', langCode);

          return (
            <View key={category.id} style={styles.category} wrap>
              <Text style={styles.categoryTitle}>{categoryName}</Text>
              <View style={styles.categoryDivider} />

              {categoryItems.map((item) => {
                const itemName = localizedField(item, 'name', langCode);
                const itemDesc = options.showDescription
                  ? localizedField(item, 'description', langCode)
                  : '';
                const allergenText = options.showAllergens
                  ? formatAllergens(item.allergens, langCode)
                  : '';
                const calorieText = options.showCalories && item.calories
                  ? `${item.calories} ${strings.calories}`
                  : '';

                const metaParts: string[] = [];
                if (calorieText) metaParts.push(calorieText);
                if (allergenText) metaParts.push(`${strings.allergens}: ${allergenText}`);
                const metaLine = metaParts.join(' · ');

                return (
                  <View key={item.id} style={styles.item} wrap={false}>
                    <View style={styles.itemHeader}>
                      <Text style={[
                        styles.itemName,
                        item.is_sold_out ? styles.soldOut : {},
                      ]}>
                        {itemName}
                      </Text>
                      <Text style={[
                        styles.itemPrice,
                        item.is_sold_out ? styles.soldOut : {},
                      ]}>
                        {formatPrice(item.price, currencySymbol)}
                      </Text>
                    </View>
                    {itemDesc && (
                      <Text style={styles.itemDescription}>{itemDesc}</Text>
                    )}
                    {metaLine && (
                      <Text style={styles.itemMeta}>{metaLine}</Text>
                    )}
                    <View style={styles.itemDivider} />
                  </View>
                );
              })}
            </View>
          );
        })}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {strings.poweredBy} · tabbled.com
          </Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) =>
              `${strings.page} ${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
