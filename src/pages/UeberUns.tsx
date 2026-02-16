import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { withRef } from "../lib/referralTracking";
import { RevealOnScroll } from "../components/common/RevealOnScroll";
import TestimonialsSection from "../components/landing/TestimonialsSection";
import {
  Heart,
  Sparkles,
  Eye,
  ShieldCheck,
  Handshake,
  Target,
  Building2,
  Users,
  Headphones,
  ArrowRight,
  Linkedin,
  ChevronDown,
  Rocket,
  Lightbulb,
  TrendingUp,
  Globe,
} from "lucide-react";

const VALUES = [
  {
    icon: Heart,
    title: "Kundenfokus",
    text: "Wir hören aktiv zu und entwickeln Lösungen, die echte Probleme unserer Nutzer lösen. Jede Funktion entsteht aus dem Dialog mit Vermietern.",
  },
  {
    icon: Sparkles,
    title: "Einfachheit",
    text: "Komplexe Verwaltungsprozesse auf das Wesentliche reduziert. Kein Handbuch nötig, keine Schulung erforderlich — einfach loslegen.",
  },
  {
    icon: Eye,
    title: "Transparenz",
    text: "Klare Preise, keine versteckten Kosten. Sie sehen jederzeit, was passiert und behalten die volle Kontrolle über Ihre Daten.",
  },
  {
    icon: ShieldCheck,
    title: "Datenschutz",
    text: "Alle Daten werden DSGVO-konform auf europäischen Servern gespeichert. Ihre Immobiliendaten gehören Ihnen — immer.",
  },
  {
    icon: Handshake,
    title: "Verantwortung",
    text: "Wir übernehmen Verantwortung für unsere Arbeit und handeln im besten Interesse unserer Kunden. Qualität steht vor Quantität.",
  },
  {
    icon: Target,
    title: "Innovation",
    text: "Wir gestalten Veränderung aktiv und treiben die Digitalisierung der Immobilienverwaltung voran — praxisnah und zukunftssicher.",
  },
];

