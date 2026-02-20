import { useNavigate } from "react-router-dom";
import { withRef } from "../../lib/referralTracking";
import { RefLink } from "../../components/common/RefLink";
import { RevealOnScroll } from "../../components/common/RevealOnScroll";
import FaqSection from "../../components/landing/FaqSection";
import {
  ArrowLeft,
  FileText,
  MessageSquare,
  Gauge,
  CheckCircle2,
  Home,
  Users,
  FolderOpen,
  Receipt,
  Building2,
  Shield,
  Sparkles,
  Zap,
  Laptop,
  BarChart3,
  Clock,
  Bell,
  KeyRound,
  Smartphone,
  Eye,
  Send,
  UserCheck,
  ArrowRight,
  Calculator,
} from "lucide-react";

const HERO_CHECKS = [
  "Eigenes Mieterportal mit Login für jeden Mieter",
  "Dokumente, Kommunikation & Zählerstände zentral",
  "Weniger Rückfragen, mehr Transparenz",
];

const FEATURES = [
  {
    icon: Home,
    title: "Mieter-Dashboard",
    description:
      "Ihre Mieter sehen alle wichtigen Informationen auf einen Blick: Vertragsdaten, offene Nachrichten und anstehende Termine.",
  },
  {
    icon: FileText,
    title: "Dokumente einsehen",
    description:
      "Mietverträge, Nebenkostenabrechnungen und weitere Dokumente stellen Sie digital bereit. Ihre Mieter greifen jederzeit darauf zu.",
  },
  {
    icon: MessageSquare,
    title: "Ticket-System",
    description:
      "Mieter melden Anliegen über ein strukturiertes Ticket-System. Sie behalten den Überblick und antworten direkt aus rentably.",
  },
  {
    icon: Gauge,
    title: "Zählerstände melden",
    description:
      "Mieter erfassen Zählerstände selbstständig im Portal. Die Werte fließen direkt in Ihre Nebenkostenabrechnung ein.",
  },
  {
    icon: Bell,
    title: "Automatische Benachrichtigungen",
    description:
      "Bei neuen Dokumenten, Nachrichten oder Terminänderungen werden Ihre Mieter automatisch per E-Mail informiert.",
  },
  {
    icon: KeyRound,
    title: "Sicherer Zugang",
    description:
      "Jeder Mieter erhält einen individuellen, passwortgeschützten Zugang. Sie bestimmen, welche Informationen sichtbar sind.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Portal aktivieren",
    description:
      "Aktivieren Sie das Mieterportal für einen Mieter mit einem Klick. Eine Einladungs-E-Mail mit Zugangsdaten wird automatisch versendet.",
  },
  {
    step: "02",
    title: "Dokumente & Daten freigeben",
    description:
      "Wählen Sie, welche Dokumente und Informationen Ihr Mieter im Portal sehen soll. Mietverträge, Abrechnungen und mehr.",
  },
  {
    step: "03",
    title: "Mieter nutzt Self-Service",
    description:
      "Ihr Mieter meldet sich an, sieht seine Dokumente, reicht Tickets ein und meldet Zählerstände. Alles digital, alles nachvollziehbar.",
  },
];

const OTHER_FEATURES = [
  {
    icon: Home,
    title: "Immobilienmanagement",
    description:
      "Verwalten Sie alle Ihre Immobilien und Einheiten digital & sicher.",
    path: "/funktionen/immobilienmanagement",
  },
  {
    icon: Users,
    title: "Mietverwaltung",
    description:
      "Mietverträge, Zahlungen und Erhöhungen effizient verwalten.",
    path: "/funktionen/mietverwaltung",
  },
  {
    icon: Calculator,
    title: "Nebenkostenabrechnung",
    description:
      "Rechtssichere Nebenkostenabrechnungen in wenigen Minuten erstellen.",
    path: "/funktionen/nebenkostenabrechnung",
  },
  {
    icon: BarChart3,
    title: "Finanzmanagement",
    description:
      "Finanzen und Mieteinnahmen jederzeit im Blick behalten.",
    path: "/funktionen/buchhaltung",
  },
  {
    icon: FolderOpen,
    title: "Dokumentenmanagement",
    description:
      "Verwalten Sie Ihre Dokumente einfach & sicher in der Cloud.",
    path: "/funktionen/dokumente",
  },
  {
    icon: Receipt,
    title: "Buchhaltung",
    description:
      "Einnahmen, Ausgaben und Steuern übersichtlich verwalten.",
    path: "/funktionen/buchhaltung",
  },
];

