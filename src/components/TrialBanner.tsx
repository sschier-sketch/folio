import { Sparkles, Clock, ArrowRight, X } from 'lucide-react';
import { useState } from 'react';
import { useTrialStatus } from '../hooks/useTrialStatus';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';

interface TrialBannerProps {
  onUpgradeClick?: () => void;
}

export default function TrialBanner({ onUpgradeClick }: TrialBannerProps) {
  const { user } = useAuth();
  const { billingInfo } = useSubscription();
  const trialStatus = useTrialStatus(user?.id);
  const [isDismissed, setIsDismissed] = useState(false);

  if (!user || trialStatus.isLoading || isDismissed) {
    return null;
  }

  if (billingInfo?.subscription_plan === 'pro' && billingInfo?.subscription_status === 'active') {
    return null;
  }

  if (trialStatus.hasActiveTrial) {
    return (
      <div style={{ backgroundColor: '#EEF4FF' }} className="rounded-lg p-6 shadow-sm mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EEF4FF', border: '1px solid #DDE7FF' }}>
              <Sparkles className="w-5 h-5" style={{ color: '#1E1E24' }} strokeWidth={1.5} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900">Gratis-Testphase aktiv</h3>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                  {trialStatus.daysRemaining} {trialStatus.daysRemaining === 1 ? 'Tag' : 'Tage'} verbleibend
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Sie haben vollen Zugriff auf alle Pro-Features bis zum{' '}
                {trialStatus.trialEndsAt?.toLocaleDateString('de-DE', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
                . Upgraden Sie jetzt, um alle Funktionen dauerhaft zu nutzen.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsDismissed(true)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Banner schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onUpgradeClick?.()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Jetzt auf Pro upgraden
          </button>
        </div>
      </div>
    );
  }

  if (trialStatus.isTrialExpired) {
    return (
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 py-4 rounded-lg shadow-lg mb-6 relative overflow-hidden">
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded transition-colors"
          aria-label="Banner schließen"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-bold mb-1">Gratis-Testphase beendet</h3>

            <p className="text-white/90 text-sm mb-3">
              Ihre Gratis-Testphase ist abgelaufen. Upgrade auf Pro, um alle Funktionen weiter zu nutzen.
            </p>

            <button
              onClick={() => onUpgradeClick?.()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-amber-600 rounded-lg font-semibold hover:bg-white/90 transition-colors text-sm"
            >
              Jetzt auf Pro upgraden
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
