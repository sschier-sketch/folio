import { useNavigate } from "react-router-dom";
import { Check, Minus, Info, Sparkles } from "lucide-react";
import { PLANS, COMPARISON_TABLE, calculateYearlySavings } from "../config/plans";
import { withRef } from "../lib/referralTracking";
import { useState } from "react";
import TestimonialsSection from "../components/landing/TestimonialsSection";
import FaqSection from "../components/landing/FaqSection";

type Interval = "month" | "year";

function formatPrice(cents: number): string {
  return cents.toFixed(2).replace(".", ",");
}

function CellValue({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center mx-auto"
        style={{ backgroundColor: "#EEF4FF", border: "1px solid #DDE7FF" }}
      >
        <Check className="w-3.5 h-3.5 text-[#3c8af7]" strokeWidth={2} />
      </div>
    );
  }
  if (value === false) {
    return <Minus className="w-4 h-4 text-gray-300 mx-auto" />;
  }
  return <span className="text-sm text-gray-700">{value}</span>;
}

export default function Pricing() {
  const navigate = useNavigate();
  const [interval, setInterval] = useState<Interval>("year");
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
            Keine versteckten Kosten. 30 Tage alle Pro-Funktionen gratis testen.
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
        <div className="max-w-[1200px] mx-auto grid md:grid-cols-2 gap-6">
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
                  : "monatlich kündbar"}
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
              30 Tage kostenlos testen
            </button>
          </div>
        </div>
      </section>

      <section className="pt-4 pb-10 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="bg-[#EEF4FF] border border-[#DDE7FF] rounded-xl p-5 flex items-start gap-3.5">
            <Sparkles className="w-5 h-5 text-[#3c8af7] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-0.5">
                30 Tage alle Pro-Funktionen kostenlos
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Nach der Registrierung werden automatisch alle Pro-Funktionen
                für 30 Tage freigeschaltet. Kein Risiko, keine Kreditkarte
                erforderlich.
              </p>
            </div>
          </div>
        </div>
      </section>

      <TestimonialsSection />

      <section className="py-16 px-6">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight text-center mb-4">
            Detaillierter Funktionsvergleich
          </h2>
          <p className="text-gray-500 text-center mb-12 max-w-lg mx-auto">
            Alle Funktionen im Überblick — damit Sie genau wissen,
            was in Ihrem Tarif enthalten ist.
          </p>

          <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
            <div className="grid grid-cols-[1fr_120px_120px] sm:grid-cols-[1fr_140px_140px] border-b border-gray-200 bg-gray-50">
              <div className="px-5 py-4 text-sm font-semibold text-gray-500">
                Funktion
              </div>
              <div className="px-3 py-4 text-sm font-semibold text-gray-500 text-center">
                Basic
              </div>
              <div className="px-3 py-4 text-sm font-semibold text-gray-900 text-center">
                Pro
              </div>
            </div>

            {COMPARISON_TABLE.map((category, catIdx) => (
              <div key={category.name}>
                <div className="px-5 py-3 bg-gray-50/60 border-b border-gray-100">
                  <span className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    {category.name}
                  </span>
                </div>
                {category.rows.map((row, rowIdx) => (
                  <div
                    key={row.feature}
                    className={`grid grid-cols-[1fr_120px_120px] sm:grid-cols-[1fr_140px_140px] ${
                      rowIdx < category.rows.length - 1 ||
                      catIdx < COMPARISON_TABLE.length - 1
                        ? "border-b border-gray-100"
                        : ""
                    }`}
                  >
                    <div className="px-5 py-3.5 text-sm text-gray-700">
                      {row.feature}
                    </div>
                    <div className="px-3 py-3.5 text-center">
                      <CellValue value={row.basic} />
                    </div>
                    <div className="px-3 py-3.5 text-center">
                      <CellValue value={row.pro} />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <FaqSection pageSlug="pricing" />

      <section className="pb-20 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="bg-gray-50 rounded-xl p-5 flex items-start gap-3">
            <Info className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-500 leading-relaxed">
              Alle Preise verstehen sich zzgl. MwSt. Die Kosten für eine
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
