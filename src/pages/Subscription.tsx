import React from "react";
import { stripeProducts } from "../stripe-config";
import { SubscriptionCard } from "../components/subscription/SubscriptionCard";
import { SubscriptionStatus } from "../components/subscription/SubscriptionStatus";
import { useSubscription } from "../hooks/useSubscription";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
export function Subscription() {
  const { subscription, isPro } = useSubscription();

  console.log("=== SUBSCRIPTION DEBUG ===");
  console.log("isPro:", isPro);
  console.log("subscription:", subscription);
  console.log("subscription?.price_id:", subscription?.price_id);
  console.log("subscription?.subscription_status:", subscription?.subscription_status);

  const isProPlan = (priceId: string) => {
    return priceId === "price_1SmAu0DT0DRNFiKmj97bxor8" || priceId === "price_1SmAszDT0DRNFiKmQ7qG1L8V" || priceId === "pro_plan";
  };

  const isCurrentPlan = (priceId: string) => {
    if (priceId === "free") {
      return !isPro;
    }
    return isPro && isProPlan(priceId);
  };

  const visibleProducts = stripeProducts.filter(product => {
    const shouldHide = isPro && isProPlan(product.priceId);
    console.log(`Product ${product.name} (${product.priceId}): isPro=${isPro}, isProPlan=${isProPlan(product.priceId)}, shouldHide=${shouldHide}`);
    return !shouldHide;
  });

  console.log("visibleProducts count:", visibleProducts.length);
  console.log("visibleProducts:", visibleProducts.map(p => p.name));

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* DEBUG PANEL */}
        <div className="mb-6 p-4 bg-yellow-100 border-2 border-yellow-600 rounded">
          <h3 className="font-bold mb-2">DEBUG INFO:</h3>
          <div className="text-sm space-y-1">
            <div>isPro: <strong>{String(isPro)}</strong></div>
            <div>subscription_status: <strong>{subscription?.subscription_status || "null"}</strong></div>
            <div>price_id: <strong>{subscription?.price_id || "null"}</strong></div>
            <div>Visible Products Count: <strong>{visibleProducts.length}</strong></div>
            <div>Visible Products: <strong>{visibleProducts.map(p => p.name).join(", ")}</strong></div>
          </div>
        </div>

        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-primary-blue hover:text-primary-blue mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Tarif & Abrechnung
          </h1>
          <p className="text-gray-600 mb-8">
            Wählen Sie den Plan, der am besten zu Ihren Anforderungen passt.
          </p>
          <SubscriptionStatus />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {" "}
          {visibleProducts.map((product) => (
            <SubscriptionCard
              key={product.priceId}
              product={product}
              isCurrentPlan={isCurrentPlan(product.priceId)}
              showDowngradeButton={isPro && product.priceId === "free"}
            />
          ))}{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
