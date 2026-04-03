import ramadaLogo from "@/assets/logos/ramada.svg";
import wyndhamLogo from "@/assets/logos/wyndham.svg";
import novotelLogo from "@/assets/logos/novotel.svg";
import hiltonLogo from "@/assets/logos/hilton.svg";
import holidayInnLogo from "@/assets/logos/holiday-inn.svg";
import bestWesternLogo from "@/assets/logos/best-western.svg";

const brands = [
  { name: "Ramada", logo: ramadaLogo },
  { name: "Wyndham Hotels", logo: wyndhamLogo },
  { name: "Novotel", logo: novotelLogo },
  { name: "Hilton Garden Inn", logo: hiltonLogo },
  { name: "Holiday Inn", logo: holidayInnLogo },
  { name: "Best Western", logo: bestWesternLogo },
];

const LogoBar = () => (
  <section className="border-y border-border py-8 overflow-hidden">
    <div className="flex animate-marquee whitespace-nowrap items-center">
      {[...brands, ...brands].map((b, i) => (
        <img
          key={i}
          src={b.logo}
          alt={b.name}
          className="h-8 w-auto mx-10 opacity-30 grayscale hover:opacity-50 hover:grayscale-0 transition-all duration-300 select-none"
          loading="lazy"
        />
      ))}
    </div>
  </section>
);

export default LogoBar;
