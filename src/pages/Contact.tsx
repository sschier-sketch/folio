import { Mail, MessageSquare, Send } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import Footer from "../components/Footer";
import { Header } from "../components/Header";
import { supabase } from "../lib/supabase";
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
      const { data: ticketNumberData } = await supabase.rpc(
        "generate_contact_ticket_number",
      );
      const ticketNumber = ticketNumberData || `CONTACT-${Date.now()}`;
      const { data: newTicket, error: ticketError } = await supabase
        .from("tickets")
        .insert([
          {
            user_id: null,
            ticket_number: ticketNumber,
            ticket_type: "contact",
            subject: formData.subject,
            contact_name: formData.name,
            contact_email: formData.email,
            status: "open",
            priority: "medium",
            category: "inquiry",
            created_by_name: formData.name,
          },
        ])
        .select()
        .single();
      if (ticketError) throw ticketError;
      if (newTicket) {
        const { error: messageError } = await supabase
          .from("ticket_messages")
          .insert([
            {
              ticket_id: newTicket.id,
              sender_type: "contact",
              sender_name: formData.name,
              sender_email: formData.email,
              message: formData.message,
            },
          ]);
        if (messageError)
          console.error("Failed to add initial message:", messageError);
      }
      setSubmitted(true);
      setTimeout(() => {
        setFormData({ name: "", email: "", subject: "", message: "" });
        setSubmitted(false);
      }, 5000);
    } catch (err) {
      console.error("Error submitting contact form:", err);
      setError(
        "Es gab einen Fehler beim Senden Ihrer Nachricht. Bitte versuchen Sie es erneut.",
      );
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      {" "}
      <Header />{" "}
      <div className="flex-1 py-16 px-4 sm:px-6 lg:px-8 mt-16">
        {" "}
        <div className="max-w-4xl mx-auto">
          {" "}
          <div className="text-center mb-12">
            {" "}
            <h1 className="text-4xl font-bold text-dark mb-4">
              {" "}
              {language === "de" ? "Kontakt" : "Contact"}{" "}
            </h1>{" "}
            <p className="text-lg text-gray-400">
              {" "}
              {language === "de"
                ? "Wir freuen uns auf Ihre Nachricht und helfen Ihnen gerne weiter."
                : "We look forward to your message and are happy to help you."}{" "}
            </p>{" "}
          </div>{" "}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {" "}
            <div className="bg-white rounded shadow-sm p-6">
              {" "}
              <div className="flex items-center gap-3 mb-4">
                {" "}
                <div className="w-12 h-12 bg-primary-blue/10 rounded-full flex items-center justify-center">
                  {" "}
                  <Mail className="w-6 h-6 text-primary-blue" />{" "}
                </div>{" "}
                <div>
                  {" "}
                  <h3 className="font-semibold text-dark">E-Mail</h3>{" "}
                  <p className="text-sm text-gray-400">
                    {" "}
                    {language === "de"
                      ? "Schreiben Sie uns eine E-Mail"
                      : "Send us an email"}{" "}
                  </p>{" "}
                </div>{" "}
              </div>{" "}
              <a
                href="mailto:hallo@rentably.com"
                className="text-primary-blue hover:text-primary-blue font-medium"
              >
                {" "}
                hallo@rentably.com{" "}
              </a>{" "}
            </div>{" "}
            <div className="bg-white rounded shadow-sm p-6">
              {" "}
              <div className="flex items-center gap-3 mb-4">
                {" "}
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  {" "}
                  <MessageSquare className="w-6 h-6 text-emerald-600" />{" "}
                </div>{" "}
                <div>
                  {" "}
                  <h3 className="font-semibold text-dark">
                    {" "}
                    {language === "de" ? "Support" : "Support"}{" "}
                  </h3>{" "}
                  <p className="text-sm text-gray-400">
                    {" "}
                    {language === "de"
                      ? "Wir helfen Ihnen bei allen Fragen"
                      : "We help you with all questions"}{" "}
                  </p>{" "}
                </div>{" "}
              </div>{" "}
              <p className="text-gray-400">
                {" "}
                {language === "de"
                  ? "Montag bis Freitag, 9:00 - 18:00 Uhr"
                  : "Monday to Friday, 9:00 AM - 6:00 PM"}{" "}
              </p>{" "}
            </div>{" "}
          </div>{" "}
          <div className="bg-white rounded shadow-sm p-8">
            {" "}
            <h2 className="text-2xl font-bold text-dark mb-6">
              {" "}
              {language === "de" ? "Kontaktformular" : "Contact Form"}{" "}
            </h2>{" "}
            {submitted && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800">
                {" "}
                {language === "de"
                  ? "Vielen Dank für Ihre Nachricht! Wir werden uns so schnell wie möglich bei Ihnen melden."
                  : "Thank you for your message! We will get back to you as soon as possible."}{" "}
              </div>
            )}{" "}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                {" "}
                {error}{" "}
              </div>
            )}{" "}
            <form onSubmit={handleSubmit} className="space-y-6">
              {" "}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {" "}
                <div>
                  {" "}
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    {" "}
                    {language === "de" ? "Name" : "Name"}{" "}
                  </label>{" "}
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    required
                  />{" "}
                </div>{" "}
                <div>
                  {" "}
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    {" "}
                    E-Mail <span className="text-red-500">*</span>{" "}
                  </label>{" "}
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    required
                    placeholder={
                      language === "de"
                        ? "ihre.email@beispiel.de"
                        : "your.email@example.com"
                    }
                  />{" "}
                  <p className="text-xs text-gray-300 mt-1">
                    {" "}
                    {language === "de"
                      ? "Pflichtfeld - damit wir Ihnen antworten können"
                      : "Required field - so we can respond to you"}{" "}
                  </p>{" "}
                </div>{" "}
              </div>{" "}
              <div>
                {" "}
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  {" "}
                  {language === "de" ? "Betreff" : "Subject"}{" "}
                </label>{" "}
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  required
                />{" "}
              </div>{" "}
              <div>
                {" "}
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  {" "}
                  {language === "de" ? "Nachricht" : "Message"}{" "}
                </label>{" "}
                <textarea
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue resize-none"
                  required
                />{" "}
              </div>{" "}
              <div className="flex justify-end">
                {" "}
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-3 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {" "}
                  {submitting ? (
                    <>
                      {" "}
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>{" "}
                      {language === "de"
                        ? "Wird gesendet..."
                        : "Sending..."}{" "}
                    </>
                  ) : (
                    <>
                      {" "}
                      <Send className="w-5 h-5" />{" "}
                      {language === "de"
                        ? "Nachricht senden"
                        : "Send Message"}{" "}
                    </>
                  )}{" "}
                </button>{" "}
              </div>{" "}
            </form>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      <Footer />{" "}
    </div>
  );
}
