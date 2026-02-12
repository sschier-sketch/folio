import { useNavigate } from "react-router-dom";
import { withRef } from "../../lib/referralTracking";
import { CheckCircle2, Heart, Lightbulb, Handshake } from "lucide-react";

const POINTS = [
  {
    icon: Heart,
    text: "45 Tage kostenlos testen — alle Funktionen inklusive",
  },
  {
    icon: Lightbulb,
    text: "Unverbindlich und ohne Zahlungsdaten starten",
  },
  {
    icon: Handshake,
    text: "Von Vermietern für Vermieter — wir kennen Ihre Herausforderungen",
  },
];

export default function ByLandlordsSection() {
  const navigate = useNavigate();

  return (
    <section className="py-[100px] px-6 bg-[#f0f5ff]">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
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
                <li key={point.text} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#3c8af7] flex-shrink-0" />
                  <span className="text-gray-700">{point.text}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate(withRef("/signup"))}
              className="h-12 px-8 rounded-lg text-base font-semibold bg-[#3c8af7] text-white hover:bg-[#3579de] transition-colors"
            >
              Kostenlos starten
            </button>
          </div>

          <div className="hidden lg:block">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-lg shadow-gray-900/[0.06] overflow-hidden">
              <div className="h-8 bg-gray-50 border-b border-gray-100 flex items-center gap-1.5 px-4">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]/60" />
              </div>
              <img
                src="/Bildschirmfoto_2026-02-12_um_17.31.34.png"
                alt="Rentably Dashboard Ansicht"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
