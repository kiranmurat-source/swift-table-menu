import { useEffect, useState, type FormEvent } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";
import { CheckCircle, WhatsappLogo } from "@phosphor-icons/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";

const PLAN_LABELS: Record<string, string> = {
  basic: "Basic",
  premium: "Premium",
  enterprise: "Enterprise",
};

const WA_URL = `https://wa.me/905325119484?text=${encodeURIComponent(
  "Merhaba, Tabbled dijital menü hakkında bilgi almak istiyorum."
)}`;

type FormState = {
  name: string;
  restaurant: string;
  phone: string;
  email: string;
  message: string;
  company: string; // honeypot
};

const EMPTY: FormState = { name: "", restaurant: "", phone: "", email: "", message: "", company: "" };

export default function Contact() {
  const [searchParams] = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("selected_plan");
      if (stored && PLAN_LABELS[stored]) {
        setSelectedPlan(stored);
        sessionStorage.removeItem("selected_plan");
        return;
      }
    } catch {}
    const planParam = (searchParams.get("plan") || "").toLowerCase();
    if (PLAN_LABELS[planParam]) {
      setSelectedPlan(planParam);
    }
  }, [searchParams]);

  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.company) return; // honeypot tripped
    if (form.name.trim().length < 2) return setError("Lütfen isminizi girin.");
    if (form.restaurant.trim().length < 2) return setError("Lütfen restoran/işletme adını girin.");
    const phoneDigits = form.phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) return setError("Geçerli bir telefon numarası girin.");
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) return setError("Geçerli bir e-posta girin.");

    setSubmitting(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("contact-form", {
        body: {
          name: form.name.trim(),
          restaurant: form.restaurant.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
          message: form.message.trim() || undefined,
          selectedPlan: selectedPlan || undefined,
        },
      });
      if (fnError) throw new Error(fnError.message || "Mesaj gönderilemedi.");
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu. Lütfen WhatsApp ile ulaşın.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Roboto', sans-serif" }}>
      <Helmet>
        <title>İletişim — Tabbled | 14 Gün Ücretsiz Deneyin</title>
        <meta
          name="description"
          content="Tabbled dijital menü platformunu 14 gün ücretsiz deneyin. Hemen iletişime geçin — kredi kartı gerekmez, 2 dakikada kurulum."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://tabbled.com/iletisim" />
      </Helmet>

      <Navbar />

      <main className="pt-28 pb-20">
        <div className="container mx-auto px-4 lg:px-8 max-w-2xl">
          <div className="text-center mb-10">
            {selectedPlan && (
              <div className="inline-flex items-center gap-2 bg-[#FF4F7A]/10 text-[#FF4F7A] px-4 py-2 rounded-full text-sm font-semibold mb-5">
                <CheckCircle size={16} weight="bold" />
                {PLAN_LABELS[selectedPlan]} planı seçtiniz
              </div>
            )}
            <h1 className="text-3xl sm:text-5xl font-extrabold mb-4" style={{ color: "#1C1C1E", letterSpacing: "-0.02em" }}>
              14 Gün Ücretsiz Deneyin
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Dijital menünüzü bugün oluşturmaya başlayın. Kredi kartı gerekmez, 2 dakikada kurulum.
            </p>
          </div>

          <div
            className="rounded-2xl p-6 sm:p-10"
            style={{ backgroundColor: "#fff", border: "1px solid #E5E5E3", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
          >
            {submitted ? (
              <div className="text-center py-8">
                <div className="mx-auto mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-[#FF4F7A]/10">
                  <CheckCircle size={40} weight="fill" style={{ color: "#FF4F7A" }} />
                </div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: "#1C1C1E" }}>
                  Talebiniz Alındı!
                </h2>
                <p className="text-muted-foreground mb-6">En kısa sürede sizinle iletişime geçeceğiz.</p>
                <a href="/menu/ramada-encore-bayrampasa" className="text-[#FF4F7A] font-semibold underline underline-offset-4">
                  Demo menüyü inceleyin →
                </a>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4" noValidate>
                {/* Honeypot */}
                <input
                  type="text"
                  name="company"
                  value={form.company}
                  onChange={update("company")}
                  tabIndex={-1}
                  autoComplete="off"
                  style={{ position: "absolute", left: "-9999px", height: 0, width: 0, opacity: 0 }}
                  aria-hidden="true"
                />

                <Field label="İsim Soyisim" required>
                  <input
                    type="text"
                    value={form.name}
                    onChange={update("name")}
                    required
                    className="form-input"
                    placeholder="Örn. Ahmet Yılmaz"
                  />
                </Field>

                <Field label="Restoran / İşletme Adı" required>
                  <input
                    type="text"
                    value={form.restaurant}
                    onChange={update("restaurant")}
                    required
                    className="form-input"
                    placeholder="Örn. Lezzet Restoran"
                  />
                </Field>

                <Field label="Telefon Numarası" required>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={update("phone")}
                    required
                    className="form-input"
                    placeholder="05xx xxx xx xx"
                  />
                </Field>

                <Field label="E-posta (opsiyonel)">
                  <input
                    type="email"
                    value={form.email}
                    onChange={update("email")}
                    className="form-input"
                    placeholder="ornek@restoran.com"
                  />
                </Field>

                <Field label="Mesajınız (opsiyonel)">
                  <textarea
                    value={form.message}
                    onChange={update("message")}
                    rows={4}
                    maxLength={500}
                    className="form-input resize-none"
                    placeholder="Kaç şubeniz var? Hangi özellikler önemli? Size nasıl yardımcı olabiliriz?"
                  />
                </Field>

                {error && (
                  <div className="text-sm text-[#E8456E] bg-[#FFF0F3] rounded-lg p-3">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-full font-semibold text-white transition-all hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#FF4F7A" }}
                >
                  {submitting ? "Gönderiliyor..." : "14 Gün Ücretsiz Başla"}
                </button>

                <div className="text-center pt-4 border-t border-[#E5E5E3] mt-6">
                  <p className="text-xs text-muted-foreground mb-3">veya WhatsApp ile ulaşın:</p>
                  <a
                    href={WA_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-white"
                    style={{ backgroundColor: "#25D366" }}
                  >
                    <WhatsappLogo size={18} weight="fill" /> WhatsApp ile İletişim
                  </a>
                </div>
              </form>
            )}
          </div>

          <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <li>✓ Kredi kartı gerekmez</li>
            <li>✓ 2 dakikada kurulum</li>
            <li>✓ Basic plan özellikleri açık</li>
            <li>✓ İstediğiniz zaman iptal</li>
          </ul>
        </div>
      </main>

      <Footer />

      <style>{`
        .form-input {
          width: 100%;
          padding: 12px 14px;
          border: 1px solid #E5E5E3;
          border-radius: 10px;
          font-size: 15px;
          background: #F7F7F5;
          color: #1C1C1E;
          outline: none;
          transition: border-color 0.15s, background 0.15s;
          font-family: inherit;
        }
        .form-input:focus {
          border-color: #FF4F7A;
          background: #fff;
        }
      `}</style>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1.5" style={{ color: "#2D2D2F" }}>
        {label} {required && <span style={{ color: "#FF4F7A" }}>*</span>}
      </span>
      {children}
    </label>
  );
}
