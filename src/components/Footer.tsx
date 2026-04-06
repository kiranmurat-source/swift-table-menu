import TabbledLogo from "@/components/TabbledLogo";

const footerLinks = [
  { label: "Özellikler", href: "#ozellikler" },
  { label: "Fiyatlar", href: "#fiyatlar" },
  { label: "Demo Menü", href: "/menu/abc-restaurant" },
  { label: "Gizlilik Politikası", href: "/privacy" },
  { label: "İletişim", href: "mailto:info@tabbled.com" },
];

const Footer = () => (
  <footer className="border-t border-border py-12">
    <div className="container mx-auto px-4 lg:px-8">
      <div className="grid md:grid-cols-3 gap-8 items-center">
        <div>
          <TabbledLogo />
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {footerLinks.map((l) => (
            <a key={l.label} href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex gap-4 md:justify-end">
          {/* Simple social icons as text links */}
          {["LinkedIn", "Instagram", "X"].map((s) => (
            <a key={s} href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {s}
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
