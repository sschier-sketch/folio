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
      return !subscription?.price_id || subscription?.price_id === "pro_plan";
    }
    return subscription?.price_id === priceId;
  };

  const isProPlan = (priceId: string) => {
    return priceId === "price_1SmAu0DT0DRNFiKmj97bxor8" || priceId === "price_1SmAszDT0DRNFiKmQ7qG1L8V" || priceId === "pro_plan";
  };

  const shouldHideProPlans = isPro;

  const visibleProducts = stripeProducts.filter(product => {
    if (shouldHideProPlans && isProPlan(product.priceId)) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      {" "}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {" "}
        <div className="mb-8">
          {" "}
          <Link
            to="/dashboard"
            className="inline-flex items-center text-primary-blue hover:text-primary-blue mb-4"
          >
            {" "}
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard{" "}
          </Link>{" "}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Tarif & Abrechnung
          </h1>{" "}
          <p className="text-gray-600 mb-8">
            {" "}
            Wählen Sie den Plan, der am besten zu Ihren Anforderungen passt.{" "}
          </p>{" "}
          <SubscriptionStatus />{" "}
        </div>{" "}
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
