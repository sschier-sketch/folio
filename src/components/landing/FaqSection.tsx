import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { RevealOnScroll } from "../common/RevealOnScroll";

const FAQ_ITEMS = [
  {
    question: "Ist Rentably wirklich kostenlos?",
    answer:
      "Ja. Der Basic-Tarif ist dauerhaft kostenlos — ohne zeitliche Begrenzung und ohne versteckte Kosten. Sie können unbegrenzt viele Immobilien, Einheiten und Mieter verwalten. Für erweiterte Funktionen wie Betriebskostenabrechnungen, Mahnwesen oder das Mieterportal steht der Pro-Tarif zur Verfügung.",
  },
  {
    question: "Was passiert nach den 30 Tagen Pro-Testphase?",
    answer:
      "Nach Ablauf der 30 Tage wird Ihr Account automatisch auf den kostenlosen Basic-Tarif umgestellt. Sie verlieren keine Daten. Alle Basic-Funktionen bleiben weiterhin verfügbar. Wenn Sie Pro-Funktionen weiter nutzen möchten, können Sie jederzeit ein Upgrade durchführen.",
  },
  {
    question: "Gibt es Limits bei der Anzahl an Immobilien oder Mietern?",
    answer:
      "Nein. Sowohl im Basic- als auch im Pro-Tarif können Sie unbegrenzt viele Immobilien, Einheiten und Mieter anlegen. Wir berechnen keine Gebühren pro Objekt oder pro Mieter — anders als viele andere Anbieter.",
  },
  {
    question: "Brauche ich eine Kreditkarte für die Registrierung?",
    answer:
      "Nein. Für die Registrierung und die 30-tägige Pro-Testphase benötigen Sie keine Zahlungsdaten. Erst wenn Sie sich nach der Testphase für den Pro-Tarif entscheiden, werden Zahlungsinformationen benötigt.",
  },
  {
    question: "Wo werden meine Daten gespeichert?",
    answer:
      "Alle Daten werden auf europäischen Servern in Deutschland gehostet. Rentably ist vollständig DSGVO-konform. Ihre Daten werden nicht an Dritte weitergegeben.",
  },
  {
    question: "Kann ich Rentably auch für WEG-Verwaltung nutzen?",
    answer:
      "Rentably ist primär für private Vermieter und Eigentümer konzipiert. Sie können sowohl Miet- als auch Eigentumsobjekte verwalten und Hausgeld-Zahlungen für WEG-Einheiten erfassen.",
  },
  {
    question: "Kann ich jederzeit kündigen?",
    answer:
      "Ja. Der Pro-Tarif ist monatlich oder jährlich kündbar. Es gibt keine Mindestlaufzeit. Nach der Kündigung behalten Sie Zugriff auf alle Basic-Funktionen und Ihre gespeicherten Daten.",
  },
];

function FaqItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-5 text-left gap-4"
      >
        <span className="text-base font-medium text-gray-900">{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? "max-h-[400px] pb-5" : "max-h-0"
        }`}
      >
        <p className="text-gray-500 leading-relaxed pr-8">{answer}</p>
      </div>
    </div>
  );
}

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-[100px] px-6">
      <div className="max-w-[800px] mx-auto">
        <RevealOnScroll>
          <h2 className="text-3xl sm:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4 text-center">
            Häufig gestellte Fragen
          </h2>
          <p className="text-gray-500 leading-relaxed mb-12 text-center max-w-[560px] mx-auto">
            Alles Wichtige auf einen Blick — von Kosten über Datenschutz
            bis zu den Funktionen von Rentably.
          </p>
        </RevealOnScroll>
        <RevealOnScroll delay={80}>
          <div className="bg-white border border-gray-200 rounded-2xl px-8">
            {FAQ_ITEMS.map((item, i) => (
              <FaqItem
                key={item.question}
                question={item.question}
                answer={item.answer}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            ))}
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
