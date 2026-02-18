import { useNavigate } from "react-router-dom";
import { withRef } from "../../lib/referralTracking";
import { RefLink } from "../common/RefLink";
import { CheckCircle2, Home, Users, BarChart3, FileText } from "lucide-react";
import { RevealOnScroll } from "../common/RevealOnScroll";

const HERO_CHECKS = [
  "Komplett kostenlos im Basic-Tarif",
  "Automatisch 30 Tage alle Pro-Funktionen gratis testen",
  "Keine Zahlungsdaten erforderlich",
];

function DashboardMockup() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-900/[0.08] overflow-hidden">
      <div className="h-9 bg-gray-50 border-b border-gray-100 flex items-center gap-1.5 px-4">
        <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]/60" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]/60" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]/60" />
        <div className="ml-4 h-5 w-48 bg-gray-100 rounded-md" />
      </div>
      <div className="flex">
        <div className="w-14 bg-gray-50 border-r border-gray-100 py-4 flex flex-col items-center gap-4">
          {[Home, Users, BarChart3, FileText].map((Icon, i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: i === 0 ? "#EEF4FF" : "transparent",
                border: i === 0 ? "1px solid #DDE7FF" : "none",
              }}
            >
              <Icon
                className="w-4 h-4"
                style={{ color: i === 0 ? "#1E1E24" : "#9ca3af" }}
                strokeWidth={1.5}
              />
            </div>
          ))}
        </div>
        <div className="flex-1 p-5">
          <div className="h-5 w-32 bg-gray-100 rounded mb-4" />
          <div className="grid grid-cols-3 gap-3 mb-5">
            {["#3c8af7", "#22c55e", "#f59e0b"].map((color) => (
              <div
                key={color}
                className="h-[72px] rounded-lg border border-gray-100 p-3 flex flex-col justify-between"
              >
                <div className="h-3 w-14 bg-gray-100 rounded" />
                <div
                  className="h-5 w-20 rounded"
                  style={{ backgroundColor: color + "18" }}
                />
              </div>
            ))}
          </div>
          <div className="h-[120px] rounded-lg border border-gray-100 p-3 mb-4">
            <div className="h-3 w-24 bg-gray-100 rounded mb-3" />
            <div className="flex items-end gap-2 h-16">
              {[40, 65, 50, 80, 60, 72, 55, 90, 68, 75, 85, 95].map(
                (h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm"
                    style={{
                      height: `${h}%`,
                      backgroundColor:
                        i === 11 ? "#3c8af7" : "#3c8af7" + "30",
                    }}
                  />
                )
              )}
            </div>
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-8 rounded border border-gray-100 flex items-center px-3 gap-3"
              >
                <div className="w-4 h-4 rounded-full bg-gray-100" />
                <div className="h-2.5 flex-1 bg-gray-100 rounded" />
                <div className="h-2.5 w-12 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="pt-16 sm:pt-24 pb-[100px] sm:pb-[120px] px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <RevealOnScroll>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#3c8af7]/5 border border-[#3c8af7]/15 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3c8af7]" />
              <span className="text-sm font-medium text-[#3c8af7]">
                Die All-in-One Software
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
                to="/funktionen"
                className="h-12 inline-flex items-center px-8 rounded-lg text-base font-semibold border border-gray-300 text-gray-700 hover:border-gray-400 hover:text-gray-900 transition-colors"
              >
                Funktionen ansehen
              </RefLink>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={100} className="hidden lg:block">
            <DashboardMockup />
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}
