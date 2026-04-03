import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import TabbledLogo from "@/components/TabbledLogo";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Özellikler", href: "#ozellikler" },
  { label: "Fiyatlar", href: "#fiyatlar" },
  { label: "Nasıl Çalışır", href: "#nasil-calisir" },
  { label: "Demo", href: "#demo" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "shadow-sm" : ""
      }`}
      style={{ backgroundColor: "rgba(250,250,247,0.85)", backdropFilter: "blur(12px)" }}
    >
      <div className="container mx-auto flex items-center justify-between h-16 px-4 lg:px-8">
        <TabbledLogo />

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={(e) => {
                e.preventDefault();
                document.querySelector(l.href)?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:block">
          <Button variant="hero" size="lg" className="rounded-full px-6">
            Ücretsiz Dene
          </Button>
        </div>

        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menü"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-card border-t border-border px-4 pb-4">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="block py-3 text-sm font-medium text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(false)}
            >
              {l.label}
            </a>
          ))}
          <Button variant="hero" className="w-full mt-2 rounded-full">
            Ücretsiz Dene
          </Button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