const PILLARS = [
  {
    icon: Headphones,
    title: "Kunden im Fokus",
    text: "Bei rentably stehen Sie nicht allein. Unser Support-Team begleitet Sie persönlich und sorgt dafür, dass keine Frage unbeantwortet bleibt. Ob per E-Mail oder WhatsApp — wir sind da, wo Sie uns brauchen.",
    image:
      "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    icon: Building2,
    title: "Smarte Softwarelösung",
    text: "Immobilienverwaltung fühlt sich für viele Vermieter wie ein ständiger Balanceakt an. Genau hier setzt rentably an. Wir sind mehr als nur Software — wir sind Ihr digitaler Partner, der Ihnen den Rücken freihält.",
    image:
      "https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    icon: ShieldCheck,
    title: "Sicherheit für Ihre Daten",
    text: "In der Immobilienverwaltung geht es um sensible Informationen. Bei rentably steht Datensicherheit an erster Stelle. Alle Daten werden in zertifizierten europäischen Rechenzentren gespeichert — DSGVO-konform und verschlüsselt.",
    image:
      "https://images.pexels.com/photos/60504/security-protection-anti-virus-software-60504.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
];

const FOUNDERS = [
  {
    name: "Simon Schier",
    role: "Co-Founder",
    bio: "Simon verantwortet die technische Entwicklung von rentably. Mit seinem Hintergrund in Softwareentwicklung und Produktdesign sorgt er dafür, dass Vermieter eine sichere, stabile und innovative Lösung nutzen können.",
    image: "/simon-schier.png",
    linkedin: "https://www.linkedin.com/in/simonschier/",
  },
  {
    name: "Philipp Roth",
    role: "Co-Founder",
    bio: "Philipp bringt seine Erfahrung in Marketing und Unternehmensentwicklung ein, um rentably zur führenden Plattform für private Immobilienverwaltung zu machen. Seine Vision: Verwaltung so einfach wie möglich.",
    image: "/philipp-roth.png",
    linkedin: "https://www.linkedin.com/in/mr-philipproth/",
  },
];

const TIMELINE = [
  {
    year: "2024",
    title: "Idee & erste Prototypen",
    text: "Die Idee zu rentably entsteht aus der Frustration über bestehende Lösungen. Erste Prototypen werden entwickelt und mit Vermietern getestet.",
    icon: Lightbulb,
  },
  {
    year: "2025",
    title: "Closed Beta & Weiterentwicklung",
    text: "Ausgewählte Vermieter testen rentably im Alltag. Das Feedback fließt direkt in die Produktentwicklung ein — Feature für Feature.",
    icon: Rocket,
  },
  {
    year: "2026",
    title: "Öffentlicher Launch",
    text: "rentably geht live. Tausende Vermieter verwalten ihre Immobilien digital — mit einer Software, die mitdenkt.",
    icon: TrendingUp,
  },
  {
    year: "Zukunft",
    title: "Wachstum & Expansion",
    text: "Neue Features, Integrationen und der Ausbau für professionelle Hausverwaltungen stehen auf der Roadmap.",
    icon: Globe,
  },
];

const ABOUT_FAQS = [
  {
    question: "Wer steckt hinter rentably?",
    answer:
      "rentably wurde von Simon Schier und Philipp Roth gegründet — zwei Unternehmer, die selbst als Vermieter die Herausforderungen der Immobilienverwaltung kennen. Unser Ziel ist es, private Vermieter mit einer modernen, einfachen Software zu unterstützen.",
  },
  {
    question: "Ist rentably wirklich kostenlos?",
    answer:
      "Ja. Der Basic-Tarif ist dauerhaft kostenlos — ohne zeitliche Begrenzung und ohne versteckte Kosten. Sie können unbegrenzt viele Immobilien, Einheiten und Mieter verwalten. Für erweiterte Funktionen steht der Pro-Tarif zur Verfügung.",
  },
  {
    question: "Wo werden meine Daten gespeichert?",
    answer:
      "Alle Daten werden auf europäischen Servern gehostet. rentably ist vollständig DSGVO-konform. Ihre Daten werden nicht an Dritte weitergegeben und gehören ausschließlich Ihnen.",
  },
  {
    question: "Für wen ist rentably geeignet?",
    answer:
      "rentably ist primär für private Vermieter und Eigentümer konzipiert, die eine bis mehrere Immobilien verwalten. Auch kleinere Hausverwaltungen und Immobilieninvestoren profitieren von der Software.",
  },
  {
    question: "Wie kann ich rentably kontaktieren?",
    answer:
      "Sie erreichen uns per E-Mail an hallo@rentab.ly oder über WhatsApp. Unser Support-Team ist Montag bis Freitag von 9:00 bis 18:00 Uhr für Sie da.",
  },
  {
    question: "Kann ich jederzeit kündigen?",
    answer:
      "Ja. Der Pro-Tarif ist monatlich oder jährlich kündbar. Es gibt keine Mindestlaufzeit. Nach der Kündigung behalten Sie Zugriff auf alle Basic-Funktionen und Ihre gespeicherten Daten.",
  },
];

export default function UeberUns() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div>
      <HeroSection />
      <MissionSection />
      <ValuesSection />
      <PillarsSection />
      <FoundersSection />
      <TimelineSection />
      <TestimonialsSection />

      <section className="py-[100px] px-6 bg-gray-50">
        <div className="max-w-[800px] mx-auto">
          <RevealOnScroll>
            <h2 className="text-3xl sm:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4 text-center">
              Häufig gestellte Fragen
            </h2>
            <p className="text-gray-500 leading-relaxed mb-12 text-center max-w-[560px] mx-auto">
              Alles Wichtige über rentably — von den Gründern über Datenschutz
              bis zu den Funktionen.
            </p>
          </RevealOnScroll>
          <RevealOnScroll delay={80}>
            <div className="bg-white border border-gray-200 rounded-2xl px-8">
              {ABOUT_FAQS.map((item, i) => (
                <div
                  key={i}
                  className="border-b border-gray-200 last:border-b-0"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between py-5 text-left gap-4"
                  >
                    <span className="text-base font-medium text-gray-900">
                      {item.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
                        openFaq === i ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-200 ${
                      openFaq === i ? "max-h-[400px] pb-5" : "max-h-0"
                    }`}
                  >
                    <p className="text-gray-500 leading-relaxed pr-8">
                      {item.answer}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <section className="py-[120px] px-6 bg-gray-950">
        <RevealOnScroll>
          <div className="max-w-[1200px] mx-auto text-center">
            <h2 className="text-3xl sm:text-[36px] font-bold text-white tracking-tight leading-tight mb-4">
              Bereit, Ihre Verwaltung zu vereinfachen?
            </h2>
            <p className="text-gray-400 mb-10 max-w-lg mx-auto">
              Erstellen Sie Ihren Account in unter einer Minute. Komplett
              kostenlos im Basic-Tarif — und 30 Tage alle Pro-Funktionen
              inklusive.
            </p>
            <button
              onClick={() => navigate(withRef("/signup"))}
              className="h-12 px-8 rounded-lg text-base font-semibold bg-[#3c8af7] text-white hover:bg-[#3579de] transition-colors inline-flex items-center gap-2"
            >
              Jetzt kostenlos starten
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </RevealOnScroll>
      </section>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="pt-16 sm:pt-24 pb-[100px] px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <RevealOnScroll>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#3c8af7]/5 border border-[#3c8af7]/15 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3c8af7]" />
              <span className="text-sm font-medium text-[#3c8af7]">
                Über uns
              </span>
            </div>
            <h1 className="text-[40px] sm:text-[48px] lg:text-[56px] font-bold text-gray-900 leading-[1.1] tracking-tight">
              Wir machen Immobilien&shy;verwaltung{" "}
              <span className="text-[#3c8af7]">einfach.</span>
            </h1>
            <p className="mt-6 text-lg sm:text-[20px] text-gray-500 leading-relaxed max-w-[540px]">
              rentably entstand aus der Überzeugung, dass private Vermieter
              bessere Werkzeuge verdienen — ohne die Komplexität und Kosten
              professioneller Hausverwaltungssoftware.
            </p>
            <div className="mt-8 flex flex-wrap gap-6">
              {[
                { value: "2.000+", label: "Aktive Vermieter" },
                { value: "5.000+", label: "Verwaltete Einheiten" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={100} className="hidden lg:block">
            <div className="rounded-2xl overflow-hidden shadow-lg shadow-gray-900/[0.06]">
              <img
                src="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Das rentably Team bei der Arbeit"
                className="w-full h-[480px] object-cover"
              />
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}

function MissionSection() {
  return (
    <section className="py-[100px] px-6 bg-gray-50">
      <div className="max-w-[800px] mx-auto">
        <RevealOnScroll>
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#3c8af7]/5 border border-[#3c8af7]/15 mb-6">
              <span className="text-sm font-medium text-[#3c8af7]">
                Unsere Mission
              </span>
            </div>
          </div>
        </RevealOnScroll>
        <RevealOnScroll delay={80}>
          <div className="bg-white border border-gray-200 rounded-2xl p-8 sm:p-12">
            <p className="text-gray-600 leading-relaxed text-center text-lg sm:text-xl">
              Immobilienverwaltung für jeden zugänglich machen. Egal ob Sie eine
              Eigentumswohnung oder ein wachsendes Portfolio verwalten — rentably
              gibt Ihnen die Werkzeuge, die bisher nur großen Hausverwaltungen
              vorbehalten waren.{" "}
              <span className="font-semibold text-gray-800">
                Digital, übersichtlich und fair bepreist.
              </span>
            </p>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}

function ValuesSection() {
  return (
    <section className="py-[100px] px-6">
      <div className="max-w-[1200px] mx-auto">
        <RevealOnScroll>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">
              Unsere Werte
            </h2>
            <p className="text-gray-500 max-w-[600px] mx-auto">
              Bei rentably leben wir Fortschritt für die Immobilienbranche und
              zukunftssichere Softwareentwicklung für unsere Kunden.
            </p>
          </div>
        </RevealOnScroll>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {VALUES.map((v, i) => (
            <RevealOnScroll key={v.title} delay={i * 60}>
              <div className="border border-gray-200 rounded-2xl p-7 hover:border-gray-300 hover:shadow-sm transition-all h-full">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-5"
                  style={{
                    backgroundColor: "#EEF4FF",
                    border: "1px solid #DDE7FF",
                  }}
                >
                  <v.icon className="w-5 h-5 text-[#3c8af7]" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">
                  {v.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {v.text}
                </p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}

function PillarsSection() {
  return (
    <section className="py-[100px] px-6 bg-gray-50">
      <div className="max-w-[1200px] mx-auto">
        <RevealOnScroll>
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">
              Dafür stehen wir
            </h2>
            <p className="text-gray-500 max-w-[600px] mx-auto">
              Drei Säulen, die rentably von anderen Lösungen unterscheiden.
            </p>
          </div>
        </RevealOnScroll>

        <div className="space-y-20">
          {PILLARS.map((pillar, i) => (
            <RevealOnScroll key={pillar.title} delay={80}>
              <div
                className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center ${
                  i % 2 === 1 ? "lg:direction-rtl" : ""
                }`}
              >
                <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-5"
                    style={{
                      backgroundColor: "#EEF4FF",
                      border: "1px solid #DDE7FF",
                    }}
                  >
                    <pillar.icon className="w-5 h-5 text-[#3c8af7]" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {pillar.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-lg">
                    {pillar.text}
                  </p>
                </div>
                <div className={i % 2 === 1 ? "lg:order-1" : ""}>
                  <div className="rounded-2xl overflow-hidden shadow-lg shadow-gray-900/[0.06]">
                    <img
                      src={pillar.image}
                      alt={pillar.title}
                      className="w-full h-[340px] object-cover"
                    />
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}

function FoundersSection() {
  return (
    <section className="py-[100px] px-6">
      <div className="max-w-[1200px] mx-auto">
        <RevealOnScroll>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#3c8af7]/5 border border-[#3c8af7]/15 mb-6">
              <Users className="w-3.5 h-3.5 text-[#3c8af7]" />
              <span className="text-sm font-medium text-[#3c8af7]">
                Wer wir sind
              </span>
            </div>
            <h2 className="text-3xl sm:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">
              Die Gründer
            </h2>
            <p className="text-gray-500 max-w-[600px] mx-auto">
              Zwei Unternehmer, die selbst als Vermieter die Herausforderungen
              der Immobilienverwaltung kennen — und eine bessere Lösung
              geschaffen haben.
            </p>
          </div>
        </RevealOnScroll>

        <div className="grid md:grid-cols-2 gap-8 max-w-[900px] mx-auto">
          {FOUNDERS.map((founder, i) => (
            <RevealOnScroll key={founder.name} delay={i * 100}>
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={founder.image}
                    alt={founder.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-7">
                  <h3 className="text-xl font-bold text-gray-900">
                    {founder.name}
                  </h3>
                  <p className="text-sm text-[#3c8af7] font-medium mt-1">
                    {founder.role}
                  </p>
                  <p className="text-sm text-gray-500 leading-relaxed mt-4">
                    {founder.bio}
                  </p>
                  <a
                    href={founder.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-5 text-sm font-medium text-gray-700 hover:text-[#3c8af7] transition-colors"
                  >
                    <Linkedin className="w-4 h-4" />
                    LinkedIn Profil
                  </a>
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}

function TimelineSection() {
  return (
    <section className="py-[100px] px-6 bg-gray-50">
      <div className="max-w-[800px] mx-auto">
        <RevealOnScroll>
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">
              Unser Weg
            </h2>
            <p className="text-gray-500 max-w-[500px] mx-auto">
              Von der ersten Idee zum Launch — die Geschichte von rentably.
            </p>
          </div>
        </RevealOnScroll>

        <div className="relative">
          <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-px bg-gray-200" />

          <div className="space-y-12">
            {TIMELINE.map((item, i) => (
              <RevealOnScroll key={item.year} delay={i * 80}>
                <div className="flex gap-6 sm:gap-8 relative">
                  <div
                    className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center flex-shrink-0 relative z-10 ${
                      i === TIMELINE.length - 1
                        ? "bg-[#3c8af7]/10 border-2 border-[#3c8af7]"
                        : ""
                    }`}
                    style={
                      i < TIMELINE.length - 1
                        ? {
                            backgroundColor: "#EEF4FF",
                            border: "1px solid #DDE7FF",
                          }
                        : undefined
                    }
                  >
                    <item.icon
                      className={`w-5 h-5 sm:w-6 sm:h-6 ${
                        i === TIMELINE.length - 1
                          ? "text-[#3c8af7]"
                          : "text-[#3c8af7]"
                      }`}
                    />
                  </div>
                  <div className="pt-1 sm:pt-3">
                    <span className="text-xs font-semibold text-[#3c8af7] uppercase tracking-wider">
                      {item.year}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 mt-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed mt-2 max-w-[480px]">
                      {item.text}
                    </p>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
