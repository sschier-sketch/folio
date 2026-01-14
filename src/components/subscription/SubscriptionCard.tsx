import React, { useState } from "react";
import { Crown, CreditCard, Loader2 } from "lucide-react";
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
    setLoading(true);
    setError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Not authenticated");
      }

      console.log("Creating checkout session for product:", product.priceId);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            price_id: product.priceId,
            mode: product.mode,
            success_url: `${window.location.origin}/dashboard?payment=success`,
            cancel_url: `${window.location.origin}/dashboard`,
          }),
        },
      );

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Checkout error:", errorData);
        throw new Error(errorData.error || "Failed to create checkout session");
      }

      const data = await response.json();
      console.log("Checkout response:", data);

      if (data.url) {
        console.log("Redirecting to:", data.url);
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error: any) {
      console.error("Subscription error:", error);
      setError(error.message || "Ein Fehler ist aufgetreten");
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
              ? "bg-gray-100 text-gray-500 cursor-not-allowed"
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
