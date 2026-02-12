import { useNavigate } from "react-router-dom";
import { Check, X, Info } from "lucide-react";
import { PLANS, calculateYearlySavings } from "../config/plans";
import { withRef } from "../lib/referralTracking";
import { useState } from "react";

type Interval = "month" | "year";

function formatPrice(cents: number): string {
  return cents.toFixed(2).replace(".", ",");
}

const PRO_EXTRAS = [
  "Erweiterte Finanzanalysen",
  "Detaillierte Reports & Statistiken",
  "Automatische Erinnerungen",
  "Export-Funktionen",
  "Prioritäts-Support (24h)",
];

export default function Pricing() {
  const navigate = useNavigate();
  const [interval, setInterval] = useState<Interval>("month");
  const yearlySavings = calculateYearlySavings();

  const proPrice =
    interval === "year"
      ? formatPrice((PLANS.pro.priceYearly || 0) / 12)
      : formatPrice(PLANS.pro.priceMonthly);

  return (
    <div>
      <section className="pt-24 pb-10 sm:pt-32 sm:pb-14 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">
            Einfache, transparente Preise
          </h1>
          <p className="mt-5 text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
            Starten Sie kostenlos und upgraden Sie, wenn Ihr Portfolio wächst.
            Keine versteckten Kosten.
          </p>
        </div>
      </section>

      <section className="pb-6 px-6">
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setInterval("month")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              interval === "month"
                ? "bg-gray-900 text-white"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Monatlich
          </button>
          <button
            onClick={() => setInterval("year")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              interval === "year"
                ? "bg-gray-900 text-white"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Jährlich
            <span className="ml-1.5 text-xs font-semibold text-emerald-600">
              -{yearlySavings}%
            </span>
          </button>
        </div>
      </section>

      <section className="py-10 px-6">
        <div className="max-w-[880px] mx-auto grid md:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-2xl p-8 bg-white flex flex-col">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {PLANS.basic.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {PLANS.basic.description}
              </p>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-gray-900">
                  0,00 {PLANS.basic.currencySymbol}
                </span>
                <span className="text-gray-400 text-sm">/ Monat</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Für immer kostenlos</p>
            </div>

            <ul className="space-y-3 mb-10 flex-1">
              {PLANS.basic.features.map((f) => (
                <li key={f.text} className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-600">{f.text}</span>
                </li>
              ))}
              {PRO_EXTRAS.map((text) => (
                <li key={text} className="flex items-start gap-3">
                  <X className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-400">{text}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => navigate(withRef("/signup"))}
              className="h-[46px] w-full rounded-xl text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Kostenlos registrieren
            </button>
          </div>

          <div className="border-2 border-gray-900 rounded-2xl p-8 bg-white flex flex-col relative">
            <span className="absolute -top-3 left-8 bg-gray-900 text-white text-xs font-semibold px-3 py-1 rounded-full">
              Empfohlen
            </span>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {PLANS.pro.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {PLANS.pro.description}
              </p>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-gray-900">
                  {proPrice} {PLANS.pro.currencySymbol}
                </span>
                <span className="text-gray-400 text-sm">/ Monat</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {interval === "year"
                  ? `${formatPrice(PLANS.pro.priceYearly || 0)} ${PLANS.pro.currencySymbol} / Jahr, jährlich abgerechnet`
                  : "zzgl. MwSt., monatlich kündbar"}
              </p>
            </div>

            <ul className="space-y-3 mb-10 flex-1">
              {PLANS.pro.features.map((f) => (
                <li key={f.text} className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-[#3c8af7] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">{f.text}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => navigate(withRef("/signup"))}
              className="h-[46px] w-full rounded-xl text-sm font-semibold bg-[#3c8af7] text-white hover:bg-[#3579de] transition-colors"
            >
              14 Tage kostenlos testen
            </button>
          </div>
        </div>
      </section>

      <section className="pb-20 px-6">
        <div className="max-w-[880px] mx-auto">
          <div className="bg-gray-50 rounded-xl p-5 flex items-start gap-3">
            <Info className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-500 leading-relaxed">
              Alle Preise verstehen sich zzgl. 19% MwSt. Die Kosten für eine
              Immobilienverwaltungssoftware können in der Regel als
              Werbungskosten bei Einkünften aus Vermietung und Verpachtung
              steuerlich geltend gemacht werden.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
