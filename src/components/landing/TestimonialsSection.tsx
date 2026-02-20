import { useState } from "react";
import { Star, Quote } from "lucide-react";
import { RevealOnScroll } from "../common/RevealOnScroll";

type Category = "private" | "hausverwaltung" | "investor";

interface Testimonial {
  name: string;
  role: string;
  text: string;
  stars: number;
  image: string;
  category: Category;
}

const CATEGORIES: { key: Category; label: string }[] = [
  { key: "private", label: "Private Vermieter" },
  { key: "hausverwaltung", label: "Hausverwaltungen" },
  { key: "investor", label: "Immobilieninvestoren" },
];

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Thomas M.",
    role: "Vermieter, 4 Wohnungen",
    text: "Seit ich rentably nutze, habe ich endlich den Überblick über alle Mietverhältnisse. Die Betriebskostenabrechnung dauert keine Stunden mehr, sondern Minuten.",
    stars: 5,
    image:
      "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200",
    category: "private",
  },
  {
    name: "Sandra K.",
    role: "Eigentümerin, 2 Objekte",
    text: "Ich habe lange nach einer einfachen Lösung gesucht. Rentably ist genau das — übersichtlich, schnell und vor allem kostenlos für meine Bedürfnisse.",
    stars: 5,
    image:
      "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200",
    category: "private",
  },
  {
    name: "Michael R.",
    role: "Privatvermieter, 7 Einheiten",
    text: "Das Mieterportal hat die Kommunikation mit meinen Mietern komplett verändert. Alles ist dokumentiert und nachvollziehbar. Kann ich nur empfehlen.",
    stars: 5,
    image:
      "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=200",
    category: "private",
  },
  {
    name: "Petra W.",
    role: "Hausverwaltung, 85 Einheiten",
    text: "Wir verwalten mehrere Liegenschaften und rentably hat unsere internen Prozesse enorm beschleunigt. Die Dokumentenverwaltung und das Ticketsystem sparen uns täglich Zeit.",
    stars: 5,
    image:
      "https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=200",
    category: "hausverwaltung",
  },
  {
    name: "Markus F.",
    role: "Geschäftsführer, WEG-Verwaltung",
    text: "Die Struktur mit Einheiten, Mietern und Verträgen bildet unseren Arbeitsalltag perfekt ab. Endlich ein Tool, das für professionelle Verwalter gemacht ist.",
    stars: 5,
    image:
      "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=200",
    category: "hausverwaltung",
  },
  {
    name: "Julia H.",
    role: "Immobilienverwalterin, 120 Einheiten",
    text: "Seit der Umstellung auf rentably haben wir deutlich weniger Rückfragen von Mietern. Das Mieterportal schafft Transparenz und entlastet unser Team.",
    stars: 5,
    image:
      "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=200",
    category: "hausverwaltung",
  },
  {
    name: "Andreas B.",
    role: "Investor, 12 Objekte",
    text: "Die Finanzübersicht mit Renditeberechnung und Cashflow-Analyse ist für mich als Investor unverzichtbar. Ich sehe sofort, welche Objekte performen.",
    stars: 5,
    image:
      "https://images.pexels.com/photos/3785079/pexels-photo-3785079.jpeg?auto=compress&cs=tinysrgb&w=200",
    category: "investor",
  },
  {
    name: "Claudia S.",
    role: "Investorin, 6 Mehrfamilienhäuser",
    text: "rentably gibt mir den kompletten Überblick über mein Portfolio. Von Mieteinnahmen bis Darlehen — alles an einem Ort. Genau das habe ich gesucht.",
    stars: 5,
    image:
      "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200",
    category: "investor",
  },
  {
    name: "Stefan D.",
    role: "Immobilieninvestor, 20+ Einheiten",
    text: "Als ich angefangen habe zu skalieren, brauchte ich ein System, das mitwächst. Rentably deckt alles ab — Verträge, Zahlungen, Dokumente. Absolut empfehlenswert.",
    stars: 5,
    image:
      "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=200",
    category: "investor",
  },
];

export default function TestimonialsSection() {
  const [active, setActive] = useState<Category>("private");

  const filtered = TESTIMONIALS.filter((t) => t.category === active);

  return (
    <section className="py-16 sm:py-[100px] px-6">
      <div className="max-w-[1200px] mx-auto">
        <RevealOnScroll>
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">
              Das sagen unsere Nutzer
            </h2>
            <p className="text-gray-500 max-w-[600px] mx-auto mb-10">
              Immer mehr Vermieter verwalten ihre Immobilien bereits mit rentably
              — kostenlos und ohne Kompromisse.
            </p>

            <div className="inline-flex flex-wrap justify-center bg-gray-100 rounded-xl p-1 gap-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActive(cat.key)}
                  className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    active === cat.key
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </RevealOnScroll>

        <div className="grid md:grid-cols-3 gap-6" key={active}>
          {filtered.map((t, i) => (
            <RevealOnScroll key={`${active}-${t.name}`} delay={i * 80}>
              <div className="bg-white border border-[#e5e7eb] rounded-xl p-6 sm:p-8 hover:shadow-md transition-shadow relative h-full flex flex-col">
                <Quote className="w-8 h-8 text-[#3c8af7]/15 absolute top-6 right-6" />
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star
                      key={j}
                      className="w-4 h-4 fill-[#f59e0b] text-[#f59e0b]"
                    />
                  ))}
                </div>
                <p className="text-gray-600 leading-relaxed mb-6 flex-1">
                  {t.text}
                </p>
                <div className="flex items-center gap-3">
                  <img
                    src={t.image}
                    alt={t.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {t.name}
                    </div>
                    <div className="text-xs text-gray-400">{t.role}</div>
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
