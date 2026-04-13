import React, { useState } from "react";
import { RxChevronRight } from "react-icons/rx";

const tabs = [
  {
    label: "Menu islemleri",
    tagline: "Dijital",
    heading: "Icerik uretimini hizlandiran akilli araclar",
    description:
      "Tabbled, restoranlar icin dijital menuyu statik bir liste olmaktan cikarir. Saatlik ogunler, happy hour, zamanli menuler, fiyat varyantlari ve tukendi yonetimi gibi operasyonel detaylari tek panelden kontrol etmenizi saglar. Boylece menunuz guncel kalir, servis daha duzenli ilerler ve misafirler her zaman dogru bilgiye ulasir.",
  },
  {
    label: "AI araclari",
    tagline: "Akilli",
    heading: "QR menu yonetimi, fiyat guncellemeleri ve daha duzenli operasyon",
    description:
      "Tabbled, restoranlar icin dijital menu yonetimini sadelestirir. Kategori duzenleme, urun guncelleme, fiyat varyantlari, zamanli menuler, happy hour, tukendi isareti ve QR menu yayini gibi temel islemleri tek panelden yonetmenizi saglar. Boylece menu degisiklikleri daha hizli yapilir, ekip az zaman kaybeder ve misafirler her zaman guncel menuye ulasir.",
  },
  {
    label: "Misafir katilimi",
    tagline: "Katilim",
    heading: "Garson cagrisi, promosyonlar, geri bildirim",
    description:
      "Tabbled, QR menuyu pasif bir ekran olmaktan cikarir. Garson cagirma, geri bildirim toplama, promosyon gosterimi ve WhatsApp siparis gibi araclarla misafir deneyimini daha etkilesimli hale getirir. Restoranlar icin bu yapi hem servis akisini iyilestirir hem de misafir memnuniyetini daha gorunur hale getirir.",
  },
  {
    label: "Uyum ve dil",
    tagline: "Uyum",
    heading:
      "Cok dilli menu, alerjen bilgisi ve yasal uyuma hazir yayin",
    description:
      "Turistlere hizmet veren veya daha duzenli bir menu altyapisi kurmak isteyen isletmeler icin cok dilli yayin artik onemli bir standart. Tabbled; cok dilli menu yonetimi, alerjen bilgisi, besin degerleri ve baskiya uygun menu ciktisi gibi ozelliklerle restoranlarin hem misafir beklentilerine hem de uyum gereksinimlerine daha rahat cevap vermesini saglar.",
  },
  {
    label: "Gorunurluk",
    tagline: "Buyume",
    heading:
      "Restoran gorunurlugunu artiran SEO ve yorum odakli araclar",
    description:
      "Dijital menu artik sadece masada acilan bir sayfa degil, ayni zamanda restoranin cevrim ici gorunurlugunu destekleyen bir alan. Tabbled, restoran SEO'su, Google yorum yonlendirmeleri, geri bildirim akisi ve arama odakli icerik yapisiyla isletmelerin dijital gorunurlugunu guclendirmesine yardimci olur. Daha iyi gorunurluk, daha guclu guven ve daha yuksek etkilesim anlamina gelir.",
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
            Bes temel alan
          </h1>
          <p className="md:text-md">
            Tabbled, dijital menu yonetiminden misafir etkilesimine kadar
            restoranlarin ihtiyac duydugu temel araclari tek panelde bir araya
            getirir. QR menu, cok dilli yayin, AI destekli icerik, geri bildirim
            ve gorunurluk araclariyla daha duzenli bir operasyon kurmaniza
            yardimci olur.
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
                      href="/menu/demo"
                      className="inline-flex gap-3 items-center justify-center whitespace-nowrap border border-border-primary text-text-primary bg-background-primary px-6 py-3 transition-colors hover:bg-gray-50"
                    >
                      Kesfet
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
                    src="/placeholder-feature.webp"
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
