// src/lib/pdf/pdfSetup.ts
// PDF export altyapı — font registration, ortak setup
// @react-pdf/renderer konfigürasyonu

import { Font } from '@react-pdf/renderer';

let fontsRegistered = false;

/**
 * Roboto fontunu react-pdf'e kaydet.
 * Türkçe karakter desteği için TTF embed edilir.
 * Idempotent — birden fazla kez çağrılabilir, sadece ilkinde register eder.
 */
export function registerPDFFonts() {
  if (fontsRegistered) return;

  Font.register({
    family: 'Roboto',
    fonts: [
      { src: '/fonts/Roboto-Light.ttf', fontWeight: 300 },
      { src: '/fonts/Roboto-Regular.ttf', fontWeight: 400 },
      { src: '/fonts/Roboto-Medium.ttf', fontWeight: 500 },
      { src: '/fonts/Roboto-Bold.ttf', fontWeight: 700 },
    ],
  });

  // Hyphenation devre dışı (Türkçe için daha iyi sonuç)
  Font.registerHyphenationCallback((word) => [word]);

  fontsRegistered = true;
}
