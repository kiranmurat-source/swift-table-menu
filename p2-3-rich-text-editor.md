# TABBLED.COM — CLAUDE CODE PROMPT
## P2-3: Zengin Metin Editörü (Ürün Açıklama Alanı)

---

## PROJE BAĞLAMI

- **Repo:** /opt/khp/tabbled (GitHub: kiranmurat-source/swift-table-menu)
- **Stack:** React + Vite + TypeScript + shadcn/ui
- **DB:** Supabase PostgreSQL (qmnrawqvkwehufebbkxp.supabase.co)
- **Deploy:** Vercel (otomatik GitHub push)
- **Font:** Playfair Display (başlıklar) + Inter (body)
- **İkon:** Circum Icons (react-icons/ci) — shadcn/ui internal Lucide'a DOKUNMA
- **Style:** S.* inline styles kullanılıyor
- **Admin UX:** Inline akordeon form (ürün satırının altında açılıyor, modal YOK)

---

## MEVCUT DURUM

### Açıklama Alanları
- `menu_items.description_tr` — TEXT, düz metin
- `menu_items.description_en` — TEXT, düz metin
- `menu_items.translations` — JSONB, diğer dillerdeki çeviriler (description dahil)

### Mevcut Admin Form
- Açıklama (TR): 3 satırlık `<textarea>` — düz metin, formatlama yok
- Açıklama (EN): 3 satırlık `<textarea>` — düz metin, formatlama yok
- İki sütunlu layout (desktop): TR sol, EN sağ

### Public Menü
- Ürün kartı: açıklama 2 satırda kesilir (text-overflow ellipsis)
- Detay modal: tam açıklama gösterilir — düz metin, `<p>` tag'i

---

## GÖREV: ZENGİN METİN EDİTÖRÜ

### Amaç
Ürün açıklama alanlarını (TR ve EN) düz textarea'dan zengin metin editörüne dönüştür. Restoran sahibi bold, italic, listeler kullanabilsin. Public menüde formatlanmış gösterilsin.

### A) Editör Seçimi: Tiptap

