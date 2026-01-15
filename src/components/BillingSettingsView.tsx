import { useState } from "react";
import { CreditCard, Gift, CheckCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { stripeProducts } from "../stripe-config";
import { SubscriptionCard } from "./subscription/SubscriptionCard";
import { useSubscription } from "../hooks/useSubscription";

export default function BillingSettingsView() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { subscription } = useSubscription();
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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

      <div className="space-y-6">
        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-dark">
              {language === "de"
                ? "Empfehlungscode einlösen"
                : "Redeem Referral Code"}
            </h3>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            {language === "de"
              ? "Haben Sie einen Empfehlungscode? Lösen Sie ihn ein und erhalten Sie 20% Rabatt auf Ihr erstes Jahr!"
              : "Have a referral code? Redeem it and get 20% off your first year!"}
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const codeInput = form.elements.namedItem(
                "referralCode",
              ) as HTMLInputElement;
              const code = codeInput.value.trim().toUpperCase();
              if (!code) return;
              try {
                const { data: referrerSettings } = await supabase
                  .from("user_settings")
                  .select("user_id")
                  .eq("referral_code", code)
                  .maybeSingle();
                if (!referrerSettings) {
                  setErrorMessage(
                    language === "de"
                      ? "Ungültiger Empfehlungscode"
                      : "Invalid referral code",
                  );
                  return;
                }
                const { error } = await supabase.from("user_referrals").insert({
                  referrer_id: referrerSettings.user_id,
                  referred_user_id: user!.id,
                  referral_code: code,
                  status: "pending",
                });
                if (error) {
                  if (error.code === "23505") {
                    setErrorMessage(
                      language === "de"
                        ? "Sie haben bereits einen Empfehlungscode eingelöst"
                        : "You have already redeemed a referral code",
                    );
                  } else {
                    throw error;
                  }
                } else {
                  setSuccessMessage(
                    language === "de"
                      ? "Empfehlungscode erfolgreich eingelöst!"
                      : "Referral code redeemed successfully!",
                  );
                  codeInput.value = "";
                  setTimeout(() => setSuccessMessage(""), 3000);
                }
              } catch (error) {
                console.error("Error redeeming referral code:", error);
                setErrorMessage(
                  language === "de"
                    ? "Fehler beim Einlösen des Codes"
                    : "Error redeeming code",
                );
              }
            }}
            className="flex gap-3"
          >
            <input
              name="referralCode"
              type="text"
              placeholder={language === "de" ? "CODE EINGEBEN" : "ENTER CODE"}
              className="flex-1 px-4 py-2 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase font-mono"
              maxLength={8}
            />
            <button
              type="submit"
              className="px-6 py-2 bg-emerald-600 text-white rounded-full font-medium hover:bg-emerald-700 transition-colors"
            >
              {language === "de" ? "Einlösen" : "Redeem"}
            </button>
          </form>
          {successMessage && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm">
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {errorMessage}
            </div>
          )}
        </div>

        <div className="bg-white rounded shadow-sm p-6">
          <h3 className="text-lg font-semibold text-dark mb-6">
            {language === "de" ? "Ihr Tarif" : "Your Plan"}
          </h3>

          <div className="flex items-center justify-between p-5 bg-gray-50 rounded-lg mb-6 border-2 border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-blue/10 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-primary-blue" />
              </div>
              <div>
                <div className="font-bold text-dark text-lg">
                  {subscription?.status === "active" ? "Pro" : "Basic"}
                </div>
                <div className="text-sm text-gray-400">
                  {subscription?.status === "active"
                    ? "Alle Premium-Funktionen freigeschaltet"
                    : "Kostenlose Basis-Funktionen"}
                </div>
              </div>
            </div>
            {subscription?.status !== "active" && (
              <button
                onClick={() => {
                  const plansSection = document.getElementById("available-plans");
                  plansSection?.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-6 py-2.5 bg-primary-blue text-white rounded-full font-semibold hover:bg-blue-700 transition-colors shadow-sm"
              >
                Jetzt upgraden
              </button>
            )}
          </div>

          {subscription?.status !== "active" && (
            <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <h4 className="text-lg font-bold text-dark mb-4 flex items-center gap-2">
                <span className="text-2xl">✨</span>
                Mit Pro erhalten Sie:
              </h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-dark">
                    <strong>Unbegrenzte Immobilien</strong> - Verwalten Sie
                    beliebig viele Objekte
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-dark">
                    <strong>Erweiterte Finanzverwaltung</strong> - Cashflow,
                    Analysen und Berichte
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-dark">
                    <strong>Professionelles Mieterportal</strong> - Digitale
                    Kommunikation mit Mietern
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-dark">
                    <strong>Automatische Nebenkostenabrechnung</strong> -
                    Zählerstände & Abrechnungen
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-dark">
                    <strong>Dokumentenverwaltung</strong> - Zentrale Ablage
                    aller Dokumente
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-dark">
                    <strong>Prioritärer Support</strong> - Schnelle Hilfe bei
                    Fragen
                  </span>
                </li>
              </ul>
            </div>
          )}

          <div id="available-plans">
            <h4 className="text-md font-semibold text-dark mb-4">
              {language === "de" ? "Verfügbare Tarife" : "Available Plans"}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {stripeProducts.map((product) => (
                <SubscriptionCard
                  key={product.priceId}
                  product={product}
                  isCurrentPlan={subscription?.price_id === product.priceId}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
