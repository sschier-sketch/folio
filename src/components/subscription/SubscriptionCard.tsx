import React, { useState } from "react";
import { Crown, CreditCard, Loader2, Check } from "lucide-react";
import { StripeProduct } from "../../stripe-config";
import { supabase } from "../../lib/supabase";
import { useLanguage } from "../../contexts/LanguageContext";

interface SubscriptionCardProps {
  product: StripeProduct;
  isCurrentPlan?: boolean;
}

export function SubscriptionCard({
  product,
  isCurrentPlan = false,
}: SubscriptionCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguage();

  const handleSubscribe = async () => {
    if (product.price === 0) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Sie sind nicht angemeldet");
      }

      console.log("=== STRIPE CHECKOUT START ===");
      console.log("Product:", product.priceId);
      console.log("Mode:", product.mode);

      const requestBody = {
        price_id: product.priceId,
        mode: product.mode,
        success_url: `${window.location.origin}/subscription/success`,
        cancel_url: `${window.location.origin}/subscription/cancelled`,
      };

      console.log("Request URL:", `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`);
      console.log("Request body:", requestBody);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(requestBody),
        },
      );

      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log("Response text:", responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        throw new Error(`Server-Antwort konnte nicht gelesen werden: ${responseText.substring(0, 100)}`);
      }

      console.log("Parsed response:", data);

      if (!response.ok) {
        console.error("=== CHECKOUT FAILED ===");
        console.error("Error data:", data);
        throw new Error(data.error || `Server-Fehler (${response.status})`);
      }

      if (data.url) {
        console.log("=== REDIRECTING TO STRIPE ===");
        console.log("URL:", data.url);
        window.location.href = data.url;
      } else {
        console.error("=== NO URL IN RESPONSE ===");
        throw new Error("Keine Checkout-URL erhalten. Antwort: " + JSON.stringify(data));
      }
    } catch (error: any) {
      console.error("=== SUBSCRIPTION ERROR ===");
      console.error("Error:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);

      setError(error.message || "Ein unbekannter Fehler ist aufgetreten");
      setLoading(false);
    }
  };

  return (
    <div
      className={`relative bg-white rounded p-8 ${
        isCurrentPlan ? "border-2 border-green-500 ring-2 ring-green-200" : ""
      }`}
    >
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
            <Crown className="w-4 h-4 mr-1" />
            {language === "de" ? "Aktueller Tarif" : "Current Plan"}
          </span>
        </div>
      )}

      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {product.name}
        </h3>
        <p className="text-gray-600 mb-6">{product.description}</p>

        <div className="mb-8">
          <span className="text-4xl font-bold text-gray-900">
            {product.currencySymbol}
            {product.price}
          </span>
          {product.mode === "subscription" && (
            <span className="text-gray-600 ml-1">
              {product.interval === "year"
                ? language === "de"
                  ? "/Jahr"
                  : "/year"
                : language === "de"
                  ? "/Monat"
                  : "/month"}
            </span>
          )}
          {product.interval === "year" && (
            <div className="text-sm text-green-600 font-semibold mt-2">
              {language === "de"
                ? `Nur €${(product.price / 12).toFixed(2)}/Monat`
                : `Only €${(product.price / 12).toFixed(2)}/month`}
            </div>
          )}
        </div>

        {product.features && product.features.length > 0 && (
          <ul className="space-y-3 mb-6 text-left">
            {product.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600 text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleSubscribe}
          disabled={loading || isCurrentPlan}
          className={`w-full flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-colors ${
            isCurrentPlan
              ? "bg-green-100 text-green-700 cursor-default"
              : product.price === 0
              ? "bg-gray-200 text-gray-600 cursor-not-allowed"
              : "bg-primary-blue hover:bg-primary-blue text-white"
          }`}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isCurrentPlan ? (
            language === "de" ? (
              "Aktiv"
            ) : (
              "Active"
            )
          ) : product.price === 0 ? (
            language === "de" ? (
              "Kostenlos"
            ) : (
              "Free"
            )
          ) : (
            <>
              <CreditCard className="w-5 h-5 mr-2" />
              {product.mode === "subscription"
                ? language === "de"
                  ? "Abonnieren"
                  : "Subscribe"
                : language === "de"
                  ? "Kaufen"
                  : "Purchase"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
