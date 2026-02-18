import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { RevealOnScroll } from "../common/RevealOnScroll";
import { supabase } from "../../lib/supabase";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
}

const PRICING_FALLBACK_FAQS: FaqItem[] = [
  {
    id: "p1",
    question: "Ist rentably wirklich kostenlos?",
    answer:
      "Ja. Der Basic-Tarif ist dauerhaft kostenlos — ohne zeitliche Begrenzung und ohne versteckte Kosten. Sie können unbegrenzt viele Immobilien, Einheiten und Mieter verwalten.",
    sort_order: 1,
  },
  {
    id: "p2",
    question: "Was passiert nach den 30 Tagen Pro-Testphase?",
    answer:
      "Nach Ablauf der 30 Tage wird Ihr Account automatisch auf den kostenlosen Basic-Tarif umgestellt. Sie verlieren keine Daten. Alle Basic-Funktionen bleiben weiterhin verfügbar. Wenn Sie Pro-Funktionen weiter nutzen möchten, können Sie jederzeit ein Upgrade durchführen.",
    sort_order: 2,
  },
  {
    id: "p3",
    question: "Brauche ich eine Kreditkarte für die Registrierung?",
    answer:
      "Nein. Für die Registrierung und die 30-tägige Pro-Testphase benötigen Sie keine Zahlungsdaten. Erst wenn Sie sich nach der Testphase für den Pro-Tarif entscheiden, werden Zahlungsinformationen benötigt.",
    sort_order: 3,
  },
  {
    id: "p4",
    question: "Kann ich jederzeit kündigen?",
    answer:
      "Ja. Der Pro-Tarif ist monatlich oder jährlich kündbar. Es gibt keine Mindestlaufzeit. Nach der Kündigung behalten Sie Zugriff auf alle Basic-Funktionen und Ihre gespeicherten Daten.",
    sort_order: 4,
  },
  {
    id: "p5",
    question: "Gibt es Limits bei der Anzahl an Immobilien oder Mietern?",
    answer:
      "Nein. Sowohl im Basic- als auch im Pro-Tarif können Sie unbegrenzt viele Immobilien, Einheiten und Mieter anlegen. Wir berechnen keine Gebühren pro Objekt oder pro Mieter.",
    sort_order: 5,
  },
  {
    id: "p6",
    question: "Kann ich zwischen monatlicher und jährlicher Abrechnung wechseln?",
    answer:
      "Ja. Sie können jederzeit von monatlicher auf jährliche Abrechnung umstellen und dabei von der Ersparnis profitieren. Ein Wechsel ist direkt in Ihren Kontoeinstellungen möglich.",
    sort_order: 6,
  },
  {
    id: "p7",
    question: "Kann ich die Kosten steuerlich absetzen?",
    answer:
      "In der Regel ja. Die Kosten für eine Immobilienverwaltungssoftware können als Werbungskosten bei Einkünften aus Vermietung und Verpachtung steuerlich geltend gemacht werden. Bitte wenden Sie sich für eine verbindliche Auskunft an Ihren Steuerberater.",
    sort_order: 7,
  },
];

const FALLBACK_FAQS: FaqItem[] = [
  {
    id: "1",
    question: "Ist rentably wirklich kostenlos?",
    answer:
      "Ja. Der Basic-Tarif ist dauerhaft kostenlos — ohne zeitliche Begrenzung und ohne versteckte Kosten. Sie können unbegrenzt viele Immobilien, Einheiten und Mieter verwalten. Für erweiterte Funktionen wie Betriebskostenabrechnungen, Mahnwesen oder das Mieterportal steht der Pro-Tarif zur Verfügung.",
    sort_order: 1,
  },
  {
    id: "2",
    question: "Was passiert nach den 30 Tagen Pro-Testphase?",
    answer:
      "Nach Ablauf der 30 Tage wird Ihr Account automatisch auf den kostenlosen Basic-Tarif umgestellt. Sie verlieren keine Daten. Alle Basic-Funktionen bleiben weiterhin verfügbar. Wenn Sie Pro-Funktionen weiter nutzen möchten, können Sie jederzeit ein Upgrade durchführen.",
    sort_order: 2,
  },
  {
    id: "3",
    question: "Gibt es Limits bei der Anzahl an Immobilien oder Mietern?",
    answer:
      "Nein. Sowohl im Basic- als auch im Pro-Tarif können Sie unbegrenzt viele Immobilien, Einheiten und Mieter anlegen. Wir berechnen keine Gebühren pro Objekt oder pro Mieter — anders als viele andere Anbieter.",
    sort_order: 3,
  },
  {
    id: "4",
    question: "Brauche ich eine Kreditkarte für die Registrierung?",
    answer:
      "Nein. Für die Registrierung und die 30-tägige Pro-Testphase benötigen Sie keine Zahlungsdaten. Erst wenn Sie sich nach der Testphase für den Pro-Tarif entscheiden, werden Zahlungsinformationen benötigt.",
    sort_order: 4,
  },
  {
    id: "5",
    question: "Wo werden meine Daten gespeichert?",
    answer:
      "Alle Daten werden auf europäischen Servern in Deutschland gehostet. Rentably ist vollständig DSGVO-konform. Ihre Daten werden nicht an Dritte weitergegeben.",
    sort_order: 5,
  },
  {
    id: "6",
    question: "Kann ich rentably auch für WEG-Verwaltung nutzen?",
    answer:
      "Rentably ist primär für private Vermieter und Eigentümer konzipiert. Sie können sowohl Miet- als auch Eigentumsobjekte verwalten und Hausgeld-Zahlungen für WEG-Einheiten erfassen.",
    sort_order: 6,
  },
  {
    id: "7",
    question: "Kann ich jederzeit kündigen?",
    answer:
      "Ja. Der Pro-Tarif ist monatlich oder jährlich kündbar. Es gibt keine Mindestlaufzeit. Nach der Kündigung behalten Sie Zugriff auf alle Basic-Funktionen und Ihre gespeicherten Daten.",
    sort_order: 7,
  },
];

function FaqAccordionItem({
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
        <p className="text-gray-500 leading-relaxed pr-4 sm:pr-8">{answer}</p>
      </div>
    </div>
  );
}

interface FaqSectionProps {
  pageSlug?: string;
}

export default function FaqSection({ pageSlug = "landing" }: FaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const fallback =
    pageSlug === "landing"
      ? FALLBACK_FAQS
      : pageSlug === "pricing"
        ? PRICING_FALLBACK_FAQS
        : [];
  const [items, setItems] = useState<FaqItem[]>(fallback);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("faqs")
        .select("id, question, answer, sort_order")
        .eq("page_slug", pageSlug)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (!error && data && data.length > 0) {
        setItems(data);
      }
    }
    load();
  }, [pageSlug]);

  if (items.length === 0) return null;

  return (
    <section className="py-16 sm:py-[100px] px-6">
      <div className="max-w-[800px] mx-auto">
        <RevealOnScroll>
          <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4 text-center">
            Häufig gestellte Fragen
          </h2>
          <p className="text-gray-500 leading-relaxed mb-12 text-center max-w-[560px] mx-auto">
            Alles Wichtige auf einen Blick — von Kosten über Datenschutz bis
            zu den Funktionen von rentably.
          </p>
        </RevealOnScroll>
        <RevealOnScroll delay={80}>
          <div className="bg-white border border-gray-200 rounded-2xl px-4 sm:px-8">
            {items.map((item, i) => (
              <FaqAccordionItem
                key={item.id}
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
