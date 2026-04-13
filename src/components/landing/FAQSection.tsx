import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
} from "@relume_io/relume-ui";
import React from "react";
import { RxPlus } from "react-icons/rx";

export function FAQSection() {
  return (
    <section id="sss" className="px-[5%] py-16 md:py-24 lg:py-28">
      <div className="container">
        <div className="rb-12 mb-12 max-w-lg md:mb-18 lg:mb-20">
          <h2 className="rb-5 mb-5 text-5xl font-bold md:mb-6 md:text-7xl lg:text-8xl">
            Sık sorulan sorular
          </h2>
          <p className="md:text-md">
            Tabbled'i kurmak ve kullanmak hakkında bilmeniz gereken her şey.
          </p>
        </div>
        <Accordion
          type="multiple"
          className="grid items-start justify-stretch gap-4"
        >
          <AccordionItem
            value="item-0"
            className="border border-border-primary px-5 md:px-6"
          >
            <AccordionTrigger
              icon={
                <RxPlus className="size-7 shrink-0 text-text-primary transition-transform duration-300 md:size-8" />
              }
              className="md:py-5 md:text-md [&[data-state=open]>svg]:rotate-45"
            >
              Tabbled'i kurmak ne kadar sürer?
            </AccordionTrigger>
            <AccordionContent className="md:pb-6">
              Çoğu işletme 15 dakika içinde başlar. Menünüzü yükleyin, QR
              kodunuzu oluşturun ve masalara yerleştirin. Hiçbir teknik bilgi
              gerekli değildir.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem
            value="item-1"
            className="border border-border-primary px-5 md:px-6"
          >
            <AccordionTrigger
              icon={
                <RxPlus className="size-7 shrink-0 text-text-primary transition-transform duration-300 md:size-8" />
              }
              className="md:py-5 md:text-md [&[data-state=open]>svg]:rotate-45"
            >
              Menüyü ne sıklıkta güncelleyebilirim?
            </AccordionTrigger>
            <AccordionContent className="md:pb-6">
              İstediğiniz zaman. Fiyatları değiştirin, öğeleri ekleyin veya
              kaldırın, açıklamaları düzenleyin. Değişiklikler anında yayınlanır
              ve tüm cihazlara senkronize olur.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem
            value="item-2"
            className="border border-border-primary px-5 md:px-6"
          >
            <AccordionTrigger
              icon={
                <RxPlus className="size-7 shrink-0 text-text-primary transition-transform duration-300 md:size-8" />
              }
              className="md:py-5 md:text-md [&[data-state=open]>svg]:rotate-45"
            >
              Kaç dili destekliyor?
            </AccordionTrigger>
            <AccordionContent className="md:pb-6">
              Tabbled tüm planlarda 34 dile kadar destek sunar. Google Translate API ile otomatik çeviri yapılır. Türkçe, İngilizce, Arapça, Almanca, Fransızca, Rusça, Çince ve daha fazlası dahildir.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem
            value="item-3"
            className="border border-border-primary px-5 md:px-6"
          >
            <AccordionTrigger
              icon={
                <RxPlus className="size-7 shrink-0 text-text-primary transition-transform duration-300 md:size-8" />
              }
              className="md:py-5 md:text-md [&[data-state=open]>svg]:rotate-45"
            >
              Alerjen ve besin bilgisi nasıl yönetiliyor?
            </AccordionTrigger>
            <AccordionContent className="md:pb-6">
              Tabbled, 14 AB zorunlu alerjen ve 4 diyet tercihini (vejetaryen, vegan, helal, koşer) destekler. Her ürün için besin değerleri tablosu ekleyebilir ve bunları menüde gösterebilirsiniz. Yasal uyum otomatik olarak sağlanır.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem
            value="item-4"
            className="border border-border-primary px-5 md:px-6"
          >
            <AccordionTrigger
              icon={
                <RxPlus className="size-7 shrink-0 text-text-primary transition-transform duration-300 md:size-8" />
              }
              className="md:py-5 md:text-md [&[data-state=open]>svg]:rotate-45"
            >
              Destek nasıl çalışır?
            </AccordionTrigger>
            <AccordionContent className="md:pb-6">
              Tüm planlar e-posta ve WhatsApp desteğine sahiptir. Enterprise müşteriler adanmış bir hesap yöneticisi alır. Canlı demo ve kurulum desteği ücretsizdir.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <div className="mt-12 md:mt-18 lg:mt-20">
          <h4 className="mb-3 text-2xl font-bold md:mb-4 md:text-3xl md:leading-[1.3] lg:text-4xl">
            Demo menüyü görebilir miyim?
          </h4>
          <p className="md:text-md">
            Evet. Aşağıda demo QR koduna tıklayın veya canlı bir örneği görmek
            için bize ulaşın. Hiçbir kayıt gerekli değildir.
          </p>
          <div className="mt-6 md:mt-8">
            <Button title="Hangi plan benim için uygun?" variant="secondary">
              Hangi plan benim için uygun?
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
