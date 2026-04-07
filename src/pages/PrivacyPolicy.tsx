import { useState } from 'react';
import TabbledLogo from '@/components/TabbledLogo';

const content = {
  tr: {
    title: 'Gizlilik ve Kişisel Verilerin Korunması Politikası',
    lastUpdated: 'Son güncelleme: 4 Nisan 2026',
    sections: [
      { heading: '1. Veri Sorumlusu', body: 'Bu web sitesi (tabbled.com) KHP Limited ("Şirket") tarafından işletilmektedir. Kişisel verilerinizin korunması konusunda 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu sıfatıyla hareket etmekteyiz.\n\nİletişim: info@tabbled.com' },
      { heading: '2. Toplanan Kişisel Veriler', body: 'Hizmetlerimizi sunmak amacıyla aşağıdaki kişisel verileri toplayabiliriz:\n\n• İletişim bilgileri: Ad, soyad, e-posta adresi, telefon numarası\n• İşletme bilgileri: İşletme adı, sektör, adres\n• Kullanım verileri: Sayfa görüntüleme, tıklama verileri, oturum süresi (Google Analytics aracılığıyla)\n• Çerez verileri: Tarayıcı bilgileri, IP adresi, cihaz bilgileri\n• Demo/iletişim formu verileri: Formlar aracılığıyla gönüllü olarak paylaştığınız bilgiler' },
      { heading: '3. Verilerin İşlenme Amaçları', body: 'Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:\n\n• Dijital menü (QR kod) hizmetinin sunulması\n• Online pazarlama desteği sağlanması\n• Tedarikçi platformu hizmetlerinin yürütülmesi\n• Demo taleplerinizin değerlendirilmesi ve sizinle iletişime geçilmesi\n• Hizmet kalitesinin artırılması ve kullanıcı deneyiminin iyileştirilmesi\n• Web sitesi performansının analiz edilmesi\n• Yasal yükümlülüklerin yerine getirilmesi' },
      { heading: '4. Verilerin İşlenme Hukuki Sebepleri', body: 'KVKK madde 5 kapsamında kişisel verileriniz şu hukuki sebeplere dayanılarak işlenir:\n\n• Açık rızanız (analitik çerezler için)\n• Bir sözleşmenin kurulması veya ifasıyla doğrudan ilgili olması\n• Veri sorumlusunun meşru menfaati\n• Hukuki yükümlülüğün yerine getirilmesi' },
      { heading: '5. Çerez Politikası', body: 'Web sitemizde aşağıdaki çerez türleri kullanılmaktadır:\n\n• Zorunlu çerezler: Sitenin düzgün çalışması için gereklidir. Bu çerezler devre dışı bırakılamaz.\n• Analitik çerezler: Google Analytics aracılığıyla site kullanımını analiz etmek için kullanılır. Bu çerezler yalnızca açık rızanız ile etkinleştirilir.\n\nÇerez tercihlerinizi istediğiniz zaman değiştirebilirsiniz.' },
      { heading: '6. Verilerin Aktarılması', body: 'Kişisel verileriniz aşağıdaki durumlarda üçüncü taraflarla paylaşılabilir:\n\n• Google LLC (Google Analytics — analitik amaçlı, ABD sunucuları)\n• Vercel Inc. (web sitesi barındırma hizmeti)\n• Resend Inc. (e-posta gönderim hizmeti)\n• Yasal zorunluluk halinde yetkili kamu kurum ve kuruluşları\n\nYurt dışına veri aktarımı yapılması halinde KVKK madde 9\'da belirtilen şartlara uygunluk sağlanır.' },
      { heading: '7. Veri Saklama Süresi', body: 'Kişisel verileriniz, işlenme amacının gerektirdiği süre boyunca saklanır. İletişim formu verileri en fazla 2 yıl, analitik veriler 14 ay süreyle tutulur. Süre sonunda veriler silinir, yok edilir veya anonim hale getirilir.' },
      { heading: '8. Haklarınız (KVKK Madde 11)', body: 'KVKK kapsamında aşağıdaki haklara sahipsiniz:\n\n• Kişisel verilerinizin işlenip işlenmediğini öğrenme\n• İşlenmişse buna ilişkin bilgi talep etme\n• İşlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme\n• Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme\n• Eksik veya yanlış işlenmişse düzeltilmesini isteme\n• KVKK madde 7\'deki şartlar çerçevesinde silinmesini veya yok edilmesini isteme\n• Düzeltme, silme veya yok etme işlemlerinin aktarıldığı üçüncü kişilere bildirilmesini isteme\n• İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme\n• Kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız halinde zararın giderilmesini talep etme\n\nBaşvurularınızı info@tabbled.com adresine iletebilirsiniz. Talepleriniz en geç 30 gün içinde ücretsiz olarak sonuçlandırılacaktır.' },
      { heading: '9. Politika Güncellemeleri', body: 'Bu politika zaman zaman güncellenebilir. Güncellemeler bu sayfada yayınlanarak yürürlüğe girer. Önemli değişikliklerde kullanıcılarımız bilgilendirilecektir.' },
    ],
  },
  en: {
    title: 'Privacy & Personal Data Protection Policy',
    lastUpdated: 'Last updated: April 4, 2026',
    sections: [
      { heading: '1. Data Controller', body: 'This website (tabbled.com) is operated by KHP Limited ("Company"). We act as the data controller within the scope of the Turkish Personal Data Protection Law No. 6698 ("KVKK") regarding the protection of your personal data.\n\nContact: info@tabbled.com' },
      { heading: '2. Personal Data Collected', body: 'We may collect the following personal data to provide our services:\n\n• Contact information: Name, surname, email address, phone number\n• Business information: Business name, sector, address\n• Usage data: Page views, click data, session duration (via Google Analytics)\n• Cookie data: Browser information, IP address, device information\n• Demo/contact form data: Information you voluntarily share through forms' },
      { heading: '3. Purposes of Data Processing', body: 'Your personal data is processed for the following purposes:\n\n• Providing digital menu (QR code) services\n• Delivering online marketing support\n• Operating the supplier platform services\n• Evaluating your demo requests and contacting you\n• Improving service quality and user experience\n• Analyzing website performance\n• Fulfilling legal obligations' },
      { heading: '4. Legal Basis for Processing', body: 'Under Article 5 of KVKK, your personal data is processed based on the following legal grounds:\n\n• Your explicit consent (for analytical cookies)\n• Necessity for the performance of a contract\n• Legitimate interests of the data controller\n• Compliance with legal obligations' },
      { heading: '5. Cookie Policy', body: 'The following types of cookies are used on our website:\n\n• Essential cookies: Required for the proper functioning of the site. These cookies cannot be disabled.\n• Analytical cookies: Used to analyze site usage through Google Analytics. These cookies are only activated with your explicit consent.\n\nYou can change your cookie preferences at any time.' },
      { heading: '6. Data Transfers', body: 'Your personal data may be shared with third parties in the following cases:\n\n• Google LLC (Google Analytics — for analytics purposes, US servers)\n• Vercel Inc. (website hosting service)\n• Resend Inc. (email delivery service)\n• Authorized public institutions and organizations when required by law\n\nIn case of data transfer abroad, compliance with the conditions specified in Article 9 of KVKK is ensured.' },
      { heading: '7. Data Retention Period', body: 'Your personal data is retained for the period required by the processing purpose. Contact form data is kept for a maximum of 2 years, and analytical data for 14 months. At the end of the period, data is deleted, destroyed, or anonymized.' },
      { heading: '8. Your Rights (KVKK Article 11)', body: 'Under KVKK, you have the following rights:\n\n• To learn whether your personal data is being processed\n• To request information if your data has been processed\n• To learn the purpose of processing and whether it is used in accordance with its purpose\n• To know the third parties to whom your data is transferred domestically or abroad\n• To request correction of incomplete or inaccurate data\n• To request deletion or destruction under the conditions set out in Article 7 of KVKK\n• To request notification of correction, deletion or destruction operations to third parties to whom data has been transferred\n• To object to the occurrence of a result against you through the analysis of processed data exclusively by automated systems\n• To claim compensation for damages arising from unlawful processing\n\nYou may submit your requests to info@tabbled.com. Your requests will be concluded free of charge within 30 days at the latest.' },
      { heading: '9. Policy Updates', body: 'This policy may be updated from time to time. Updates take effect upon publication on this page. Users will be notified of significant changes.' },
    ],
  },
};

