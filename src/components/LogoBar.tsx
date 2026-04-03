const brands = [
  "Ramada Encore", "Wyndham Hotels", "Novotel", "ibis Hotels",
  "Hilton Garden Inn", "Radisson Blu", "Best Western", "Holiday Inn",
];

const LogoBar = () => (
  <section className="border-y border-border py-6 overflow-hidden">
    <div className="flex animate-marquee whitespace-nowrap">
      {[...brands, ...brands].map((b, i) => (
        <span
          key={i}
          className="mx-8 text-lg font-heading font-bold text-muted-foreground/40 select-none"
        >
          {b}
        </span>
      ))}
    </div>
  </section>
);

export default LogoBar;