const BENEFITS = [
  {
    icon: Clock,
    title: "Weniger Rückfragen",
    description:
      "Mieter finden Vertragsdaten, Dokumente und Abrechnungen selbst. Sie sparen Zeit für Telefonate und E-Mails.",
  },
  {
    icon: Eye,
    title: "Maximale Transparenz",
    description:
      "Alle Informationen sind für Ihre Mieter jederzeit einsehbar. Das schafft Vertrauen und reduziert Konflikte.",
  },
  {
    icon: Shield,
    title: "DSGVO-konform",
    description:
      "Sicherer Zugang, verschlüsselte Datenübertragung und Hosting auf zertifizierten Servern. Datenschutz inklusive.",
  },
  {
    icon: Sparkles,
    title: "Professioneller Auftritt",
    description:
      "Bieten Sie Ihren Mietern ein modernes, digitales Erlebnis. Das unterscheidet Sie von anderen Vermietern.",
  },
  {
    icon: Zap,
    title: "Automatisierte Prozesse",
    description:
      "Zählerstände, Dokumente und Benachrichtigungen laufen automatisch. Weniger manueller Aufwand für Sie.",
  },
  {
    icon: Laptop,
    title: "Von überall erreichbar",
    description:
      "Ihre Mieter greifen von jedem Gerät auf das Portal zu. Ob Smartphone, Tablet oder Desktop.",
  },
];

