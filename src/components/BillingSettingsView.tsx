import { useState } from "react";
import { Gift } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { SubscriptionPlans } from "./subscription/SubscriptionPlans";

export default function BillingSettingsView() {
  const { user } = useAuth();
  const { language } = useLanguage();
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
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
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
              ? "Haben Sie einen Empfehlungscode? Lösen Sie ihn ein und erhalten Sie 2 Freimonate!"
              : "Have a referral code? Redeem it and get 2 free months!"}
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

                if (referrerSettings.user_id === user!.id) {
                  setErrorMessage(
                    language === "de"
                      ? "Sie können Ihren eigenen Empfehlungscode nicht einlösen"
                      : "You cannot redeem your own referral code",
                  );
                  return;
                }

                const { data: existingReferral } = await supabase
                  .from("user_referrals")
                  .select("id")
                  .eq("referred_user_id", user!.id)
                  .maybeSingle();

                if (existingReferral) {
                  setErrorMessage(
                    language === "de"
                      ? "Sie haben bereits einen Empfehlungscode eingelöst"
                      : "You have already redeemed a referral code",
                  );
                  return;
                }

                const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/activate-referral-reward`;
                const response = await fetch(apiUrl, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                  },
                  body: JSON.stringify({
                    referredUserId: user!.id,
                    referralCode: code,
                  }),
                });

                const result = await response.json();

                if (!response.ok || result.error) {
                  throw new Error(result.error || "Failed to activate referral reward");
                }

                setSuccessMessage(
                  language === "de"
                    ? "Empfehlungscode erfolgreich eingelöst! Sie haben 2 Freimonate erhalten."
                    : "Referral code redeemed successfully! You received 2 free months.",
                );
                codeInput.value = "";
                setTimeout(() => {
                  setSuccessMessage("");
                  window.location.reload();
                }, 3000);
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
          <SubscriptionPlans showCurrentPlanCard={true} />
        </div>
      </div>
    </div>
  );
}
