import { useState } from "react";
import { Mail, Phone, Clock, Send, ArrowRight } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { Button } from "./ui/Button";

const WHATSAPP_NUMBER = "4915731853648";

export default function ServiceView() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    email: user?.email || "",
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
        setFormData({ name: "", email: user?.email || "", subject: "", message: "" });
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
      description: language === "de" ? "Schreiben Sie uns eine E-Mail" : "Send us an email",
      detail: "hallo@rentab.ly",
      href: "mailto:hallo@rentab.ly",
    },
    {
      icon: Phone,
      title: "WhatsApp",
      description: language === "de" ? "Schreiben Sie uns per WhatsApp" : "Message us on WhatsApp",
      detail: language === "de" ? "Chat starten" : "Start chat",
      href: `https://wa.me/${WHATSAPP_NUMBER}`,
    },
    {
      icon: Clock,
      title: language === "de" ? "Erreichbarkeit" : "Availability",
      description: language === "de" ? "Unser Support-Team ist für Sie da" : "Our support team is available",
      detail: language === "de" ? "Mo - Fr, 9:00 - 18:00 Uhr" : "Mon - Fri, 9:00 AM - 6:00 PM",
      href: undefined,
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark mb-2">
          {language === "de" ? "Service" : "Service"}
        </h1>
        <p className="text-gray-400">
          {language === "de"
            ? "Haben Sie Fragen oder benötigen Hilfe? Kontaktieren Sie unser Support-Team."
            : "Have questions or need help? Contact our support team."}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {contactMethods.map((method) => {
          const Icon = method.icon;
          const content = (
            <div className="bg-white rounded-lg shadow-sm p-5">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3 bg-blue-50">
                <Icon className="w-5 h-5 text-primary-blue" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">{method.title}</h3>
              <p className="text-xs text-gray-500 mt-1">{method.description}</p>
              <p className={`text-sm font-medium mt-2 inline-flex items-center gap-1.5 ${method.href ? "text-primary-blue" : "text-gray-700"}`}>
                {method.detail}
                {method.href && <ArrowRight className="w-3.5 h-3.5" />}
              </p>
            </div>
          );

          if (method.href) {
            return (
              <a
                key={method.title}
                href={method.href}
                target={method.href.startsWith("https") ? "_blank" : undefined}
                rel={method.href.startsWith("https") ? "noopener noreferrer" : undefined}
                className="block hover:shadow-md transition-shadow rounded-lg"
              >
                {content}
              </a>
            );
          }
          return <div key={method.title}>{content}</div>;
        })}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
        <h3 className="text-lg font-semibold text-dark mb-1">
          {language === "de" ? "Nachricht senden" : "Send a Message"}
        </h3>
        <p className="text-sm text-gray-400 mb-6">
          {language === "de"
            ? "Beschreiben Sie Ihr Anliegen und wir melden uns schnellstmöglich."
            : "Describe your request and we'll get back to you as soon as possible."}
        </p>

        {submitted && (
          <div className="mb-6 flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <Send className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
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
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {language === "de" ? "Name" : "Name"}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full h-11 px-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/30 focus:border-primary-blue transition-colors"
                placeholder={language === "de" ? "Ihr Name" : "Your name"}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                E-Mail
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full h-11 px-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/30 focus:border-primary-blue transition-colors"
                required
                placeholder={language === "de" ? "ihre.email@beispiel.de" : "your.email@example.com"}
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
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full h-11 px-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/30 focus:border-primary-blue transition-colors"
              placeholder={language === "de" ? "Worum geht es?" : "What is this about?"}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {language === "de" ? "Nachricht" : "Message"}
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={5}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/30 focus:border-primary-blue transition-colors resize-none"
              placeholder={language === "de" ? "Beschreiben Sie Ihr Anliegen..." : "Describe your request..."}
              required
            />
          </div>

          <Button type="submit" disabled={submitting} variant="primary">
            {submitting
              ? (language === "de" ? "Wird gesendet..." : "Sending...")
              : (language === "de" ? "Nachricht senden" : "Send Message")}
          </Button>

          <p className="text-xs text-gray-400">
            {language === "de"
              ? "Wir antworten in der Regel innerhalb von 24 Stunden."
              : "We typically respond within 24 hours."}
          </p>
        </form>
      </div>
    </div>
  );
}
