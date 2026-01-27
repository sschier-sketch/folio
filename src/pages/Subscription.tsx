import React from "react";
import { stripeProducts } from "../stripe-config";
import { SubscriptionCard } from "../components/subscription/SubscriptionCard";
import { SubscriptionStatus } from "../components/subscription/SubscriptionStatus";
import { useSubscription } from "../hooks/useSubscription";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
export function Subscription() {
  const { subscription, isPro } = useSubscription();

  const isCurrentPlan = (priceId: string) => {
    if (priceId === "free") {
      return !isPro;
    }
    return isPro && subscription?.price_id === priceId;
  };

  const visibleProducts = isPro
    ? stripeProducts.filter((product) => product.id === "free")
    : stripeProducts.filter((product) => product.id !== "free");

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
