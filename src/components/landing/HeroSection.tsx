import { useNavigate } from "react-router-dom";
import { withRef } from "../../lib/referralTracking";
import { RefLink } from "../common/RefLink";
import { CheckCircle2 } from "lucide-react";

const HERO_CHECKS = [
  "Komplett kostenlos im Basic-Tarif",
  "Keine Kreditkarte erforderlich",
  "Sofort einsatzbereit",
];

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="pt-16 sm:pt-24 pb-[100px] sm:pb-[120px] px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#3c8af7]/5 border border-[#3c8af7]/15 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3c8af7]" />
              <span className="text-sm font-medium text-[#3c8af7]">
                Kostenlos starten — keine Kreditkarte nötig
              </span>
            </div>
            <h1 className="text-[40px] sm:text-[48px] lg:text-[56px] font-bold text-gray-900 leading-[1.1] tracking-tight">
              Immobilienverwaltung,{" "}
              <span className="text-[#3c8af7]">die mitdenkt.</span>
            </h1>
            <p className="mt-6 text-lg sm:text-[20px] text-gray-500 leading-relaxed max-w-[540px]">
              Objekte, Mieter, Finanzen und Dokumente an einem Ort.
              Die Software für private Vermieter, die Ordnung schaffen
              und Zeit sparen wollen.
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
                onClick={() => navigate(withRef("/signup"))}
                className="h-12 px-8 rounded-lg text-base font-semibold bg-[#3c8af7] text-white hover:bg-[#3579de] transition-colors"
              >
                Kostenlos starten
              </button>
              <RefLink
                to="/preise"
                className="h-12 inline-flex items-center px-8 rounded-lg text-base font-semibold border border-gray-300 text-gray-700 hover:border-gray-400 hover:text-gray-900 transition-colors"
              >
                Preise ansehen
              </RefLink>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-900/[0.08] overflow-hidden">
              <div className="h-9 bg-gray-50 border-b border-gray-100 flex items-center gap-1.5 px-4">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]/60" />
                <div className="ml-4 h-5 w-48 bg-gray-100 rounded-md" />
              </div>
              <img
                src="/Bildschirmfoto_2026-02-12_um_17.31.34.png"
                alt="Rentably Dashboard"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
