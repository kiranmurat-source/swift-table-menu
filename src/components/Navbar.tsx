import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import TabbledLogo from "@/components/TabbledLogo";
import { CiMenuBurger, CiCircleRemove } from "react-icons/ci";

const navLinks = [
  { label: "Özellikler", href: "#ozellikler" },
  { label: "Fiyatlar", href: "#fiyatlar" },
  { label: "Nasıl Çalışır", href: "#nasil-calisir" },
  { label: "Blog", href: "/blog" },
  { label: "Demo", href: "/menu/abc-restaurant" },
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
        <TabbledLogo logoType="horizontal" sizeClass="h-8" />

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={(e) => {
                if (l.href.startsWith('#')) {
                  e.preventDefault();
                  document.querySelector(l.href)?.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:block">
          <a href="/menu/abc-restaurant">
            <Button variant="hero" size="lg" className="rounded-full px-6">
              Demo Gör
            </Button>
          </a>
        </div>

        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menü"
        >
          {mobileOpen ? <CiCircleRemove className="w-6 h-6" /> : <CiMenuBurger className="w-6 h-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-card border-t border-border px-4 pb-4">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="block py-3 text-sm font-medium text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                if (l.href.startsWith('#')) {
                  e.preventDefault();
                  setMobileOpen(false);
                  document.querySelector(l.href)?.scrollIntoView({ behavior: "smooth" });
                } else {
                  setMobileOpen(false);
                }
              }}
            >
              {l.label}
            </a>
          ))}
          <a href="/menu/abc-restaurant">
            <Button variant="hero" className="w-full mt-2 rounded-full">
              Demo Gör
            </Button>
          </a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
