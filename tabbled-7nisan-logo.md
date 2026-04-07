# TABBLED — Claude Code Prompt
# 7 Nisan 2026 — Logo Entegrasyonu

---

## PROJE BAĞLAMI

- **Dizin:** /opt/khp/tabbled
- **Logo dosyası:** /opt/khp/tabbled/tabbled-logo.png (VPS'te mevcut)

---

## GÖREV: Logo Entegrasyonu

### Logo Dosyası
Önce logo'yu public klasörüne kopyala:
```bash
cp /opt/khp/tabbled/tabbled-logo.png public/tabbled-logo.png
```

### Logo siyah arka plan üzerinde pembe "tabbled" yazısı + altında gri "HORECA TECH SOLUTIONS" tagline içeriyor.

### Yapılacak
Projede "tabbled" veya "Tabbled" düz text olarak geçen TÜM yerleri bul ve logo görseli ile değiştir.

Önce tüm referansları bul:
```bash
grep -rn -i "tabbled" src/ --include="*.tsx" --include="*.ts"
```

### Değiştirilecek Yerler

1. **Navbar:** Sol üstteki "Tabbled" text → `<img src="/tabbled-logo.png" alt="Tabbled" className="h-8" />`
2. **Footer:** "Tabbled" text → logo görseli
3. **Login sayfası:** "Tabbled" başlığı varsa → logo
4. **Public menü "Powered by Tabbled":** Küçük logo
5. **Splash ekranı "Powered by Tabbled":** Küçük logo
6. Başka text "Tabbled" referansı varsa → logo

### Logo Boyutları
- **Navbar:** h-8 (32px yükseklik)
- **Footer:** h-7 (28px yükseklik)
- **Login sayfası:** h-14 (56px yükseklik)
- **"Powered by" alanları:** h-4 veya h-5 (16-20px yükseklik)

### Arka Plan Uyumu
Logo siyah arka planlı PNG:
- **Koyu arka planlarda** (footer, splash overlay): Direkt kullan
- **Beyaz/açık arka planlarda** (navbar, login): Siyah arka planlı logoyu küçük koyu kutu içinde göster:
  ```tsx
  <div style={{ background: '#111', padding: '4px 12px', borderRadius: '6px', display: 'inline-block' }}>
    <img src="/tabbled-logo.png" alt="Tabbled" className="h-8" />
  </div>
  ```
  Bu şekilde her arka planda tutarlı görünür.

### Değiştirme
- `<title>` tag ve meta description'daki "Tabbled" text olarak KALSIN
- Alt text her zaman "Tabbled" olsun
- Navbar'da logo tıklanınca ana sayfaya gitsin (Link veya a tag)
- shadcn/ui internal Lucide ikonlarına dokunma

---

## TEST

- [ ] Navbar'da logo görseli var (text yok)
- [ ] Footer'da logo görseli var
- [ ] Login sayfasında logo var
- [ ] "Powered by Tabbled" alanlarında küçük logo
- [ ] Açık ve koyu arka planlarda logo görünür
- [ ] Logo tıklanınca ana sayfaya gidiyor
- [ ] npm run build hatasız
