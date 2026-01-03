import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";
import { getProductByPriceId } from "../stripe-config";

export interface Subscription {
  customer_id: string | null;
  subscription_id: string | null;
  subscription_status: string | null;
  price_id: string | null;
  current_period_start: number | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean | null;
  payment_method_brand: string | null;
  payment_method_last4: string | null;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    const fetchSubscription = async () => {
      try {
        const { data, error } = await supabase
          .from("stripe_user_subscriptions")
          .select("*")
          .maybeSingle();

        if (error) {
          console.error("Error fetching subscription:", error);
          setSubscription(null);
        } else {
          setSubscription(data);
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
        setSubscription(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [user]);

  const getSubscriptionPlan = () => {
    if (!subscription?.price_id) return "Free";

    const product = getProductByPriceId(subscription.price_id);
    return product?.name || "Unknown Plan";
  };

  const isActive = () => {
    return subscription?.subscription_status === "active";
  };

  const hasPremium = () => {
    return (
      subscription?.subscription_status === "active" && subscription?.price_id
    );
  };

  return {
    subscription,
    loading,
    getSubscriptionPlan,
    isActive,
    hasPremium: hasPremium(),
    isPro: hasPremium(),
  };
}
