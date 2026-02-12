import { useNavigate } from "react-router-dom";
import { withRef } from "../../lib/referralTracking";
import { PLANS, calculateYearlySavings } from "../../config/plans";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { RevealOnScroll } from "../common/RevealOnScroll";

function formatPrice(cents: number): string {
  return cents.toFixed(2).replace(".", ",");
}

export default function PricingSection() {
  const navigate = useNavigate();
  const yearlySavings = calculateYearlySavings();
  const yearlyPerMonth = formatPrice((PLANS.pro.priceYearly || 0) / 12);

  return (
    <section className="py-[100px] px-6">
      <div className="max-w-[1200px] mx-auto">
        <RevealOnScroll>
          <div className="text-center mb-6">
            <h2 className="text-3xl sm:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">
              Keine Hausverwaltungssoftware ist günstiger
            </h2>
            <p className="text-gray-500 leading-relaxed max-w-[620px] mx-auto">
              Andere Anbieter berechnen pro Einheit, pro Mieter oder pro Objekt.
              Bei Rentably zahlen Sie einen festen Preis — egal wie gross
              Ihr Portfolio ist.
            </p>
          </div>
        </RevealOnScroll>

        <div className="grid md:grid-cols-2 gap-6 max-w-[880px] mx-auto mt-12">
          <RevealOnScroll delay={80}>
            <div className="border border-gray-200 rounded-2xl p-7 bg-white flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Basic</h3>
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                Für immer kostenlos
              </span>
            </div>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-3xl font-bold text-gray-900">0,00 {PLANS.basic.currencySymbol}</span>
              <span className="text-gray-400 text-sm">/ Monat</span>
            </div>
            <ul className="space-y-2.5 mb-8 flex-1">
              {PLANS.basic.features.slice(0, 4).map((f) => (
                <li key={f.text} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-600">{f.text}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate(withRef("/signup"))}
              className="h-[44px] w-full rounded-xl text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Kostenlos registrieren
            </button>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={160}>
            <div className="border-2 border-gray-900 rounded-2xl p-7 bg-white flex flex-col relative">
            <div className="absolute -top-3 left-7 flex items-center gap-1.5 bg-gray-900 text-white text-xs font-semibold px-3 py-1 rounded-full">
              <Sparkles className="w-3 h-3" />
              30 Tage gratis testen
            </div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Pro</h3>
              <span className="text-xs font-medium text-[#3c8af7] bg-[#EEF4FF] border border-[#DDE7FF] px-2.5 py-1 rounded-full">
                -{yearlySavings}% jährlich
              </span>
            </div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-bold text-gray-900">
                {yearlyPerMonth} {PLANS.pro.currencySymbol}
              </span>
              <span className="text-gray-400 text-sm">/ Monat</span>
            </div>
            <p className="text-xs text-gray-400 mb-6">
              {formatPrice(PLANS.pro.priceYearly || 0)} {PLANS.pro.currencySymbol} / Jahr, jährlich abgerechnet
            </p>
            <ul className="space-y-2.5 mb-8 flex-1">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#3c8af7] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Alles aus Basic, plus:</span>
              </li>
              {PLANS.pro.features.slice(2, 7).map((f) => (
                <li key={f.text} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#3c8af7] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">{f.text}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate(withRef("/signup"))}
              className="h-[44px] w-full rounded-xl text-sm font-semibold bg-[#3c8af7] text-white hover:bg-[#3579de] transition-colors"
            >
              30 Tage kostenlos testen
            </button>
            </div>
          </RevealOnScroll>
        </div>

        <div className="text-center mt-8">
          <button
            onClick={() => navigate("/preise")}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors group"
          >
            Alle Funktionen vergleichen
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
}
