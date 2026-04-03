import { Building2, Hotel, Star, Gem, Crown, Castle, Landmark, Shield } from "lucide-react";

const brands = [
  { name: "Ramada Encore", icon: Crown },
  { name: "Wyndham Hotels", icon: Shield },
  { name: "Novotel", icon: Star },
  { name: "ibis Hotels", icon: Gem },
  { name: "Hilton Garden Inn", icon: Hotel },
  { name: "Radisson Blu", icon: Building2 },
  { name: "Best Western", icon: Castle },
  { name: "Holiday Inn", icon: Landmark },
];

const BrandItem = ({ name, icon: Icon }: { name: string; icon: typeof Crown }) => (
  <div className="flex items-center gap-2.5 mx-8 select-none opacity-30 grayscale">
    <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
    <span className="text-base font-heading font-bold tracking-tight whitespace-nowrap">{name}</span>
  </div>
);

const LogoBar = () => (
  <section className="border-y border-border py-7 overflow-hidden">
    <div className="flex animate-marquee whitespace-nowrap">
      {[...brands, ...brands].map((b, i) => (
        <BrandItem key={i} name={b.name} icon={b.icon} />
      ))}
    </div>
  </section>
);

export default LogoBar;
