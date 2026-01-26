import { useNavigate } from "react-router-dom";
import { Check, Info } from "lucide-react";
import { Header } from "../components/Header";
import Footer from "../components/Footer";
import { useLanguage } from "../contexts/LanguageContext";

export default function Pricing() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const plans = [
    {
      id: "starter",
      name: language === "de" ? "Starter" : "Starter",
      subtitle: language === "de" ? "Für kleine Portfolios" : "For small portfolios",
      monthlyPrice: "14,90 €",
      period: language === "de" ? "/ Monat" : "/ month",
      tax: language === "de" ? "zzgl. MwSt." : "excl. VAT",
      features: [
        language === "de" ? "Bis zu 5 Einheiten" : "Up to 5 units",
        language === "de" ? "Alle Funktionen" : "All features",
        language === "de" ? "E-Mail Support" : "Email support",
      ],
      popular: false,
      cta: language === "de" ? "Upgraden" : "Upgrade",
    },
    {
      id: "professional",
      name: "Professional",
      subtitle: language === "de" ? "Für wachsende Portfolios" : "For growing portfolios",
      monthlyPrice: "39,90 €",
      period: language === "de" ? "/ Monat" : "/ month",
      tax: language === "de" ? "zzgl. MwSt." : "excl. VAT",
      features: [
        language === "de" ? "Bis zu 75 Einheiten" : "Up to 75 units",
        language === "de" ? "Alle Funktionen" : "All features",
        language === "de" ? "Prioritäts-Support" : "Priority support",
      ],
      popular: true,
      cta: language === "de" ? "Upgraden" : "Upgrade",
    },
    {
      id: "enterprise",
      name: "Enterprise",
      subtitle: language === "de" ? "Für große Portfolios" : "For large portfolios",
      monthlyPrice: "89,90 €",
      period: language === "de" ? "/ Monat" : "/ month",
      tax: language === "de" ? "zzgl. MwSt." : "excl. VAT",
      features: [
        language === "de" ? "Bis zu 500 Einheiten" : "Up to 500 units",
        language === "de" ? "Alle Funktionen" : "All features",
        language === "de" ? "Persönlicher Ansprechpartner" : "Personal account manager",
      ],
      popular: false,
      cta: language === "de" ? "Upgraden" : "Upgrade",
    },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <div className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-dark mb-4">
              {language === "de" ? "Preisübersicht" : "Pricing Overview"}
            </h1>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              {language === "de"
                ? "Wählen Sie den Plan, der am besten zu Ihrem Portfolio passt"
                : "Choose the plan that best fits your portfolio"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-white rounded-lg border-2 ${
                  plan.popular ? "border-primary-blue" : "border-gray-200"
                } p-8 hover:shadow-lg transition-all`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="inline-block px-4 py-1 bg-primary-blue text-white text-sm font-semibold rounded-full">
                      {language === "de" ? "Beliebt" : "Popular"}
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-dark mb-2">{plan.name}</h3>
                  <p className="text-gray-500 text-sm">{plan.subtitle}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-4xl font-bold text-dark">{plan.monthlyPrice}</span>
                    <span className="text-gray-500">{plan.period}</span>
                  </div>
                  <p className="text-sm text-gray-400">{plan.tax}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary-blue flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => navigate("/subscription")}
                  className={`w-full py-3 rounded-lg font-semibold transition-all ${
                    plan.popular
                      ? "bg-dark text-white hover:bg-gray-800"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 rounded-lg p-6 flex items-start gap-3 max-w-5xl mx-auto">
            <Info className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-600">
              {language === "de"
                ? "Alle Preise verstehen sich zzgl. 19% MwSt. Die Kosten für eine Immobilienverwaltungssoftware können in der Regel als Werbungskosten bei Einkünften aus Vermietung und Verpachtung steuerlich geltend gemacht werden."
                : "All prices are exclusive of 19% VAT. The costs for property management software can generally be claimed as advertising expenses for income from renting and leasing for tax purposes."}
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
