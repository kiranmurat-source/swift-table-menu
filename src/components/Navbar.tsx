import { useState, useEffect } from "react";
import TabbledLogo from "@/components/TabbledLogo";
import { List, X } from "@phosphor-icons/react";

const navLinks = [
  { label: "Özellikler", href: "#ozellikler" },
  { label: "Nasıl Çalışır", href: "#nasil-calisir" },
  { label: "Fiyatlandırma", href: "#fiyatlandirma" },
  { label: "SSS", href: "#sss" },
];

const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

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
      style={{
        backgroundColor: "rgba(255,255,255,0.80)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 lg:px-8">
        <TabbledLogo logoType="horizontal" sizeClass="h-8" />

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <button
              key={l.href}
              onClick={() => scrollTo(l.href.slice(1))}
              className="text-sm font-medium text-[#6B7280] hover:text-[#FF4F7A] transition-colors"
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="hidden md:block">
          <a
            href="/iletisim"
            className="inline-block text-white text-sm font-bold px-6 py-2.5 rounded-lg hover:opacity-90 hover:scale-105 active:scale-95 transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, #FF4F7A, #FF7B9C)",
              boxShadow: "0 4px 14px rgba(255, 79, 122, 0.25)",
            }}
          >
            14 Gün Ücretsiz Deneyin
          </a>
        </div>

        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menü"
        >
          {mobileOpen ? (
            <X size={24} weight="thin" className="text-[#1C1C1E]" />
          ) : (
            <List size={24} weight="thin" className="text-[#1C1C1E]" />
          )}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-[#E5E7EB] px-4 pb-4">
          {navLinks.map((l) => (
            <button
              key={l.href}
              className="block w-full text-left py-3 text-sm font-medium text-[#6B7280] hover:text-[#FF4F7A]"
              onClick={() => {
                setMobileOpen(false);
                scrollTo(l.href.slice(1));
              }}
            >
              {l.label}
            </button>
          ))}
          <a
            href="/iletisim"
            className="block w-full text-center text-white text-sm font-bold px-6 py-2.5 rounded-lg mt-2"
            style={{
              background: "linear-gradient(135deg, #FF4F7A, #FF7B9C)",
              boxShadow: "0 4px 14px rgba(255, 79, 122, 0.25)",
            }}
          >
            14 Gün Ücretsiz Deneyin
          </a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
