import { Star, Quote } from "lucide-react";
import { RevealOnScroll } from "../common/RevealOnScroll";

const TESTIMONIALS = [
  {
    name: "Thomas M.",
    role: "Vermieter, 4 Wohnungen",
    text: "Seit ich rentably nutze, habe ich endlich den Überblick über alle Mietverhältnisse. Die Betriebskostenabrechnung dauert keine Stunden mehr, sondern Minuten.",
    stars: 5,
    image: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200",
  },
  {
    name: "Sandra K.",
    role: "Eigentümerin, 2 Objekte",
    text: "Ich habe lange nach einer einfachen Lösung gesucht. rentably ist genau das — übersichtlich, schnell und vor allem kostenlos für meine Bedürfnisse.",
    stars: 5,
    image: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200",
  },
  {
    name: "Michael R.",
    role: "Privatvermieter, 7 Einheiten",
    text: "Das Mieterportal hat die Kommunikation mit meinen Mietern komplett verändert. Alles ist dokumentiert und nachvollziehbar. Kann ich nur empfehlen.",
    stars: 5,
    image: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=200",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-[100px] px-6">
      <div className="max-w-[1200px] mx-auto">
        <RevealOnScroll>
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">
              Das sagen unsere Nutzer
            </h2>
            <p className="text-gray-500 max-w-[600px] mx-auto">
              Tausende Vermieter verwalten ihre Immobilien bereits mit rentably
              — kostenlos und ohne Kompromisse.
            </p>
          </div>
        </RevealOnScroll>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <RevealOnScroll key={t.name} delay={i * 80}>
              <div className="bg-white border border-[#e5e7eb] rounded-xl p-8 hover:shadow-md transition-shadow relative">
                <Quote className="w-8 h-8 text-[#3c8af7]/15 absolute top-6 right-6" />
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-[#f59e0b] text-[#f59e0b]"
                    />
                  ))}
                </div>
                <p className="text-gray-600 leading-relaxed mb-6">{t.text}</p>
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
