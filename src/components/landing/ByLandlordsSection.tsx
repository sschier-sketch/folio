import { useNavigate } from "react-router-dom";
import { withRef } from "../../lib/referralTracking";
import { CheckCircle2 } from "lucide-react";
import { RevealOnScroll } from "../common/RevealOnScroll";

const POINTS = [
  "30 Tage alle Pro-Funktionen kostenlos testen",
  "Unverbindlich und ohne Zahlungsdaten starten",
  "Von Vermietern für Vermieter — wir kennen Ihre Herausforderungen",
];

export default function ByLandlordsSection() {
  const navigate = useNavigate();

  return (
    <section className="py-[100px] px-6 bg-[#f0f5ff]">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <RevealOnScroll>
            <h2 className="text-3xl sm:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-6 max-w-[700px]">
              Entwickelt von Vermietern für Vermieter
            </h2>
            <p className="text-gray-600 leading-relaxed mb-8 max-w-[600px]">
              <span className="font-semibold text-gray-800">
                Was uns besonders macht:
              </span>{" "}
              Rentably wird von Vermietern für Vermieter entwickelt. Unser Team
              vereint junge Talente der Immobilienbranche mit erfahrenen
              Eigentümern, die genau wissen, worauf es in der Praxis ankommt. So
              konnten wir bereits tausende Kunden begeistern — mit echter
              Beratung, langjähriger Branchenerfahrung und einer Software, die
              Ihren Alltag spürbar einfacher macht.
            </p>
            <ul className="space-y-4 mb-10">
              {POINTS.map((point) => (
                <li key={point} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#3c8af7] flex-shrink-0" />
                  <span className="text-gray-700">{point}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate(withRef("/signup"))}
              className="h-12 px-8 rounded-lg text-base font-semibold bg-[#3c8af7] text-white hover:bg-[#3579de] transition-colors"
            >
              Kostenlos starten
            </button>
          </RevealOnScroll>

          <RevealOnScroll delay={100} className="hidden lg:block">
            <div className="rounded-2xl overflow-hidden shadow-lg shadow-gray-900/[0.06]">
              <img
                src="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Team bei der Arbeit an Rentably"
                className="w-full h-[480px] object-cover"
              />
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}