export default function PrivacyPolicy() {
  const [lang, setLang] = useState<'tr' | 'en'>('tr');
  const c = content[lang];
  return (
    <div style={{ minHeight: '100vh', background: '#fafaf9', fontFamily: "'Inter', -apple-system, sans-serif", color: '#1c1917' }}>
      <div style={{ borderBottom: '1px solid #e7e5e4', background: '#fff', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, color: '#1c1917' }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#78716c' }}>←</span>
            <TabbledLogo sizeClass="h-7" href={null} />
          </a>
          <div style={{ display: 'flex', gap: 4, background: '#f5f5f4', borderRadius: 8, padding: 3 }}>
            {(['tr', 'en'] as const).map((l) => (
              <button key={l} onClick={() => setLang(l)} style={{ padding: '6px 14px', fontSize: 13, fontWeight: 600, border: 'none', borderRadius: 6, cursor: 'pointer', transition: 'all 0.2s', background: lang === l ? '#fff' : 'transparent', color: lang === l ? '#1c1917' : '#78716c', boxShadow: lang === l ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>{l.toUpperCase()}</button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 80px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.3, marginBottom: 8, color: '#0c0a09' }}>{c.title}</h1>
        <p style={{ fontSize: 14, color: '#a8a29e', marginBottom: 48 }}>{c.lastUpdated}</p>
        {c.sections.map((section, i) => (
          <div key={i} style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12, color: '#1c1917', letterSpacing: '-0.2px' }}>{section.heading}</h2>
            <div style={{ fontSize: 15, lineHeight: 1.75, color: '#44403c', whiteSpace: 'pre-line' }}>{section.body}</div>
          </div>
        ))}
        <div style={{ marginTop: 48, padding: '20px 24px', background: '#f5f5f4', borderRadius: 12, fontSize: 14, color: '#78716c', lineHeight: 1.6 }}>
          {lang === 'tr' ? 'Bu politika hakkında sorularınız için info@tabbled.com adresinden bize ulaşabilirsiniz.' : 'For questions about this policy, please contact us at info@tabbled.com.'}
        </div>
      </div>
    </div>
  );
}
