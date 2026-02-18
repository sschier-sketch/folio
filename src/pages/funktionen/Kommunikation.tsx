import { useNavigate } from "react-router-dom";
import { withRef } from "../../lib/referralTracking";
import { RefLink } from "../../components/common/RefLink";
import { RevealOnScroll } from "../../components/common/RevealOnScroll";
import FaqSection from "../../components/landing/FaqSection";
import {
  ArrowLeft,
  Mail,
  FileText,
  MessageSquare,
  Bell,
  Share2,
  Clock,
  CheckCircle2,
  Home,
  FolderOpen,
  CreditCard,
  Calendar,
  ClipboardCheck,
  BarChart3,
  LayoutDashboard,
  Shield,
  Sparkles,
  Zap,
  Laptop
} from "lucide-react";

const HERO_CHECKS = [
  "Zentrale E-Mail-Verwaltung für alle Objekte",
  "Fertige Vorlagen für häufige Anliegen",
  "Komplette Kommunikationshistorie dokumentiert"
];

const FEATURES = [
  {
    icon: Mail,
    title: "Integriertes Postfach",
    description: "Alle E-Mails zu Ihren Immobilien in einem zentralen Postfach. Nachrichten werden automatisch dem richtigen Mieter zugeordnet."
  },
  {
    icon: FileText,
    title: "Nachrichtenvorlagen",
    description: "Erstellen Sie eigene E-Mail-Vorlagen für wiederkehrende Anliegen. Platzhalter werden automatisch mit Mieterdaten befüllt."
  },
  {
    icon: MessageSquare,
    title: "Ticketsystem",
    description: "Mieteranfragen als Tickets verwalten. Status, Priorität und Zuständigkeit auf einen Blick."
  },
  {
    icon: Bell,
    title: "Benachrichtigungen",
    description: "Automatische Erinnerungen bei offenen Anfragen. Keine Nachricht bleibt unbeantwortet."
  },
  {
    icon: Share2,
    title: "Dokumente teilen",
    description: "Senden Sie Dokumente, Abrechnungen und Verträge direkt an Ihre Mieter — sicher und nachvollziehbar."
  },
  {
    icon: Clock,
    title: "Kommunikationshistorie",
    description: "Lückenlose Dokumentation aller Nachrichten und Vorgänge. Jeder Austausch ist jederzeit abrufbar."
  }
];

const OTHER_FEATURES = [
  {
    icon: Home,
    title: "Immobilienmanagement",
    description: "Verwalten Sie alle Ihre Immobilien und Einheiten digital & sicher.",
    path: "/funktionen/immobilienmanagement",
  },
  {
    icon: CreditCard,
    title: "Mietverwaltung",
    description: "Mietverträge, Zahlungen und Mahnwesen digital verwalten.",
    path: "/funktionen/mietverwaltung",
  },
  {
    icon: FolderOpen,
    title: "Dokumentenmanagement",
    description: "Verwalten Sie Ihre Dokumente einfach & sicher in der Cloud.",
    path: "/funktionen/dokumente",
  },
  {
    icon: BarChart3,
    title: "Finanzmanagement",
    description: "Finanzen und Mieteinnahmen jederzeit im Blick behalten.",
    path: "/funktionen/buchhaltung",
  },
  {
    icon: Calendar,
    title: "Nebenkostenabrechnung",
    description: "Versandfertige Nebenkostenabrechnung in wenigen Minuten.",
    path: "/funktionen/nebenkostenabrechnung",
  },
  {
    icon: ClipboardCheck,
    title: "Übergabeprotokolle",
    description: "Optimale Dokumentation für Ihre nächste Wohnungsübergabe.",
    path: "/funktionen/uebergabeprotokoll",
  },
];

