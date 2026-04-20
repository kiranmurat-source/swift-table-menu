// src/components/admin/pdf/TestMenuPDF.tsx
// Minimal test PDF — Türkçe karakter doğrulaması için
// Aşama 3B'de gerçek menü template ile değiştirilecek

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { registerPDFFonts } from '../../../lib/pdf/pdfSetup';

// Font kayıt (ilk render'da çalışır)
registerPDFFonts();

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    padding: 40,
    fontSize: 12,
    color: '#1C1C1E',
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 20,
    color: '#1C1C1E',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: 500,
    marginBottom: 12,
    color: '#6B6B70',
  },
  paragraph: {
    fontSize: 12,
    fontWeight: 400,
    lineHeight: 1.6,
    marginBottom: 8,
  },
  highlight: {
    fontWeight: 700,
    color: '#FF4F7A',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    marginVertical: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 10,
    color: '#9B9B9E',
    textAlign: 'center',
  },
});

interface TestMenuPDFProps {
  restaurantName?: string;
}

export function TestMenuPDF({ restaurantName = 'Test Restoran' }: TestMenuPDFProps) {
  return (
    <Document title="Tabbled PDF Test" author="Tabbled">
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>PDF Export Test</Text>
        <Text style={styles.subtitle}>Restoran: {restaurantName}</Text>

        <View style={styles.divider} />

        <Text style={styles.paragraph}>
          <Text style={styles.highlight}>Türkçe karakter testi:</Text> Şeftali, çilek, İstanbul,
          Ümraniye, Gümüşhane, Öğretmen, Çağrı Bey, Ğ harfi nadir kullanılır.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.highlight}>Ş ğ ı İ Ü Ö Ç — tüm özel karakterler doğru görünmeli.</Text>
        </Text>

        <Text style={styles.paragraph}>
          Bu PDF Tabbled PDF export altyapısının doğrulaması için oluşturuldu. Bir sonraki
          aşamada gerçek menü template'i bu altyapı üzerine inşa edilecek.
        </Text>

        <View style={styles.divider} />

        <Text style={styles.subtitle}>Font weight testi</Text>
        <Text style={[styles.paragraph, { fontWeight: 300 }]}>Light (300) — İnce yazı</Text>
        <Text style={[styles.paragraph, { fontWeight: 400 }]}>Regular (400) — Normal yazı</Text>
        <Text style={[styles.paragraph, { fontWeight: 500 }]}>Medium (500) — Orta kalın</Text>
        <Text style={[styles.paragraph, { fontWeight: 700 }]}>Bold (700) — Kalın yazı</Text>

        <Text style={styles.footer}>
          Tabbled PDF Test · Oluşturulma: {new Date().toLocaleDateString('tr-TR')}
        </Text>
      </Page>
    </Document>
  );
}
