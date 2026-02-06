import { useState, useEffect } from 'react';
import { useTrialStatus } from '../hooks/useTrialStatus';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { supabase } from '../lib/supabase';

interface TrialBannerProps {
  onUpgradeClick?: () => void;
}

interface TrialTexts {
  activeTitle: string;
  activeDescription: string;
  expiredTitle: string;
  expiredDescription: string;
  buttonText: string;
}

const defaultTexts: TrialTexts = {
  activeTitle: 'Gratis-Testphase aktiv',
  activeDescription: 'Sie haben vollen Zugriff auf alle Pro-Features bis zum {date}. Upgraden Sie jetzt, um alle Funktionen dauerhaft zu nutzen.',
  expiredTitle: 'Gratis-Testphase beendet',
  expiredDescription: 'Ihre Gratis-Testphase ist abgelaufen. Upgrade auf Pro, um alle Funktionen weiter zu nutzen.',
  buttonText: 'Jetzt auf Pro upgraden',
};

export default function TrialBanner({ onUpgradeClick }: TrialBannerProps) {
  const { user } = useAuth();
  const { billingInfo } = useSubscription();
  const trialStatus = useTrialStatus(user?.id);
  const [texts, setTexts] = useState<TrialTexts>(defaultTexts);

  useEffect(() => {
    async function loadTexts() {
      const { data } = await supabase
        .from('pro_feature_texts')
        .select('feature_key, title, description, features')
        .in('feature_key', ['trial_banner_active', 'trial_banner_expired']);

      if (data && data.length > 0) {
        const active = data.find(d => d.feature_key === 'trial_banner_active');
        const expired = data.find(d => d.feature_key === 'trial_banner_expired');
        setTexts({
          activeTitle: active?.title || defaultTexts.activeTitle,
          activeDescription: active?.description || defaultTexts.activeDescription,
          expiredTitle: expired?.title || defaultTexts.expiredTitle,
          expiredDescription: expired?.description || defaultTexts.expiredDescription,
          buttonText: active?.features?.[0] || defaultTexts.buttonText,
        });
      }
    }
    loadTexts();
  }, []);

  if (!user || trialStatus.isLoading) {
    return null;
  }

  if (billingInfo?.subscription_plan === 'pro' && billingInfo?.subscription_status === 'active') {
    return null;
  }

  const formattedDate = trialStatus.trialEndsAt?.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  if (trialStatus.hasActiveTrial) {
    return (
      <div style={{ backgroundColor: '#EEF4FF' }} className="rounded-lg p-6 shadow-sm mb-6">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900">{texts.activeTitle}</h3>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
              {trialStatus.daysRemaining} {trialStatus.daysRemaining === 1 ? 'Tag' : 'Tage'} verbleibend
            </span>
          </div>
          <p className="text-sm text-gray-600">
            {texts.activeDescription.replace('{date}', formattedDate || '')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onUpgradeClick?.()}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors text-sm font-semibold"
          >
            {texts.buttonText}
          </button>
        </div>
      </div>
    );
  }

  if (trialStatus.isTrialExpired) {
    return (
      <div className="bg-amber-500 text-white px-6 py-4 rounded-lg shadow-lg mb-6">
        <div>
          <h3 className="text-lg font-bold mb-1">{texts.expiredTitle}</h3>
          <p className="text-white/90 text-sm mb-3">
            {texts.expiredDescription}
          </p>
          <button
            onClick={() => onUpgradeClick?.()}
            className="px-5 py-2.5 bg-white text-amber-600 rounded-full font-semibold hover:bg-white/90 transition-colors text-sm"
          >
            {texts.buttonText}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
