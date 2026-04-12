import TabbledLogo from "@/components/TabbledLogo";
import { InstagramLogo, WhatsappLogo, XLogo } from "@phosphor-icons/react";

const productLinks = [
  { label: "Dijital Menü", href: "#ozellikler" },
  { label: "Online Sipariş", href: "#ozellikler" },
  { label: "AI Çeviri", href: "#ozellikler" },
  { label: "Analitik", href: "#ozellikler" },
];

const companyLinks = [
  { label: "Hakkımızda", href: "#" },
  { label: "Blog", href: "/blog" },
  { label: "İletişim", href: "/iletisim" },
];

const legalLinks = [
  { label: "Gizlilik Politikası", href: "/privacy" },
  { label: "KVKK", href: "/privacy" },
  { label: "Kullanım Koşulları", href: "/privacy" },
];

const Footer = () => (
  <footer className="bg-[#F7F7F8] py-12">
    <div className="max-w-7xl mx-auto px-4 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
        {/* Column 1: Logo + description + social */}
        <div>
          <TabbledLogo sizeClass="h-7" />
          <p className="text-sm text-[#6B7280] mt-4 leading-relaxed">
            Restoranlar için AI destekli dijital menü platformu. 34 dilde menü, garson çağırma, anlık güncelleme.
          </p>
          <div className="flex gap-3 mt-4">
            <a href="#" className="text-[#9CA3AF] hover:text-[#FF4F7A] transition-colors" aria-label="Instagram">
              <InstagramLogo size={20} weight="thin" />
            </a>
            <a href="#" className="text-[#9CA3AF] hover:text-[#FF4F7A] transition-colors" aria-label="X">
              <XLogo size={20} weight="thin" />
            </a>
            <a href="#" className="text-[#9CA3AF] hover:text-[#FF4F7A] transition-colors" aria-label="WhatsApp">
              <WhatsappLogo size={20} weight="thin" />
            </a>
          </div>
        </div>

        {/* Column 2: Products */}
        <div>
          <h4 className="text-sm font-bold text-[#1C1C1E] mb-4">Ürünler</h4>
          <ul className="space-y-2">
            {productLinks.map((l) => (
              <li key={l.label}>
                <a href={l.href} className="text-sm text-[#6B7280] hover:text-[#FF4F7A] transition-colors">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: Company */}
        <div>
          <h4 className="text-sm font-bold text-[#1C1C1E] mb-4">Şirket</h4>
          <ul className="space-y-2">
            {companyLinks.map((l) => (
              <li key={l.label}>
                <a href={l.href} className="text-sm text-[#6B7280] hover:text-[#FF4F7A] transition-colors">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 4: Legal */}
        <div>
          <h4 className="text-sm font-bold text-[#1C1C1E] mb-4">Yasal</h4>
          <ul className="space-y-2">
            {legalLinks.map((l) => (
              <li key={l.label}>
                <a href={l.href} className="text-sm text-[#6B7280] hover:text-[#FF4F7A] transition-colors">
                  {l.label}
                </a>
              </li>
            ))}
            <li>
              <a href="mailto:info@tabbled.com" className="text-sm text-[#6B7280] hover:text-[#FF4F7A] transition-colors">
                info@tabbled.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[#E5E7EB] pt-6 text-center">
        <p className="text-xs text-[#9CA3AF]">&copy; 2026 KHP Limited. Tüm hakları saklıdır.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
