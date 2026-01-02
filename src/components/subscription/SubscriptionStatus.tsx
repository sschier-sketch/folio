import React from "react";
import { Crown, AlertCircle } from "lucide-react";
import { useSubscription } from "../../hooks/useSubscription";
import { useLanguage } from "../../contexts/LanguageContext";
export function SubscriptionStatus() {
  const { subscription, loading, getSubscriptionPlan, isActive } =
    useSubscription();
  const { language } = useLanguage();
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        {" "}
        <div className="animate-pulse flex items-center space-x-3">
          {" "}
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>{" "}
          <div className="flex-1">
            {" "}
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>{" "}
            <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>{" "}
          </div>{" "}
        </div>{" "}
      </div>
    );
  }
  const planName = getSubscriptionPlan();
  const active = isActive();
  return (
    <div className="bg-white rounded-lg shadow p-4">
      {" "}
      <div className="flex items-center space-x-3">
        {" "}
        {active ? (
          <Crown className="w-8 h-8 text-yellow-500" />
        ) : (
          <AlertCircle className="w-8 h-8 text-gray-400" />
        )}{" "}
        <div>
          {" "}
          <h3 className="font-medium text-gray-900">{planName}</h3>{" "}
          <p className="text-sm text-gray-600">
            {" "}
            {active
              ? language === "de"
                ? "Aktives Abonnement"
                : "Active subscription"
              : language === "de"
                ? "Kein aktives Abonnement"
                : "No active subscription"}{" "}
          </p>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