const BENEFITS = [
  {
    icon: LayoutDashboard,
    title: "Alles auf einen Blick",
    description: "Sämtliche Nachrichten, Anfragen und Vorgänge zentral in einem Dashboard."
  },
  {
    icon: Clock,
    title: "Schneller reagieren",
    description: "Offene Anfragen sofort erkennen und zeitnah beantworten."
  },
  {
    icon: Shield,
    title: "Lückenlos dokumentiert",
    description: "Jede Nachricht wird automatisch archiviert und ist jederzeit abrufbar."
  },
  {
    icon: Sparkles,
    title: "Professionell kommunizieren",
    description: "Mit Vorlagen und Platzhaltern wirken Ihre Nachrichten immer professionell."
  },
  {
    icon: Zap,
    title: "Weniger Aufwand",
    description: "Automatische Zuordnung und Vorlagen sparen Ihnen täglich Zeit."
  },
  {
    icon: Laptop,
    title: "Flexibel arbeiten",
    description: "Kommunizieren Sie mit Ihren Mietern von überall — am PC, Tablet oder Smartphone."
  }
];

const MOCK_MESSAGES = [
  { sender: "Sarah Meyer", subject: "Frage zur Nebenkostenabrechnung", date: "14.02.2026", status: "Neu", statusColor: "#3b82f6", statusBg: "#eff6ff" },
  { sender: "Thomas Klein", subject: "Schlüssel für Keller verloren", date: "13.02.2026", status: "Offen", statusColor: "#f59e0b", statusBg: "#fffbeb" },
  { sender: "Lisa Wagner", subject: "Danke für die schnelle Reparatur", date: "12.02.2026", status: "Beantwortet", statusColor: "#22c55e", statusBg: "#f0fdf4" },
  { sender: "Michael Hoffmann", subject: "Heizung funktioniert nicht", date: "11.02.2026", status: "Beantwortet", statusColor: "#22c55e", statusBg: "#f0fdf4" },
];

function InboxMockup() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-900/[0.08] overflow-hidden">
      <div className="px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-bold text-gray-900">Posteingang</h3>
          <span className="text-sm text-gray-400">4 Nachrichten</span>
        </div>
        <div className="h-9 px-4 rounded-lg bg-gray-900 text-white text-sm font-semibold flex items-center gap-1.5">
          <span className="text-base leading-none">+</span>
          Neue Nachricht
        </div>
      </div>

      <div className="px-6 pb-4 flex items-center gap-3">
        <div className="flex-1 h-10 rounded-lg border border-gray-200 bg-gray-50 flex items-center px-3 gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
          <span className="text-sm text-gray-400">Suchen...</span>
        </div>
        <div className="h-10 px-3.5 rounded-lg border border-gray-200 flex items-center gap-2 text-sm text-gray-600">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" /></svg>
          Alle
        </div>
      </div>

      <div className="border-t border-gray-100">
        <div className="hidden sm:grid grid-cols-[1.4fr_2fr_0.8fr_0.7fr] px-6 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          <span>Absender</span>
          <span>Betreff</span>
          <span>Datum</span>
          <span className="text-right">Status</span>
        </div>

        {MOCK_MESSAGES.map((m, i) => (
          <div
            key={m.sender}
            className={`hidden sm:grid grid-cols-[1.4fr_2fr_0.8fr_0.7fr] px-6 py-4 items-center ${
              i < MOCK_MESSAGES.length - 1 ? "border-b border-gray-100" : ""
            }`}
          >
            <span className="text-sm font-semibold text-gray-900">{m.sender}</span>
            <span className="text-sm text-gray-500 truncate">{m.subject}</span>
            <span className="text-sm text-gray-400">{m.date}</span>
            <div className="flex justify-end">
              <span
                className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ color: m.statusColor, backgroundColor: m.statusBg }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.statusColor }} />
                {m.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 bg-gray-50 px-6 py-3.5 flex items-center justify-between">
        <span className="text-sm text-gray-500 font-medium">Offene Anfragen</span>
        <span className="text-sm font-bold text-gray-900">2 unbeantwortet</span>
      </div>
    </div>
  );
}