function PortalMockup() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-900/[0.08] overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-b border-gray-100">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-gray-200" />
          <div className="w-3 h-3 rounded-full bg-gray-200" />
          <div className="w-3 h-3 rounded-full bg-gray-200" />
        </div>
        <div className="flex-1 mx-8">
          <div className="h-6 bg-gray-100 rounded-md flex items-center px-3">
            <span className="text-[11px] text-gray-400 font-mono">
              portal.rentably.de
            </span>
          </div>
        </div>
      </div>

      <div className="flex min-h-[380px]">
        <div className="w-[180px] bg-gray-50 border-r border-gray-100 p-4 flex-shrink-0">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-full bg-[#3c8af7]/10 flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-[#3c8af7]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-900">Sarah M.</p>
              <p className="text-[10px] text-gray-400">Mieterin</p>
            </div>
          </div>
          <nav className="space-y-1">
            {[
              { icon: Home, label: "Dashboard", active: true },
              { icon: FileText, label: "Dokumente", active: false },
              { icon: MessageSquare, label: "Nachrichten", active: false },
              { icon: Gauge, label: "Zählerstände", active: false },
            ].map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium ${
                  item.active
                    ? "bg-[#3c8af7]/10 text-[#3c8af7]"
                    : "text-gray-500"
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </div>
            ))}
          </nav>
        </div>

        <div className="flex-1 p-5">
          <div className="mb-5">
            <h3 className="text-sm font-bold text-gray-900 mb-0.5">
              Willkommen, Sarah
            </h3>
            <p className="text-[11px] text-gray-400">
              Musterstr. 10, EG links
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-[#EEF4FF] rounded-xl p-3.5 border border-[#DDE7FF]">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Nächste Zahlung
              </p>
              <p className="text-lg font-bold text-gray-900">850,00 &euro;</p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                Fällig am 01.03.2026
              </p>
            </div>
            <div className="bg-white rounded-xl p-3.5 border border-gray-200">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Offene Tickets
              </p>
              <p className="text-lg font-bold text-gray-900">1</p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                Reparaturanfrage
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-900">
                Aktuelle Dokumente
              </span>
              <span className="text-[10px] text-[#3c8af7] font-medium">
                Alle anzeigen
              </span>
            </div>
            {[
              {
                name: "Nebenkostenabrechnung 2024",
                date: "12.01.2026",
                tag: "Neu",
              },
              {
                name: "Mietvertrag",
                date: "01.06.2023",
                tag: null,
              },
              {
                name: "Hausordnung",
                date: "15.03.2023",
                tag: null,
              },
            ].map((doc, i) => (
              <div
                key={doc.name}
                className={`flex items-center justify-between px-4 py-2.5 ${
                  i < 2 ? "border-b border-gray-50" : ""
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-gray-50 border border-gray-100 flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-900">
                      {doc.name}
                    </p>
                    <p className="text-[10px] text-gray-400">{doc.date}</p>
                  </div>
                </div>
                {doc.tag && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#3c8af7]/10 text-[#3c8af7]">
                    {doc.tag}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
  isLast,
}: {
  step: string;
  title: string;
  description: string;
  isLast: boolean;
}) {
  return (
    <div className="relative flex gap-6">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-[#3c8af7] text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
          {step}
        </div>
        {!isLast && (
          <div className="w-px flex-1 bg-[#3c8af7]/20 mt-3" />
        )}
      </div>
      <div className={`pb-10 ${isLast ? "pb-0" : ""}`}>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function FeatureShowcase() {
  const showcaseItems = [
    {
      icon: FileText,
      title: "Dokumente digital bereitstellen",
      description:
        "Laden Sie Mietverträge, Abrechnungen und Hausordnungen hoch und teilen Sie diese mit einem Klick. Ihre Mieter greifen jederzeit darauf zu.",
      visual: (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-900">
              Freigegebene Dokumente
            </span>
          </div>
          {[
            { name: "Mietvertrag_2023.pdf", size: "245 KB", shared: true },
            { name: "NK-Abrechnung_2024.pdf", size: "1.2 MB", shared: true },
            { name: "Hausordnung.pdf", size: "89 KB", shared: true },
            { name: "Wohnungsübergabe.pdf", size: "3.1 MB", shared: false },
          ].map((doc, i) => (
            <div
              key={doc.name}
              className={`flex items-center justify-between px-5 py-3 ${
                i < 3 ? "border-b border-gray-50" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-red-500">
                    PDF
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {doc.name}
                  </p>
                  <p className="text-xs text-gray-400">{doc.size}</p>
                </div>
              </div>
              {doc.shared ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <Eye className="w-3 h-3" />
                  Sichtbar
                </span>
              ) : (
                <span className="text-xs text-gray-400">Nicht geteilt</span>
              )}
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: MessageSquare,
      title: "Strukturierte Kommunikation",
      description:
        "Schluss mit E-Mail-Chaos. Das Ticket-System bündelt alle Anfragen. Mieter melden Anliegen, Sie antworten direkt aus rentably.",
      visual: (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-900">
                Ticket #1042
              </span>
            </div>
            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              In Bearbeitung
            </span>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-gray-500">SM</span>
              </div>
              <div className="flex-1">
                <div className="bg-gray-50 rounded-xl rounded-tl-sm p-3.5">
                  <p className="text-xs font-medium text-gray-900 mb-1">
                    Sarah Meyer
                  </p>
                  <p className="text-sm text-gray-600">
                    Die Heizung im Bad funktioniert seit gestern nicht mehr.
                    Können Sie bitte einen Handwerker schicken?
                  </p>
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5 ml-1">
                  Heute, 09:14
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <div className="flex-1 flex justify-end">
                <div>
                  <div className="bg-[#3c8af7] rounded-xl rounded-tr-sm p-3.5">
                    <p className="text-xs font-medium text-white/80 mb-1">
                      Sie
                    </p>
                    <p className="text-sm text-white">
                      Danke für die Meldung. Ich habe den Handwerker
                      kontaktiert. Er kommt morgen zwischen 10 und 12 Uhr.
                    </p>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1.5 text-right mr-1">
                    Heute, 10:32
                  </p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#3c8af7]/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-[#3c8af7]">V</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: Gauge,
      title: "Zählerstände digital erfassen",
      description:
        "Mieter tragen ihre Zählerstände direkt im Portal ein. Die Werte werden automatisch Ihrer Immobilie zugeordnet und stehen für die Nebenkostenabrechnung bereit.",
      visual: (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-900">
              Zählerstände melden
            </span>
          </div>
          <div className="p-5 space-y-4">
            {[
              {
                label: "Strom",
                number: "DE-S-4821",
                value: "12.847",
                unit: "kWh",
                color: "#f59e0b",
              },
              {
                label: "Wasser",
                number: "WZ-2201",
                value: "234,5",
                unit: "m³",
                color: "#3b82f6",
              },
              {
                label: "Gas",
                number: "GZ-1105",
                value: "8.921",
                unit: "m³",
                color: "#22c55e",
              },
            ].map((meter) => (
              <div
                key={meter.label}
                className="flex items-center gap-4 p-3.5 bg-gray-50 rounded-xl border border-gray-100"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: `${meter.color}15`,
                    border: `1px solid ${meter.color}30`,
                  }}
                >
                  <Gauge
                    className="w-4.5 h-4.5"
                    style={{ color: meter.color }}
                    strokeWidth={1.5}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {meter.label}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {meter.number}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-gray-900">
                    {meter.value}
                  </p>
                  <p className="text-[10px] text-gray-400">{meter.unit}</p>
                </div>
              </div>
            ))}
            <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#3c8af7] text-white text-sm font-semibold">
              <Send className="w-3.5 h-3.5" />
              Zählerstände absenden
            </button>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-24">
      {showcaseItems.map((item, i) => {
        const isReversed = i % 2 === 1;
        return (
          <RevealOnScroll key={item.title}>
            <div
              className={`grid lg:grid-cols-2 gap-6 sm:gap-12 lg:gap-20 items-center ${
                isReversed ? "lg:[direction:rtl]" : ""
              }`}
            >
              <div className={isReversed ? "lg:[direction:ltr]" : ""}>
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-5"
                  style={{
                    backgroundColor: "#EEF4FF",
                    border: "1px solid #DDE7FF",
                  }}
                >
                  <item.icon
                    className="w-5 h-5"
                    style={{ color: "#1E1E24" }}
                    strokeWidth={1.5}
                  />
                </div>
                <h3 className="text-2xl sm:text-[28px] font-bold text-gray-900 leading-tight mb-4">
                  {item.title}
                </h3>
                <p className="text-gray-500 leading-relaxed text-lg">
                  {item.description}
                </p>
              </div>
              <div className={isReversed ? "lg:[direction:ltr]" : ""}>
                {item.visual}
              </div>
            </div>
          </RevealOnScroll>
        );
      })}
    </div>
  );
}

export default function Mieterportal() {
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
                  Mieterportal
                </span>
              </div>
              <h1 className="text-2xl sm:text-[32px] md:text-[40px] lg:text-[48px] font-bold text-gray-900 leading-[1.1] tracking-tight">
                Self-Service{" "}
                <span className="text-[#3c8af7]">
                  f&uuml;r Ihre Mieter
                </span>
              </h1>
              <p className="mt-6 text-lg sm:text-[20px] text-gray-500 leading-relaxed max-w-[540px]">
                Geben Sie Ihren Mietern ein eigenes Portal &ndash; f&uuml;r
                Dokumente, Kommunikation und Z&auml;hlerst&auml;nde. Weniger
                R&uuml;ckfragen, mehr Transparenz, zufriedenere Mieter.
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
              <PortalMockup />
            </RevealOnScroll>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-[1200px] mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-[#3c8af7] uppercase tracking-wide mb-3">
                Leistungsumfang
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">
                Alles, was Ihre Mieter brauchen
              </h2>
              <p className="text-gray-500 max-w-[700px] mx-auto">
                Das Mieterportal bietet Ihren Mietern alle wichtigen
                Funktionen an einem Ort &ndash; sicher, &uuml;bersichtlich
                und jederzeit erreichbar.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <RevealOnScroll key={feature.title} delay={i * 80}>
                <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow h-full">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-5"
                    style={{
                      backgroundColor: "#EEF4FF",
                      border: "1px solid #DDE7FF",
                    }}
                  >
                    <feature.icon
                      className="w-5 h-5"
                      style={{ color: "#1E1E24" }}
                      strokeWidth={1.5}
                    />
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
                Im Detail
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">
                So arbeiten Ihre Mieter mit dem Portal
              </h2>
              <p className="text-gray-500 max-w-[700px] mx-auto">
                Dokumente einsehen, Anliegen melden, Z&auml;hlerst&auml;nde
                erfassen &ndash; alles digital und nachvollziehbar.
              </p>
            </div>
          </RevealOnScroll>

          <FeatureShowcase />
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-[1200px] mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-[#3c8af7] uppercase tracking-wide mb-3">
                So funktioniert&apos;s
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">
                In 3 Schritten zum Mieterportal
              </h2>
            </div>
          </RevealOnScroll>

          <div className="grid lg:grid-cols-2 gap-6 sm:gap-12 lg:gap-20 items-start">
            <RevealOnScroll>
              <div className="space-y-0">
                {STEPS.map((s, i) => (
                  <StepCard
                    key={s.step}
                    step={s.step}
                    title={s.title}
                    description={s.description}
                    isLast={i === STEPS.length - 1}
                  />
                ))}
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={100}>
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
                <div className="bg-gradient-to-r from-[#3c8af7] to-[#3579de] p-6 sm:p-8 text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">
                        Mieterportal
                      </h3>
                      <p className="text-white/80 text-sm">
                        Alles an einem Ort f&uuml;r Ihre Mieter
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8">
                  <div className="space-y-5">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                      Funktionen im &Uuml;berblick
                    </h4>

                    {[
                      {
                        icon: Home,
                        label: "Persönliches Dashboard",
                        desc: "Alle Infos auf einen Blick",
                      },
                      {
                        icon: FileText,
                        label: "Dokumenten-Zugriff",
                        desc: "Verträge, Abrechnungen & mehr",
                      },
                      {
                        icon: MessageSquare,
                        label: "Ticket-System",
                        desc: "Anliegen direkt melden",
                      },
                      {
                        icon: Gauge,
                        label: "Zählerstände erfassen",
                        desc: "Digital & automatisch zugeordnet",
                      },
                      {
                        icon: Bell,
                        label: "E-Mail-Benachrichtigungen",
                        desc: "Automatisch bei neuen Dokumenten",
                      },
                      {
                        icon: Shield,
                        label: "Sicherer Zugang",
                        desc: "Passwortgeschützt & verschlüsselt",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center gap-4 p-3.5 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: "#EEF4FF",
                            border: "1px solid #DDE7FF",
                          }}
                        >
                          <item.icon
                            className="w-4.5 h-4.5 text-[#3c8af7]"
                            strokeWidth={1.5}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {item.label}
                          </p>
                          <p className="text-xs text-gray-400">
                            {item.desc}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-300 ml-auto flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-[80px] px-6">
        <div className="max-w-[1200px] mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">
                Ihre Daten in sicheren H&auml;nden
              </h2>
              <p className="text-gray-500 leading-relaxed max-w-[600px] mx-auto">
                rentably wird in Deutschland betrieben und erf&uuml;llt die
                Anforderungen der DSGVO. Ihre Daten geh&ouml;ren Ihnen
                &ndash; heute und in Zukunft.
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
                Darum nutzen Vermieter das Mieterportal
              </h2>
              <p className="text-gray-500 max-w-[700px] mx-auto leading-relaxed">
                Weniger Aufwand f&uuml;r Sie, besserer Service f&uuml;r
                Ihre Mieter. Eine Win-Win-Situation f&uuml;r alle.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
            {BENEFITS.map((benefit, i) => (
              <RevealOnScroll
                key={benefit.title}
                delay={i * 80}
                className="h-full"
              >
                <div className="bg-white rounded-xl p-6 sm:p-8 border border-gray-100 shadow-sm h-full text-center">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
                    style={{
                      backgroundColor: "#E0EDFF",
                      border: "1px solid #C7DCFF",
                    }}
                  >
                    <benefit.icon
                      className="w-6 h-6 text-[#3c8af7]"
                      strokeWidth={1.5}
                    />
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
                Testen Sie rentably jetzt kostenlos und unverbindlich.
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
                Weitere Funktionen f&uuml;r Vermieter
              </h2>
              <p className="text-gray-500 max-w-[700px] mx-auto">
                rentably bietet Ihnen umfangreiche Funktionen, die Ihre
                Immobilienverwaltung auf das n&auml;chste Level bringen.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {OTHER_FEATURES.map((feature, i) => {
              const content = (
                <div className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer h-full">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                    style={{
                      backgroundColor: "#EEF4FF",
                      border: "1px solid #DDE7FF",
                    }}
                  >
                    <feature.icon
                      className="w-5 h-5"
                      style={{ color: "#1E1E24" }}
                      strokeWidth={1.5}
                    />
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
                <RevealOnScroll
                  key={feature.title}
                  delay={i * 80}
                  className="h-full"
                >
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

      <FaqSection pageSlug="mieterportal" />

      <section className="py-12 sm:py-[80px] px-6 bg-[#f8fafc]">
        <div className="max-w-[800px] mx-auto">
          <RevealOnScroll>
            <h2 className="text-2xl sm:text-[28px] font-bold text-gray-900 tracking-tight leading-tight mb-6">
              Mieterportal f&uuml;r Vermieter &ndash; Self-Service f&uuml;r zufriedene Mieter und weniger Aufwand
            </h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                Vermieter erhalten regelm&auml;&szlig;ig die gleichen Anfragen: &bdquo;Wo finde ich meinen
                Mietvertrag?&ldquo;, &bdquo;K&ouml;nnen Sie mir die Nebenkostenabrechnung nochmal
                schicken?&ldquo;, &bdquo;Wem melde ich einen Defekt?&ldquo; Jede dieser Fragen kostet
                Zeit &ndash; Zeit, die Sie besser in die Verwaltung Ihrer Immobilien investieren
                k&ouml;nnten.
              </p>
              <p>
                Mit dem rentably Mieterportal erhalten Ihre Mieter einen eigenen, passwortgesch&uuml;tzten
                Zugang zu allen relevanten Informationen: Vertragsdaten, freigegebene Dokumente wie
                Nebenkostenabrechnungen und Hausordnung, ein Ticket-System f&uuml;r Anfragen und die
                M&ouml;glichkeit, Z&auml;hlerst&auml;nde selbstst&auml;ndig zu erfassen. Alle Daten flie&szlig;en
                automatisch in Ihre Verwaltung zur&uuml;ck.
              </p>
              <p>
                Sie aktivieren das Portal f&uuml;r jeden Mieter mit einem Klick &ndash; die
                Einladungs-E-Mail mit Zugangsdaten wird automatisch versendet. Sie bestimmen,
                welche Informationen sichtbar sind. Das Ergebnis: weniger R&uuml;ckfragen, mehr
                Transparenz und zufriedenere Mieter. Das Portal ist DSGVO-konform, verschl&uuml;sselt
                und von jedem Ger&auml;t erreichbar.
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <section className="py-24 px-6">
        <RevealOnScroll>
          <div className="max-w-[1200px] mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 tracking-tight mb-4">
              Bereit f&uuml;r zufriedenere Mieter?
            </h2>
            <p className="text-gray-500 mb-10 max-w-lg mx-auto">
              Registrieren Sie sich kostenlos und aktivieren Sie das
              Mieterportal f&uuml;r Ihre Immobilien &ndash; ohne
              Kreditkarte.
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
