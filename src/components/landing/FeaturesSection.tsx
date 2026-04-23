import React, { useState } from "react";
import { RxChevronRight } from "react-icons/rx";

const tabs = [
  {
    label: "Menü işlemleri",
    tagline: "Dijital",
    heading: "İçerik üretimini hızlandıran akıllı araçlar",
    image: "/feature-1-menu.webp",
    description:
      "Tabbled, restoranlar için dijital menüyü statik bir liste olmaktan çıkarır. Saatlik öğünler, happy hour, zamanlı menüler, fiyat varyantları ve tükendi yönetimi gibi operasyonel detayları tek panelden kontrol etmenizi sağlar. Böylece menünüz güncel kalır, servis daha düzenli ilerler ve misafirler her zaman doğru bilgiye ulaşır.",
  },
  {
    label: "AI araçları",
    tagline: "Akilli",
    heading: "QR menü yönetimi, fiyat güncellemeleri ve daha düzenli operasyon",
    image: "/feature-2-ai.webp",
    description:
      "Tabbled, restoranlar için dijital menü yönetimini sadeleştirir. Kategori düzenleme, ürün güncelleme, fiyat varyantları, zamanlı menüler, happy hour, tükendi işareti ve QR menü yayını gibi temel işlemleri tek panelden yönetmenizi sağlar. Böylece menü değişiklikleri daha hızlı yapılır, ekip az zaman kaybeder ve misafirler her zaman güncel menüye ulaşır.",
  },
  {
    label: "Misafir katılımı",
    tagline: "Katilim",
    heading: "Garson çağrısı, promosyonlar, geri bildirim",
    image: "/feature-3-guest.webp",
    description:
      "Tabbled, QR menüyü pasif bir ekran olmaktan çıkarır. Garson çağırma, geri bildirim toplama, promosyon gösterimi ve WhatsApp sipariş gibi araçlarla misafir deneyimini daha etkileşimli hale getirir. Restoranlar için bu yapı hem servis akışını iyileştirir hem de misafir memnuniyetini daha görünür hale getirir.",
  },
  {
    label: "Uyum ve dil",
    tagline: "Uyum",
    heading:
      "Çok dilli menü, alerjen bilgisi ve yasal uyuma hazır yayın",
    image: "/feature-4-compliance.webp",
    description:
      "Turistlere hizmet veren veya daha düzenli bir menü altyapısı kurmak isteyen işletmeler için çok dilli yayın artık önemli bir standart. Tabbled; çok dilli menü yönetimi, alerjen bilgisi, besin değerleri ve baskıya uygun menü çıktısı gibi özelliklerle restoranların hem misafir beklentilerine hem de uyum gereksinimlerine daha rahat cevap vermesini sağlar.",
  },
  {
    label: "Görünürlük",
    tagline: "Büyüme",
    heading:
      "Restoran görünürlüğünü artıran SEO ve yorum odaklı araçlar",
    image: "/feature-5-visibility.webp",
    description:
      "Dijital menü artık sadece masada açılan bir sayfa değil, aynı zamanda restoranın çevrim içi görünürlüğünü destekleyen bir alan. Tabbled, restoran SEO'su, Google yorum yönlendirmeleri, geri bildirim akışı ve arama odaklı içerik yapısıyla işletmelerin dijital görünürlüğünü güçlendirmesine yardımcı olur. Daha iyi görünürlük, daha güçlü güven ve daha yüksek etkileşim anlamına gelir.",
  },
];

export function FeaturesSection() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section id="ozellikler" className="px-[5%] py-16 md:py-24 lg:py-28">
      <div className="container">
        <div className="mx-auto mb-12 w-full max-w-lg text-center md:mb-18 lg:mb-20">
          <p className="mb-3 font-semibold md:mb-4">Yetenekler</p>
          <h1 className="mb-5 text-5xl font-bold md:mb-6 md:text-7xl lg:text-8xl">
            Beş temel alan
          </h1>
          <p className="md:text-md">
            Tabbled, dijital menü yönetiminden misafir etkileşimine kadar
            restoranların ihtiyaç duyduğu temel araçları tek panelde bir araya
            getirir. QR menü, çok dilli yayın, AI destekli içerik, geri bildirim
            ve görünürlük araçlarıyla daha düzenli bir operasyon kurmanıza
            yardımcı olur.
          </p>
        </div>
        <div className="relative grid auto-cols-fr grid-cols-1 gap-x-12 border border-border-primary lg:gap-x-0">
          <div className="flex flex-col md:flex-row">
            {tabs.map((tab, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setActiveTab(index)}
                className={`flex w-full items-start justify-start gap-4 whitespace-normal border-0 border-b border-border-primary p-6 text-md font-bold leading-[1.4] transition-all duration-0 md:items-center md:justify-center md:border-r md:px-8 md:py-6 md:text-xl md:last-of-type:border-r-0 ${
                  activeTab === index
                    ? "bg-background-primary text-text-primary md:[border-bottom:1px_solid_#fff]"
                    : "bg-background-primary text-text-primary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {tabs.map((tab, index) => (
            <div
              key={index}
              className={activeTab === index ? "animate-tabs" : "hidden"}
            >
              <div className="grid grid-cols-1 gap-y-12 p-6 md:grid-cols-2 md:items-center md:gap-x-12 md:p-8 lg:gap-x-20 lg:p-12">
                <div>
                  <p className="mb-3 font-semibold md:mb-4">{tab.tagline}</p>
                  <h2 className="rb-5 mb-5 text-4xl font-bold leading-[1.2] md:mb-6 md:text-5xl lg:text-6xl">
                    {tab.heading}
                  </h2>
                  <p>{tab.description}</p>
                  <div className="mt-6 flex flex-wrap items-center gap-4 md:mt-8">
                    <a
                      href="/menu/ramada-encore-bayrampasa"
                      className="inline-flex gap-3 items-center justify-center whitespace-nowrap border border-border-primary text-text-primary bg-background-primary px-6 py-3 transition-colors hover:bg-gray-50"
                    >
                      Keşfet
                    </a>
                    <a
                      href="#ozellikler"
                      className="inline-flex items-center justify-center whitespace-nowrap border-0 text-text-primary gap-2 p-0 transition-colors"
                    >
                      Daha fazla
                      <RxChevronRight />
                    </a>
                  </div>
                </div>
                <div>
                  <img
                    src={tab.image}
                    className="w-full object-cover"
                    alt={tab.heading}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