export default function Kommunikation() {
  const navigate = useNavigate();
  const goToSignup = () => navigate(withRef("/signup"));

  return (
    <div>
      <section className="pt-16 sm:pt-24 pb-[100px] sm:pb-[120px] px-6">
        <div className="max-w-[1200px] mx-auto">
          <RefLink
            to="/funktionen"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Alle Funktionen
          </RefLink>

          <div className="grid lg:grid-cols-2 gap-6 sm:gap-12 lg:gap-16 items-center">
            <RevealOnScroll>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#3c8af7]/5 border border-[#3c8af7]/15 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3c8af7]" />
                <span className="text-sm font-medium text-[#3c8af7]">
                  Kerntechnologie
                </span>
              </div>
              <h1 className="text-3xl sm:text-[40px] md:text-[48px] lg:text-[56px] font-bold text-gray-900 leading-[1.1] tracking-tight">
                Mieterkommunikation{" "}
                <span className="text-[#3c8af7]">zentral & effizient</span>
              </h1>
              <p className="mt-6 text-lg sm:text-[20px] text-gray-500 leading-relaxed max-w-[540px]">
                E-Mails gehen unter, Anrufe sind undokumentiert. Mit rentably bündeln
                Sie Ihre gesamte Mieterkommunikation an einem Ort — strukturiert,
                nachvollziehbar und professionell.
              </p>
              <ul className="mt-6 space-y-2.5">
                {HERO_CHECKS.map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#3c8af7] flex-shrink-0" />
                    <span className="text-sm text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-col sm:flex-row items-start gap-4">
                <button
                  onClick={goToSignup}
                  className="h-12 px-8 rounded-lg text-base font-semibold bg-[#3c8af7] text-white hover:bg-[#3579de] transition-colors"
                >
                  Jetzt kostenlos starten
                </button>
                <RefLink
                  to="/preise"
                  className="h-12 inline-flex items-center px-8 rounded-lg text-base font-semibold border border-gray-300 text-gray-700 hover:border-gray-400 hover:text-gray-900 transition-colors"
                >
                  Preise ansehen
                </RefLink>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={100} className="hidden lg:block">
              <InboxMockup />
            </RevealOnScroll>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-[1200px] mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-[#3c8af7] uppercase tracking-wide mb-3">
                Weniger Stress, mehr Überblick
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">
                Ihre Mieterkommunikation im Griff
              </h2>
              <p className="text-gray-500 max-w-[700px] mx-auto">
                Einfach, übersichtlich, professionell – mit rentably kommunizieren Sie
                strukturiert und effizient mit Ihren Mietern.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {FEATURES.map((feature, i) => (
              <RevealOnScroll key={feature.title} delay={i * 80}>
                <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow h-full">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-5"
                    style={{ backgroundColor: "#EEF4FF", border: "1px solid #DDE7FF" }}
                  >
                    <feature.icon className="w-5 h-5" style={{ color: "#1E1E24" }} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-500 leading-relaxed text-sm">
                    {feature.description}
                  </p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-[1200px] mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-[#3c8af7] uppercase tracking-wide mb-3">
                Praxisbeispiel
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">
                So einfach kommunizieren Sie mit Ihren Mietern
              </h2>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={100}>
            <div className="max-w-[900px] mx-auto bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-[#3c8af7] to-[#3579de] p-6 sm:p-8 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Frage zur Nebenkostenabrechnung</h3>
                    <p className="text-white/80 text-sm">Sarah Meyer · Musterstr. 10, EG</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-white/70">
                  <span className="inline-flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-300" />
                    Neu
                  </span>
                  <span>Eingegangen: 14.02.2026, 09:32 Uhr</span>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-gray-500">SM</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm font-semibold text-gray-900">Sarah Meyer</span>
                      <span className="text-xs text-gray-400">14.02.2026, 09:32</span>
                    </div>
                    <div className="bg-gray-50 rounded-xl rounded-tl-sm p-4 border border-gray-100">
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Guten Tag, ich habe die Nebenkostenabrechnung für 2025 erhalten und hätte eine Frage zu den Heizkosten. Der Betrag erscheint mir deutlich höher als im Vorjahr. Können Sie mir bitte eine Aufschlüsselung zusenden?
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 flex-row-reverse">
                  <div className="w-10 h-10 rounded-full bg-[#3c8af7] flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-white">SV</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5 justify-end">
                      <span className="text-xs text-gray-400">14.02.2026, 11:15</span>
                      <span className="text-sm font-semibold text-gray-900">Sie (Vermieter)</span>
                    </div>
                    <div className="bg-[#3c8af7]/5 rounded-xl rounded-tr-sm p-4 border border-[#3c8af7]/10">
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Guten Tag Frau Meyer, vielen Dank für Ihre Nachricht. Die Heizkosten sind in 2025 aufgrund gestiegener Energiepreise tatsächlich höher ausgefallen. Ich habe Ihnen die detaillierte Aufschlüsselung als Anhang beigefügt.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-gray-500">SM</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm font-semibold text-gray-900">Sarah Meyer</span>
                      <span className="text-xs text-gray-400">14.02.2026, 14:08</span>
                    </div>
                    <div className="bg-gray-50 rounded-xl rounded-tl-sm p-4 border border-gray-100">
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Vielen Dank für die schnelle Antwort und die Aufschlüsselung. Das ist jetzt nachvollziehbar. Damit ist meine Frage beantwortet.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-5 flex items-center gap-3">
                  <div className="flex-1 h-10 rounded-lg border border-gray-200 bg-gray-50 flex items-center px-3">
                    <span className="text-sm text-gray-400">Antwort schreiben...</span>
                  </div>
                  <div className="h-10 px-5 rounded-lg bg-[#3c8af7] text-white text-sm font-semibold flex items-center">
                    Senden
                  </div>
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <section className="py-12 sm:py-[80px] px-6">
        <div className="max-w-[1200px] mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">
                Ihre Daten in sicheren Händen
              </h2>
              <p className="text-gray-500 leading-relaxed max-w-[600px] mx-auto">
                rentably wird in Deutschland betrieben und erfüllt die Anforderungen der DSGVO.
                Ihre Daten gehören Ihnen &ndash; heute und in Zukunft.
              </p>
            </div>
          </RevealOnScroll>
          <RevealOnScroll delay={80}>
            <div className="flex items-center justify-center gap-6 sm:gap-12 flex-wrap">
              <img
                src="/dsvgo-de.png"
                alt="DSGVO-konform"
                className="h-24 sm:h-32 w-auto object-contain"
              />
              <img
                src="/entwickelt-in-deutschland-de.png"
                alt="Entwickelt in Deutschland"
                className="h-24 sm:h-32 w-auto object-contain"
              />
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <section className="py-20 px-6 bg-[#EEF4FF]">
        <div className="max-w-[1200px] mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-[#3c8af7] uppercase tracking-wide mb-3">
                Vorteile
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">
                Darum setzen Vermieter auf rentably
              </h2>
              <p className="text-gray-500 max-w-[700px] mx-auto leading-relaxed">
                Wir haben Vermieter und Hausverwalter gefragt, wie rentably ihre Arbeit
                verändert. Die Top-Antworten zeigen klar, welchen Mehrwert unsere Software bietet.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
            {BENEFITS.map((benefit, i) => (
              <RevealOnScroll key={benefit.title} delay={i * 80} className="h-full">
                <div className="bg-white rounded-xl p-6 sm:p-8 border border-gray-100 shadow-sm h-full text-center">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
                    style={{ backgroundColor: "#E0EDFF", border: "1px solid #C7DCFF" }}
                  >
                    <benefit.icon className="w-6 h-6 text-[#3c8af7]" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </RevealOnScroll>
            ))}
          </div>

          <RevealOnScroll>
            <div className="text-center">
              <p className="text-gray-600 mb-6">
                Teste rentably jetzt kostenlos und unverbindlich.
              </p>
              <button
                onClick={goToSignup}
                className="h-12 px-8 rounded-lg text-base font-semibold bg-[#3c8af7] text-white hover:bg-[#3579de] transition-colors"
              >
                Jetzt kostenlos testen
              </button>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-[1200px] mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-[#3c8af7] uppercase tracking-wide mb-3">
                Innovativ
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">
                Weitere Funktionen für Vermieter
              </h2>
              <p className="text-gray-500 max-w-[700px] mx-auto">
                rentably bietet Ihnen umfangreiche Funktionen, die Ihre Immobilienverwaltung
                auf das nächste Level bringen.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {OTHER_FEATURES.map((feature, i) => {
              const content = (
                <div className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer h-full">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: "#EEF4FF", border: "1px solid #DDE7FF" }}
                  >
                    <feature.icon className="w-5 h-5" style={{ color: "#1E1E24" }} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
              return (
                <RevealOnScroll key={feature.title} delay={i * 80} className="h-full">
                  {feature.path ? (
                    <RefLink to={feature.path} className="block h-full">
                      {content}
                    </RefLink>
                  ) : (
                    content
                  )}
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      <FaqSection pageSlug="kommunikation" />

      <section className="py-12 sm:py-[80px] px-6 bg-[#f8fafc]">
        <div className="max-w-[800px] mx-auto">
          <RevealOnScroll>
            <h2 className="text-2xl sm:text-[28px] font-bold text-gray-900 tracking-tight leading-tight mb-6">
              Mieterkommunikation zentral verwalten &ndash; E-Mails, Tickets und Vorlagen an einem Ort
            </h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                E-Mails gehen unter, Telefonnotizen verschwinden, und ohne klare Dokumentation wird
                jede Auseinandersetzung zum Wort-gegen-Wort-Problem. F&uuml;r private Vermieter mit
                mehreren Mietverh&auml;ltnissen ist eine strukturierte Kommunikation nicht nur
                w&uuml;nschenswert, sondern notwendig &ndash; f&uuml;r den eigenen &Uuml;berblick und als
                Absicherung im Streitfall.
              </p>
              <p>
                rentably b&uuml;ndelt Ihre gesamte Mieterkommunikation in einem integrierten E-Mail-System:
                Jede Nachricht wird automatisch dem richtigen Mieter und der richtigen Immobilie zugeordnet.
                &Uuml;ber das Ticketsystem behalten Sie offene Anfragen mit Status, Priorit&auml;t und
                Bearbeitungshistorie im Blick. Fertige Vorlagen mit automatischen Platzhaltern f&uuml;r
                Mieterdaten sparen Ihnen Zeit bei wiederkehrenden Anliegen.
              </p>
              <p>
                Jede Konversation wird l&uuml;ckenlos archiviert und ist jederzeit abrufbar. Dokumente,
                Abrechnungen und Vertr&auml;ge versenden Sie direkt aus dem System heraus &ndash; sicher
                und nachvollziehbar. So kommunizieren Sie professionell und haben im Fall einer
                Auseinandersetzung immer den vollst&auml;ndigen Schriftverkehr zur Hand.
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <section className="py-24 px-6">
        <RevealOnScroll>
          <div className="max-w-[1200px] mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 tracking-tight mb-4">
              Bereit für professionelle Mieterkommunikation?
            </h2>
            <p className="text-gray-500 mb-10 max-w-lg mx-auto">
              Registrieren Sie sich kostenlos und kommunizieren Sie ab sofort strukturiert
              mit Ihren Mietern — ohne Kreditkarte.
            </p>
            <button
              onClick={goToSignup}
              className="h-12 px-8 rounded-lg text-base font-semibold bg-[#3c8af7] text-white hover:bg-[#3579de] transition-colors"
            >
              Jetzt kostenlos starten
            </button>
          </div>
        </RevealOnScroll>
      </section>
    </div>
  );
}
