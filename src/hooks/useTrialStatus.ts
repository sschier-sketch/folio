import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface TrialStatus {
  hasActiveTrial: boolean;
  trialStartedAt: Date | null;
  trialEndsAt: Date | null;
  daysRemaining: number;
  isTrialExpired: boolean;
  isLoading: boolean;
}

export function useTrialStatus(userId: string | undefined): TrialStatus {
  const [status, setStatus] = useState<TrialStatus>({
    hasActiveTrial: false,
    trialStartedAt: null,
    trialEndsAt: null,
    daysRemaining: 0,
    isTrialExpired: false,
    isLoading: true,
  });

  useEffect(() => {
    if (!userId) {
      setStatus({
        hasActiveTrial: false,
        trialStartedAt: null,
        trialEndsAt: null,
        daysRemaining: 0,
        isTrialExpired: false,
        isLoading: false,
      });
      return;
    }

    async function fetchTrialStatus() {
      try {
        const { data, error } = await supabase
          .from('billing_info')
          .select('trial_started_at, trial_ends_at, subscription_plan')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          setStatus({
            hasActiveTrial: false,
            trialStartedAt: null,
            trialEndsAt: null,
            daysRemaining: 0,
            isTrialExpired: false,
            isLoading: false,
          });
          return;
        }

        const trialStartedAt = data.trial_started_at
          ? new Date(data.trial_started_at)
          : null;
        const trialEndsAt = data.trial_ends_at
          ? new Date(data.trial_ends_at)
          : null;
        const now = new Date();

        const hasActiveTrial =
          trialEndsAt !== null && trialEndsAt > now && data.subscription_plan !== 'pro';

        const isTrialExpired =
          trialEndsAt !== null && trialEndsAt <= now && data.subscription_plan !== 'pro';

        const daysRemaining = trialEndsAt
          ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
          : 0;

        setStatus({
          hasActiveTrial,
          trialStartedAt,
          trialEndsAt,
          daysRemaining,
          isTrialExpired,
          isLoading: false,
        });
      } catch (error) {
        console.error('Error fetching trial status:', error);
        setStatus({
          hasActiveTrial: false,
          trialStartedAt: null,
          trialEndsAt: null,
          daysRemaining: 0,
          isTrialExpired: false,
          isLoading: false,
        });
      }
    }

    fetchTrialStatus();

    const channel = supabase
      .channel('billing_info_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'billing_info',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchTrialStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return status;
}
