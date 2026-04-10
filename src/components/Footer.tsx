import TabbledLogo from "@/components/TabbledLogo";
const footerLinks = [
  { label: "Özellikler", href: "#ozellikler" },
  { label: "Fiyatlar", href: "#fiyatlar" },
  { label: "Demo Menü", href: "/menu/abc-restaurant" },
  { label: "Blog", href: "/blog" },
  { label: "Gizlilik Politikası", href: "/privacy" },
  { label: "İletişim", href: "mailto:info@tabbled.com" },
];
const Footer = () => (
  <footer className="border-t border-border py-12">
    <div className="container mx-auto px-4 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <TabbledLogo sizeClass="h-7" />
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {footerLinks.map((l) => (
            <a key={l.label} href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {l.label}
            </a>
          ))}
        </div>
      </div>
      <div className="border-t border-border mt-8 pt-6 text-center">
        <p className="text-xs text-muted-foreground">&copy; 2026 tabbled. Tüm hakları saklıdır.</p>
      </div>
    </div>
  </footer>
);
export default Footer;
