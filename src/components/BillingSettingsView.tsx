import { useLanguage } from "../contexts/LanguageContext";
import { SubscriptionPlans } from "./subscription/SubscriptionPlans";

export default function BillingSettingsView() {
  const { language } = useLanguage();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark mb-2">
          {language === "de" ? "Tarif & Abrechnung" : "Plan & Billing"}
        </h1>
        <p className="text-gray-400">
          {language === "de"
            ? "Verwalten Sie Ihren Tarif und Ihre Zahlungsinformationen."
            : "Manage your subscription and payment information."}
        </p>
      </div>

      <div className="bg-white rounded shadow-sm p-6">
        <SubscriptionPlans showCurrentPlanCard={true} />
      </div>
    </div>
  );
}
