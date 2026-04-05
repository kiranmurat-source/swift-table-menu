import { CiWifiOn, CiBatteryFull, CiWavePulse1 } from "react-icons/ci";
import { CiForkAndKnife } from "react-icons/ci";

const PhoneMockup = () => (
  <div className="relative">
    <div className="absolute inset-0 bg-gradient-to-br from-grapefruit/20 via-sage/10 to-transparent rounded-full blur-3xl scale-110" />
    
    <div className="relative w-[280px] sm:w-[300px] rounded-[2.5rem] bg-foreground/90 p-[3px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3),0_0_40px_rgba(232,99,122,0.15)]">
      <div className="rounded-[2.3rem] bg-card overflow-hidden">
        <div className="relative h-8 bg-foreground/90 flex items-end justify-center pb-1">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[28px] bg-foreground/90 rounded-b-[18px] flex items-center justify-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-foreground/40" />
            <div className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
          </div>
        </div>
        
        <div className="flex items-center justify-between px-5 py-1.5 bg-grapefruit">
          <span className="text-card text-[10px] font-semibold">9:41</span>
          <div className="flex items-center gap-1">
            <CiWavePulse1 className="w-3 h-3 text-card" />
            <CiWifiOn className="w-3 h-3 text-card" />
            <CiBatteryFull className="w-3.5 h-3.5 text-card" />
          </div>
        </div>

        <div className="bg-grapefruit px-5 pb-4 pt-2">
          <p className="text-card/70 text-[10px] font-medium tracking-wide uppercase">Hoş geldiniz</p>
          <p className="text-card text-lg font-extrabold font-heading mt-0.5">ABC Hotel</p>
          <p className="text-card/60 text-[10px] mt-0.5">Masa 12 · Lobby Restaurant</p>
        </div>

        <div className="px-4 py-3 flex gap-2 overflow-hidden">
          {[
            { label: "Kahvaltı", active: true },
            { label: "Ana Yemek", active: false },
            { label: "İçecek", active: false },
            { label: "Tatlı", active: false },
          ].map((cat) => (
            <span
              key={cat.label}
              className={`text-[11px] font-semibold px-3.5 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                cat.active
                  ? "bg-grapefruit text-card shadow-sm"
                  : "bg-cream text-muted-foreground"
              }`}
            >
              {cat.label}
            </span>
          ))}
        </div>

        <div className="px-4 pb-2 space-y-2.5">
          {[
            { name: "Serpme Kahvaltı", desc: "Peynir, zeytin, bal, kaymak, yumurta", price: "₺280", tag: "Popüler" },
            { name: "Menemen", desc: "Taze domates, biber, yumurta", price: "₺120", tag: null },
            { name: "Eggs Benedict", desc: "Hollandaise sos, pastırma", price: "₺160", tag: null },
          ].map((item) => (
            <div
              key={item.name}
              className="flex items-center gap-3 p-3 rounded-2xl bg-cream/50 border border-border/50 hover:border-sage/30 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-salmon/30 to-gold/20 flex-shrink-0 flex items-center justify-center">
                <CiForkAndKnife className="text-lg" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[13px] font-bold text-foreground truncate">{item.name}</p>
                  {item.tag && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-gold/25 text-foreground flex-shrink-0">
                      {item.tag}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{item.desc}</p>
                <p className="text-[12px] font-bold text-grapefruit mt-0.5">{item.price}</p>
              </div>
              <button className="w-8 h-8 rounded-xl bg-sage/15 flex items-center justify-center text-sage text-base font-bold flex-shrink-0 hover:bg-sage/25 transition-colors">
                +
              </button>
            </div>
          ))}
        </div>

        <div className="px-4 py-3 border-t border-border/60">
          <div className="flex gap-2">
            <div className="flex-1 bg-grapefruit text-card text-center py-2.5 rounded-xl text-[13px] font-bold shadow-sm">
              Garson Çağır
            </div>
            <div className="relative bg-sage text-sage-foreground text-center py-2.5 px-4 rounded-xl text-[13px] font-bold shadow-sm">
              Sepet
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-grapefruit text-card text-[10px] font-bold flex items-center justify-center shadow">
                2
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-center pb-2 pt-1">
          <div className="w-28 h-1 rounded-full bg-foreground/15" />
        </div>
      </div>
    </div>
  </div>
);

export default PhoneMockup;
