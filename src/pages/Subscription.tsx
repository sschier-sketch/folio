import React from "react";
import { stripeProducts } from "../stripe-config";
import { SubscriptionCard } from "../components/subscription/SubscriptionCard";
import { SubscriptionStatus } from "../components/subscription/SubscriptionStatus";
import { useSubscription } from "../hooks/useSubscription";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
export function Subscription() {
  const { subscription } = useSubscription();
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
            Subscription Plans
          </h1>{" "}
          <p className="text-gray-600 mb-8">
            {" "}
            Choose the plan that best fits your property management needs.{" "}
          </p>{" "}
          <SubscriptionStatus />{" "}
        </div>{" "}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {" "}
          {stripeProducts.map((product) => (
            <SubscriptionCard
              key={product.priceId}
              product={product}
              isCurrentPlan={subscription?.price_id === product.priceId}
            />
          ))}{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
