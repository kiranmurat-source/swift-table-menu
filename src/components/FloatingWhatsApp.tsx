import { useEffect, useState } from "react";
import { WhatsappLogo } from "@phosphor-icons/react";

const WA_MESSAGE = "Merhaba, Tabbled dijital menü hakkında bilgi almak istiyorum.";
const WA_URL = `https://wa.me/905325119484?text=${encodeURIComponent(WA_MESSAGE)}`;

const FloatingWhatsApp = () => {
  const [consentGiven, setConsentGiven] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return !!localStorage.getItem("cookie_consent");
  });

  useEffect(() => {
    const onChange = () => setConsentGiven(!!localStorage.getItem("cookie_consent"));
    window.addEventListener("cookie-consent-changed", onChange);
    return () => window.removeEventListener("cookie-consent-changed", onChange);
  }, []);

  // While the cookie banner is visible (consent not yet given), lift the
  // button above the banner so it doesn't overlap the Accept/Reject buttons.
  const bottomClass = consentGiven ? "bottom-6" : "bottom-24";

  return (
    <a
      href={WA_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp ile iletişime geçin"
      className={`fixed ${bottomClass} right-6 z-40 bg-[#25D366] hover:bg-[#20BA5C] text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105`}
    >
      <WhatsappLogo size={28} weight="fill" />
    </a>
  );
};

export default FloatingWhatsApp;
