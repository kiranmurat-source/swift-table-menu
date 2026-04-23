# TABBLED — DEMO CTA İKİ DÜZELTME

## GÖREV

"Neden şimdi" bölümünde iki düzeltme yapılacak:

### 1. Attribution Metnini Kaldır

"Canlı Demo Menüyü Gör" butonunun altındaki attribution metnini tamamen kaldır.

**Kaldırılacak metin:** "Ramada Encore by Wyndham İstanbul — aktif müşterimiz"

### 2. Demo URL'ini Düzelt

Butonun `href` değerini düzelt.

- **YANLIŞ (mevcut):** `https://tabbled.com/r/ramada-encore-bayrampasa`
- **DOĞRU:** `https://tabbled.com/menu/ramada-encore-bayrampasa`

`/r/` yerine `/menu/` olacak.

---

## YAPILACAKLAR

1. Dosyayı bul:

```bash
cd /opt/khp/tabbled && grep -rln "Neden şimdi" src/
```

2. İlgili component içinde:
   - Attribution `<p>` elementini tamamen sil (muhtemelen `style={S.ctaAttribution}` kullanan)
   - `S.ctaAttribution` stil objesini de S objesinden sil (artık kullanılmıyor)
   - Buton `href`'ini `/r/ramada-encore-bayrampasa` → `/menu/ramada-encore-bayrampasa` olarak değiştir

3. Buton aynı kalsın (pembe, "Canlı Demo Menüyü Gör", ArrowRight ikon) — sadece altındaki attribution metni gidecek ve URL düzelecek.

4. `npm run build` ile hatasız olduğunu doğrula.

---

## TEST

- [ ] Attribution metni görünmüyor
- [ ] Butona tıklayınca yeni sekmede `https://tabbled.com/menu/ramada-encore-bayrampasa` açılıyor
- [ ] Menü gerçekten yükleniyor (404 değil)
- [ ] Build hatasız
- [ ] Unused style warning yok

---

## NOT

- Git push yapma, Murat push'layacak
- Bu dosyayı iş bitince sil: `rm /opt/khp/tabbled/DEMO_CTA_FIX.md`
