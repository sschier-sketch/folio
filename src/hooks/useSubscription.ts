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

export interface BillingInfo {
  subscription_plan: string;
  subscription_status: string;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  stripe_customer_id: string | null;
  subscription_ends_at: string | null;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setBillingInfo(null);
      setLoading(false);
      return;
    }

    const fetchSubscription = async () => {
      try {
        const [stripeResult, billingResult] = await Promise.all([
          supabase.rpc("get_my_stripe_subscription").maybeSingle(),
          supabase.from("billing_info").select("subscription_plan, subscription_status, trial_started_at, trial_ends_at, stripe_customer_id, subscription_ends_at").eq("user_id", user.id).maybeSingle(),
        ]);

        if (billingResult.data) {
          setBillingInfo(billingResult.data);
        }

        if (stripeResult.data) {
          setSubscription(stripeResult.data);
        } else if (billingResult.data && billingResult.data.subscription_plan === "pro" && billingResult.data.subscription_status === "active") {
          setSubscription({
            customer_id: billingResult.data.stripe_customer_id,
            subscription_id: null,
            subscription_status: "active",
            price_id: "pro_plan",
            current_period_start: null,
            current_period_end: billingResult.data.subscription_ends_at ? Math.floor(new Date(billingResult.data.subscription_ends_at).getTime() / 1000) : null,
            cancel_at_period_end: !!billingResult.data.subscription_ends_at,
            payment_method_brand: null,
            payment_method_last4: null,
          });
        } else if (stripeResult.error) {
          console.error("Error fetching subscription:", stripeResult.error);
          setSubscription(null);
        } else {
          setSubscription(null);
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
        setSubscription(null);
        setBillingInfo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();

    const channel = supabase
      .channel('billing_subscription_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'billing_info',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchSubscription();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const getSubscriptionPlan = () => {
    if (!subscription?.price_id) return "Free";

    const product = getProductByPriceId(subscription.price_id);
    return product?.name || "Unknown Plan";
  };

  const isActive = () => {
    return subscription?.subscription_status === "active";
  };

  const hasProAccess = () => {
    if (subscription?.subscription_status === "active" && subscription.price_id && subscription.price_id !== "free") {
      return true;
    }

    if (billingInfo?.subscription_plan === "pro" && billingInfo?.subscription_status === "active") {
      return true;
    }

    if (billingInfo?.trial_ends_at) {
      const trialEndsAt = new Date(billingInfo.trial_ends_at);
      const now = new Date();
      if (trialEndsAt > now) {
        return true;
      }
    }

    return false;
  };

  const isCancelledButActive = () => {
    if (subscription?.cancel_at_period_end && subscription?.subscription_status === "active") {
      return true;
    }
    if (billingInfo?.subscription_ends_at && billingInfo?.subscription_plan === "pro" && billingInfo?.subscription_status === "active") {
      return true;
    }
    return false;
  };

  const cancelDate = () => {
    if (subscription?.cancel_at_period_end && subscription?.current_period_end) {
      return new Date(subscription.current_period_end * 1000);
    }
    if (billingInfo?.subscription_ends_at) {
      return new Date(billingInfo.subscription_ends_at);
    }
    return null;
  };

  return {
    subscription,
    billingInfo,
    loading,
    getSubscriptionPlan,
    isActive,
    isPro: hasProAccess(),
    isPremium: hasProAccess(),
    hasProAccess: hasProAccess(),
    isCancelledButActive: isCancelledButActive(),
    cancelDate: cancelDate(),
  };
}
