import { useNavigate } from "react-router-dom";
import { withRef } from "../../lib/referralTracking";
import { Smartphone, Wifi, Zap } from "lucide-react";

const PERKS = [
  { icon: Smartphone, text: "Optimiert für alle Bildschirmgrößen" },
  { icon: Wifi, text: "Überall online verfügbar" },
  { icon: Zap, text: "Schnell und reaktionsfreudig" },
];

export default function MobileSection() {
  const navigate = useNavigate();

  return (
    <section className="py-[100px] px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <h2 className="text-3xl sm:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4 max-w-[700px]">
              Ihre Verwaltung, immer dabei
            </h2>
            <p className="text-gray-500 leading-relaxed mb-8 max-w-[650px]">
              Greifen Sie von jedem Gerät auf Ihre Immobiliendaten zu
              — ob am Desktop oder unterwegs auf dem Smartphone.
            </p>
            <ul className="space-y-3 mb-8">
              {PERKS.map((perk) => (
                <li key={perk.text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#3c8af7]/8 flex items-center justify-center flex-shrink-0">
                    <perk.icon className="w-4 h-4 text-[#3c8af7]" />
                  </div>
                  <span className="text-gray-700 text-sm">{perk.text}</span>
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

          <div className="hidden lg:flex justify-center">
            <div className="w-[260px] rounded-[36px] border-[6px] border-gray-900 bg-white overflow-hidden shadow-xl shadow-gray-900/[0.12]">
              <div className="h-7 bg-gray-900 flex justify-center">
                <div className="w-20 h-5 bg-gray-800 rounded-b-xl" />
              </div>
              <div className="overflow-hidden">
                <img
                  src="/Bildschirmfoto_2026-02-12_um_17.32.18.png"
                  alt="Rentably Mobile Ansicht"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