**Tiptap kullan** (ProseMirror tabanlı, React için en uygun, headless, hafif):

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-underline @tiptap/extension-placeholder
```

- `@tiptap/starter-kit` → bold, italic, strike, headings, bullet list, ordered list, blockquote, code, hard break
- `@tiptap/extension-underline` → underline desteği
- `@tiptap/extension-placeholder` → boş editörde placeholder metin

**NEDEN Tiptap:**
- React native entegrasyon (useEditor hook)
- Headless — kendi toolbar'ımızı S.* inline styles ile tasarlarız
- HTML çıktısı verir (DB'ye HTML olarak kaydedilir)
- Hafif bundle (~40KB gzip)
- Çeviri merkezi ile uyumlu (HTML → text dönüşümü kolay)

### B) DB Değişiklikleri

**DB değişikliği YOK.** Mevcut `description_tr` ve `description_en` TEXT kolonları HTML string olarak saklanacak.

- Mevcut düz metin veriler bozulmaz — HTML tag'i olmayan metin zaten geçerli HTML'dir
- Yeni formatlanmış içerik HTML olarak kaydedilir: `<p>Fırından taze çıkan <strong>Margherita</strong> pizza.</p><ul><li>Mozzarella</li><li>Domates sos</li></ul>`
- translations JSONB'deki description alanları da aynı şekilde HTML destekler

### C) Admin Panel — RestaurantDashboard.tsx

#### RichTextEditor Bileşeni Oluştur:

1. **Yeni bileşen:** `src/components/RichTextEditor.tsx`

```typescript
// Props:
interface RichTextEditorProps {
  content: string;           // HTML string
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;        // px, default 80
}
```

2. **Toolbar (tek satır, kompakt):**

```
┌──────────────────────────────────────────────────┐
│ [B] [I] [U] [S] │ [• Liste] [1. Liste] │ [Temizle] │
└──────────────────────────────────────────────────┘
│                                                    │
│  Editör alanı (editable, min 80px yükseklik)       │
│                                                    │
└────────────────────────────────────────────────────┘
```

- **B** → Bold (CiBold veya inline SVG, 16px)
- **I** → Italic (CiTextAlignLeft yerine basit "I" harfi, italic style)
- **U** → Underline
- **S** → Strikethrough (üstü çizili)
- **• Liste** → Bullet list (sırasız)
- **1. Liste** → Ordered list (sıralı)
- **Temizle** → Tüm formatlama kaldır (clearNodes + unsetAllMarks)

3. **Toolbar kuralları:**
   - Aktif format butonları vurgulanır (arka plan: #e5e7eb veya tema bazlı)
   - Butonlar 28x28px, gap 2px, border-radius 4px
   - Separator: 1px dikey çizgi (toolbar grupları arasında)
   - Toolbar arka plan: #f5f5f4 (hafif gri)
   - Border: 1px solid #e5e7eb

4. **Editör alanı kuralları:**
   - Arka plan: beyaz (#ffffff)
   - Border: 1px solid #e5e7eb, border-top yok (toolbar ile birleşik)
   - Focus: border-color #3b82f6 (mavi ring)
   - Padding: 12px
   - Min height: 80px (3 satır eşdeğeri)
   - Font: Inter 400, 14px
   - Placeholder: "Ürün açıklamasını girin..." (TR) / "Enter product description..." (EN)
   - Heading desteği KAPALI — sadece inline formatting + listeler

5. **HTML sanitization:**
   - Tiptap zaten güvenli HTML üretir
   - Ek sanitization gerekmez
   - İzin verilen tag'ler: p, strong, em, u, s, ul, ol, li, br

#### Inline Akordeon Formda Entegrasyon:

6. **Mevcut textarea'ları RichTextEditor ile değiştir:**
   - Açıklama (TR): `<textarea>` → `<RichTextEditor content={itemForm.description_tr} onChange={v => setItemForm({...itemForm, description_tr: v})} placeholder="Ürün açıklamasını girin..." />`
   - Açıklama (EN): `<textarea>` → `<RichTextEditor content={itemForm.description_en} onChange={v => setItemForm({...itemForm, description_en: v})} placeholder="Enter product description..." />`
   - Layout korunur: desktop'ta yan yana, mobilde alt alta

7. **Kaydetme:**
   - itemForm.description_tr ve description_en artık HTML string
   - Mevcut save logic'e dokunma — Supabase TEXT kolonuna HTML string kaydedilir
   - Boş editör → boş string "" (mevcut davranışla aynı)

### D) Public Menü — PublicMenu.tsx

#### Ürün Kartı:

8. **Açıklama gösterimi (kart):**
   - Mevcut: düz metin, 2 satırda kesilir
   - Yeni: HTML'den düz metin çıkar (strip tags), 2 satırda kes
   - Helper fonksiyon:
   ```typescript
   const stripHtml = (html: string): string => {
     const tmp = document.createElement('div');
     tmp.innerHTML = html;
     return tmp.textContent || tmp.innerText || '';
   };
   ```
   - Kartta HİÇBİR ZAMAN HTML render edilmez — sadece düz metin özet

#### Ürün Detay Modalı:

9. **Açıklama gösterimi (modal):**
   - Mevcut: düz metin `<p>` tag'i
   - Yeni: HTML olarak render et → `dangerouslySetInnerHTML`
   - Güvenlik: Tiptap'ın ürettiği HTML güvenli (user input XSS riski yok çünkü editör kontrollü)
   - Styling: tema uyumlu
   ```css
   /* Modal içindeki rich text styling */
   .rich-text p { margin: 0 0 8px; }
   .rich-text ul, .rich-text ol { margin: 0 0 8px; padding-left: 20px; }
   .rich-text li { margin: 0 0 4px; }
   .rich-text strong { font-weight: 600; }
   .rich-text em { font-style: italic; }
   .rich-text u { text-decoration: underline; }
   .rich-text s { text-decoration: line-through; }
   ```
   - Bu stilleri inline S.* pattern ile veya `<style>` tag'i ile ekle
   - Renk: tema textPrimary

### E) Çeviri Merkezi Uyumu

10. **Çeviri merkezi ile entegrasyon:**
    - Çeviri merkezi mevcut düz metin editörleri kullanıyor
    - Rich text çevirisi karmaşık — çeviri merkezinde düz textarea KALSIN
    - Google Translate API düz metin bekliyor — HTML göndermek sorun çıkarır
    - Çözüm: Çeviri merkezinde description alanları için HTML strip edilmiş metin göster, çeviri düz metin olarak kaydedilir
    - Bu kabul edilebilir: ana diller (TR/EN) formatlanmış, çeviri dilleri düz metin

### F) Backward Compatibility

11. **Mevcut verilerle uyum:**
    - Mevcut düz metin açıklamalar HTML tag'i içermiyor
    - Tiptap editöre düz metin yüklendiğinde otomatik `<p>` tag'ine sarar
    - Public menüde HTML olmayan eski veriler düzgün render edilir (dangerouslySetInnerHTML düz metni de gösterir)
    - Kartta stripHtml fonksiyonu düz metinde de çalışır (tag yoksa aynı metni döner)

---

## GENEL KURALLAR

1. **İkon:** Sadece `react-icons/ci` (Circum Icons). shadcn/ui internal Lucide'a DOKUNMA. Toolbar'da ikon yoksa basit text/SVG kullan.
2. **Font:** Playfair Display (başlıklar), Inter (body/muted)
3. **Style:** S.* inline styles pattern (toolbar + editör styling)
4. **4-Nokta Sistemi:** Toolbar buton boyutları ve spacing 4'ün katı
5. **DB değişikliği YOK** — mevcut TEXT kolonları HTML string saklar
6. **Bundle etkisi:** Tiptap ~40KB gzip — mevcut 246KB bundle'a ~16% eklenir. Kabul edilebilir.
7. **Deployment:** `npm run build` test → `git add -A && git commit -m "P2-3: Rich text editör (Tiptap) — ürün açıklama alanları" && git push origin main`

---

## TEST CHECKLIST

### Admin Panel:
- [ ] Rich text editör açıklama alanlarında görünüyor (TR + EN)
- [ ] Bold, italic, underline, strikethrough çalışıyor
- [ ] Bullet list ve ordered list çalışıyor
- [ ] "Temizle" butonu tüm formatlamayı kaldırıyor
- [ ] Aktif format butonları vurgulanıyor (toggle)
- [ ] Placeholder metin görünüyor (boş editör)
- [ ] Kaydetme: HTML string DB'ye doğru kaydediliyor
- [ ] Düzenleme: mevcut HTML içerik editöre doğru yükleniyor
- [ ] Mevcut düz metin açıklamalar editörde düzgün görünüyor (backward compat)
- [ ] Desktop: TR ve EN editörler yan yana
- [ ] Mobil: TR ve EN editörler alt alta

### Public Menü:
- [ ] Ürün kartı: HTML strip edilmiş düz metin, 2 satırda kesilmiş
- [ ] Detay modal: formatlanmış açıklama (bold, italic, listeler) doğru render ediliyor
- [ ] Eski düz metin açıklamalar detay modalda düzgün görünüyor
- [ ] 3 tema test (white/black/red) — rich text renkleri tema uyumlu
- [ ] RTL dil (Arapça) — liste yönü doğru

### Çeviri Merkezi:
- [ ] Çeviri merkezinde açıklama alanları çalışıyor (düz metin olarak)
- [ ] Google Translate auto-translate bozulmadı

### Regression:
- [ ] Inline akordeon form bozulmadı
- [ ] Fiyat varyantları, besin değerleri, hazırlanma süresi çalışıyor
- [ ] Kaydetme/iptal akışı düzgün

---

## DOSYA DEĞİŞİKLİK LİSTESİ (Beklenen)

1. `src/components/RichTextEditor.tsx` — YENİ: Tiptap tabanlı rich text editör bileşeni
2. `src/pages/RestaurantDashboard.tsx` — textarea → RichTextEditor değişimi
3. `src/pages/PublicMenu.tsx` — detay modalda dangerouslySetInnerHTML + kartta stripHtml
4. `package.json` — @tiptap/react, @tiptap/starter-kit, @tiptap/extension-underline, @tiptap/extension-placeholder

---

## ÖNCELİK SIRASI

1. npm install Tiptap paketleri
2. RichTextEditor.tsx bileşeni oluştur (toolbar + editör)
3. Admin form: textarea → RichTextEditor değiştir
4. Public menü kart: stripHtml helper + düz metin gösterim
5. Public menü detay modal: dangerouslySetInnerHTML + rich text styling
6. Çeviri merkezi kontrolü (bozulmadığından emin ol)
7. Backward compat testi (eski düz metin veriler)
8. Build test + deploy
