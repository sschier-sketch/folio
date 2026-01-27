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
        const [stripeResult, billingResult] = await Promise.all([
          supabase.from("stripe_user_subscriptions").select("*").maybeSingle(),
          supabase.from("billing_info").select("*").eq("user_id", user.id).maybeSingle(),
        ]);

        if (billingResult.data && billingResult.data.subscription_plan === "pro" && billingResult.data.subscription_status === "active") {
          setSubscription({
            customer_id: billingResult.data.stripe_customer_id,
            subscription_id: null,
            subscription_status: "active",
            price_id: "pro_plan",
            current_period_start: null,
            current_period_end: billingResult.data.subscription_ends_at ? Math.floor(new Date(billingResult.data.subscription_ends_at).getTime() / 1000) : null,
            cancel_at_period_end: false,
            payment_method_brand: null,
            payment_method_last4: null,
          });
        } else if (stripeResult.data) {
          setSubscription(stripeResult.data);
        } else if (stripeResult.error) {
          console.error("Error fetching subscription:", stripeResult.error);
          setSubscription(null);
        } else {
          setSubscription(null);
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

  const hasPro = () => {
    if (!subscription?.subscription_status || subscription.subscription_status !== "active") {
      return false;
    }
    if (!subscription.price_id) {
      return false;
    }
    if (subscription.price_id === "free") {
      return false;
    }
    return true;
  };

  return {
    subscription,
    loading,
    getSubscriptionPlan,
    isActive,
    isPro: hasPro(),
    isPremium: hasPro(),
  };
}
