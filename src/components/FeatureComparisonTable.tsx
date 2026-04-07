import { CiCircleCheck, CiCircleRemove } from "react-icons/ci";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

type FeatureValue = boolean | string;
type Feature = { name: string; basic: FeatureValue; pro: FeatureValue; premium: FeatureValue };
type Category = { name: string; features: Feature[] };

const matrix: Category[] = [
  {
    name: "Menü",
    features: [
      { name: "QR Menü", basic: true, pro: true, premium: true },
      { name: "Alerjen / kalori bilgisi", basic: true, pro: true, premium: true },
      { name: "QR kod özelleştirme (logo, renk)", basic: true, pro: true, premium: true },
      { name: "İşletme künyesi (sosyal medya)", basic: true, pro: true, premium: true },
      { name: "Çok dilli menü", basic: false, pro: "2 dil", premium: "4 dil" },
      { name: "Happy hour / zamanlı fiyat", basic: false, pro: true, premium: true },
      { name: "Tablet menü", basic: false, pro: "3 tablet", premium: "5 tablet" },
      { name: "86'd tükendi güncelleme", basic: false, pro: true, premium: true },
      { name: "Zamanlı menüler (kahvaltı/öğle/akşam)", basic: false, pro: false, premium: true },
    ],
  },
  {
    name: "AI Araçları",
    features: [
      { name: "AI menü açıklaması yazıcı (TR+EN)", basic: false, pro: true, premium: true },
    ],
  },
  {
    name: "Sipariş & Servis",
    features: [
      { name: "Garson çağırma", basic: false, pro: true, premium: true },
      { name: "WhatsApp sipariş", basic: false, pro: true, premium: true },
      { name: "Online sipariş", basic: false, pro: false, premium: true },
      { name: "Masa rezervasyonu", basic: false, pro: false, premium: true },
      { name: "Masadan ödeme (QR)", basic: false, pro: false, premium: true },
      { name: "Dijital bahşiş", basic: false, pro: false, premium: true },
      { name: "Grup ödeme", basic: false, pro: false, premium: true },
      { name: "Komisyonsuz kendi teslimat", basic: false, pro: false, premium: true },
      { name: "Bekleme süresi tahmini", basic: false, pro: false, premium: true },
      { name: "POS entegrasyonu", basic: false, pro: false, premium: true },
    ],
  },
  {
    name: "Müşteri Deneyimi",
    features: [
      { name: "Favori kaydetme", basic: false, pro: false, premium: true },
      { name: "Geçen siparişiniz önerisi", basic: false, pro: false, premium: true },
      { name: "Doğum günü otomatik kampanya", basic: false, pro: false, premium: true },
      { name: "Social Login (Google/Facebook)", basic: false, pro: false, premium: true },
    ],
  },
  {
    name: "Pazarlama & Sosyal",
    features: [
      { name: "Lokal SEO desteği", basic: false, pro: true, premium: true },
      { name: "Google Reviews yönlendirme", basic: false, pro: true, premium: true },
      { name: "Geri bildirim formu", basic: false, pro: true, premium: true },
      { name: "SMS / WhatsApp marketing", basic: false, pro: false, premium: true },
      { name: "Instagram story menü paylaşımı", basic: false, pro: false, premium: true },
      { name: "Arkadaşına öner (WhatsApp)", basic: false, pro: false, premium: true },
      { name: "Influencer tracking", basic: false, pro: false, premium: true },
      { name: "Sadakat programı (stamp kartı)", basic: false, pro: false, premium: true },
      { name: "Gift voucher / hediye kartı", basic: false, pro: false, premium: true },
      { name: "Kampanya yönetimi", basic: false, pro: false, premium: true },
    ],
  },
  {
    name: "Yönetim",
    features: [
      { name: "Analitik / raporlama", basic: false, pro: false, premium: true },
      { name: "Çoklu şube yönetimi", basic: false, pro: false, premium: true },
      { name: "Öncelikli destek", basic: false, pro: false, premium: true },
      { name: "Maks kullanıcı", basic: "1", pro: "3", premium: "5" },
      { name: "Maks şube", basic: "1", pro: "1", premium: "5" },
    ],
  },
];

function CellValue({ value, highlight }: { value: FeatureValue; highlight?: boolean }) {
  if (value === true)
    return <CiCircleCheck className="w-5 h-5 mx-auto text-emerald-600" strokeWidth={1.5} />;
  if (value === false)
    return <CiCircleRemove className="w-5 h-5 mx-auto text-slate-400" strokeWidth={1.5} />;
  return (
    <span className={`text-xs font-semibold ${highlight ? "text-emerald-700" : "text-slate-800"}`}>
      {value}
    </span>
  );
}

const FeatureComparisonTable = () => {
  const ref = useScrollReveal();

  return (
    <section className="pb-20 lg:pb-28">
      <div ref={ref} className="container mx-auto px-4 lg:px-8 section-fade-in">
        <div className="text-center mb-10">
          <h3 className="text-2xl sm:text-3xl font-extrabold mb-2">Tüm özellikler, plan bazında</h3>
          <p className="text-muted-foreground text-sm">39 özellik — 6 kategori</p>
        </div>

        <div className="max-w-4xl mx-auto overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left py-3 px-3 font-bold text-foreground min-w-[200px]">Özellik</th>
                <th className="text-center py-3 px-2 font-bold text-foreground w-[90px]">Basic</th>
                <th className="text-center py-3 px-2 font-bold w-[90px]">
                  <span className="inline-block bg-grapefruit text-card text-xs font-bold px-2.5 py-0.5 rounded-full">Pro</span>
                </th>
                <th className="text-center py-3 px-2 font-bold text-foreground w-[90px]">Premium</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((cat) => (
                <>
                  <tr key={`cat-${cat.name}`}>
                    <td
                      colSpan={4}
                      className="pt-5 pb-2 px-3 text-xs font-extrabold text-slate-900 uppercase tracking-wider border-t border-border"
                    >
                      {cat.name}
                    </td>
                  </tr>
                  {cat.features.map((feat) => (
                    <tr key={feat.name} className="border-b border-border/50 hover:bg-cream/50 transition-colors">
                      <td className="py-2.5 px-3 text-slate-800 font-medium">{feat.name}</td>
                      <td className="py-2.5 px-2 text-center"><CellValue value={feat.basic} /></td>
                      <td className="py-2.5 px-2 text-center bg-grapefruit/[0.03]"><CellValue value={feat.pro} highlight /></td>
                      <td className="py-2.5 px-2 text-center"><CellValue value={feat.premium} /></td>
                    </tr>
                  ))}
                </>
              ))}
              <tr className="border-t-2 border-border">
                <td className="py-3 px-3 font-bold text-foreground">Fiyat (aylık)</td>
                <td className="py-3 px-2 text-center font-extrabold text-foreground">₺300</td>
                <td className="py-3 px-2 text-center font-extrabold text-grapefruit bg-grapefruit/[0.03]">₺600</td>
                <td className="py-3 px-2 text-center font-extrabold text-foreground">₺1.200</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-muted-foreground text-xs">Fiyat (yıllık)</td>
                <td className="py-2 px-2 text-center text-muted-foreground text-xs">₺3.600</td>
                <td className="py-2 px-2 text-center text-muted-foreground text-xs bg-grapefruit/[0.03]">₺7.200</td>
                <td className="py-2 px-2 text-center text-muted-foreground text-xs">₺14.400</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default FeatureComparisonTable;
