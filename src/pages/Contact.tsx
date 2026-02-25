import { Mail, MessageSquare, Clock, Send, ArrowRight, Phone } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { RevealOnScroll } from "../components/common/RevealOnScroll";

const WHATSAPP_NUMBER = "493022334467";

export default function Contact() {
  const { language } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/submit-contact-form`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit contact form");
      }

      setSubmitted(true);
      setTimeout(() => {
        setFormData({ name: "", email: "", subject: "", message: "" });
        setSubmitted(false);
      }, 5000);
    } catch (err) {
      console.error("Error submitting contact form:", err);
      setError(
        language === "de"
          ? "Es gab einen Fehler beim Senden Ihrer Nachricht. Bitte versuchen Sie es später erneut."
          : "There was an error sending your message. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const contactMethods = [
    {
      icon: Mail,
      title: "E-Mail",
      description:
        language === "de"
          ? "Schreiben Sie uns eine E-Mail"
          : "Send us an email",
      detail: "hallo@rentab.ly",
      href: "mailto:hallo@rentab.ly",
      color: "#3c8af7",
    },
    {
      icon: Phone,
      title: "WhatsApp",
      description:
        language === "de"
          ? "Schreiben Sie uns per WhatsApp"
          : "Message us on WhatsApp",
      detail:
        language === "de"
          ? "Chat starten"
          : "Start chat",
      href: `https://wa.me/${WHATSAPP_NUMBER}`,
      color: "#25D366",
    },
    {
      icon: Clock,
      title: language === "de" ? "Erreichbarkeit" : "Availability",
      description:
        language === "de"
          ? "Unser Support-Team ist für Sie da"
          : "Our support team is available",
      detail:
        language === "de"
          ? "Mo - Fr, 9:00 - 18:00 Uhr"
          : "Mon - Fri, 9:00 AM - 6:00 PM",
      href: undefined,
      color: "#f59e0b",
    },
  ];

  return (
    <div>
      <section className="pt-24 pb-16 sm:pt-32 sm:pb-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <RevealOnScroll>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#3c8af7]/5 border border-[#3c8af7]/15 mb-6">
              <MessageSquare className="w-3.5 h-3.5 text-[#3c8af7]" />
              <span className="text-sm font-medium text-[#3c8af7]">
                {language === "de" ? "Wir sind für Sie da" : "We're here for you"}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight">
              {language === "de" ? (
                <>
                  Sprechen Sie{" "}
                  <span className="text-[#3c8af7]">mit uns</span>
                </>
              ) : (
                <>
                  Get in{" "}
                  <span className="text-[#3c8af7]">touch</span>
                </>
              )}
            </h1>
            <p className="mt-6 text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
              {language === "de"
                ? "Haben Sie Fragen, Anregungen oder benötigen Hilfe? Wir freuen uns auf Ihre Nachricht und antworten in der Regel innerhalb weniger Stunden."
                : "Have questions, suggestions or need help? We look forward to your message and typically respond within a few hours."}
            </p>
          </RevealOnScroll>
        </div>
      </section>

      <section className="pb-16 px-6">
        <div className="max-w-[1000px] mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {contactMethods.map((method, i) => (
              <RevealOnScroll key={method.title} delay={i * 80}>
                {method.href ? (
                  <a
                    href={method.href}
                    target={method.href.startsWith("https") ? "_blank" : undefined}
                    rel={method.href.startsWith("https") ? "noopener noreferrer" : undefined}
                    className="group block border border-gray-200 rounded-2xl p-6 hover:border-gray-300 hover:shadow-lg hover:shadow-gray-900/[0.04] transition-all duration-200"
                  >
                    <ContactCard method={method} />
                  </a>
                ) : (
                  <div className="border border-gray-200 rounded-2xl p-6">
                    <ContactCard method={method} />
                  </div>
                )}
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 px-6 bg-gray-50">
        <div className="max-w-[680px] mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                {language === "de" ? "Kontaktformular" : "Contact Form"}
              </h2>
              <p className="mt-3 text-gray-500">
                {language === "de"
                  ? "Beschreiben Sie Ihr Anliegen und wir melden uns schnellstmöglich."
                  : "Describe your request and we'll get back to you as soon as possible."}
              </p>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={80}>
            <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-8 md:p-10">
              {submitted && (
                <div className="mb-6 flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Send className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-emerald-800 text-sm">
                      {language === "de" ? "Nachricht gesendet" : "Message sent"}
                    </p>
                    <p className="text-emerald-700 text-sm mt-0.5">
                      {language === "de"
                        ? "Vielen Dank! Wir werden uns so schnell wie möglich bei Ihnen melden."
                        : "Thank you! We will get back to you as soon as possible."}
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {language === "de" ? "Name" : "Name"}
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full h-11 px-4 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3c8af7]/30 focus:border-[#3c8af7] transition-colors"
                      placeholder={language === "de" ? "Ihr Name" : "Your name"}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      E-Mail <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full h-11 px-4 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3c8af7]/30 focus:border-[#3c8af7] transition-colors"
                      required
                      placeholder={
                        language === "de"
                          ? "ihre.email@beispiel.de"
                          : "your.email@example.com"
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {language === "de" ? "Betreff" : "Subject"}
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    className="w-full h-11 px-4 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3c8af7]/30 focus:border-[#3c8af7] transition-colors"
                    placeholder={
                      language === "de"
                        ? "Worum geht es?"
                        : "What is this about?"
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {language === "de" ? "Nachricht" : "Message"}
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3c8af7]/30 focus:border-[#3c8af7] transition-colors resize-none"
                    placeholder={
                      language === "de"
                        ? "Beschreiben Sie Ihr Anliegen..."
                        : "Describe your request..."
                    }
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 rounded-xl text-sm font-semibold bg-[#3c8af7] text-white hover:bg-[#3579de] active:bg-[#2d6bc8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {language === "de" ? "Wird gesendet..." : "Sending..."}
                    </span>
                  ) : (
                    <>
                      {language === "de" ? "Nachricht senden" : "Send Message"}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-400 text-center">
                  {language === "de"
                    ? "Wir antworten in der Regel innerhalb von 24 Stunden."
                    : "We typically respond within 24 hours."}
                </p>
              </form>
            </div>
          </RevealOnScroll>
        </div>
      </section>
    </div>
  );
}

function ContactCard({
  method,
}: {
  method: {
    icon: React.ElementType;
    title: string;
    description: string;
    detail: string;
    href?: string;
    color: string;
  };
}) {
  const Icon = method.icon;
  return (
    <>
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: "#EEF4FF", border: "1px solid #DDE7FF" }}
      >
        <Icon className="w-5 h-5" style={{ color: method.color }} />
      </div>
      <h3 className="text-base font-semibold text-gray-900">{method.title}</h3>
      <p className="text-sm text-gray-500 mt-1">{method.description}</p>
      <p
        className="text-sm font-medium mt-3 inline-flex items-center gap-1.5"
        style={{ color: method.href ? method.color : "#374151" }}
      >
        {method.detail}
        {method.href && <ArrowRight className="w-3.5 h-3.5" />}
      </p>
    </>
  );
}
