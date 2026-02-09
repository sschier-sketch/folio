import { useState, useEffect } from 'react';
import { Check, CreditCard, Info, Loader2, AlertTriangle, Lock } from 'lucide-react';
import { useSubscription } from '../../hooks/useSubscription';
import { useTrialStatus } from '../../hooks/useTrialStatus';
import { useAuth } from '../../hooks/useAuth';
import { PLANS, type BillingInterval, getPlanByStripePriceId, getStripePriceId, calculateYearlySavings } from '../../config/plans';
import { createCheckoutSession, createPortalSession } from '../../lib/stripe-api';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';

interface SubscriptionPlansProps {
  showCurrentPlanCard?: boolean;
}

export function SubscriptionPlans({ showCurrentPlanCard = true }: SubscriptionPlansProps) {
  const { user } = useAuth();
  const { subscription, loading: subscriptionLoading, isPro, isCancelledButActive, cancelDate } = useSubscription();
  const trialStatus = useTrialStatus(user?.id);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('year');
  const [loading, setLoading] = useState<string | null>(null);
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [billingTrialTexts, setBillingTrialTexts] = useState({
    activeTitle: 'Gratis-Testphase aktiv',
    activeDescription: 'Sie haben vollen Zugriff auf alle Pro-Features bis zum {date}. Upgraden Sie jetzt, um alle Funktionen nach Ende der Testphase weiter zu nutzen.',
    activeFeatures: ['Unbegrenzte Objekte und Mieter', 'Ticketsystem und Mieterkommunikation', 'Finanzanalysen und Renditeberechnung'],
    expiredTitle: 'Gratis-Testphase beendet',
    expiredDescription: 'Ihre Gratis-Testphase ist am {date} abgelaufen. Upgrade auf Pro, um alle Funktionen weiter zu nutzen.',
  });
  const [upgradePrompt, setUpgradePrompt] = useState({
    title: 'Schalten Sie Ihr volles Potenzial frei!',
    description: 'Sie nutzen derzeit den Basic-Tarif. Upgraden Sie auf Pro und erhalten Sie Zugriff auf alle Premium-Features für eine professionelle Immobilienverwaltung.',
    features: ['Unbegrenzte Objekte & Mieter', 'Erweiterte Finanzen', 'Dokumente & Vorlagen', 'Alle Pro-Features'],
  });
  const [proPlanTexts, setProPlanTexts] = useState({
    description: PLANS.pro.description,
    features: PLANS.pro.features.map(f => f.text),
  });

  useEffect(() => {
    async function loadProTexts() {
      const { data } = await supabase
        .from('pro_feature_texts')
        .select('feature_key, title, description, features')
        .in('feature_key', ['billing_trial_active', 'billing_trial_expired', 'billing_upgrade_prompt', 'billing_pro_plan'])
        .eq('is_active', true);

      if (data && data.length > 0) {
        const active = data.find(d => d.feature_key === 'billing_trial_active');
        const expired = data.find(d => d.feature_key === 'billing_trial_expired');
        const upgrade = data.find(d => d.feature_key === 'billing_upgrade_prompt');
        const proPlan = data.find(d => d.feature_key === 'billing_pro_plan');
        setBillingTrialTexts(prev => ({
          activeTitle: active?.title || prev.activeTitle,
          activeDescription: active?.description || prev.activeDescription,
          activeFeatures: active?.features?.length ? active.features : prev.activeFeatures,
          expiredTitle: expired?.title || prev.expiredTitle,
          expiredDescription: expired?.description || prev.expiredDescription,
        }));
        if (upgrade) {
          setUpgradePrompt(prev => ({
            title: upgrade.title || prev.title,
            description: upgrade.description || prev.description,
            features: upgrade.features?.length ? upgrade.features : prev.features,
          }));
        }
        if (proPlan) {
          setProPlanTexts(prev => ({
            description: proPlan.description || prev.description,
            features: proPlan.features?.length ? proPlan.features : prev.features,
          }));
        }
      }
    }
    loadProTexts();
  }, []);

  const isActive = subscription?.subscription_status === 'active';
  const currentPlan = (subscription?.price_id && isActive) ? getPlanByStripePriceId(subscription.price_id) : null;
  const currentPlanId = currentPlan?.planId || 'basic';
  const currentInterval = currentPlan?.interval || 'month';

  const handleUpgrade = async (interval: BillingInterval) => {
    const priceId = getStripePriceId('pro', interval);
    if (!priceId) return;

    setLoading(priceId);
    try {
      const url = await createCheckoutSession({ priceId });
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('Fehler beim Erstellen der Checkout-Session. Bitte versuchen Sie es erneut.');
      setLoading(null);
    }
  };

  const handleDowngrade = async () => {
    setLoading('downgrade');
    setShowDowngradeModal(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancel-subscription`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel subscription');
      }

      const result = await response.json();
      if (result.currentPeriodEnd) {
        const endDate = new Date(result.currentPeriodEnd * 1000).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
        alert(`Ihr Abonnement wurde gekündigt. Sie haben noch bis zum ${endDate} Zugriff auf alle Pro-Features.`);
      } else {
        alert('Ihr Abonnement wurde erfolgreich gekündigt.');
      }
      window.location.reload();
    } catch (error) {
      console.error('Error downgrading:', error);
      alert('Fehler beim Downgrade. Bitte versuchen Sie es erneut.');
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setLoading('portal');
    try {
      const url = await createPortalSession();
      window.location.href = url;
    } catch (error) {
      console.error('Error opening portal:', error);
      alert('Fehler beim Öffnen des Kundenportals. Bitte versuchen Sie es erneut.');
      setLoading(null);
    }
  };

  const handleChangeBillingInterval = async (newInterval: BillingInterval) => {
    if (currentPlanId !== 'pro') return;

    const newPriceId = getStripePriceId('pro', newInterval);
    if (!newPriceId) return;

    setLoading(newPriceId);
    try {
      const url = await createCheckoutSession({ priceId: newPriceId });
      window.location.href = url;
    } catch (error) {
      console.error('Error changing billing interval:', error);
      alert('Fehler beim Wechseln des Abrechnungszeitraums. Bitte versuchen Sie es erneut.');
      setLoading(null);
    }
  };

  if (subscriptionLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const yearlySavings = calculateYearlySavings();

  const formatPrice = (price: number): string => {
    return price.toFixed(2).replace('.', ',');
  };

  return (
    <div>
      {showCurrentPlanCard && (
        <>
          <div className="bg-white rounded-lg border-2 border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <CreditCard className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-500">Aktueller Tarif</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {PLANS[currentPlanId].name}
                </h2>
                <p className="text-gray-600 mt-1">
                  {currentPlanId === 'pro' && currentInterval === 'year' ? 'Jährliche Abrechnung' :
                   currentPlanId === 'pro' ? 'Monatliche Abrechnung' : ''}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">
                  {currentPlanId === 'basic' ? (
                    <>
                      0,00 {PLANS[currentPlanId].currencySymbol}
                    </>
                  ) : currentInterval === 'year' ? (
                    <>
                      {formatPrice((PLANS[currentPlanId].priceYearly || 0) / 12)} {PLANS[currentPlanId].currencySymbol}
                      <span className="text-lg text-gray-500 font-normal">/Monat</span>
                    </>
                  ) : (
                    <>
                      {formatPrice(PLANS[currentPlanId].priceMonthly)} {PLANS[currentPlanId].currencySymbol}
                      <span className="text-lg text-gray-500 font-normal">/Monat</span>
                    </>
                  )}
                </div>
                {currentPlanId === 'pro' && currentInterval === 'year' && (
                  <p className="text-sm text-green-600 mt-1">
                    Jährlich: {formatPrice(PLANS.pro.priceYearly || 0)} {PLANS.pro.currencySymbol}
                  </p>
                )}
              </div>
            </div>

            {isActive && currentPlanId === 'pro' && !isCancelledButActive && (
              <Button
                onClick={handleManageSubscription}
                disabled={loading === 'portal'}
                variant="secondary"
                fullWidth
              >
                {loading === 'portal' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Wird geladen...
                  </>
                ) : (
                  'Abo verwalten'
                )}
              </Button>
            )}
          </div>

          {isCancelledButActive && cancelDate && (
            <div className="bg-amber-50 rounded-xl p-5 mb-8 flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-amber-900 mb-1">Abo gekündigt</h3>
                <p className="text-sm text-amber-800">
                  Ihr Pro-Abonnement wurde gekündigt. Sie haben noch bis zum{' '}
                  <strong>{cancelDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</strong>{' '}
                  vollen Zugriff auf alle Pro-Features. Danach wechseln Sie automatisch in den Basic-Tarif.
                </p>
                <Button
                  onClick={handleManageSubscription}
                  disabled={loading === 'portal'}
                  variant="warning"
                >
                  {loading === 'portal' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Wird geladen...
                    </>
                  ) : (
                    'Kündigung widerrufen'
                  )}
                </Button>
              </div>
            </div>
          )}

          {subscription?.subscription_status && !isActive && currentPlanId === 'pro' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8 flex items-start gap-3">
              <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-800">
                  <strong>Zahlung ausstehend:</strong> Ihr Abonnement ist momentan nicht aktiv.
                  Bitte überprüfen Sie Ihre Zahlungsinformationen.
                </p>
                <button
                  onClick={handleManageSubscription}
                  className="mt-2 text-sm text-yellow-900 underline hover:no-underline"
                >
                  Zahlungsmethode aktualisieren
                </button>
              </div>
            </div>
          )}

          {currentPlanId === 'basic' && trialStatus.hasActiveTrial && (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-6 mb-8">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-emerald-900">{billingTrialTexts.activeTitle}</h3>
                <span className="px-2 py-0.5 bg-emerald-200 rounded-full text-xs font-semibold text-emerald-800">
                  {trialStatus.daysRemaining} {trialStatus.daysRemaining === 1 ? 'Tag' : 'Tage'} verbleibend
                </span>
              </div>
              <p className="text-emerald-800 text-sm mb-3">
                {billingTrialTexts.activeDescription.replace('{date}', trialStatus.trialEndsAt?.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) || '')}
              </p>
              <div className="flex flex-col gap-2 text-sm text-emerald-700">
                {billingTrialTexts.activeFeatures.map((feat, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentPlanId === 'basic' && trialStatus.isTrialExpired && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-bold text-amber-900 mb-1">{billingTrialTexts.expiredTitle}</h3>
              <p className="text-amber-800 text-sm">
                {billingTrialTexts.expiredDescription.replace('{date}', trialStatus.trialEndsAt?.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) || '')}
              </p>
            </div>
          )}

          {currentPlanId === 'basic' && !trialStatus.hasActiveTrial && !trialStatus.isTrialExpired && (
            <div className="rounded-lg p-8 text-center mb-8" style={{ backgroundColor: '#eff4fe' }}>
              <div className="inline-flex w-16 h-16 bg-primary-blue rounded-full items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-dark mb-2">{upgradePrompt.title}</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">{upgradePrompt.description}</p>
              <div className="bg-white rounded-lg p-6 mb-6 max-w-md mx-auto">
                <h4 className="font-semibold text-dark mb-4 text-center">
                  Das erwartet Sie im Pro-Plan
                </h4>
                <ul className="text-left space-y-3 text-sm text-gray-700">
                  {upgradePrompt.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-gray-700 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </>
      )}

      {currentPlanId === 'pro' && (
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900">Verfügbare Tarife</h3>
        </div>
      )}

      <div className={`mb-8 ${currentPlanId === 'pro' ? 'grid grid-cols-1 md:grid-cols-2 gap-8' : ''}`}>
        {currentPlanId === 'pro' && (
          <div className="bg-white rounded-lg border-2 border-gray-200 p-8 hover:shadow-lg transition-all relative">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {PLANS.basic.name}
              </h3>
              <p className="text-gray-600">{PLANS.basic.description}</p>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-gray-900">
                  {formatPrice(PLANS.basic.priceMonthly)} {PLANS.basic.currencySymbol}
                </span>
                <span className="text-gray-500">/Monat</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {PLANS.basic.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{feature.text}</span>
                </li>
              ))}
            </ul>

            {isCancelledButActive ? (
              <button
                disabled
                className="w-full py-3 bg-gray-100 text-gray-500 rounded-lg font-semibold cursor-not-allowed"
              >
                Wechsel zum {cancelDate?.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })} vorgemerkt
              </button>
            ) : (
              <Button
                onClick={() => setShowDowngradeModal(true)}
                disabled={!!loading}
                variant="secondary"
                fullWidth
              >
                Zu Basic wechseln
              </Button>
            )}
          </div>
        )}

        {currentPlanId === 'basic' && (
          <div id="pro-plan-card" className="bg-white rounded-lg border-2 border-blue-500 p-8 hover:shadow-lg transition-all relative text-center">
            {PLANS.pro.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="inline-block px-4 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full whitespace-nowrap">
                  Ein Tarif mit allen Funktionen
                </span>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {PLANS.pro.name}
              </h3>
              <p className="text-gray-600">{proPlanTexts.description}</p>
            </div>

            <div className="mb-6">
              <div className="inline-flex items-center gap-2 bg-gray-100 rounded-lg p-1 mb-4">
                <button
                  onClick={() => setBillingInterval('month')}
                  className={`py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    billingInterval === 'month'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Monatlich
                </button>
                <button
                  onClick={() => setBillingInterval('year')}
                  className={`py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    billingInterval === 'year'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Jährlich
                  <span className="ml-1 text-xs text-green-600 font-semibold">
                    -{yearlySavings}%
                  </span>
                </button>
              </div>

              <div className="flex items-baseline gap-1 justify-center">
                <span className="text-4xl font-bold text-gray-900">
                  {billingInterval === 'month'
                    ? formatPrice(PLANS.pro.priceMonthly)
                    : formatPrice((PLANS.pro.priceYearly || 0) / 12)} {PLANS.pro.currencySymbol}
                </span>
                <span className="text-gray-500">/Monat</span>
              </div>
              {billingInterval === 'year' && (
                <p className="text-sm text-gray-500 mt-1">
                  Jährlich: {formatPrice(PLANS.pro.priceYearly || 0)} {PLANS.pro.currencySymbol}
                </p>
              )}
            </div>

            <ul className="space-y-3 mb-8 inline-block text-left">
              {proPlanTexts.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-gray-700 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <div>
              <Button
                onClick={() => handleUpgrade(billingInterval)}
                disabled={!!loading}
                variant="primary"
              >
                {loading === getStripePriceId('pro', billingInterval) ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Wird geladen...
                  </>
                ) : (
                  'Kostenpflichtig buchen'
                )}
              </Button>
            </div>
          </div>
        )}

        {currentPlanId === 'pro' && (
          <div className="bg-white rounded-lg border-2 border-blue-500 p-8 hover:shadow-lg transition-all relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="inline-block px-4 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full">
                Aktuell
              </span>
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {PLANS.pro.name}
              </h3>
              <p className="text-gray-600">{PLANS.pro.description}</p>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-center gap-2 bg-gray-100 rounded-lg p-1 mb-4">
                <button
                  onClick={() => setBillingInterval('month')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    billingInterval === 'month'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Monatlich
                </button>
                <button
                  onClick={() => setBillingInterval('year')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    billingInterval === 'year'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Jährlich
                  <span className="ml-1 text-xs text-green-600 font-semibold">
                    -{yearlySavings}%
                  </span>
                </button>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-gray-900">
                  {billingInterval === 'month'
                    ? formatPrice(PLANS.pro.priceMonthly)
                    : formatPrice((PLANS.pro.priceYearly || 0) / 12)} {PLANS.pro.currencySymbol}
                </span>
                <span className="text-gray-500">/Monat</span>
              </div>
              {billingInterval === 'year' && (
                <p className="text-sm text-gray-500 mt-1">
                  Jährlich: {formatPrice(PLANS.pro.priceYearly || 0)} {PLANS.pro.currencySymbol}
                </p>
              )}
            </div>

            <ul className="space-y-3 mb-8">
              {PLANS.pro.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{feature.text}</span>
                </li>
              ))}
            </ul>

            {currentInterval !== billingInterval && (
              <Button
                onClick={() => handleChangeBillingInterval(billingInterval)}
                disabled={!!loading}
                variant="primary"
                fullWidth
              >
                {loading === getStripePriceId('pro', billingInterval) ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Wird geladen...
                  </>
                ) : (
                  <>
                    Auf {billingInterval === 'month' ? 'monatlich' : 'jährlich'} wechseln
                  </>
                )}
              </Button>
            )}

            {currentInterval === billingInterval && (
              <button
                disabled
                className="w-full py-3 bg-gray-100 text-gray-500 rounded-lg font-semibold cursor-not-allowed"
              >
                Ihr aktueller Plan
              </button>
            )}
          </div>
        )}
      </div>

      <div className="bg-gray-100 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <strong>Jederzeit kündbar:</strong> Sie können Ihr Abonnement jederzeit über das Kundenportal kündigen.
            </p>
            <p>
              <strong>Sichere Zahlung:</strong> Alle Zahlungen werden sicher über Stripe verarbeitet.
            </p>
            <p>
              <strong>Flexible Abrechnung:</strong> Wechseln Sie jederzeit zwischen monatlicher und jährlicher Abrechnung.
            </p>
            <p>
              <strong>Werbungskosten absetzen:</strong> Die Kosten für Verwaltungssoftware können in der Regel als Werbungskosten bei den Einkünften aus Vermietung und Verpachtung steuerlich abgesetzt werden.
            </p>
          </div>
        </div>
      </div>

      {showDowngradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Auf Basic downgraden?
            </h3>
            <p className="text-gray-600 mb-6">
              Sind Sie sicher, dass Sie zu Basic wechseln möchten? Sie verlieren den Zugriff auf alle Pro-Features.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowDowngradeModal(false)}
                variant="cancel"
                fullWidth
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleDowngrade}
                disabled={!!loading}
                variant="danger"
                fullWidth
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Wird geladen...
                  </>
                ) : (
                  'Ja, downgraden'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
